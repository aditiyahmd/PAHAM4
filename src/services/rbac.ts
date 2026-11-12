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
  // ACT-01: Pimpinan Universitas (Rektor & Wakil Rektor 1 - Halaman Eksekutif)
  'ACT-01': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'view', // Master Aset read-only (tanpa edit)
    buku_pengeluaran: 'none',
    buku_inventaris: 'view', // Buku Aset Inventaris
    buat_tiket: 'none',
    distribusi_tiket: 'none',
    tindakan_perbaikan: 'none',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'none',
    dashboard_pimpinan: 'view', // Dashboard Pimpinan
    audit_trail: 'view',
    suku_cadang: 'none'
  },
  // ACT-02: Pimpinan PUSDATIN (Semua Menu)
  'ACT-02': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'manage',
    registrasi_aset_qr: 'manage',
    buku_pengeluaran: 'manage',
    buku_inventaris: 'manage',
    buat_tiket: 'manage',
    distribusi_tiket: 'manage',
    tindakan_perbaikan: 'manage',
    peminjaman_aset: 'manage',
    pengajuan_sistem: 'approve',
    dashboard_pimpinan: 'view',
    audit_trail: 'view',
    suku_cadang: 'manage'
  },
  // ACT-03: IT Support & Helpdesk Specialist / Admin Sistem (Semua Menu)
  'ACT-03': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'manage',
    registrasi_aset_qr: 'manage',
    buku_pengeluaran: 'manage',
    buku_inventaris: 'manage',
    buat_tiket: 'manage',
    distribusi_tiket: 'manage',
    tindakan_perbaikan: 'execute',
    peminjaman_aset: 'manage',
    pengajuan_sistem: 'manage',
    dashboard_pimpinan: 'view',
    audit_trail: 'view',
    suku_cadang: 'manage'
  },
  // ACT-04: Cloud & Infrastructure Engineer (Dashboard tiket delegasi & Helpdesk SLA)
  'ACT-04': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'none',
    buat_tiket: 'none',
    distribusi_tiket: 'execute', // Helpdesk & Tiket SLA
    tindakan_perbaikan: 'execute',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'none',
    dashboard_pimpinan: 'none',
    audit_trail: 'view',
    suku_cadang: 'none'
  },
  // ACT-05: System Analyst & Data Governance Specialist (Dashboard, Helpdesk SLA, Pengajuan Sistem Baru)
  'ACT-05': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'none',
    buat_tiket: 'none',
    distribusi_tiket: 'execute',
    tindakan_perbaikan: 'execute',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'execute', // Pengajuan Sistem Baru
    dashboard_pimpinan: 'none',
    audit_trail: 'view',
    suku_cadang: 'none'
  },
  // ACT-06: Lead Full Stack Developer (Dashboard, Helpdesk SLA, Pengajuan Sistem Baru)
  'ACT-06': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'none',
    buat_tiket: 'none',
    distribusi_tiket: 'execute',
    tindakan_perbaikan: 'none',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'manage', // Pengajuan Sistem Baru
    dashboard_pimpinan: 'none',
    audit_trail: 'view',
    suku_cadang: 'none'
  },
  // ACT-07: Frontend Programmer (Dashboard, Helpdesk SLA, Pengajuan Sistem Baru)
  'ACT-07': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'none',
    buat_tiket: 'none',
    distribusi_tiket: 'execute',
    tindakan_perbaikan: 'none',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'execute', // Pengajuan Sistem Baru
    dashboard_pimpinan: 'none',
    audit_trail: 'none',
    suku_cadang: 'none'
  },
  // ACT-08: Backend Programmer (Dashboard, Helpdesk SLA, Pengajuan Sistem Baru)
  'ACT-08': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'none',
    buat_tiket: 'none',
    distribusi_tiket: 'execute',
    tindakan_perbaikan: 'none',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'execute', // Pengajuan Sistem Baru
    dashboard_pimpinan: 'none',
    audit_trail: 'none',
    suku_cadang: 'none'
  },
  // ACT-09: Cyber Security Officer (Dashboard, Helpdesk SLA, Pengajuan Sistem Baru)
  'ACT-09': {
    dashboard_ringkasan: 'view',
    buku_penerimaan: 'none',
    registrasi_aset_qr: 'none',
    buku_pengeluaran: 'none',
    buku_inventaris: 'none',
    buat_tiket: 'none',
    distribusi_tiket: 'execute',
    tindakan_perbaikan: 'execute',
    peminjaman_aset: 'none',
    pengajuan_sistem: 'verify', // Pengajuan Sistem Baru
    dashboard_pimpinan: 'none',
    audit_trail: 'view',
    suku_cadang: 'none'
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
    pengajuan_sistem: 'propose', // Ajukan sistem baru (hanya jika Dosen/Karyawan)
    dashboard_pimpinan: 'none',
    audit_trail: 'none',
    suku_cadang: 'none'
  }
};

// Initial Seed Users Representing all Actors according to PUSDATIN UMC Organizational Structure
export const SEED_USERS: AppUser[] = [
  {
    id: 'USR-ACT-01A',
    nama: 'Prof. Dr. H. Arif Nurudin, M.T.',
    email: 'rektor@umc.ac.id',
    role: 'ACT-01',
    roleName: 'Pimpinan Universitas',
    unit: 'Rektorat UMC (Rektor)',
    phone: '081122334401',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Rektor: Kebijakan Strategis, Pengawasan TI & Evaluasi Kinerja PUSDATIN',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-01B',
    nama: 'Dr. Hj. Eni Murniasih, M.Pd.',
    email: 'warek1@umc.ac.id',
    role: 'ACT-01',
    roleName: 'Pimpinan Universitas',
    unit: 'Wakil Rektor 1 Bidang Akademik & Sistem Informasi',
    phone: '081122334402',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Wakil Rektor 1: Pengawasan Infrastruktur Akademik, Aset TI & SLA Layanan',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-02',
    nama: 'Dr. Ir. H. Ahmad Dahlan, M.T.',
    email: 'kepala.pusdatin@umc.ac.id',
    role: 'ACT-02',
    roleName: 'Kepala PUSDATIN',
    unit: 'Pimpinan PUSDATIN UMC',
    phone: '081122334455',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Pimpinan PUSDATIN: Otorisasi Pengadaan, Approval Sistem Baru, Pengesahan Peminjaman & Seluruh Menu',
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
    specialty: 'Admin Sistem: Pengelolaan Aset, Faktur Penerimaan, Distribusi Pengeluaran, Tiket SLA & Seluruh Menu',
    isFullAccess: true
  },
  {
    id: 'USR-ACT-04',
    nama: 'Ir. Faisal Hakim, M.T.',
    email: 'faisal.cloud@umc.ac.id',
    role: 'ACT-04',
    roleName: 'Cloud & Infrastructure Engineer',
    unit: 'Divisi Infrastruktur Jaringan & Server PUSDATIN',
    phone: '081234998877',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Cloud & Infrastructure: Monitoring Jaringan, Server Kampus, Switch & Tiket SLA Delegasi',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-05',
    nama: 'Novi Andriani, M.Kom.',
    email: 'novi.analyst@umc.ac.id',
    role: 'ACT-05',
    roleName: 'System Analyst & Data Governance Specialist',
    unit: 'Divisi Sistem & Tata Kelola Data PUSDATIN',
    phone: '085711223344',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'System Analyst: Analisis Kebutuhan, Tata Kelola Data, Tiket Delegasi & Pengajuan Sistem Baru',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-06',
    nama: 'Bayu Pratama, S.Kom.',
    email: 'bayu.dev@umc.ac.id',
    role: 'ACT-06',
    roleName: 'Lead Full Stack Developer',
    unit: 'Divisi Pengembangan Perangkat Lunak PUSDATIN',
    phone: '085288776655',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Lead Developer: Arsitektur Software, Sprint Planning, Tiket Delegasi & Pengajuan Sistem Baru',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-07',
    nama: 'Dimas Saputra, S.Kom.',
    email: 'dimas.frontend@umc.ac.id',
    role: 'ACT-07',
    roleName: 'Frontend Programmer',
    unit: 'Divisi Pengembangan Perangkat Lunak PUSDATIN',
    phone: '087833445566',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Frontend Programmer: Pengembangan Antarmuka Web, UI/UX, Tiket Delegasi & Pengajuan Sistem Baru',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-08',
    nama: 'Eko Prasetyo, S.Kom.',
    email: 'eko.backend@umc.ac.id',
    role: 'ACT-08',
    roleName: 'Backend Programmer',
    unit: 'Divisi Pengembangan Perangkat Lunak PUSDATIN',
    phone: '089912345678',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Backend Programmer: REST API, Database Relasional, Tiket Delegasi & Pengajuan Sistem Baru',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-09',
    nama: 'Rian Hidayat, M.Kom.',
    email: 'rian.sec@umc.ac.id',
    role: 'ACT-09',
    roleName: 'Cyber Security Officer',
    unit: 'Divisi Keamanan Siber PUSDATIN',
    phone: '081399887766',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Cyber Security Officer: Keamanan Informasi, Audit Kerentanan, Tiket Delegasi & Review Pengajuan Sistem',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-10A',
    nama: 'Dr. Hendra Wijaya, M.Pd.',
    email: 'hendra.dosen@umc.ac.id',
    role: 'ACT-10',
    roleName: 'User (Civitas Akademika)',
    civitasType: 'Dosen',
    unit: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    phone: '081234567890',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Dosen: Peminjaman Aset, Lapor Kerusakan & Ajukan Sistem Baru',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-10B',
    nama: 'Siti Rahmawati, S.AP.',
    email: 'siti.tendik@umc.ac.id',
    role: 'ACT-10',
    roleName: 'User (Civitas Akademika)',
    civitasType: 'Karyawan',
    unit: 'Biro Administrasi Akademik (BAA)',
    phone: '081298765432',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Karyawan / Tendik: Peminjaman Aset, Lapor Kerusakan & Ajukan Sistem Baru',
    isFullAccess: false
  },
  {
    id: 'USR-ACT-10C',
    nama: 'Muhammad Rizki Pratama',
    email: 'm.rizki@student.umc.ac.id',
    role: 'ACT-10',
    roleName: 'User (Civitas Akademika)',
    civitasType: 'Mahasiswa',
    unit: 'Teknik Informatika - Fakultas Teknik',
    phone: '085712345678',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Mahasiswa: Peminjaman Aset, Lapor Kerusakan (Tidak ada menu Ajukan Sistem Baru)',
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
