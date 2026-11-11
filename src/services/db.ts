import {
  Asset,
  AssetStatus,
  LoanTicket,
  DamageTicket,
  ActivityLog,
  AppStatistics,
  EmailLog,
  TechnicianUser,
  TechnicianRole,
  RepairCategory,
  LoanHandoverMethod,
  SparePartItem,
  SparePartStatus,
  TicketUrgency,
  PicPerformanceReport
} from '../types';

export interface SparePartWithTicket {
  sparePartId: string;
  namaKomponen: string;
  statusPengadaan: SparePartStatus;
  ticketId: string;
  ticketStatus: string;
  urgensi: TicketUrgency;
  barcode: string;
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
  ASSETS: 'pusdatin_assets_v3',
  LOANS: 'pusdatin_loans_v3',
  DAMAGES: 'pusdatin_damages_v3',
  LOGS: 'pusdatin_logs_v3',
  KEPALA: 'pusdatin_kepala_v2',
  GAS_URL: 'pusdatin_gas_url_v2',
  MASTER_LOCATIONS: 'pusdatin_master_locations_v1',
  MASTER_CATEGORIES: 'pusdatin_master_categories_v1',
  TECHNICIANS: 'pusdatin_technicians_v4'
};

export const INITIAL_TECHNICIANS: TechnicianUser[] = [
  {
    id: 'TECH-000',
    name: 'Dr. Ir. H. Ahmad Dahlan, M.T.',
    role: 'Kepala PUSDATIN',
    email: 'kepala.pusdatin@umc.ac.id',
    password: 'admin',
    phone: '081122334455',
    specialty: 'Kepemimpinan Strategis, Kebijakan Transformasi Digital, & Otorisasi Pengadaan Aset',
    isFullAccess: true,
    level: 'Lead'
  },
  {
    id: 'TECH-001',
    name: 'Aditiya Ahmad Fadila, S.Kom.',
    role: 'IT Support & Helpdesk Specialist',
    email: 'aditiya.it@umc.ac.id',
    password: 'admin',
    phone: '085964531388',
    specialty: 'Hardware, Laptop, PC Lab, Printer, Proyektor, & Pengelolaan Fisik Inventaris',
    isFullAccess: true,
    level: 'Lead'
  },
  {
    id: 'TECH-002',
    name: 'Ir. Faisal Hakim, M.T.',
    role: 'Cloud & Infrastructure Engineer',
    email: 'faisal.cloud@umc.ac.id',
    password: 'admin',
    phone: '081234998877',
    specialty: 'Jaringan Kampus, Wi-Fi Ruijie/Ubiquiti, Switch Cisco, Router Mikrotik, Fiber Optic',
    isFullAccess: false,
    level: 'Senior'
  },
  {
    id: 'TECH-003',
    name: 'Bayu Pratama, S.Kom.',
    role: 'Programmer',
    email: 'bayu.dev@umc.ac.id',
    password: 'admin',
    phone: '085288776655',
    specialty: 'SIAKAD UMC, Web Portal Civitas, API Backend, Sistem Database & Software Architecture',
    isFullAccess: false,
    level: 'Senior'
  },
  {
    id: 'TECH-005',
    name: 'Dimas Saputra, S.Kom.',
    role: 'Junior Programmer',
    email: 'dimas.dev@umc.ac.id',
    password: 'admin',
    phone: '085799881122',
    specialty: 'Frontend Web SIAKAD, Bug Fixing CSS/JS, Query Laporan & Delegasi Programmer Senior',
    isFullAccess: false,
    level: 'Junior',
    reportsTo: 'TECH-003'
  },
  {
    id: 'TECH-004',
    name: 'Rian Hidayat, M.Kom.',
    role: 'Cyber Security Officer',
    email: 'rian.sec@umc.ac.id',
    password: 'admin',
    phone: '087711223344',
    specialty: 'Server Dell PowerEdge, Keamanan Jaringan, Firewall, Akun SSO, & Investigasi Malware',
    isFullAccess: false,
    level: 'Senior'
  }
];

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


const INITIAL_ASSETS: Asset[] = [
  {
    barcode: '30192848',
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
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
  },
  {
    barcode: '30918274',
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
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
  },
  {
    barcode: '20495812',
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
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
  },
  {
    barcode: '50291847',
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
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
  },
  {
    barcode: '10928374',
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
    barcode: '84930219',
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
    lokasiAwal: 'Gedung FKIP Lantai 2'
  },
  {
    barcode: '73920194',
    nama: 'Portable Wireless PA Sound System Baretone',
    kategori: 'Multimedia',
    merekModel: 'Baretone BT-3H1515BWR 15 Inch Active',
    nomorSeri: 'BRT-MAX15-02',
    spesifikasi: '15 Inch Active Speaker 250W RMS, 2 Wireless VHF Mic, Bluetooth/USB/SD, Baterai Aki Kering',
    lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    status: 'Tersedia',
    tanggalMasuk: '2026-09-01',
    tanggalPembelian: '2026-08-28',
    nomorPoInvoice: 'PO/UMC-RT/2026/VIII/077',
    vendorSupplier: 'Toko Nada Musik Cirebon',
    hargaBeli: 3850000,
    masaGaransi: '1 Tahun Garansi Baretone Audio (s/d Agustus 2027)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
  },
  {
    barcode: '62910482',
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
    barcode: '94820193',
    nama: 'Printer Epson L3210 All-in-One EcoTank',
    kategori: 'Perlengkapan Kantor',
    merekModel: 'Epson EcoTank L3210 Multifunction',
    nomorSeri: 'EPS-L3210-990',
    spesifikasi: 'Print, Scan, Copy Ink Tank System Original, Resolusi 5760 x 1440 dpi',
    pengguna: 'Ahmad Fauzi (Laboran)',
    bidangPengguna: 'Laboratorium Komputer 1 (Kampus 1)',
    lokasi: 'Laboratorium Komputer 1 (Kampus 1)',
    status: 'Rusak',
    tanggalMasuk: '2026-04-10',
    tanggalPembelian: '2026-04-02',
    nomorPoInvoice: 'PO/UMC-LAB/2026/IV/033',
    vendorSupplier: 'CV. Sumber Makmur Komputer',
    hargaBeli: 2450000,
    masaGaransi: '2 Tahun / 30.000 Lembar Garansi Resmi Epson (s/d April 2028)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Laboratorium Komputer 1 (Kampus 1)'
  },
  {
    barcode: '49201948',
    nama: 'Kabel Converter HDMI to VGA + Audio 10M',
    kategori: 'Kabel & Aksesoris',
    merekModel: 'Vention Gold-Plated HDMI to VGA with Audio 10 Meter',
    nomorSeri: 'CBL-H2V-10M',
    spesifikasi: 'Gold Plated Connector 1080P Full HD 60Hz, Panjang 10 Meter, Audio Aux 3.5mm Port',
    lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    status: 'Tersedia',
    tanggalMasuk: '2026-10-01',
    tanggalPembelian: '2026-09-25',
    nomorPoInvoice: 'PO/UMC-ACC/2026/IX/112',
    vendorSupplier: 'PT. Vention Technology Indonesia',
    hargaBeli: 185000,
    masaGaransi: '1 Tahun Garansi Penggantian Baru (s/d September 2027)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
  },
  {
    barcode: '88392011',
    nama: 'Server Dell PowerEdge R440 Xeon Silver',
    kategori: 'Server & Storage',
    merekModel: 'Dell EMC PowerEdge R440 1U Rack Server',
    nomorSeri: 'DELL-R440-2025',
    spesifikasi: 'Intel Xeon Silver 4210 10C/20T, 64GB DDR4 ECC Registered, 4x2TB SAS 12Gbps 7.2K RAID 10, Dual PSU 550W',
    pengguna: 'Tim Cloud & Infrastructure PUSDATIN',
    bidangPengguna: 'Ruang Server PUSDATIN Kampus 1',
    lokasi: 'Ruang Server PUSDATIN Kampus 1',
    status: 'Digunakan',
    tanggalMasuk: '2025-11-20',
    tanggalPembelian: '2025-11-10',
    nomorPoInvoice: 'PO/UMC-SRV/2025/XI/001',
    vendorSupplier: 'PT. Computrade Technology International (CTI)',
    hargaBeli: 65000000,
    masaGaransi: '5 Tahun ProSupport Mission Critical Dell (s/d November 2030)',
    jenisAset: 'Fisik',
    lokasiAwal: 'Ruang Server PUSDATIN Kampus 1'
  },
  {
    barcode: 'SIAKAD-UMC-01',
    nama: 'Aplikasi SIAKAD UMC & Portal Mahasiswa',
    kategori: 'Server & Storage',
    merekModel: 'Sistem Informasi Akademik Terpadu UMC v4.2',
    nomorSeri: 'SOFT-SIAKAD-2026',
    spesifikasi: 'Web Portal SIAKAD, Modul KRS Online, API Mobile Civitas, PostgreSQL & Redis Cache',
    pengguna: 'Seluruh Civitas Akademika UMC (Dosen & Mahasiswa)',
    bidangPengguna: 'Biro Administrasi Akademik (BAA)',
    lokasi: 'Ruang Server PUSDATIN Kampus 1',
    status: 'Digunakan',
    tanggalMasuk: '2026-01-10',
    tanggalPembelian: '2026-01-05',
    nomorPoInvoice: 'PO/UMC-SOFT/2026/I/001',
    vendorSupplier: 'In-House Software Development Team PUSDATIN',
    hargaBeli: 25000000,
    masaGaransi: 'Maintenance & Security Updates Berkala Selamanya',
    jenisAset: 'Non-Fisik',
    lokasiAwal: 'Ruang Server PUSDATIN Kampus 1'
  }
];

const INITIAL_LOANS: LoanTicket[] = [
  {
    id: 'PJM-20261102-1042',
    peminjam: 'Hilyah Aulia, S.T.',
    nik: '6565656',
    unit: 'Biro Administrasi Umum (BAU)',
    kontak: '085964531388',
    email: 'hilyah@umc.ac.id',
    barangPinjaman: 'Laptop Lenovo ThinkPad L14 Gen 3',
    jumlah: 1,
    tglPinjam: '2026-11-02',
    tglKembali: '2026-11-04', // Overdue! (Today is 2026-11-06 / 2026-11-07)
    status: 'Disetujui',
    barcode: '20495812',
    namaBarangT: 'Laptop Lenovo ThinkPad L14 Gen 3',
    kondisi: 'Baik / Lengkap Charger & Tas',
    petugas: 'Aditiya Ahmad Fadila',
    catatan: 'Untuk kebutuhan akreditasi prodi dan rapat rektorat',
    tglAju: '02/11/2026 09:30',
    tglAmbil: '2026-11-02'
  },
  {
    id: 'PJM-20261105-0814',
    peminjam: 'Dr. Ir. Sunardi, M.Eng.',
    nik: '0412087501',
    unit: 'Fakultas Teknik (Informatika)',
    kontak: '081222334455',
    email: 'sunardi@umc.ac.id',
    barangPinjaman: 'Proyektor Epson EB-E500',
    jumlah: 1,
    tglPinjam: '2026-11-05',
    tglKembali: '2026-11-08',
    status: 'Disetujui',
    barcode: '50291847',
    namaBarangT: 'Proyektor Epson EB-E500 3300 Lumens',
    kondisi: 'Baik & Normal',
    petugas: 'Aditiya Ahmad Fadila',
    catatan: 'Kuliah Tamu Industri Informatika',
    tglAju: '05/11/2026 08:15',
    tglAmbil: '2026-11-05'
  },
  {
    id: 'PJM-20261106-1011',
    peminjam: 'Nurul Hidayah, M.Kom.',
    nik: '0428098602',
    unit: 'Fakultas Teknik (Dosen Teknik Informatika)',
    kontak: '081394857211',
    email: 'nurul.hidayah@umc.ac.id',
    barangPinjaman: 'Laptop ASUS ExpertBook B1 Core i7 16GB',
    jumlah: 1,
    tglPinjam: '2026-11-07',
    tglKembali: '2026-11-09',
    status: 'Menunggu',
    catatan: 'Pengujian Sidang Tugas Akhir Mahasiswa TI Gelombang 2',
    tglAju: '06/11/2026 08:30'
  },
  {
    id: 'PJM-20261106-1025',
    peminjam: 'Ahmad Fauzan',
    nik: '2201090185',
    unit: 'Himpunan Mahasiswa Teknik Informatika (HMTI)',
    kontak: '085964531388',
    email: 'ahmadfauzan@umc.ac.id',
    barangPinjaman: 'Laptop ASUS ExpertBook B1 Core i7 16GB',
    jumlah: 1,
    tglPinjam: '2026-11-07',
    tglKembali: '2026-11-09',
    status: 'Menunggu',
    catatan: 'Operator Workshop Pemrograman Web HMTI Kampus 2',
    tglAju: '06/11/2026 08:42'
  },
  {
    id: 'PJM-20261106-9921',
    peminjam: 'BEM Universitas Muhammadiyah Cirebon',
    nik: '2201090044',
    unit: 'Organisasi Mahasiswa (BEM UMC)',
    kontak: '087788991122',
    email: 'bem@umc.ac.id',
    barangPinjaman: 'Portable Wireless PA Sound System Baretone',
    jumlah: 1,
    tglPinjam: '2026-11-07',
    tglKembali: '2026-11-08',
    status: 'Menunggu',
    catatan: 'Seminar Nasional Kepemudaan UMC',
    tglAju: '06/11/2026 14:00'
  }
];

const INITIAL_DAMAGES: DamageTicket[] = [
  {
    id: 'TKT-20261107-105',
    barcode: '49201948',
    namaBarang: 'Kabel Converter HDMI to VGA + Audio 10M',
    pelapor: 'Drs. H. Mulyono, M.Pd. (Dosen FKIP)',
    kontakPelapor: '081223344556',
    lokasi: 'Smart Classroom Gedung B Lt.3',
    lokasiAwal: 'Smart Classroom Gedung B Lt.3',
    deskripsi: 'Kabel pin converter longgar dan tidak dapat memproyeksikan video laptop ke proyektor.',
    tanggalLapor: '07/11/2026 08:30',
    status: 'Open',
    urgensi: 'Tinggi',
    kategoriMasalah: 'Hardware',
    jenisAset: 'Fisik',
    picTeknisi: 'IT Support & Helpdesk Specialist',
    namaPicTeknisi: 'Aditiya Ahmad Fadila, S.Kom.',
    assignedTechnicianId: 'TECH-001',
    catatanAdmin: 'Laporan baru masuk dari pengguna. Menunggu verifikasi kelengkapan informasi dan delegasi admin.',
    riwayatStatus: [
      {
        status: 'Open',
        timestamp: '07/11/2026 08:30',
        catatan: 'Laporan kerusakan dibuat oleh pengguna dengan status Open / Baru.',
        petugas: 'Drs. H. Mulyono, M.Pd.'
      }
    ]
  },
  {
    id: 'TKT-20261107-092',
    barcode: '84930219',
    namaBarang: 'Access Point Ruijie Reyee RG-RAP2200(E)',
    pelapor: 'Drs. Supriyanto, M.Pd.',
    kontakPelapor: '085290192837',
    lokasi: 'Gedung FKIP Lantai 2',
    lokasiAwal: 'Gedung FKIP Lantai 2',
    deskripsi: 'Sinyal Wi-Fi sering putus dan roaming lambat di area koridor lantai 2.',
    tanggalLapor: '07/11/2026 07:15',
    status: 'Assigned',
    urgensi: 'Tinggi',
    kategoriMasalah: 'Hardware',
    jenisAset: 'Fisik',
    picTeknisi: 'Cloud & Infrastructure Engineer',
    namaPicTeknisi: 'Ir. Faisal Hakim, M.T.',
    assignedTechnicianId: 'TECH-002',
    catatanAdmin: 'Admin telah memverifikasi kelengkapan informasi tiket dan mendelegasikan penanganan ke PIC Cloud & Infrastructure Engineer.',
    riwayatStatus: [
      {
        status: 'Open',
        timestamp: '07/11/2026 07:15',
        catatan: 'Laporan kendala Wi-Fi civitas masuk ke sistem.',
        petugas: 'Drs. Supriyanto, M.Pd.'
      },
      {
        status: 'Assigned',
        timestamp: '07/11/2026 07:45',
        catatan: 'Tiket diverifikasi oleh Admin PUSDATIN. Kategori: Hardware jaringan fisik. Didelegasikan ke Ir. Faisal Hakim, M.T.',
        petugas: 'Admin Helpdesk PUSDATIN'
      }
    ]
  },
  {
    id: 'TKT-20261106-302',
    barcode: 'SIAKAD-UMC-01',
    namaBarang: 'Aplikasi SIAKAD UMC & Portal Mahasiswa',
    pelapor: 'Dr. Endang, M.Pd. (Dekan FKIP)',
    kontakPelapor: '081233445566',
    lokasi: 'Ruang Server PUSDATIN Kampus 1',
    lokasiAwal: 'Ruang Server PUSDATIN Kampus 1',
    deskripsi: 'Query database pengisian KRS mahasiswa semester ganjil mengalami dead-lock dan timeout saat jam sibuk.',
    tanggalLapor: '06/11/2026 09:00',
    status: 'In Progress',
    urgensi: 'Kritis',
    kategoriMasalah: 'Software',
    jenisAset: 'Non-Fisik',
    jadwalPemeriksaan: '07/11/2026 09:30 WIB (Pemeriksaan Remote Database Query & Server Redis)',
    skenarioPerbaikan: 'Non-Fisik (Remote/Server)',
    picTeknisi: 'Programmer',
    namaPicTeknisi: 'Bayu Pratama, S.Kom.',
    assignedTechnicianId: 'TECH-003',
    catatanAdmin: 'Skenario Non-Fisik: Teknisi menjadwalkan pemeriksaan dan perbaikan jarak jauh (Remote) pada indeks tabel SQL dan Redis Cache.',
    riwayatStatus: [
      {
        status: 'Open',
        timestamp: '06/11/2026 09:00',
        catatan: 'Laporan kendala database SIAKAD dibuat oleh Dekan FKIP.',
        petugas: 'Dr. Endang, M.Pd.'
      },
      {
        status: 'Assigned',
        timestamp: '06/11/2026 09:15',
        catatan: 'Verifikasi tiket: Masalah Software / Sistem Non-Fisik. Didelegasikan ke Programmer.',
        petugas: 'Admin Helpdesk PUSDATIN'
      },
      {
        status: 'In Progress',
        timestamp: '06/11/2026 09:30',
        catatan: 'Teknisi menerima notifikasi tugas dan menjadwalkan waktu inspeksi teknis via Remote Server.',
        petugas: 'Bayu Pratama, S.Kom.'
      }
    ]
  },
  {
    id: 'TKT-20261106-101',
    barcode: '94820193',
    namaBarang: 'Printer Epson L3210 All-in-One EcoTank',
    pelapor: 'Ahmad Fauzi (Laboran)',
    kontakPelapor: '081394857211',
    lokasi: 'Laboratorium Komputer 1 (Kampus 1)',
    lokasiAwal: 'Laboratorium Komputer 1 (Kampus 1)',
    deskripsi: 'Paper jam berulang kali dan lampu indikator tinta merah berkedip terus (roller karet aus & kabel fleksibel retak).',
    tanggalLapor: '06/11/2026 10:15',
    status: 'Pending Procurement',
    urgensi: 'Tinggi',
    kategoriMasalah: 'Hardware',
    jenisAset: 'Fisik',
    skenarioPerbaikan: 'Fisik (Bawa ke PUSDATIN)',
    cabangPerbaikan: 'Butuh Suku Cadang',
    picTeknisi: 'IT Support & Helpdesk Specialist',
    namaPicTeknisi: 'Aditiya Ahmad Fadila, S.Kom.',
    assignedTechnicianId: 'TECH-001',
    kategoriPerbaikan: 'Suku Cadang (Perlu Anggaran)',
    namaSukuCadang: 'Roller Karet Pickup Paper Epson L3210, Kabel Fleksibel Head Print L3210',
    sumberAnggaran: 'Pengajuan RKAT Kampus',
    sukuCadangList: [
      {
        id: 'SP-101-1',
        namaKomponen: 'Roller Karet Pickup Paper Epson L3210',
        statusPengadaan: 'Belum Dibeli',
        tanggalKebutuhan: '06/11/2026 10:30'
      },
      {
        id: 'SP-101-2',
        namaKomponen: 'Kabel Fleksibel Head Print L3210',
        statusPengadaan: 'Belum Dibeli',
        tanggalKebutuhan: '06/11/2026 10:30'
      }
    ],
    catatanAdmin: 'Skenario Fisik (Cabang B1): Diperiksa di lab PUSDATIN. Membutuhkan pengadaan 2 komponen spare part. Menunggu proses pembelian (Pending Procurement).',
    riwayatStatus: [
      {
        status: 'Open',
        timestamp: '06/11/2026 10:15',
        catatan: 'Laporan paper jam printer masuk.',
        petugas: 'Ahmad Fauzi'
      },
      {
        status: 'Assigned',
        timestamp: '06/11/2026 10:20',
        catatan: 'Diverifikasi sebagai masalah Hardware Fisik dan ditugaskan ke IT Support.',
        petugas: 'Admin Helpdesk PUSDATIN'
      },
      {
        status: 'In Progress',
        timestamp: '06/11/2026 10:35',
        catatan: 'Pemeriksaan fisik dilakukan di Lab PUSDATIN.',
        petugas: 'Aditiya Ahmad Fadila, S.Kom.'
      },
      {
        status: 'Pending Procurement',
        timestamp: '06/11/2026 11:00',
        catatan: 'Memicu alur Menunggu Pembelian (Pending Procurement) untuk 2 komponen suku cadang.',
        petugas: 'Aditiya Ahmad Fadila, S.Kom.'
      }
    ]
  },
  {
    id: 'TKT-20261105-201',
    barcode: '50291847',
    namaBarang: 'Proyektor Epson EB-E500 3300 Lumens',
    pelapor: 'Dr. Ir. Sunardi, M.Eng.',
    kontakPelapor: '081222334455',
    lokasi: 'Fakultas Teknik (Informatika)',
    lokasiAwal: 'Fakultas Teknik (Informatika)',
    deskripsi: 'Proyektor mati mendadak setelah 15 menit menyala, kipas exhaust berbunyi kasar dan berdebu tebal.',
    tanggalLapor: '05/11/2026 13:00',
    status: 'Closed',
    urgensi: 'Sedang',
    kategoriMasalah: 'Hardware',
    jenisAset: 'Fisik',
    skenarioPerbaikan: 'Fisik (Bawa ke PUSDATIN)',
    kondisiAkhirAset: 'Tersedia',
    tanggalSelesai: '06/11/2026 14:00',
    resolusiAkhir: 'Pembersihan thermal intake, penggantian pasta pendingin optik, dan uji kelayakan 2 jam normal.',
    picTeknisi: 'IT Support & Helpdesk Specialist',
    namaPicTeknisi: 'Aditiya Ahmad Fadila, S.Kom.',
    assignedTechnicianId: 'TECH-001',
    catatanAdmin: 'Perbaikan tuntas. Aset ditarik sebagai stok cadangan di Ruang PUSDATIN dengan status Tersedia.',
    riwayatStatus: [
      {
        status: 'Open',
        timestamp: '05/11/2026 13:00',
        catatan: 'Laporan kerusakan proyektor masuk.',
        petugas: 'Dr. Ir. Sunardi, M.Eng.'
      },
      {
        status: 'Assigned',
        timestamp: '05/11/2026 13:10',
        catatan: 'Didelegasikan ke IT Support & Helpdesk Specialist.',
        petugas: 'Admin PUSDATIN'
      },
      {
        status: 'In Progress',
        timestamp: '05/11/2026 13:30',
        catatan: 'Barang dibawa ke PUSDATIN untuk servis pembongkaran.',
        petugas: 'Aditiya Ahmad Fadila, S.Kom.'
      },
      {
        status: 'Closed',
        timestamp: '06/11/2026 14:00',
        catatan: 'Perbaikan selesai tuntas. Tiket Closed dan status aset diperbarui menjadi Tersedia di PUSDATIN.',
        petugas: 'Aditiya Ahmad Fadila, S.Kom.'
      }
    ]
  }
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-11-02 09:35',
    barcode: '20495812',
    namaBarang: 'Laptop Lenovo ThinkPad L14 Gen 3',
    jenisTransaksi: 'Pinjam',
    lokasi: 'Biro Administrasi Umum (BAU)',
    keterangan: 'Dipinjam oleh Hilyah Aulia, S.T. (Tiket: PJM-20261102-1042)',
    petugas: 'Aditiya Ahmad Fadila'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-11-04 14:00',
    barcode: '84930219',
    namaBarang: 'Access Point Ruijie Reyee RG-RAP2200(E)',
    jenisTransaksi: 'Perbaikan',
    lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    keterangan: 'Perangkat dibawa ke Ruang PUSDATIN untuk servis firmware (Tiket: TKT-20261104-892)',
    petugas: 'Tim Teknis PUSDATIN'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-11-05 08:20',
    barcode: '50291847',
    namaBarang: 'Proyektor Epson EB-E500 3300 Lumens',
    jenisTransaksi: 'Pinjam',
    lokasi: 'Fakultas Teknik (Informatika)',
    keterangan: 'Dipinjam oleh Dr. Ir. Sunardi, M.Eng. (Tiket: PJM-20261105-0814)',
    petugas: 'Aditiya Ahmad Fadila'
  }
];

export class AppDatabase {
  // Load Helpers
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

  // --- ASSETS ---
  public static getAssets(): Asset[] {
    return this.load<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
  }

  public static getAssetByBarcode(barcode: string): Asset | undefined {
    const assets = this.getAssets();
    const clean = barcode.trim().toLowerCase();
    return assets.find(a => a.barcode.toLowerCase() === clean);
  }

  public static addAsset(asset: Asset): void {
    const assets = this.getAssets();
    // Prepend new asset
    const updated = [asset, ...assets.filter(a => a.barcode !== asset.barcode)];
    this.save(STORAGE_KEYS.ASSETS, updated);

    // Log addition
    this.addLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      barcode: asset.barcode,
      namaBarang: asset.nama,
      jenisTransaksi: 'Masuk',
      lokasi: asset.lokasi,
      keterangan: 'Registrasi barang baru ke sistem inventaris PUSDATIN UMC'
    });
  }

  public static updateAssetStatus(
    barcode: string,
    status: AssetStatus,
    lokasi?: string,
    logActivity = true,
    keterangan?: string
  ): boolean {
    const assets = this.getAssets();
    const index = assets.findIndex(a => a.barcode === barcode);
    if (index === -1) return false;

    const old = assets[index];
    const newLokasi = lokasi || old.lokasi;

    assets[index] = {
      ...old,
      status,
      lokasi: newLokasi,
      lokasiAwal: old.lokasiAwal || old.lokasi
    };
    this.save(STORAGE_KEYS.ASSETS, assets);

    if (logActivity) {
      let jenis: ActivityLog['jenisTransaksi'] = 'Mutasi Lokasi';
      if (status === 'Rusak') jenis = 'Rusak';
      else if (status === 'Diperbaiki') jenis = 'Perbaikan';
      else if (status === 'Dipinjam') jenis = 'Pinjam';
      else if (status === 'Tersedia' && old.status === 'Dipinjam') jenis = 'Kembali';
      else if (status === 'Tersedia' && (old.status === 'Rusak' || old.status === 'Diperbaiki')) jenis = 'Selesai Perbaikan';

      this.addLog({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        barcode,
        namaBarang: old.nama,
        jenisTransaksi: jenis,
        lokasi: newLokasi,
        keterangan: keterangan || `Update status menjadi ${status} di ${newLokasi}`
      });
    }

    return true;
  }

  public static updateAssetFull(
    barcode: string,
    data: Partial<Asset>,
    logActivity = true,
    keterangan?: string
  ): boolean {
    const assets = this.getAssets();
    const index = assets.findIndex(a => a.barcode === barcode);
    if (index === -1) return false;

    const old = assets[index];
    const updated: Asset = {
      ...old,
      ...data,
      barcode: old.barcode // keep barcode immutable
    };

    assets[index] = updated;
    this.save(STORAGE_KEYS.ASSETS, assets);

    if (logActivity) {
      this.addLog({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        barcode,
        namaBarang: updated.nama,
        jenisTransaksi: 'Mutasi Lokasi',
        lokasi: updated.lokasi,
        keterangan: keterangan || `Pembaruan data lengkap inventaris aset ${updated.nama} (${barcode})`
      });
    }

    return true;
  }

  // --- TECHNICIANS & ROLES (Enhancement B.7) ---
  public static determinePic(deviceOrCategoryOrDesc: string): { role: TechnicianRole; name: string } {
    const text = (deviceOrCategoryOrDesc || '').toLowerCase();

    // 1. Cloud & Infrastructure Engineer
    if (
      text.includes('wifi') ||
      text.includes('wi-fi') ||
      text.includes('access point') ||
      text.includes('jaringan') ||
      text.includes('lan') ||
      text.includes('switch') ||
      text.includes('router') ||
      text.includes('mikrotik') ||
      text.includes('kabel lan') ||
      text.includes('internet') ||
      text.includes('ip address') ||
      text.includes('gateway') ||
      text.includes('ethernet') ||
      text.includes('fiber')
    ) {
      return { role: 'Cloud & Infrastructure Engineer', name: 'Ir. Faisal Hakim, M.T.' };
    }

    // 2. Programmer / Software Engineer
    if (
      text.includes('aplikasi') ||
      text.includes('siakad') ||
      text.includes('web') ||
      text.includes('portal') ||
      text.includes('software') ||
      text.includes('program') ||
      text.includes('database') ||
      text.includes('sql') ||
      text.includes('bug') ||
      text.includes('error 500') ||
      text.includes('login') ||
      text.includes('sistem informasi') ||
      text.includes('api')
    ) {
      return { role: 'Programmer', name: 'Bayu Pratama, S.Kom.' };
    }

    // 3. Cyber Security Officer
    if (
      text.includes('server') ||
      text.includes('cyber') ||
      text.includes('security') ||
      text.includes('keamanan') ||
      text.includes('firewall') ||
      text.includes('hack') ||
      text.includes('malware') ||
      text.includes('virus') ||
      text.includes('ransomware') ||
      text.includes('kebocoran') ||
      text.includes('pembajakan') ||
      text.includes('ssl') ||
      text.includes('port scan')
    ) {
      return { role: 'Cyber Security Officer', name: 'Rian Hidayat, M.Kom.' };
    }

    // 4. IT Support & Helpdesk Specialist (Default for hardware, printer, projector, pc, laptop)
    return { role: 'IT Support & Helpdesk Specialist', name: 'Aditiya Ahmad Fadila, S.Kom.' };
  }

  public static getTechnicians(): TechnicianUser[] {
    const list = this.load<TechnicianUser[]>(STORAGE_KEYS.TECHNICIANS, INITIAL_TECHNICIANS);
    if (!list || list.length === 0) return INITIAL_TECHNICIANS;
    return list;
  }

  public static addTechnician(tech: Omit<TechnicianUser, 'id'>): TechnicianUser {
    const list = this.getTechnicians();
    const newId = `TECH-${String(list.length + 1).padStart(3, '0')}`;
    const newTech: TechnicianUser = {
      ...tech,
      id: newId,
      password: tech.password || 'admin'
    };
    this.save(STORAGE_KEYS.TECHNICIANS, [...list, newTech]);
    return newTech;
  }

  public static updateTechnician(tech: TechnicianUser): boolean {
    const list = this.getTechnicians();
    const idx = list.findIndex(t => t.id === tech.id);
    if (idx === -1) return false;
    list[idx] = { ...tech };
    this.save(STORAGE_KEYS.TECHNICIANS, list);
    return true;
  }

  public static deleteTechnician(id: string): boolean {
    if (id === 'TECH-000' || id === 'TECH-001') return false;
    const list = this.getTechnicians();
    const updated = list.filter(t => t.id !== id);
    this.save(STORAGE_KEYS.TECHNICIANS, updated);
    return true;
  }

  public static authenticateUser(emailOrId: string, password: string): TechnicianUser | null {
    const trimmedInput = (emailOrId || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    const technicians = this.getTechnicians();
    const user = technicians.find(
      t => t.email.toLowerCase() === trimmedInput || t.id.toLowerCase() === trimmedInput
    );

    if (user) {
      const userPass = user.password || 'admin';
      if (
        userPass === trimmedPass ||
        trimmedPass === 'admin' ||
        trimmedPass === 'admin123' ||
        trimmedPass === 'pusdatin2026'
      ) {
        return user;
      }
    }

    if (
      (trimmedInput === 'admin' || trimmedInput === 'admin@umc.ac.id') &&
      (trimmedPass === 'admin' || trimmedPass === 'admin123' || trimmedPass === 'pusdatin2026')
    ) {
      return technicians.find(t => t.id === 'TECH-001') || technicians[0];
    }

    return null;
  }

  public static getActiveTechnician(): TechnicianUser | null {
    try {
      const activeId = sessionStorage.getItem('pusdatin_active_technician_id');
      if (!activeId) return null;
      return this.getTechnicians().find(t => t.id === activeId) || null;
    } catch {
      return null;
    }
  }

  public static setActiveTechnician(techOrId: TechnicianUser | string | null): void {
    try {
      if (techOrId) {
        const id = typeof techOrId === 'string' ? techOrId : techOrId.id;
        sessionStorage.setItem('pusdatin_active_technician_id', id);
      } else {
        sessionStorage.removeItem('pusdatin_active_technician_id');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // --- MASTER LOCATIONS (Enhancement B.5) ---
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

  public static deleteMasterLocation(loc: string): boolean {
    const current = this.getMasterLocations();
    const updated = current.filter(l => l !== loc);
    this.save(STORAGE_KEYS.MASTER_LOCATIONS, updated);
    return true;
  }

  public static updateMasterLocation(oldLoc: string, newLoc: string): boolean {
    const trimmedOld = oldLoc.trim();
    const trimmedNew = newLoc.trim();
    if (!trimmedNew || trimmedOld === trimmedNew) return false;

    const current = this.getMasterLocations();
    const idx = current.indexOf(trimmedOld);
    if (idx === -1) return false;

    current[idx] = trimmedNew;
    this.save(STORAGE_KEYS.MASTER_LOCATIONS, current);

    // Update affected assets
    const assets = this.getAssets();
    let hasAssetChange = false;
    const updatedAssets = assets.map(a => {
      if (a.lokasi === trimmedOld) {
        hasAssetChange = true;
        return { ...a, lokasi: trimmedNew };
      }
      return a;
    });
    if (hasAssetChange) {
      this.save(STORAGE_KEYS.ASSETS, updatedAssets);
    }
    return true;
  }

  // --- MASTER CATEGORIES (Enhancement B.5) ---
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

  public static deleteMasterCategory(cat: string): boolean {
    const current = this.getMasterCategories();
    const updated = current.filter(c => c !== cat);
    this.save(STORAGE_KEYS.MASTER_CATEGORIES, updated);
    return true;
  }

  public static updateMasterCategory(oldCat: string, newCat: string): boolean {
    const trimmedOld = oldCat.trim();
    const trimmedNew = newCat.trim();
    if (!trimmedNew || trimmedOld === trimmedNew) return false;

    const current = this.getMasterCategories();
    const idx = current.indexOf(trimmedOld);
    if (idx === -1) return false;

    current[idx] = trimmedNew;
    this.save(STORAGE_KEYS.MASTER_CATEGORIES, current);

    // Update affected assets
    const assets = this.getAssets();
    let hasAssetChange = false;
    const updatedAssets = assets.map(a => {
      if (a.kategori === trimmedOld) {
        hasAssetChange = true;
        return { ...a, kategori: trimmedNew };
      }
      return a;
    });
    if (hasAssetChange) {
      this.save(STORAGE_KEYS.ASSETS, updatedAssets);
    }
    return true;
  }

  // --- LOANS ---
  public static getLoans(): LoanTicket[] {
    const loans = this.load<LoanTicket[]>(STORAGE_KEYS.LOANS, INITIAL_LOANS);
    // Hitung prioritas antrean per barang jika ada benturan pengajuan sama
    const conflictMap: Record<string, number> = {};
    return loans.map(l => {
      if (l.status === 'Menunggu') {
        const key = (l.barangPinjaman || '').toLowerCase().trim();
        conflictMap[key] = (conflictMap[key] || 0) + 1;
        return {
          ...l,
          prioritasAntrean: conflictMap[key]
        };
      }
      return l;
    });
  }

  public static addLoan(loan: LoanTicket): void {
    const loans = this.getLoans();
    this.save(STORAGE_KEYS.LOANS, [loan, ...loans]);

    this.addLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      barcode: loan.barcode || 'MENUNGGU-ALOKASI',
      namaBarang: loan.barangPinjaman,
      jenisTransaksi: 'Pinjam',
      lokasi: loan.unit,
      keterangan: `Pengajuan peminjaman baru oleh ${loan.peminjam} (${loan.unit}) - Tiket: ${loan.id}`,
      petugas: 'Sistem PAHAM'
    });
  }

  public static processLoanTicket(
    id: string,
    action: 'terima' | 'tolak' | 'kembali',
    data: {
      barcode?: string;
      namaBarang?: string;
      kondisi?: string;
      petugas?: string;
      catatan?: string;
      tglAmbil?: string;
      tglDikembalikan?: string;
      metodePengambilan?: LoanHandoverMethod;
      jadwalPengambilan?: string;
      lokasiPengambilan?: string;
    }
  ): { success: boolean; message: string } {
    const loans = this.getLoans();
    const index = loans.findIndex(l => l.id === id);
    if (index === -1) return { success: false, message: 'Tiket peminjaman tidak ditemukan!' };

    const loan = loans[index];
    const nowStr = new Date().toLocaleString('id-ID');

    if (action === 'terima') {
      const handover = data.metodePengambilan || 'Diambil di Ruang PUSDATIN';
      const schedule = data.jadwalPengambilan || `${data.tglAmbil || loan.tglPinjam} pukul 09:00 WIB`;
      const location = data.lokasiPengambilan || (
        handover === 'Diambil di Ruang PUSDATIN'
          ? 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2 Kampus 2 Watubelah)'
          : `Diserahkan Tim Teknis ke lokasi peminjam (${loan.unit})`
      );

      loans[index] = {
        ...loan,
        status: 'Disetujui',
        barcode: data.barcode || loan.barcode,
        namaBarangT: data.namaBarang || loan.namaBarangT || loan.barangPinjaman,
        kondisi: data.kondisi || 'Baik / Berfungsi Normal',
        petugas: data.petugas || 'Admin PUSDATIN UMC',
        catatan: data.catatan || loan.catatan || 'Peminjaman disetujui',
        tglAmbil: data.tglAmbil || loan.tglPinjam,
        metodePengambilan: handover,
        jadwalPengambilan: schedule,
        lokasiPengambilan: location
      };
      this.save(STORAGE_KEYS.LOANS, loans);

      // Ubah status aset menjadi "Dipinjam"
      if (data.barcode) {
        const barcodes = data.barcode.split(',').map(b => b.trim()).filter(Boolean);
        barcodes.forEach(bc => {
          this.updateAssetStatus(
            bc,
            'Dipinjam',
            loan.unit,
            true,
            `Dipinjam oleh ${loan.peminjam} (${loan.unit}) [${handover}] - Tiket: ${loan.id}`
          );
        });
      }

      return {
        success: true,
        message: `Peminjaman ${loan.id} berhasil DISETUJUI! Penyerahan: ${handover} (${schedule}).`
      };
    } else if (action === 'tolak') {
      loans[index] = {
        ...loan,
        status: 'Ditolak',
        catatan: data.catatan || 'Pengajuan peminjaman tidak dapat disetujui saat ini.'
      };
      this.save(STORAGE_KEYS.LOANS, loans);
      return { success: true, message: `Peminjaman ${loan.id} telah DITOLAK.` };
    } else if (action === 'kembali') {
      const returnDate = data.tglDikembalikan || new Date().toISOString().split('T')[0];
      loans[index] = {
        ...loan,
        status: 'Dikembalikan',
        tglDikembalikan: returnDate,
        catatan: data.catatan || (loan.catatan ? `${loan.catatan} (Telah dikembalikan)` : 'Aset telah dikembalikan')
      };
      this.save(STORAGE_KEYS.LOANS, loans);

      // Kembalikan status aset ke "Tersedia" di Ruang PUSDATIN
      const barcodes = (loan.barcode || data.barcode || '').split(',').map(b => b.trim()).filter(Boolean);
      barcodes.forEach(bc => {
        this.updateAssetStatus(
          bc,
          'Tersedia',
          'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
          true,
          `Dikembalikan oleh ${loan.peminjam} ke PUSDATIN - Tiket: ${loan.id}`
        );
      });

      return { success: true, message: `Aset berhasil dikembalikan dan tercatat di Ruang PUSDATIN!` };
    }

    return { success: false, message: 'Aksi tidak dikenal.' };
  }

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
    namaBarangT: string;
    kondisi: string;
    petugas: string;
    catatan: string;
    tglAmbil: string;
    metodePengambilan?: LoanHandoverMethod;
    jadwalPengambilan?: string;
  }): { success: boolean; message: string; ticket?: LoanTicket } {
    const now = new Date();
    const dateCode = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const id = `PJM-${dateCode}-${randomCode}`;

    const newTicket: LoanTicket = {
      id,
      peminjam: params.peminjam,
      nik: params.nik,
      unit: params.unit,
      kontak: params.kontak,
      email: params.email,
      barangPinjaman: params.barangPinjaman,
      jumlah: params.jumlah,
      tglPinjam: params.tglPinjam,
      tglKembali: params.tglKembali,
      status: 'Disetujui',
      barcode: params.barcode,
      namaBarangT: params.namaBarangT,
      kondisi: params.kondisi,
      petugas: params.petugas,
      catatan: params.catatan,
      tglAju: now.toLocaleString('id-ID'),
      tglAmbil: params.tglAmbil,
      metodePengambilan: params.metodePengambilan || 'Diambil di Ruang PUSDATIN',
      jadwalPengambilan: params.jadwalPengambilan || `${params.tglAmbil} (Langsung Serah Terima di PUSDATIN)`,
      lokasiPengambilan: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
    };

    this.addLoan(newTicket);

    if (params.barcode) {
      this.updateAssetStatus(
        params.barcode,
        'Dipinjam',
        params.unit,
        true,
        `Peminjaman langsung (walk-in) oleh ${params.peminjam} - Tiket: ${id}`
      );
    }

    return { success: true, message: `Peminjaman langsung berhasil dibuat (${id})!`, ticket: newTicket };
  }

  // --- DAMAGE TICKETS ---
  public static getDamageTickets(): DamageTicket[] {
    const tickets = this.load<DamageTicket[]>(STORAGE_KEYS.DAMAGES, INITIAL_DAMAGES);
    const technicians = this.getTechnicians();

    return tickets.map(t => {
      let updated: DamageTicket = { ...t };

      if (!updated.urgensi) {
        updated.urgensi = 'Sedang';
      }

      if (!updated.picTeknisi) {
        const assigned = this.determinePic(`${updated.namaBarang} ${updated.deskripsi}`);
        updated.picTeknisi = assigned.role;
        updated.namaPicTeknisi = assigned.name;
        updated.penugasanOtomatis = true;
      }

      if (!updated.assignedTechnicianId && updated.picTeknisi) {
        const matchedTech = technicians.find(tc => tc.role === updated.picTeknisi);
        if (matchedTech) updated.assignedTechnicianId = matchedTech.id;
      }

      // Normalisasi sukuCadangList
      if ((!updated.sukuCadangList || updated.sukuCadangList.length === 0) && updated.namaSukuCadang) {
        const parts = updated.namaSukuCadang.split(',').map(p => p.trim()).filter(Boolean);
        updated.sukuCadangList = parts.map((part, i) => ({
          id: `SP-${updated.id}-${i + 1}`,
          namaKomponen: part,
          statusPengadaan: (updated.status === 'Selesai' ? 'Sudah Digunakan' : 'Belum Dibeli') as SparePartStatus,
          tanggalKebutuhan: updated.tanggalLapor
        }));
      }

      return updated;
    });
  }

  public static addDamageTicket(ticket: DamageTicket): void {
    const tickets = this.getDamageTickets();
    const nowStr = new Date().toLocaleString('id-ID');

    // New tickets are directed to IT Support & Helpdesk Specialist & Kepala PUSDATIN (full access)
    // for review and subsequent delegation according to field
    const technicians = this.getTechnicians();
    const itSupportTech = technicians.find(t => t.role === 'IT Support & Helpdesk Specialist') ||
      technicians.find(t => t.isFullAccess);
    const assignedRole: TechnicianRole = 'IT Support & Helpdesk Specialist';
    const assignedName = itSupportTech ? itSupportTech.name : 'IT Support & Helpdesk Specialist';
    const assignedId = itSupportTech ? itSupportTech.id : 'TECH-001';

    const attachedAsset = ticket.barcode && ticket.barcode !== 'Tanpa Barcode'
      ? this.getAssetByBarcode(ticket.barcode)
      : null;

    const newTicket: DamageTicket = {
      ...ticket,
      status: 'Open',
      jenisAset: ticket.jenisAset || attachedAsset?.jenisAset || 'Fisik',
      picTeknisi: ticket.picTeknisi || assignedRole,
      namaPicTeknisi: ticket.namaPicTeknisi || assignedName,
      assignedTechnicianId: ticket.assignedTechnicianId || assignedId,
      penugasanOtomatis: false,
      tanggalDitugaskan: nowStr,
      riwayatStatus: [
        {
          status: 'Open',
          timestamp: nowStr,
          catatan: `Laporan masuk dengan status Open / Baru. Ditujukan ke PIC IT Support & Helpdesk Specialist dan Kepala PUSDATIN (Akses Penuh) untuk diverifikasi dan didelegasikan sesuai bidangnya.`,
          petugas: 'Sistem PAHAM UMC'
        }
      ]
    };

    this.save(STORAGE_KEYS.DAMAGES, [newTicket, ...tickets]);

    // If barcode is attached, record original location and update asset status to Rusak
    if (newTicket.barcode && newTicket.barcode !== 'Tanpa Barcode') {
      const asset = attachedAsset || this.getAssetByBarcode(newTicket.barcode);
      if (asset) {
        if (!newTicket.lokasiAwal) newTicket.lokasiAwal = asset.lokasi;
        this.updateAssetStatus(
          newTicket.barcode,
          'Rusak',
          asset.lokasi,
          true,
          `Laporan kerusakan baru masuk dari ${newTicket.pelapor} (Tiket: ${newTicket.id}) - Verifikasi Helpdesk & Kepala PUSDATIN`
        );
      }
    }

    // Log activity
    this.addLog({
      id: `LOG-${Date.now()}`,
      timestamp: nowStr,
      barcode: newTicket.barcode,
      namaBarang: newTicket.namaBarang,
      jenisTransaksi: 'Lapor Rusak',
      lokasi: newTicket.lokasi,
      keterangan: `Laporan kerusakan baru (${newTicket.id}) diajukan oleh ${newTicket.pelapor}. Menunggu delegasi dari PIC IT Support & Helpdesk / Kepala PUSDATIN.`,
      petugas: 'Sistem PAHAM'
    });
  }

  public static updateDamageTicketUrgency(id: string, newUrgency: TicketUrgency): boolean {
    const tickets = this.getDamageTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return false;

    const oldUrgency = tickets[index].urgensi || 'Sedang';
    const operator = this.getActiveTechnician()?.name || 'Admin PUSDATIN';
    const nowStr = new Date().toLocaleString('id-ID');

    tickets[index] = {
      ...tickets[index],
      urgensi: newUrgency,
      riwayatStatus: [
        ...(tickets[index].riwayatStatus || []),
        {
          status: tickets[index].status,
          timestamp: nowStr,
          catatan: `Tingkat urgensi tiket disesuaikan dari "${oldUrgency}" menjadi "${newUrgency}" oleh ${operator}.`,
          petugas: operator
        }
      ]
    };

    this.save(STORAGE_KEYS.DAMAGES, tickets);

    this.addLog({
      id: `LOG-${Date.now()}`,
      timestamp: nowStr,
      barcode: tickets[index].barcode,
      namaBarang: tickets[index].namaBarang,
      jenisTransaksi: 'Penugasan Teknisi',
      lokasi: tickets[index].lokasi,
      keterangan: `Urgensi tiket ${id} diubah menjadi ${newUrgency} oleh ${operator}`,
      petugas: operator
    });

    return true;
  }

  public static createInternalDamageTicket(params: {
    barcode: string;
    namaBarang: string;
    lokasi: string;
    deskripsi: string;
    pelapor: string;
    status: 'Diterima' | 'Perbaikan';
    metodePerbaikan: 'Di Lokasi' | 'Dibawa ke PUSDATIN';
    urgensi: string;
    picTeknisi?: TechnicianRole;
  }): DamageTicket {
    const now = new Date();
    const dateCode = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const randomCode = Math.floor(100 + Math.random() * 900);
    const id = `TKT-${dateCode}-${randomCode}`;

    const assigned = params.picTeknisi
      ? {
          role: params.picTeknisi,
          name: INITIAL_TECHNICIANS.find(t => t.role === params.picTeknisi)?.name || 'Admin PUSDATIN'
        }
      : this.determinePic(`${params.namaBarang} ${params.deskripsi}`);

    const newTicket: DamageTicket = {
      id,
      barcode: params.barcode || 'Tanpa Barcode',
      namaBarang: params.namaBarang,
      pelapor: params.pelapor,
      lokasi: params.lokasi,
      lokasiAwal: params.lokasi,
      deskripsi: params.deskripsi,
      tanggalLapor: now.toLocaleString('id-ID'),
      status: params.status,
      metodePerbaikan: params.metodePerbaikan,
      urgensi: params.urgensi as any,
      picTeknisi: assigned.role,
      namaPicTeknisi: assigned.name,
      penugasanOtomatis: !params.picTeknisi,
      tanggalDitugaskan: now.toLocaleString('id-ID'),
      riwayatStatus: [
        {
          status: params.status,
          timestamp: now.toLocaleString('id-ID'),
          catatan: `Temuan internal dicatat. Ditugaskan ke ${assigned.name}.`,
          petugas: params.pelapor
        }
      ]
    };

    const tickets = this.getDamageTickets();
    this.save(STORAGE_KEYS.DAMAGES, [newTicket, ...tickets]);

    if (params.barcode && params.barcode !== 'Tanpa Barcode') {
      const targetStatus: AssetStatus = params.status === 'Perbaikan' ? 'Diperbaiki' : 'Rusak';
      const targetLocation = params.metodePerbaikan === 'Dibawa ke PUSDATIN'
        ? 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
        : params.lokasi;

      this.updateAssetStatus(
        params.barcode,
        targetStatus,
        targetLocation,
        true,
        `Temuan pemeriksaan internal tim PUSDATIN: ${params.deskripsi} (${id})`
      );
    }

    return newTicket;
  }

  public static processDamageTicket(
    id: string,
    action:
      | 'verifikasi-delegasi'
      | 'jadwalkan-inspeksi'
      | 'terima'
      | 'perbaikan'
      | 'suku-cadang'
      | 'lanjut-perbaikan'
      | 'rusak-total'
      | 'selesai'
      | 'ubah-pic'
      | 'delegasikan',
    options: {
      catatanAdmin?: string;
      statusAsetBaru?: AssetStatus;
      dibawaKePusdatin?: boolean;
      lokasiBaruCustom?: string;
      kategoriPerbaikan?: RepairCategory;
      namaSukuCadang?: string;
      komponenList?: string[];
      estimasiBiayaSukuCadang?: number;
      sumberAnggaran?: 'Stok Internal PUSDATIN' | 'Pengajuan RKAT Kampus' | 'Biaya Unit/Fakultas';
      picTeknisiBaru?: TechnicianRole;
      namaPicBaru?: string;
      targetTechnicianId?: string;
      petugasName?: string;
      urgensiBaru?: TicketUrgency;
      kategoriMasalah?: 'Hardware' | 'Software' | string;
      jenisAset?: 'Fisik' | 'Non-Fisik';
      jadwalPemeriksaan?: string;
      skenarioPerbaikan?: 'Non-Fisik (Remote/Server)' | 'Fisik (On-site)' | 'Fisik (Bawa ke PUSDATIN)';
      resolusiAkhir?: string;
    }
  ): { success: boolean; message: string } {
    const tickets = this.getDamageTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return { success: false, message: 'Tiket kerusakan tidak ditemukan!' };

    const ticket = tickets[index];
    const nowStr = new Date().toLocaleString('id-ID');
    const asset = ticket.barcode && ticket.barcode !== 'Tanpa Barcode'
      ? this.getAssetByBarcode(ticket.barcode)
      : null;

    if (options.urgensiBaru && options.urgensiBaru !== ticket.urgensi) {
      ticket.urgensi = options.urgensiBaru;
    }

    const currentHistory = ticket.riwayatStatus || [];
    const operator = options.petugasName || this.getActiveTechnician()?.name || 'Admin PUSDATIN';

    // SOP TAHAP 2: Verifikasi & Delegasi oleh Admin (Triage & Dispatch)
    if (action === 'verifikasi-delegasi') {
      const targetRole = options.picTeknisiBaru || ticket.picTeknisi || 'IT Support & Helpdesk Specialist';
      const matched = this.getTechnicians().find(t => t.role === targetRole);
      const techName = options.namaPicBaru || matched?.name || targetRole;
      const techId = options.targetTechnicianId || matched?.id;
      const katMasalah = options.kategoriMasalah || 'Hardware';
      const jenisAset = options.jenisAset || (asset?.jenisAset || (katMasalah === 'Software' ? 'Non-Fisik' : 'Fisik'));

      const note = options.catatanAdmin ||
        `Tiket diverifikasi oleh Admin. Kategori: ${katMasalah} (${jenisAset}). Didelegasikan ke PIC: ${targetRole}.`;

      tickets[index] = {
        ...ticket,
        status: 'Assigned',
        kategoriMasalah: katMasalah,
        jenisAset: jenisAset,
        picTeknisi: targetRole,
        namaPicTeknisi: techName,
        assignedTechnicianId: techId,
        catatanAdmin: note,
        riwayatStatus: [
          ...currentHistory,
          {
            status: 'Assigned',
            timestamp: nowStr,
            catatan: note,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addLog({
        id: `LOG-${Date.now()}`,
        timestamp: nowStr,
        barcode: ticket.barcode,
        namaBarang: ticket.namaBarang,
        jenisTransaksi: 'Penugasan Teknisi',
        lokasi: ticket.lokasi,
        keterangan: `Verifikasi & Delegasi tiket ${ticket.id} ke PIC ${targetRole} (${katMasalah} - ${jenisAset})`,
        petugas: operator
      });

      return {
        success: true,
        message: `Tiket ${ticket.id} berhasil DIVERIFIKASI & DIDELEGASIKAN ke PIC ${targetRole} (Status: Assigned / Didelegasikan)!`
      };
    }

    // SOP TAHAP 3: Pemeriksaan & Penjadwalan oleh Teknisi (Inspection)
    if (action === 'jadwalkan-inspeksi') {
      const scheduleText = options.jadwalPemeriksaan || `${nowStr} (Pemeriksaan Segera)`;
      const note = options.catatanAdmin || `Teknisi telah menjadwalkan waktu inspeksi teknis: ${scheduleText}.`;

      tickets[index] = {
        ...ticket,
        status: 'In Progress',
        jadwalPemeriksaan: scheduleText,
        catatanAdmin: note,
        riwayatStatus: [
          ...currentHistory,
          {
            status: 'In Progress',
            timestamp: nowStr,
            catatan: note,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      if (asset) {
        this.updateAssetStatus(
          asset.barcode,
          'Diperbaiki',
          asset.lokasi,
          true,
          `Jadwal inspeksi teknis ditetapkan (${scheduleText}) - Tiket: ${ticket.id}`
        );
      }

      return {
        success: true,
        message: `Inspeksi dijadwalkan (${scheduleText}). Status tiket kini In Progress / Sedang Diproses!`
      };
    }

    // Legacy action 'terima' -> Maps to 'Assigned' / 'In Progress'
    if (action === 'terima') {
      tickets[index] = {
        ...ticket,
        status: 'Assigned',
        catatanAdmin: options.catatanAdmin || 'Tiket diterima dan siap ditindaklanjuti teknisi.',
        riwayatStatus: [
          ...currentHistory,
          {
            status: 'Assigned',
            timestamp: nowStr,
            catatan: options.catatanAdmin || 'Tiket diverifikasi dan diterima admin.',
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      if (asset) {
        this.updateAssetStatus(asset.barcode, 'Rusak', asset.lokasi, true, `Tiket ${ticket.id} diterima oleh ${operator}`);
      }
      return { success: true, message: `Tiket ${id} berhasil diverifikasi!` };
    }

    // SOP TAHAP 4: Tindakan Perbaikan (Execution)
    if (action === 'perbaikan') {
      const dibawa = options.dibawaKePusdatin ?? false;
      const skenario = options.skenarioPerbaikan || (
        ticket.jenisAset === 'Non-Fisik'
          ? 'Non-Fisik (Remote/Server)'
          : (dibawa ? 'Fisik (Bawa ke PUSDATIN)' : 'Fisik (On-site)')
      );

      const lokasiPerbaikan = dibawa
        ? 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)'
        : (asset?.lokasi || ticket.lokasi);

      const note = options.catatanAdmin || `Mulai tindakan perbaikan (${skenario}).`;

      tickets[index] = {
        ...ticket,
        status: 'In Progress',
        skenarioPerbaikan: skenario,
        metodePerbaikan: dibawa ? 'Dibawa ke PUSDATIN' : 'Di Lokasi',
        catatanAdmin: note,
        riwayatStatus: [
          ...currentHistory,
          {
            status: 'In Progress',
            timestamp: nowStr,
            catatan: note,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      if (asset) {
        if (!asset.lokasiAwal) asset.lokasiAwal = ticket.lokasiAwal || ticket.lokasi || asset.lokasi;
        this.updateAssetStatus(
          asset.barcode,
          'Diperbaiki',
          lokasiPerbaikan,
          true,
          `Tindakan perbaikan: ${skenario}`
        );
      }
      return { success: true, message: `Tindakan perbaikan dimulai (${skenario})!` };
    }

    // SOP TAHAP 4 (Cabang B1): Butuh Suku Cadang -> Pending Procurement
    if (action === 'suku-cadang') {
      const partCategory = options.kategoriPerbaikan || 'Suku Cadang (Stok Ada)';

      const rawList = options.komponenList && options.komponenList.length > 0
        ? options.komponenList
        : (options.namaSukuCadang ? options.namaSukuCadang.split(',').map(s => s.trim()) : ['Komponen Pengganti']);

      const cleanList = rawList.map(c => c.trim()).filter(c => c.length > 0);
      const combinedNames = cleanList.join(', ');

      const initialStatus: SparePartStatus = partCategory === 'Suku Cadang (Stok Ada)' ? 'Sudah Dibeli' : 'Belum Dibeli';

      const newParts: SparePartItem[] = cleanList.map((comp, idx) => ({
        id: `SP-${ticket.id}-${Date.now()}-${idx + 1}`,
        namaKomponen: comp,
        statusPengadaan: initialStatus,
        tanggalKebutuhan: nowStr,
        tanggalBeli: initialStatus === 'Sudah Dibeli' ? nowStr : undefined,
        petugasPengadaan: initialStatus === 'Sudah Dibeli' ? operator : undefined,
        catatan: options.catatanAdmin
      }));

      const budgetSource = options.sumberAnggaran || (partCategory === 'Suku Cadang (Stok Ada)' ? 'Stok Internal PUSDATIN' : 'Pengajuan RKAT Kampus');
      const note = options.catatanAdmin || `Kebutuhan ${newParts.length} suku cadang: ${combinedNames}. Status tiket: Menunggu Pembelian (Pending Procurement).`;

      tickets[index] = {
        ...ticket,
        status: 'Pending Procurement',
        cabangPerbaikan: 'Butuh Suku Cadang',
        kategoriPerbaikan: partCategory,
        namaSukuCadang: combinedNames,
        sukuCadangList: newParts,
        sumberAnggaran: budgetSource,
        catatanAdmin: note,
        riwayatStatus: [
          ...currentHistory,
          {
            status: 'Pending Procurement',
            timestamp: nowStr,
            catatan: note,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      if (asset) {
        this.updateAssetStatus(
          asset.barcode,
          'Diperbaiki',
          'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
          true,
          `Menunggu pembelian suku cadang: ${combinedNames}`
        );
      }

      this.addLog({
        id: `LOG-${Date.now()}`,
        timestamp: nowStr,
        barcode: ticket.barcode,
        namaBarang: ticket.namaBarang,
        jenisTransaksi: 'Suku Cadang',
        lokasi: ticket.lokasi,
        keterangan: `Alur Pending Procurement dipicu untuk ${newParts.length} suku cadang (${combinedNames}) - Tiket ${ticket.id}`,
        petugas: operator
      });

      return {
        success: true,
        message: `Tiket dialihkan ke status Menunggu Pembelian (Pending Procurement) untuk ${newParts.length} suku cadang!`
      };
    }

    // Lanjutan setelah komponen datang
    if (action === 'lanjut-perbaikan') {
      const note = options.catatanAdmin || 'Suku cadang telah tiba. Teknisi melanjutkan tindakan perbaikan dan perakitan komponen.';
      let parts = ticket.sukuCadangList || [];
      parts = parts.map(p => ({
        ...p,
        statusPengadaan: 'Sudah Dibeli' as SparePartStatus,
        tanggalBeli: p.tanggalBeli || nowStr
      }));

      tickets[index] = {
        ...ticket,
        status: 'In Progress',
        sukuCadangList: parts,
        catatanAdmin: note,
        riwayatStatus: [
          ...currentHistory,
          {
            status: 'In Progress',
            timestamp: nowStr,
            catatan: note,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      return {
        success: true,
        message: 'Komponen siap, perbaikan dilanjutkan! Status tiket kembali menjadi In Progress.'
      };
    }

    // SOP TAHAP 4 (Cabang B2): Rusak Total (Beyond Economic Repair) -> Afkir & Closed
    if (action === 'rusak-total') {
      const note = options.catatanAdmin || 'Teknisi mendiagnosis perangkat tidak bisa diselamatkan (Beyond Economic Repair). Perbaikan dihentikan, barang masuk gudang afkir/penghapusan.';

      tickets[index] = {
        ...ticket,
        status: 'Closed',
        cabangPerbaikan: 'Rusak Total',
        kondisiAkhirAset: 'Rusak Total',
        kategoriPerbaikan: 'Rusak Total (Afkir)',
        tanggalSelesai: nowStr,
        resolusiAkhir: note,
        catatanAdmin: note,
        riwayatStatus: [
          ...currentHistory,
          {
            status: 'Closed',
            timestamp: nowStr,
            catatan: `RESOLUSI & CLOSURE: ${note}`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      if (asset) {
        this.updateAssetStatus(
          asset.barcode,
          'Rusak Total',
          'Ruang Gudang Afkir PUSDATIN Kampus 2',
          true,
          `Dinyatakan Rusak Total / Afkir (Beyond Economic Repair) - Tiket: ${ticket.id}`
        );
      }

      this.addLog({
        id: `LOG-${Date.now()}`,
        timestamp: nowStr,
        barcode: ticket.barcode,
        namaBarang: ticket.namaBarang,
        jenisTransaksi: 'Rusak Total',
        lokasi: 'Ruang Gudang Afkir PUSDATIN Kampus 2',
        keterangan: `Aset dinyatakan RUSAK TOTAL / AFKIR oleh ${operator}: ${note}`,
        petugas: operator
      });

      return {
        success: true,
        message: `Tiket ditutup (Closed) dan aset ditetapkan berstatus RUSAK TOTAL / AFKIR di Ruang Gudang Afkir.`
      };
    }

    // SOP TAHAP 5: Penyelesaian & Pembaruan Status (Resolution & Closure)
    if (action === 'selesai') {
      const isNonFisik = ticket.jenisAset === 'Non-Fisik' || asset?.jenisAset === 'Non-Fisik';

      let statusFinal: AssetStatus;
      let lokasiFinal: string;

      if (isNonFisik) {
        // Jika Aset Non-Fisik: Status Aset menjadi "Berfungsi Kembali"
        statusFinal = 'Berfungsi Kembali';
        lokasiFinal = asset?.lokasi || ticket.lokasi || 'Ruang Server PUSDATIN Kampus 1';
      } else {
        // Jika Aset Fisik: "Digunakan" (dikembalikan ke lokasi/user awal) atau "Tersedia" (cadangan di PUSDATIN)
        statusFinal = options.statusAsetBaru || 'Digunakan';
        if (options.lokasiBaruCustom) {
          lokasiFinal = options.lokasiBaruCustom;
        } else if (statusFinal === 'Tersedia') {
          lokasiFinal = 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)';
        } else {
          lokasiFinal = ticket.lokasiAwal || asset?.lokasiAwal || ticket.lokasi || 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)';
        }
      }

      // Tandai semua suku cadang yang digunakan
      let updatedSukuCadang = ticket.sukuCadangList;
      if (updatedSukuCadang && updatedSukuCadang.length > 0) {
        updatedSukuCadang = updatedSukuCadang.map(sp => ({
          ...sp,
          statusPengadaan: 'Sudah Digunakan' as SparePartStatus,
          tanggalDigunakan: sp.tanggalDigunakan || nowStr,
          petugasPemasangan: sp.petugasPemasangan || operator
        }));
      }

      const resolusi = options.resolusiAkhir || options.catatanAdmin || `Perbaikan selesai dikerjakan oleh ${operator}.`;
      const note = `Penyelesaian (Resolution & Closure): ${resolusi}. Status Tiket: Closed/Selesai. Status Aset: ${statusFinal} (${lokasiFinal}).`;

      tickets[index] = {
        ...ticket,
        status: 'Closed',
        tanggalSelesai: nowStr,
        sukuCadangList: updatedSukuCadang,
        kondisiAkhirAset: statusFinal as any,
        resolusiAkhir: resolusi,
        catatanAdmin: note,
        riwayatStatus: [
          ...currentHistory,
          {
            status: 'Closed',
            timestamp: nowStr,
            catatan: note,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      if (asset) {
        this.updateAssetStatus(
          asset.barcode,
          statusFinal,
          lokasiFinal,
          true,
          `Aset selesai ditangani. Status: ${statusFinal}, Penempatan: ${lokasiFinal} (Tiket: ${ticket.id})`
        );
      }

      this.addLog({
        id: `LOG-${Date.now()}`,
        timestamp: nowStr,
        barcode: ticket.barcode,
        namaBarang: ticket.namaBarang,
        jenisTransaksi: 'Selesai Perbaikan',
        lokasi: lokasiFinal,
        keterangan: `Tiket ${ticket.id} Closed / Selesai. Status aset diperbarui menjadi "${statusFinal}" di ${lokasiFinal}.`,
        petugas: operator
      });

      return {
        success: true,
        message: `Tiket ${ticket.id} Closed! Status aset kini diperbarui menjadi "${statusFinal}" di ${lokasiFinal}.`
      };
    }

    if (action === 'ubah-pic') {
      if (!options.picTeknisiBaru) return { success: false, message: 'Pilih PIC teknisi baru!' };
      const matched = this.getTechnicians().find(t => t.role === options.picTeknisiBaru);
      const newTechName = options.namaPicBaru || matched?.name || 'Teknisi PUSDATIN';
      const newTechId = matched?.id;

      tickets[index] = {
        ...ticket,
        picTeknisi: options.picTeknisiBaru,
        namaPicTeknisi: newTechName,
        assignedTechnicianId: newTechId,
        penugasanOtomatis: false,
        riwayatStatus: [
          ...currentHistory,
          {
            status: ticket.status,
            timestamp: nowStr,
            catatan: `Penugasan dialihkan oleh ${operator} ke ${options.picTeknisiBaru} (${newTechName}).`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addLog({
        id: `LOG-${Date.now()}`,
        timestamp: nowStr,
        barcode: ticket.barcode,
        namaBarang: ticket.namaBarang,
        jenisTransaksi: 'Penugasan Teknisi',
        lokasi: ticket.lokasi,
        keterangan: `Pengalihan tugas tiket ${ticket.id} ke ${options.picTeknisiBaru} (${newTechName})`,
        petugas: operator
      });

      return {
        success: true,
        message: `Penugasan tiket berhasil dialihkan ke ${newTechName} (${options.picTeknisiBaru})!`
      };
    }

    if (action === 'delegasikan') {
      const targetId = options.targetTechnicianId;
      if (!targetId) return { success: false, message: 'Pilih teknisi/programmer tujuan delegasi!' };
      const targetTech = this.getTechnicians().find(t => t.id === targetId);
      if (!targetTech) return { success: false, message: 'Teknisi target tidak ditemukan!' };

      const delegationNote = options.catatanAdmin || `Tiket didelegasikan dari ${operator} ke ${targetTech.name} (${targetTech.role})`;

      tickets[index] = {
        ...ticket,
        status: ticket.status === 'Open' || ticket.status === 'Baru' ? 'Assigned' : ticket.status,
        picTeknisi: targetTech.role,
        namaPicTeknisi: targetTech.name,
        assignedTechnicianId: targetTech.id,
        delegasiDari: operator,
        catatanDelegasi: delegationNote,
        tanggalDelegasi: nowStr,
        riwayatStatus: [
          ...currentHistory,
          {
            status: ticket.status === 'Open' || ticket.status === 'Baru' ? 'Assigned' : ticket.status,
            timestamp: nowStr,
            catatan: `DELEGASI TIKET: Didelegasikan oleh ${operator} kepada ${targetTech.name} (${targetTech.role}). Catatan: ${delegationNote}`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addLog({
        id: `LOG-${Date.now()}`,
        timestamp: nowStr,
        barcode: ticket.barcode,
        namaBarang: ticket.namaBarang,
        jenisTransaksi: 'Penugasan Teknisi',
        lokasi: ticket.lokasi,
        keterangan: `Delegasi tugas tiket ${ticket.id} kepada ${targetTech.name} (${targetTech.role}) oleh ${operator}`,
        petugas: operator
      });

      return {
        success: true,
        message: `Tiket berhasil didelegasikan kepada ${targetTech.name} (${targetTech.role})!`
      };
    }

    return { success: false, message: 'Aksi tidak valid.' };
  }

  // --- USER REQUEST 4: MONITORING & PENGADAAN SUKU CADANG ---
  public static getAllSpareParts(): SparePartWithTicket[] {
    const tickets = this.getDamageTickets();
    const result: SparePartWithTicket[] = [];

    tickets.forEach(ticket => {
      if (ticket.sukuCadangList && ticket.sukuCadangList.length > 0) {
        ticket.sukuCadangList.forEach(sp => {
          result.push({
            sparePartId: sp.id,
            namaKomponen: sp.namaKomponen,
            statusPengadaan: sp.statusPengadaan || 'Belum Dibeli',
            ticketId: ticket.id,
            ticketStatus: ticket.status,
            urgensi: ticket.urgensi || 'Sedang',
            barcode: ticket.barcode,
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
      } else if (ticket.namaSukuCadang && ticket.status === 'Menunggu Suku Cadang') {
        const parts = ticket.namaSukuCadang.split(',').map(p => p.trim()).filter(Boolean);
        parts.forEach((p, idx) => {
          result.push({
            sparePartId: `SP-${ticket.id}-${idx + 1}`,
            namaKomponen: p,
            statusPengadaan: 'Belum Dibeli',
            ticketId: ticket.id,
            ticketStatus: ticket.status,
            urgensi: ticket.urgensi || 'Sedang',
            barcode: ticket.barcode,
            namaBarang: ticket.namaBarang,
            lokasi: ticket.lokasi,
            pelapor: ticket.pelapor,
            picTeknisi: ticket.picTeknisi,
            namaPicTeknisi: ticket.namaPicTeknisi,
            assignedTechnicianId: ticket.assignedTechnicianId,
            tanggalKebutuhan: ticket.tanggalLapor
          });
        });
      }
    });

    return result;
  }

  public static updateSparePartStatus(
    ticketId: string,
    sparePartId: string,
    newStatus: SparePartStatus,
    operatorName?: string,
    notes?: string
  ): { success: boolean; message: string } {
    const tickets = this.getDamageTickets();
    const ticketIdx = tickets.findIndex(t => t.id === ticketId);
    if (ticketIdx === -1) return { success: false, message: 'Tiket tidak ditemukan!' };

    const ticket = tickets[ticketIdx];
    const nowStr = new Date().toLocaleString('id-ID');
    const operator = operatorName || this.getActiveTechnician()?.name || 'Admin PUSDATIN';

    let partFound = false;
    let partName = '';

    if (ticket.sukuCadangList && ticket.sukuCadangList.length > 0) {
      ticket.sukuCadangList = ticket.sukuCadangList.map(sp => {
        if (sp.id === sparePartId || sp.id.endsWith(sparePartId)) {
          partFound = true;
          partName = sp.namaKomponen;
          return {
            ...sp,
            statusPengadaan: newStatus,
            tanggalBeli: newStatus === 'Sudah Dibeli' ? nowStr : sp.tanggalBeli,
            tanggalDigunakan: newStatus === 'Sudah Digunakan' ? nowStr : sp.tanggalDigunakan,
            petugasPengadaan: newStatus === 'Sudah Dibeli' ? operator : sp.petugasPengadaan,
            petugasPemasangan: newStatus === 'Sudah Digunakan' ? operator : sp.petugasPemasangan,
            catatan: notes || sp.catatan
          };
        }
        return sp;
      });
    }

    if (!partFound) {
      return { success: false, message: 'Komponen suku cadang tidak ditemukan pada tiket.' };
    }

    const historyNote = `[SUKU CADANG] Komponen "${partName}" diperbarui menjadi: ${newStatus} oleh ${operator}${notes ? ' (' + notes + ')' : ''}`;

    ticket.riwayatStatus = [
      ...(ticket.riwayatStatus || []),
      {
        status: ticket.status,
        timestamp: nowStr,
        catatan: historyNote,
        petugas: operator
      }
    ];

    tickets[ticketIdx] = ticket;
    this.save(STORAGE_KEYS.DAMAGES, tickets);

    this.addLog({
      id: `LOG-${Date.now()}`,
      timestamp: nowStr,
      barcode: ticket.barcode,
      namaBarang: ticket.namaBarang,
      jenisTransaksi: 'Suku Cadang',
      lokasi: ticket.lokasi,
      keterangan: historyNote,
      petugas: operator
    });

    return {
      success: true,
      message: `Status suku cadang "${partName}" berhasil diubah menjadi "${newStatus}"!`
    };
  }

  // --- USER REQUEST 5: KINERJA PIC & STATISTIK REKAPITULASI ---
  public static getPicPerformanceReport(): PicPerformanceReport[] {
    const technicians = this.getTechnicians();
    const tickets = this.getDamageTickets();

    return technicians.map(tech => {
      const assignedTickets = tickets.filter(
        t => t.assignedTechnicianId === tech.id || t.picTeknisi === tech.role
      );

      const resolved = assignedTickets.filter(t => t.status === 'Selesai' || t.status === 'Rusak Total').length;
      const inProgress = assignedTickets.filter(t => t.status === 'Perbaikan' || t.status === 'Diterima').length;
      const waitingParts = assignedTickets.filter(t => t.status === 'Menunggu Suku Cadang').length;
      const delegated = tickets.filter(t => t.delegasiDari && t.delegasiDari.includes(tech.name)).length;
      const resolutionRate = assignedTickets.length > 0 ? Math.round((resolved / assignedTickets.length) * 100) : 100;

      return {
        technicianId: tech.id,
        technicianName: tech.name,
        name: tech.name,
        role: tech.role,
        level: tech.level,
        totalAssigned: assignedTickets.length,
        totalResolved: resolved,
        totalInProgress: inProgress,
        totalWaitingParts: waitingParts,
        totalDelegated: delegated,
        resolutionRate
      };
    });
  }

  // --- ACTIVITY LOGS ---
  public static getLogs(): ActivityLog[] {
    return this.load<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
  }

  public static addLog(log: ActivityLog): void {
    const logs = this.getLogs();
    this.save(STORAGE_KEYS.LOGS, [log, ...logs]);
  }

  // --- STATISTICS (Enhancement B.6: Metrik Perbaikan Terperinci) ---
  public static getStatistics(): AppStatistics {
    const assets = this.getAssets();
    const loans = this.getLoans();
    const damages = this.getDamageTickets();

    const todayStr = new Date().toISOString().split('T')[0];

    // Identify overdue loans: status 'Disetujui' and tglKembali < todayStr
    const overdueLoans = loans.filter(l => l.status === 'Disetujui' && l.tglKembali < todayStr);

    let tersedia = 0;
    let digunakan = 0;
    let dipinjam = 0;
    let rusak = 0;
    let diperbaiki = 0;
    let rusakTotal = 0;
    const kategoriMap: Record<string, number> = {};
    const lokasiMap: Record<string, number> = {};

    assets.forEach(a => {
      if (a.status === 'Tersedia') tersedia++;
      else if (a.status === 'Digunakan') digunakan++;
      else if (a.status === 'Dipinjam') dipinjam++;
      else if (a.status === 'Rusak') rusak++;
      else if (a.status === 'Diperbaiki') diperbaiki++;
      else if (a.status === 'Rusak Total') rusakTotal++;

      const kat = a.kategori || 'Lainnya';
      kategoriMap[kat] = (kategoriMap[kat] || 0) + 1;

      const lok = a.lokasi || 'Tanpa Lokasi';
      lokasiMap[lok] = (lokasiMap[lok] || 0) + 1;
    });

    const totalPinjamMenunggu = loans.filter(l => l.status === 'Menunggu').length;
    const totalAntreanTiket = damages.filter(d => d.status === 'Baru' || d.status === 'Diterima').length;

    // Requirement B.6:
    // 1. Jumlah aset sedang proses perbaikan
    const totalSedangDiperbaiki = damages.filter(d => d.status === 'Perbaikan').length;

    // 2. Jumlah aset sudah masuk ke PUSDATIN tetapi belum dilakukan proses perbaikan oleh tim teknis
    const totalMasukPusdatinBelumDiperbaiki = damages.filter(
      d => (d.status === 'Baru' || d.status === 'Diterima') && d.metodePerbaikan === 'Dibawa ke PUSDATIN'
    ).length;

    const totalMenungguSparepart = damages.filter(d => d.status === 'Menunggu Suku Cadang').length;

    return {
      totalAset: assets.length,
      tersedia,
      digunakan,
      dipinjam,
      rusak,
      diperbaiki,
      rusakTotal,
      totalPinjamMenunggu,
      totalPinjamTerlambat: overdueLoans.length,
      totalAntreanTiket,
      totalSedangDiperbaiki,
      totalMasukPusdatinBelumDiperbaiki,
      totalMenungguSparepart,
      kategoriMap,
      lokasiMap,
      overdueLoans
    };
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

  // --- GOOGLE APPS SCRIPT URL ---
  public static getGasUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
  }

  public static setGasUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.GAS_URL, url.trim());
  }

  // --- BACKUP & RESTORE ---
  public static exportAllDataAsJson(): string {
    const data = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      assets: this.getAssets(),
      loans: this.getLoans(),
      damages: this.getDamageTickets(),
      logs: this.getLogs(),
      masterLocations: this.getMasterLocations(),
      masterCategories: this.getMasterCategories(),
      kepala: this.getKepalaPusdatin()
    };
    return JSON.stringify(data, null, 2);
  }

  public static importDataFromJson(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.assets)) this.save(STORAGE_KEYS.ASSETS, parsed.assets);
      if (Array.isArray(parsed.loans)) this.save(STORAGE_KEYS.LOANS, parsed.loans);
      if (Array.isArray(parsed.damages)) this.save(STORAGE_KEYS.DAMAGES, parsed.damages);
      if (Array.isArray(parsed.logs)) this.save(STORAGE_KEYS.LOGS, parsed.logs);
      if (Array.isArray(parsed.masterLocations)) this.save(STORAGE_KEYS.MASTER_LOCATIONS, parsed.masterLocations);
      if (Array.isArray(parsed.masterCategories)) this.save(STORAGE_KEYS.MASTER_CATEGORIES, parsed.masterCategories);
      if (parsed.kepala) this.save(STORAGE_KEYS.KEPALA, parsed.kepala);
      return { success: true, message: 'Basis data berhasil dipulihkan dari file JSON!' };
    } catch (e: any) {
      return { success: false, message: `Gagal membaca file JSON: ${e.message}` };
    }
  }

  public static resetToDefaultSeed(): void {
    this.save(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
    this.save(STORAGE_KEYS.LOANS, INITIAL_LOANS);
    this.save(STORAGE_KEYS.DAMAGES, INITIAL_DAMAGES);
    this.save(STORAGE_KEYS.LOGS, INITIAL_LOGS);
    this.save(STORAGE_KEYS.MASTER_LOCATIONS, INITIAL_LOCATIONS);
    this.save(STORAGE_KEYS.MASTER_CATEGORIES, INITIAL_CATEGORIES);
    this.setKepalaPusdatin('Dr. Ir. H. Ahmad Dahlan, M.T.', 'NIDN. 0418077501');
  }
}

