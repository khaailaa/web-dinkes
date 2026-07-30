import { useState, useMemo } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { formatAnggaranShort, statusList } from '../data/initialData';
import { usePrograms, usePerencanaan } from '../hooks/useSupabase';
import { useApp } from '../context/AppContext';
import { Plus, Search, FolderKanban, CheckCircle2, Clock, XCircle, Trash2, Edit3, Loader2 } from 'lucide-react';

const emptyForm = {
  kode: '',
  nama: '',
  perencanaanId: '',
  sasaran: '',
  indikator: '',
  target: '',
  bidang: 'Kesmas',
  capaian: 0,
  anggaranPagu: 0,
  status: 'Dalam Proses',
  tahun: 2025,
  deskripsi: '',
};

export default function Program() {
  const { programs, loading, addProgram, updateProgram, deleteProgram } = usePrograms();
  const { perencanaan } = usePerencanaan();
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
  const scopedPrograms = useMemo(() => {
    if (!userBidang || userBidang === 'Semua') return programs;
    return programs.filter(p => !p.bidang || p.bidang === userBidang);
  }, [programs, userBidang]);

  const stats = useMemo(() => ({
    total: scopedPrograms.length,
    tercapai: scopedPrograms.filter(p => p.status === 'Tercapai').length,
    proses: scopedPrograms.filter(p => p.status === 'Dalam Proses').length,
    belum: scopedPrograms.filter(p => p.status === 'Belum Tercapai').length,
  }), [scopedPrograms]);

  const filtered = useMemo(() => {
    return scopedPrograms.filter(p => {
      const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase()) ||
        (p.kode && p.kode.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'Semua' || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [scopedPrograms, search, filterStatus]);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      ...emptyForm,
      perencanaanId: perencanaan.length > 0 ? perencanaan[0].id : '',
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      ...item,
      perencanaanId: item.perencanaanId || (perencanaan.length > 0 ? perencanaan[0].id : ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) {
      alert('Nama Program wajib diisi');
      return;
    }
    if (!form.perencanaanId) {
      alert('Silakan pilih Perencanaan Parent terlebih dahulu');
      return;
    }

    try {
      setSaving(true);
      if (editItem) {
        await updateProgram(editItem.id, form);
      } else {
        await addProgram(form);
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
    try {
      setSaving(true);
      await deleteProgram(id);
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
          <h1>Program</h1>
          <p>Daftar Program Renstra Dinas Kesehatan Kabupaten Garut</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Tambah Program
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="TOTAL PROGRAM" value={stats.total} color="blue" icon={<FolderKanban size={24} />} />
        <StatCard label="TERCAPAI" value={stats.tercapai} color="green" icon={<CheckCircle2 size={24} />} />
        <StatCard label="DALAM PROSES" value={stats.proses} color="orange" icon={<Clock size={24} />} />
        <StatCard label="BELUM TERCAPAI" value={stats.belum} color="red" icon={<XCircle size={24} />} />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filters-row">
            <div className="filter-search">
              <Search className="search-icon" size={16} />
              <input
                type="text" placeholder="Cari kode atau nama program..."
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
              <div>Memuat data Program...</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>KODE</th>
                  <th>NAMA PROGRAM</th>
                  <th>PERENCANAAN PARENT</th>
                  <th>SASARAN</th>
                  <th>INDIKATOR</th>
                  <th>TARGET</th>
                  <th>ANGGARAN PAGU</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const parentP = perencanaan.find(
                    p => String(p.id) === String(item.perencanaanId) || String(p.tujuanId) === String(item.perencanaanId)
                  );

                  return (
                    <tr key={item.id}>
                      <td><span className="code-badge">{item.kode || '-'}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#2196f3' }}>{item.nama}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                          {parentP ? parentP.nama : (item.sasaranName || 'Renstra Garut 2025')}
                        </div>
                      </td>
                      <td><div style={{ fontSize: '0.82rem' }}>{item.sasaran || item.deskripsi || '-'}</div></td>
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
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9}>
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
        <div className="form-group">
          <label className="form-label">Pilih Perencanaan Parent (Renstra Tujuan) <span className="required">*</span></label>
          <select
            className="form-select"
            value={form.perencanaanId}
            onChange={e => setForm({ ...form, perencanaanId: e.target.value })}
          >
            <option value="">-- Pilih Perencanaan --</option>
            {perencanaan.map(p => (
              <option key={p.id} value={p.id}>
                {p.kode ? `[${p.kode}] ` : ''}{p.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Kode Program</label>
            <input className="form-input" placeholder="Contoh: 01.2.01"
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
        <p>Apakah Anda yakin ingin menghapus program ini?</p>
      </Modal>
    </div>
  );
}
