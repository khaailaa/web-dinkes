import { useState, useEffect, useCallback } from 'react';
import { supabase, PERANGKAT_DAERAH_ID } from '../lib/supabase';
import {
  initialPerencanaan,
  initialPrograms,
  initialKegiatan,
  initialSubKegiatan,
} from '../data/initialData';

// Hook for Perencanaan (Renstra Tujuan & Sasaran)
export function usePerencanaan() {
  const [perencanaan, setPerencanaan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPerencanaan = useCallback(async () => {
    try {
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
        setPerencanaan(initialPerencanaan);
      }
    } catch (err) {
      console.warn('Falling back to initialPerencanaan:', err.message);
      setPerencanaan(initialPerencanaan);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPerencanaan();
  }, [fetchPerencanaan]);

  const addTujuan = async (newTujuan) => {
    try {
      const { data, error } = await supabase
        .from('renstra_tujuan')
        .insert([{
          deskripsi_tujuan: newTujuan.nama,
          perangkat_daerah_id: PERANGKAT_DAERAH_ID
        }])
        .select();

      if (error) throw error;
      await fetchPerencanaan();
      return data;
    } catch {
      console.warn('Adding to local state fallback');
      const item = { ...newTujuan, id: Date.now() };
      setPerencanaan(prev => [...prev, item]);
      return [item];
    }
  };

  const updateTujuan = async (id, updated) => {
    try {
      const { error } = await supabase
        .from('renstra_tujuan')
        .update({ deskripsi_tujuan: updated.nama })
        .eq('id', id);

      if (error) throw error;
      await fetchPerencanaan();
    } catch {
      setPerencanaan(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    }
  };

  const deleteTujuan = async (id) => {
    try {
      const { error } = await supabase
        .from('renstra_tujuan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPerencanaan();
    } catch {
      setPerencanaan(prev => prev.filter(p => p.id !== id));
    }
  };

  return { perencanaan, loading, error, refetch: fetchPerencanaan, addTujuan, updateTujuan, deleteTujuan };
}

// Hook for Programs (Renstra Program)
export function usePrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrograms = useCallback(async () => {
    try {
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
        setPrograms(initialPrograms);
      }
    } catch (err) {
      console.warn('Falling back to initialPrograms:', err.message);
      setPrograms(initialPrograms);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrograms();
  }, [fetchPrograms]);

  const addProgram = async (newProgram) => {
    try {
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

      if (error) throw error;
      await fetchPrograms();
      return data;
    } catch {
      console.warn('Adding to local state fallback');
      const item = { ...newProgram, id: Date.now() };
      setPrograms(prev => [...prev, item]);
      return [item];
    }
  };

  const updateProgram = async (id, updated) => {
    try {
      const { error } = await supabase
        .from('renstra_program')
        .update({
          deskripsi_program: updated.nama,
          sasaran_id: updated.perencanaanId || updated.sasaranId,
          anggaran_tahun_1: updated.anggaranPagu || 0,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchPrograms();
    } catch {
      setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    }
  };

  const deleteProgram = async (id) => {
    try {
      const { error } = await supabase
        .from('renstra_program')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPrograms();
    } catch {
      setPrograms(prev => prev.filter(p => p.id !== id));
    }
  };

  return { programs, loading, error, refetch: fetchPrograms, addProgram, updateProgram, deleteProgram };
}

// Hook for Kegiatan (Renstra Kegiatan)
export function useKegiatan() {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKegiatan = useCallback(async () => {
    try {
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
        setKegiatan(initialKegiatan);
      }
    } catch (err) {
      console.warn('Falling back to initialKegiatan:', err.message);
      setKegiatan(initialKegiatan);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKegiatan();
  }, [fetchKegiatan]);

  const addKegiatan = async (newKegiatan) => {
    try {
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

      if (error) throw error;
      await fetchKegiatan();
      return data;
    } catch {
      console.warn('Adding to local state fallback');
      const item = { ...newKegiatan, id: Date.now() };
      setKegiatan(prev => [...prev, item]);
      return [item];
    }
  };

  const updateKegiatan = async (id, updated) => {
    try {
      const { error } = await supabase
        .from('renstra_kegiatan')
        .update({
          deskripsi_kegiatan: updated.nama,
          program_id: updated.programId,
          anggaran_tahun_1: updated.anggaran || 0,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchKegiatan();
    } catch {
      setKegiatan(prev => prev.map(k => k.id === id ? { ...k, ...updated } : k));
    }
  };

  const deleteKegiatan = async (id) => {
    try {
      const { error } = await supabase
        .from('renstra_kegiatan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchKegiatan();
    } catch {
      setKegiatan(prev => prev.filter(k => k.id !== id));
    }
  };

  return { kegiatan, loading, error, refetch: fetchKegiatan, addKegiatan, updateKegiatan, deleteKegiatan };
}

// Hook for Sub Kegiatan (Renstra Sub Kegiatan)
export function useSubKegiatan() {
  const [subKegiatan, setSubKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubKegiatan = useCallback(async () => {
    try {
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
        setSubKegiatan(initialSubKegiatan);
      }
    } catch (err) {
      console.warn('Falling back to initialSubKegiatan:', err.message);
      setSubKegiatan(initialSubKegiatan);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubKegiatan();
  }, [fetchSubKegiatan]);

  const addSubKegiatan = async (newSub) => {
    try {
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

      if (error) throw error;
      await fetchSubKegiatan();
      return data;
    } catch {
      console.warn('Adding to local state fallback');
      const item = { ...newSub, id: Date.now() };
      setSubKegiatan(prev => [...prev, item]);
      return [item];
    }
  };

  const updateSubKegiatan = async (id, updated) => {
    try {
      const { error } = await supabase
        .from('renstra_sub_kegiatan')
        .update({
          deskripsi_sub_kegiatan: updated.nama,
          kegiatan_id: updated.kegiatanId,
          anggaran_tahun_1: updated.anggaran || 0,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchSubKegiatan();
    } catch {
      setSubKegiatan(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    }
  };

  const deleteSubKegiatan = async (id) => {
    try {
      const { error } = await supabase
        .from('renstra_sub_kegiatan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSubKegiatan();
    } catch {
      setSubKegiatan(prev => prev.filter(s => s.id !== id));
    }
  };

  return { subKegiatan, loading, error, refetch: fetchSubKegiatan, addSubKegiatan, updateSubKegiatan, deleteSubKegiatan };
}

// Hook for Penanggung Jawab
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
