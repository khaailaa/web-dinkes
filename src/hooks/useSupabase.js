import { useState, useEffect, useCallback } from 'react';
import { supabase, PERANGKAT_DAERAH_ID } from '../lib/supabase';

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
            bidang: 'Kesmas',
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
    // 1. Delete child records in database (sasaran -> program -> kegiatan -> sub_kegiatan)
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

    // 2. Delete main row from renstra_tujuan table in database
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
        const formatted = data.map((p, idx) => {
          return {
            id: p.id,
            perencanaanId: p.sasaran_id || 1,
            kode: `01.2.0${idx + 1}`,
            nama: p.deskripsi_program,
            deskripsi: p.renstra_sasaran?.deskripsi_sasaran || p.deskripsi_program,
            sasaran: p.renstra_sasaran?.deskripsi_sasaran || 'Meningkatnya Penunjang Urusan Pemerintah Daerah',
            indikator: 'SAKIP',
            target: '83',
            sasaranId: p.sasaran_id,
            bidang: 'Kesmas',
            capaian: 96,
            anggaranPagu: p.anggaran_tahun_1 || 114298200,
            status: 'Dalam Proses',
            tahun: 2025,
            raw: p,
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

  const addProgram = async (newProgram) => {
    let sasId = newProgram.perencanaanId || newProgram.sasaranId;
    if (!sasId) {
      const { data: sasData } = await supabase.from('renstra_sasaran').select('id').limit(1);
      sasId = sasData?.[0]?.id || 1;
    }

    const { data, error } = await supabase
      .from('renstra_program')
      .insert([{
        deskripsi_program: newProgram.nama,
        sasaran_id: sasId,
        sumber_anggaran: 'APBD',
        anggaran_tahun_1: newProgram.anggaranPagu || 0,
      }])
      .select();

    if (error) throw new Error('Gagal menambah Program di Database: ' + error.message);
    await fetchPrograms();
    return data;
  };

  const updateProgram = async (id, updated) => {
    const { error } = await supabase
      .from('renstra_program')
      .update({
        deskripsi_program: updated.nama,
        sasaran_id: updated.perencanaanId || updated.sasaranId,
        anggaran_tahun_1: updated.anggaranPagu || 0,
      })
      .eq('id', id);

    if (error) throw new Error('Gagal memperbarui Program di Database: ' + error.message);
    await fetchPrograms();
  };

  const deleteProgram = async (id) => {
    // 1. Delete child kegiatan & sub_kegiatan in database first
    const { data: childKeg } = await supabase.from('renstra_kegiatan').select('id').eq('program_id', id);
    if (childKeg && childKeg.length > 0) {
      const kegIds = childKeg.map(k => k.id);
      await supabase.from('renstra_sub_kegiatan').delete().in('kegiatan_id', kegIds);
      await supabase.from('renstra_kegiatan').delete().eq('program_id', id);
    }

    // 2. Delete main row from renstra_program table in database
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
        const formatted = data.map((k, idx) => {
          return {
            id: k.id,
            kode: `01.2.01.000${idx + 1}`,
            nama: k.deskripsi_kegiatan,
            programId: k.program_id || 1,
            programNama: k.renstra_program?.deskripsi_program || 'PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH',
            sasaran: 'Terpenuhinya Perencanaan, Penganggaran, dan Evaluasi Kinerja',
            indikator: 'Jumlah Dokumen Perencanaan',
            target: '1 Dokumen',
            bidang: 'Kesmas',
            anggaran: k.anggaran_tahun_1 || 114298200,
            status: 'Dalam Proses',
            tahun: 2025,
            raw: k,
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
      progId = pData?.[0]?.id || 1;
    }

    const { data, error } = await supabase
      .from('renstra_kegiatan')
      .insert([{
        deskripsi_kegiatan: newKegiatan.nama,
        program_id: progId,
        sumber_anggaran: 'APBD',
        anggaran_tahun_1: newKegiatan.anggaran || 0,
      }])
      .select();

    if (error) throw new Error('Gagal menambah Kegiatan di Database: ' + error.message);
    await fetchKegiatan();
    return data;
  };

  const updateKegiatan = async (id, updated) => {
    const { error } = await supabase
      .from('renstra_kegiatan')
      .update({
        deskripsi_kegiatan: updated.nama,
        program_id: updated.programId,
        anggaran_tahun_1: updated.anggaran || 0,
      })
      .eq('id', id);

    if (error) throw new Error('Gagal memperbarui Kegiatan di Database: ' + error.message);
    await fetchKegiatan();
  };

  const deleteKegiatan = async (id) => {
    // 1. Delete child sub_kegiatan in database first
    await supabase.from('renstra_sub_kegiatan').delete().eq('kegiatan_id', id);

    // 2. Delete main row from renstra_kegiatan table in database
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
        const formatted = data.map((sk, idx) => {
          return {
            id: sk.id,
            kode: `01.2.01.0001.000${idx + 1}`,
            nama: sk.deskripsi_sub_kegiatan,
            kegiatanId: sk.kegiatan_id || 1,
            kegiatanNama: sk.renstra_kegiatan?.deskripsi_kegiatan || 'Perencanaan, Penganggaran, dan Evaluasi Kinerja',
            sasaran: 'Tersusunnya Dokumen Rencana Pembangunan',
            indikator: 'Jumlah Dokumen Perencanaan',
            target: '2 Dokumen',
            bidang: 'Kesmas',
            anggaran: sk.anggaran_tahun_1 || 22653100,
            status: 'Tercapai',
            tahun: 2025,
            raw: sk,
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
      kegId = kData?.[0]?.id || 1;
    }

    const { data, error } = await supabase
      .from('renstra_sub_kegiatan')
      .insert([{
        deskripsi_sub_kegiatan: newSub.nama,
        kegiatan_id: kegId,
        sumber_anggaran: 'APBD',
        anggaran_tahun_1: newSub.anggaran || 0,
      }])
      .select();

    if (error) throw new Error('Gagal menambah Sub Kegiatan di Database: ' + error.message);
    await fetchSubKegiatan();
    return data;
  };

  const updateSubKegiatan = async (id, updated) => {
    const { error } = await supabase
      .from('renstra_sub_kegiatan')
      .update({
        deskripsi_sub_kegiatan: updated.nama,
        kegiatan_id: updated.kegiatanId,
        anggaran_tahun_1: updated.anggaran || 0,
      })
      .eq('id', id);

    if (error) throw new Error('Gagal memperbarui Sub Kegiatan di Database: ' + error.message);
    await fetchSubKegiatan();
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
