// Contract Requirements Types for Sistem PUSDATIN UMC (PAHAM)

// 4.1 Status Aset (Mandatory Enum)
export type AssetStatus =
  | 'Tersedia'
  | 'Digunakan'
  | 'Dipinjam'
  | 'Maintenance'
  | 'Tidak Layak'
  // Legacy aliases for backward compatibility:
  | 'Rusak'
  | 'Diperbaiki'
  | 'Rusak Total'
  | 'Berfungsi Kembali';

// 4.2 Status Tiket Helpdesk (Mandatory Enum)
export type DamageStatus =
  | 'Open/Unassigned'
  | 'Assigned'
  | 'In Progress'
  | 'Pending – Menunggu Suku Cadang'
  | 'Resolved'
  | 'Closed – Auto'
  | 'Closed – Manual'
  | 'Re-opened'
  // Legacy aliases:
  | 'Open'
  | 'Baru'
  | 'Diterima'
  | 'Perbaikan'
  | 'Menunggu Suku Cadang'
  | 'Pending Procurement'
  | 'Closed'
  | 'Selesai';

// 4.3 Status Peminjaman (Mandatory Enum)
export type LoanStatus =
  | 'Diajukan'
  | 'Diterima'
  | 'Ditolak'
  | 'Dikonfirmasi'
  | 'Diserahkan'
  | 'Terlambat'
  | 'Dikembalikan'
  | 'Ditutup'
  // Legacy aliases:
  | 'Menunggu'
  | 'Disetujui';

// 4.4 Status Pengadaan Suku Cadang (Mandatory Enum)
export type SparePartStatus =
  | 'Diminta'
  | 'Disetujui'
  | 'Dipesan'
  | 'Diterima'
  | 'Terpasang'
  // Legacy aliases:
  | 'Belum Dibeli'
  | 'Sudah Dibeli'
  | 'Sudah Digunakan';

// 4.5 Status Pengajuan Sistem Baru (Mandatory Enum)
export type SystemProposalStatus =
  | 'status_verifikasi'
  | 'status_analisis'
  | 'status_keamanan'
  | 'status_approval'
  | 'status_pengembangan'
  | 'Disetujui'
  | 'Ditolak'
  | 'Selesai'
  | 'Serah Terima';

// 4.6 Status Notifikasi (Mandatory Enum)
export type NotificationStatus = 'pending' | 'sent' | 'failed';

// 3.1 Daftar 10 Aktor (ACT-01 s/d ACT-10)
export type ActorCode =
  | 'ACT-01' // Pimpinan Universitas
  | 'ACT-02' // Pimpinan PUSDATIN
  | 'ACT-03' // Admin / IT Support & Helpdesk Specialist
  | 'ACT-04' // Cloud & Infrastructure Engineer
  | 'ACT-05' // System Analyst & Data Governance Specialist
  | 'ACT-06' // Lead Full Stack Developer
  | 'ACT-07' // Frontend Programmer
  | 'ACT-08' // Backend Programmer
  | 'ACT-09' // Cyber Security Officer
  | 'ACT-10'; // User (Dosen/Karyawan/Mahasiswa)

export type TechnicianRole =
  | 'Pimpinan Universitas'
  | 'Kepala PUSDATIN'
  | 'IT Support & Helpdesk Specialist'
  | 'Cloud & Infrastructure Engineer'
  | 'System Analyst & Data Governance Specialist'
  | 'Lead Full Stack Developer'
  | 'Frontend Programmer'
  | 'Backend Programmer'
  | 'Cyber Security Officer'
  | 'User (Civitas Akademika)'
  // Legacy aliases for backward compatibility:
  | 'Programmer'
  | 'Junior Programmer'
  | 'Hardware/Jaringan'
  | 'Teknisi'
  | 'Helpdesk'
  | 'Admin';

export interface AppUser {
  id: string; // id_pengguna / id_account
  nama: string;
  name?: string; // Legacy alias for nama
  email: string;
  role: ActorCode;
  roleName: TechnicianRole;
  unit: string;
  phone: string;
  statusAkun: 'Aktif' | 'Nonaktif';
  sumberData: 'SSO Google' | 'LDAP' | 'SIAKAD' | 'SDM';
  avatar?: string;
  password?: string;
  specialty?: string;
  isFullAccess?: boolean;
  reportsTo?: string;
  // Legacy compatibility:
  category?: string;
  level?: 'Senior' | 'Junior' | 'Lead' | 'Staff';
}

export type TechnicianUser = AppUser;

// 8.2 Tabel 3: Aset TI
export interface Asset {
  idAset?: string;
  barcode: string; // Scan code
  kodeUnikAset: string; // BR-001: Kode Unik Aset tidak dapat diubah
  nama: string;
  kategori: string;
  merekModel?: string;
  nomorSeri?: string;
  spesifikasi?: string;
  pengguna?: string;
  bidangPengguna?: string;
  lokasi: string;
  status: AssetStatus;
  tanggalMasuk: string;
  tanggalPembelian?: string;
  nomorPoInvoice?: string;
  vendorSupplier?: string;
  hargaBeli?: number;
  masaGaransi?: string;
  jenisAset?: 'Fisik' | 'Non-Fisik';
  lokasiAwal?: string;
  qrCode?: string; // QR code data payload
  idPenerimaanTerkait?: string;
}

// 8.2 Tabel 7: Buku Penerimaan Aset
export interface BukuPenerimaanItem {
  idPenerimaan: string; // id_penerimaan
  tanggalPenerimaan: string;
  dari: string;
  nomorFaktur: string;
  tanggalFaktur: string;
  namaAset: string;
  kategori: string;
  banyaknya: number;
  hargaSatuan: number;
  jumlahHarga: number; // BR-003: banyaknya × harga_satuan (otomatis)
  nomorBeritaAcara: string;
  tanggalBeritaAcara: string;
  keterangan: string;
  tercatatUnitCount?: number;
  petugas?: string;
}

// 8.2 Tabel 8: Buku Pengeluaran Aset
export interface BukuPengeluaranItem {
  idPengeluaran: string; // id_pengeluaran
  tanggalPenyerahan: string;
  kodeUnikAset: string;
  barcode: string;
  namaAset: string;
  untuk: string;
  jenisPengeluaran: 'Penggunaan' | 'Peminjaman';
  idTiketPeminjaman?: string;
  keterangan: string;
  petugas?: string;
}

// 8.2 Tabel 9: Buku Aset Inventaris (Rekapitulasi)
export interface BukuAsetInventarisRekap {
  kategori: string;
  totalMasuk: number;
  totalKeluar: number;
  stokTersedia: number; // BR-005: total_masuk - total_keluar
  nilaiAsetTotal: number;
  rincianStatus: {
    tersedia: number;
    digunakan: number;
    dipinjam: number;
    maintenance: number;
    tidakLayak: number;
  };
}

// 8.2 Tabel 10 & 11: Peminjaman Aset & Surat Peminjaman
export type LoanHandoverMethod = 'Diambil di Ruang PUSDATIN' | 'Diserahkan oleh Tim Teknis ke Lokasi';

export interface LoanTicket {
  id: string; // nomor_tiket
  peminjam: string; // nama_peminjam
  nik: string; // nidn_nik_nim
  unit: string; // unit_kerja
  kontak: string; // nomor_whatsapp
  email: string;
  barangPinjaman: string; // jenis_barang
  jumlah: number;
  tglPinjam: string; // tanggal_peminjaman
  tglKembali: string; // tanggal_pengembalian
  keterangan?: string;
  status: LoanStatus;
  barcode?: string;
  kodeUnikAset?: string;
  namaBarangT?: string;
  kondisi?: string;
  petugas?: string;
  catatan?: string;
  tglAju: string;
  tglAmbil?: string;
  tglDikembalikan?: string;
  metodePengambilan?: LoanHandoverMethod;
  jadwalPengambilan?: string;
  lokasiPengambilan?: string;
  prioritasAntrean?: number;
  alasanPenolakan?: string;
  // Surat Peminjaman
  nomorSuratPeminjaman?: string;
  penandatangan?: {
    peminjam: string;
    petugas: string;
    kepalaPusdatin: string;
  };
  // Pemeriksaan Pengembalian
  hasilPemeriksaanKembali?: 'Baik / Lengkap' | 'Ada Kendala';
  rincianKondisiKembali?: string;
  linkedDamageTicketId?: string;
  emailTerkirim?: boolean;
}

// 8.2 Tabel 13: Suku Cadang & Status Pengadaan
export interface SparePartItem {
  id: string; // id_suku_cadang
  idTiket: string;
  namaKomponen: string; // nama_suku_cadang
  jumlah: number;
  statusPengadaan: SparePartStatus;
  tanggalKebutuhan?: string;
  tanggalBeli?: string;
  tanggalDigunakan?: string;
  catatan?: string;
  petugasPengadaan?: string;
  petugasPemasangan?: string;
  menghasilkanAsetBaru?: boolean;
  kodeAsetBaru?: string;
}

export type TicketUrgency = 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';
export type RepairCategory = 'Standar' | 'Suku Cadang (Stok Ada)' | 'Suku Cadang (Perlu Anggaran)' | 'Rusak Total (Afkir)';

// 8.2 Tabel 2: Tiket Helpdesk
export interface DamageTicket {
  id: string; // id_tiket
  kodeUnikAset: string; // Integrasi 1: tautan kode unik aset
  barcode: string;
  namaBarang: string;
  pelapor: string;
  kontakPelapor: string; // nomor_whatsapp
  emailPelapor?: string;
  kategoriMasalah: string; // Jaringan, Hardware, Software, Email, Keamanan, Server/Cloud, dll.
  prioritas: TicketUrgency;
  urgensi?: TicketUrgency;
  lokasi: string;
  lokasiAwal?: string;
  deskripsi: string;
  tanggalLapor: string; // waktu_buat
  waktuSelesai?: string;
  tanggalSelesai?: string;
  status: DamageStatus;
  slaTargetHours: number; // BR-006: target jam penyelesaian
  slaDeadline: string; // batas waktu SLA
  slaStatus?: 'On Track' | 'Mendekati Batas' | 'Overdue';
  catatanAdmin?: string;
  metodePerbaikan?: 'Di Lokasi' | 'Dibawa ke PUSDATIN';
  jenisAset?: 'Fisik' | 'Non-Fisik';
  jadwalPemeriksaan?: string;
  skenarioPerbaikan?: 'Non-Fisik (Remote/Server)' | 'Fisik (On-site)' | 'Fisik (Bawa ke PUSDATIN)';
  cabangPerbaikan?: 'Normal' | 'Butuh Suku Cadang' | 'Rusak Total';
  kondisiAkhirAset?: AssetStatus;
  resolusiAkhir?: string;
  kategoriPerbaikan?: RepairCategory;
  namaSukuCadang?: string;
  sukuCadangList?: SparePartItem[];
  sumberAnggaran?: 'Stok Internal PUSDATIN' | 'Pengajuan RKAT Kampus' | 'Biaya Unit/Fakultas';
  picTeknisi?: TechnicianRole;
  namaPicTeknisi?: string;
  assignedTechnicianId?: string;
  delegasiKeTechnicianId?: string;
  namaDelegasiTeknisi?: string;
  penugasanOtomatis?: boolean;
  tanggalDitugaskan?: string;
  delegasiDari?: string;
  catatanDelegasi?: string;
  tanggalDelegasi?: string;
  resolvedAt?: string; // Untuk countdown 2 hari kerja (BR-008)
  closedMode?: 'Auto' | 'Manual';
  eskalasiPusdatin?: boolean;
  riwayatStatus?: {
    status: DamageStatus;
    timestamp: string;
    catatan: string;
    petugas: string;
  }[];
}

// 8.2 Tabel 14: Pengajuan Sistem Baru dan Pengembangan Aplikasi
export interface SystemProposal {
  id: string; // id_pengajuan
  namaSistem: string;
  pemohon: string;
  unitKerja: string;
  nidnNik: string;
  kontakWhatsapp: string;
  email: string;
  deskripsiKebutuhan: string;
  latarBelakang: string;
  targetPengguna: string;
  tanggalPengajuan: string;
  status: SystemProposalStatus;
  // Tahap 1: Verifikasi Kelengkapan (Admin)
  verifikasiAdmin?: {
    petugas: string;
    tanggal: string;
    lengkap: boolean;
    catatan: string;
  };
  // Tahap 2: Analisis Kebutuhan (System Analyst ACT-05)
  analisisKebutuhan?: {
    analystName: string;
    tanggal: string;
    arsitekturData: string;
    lingkupFitur: string;
    estimasiSprintWeeks: number;
    catatan: string;
  };
  // Tahap 3: Verifikasi Keamanan (Cyber Security ACT-09)
  verifikasiKeamanan?: {
    auditorName: string;
    tanggal: string;
    risikoKeamanan: 'Rendah' | 'Sedang' | 'Tinggi';
    rekomendasiEnkripsi: string;
    statusVerifikasi: 'Lolos' | 'Perlu Revisi' | 'Ditolak';
    catatan: string;
  };
  // Tahap 4: Approval (Pimpinan PUSDATIN ACT-02)
  approvalPimpinan?: {
    pejabat: string;
    tanggal: string;
    keputusan: 'Disetujui' | 'Ditolak';
    catatan: string;
  };
  // Tahap 5: Pengembangan (Lead Dev ACT-06, Frontend ACT-07, Backend ACT-08)
  pengembangan?: {
    leadDev: string;
    frontendDev?: string;
    backendDev?: string;
    progresPersen: number;
    logProgres: {
      tanggal: string;
      petugas: string;
      deskripsi: string;
      progres: number;
    }[];
    tanggalMulai?: string;
    tanggalTarget?: string;
    tanggalSelesai?: string;
    codeReviewBy?: string;
    serahTerimaServiceDesk?: boolean;
  };
  // Integrasi 5 & BR-015: Aset Baru dari Sistem Selesai
  asetDihasilkan?: {
    jenisAset: 'Server VPS' | 'Lisensi Software' | 'Perangkat Pendukung';
    namaAset: string;
    spesifikasi: string;
    kodeUnikAset?: string;
    sudahDiregistrasi: boolean;
  };
  dokumenTeknis?: {
    namaDokumen: string;
    tipe: 'TOR' | 'Arsitektur' | 'Uji Keamanan' | 'Manual Panduan';
    urlOrFilename: string;
    tanggalUpload: string;
  }[];
}

// 8.2 Tabel 15: Notifikasi (WhatsApp / Email)
export interface NotificationLog {
  id: string; // id_notifikasi
  idPengguna?: string;
  tujuan: string; // no WA atau email
  namaPenerima: string;
  kanal: 'WhatsApp' | 'Email';
  jenisNotifikasi:
    | 'Tiket Dibuat'
    | 'Status Tiket Diperbarui'
    | 'Peminjaman Diajukan'
    | 'Peminjaman Disetujui'
    | 'Peminjaman Diserahkan'
    | 'Peringatan Terlambat'
    | 'Aset Dikembalikan'
    | 'Eskalasi SLA'
    | 'Pengajuan Sistem Baru';
  statusKirim: NotificationStatus; // pending, sent, failed
  timestamp: string;
  pesanPreview: string;
  urlTerkait?: string;
}

// 8.2 Tabel 16: Audit Trail Status Tiket & Entitas (BR-016: Immutable)
export interface AuditTrailItem {
  id: string; // id_audit
  entityType: 'Tiket Helpdesk' | 'Aset TI' | 'Peminjaman Aset' | 'Pengajuan Sistem Baru' | 'Suku Cadang';
  entityId: string;
  statusLama: string;
  statusBaru: string;
  idPengguna: string;
  namaPengguna: string;
  rolePengguna: string;
  timestamp: string;
  catatan: string;
  ipAddress?: string;
}

// 8.2 Tabel 4: Log Aktivitas
export interface ActivityLog {
  id: string;
  timestamp: string;
  barcode: string;
  namaBarang: string;
  jenisTransaksi:
    | 'Masuk'
    | 'Keluar'
    | 'Pinjam'
    | 'Kembali'
    | 'Rusak'
    | 'Lapor Rusak'
    | 'Perbaikan'
    | 'Selesai Perbaikan'
    | 'Rusak Total'
    | 'Suku Cadang'
    | 'Mutasi Lokasi'
    | 'Penugasan Teknisi'
    | 'Pengajuan Sistem Baru'
    | 'Pengeluaran Aset';
  lokasi: string;
  keterangan: string;
  petugas?: string;
}

// 8.2 Tabel 5: API Registration
export interface ApiRegistration {
  idApi: string;
  namaService: string;
  endpoint: string;
  apiKey: string;
  rateLimit: number;
  status: 'Aktif' | 'Nonaktif';
}

export interface AppStatistics {
  totalAset: number;
  tersedia: number;
  digunakan: number;
  dipinjam: number;
  maintenance: number;
  tidakLayak: number;
  rusak?: number;
  diperbaiki?: number;
  totalPinjamMenunggu: number;
  totalPinjamTerlambat: number;
  totalAntreanTiket: number;
  totalSedangDiperbaiki: number;
  totalMenungguSparepart: number;
  totalSlaOverdue: number;
  slaAchievementRate: number; // Persentase SLA on time
  totalPengajuanSistem: number;
  pengajuanDalamPengembangan: number;
  kategoriMap: Record<string, number>;
  lokasiMap: Record<string, number>;
  overdueLoans: LoanTicket[];
}

export interface EmailLog {
  id: string;
  to?: string;
  recipient?: string;
  recipientName?: string;
  subject: string;
  body?: string;
  bodyHtml?: string;
  status?: 'sent' | 'failed' | 'simulated';
  timestamp: string;
  ticketId?: string;
  type?: string;
}

export interface MonthlyReportParams {
  month: number;
  year: number;
  category?: string;
  location?: string;
  status?: string;
  format?: 'pdf' | 'excel';
  reportType?: 'summary' | 'asset' | 'loan' | 'damage';
}

export interface PicPerformanceReport {
  technicianId: string;
  technicianName: string;
  name?: string;
  role: TechnicianRole;
  level?: string;
  totalAssigned: number;
  totalResolved: number;
  totalInProgress: number;
  totalWaitingParts: number;
  totalDelegated: number;
  resolutionRate: number;
  slaOnTimeRate: number;
}
