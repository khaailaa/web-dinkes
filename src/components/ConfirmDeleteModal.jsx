import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  itemName = 'data ini'
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ textAlign: 'center', padding: '16px 8px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#fef2f2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <AlertTriangle size={28} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
          Apakah Anda yakin?
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
          Tindakan ini tidak dapat dibatalkan. Menghapus <strong>{itemName}</strong> akan menghilangkan data tersebut secara permanen.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-danger" onClick={onConfirm} style={{ backgroundColor: '#ef4444', color: '#fff' }}>
            Ya, Hapus
          </button>
        </div>
      </div>
    </Modal>
  );
}
