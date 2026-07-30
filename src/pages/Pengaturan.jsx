import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Shield, Bell, Database, Save, AlertTriangle, Download, Upload, RotateCcw } from 'lucide-react';

export default function Pengaturan() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('umum');
  const [saved, setSaved] = useState(false);

  // Form states
  const [formUmum, setFormUmum] = useState({
    namaInstansi: 'Dinas Kesehatan Kabupaten Garut',
    alamat: 'Jl. Pembangunan No. 1, Garut, Jawa Barat 44151',
    telepon: '(0262) 232773',
    email: 'dinkes@garutkab.go.id',
    website: 'https://dinkes.garutkab.go.id',
    tahunAnggaran: 2025,
    jumlahPuskesmas: 67,
    jumlahKecamatan: 42,
  });

  const [formAkun, setFormAkun] = useState({
    passwordLama: '',
    passwordBaru: '',
    konfirmasiPassword: '',
  });

  const [notif, setNotif] = useState({
    emailNotif: true,
    deadlineNotif: true,
    lowCapaianNotif: true,
    weeklyDigest: false,
  });

  const tabs = [
    { id: 'umum', label: 'Umum', icon: Settings },
    { id: 'akun', label: 'Keamanan Akun', icon: Shield },
    { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
    { id: 'data', label: 'Backup & Data', icon: Database },
  ];

  const handleSave = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { ...formUmum, ...notif } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetDemo = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset data demo ke kondisi awal?')) {
      dispatch({ type: 'RESET_DATA' });
      window.location.reload();
    }
  };

  const handleExportBackup = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sipk_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Pengaturan</h1>
        <p>Konfigurasi sistem Informasi perencanaan Dinas Kesehatan Kabupaten Garut</p>
      </div>

      <div className="settings-grid">
        {/* Left Navigation Tabs */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body" style={{ padding: '8px' }}>
            <nav className="settings-nav">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="card">
          <div className="card-body settings-content">
            {/* Tab 1: Umum */}
            {activeTab === 'umum' && (
              <div className="fade-in">
                <h3 style={{ marginBottom: '20px', fontSize: '1.05rem', fontWeight: 700 }}>Pengaturan Umum</h3>

                <div className="form-group">
                  <label className="form-label">Nama Instansi</label>
                  <input
                    className="form-input"
                    value={formUmum.namaInstansi}
                    onChange={e => setFormUmum({ ...formUmum, namaInstansi: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={formUmum.alamat}
                    onChange={e => setFormUmum({ ...formUmum, alamat: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Telepon</label>
                    <input
                      className="form-input"
                      value={formUmum.telepon}
                      onChange={e => setFormUmum({ ...formUmum, telepon: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={formUmum.email}
                      onChange={e => setFormUmum({ ...formUmum, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      className="form-input"
                      value={formUmum.website}
                      onChange={e => setFormUmum({ ...formUmum, website: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tahun Anggaran Aktif</label>
                    <select
                      className="form-select"
                      value={formUmum.tahunAnggaran}
                      onChange={e => setFormUmum({ ...formUmum, tahunAnggaran: parseInt(e.target.value) })}
                    >
                      <option value={2025}>2025</option>
                      <option value={2024}>2024</option>
                      <option value={2023}>2023</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Jumlah Puskesmas</label>
                    <input
                      className="form-input"
                      type="number"
                      value={formUmum.jumlahPuskesmas}
                      onChange={e => setFormUmum({ ...formUmum, jumlahPuskesmas: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jumlah Kecamatan</label>
                    <input
                      className="form-input"
                      type="number"
                      value={formUmum.jumlahKecamatan}
                      onChange={e => setFormUmum({ ...formUmum, jumlahKecamatan: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Informasi Sistem Section */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Informasi Sistem</h4>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Versi Sistem</span>
                      <strong style={{ fontFamily: 'monospace' }}>SIPK v2.1.0</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Framework</span>
                      <strong>Laravel 11 + React 19</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Database</span>
                      <strong>PostgreSQL 16</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Server</span>
                      <strong>Ubuntu 22.04 LTS</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Keamanan Akun */}
            {activeTab === 'akun' && (
              <div className="fade-in">
                <h3 style={{ marginBottom: '20px', fontSize: '1.05rem', fontWeight: 700 }}>Keamanan Akun</h3>

                {/* Info Active Profile Banner */}
                <div style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: '#e3f2fd',
                  border: '1px solid #bbdefb', color: '#1565c0', fontSize: '0.85rem', fontWeight: 600,
                  marginBottom: '20px'
                }}>
                  Profil Aktif: Administrator Sistem · admin@dinkesgarut.go.id · Superadmin
                </div>

                <div className="form-group">
                  <label className="form-label">Password Lama</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Masukkan password lama"
                    value={formAkun.passwordLama}
                    onChange={e => setFormAkun({ ...formAkun, passwordLama: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password Baru</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={formAkun.passwordBaru}
                    onChange={e => setFormAkun({ ...formAkun, passwordBaru: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Konfirmasi Password Baru</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Ulangi password baru"
                    value={formAkun.konfirmasiPassword}
                    onChange={e => setFormAkun({ ...formAkun, konfirmasiPassword: e.target.value })}
                  />
                </div>

                {/* Yellow Alert Box */}
                <div style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: '#fff8e1',
                  border: '1px solid #ffe0b2', color: '#b78103', fontSize: '0.8rem', marginTop: '16px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <AlertTriangle size={16} />
                  <span>Pastikan password baru minimal 8 karakter, mengandung huruf besar, angka, dan karakter khusus.</span>
                </div>
              </div>
            )}

            {/* Tab 3: Notifikasi */}
            {activeTab === 'notifikasi' && (
              <div className="fade-in">
                <h3 style={{ marginBottom: '20px', fontSize: '1.05rem', fontWeight: 700 }}>Pengaturan Notifikasi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Notifikasi Email', desc: 'Kirim notifikasi via email saat ada update penting', key: 'emailNotif' },
                    { label: 'Notifikasi Deadline', desc: 'Ingatkan sebelum deadline pelaporan', key: 'deadlineNotif' },
                    { label: 'Notifikasi Capaian Rendah', desc: 'Peringatan saat capaian di bawah target', key: 'lowCapaianNotif' },
                    { label: 'Ringkasan Mingguan', desc: 'Kirim ringkasan kinerja setiap minggu', key: 'weeklyDigest' },
                  ].map(item => (
                    <div key={item.key} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                      </div>
                      <label style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={notif[item.key]}
                          onChange={e => setNotif({ ...notif, [item.key]: e.target.checked })}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          position: 'absolute', inset: 0, borderRadius: '12px', transition: 'all 0.2s',
                          background: notif[item.key] ? 'var(--blue)' : 'var(--border-medium)',
                        }}>
                          <span style={{
                            position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%',
                            background: 'white', transition: 'transform 0.2s', boxShadow: 'var(--shadow-sm)',
                            left: notif[item.key] ? '22px' : '2px',
                          }} />
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Backup & Data */}
            {activeTab === 'data' && (
              <div className="fade-in">
                <h3 style={{ marginBottom: '20px', fontSize: '1.05rem', fontWeight: 700 }}>Backup & Manajemen Data</h3>

                {/* Database Metadata Box */}
                <div style={{
                  background: '#f8fafc', padding: '16px 20px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px',
                  marginBottom: '24px', fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Backup Terakhir</span>
                    <strong style={{ fontFamily: 'monospace' }}>2025-07-19 02:00 WIB</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ukuran Database</span>
                    <strong>248 MB</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Record</span>
                    <strong>15,482</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Backup Berikutnya</span>
                    <strong style={{ fontFamily: 'monospace' }}>2025-07-20 02:00 WIB</strong>
                  </div>
                </div>

                {/* 4 Action Buttons Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={handleExportBackup}
                    style={{
                      padding: '14px', borderRadius: 'var(--radius-sm)', background: '#e3f2fd',
                      border: 'none', color: '#0f2744', fontWeight: 700, fontSize: '0.88rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                    }}
                  >
                    <Database size={16} /> Backup Sekarang
                  </button>

                  <button
                    onClick={() => alert('Ekspor data ke Excel berhasil!')}
                    style={{
                      padding: '14px', borderRadius: 'var(--radius-sm)', background: '#e8f5e9',
                      border: 'none', color: '#2e7d32', fontWeight: 700, fontSize: '0.88rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                    }}
                  >
                    <Download size={16} /> Ekspor ke Excel
                  </button>

                  <button
                    onClick={() => alert('Fitur Import Data JSON/SQL')}
                    style={{
                      padding: '14px', borderRadius: 'var(--radius-sm)', background: '#f3e5f5',
                      border: 'none', color: '#7b1fa2', fontWeight: 700, fontSize: '0.88rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                    }}
                  >
                    <Upload size={16} /> Import Data
                  </button>

                  <button
                    onClick={handleResetDemo}
                    style={{
                      padding: '14px', borderRadius: 'var(--radius-sm)', background: '#ffebee',
                      border: 'none', color: '#c62828', fontWeight: 700, fontSize: '0.88rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={16} /> Reset Data Demo
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Right Save Button */}
            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
              {saved && (
                <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>
                  ✓ Pengaturan berhasil disimpan
                </span>
              )}
              <button className="btn btn-primary" onClick={handleSave} style={{ background: '#0f2744', padding: '10px 24px' }}>
                <Save size={16} /> Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
