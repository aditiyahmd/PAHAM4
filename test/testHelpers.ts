import { AppDatabase } from '../src/services/db';
import { AppUser } from '../src/types';

export const TEST_ACTORS: AppUser[] = [
  {
    id: 'USR-ACT-01',
    nama: 'Arif Nurudin, M.T.',
    email: 'rektor@umc.ac.id',
    role: 'ACT-01',
    roleName: 'Pimpinan Universitas',
    unit: 'Rektorat UMC',
    phone: '081111111101',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: 'rektor123',
    passwordSet: true,
    specialty: 'Monitoring Eksekutif & Kebijakan TI',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-02',
    nama: 'Agust Isa Martinus, M.T.',
    email: 'kepala.pusdatin@umc.ac.id',
    role: 'ACT-02',
    roleName: 'Kepala PUSDATIN',
    unit: 'PUSDATIN UMC',
    phone: '081111111102',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: 'pusdatin123',
    passwordSet: true,
    specialty: 'Persetujuan Strategis, RFC & BAST',
    isFullAccess: true
  },
  {
    id: 'USR-ACT-04',
    nama: 'Jeri Maulana, S.T.',
    email: 'jeri.infra@umc.ac.id',
    role: 'ACT-04',
    roleName: 'Cloud & Infrastructure Engineer',
    unit: 'PUSDATIN UMC',
    phone: '081234560004',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: 'infra123',
    passwordSet: true,
    specialty: 'Jaringan Kampus & Cloud Server',
    isFullAccess: false,
    level: 'Senior'
  },
  {
    id: 'USR-ACT-05',
    nama: 'Ayi Imaduddin, S.Kom.',
    email: 'ayi.analyst@umc.ac.id',
    role: 'ACT-05',
    roleName: 'System Analyst & Data Governance Specialist',
    unit: 'PUSDATIN UMC',
    phone: '081234560005',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: 'analyst123',
    passwordSet: true,
    specialty: 'BRD & Analisis Sistem',
    isFullAccess: false,
    level: 'Senior'
  },
  {
    id: 'USR-ACT-06',
    nama: 'Hilyah Haula Salsabiila, S.T.',
    email: 'hilyah.dev@umc.ac.id',
    role: 'ACT-06',
    roleName: 'Lead Full Stack Developer',
    unit: 'PUSDATIN UMC',
    phone: '081234560006',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: 'dev123',
    passwordSet: true,
    specialty: 'Full Stack & SIAKAD',
    isFullAccess: false,
    level: 'Lead'
  },
  {
    id: 'USR-ACT-07',
    nama: 'Petugas Frontend Uji, S.Kom.',
    email: 'frontend.uji@umc.ac.id',
    role: 'ACT-07',
    roleName: 'Frontend Programmer',
    unit: 'PUSDATIN UMC',
    phone: '081234560007',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: 'fe123',
    passwordSet: true,
    specialty: 'UI/UX & Web Portal',
    isFullAccess: false,
    level: 'Senior'
  },
  {
    id: 'USR-ACT-10A',
    nama: 'Dr. Hendra Wijaya, M.Kom.',
    email: 'hendra.dosen@umc.ac.id',
    role: 'ACT-10',
    roleName: 'User (Civitas Akademika)',
    civitasType: 'Dosen',
    unit: 'Fakultas Teknik UMC',
    phone: '081234560010',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: 'dosen123',
    passwordSet: true,
    specialty: 'Dosen FT UMC',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-10B',
    nama: 'Siti Aminah, S.Pd.',
    email: 'siti.staf@umc.ac.id',
    role: 'ACT-10',
    roleName: 'User (Civitas Akademika)',
    civitasType: 'Karyawan',
    unit: 'BAAK UMC',
    phone: '081234560011',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: 'staf123',
    passwordSet: true,
    specialty: 'Tenaga Kependidikan',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-10C',
    nama: 'Muhammad Rizki Pratama',
    email: 'm.rizki@student.umc.ac.id',
    role: 'ACT-10',
    roleName: 'User (Civitas Akademika)',
    civitasType: 'Mahasiswa',
    unit: 'Prodi Teknik Informatika',
    phone: '081234560012',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: 'mhs123',
    passwordSet: true,
    specialty: 'Mahasiswa S1',
    isFullAccess: false
  }
];

/**
 * Populates a clean test sandbox with users, assets, receipts, loans, tickets, proposals, and surveys
 * so downstream business-rule and ITIL suites remain comprehensive while production starts empty.
 */
export function seedTestFixtures(): void {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  AppDatabase.resetToDefaultSeed();

  for (const u of TEST_ACTORS) {
    AppDatabase.addUser(u);
  }

  AppDatabase.setActiveUser('USR-ACT-03');

  // Seed Buku Penerimaan & Assets across categories
  AppDatabase.addBukuPenerimaan({
    tanggalPenerimaan: '2026-10-15',
    dari: 'PT Mitra Teknologi Kampus',
    nomorFaktur: 'INV-SEED-001',
    tanggalFaktur: '2026-10-15',
    namaAset: 'Laptop Dell Latitude 5430 & Proyektor Epson',
    kategori: 'Komputer & Laptop',
    banyaknya: 4,
    hargaSatuan: 12000000,
    nomorBeritaAcara: 'BAST-SEED-001',
    tanggalBeritaAcara: '2026-10-15',
    keterangan: 'Pengadaan lab semester ganjil'
  });

  const a1 = AppDatabase.addAsset({
    barcode: '90001001',
    kodeUnikAset: 'AST-UMC-001',
    nama: 'Laptop Dell Latitude 5430 Core i5 16GB',
    kategori: 'Komputer & Laptop',
    jenisAset: 'Fisik',
    merekModel: 'Dell Latitude 5430',
    nomorSeri: 'SN-DELL-1001',
    status: 'Tersedia',
    lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    tanggalMasuk: '2026-10-15',
    hargaBeli: 15000000
  });

  AppDatabase.addAsset({
    barcode: '90001002',
    kodeUnikAset: 'AST-UMC-002',
    nama: 'Switch Cisco Catalyst 2960X',
    kategori: 'Networking',
    jenisAset: 'Fisik',
    merekModel: 'Cisco 2960X',
    nomorSeri: 'SN-CISCO-1002',
    status: 'Digunakan',
    lokasi: 'Ruang Server PUSDATIN Kampus 1',
    tanggalMasuk: '2026-10-16',
    hargaBeli: 18500000
  });

  AppDatabase.addAsset({
    barcode: '90001003',
    kodeUnikAset: 'AST-UMC-003',
    nama: 'Proyektor Epson EB-X500',
    kategori: 'Multimedia',
    jenisAset: 'Fisik',
    merekModel: 'Epson EB-X500',
    nomorSeri: 'SN-EPS-1003',
    status: 'Tersedia',
    lokasi: 'Fakultas Teknik (Informatika)',
    tanggalMasuk: '2026-10-18',
    hargaBeli: 7500000
  });

  // Seed Damage Tickets assigned to different technicians for SLA & Dashboard metrics
  const t1 = AppDatabase.addDamageTicket({
    kodeUnikAset: a1.kodeUnikAset,
    barcode: a1.barcode,
    namaBarang: a1.nama,
    pelapor: 'Dr. Hendra Wijaya, M.Kom.',
    kontakPelapor: '081234560010',
    lokasi: 'Fakultas Teknik (Informatika)',
    kategoriMasalah: 'Jaringan & Internet',
    prioritas: 'Kritis',
    deskripsi: 'Koneksi Wi-Fi dan switch utama lambat',
    customNowMs: Date.UTC(2026, 10, 5, 8, 0, 0)
  });
  AppDatabase.processDamageTicket(t1.id, 'verifikasi-delegasi', {
    urgensiBaru: 'Kritis',
    targetTechnicianId: 'USR-ACT-04',
    catatan: 'Ditangani Cloud & Infra',
    customNowMs: Date.UTC(2026, 10, 5, 8, 10, 0)
  });
  AppDatabase.processDamageTicket(t1.id, 'butuh-suku-cadang', {
    namaSukuCadang: 'Kabel Fiber Patchcord LC-LC',
    customNowMs: Date.UTC(2026, 10, 5, 8, 30, 0)
  });
  AppDatabase.processDamageTicket(t1.id, 'lanjut-perbaikan', {
    catatan: 'Patchcord sudah terpasang',
    customNowMs: Date.UTC(2026, 10, 5, 9, 0, 0)
  });
  AppDatabase.processDamageTicket(t1.id, 'selesai-perbaikan', {
    resolusiAkhir: 'Koneksi normal kembali',
    customNowMs: Date.UTC(2026, 10, 5, 10, 0, 0)
  });

  const t2 = AppDatabase.addDamageTicket({
    kodeUnikAset: 'AST-UMC-002',
    barcode: '90001002',
    namaBarang: 'Switch Cisco Catalyst 2960X',
    pelapor: 'Siti Aminah, S.Pd.',
    kontakPelapor: '081234560011',
    lokasi: 'Biro Administrasi Akademik (BAA)',
    kategoriMasalah: 'Sistem Informasi',
    prioritas: 'Tinggi',
    deskripsi: 'Sinkronisasi data akademik gagal',
    customNowMs: Date.UTC(2026, 10, 6, 9, 0, 0)
  });
  AppDatabase.processDamageTicket(t2.id, 'verifikasi-delegasi', {
    urgensiBaru: 'Tinggi',
    targetTechnicianId: 'USR-ACT-05',
    catatan: 'Ditangani System Analyst',
    customNowMs: Date.UTC(2026, 10, 6, 9, 15, 0)
  });

  // Seed System Proposal
  AppDatabase.setActiveUser('USR-ACT-10A');
  AppDatabase.addSystemProposal({
    namaSistem: 'Sistem Informasi Bebas Pustaka Digital',
    pemohon: 'Dr. Hendra Wijaya, M.Kom.',
    unitKerja: 'Perpustakaan Pusat UMC',
    nidnNik: '0411223344',
    kontakWhatsapp: '081234560010',
    email: 'hendra.dosen@umc.ac.id',
    deskripsiKebutuhan: 'Otomatisasi surat bebas pustaka mahasiswa tingkat akhir',
    latarBelakang: 'Mempercepat layanan yudisium',
    targetPengguna: 'Mahasiswa dan Pustakawan',
    customNowMs: Date.UTC(2026, 10, 3, 9, 0, 0)
  });

  // Seed 5 Surveys across modules
  AppDatabase.setActiveUser('USR-ACT-03');
  const surveySeeds: Array<{ moduleType: 'Incident' | 'Loan' | 'SystemProposal'; entityId: string; entityTitle: string }> = [
    { moduleType: 'Incident', entityId: t1.id, entityTitle: a1.nama },
    { moduleType: 'Incident', entityId: 'TKT-SEED-02', entityTitle: 'Printer Ruang BAA' },
    { moduleType: 'Loan', entityId: 'PINJAM-SEED-01', entityTitle: 'Proyektor Epson EB-X500' },
    { moduleType: 'Loan', entityId: 'PINJAM-SEED-02', entityTitle: 'Laptop Dell Latitude 5430' },
    { moduleType: 'SystemProposal', entityId: 'SYS-SEED-01', entityTitle: 'Portal Yudisium Online' }
  ];
  surveySeeds.forEach((s, idx) => {
    AppDatabase.submitSurveyResponse({
      moduleType: s.moduleType,
      entityId: s.entityId,
      entityTitle: s.entityTitle,
      ratings: { q1: 5, q2: 4 + (idx % 2), q3: 5 },
      feedbackText: 'Pelayanan baik dan responsif',
      customNowMs: Date.UTC(2026, 10, 10 + idx, 10, 0, 0)
    });
  });

  AppDatabase.setActiveUser('USR-ACT-03');
}
