export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="page-header" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {Icon && (
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(33, 150, 243, 0.1)',
            color: '#2196f3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={24} />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
