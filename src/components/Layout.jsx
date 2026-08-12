import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useState, useEffect, useRef } from 'react';
import { ACCOUNT_PRESETS } from '../data/initialData';
import {
  LayoutDashboard, FileText, FolderKanban, CalendarCheck,
  ListChecks, BarChart3, FileSpreadsheet,
  Users, Settings, Search, Bell, Menu, ChevronRight, HelpCircle,
  User, LogOut, ShieldAlert, GitFork, Lock
} from 'lucide-react';

const rawMenuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: '#2196f3' },
  { path: '/program', label: 'Program', icon: FolderKanban, color: '#4caf50' },
  { path: '/kegiatan', label: 'Kegiatan', icon: CalendarCheck, color: '#f44336' },
  { path: '/sub-kegiatan', label: 'Sub Kegiatan', icon: ListChecks, color: '#9c27b0' },
  { divider: true },
  { path: '/laporan', label: 'Laporan', icon: FileSpreadsheet, color: '#607d8b' },
  { path: '/bagan-pohon', label: 'Bagan Pohon', icon: GitFork, color: '#8b5cf6' },
  { divider: true },
  { path: '/pengaturan', label: 'Pengaturan', icon: Settings, color: '#607d8b' },
];

export default function Layout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const { state, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const currentUser = state.currentUser || ACCOUNT_PRESETS[0];
  const roleKey = currentUser.roleKey || 'admin';

  const canViewTree = currentUser.canViewTree ?? (roleKey === 'admin' || roleKey === 'kadin');

  // Filter sidebar navigation menu items
  const menuItems = rawMenuItems.filter(item => {
    if (item.divider) return true;
    if (item.path === '/bagan-pohon' && !canViewTree) return false;
    return true;
  });

  const currentPage = rawMenuItems.find(m => m.path === location.pathname);
  const pageLabel = currentPage?.label || 'Dashboard';

  // Check direct URL access restrictions
  const isRestrictedRoute = location.pathname === '/bagan-pohon' && !canViewTree;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1024 && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileSidebarOpen]);

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setDesktopSidebarCollapsed(prev => !prev);
    }
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  // Avatar initial letter
  const avatarLetter = (currentUser.nama || 'A').charAt(0).toUpperCase();

  return (
    <div className={`app-layout ${desktopSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${mobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''} ${desktopSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🏥</div>
          {!desktopSidebarCollapsed && (
            <div className="sidebar-brand-text">
              <h2>SIPK Garut</h2>
              <p>Dinkes Kab. Garut</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            if (item.divider) {
              return <div key={`div-${index}`} className="sidebar-divider" />;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
                title={desktopSidebarCollapsed ? item.label : undefined}
                end={item.path === '/'}
              >
                <span className="dot" style={{ background: item.color }} />
                <Icon className="icon" size={18} />
                {!desktopSidebarCollapsed && <span className="sidebar-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" style={{ background: currentUser.roleKey === 'admin' ? '#7c4dff' : currentUser.roleKey === 'kadin' ? '#00bcd4' : '#4caf50' }}>
            {avatarLetter}
          </div>
          {!desktopSidebarCollapsed && (
            <div className="sidebar-user-info">
              <h4>{currentUser.nama}</h4>
              <p>{currentUser.role}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <button className="topbar-toggle" onClick={toggleSidebar} title="Toggle Sidebar">
            <Menu size={20} />
          </button>

          <div className="topbar-breadcrumb">
            <a href="/">Beranda</a>
            <ChevronRight size={14} />
            <span className="current">{pageLabel}</span>
          </div>

          {/* Active Scope Badge Indicator */}
          <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: roleKey === 'admin'
                ? '#f3e5f5'
                : roleKey === 'kadin'
                ? '#e0f7fa'
                : '#e8f5e9',
              color: roleKey === 'admin'
                ? '#7b1fa2'
                : roleKey === 'kadin'
                ? '#00838f'
                : '#2e7d32',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              {roleKey === 'admin' ? '👑' : roleKey === 'kadin' ? '👔' : '📍'}
              {currentUser.bidang === 'Semua' ? 'Akses Seluruh Bidang' : `Bidang ${currentUser.bidang}`}
            </span>
          </div>

          <div className="topbar-spacer" />

          <div className="topbar-search">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Cari program, kegiatan..." />
          </div>

          <div className="topbar-year">
            <select
              value={state.selectedYear}
              onChange={(e) => dispatch({ type: 'SET_YEAR', payload: parseInt(e.target.value) })}
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>

          {/* Notifications & Profile Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }} ref={dropdownRef}>
            <button className="topbar-notification" onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}>
              <Bell size={18} />
              <span className="badge" />
            </button>

            {notifDropdownOpen && (
              <div className="dropdown-menu notif-dropdown fade-in">
                <div className="dropdown-header">
                  <h4>Notifikasi Kinerja</h4>
                  <span className="badge-count">3 Baru</span>
                </div>
                <div className="dropdown-body">
                  <div className="notif-item unread">
                    <div className="notif-icon warning"><ShieldAlert size={16} /></div>
                    <div className="notif-text">
                      <p className="title">Notifikasi Sistem SIPK Garut</p>
                      <p className="time">Akses Role: {currentUser.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Trigger */}
            <div
              className="topbar-profile"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <div className="topbar-profile-avatar" style={{ background: roleKey === 'admin' ? '#7c4dff' : roleKey === 'kadin' ? '#00bcd4' : '#4caf50' }}>
                {avatarLetter}
              </div>
              <div className="topbar-profile-info">
                <h4>{currentUser.nama.split(' ')[0]}</h4>
                <p>{currentUser.bidang === 'Semua' ? currentUser.role : `Bidang ${currentUser.bidang}`}</p>
              </div>
            </div>

            {profileDropdownOpen && (
              <div className="dropdown-menu profile-dropdown fade-in">
                <div className="profile-dropdown-header">
                  <div className="avatar-large" style={{ background: roleKey === 'admin' ? '#7c4dff' : roleKey === 'kadin' ? '#00bcd4' : '#4caf50' }}>
                    {avatarLetter}
                  </div>
                  <div>
                    <h4>{currentUser.nama}</h4>
                    <p>{currentUser.email}</p>
                    <span className="role-badge" style={{ background: '#e3f2fd', color: '#1565c0' }}>
                      {currentUser.role}
                    </span>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => { setProfileDropdownOpen(false); navigate('/pengaturan'); }}>
                  <User size={16} /> Profil Saya
                </button>
                <button className="dropdown-item" onClick={() => { setProfileDropdownOpen(false); navigate('/pengaturan'); }}>
                  <Settings size={16} /> Pengaturan Sistem
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={16} /> Keluar (Logout)
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content Container */}
        <main className="page-content">
          {isRestrictedRoute ? (
            <div className="fade-in" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{
                maxWidth: '480px',
                margin: '0 auto',
                padding: '36px 28px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                border: '1px solid #fee2e2'
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: '#fef2f2', color: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px auto'
                }}>
                  <Lock size={32} />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                  Akses Halaman Dibatasi
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
                  Akun Anda <strong>({currentUser.role})</strong> tidak memiliki wewenang untuk membuka halaman ini. Halaman ini hanya tersedia untuk Sekretariat / Admin Perencanaan.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/')}
                  style={{ width: '100%' }}
                >
                  Kembali ke Dashboard Utama
                </button>
              </div>
            </div>
          ) : (
            children || <Outlet />
          )}
        </main>
      </div>

      {/* Help FAB */}
      <button className="fab-help" title="Bantuan Akses Role" onClick={() => alert(`Pengguna Saat Ini: ${currentUser.nama}\nRole: ${currentUser.role}\nAkses Bidang: ${currentUser.bidang}\n\nUntuk mengganti akun, silakan klik menu Profil -> Keluar.`)}>
        <HelpCircle size={22} />
      </button>
    </div>
  );
}
