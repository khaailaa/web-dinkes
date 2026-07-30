export default function StatusBadge({ status }) {
  const getClass = () => {
    switch (status) {
      case 'Tercapai':
      case 'Selesai':
      case 'Aktif':
        return 'badge-tercapai';
      case 'Dalam Proses':
      case 'Belum Dimulai':
        return 'badge-proses';
      case 'Belum Tercapai':
      case 'Nonaktif':
        return 'badge-belum';
      default:
        return 'badge-proses';
    }
  };

  const getDot = () => {
    switch (status) {
      case 'Tercapai':
      case 'Selesai':
      case 'Aktif':
        return '●';
      case 'Dalam Proses':
      case 'Belum Dimulai':
        return '●';
      case 'Belum Tercapai':
      case 'Nonaktif':
        return '●';
      default:
        return '●';
    }
  };

  return (
    <span className={`badge ${getClass()}`}>
      {getDot()} {status}
    </span>
  );
}
