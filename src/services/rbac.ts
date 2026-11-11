import { ActorCode, AppUser, TechnicianRole } from '../types';

export type ModulePermission =
  | 'dashboard_ringkasan'
  | 'buku_penerimaan'
  | 'registrasi_aset_qr'
  | 'buku_pengeluaran'
  | 'buku_inventaris'
  | 'buat_tiket'
  | 'distribusi_tiket'
  | 'tindakan_perbaikan'
  | 'peminjaman_aset'
  | 'pengajuan_sistem'
  | 'dashboard_pimpinan'
  | 'audit_trail'
  | 'suku_cadang';

export type AccessLevel = 'none' | 'view' | 'manage' | 'verify' | 'execute' | 'approve' | 'propose';

// 3.2 Matriks Hak Akses Rekonstruksi (Strict Deny-by-Default)
export const RBAC_MATRIX: Record<ActorCode, Record<ModulePermission, AccessLevel>> = {
  // ACT-01: Pimpinan Universitas
  'ACT-01': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'view',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'view',
    buat_tiket: 'none',
    distribusi_tiket: 'none',
    tindakan_perbaikan: 'none',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'view',
    dashboard_pimpinan: 'view', // Lihat / unduh laporan eksekutif
    audit_trail: 'view',
    suku_cadang: 'view'
  },
  // ACT-02: Pimpinan PUSDATIN
  'ACT-02': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'verify',
    registrasi_aset_qr: 'verify',
    buku_pengeluaran: 'verify',
    buku_inventaris: 'verify',
    buat_tiket: 'none',
    distribusi_tiket: 'view', // Pantau helpdesk
    tindakan_perbaikan: 'view', // Pantau helpdesk
    peminjaman_aset: 'approve', // Ttd mengetahui
    pengajuan_sistem: 'approve', // Otorisasi final sistem baru
    dashboard_pimpinan: 'view',
    audit_trail: 'view',
    suku_cadang: 'view'
  },
  // ACT-03: Admin / IT Support & Helpdesk Specialist
  'ACT-03': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'manage',
    registrasi_aset_qr: 'manage',
    buku_pengeluaran: 'manage',
    buku_inventaris: 'manage',
    buat_tiket: 'manage', // Bantu catat tiket walk-in / kelola
    distribusi_tiket: 'manage', // Dispatch tiket ke teknisi
    tindakan_perbaikan: 'execute', // Kerjakan tiket hardware umum
    peminjaman_aset: 'manage', // Kelola alokasi, penyerahan, pengembalian
    pengajuan_sistem: 'verify', // Verifikasi awal kelengkapan dokumen
    dashboard_pimpinan: 'view',
    audit_trail: 'view',
    suku_cadang: 'manage'
  },
  // ACT-04: Cloud & Infrastructure Engineer
  'ACT-04': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'view',
    registrasi_aset_qr: 'view',
    buku_pengeluaran: 'view',
    buku_inventaris: 'view',
    buat_tiket: 'none',
    distribusi_tiket: 'execute', // Terima tiket jaringan/cloud
    tindakan_perbaikan: 'execute', // Kerjakan
    peminjaman_aset: 'none',
    pengajuan_sistem: 'view',
    dashboard_pimpinan: 'none',
    audit_trail: 'view',
    suku_cadang: 'execute'
  },
  // ACT-05: System Analyst & Data Governance Specialist
  'ACT-05': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'view',
    registrasi_aset_qr: 'view',
    buku_pengeluaran: 'view',
    buku_inventaris: 'view',
    buat_tiket: 'none',
    distribusi_tiket: 'execute', // Terima tiket software & data
    tindakan_perbaikan: 'execute',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'execute', // Analisis kebutuhan (status_analisis)
    dashboard_pimpinan: 'none',
    audit_trail: 'view',
    suku_cadang: 'view'
  },
  // ACT-06: Lead Full Stack Developer
  'ACT-06': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'view',
    registrasi_aset_qr: 'view',
    buku_pengeluaran: 'view',
    buku_inventaris: 'view',
    buat_tiket: 'none',
    distribusi_tiket: 'none',
    tindakan_perbaikan: 'none',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'manage', // Pimpin eksekusi sprint & code review
    dashboard_pimpinan: 'none',
    audit_trail: 'view',
    suku_cadang: 'none'
  },
  // ACT-07: Frontend Programmer
  'ACT-07': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'view',
    buat_tiket: 'none',
    distribusi_tiket: 'none',
    tindakan_perbaikan: 'none',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'execute', // Kembangkan UI sistem baru
    dashboard_pimpinan: 'none',
    audit_trail: 'none',
    suku_cadang: 'none'
  },
  // ACT-08: Backend Programmer
  'ACT-08': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'view',
    buat_tiket: 'none',
    distribusi_tiket: 'none',
    tindakan_perbaikan: 'none',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'execute', // Kembangkan API dan database
    dashboard_pimpinan: 'none',
    audit_trail: 'none',
    suku_cadang: 'none'
  },
  // ACT-09: Cyber Security Officer
  'ACT-09': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'view',
    buat_tiket: 'none',
    distribusi_tiket: 'execute', // Terima tiket insiden keamanan/email
    tindakan_perbaikan: 'execute',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'verify', // Verifikasi keamanan (status_keamanan)
    dashboard_pimpinan: 'none',
    audit_trail: 'view',
    suku_cadang: 'view'
  },
  // ACT-10: User (Dosen/Karyawan/Mahasiswa)
  'ACT-10': {
    dashboard_ringkasan: 'none',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'none',
    buat_tiket: 'propose', // Buat tiket
    distribusi_tiket: 'none',
    tindakan_perbaikan: 'none',
    peminjaman_aset: 'propose', // Ajukan peminjaman
    pengajuan_sistem: 'propose', // Ajukan sistem baru
    dashboard_pimpinan: 'none',
    audit_trail: 'none',
    suku_cadang: 'none'
  }
};

// 10 Initial Seed Users Representing all Actors (Section 3.1)
export const SEED_USERS: AppUser[] = [
  {
    id: 'USR-ACT-01',
    nama: 'Prof. Dr. H. Arif Nurudin, M.T.',
    email: 'rektorat@umc.ac.id',
    role: 'ACT-01',
    roleName: 'Pimpinan Universitas',
    unit: 'Rektorat UMC',
    phone: '081122334401',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Kebijakan Strategis, Pengawasan TI & Evaluasi SLA Kampus',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-02',
    nama: 'Dr. Ir. H. Ahmad Dahlan, M.T.',
    email: 'kepala.pusdatin@umc.ac.id',
    role: 'ACT-02',
    roleName: 'Kepala PUSDATIN',
    unit: 'PUSDATIN UMC',
    phone: '081122334455',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Otorisasi Pengadaan, Approval Sistem Baru, Pengesahan Surat Peminjaman',
    isFullAccess: true
  },
  {
    id: 'USR-ACT-03',
    nama: 'Aditiya Ahmad Fadila, S.Kom.',
    email: 'aditiya.it@umc.ac.id',
    role: 'ACT-03',
    roleName: 'IT Support & Helpdesk Specialist',
    unit: 'PUSDATIN UMC',
    phone: '085964531388',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Kelola Penerimaan/Pengeluaran Aset, QR Label, Distribusi Tiket, Peminjaman',
    isFullAccess: true
  },
  {
    id: 'USR-ACT-04',
    nama: 'Ir. Faisal Hakim, M.T.',
    email: 'faisal.cloud@umc.ac.id',
    role: 'ACT-04',
    roleName: 'Cloud & Infrastructure Engineer',
    unit: 'PUSDATIN UMC',
    phone: '081234998877',
    statusAkun: 'Aktif',
    sumberData: 'LDAP',
    specialty: 'Infrastruktur Jaringan, Server Kampus, Wi-Fi, Switch & Cloud Computing',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-05',
    nama: 'Novi Andriani, M.Kom.',
    email: 'novi.analyst@umc.ac.id',
    role: 'ACT-05',
    roleName: 'System Analyst & Data Governance Specialist',
    unit: 'PUSDATIN UMC',
    phone: '085711223344',
    statusAkun: 'Aktif',
    sumberData: 'LDAP',
    specialty: 'Analisis Kebutuhan Sistem Baru, Data Governance, Integrasi SIAKAD',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-06',
    nama: 'Bayu Pratama, S.Kom.',
    email: 'bayu.dev@umc.ac.id',
    role: 'ACT-06',
    roleName: 'Lead Full Stack Developer',
    unit: 'PUSDATIN UMC',
    phone: '085288776655',
    statusAkun: 'Aktif',
    sumberData: 'LDAP',
    specialty: 'Kepemimpinan Pengembangan Software, Arsitektur Aplikasi & Code Review',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-07',
    nama: 'Dimas Saputra, S.Kom.',
    email: 'dimas.frontend@umc.ac.id',
    role: 'ACT-07',
    roleName: 'Frontend Programmer',
    unit: 'PUSDATIN UMC',
    phone: '087833445566',
    statusAkun: 'Aktif',
    sumberData: 'SIAKAD',
    specialty: 'Pengembangan Antarmuka Web, UX Civitas & Integrasi REST API',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-08',
    nama: 'Eko Prasetyo, S.Kom.',
    email: 'eko.backend@umc.ac.id',
    role: 'ACT-08',
    roleName: 'Backend Programmer',
    unit: 'PUSDATIN UMC',
    phone: '089912345678',
    statusAkun: 'Aktif',
    sumberData: 'SIAKAD',
    specialty: 'Database Relasional, Business Logic, Endpoint API & Keamanan Server',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-09',
    nama: 'Rian Hidayat, M.Kom.',
    email: 'rian.sec@umc.ac.id',
    role: 'ACT-09',
    roleName: 'Cyber Security Officer',
    unit: 'PUSDATIN UMC',
    phone: '081399887766',
    statusAkun: 'Aktif',
    sumberData: 'LDAP',
    specialty: 'Audit Keamanan Sistem, Proteksi Data, Investigasi Insiden & Firewall',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-10',
    nama: 'Dr. Hendra Wijaya, M.Pd.',
    email: 'hendra.dosen@umc.ac.id',
    role: 'ACT-10',
    roleName: 'User (Civitas Akademika)',
    unit: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    phone: '081234567890',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Dosen / Civitas: Pelapor Kerusakan, Peminjam Aset & Pengusul Sistem',
    isFullAccess: false
  }
];

export class AccessControlService {
  /**
   * Check if role has required access level on a module
   */
  public static canAccess(role: ActorCode, module: ModulePermission): boolean {
    const level = RBAC_MATRIX[role]?.[module] || 'none';
    return level !== 'none';
  }

  public static getAccessLevel(role: ActorCode, module: ModulePermission): AccessLevel {
    return RBAC_MATRIX[role]?.[module] || 'none';
  }

  public static can(user: AppUser, module: ModulePermission, level: AccessLevel): boolean {
    const userLevel = this.getAccessLevel(user.role, module);
    if (userLevel === 'none') return false;
    if (level === 'view') return true;
    if (level === 'manage') return userLevel === 'manage';
    if (level === 'approve') return userLevel === 'approve' || userLevel === 'manage';
    if (level === 'execute') return userLevel === 'execute' || userLevel === 'manage';
    if (level === 'verify') return userLevel === 'verify' || userLevel === 'manage';
    if (level === 'propose') return userLevel === 'propose' || userLevel === 'manage';
    return false;
  }

  /**
   * Server-side RBAC guard. Throws Error if permission denied.
   */
  public static enforce(
    user: AppUser | null,
    module: ModulePermission,
    allowedLevels: AccessLevel[] = ['manage', 'verify', 'execute', 'approve', 'view', 'propose'],
    actionDescription?: string
  ): void {
    if (!user) {
      throw new Error(`[RBAC-DENIED] Autentikasi diperlukan. Pengguna belum login.`);
    }

    const level = this.getAccessLevel(user.role, module);
    if (level === 'none' || !allowedLevels.includes(level)) {
      throw new Error(
        `[RBAC-DENIED] Akses ditolak! Peran "${user.roleName}" (${user.role}) tidak memiliki izin untuk: ${
          actionDescription || module
        }. Hubungi Administrator PUSDATIN UMC.`
      );
    }
  }

  public static isPimpinan(role: ActorCode): boolean {
    return role === 'ACT-01' || role === 'ACT-02';
  }

  public static isAdminOrPusdatinLead(role: ActorCode): boolean {
    return role === 'ACT-02' || role === 'ACT-03';
  }

  public static isTechnician(role: ActorCode): boolean {
    return ['ACT-03', 'ACT-04', 'ACT-05', 'ACT-06', 'ACT-07', 'ACT-08', 'ACT-09'].includes(role);
  }
}
