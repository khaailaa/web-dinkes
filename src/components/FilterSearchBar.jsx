import { Search, Filter, DollarSign, Building2 } from 'lucide-react';
import { bidangList } from '../data/initialData';

export default function FilterSearchBar({
  searchTerm,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterLabel = 'Semua Status',
  bidangValue,
  onBidangChange,
  bidangOptions,
  bidangLabel = 'Semua Bidang',
  anggaranValue,
  onAnggaranChange,
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
      {/* Search Input */}
      <div className="search-box" style={{ flex: '1 1 240px', minWidth: '220px', position: 'relative' }}>
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

      {/* Filter Bidang / Sub Bagian (if handler provided) */}
      {onBidangChange && (
        <div style={{ position: 'relative', minWidth: '170px' }}>
          <select
            className="form-select"
            value={bidangValue || 'Semua'}
            onChange={(e) => onBidangChange(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 500 }}
          >
            <option value="Semua">{bidangLabel}</option>
            {(bidangOptions || bidangList).map((b) => (
              <option key={b} value={b}>
                {b.startsWith('Seksi') || b.startsWith('Subbagian') || b.startsWith('Umum') || b.startsWith('Bidang') || b === 'Sekretariat' ? b : `Bidang ${b}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter Anggaran (if handler provided) */}
      {onAnggaranChange && (
        <div style={{ position: 'relative', minWidth: '160px' }}>
          <select
            className="form-select"
            value={anggaranValue || 'Semua'}
            onChange={(e) => onAnggaranChange(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 500 }}
          >
            <option value="Semua">Semua Anggaran</option>
            <option value="small">&lt; 100 Juta</option>
            <option value="medium">100 Jt - 1 Miliar</option>
            <option value="large">&gt; 1 Miliar</option>
            <option value="desc">Anggaran Terbesar</option>
            <option value="asc">Anggaran Terkecil</option>
          </select>
        </div>
      )}

      {/* Filter Status */}
      {filterOptions.length > 0 && onFilterChange && (
        <div style={{ position: 'relative', minWidth: '150px' }}>
          <select
            className="form-select"
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 500 }}
          >
            <option value="Semua">{filterLabel}</option>
            {filterOptions.map((opt) => (
              <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                {typeof opt === 'string' ? opt : opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
