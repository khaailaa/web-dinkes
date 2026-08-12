import { useState, useMemo } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FilterSearchBar from '../components/FilterSearchBar';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { formatAnggaranShort, statusList, getSubBidangOptions, normalizeBidangUtama, ALL_SUB_BIDANG_LIST, isItemInUserBidang } from '../data/initialData';
import { useSubKegiatan, useKegiatan, usePrograms } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext';
import { Plus, Search, Layers, CheckCircle2, Clock, XCircle, Trash2, Edit3, Loader2 } from 'lucide-react';

const emptyForm = {
  kode: '',
  nama: '',
  kegiatanId: '',
  sasaran: '',
  indikator: '',
  target: '',
  bidang: '',
  penanggungJawab: '',
  anggaran: 0,
  realisasi: 0,
  capaian: 0,
  status: 'Dalam Proses',
  tahun: 2025,
};

export default function SubKegiatan() {
  const { subKegiatan, loading, addSubKegiatan, updateSubKegiatan, deleteSubKegiatan } = useSubKegiatan();
  const { kegiatan } = useKegiatan();
  const { programs } = usePrograms();
  const { state, dispatch } = useApp();
  const currentUser = state.currentUser;
  const userBidang = currentUser?.bidang;

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

  const userBidangScope = currentUser?.canViewAllBidang ? null : currentUser?.bidang;

  const availableKegiatan = useMemo(() => {
    if (!userBidangScope || userBidangScope === 'Semua') return kegiatan;
    return kegiatan.filter(k => isItemInUserBidang(k.bidang, userBidangScope));
  }, [kegiatan, userBidangScope]);

  // Base data filtered by user's assigned bidang AND selected sub-bidang filter
  const userScopedSubKegiatan = useMemo(() => {
    if (!userBidangScope || userBidangScope === 'Semua') return subKegiatan;
    return subKegiatan.filter(s => isItemInUserBidang(s.bidang, userBidangScope));
  }, [subKegiatan, userBidangScope]);

  const bidangFilteredData = useMemo(() => {
    if (!filterBidang || filterBidang === 'Semua') return userScopedSubKegiatan;
    return userScopedSubKegiatan.filter(s => s.bidang === filterBidang);
  }, [userScopedSubKegiatan, filterBidang]);

  const stats = useMemo(() => ({
    total: bidangFilteredData.length,
    tercapai: bidangFilteredData.filter(s => s.status === 'Tercapai').length,
    proses: bidangFilteredData.filter(s => s.status === 'Dalam Proses').length,
    belum: bidangFilteredData.filter(s => s.status === 'Belum Tercapai').length,
  }), [bidangFilteredData]);

  const filtered = useMemo(() => {
    let result = bidangFilteredData.filter(s => {
      const matchSearch = (s.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.kode && s.kode.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'Semua' || s.status === filterStatus;

      let matchAnggaran = true;
      const val = s.anggaran || s.anggaranPagu || 0;
      if (filterAnggaran === 'small') matchAnggaran = val < 100000000;
      else if (filterAnggaran === 'medium') matchAnggaran = val >= 100000000 && val <= 1000000000;
      else if (filterAnggaran === 'large') matchAnggaran = val > 1000000000;

      return matchSearch && matchStatus && matchAnggaran;
    });

    if (filterAnggaran === 'desc') {
      result = [...result].sort((a, b) => (b.anggaran || b.anggaranPagu || 0) - (a.anggaran || a.anggaranPagu || 0));
    } else if (filterAnggaran === 'asc') {
      result = [...result].sort((a, b) => (a.anggaran || a.anggaranPagu || 0) - (b.anggaran || b.anggaranPagu || 0));
    }

    return result;
  }, [bidangFilteredData, search, filterStatus, filterAnggaran]);

  const selectedKeg = useMemo(() => {
    return kegiatan.find(k => String(k.id) === String(form.kegiatanId));
  }, [kegiatan, form.kegiatanId]);

  const parentProg = useMemo(() => {
    return programs.find(p => String(p.id) === String(selectedKeg?.programId));
  }, [programs, selectedKeg]);

  const parentBidangUtama = useMemo(() => {
    return parentProg?.bidang || selectedKeg?.bidang || 'Bidang Kesehatan Masyarakat (Kesmas)';
  }, [parentProg, selectedKeg]);

  const availableSubBidang = useMemo(() => {
    return getSubBidangOptions(parentBidangUtama);
  }, [parentBidangUtama]);

  const handleKegiatanChange = (kegId) => {
    const kegItem = kegiatan.find(k => String(k.id) === String(kegId));
    const progItem = programs.find(p => String(p.id) === String(kegItem?.programId));
    const subOpts = getSubBidangOptions(progItem?.bidang || kegItem?.bidang);
    setForm(prev => ({
      ...prev,
      kegiatanId: kegId,
      bidang: subOpts[0] || '',
    }));
  };

  const openAdd = () => {
    setEditItem(null);
    const firstKeg = availableKegiatan.length > 0 ? availableKegiatan[0] : (kegiatan.length > 0 ? kegiatan[0] : null);
    const progItem = programs.find(p => String(p.id) === String(firstKeg?.programId));
    const subOpts = getSubBidangOptions(progItem?.bidang || firstKeg?.bidang);
    setForm({
      ...emptyForm,
      kegiatanId: firstKeg ? firstKeg.id : '',
      bidang: subOpts[0] || '',
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const kId = item.kegiatanId || (availableKegiatan.length > 0 ? availableKegiatan[0].id : (kegiatan.length > 0 ? kegiatan[0].id : ''));
    const kegItem = kegiatan.find(k => String(k.id) === String(kId));
    const progItem = programs.find(p => String(p.id) === String(kegItem?.programId));
    const subOpts = getSubBidangOptions(progItem?.bidang || kegItem?.bidang);
    setForm({
      ...item,
      kegiatanId: kId,
      bidang: item.bidang && subOpts.includes(item.bidang) ? item.bidang : subOpts[0],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) {
      alert('Nama Sub Kegiatan wajib diisi');
      return;
    }
    if (!form.kegiatanId) {
      alert('Silakan pilih Kegiatan Parent terlebih dahulu');
      return;
    }

    try {
      setSaving(true);
      if (editItem) {
        await updateSubKegiatan(editItem.id, form);
        dispatch({ type: 'UPDATE_SUB_KEGIATAN', payload: { ...form, id: editItem.id } });
      } else {
        const added = await addSubKegiatan(form);
        const newId = added?.[0]?.id || Date.now();
        dispatch({ type: 'ADD_SUB_KEGIATAN', payload: { ...form, id: newId } });
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditItem(null);
    } catch (err) {
      alert('Gagal menyimpan sub kegiatan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      setSaving(true);
      await deleteSubKegiatan(id);
      dispatch({ type: 'DELETE_SUB_KEGIATAN', payload: id });
      setShowDelete(null);
    } catch (err) {
      alert('Gagal menghapus sub kegiatan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <h1>Sub Kegiatan</h1>
          <p>Daftar Sub Kegiatan Renstra Dinas Kesehatan Kabupaten Garut</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Tambah Sub Kegiatan
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          label="TOTAL SUB KEGIATAN"
          value={stats.total}
          color="blue"
          icon={<Layers size={24} />}
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
            bidangOptions={ALL_SUB_BIDANG_LIST}
            bidangLabel="Semua Sub Bagian / Seksi"
            anggaranValue={filterAnggaran}
            onAnggaranChange={setFilterAnggaran}
            placeholder="Cari kode atau nama sub kegiatan..."
          />
        </div>

        <div className="data-table-wrapper">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
              <div>Memuat data Sub Kegiatan...</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>KODE</th>
                  <th>NAMA SUB KEGIATAN</th>
                  <th>SUB-BIDANG / SEKSI</th>
                  <th>KEGIATAN PARENT</th>
                  <th>SASARAN</th>
                  <th>INDIKATOR</th>
                  <th>TARGET</th>
                  <th>ANGGARAN</th>
                  <th>KETERCAPAIAN</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const parentKeg = kegiatan.find(
                    k => String(k.id) === String(item.kegiatanId) || String(k.raw?.id) === String(item.kegiatanId)
                  );

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
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', background: '#f3e8ff', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                          {item.bidang || 'Seksi Kesehatan Keluarga dan Gizi'}
                        </span>
                      </td>
                      <td onClick={() => setDetailItem(item)}>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                          {parentKeg ? parentKeg.nama : (item.kegiatanNama || 'Kegiatan Perencanaan')}
                        </div>
                      </td>
                      <td onClick={() => setDetailItem(item)}><div style={{ fontSize: '0.82rem' }}>{item.sasaran || '-'}</div></td>
                      <td onClick={() => setDetailItem(item)}><div style={{ fontSize: '0.82rem' }}>{item.indikator || '-'}</div></td>
                      <td onClick={() => setDetailItem(item)}><div style={{ fontSize: '0.82rem', textAlign: 'center' }}>{item.target || '-'}</div></td>
                      <td onClick={() => setDetailItem(item)}>{formatAnggaranShort(item.anggaran)}</td>
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
                    <td colSpan={11}>
                      <div className="empty-state">
                        <div className="icon">📂</div>
                        <h3>Tidak ada data</h3>
                        <p>Belum ada sub kegiatan yang sesuai filter</p>
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
        title={editItem ? 'Edit Sub Kegiatan' : 'Tambah Sub Kegiatan'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setShowModal(false); setEditItem(null); }}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Sub Kegiatan'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Pilih Kegiatan Parent <span className="required">*</span></label>
          <select
            className="form-select"
            value={form.kegiatanId}
            onChange={e => handleKegiatanChange(e.target.value)}
          >
            <option value="">-- Pilih Kegiatan --</option>
            {kegiatan.map(k => (
              <option key={k.id} value={k.id}>
                {k.kode ? `[${k.kode}] ` : ''}{k.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Kode Sub Kegiatan</label>
            <input className="form-input" placeholder="Contoh: 01.2.01.0001.0001"
              value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">
              Anak Bidang / Seksi <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>(Induk: {normalizeBidangUtama(parentBidangUtama)})</span>
            </label>
            <select className="form-select" value={form.bidang} onChange={e => setForm({ ...form, bidang: e.target.value })}>
              {availableSubBidang.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nama Sub Kegiatan <span className="required">*</span></label>
          <input className="form-input" placeholder="Contoh: Penyusunan Dokumen Perencanaan Perangkat Daerah"
            value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Sasaran Sub Kegiatan</label>
          <input className="form-input" placeholder="Contoh: Tersusunnya Dokumen Rencana Pembangunan"
            value={form.sasaran} onChange={e => setForm({ ...form, sasaran: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Indikator Sub Kegiatan</label>
          <input className="form-input" placeholder="Contoh: Jumlah Dokumen Perencanaan Perangkat Daerah"
            value={form.indikator} onChange={e => setForm({ ...form, indikator: e.target.value })} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Target Sub Kegiatan</label>
            <input className="form-input" placeholder="Contoh: 4 Dokumen"
              value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Anggaran (Rp)</label>
            <input className="form-input" type="number" value={form.anggaran}
              onChange={e => setForm({ ...form, anggaran: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Capaian / Ketercapaian (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={form.capaian || 0}
              onChange={e => setForm({ ...form, capaian: parseInt(e.target.value) || 0 })} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Tercapai">Tercapai</option>
            <option value="Belum Tercapai">Belum Tercapai</option>
          </select>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!showDelete}
        onClose={() => setShowDelete(null)}
        onConfirm={() => handleDelete(showDelete)}
        itemName="sub kegiatan ini"
      />

      {/* Detail Modal */}
      {detailItem && (
        <Modal
          isOpen={!!detailItem}
          size="lg"
          title={`Detail Sub Kegiatan: [${detailItem.kode || '-'}] ${detailItem.nama}`}
          onClose={() => setDetailItem(null)}
        >
          <div style={{ padding: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="code-badge" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>{detailItem.kode || '01.2.01.0001.0001'}</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f2744', marginTop: '8px', marginBottom: '4px' }}>{detailItem.nama}</h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Induk Kegiatan: <strong style={{ color: '#9c27b0' }}>{kegiatan.find(k => String(k.id) === String(detailItem.kegiatanId))?.nama || detailItem.kegiatanNama || '-'}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <StatusBadge status={detailItem.status || 'Tercapai'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Sub-Bidang / Seksi</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#6b21a8', marginTop: '4px' }}>{detailItem.bidang || 'Seksi Kesehatan Keluarga dan Gizi'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Anggaran (Rp)</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                  Rp {(detailItem.anggaran || detailItem.anggaranPagu || 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ketercapaian Kinerja</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                  {detailItem.capaian !== undefined ? detailItem.capaian : 100}%
                </div>
              </div>
            </div>

            <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: '2px' }}>SASARAN SUB KEGIATAN:</strong>
                <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{detailItem.sasaran || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: '2px' }}>INDIKATOR SUB KEGIATAN:</strong>
                  <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{detailItem.indikator || '-'}</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: '2px' }}>TARGET SUB KEGIATAN:</strong>
                  <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{detailItem.target || '-'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setDetailItem(null)}>Tutup</button>
              <button className="btn btn-primary" onClick={() => { const item = detailItem; setDetailItem(null); openEdit(item); }}>
                <Edit3 size={15} style={{ marginRight: '6px' }} /> Edit Sub Kegiatan Ini
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
