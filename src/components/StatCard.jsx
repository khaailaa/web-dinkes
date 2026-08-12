import { useNavigate } from 'react-router-dom';

export default function StatCard({ label, value, desc, trend, trendDir, icon, color, to, onClick, active }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    }
  };

  const isInteractive = Boolean(onClick || to);

  const activeStyles = active ? {
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 2px var(--blue, #2196f3)',
    transform: 'translateY(-2px)',
    borderColor: '#2196f3',
  } : {};

  return (
    <div
      className={`stat-card ${color}`}
      onClick={handleClick}
      style={{
        cursor: isInteractive ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        ...activeStyles
      }}
      onMouseEnter={e => {
        if (isInteractive && !active) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={e => {
        if (isInteractive && !active) {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }
      }}
      title={isInteractive ? `Klik untuk filter / lihat data ${label}` : undefined}
    >
      <div className="stat-card-info">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {desc && <div className="stat-card-desc">{desc}</div>}
        {trend && (
          <div className={`stat-card-trend ${trendDir === 'up' ? 'up' : 'down'}`}>
            {trendDir === 'up' ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
      {icon && (
        <div className={`stat-card-icon ${color}`}>
          {icon}
        </div>
      )}
    </div>
  );
}
