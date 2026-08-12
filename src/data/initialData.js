// ===========================
// SIPK Garut - Initial Data
// ===========================

export const BIDANG_UTAMA_LIST = [
  'Sekretariat',
  'Bidang Kesehatan Masyarakat (Kesmas)',
  'Bidang Pencegahan dan Pengendalian Penyakit (P2P)',
  'Bidang Pelayanan Kesehatan (Yankes)',
  'Bidang Sumber Daya Kesehatan (SDK)',
];

export const bidangList = BIDANG_UTAMA_LIST;

export const SUB_BIDANG_MAP = {
  'Sekretariat': [
    'Umum dan Kepegawaian',
    'Subbagian Keuangan dan Barang Milik Daerah',
    'Subbagian Program / Perencanaan dan Evaluasi',
  ],
  'Bidang Kesehatan Masyarakat (Kesmas)': [
    'Seksi Kesehatan Keluarga dan Gizi',
    'Seksi Promosi dan Pemberdayaan Masyarakat',
    'Seksi Kesehatan Lingkungan, Kerja, dan Olahraga',
  ],
  'Bidang Pencegahan dan Pengendalian Penyakit (P2P)': [
    'Seksi Surveilans dan Imunisasi',
    'Seksi Pencegahan dan Pengendalian Penyakit Menular (P2M)',
    'Seksi Pencegahan dan Pengendalian Penyakit Tidak Menular (PPTM) dan Kesehatan Jiwa',
  ],
  'Bidang Pelayanan Kesehatan (Yankes)': [
    'Seksi Pelayanan Kesehatan Primer',
    'Seksi Pelayanan Kesehatan Rujukan',
    'Seksi Pelayanan Kesehatan Tradisional',
  ],
  'Bidang Sumber Daya Kesehatan (SDK)': [
    'Seksi Kefarmasian',
    'Seksi Alat Kesehatan dan Perbekalan Kesehatan Rumah Tangga (PKRT)',
    'Seksi Sumber Daya Manusia Kesehatan (SDMK)',
  ],
};

export function normalizeBidangUtama(b) {
  if (!b) return 'Bidang Kesehatan Masyarakat (Kesmas)';
  const str = String(b).toLowerCase();
  if (str.includes('sekretariat')) return 'Sekretariat';
  if (str.includes('kesmas') || str.includes('masyarakat')) return 'Bidang Kesehatan Masyarakat (Kesmas)';
  if (str.includes('p2p') || str.includes('pencegahan')) return 'Bidang Pencegahan dan Pengendalian Penyakit (P2P)';
  if (str.includes('yankes') || str.includes('pelayanan')) return 'Bidang Pelayanan Kesehatan (Yankes)';
  if (str.includes('sdk') || str.includes('sumber daya')) return 'Bidang Sumber Daya Kesehatan (SDK)';
  return 'Bidang Kesehatan Masyarakat (Kesmas)';
}

export function getSubBidangOptions(bidangUtama) {
  const normalized = normalizeBidangUtama(bidangUtama);
  return SUB_BIDANG_MAP[normalized] || SUB_BIDANG_MAP['Bidang Kesehatan Masyarakat (Kesmas)'];
}

export const bidangCodeMap = {
  'Sekretariat': 'SEK',
  'Bidang Kesehatan Masyarakat (Kesmas)': 'KM',
  'Bidang Pencegahan dan Pengendalian Penyakit (P2P)': 'P2P',
  'Bidang Pelayanan Kesehatan (Yankes)': 'YK',
  'Bidang Sumber Daya Kesehatan (SDK)': 'SDK',
};

export const statusList = ['Tercapai', 'Dalam Proses', 'Belum Tercapai'];

export const ACCOUNT_PRESETS = [
  {
    id: 'admin',
    username: 'admin',
    password: 'admin123',
    nama: 'Sekretariat / Admin Perencanaan',
    role: 'Sekretariat / Admin Perencanaan',
    roleKey: 'admin',
    bidang: 'Semua',
    email: 'admin@dinkesgarut.go.id',
    deskripsi: 'Dapat melakukan keseluruhan (Akses Penuh)',
    badgeColor: 'purple',
    badgeText: 'Sekretariat (Admin)',
    canManageUsers: true,
    canViewTree: true,
    canViewAllBidang: true,
  },
  {
    id: 'kesmas',
    username: 'kesmas',
    password: 'kesmas123',
    nama: 'Admin Bidang Kesmas',
    role: 'Admin Bidang (Kesmas)',
    roleKey: 'kesmas',
    bidang: 'Kesmas',
    email: 'kesmas@dinkesgarut.go.id',
    deskripsi: 'Akses khusus data Bidang Kesmas (Tanpa Bagan & Manajemen Pengguna)',
    badgeColor: 'green',
    badgeText: 'Bidang Kesmas',
    canManageUsers: false,
    canViewTree: false,
    canViewAllBidang: false,
  },
  {
    id: 'p2p',
    username: 'p2p',
    password: 'p2p123',
    nama: 'Admin Bidang P2P',
    role: 'Admin Bidang (P2P)',
    roleKey: 'p2p',
    bidang: 'P2P',
    email: 'p2p@dinkesgarut.go.id',
    deskripsi: 'Akses khusus data Bidang P2P (Tanpa Bagan & Manajemen Pengguna)',
    badgeColor: 'red',
    badgeText: 'Bidang P2P',
    canManageUsers: false,
    canViewTree: false,
    canViewAllBidang: false,
  },
  {
    id: 'yankes',
    username: 'yankes',
    password: 'yankes123',
    nama: 'Admin Bidang Yankes',
    role: 'Admin Bidang (Yankes)',
    roleKey: 'yankes',
    bidang: 'Yankes',
    email: 'yankes@dinkesgarut.go.id',
    deskripsi: 'Akses khusus data Bidang Yankes (Tanpa Bagan & Manajemen Pengguna)',
    badgeColor: 'blue',
    badgeText: 'Bidang Yankes',
    canManageUsers: false,
    canViewTree: false,
    canViewAllBidang: false,
  },
  {
    id: 'sdk',
    username: 'sdk',
    password: 'sdk123',
    nama: 'Admin Bidang SDK',
    role: 'Admin Bidang (SDK)',
    roleKey: 'sdk',
    bidang: 'SDK',
    email: 'sdk@dinkesgarut.go.id',
    deskripsi: 'Akses khusus data Bidang SDK (Tanpa Bagan & Manajemen Pengguna)',
    badgeColor: 'orange',
    badgeText: 'Bidang SDK',
    canManageUsers: false,
    canViewTree: false,
    canViewAllBidang: false,
  },
  {
    id: 'kadin',
    username: 'kadin',
    password: 'kadin123',
    nama: 'Kepala Dinas Kesehatan',
    role: 'Kepala Dinas',
    roleKey: 'kadin',
    bidang: 'Semua',
    email: 'kadin@dinkesgarut.go.id',
    deskripsi: 'Semua fitur termasuk Bagan Pohon (Tanpa Manajemen Pengguna)',
    badgeColor: 'cyan',
    badgeText: 'Kepala Dinas',
    canManageUsers: false,
    canViewTree: true,
    canViewAllBidang: true,
  },
];

export const initialPerencanaan = [];
export const initialPrograms = [];
export const initialKegiatan = [];
export const initialSubKegiatan = [];
export const initialSubKegiatanDetail = [];

export const initialUsers = [
  {
    id: 1,
    nama: 'Administrator Sistem',
    username: 'admin',
    email: 'admin@dinkesgarut.go.id',
    role: 'Superadmin',
    bidang: 'Semua Bidang',
    status: 'Aktif',
    lastLogin: '2025-07-20 08:45',
  },
  {
    id: 2,
    nama: 'dr. Siti Rahayu, MKM',
    username: 'siti.rahayu',
    email: 'siti.rahayu@dinkesgarut.go.id',
    role: 'Admin Bidang',
    bidang: 'Kesmas',
    status: 'Aktif',
    lastLogin: '2025-07-20 09:12',
  },
  {
    id: 3,
    nama: 'dr. Ahmad Fauzi, Sp.PD',
    username: 'ahmad.fauzi',
    email: 'ahmad.fauzi@dinkesgarut.go.id',
    role: 'Admin Bidang',
    bidang: 'P2P',
    status: 'Aktif',
    lastLogin: '2025-07-19 14:30',
  },
  {
    id: 4,
    nama: 'Ns. Dewi Kurniawati, S.Kep',
    username: 'dewi.kurniawati',
    email: 'dewi.k@dinkesgarut.go.id',
    role: 'Admin Bidang',
    bidang: 'Yankes',
    status: 'Aktif',
    lastLogin: '2025-07-20 10:05',
  },
  {
    id: 5,
    nama: 'Budi Santoso, SKM',
    username: 'budi.santoso',
    email: 'budi.s@dinkesgarut.go.id',
    role: 'Operator',
    bidang: 'SDK',
    status: 'Aktif',
    lastLogin: '2025-07-18 16:20',
  },
  {
    id: 6,
    nama: 'Rina Marlina, S.Kep',
    username: 'rina.marlina',
    email: 'rina.m@dinkesgarut.go.id',
    role: 'Operator',
    bidang: 'Gizi',
    status: 'Aktif',
    lastLogin: '2025-07-17 11:00',
  },
  {
    id: 7,
    nama: 'Agus Permana',
    username: 'agus.permana',
    email: 'agus.p@dinkesgarut.go.id',
    role: 'Viewer',
    bidang: 'Farmasi',
    status: 'Nonaktif',
    lastLogin: '2025-06-30 09:00',
  },
];

export const initialActivities = [
  {
    id: 1,
    user: 'dr. Siti Rahayu',
    action: 'Memperbarui capaian Program Gizi Q3',
    time: '08:45',
    color: 'blue',
  },
  {
    id: 2,
    user: 'Budi Santoso, SKM',
    action: 'Mengupload laporan bulanan Bidang P2P',
    time: '09:12',
    color: 'green',
  },
  {
    id: 3,
    user: 'Rina Marlina, S.Kep',
    action: 'Menambah sub kegiatan Yankes Dasar',
    time: '10:30',
    color: 'orange',
  },
  {
    id: 4,
    user: 'Admin Sistem',
    action: 'Sinkronisasi data SIPD selesai',
    time: '11:05',
    color: 'purple',
  },
  {
    id: 5,
    user: 'dr. Ahmad Fauzi',
    action: 'Validasi laporan evaluasi semester I',
    time: '13:20',
    color: 'orange',
  },
  {
    id: 6,
    user: 'Dewi Kurniawati',
    action: 'Mengupdate realisasi anggaran Farmasi',
    time: '14:15',
    color: 'blue',
  },
];

export const chartData = {
  capaianPerBidang: {
    labels: ['Kesmas', 'P2P', 'Yankes', 'SDK', 'Farmasi', 'Gizi'],
    target: [95, 90, 100, 85, 95, 90],
    realisasi: [96, 90, 100, 78, 98, 85],
  },
  perkembanganBulanan: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
    data: [35, 42, 48, 52, 58, 65, 75, 0, 0, 0, 0, 0],
  },
  trenRealisasi: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
    data: [800, 1500, 2800, 3500, 4200, 5800, 8200, 0, 0, 0, 0, 0],
  },
};

// Helper functions
export function formatRupiah(amount) {
  if (amount >= 1000000000000) {
    return `Rp ${(amount / 1000000000000).toFixed(1)} T`;
  }
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)} M`;
  }
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)} Jt`;
  }
  if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)} Rb`;
  }
  return `Rp ${amount}`;
}

export function formatAnggaranShort(amount) {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)} M`;
  }
  if (amount >= 1000000) {
    return `Rp ${Math.round(amount / 1000000)} Jt`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function getProgressColor(value) {
  if (value >= 90) return 'green';
  if (value >= 70) return 'blue';
  if (value >= 50) return 'orange';
  return 'red';
}

export function getBidangColor(bidang) {
  const colors = {
    'Kesmas': 'kesmas',
    'P2P': 'p2p',
    'Yankes': 'yankes',
    'SDK': 'sdk',
    'Farmasi': 'farmasi',
    'Gizi': 'gizi',
  };
  return colors[bidang] || 'kesmas';
}

export function generateProgramKode(bidang, programs) {
  const code = bidangCodeMap[bidang] || 'XX';
  const existing = programs.filter(p => p.bidang === bidang);
  const num = String(existing.length + 1).padStart(2, '0');
  return `P.${num}.${code}`;
}

export function generateKegiatanKode(programId, kegiatan) {
  const existing = kegiatan.filter(k => k.programId === programId);
  const num = String(existing.length + 1).padStart(2, '0');
  return `K.${num}.P${String(programId).padStart(2, '0')}`;
}

export function generateSubKegiatanKode(kegiatanId, subKegiatan) {
  const existing = subKegiatan.filter(s => s.kegiatanId === kegiatanId);
  const num = String(existing.length + 1).padStart(2, '0');
  return `SK.${num}.K${String(kegiatanId).padStart(2, '0')}`;
}
