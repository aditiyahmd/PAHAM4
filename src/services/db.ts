import {
  Asset,
  AssetStatus,
  LoanTicket,
  LoanStatus,
  DamageTicket,
  DamageStatus,
  ActivityLog,
  AppStatistics,
  TechnicianUser,
  TechnicianRole,
  RepairCategory,
  LoanHandoverMethod,
  SparePartItem,
  SparePartStatus,
  TicketUrgency,
  PicPerformanceReport,
  BukuPenerimaanItem,
  BukuPengeluaranItem,
  BukuAsetInventarisRekap,
  SystemProposal,
  SystemProposalStatus,
  NotificationLog,
  AuditTrailItem,
  AppUser,
  ActorCode,
  ApiRegistration
} from '../types';
import { AccessControlService, SEED_USERS } from './rbac';

export interface SparePartWithTicket {
  sparePartId: string;
  namaKomponen: string;
  statusPengadaan: SparePartStatus;
  ticketId: string;
  ticketStatus: string;
  urgensi: TicketUrgency;
  barcode: string;
  kodeUnikAset: string;
  namaBarang: string;
  lokasi: string;
  pelapor: string;
  picTeknisi?: TechnicianRole;
  namaPicTeknisi?: string;
  assignedTechnicianId?: string;
  tanggalKebutuhan?: string;
  tanggalBeli?: string;
  tanggalDigunakan?: string;
  catatan?: string;
}

const STORAGE_KEYS = {
  ASSETS: 'pusdatin_assets_v4',
  LOANS: 'pusdatin_loans_v4',
  DAMAGES: 'pusdatin_damages_v4',
  LOGS: 'pusdatin_logs_v4',
  KEPALA: 'pusdatin_kepala_v4',
  GAS_URL: 'pusdatin_gas_url_v4',
  MASTER_LOCATIONS: 'pusdatin_master_locations_v4',
  MASTER_CATEGORIES: 'pusdatin_master_categories_v4',
  USERS: 'pusdatin_users_v4',
  ACTIVE_USER_ID: 'pusdatin_active_user_id_v4',
  BUKU_PENERIMAAN: 'pusdatin_buku_penerimaan_v4',
  BUKU_PENGELUARAN: 'pusdatin_buku_pengeluaran_v4',
  SYSTEM_PROPOSALS: 'pusdatin_system_proposals_v4',
  NOTIFICATIONS: 'pusdatin_notifications_v4',
  AUDIT_TRAIL: 'pusdatin_audit_trail_v4',
  API_REGISTRATIONS: 'pusdatin_api_registrations_v4'
};

export const INITIAL_LOCATIONS: string[] = [
  'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
  'Ruang Server PUSDATIN Kampus 1',
  'Laboratorium Komputer 1 (Kampus 1)',
  'Laboratorium Komputer 2 (FKIP)',
  'Biro Administrasi Umum (BAU)',
  'Biro Administrasi Akademik (BAA)',
  'Fakultas Teknik (Informatika)',
  'Gedung FKIP Lantai 2',
  'Gedung Rektorat Kampus 1 Lt. 3',
  'Aula Ahmad Dahlan Kampus 2',
  'Perpustakaan Pusat UMC',
  'Ruang LPPM UMC'
];

export const INITIAL_CATEGORIES: string[] = [
  'Komputer & Laptop',
  'Networking',
  'Multimedia',
  'Perlengkapan Kantor',
  'Server & Storage',
  'Kabel & Aksesoris',
  'Audio System'
];

// Helper to normalize asset status to Section 4.1 & operational status
export const normalizeAssetStatus = (st: string): AssetStatus => {
  if (
    st === 'Tersedia' ||
    st === 'Digunakan' ||
    st === 'Dipinjam' ||
    st === 'Rusak' ||
    st === 'Diperbaiki' ||
    st === 'Rusak Total' ||
    st === 'Maintenance' ||
    st === 'Tidak Layak'
  ) {
    return st as AssetStatus;
  }
  if (st === 'Berfungsi Kembali') return 'Tersedia';
  return 'Tersedia';
};

// Helper to normalize loan status to Section 4.3
export const normalizeLoanStatus = (st: string): LoanStatus => {
  if (st === 'Menunggu') return 'Diajukan';
  if (st === 'Disetujui') return 'Diserahkan';
  return st as LoanStatus;
};

// Helper to normalize damage status to Section 4.2
export const normalizeDamageStatus = (st: string): DamageStatus => {
  if (st === 'Baru' || st === 'Open') return 'Open/Unassigned';
  if (st === 'Diterima') return 'Assigned';
  if (st === 'Perbaikan') return 'In Progress';
  if (st === 'Menunggu Suku Cadang' || st === 'Pending Procurement') return 'Pending – Menunggu Suku Cadang';
  if (st === 'Selesai') return 'Resolved';
  if (st === 'Closed') return 'Closed – Manual';
  return st as DamageStatus;
};

// Initial Assets with immutable kodeUnikAset (BR-001) and QR payload (BR-002)
const INITIAL_ASSETS: Asset[] = [
  {
    idAset: 'AST-001',
    barcode: '30192848',
    kodeUnikAset: 'AST-UMC-2026-001',
    nama: 'Laptop ASUS ExpertBook B1 Core i7 16GB',
    kategori: 'Komputer & Laptop',
    merekModel: 'ASUS ExpertBook B1 B1402CBA',
    nomorSeri: 'ASUS-EXP-2026-001',
    spesifikasi: 'Intel Core i7-1255U, 16GB DDR4, 512GB NVMe SSD, 14 Inch FHD IPS',
    lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    status: 'Tersedia',
    tanggalMasuk: '2026-10-15',
    tanggalPembelian: '2026-10-10',
    nomorPoInvoice: 'PO/UMC-IT/2026/X/089',
    vendorSupplier: 'PT. Metrodata Electronics Tbk',
    hargaBeli: 14500000,
    masaGaransi: '2 Tahun Garansi Resmi ASUS Indonesia (s/d Oktober 2028)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    idPenerimaanTerkait: 'RCV-2026-001'
  },
  {
    idAset: 'AST-002',
    barcode: '30918274',
    kodeUnikAset: 'AST-UMC-2026-002',
    nama: 'Laptop Dell Latitude 5430 Core i5 16GB',
    kategori: 'Komputer & Laptop',
    merekModel: 'Dell Latitude 5430 Rugged Series',
    nomorSeri: 'DELL-LAT-5430-811',
    spesifikasi: 'Intel Core i5-1245U vPro, 16GB DDR4, 512GB SSD, 14 Inch FHD Anti-Glare',
    lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    status: 'Tersedia',
    tanggalMasuk: '2026-10-20',
    tanggalPembelian: '2026-10-12',
    nomorPoInvoice: 'PO/UMC-IT/2026/X/092',
    vendorSupplier: 'CV. Cirebon Komputindo Mandiri',
    hargaBeli: 12800000,
    masaGaransi: '3 Tahun ProSupport Dell Onsite (s/d Oktober 2029)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    idPenerimaanTerkait: 'RCV-2026-001'
  },
  {
    idAset: 'AST-003',
    barcode: '20495812',
    kodeUnikAset: 'AST-UMC-2026-003',
    nama: 'Laptop Lenovo ThinkPad L14 Gen 3',
    kategori: 'Komputer & Laptop',
    merekModel: 'Lenovo ThinkPad L14 Gen 3 AMD',
    nomorSeri: 'LNV-TP-L14-992',
    spesifikasi: 'AMD Ryzen 5 PRO 5675U, 16GB RAM, 512GB SSD NVMe, TrackPoint, Win 11 Pro',
    pengguna: 'Hilyah Aulia, S.T.',
    bidangPengguna: 'Biro Administrasi Umum (BAU)',
    lokasi: 'Biro Administrasi Umum (BAU)',
    status: 'Dipinjam',
    tanggalMasuk: '2026-09-10',
    tanggalPembelian: '2026-08-25',
    nomorPoInvoice: 'PO/UMC-BAU/2026/VIII/044',
    vendorSupplier: 'PT. Bhinneka Mentari Dimensi',
    hargaBeli: 13200000,
    masaGaransi: '3 Tahun Premier Support Lenovo (s/d Agustus 2029)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    idPenerimaanTerkait: 'RCV-2026-001'
  },
  {
    idAset: 'AST-004',
    barcode: '50291847',
    kodeUnikAset: 'AST-UMC-2026-004',
    nama: 'Proyektor Epson EB-E500 3300 Lumens',
    kategori: 'Multimedia',
    merekModel: 'Epson 3LCD EB-E500 Series',
    nomorSeri: 'EPSON-EB-5001',
    spesifikasi: 'XGA 3300 ANSI Lumens, Kontras 15.000:1, HDMI/VGA/USB, Dilengkapi Tas & Kabel',
    lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    status: 'Tersedia',
    tanggalMasuk: '2026-08-20',
    tanggalPembelian: '2026-08-15',
    nomorPoInvoice: 'PO/UMC-MM/2026/VIII/012',
    vendorSupplier: 'CV. Cipta Visual Mandiri',
    hargaBeli: 5400000,
    masaGaransi: '2 Tahun Unit / 1000 Jam Lampu (s/d Agustus 2028)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    idPenerimaanTerkait: 'RCV-2026-002'
  },
  {
    idAset: 'AST-005',
    barcode: '10928374',
    kodeUnikAset: 'AST-UMC-2026-005',
    nama: 'PC All-in-One HP ProOne 400 G4',
    kategori: 'Komputer & Laptop',
    merekModel: 'HP ProOne 400 G4 23.8 Non-Touch AIO',
    nomorSeri: 'HP-PO400-089',
    spesifikasi: 'Intel Core i5-8500, 8GB DDR4, 256GB SSD + 1TB HDD, 23.8 FHD IPS, Keyboard Mouse HP',
    pengguna: 'Drs. H. Mulyono, M.Pd.',
    bidangPengguna: 'Laboratorium Komputer 2 (FKIP)',
    lokasi: 'Laboratorium Komputer 2 (FKIP)',
    status: 'Digunakan',
    tanggalMasuk: '2026-07-01',
    tanggalPembelian: '2026-06-20',
    nomorPoInvoice: 'PO/UMC-LAB/2026/VI/102',
    vendorSupplier: 'PT. Harrisma Informatika Jaya',
    hargaBeli: 11500000,
    masaGaransi: '1 Tahun Garansi Resmi HP (s/d Juni 2027)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Laboratorium Komputer 2 (FKIP)'
  },
  {
    idAset: 'AST-006',
    barcode: '84930219',
    kodeUnikAset: 'AST-UMC-2026-006',
    nama: 'Access Point Ruijie Reyee RG-RAP2200(E)',
    kategori: 'Networking',
    merekModel: 'Ruijie Reyee Cloud AP RG-RAP2200(E)',
    nomorSeri: 'RJ-AP-2200-881',
    spesifikasi: 'Wi-Fi 5 AC1300 Dual Band Gigabit PoE Ceiling AP, Cloud Managed by Reyee Cloud',
    pengguna: 'Fakultas Keguruan dan Ilmu Pendidikan',
    bidangPengguna: 'Gedung FKIP Lantai 2',
    lokasi: 'Gedung FKIP Lantai 2',
    status: 'Digunakan',
    tanggalMasuk: '2026-06-12',
    tanggalPembelian: '2026-06-01',
    nomorPoInvoice: 'PO/UMC-NET/2026/VI/018',
    vendorSupplier: 'PT. Synnex Metrodata Indonesia',
    hargaBeli: 1250000,
    masaGaransi: '3 Tahun Garansi Distributor Resmi Ruijie (s/d Juni 2029)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Gedung FKIP Lantai 2',
    idPenerimaanTerkait: 'RCV-2026-003'
  },
  {
    idAset: 'AST-007',
    barcode: '62910482',
    kodeUnikAset: 'AST-UMC-2026-007',
    nama: 'Switch Cisco Catalyst 2960-X 24 Port Gigabit',
    kategori: 'Networking',
    merekModel: 'Cisco WS-C2960X-24TS-L Catalyst',
    nomorSeri: 'CSCO-2960X-4421',
    spesifikasi: '24 Port 10/100/1000 Gigabit Ethernet + 4 SFP, Managed Switch Layer 2 Enterprise LAN Base',
    pengguna: 'Tim Infrastruktur Jaringan Kampus',
    bidangPengguna: 'Ruang Server PUSDATIN Kampus 1',
    lokasi: 'Ruang Server PUSDATIN Kampus 1',
    status: 'Digunakan',
    tanggalMasuk: '2026-05-18',
    tanggalPembelian: '2026-05-10',
    nomorPoInvoice: 'PO/UMC-INF/2026/V/005',
    vendorSupplier: 'PT. Mastersystem Infotama',
    hargaBeli: 18500000,
    masaGaransi: 'Enhanced Limited Lifetime Warranty (Cisco LLW)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Ruang Server PUSDATIN Kampus 1'
  },
  {
    idAset: 'AST-008',
    barcode: '94820193',
    kodeUnikAset: 'AST-UMC-2026-008',
    nama: 'Printer Epson L3210 All-in-One EcoTank',
    kategori: 'Perlengkapan Kantor',
    merekModel: 'Epson EcoTank L3210 Multifunction',
    nomorSeri: 'EPS-L3210-990',
    spesifikasi: 'Print, Scan, Copy Ink Tank System Original, Resolusi 5760 x 1440 dpi',
    pengguna: 'Ahmad Fauzi (Laboran)',
    bidangPengguna: 'Laboratorium Komputer 1 (Kampus 1)',
    lokasi: 'Laboratorium Komputer 1 (Kampus 1)',
    status: 'Maintenance',
    tanggalMasuk: '2026-04-10',
    tanggalPembelian: '2026-04-02',
    nomorPoInvoice: 'PO/UMC-LAB/2026/IV/033',
    vendorSupplier: 'CV. Sumber Makmur Komputer',
    hargaBeli: 2450000,
    masaGaransi: '2 Tahun / 30.000 Lembar Garansi Resmi Epson (s/d April 2028)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Laboratorium Komputer 1 (Kampus 1)'
  }
];

// 8.2 Tabel 7: Buku Penerimaan Aset
const INITIAL_BUKU_PENERIMAAN: BukuPenerimaanItem[] = [
  {
    idPenerimaan: 'RCV-2026-001',
    tanggalPenerimaan: '2026-10-15',
    dari: 'PT. Metrodata Electronics Tbk',
    nomorFaktur: 'INV-METRO/2026/X/1092',
    tanggalFaktur: '2026-10-10',
    namaAset: 'Laptop ASUS ExpertBook B1 Core i7 16GB',
    kategori: 'Komputer & Laptop',
    banyaknya: 5,
    hargaSatuan: 14500000,
    jumlahHarga: 72500000, // BR-003: 5 × 14.500.000
    nomorBeritaAcara: 'BAST-PUSDATIN/2026/X/041',
    tanggalBeritaAcara: '2026-10-15',
    keterangan: 'Pengadaan laptop operasional dosen dan inventaris peminjaman UMC tahap 2',
    tercatatUnitCount: 5,
    petugas: 'Aditiya Ahmad Fadila, S.Kom.'
  },
  {
    idPenerimaan: 'RCV-2026-002',
    tanggalPenerimaan: '2026-08-20',
    dari: 'CV. Cipta Visual Mandiri',
    nomorFaktur: 'INV-CVM/2026/VIII/044',
    tanggalFaktur: '2026-08-15',
    namaAset: 'Proyektor Epson EB-E500 3300 Lumens',
    kategori: 'Multimedia',
    banyaknya: 3,
    hargaSatuan: 5400000,
    jumlahHarga: 16200000, // BR-003: 3 × 5.400.000
    nomorBeritaAcara: 'BAST-PUSDATIN/2026/VIII/019',
    tanggalBeritaAcara: '2026-08-20',
    keterangan: 'Proyektor portable cadangan ruang smart classroom kampus 2',
    tercatatUnitCount: 3,
    petugas: 'Aditiya Ahmad Fadila, S.Kom.'
  },
  {
    idPenerimaan: 'RCV-2026-003',
    tanggalPenerimaan: '2026-06-12',
    dari: 'PT. Synnex Metrodata Indonesia',
    nomorFaktur: 'INV-SMI/2026/VI/0988',
    tanggalFaktur: '2026-06-01',
    namaAset: 'Access Point Ruijie Reyee RG-RAP2200(E)',
    kategori: 'Networking',
    banyaknya: 10,
    hargaSatuan: 1250000,
    jumlahHarga: 12500000, // BR-003: 10 × 1.250.000
    nomorBeritaAcara: 'BAST-PUSDATIN/2026/VI/011',
    tanggalBeritaAcara: '2026-06-12',
    keterangan: 'Perluasan coverage Wi-Fi Kampus 1 dan Kampus 2 UMC',
    tercatatUnitCount: 10,
    petugas: 'Ir. Faisal Hakim, M.T.'
  }
];

// 8.2 Tabel 8: Buku Pengeluaran Aset
const INITIAL_BUKU_PENGELUARAN: BukuPengeluaranItem[] = [
  {
    idPengeluaran: 'OUT-2026-001',
    tanggalPenyerahan: '2026-11-04',
    kodeUnikAset: 'AST-UMC-2026-003',
    barcode: '20495812',
    namaAset: 'Laptop Lenovo ThinkPad L14 Gen 3',
    untuk: 'Hilyah Aulia, S.T. (Biro Administrasi Umum)',
    jenisPengeluaran: 'Peminjaman',
    idTiketPeminjaman: 'PJM-20261104-1029',
    keterangan: 'Peminjaman operasional re-akreditasi institusi UMC (Otomatis dari Modul C)',
    petugas: 'Aditiya Ahmad Fadila, S.Kom.'
  },
  {
    idPengeluaran: 'OUT-2026-002',
    tanggalPenyerahan: '2026-05-18',
    kodeUnikAset: 'AST-UMC-2026-007',
    barcode: '62910482',
    namaAset: 'Switch Cisco Catalyst 2960-X 24 Port Gigabit',
    untuk: 'Ruang Server PUSDATIN Kampus 1',
    jenisPengeluaran: 'Penggunaan',
    keterangan: 'Pemasangan permanen rack server core switch kampus',
    petugas: 'Ir. Faisal Hakim, M.T.'
  }
];

// 8.2 Tabel 10: Peminjaman Aset (Status Enum: Diajukan, Diterima, Ditolak, Dikonfirmasi, Diserahkan, Terlambat, Dikembalikan, Ditutup)
const INITIAL_LOANS: LoanTicket[] = [
  {
    id: 'PJM-20261104-1029',
    peminjam: 'Hilyah Aulia, S.T.',
    nik: '0412088801',
    unit: 'Biro Administrasi Umum (BAU)',
    kontak: '081234567890',
    email: 'hilyah@umc.ac.id',
    barangPinjaman: 'Laptop Lenovo ThinkPad L14 Gen 3',
    jumlah: 1,
    tglPinjam: '2026-11-04',
    tglKembali: '2026-11-08',
    status: 'Diserahkan', // Aset sedang di peminjam
    barcode: '20495812',
    kodeUnikAset: 'AST-UMC-2026-003',
    namaBarangT: 'Laptop Lenovo ThinkPad L14 Gen 3 AMD',
    kondisi: 'Baik / Lengkap dengan Charger & Tas',
    petugas: 'Aditiya Ahmad Fadila, S.Kom.',
    catatan: 'Untuk persiapan visitasi akreditasi prodi',
    tglAju: '04/11/2026 08:30',
    tglAmbil: '2026-11-04',
    metodePengambilan: 'Diambil di Ruang PUSDATIN',
    jadwalPengambilan: '2026-11-04 pukul 09:00 WIB',
    lokasiPengambilan: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    nomorSuratPeminjaman: 'SP-PUSDATIN/2026/XI/1029',
    penandatangan: {
      peminjam: 'Hilyah Aulia, S.T.',
      petugas: 'Aditiya Ahmad Fadila, S.Kom.',
      kepalaPusdatin: 'Dr. Ir. H. Ahmad Dahlan, M.T.'
    }
  },
  {
    id: 'PJM-20261106-9921',
    peminjam: 'BEM Universitas Muhammadiyah Cirebon',
    nik: '2201090044',
    unit: 'Organisasi Mahasiswa (BEM UMC)',
    kontak: '087788991122',
    email: 'bem@umc.ac.id',
    barangPinjaman: 'Proyektor Epson EB-E500 3300 Lumens',
    jumlah: 1,
    tglPinjam: '2026-11-12',
    tglKembali: '2026-11-13',
    status: 'Diajukan', // Menunggu verifikasi Admin
    catatan: 'Seminar Nasional Kepemudaan UMC di Aula Ahmad Dahlan',
    tglAju: '06/11/2026 14:00'
  }
];

// 8.2 Tabel 2: Tiket Helpdesk (Status: Open/Unassigned, Assigned, In Progress, Pending – Menunggu Suku Cadang, Resolved, Closed – Auto, Closed – Manual, Re-opened)
const INITIAL_DAMAGES: DamageTicket[] = [
  {
    id: 'TKT-20261107-105',
    kodeUnikAset: 'AST-UMC-2026-004',
    barcode: '50291847',
    namaBarang: 'Proyektor Epson EB-E500 3300 Lumens',
    pelapor: 'Drs. H. Mulyono, M.Pd. (Dosen FKIP)',
    kontakPelapor: '081223344556',
    emailPelapor: 'mulyono@umc.ac.id',
    lokasi: 'Smart Classroom Gedung B Lt.3',
    lokasiAwal: 'Smart Classroom Gedung B Lt.3',
    deskripsi: 'Tampilan proyektor berkedip dan lampu indikator filter merah menyala saat digunakan kuliah umum.',
    tanggalLapor: '2026-11-07 08:30',
    status: 'Open/Unassigned',
    prioritas: 'Tinggi',
    urgensi: 'Tinggi',
    kategoriMasalah: 'Hardware',
    slaTargetHours: 12,
    slaDeadline: '2026-11-07 20:30',
    slaStatus: 'On Track',
    jenisAset: 'Fisik',
    picTeknisi: 'IT Support & Helpdesk Specialist',
    namaPicTeknisi: 'Aditiya Ahmad Fadila, S.Kom.',
    assignedTechnicianId: 'USR-ACT-03',
    catatanAdmin: 'Laporan baru masuk via SSO. Menunggu verifikasi dan dispatch teknisi.',
    riwayatStatus: [
      {
        status: 'Open/Unassigned',
        timestamp: '07/11/2026 08:30',
        catatan: 'Tiket diterbitkan dengan nomor TKT-20261107-105 (SLA: 12 Jam).',
        petugas: 'Sistem SSO UMC'
      }
    ]
  },
  {
    id: 'TKT-20261107-092',
    kodeUnikAset: 'AST-UMC-2026-006',
    barcode: '84930219',
    namaBarang: 'Access Point Ruijie Reyee RG-RAP2200(E)',
    pelapor: 'Drs. Supriyanto, M.Pd.',
    kontakPelapor: '085290192837',
    emailPelapor: 'supriyanto@umc.ac.id',
    lokasi: 'Gedung FKIP Lantai 2',
    lokasiAwal: 'Gedung FKIP Lantai 2',
    deskripsi: 'Sinyal Wi-Fi sering putus dan roaming lambat di area koridor lantai 2.',
    tanggalLapor: '2026-11-07 07:15',
    status: 'Assigned',
    prioritas: 'Tinggi',
    urgensi: 'Tinggi',
    kategoriMasalah: 'Jaringan / Server / Cloud',
    slaTargetHours: 8,
    slaDeadline: '2026-11-07 15:15',
    slaStatus: 'On Track',
    jenisAset: 'Fisik',
    picTeknisi: 'Cloud & Infrastructure Engineer',
    namaPicTeknisi: 'Ir. Faisal Hakim, M.T.',
    assignedTechnicianId: 'USR-ACT-04',
    catatanAdmin: 'Tiket didistribusikan ke PIC Cloud & Infrastructure Engineer untuk cek controller Reyee.',
    riwayatStatus: [
      {
        status: 'Open/Unassigned',
        timestamp: '07/11/2026 07:15',
        catatan: 'Laporan kendala Wi-Fi diajukan.',
        petugas: 'Drs. Supriyanto, M.Pd.'
      },
      {
        status: 'Assigned',
        timestamp: '07/11/2026 07:45',
        catatan: 'Didistribusikan ke Ir. Faisal Hakim, M.T. (Cloud & Infrastructure Engineer).',
        petugas: 'Aditiya Ahmad Fadila, S.Kom.'
      }
    ]
  },
  {
    id: 'TKT-20261106-101',
    kodeUnikAset: 'AST-UMC-2026-008',
    barcode: '94820193',
    namaBarang: 'Printer Epson L3210 All-in-One EcoTank',
    pelapor: 'Ahmad Fauzi (Laboran)',
    kontakPelapor: '081394857211',
    emailPelapor: 'fauzi.lab@umc.ac.id',
    lokasi: 'Laboratorium Komputer 1 (Kampus 1)',
    lokasiAwal: 'Laboratorium Komputer 1 (Kampus 1)',
    deskripsi: 'Paper jam berulang kali dan lampu merah berkedip terus (roller karet aus & kabel head retak).',
    tanggalLapor: '2026-11-06 10:15',
    status: 'Pending – Menunggu Suku Cadang',
    prioritas: 'Sedang',
    urgensi: 'Sedang',
    kategoriMasalah: 'Hardware',
    slaTargetHours: 48,
    slaDeadline: '2026-11-08 10:15',
    slaStatus: 'On Track',
    jenisAset: 'Fisik',
    skenarioPerbaikan: 'Fisik (Bawa ke PUSDATIN)',
    cabangPerbaikan: 'Butuh Suku Cadang',
    picTeknisi: 'IT Support & Helpdesk Specialist',
    namaPicTeknisi: 'Aditiya Ahmad Fadila, S.Kom.',
    assignedTechnicianId: 'USR-ACT-03',
    kategoriPerbaikan: 'Suku Cadang (Perlu Anggaran)',
    namaSukuCadang: 'Roller Karet Pickup Paper Epson L3210',
    sumberAnggaran: 'Pengajuan RKAT Kampus',
    sukuCadangList: [
      {
        id: 'SP-101-1',
        idTiket: 'TKT-20261106-101',
        namaKomponen: 'Roller Karet Pickup Paper Epson L3210',
        jumlah: 1,
        statusPengadaan: 'Diminta',
        tanggalKebutuhan: '2026-11-06 10:30'
      }
    ],
    riwayatStatus: [
      {
        status: 'Open/Unassigned',
        timestamp: '06/11/2026 10:15',
        catatan: 'Laporan kerusakan printer masuk.',
        petugas: 'Ahmad Fauzi'
      },
      {
        status: 'Assigned',
        timestamp: '06/11/2026 10:30',
        catatan: 'Ditugaskan ke IT Support.',
        petugas: 'Admin'
      },
      {
        status: 'Pending – Menunggu Suku Cadang',
        timestamp: '06/11/2026 11:00',
        catatan: 'Komponen roller karet aus, diajukan pengadaan suku cadang (Status: Diminta).',
        petugas: 'Aditiya Ahmad Fadila, S.Kom.'
      }
    ]
  }
];

// 8.2 Tabel 14: Pengajuan Sistem Baru (F-DEV-01, 5-Tahap Workflow)
const INITIAL_SYSTEM_PROPOSALS: SystemProposal[] = [
  {
    id: 'SYS-2026-001',
    namaSistem: 'Sistem Informasi Manajemen MBKM & Magang Kampus Merdeka UMC',
    pemohon: 'Dr. Hendra Wijaya, M.Pd.',
    unitKerja: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    nidnNik: '0419087502',
    kontakWhatsapp: '081234567890',
    email: 'hendra.dosen@umc.ac.id',
    deskripsiKebutuhan: 'Portal pencatatan logbook magang MBKM, konversi nilai SKS otomatis ke SIAKAD, dan tanda tangan digital sertifikat pembimbing lapangan.',
    latarBelakang: 'Pelaksanaan program MBKM selama ini dicatat manual dengan Google Drive sehingga data sering tercecer dan verifikasi SKS memakan waktu lebih dari 3 minggu.',
    targetPengguna: 'Mahasiswa, Dosen Pembimbing Lapangan, Koordinator MBKM Fakultas, dan BAA UMC',
    tanggalPengajuan: '2026-11-02 09:30',
    status: 'status_pengembangan',
    verifikasiAdmin: {
      petugas: 'Aditiya Ahmad Fadila, S.Kom.',
      tanggal: '2026-11-03 10:00',
      lengkap: true,
      catatan: 'Dokumen TOR dan skema alur pengusulan telah lengkap sesuai standar PUSDATIN.'
    },
    analisisKebutuhan: {
      analystName: 'Novi Andriani, M.Kom.',
      tanggal: '2026-11-04 14:00',
      arsitekturData: 'Relational PostgreSQL, integrasi REST API SIAKAD, schema: mbkm_logbook, mbkm_konversi_sks, mbkm_mitra.',
      lingkupFitur: 'Autentikasi SSO Google, Dashboard Mahasiswa, Modul Review Dosen, Endpoint Sync Nilai SIAKAD.',
      estimasiSprintWeeks: 4,
      catatan: 'Skema tabel dan relasi foreign key telah divalidasi dengan database administrator.'
    },
    verifikasiKeamanan: {
      auditorName: 'Rian Hidayat, M.Kom.',
      tanggal: '2026-11-05 11:30',
      risikoKeamanan: 'Rendah',
      rekomendasiEnkripsi: 'Wajib TLS 1.3, JWT HttpOnly Cookie, enkripsi kolom nilai & NIK dengan AES-256.',
      statusVerifikasi: 'Lolos',
      catatan: 'Telah lolos review keamanan OWASP Top 10 dan disetujui untuk tahap approval pimpinan.'
    },
    approvalPimpinan: {
      pejabat: 'Dr. Ir. H. Ahmad Dahlan, M.T.',
      tanggal: '2026-11-06 09:00',
      keputusan: 'Disetujui',
      catatan: 'Disetujui untuk dikembangkan internal PUSDATIN. Prioritas sprint bulan November 2026.'
    },
    pengembangan: {
      leadDev: 'Bayu Pratama, S.Kom.',
      frontendDev: 'Dimas Saputra, S.Kom.',
      backendDev: 'Eko Prasetyo, S.Kom.',
      progresPersen: 65,
      logProgres: [
        {
          tanggal: '2026-11-07 10:00',
          petugas: 'Bayu Pratama, S.Kom.',
          deskripsi: 'Setup repository monorepo, database migrations PostgreSQL, dan endpoint auth JWT.',
          progres: 25
        },
        {
          tanggal: '2026-11-08 16:30',
          petugas: 'Dimas Saputra, S.Kom.',
          deskripsi: 'Penyusunan UI Dashboard Logbook Mahasiswa & Modul Upload Dokumen Mitra.',
          progres: 45
        },
        {
          tanggal: '2026-11-09 15:00',
          petugas: 'Eko Prasetyo, S.Kom.',
          deskripsi: 'Pengujian endpoint REST API SIAKAD Sync & implementasi RBAC peran koordinator.',
          progres: 65
        }
      ],
      tanggalMulai: '2026-11-07',
      tanggalTarget: '2026-11-28'
    },
    asetDihasilkan: {
      jenisAset: 'Server VPS',
      namaAset: 'Cloud VPS Node MBKM UMC (Ubuntu 24.04 4vCPU 8GB)',
      spesifikasi: 'VPS Cloud Kampus 1, IP: 10.20.10.88, 80GB NVMe SSD, Docker Compose Containerized',
      sudahDiregistrasi: false
    },
    dokumenTeknis: [
      {
        namaDokumen: 'TOR_Pengembangan_Sistem_MBKM_UMC_v1.0.pdf',
        tipe: 'TOR',
        urlOrFilename: 'TOR_Pengembangan_Sistem_MBKM_UMC_v1.0.pdf',
        tanggalUpload: '2026-11-02 09:30'
      },
      {
        namaDokumen: 'Arsitektur_Data_ERD_MBKM_SIAKAD.pdf',
        tipe: 'Arsitektur',
        urlOrFilename: 'Arsitektur_Data_ERD_MBKM_SIAKAD.pdf',
        tanggalUpload: '2026-11-04 14:00'
      }
    ]
  },
  {
    id: 'SYS-2026-002',
    namaSistem: 'Aplikasi Monitoring Presensi Mahasiswa Berbasis Geofencing Mobile',
    pemohon: 'Biro Administrasi Akademik (BAA)',
    unitKerja: 'Biro Administrasi Akademik (BAA)',
    nidnNik: '0420018201',
    kontakWhatsapp: '081987654321',
    email: 'baa@umc.ac.id',
    deskripsiKebutuhan: 'Aplikasi presensi mahasiswa via smartphone dengan validasi radius lokasi GPS (Geofencing 50 meter dari ruang kuliah) dan deteksi fake GPS.',
    latarBelakang: 'Mengurangi antrean presensi fingerprint di depan kelas dan mencegah titip presensi antar mahasiswa.',
    targetPengguna: 'Seluruh Mahasiswa dan Dosen Pengampu Mata Kuliah UMC',
    tanggalPengajuan: '2026-11-08 11:00',
    status: 'status_verifikasi',
    dokumenTeknis: [
      {
        namaDokumen: 'Spesifikasi_Kebutuhan_Presensi_Geofencing.pdf',
        tipe: 'TOR',
        urlOrFilename: 'Spesifikasi_Kebutuhan_Presensi_Geofencing.pdf',
        tanggalUpload: '2026-11-08 11:00'
      }
    ]
  }
];

// 8.2 Tabel 15: Notifikasi (WhatsApp / Email)
const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'NOTIF-001',
    tujuan: '081234567890',
    namaPenerima: 'Hilyah Aulia, S.T.',
    kanal: 'WhatsApp',
    jenisNotifikasi: 'Peminjaman Diserahkan',
    statusKirim: 'sent',
    timestamp: '2026-11-04 09:05',
    pesanPreview: 'Pengajuan peminjaman Laptop ThinkPad diserahkan resmi di Ruang PUSDATIN.'
  },
  {
    id: 'NOTIF-002',
    tujuan: '081223344556',
    namaPenerima: 'Drs. H. Mulyono, M.Pd.',
    kanal: 'WhatsApp',
    jenisNotifikasi: 'Tiket Dibuat',
    statusKirim: 'sent',
    timestamp: '2026-11-07 08:31',
    pesanPreview: 'Laporan kerusakan TKT-20261107-105 telah diterima sistem PAHAM (SLA: 12 Jam).'
  }
];

// 8.2 Tabel 16: Audit Trail (Immutable, BR-016)
const INITIAL_AUDIT_TRAIL: AuditTrailItem[] = [
  {
    id: 'AUD-001',
    entityType: 'Peminjaman Aset',
    entityId: 'PJM-20261104-1029',
    statusLama: 'Diajukan',
    statusBaru: 'Diserahkan',
    idPengguna: 'USR-ACT-03',
    namaPengguna: 'Aditiya Ahmad Fadila, S.Kom.',
    rolePengguna: 'IT Support & Helpdesk Specialist',
    timestamp: '2026-11-04 09:00',
    catatan: 'Verifikasi peminjaman disetujui, unit dialokasikan AST-UMC-2026-003, Surat Peminjaman SP-PUSDATIN/2026/XI/1029 dicetak.',
    ipAddress: '10.20.1.44 (SSO UMC)'
  },
  {
    id: 'AUD-002',
    entityType: 'Aset TI',
    entityId: 'AST-UMC-2026-003',
    statusLama: 'Tersedia',
    statusBaru: 'Dipinjam',
    idPengguna: 'USR-ACT-03',
    namaPengguna: 'Aditiya Ahmad Fadila, S.Kom.',
    rolePengguna: 'IT Support & Helpdesk Specialist',
    timestamp: '2026-11-04 09:00',
    catatan: 'Status aset beralih ke Dipinjam karena diserahkan ke Hilyah Aulia (BAU). Otomatis masuk Buku Pengeluaran Aset OUT-2026-001.',
    ipAddress: '10.20.1.44 (SSO UMC)'
  },
  {
    id: 'AUD-003',
    entityType: 'Tiket Helpdesk',
    entityId: 'TKT-20261107-092',
    statusLama: 'Open/Unassigned',
    statusBaru: 'Assigned',
    idPengguna: 'USR-ACT-03',
    namaPengguna: 'Aditiya Ahmad Fadila, S.Kom.',
    rolePengguna: 'IT Support & Helpdesk Specialist',
    timestamp: '2026-11-07 07:45',
    catatan: 'Admin mendistribusikan tiket jaringan Wi-Fi FKIP ke PIC Ir. Faisal Hakim, M.T. (Cloud & Infrastructure Engineer).',
    ipAddress: '10.20.1.44 (SSO UMC)'
  }
];

export class AppDatabase {
  // Storage Helpers
  private static load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }

  private static save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  // --- 8.2 TABEL 1 & 6: PENGGUNA & IDENTITY (SSO GOOGLE / LDAP) ---
  public static getUsers(): AppUser[] {
    const list = this.load<AppUser[]>(STORAGE_KEYS.USERS, SEED_USERS);
    if (!list || list.length === 0) return SEED_USERS;
    return list;
  }

  public static getActiveUser(): AppUser {
    const users = this.getUsers();
    try {
      const activeId = sessionStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
      if (activeId) {
        const found = users.find(u => u.id === activeId);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    // Default to ACT-03 (Admin / IT Support & Helpdesk Specialist)
    return users.find(u => u.role === 'ACT-03') || users[2] || SEED_USERS[2];
  }

  public static addUser(user: AppUser): void {
    const users = this.getUsers();
    if (!users.some(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase())) {
      this.save(STORAGE_KEYS.USERS, [...users, user]);
    }
  }

  public static setActiveUser(userId: string): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
      const user = this.getUsers().find(u => u.id === userId);
      if (user) {
        sessionStorage.setItem('pusdatin_admin_auth', user.role !== 'ACT-10' ? 'true' : 'false');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Backward compatibility alias for technicians
  public static getTechnicians(): TechnicianUser[] {
    const users = this.getUsers();
    return users.map(u => ({
      ...u,
      name: u.nama
    }));
  }

  public static getActiveTechnician(): TechnicianUser | null {
    const active = this.getActiveUser();
    if (active.role === 'ACT-10') return null;
    return {
      ...active,
      name: active.nama
    };
  }

  public static setActiveTechnician(techOrId: TechnicianUser | string | null): void {
    if (!techOrId) {
      const civitas = this.getUsers().find(u => u.role === 'ACT-10');
      if (civitas) this.setActiveUser(civitas.id);
      return;
    }
    const id = typeof techOrId === 'string' ? techOrId : techOrId.id;
    this.setActiveUser(id);
  }

  public static authenticateUser(email: string, password?: string): TechnicianUser | null {
    const users = this.getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (!password || !found.password || found.password === password) {
        return found;
      }
    }
    return null;
  }

  public static addTechnician(tech: Partial<AppUser> & { name?: string }): boolean {
    const users = this.getUsers();
    const id = `USR-${Date.now()}`;
    const newUser: AppUser = {
      id,
      nama: tech.nama || tech.name || 'Petugas Baru',
      email: tech.email || `petugas${users.length + 1}@umc.ac.id`,
      role: (tech.role as ActorCode) || 'ACT-03',
      roleName: (tech.roleName || 'IT Support & Helpdesk Specialist') as TechnicianRole,
      unit: tech.unit || 'PUSDATIN',
      phone: tech.phone || '081234567890',
      statusAkun: 'Aktif',
      sumberData: 'SDM',
      password: tech.password || 'pusdatin123',
      specialty: tech.specialty || '',
      isFullAccess: tech.isFullAccess || false,
      level: tech.level
    };
    this.save(STORAGE_KEYS.USERS, [...users, newUser]);
    return true;
  }

  public static updateTechnician(tech: Partial<AppUser> & { id: string; name?: string }): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === tech.id);
    if (idx === -1) return false;
    users[idx] = {
      ...users[idx],
      nama: tech.nama || tech.name || users[idx].nama,
      roleName: (tech.roleName || users[idx].roleName) as TechnicianRole,
      role: (tech.role as ActorCode) || users[idx].role,
      email: tech.email || users[idx].email,
      phone: tech.phone || users[idx].phone,
      password: tech.password || users[idx].password,
      specialty: tech.specialty ?? users[idx].specialty,
      isFullAccess: tech.isFullAccess ?? users[idx].isFullAccess,
      level: tech.level ?? users[idx].level
    };
    this.save(STORAGE_KEYS.USERS, users);
    return true;
  }

  public static deleteTechnician(id: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    this.save(STORAGE_KEYS.USERS, filtered);
    return true;
  }

  // --- 8.2 TABEL 16: AUDIT TRAIL STATUS TIKET & ASET (IMMUTABLE, BR-016) ---
  public static getAuditTrail(): AuditTrailItem[] {
    return this.load<AuditTrailItem[]>(STORAGE_KEYS.AUDIT_TRAIL, INITIAL_AUDIT_TRAIL);
  }

  public static addAuditTrail(item: Omit<AuditTrailItem, 'id' | 'timestamp'>): void {
    const list = this.getAuditTrail();
    const activeUser = this.getActiveUser();
    const newEntry: AuditTrailItem = {
      id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString('id-ID'),
      idPengguna: item.idPengguna || activeUser.id,
      namaPengguna: item.namaPengguna || activeUser.nama,
      rolePengguna: item.rolePengguna || activeUser.roleName,
      entityType: item.entityType,
      entityId: item.entityId,
      statusLama: item.statusLama,
      statusBaru: item.statusBaru,
      catatan: item.catatan,
      ipAddress: item.ipAddress || '10.20.1.25 (SSO Google UMC)'
    };
    this.save(STORAGE_KEYS.AUDIT_TRAIL, [newEntry, ...list]);
  }

  // --- 8.2 TABEL 15: NOTIFIKASI (WHATSAPP / EMAIL) ---
  public static getNotifications(): NotificationLog[] {
    return this.load<NotificationLog[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  public static addNotification(notif: Omit<NotificationLog, 'id' | 'timestamp'>): NotificationLog {
    const list = this.getNotifications();
    const newNotif: NotificationLog = {
      ...notif,
      id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString('id-ID')
    };
    this.save(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...list]);
    return newNotif;
  }

  // --- 8.2 TABEL 7: BUKU PENERIMAAN ASET (A.1) ---
  public static getBukuPenerimaan(): BukuPenerimaanItem[] {
    return this.load<BukuPenerimaanItem[]>(STORAGE_KEYS.BUKU_PENERIMAAN, INITIAL_BUKU_PENERIMAAN);
  }

  public static addBukuPenerimaan(
    item: Omit<BukuPenerimaanItem, 'idPenerimaan' | 'jumlahHarga'>
  ): { success: boolean; message: string; data?: BukuPenerimaanItem } {
    // RBAC: Hanya Admin yang dapat Mengelola (ACT-03)
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'buku_penerimaan', ['manage'], 'Menambah data Buku Penerimaan Aset');

    const list = this.getBukuPenerimaan();
    const id = `RCV-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
    
    // Multi-item calculation support (BR-003)
    let jumlahHarga = 0;
    let banyaknya = Number(item.banyaknya || 0);

    if (item.items && item.items.length > 0) {
      jumlahHarga = item.items.reduce((sum, it) => sum + (Number(it.jumlahHarga) || (Number(it.banyaknya) * Number(it.hargaSatuan))), 0);
      banyaknya = item.items.reduce((sum, it) => sum + Number(it.banyaknya || 0), 0);
    } else {
      jumlahHarga = banyaknya * Number(item.hargaSatuan || 0);
    }

    const newItem: BukuPenerimaanItem = {
      ...item,
      banyaknya,
      idPenerimaan: id,
      jumlahHarga,
      tercatatUnitCount: 0,
      petugas: active.nama
    };

    this.save(STORAGE_KEYS.BUKU_PENERIMAAN, [newItem, ...list]);

    this.addLog({
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('id-ID'),
      barcode: id,
      namaBarang: newItem.namaAset || 'Penerimaan Aset Multi-Item',
      jenisTransaksi: 'Masuk',
      lokasi: 'Ruang PUSDATIN',
      keterangan: `Penerimaan aset baru: ${newItem.namaAset || 'Multi-Item'} (${newItem.banyaknya || 0} unit) dari ${newItem.dari}. Total Rp ${jumlahHarga.toLocaleString('id-ID')}`,
      petugas: active.nama
    });

    this.addAuditTrail({
      entityType: 'Aset TI',
      entityId: id,
      statusLama: 'Draft',
      statusBaru: 'Tercatat di Buku Penerimaan',
      catatan: `Input Buku Penerimaan Aset (${newItem.namaAset}) nomor faktur ${newItem.nomorFaktur}.`,
      idPengguna: active.id,
      namaPengguna: active.nama,
      rolePengguna: active.roleName
    });

    return {
      success: true,
      message: `Buku Penerimaan Aset ${id} berhasil dicatat! Total Harga: Rp ${jumlahHarga.toLocaleString('id-ID')}`,
      data: newItem
    };
  }

  /**
   * Batch registrasi unit fisik dari Buku Penerimaan Aset (3.3)
   */
  public static registerPenerimaanBatchUnits(params: {
    idPenerimaan: string;
    subItemIndex?: number;
    namaAset: string;
    kategori: string;
    jenisAset?: 'Fisik' | 'Non-Fisik';
    merekModel?: string;
    nomorSeriPrefix?: string;
    serialNumbersList?: string[];
    spesifikasi?: string;
    vendorSupplier: string;
    hargaBeli: number;
    lokasi: string;
    statusAwal?: AssetStatus;
    count: number;
    tanggalPembelian?: string;
    nomorPoInvoice?: string;
    masaGaransi?: string;
    catatan?: string;
    pengguna?: string;
    bidangPengguna?: string;
  }): { success: boolean; message: string; registeredAssets: Asset[] } {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'registrasi_aset_qr', ['manage'], 'Meregistrasi unit aset dari penerimaan');

    const penerimaanList = this.getBukuPenerimaan();
    const rcvIndex = penerimaanList.findIndex(r => r.idPenerimaan === params.idPenerimaan);
    if (rcvIndex === -1) {
      return { success: false, message: 'Data penerimaan tidak ditemukan!', registeredAssets: [] };
    }

    const targetRcv = penerimaanList[rcvIndex];
    const registeredAssets: Asset[] = [];
    const count = Math.max(1, params.count);
    const existingAssets = this.getAssets();

    for (let i = 0; i < count; i++) {
      // 8-digit unique barcode
      const barcode = String(Math.floor(10000000 + Math.random() * 90000000));
      const seq = existingAssets.length + registeredAssets.length + 1;
      const kodeUnikAset = `AST-UMC-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;

      let sn = `SN-${barcode}`;
      if (params.serialNumbersList && params.serialNumbersList[i]) {
        sn = params.serialNumbersList[i];
      } else if (params.nomorSeriPrefix) {
        sn = `${params.nomorSeriPrefix}-${String(i + 1).padStart(2, '0')}`;
      }

      const asset: Asset = {
        barcode,
        kodeUnikAset,
        nama: params.namaAset,
        kategori: params.kategori,
        merekModel: params.merekModel || undefined,
        nomorSeri: sn,
        spesifikasi: params.spesifikasi || undefined,
        lokasi: params.lokasi || 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
        status: params.statusAwal || 'Tersedia',
        tanggalMasuk: targetRcv.tanggalPenerimaan || new Date().toISOString().split('T')[0],
        tanggalPembelian: params.tanggalPembelian || targetRcv.tanggalFaktur || targetRcv.tanggalPenerimaan,
        nomorPoInvoice: params.nomorPoInvoice || targetRcv.nomorFaktur,
        vendorSupplier: params.vendorSupplier || targetRcv.dari,
        hargaBeli: params.hargaBeli !== undefined ? params.hargaBeli : targetRcv.hargaSatuan,
        jenisAset: params.jenisAset || 'Fisik',
        masaGaransi: params.masaGaransi,
        pengguna: params.pengguna,
        bidangPengguna: params.bidangPengguna,
        lokasiAwal: params.lokasi || 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
        idPenerimaanTerkait: params.idPenerimaan
      };

      this.addAsset(asset);
      registeredAssets.push(asset);
    }

    // Update targetRcv tercatatUnitCount and sub-item registered barcodes & count
    const newBarcodes = registeredAssets.map(a => a.barcode);
    targetRcv.tercatatUnitCount = (targetRcv.tercatatUnitCount || 0) + registeredAssets.length;

    const targetSub = (targetRcv.items && typeof params.subItemIndex === 'number' && targetRcv.items[params.subItemIndex])
      || targetRcv.items?.find(it => it.namaAset === params.namaAset);
    if (targetSub) {
      targetSub.unitRegisteredBarcodes = [...(targetSub.unitRegisteredBarcodes || []), ...newBarcodes];
      targetSub.terdaftarCount = (targetSub.terdaftarCount || 0) + registeredAssets.length;
    }

    penerimaanList[rcvIndex] = targetRcv;
    this.save(STORAGE_KEYS.BUKU_PENERIMAAN, penerimaanList);

    return {
      success: true,
      message: `Berhasil meregistrasi ${registeredAssets.length} unit aset fisik baru (${params.namaAset})!`,
      registeredAssets
    };
  }

  // --- 8.2 TABEL 8: BUKU PENGELUARAN ASET (A.2) ---
  public static getBukuPengeluaran(): BukuPengeluaranItem[] {
    return this.load<BukuPengeluaranItem[]>(STORAGE_KEYS.BUKU_PENGELUARAN, INITIAL_BUKU_PENGELUARAN);
  }

  // Jalur 1 — Aset Keluar karena Penggunaan (A.2 Jalur 1)
  public static recordPengeluaranPenggunaan(params: {
    barcodeOrUniqueCode: string;
    untuk: string;
    tanggalPenyerahan: string;
    keterangan: string;
  }): { success: boolean; message: string } {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'buku_pengeluaran', ['manage'], 'Mencatat Pengeluaran Aset untuk Penggunaan');

    const asset = this.getAssetByBarcodeOrUnique(params.barcodeOrUniqueCode);
    if (!asset) {
      return { success: false, message: 'Kode aset atau barcode tidak ditemukan dalam sistem inventaris!' };
    }

    if (asset.status === 'Tidak Layak') {
      return { success: false, message: 'Aset berstatus Tidak Layak dan tidak dapat dikeluarkan untuk penggunaan!' };
    }

    const list = this.getBukuPengeluaran();
    const id = `OUT-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;

    const newOut: BukuPengeluaranItem = {
      idPengeluaran: id,
      tanggalPenyerahan: params.tanggalPenyerahan || new Date().toISOString().split('T')[0],
      kodeUnikAset: asset.kodeUnikAset,
      barcode: asset.barcode,
      namaAset: asset.nama,
      untuk: params.untuk,
      jenisPengeluaran: 'Penggunaan',
      keterangan: params.keterangan || `Pengeluaran karena penggunaan oleh ${params.untuk}`,
      petugas: active.nama,
      items: [
        {
          barcode: asset.barcode,
          kodeUnikAset: asset.kodeUnikAset,
          namaAset: asset.nama,
          kategori: asset.kategori,
          lokasi: params.untuk
        }
      ]
    };

    this.save(STORAGE_KEYS.BUKU_PENGELUARAN, [newOut, ...list]);

    // Update status aset menjadi 'Digunakan'
    const statusLama = asset.status;
    this.updateAssetStatus(
      asset.barcode,
      'Digunakan',
      params.untuk,
      true,
      `Aset diserahkan untuk penggunaan ke: ${params.untuk} (Buku Pengeluaran: ${id})`
    );

    this.addAuditTrail({
      entityType: 'Aset TI',
      entityId: asset.kodeUnikAset,
      statusLama,
      statusBaru: 'Digunakan',
      catatan: `Pengeluaran karena Penggunaan: diserahkan ke ${params.untuk} oleh ${active.nama}`,
      idPengguna: active.id,
      namaPengguna: active.nama,
      rolePengguna: active.roleName
    });

    return {
      success: true,
      message: `Aset ${asset.nama} (${asset.kodeUnikAset}) berhasil dikeluarkan untuk penggunaan (${params.untuk}) dan tercatat di Buku Pengeluaran!`
    };
  }

  // Multi-item Pengeluaran Aset (3.4)
  public static recordMultiPengeluaranPenggunaan(params: {
    barcodes?: string[];
    assetCodes?: string[];
    untuk: string;
    tanggalPenyerahan: string;
    keterangan: string;
    petugas?: string;
  }): { success: boolean; message: string; data?: BukuPengeluaranItem } {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'buku_pengeluaran', ['manage'], 'Mencatat Pengeluaran Multi-Aset untuk Penggunaan');

    const rawCodes = params.barcodes || params.assetCodes || [];
    if (rawCodes.length === 0) {
      return { success: false, message: 'Pilih minimal satu aset yang akan dikeluarkan!' };
    }

    const allAssets = this.getAssets();
    const selectedAssets: Asset[] = [];
    for (const code of rawCodes) {
      const found = allAssets.find(a => a.barcode === code || a.kodeUnikAset === code);
      if (found) {
        if (found.status === 'Tidak Layak') {
          return { success: false, message: `Aset ${found.nama} (${found.barcode}) berstatus Tidak Layak dan tidak dapat dikeluarkan!` };
        }
        selectedAssets.push(found);
      }
    }

    if (selectedAssets.length === 0) {
      return { success: false, message: 'Tidak ada aset valid yang ditemukan untuk dikeluarkan!' };
    }

    const list = this.getBukuPengeluaran();
    const id = `OUT-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;

    const itemsSub = selectedAssets.map(a => ({
      barcode: a.barcode,
      kodeUnikAset: a.kodeUnikAset,
      namaAset: a.nama,
      kategori: a.kategori,
      lokasi: params.untuk
    }));

    const primary = selectedAssets[0];
    const summaryName = selectedAssets.length === 1
      ? primary.nama
      : `${primary.nama} (+${selectedAssets.length - 1} aset lainnya)`;

    const newOut: BukuPengeluaranItem = {
      idPengeluaran: id,
      tanggalPenyerahan: params.tanggalPenyerahan || new Date().toISOString().split('T')[0],
      kodeUnikAset: primary.kodeUnikAset,
      barcode: primary.barcode,
      namaAset: summaryName,
      untuk: params.untuk,
      jenisPengeluaran: 'Penggunaan',
      keterangan: params.keterangan || `Pengeluaran ${selectedAssets.length} unit untuk ${params.untuk}`,
      petugas: active.nama,
      items: itemsSub
    };

    this.save(STORAGE_KEYS.BUKU_PENGELUARAN, [newOut, ...list]);

    // Update status all selected assets to Digunakan
    for (const a of selectedAssets) {
      const statusLama = a.status;
      this.updateAssetStatus(
        a.barcode,
        'Digunakan',
        params.untuk,
        true,
        `Pengeluaran batch ke: ${params.untuk} (Buku Pengeluaran: ${id})`
      );

      this.addAuditTrail({
        entityType: 'Aset TI',
        entityId: a.kodeUnikAset,
        statusLama,
        statusBaru: 'Digunakan',
        catatan: `Pengeluaran Aset (${a.nama}) diserahkan ke ${params.untuk} (ID: ${id})`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });
    }

    return {
      success: true,
      message: `Berhasil mengeluarkan ${selectedAssets.length} jenis/unit aset ke ${params.untuk}! (ID: ${id})`,
      data: newOut
    };
  }

  // --- 8.2 TABEL 3: ASET TI (A.1.2 Registrasi Unit, BR-001, BR-002) ---
  public static getAssets(): Asset[] {
    const raw = this.load<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
    return raw.map(a => ({
      ...a,
      kodeUnikAset: a.kodeUnikAset || `AST-UMC-2026-${a.barcode.slice(-4)}`,
      status: normalizeAssetStatus(a.status)
    }));
  }

  public static getAssetByBarcode(barcode: string): Asset | undefined {
    const assets = this.getAssets();
    const clean = barcode.trim().toLowerCase();
    return assets.find(a => a.barcode.toLowerCase() === clean);
  }

  public static getAssetByBarcodeOrUnique(code: string): Asset | undefined {
    const clean = (code || '').trim().toLowerCase();
    if (!clean) return undefined;
    const assets = this.getAssets();
    return assets.find(
      a => a.barcode.toLowerCase() === clean || (a.kodeUnikAset && a.kodeUnikAset.toLowerCase() === clean)
    );
  }

  public static addAsset(asset: Asset): void {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'registrasi_aset_qr', ['manage'], 'Mendaftarkan unit aset baru');

    const assets = this.getAssets();
    // BR-001: Kode Unik Aset sebagai pengenal utama, tidak dapat diubah
    const kodeUnikAset = asset.kodeUnikAset || `AST-UMC-${new Date().getFullYear()}-${String(assets.length + 1).padStart(3, '0')}`;
    const newAsset: Asset = {
      ...asset,
      kodeUnikAset,
      status: normalizeAssetStatus(asset.status)
    };

    const updated = [newAsset, ...assets.filter(a => a.barcode !== newAsset.barcode && a.kodeUnikAset !== kodeUnikAset)];
    this.save(STORAGE_KEYS.ASSETS, updated);

    this.addLog({
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('id-ID'),
      barcode: newAsset.barcode,
      namaBarang: newAsset.nama,
      jenisTransaksi: 'Masuk',
      lokasi: newAsset.lokasi,
      keterangan: `Registrasi fisik unit aset ${newAsset.nama} (Kode Unik: ${kodeUnikAset})`,
      petugas: active.nama
    });

    this.addAuditTrail({
      entityType: 'Aset TI',
      entityId: kodeUnikAset,
      statusLama: 'None',
      statusBaru: newAsset.status,
      catatan: `Registrasi unit fisik baru ke sistem inventaris PUSDATIN UMC oleh ${active.nama}`,
      idPengguna: active.id,
      namaPengguna: active.nama,
      rolePengguna: active.roleName
    });
  }

  public static updateAssetStatus(
    barcode: string,
    newStatus: AssetStatus,
    lokasi?: string,
    logActivity = true,
    keterangan?: string
  ): boolean {
    const assets = this.getAssets();
    const index = assets.findIndex(a => a.barcode === barcode || a.kodeUnikAset === barcode);
    if (index === -1) return false;

    const old = assets[index];
    const statusLama = old.status;
    const targetStatus = normalizeAssetStatus(newStatus);
    const newLokasi = lokasi || old.lokasi;

    assets[index] = {
      ...old,
      status: targetStatus,
      lokasi: newLokasi,
      lokasiAwal: old.lokasiAwal || old.lokasi
    };
    this.save(STORAGE_KEYS.ASSETS, assets);

    const active = this.getActiveUser();

    if (logActivity) {
      let jenis: ActivityLog['jenisTransaksi'] = 'Mutasi Lokasi';
      if (targetStatus === 'Maintenance') jenis = 'Perbaikan';
      else if (targetStatus === 'Dipinjam') jenis = 'Pinjam';
      else if (targetStatus === 'Tersedia' && old.status === 'Dipinjam') jenis = 'Kembali';
      else if (targetStatus === 'Tersedia' && old.status === 'Maintenance') jenis = 'Selesai Perbaikan';
      else if (targetStatus === 'Tidak Layak') jenis = 'Rusak Total';

      this.addLog({
        id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleString('id-ID'),
        barcode: old.barcode,
        namaBarang: old.nama,
        jenisTransaksi: jenis,
        lokasi: newLokasi,
        keterangan: keterangan || `Update status aset menjadi ${targetStatus} di ${newLokasi}`,
        petugas: active.nama
      });

      this.addAuditTrail({
        entityType: 'Aset TI',
        entityId: old.kodeUnikAset || old.barcode,
        statusLama,
        statusBaru: targetStatus,
        catatan: keterangan || `Perubahan status operasional menjadi ${targetStatus}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });
    }

    return true;
  }

  public static updateAssetFull(
    barcodeOrUnique: string,
    data: Partial<Asset>,
    logActivity = true,
    keterangan?: string
  ): boolean {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'buku_inventaris', ['manage'], 'Mengubah data master aset');

    const assets = this.getAssets();
    const index = assets.findIndex(a => a.barcode === barcodeOrUnique || a.kodeUnikAset === barcodeOrUnique);
    if (index === -1) return false;

    const old = assets[index];
    const updated: Asset = {
      ...old,
      ...data,
      barcode: old.barcode, // Barcode tetap
      kodeUnikAset: old.kodeUnikAset // BR-001: Kode Unik Aset tidak dapat diubah
    };

    assets[index] = updated;
    this.save(STORAGE_KEYS.ASSETS, assets);

    if (logActivity) {
      this.addLog({
        id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleString('id-ID'),
        barcode: updated.barcode,
        namaBarang: updated.nama,
        jenisTransaksi: 'Mutasi Lokasi',
        lokasi: updated.lokasi,
        keterangan: keterangan || `Pembaruan data spesifikasi/lokasi aset ${updated.nama} (${updated.kodeUnikAset})`,
        petugas: active.nama
      });
    }

    return true;
  }

  public static deleteAsset(barcodeOrUnique: string): boolean {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'buku_inventaris', ['manage'], 'Menghapus aset inventaris');

    const assets = this.getAssets();
    const target = assets.find(a => a.barcode === barcodeOrUnique || a.kodeUnikAset === barcodeOrUnique);
    if (!target) return false;

    const filtered = assets.filter(a => a.barcode !== target.barcode && a.kodeUnikAset !== target.kodeUnikAset);
    this.save(STORAGE_KEYS.ASSETS, filtered);

    this.addAuditTrail({
      entityType: 'Aset TI',
      entityId: target.kodeUnikAset,
      statusLama: target.status,
      statusBaru: 'Dihapus (Soft-Delete Audit)',
      catatan: `Penghapusan aset ${target.nama} (${target.kodeUnikAset}) oleh ${active.nama}`,
      idPengguna: active.id,
      namaPengguna: active.nama,
      rolePengguna: active.roleName
    });

    return true;
  }

  // --- 8.2 TABEL 9: BUKU ASET INVENTARIS (REKAPITULASI, A.3, BR-005) ---
  public static getBukuAsetInventarisRekap(): BukuAsetInventarisRekap[] {
    const assets = this.getAssets();
    const categories = this.getMasterCategories();
    const penerimaanList = this.getBukuPenerimaan();
    const pengeluaranList = this.getBukuPengeluaran();

    const result: BukuAsetInventarisRekap[] = [];

    categories.forEach(cat => {
      const catAssets = assets.filter(a => a.kategori === cat);
      const totalMasukCat = penerimaanList
        .filter(p => p.kategori === cat)
        .reduce((sum, p) => sum + (p.banyaknya || 0), 0) || catAssets.length;

      const totalKeluarCat = pengeluaranList.filter(o => {
        const matchingAsset = assets.find(a => a.kodeUnikAset === o.kodeUnikAset || a.barcode === o.barcode);
        return matchingAsset?.kategori === cat;
      }).length;

      // BR-005: Saldo = total masuk - total keluar = stok tersedia per kategori
      const tersedia = catAssets.filter(a => a.status === 'Tersedia').length;
      const digunakan = catAssets.filter(a => a.status === 'Digunakan').length;
      const dipinjam = catAssets.filter(a => a.status === 'Dipinjam').length;
      const maintenance = catAssets.filter(a => a.status === 'Maintenance').length;
      const tidakLayak = catAssets.filter(a => a.status === 'Tidak Layak').length;

      const totalNilai = catAssets.reduce((sum, a) => sum + (a.hargaBeli || 0), 0);

      result.push({
        kategori: cat,
        totalMasuk: totalMasukCat,
        totalKeluar: totalKeluarCat,
        stokTersedia: Math.max(0, totalMasukCat - totalKeluarCat),
        nilaiAsetTotal: totalNilai,
        rincianStatus: {
          tersedia,
          digunakan,
          dipinjam,
          maintenance,
          tidakLayak
        }
      });
    });

    return result;
  }

  // --- 8.2 TABEL 10 & 11: PEMINJAMAN ASET (MODUL C) ---
  public static getLoans(): LoanTicket[] {
    const loans = this.load<LoanTicket[]>(STORAGE_KEYS.LOANS, INITIAL_LOANS);
    const todayStr = new Date().toISOString().split('T')[0];

    return loans.map(l => {
      const normalizedStatus = normalizeLoanStatus(l.status);
      // C.6: Pengingat keterlambatan: jika melewati batas waktu tglKembali dan belum dikembalikan -> Terlambat
      let finalStatus = normalizedStatus;
      if (normalizedStatus === 'Diserahkan' && l.tglKembali && l.tglKembali < todayStr) {
        finalStatus = 'Terlambat';
      }
      return {
        ...l,
        status: finalStatus
      };
    });
  }

  // C.1 Pengajuan Peminjaman oleh User
  public static addLoan(loan: Omit<LoanTicket, 'id' | 'status' | 'tglAju'>): LoanTicket {
    const loans = this.getLoans();
    const active = this.getActiveUser();
    const dateCode = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const id = `PJM-${dateCode}-${rand}`;

    const newTicket: LoanTicket = {
      ...loan,
      id,
      status: 'Diajukan',
      tglAju: new Date().toLocaleString('id-ID')
    };

    this.save(STORAGE_KEYS.LOANS, [newTicket, ...loans]);

    // Log Notifikasi WA (Section 0 point 6, BR-009)
    this.addNotification({
      tujuan: newTicket.kontak,
      namaPenerima: newTicket.peminjam,
      kanal: 'WhatsApp',
      jenisNotifikasi: 'Peminjaman Diajukan',
      statusKirim: 'sent',
      pesanPreview: `Pengajuan peminjaman ${newTicket.barangPinjaman} (${id}) berhasil diajukan dan menunggu verifikasi Admin PUSDATIN.`
    });

    this.addAuditTrail({
      entityType: 'Peminjaman Aset',
      entityId: id,
      statusLama: 'None',
      statusBaru: 'Diajukan',
      catatan: `Civitas ${newTicket.peminjam} (${newTicket.unit}) mengajukan peminjaman ${newTicket.barangPinjaman} ${newTicket.jumlah} unit.`,
      idPengguna: active.id,
      namaPengguna: active.nama,
      rolePengguna: active.roleName
    });

    return newTicket;
  }

  // Walk-in / Direct Loan creation by Admin
  public static createDirectLoanByAdmin(params: {
    peminjam: string;
    nik: string;
    unit: string;
    kontak: string;
    email: string;
    barangPinjaman: string;
    jumlah: number;
    tglPinjam: string;
    tglKembali: string;
    barcode: string;
    namaBarangT?: string;
    kondisi?: string;
    petugas?: string;
    catatan?: string;
    tglAmbil?: string;
  }): { success: boolean; message: string; ticket?: LoanTicket } {
    const asset = this.getAssetByBarcodeOrUnique(params.barcode);
    if (!asset) {
      return { success: false, message: 'Barcode aset tidak ditemukan!' };
    }
    if (asset.status !== 'Tersedia') {
      return { success: false, message: `Aset ${params.barcode} saat ini berstatus ${asset.status}, tidak dapat dipinjam!` };
    }

    const loan = this.addLoan({
      peminjam: params.peminjam,
      nik: params.nik,
      unit: params.unit,
      kontak: params.kontak,
      email: params.email,
      barangPinjaman: params.barangPinjaman,
      jumlah: params.jumlah,
      tglPinjam: params.tglPinjam,
      tglKembali: params.tglKembali,
      barcode: params.barcode,
      kodeUnikAset: asset.kodeUnikAset,
      namaBarangT: params.namaBarangT || asset.nama,
      kondisi: params.kondisi || 'Baik',
      petugas: params.petugas,
      catatan: params.catatan,
      tglAmbil: params.tglAmbil || params.tglPinjam
    });

    return this.processLoanTicket(loan.id, 'serahkan', {
      barcode: params.barcode,
      kodeUnikAset: asset.kodeUnikAset,
      namaBarang: asset.nama,
      kondisi: params.kondisi || 'Baik',
      petugas: params.petugas,
      catatan: params.catatan
    });
  }

  // C.2, C.3, C.4, C.5: Proses Lifecycle Tiket Peminjaman (Admin & Pimpinan)
  public static processLoanTicket(
    id: string,
    action: 'terima' | 'konfirmasi-alokasi' | 'serahkan' | 'tolak' | 'kembalikan' | 'kembali' | 'tutup',
    data: {
      alasanPenolakan?: string;
      barcode?: string;
      kodeUnikAset?: string;
      namaBarang?: string;
      kondisi?: string;
      petugas?: string;
      catatan?: string;
      tglAmbil?: string;
      tglDikembalikan?: string;
      metodePengambilan?: LoanHandoverMethod;
      jadwalPengambilan?: string;
      lokasiPengambilan?: string;
      hasilPemeriksaanKembali?: 'Baik / Lengkap' | 'Ada Kendala';
      rincianKondisiKembali?: string;
    }
  ): { success: boolean; message: string; ticket?: LoanTicket } {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'peminjaman_aset', ['manage', 'approve'], `Memproses peminjaman (${action})`);

    const loans = this.getLoans();
    const index = loans.findIndex(l => l.id === id);
    if (index === -1) return { success: false, message: 'Tiket peminjaman tidak ditemukan!' };

    const loan = loans[index];
    const statusLama = loan.status;
    const nowStr = new Date().toLocaleString('id-ID');

    // C.2: Admin Verifikasi Diterima -> Dikonfirmasi (alokasikan unit spesifik)
    if (action === 'terima' || action === 'konfirmasi-alokasi') {
      const allocatedAsset = data.barcode ? this.getAssetByBarcodeOrUnique(data.barcode) : undefined;
      const handover = data.metodePengambilan || loan.metodePengambilan || 'Diambil di Ruang PUSDATIN';
      const schedule = data.jadwalPengambilan || `${data.tglAmbil || loan.tglPinjam} pukul 09:00 WIB`;

      loans[index] = {
        ...loan,
        status: 'Dikonfirmasi',
        barcode: allocatedAsset?.barcode || data.barcode || loan.barcode,
        kodeUnikAset: allocatedAsset?.kodeUnikAset || data.kodeUnikAset || loan.kodeUnikAset,
        namaBarangT: allocatedAsset?.nama || data.namaBarang || loan.namaBarangT || loan.barangPinjaman,
        kondisi: data.kondisi || 'Baik / Berfungsi Normal',
        petugas: data.petugas || active.nama,
        catatan: data.catatan || 'Peminjaman diverifikasi dan unit aset telah dialokasikan.',
        tglAmbil: data.tglAmbil || loan.tglPinjam,
        metodePengambilan: handover,
        jadwalPengambilan: schedule,
        lokasiPengambilan: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
      };
      this.save(STORAGE_KEYS.LOANS, loans);

      this.addNotification({
        tujuan: loan.kontak,
        namaPenerima: loan.peminjam,
        kanal: 'WhatsApp',
        jenisNotifikasi: 'Peminjaman Disetujui',
        statusKirim: 'sent',
        pesanPreview: `Pengajuan peminjaman ${loan.id} DISETUJUI. Unit dialokasikan: ${loans[index].namaBarangT}. Jadwal serah terima: ${schedule}.`
      });

      this.addAuditTrail({
        entityType: 'Peminjaman Aset',
        entityId: loan.id,
        statusLama,
        statusBaru: 'Dikonfirmasi',
        catatan: `Admin ${active.nama} menyetujui pengajuan peminjaman dan mengalokasikan unit ${loans[index].namaBarangT} (${loans[index].barcode}).`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Peminjaman ${loan.id} DIVERIFIKASI & DIKONFIRMASI! Unit dialokasikan: ${loans[index].namaBarangT}.`,
        ticket: loans[index]
      };
    }

    // C.4: Perizinan, Cetak Surat PDF & Penyerahan Fisik -> Diserahkan (BR-010, BR-011)
    if (action === 'serahkan') {
      const allocatedCode = data.barcode || loan.barcode;
      const allocatedAsset = allocatedCode ? this.getAssetByBarcodeOrUnique(allocatedCode) : undefined;
      const nomorSurat = `SP-PUSDATIN/${new Date().getFullYear()}/XI/${loan.id.slice(-4)}`;

      loans[index] = {
        ...loan,
        status: 'Diserahkan',
        nomorSuratPeminjaman: nomorSurat,
        penandatangan: {
          peminjam: loan.peminjam,
          petugas: data.petugas || active.nama,
          kepalaPusdatin: 'Dr. Ir. H. Ahmad Dahlan, M.T.'
        },
        tglAmbil: data.tglAmbil || new Date().toISOString().split('T')[0],
        catatan: data.catatan || 'Aset telah diserahkan resmi dengan Surat Peminjaman resmi.'
      };
      this.save(STORAGE_KEYS.LOANS, loans);

      // BR-011: Saat aset diserahkan, status aset menjadi Dipinjam dan masuk Buku Pengeluaran Aset (Jalur 2)
      if (allocatedAsset) {
        this.updateAssetStatus(
          allocatedAsset.barcode,
          'Dipinjam',
          loan.unit,
          true,
          `Dipinjam oleh ${loan.peminjam} (${loan.unit}) - Surat: ${nomorSurat}`
        );

        // Catat ke Buku Pengeluaran Aset (Jalur 2 — Peminjaman)
        const pengeluaranList = this.getBukuPengeluaran();
        const outId = `OUT-${new Date().getFullYear()}-${String(pengeluaranList.length + 1).padStart(3, '0')}`;
        const newOut: BukuPengeluaranItem = {
          idPengeluaran: outId,
          tanggalPenyerahan: new Date().toISOString().split('T')[0],
          kodeUnikAset: allocatedAsset.kodeUnikAset,
          barcode: allocatedAsset.barcode,
          namaAset: allocatedAsset.nama,
          untuk: `${loan.peminjam} (${loan.unit})`,
          jenisPengeluaran: 'Peminjaman',
          idTiketPeminjaman: loan.id,
          keterangan: `Pengeluaran otomatis dipicu oleh penyerahan peminjaman Surat ${nomorSurat}`,
          petugas: active.nama
        };
        this.save(STORAGE_KEYS.BUKU_PENGELUARAN, [newOut, ...pengeluaranList]);
      }

      this.addNotification({
        tujuan: loan.kontak,
        namaPenerima: loan.peminjam,
        kanal: 'WhatsApp',
        jenisNotifikasi: 'Peminjaman Diserahkan',
        statusKirim: 'sent',
        pesanPreview: `Aset pinjaman telah resmi diserahkan. Surat Peminjaman Aset ${nomorSurat} telah diterbitkan. Batas kembali: ${loan.tglKembali}.`
      });

      this.addAuditTrail({
        entityType: 'Peminjaman Aset',
        entityId: loan.id,
        statusLama,
        statusBaru: 'Diserahkan',
        catatan: `Aset diserahkan resmi ke peminjam. Surat Peminjaman ${nomorSurat} diterbitkan, status aset menjadi Dipinjam dan masuk Buku Pengeluaran.`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Aset resmi DISERAHKAN! Status berubah menjadi Diserahkan, tercatat di Buku Pengeluaran, dan Surat Peminjaman diterbitkan.`,
        ticket: loans[index]
      };
    }

    // C.2: Penolakan Peminjaman
    if (action === 'tolak') {
      const reason = data.alasanPenolakan || data.catatan || 'Ketersediaan perangkat tidak mencukupi untuk jadwal tersebut.';
      loans[index] = {
        ...loan,
        status: 'Ditolak',
        alasanPenolakan: reason,
        catatan: reason
      };
      this.save(STORAGE_KEYS.LOANS, loans);

      this.addNotification({
        tujuan: loan.kontak,
        namaPenerima: loan.peminjam,
        kanal: 'WhatsApp',
        jenisNotifikasi: 'Peminjaman Disetujui', // Tipe update status
        statusKirim: 'sent',
        pesanPreview: `Mohon maaf, pengajuan peminjaman ${loan.id} DITOLAK. Alasan: ${reason}`
      });

      this.addAuditTrail({
        entityType: 'Peminjaman Aset',
        entityId: loan.id,
        statusLama,
        statusBaru: 'Ditolak',
        catatan: `Peminjaman ditolak oleh ${active.nama}. Alasan: ${reason}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return { success: true, message: `Peminjaman ${loan.id} telah DITOLAK.` };
    }

    // C.5: Pengembalian Aset & Pemeriksaan Fisik (BR-012, Integrasi 3)
    if (action === 'kembalikan' || action === 'kembali' || action === 'tutup') {
      const returnDate = data.tglDikembalikan || new Date().toISOString().split('T')[0];
      const hasilPemeriksaan = data.hasilPemeriksaanKembali || 'Baik / Lengkap';
      const allocatedAsset = loan.barcode ? this.getAssetByBarcodeOrUnique(loan.barcode) : undefined;

      let linkedTicketId: string | undefined = undefined;

      // BR-012 & Integrasi 3: Jika ada kendala/kerusakan, status aset menjadi Maintenance dan buat tiket kerusakan terkait
      if (hasilPemeriksaan === 'Ada Kendala') {
        if (allocatedAsset) {
          this.updateAssetStatus(
            allocatedAsset.barcode,
            'Maintenance',
            'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
            true,
            `Aset dikembalikan dengan kendala fisik/fungsi oleh ${loan.peminjam}: ${data.rincianKondisiKembali || 'Perlu perbaikan'}`
          );
        }

        // Otomatis terbitkan tiket kerusakan helpdesk terkait
        const damageTicket = this.createInternalDamageTicket({
          barcode: allocatedAsset?.barcode || loan.barcode || 'Tanpa Barcode',
          namaBarang: loan.namaBarangT || loan.barangPinjaman,
          lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
          deskripsi: `[TEMUAN PENGEMBALIAN PINJAMAN] ${loan.id}: ${data.rincianKondisiKembali || 'Ada kendala fisik/fungsi saat pengembalian aset.'}`,
          pelapor: `Admin PUSDATIN (${loan.peminjam})`,
          status: 'Open/Unassigned',
          metodePerbaikan: 'Dibawa ke PUSDATIN',
          urgensi: 'Tinggi',
          picTeknisi: 'IT Support & Helpdesk Specialist'
        });
        linkedTicketId = damageTicket.id;
      } else {
        // Jika Baik / Lengkap: status aset kembali menjadi Tersedia
        if (allocatedAsset) {
          this.updateAssetStatus(
            allocatedAsset.barcode,
            'Tersedia',
            'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
            true,
            `Dikembalikan dalam kondisi baik oleh ${loan.peminjam} - Tiket: ${loan.id}`
          );
        }
      }

      loans[index] = {
        ...loan,
        status: 'Dikembalikan',
        tglDikembalikan: returnDate,
        hasilPemeriksaanKembali: hasilPemeriksaan,
        rincianKondisiKembali: data.rincianKondisiKembali,
        linkedDamageTicketId: linkedTicketId,
        catatan: `Aset dikembalikan pada ${returnDate}. Pemeriksaan: ${hasilPemeriksaan}.`
      };
      this.save(STORAGE_KEYS.LOANS, loans);

      this.addNotification({
        tujuan: loan.kontak,
        namaPenerima: loan.peminjam,
        kanal: 'WhatsApp',
        jenisNotifikasi: 'Aset Dikembalikan',
        statusKirim: 'sent',
        pesanPreview: `Pengembalian aset ${loan.id} telah dicatat. Kondisi: ${hasilPemeriksaan}. Terima kasih telah menggunakan fasilitas kampus.`
      });

      this.addAuditTrail({
        entityType: 'Peminjaman Aset',
        entityId: loan.id,
        statusLama,
        statusBaru: 'Dikembalikan',
        catatan: `Aset berhasil dikembalikan. Hasil pemeriksaan: ${hasilPemeriksaan}. ${linkedTicketId ? 'Tiket kerusakan tertaut: ' + linkedTicketId : 'Status aset kembali Tersedia.'}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Aset berhasil dikembalikan! Kondisi: ${hasilPemeriksaan}. ${linkedTicketId ? 'Tiket kerusakan ' + linkedTicketId + ' otomatis diterbitkan!' : 'Aset kembali Tersedia.'}`,
        ticket: loans[index]
      };
    }

    return { success: false, message: 'Aksi tidak valid.' };
  }

  // --- 8.2 TABEL 2: HELPDESK & TIKET KERUSAKAN (MODUL B) ---
  public static getDamageTickets(): DamageTicket[] {
    const raw = this.load<DamageTicket[]>(STORAGE_KEYS.DAMAGES, INITIAL_DAMAGES);
    const now = new Date();

    return raw.map(t => {
      const normalizedStatus = normalizeDamageStatus(t.status);
      let updatedStatus = normalizedStatus;

      // BR-008: Mekanisme 2 hari kerja penutupan otomatis (Closed – Auto)
      if (normalizedStatus === 'Resolved' && t.resolvedAt) {
        const resolvedTime = new Date(t.resolvedAt).getTime();
        const twoWorkDaysMs = 48 * 60 * 60 * 1000;
        if (now.getTime() - resolvedTime > twoWorkDaysMs) {
          updatedStatus = 'Closed – Auto';
        }
      }

      // Hitung SLA status
      let slaStatus: 'On Track' | 'Mendekati Batas' | 'Overdue' = t.slaStatus || 'On Track';
      if (t.slaDeadline && (updatedStatus !== 'Resolved' && updatedStatus !== 'Closed – Auto' && updatedStatus !== 'Closed – Manual')) {
        const deadline = new Date(t.slaDeadline).getTime();
        const diffHours = (deadline - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < 0) {
          slaStatus = 'Overdue';
        } else if (diffHours < 4) {
          slaStatus = 'Mendekati Batas';
        } else {
          slaStatus = 'On Track';
        }
      }

      return {
        ...t,
        status: updatedStatus,
        slaStatus,
        eskalasiPusdatin: slaStatus === 'Overdue' ? true : t.eskalasiPusdatin
      };
    });
  }

  // B.1 Pembuatan Tiket oleh User via SSO Google (BR-006)
  public static addDamageTicket(ticket: Omit<DamageTicket, 'id' | 'status' | 'tanggalLapor' | 'slaDeadline' | 'slaTargetHours'>): DamageTicket {
    const tickets = this.getDamageTickets();
    const active = this.getActiveUser();
    const dateCode = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const id = `TKT-${dateCode}-${rand}`;

    // BR-006: SLA target berdasarkan kategori dan urgensi
    let slaHours = 24;
    const cat = (ticket.kategoriMasalah || '').toLowerCase();
    const urg = ticket.prioritas || ticket.urgensi || 'Sedang';

    if (urg === 'Kritis') slaHours = 4;
    else if (urg === 'Tinggi') slaHours = 12;
    else if (cat.includes('jaringan') || cat.includes('server')) slaHours = 8;
    else if (urg === 'Rendah') slaHours = 48;

    const deadlineDate = new Date(Date.now() + slaHours * 60 * 60 * 1000);
    const deadlineStr = deadlineDate.toLocaleString('id-ID');

    // BR-007: Distribusi otomatis awal berdasarkan kategori/PIC
    const picMatch = this.determinePic(`${ticket.kategoriMasalah} ${ticket.namaBarang} ${ticket.deskripsi}`);

    const newTicket: DamageTicket = {
      ...ticket,
      id,
      status: 'Open/Unassigned',
      tanggalLapor: new Date().toLocaleString('id-ID'),
      slaTargetHours: slaHours,
      slaDeadline: deadlineStr,
      slaStatus: 'On Track',
      picTeknisi: ticket.picTeknisi || picMatch.role,
      namaPicTeknisi: ticket.namaPicTeknisi || picMatch.name,
      urgensi: ticket.urgensi || ticket.prioritas || 'Sedang',
      riwayatStatus: [
        {
          status: 'Open/Unassigned',
          timestamp: new Date().toLocaleString('id-ID'),
          catatan: `Laporan kerusakan diterbitkan via SSO Google UMC. Target SLA: ${slaHours} Jam.`,
          petugas: active.nama
        }
      ]
    };

    this.save(STORAGE_KEYS.DAMAGES, [newTicket, ...tickets]);

    // Update status aset terkait menjadi Maintenance
    if (newTicket.barcode && newTicket.barcode !== 'Tanpa Barcode') {
      this.updateAssetStatus(
        newTicket.barcode,
        'Maintenance',
        newTicket.lokasi,
        true,
        `Laporan gangguan tiket ${id}: ${newTicket.deskripsi}`
      );
    }

    this.addNotification({
      tujuan: newTicket.kontakPelapor,
      namaPenerima: newTicket.pelapor,
      kanal: 'WhatsApp',
      jenisNotifikasi: 'Tiket Dibuat',
      statusKirim: 'sent',
      pesanPreview: `Tiket ${id} berhasil dibuat. Target SLA penyelesaian: ${slaHours} Jam (${deadlineStr}). Tim Helpdesk PUSDATIN segera menindaklanjuti.`
    });

    this.addAuditTrail({
      entityType: 'Tiket Helpdesk',
      entityId: id,
      statusLama: 'None',
      statusBaru: 'Open/Unassigned',
      catatan: `Pembuatan tiket helpdesk oleh ${newTicket.pelapor} (${newTicket.kategoriMasalah}). SLA: ${slaHours} jam.`,
      idPengguna: active.id,
      namaPengguna: active.nama,
      rolePengguna: active.roleName
    });

    return newTicket;
  }

  public static createInternalDamageTicket(params: {
    barcode: string;
    namaBarang: string;
    lokasi: string;
    deskripsi: string;
    pelapor: string;
    status: DamageStatus;
    metodePerbaikan: 'Di Lokasi' | 'Dibawa ke PUSDATIN';
    urgensi: TicketUrgency;
    picTeknisi?: TechnicianRole;
  }): DamageTicket {
    const asset = params.barcode && params.barcode !== 'Tanpa Barcode' ? this.getAssetByBarcodeOrUnique(params.barcode) : undefined;
    return this.addDamageTicket({
      barcode: params.barcode,
      kodeUnikAset: asset?.kodeUnikAset || `AST-${params.barcode}`,
      namaBarang: params.namaBarang,
      pelapor: params.pelapor,
      kontakPelapor: '085964531388',
      lokasi: params.lokasi,
      deskripsi: params.deskripsi,
      kategoriMasalah: 'Hardware',
      prioritas: params.urgensi,
      metodePerbaikan: params.metodePerbaikan,
      picTeknisi: params.picTeknisi
    });
  }

  public static updateDamageTicketUrgency(id: string, urgensi: TicketUrgency): boolean {
    const tickets = this.getDamageTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx === -1) return false;
    tickets[idx] = {
      ...tickets[idx],
      prioritas: urgensi,
      urgensi: urgensi
    };
    this.save(STORAGE_KEYS.DAMAGES, tickets);
    return true;
  }

  // B.2, B.3, B.4, B.5: Proses Tiket Kerusakan oleh Admin & Teknisi
  public static processDamageTicket(
    id: string,
    action:
      | 'distribusi-pic'
      | 'jadwalkan-perbaikan'
      | 'butuh-suku-cadang'
      | 'lanjut-perbaikan'
      | 'selesai-perbaikan'
      | 're-open'
      | 'tutup-manual'
      | 'tidak-layak'
      | 'delegasikan'
      | 'jadwalkan-inspeksi'
      | 'perbaikan'
      | 'rusak-total'
      | 'selesai'
      | 'suku-cadang'
      | 'ubah-pic'
      | 'verifikasi-delegasi',
    options: {
      picTeknisiBaru?: TechnicianRole;
      namaPicBaru?: string;
      jadwalPemeriksaan?: string;
      catatan?: string;
      catatanAdmin?: string;
      kategoriPerbaikan?: RepairCategory;
      namaSukuCadang?: string;
      komponenList?: string[];
      sumberAnggaran?: 'Stok Internal PUSDATIN' | 'Pengajuan RKAT Kampus' | 'Biaya Unit/Fakultas';
      resolusiAkhir?: string;
      statusAsetBaru?: AssetStatus;
      lokasiBaruCustom?: string;
      petugasName?: string;
      dibawaKePusdatin?: boolean;
      kategoriMasalah?: string;
      jenisAset?: string;
      skenarioPerbaikan?: string;
      targetTechnicianId?: string;
      urgensiBaru?: TicketUrgency;
    }
  ): { success: boolean; message: string; ticket?: DamageTicket } {
    let effAction: string = action;
    if (action === 'jadwalkan-inspeksi') effAction = 'jadwalkan-perbaikan';
    else if (action === 'perbaikan' || action === 'lanjut-perbaikan') effAction = 'lanjut-perbaikan';
    else if (action === 'suku-cadang') effAction = 'butuh-suku-cadang';
    else if (action === 'selesai') effAction = 'selesai-perbaikan';
    else if (action === 'rusak-total') effAction = 'tidak-layak';
    else if (action === 'ubah-pic' || action === 'delegasikan' || action === 'verifikasi-delegasi') effAction = 'distribusi-pic';

    const active = this.getActiveUser();
    AccessControlService.enforce(
      active,
      effAction === 'distribusi-pic' ? 'distribusi_tiket' : 'tindakan_perbaikan',
      ['manage', 'execute', 'verify', 'propose'],
      `Memproses tiket kerusakan (${effAction})`
    );

    const tickets = this.getDamageTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return { success: false, message: 'Tiket kerusakan tidak ditemukan!' };

    const ticket = tickets[index];
    const statusLama = ticket.status;
    const nowStr = new Date().toLocaleString('id-ID');
    const operator = options.petugasName || active.nama;
    const asset = ticket.barcode ? this.getAssetByBarcodeOrUnique(ticket.barcode) : undefined;

    // Lanjut Perbaikan
    if (effAction === 'lanjut-perbaikan') {
      tickets[index] = {
        ...ticket,
        status: 'In Progress',
        catatanAdmin: options.catatan || options.catatanAdmin || 'Perbaikan dilanjutkan oleh teknisi.',
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'In Progress',
            timestamp: nowStr,
            catatan: `Perbaikan dilanjutkan oleh ${operator}.`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);
      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'In Progress',
        catatan: `Perbaikan dilanjutkan oleh ${operator}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });
      return { success: true, message: `Perbaikan tiket ${ticket.id} dilanjutkan!`, ticket: tickets[index] };
    }

    // B.2: Distribusi Tiket oleh Admin (BR-007)
    if (effAction === 'distribusi-pic') {
      const targetRole = options.picTeknisiBaru || ticket.picTeknisi || 'IT Support & Helpdesk Specialist';
      const matched = this.getUsers().find(u => u.roleName === targetRole);
      const techName = options.namaPicBaru || matched?.nama || targetRole;

      tickets[index] = {
        ...ticket,
        status: 'Assigned',
        picTeknisi: targetRole,
        namaPicTeknisi: techName,
        assignedTechnicianId: matched?.id,
        tanggalDitugaskan: nowStr,
        catatanAdmin: options.catatan || `Tiket didistribusikan ke PIC ${targetRole} (${techName}).`,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Assigned',
            timestamp: nowStr,
            catatan: `Distribusi tiket ke PIC: ${targetRole} (${techName}) oleh ${operator}.`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addNotification({
        tujuan: ticket.kontakPelapor,
        namaPenerima: ticket.pelapor,
        kanal: 'WhatsApp',
        jenisNotifikasi: 'Status Tiket Diperbarui',
        statusKirim: 'sent',
        pesanPreview: `Tiket ${ticket.id} telah didistribusikan ke teknisi ${techName} (${targetRole}).`
      });

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Assigned',
        catatan: `Distribusi tiket ke PIC ${targetRole} (${techName}) oleh ${operator}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Tiket ${ticket.id} didistribusikan ke ${techName} (${targetRole})!`,
        ticket: tickets[index]
      };
    }

    // B.3: Penjadwalan & Tindakan Perbaikan (In Progress)
    if (effAction === 'jadwalkan-perbaikan') {
      const schedule = options.jadwalPemeriksaan || `${nowStr} (Pemeriksaan Segera)`;
      tickets[index] = {
        ...ticket,
        status: 'In Progress',
        jadwalPemeriksaan: schedule,
        catatanAdmin: options.catatan || `Teknisi telah menjadwalkan pemeriksaan dan memulai perbaikan (${schedule}).`,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'In Progress',
            timestamp: nowStr,
            catatan: `Jadwal inspeksi & perbaikan dimulai: ${schedule}`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addNotification({
        tujuan: ticket.kontakPelapor,
        namaPenerima: ticket.pelapor,
        kanal: 'WhatsApp',
        jenisNotifikasi: 'Status Tiket Diperbarui',
        statusKirim: 'sent',
        pesanPreview: `Teknisi ${ticket.namaPicTeknisi} menjadwalkan perbaikan untuk tiket ${ticket.id}: ${schedule}.`
      });

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'In Progress',
        catatan: `Penjadwalan perbaikan oleh teknisi (${schedule})`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Perbaikan tiket ${ticket.id} dimulai (In Progress)! Jadwal: ${schedule}`,
        ticket: tickets[index]
      };
    }

    // B.4: Penanganan Suku Cadang (Pending – Menunggu Suku Cadang)
    if (effAction === 'butuh-suku-cadang') {
      const parts = options.komponenList || (options.namaSukuCadang ? [options.namaSukuCadang] : ['Suku Cadang Pengganti']);
      const partItems: SparePartItem[] = parts.map((p, idx) => ({
        id: `SP-${ticket.id}-${idx + 1}`,
        idTiket: ticket.id,
        namaKomponen: p.trim(),
        jumlah: 1,
        statusPengadaan: 'Diminta', // 4.4 Enum awal
        tanggalKebutuhan: nowStr
      }));

      tickets[index] = {
        ...ticket,
        status: 'Pending – Menunggu Suku Cadang',
        cabangPerbaikan: 'Butuh Suku Cadang',
        kategoriPerbaikan: options.kategoriPerbaikan || 'Suku Cadang (Perlu Anggaran)',
        namaSukuCadang: parts.join(', '),
        sukuCadangList: partItems,
        sumberAnggaran: options.sumberAnggaran || 'Stok Internal PUSDATIN',
        catatanAdmin: options.catatan || `Menunggu pengadaan suku cadang: ${parts.join(', ')}`,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Pending – Menunggu Suku Cadang',
            timestamp: nowStr,
            catatan: `Pemeriksaan teknisi: Kebutuhan suku cadang ${parts.join(', ')} (Status Pengadaan: Diminta).`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addNotification({
        tujuan: ticket.kontakPelapor,
        namaPenerima: ticket.pelapor,
        kanal: 'WhatsApp',
        jenisNotifikasi: 'Status Tiket Diperbarui',
        statusKirim: 'sent',
        pesanPreview: `Tiket ${ticket.id} membutuhkan suku cadang: ${parts.join(', ')}. Proses pengadaan sedang diproses.`
      });

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Pending – Menunggu Suku Cadang',
        catatan: `Kebutuhan ${parts.length} suku cadang dicatat oleh teknisi. Status tiket beralih ke Pending.`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Tiket ${ticket.id} kini berstatus Pending – Menunggu Suku Cadang!`,
        ticket: tickets[index]
      };
    }

    // B.5: Penyelesaian Perbaikan (Resolved)
    if (effAction === 'selesai-perbaikan') {
      const resolusi = options.resolusiAkhir || options.catatan || 'Perbaikan telah selesai dan perangkat telah berfungsi normal.';
      const statusFinalAset: AssetStatus = options.statusAsetBaru || 'Tersedia';

      tickets[index] = {
        ...ticket,
        status: 'Resolved',
        waktuSelesai: nowStr,
        resolvedAt: new Date().toISOString(),
        resolusiAkhir: resolusi,
        catatanAdmin: resolusi,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Resolved',
            timestamp: nowStr,
            catatan: `Perbaikan diselesaikan oleh ${operator}. Resolusi: ${resolusi}. Menunggu konfirmasi user (2 hari kerja).`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      // Kembalikan status aset ke Tersedia / Digunakan
      if (asset) {
        this.updateAssetStatus(
          asset.barcode,
          statusFinalAset,
          options.lokasiBaruCustom || asset.lokasiAwal || asset.lokasi,
          true,
          `Perbaikan selesai (Tiket: ${ticket.id})`
        );
      }

      this.addNotification({
        tujuan: ticket.kontakPelapor,
        namaPenerima: ticket.pelapor,
        kanal: 'WhatsApp',
        jenisNotifikasi: 'Status Tiket Diperbarui',
        statusKirim: 'sent',
        pesanPreview: `Tiket ${ticket.id} telah SELESAI (Resolved). Resolusi: ${resolusi}. Harap konfirmasi dalam 2 hari kerja jika kendala tuntas.`
      });

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Resolved',
        catatan: `Perbaikan selesai oleh ${operator}. Status beralih ke Resolved dengan grace period 2 hari kerja.`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Tiket ${ticket.id} berstatus RESOLVED! Masa konfirmasi 2 hari kerja diaktifkan.`,
        ticket: tickets[index]
      };
    }

    // B.5: User Re-open Tiket
    if (effAction === 're-open') {
      tickets[index] = {
        ...ticket,
        status: 'Re-opened',
        catatanAdmin: options.catatan || 'Pengguna melaporkan kendala belum terselesaikan sepenuhnya.',
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Re-opened',
            timestamp: nowStr,
            catatan: `Tiket dibuka kembali oleh pengguna (Re-opened): ${options.catatan || 'Kendala masih berulang.'}`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Re-opened',
        catatan: `Tiket di-reopen oleh pengguna: ${options.catatan || 'Masalah belum tuntas'}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return { success: true, message: `Tiket ${ticket.id} berhasil DIBUKA KEMBALI (Re-opened)!`, ticket: tickets[index] };
    }

    // B.5: Tutup Manual oleh User / Admin (Closed – Manual)
    if (effAction === 'tutup-manual') {
      tickets[index] = {
        ...ticket,
        status: 'Closed – Manual',
        closedMode: 'Manual',
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Closed – Manual',
            timestamp: nowStr,
            catatan: `Tiket ditutup manual oleh ${operator}. Kendala terkonfirmasi selesai.`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Closed – Manual',
        catatan: `Tiket ditutup manual (Closed - Manual) oleh ${operator}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return { success: true, message: `Tiket ${ticket.id} ditutup resmi (Closed – Manual)!`, ticket: tickets[index] };
    }

    // Perangkat Tidak Layak / Afkir (Beyond Economic Repair)
    if (effAction === 'tidak-layak') {
      tickets[index] = {
        ...ticket,
        status: 'Closed – Manual',
        kondisiAkhirAset: 'Tidak Layak',
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Closed – Manual',
            timestamp: nowStr,
            catatan: `Aset dinyatakan Tidak Layak / Rusak Total (Beyond Economic Repair). Disimpan ke gudang afkir.`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      if (asset) {
        this.updateAssetStatus(
          asset.barcode,
          'Tidak Layak',
          'Ruang Gudang Afkir PUSDATIN Kampus 2',
          true,
          `Dinyatakan Tidak Layak / Afkir (Tiket: ${ticket.id})`
        );
      }

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Closed – Manual',
        catatan: `Aset dinyatakan Tidak Layak oleh ${operator}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return { success: true, message: `Aset ditetapkan berstatus TIDAK LAYAK di Gudang Afkir. Tiket ditutup.`, ticket: tickets[index] };
    }

    return { success: false, message: 'Aksi tidak valid.' };
  }

  // --- 8.2 TABEL 13: SUKU CADANG (MODUL B.4) & INTEGRASI 4 (BR-014) ---
  public static getAllSpareParts(): SparePartWithTicket[] {
    const tickets = this.getDamageTickets();
    const result: SparePartWithTicket[] = [];

    tickets.forEach(ticket => {
      if (ticket.sukuCadangList && ticket.sukuCadangList.length > 0) {
        ticket.sukuCadangList.forEach(sp => {
          result.push({
            sparePartId: sp.id,
            namaKomponen: sp.namaKomponen,
            statusPengadaan: sp.statusPengadaan || 'Diminta',
            ticketId: ticket.id,
            ticketStatus: ticket.status,
            urgensi: ticket.urgensi || 'Sedang',
            barcode: ticket.barcode,
            kodeUnikAset: ticket.kodeUnikAset,
            namaBarang: ticket.namaBarang,
            lokasi: ticket.lokasi,
            pelapor: ticket.pelapor,
            picTeknisi: ticket.picTeknisi,
            namaPicTeknisi: ticket.namaPicTeknisi,
            assignedTechnicianId: ticket.assignedTechnicianId,
            tanggalKebutuhan: sp.tanggalKebutuhan || ticket.tanggalLapor,
            tanggalBeli: sp.tanggalBeli,
            tanggalDigunakan: sp.tanggalDigunakan,
            catatan: sp.catatan
          });
        });
      }
    });

    return result;
  }

  // 4.4 Status Pengadaan: Diminta -> Disetujui -> Dipesan -> Diterima -> Terpasang
  public static updateSparePartStatus(
    ticketId: string,
    sparePartId: string,
    newStatus: SparePartStatus,
    operatorName?: string,
    notes?: string
  ): { success: boolean; message: string } {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'suku_cadang', ['manage', 'execute'], 'Mengubah status pengadaan suku cadang');

    const tickets = this.getDamageTickets();
    const ticketIdx = tickets.findIndex(t => t.id === ticketId);
    if (ticketIdx === -1) return { success: false, message: 'Tiket tidak ditemukan!' };

    const ticket = tickets[ticketIdx];
    const nowStr = new Date().toLocaleString('id-ID');
    const operator = operatorName || active.nama;

    let partFound = false;
    let partName = '';
    let statusLama = '';

    if (ticket.sukuCadangList && ticket.sukuCadangList.length > 0) {
      ticket.sukuCadangList = ticket.sukuCadangList.map(sp => {
        if (sp.id === sparePartId || sp.id.endsWith(sparePartId)) {
          partFound = true;
          partName = sp.namaKomponen;
          statusLama = sp.statusPengadaan;
          return {
            ...sp,
            statusPengadaan: newStatus,
            tanggalBeli: newStatus === 'Diterima' ? nowStr : sp.tanggalBeli,
            tanggalDigunakan: newStatus === 'Terpasang' ? nowStr : sp.tanggalDigunakan,
            petugasPengadaan: newStatus === 'Diterima' ? operator : sp.petugasPengadaan,
            petugasPemasangan: newStatus === 'Terpasang' ? operator : sp.petugasPemasangan,
            catatan: notes || sp.catatan
          };
        }
        return sp;
      });
    }

    if (!partFound) return { success: false, message: 'Komponen suku cadang tidak ditemukan pada tiket.' };

    const note = `Suku cadang "${partName}" beralih status: ${newStatus} oleh ${operator}${notes ? ' (' + notes + ')' : ''}`;
    ticket.riwayatStatus = [
      ...(ticket.riwayatStatus || []),
      {
        status: ticket.status,
        timestamp: nowStr,
        catatan: note,
        petugas: operator
      }
    ];

    tickets[ticketIdx] = ticket;
    this.save(STORAGE_KEYS.DAMAGES, tickets);

    this.addAuditTrail({
      entityType: 'Suku Cadang',
      entityId: `${ticketId}-${sparePartId}`,
      statusLama,
      statusBaru: newStatus,
      catatan: note,
      idPengguna: active.id,
      namaPengguna: active.nama,
      rolePengguna: active.roleName
    });

    return {
      success: true,
      message: `Status suku cadang "${partName}" berhasil diubah menjadi "${newStatus}"!`
    };
  }

  // Integrasi 4 & BR-014: Registrasi Suku Cadang yang Menghasilkan Aset Baru ke Buku Penerimaan
  public static registerAssetFromSparePart(params: {
    ticketId: string;
    sparePartId: string;
    namaAset: string;
    kategori: string;
    nomorSeri?: string;
    hargaBeli: number;
    dari: string;
    nomorFaktur: string;
  }): { success: boolean; message: string; assetId?: string } {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'buku_penerimaan', ['manage'], 'Registrasi suku cadang sebagai aset baru');

    const penerimaanResult = this.addBukuPenerimaan({
      tanggalPenerimaan: new Date().toISOString().split('T')[0],
      dari: params.dari || 'Pengadaan Suku Cadang Helpdesk UMC',
      nomorFaktur: params.nomorFaktur || `SP-INV/${Date.now()}`,
      tanggalFaktur: new Date().toISOString().split('T')[0],
      namaAset: params.namaAset,
      kategori: params.kategori || 'Perlengkapan Kantor',
      banyaknya: 1,
      hargaSatuan: params.hargaBeli,
      nomorBeritaAcara: `BAST-SP/${params.ticketId}`,
      tanggalBeritaAcara: new Date().toISOString().split('T')[0],
      keterangan: `Aset baru dari penggantian komponen tiket ${params.ticketId} (BR-014 / Integrasi 4)`
    });

    const assets = this.getAssets();
    const barcode = String(Math.floor(10000000 + Math.random() * 90000000));
    const kodeUnikAset = `AST-UMC-${new Date().getFullYear()}-${String(assets.length + 1).padStart(3, '0')}`;

    this.addAsset({
      barcode,
      kodeUnikAset,
      nama: params.namaAset,
      kategori: params.kategori || 'Perlengkapan Kantor',
      nomorSeri: params.nomorSeri || `SN-${barcode}`,
      status: 'Tersedia',
      lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
      tanggalMasuk: new Date().toISOString().split('T')[0],
      hargaBeli: params.hargaBeli,
      vendorSupplier: params.dari,
      jenisAset: 'Fisik',
      idPenerimaanTerkait: penerimaanResult.data?.idPenerimaan
    });

    return {
      success: true,
      message: `Aset baru hasil penggantian suku cadang (${params.namaAset}) berhasil diregistrasi ke Buku Penerimaan (${penerimaanResult.data?.idPenerimaan}) dengan Kode Unik: ${kodeUnikAset}!`,
      assetId: kodeUnikAset
    };
  }

  // --- 8.2 TABEL 14: PENGAJUAN SISTEM BARU & PENGEMBANGAN APLIKASI (5.4) ---
  public static getSystemProposals(): SystemProposal[] {
    return this.load<SystemProposal[]>(STORAGE_KEYS.SYSTEM_PROPOSALS, INITIAL_SYSTEM_PROPOSALS);
  }

  // F-DEV-01: Civitas Ajukan Permintaan Fitur / Sistem Baru
  public static addSystemProposal(proposal: Omit<SystemProposal, 'id' | 'tanggalPengajuan' | 'status'>): SystemProposal {
    const list = this.getSystemProposals();
    const active = this.getActiveUser();
    const id = `SYS-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;

    const newProposal: SystemProposal = {
      ...proposal,
      id,
      tanggalPengajuan: new Date().toLocaleString('id-ID'),
      status: 'status_verifikasi' // Tahap 1
    };

    this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, [newProposal, ...list]);

    this.addNotification({
      tujuan: newProposal.kontakWhatsapp,
      namaPenerima: newProposal.pemohon,
      kanal: 'WhatsApp',
      jenisNotifikasi: 'Pengajuan Sistem Baru',
      statusKirim: 'sent',
      pesanPreview: `Pengajuan sistem baru "${newProposal.namaSistem}" (${id}) telah diterima dan sedang dalam tahap verifikasi awal kelengkapan dokumen oleh Admin.`
    });

    this.addAuditTrail({
      entityType: 'Pengajuan Sistem Baru',
      entityId: id,
      statusLama: 'None',
      statusBaru: 'status_verifikasi',
      catatan: `Pengajuan sistem baru diajukan oleh ${newProposal.pemohon} (${newProposal.unitKerja}).`,
      idPengguna: active.id,
      namaPengguna: active.nama,
      rolePengguna: active.roleName
    });

    return newProposal;
  }

  // Workflow 5-Tahap Pengajuan Sistem Baru (Section 5.4)
  public static advanceSystemProposal(
    id: string,
    action:
      | 'verifikasi_admin'
      | 'analisis_system_analyst'
      | 'verifikasi_keamanan'
      | 'approval_pimpinan'
      | 'update_progres_dev'
      | 'serah_terima',
    payload: any
  ): { success: boolean; message: string; proposal?: SystemProposal } {
    const list = this.getSystemProposals();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Pengajuan sistem tidak ditemukan!' };

    const p = list[index];
    const statusLama = p.status;
    const active = this.getActiveUser();
    const nowStr = new Date().toLocaleString('id-ID');

    // Tahap 1: Verifikasi Kelengkapan oleh Admin (ACT-03)
    if (action === 'verifikasi_admin') {
      AccessControlService.enforce(active, 'pengajuan_sistem', ['verify', 'manage'], 'Verifikasi kelengkapan dokumen sistem baru');
      const lengkap = payload.lengkap ?? true;
      list[index] = {
        ...p,
        status: lengkap ? 'status_analisis' : 'status_verifikasi',
        verifikasiAdmin: {
          petugas: active.nama,
          tanggal: nowStr,
          lengkap,
          catatan: payload.catatan || (lengkap ? 'Dokumen pengusulan lengkap.' : 'Dokumen belum lengkap, perlu revisi.')
        }
      };
      this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, list);

      this.addAuditTrail({
        entityType: 'Pengajuan Sistem Baru',
        entityId: p.id,
        statusLama,
        statusBaru: list[index].status,
        catatan: `Verifikasi kelengkapan oleh Admin ${active.nama}: ${payload.catatan}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: lengkap ? 'Verifikasi lolos! Pengajuan diteruskan ke System Analyst (status_analisis).' : 'Verifikasi tercatat (perlu revisi).',
        proposal: list[index]
      };
    }

    // Tahap 2: Analisis Kebutuhan oleh System Analyst (ACT-05)
    if (action === 'analisis_system_analyst') {
      AccessControlService.enforce(active, 'pengajuan_sistem', ['execute', 'manage'], 'Analisis kebutuhan sistem baru');
      list[index] = {
        ...p,
        status: 'status_keamanan',
        analisisKebutuhan: {
          analystName: active.nama,
          tanggal: nowStr,
          arsitekturData: payload.arsitekturData || 'Database Relasional & REST API',
          lingkupFitur: payload.lingkupFitur || '',
          estimasiSprintWeeks: Number(payload.estimasiSprintWeeks || 4),
          catatan: payload.catatan || 'Analisis kebutuhan selesai.'
        }
      };
      this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, list);

      this.addAuditTrail({
        entityType: 'Pengajuan Sistem Baru',
        entityId: p.id,
        statusLama,
        statusBaru: 'status_keamanan',
        catatan: `Analisis kebutuhan diselesaikan oleh System Analyst ${active.nama}. Dialihkan ke Cyber Security.`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: 'Analisis kebutuhan tuntas! Pengajuan dialihkan ke Cyber Security Officer (status_keamanan).',
        proposal: list[index]
      };
    }

    // Tahap 3: Verifikasi Keamanan oleh Cyber Security Officer (ACT-09)
    if (action === 'verifikasi_keamanan') {
      AccessControlService.enforce(active, 'pengajuan_sistem', ['verify', 'manage'], 'Verifikasi keamanan sistem baru');
      const lolos = payload.statusVerifikasi === 'Lolos';
      list[index] = {
        ...p,
        status: lolos ? 'status_approval' : 'status_keamanan',
        verifikasiKeamanan: {
          auditorName: active.nama,
          tanggal: nowStr,
          risikoKeamanan: payload.risikoKeamanan || 'Rendah',
          rekomendasiEnkripsi: payload.rekomendasiEnkripsi || 'Wajib TLS & Enkripsi AES',
          statusVerifikasi: payload.statusVerifikasi || 'Lolos',
          catatan: payload.catatan || 'Uji aspek keamanan telah dilakukan.'
        }
      };
      this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, list);

      this.addAuditTrail({
        entityType: 'Pengajuan Sistem Baru',
        entityId: p.id,
        statusLama,
        statusBaru: list[index].status,
        catatan: `Audit keamanan oleh ${active.nama}: ${payload.statusVerifikasi}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: lolos ? 'Keamanan terverifikasi! Pengajuan siap di-approve oleh Pimpinan PUSDATIN (status_approval).' : 'Catatan keamanan tersimpan.',
        proposal: list[index]
      };
    }

    // Tahap 4: Approval oleh Pimpinan PUSDATIN (ACT-02)
    if (action === 'approval_pimpinan') {
      AccessControlService.enforce(active, 'pengajuan_sistem', ['approve', 'manage'], 'Approval pengajuan sistem baru');
      const setuju = payload.keputusan === 'Disetujui';
      list[index] = {
        ...p,
        status: setuju ? 'status_pengembangan' : 'Ditolak',
        approvalPimpinan: {
          pejabat: active.nama,
          tanggal: nowStr,
          keputusan: setuju ? 'Disetujui' : 'Ditolak',
          catatan: payload.catatan || (setuju ? 'Disetujui untuk pengembangan sprint internal.' : 'Pengajuan ditolak.')
        },
        pengembangan: setuju ? {
          leadDev: 'Bayu Pratama, S.Kom.',
          progresPersen: 0,
          logProgres: [
            {
              tanggal: nowStr,
              petugas: active.nama,
              deskripsi: 'Sistem disetujui pimpinan PUSDATIN dan sprint pengembangan dimulai.',
              progres: 0
            }
          ],
          tanggalMulai: new Date().toISOString().split('T')[0]
        } : undefined
      };
      this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, list);

      this.addNotification({
        tujuan: p.kontakWhatsapp,
        namaPenerima: p.pemohon,
        kanal: 'WhatsApp',
        jenisNotifikasi: 'Pengajuan Sistem Baru',
        statusKirim: 'sent',
        pesanPreview: `Pengajuan sistem "${p.namaSistem}" telah ${setuju ? 'DISETUJUI' : 'DITOLAK'} oleh Kepala PUSDATIN. ${payload.catatan || ''}`
      });

      this.addAuditTrail({
        entityType: 'Pengajuan Sistem Baru',
        entityId: p.id,
        statusLama,
        statusBaru: list[index].status,
        catatan: `Otorisasi pimpinan: ${setuju ? 'Disetujui (status_pengembangan)' : 'Ditolak'} oleh ${active.nama}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: setuju ? 'Pengajuan DISETUJUI Kepala PUSDATIN! Sprint pengembangan dimulai (status_pengembangan).' : 'Pengajuan ditolak.',
        proposal: list[index]
      };
    }

    // Tahap 5: Update Progres Pengembangan (F-DEV-02) oleh Developer (ACT-06, ACT-07, ACT-08)
    if (action === 'update_progres_dev') {
      AccessControlService.enforce(active, 'pengajuan_sistem', ['execute', 'manage'], 'Mencatat progres pengembangan sistem');
      const currentDev = p.pengembangan || {
        leadDev: active.nama,
        progresPersen: 0,
        logProgres: []
      };

      const newPercent = Math.min(100, Math.max(0, Number(payload.progresPersen ?? currentDev.progresPersen)));
      const newLog = {
        tanggal: nowStr,
        petugas: active.nama,
        deskripsi: payload.deskripsi || 'Pembaruan progres pengembangan',
        progres: newPercent
      };

      const isCompleted = newPercent >= 100;

      list[index] = {
        ...p,
        status: isCompleted ? 'Selesai' : 'status_pengembangan',
        pengembangan: {
          ...currentDev,
          progresPersen: newPercent,
          logProgres: [...currentDev.logProgres, newLog],
          tanggalSelesai: isCompleted ? nowStr : currentDev.tanggalSelesai,
          codeReviewBy: payload.codeReviewBy || currentDev.codeReviewBy
        }
      };
      this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, list);

      this.addAuditTrail({
        entityType: 'Pengajuan Sistem Baru',
        entityId: p.id,
        statusLama,
        statusBaru: list[index].status,
        catatan: `Progres pengembangan: ${newPercent}% oleh ${active.nama}: ${payload.deskripsi}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Progres berhasil dicatat (${newPercent}%). ${isCompleted ? 'Sistem telah Selesai dan siap serah terima ke Service Desk!' : ''}`,
        proposal: list[index]
      };
    }

    // Tahap 5 Serah Terima ke Service Desk (BR-015)
    if (action === 'serah_terima') {
      AccessControlService.enforce(active, 'pengajuan_sistem', ['manage'], 'Serah terima sistem baru');
      const currentDev = p.pengembangan || { leadDev: active.nama, progresPersen: 100, logProgres: [] };
      list[index] = {
        ...p,
        status: 'Serah Terima',
        pengembangan: {
          ...currentDev,
          serahTerimaServiceDesk: true,
          codeReviewBy: active.nama
        }
      };
      this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, list);

      return {
        success: true,
        message: `Sistem "${p.namaSistem}" telah resmi diserahterimakan ke Service Desk PUSDATIN!`,
        proposal: list[index]
      };
    }

    return { success: false, message: 'Aksi tidak valid.' };
  }

  // Integrasi 5 & BR-015: Sistem/Aplikasi baru yang menghasilkan Server/Lisensi/Perangkat wajib diinput ke Pendataan Aset
  public static registerAssetFromSystemProposal(params: {
    proposalId: string;
    namaAset: string;
    jenisAset: 'Server VPS' | 'Lisensi Software' | 'Perangkat Pendukung';
    spesifikasi: string;
    hargaBeli: number;
    nomorPoFaktur?: string;
  }): { success: boolean; message: string; assetId?: string } {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'buku_penerimaan', ['manage'], 'Registrasi aset hasil sistem baru');

    // 1. Catat ke Buku Penerimaan Aset
    const penerimaanResult = this.addBukuPenerimaan({
      tanggalPenerimaan: new Date().toISOString().split('T')[0],
      dari: 'Hasil Pengembangan Internal PUSDATIN UMC',
      nomorFaktur: params.nomorPoFaktur || `DEV-ASSET/${params.proposalId}`,
      tanggalFaktur: new Date().toISOString().split('T')[0],
      namaAset: params.namaAset,
      kategori: params.jenisAset === 'Lisensi Software' ? 'Software & Lisensi' : 'Server & Storage',
      banyaknya: 1,
      hargaSatuan: params.hargaBeli || 0,
      nomorBeritaAcara: `BAST-DEV/${params.proposalId}`,
      tanggalBeritaAcara: new Date().toISOString().split('T')[0],
      keterangan: `Aset server/lisensi hasil pengembangan sistem baru ${params.proposalId} (BR-015 / Integrasi 5)`
    });

    // 2. Registrasikan ke Master Aset
    const assets = this.getAssets();
    const barcode = String(Math.floor(10000000 + Math.random() * 90000000));
    const kodeUnikAset = `AST-UMC-${new Date().getFullYear()}-${String(assets.length + 1).padStart(3, '0')}`;

    this.addAsset({
      barcode,
      kodeUnikAset,
      nama: params.namaAset,
      kategori: params.jenisAset === 'Lisensi Software' ? 'Software & Lisensi' : 'Server & Storage',
      spesifikasi: params.spesifikasi,
      status: 'Digunakan',
      lokasi: 'Ruang Server PUSDATIN Kampus 1',
      tanggalMasuk: new Date().toISOString().split('T')[0],
      hargaBeli: params.hargaBeli || 0,
      vendorSupplier: 'Internal PUSDATIN UMC',
      jenisAset: params.jenisAset === 'Lisensi Software' ? 'Non-Fisik' : 'Fisik',
      idPenerimaanTerkait: penerimaanResult.data?.idPenerimaan
    });

    // Tandai di proposal
    const proposals = this.getSystemProposals();
    const pIdx = proposals.findIndex(p => p.id === params.proposalId);
    if (pIdx !== -1) {
      proposals[pIdx].asetDihasilkan = {
        jenisAset: params.jenisAset,
        namaAset: params.namaAset,
        spesifikasi: params.spesifikasi,
        kodeUnikAset,
        sudahDiregistrasi: true
      };
      this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, proposals);
    }

    return {
      success: true,
      message: `Aset ${params.namaAset} (${kodeUnikAset}) berhasil diregistrasi ke Modul Pendataan Aset!`,
      assetId: kodeUnikAset
    };
  }

  // --- MASTER LOCATIONS & CATEGORIES ---
  public static getMasterLocations(): string[] {
    return this.load<string[]>(STORAGE_KEYS.MASTER_LOCATIONS, INITIAL_LOCATIONS);
  }

  public static addMasterLocation(loc: string): boolean {
    const trimmed = loc.trim();
    if (!trimmed) return false;
    const current = this.getMasterLocations();
    if (current.includes(trimmed)) return false;
    this.save(STORAGE_KEYS.MASTER_LOCATIONS, [...current, trimmed]);
    return true;
  }

  public static updateMasterLocation(oldLoc: string, newLoc: string): boolean {
    const list = this.getMasterLocations();
    const idx = list.indexOf(oldLoc);
    if (idx === -1) return false;
    list[idx] = newLoc;
    this.save(STORAGE_KEYS.MASTER_LOCATIONS, list);
    return true;
  }

  public static deleteMasterLocation(loc: string): boolean {
    const list = this.getMasterLocations();
    const filtered = list.filter(l => l !== loc);
    this.save(STORAGE_KEYS.MASTER_LOCATIONS, filtered);
    return true;
  }

  public static getMasterCategories(): string[] {
    return this.load<string[]>(STORAGE_KEYS.MASTER_CATEGORIES, INITIAL_CATEGORIES);
  }

  public static addMasterCategory(cat: string): boolean {
    const trimmed = cat.trim();
    if (!trimmed) return false;
    const current = this.getMasterCategories();
    if (current.includes(trimmed)) return false;
    this.save(STORAGE_KEYS.MASTER_CATEGORIES, [...current, trimmed]);
    return true;
  }

  public static updateMasterCategory(oldCat: string, newCat: string): boolean {
    const list = this.getMasterCategories();
    const idx = list.indexOf(oldCat);
    if (idx === -1) return false;
    list[idx] = newCat;
    this.save(STORAGE_KEYS.MASTER_CATEGORIES, list);
    return true;
  }

  public static deleteMasterCategory(cat: string): boolean {
    const list = this.getMasterCategories();
    const filtered = list.filter(c => c !== cat);
    this.save(STORAGE_KEYS.MASTER_CATEGORIES, filtered);
    return true;
  }

  // --- LOG AKTIVITAS (Tabel 4) ---
  public static getLogs(): ActivityLog[] {
    const raw = this.load<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
    // Deduplicate by id if any duplicates exist in storage
    const seen = new Set<string>();
    const deduplicated: ActivityLog[] = [];
    for (const item of raw) {
      if (item && item.id) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduplicated.push(item);
        }
      } else if (item) {
        deduplicated.push(item);
      }
    }
    return deduplicated;
  }

  public static addLog(log: ActivityLog): void {
    const logs = this.getLogs();
    const uniqueId =
      log.id && !logs.some(l => l.id === log.id)
        ? log.id
        : `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalLog: ActivityLog = {
      ...log,
      id: uniqueId
    };
    this.save(STORAGE_KEYS.LOGS, [finalLog, ...logs]);
  }

  // --- STATISTIK & EXECUTIVE DASHBOARD (F-DASH-03, 5.5) ---
  public static getStatistics(): AppStatistics {
    const assets = this.getAssets();
    const loans = this.getLoans();
    const damages = this.getDamageTickets();
    const proposals = this.getSystemProposals();
    const todayStr = new Date().toISOString().split('T')[0];

    const overdueLoans = loans.filter(l => (l.status === 'Diserahkan' || l.status === 'Terlambat') && l.tglKembali && l.tglKembali < todayStr);

    let tersedia = 0;
    let digunakan = 0;
    let dipinjam = 0;
    let maintenance = 0;
    let tidakLayak = 0;
    const kategoriMap: Record<string, number> = {};
    const lokasiMap: Record<string, number> = {};

    assets.forEach(a => {
      if (a.status === 'Tersedia') tersedia++;
      else if (a.status === 'Digunakan') digunakan++;
      else if (a.status === 'Dipinjam') dipinjam++;
      else if (a.status === 'Maintenance') maintenance++;
      else if (a.status === 'Tidak Layak') tidakLayak++;

      const kat = a.kategori || 'Lainnya';
      kategoriMap[kat] = (kategoriMap[kat] || 0) + 1;

      const lok = a.lokasi || 'Tanpa Lokasi';
      lokasiMap[lok] = (lokasiMap[lok] || 0) + 1;
    });

    const totalPinjamMenunggu = loans.filter(l => l.status === 'Diajukan').length;
    const totalAntreanTiket = damages.filter(d => d.status === 'Open/Unassigned' || d.status === 'Assigned').length;
    const totalSedangDiperbaiki = damages.filter(d => d.status === 'In Progress').length;
    const totalMenungguSparepart = damages.filter(d => d.status === 'Pending – Menunggu Suku Cadang').length;

    // SLA Achievement
    const closedTickets = damages.filter(d => d.status === 'Resolved' || d.status === 'Closed – Auto' || d.status === 'Closed – Manual');
    const totalSlaOverdue = damages.filter(d => d.slaStatus === 'Overdue').length;
    const onTimeClosed = closedTickets.filter(d => d.slaStatus !== 'Overdue').length;
    const slaAchievementRate = closedTickets.length > 0 ? Math.round((onTimeClosed / closedTickets.length) * 100) : 95;

    const totalPengajuanSistem = proposals.length;
    const pengajuanDalamPengembangan = proposals.filter(p => p.status === 'status_pengembangan').length;

    return {
      totalAset: assets.length,
      tersedia,
      digunakan,
      dipinjam,
      maintenance,
      tidakLayak,
      totalPinjamMenunggu,
      totalPinjamTerlambat: overdueLoans.length,
      totalAntreanTiket,
      totalSedangDiperbaiki,
      totalMenungguSparepart,
      totalSlaOverdue,
      slaAchievementRate,
      totalPengajuanSistem,
      pengajuanDalamPengembangan,
      kategoriMap,
      lokasiMap,
      overdueLoans
    };
  }

  public static getPicPerformanceReport(): PicPerformanceReport[] {
    const users = this.getUsers().filter(u => u.role !== 'ACT-01' && u.role !== 'ACT-10');
    const tickets = this.getDamageTickets();

    return users.map(u => {
      const assigned = tickets.filter(t => t.assignedTechnicianId === u.id || t.picTeknisi === u.roleName);
      const resolved = assigned.filter(t => t.status === 'Resolved' || t.status === 'Closed – Auto' || t.status === 'Closed – Manual').length;
      const inProgress = assigned.filter(t => t.status === 'In Progress').length;
      const waitingParts = assigned.filter(t => t.status === 'Pending – Menunggu Suku Cadang').length;
      const delegated = tickets.filter(t => t.delegasiDari && t.delegasiDari.includes(u.nama)).length;
      const onTime = assigned.filter(t => t.slaStatus !== 'Overdue').length;

      const resolutionRate = assigned.length > 0 ? Math.round((resolved / assigned.length) * 100) : 100;
      const slaOnTimeRate = assigned.length > 0 ? Math.round((onTime / assigned.length) * 100) : 100;

      return {
        technicianId: u.id,
        technicianName: u.nama,
        name: u.nama,
        role: u.roleName,
        totalAssigned: assigned.length,
        totalResolved: resolved,
        totalInProgress: inProgress,
        totalWaitingParts: waitingParts,
        totalDelegated: delegated,
        resolutionRate,
        slaOnTimeRate
      };
    });
  }

  // --- KEPALA PUSDATIN CONFIG ---
  public static getKepalaPusdatin(): { nama: string; nip: string } {
    return this.load<{ nama: string; nip: string }>(STORAGE_KEYS.KEPALA, {
      nama: 'Dr. Ir. H. Ahmad Dahlan, M.T.',
      nip: 'NIDN. 0418077501'
    });
  }

  public static setKepalaPusdatin(nama: string, nip: string): void {
    this.save(STORAGE_KEYS.KEPALA, { nama, nip });
  }

  // --- PIC DETERMINATION (BR-007) ---
  public static determinePic(deviceOrCategoryOrDesc: string): { role: TechnicianRole; name: string } {
    const text = (deviceOrCategoryOrDesc || '').toLowerCase();

    if (
      text.includes('wifi') ||
      text.includes('wi-fi') ||
      text.includes('jaringan') ||
      text.includes('switch') ||
      text.includes('router') ||
      text.includes('mikrotik') ||
      text.includes('lan') ||
      text.includes('cloud') ||
      text.includes('fiber')
    ) {
      return { role: 'Cloud & Infrastructure Engineer', name: 'Ir. Faisal Hakim, M.T.' };
    }

    if (
      text.includes('aplikasi') ||
      text.includes('siakad') ||
      text.includes('portal') ||
      text.includes('software') ||
      text.includes('database') ||
      text.includes('sql') ||
      text.includes('mbkm') ||
      text.includes('api')
    ) {
      return { role: 'System Analyst & Data Governance Specialist', name: 'Novi Andriani, M.Kom.' };
    }

    if (
      text.includes('security') ||
      text.includes('keamanan') ||
      text.includes('hack') ||
      text.includes('virus') ||
      text.includes('malware') ||
      text.includes('email') ||
      text.includes('phishing') ||
      text.includes('firewall')
    ) {
      return { role: 'Cyber Security Officer', name: 'Rian Hidayat, M.Kom.' };
    }

    return { role: 'IT Support & Helpdesk Specialist', name: 'Aditiya Ahmad Fadila, S.Kom.' };
  }

  // --- RESET & RESTORE ---
  public static resetToDefaultSeed(): void {
    this.save(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
    this.save(STORAGE_KEYS.LOANS, INITIAL_LOANS);
    this.save(STORAGE_KEYS.DAMAGES, INITIAL_DAMAGES);
    this.save(STORAGE_KEYS.BUKU_PENERIMAAN, INITIAL_BUKU_PENERIMAAN);
    this.save(STORAGE_KEYS.BUKU_PENGELUARAN, INITIAL_BUKU_PENGELUARAN);
    this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, INITIAL_SYSTEM_PROPOSALS);
    this.save(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.save(STORAGE_KEYS.AUDIT_TRAIL, INITIAL_AUDIT_TRAIL);
    this.save(STORAGE_KEYS.USERS, SEED_USERS);
  }
}
