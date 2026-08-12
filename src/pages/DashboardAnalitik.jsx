import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import RoleQuickSwitcher from '../components/RoleQuickSwitcher';
import { formatAnggaranShort, bidangList, getProgressColor } from '../data/initialData';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function DashboardAnalitik() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { programs, kegiatan, subKegiatan, perencanaan, currentUser } = state;
  const userBidang = currentUser?.bidang;

  const [selectedBidang, setSelectedBidang] = useState('Semua');

  const activeScopeBidang = userBidang && userBidang !== 'Semua' ? userBidang : selectedBidang;

  const filteredPrograms = useMemo(() => {
    return activeScopeBidang === 'Semua' ? programs : programs.filter(p => p.bidang === activeScopeBidang);
  }, [programs, activeScopeBidang]);

  const stats = useMemo(() => {
    const totalPagu = filteredPrograms.reduce((s, p) => s + (p.anggaranPagu || 0), 0);
    const avgCapaian = filteredPrograms.length > 0 ? Math.min(100, Math.round(filteredPrograms.reduce((s, p) => s + Math.min(p.capaian || 0, 100), 0) / filteredPrograms.length)) : 0;
    return {
      perencanaan: perencanaan.length,
      program: filteredPrograms.length,
      kegiatan: kegiatan.length,
      subKegiatan: subKegiatan.length,
      avgCapaian,
      totalPagu,
    };
  }, [filteredPrograms, perencanaan, kegiatan, subKegiatan]);

  // Top 5 Best & Needing Attention programs
  const sortedTopPrograms = useMemo(() => {
    return [...filteredPrograms].sort((a, b) => b.capaian - a.capaian).slice(0, 5);
  }, [filteredPrograms]);

  const sortedAttentionPrograms = useMemo(() => {
    return [...filteredPrograms].sort((a, b) => a.capaian - b.capaian).slice(0, 5);
  }, [filteredPrograms]);

  // Grouped Bar Chart
  const groupedBarData = useMemo(() => {
    const activeBidang = selectedBidang === 'Semua' ? bidangList : [selectedBidang];
    const capaianData = activeBidang.map(b => {
      const progs = programs.filter(p => p.bidang === b);
      return progs.length > 0 ? Math.min(100, Math.round(progs.reduce((s, p) => s + Math.min(p.capaian || 0, 100), 0) / progs.length)) : 0;
    });
    const realisasiData = activeBidang.map(b => {
      const progs = programs.filter(p => p.bidang === b);
      const real = progs.reduce((s, p) => s + (p.anggaranRealisasi || 0), 0);
      return Math.round(real / 1000000);
    });

    return {
      labels: activeBidang,
      datasets: [
        {
          label: 'Capaian Kinerja (%)',
          data: capaianData,
          backgroundColor: '#0f2744',
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          label: 'Realisasi Anggaran (Jt)',
          data: realisasiData,
          backgroundColor: '#00a86b',
          borderRadius: 4,
          yAxisID: 'y1',
        },
      ],
    };
  }, [programs, selectedBidang]);

  const groupedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter', size: 11 } } },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        max: 100,
        ticks: { callback: v => `${v}%`, font: { size: 10 } },
        grid: { color: '#f0f0f0' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        ticks: { callback: v => `${v} Jt`, font: { size: 10 } },
        grid: { display: false },
      },
      x: { grid: { display: false } },
    },
  };

  // Status Distribution Donut Chart
  const statusDist = useMemo(() => {
    return {
      tercapai: filteredPrograms.filter(p => p.status === 'Tercapai').length,
      proses: filteredPrograms.filter(p => p.status === 'Dalam Proses').length,
      belum: filteredPrograms.filter(p => p.status === 'Belum Tercapai').length,
    };
  }, [filteredPrograms]);

  const statusTotal = statusDist.tercapai + statusDist.proses + statusDist.belum;

  const donutData = {
    labels: ['Tercapai', 'Dalam Proses', 'Belum Tercapai'],
    datasets: [
      {
        data: [statusDist.tercapai, statusDist.proses, statusDist.belum],
        backgroundColor: ['#00a86b', '#ff9800', '#f44336'],
        borderWidth: 0,
        cutout: '72%',
      },
    ],
  };

  // Line Chart
  const trendLineData = {
    labels: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Proyeksi Q4'],
    datasets: [
      {
        label: 'Program',
        data: [35, 52, 68, 94],
        borderColor: '#0f2744',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: 'Kegiatan',
        data: [48, 68, 82, 90],
        borderColor: '#00a86b',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: 'Anggaran %',
        data: [30, 42, 60, 85],
        borderColor: '#ff9800',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const trendLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter', size: 11 } } } },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { size: 10 } }, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } },
    },
  };

  // Correlation Points Chart
  const correlationData = {
    labels: ['96%', '104%', '90%', '105%', '78%'],
    datasets: [
      {
        label: 'Serapan (%)',
        data: [88, 85, 83, 91, 63],
        borderColor: 'transparent',
        backgroundColor: '#1e4976',
        pointRadius: 6,
        showLine: false,
      },
    ],
  };

  const correlationOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: 'Capaian Kinerja (%)', font: { size: 10 } }, grid: { color: '#f0f0f0' } },
      y: { title: { display: true, text: 'Serapan (%)', font: { size: 10 } }, min: 40, max: 100, grid: { color: '#f0f0f0' } },
    },
  };

  return (
    <div className="fade-in">
      {/* Quick Role Switcher Banner */}
      <RoleQuickSwitcher />

      {/* Page Header with Bidang Filter Buttons */}
      <div className="page-header-actions" style={{ marginBottom: '20px' }}>
        <div className="page-header">
          <h1>Dashboard Analitik</h1>
          <p>
            {userBidang && userBidang !== 'Semua'
              ? `Analisa Mendalam & Tren Kinerja Khusus Bidang ${userBidang} — Tahun 2025`
              : 'Analisa mendalam capaian program dan tren kinerja Dinas Kesehatan Kabupaten Garut 2025'}
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          {['Semua', 'Kesmas', 'P2P', 'Yankes', 'SDK'].map(b => (
            <button
              key={b}
              onClick={() => setSelectedBidang(b)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.82rem',
                border: 'none',
                background: selectedBidang === b ? '#0f2744' : 'transparent',
                color: selectedBidang === b ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Top 6 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" onClick={() => navigate('/perencanaan')} style={{ padding: '16px 20px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Perencanaan">
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.perencanaan}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Total Perencanaan</div>
        </div>

        <div className="card" onClick={() => navigate('/program')} style={{ padding: '16px 20px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Program">
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.program}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Total Program</div>
        </div>

        <div className="card" onClick={() => navigate('/kegiatan')} style={{ padding: '16px 20px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Kegiatan">
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.kegiatan}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Total Kegiatan</div>
        </div>

        <div className="card" onClick={() => navigate('/sub-kegiatan')} style={{ padding: '16px 20px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Sub Kegiatan">
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.subKegiatan}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Total Sub Kegiatan</div>
        </div>

        <div className="card" onClick={() => navigate('/evaluasi')} style={{ padding: '16px 20px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Evaluasi">
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--blue)' }}>{stats.avgCapaian}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Avg Capaian</div>
        </div>

        <div className="card" onClick={() => navigate('/program')} style={{ padding: '16px 20px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Program">
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatAnggaranShort(stats.totalPagu)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Total Pagu</div>
        </div>
      </div>

      {/* Middle Row (2 Charts) */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Capaian Kinerja vs Realisasi Anggaran per Bidang */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Capaian Kinerja vs Realisasi Anggaran per Bidang</h3>
              <p>Perbandingan persentase capaian kinerja dan serapan anggaran (dalam juta rupiah)</p>
            </div>
          </div>
          <div className="card-body">
            <div style={{ height: '280px' }}>
              <Bar data={groupedBarData} options={groupedBarOptions} />
            </div>
          </div>
        </div>

        {/* Distribusi Status Program */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Distribusi Status Program</h3>
              <p>Komposisi status capaian seluruh program</p>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '160px', height: '160px', marginBottom: '16px' }}>
              <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00a86b' }} />
                  Tercapai
                </span>
                <span style={{ fontWeight: 700 }}>{statusDist.tercapai} ({statusTotal > 0 ? Math.round((statusDist.tercapai / statusTotal) * 100) : 0}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff9800' }} />
                  Dalam Proses
                </span>
                <span style={{ fontWeight: 700 }}>{statusDist.proses} ({statusTotal > 0 ? Math.round((statusDist.proses / statusTotal) * 100) : 0}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f44336' }} />
                  Belum Tercapai
                </span>
                <span style={{ fontWeight: 700 }}>{statusDist.belum} ({statusTotal > 0 ? Math.round((statusDist.belum / statusTotal) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row (2 Line/Correlation Charts) */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Tren Kumulatif per Kuartal */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Tren Kumulatif per Kuartal</h3>
              <p>Perkembangan program, kegiatan, dan realisasi anggaran</p>
            </div>
          </div>
          <div className="card-body">
            <div style={{ height: '240px' }}>
              <Line data={trendLineData} options={trendLineOptions} />
            </div>
          </div>
        </div>

        {/* Korelasi Capaian Kinerja vs Serapan Anggaran */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Korelasi Capaian Kinerja vs Serapan Anggaran</h3>
              <p>Titik = 1 program; ideal di kuadran kanan atas</p>
            </div>
          </div>
          <div className="card-body">
            <div style={{ height: '240px' }}>
              <Line data={correlationData} options={correlationOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Fourth Row (Top 5 & Attention Programs Lists - Screenshot 1 & 2) */}
      <div className="grid-2">
        {/* Top 5 Program Terbaik */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>🏆 Top 5 Program Terbaik</h3>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sortedTopPrograms.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', background: '#0f2744', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.nama}
                    </div>
                    <div className="progress-bar" style={{ marginTop: '4px' }}>
                      <div className="progress-track" style={{ height: '6px' }}>
                        <div className={`progress-fill ${getProgressColor(p.capaian)}`} style={{ width: `${Math.min(p.capaian, 100)}%`, height: '6px' }} />
                      </div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: Math.min(p.capaian, 100) >= 90 ? 'var(--green)' : 'var(--orange)' }}>
                    {Math.min(p.capaian, 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5 Program Perlu Perhatian */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>⚠ 5 Program Perlu Perhatian</h3>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sortedAttentionPrograms.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: p.capaian < 80 ? 'var(--orange)' : '#00a86b', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.nama}
                    </div>
                    <div className="progress-bar" style={{ marginTop: '4px' }}>
                      <div className="progress-track" style={{ height: '6px' }}>
                        <div className={`progress-fill ${getProgressColor(p.capaian)}`} style={{ width: `${Math.min(p.capaian, 100)}%`, height: '6px' }} />
                      </div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: Math.min(p.capaian, 100) < 80 ? 'var(--orange)' : 'var(--green)' }}>
                    {Math.min(p.capaian, 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
