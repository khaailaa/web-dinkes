import { Search } from 'lucide-react';

export default function FilterSearchBar({
  searchTerm,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterLabel = 'Semua',
  placeholder = 'Cari...'
}) {
  return (
    <div className="filter-bar" style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '20px',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      <div className="search-box" style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingLeft: '38px', width: '100%' }}
        />
      </div>
      {filterOptions.length > 0 && (
        <select
          className="form-select"
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          style={{ minWidth: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        >
          <option value="Semua">{filterLabel}</option>
          {filterOptions.map((opt) => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
