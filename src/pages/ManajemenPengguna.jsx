import { useState, useMemo } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { usePenanggungJawab } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { Plus, Search, Users, UserCheck, Shield, Trash2, Edit3, Loader2 } from 'lucide-react';

const emptyForm = {
  nama: '',
  jabatan: '',
  bidang: 'Kesmas',
  status: 'Aktif',
};

export default function ManajemenPengguna() {
  const { penanggungJawab, loading } = usePenanggungJawab();

  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => ({
    total: penanggungJawab.length,
    aktif: penanggungJawab.length,
    pejabat: penanggungJawab.filter(p => p.jabatan && p.jabatan.toLowerCase().includes('kepala')).length,
    perencana: penanggungJawab.filter(p => p.jabatan && (p.jabatan.toLowerCase().includes('perencana') || p.jabatan.toLowerCase().includes('sekretaris'))).length,
  }), [penanggungJawab]);

  const filtered = useMemo(() => {
    return penanggungJawab.filter(p => {
      const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase()) ||
        (p.jabatan && p.jabatan.toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    });
  }, [penanggungJawab, search]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ nama: item.nama, jabatan: item.jabatan || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nama.trim()) return;
    try {
      setSaving(true);
      if (editItem) {
        await supabase.from('penanggung_jawab').update({ nama: form.nama, jabatan: form.jabatan }).eq('id', editItem.id);
      } else {
        await supabase.from('penanggung_jawab').insert([{ nama: form.nama, jabatan: form.jabatan }]);
      }
      window.location.reload();
    } catch (err) {
      alert('Gagal menyimpan penanggung jawab: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setSaving(true);
      await supabase.from('penanggung_jawab').delete().eq('id', id);
      window.location.reload();
    } catch (err) {
      alert('Gagal menghapus penanggung jawab: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <h1>Manajemen Penanggung Jawab & Pengguna</h1>
          <p>Daftar Pejabat & Penanggung Jawab dari tabel Supabase `penanggung_jawab`</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Tambah Penanggung Jawab</button>
      </div>

      <div className="stats-grid">
        <StatCard label="TOTAL PENANGGUNG JAWAB" value={stats.total} color="blue" icon={<Users size={24} />} />
        <StatCard label="STATUS AKTIF" value={stats.aktif} color="green" icon={<UserCheck size={24} />} />
        <StatCard label="KEPALA BIDANG / SUB BAGIAN" value={stats.pejabat} color="purple" icon={<Shield size={24} />} />
        <StatCard label="PERENCANA & FUNGSIONAL" value={stats.perencana} color="teal" icon={<Users size={24} />} />
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filters-row">
            <div className="filter-search" style={{ flex: 1 }}>
              <Search className="search-icon" size={16} />
              <input
                type="text" placeholder="Cari nama pejabat atau jabatan..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="data-table-wrapper">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
              <div>Memuat data Penanggung Jawab dari Supabase...</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>NO</th>
                  <th>NAMA PENANGGUNG JAWAB</th>
                  <th>JABATAN</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1a2332' }}>{item.nama}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.jabatan || 'Penanggung Jawab Kinerja'}</div>
                    </td>
                    <td><StatusBadge status="Aktif" /></td>
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
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? 'Edit Penanggung Jawab' : 'Tambah Penanggung Jawab'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setShowModal(false); setEditItem(null); }}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan ke Supabase'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nama Lengkap & Gelar <span className="required">*</span></label>
          <input className="form-input" placeholder="Contoh: dr. LELI YULIANI, MM"
            value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Jabatan</label>
          <input className="form-input" placeholder="Contoh: Kepala Dinas Kesehatan"
            value={form.jabatan} onChange={e => setForm({ ...form, jabatan: e.target.value })} />
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
        <p>Apakah Anda yakin ingin menghapus penanggung jawab ini dari database Supabase?</p>
      </Modal>
    </div>
  );
}
