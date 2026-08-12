import { useState, useEffect, useCallback } from 'react';
import { supabase, PERANGKAT_DAERAH_ID } from '../lib/supabase';

function getLocalOverrides(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveLocalOverride(key, id, data) {
  try {
    const current = getLocalOverrides(key);
    current[String(id)] = { ...(current[String(id)] || {}), ...data };
    localStorage.setItem(key, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save local override:', e);
  }
}

// Hook for Perencanaan (Renstra Tujuan & Sasaran) directly from Supabase DB
export function usePerencanaan() {
  const [perencanaan, setPerencanaan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPerencanaan = useCallback(async () => {
    try {
      setLoading(true);
      const { data: tujuanData, error: tujuanErr } = await supabase
        .from('renstra_tujuan')
        .select(`
          id,
          deskripsi_tujuan,
          created_at,
          perangkat_daerah_id,
          renstra_sasaran (
            id,
            deskripsi_sasaran,
            periode_awal,
            periode_akhir,
            renstra_indikator_sasaran (
              id,
              deskripsi_indikator,
              satuan,
              target_tahun_1
            )
          ),
          renstra_indikator (
            id,
            deskripsi_indikator,
            satuan,
            target_tahun_1
          )
        `)
        .order('created_at', { ascending: true });

      if (tujuanErr) throw tujuanErr;

      if (tujuanData && tujuanData.length > 0) {
        const formatted = tujuanData.map((t, idx) => {
          const primarySasaran = t.renstra_sasaran?.[0] || {};
          const indikators = primarySasaran.renstra_indikator_sasaran || t.renstra_indikator || [];
          return {
            id: t.id,
            tujuanId: t.id,
            kode: `0${idx + 1}`,
            nama: t.deskripsi_tujuan,
            deskripsi: primarySasaran.deskripsi_sasaran || t.deskripsi_tujuan,
            tahun: primarySasaran.periode_awal || 2025,
            bidang: 'Sekretariat',
            tujuan: t.deskripsi_tujuan,
            sasaran: primarySasaran.deskripsi_sasaran || t.deskripsi_tujuan,
            indikator: indikators[0]?.deskripsi_indikator || 'SAKIP',
            target: indikators[0]?.target_tahun_1 || '83',
            penanggungJawab: 'Dinas Kesehatan Kab. Garut',
            anggaranPagu: 114298200 + (idx * 500000000),
            status: idx === 0 ? 'Dalam Proses' : 'Tercapai',
            raw: t,
          };
        });
        setPerencanaan(formatted);
      } else {
        setPerencanaan([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching renstra_tujuan from Supabase DB:', err.message);
      setPerencanaan([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerencanaan();
  }, [fetchPerencanaan]);

  const addTujuan = async (newTujuan) => {
    const { data, error } = await supabase
      .from('renstra_tujuan')
      .insert([{
        deskripsi_tujuan: newTujuan.nama,
        perangkat_daerah_id: PERANGKAT_DAERAH_ID
      }])
      .select();

    if (error) throw new Error('Gagal menambah Perencanaan di Database: ' + error.message);
    await fetchPerencanaan();
    return data;
  };

  const updateTujuan = async (id, updated) => {
    const { error } = await supabase
      .from('renstra_tujuan')
      .update({ deskripsi_tujuan: updated.nama })
      .eq('id', id);

    if (error) throw new Error('Gagal memperbarui Perencanaan di Database: ' + error.message);
    await fetchPerencanaan();
  };

  const deleteTujuan = async (id) => {
    const { data: sasData } = await supabase.from('renstra_sasaran').select('id').eq('tujuan_id', id);
    if (sasData && sasData.length > 0) {
      const sasIds = sasData.map(s => s.id);
      const { data: prgData } = await supabase.from('renstra_program').select('id').in('sasaran_id', sasIds);
      if (prgData && prgData.length > 0) {
        const prgIds = prgData.map(p => p.id);
        const { data: kegData } = await supabase.from('renstra_kegiatan').select('id').in('program_id', prgIds);
        if (kegData && kegData.length > 0) {
          const kegIds = kegData.map(k => k.id);
          await supabase.from('renstra_sub_kegiatan').delete().in('kegiatan_id', kegIds);
        }
        await supabase.from('renstra_kegiatan').delete().in('program_id', prgIds);
        await supabase.from('renstra_program').delete().in('sasaran_id', sasIds);
      }
      await supabase.from('renstra_sasaran').delete().eq('tujuan_id', id);
    }

    const { error } = await supabase
      .from('renstra_tujuan')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Gagal menghapus Perencanaan dari Database: ' + error.message);
    await fetchPerencanaan();
  };

  return { perencanaan, loading, error, refetch: fetchPerencanaan, addTujuan, updateTujuan, deleteTujuan };
}

// Hook for Programs (Renstra Program) directly from Supabase DB
export function usePrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('renstra_program')
        .select(`
          id,
          sasaran_id,
          deskripsi_program,
          anggaran_tahun_1,
          sumber_anggaran,
          created_at,
          renstra_sasaran (
            deskripsi_sasaran
          )
        `)
        .order('created_at', { ascending: true });

      if (err) throw err;

      if (data && data.length > 0) {
        const overrides = getLocalOverrides('sipk_prog_overrides');
        const formatted = data.map((p, idx) => {
          const ov = overrides[String(p.id)] || {};
          return {
            id: p.id,
            perencanaanId: p.sasaran_id || 1,
            kode: ov.kode || `01.2.0${idx + 1}`,
            nama: ov.nama || p.deskripsi_program,
            deskripsi: ov.deskripsi || p.renstra_sasaran?.deskripsi_sasaran || p.deskripsi_program,
            sasaran: ov.sasaran || p.renstra_sasaran?.deskripsi_sasaran || 'Meningkatnya Penunjang Urusan Pemerintah Daerah',
            indikator: ov.indikator || 'SAKIP',
            target: ov.target || '83',
            sasaranId: p.sasaran_id,
            bidang: ov.bidang || 'Bidang Kesehatan Masyarakat (Kesmas)',
            capaian: ov.capaian !== undefined ? ov.capaian : 96,
            anggaranPagu: p.anggaran_tahun_1 || 114298200,
            status: ov.status || 'Dalam Proses',
            tahun: 2025,
            raw: p,
            ...ov,
          };
        });
        setPrograms(formatted);
      } else {
        setPrograms([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching renstra_program from Supabase DB:', err.message);
      setPrograms([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  async function ensureDefaultSasaranId() {
    try {
      const { data: sasData } = await supabase.from('renstra_sasaran').select('id').limit(1);
      if (sasData && sasData.length > 0 && sasData[0].id) {
        return sasData[0].id;
      }

      let tujId = null;
      const { data: tujData } = await supabase.from('renstra_tujuan').select('id').limit(1);
      if (tujData && tujData.length > 0 && tujData[0].id) {
        tujId = tujData[0].id;
      } else {
        const { data: newTuj } = await supabase
          .from('renstra_tujuan')
          .insert([{
            deskripsi_tujuan: 'Tujuan Pembangunan Kesehatan Garut',
            perangkat_daerah_id: PERANGKAT_DAERAH_ID
          }])
          .select('id');
        tujId = newTuj?.[0]?.id;
      }

      if (tujId) {
        const { data: newSas } = await supabase
          .from('renstra_sasaran')
          .insert([{
            tujuan_id: tujId,
            deskripsi_sasaran: 'Sasaran Utama Program Kesehatan',
            periode_awal: 2025,
            periode_akhir: 2030
          }])
          .select('id');
        return newSas?.[0]?.id || null;
      }
    } catch (err) {
      console.warn('Could not auto-create default sasaran_id:', err.message);
    }
    return null;
  }

  const addProgram = async (newProgram) => {
    let sasId = newProgram.perencanaanId || newProgram.sasaranId;
    if (!sasId || typeof sasId !== 'string' || sasId.length !== 36 || !sasId.includes('-')) {
      sasId = await ensureDefaultSasaranId();
    }

    const payload = {
      deskripsi_program: newProgram.nama,
      sumber_anggaran: 'APBD',
      anggaran_tahun_1: newProgram.anggaranPagu || 0,
    };

    if (sasId) {
      payload.sasaran_id = sasId;
    }

    const { data, error } = await supabase
      .from('renstra_program')
      .insert([payload])
      .select();

    if (error) throw new Error('Gagal menambah Program di Database: ' + error.message);
    const newId = data?.[0]?.id || Date.now();
    saveLocalOverride('sipk_prog_overrides', newId, newProgram);

    await fetchPrograms();
    return data;
  };

  const updateProgram = async (id, updated) => {
    const payload = {
      deskripsi_program: updated.nama,
      anggaran_tahun_1: updated.anggaranPagu || 0,
    };

    const targetSasId = updated.perencanaanId || updated.sasaranId;
    if (targetSasId && typeof targetSasId === 'string' && targetSasId.length === 36 && targetSasId.includes('-')) {
      payload.sasaran_id = targetSasId;
    }

    const { error } = await supabase
      .from('renstra_program')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.warn('Supabase updateProgram notice:', error.message);
    }
    saveLocalOverride('sipk_prog_overrides', id, updated);
    setPrograms(prev => prev.map(p => String(p.id) === String(id) ? { ...p, ...updated } : p));
  };

  const deleteProgram = async (id) => {
    const { data: childKeg } = await supabase.from('renstra_kegiatan').select('id').eq('program_id', id);
    if (childKeg && childKeg.length > 0) {
      const kegIds = childKeg.map(k => k.id);
      await supabase.from('renstra_sub_kegiatan').delete().in('kegiatan_id', kegIds);
      await supabase.from('renstra_kegiatan').delete().eq('program_id', id);
    }

    const { error } = await supabase
      .from('renstra_program')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Gagal menghapus Program dari Database: ' + error.message);
    await fetchPrograms();
  };

  return { programs, loading, error, refetch: fetchPrograms, addProgram, updateProgram, deleteProgram };
}

// Hook for Kegiatan (Renstra Kegiatan) directly from Supabase DB
export function useKegiatan() {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKegiatan = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('renstra_kegiatan')
        .select(`
          id,
          program_id,
          deskripsi_kegiatan,
          anggaran_tahun_1,
          created_at,
          renstra_program (
            deskripsi_program
          )
        `)
        .order('created_at', { ascending: true });

      if (err) throw err;

      if (data && data.length > 0) {
        const overrides = getLocalOverrides('sipk_keg_overrides');
        const formatted = data.map((k, idx) => {
          const ov = overrides[String(k.id)] || {};
          return {
            id: k.id,
            kode: ov.kode || `01.2.01.000${idx + 1}`,
            nama: ov.nama || k.deskripsi_kegiatan,
            programId: ov.programId || k.program_id || 1,
            programNama: k.renstra_program?.deskripsi_program || 'PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH',
            sasaran: ov.sasaran || 'Terpenuhinya Perencanaan, Penganggaran, dan Evaluasi Kinerja',
            indikator: ov.indikator || 'Jumlah Dokumen Perencanaan',
            target: ov.target || '1 Dokumen',
            bidang: ov.bidang || 'Seksi Kesehatan Keluarga dan Gizi',
            anggaran: k.anggaran_tahun_1 || 114298200,
            status: ov.status || 'Dalam Proses',
            tahun: 2025,
            raw: k,
            ...ov,
          };
        });
        setKegiatan(formatted);
      } else {
        setKegiatan([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching renstra_kegiatan from Supabase DB:', err.message);
      setKegiatan([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKegiatan();
  }, [fetchKegiatan]);

  const addKegiatan = async (newKegiatan) => {
    let progId = newKegiatan.programId;
    if (!progId) {
      const { data: pData } = await supabase.from('renstra_program').select('id').limit(1);
      progId = pData?.[0]?.id;
    }

    const payload = {
      deskripsi_kegiatan: newKegiatan.nama,
      sumber_anggaran: 'APBD',
      anggaran_tahun_1: newKegiatan.anggaran || 0,
    };

    if (progId) {
      payload.program_id = progId;
    }

    const { data, error } = await supabase
      .from('renstra_kegiatan')
      .insert([payload])
      .select();

    if (error) throw new Error('Gagal menambah Kegiatan di Database: ' + error.message);
    const newId = data?.[0]?.id || Date.now();
    saveLocalOverride('sipk_keg_overrides', newId, newKegiatan);

    await fetchKegiatan();
    return data;
  };

  const updateKegiatan = async (id, updated) => {
    const payload = {
      deskripsi_kegiatan: updated.nama,
      anggaran_tahun_1: updated.anggaran || 0,
    };

    if (updated.programId && typeof updated.programId === 'string' && updated.programId.length === 36 && updated.programId.includes('-')) {
      payload.program_id = updated.programId;
    }

    const { error } = await supabase
      .from('renstra_kegiatan')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.warn('Supabase updateKegiatan notice:', error.message);
    }
    saveLocalOverride('sipk_keg_overrides', id, updated);
    setKegiatan(prev => prev.map(k => String(k.id) === String(id) ? { ...k, ...updated } : k));
  };

  const deleteKegiatan = async (id) => {
    await supabase.from('renstra_sub_kegiatan').delete().eq('kegiatan_id', id);

    const { error } = await supabase
      .from('renstra_kegiatan')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Gagal menghapus Kegiatan dari Database: ' + error.message);
    await fetchKegiatan();
  };

  return { kegiatan, loading, error, refetch: fetchKegiatan, addKegiatan, updateKegiatan, deleteKegiatan };
}

// Hook for Sub Kegiatan (Renstra Sub Kegiatan) directly from Supabase DB
export function useSubKegiatan() {
  const [subKegiatan, setSubKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubKegiatan = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('renstra_sub_kegiatan')
        .select(`
          id,
          kegiatan_id,
          deskripsi_sub_kegiatan,
          anggaran_tahun_1,
          created_at,
          renstra_kegiatan (
            deskripsi_kegiatan
          )
        `)
        .order('created_at', { ascending: true });

      if (err) throw err;

      if (data && data.length > 0) {
        const overrides = getLocalOverrides('sipk_sub_overrides');
        const formatted = data.map((sk, idx) => {
          const ov = overrides[String(sk.id)] || {};
          return {
            id: sk.id,
            kode: ov.kode || `01.2.01.0001.000${idx + 1}`,
            nama: ov.nama || sk.deskripsi_sub_kegiatan,
            kegiatanId: ov.kegiatanId || sk.kegiatan_id || 1,
            kegiatanNama: sk.renstra_kegiatan?.deskripsi_kegiatan || 'Perencanaan, Penganggaran, dan Evaluasi Kinerja',
            sasaran: ov.sasaran || 'Tersusunnya Dokumen Rencana Pembangunan',
            indikator: ov.indikator || 'Jumlah Dokumen Perencanaan',
            target: ov.target || '2 Dokumen',
            bidang: ov.bidang || 'Seksi Kesehatan Keluarga dan Gizi',
            anggaran: sk.anggaran_tahun_1 || 22653100,
            status: ov.status || 'Tercapai',
            tahun: 2025,
            raw: sk,
            ...ov,
          };
        });
        setSubKegiatan(formatted);
      } else {
        setSubKegiatan([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching renstra_sub_kegiatan from Supabase DB:', err.message);
      setSubKegiatan([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubKegiatan();
  }, [fetchSubKegiatan]);

  const addSubKegiatan = async (newSub) => {
    let kegId = newSub.kegiatanId;
    if (!kegId) {
      const { data: kData } = await supabase.from('renstra_kegiatan').select('id').limit(1);
      kegId = kData?.[0]?.id;
    }

    const payload = {
      deskripsi_sub_kegiatan: newSub.nama,
      sumber_anggaran: 'APBD',
      anggaran_tahun_1: newSub.anggaran || 0,
    };

    if (kegId) {
      payload.kegiatan_id = kegId;
    }

    const { data, error } = await supabase
      .from('renstra_sub_kegiatan')
      .insert([payload])
      .select();

    if (error) throw new Error('Gagal menambah Sub Kegiatan di Database: ' + error.message);
    const newId = data?.[0]?.id || Date.now();
    saveLocalOverride('sipk_sub_overrides', newId, newSub);

    await fetchSubKegiatan();
    return data;
  };

  const updateSubKegiatan = async (id, updated) => {
    const payload = {
      deskripsi_sub_kegiatan: updated.nama,
      anggaran_tahun_1: updated.anggaran || 0,
    };

    if (updated.kegiatanId && typeof updated.kegiatanId === 'string' && updated.kegiatanId.length === 36 && updated.kegiatanId.includes('-')) {
      payload.kegiatan_id = updated.kegiatanId;
    }

    const { error } = await supabase
      .from('renstra_sub_kegiatan')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.warn('Supabase updateSubKegiatan notice:', error.message);
    }
    saveLocalOverride('sipk_sub_overrides', id, updated);
    setSubKegiatan(prev => prev.map(s => String(s.id) === String(id) ? { ...s, ...updated } : s));
  };

  const deleteSubKegiatan = async (id) => {
    const { error } = await supabase
      .from('renstra_sub_kegiatan')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Gagal menghapus Sub Kegiatan dari Database: ' + error.message);
    await fetchSubKegiatan();
  };

  return { subKegiatan, loading, error, refetch: fetchSubKegiatan, addSubKegiatan, updateSubKegiatan, deleteSubKegiatan };
}

// Hook for Penanggung Jawab directly from Supabase DB
export function usePenanggungJawab() {
  const [penanggungJawab, setPenanggungJawab] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPj() {
      try {
        const { data, error } = await supabase
          .from('penanggung_jawab')
          .select('*')
          .order('nama', { ascending: true });

        if (error) throw error;
        setPenanggungJawab(data || []);
      } catch (err) {
        console.warn('Error fetching penanggung_jawab:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPj();
  }, []);

  return { penanggungJawab, loading };
}
