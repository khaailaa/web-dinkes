import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import RoleQuickSwitcher from '../components/RoleQuickSwitcher';
import { formatAnggaranShort, getProgressColor, getBidangColor, bidangList } from '../data/initialData';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AlertTriangle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Monitoring() {
  const { state } = useApp();
  const { programs, kegiatan, subKegiatan, perencanaan, currentUser } = state;
  const userBidang = currentUser?.bidang;

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

  const scopedPerencanaan = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return perencanaan;
    return perencanaan.filter(p => !p.bidang || p.bidang === userBidang);
  }, [perencanaan, userBidang]);

  const stats = useMemo(() => {
    const totalPagu = scopedPrograms.reduce((s, p) => s + (p.anggaranPagu || 0), 0);
    const totalRealisasi = scopedPrograms.reduce((s, p) => s + (p.anggaranRealisasi || 0), 0);
    const avgCapaian = scopedPrograms.length > 0 ? Math.round(scopedPrograms.reduce((s, p) => s + (p.capaian || 0), 0) / scopedPrograms.length) : 0;
    const realisasiPct = totalPagu > 0 ? Math.round((totalRealisasi / totalPagu) * 100) : 0;
    return { totalPagu, totalRealisasi, avgCapaian, realisasiPct };
  }, [scopedPrograms]);

  // Donut chart for Realisasi Anggaran Keseluruhan
  const doughnutData = {
    labels: ['Realisasi', 'Sisa Pagu'],
    datasets: [
      {
        data: [stats.totalRealisasi, Math.max(0, stats.totalPagu - stats.totalRealisasi)],
        backgroundColor: ['#ff9800', '#f0f4f8'],
        borderWidth: 0,
        cutout: '78%',
      },
    ],
  };

  // Bar chart for Capaian Kinerja per Bidang
  const bidangBarData = useMemo(() => {
    const dataPerBidang = bidangList.map(b => {
      const progs = programs.filter(p => p.bidang === b);
      return progs.length > 0 ? Math.round(progs.reduce((s, p) => s + p.capaian, 0) / progs.length) : 0;
    });

    return {
      labels: bidangList,
      datasets: [
        {
          data: dataPerBidang,
          backgroundColor: dataPerBidang.map(v => v >= 90 ? '#4caf50' : v >= 70 ? '#ff9800' : '#f44336'),
          borderRadius: 4,
          barThickness: 24,
        },
      ],
    };
  }, [programs]);

  const bidangBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `Capaian: ${ctx.parsed.y}%` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 120,
        ticks: { stepSize: 30, callback: (v) => `${v}%`, font: { size: 10, family: 'Inter' } },
        grid: { color: '#f0f0f0' },
      },
      x: {
        ticks: { font: { size: 11, family: 'Inter' } },
        grid: { display: false },
      },
    },
  };

  // Low achievement items
  const lowItems = useMemo(() => {
    const lowKgts = kegiatan.filter(k => k.capaian < 75 || k.status === 'Belum Tercapai').map(k => ({
      type: 'Kegiatan',
      nama: k.nama,
      catatan: k.catatan || 'Jadwal mundur karena panduan teknis belum terbit',
      capaian: k.capaian,
      status: k.status,
    }));
    const lowSub = subKegiatan.filter(s => s.capaian < 80).map(s => ({
      type: 'Sub Kegiatan',
      nama: s.nama,
      catatan: s.catatan || 'Keterlambatan pelaporan',
      capaian: s.capaian,
      status: s.status,
    }));
    return [...lowKgts, ...lowSub];
  }, [kegiatan, subKegiatan]);

  return (
    <div className="fade-in">
      {/* Quick Role Switcher Banner */}
      <RoleQuickSwitcher />

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Monitoring Kinerja</h1>
        <p>
          {userBidang && userBidang !== 'Semua'
            ? `Pemantauan Capaian Kinerja & Realisasi Anggaran Khusus Bidang ${userBidang}`
            : 'Pemantauan capaian kinerja dan realisasi anggaran secara keseluruhan — Periode 2025'}
        </p>
      </div>

      {/* Top 5 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📋</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{scopedPerencanaan.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Perencanaan Aktif</div>
        </div>

        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📁</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{scopedPrograms.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Program</div>
        </div>

        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📌</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{scopedKegiatan.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Kegiatan</div>
        </div>

        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📎</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{scopedSubKegiatan.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Sub Kegiatan</div>
        </div>

        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📊</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--teal)' }}>{stats.avgCapaian}%</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Rata-rata Capaian</div>
        </div>
      </div>

      {/* Middle Row (2 Cards) */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Realisasi Anggaran Keseluruhan */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Realisasi Anggaran Keseluruhan</h3>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
              <div style={{ width: '110px', height: '110px', position: 'relative', flexShrink: 0 }}>
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)'
                }}>
                  {stats.realisasiPct}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Pagu Anggaran</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {formatAnggaranShort(stats.totalPagu)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Realisasi</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--orange)' }}>
                  {formatAnggaranShort(stats.totalRealisasi)}
                </div>
              </div>
            </div>

            <div className="progress-bar" style={{ height: '10px' }}>
              <div className="progress-track" style={{ height: '10px' }}>
                <div className="progress-fill orange" style={{ width: `${stats.realisasiPct}%`, height: '10px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Capaian Kinerja per Bidang */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Capaian Kinerja per Bidang</h3>
            </div>
          </div>
          <div className="card-body">
            <div style={{ height: '180px' }}>
              <Bar data={bidangBarData} options={bidangBarOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Table: Status Program Keseluruhan */}
      <div className="card mb-2">
        <div className="card-header">
          <div>
            <h3>Status Program Keseluruhan</h3>
          </div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>PERENCANAAN</th>
                <th>PROGRAM</th>
                <th>BIDANG</th>
                <th>TARGET</th>
                <th>REALISASI</th>
                <th>CAPAIAN KINERJA</th>
                <th>SERAPAN ANGGARAN</th>
                <th>JUMLAH KEGIATAN</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((item) => {
                const renstra = perencanaan.find(r => r.id === item.perencanaanId);
                const kgts = kegiatan.filter(k => k.programId === item.id);
                const serapan = item.anggaranPagu > 0 ? Math.round((item.anggaranRealisasi / item.anggaranPagu) * 100) : 0;

                return (
                  <tr key={item.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {renstra ? renstra.nama : 'Renstra Kesehatan Masyarakat'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.nama}</td>
                    <td><span className={`badge-bidang badge-${getBidangColor(item.bidang)}`}>{item.bidang}</span></td>
                    <td style={{ fontWeight: 500 }}>{item.target || 95}%</td>
                    <td style={{ fontWeight: 500 }}>{item.realisasiPersen || 91}%</td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-track" style={{ minWidth: '60px' }}>
                          <div className={`progress-fill ${getProgressColor(item.capaian)}`} style={{ width: `${Math.min(item.capaian, 100)}%` }} />
                        </div>
                        <span className="progress-label" style={{ fontWeight: 700 }}>{item.capaian}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-track" style={{ minWidth: '60px' }}>
                          <div className="progress-fill orange" style={{ width: `${Math.min(serapan, 100)}%` }} />
                        </div>
                        <span className="progress-label" style={{ fontWeight: 700 }}>{serapan}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{kgts.length || 1}</td>
                    <td><StatusBadge status={item.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Red Banner Alert Section */}
      <div className="card" style={{ border: '1px solid #ffcdd2', background: '#ffebee' }}>
        <div className="card-header" style={{ borderBottom: '1px solid #ffcdd2', background: 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)', fontWeight: 700 }}>
            <AlertTriangle size={18} />
            <span>Perlu Perhatian — Kegiatan/Sub Kegiatan dengan Capaian Rendah</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lowItems.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px', borderRadius: 'var(--radius-sm)', background: '#fff8e1', border: '1px solid #ffe0b2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.2rem' }}>📌</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.nama}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--orange)', marginTop: '2px' }}>⚠ {item.catatan}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--orange)' }}>{item.capaian}%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>capaian</div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
