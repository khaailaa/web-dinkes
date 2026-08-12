import { useState, useMemo } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FilterSearchBar from '../components/FilterSearchBar';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { formatAnggaranShort, statusList, BIDANG_UTAMA_LIST, normalizeBidangUtama, isItemInUserBidang } from '../data/initialData';
import { usePrograms } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext';
import { Plus, FolderKanban, CheckCircle2, Clock, XCircle, Trash2, Edit3, Loader2 } from 'lucide-react';

const emptyForm = {
  kode: '',
  nama: '',
  sasaran: '',
  indikator: '',
  target: '',
  bidang: 'Bidang Kesehatan Masyarakat (Kesmas)',
  capaian: 0,
  anggaranPagu: 0,
  status: 'Dalam Proses',
  tahun: 2025,
  deskripsi: '',
};

export default function Program() {
  const { programs, loading, addProgram, updateProgram, deleteProgram } = usePrograms();
  const { state, dispatch } = useApp();
  const user = state.currentUser;

  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterBidang, setFilterBidang] = useState('Semua');
  const [filterAnggaran, setFilterAnggaran] = useState('Semua');
  const [saving, setSaving] = useState(false);

  const userBidang = user?.canViewAllBidang ? null : user?.bidang;

  // Base data filtered by user's assigned bidang AND selected bidang filter
  const userScopedPrograms = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return programs;
    return programs.filter(p => isItemInUserBidang(p.bidang, userBidang));
  }, [programs, userBidang]);

  const bidangFilteredData = useMemo(() => {
    if (!filterBidang || filterBidang === 'Semua') return userScopedPrograms;
    return userScopedPrograms.filter(p => isItemInUserBidang(p.bidang, filterBidang));
  }, [userScopedPrograms, filterBidang]);

  const stats = useMemo(() => ({
    total: bidangFilteredData.length,
    tercapai: bidangFilteredData.filter(p => p.status === 'Tercapai').length,
    proses: bidangFilteredData.filter(p => p.status === 'Dalam Proses').length,
    belum: bidangFilteredData.filter(p => p.status === 'Belum Tercapai').length,
  }), [bidangFilteredData]);

  const filtered = useMemo(() => {
    let result = bidangFilteredData.filter(p => {
      const matchSearch = (p.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.kode && p.kode.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'Semua' || p.status === filterStatus;

      let matchAnggaran = true;
      const val = p.anggaranPagu || p.anggaran || 0;
      if (filterAnggaran === 'small') matchAnggaran = val < 100000000;
      else if (filterAnggaran === 'medium') matchAnggaran = val >= 100000000 && val <= 1000000000;
      else if (filterAnggaran === 'large') matchAnggaran = val > 1000000000;

      return matchSearch && matchStatus && matchAnggaran;
    });

    if (filterAnggaran === 'desc') {
      result = [...result].sort((a, b) => (b.anggaranPagu || b.anggaran || 0) - (a.anggaranPagu || a.anggaran || 0));
    } else if (filterAnggaran === 'asc') {
      result = [...result].sort((a, b) => (a.anggaranPagu || a.anggaran || 0) - (b.anggaranPagu || b.anggaran || 0));
    }

    return result;
  }, [bidangFilteredData, search, filterStatus, filterAnggaran]);

  const openAdd = () => {
    setEditItem(null);
    const defaultB = (!user?.canViewAllBidang && user?.bidang && user.bidang !== 'Semua')
      ? normalizeBidangUtama(user.bidang)
      : BIDANG_UTAMA_LIST[0];
    setForm({ ...emptyForm, bidang: defaultB });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) {
      alert('Nama Program wajib diisi');
      return;
    }

    try {
      setSaving(true);
      if (editItem) {
        await updateProgram(editItem.id, form);
        dispatch({ type: 'UPDATE_PROGRAM', payload: { ...form, id: editItem.id } });
      } else {
        const added = await addProgram(form);
        const newId = added?.[0]?.id || Date.now();
        dispatch({ type: 'ADD_PROGRAM', payload: { ...form, id: newId } });
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditItem(null);
    } catch (err) {
      alert('Gagal menyimpan program: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      setSaving(true);
      await deleteProgram(id);
      dispatch({ type: 'DELETE_PROGRAM', payload: id });
      setShowDelete(null);
    } catch (err) {
      alert('Gagal menghapus program: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <h1>Program (Hirarki Utama)</h1>
          <p>Daftar Program Kerja Dinas Kesehatan Kabupaten Garut</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Tambah Program
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          label="TOTAL PROGRAM"
          value={stats.total}
          color="blue"
          icon={<FolderKanban size={24} />}
          onClick={() => setFilterStatus('Semua')}
          active={filterStatus === 'Semua'}
        />
        <StatCard
          label="TERCAPAI"
          value={stats.tercapai}
          color="green"
          icon={<CheckCircle2 size={24} />}
          onClick={() => setFilterStatus('Tercapai')}
          active={filterStatus === 'Tercapai'}
        />
        <StatCard
          label="DALAM PROSES"
          value={stats.proses}
          color="orange"
          icon={<Clock size={24} />}
          onClick={() => setFilterStatus('Dalam Proses')}
          active={filterStatus === 'Dalam Proses'}
        />
        <StatCard
          label="BELUM TERCAPAI"
          value={stats.belum}
          color="red"
          icon={<XCircle size={24} />}
          onClick={() => setFilterStatus('Belum Tercapai')}
          active={filterStatus === 'Belum Tercapai'}
        />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <FilterSearchBar
            searchTerm={search}
            onSearchChange={setSearch}
            filterValue={filterStatus}
            onFilterChange={setFilterStatus}
            filterOptions={statusList}
            filterLabel="Semua Status"
            bidangValue={filterBidang}
            onBidangChange={setFilterBidang}
            anggaranValue={filterAnggaran}
            onAnggaranChange={setFilterAnggaran}
            placeholder="Cari kode atau nama program..."
          />
        </div>

        <div className="data-table-wrapper">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
              <div>Memuat data Program...</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>KODE</th>
                  <th>NAMA PROGRAM</th>
                  <th>BIDANG UTAMA</th>
                  <th>SASARAN</th>
                  <th>INDIKATOR</th>
                  <th>TARGET</th>
                  <th>ANGGARAN PAGU</th>
                  <th>KETERCAPAIAN</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const pct = (item.capaian !== undefined && item.capaian !== null && item.capaian !== '')
                    ? Number(item.capaian)
                    : (item.status === 'Tercapai' ? 100 : item.status === 'Belum Tercapai' ? 45 : 75);

                  let barColor = '#4caf50';
                  if (pct < 50) barColor = '#f44336';
                  else if (pct < 75) barColor = '#ff9800';
                  else if (pct < 90) barColor = '#2196f3';

                  return (
                    <tr key={item.id} style={{ cursor: 'pointer' }}>
                      <td onClick={() => setDetailItem(item)}><span className="code-badge">{item.kode || '-'}</span></td>
                      <td onClick={() => setDetailItem(item)}>
                        <div style={{ fontWeight: 600, color: '#2196f3' }}>{item.nama}</div>
                      </td>
                      <td onClick={() => setDetailItem(item)}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                          {item.bidang || 'Bidang Kesehatan Masyarakat (Kesmas)'}
                        </span>
                      </td>
                      <td onClick={() => setDetailItem(item)}><div style={{ fontSize: '0.82rem' }}>{item.sasaran || item.deskripsi || '-'}</div></td>
                      <td onClick={() => setDetailItem(item)}><div style={{ fontSize: '0.82rem' }}>{item.indikator || 'SAKIP'}</div></td>
                      <td onClick={() => setDetailItem(item)}><div style={{ fontSize: '0.82rem', textAlign: 'center' }}>{item.target || '-'}</div></td>
                      <td onClick={() => setDetailItem(item)}>{formatAnggaranShort(item.anggaranPagu)}</td>
                      <td onClick={() => setDetailItem(item)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(Math.max(pct, 0), 100)}%`, background: barColor, borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', minWidth: '38px', textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </td>
                      <td onClick={() => setDetailItem(item)}><StatusBadge status={item.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>
                            <Edit3 size={14} /> Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(item.id)}>
                            <Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state">
                        <div className="icon">📂</div>
                        <h3>Tidak ada data</h3>
                        <p>Belum ada program yang sesuai filter</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? 'Edit Program' : 'Tambah Program'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setShowModal(false); setEditItem(null); }}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Program'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Kode Program</label>
            <input className="form-input" placeholder="Contoh: 01.2.01"
              value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Bidang Utama</label>
            <select className="form-select" value={form.bidang} onChange={e => setForm({ ...form, bidang: e.target.value })}>
              {BIDANG_UTAMA_LIST.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nama Program <span className="required">*</span></label>
          <input className="form-input" placeholder="Contoh: PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH KABUPATEN/KOTA"
            value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Sasaran Program</label>
          <input className="form-input" placeholder="Contoh: Meningkatnya Penunjang Urusan Pemerintah Daerah"
            value={form.sasaran} onChange={e => setForm({ ...form, sasaran: e.target.value })} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Indikator Program</label>
            <input className="form-input" placeholder="Contoh: SAKIP"
              value={form.indikator} onChange={e => setForm({ ...form, indikator: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Target Program</label>
            <input className="form-input" placeholder="Contoh: 83"
              value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Anggaran Pagu (Rp)</label>
            <input className="form-input" type="number" value={form.anggaranPagu}
              onChange={e => setForm({ ...form, anggaranPagu: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Capaian / Ketercapaian (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={form.capaian || 0}
              onChange={e => setForm({ ...form, capaian: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="Dalam Proses">Dalam Proses</option>
              <option value="Tercapai">Tercapai</option>
              <option value="Belum Tercapai">Belum Tercapai</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!showDelete}
        onClose={() => setShowDelete(null)}
        onConfirm={() => handleDelete(showDelete)}
        itemName="program ini"
      />

      {/* Detail Modal */}
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
              <button className="btn btn-primary" onClick={() => { const item = detailItem; setDetailItem(null); openEdit(item); }}>
                <Edit3 size={15} style={{ marginRight: '6px' }} /> Edit Program Ini
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
