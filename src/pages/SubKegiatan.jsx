import { useState, useMemo } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { formatAnggaranShort, statusList } from '../data/initialData';
import { useSubKegiatan, useKegiatan } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext';
import { Plus, Search, Layers, CheckCircle2, Clock, Trash2, Edit3, Loader2 } from 'lucide-react';

const emptyForm = {
  kode: '',
  nama: '',
  kegiatanId: '',
  sasaran: '',
  indikator: '',
  target: '',
  bidang: 'Kesmas',
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
  const scopedSubKegiatan = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return subKegiatan;
    return subKegiatan.filter(s => !s.bidang || s.bidang === userBidang);
  }, [subKegiatan, userBidang]);

  const stats = useMemo(() => ({
    total: scopedSubKegiatan.length,
    tercapai: scopedSubKegiatan.filter(s => s.status === 'Tercapai').length,
    proses: scopedSubKegiatan.filter(s => s.status === 'Dalam Proses').length,
  }), [scopedSubKegiatan]);

  const filtered = useMemo(() => {
    return scopedSubKegiatan.filter(s => {
      const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) ||
        (s.kode && s.kode.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'Semua' || s.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [scopedSubKegiatan, search, filterStatus]);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      ...emptyForm,
      kegiatanId: kegiatan.length > 0 ? kegiatan[0].id : '',
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      ...item,
      kegiatanId: item.kegiatanId || (kegiatan.length > 0 ? kegiatan[0].id : ''),
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
      } else {
        await addSubKegiatan(form);
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
    try {
      setSaving(true);
      await deleteSubKegiatan(id);
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
        <StatCard label="TOTAL SUB KEGIATAN" value={stats.total} color="blue" icon={<Layers size={24} />} />
        <StatCard label="TERCAPAI" value={stats.tercapai} color="green" icon={<CheckCircle2 size={24} />} />
        <StatCard label="DALAM PROSES" value={stats.proses} color="orange" icon={<Clock size={24} />} />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filters-row">
            <div className="filter-search">
              <Search className="search-icon" size={16} />
              <input
                type="text" placeholder="Cari kode atau nama sub kegiatan..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="Semua">Semua Status</option>
              {statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
                  <th>KEGIATAN PARENT</th>
                  <th>SASARAN</th>
                  <th>INDIKATOR</th>
                  <th>TARGET</th>
                  <th>ANGGARAN</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const parentKeg = kegiatan.find(
                    k => String(k.id) === String(item.kegiatanId) || String(k.raw?.id) === String(item.kegiatanId)
                  );

                  return (
                    <tr key={item.id}>
                      <td><span className="code-badge">{item.kode || '-'}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#2196f3' }}>{item.nama}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                          {parentKeg ? parentKeg.nama : (item.kegiatanNama || 'Kegiatan Perencanaan')}
                        </div>
                      </td>
                      <td><div style={{ fontSize: '0.82rem' }}>{item.sasaran || '-'}</div></td>
                      <td><div style={{ fontSize: '0.82rem' }}>{item.indikator || '-'}</div></td>
                      <td><div style={{ fontSize: '0.82rem', textAlign: 'center' }}>{item.target || '-'}</div></td>
                      <td>{formatAnggaranShort(item.anggaran)}</td>
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
                    <td colSpan={9}>
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
            onChange={e => setForm({ ...form, kegiatanId: e.target.value })}
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
      <Modal
        isOpen={!!showDelete}
        onClose={() => setShowDelete(null)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowDelete(null)}>Batal</button>
            <button className="btn btn-danger" onClick={() => handleDelete(showDelete)} disabled={saving}>
              {saving ? 'Menghapus...' : 'Hapus'}
            </button>
          </>
        }
      >
        <p>Apakah Anda yakin ingin menghapus sub kegiatan ini?</p>
      </Modal>
    </div>
  );
}
