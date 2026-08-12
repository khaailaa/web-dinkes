import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { bidangList, getBidangColor, getProgressColor } from '../data/initialData';
import { usePrograms, useKegiatan } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext';
import RoleQuickSwitcher from '../components/RoleQuickSwitcher';
import { Loader2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, ArcElement, Title, Tooltip, Legend, Filler);

export default function Evaluasi() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { currentUser } = state;
  const userBidang = currentUser?.bidang;

  const { programs, loading: loadingProg } = usePrograms();
  const { kegiatan, loading: loadingKeg } = useKegiatan();

  const loading = loadingProg || loadingKeg;

  const scopedPrograms = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return programs;
    return programs.filter(p => !p.bidang || p.bidang === userBidang);
  }, [programs, userBidang]);

  const summary = useMemo(() => {
    const totalProg = scopedPrograms.length;
    const tercapai = scopedPrograms.filter(p => p.status === 'Tercapai').length;
    const proses = scopedPrograms.filter(p => p.status === 'Dalam Proses').length;
    const belum = scopedPrograms.filter(p => p.status === 'Belum Tercapai').length;
    const avgCapaian = totalProg > 0 ? Math.min(100, Math.round(scopedPrograms.reduce((s, p) => s + Math.min(p.capaian || 0, 100), 0) / totalProg)) : 0;
    const totalPagu = scopedPrograms.reduce((s, p) => s + (p.anggaranPagu || 0), 0);
    const totalReal = scopedPrograms.reduce((s, p) => s + (p.anggaranRealisasi || (p.anggaranPagu ? p.anggaranPagu * 0.85 : 0)), 0);
    const avgSerapan = totalPagu > 0 ? Math.min(100, Math.round((totalReal / totalPagu) * 100)) : 85;
    return { totalProg, tercapai, proses, belum, avgCapaian, avgSerapan };
  }, [scopedPrograms]);

  // Bidang Evaluation detail calculation
  const bidangEvaluasi = useMemo(() => {
    return bidangList.map(bidang => {
      const progs = programs.filter(p => p.bidang === bidang);
      const kgts = kegiatan.filter(k => k.bidang === bidang);
      const jmlProg = progs.length;
      const jmlKgt = kgts.length;

      const avgCapaian = jmlProg > 0 ? Math.min(100, Math.round(progs.reduce((s, p) => s + Math.min(p.capaian || 85, 100), 0) / jmlProg)) : 85;
      const pagu = progs.reduce((s, p) => s + (p.anggaranPagu || 0), 0);
      const real = progs.reduce((s, p) => s + (p.anggaranRealisasi || (p.anggaranPagu ? p.anggaranPagu * 0.85 : 0)), 0);
      const serapan = pagu > 0 ? Math.min(100, Math.round((real / pagu) * 100)) : 80;

      const nilaiEvaluasi = Math.min(100, Math.round((avgCapaian * 0.6) + (serapan * 0.4)));

      let predikat = 'Kurang';
      let predikatColor = 'red';
      if (nilaiEvaluasi >= 90) { predikat = 'Sangat Baik'; predikatColor = 'green'; }
      else if (nilaiEvaluasi >= 80) { predikat = 'Baik'; predikatColor = 'blue'; }
      else if (nilaiEvaluasi >= 70) { predikat = 'Cukup'; predikatColor = 'orange'; }

      return { bidang, jmlProg, jmlKgt, avgCapaian, serapan, nilaiEvaluasi, predikat, predikatColor };
    });
  }, [programs, kegiatan]);

  // Radar Data
  const radarData = {
    labels: bidangList,
    datasets: [
      {
        label: 'Capaian Kinerja',
        data: bidangEvaluasi.map(b => b.avgCapaian),
        backgroundColor: 'rgba(33, 150, 243, 0.15)',
        borderColor: '#2196f3',
        pointBackgroundColor: '#2196f3',
      },
      {
        label: 'Serapan Anggaran',
        data: bidangEvaluasi.map(b => b.serapan),
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderColor: '#4caf50',
        pointBackgroundColor: '#4caf50',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter', size: 11 } } } },
    scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 25, display: false } } },
  };

  // Bar Data (Capaian vs Target per bidang)
  const barData = {
    labels: bidangList,
    datasets: [
      {
        data: bidangEvaluasi.map(b => b.avgCapaian),
        backgroundColor: bidangEvaluasi.map(b => b.avgCapaian >= 90 ? '#4caf50' : b.avgCapaian >= 70 ? '#ff9800' : '#f44336'),
        borderRadius: 4,
        barThickness: 24,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: v => `${v}%`, font: { size: 10 } }, grid: { color: '#f0f0f0' } },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };

  const rekomendasiList = [
    {
      prioritas: 'Tinggi',
      bidang: 'SDK',
      masalah: 'Capaian pelatihan tenaga kesehatan masih rendah (58%)',
      tindakLanjut: 'Percepatan jadwal pelatihan Q4 dan koordinasi dengan BPSDMK',
    },
    {
      prioritas: 'Tinggi',
      bidang: 'Gizi',
      masalah: 'Realisasi anggaran program gizi baru 76%',
      tindakLanjut: 'Akselerasi pengadaan dan kegiatan kampanye gizi di kecamatan',
    },
    {
      prioritas: 'Sedang',
      bidang: 'P2P',
      masalah: 'Surveilans epidemiologi terlambat di 15 Puskesmas',
      tindakLanjut: 'Bimbingan teknis pengisian SIMPUS dan pendampingan lapangan',
    },
    {
      prioritas: 'Sedang',
      bidang: 'Kesmas',
      masalah: 'Capaian Germas sudah baik namun serapan anggaran belum optimal',
      tindakLanjut: 'Penyelesaian administrasi pertanggungjawaban kegiatan Q3',
    },
  ];

  return (
    <div className="fade-in">
      {/* Quick Role Switcher Banner */}
      <RoleQuickSwitcher />

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Evaluasi Kinerja</h1>
        <p>
          {userBidang && userBidang !== 'Semua'
            ? `Evaluasi Kinerja & Nilai Capaian Khusus Bidang ${userBidang} — Periode 2025`
            : 'Evaluasi kinerja dan capaian program secara keseluruhan — Periode 2025'}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 16px auto' }} />
          <h3>Memuat data evaluasi...</h3>
        </div>
      ) : (
        <>
          {/* Dark Blue Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0a1929 0%, #163456 100%)',
            borderRadius: 'var(--radius-md)',
            padding: '24px 32px',
            color: 'white',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '24px',
            alignItems: 'center',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div onClick={() => navigate('/monitoring')} style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '16px', cursor: 'pointer', borderRadius: '8px', padding: '12px 16px', transition: 'background 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; }} title="Klik untuk melihat Monitoring">
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--teal)' }}>{summary.avgCapaian}%</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Capaian Kinerja</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Target: 90%</div>
            </div>

            <div onClick={() => navigate('/program')} style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '16px', cursor: 'pointer', borderRadius: '8px', padding: '12px 16px', transition: 'background 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; }} title="Klik untuk melihat Program">
              <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{summary.tercapai}</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Program Tercapai</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>dari {summary.totalProg} program</div>
            </div>

            <div onClick={() => navigate('/program')} style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '16px', cursor: 'pointer', borderRadius: '8px', padding: '12px 16px', transition: 'background 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; }} title="Klik untuk melihat Program">
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--orange)' }}>{summary.proses}</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Dalam Proses</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>perlu percepatan</div>
            </div>

            <div onClick={() => navigate('/evaluasi')} style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '16px', cursor: 'pointer', borderRadius: '8px', padding: '12px 16px', transition: 'background 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; }} title="Klik untuk melihat Evaluasi">
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--red)' }}>{summary.belum}</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Belum Tercapai</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>perlu intervensi</div>
            </div>

            <div onClick={() => navigate('/program')} style={{ cursor: 'pointer', borderRadius: '8px', padding: '12px 16px', transition: 'background 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; }} title="Klik untuk melihat Program">
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--blue)' }}>{summary.avgSerapan}%</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Serapan Anggaran</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>rata-rata serapan</div>
            </div>
          </div>

          {/* Middle Row (2 Charts) */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Radar Capaian & Serapan per Bidang</h3>
                  <p>Perbandingan capaian kinerja vs realisasi anggaran</p>
                </div>
              </div>
              <div className="card-body">
                <div style={{ height: '260px' }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Evaluasi Capaian vs Target per Bidang</h3>
                  <p>Nilai capaian rata-rata per bidang pelaksana</p>
                </div>
              </div>
              <div className="card-body">
                <div style={{ height: '260px' }}>
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Table: Evaluasi Detail per Bidang */}
          <div className="card mb-2" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div>
                <h3>Evaluasi Detail per Bidang</h3>
              </div>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>BIDANG</th>
                    <th>JUMLAH PROGRAM</th>
                    <th>JUMLAH KEGIATAN</th>
                    <th>RATA-RATA CAPAIAN</th>
                    <th>SERAPAN ANGGARAN</th>
                    <th>NILAI EVALUASI</th>
                    <th>PREDIKAT</th>
                  </tr>
                </thead>
                <tbody>
                  {bidangEvaluasi.map((item) => (
                    <tr key={item.bidang}>
                      <td style={{ fontWeight: 600 }}>{item.bidang}</td>
                      <td style={{ textAlign: 'center' }}>{item.jmlProg}</td>
                      <td style={{ textAlign: 'center' }}>{item.jmlKgt}</td>
                      <td>
                        <div className="progress-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-track" style={{ minWidth: '80px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div className={`progress-fill bg-${getProgressColor(item.avgCapaian)}`} style={{ height: '100%', width: `${Math.min(item.avgCapaian, 100)}%` }} />
                          </div>
                          <span className="progress-label" style={{ fontWeight: 700 }}>{item.avgCapaian}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="progress-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-track" style={{ minWidth: '80px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div className="progress-fill orange" style={{ height: '100%', background: '#ff9800', width: `${Math.min(item.serapan, 100)}%` }} />
                          </div>
                          <span className="progress-label" style={{ fontWeight: 700 }}>{item.serapan}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: item.nilaiEvaluasi >= 80 ? 'var(--green)' : item.nilaiEvaluasi >= 70 ? 'var(--orange)' : 'var(--red)' }}>
                          {item.nilaiEvaluasi}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700,
                          background: item.predikatColor === 'green' ? 'var(--green-light)' : item.predikatColor === 'blue' ? 'var(--blue-light)' : item.predikatColor === 'orange' ? 'var(--orange-light)' : 'var(--red-light)',
                          color: item.predikatColor === 'green' ? 'var(--green)' : item.predikatColor === 'blue' ? 'var(--blue)' : item.predikatColor === 'orange' ? 'var(--orange)' : 'var(--red)',
                        }}>
                          {item.predikat}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Rekomendasi Tindak Lanjut */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3>Rekomendasi Tindak Lanjut</h3>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'var(--blue-light)', color: 'var(--blue)', fontSize: '0.78rem', fontWeight: 700 }}>
                {rekomendasiList.length} rekomendasi
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rekomendasiList.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                        background: item.prioritas === 'Tinggi' ? 'var(--red-light)' : 'var(--orange-light)',
                        color: item.prioritas === 'Tinggi' ? 'var(--red)' : 'var(--orange)',
                      }}>
                        {item.prioritas}
                      </span>
                      <span className={`badge-bidang badge-${getBidangColor(item.bidang)}`}>
                        {item.bidang}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        ⚠ {item.masalah}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', paddingLeft: '8px' }}>
                      → {item.tindakLanjut}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
