import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ACCOUNT_PRESETS } from '../data/initialData';
import { Eye, EyeOff, Folder, UserCheck, ChevronRight, Check } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    // Match preset account or generate custom user profile
    const matchedAccount = ACCOUNT_PRESETS.find(
      acc => acc.username.toLowerCase() === username.trim().toLowerCase()
    );

    let userPayload;
    if (matchedAccount) {
      userPayload = matchedAccount;
    } else {
      userPayload = {
        id: Date.now(),
        nama: username.toUpperCase(),
        username: username,
        role: 'Pengguna Sistem',
        roleKey: 'admin',
        bidang: 'Semua',
        email: `${username}@dinkesgarut.go.id`,
        canManageUsers: true,
        canViewTree: true,
        canViewAllBidang: true,
      };
    }

    dispatch({
      type: 'SET_USER',
      payload: userPayload,
    });

    navigate('/');
  };

  const selectPresetAccount = (acc) => {
    setSelectedRole(acc.id);
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');

    dispatch({
      type: 'SET_USER',
      payload: acc,
    });
    navigate('/');
  };

  return (
    <div className="login-wrapper">
      {/* Left Panel - Hero Banner & Role Cards */}
      <div className="login-hero" style={{ overflowY: 'auto', padding: '36px 40px' }}>
        <div className="login-hero-circle-1" />
        <div className="login-hero-circle-2" />

        <div className="login-hero-content" style={{ maxWidth: '640px' }}>
          <div className="login-logo-box">
            <span className="login-logo-emoji">🏥</span>
          </div>

          <div className="login-subtitle-top">PEMERINTAH KABUPATEN GARUT</div>
          <h1 className="login-hero-title">Dinas Kesehatan<br />Kabupaten Garut</h1>
          <p className="login-hero-desc">Sistem Informasi Perencanaan Program & Kegiatan (SIPK v2.5)</p>

          <div style={{
            marginTop: '24px',
            marginBottom: '12px',
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <UserCheck size={16} /> Pilih Akun Login Akses Bidang:
          </div>

          {/* Grid of 6 Accounts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
            width: '100%',
          }}>
            {ACCOUNT_PRESETS.map((acc) => {
              const isSelected = selectedRole === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => selectPresetAccount(acc)}
                  style={{
                    background: isSelected
                      ? 'rgba(255, 255, 255, 0.22)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: isSelected
                      ? '2px solid #64b5f6'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(8px)',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      background: 'rgba(255,255,255,0.25)',
                      color: '#ffffff',
                    }}>
                      {acc.badgeText}
                    </span>
                    {isSelected && <Check size={16} style={{ color: '#64b5f6' }} />}
                  </div>

                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                    {acc.nama}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>
                    {acc.deskripsi}
                  </div>

                  <div style={{
                    marginTop: '8px',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    color: '#e0e0e0',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}>
                    User: <strong>{acc.username}</strong> | Pass: <strong>{acc.password}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form Container */}
      <div className="login-form-container">
        <div className="login-form-box">
          <div className="login-folder-icon">
            <Folder size={24} style={{ color: '#ff9800' }} />
          </div>

          <h2 className="login-title">Selamat Datang</h2>
          <p className="login-subtitle">Masuk ke Sistem Informasi Perencanaan Dinas Kesehatan Kabupaten Garut</p>

          {error && <div className="login-error-alert">⚠ {error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group mb-2">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Password</label>
              <div className="login-password-input-wrapper">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-submit-btn" style={{ marginTop: '12px' }}>
              Masuk sebagai {ACCOUNT_PRESETS.find(a => a.username === username)?.role || 'Pengguna'} <ChevronRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '12px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b' }}>
            💡 <strong>Panduan Akses Role:</strong>
            <ul style={{ paddingLeft: '16px', marginTop: '6px', marginBottom: 0, lineHeight: 1.4 }}>
              <li><strong>Sekretariat (admin)</strong>: Akses penuh 100% semua fitur</li>
              <li><strong>Bidang (kesmas, p2p, yankes, sdk)</strong>: Akses khusus bidang masing-masing (Tanpa Bagan Pohon & Manajemen Pengguna)</li>
              <li><strong>Kepala Dinas (kadin)</strong>: Akses seluruh bidang & bagan pohon (Tanpa Manajemen Pengguna)</li>
            </ul>
          </div>

          <div className="login-copyright">
            © 2025 Dinas Kesehatan Kabupaten Garut · SIPK v2.5
          </div>
        </div>
      </div>
    </div>
  );
}
