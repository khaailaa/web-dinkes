import { useMemo } from 'react';
import { formatAnggaranShort } from '../data/initialData';
import { usePerencanaan, usePrograms, useKegiatan, useSubKegiatan } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext';
import { Printer, Loader2 } from 'lucide-react';
import TabelMatriksRenstra from '../components/TabelMatriksRenstra';

export default function Laporan() {
  const { perencanaan, loading: loadingPerencanaan } = usePerencanaan();
  const { programs, loading: loadingProg } = usePrograms();
  const { kegiatan, loading: loadingKeg } = useKegiatan();
  const { subKegiatan, loading: loadingSub } = useSubKegiatan();
  const { state } = useApp();
  const currentUser = state.currentUser;
  const userBidang = currentUser?.bidang;

  const loading = loadingPerencanaan || loadingProg || loadingKeg || loadingSub;

  const scopedPerencanaan = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return perencanaan;
    return perencanaan.filter(p => !p.bidang || p.bidang === userBidang);
  }, [perencanaan, userBidang]);

  const scopedPrograms = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return programs;
    return programs.filter(p => !p.bidang || p.bidang === userBidang);
  }, [programs, userBidang]);

  const scopedKegiatan = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return kegiatan;
    return kegiatan.filter(k => !k.bidang || k.bidang === userBidang);
  }, [kegiatan, userBidang]);

  const scopedSubKegiatan = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return subKegiatan;
    return subKegiatan.filter(sk => !sk.bidang || sk.bidang === userBidang);
  }, [subKegiatan, userBidang]);

  const stats = useMemo(() => {
    const totalPagu = scopedSubKegiatan.reduce((s, sk) => s + (sk.anggaran || 0), 0) ||
      scopedPrograms.reduce((s, p) => s + (p.anggaranPagu || 0), 0);

    return {
      perencanaan: scopedPerencanaan.length,
      program: scopedPrograms.length,
      kegiatan: scopedKegiatan.length,
      subKegiatan: scopedSubKegiatan.length,
      totalPagu,
    };
  }, [scopedPerencanaan, scopedPrograms, scopedKegiatan, scopedSubKegiatan]);

  return (
    <div className="fade-in">
      {/* Page Header & Actions */}
      <div className="page-header-actions" style={{ marginBottom: '20px' }}>
        <div className="page-header">
          <h1>Tabel Matriks Renstra</h1>
          <p>
            Keterhitungan Perencanaan ➔ Program ➔ Kegiatan ➔ Sub Kegiatan (Matriks SIPD)
            {userBidang && userBidang !== 'Semua' && ` — Laporan Khusus Bidang ${userBidang}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Cetak Matriks
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 16px auto' }} />
          <h3>Memuat Matriks Renstra...</h3>
        </div>
      ) : (
        <>
          {/* Top 5 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>PERENCANAAN</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.perencanaan}</div>
            </div>

            <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>TOTAL PROGRAM</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.program}</div>
            </div>

            <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>TOTAL KEGIATAN</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.kegiatan}</div>
            </div>

            <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>TOTAL SUB KEGIATAN</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.subKegiatan}</div>
            </div>

            <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>TOTAL ANGGARAN</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--blue)', marginTop: '4px' }}>{formatAnggaranShort(stats.totalPagu)}</div>
            </div>
          </div>

          {/* Matriks Renstra Table */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Matriks Perencanaan, Program, Kegiatan & Sub Kegiatan {userBidang && userBidang !== 'Semua' ? `(Bidang ${userBidang})` : ''}
              </h3>
            </div>

            <TabelMatriksRenstra
              programs={scopedPrograms}
              kegiatan={scopedKegiatan}
              subKegiatan={scopedSubKegiatan}
            />
          </div>
        </>
      )}
    </div>
  );
}
