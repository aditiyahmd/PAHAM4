export type AssetStatus =
  | 'Tersedia'
  | 'Digunakan'
  | 'Dipinjam'
  | 'Rusak'
  | 'Diperbaiki'
  | 'Rusak Total'
  | 'Berfungsi Kembali';

export interface Asset {
  barcode: string;
  nama: string; // nama aset
  kategori: string; // kategori aset
  merekModel?: string; // merek dan model
  nomorSeri?: string; // nomor seri
  spesifikasi?: string; // spesifikasi
  pengguna?: string; // pengguna (jika status digunakan)
  bidangPengguna?: string; // bidang pengguna (jika status digunakan)
  lokasi: string; // lokasi
  status: AssetStatus;
  tanggalMasuk: string;
  tanggalPembelian?: string; // tanggal pembelian
  nomorPoInvoice?: string; // nomor PO/Invoice
  vendorSupplier?: string; // nama vendor/supplier
  hargaBeli?: number; // harga beli
  masaGaransi?: string; // masa garansi
  jenisAset?: 'Fisik' | 'Non-Fisik'; // jenis aset
  lokasiAwal?: string; // Lokasi asal sebelum perbaikan/mutasi
}

export type LoanStatus = 'Menunggu' | 'Disetujui' | 'Dikembalikan' | 'Ditolak' | 'Terlambat';
export type LoanHandoverMethod = 'Diambil di Ruang PUSDATIN' | 'Diserahkan oleh Tim Teknis ke Lokasi';

export interface LoanTicket {
  id: string;
  peminjam: string;
  nik: string;
  unit: string;
  kontak: string;
  email: string;
  barangPinjaman: string;
  jumlah: number;
  tglPinjam: string;
  tglKembali: string;
  status: LoanStatus;
  barcode?: string;
  namaBarangT?: string;
  kondisi?: string;
  petugas?: string;
  catatan?: string;
  tglAju: string;
  tglAmbil?: string;
  tglDikembalikan?: string;
  emailTerkirim?: boolean;
  // Enhancement B.1a: Kapan bisa diambil dan metode penyerahan
  metodePengambilan?: LoanHandoverMethod;
  jadwalPengambilan?: string; // e.g. "2026-11-08 pukul 09:00 WIB"
  lokasiPengambilan?: string;
  prioritasAntrean?: number; // 1 = Prioritas pertama (waktu paling awal), 2 = berikutnya
}

export type DamageStatus =
  | 'Open'
  | 'Assigned'
  | 'In Progress'
  | 'Pending Procurement'
  | 'Closed'
  // Legacy aliases for backward compatibility:
  | 'Baru'
  | 'Diterima'
  | 'Perbaikan'
  | 'Menunggu Suku Cadang'
  | 'Rusak Total'
  | 'Selesai';

export type RepairCategory = 'Standar' | 'Suku Cadang (Stok Ada)' | 'Suku Cadang (Perlu Anggaran)' | 'Rusak Total (Afkir)';
export type TechnicianRole =
  | 'Kepala PUSDATIN'
  | 'IT Support & Helpdesk Specialist'
  | 'Cloud & Infrastructure Engineer'
  | 'Programmer'
  | 'Junior Programmer'
  | 'Cyber Security Officer';

export type TicketUrgency = 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';

export type SparePartStatus = 'Belum Dibeli' | 'Sudah Dibeli' | 'Sudah Digunakan';

export interface SparePartItem {
  id: string;
  namaKomponen: string;
  statusPengadaan: SparePartStatus;
  tanggalKebutuhan?: string;
  tanggalBeli?: string;
  tanggalDigunakan?: string;
  catatan?: string;
  petugasPengadaan?: string;
  petugasPemasangan?: string;
}

export interface TechnicianUser {
  id: string;
  name: string;
  role: TechnicianRole;
  email: string;
  password?: string;
  phone: string;
  specialty: string;
  avatar?: string;
  isFullAccess?: boolean; // Kepala PUSDATIN & IT Support have full access
  level?: 'Senior' | 'Junior' | 'Lead' | 'Staff';
  reportsTo?: string; // e.g. TECH-003 for Junior Programmer
}

export interface DamageTicket {
  id: string;
  barcode: string;
  namaBarang: string;
  pelapor: string;
  kontakPelapor?: string; // No WhatsApp / HP Pelapor
  emailPelapor?: string;
  lokasi: string;
  lokasiAwal?: string; // Lokasi saat insiden / sebelum dibawa ke Pusdatin
  deskripsi: string;
  tanggalLapor: string;
  status: DamageStatus;
  tanggalSelesai?: string;
  catatanAdmin?: string;
  metodePerbaikan?: 'Di Lokasi' | 'Dibawa ke PUSDATIN';
  urgensi?: TicketUrgency;
  kategoriMasalah?: 'Hardware' | 'Software' | string;
  // SOP 5-Tahap Fields
  jenisAset?: 'Fisik' | 'Non-Fisik';
  jadwalPemeriksaan?: string; // Langkah 3: Penjadwalan inspeksi oleh teknisi
  skenarioPerbaikan?: 'Non-Fisik (Remote/Server)' | 'Fisik (On-site)' | 'Fisik (Bawa ke PUSDATIN)';
  cabangPerbaikan?: 'Normal' | 'Butuh Suku Cadang' | 'Rusak Total';
  kondisiAkhirAset?: 'Berfungsi Kembali' | 'Digunakan' | 'Tersedia' | 'Rusak Total';
  resolusiAkhir?: string;
  // Enhancement B.2b: Klasifikasi perbaikan & suku cadang
  kategoriPerbaikan?: RepairCategory;
  namaSukuCadang?: string;
  sukuCadangList?: SparePartItem[]; // Multi-component spare parts without price
  estimasiBiayaSukuCadang?: number;
  sumberAnggaran?: 'Stok Internal PUSDATIN' | 'Pengajuan RKAT Kampus' | 'Biaya Unit/Fakultas';
  // PIC Penugasan & Delegasi
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
  riwayatStatus?: {
    status: DamageStatus;
    timestamp: string;
    catatan: string;
    petugas: string;
  }[];
}

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
    | 'Penugasan Teknisi';
  lokasi: string;
  keterangan: string;
  petugas?: string;
}

export interface AppStatistics {
  totalAset: number;
  tersedia: number;
  digunakan: number;
  dipinjam: number;
  rusak: number;
  diperbaiki: number;
  rusakTotal: number;
  totalPinjamMenunggu: number;
  totalPinjamTerlambat: number; // Aset dipinjam yang melewati tglKembali
  totalAntreanTiket: number;
  // Enhancement B.6: Metrik spesifik perbaikan & barang masuk Pusdatin
  totalSedangDiperbaiki: number;
  totalMasukPusdatinBelumDiperbaiki: number;
  totalMenungguSparepart: number;
  kategoriMap: Record<string, number>;
  lokasiMap: Record<string, number>;
  overdueLoans: LoanTicket[];
}

export interface EmailLog {
  id: string;
  ticketId: string;
  recipientName: string;
  to: string;
  subject: string;
  bodyHtml: string;
  timestamp: string;
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
}

export interface MonthlyReportParams {
  bulan: string;
  tahun: string;
  tipeLaporan: 'Semua' | 'Peminjaman' | 'Kerusakan' | 'Aset Terkini' | 'Suku Cadang' | 'Kinerja PIC';
  kepalaPusdatin: string;
  nipKepala?: string;
  petugas: string;
  assets: Asset[];
  loans: LoanTicket[];
  damages: DamageTicket[];
  logs: ActivityLog[];
  technicians?: TechnicianUser[];
  spareParts?: any[];
  picPerformance?: PicPerformanceReport[];
}

