export default function StatCard({ label, value, desc, trend, trendDir, icon, color }) {
  return (
    <div className={`stat-card ${color}`}>
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
