import { useState, useMemo } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import FilterSearchBar from '../components/FilterSearchBar';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { formatAnggaranShort, statusList } from '../data/initialData';
import { usePerencanaan } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext';
import { Plus, FileText, CheckCircle2, Clock, Wallet, Trash2, Edit3, Loader2 } from 'lucide-react';

const emptyForm = {
  kode: '',
  nama: '',
  tujuan: '',
  sasaran: '',
  indikator: '',
  target: '',
  tahun: 2025,
  bidang: 'Kesmas',
  anggaranPagu: 0,
  penanggungJawab: 'Dinas Kesehatan Kab. Garut',
  status: 'Dalam Proses',
};

export default function Perencanaan() {
  const { perencanaan, loading, addTujuan, updateTujuan, deleteTujuan } = usePerencanaan();
  const { state } = useApp();
  const currentUser = state.currentUser;
  const userBidang = currentUser?.bidang;

  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [saving, setSaving] = useState(false);

  // Filter per bidang if assigned to a specific bidang
  const scopedPerencanaan = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return perencanaan;
    return perencanaan.filter(p => !p.bidang || p.bidang === userBidang);
  }, [perencanaan, userBidang]);

  const stats = useMemo(() => ({
    total: scopedPerencanaan.length,
    tercapai: scopedPerencanaan.filter(p => p.status === 'Tercapai').length,
    proses: scopedPerencanaan.filter(p => p.status === 'Dalam Proses').length,
    totalAnggaran: scopedPerencanaan.reduce((s, p) => s + (p.anggaranPagu || 0), 0),
  }), [scopedPerencanaan]);

  const filtered = useMemo(() => {
    return scopedPerencanaan.filter(p => {
      const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase()) ||
        (p.kode && p.kode.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'Semua' || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [scopedPerencanaan, search, filterStatus]);

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) {
      alert('Nama Perencanaan wajib diisi');
      return;
    }

    try {
      setSaving(true);
      if (editItem) {
        await updateTujuan(editItem.id, form);
      } else {
        await addTujuan(form);
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditItem(null);
    } catch (err) {
      alert('Gagal menyimpan perencanaan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setSaving(true);
      await deleteTujuan(id);
      setShowDelete(null);
    } catch (err) {
      alert('Gagal menghapus perencanaan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Perencanaan"
        subtitle="Dokumen Perencanaan Strategis (Renstra Tujuan & Sasaran) Dinas Kesehatan Kab. Garut"
        icon={FileText}
        actions={
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Tambah Perencanaan
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="TOTAL PERENCANAAN" value={stats.total} color="blue" icon={<FileText size={24} />} />
        <StatCard label="TERCAPAI" value={stats.tercapai} color="green" icon={<CheckCircle2 size={24} />} />
        <StatCard label="DALAM PROSES" value={stats.proses} color="orange" icon={<Clock size={24} />} />
        <StatCard label="TOTAL ANGGARAN" value={formatAnggaranShort(stats.totalAnggaran)} color="teal" icon={<Wallet size={24} />} />
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
            placeholder="Cari nama atau kode perencanaan..."
          />
        </div>

        <div className="data-table-wrapper">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
              <div>Memuat data Perencanaan...</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>KODE</th>
                  <th>NAMA PERENCANAAN</th>
                  <th>SASARAN</th>
                  <th>INDIKATOR</th>
                  <th>TARGET</th>
                  <th>ANGGARAN PAGU</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td><span className="code-badge">{item.kode || '-'}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#2196f3' }}>{item.nama}</div>
                    </td>
                    <td><div style={{ fontSize: '0.82rem' }}>{item.sasaran || item.tujuan || '-'}</div></td>
                    <td><div style={{ fontSize: '0.82rem' }}>{item.indikator || 'SAKIP'}</div></td>
                    <td><div style={{ fontSize: '0.82rem', textAlign: 'center' }}>{item.target || '-'}</div></td>
                    <td>{formatAnggaranShort(item.anggaranPagu)}</td>
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
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="icon">📋</div>
                        <h3>Tidak ada data</h3>
                        <p>Belum ada perencanaan yang sesuai filter</p>
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
        title={editItem ? 'Edit Perencanaan' : 'Tambah Perencanaan'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setShowModal(false); setEditItem(null); }}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Perencanaan'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Kode Perencanaan</label>
            <input className="form-input" placeholder="Contoh: 01"
              value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Tahun</label>
            <input className="form-input" type="number" value={form.tahun}
              onChange={e => setForm({ ...form, tahun: parseInt(e.target.value) || 2025 })} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nama Perencanaan (Tujuan Renstra) <span className="required">*</span></label>
          <input className="form-input" placeholder="Contoh: PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH KABUPATEN/KOTA"
            value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Sasaran Perencanaan</label>
          <input className="form-input" placeholder="Contoh: Meningkatnya Penunjang Urusan Pemerintah Daerah"
            value={form.sasaran} onChange={e => setForm({ ...form, sasaran: e.target.value })} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Indikator</label>
            <input className="form-input" placeholder="Contoh: SAKIP"
              value={form.indikator} onChange={e => setForm({ ...form, indikator: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Target</label>
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
        itemName="perencanaan ini"
      />
    </div>
  );
}
