import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import RoleQuickSwitcher from '../components/RoleQuickSwitcher';
import { formatAnggaranShort, getBidangColor, chartData, bidangList } from '../data/initialData';
import { usePrograms, useKegiatan, useSubKegiatan } from '../hooks/useSupabase';
import {
  FolderKanban, CalendarCheck, ListChecks, Building2,
  CheckCircle2, XCircle, TrendingUp, Wallet, Download, Loader2
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

  const { programs, loading: loadingPrograms } = usePrograms();
  const { kegiatan, loading: loadingKegiatan } = useKegiatan();
  const { subKegiatan, loading: loadingSub } = useSubKegiatan();

  const loading = loadingPrograms || loadingKegiatan || loadingSub;

  const currentUser = state.currentUser;
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

  const stats = useMemo(() => {
    const tercapai = scopedPrograms.filter(p => p.status === 'Tercapai').length;
    const belumTercapai = scopedPrograms.filter(p => p.status === 'Belum Tercapai').length;
    const totalAnggaran = scopedPrograms.reduce((sum, p) => sum + (p.anggaranPagu || 0), 0);
    const totalRealisasi = scopedPrograms.reduce((sum, p) => sum + (p.anggaranRealisasi || 0), 0);
    const avgCapaian = scopedPrograms.length > 0
      ? Math.round(scopedPrograms.reduce((sum, p) => sum + (p.capaian || 0), 0) / scopedPrograms.length)
      : 0;
    const realisasiPersen = totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 100) : 0;

    return {
      totalProgram: scopedPrograms.length,
      totalKegiatan: scopedKegiatan.length,
      totalSubKegiatan: scopedSubKegiatan.length,
      totalBidang: userBidang && userBidang !== 'Semua' ? 1 : bidangList.length,
      tercapai,
      belumTercapai,
      avgCapaian,
      realisasiPersen,
      totalAnggaran,
      totalRealisasi,
    };
  }, [scopedPrograms, scopedKegiatan, scopedSubKegiatan, userBidang]);

  const statusCounts = useMemo(() => ({
    tercapai: scopedPrograms.filter(p => p.status === 'Tercapai').length,
    proses: scopedPrograms.filter(p => p.status === 'Dalam Proses').length,
    belum: scopedPrograms.filter(p => p.status === 'Belum Tercapai').length,
  }), [scopedPrograms]);

  // Bar chart config
  const barChartData = {
    labels: chartData.capaianPerBidang.labels,
    datasets: [
      {
        label: 'Realisasi',
        data: chartData.capaianPerBidang.realisasi,
        backgroundColor: '#1a3a5c',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Target',
        data: chartData.capaianPerBidang.target,
        backgroundColor: '#cbd5e1',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12, family: 'Inter' } } },
      tooltip: { backgroundColor: '#1a2332', titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter' } },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { size: 11, family: 'Inter' } }, grid: { color: '#f0f0f0' } },
      x: { ticks: { font: { size: 11, family: 'Inter' } }, grid: { display: false } },
    },
  };

  // Line chart - Perkembangan Bulanan
  const lineChartData = {
    labels: chartData.perkembanganBulanan.labels,
    datasets: [{
      label: 'Capaian %',
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

  // Doughnut chart - Status Program
  const doughnutData = {
    labels: ['Tercapai', 'Dalam Proses', 'Belum Tercapai'],
    datasets: [{
      data: [statusCounts.tercapai, statusCounts.proses, statusCounts.belum],
      backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 12, family: 'Inter' } } },
    },
  };

  return (
    <div className="fade-in">
      {/* Quick Role Switcher Banner */}
      <RoleQuickSwitcher />

      {/* Page Header */}
      <div className="page-header-actions mb-3">
        <div className="page-header">
          <h1>Dashboard Kinerja Renstra</h1>
          <p>
            {userBidang && userBidang !== 'Semua'
              ? `Ringkasan Kinerja & Realisasi Khusus Bidang ${userBidang} — Tahun 2025`
              : 'Sistem Informasi Perencanaan & Capaian Kinerja Dinas Kesehatan Kabupaten Garut 2025'}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Download size={16} /> Ekspor Laporan
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 16px auto' }} />
          <h3>Memuat data Dashboard dari Supabase Database...</h3>
        </div>
      ) : (
        <>
          {/* Main Top Stat Cards Grid */}
          <div className="stats-grid">
            <StatCard
              label="TOTAL PROGRAM"
              value={stats.totalProgram}
              color="blue"
              icon={<FolderKanban size={24} />}
              subtitle={`${stats.tercapai} program telah mencapai target`}
              badge={`${stats.tercapai} Tercapai`}
              badgeType="success"
            />
            <StatCard
              label="TOTAL KEGIATAN"
              value={stats.totalKegiatan}
              color="green"
              icon={<ListChecks size={24} />}
              subtitle="Tersebar di seluruh bidang Dinkes"
              badge="Aktif"
              badgeType="info"
            />
            <StatCard
              label="TOTAL SUB KEGIATAN"
              value={stats.totalSubKegiatan}
              color="teal"
              icon={<CalendarCheck size={24} />}
              subtitle="Pelaksanaan di lapangan & puskesmas"
              badge="Terjadwal"
              badgeType="info"
            />
            <StatCard
              label="JUMLAH BIDANG"
              value={stats.totalBidang}
              color="purple"
              icon={<Building2 size={24} />}
              subtitle="Bidang & sekretariat Dinkes"
              badge="Garut"
              badgeType="info"
            />
          </div>

          {/* Secondary Kinerja & Anggaran Stat Grid */}
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            <div className="card">
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

            <div className="card">
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

            <div className="card">
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

            <div className="card">
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

          {/* Charts Row */}
          <div className="grid-3-1" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="card-header">
                <h3>Capaian Per Bidang (Target vs Realisasi)</h3>
                <span className="badge badge-info">2025</span>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: '280px' }}>
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Status Program</h3>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: '240px' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Line Chart & Recent Activity */}
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3>Perkembangan Capaian Bulanan (2025)</h3>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: '240px' }}>
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </div>
            </div>

            {/* Program Table Preview */}
            <div className="card">
              <div className="card-header">
                <h3>Daftar Program Supabase Terbaru</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>NAMA PROGRAM</th>
                        <th>BIDANG</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programs.slice(0, 5).map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.nama}</div>
                          </td>
                          <td><span className={`badge-bidang badge-${getBidangColor(p.bidang)}`}>{p.bidang}</span></td>
                          <td><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
