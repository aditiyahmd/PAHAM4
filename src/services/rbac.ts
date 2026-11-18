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
  | 'suku_cadang'
  | 'rekap_survei';

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
    suku_cadang: 'none',
    rekap_survei: 'view'
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
    suku_cadang: 'manage',
    rekap_survei: 'view'
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
    suku_cadang: 'manage',
    rekap_survei: 'manage'
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
    suku_cadang: 'none',
    rekap_survei: 'none'
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
    suku_cadang: 'none',
    rekap_survei: 'none'
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
    suku_cadang: 'none',
    rekap_survei: 'none'
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
    suku_cadang: 'none',
    rekap_survei: 'none'
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
    suku_cadang: 'none',
    rekap_survei: 'none'
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
    suku_cadang: 'none',
    rekap_survei: 'none'
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
    suku_cadang: 'none',
    rekap_survei: 'propose'
  }
};

// Initial Seed Users: Clean empty database with ONLY the single Admin account
export const SEED_USERS: AppUser[] = [
  {
    id: 'USR-ACT-03',
    nama: 'Aditiya Ahmad Fadila, S.T.',
    email: 'aditiya.ahmad@umc.ac.id',
    passwordSet: true,
    role: 'ACT-03',
    roleName: 'IT Support & Helpdesk Specialist',
    unit: 'PUSDATIN UMC',
    phone: '085964531388',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty: 'Admin Sistem: Pengelolaan Aset, Faktur Penerimaan, Distribusi Pengeluaran, Tiket SLA & Seluruh Menu',
    isFullAccess: true
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
