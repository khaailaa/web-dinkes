import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Program from './pages/Program';
import Kegiatan from './pages/Kegiatan';
import SubKegiatan from './pages/SubKegiatan';
import Laporan from './pages/Laporan';
import ManajemenPengguna from './pages/ManajemenPengguna';
import Pengaturan from './pages/Pengaturan';
import BaganPohon from './pages/BaganPohon';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/program" element={<Program />} />
        <Route path="/kegiatan" element={<Kegiatan />} />
        <Route path="/sub-kegiatan" element={<SubKegiatan />} />
        <Route path="/laporan" element={<Laporan />} />
        <Route path="/bagan-pohon" element={<BaganPohon />} />
        <Route path="/manajemen-pengguna" element={<ManajemenPengguna />} />
        <Route path="/pengaturan" element={<Pengaturan />} />
      </Route>
    </Routes>
  );
}

export default App;
