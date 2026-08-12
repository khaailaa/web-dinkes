import { useState, useMemo } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FilterSearchBar from '../components/FilterSearchBar';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { formatAnggaranShort, statusList } from '../data/initialData';
import { useKegiatan, usePrograms } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext';
import { Plus, Search, ListChecks, CheckCircle2, Clock, XCircle, Trash2, Edit3, Loader2 } from 'lucide-react';

const emptyForm = {
  kode: '',
  nama: '',
  programId: '',
  sasaran: '',
  indikator: '',
  target: '',
  bidang: 'Kesmas',
  lokasi: '',
  penanggungJawab: '',
  anggaran: 0,
  realisasi: 0,
  capaian: 0,
  status: 'Dalam Proses',
  tahun: 2025,
};

export default function Kegiatan() {
  const { kegiatan, loading, addKegiatan, updateKegiatan, deleteKegiatan } = useKegiatan();
  const { programs } = usePrograms();
  const { state, dispatch } = useApp();
  const currentUser = state.currentUser;
  const userBidang = currentUser?.bidang;

  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterBidang, setFilterBidang] = useState('Semua');
  const [filterAnggaran, setFilterAnggaran] = useState('Semua');
  const [saving, setSaving] = useState(false);

  // Base data filtered by selected bidang (available for all roles)
  const bidangFilteredData = useMemo(() => {
    if (!filterBidang || filterBidang === 'Semua') return kegiatan;
    return kegiatan.filter(k => k.bidang === filterBidang);
  }, [kegiatan, filterBidang]);

  const stats = useMemo(() => ({
    total: bidangFilteredData.length,
    tercapai: bidangFilteredData.filter(k => k.status === 'Tercapai').length,
    proses: bidangFilteredData.filter(k => k.status === 'Dalam Proses').length,
    belum: bidangFilteredData.filter(k => k.status === 'Belum Tercapai').length,
  }), [bidangFilteredData]);

  const filtered = useMemo(() => {
    let result = bidangFilteredData.filter(k => {
      const matchSearch = (k.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (k.kode && k.kode.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'Semua' || k.status === filterStatus;

      let matchAnggaran = true;
      const val = k.anggaran || k.anggaranPagu || 0;
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

  const openAdd = () => {
    setEditItem(null);
    setForm({
      ...emptyForm,
      programId: programs.length > 0 ? programs[0].id : '',
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      ...item,
      programId: item.programId || (programs.length > 0 ? programs[0].id : ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) {
      alert('Nama Kegiatan wajib diisi');
      return;
    }
    if (!form.programId) {
      alert('Silakan pilih Program Parent terlebih dahulu');
      return;
    }

    try {
      setSaving(true);
      if (editItem) {
        await updateKegiatan(editItem.id, form);
      } else {
        await addKegiatan(form);
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditItem(null);
    } catch (err) {
      alert('Gagal menyimpan kegiatan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      setSaving(true);
      await deleteKegiatan(id);
      dispatch({ type: 'DELETE_KEGIATAN', payload: id });
      setShowDelete(null);
    } catch (err) {
      alert('Gagal menghapus kegiatan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <h1>Kegiatan</h1>
          <p>Daftar Kegiatan Renstra Dinas Kesehatan Kabupaten Garut</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Tambah Kegiatan
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          label="TOTAL KEGIATAN"
          value={stats.total}
          color="blue"
          icon={<ListChecks size={24} />}
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
            placeholder="Cari kode atau nama kegiatan..."
          />
        </div>

        <div className="data-table-wrapper">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
              <div>Memuat data Kegiatan...</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>KODE</th>
                  <th>NAMA KEGIATAN</th>
                  <th>PROGRAM PARENT</th>
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
                  const parentProg = programs.find(
                    p => String(p.id) === String(item.programId) || String(p.raw?.id) === String(item.programId)
                  );

                  const pct = (item.capaian !== undefined && item.capaian !== null && item.capaian !== '')
                    ? Number(item.capaian)
                    : (item.status === 'Tercapai' ? 100 : item.status === 'Belum Tercapai' ? 45 : 75);
                  
                  let barColor = '#4caf50';
                  if (pct < 50) barColor = '#f44336';
                  else if (pct < 75) barColor = '#ff9800';
                  else if (pct < 90) barColor = '#2196f3';

                  return (
                    <tr key={item.id}>
                      <td><span className="code-badge">{item.kode || '-'}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#2196f3' }}>{item.nama}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                          {parentProg ? parentProg.nama : (item.programNama || 'Program Pemenuhan Upaya Kesehatan')}
                        </div>
                      </td>
                      <td><div style={{ fontSize: '0.82rem' }}>{item.sasaran || '-'}</div></td>
                      <td><div style={{ fontSize: '0.82rem' }}>{item.indikator || '-'}</div></td>
                      <td><div style={{ fontSize: '0.82rem', textAlign: 'center' }}>{item.target || '-'}</div></td>
                      <td>{formatAnggaranShort(item.anggaran)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(Math.max(pct, 0), 100)}%`, background: barColor, borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', minWidth: '38px', textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </td>
                      <td><StatusBadge status={item.status} /></td>
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
                        <div className="icon">📋</div>
                        <h3>Tidak ada data</h3>
                        <p>Belum ada kegiatan yang sesuai filter</p>
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
        title={editItem ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setShowModal(false); setEditItem(null); }}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Kegiatan'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Pilih Program Parent <span className="required">*</span></label>
          <select
            className="form-select"
            value={form.programId}
            onChange={e => setForm({ ...form, programId: e.target.value })}
          >
            <option value="">-- Pilih Program --</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.kode ? `[${p.kode}] ` : ''}{p.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Kode Kegiatan</label>
            <input className="form-input" placeholder="Contoh: 01.2.01.0001"
              value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Bidang</label>
            <select className="form-select" value={form.bidang} onChange={e => setForm({ ...form, bidang: e.target.value })}>
              <option value="Kesmas">Kesmas</option>
              <option value="SDK">SDK</option>
              <option value="Farmasi">Farmasi</option>
              <option value="Yankes">Yankes</option>
              <option value="P2P">P2P</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nama Kegiatan <span className="required">*</span></label>
          <input className="form-input" placeholder="Contoh: Perencanaan, Penganggaran, dan Evaluasi Kinerja Perangkat Daerah"
            value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Sasaran Kegiatan</label>
          <input className="form-input" placeholder="Contoh: Terpenuhinya Perencanaan, Penganggaran, dan Evaluasi Kinerja Perangkat Daerah"
            value={form.sasaran} onChange={e => setForm({ ...form, sasaran: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Indikator Kegiatan</label>
          <input className="form-input" placeholder="Contoh: Jumlah Dokumen Perencanaan, Penganggaran..."
            value={form.indikator} onChange={e => setForm({ ...form, indikator: e.target.value })} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Target Kegiatan</label>
            <input className="form-input" placeholder="Contoh: 1 Dokumen"
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
        itemName="kegiatan ini"
      />
    </div>
  );
}
