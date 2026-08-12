import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import RoleQuickSwitcher from '../components/RoleQuickSwitcher';
import { formatAnggaranShort, getBidangColor, chartData, bidangList, getProgressColor, normalizeBidangUtama, isItemInUserBidang } from '../data/initialData';
import { usePrograms, useKegiatan, useSubKegiatan } from '../hooks/useSupabase';
import Modal from '../components/Modal';
import {
  FolderKanban, CalendarCheck, ListChecks, FileText,
  CheckCircle2, XCircle, TrendingUp, Wallet, Download, Loader2, Edit3
} from 'lucide-react';

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

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();

  const { programs, loading: loadingPrograms } = usePrograms();
  const { kegiatan, loading: loadingKegiatan } = useKegiatan();
  const { subKegiatan, loading: loadingSub } = useSubKegiatan();

  const loading = loadingPrograms || loadingKegiatan || loadingSub;

  const currentUser = state.currentUser;
  const userBidang = currentUser?.bidang;

  const [selectedBidang, setSelectedBidang] = useState('Semua');
  const [detailItem, setDetailItem] = useState(null);

  const userBidangScope = currentUser?.canViewAllBidang ? null : userBidang;
  const activeScopeBidang = userBidangScope && userBidangScope !== 'Semua' ? userBidangScope : selectedBidang;

  // Filtered data based on active scope
  const scopedPrograms = useMemo(() => {
    if (activeScopeBidang === 'Semua') return programs;
    return programs.filter(p => isItemInUserBidang(p.bidang, activeScopeBidang));
  }, [programs, activeScopeBidang]);

  const scopedKegiatan = useMemo(() => {
    if (activeScopeBidang === 'Semua') return kegiatan;
    return kegiatan.filter(k => isItemInUserBidang(k.bidang, activeScopeBidang));
  }, [kegiatan, activeScopeBidang]);

  const scopedSubKegiatan = useMemo(() => {
    if (activeScopeBidang === 'Semua') return subKegiatan;
    return subKegiatan.filter(sk => isItemInUserBidang(sk.bidang, activeScopeBidang));
  }, [subKegiatan, activeScopeBidang]);

  // Overall Statistics
  const stats = useMemo(() => {
    const tercapai = scopedPrograms.filter(p => p.status === 'Tercapai').length;
    const proses = scopedPrograms.filter(p => p.status === 'Dalam Proses').length;
    const belumTercapai = scopedPrograms.filter(p => p.status === 'Belum Tercapai').length;
    const totalAnggaran = scopedPrograms.reduce((sum, p) => sum + (p.anggaranPagu || 0), 0);
    const totalRealisasi = scopedPrograms.reduce((sum, p) => sum + (p.anggaranRealisasi || 0), 0);
    const avgCapaian = scopedPrograms.length > 0
      ? Math.min(100, Math.round(scopedPrograms.reduce((sum, p) => sum + Math.min(p.capaian || 0, 100), 0) / scopedPrograms.length))
      : 0;
    const realisasiPersen = totalAnggaran > 0 ? Math.min(100, Math.round((totalRealisasi / totalAnggaran) * 100)) : 0;

    return {
      totalProgram: scopedPrograms.length,
      totalKegiatan: scopedKegiatan.length,
      totalSubKegiatan: scopedSubKegiatan.length,
      tercapai,
      proses,
      belumTercapai,
      avgCapaian,
      realisasiPersen,
      totalAnggaran,
      totalRealisasi,
    };
  }, [scopedPrograms, scopedKegiatan, scopedSubKegiatan]);

  // Top 5 Best & Needing Attention programs
  const sortedTopPrograms = useMemo(() => {
    return [...scopedPrograms].sort((a, b) => (b.capaian || 0) - (a.capaian || 0)).slice(0, 5);
  }, [scopedPrograms]);

  const sortedAttentionPrograms = useMemo(() => {
    return [...scopedPrograms].sort((a, b) => (a.capaian || 0) - (b.capaian || 0)).slice(0, 5);
  }, [scopedPrograms]);

  // Grouped Bar Chart: Capaian vs Realisasi Anggaran per Bidang
  const groupedBarData = useMemo(() => {
    const activeBidangList = activeScopeBidang === 'Semua' ? bidangList : [activeScopeBidang];
    const capaianData = activeBidangList.map(b => {
      const progs = programs.filter(p => p.bidang === b);
      return progs.length > 0 ? Math.min(100, Math.round(progs.reduce((s, p) => s + Math.min(p.capaian || 0, 100), 0) / progs.length)) : 0;
    });
    const realisasiData = activeBidangList.map(b => {
      const progs = programs.filter(p => p.bidang === b);
      const real = progs.reduce((s, p) => s + (p.anggaranRealisasi || 0), 0);
      return Math.round(real / 1000000);
    });

    return {
      labels: activeBidangList,
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
  }, [programs, activeScopeBidang]);

  const groupedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter', size: 11 } } },
      tooltip: { backgroundColor: '#1a2332', titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter' } },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        max: 100,
        ticks: { callback: v => `${v}%`, font: { size: 10, family: 'Inter' } },
        grid: { color: '#f0f0f0' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        ticks: { callback: v => `${v} Jt`, font: { size: 10, family: 'Inter' } },
        grid: { display: false },
      },
      x: { ticks: { font: { size: 11, family: 'Inter' } }, grid: { display: false } },
    },
  };

  // Doughnut Chart: Status Program
  const statusTotal = stats.tercapai + stats.proses + stats.belumTercapai;
  const doughnutData = {
    labels: ['Tercapai', 'Dalam Proses', 'Belum Tercapai'],
    datasets: [{
      data: [stats.tercapai, stats.proses, stats.belumTercapai],
      backgroundColor: ['#00a86b', '#ff9800', '#f44336'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
    },
  };

  // Line Chart: Perkembangan Bulanan / Kuartalan
  const lineChartData = {
    labels: chartData.perkembanganBulanan.labels,
    datasets: [{
      label: 'Capaian Kinerja %',
      data: chartData.perkembanganBulanan.data.map(d => d || null),
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33, 150, 243, 0.08)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#2196f3',
    }],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1a2332' },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { size: 11, family: 'Inter' } }, grid: { color: '#f0f0f0' } },
      x: { ticks: { font: { size: 11, family: 'Inter' } }, grid: { display: false } },
    },
  };

  // Correlation Chart
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
      x: { title: { display: true, text: 'Capaian Kinerja (%)', font: { size: 10, family: 'Inter' } }, grid: { color: '#f0f0f0' } },
      y: { title: { display: true, text: 'Serapan (%)', font: { size: 10, family: 'Inter' } }, min: 40, max: 100, grid: { color: '#f0f0f0' } },
    },
  };

  return (
    <div className="fade-in">
      {/* Quick Role Switcher Banner */}
      <RoleQuickSwitcher />

      {/* Page Header with Bidang Filters & Actions */}
      <div className="page-header-actions mb-3">
        <div className="page-header">
          <h1>Dashboard Utama Kinerja & Analitik Renstra</h1>
          <p>
            {activeScopeBidang !== 'Semua'
              ? `Ringkasan Kinerja, Realisasi & Analisis Khusus Bidang ${activeScopeBidang} — Tahun 2025`
              : 'Sistem Informasi Perencanaan & Capaian Kinerja Dinas Kesehatan Kabupaten Garut 2025'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Bidang Filter Pills */}
          {(!userBidang || userBidang === 'Semua') && (
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              {['Semua', 'Sekretariat', 'Kesmas', 'P2P', 'Yankes', 'SDK'].map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBidang(b)}
                  style={{
                    padding: '6px 14px',
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
          )}

          <button className="btn btn-outline" onClick={() => window.print()}>
            <Download size={16} /> Ekspor Laporan
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 16px auto' }} />
          <h3>Memuat data Dashboard Utama dari Supabase Database...</h3>
        </div>
      ) : (
        <>
          {/* Top Primary Stat Cards Grid */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <StatCard
              label="TOTAL PROGRAM"
              value={stats.totalProgram}
              color="blue"
              icon={<FolderKanban size={22} />}
              subtitle={`${stats.tercapai} program target tercapai`}
              badge={`${stats.tercapai} Tercapai`}
              badgeType="success"
              to="/program"
            />
            <StatCard
              label="TOTAL KEGIATAN"
              value={stats.totalKegiatan}
              color="green"
              icon={<ListChecks size={22} />}
              subtitle="Pelaksanaan kegiatan bidang"
              badge="Aktif"
              badgeType="info"
              to="/kegiatan"
            />
            <StatCard
              label="TOTAL SUB KEGIATAN"
              value={stats.totalSubKegiatan}
              color="teal"
              icon={<CalendarCheck size={22} />}
              subtitle="Pelaksanaan teknis & puskesmas"
              badge="Terjadwal"
              badgeType="info"
              to="/sub-kegiatan"
            />
            <StatCard
              label="AVG CAPAIAN KINERJA"
              value={`${stats.avgCapaian}%`}
              color="orange"
              icon={<CheckCircle2 size={22} />}
              subtitle={`Target rata-rata kumulatif`}
              badge={stats.avgCapaian >= 80 ? 'Sangat Baik' : 'Perlu Perhatian'}
              badgeType={stats.avgCapaian >= 80 ? 'success' : 'warning'}
              to="/program"
            />
            <StatCard
              label="REALISASI ANGGARAN"
              value={`${stats.realisasiPersen}%`}
              color="red"
              icon={<Wallet size={22} />}
              subtitle={`${formatAnggaranShort(stats.totalRealisasi)} / ${formatAnggaranShort(stats.totalAnggaran)}`}
              badge="Pagu"
              badgeType="info"
              to="/program"
            />
          </div>

          {/* Secondary Kinerja & Anggaran Summary Cards */}
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            <div className="card" onClick={() => navigate('/program')} style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Program">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-rata Capaian Kinerja</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {stats.avgCapaian}%
                  </div>
                </div>
              </div>
            </div>

            <div className="card" onClick={() => navigate('/program')} style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Program">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--blue-light)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Realisasi Anggaran (%)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {stats.realisasiPersen}%
                  </div>
                </div>
              </div>
            </div>

            <div className="card" onClick={() => navigate('/program')} style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Program">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--purple-light)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Pagu Anggaran</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {formatAnggaranShort(stats.totalAnggaran)}
                  </div>
                </div>
              </div>
            </div>

            <div className="card" onClick={() => navigate('/program')} style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }} title="Klik untuk melihat Program">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--red-light)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Perlu Perhatian / Belum</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {stats.belumTercapai} Program
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Row 1: Capaian vs Realisasi & Status Distribution */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            {/* Capaian Kinerja vs Realisasi Anggaran per Bidang */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Capaian Kinerja vs Realisasi Anggaran per Bidang</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Perbandingan persentase capaian kinerja (%) & serapan anggaran (dalam juta rupiah)
                  </p>
                </div>
              </div>
              <div className="card-body">
                <div style={{ height: '280px' }}>
                  <Bar data={groupedBarData} options={groupedBarOptions} />
                </div>
              </div>
            </div>

            {/* Status Distribution Donut Chart */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Distribusi Status Program</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Komposisi pencapaian target seluruh program
                  </p>
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '160px', height: '160px', marginBottom: '16px' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00a86b' }} />
                      Tercapai
                    </span>
                    <span style={{ fontWeight: 700 }}>{stats.tercapai} ({statusTotal > 0 ? Math.round((stats.tercapai / statusTotal) * 100) : 0}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff9800' }} />
                      Dalam Proses
                    </span>
                    <span style={{ fontWeight: 700 }}>{stats.proses} ({statusTotal > 0 ? Math.round((stats.proses / statusTotal) * 100) : 0}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f44336' }} />
                      Belum Tercapai
                    </span>
                    <span style={{ fontWeight: 700 }}>{stats.belumTercapai} ({statusTotal > 0 ? Math.round((stats.belumTercapai / statusTotal) * 100) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Row 2: Tren Bulanan & Korelasi */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Perkembangan Capaian Bulanan (2025)</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Progres perkembangan rata-rata indikator kinerja dari bulan ke bulan
                  </p>
                </div>
              </div>
              <div className="card-body">
                <div style={{ height: '240px' }}>
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Korelasi Capaian Kinerja vs Serapan Anggaran</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Titik program; posisi ideal di kuadran kanan atas
                  </p>
                </div>
              </div>
              <div className="card-body">
                <div style={{ height: '240px' }}>
                  <Line data={correlationData} options={correlationOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 Program & Attention Programs Highlights */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>🏆 Top 5 Program Terbaik</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Program dengan tingkat capaian fisik tertinggi (Klik untuk detail)
                  </p>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {sortedTopPrograms.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => setDetailItem(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', transition: 'background 0.15s ease' }}
                      className="hover-row"
                    >
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', background: '#0f2744', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#2563eb' }}>
                          {p.nama}
                        </div>
                        <div className="progress-bar" style={{ marginTop: '4px' }}>
                          <div className="progress-track" style={{ height: '6px' }}>
                            <div className={`progress-fill ${getProgressColor(p.capaian)}`} style={{ width: `${Math.min(p.capaian || 0, 100)}%`, height: '6px' }} />
                          </div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: Math.min(p.capaian || 0, 100) >= 90 ? 'var(--green)' : 'var(--orange)' }}>
                        {Math.min(p.capaian || 0, 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>⚠ 5 Program Perlu Perhatian</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Program dengan tingkat capaian fisik di bawah target (Klik untuk detail)
                  </p>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {sortedAttentionPrograms.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => setDetailItem(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', transition: 'background 0.15s ease' }}
                      className="hover-row"
                    >
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: (p.capaian || 0) < 80 ? 'var(--orange)' : '#00a86b', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#2563eb' }}>
                          {p.nama}
                        </div>
                        <div className="progress-bar" style={{ marginTop: '4px' }}>
                          <div className="progress-track" style={{ height: '6px' }}>
                            <div className={`progress-fill ${getProgressColor(p.capaian)}`} style={{ width: `${Math.min(p.capaian || 0, 100)}%`, height: '6px' }} />
                          </div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: Math.min(p.capaian || 0, 100) < 80 ? 'var(--orange)' : 'var(--green)' }}>
                        {Math.min(p.capaian || 0, 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Program Table Preview */}
          <div className="card">
            <div className="card-header">
              <h3>Daftar Program Terbaru</h3>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/program')}>
                Lihat Semua Program ({scopedPrograms.length})
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>NAMA PROGRAM</th>
                      <th>BIDANG</th>
                      <th>CAPAIAN FISIK</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedPrograms.slice(0, 5).map(p => (
                      <tr key={p.id} style={{ cursor: 'pointer' }}>
                        <td onClick={() => setDetailItem(p)}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#2563eb' }}>{p.nama}</div>
                        </td>
                        <td onClick={() => setDetailItem(p)}><span className={`badge-bidang badge-${getBidangColor(p.bidang)}`}>{p.bidang}</span></td>
                        <td onClick={() => setDetailItem(p)}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{Math.min(p.capaian || 0, 100)}%</span>
                        </td>
                        <td onClick={() => setDetailItem(p)}><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal for Dashboard */}
      {detailItem && (
        <Modal
          isOpen={!!detailItem}
          size="lg"
          title={`Detail Program: [${detailItem.kode || '-'}] ${detailItem.nama}`}
          onClose={() => setDetailItem(null)}
        >
          <div style={{ padding: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="code-badge" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>{detailItem.kode || '01.2.01'}</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f2744', marginTop: '8px', marginBottom: '4px' }}>{detailItem.nama}</h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Hirarki: <strong>Program Utama (Top Level)</strong></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <StatusBadge status={detailItem.status || 'Dalam Proses'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bidang Utama</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>{detailItem.bidang || 'Sekretariat'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Anggaran Pagu (Rp)</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                  Rp {(detailItem.anggaranPagu || detailItem.anggaran || 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ketercapaian Kinerja</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                  {detailItem.capaian !== undefined ? detailItem.capaian : 96}%
                </div>
              </div>
            </div>

            <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: '2px' }}>SASARAN PROGRAM:</strong>
                <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{detailItem.sasaran || detailItem.deskripsi || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: '2px' }}>INDIKATOR PROGRAM:</strong>
                  <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{detailItem.indikator || 'SAKIP'}</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: '2px' }}>TARGET PROGRAM:</strong>
                  <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{detailItem.target || '-'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setDetailItem(null)}>Tutup</button>
              <button className="btn btn-primary" onClick={() => { setDetailItem(null); navigate('/program'); }}>
                <Edit3 size={15} style={{ marginRight: '6px' }} /> Ke Halaman Program
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
