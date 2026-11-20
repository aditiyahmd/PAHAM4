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
  ApiRegistration,
  SlaConfig,
  DocumentSignatories,
  TicketType,
  ServiceSlaConfig,
  SurveyModuleType,
  SurveyResponse
} from '../types';
import { AccessControlService, SEED_USERS } from './rbac';
import {
  DEFAULT_SLA_CONFIG,
  DEFAULT_SERVICE_SLA_CONFIG,
  NEED_MORE_INFO_AUTO_CLOSE_HOURS,
  REOPEN_WINDOW_HOURS,
  parseFlexibleDate,
  computeSlaEvaluation,
  computeAggregateSlaStats,
  getRuleForTicket,
  isNeedMoreInfoExpired,
  canReopenResolvedTicket
} from './slaService';
import { computeSurveyAverageScore } from './surveyService';

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
  API_REGISTRATIONS: 'pusdatin_api_registrations_v4',
  SLA_CONFIG: 'pusdatin_sla_config_v4',
  SERVICE_SLA_CONFIG: 'pusdatin_service_sla_config_v4',
  SURVEYS: 'pusdatin_csat_surveys_v4',
  SIGNATORIES: 'pusdatin_signatories_v4'
};

const CLEAN_DB_VERSION_KEY = 'pusdatin_clean_db_v5';

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
  if (st === 'Need More Info') return 'Need More Info';
  if (st === 'Diterima') return 'Assigned';
  if (st === 'Perbaikan') return 'In Progress';
  if (st === 'Menunggu Suku Cadang' || st === 'Pending Procurement') return 'Pending – Menunggu Suku Cadang';
  if (st === 'Pending – Menunggu Vendor Eksternal') return 'Pending – Menunggu Vendor Eksternal';
  if (st === 'Selesai') return 'Resolved';
  if (st === 'Closed') return 'Closed – Manual';
  return st as DamageStatus;
};

// Clean Empty Initial Collections (All data cleared except single Admin user)
const INITIAL_ASSETS: Asset[] = [];
const INITIAL_BUKU_PENERIMAAN: BukuPenerimaanItem[] = [];
const INITIAL_BUKU_PENGELUARAN: BukuPengeluaranItem[] = [];
const INITIAL_LOANS: LoanTicket[] = [];
const INITIAL_DAMAGES: DamageTicket[] = [];
const INITIAL_SYSTEM_PROPOSALS: SystemProposal[] = [];
const INITIAL_SURVEYS: SurveyResponse[] = [];
const INITIAL_NOTIFICATIONS: NotificationLog[] = [];
const INITIAL_AUDIT_TRAIL: AuditTrailItem[] = [];

export class AppDatabase {
  private static isMigrating = false;

  /**
   * One-time migration to clean v5 empty database (retaining ONLY the single Admin account).
   */
  public static ensureCleanDatabase(): void {
    if (this.isMigrating) return;
    try {
      if (localStorage.getItem(CLEAN_DB_VERSION_KEY) === 'true') return;
      this.isMigrating = true;
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.DAMAGES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.BUKU_PENERIMAAN, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.BUKU_PENGELUARAN, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SYSTEM_PROPOSALS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.AUDIT_TRAIL, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      localStorage.removeItem(STORAGE_KEYS.KEPALA);
      localStorage.removeItem(STORAGE_KEYS.SIGNATORIES);
      localStorage.setItem(CLEAN_DB_VERSION_KEY, 'true');

      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
          sessionStorage.removeItem('pusdatin_sso_logged_in');
          sessionStorage.removeItem('pusdatin_admin_auth');
        }
      } catch {
        // ignore sessionStorage errors
      }
    } catch {
      // ignore storage errors
    } finally {
      this.isMigrating = false;
    }
  }

  // Storage Helpers
  private static load<T>(key: string, fallback: T): T {
    this.ensureCleanDatabase();
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
    return users.find(u => u.role === 'ACT-03') || users[0] || SEED_USERS[0];
  }

  public static addUser(user: AppUser): void {
    const users = this.getUsers();
    if (!users.some(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase())) {
      this.save(STORAGE_KEYS.USERS, [...users, user]);
    }
  }

  public static upsertUser(user: AppUser): void {
    const sanitized: AppUser = {
      ...user,
      password: undefined,
      passwordSet: Boolean(user.passwordSet)
    };
    const users = this.getUsers();
    const normalizedEmail = sanitized.email.trim().toLowerCase();
    const idx = users.findIndex(
      u => u.id === sanitized.id || u.email.trim().toLowerCase() === normalizedEmail
    );
    if (idx >= 0) {
      const next = [...users];
      next[idx] = { ...next[idx], ...sanitized };
      this.save(STORAGE_KEYS.USERS, next);
    } else {
      this.save(STORAGE_KEYS.USERS, [...users, sanitized]);
    }
  }

  public static replaceUsers(users: AppUser[]): void {
    if (!Array.isArray(users) || users.length === 0) return;
    const sanitized = users.map(u => ({
      ...u,
      password: undefined,
      passwordSet: Boolean(u.passwordSet)
    }));
    this.save(STORAGE_KEYS.USERS, sanitized);
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
    const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (found && found.statusAkun !== 'Nonaktif') {
      if (password && found.password && found.passwordSet !== false && found.password === password) {
        return found;
      }
    }
    return null;
  }

  public static setUserPassword(userId: string, newPassword: string): AppUser | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    const trimmed = (newPassword || '').trim();
    if (!trimmed) return null;
    users[idx] = {
      ...users[idx],
      password: newPassword,
      passwordSet: true
    };
    this.save(STORAGE_KEYS.USERS, users);
    return users[idx];
  }

  public static addTechnician(tech: Partial<AppUser> & { name?: string }): boolean {
    const users = this.getUsers();
    const id = tech.id || `USR-${Date.now()}`;
    const email = (tech.email || `petugas${users.length + 1}@umc.ac.id`).trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === email)) {
      return false;
    }
    const rawRoleName = (tech.roleName || 'IT Support & Helpdesk Specialist').trim();
    const lowerRole = rawRoleName.toLowerCase();
    let inferredRole: ActorCode = (tech.role as ActorCode) || 'ACT-04';
    if (!tech.role) {
      if (lowerRole.includes('pimpinan universitas') || lowerRole.includes('rektor')) inferredRole = 'ACT-01';
      else if (lowerRole.includes('kepala pusdatin')) inferredRole = 'ACT-02';
      else if (tech.isFullAccess || lowerRole.includes('helpdesk') || lowerRole.includes('it support')) inferredRole = 'ACT-03';
      else if (lowerRole.includes('analyst') || lowerRole.includes('data')) inferredRole = 'ACT-05';
      else if (lowerRole.includes('lead')) inferredRole = 'ACT-06';
      else if (lowerRole.includes('frontend')) inferredRole = 'ACT-07';
      else if (lowerRole.includes('backend') || lowerRole.includes('programmer')) inferredRole = 'ACT-08';
      else if (lowerRole.includes('security') || lowerRole.includes('cyber')) inferredRole = 'ACT-09';
      else if (lowerRole.includes('civitas') || lowerRole.includes('dosen') || lowerRole.includes('mahasiswa') || lowerRole.includes('karyawan')) inferredRole = 'ACT-10';
      else inferredRole = 'ACT-04';
    }
    const explicitPass = tech.password && tech.password.trim() ? tech.password.trim() : undefined;
    const newUser: AppUser = {
      id,
      nama: tech.nama || tech.name || 'Pengguna Baru',
      email,
      role: inferredRole,
      roleName: rawRoleName as TechnicianRole,
      unit: tech.unit || 'PUSDATIN UMC',
      phone: tech.phone || '081234567890',
      statusAkun: tech.statusAkun || 'Aktif',
      sumberData: tech.sumberData || 'SSO Google',
      civitasType: tech.civitasType,
      password: explicitPass,
      passwordSet: Boolean(explicitPass),
      specialty: tech.specialty || '',
      isFullAccess: tech.isFullAccess || inferredRole === 'ACT-02' || inferredRole === 'ACT-03',
      level: tech.level
    };
    this.save(STORAGE_KEYS.USERS, [...users, newUser]);
    return true;
  }

  public static updateTechnician(tech: Partial<AppUser> & { id: string; name?: string }): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === tech.id);
    if (idx === -1) return false;
    const nextEmail = tech.email ? tech.email.trim().toLowerCase() : users[idx].email;
    const nextPassword = tech.password && tech.password.trim() ? tech.password.trim() : users[idx].password;
    users[idx] = {
      ...users[idx],
      nama: tech.nama || tech.name || users[idx].nama,
      roleName: (tech.roleName || users[idx].roleName) as TechnicianRole,
      role: (tech.role as ActorCode) || users[idx].role,
      email: nextEmail,
      unit: tech.unit ?? users[idx].unit,
      phone: tech.phone || users[idx].phone,
      statusAkun: tech.statusAkun || users[idx].statusAkun,
      sumberData: tech.sumberData || users[idx].sumberData,
      civitasType: tech.role && tech.role !== 'ACT-10' ? undefined : (tech.civitasType ?? users[idx].civitasType),
      password: nextPassword,
      passwordSet: tech.passwordSet ?? Boolean(nextPassword && nextPassword.trim().length > 0),
      specialty: tech.specialty ?? users[idx].specialty,
      isFullAccess: tech.isFullAccess ?? users[idx].isFullAccess,
      level: tech.level ?? users[idx].level
    };
    this.save(STORAGE_KEYS.USERS, users);
    return true;
  }

  public static toggleUserStatus(id: string): AppUser | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const nextStatus = users[idx].statusAkun === 'Aktif' ? 'Nonaktif' : 'Aktif';
    users[idx] = { ...users[idx], statusAkun: nextStatus };
    this.save(STORAGE_KEYS.USERS, users);
    return users[idx];
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

  public static generateUniqueBarcode(existingAssets?: Asset[]): string {
    const assets = existingAssets || this.getAssets();
    const existingSet = new Set(assets.map(a => a.barcode));
    for (let attempt = 0; attempt < 25; attempt++) {
      const randomPrefix = Math.floor(1000000 + Math.random() * 9000000);
      let sum = 0;
      const strCode = randomPrefix.toString();
      for (let j = 0; j < 7; j++) {
        const d = parseInt(strCode.charAt(j), 10);
        sum += j % 2 === 0 ? d * 3 : d * 1;
      }
      const checksum = (10 - (sum % 10)) % 10;
      const candidate = strCode + checksum.toString();
      if (!existingSet.has(candidate)) return candidate;
    }
    return String(Date.now()).slice(-8);
  }

  public static generateNextUniqueAssetCode(existingAssets?: Asset[]): string {
    const assets = existingAssets || this.getAssets();
    const year = new Date().getFullYear();
    const prefix = `AST-UMC-${year}-`;
    let maxSeq = assets.length;
    for (const a of assets) {
      if (a.kodeUnikAset && a.kodeUnikAset.startsWith(prefix)) {
        const tail = parseInt(a.kodeUnikAset.slice(prefix.length), 10);
        if (!Number.isNaN(tail) && tail < 100000 && tail > maxSeq) {
          maxSeq = tail;
        }
      }
    }
    const existingCodes = new Set(assets.map(a => a.kodeUnikAset));
    let seq = maxSeq + 1;
    let candidate = `${prefix}${String(seq).padStart(3, '0')}`;
    while (existingCodes.has(candidate)) {
      seq += 1;
      candidate = `${prefix}${String(seq).padStart(3, '0')}`;
    }
    return candidate;
  }

  public static addAsset(asset: Asset): Asset {
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'registrasi_aset_qr', ['manage'], 'Mendaftarkan unit aset baru');

    const assets = this.getAssets();
    // BR-001: Kode Unik Aset sebagai pengenal utama, tidak dapat diubah
    const barcode = (asset.barcode || '').trim() || this.generateUniqueBarcode(assets);
    const kodeUnikAset = (asset.kodeUnikAset || '').trim() || this.generateNextUniqueAssetCode(assets);
    const newAsset: Asset = {
      ...asset,
      barcode,
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

    return newAsset;
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
  public static addLoan(
    loan: Omit<LoanTicket, 'id' | 'status' | 'tglAju'> & { customNowMs?: number }
  ): LoanTicket {
    const { customNowMs, ...loanPayload } = loan;
    const loans = this.getLoans();
    const active = this.getActiveUser();
    const nowMs = customNowMs ?? Date.now();
    const nowDate = new Date(nowMs);
    const nowIso = nowDate.toISOString();
    const dateCode = nowIso.split('T')[0].replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const id = `PJM-${dateCode}-${rand}`;
    const serviceSla = this.getServiceSlaConfig();

    const newTicket: LoanTicket = {
      ...loanPayload,
      id,
      status: 'Diajukan',
      tglAju: nowDate.toLocaleString('id-ID'),
      createdAtIso: loanPayload.createdAtIso || nowIso,
      approvalTargetMinutes: loanPayload.approvalTargetMinutes ?? serviceSla.loan.approvalTargetMinutes,
      fulfillmentTargetHours: loanPayload.fulfillmentTargetHours ?? serviceSla.loan.fulfillmentTargetHours
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
      completeHandover?: boolean;
      customNowMs?: number;
    }
  ): { success: boolean; message: string; ticket?: LoanTicket } {
    const nowMs = data.customNowMs ?? Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const active = this.getActiveUser();
    AccessControlService.enforce(active, 'peminjaman_aset', ['manage', 'approve'], `Memproses peminjaman (${action})`);

    const loans = this.getLoans();
    const index = loans.findIndex(l => l.id === id);
    if (index === -1) return { success: false, message: 'Tiket peminjaman tidak ditemukan!' };

    const loan = loans[index];
    const statusLama = loan.status;
    const signatories = this.getDocumentSignatories();

    // C.2 & C.4 Unified: Setujui Pinjaman (ketika completeHandover = true langsung serahkan fisik; jika false/default jaga kompatibilitas 2 langkah)
    if (action === 'terima' || action === 'konfirmasi-alokasi') {
      const allocatedAsset = data.barcode ? this.getAssetByBarcodeOrUnique(data.barcode) : undefined;
      const handover = data.metodePengambilan || loan.metodePengambilan || 'Diambil di Ruang PUSDATIN';
      const schedule = data.jadwalPengambilan || `${data.tglAmbil || loan.tglPinjam} pukul 09:00 WIB`;
      const isDirectHandover = action === 'terima' && data.completeHandover === true;

      if (isDirectHandover) {
        const nomorSurat = loan.nomorSuratPeminjaman || `SP-PUSDATIN/${new Date().getFullYear()}/XI/${loan.id.slice(-4)}`;
        const resolvedBarcode = allocatedAsset?.barcode || data.barcode || loan.barcode;
        const resolvedKodeUnik = allocatedAsset?.kodeUnikAset || data.kodeUnikAset || loan.kodeUnikAset;
        const resolvedNama = allocatedAsset?.nama || data.namaBarang || loan.namaBarangT || loan.barangPinjaman;

        loans[index] = {
          ...loan,
          status: 'Diserahkan',
          barcode: resolvedBarcode,
          kodeUnikAset: resolvedKodeUnik,
          namaBarangT: resolvedNama,
          kondisi: data.kondisi || 'Baik / Lengkap dengan Charger & Tas',
          petugas: data.petugas || active.nama,
          catatan: data.catatan || 'Peminjaman disetujui dan aset resmi diserahkan dengan Surat Peminjaman.',
          tglAmbil: data.tglAmbil || new Date().toISOString().split('T')[0],
          metodePengambilan: handover,
          jadwalPengambilan: schedule,
          lokasiPengambilan: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
          nomorSuratPeminjaman: nomorSurat,
          approvedAtIso: loan.approvedAtIso || nowIso,
          approvedBy: loan.approvedBy || data.petugas || active.nama,
          fulfilledAtIso: loan.fulfilledAtIso || nowIso,
          fulfilledBy: data.petugas || active.nama,
          penandatangan: {
            peminjam: loan.peminjam,
            petugas: data.petugas || active.nama,
            kepalaPusdatin: signatories.kepalaPusdatinNama
          }
        };
        this.save(STORAGE_KEYS.LOANS, loans);

        if (allocatedAsset) {
          this.updateAssetStatus(
            allocatedAsset.barcode,
            'Dipinjam',
            loan.unit,
            true,
            `Dipinjam oleh ${loan.peminjam} (${loan.unit}) - Surat: ${nomorSurat}`
          );

          const pengeluaranList = this.getBukuPengeluaran();
          if (!pengeluaranList.some(o => o.idTiketPeminjaman === loan.id)) {
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
              keterangan: `Pengeluaran otomatis dipicu oleh persetujuan & penyerahan peminjaman Surat ${nomorSurat}`,
              petugas: data.petugas || active.nama
            };
            this.save(STORAGE_KEYS.BUKU_PENGELUARAN, [newOut, ...pengeluaranList]);
          }
        }

        this.addNotification({
          tujuan: loan.kontak,
          namaPenerima: loan.peminjam,
          kanal: 'WhatsApp',
          jenisNotifikasi: 'Peminjaman Diserahkan',
          statusKirim: 'sent',
          pesanPreview: `Pengajuan peminjaman ${loan.id} DISETUJUI & DISERAHKAN. Unit: ${resolvedNama} (${resolvedBarcode || '-'}). Surat: ${nomorSurat}.`
        });

        this.addAuditTrail({
          entityType: 'Peminjaman Aset',
          entityId: loan.id,
          statusLama,
          statusBaru: 'Diserahkan',
          catatan: `Admin ${active.nama} menyetujui peminjaman & menyerahkan unit ${resolvedNama} (${resolvedBarcode || '-'}). Surat ${nomorSurat} diterbitkan.`,
          idPengguna: active.id,
          namaPengguna: active.nama,
          rolePengguna: active.roleName
        });

        return {
          success: true,
          message: `Peminjaman ${loan.id} DISETUJUI & DISERAHKAN! Status aset menjadi Dipinjam, tercatat di Buku Pengeluaran, dan Surat Peminjaman diterbitkan.`,
          ticket: loans[index]
        };
      }

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
        lokasiPengambilan: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
        approvedAtIso: loan.approvedAtIso || nowIso,
        approvedBy: loan.approvedBy || data.petugas || active.nama
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
          kepalaPusdatin: signatories.kepalaPusdatinNama
        },
        tglAmbil: data.tglAmbil || new Date().toISOString().split('T')[0],
        catatan: data.catatan || 'Aset telah diserahkan resmi dengan Surat Peminjaman resmi.',
        approvedAtIso: loan.approvedAtIso || nowIso,
        approvedBy: loan.approvedBy || data.petugas || active.nama,
        fulfilledAtIso: loan.fulfilledAtIso || nowIso,
        fulfilledBy: data.petugas || active.nama
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
        if (!pengeluaranList.some(o => o.idTiketPeminjaman === loan.id)) {
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
        catatan: reason,
        approvedAtIso: loan.approvedAtIso || nowIso,
        approvedBy: loan.approvedBy || data.petugas || active.nama
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
  public static getDamageTickets(customNowMs?: number): DamageTicket[] {
    const raw = this.load<DamageTicket[]>(STORAGE_KEYS.DAMAGES, INITIAL_DAMAGES);
    const slaConfig = this.getSlaConfig();
    const nowMs = customNowMs ?? Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const nowDisplay = new Date(nowMs).toLocaleString('id-ID');
    let hasAutoCloseMutations = false;

    const evaluated = raw.map(t => {
      const normalizedStatus = normalizeDamageStatus(t.status);
      let updatedStatus = normalizedStatus;
      let autoCloseExtras: Partial<DamageTicket> = {};

      // 3e: Auto-Close 3x24 jam (72 jam) jika pelapor tidak melengkapi info pada status Need More Info
      if (normalizedStatus === 'Need More Info' && isNeedMoreInfoExpired(t, nowMs)) {
        updatedStatus = 'Closed – Auto';
        hasAutoCloseMutations = true;
        autoCloseExtras = {
          closedMode: 'Auto',
          closedBySystem: true,
          resolvedAt: nowIso,
          resolvedAtIso: nowIso,
          waktuSelesai: nowDisplay,
          slaPausedAtIso: undefined,
          slaPauseReason: undefined,
          resolusiAkhir:
            t.resolusiAkhir ||
            'Tiket ditutup otomatis oleh sistem karena pelapor tidak melengkapi informasi tambahan dalam batas 3x24 jam (72 jam).',
          riwayatStatus: [
            ...(t.riwayatStatus || []),
            {
              status: 'Closed – Auto',
              timestamp: nowDisplay,
              catatan: `Auto-Close Sistem (3x24 Jam): Tidak ada balasan kelengkapan info dari pelapor sejak ${t.needMoreInfoAtIso || 'permintaan info'}.`,
              petugas: 'Sistem PAHAM (Auto-Close)'
            }
          ]
        };
      }

      // BR-008: Mekanisme 2 hari kerja penutupan otomatis (Closed – Auto) untuk tiket Resolved
      if (updatedStatus === 'Resolved' && (t.resolvedAtIso || t.resolvedAt)) {
        const resolvedDate = parseFlexibleDate(t.resolvedAtIso || t.resolvedAt);
        const twoWorkDaysMs = 48 * 60 * 60 * 1000;
        if (resolvedDate && nowMs - resolvedDate.getTime() > twoWorkDaysMs) {
          updatedStatus = 'Closed – Auto';
          hasAutoCloseMutations = true;
          autoCloseExtras = {
            closedMode: 'Auto',
            closedBySystem: true
          };
        }
      }

      const candidateTicket: DamageTicket = {
        ...t,
        ...autoCloseExtras,
        ticketType: t.ticketType || 'Incident',
        status: updatedStatus
      };

      const evaluation = computeSlaEvaluation(candidateTicket, slaConfig, nowMs);

      return {
        ...candidateTicket,
        frtTargetMinutes: t.frtTargetMinutes ?? evaluation.frtTargetMinutes,
        rtTargetHours: t.rtTargetHours ?? evaluation.rtTargetHours,
        slaTargetHours: t.slaTargetHours || evaluation.rtTargetHours,
        slaStatus: evaluation.overallSlaStatus,
        eskalasiPusdatin: evaluation.overallSlaStatus === 'Overdue' ? true : t.eskalasiPusdatin
      };
    });

    if (hasAutoCloseMutations) {
      this.save(STORAGE_KEYS.DAMAGES, evaluated);
    }

    return evaluated;
  }

  // B.1 Pembuatan Tiket oleh User via SSO Google (BR-006)
  public static addDamageTicket(
    ticket: Omit<DamageTicket, 'id' | 'status' | 'tanggalLapor' | 'slaDeadline' | 'slaTargetHours'> & {
      customNowMs?: number;
    }
  ): DamageTicket {
    const { customNowMs, ...ticketPayload } = ticket;
    const tickets = this.getDamageTickets(customNowMs);
    const active = this.getActiveUser();
    const nowMs = customNowMs ?? Date.now();
    const now = new Date(nowMs);
    const nowIso = now.toISOString();
    const nowDisplay = now.toLocaleString('id-ID');
    const dateCode = nowIso.split('T')[0].replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const ticketType: TicketType = ticketPayload.ticketType || 'Incident';
    const prefix = ticketType === 'Problem' ? 'PRB' : ticketType === 'RFC' ? 'RFC' : 'TKT';
    const id = `${prefix}-${dateCode}-${rand}`;

    const slaConfig = this.getSlaConfig();
    const urg: TicketUrgency = (ticketPayload.prioritas || ticketPayload.urgensi || 'Sedang') as TicketUrgency;
    const rule = getRuleForTicket({ ticketType, urgensi: urg, prioritas: urg }, slaConfig);
    const slaHours = ticketPayload.rtTargetHours ?? rule.rtTargetHours;
    const frtTargetMinutes = ticketPayload.frtTargetMinutes ?? rule.frtTargetMinutes;

    // 3a: RT SLA belum dimulai sebelum Admin memproses Tahap 2 & memilih urgensi
    const slaDeadline = ticketPayload.slaStartedAtIso
      ? new Date(
          (parseFlexibleDate(ticketPayload.slaStartedAtIso)?.getTime() ?? nowMs) + slaHours * 3600000
        ).toISOString()
      : 'Menunggu Tahap 2';

    // BR-007: Distribusi otomatis awal berdasarkan kategori/PIC
    const picMatch = this.determinePic(
      `${ticketPayload.kategoriMasalah} ${ticketPayload.namaBarang} ${ticketPayload.deskripsi}`
    );

    const newTicket: DamageTicket = {
      ...ticketPayload,
      id,
      ticketType,
      status: 'Open/Unassigned',
      tanggalLapor: nowDisplay,
      createdAtIso: nowIso,
      frtTargetMinutes,
      rtTargetHours: slaHours,
      slaTargetHours: slaHours,
      slaDeadline,
      slaPausedTotalMs: 0,
      slaStatus: 'On Track',
      picTeknisi: ticketPayload.picTeknisi || picMatch.role,
      namaPicTeknisi: ticketPayload.namaPicTeknisi || picMatch.name,
      urgensi: urg,
      riwayatStatus: [
        {
          status: 'Open/Unassigned',
          timestamp: nowDisplay,
          catatan: `Laporan ${ticketType} diterbitkan (${id}). FRT target: ${frtTargetMinutes} Menit. RT SLA (${slaHours} Jam) akan mulai dihitung saat Admin memproses Tahap 2 & menetapkan urgensi.`,
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
      pesanPreview: `Tiket ${id} (${ticketType}) berhasil dibuat. Target FRT ${frtTargetMinutes} menit / RT ${slaHours} jam (mulai aktif pada Tahap 2).`
    });

    this.addAuditTrail({
      entityType: 'Tiket Helpdesk',
      entityId: id,
      statusLama: 'None',
      statusBaru: 'Open/Unassigned',
      catatan: `Pembuatan tiket ${ticketType} oleh ${newTicket.pelapor} (${newTicket.kategoriMasalah}). FRT: ${frtTargetMinutes} mnt, RT: ${slaHours} jam.`,
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
    const active = this.getActiveUser();
    if (active.role !== 'ACT-02' && active.role !== 'ACT-03') {
      return false;
    }
    const tickets = this.getDamageTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const t = tickets[idx];
    const rule = getRuleForTicket({ ticketType: t.ticketType || 'Incident', urgensi, prioritas: urgensi }, this.getSlaConfig());
    const rtHours = t.ticketType === 'Problem' || t.ticketType === 'RFC' ? rule.rtTargetHours : rule.rtTargetHours;
    const startMs = parseFlexibleDate(t.slaStartedAtIso || t.tanggalDitugaskan)?.getTime();
    const newDeadlineIso = startMs
      ? new Date(startMs + rtHours * 3600000 + (t.slaPausedTotalMs || 0)).toISOString()
      : t.slaDeadline || 'Menunggu Tahap 2';

    tickets[idx] = {
      ...t,
      prioritas: urgensi,
      urgensi,
      frtTargetMinutes: rule.frtTargetMinutes,
      rtTargetHours: rtHours,
      slaTargetHours: rtHours,
      slaDeadline: newDeadlineIso
    };
    this.save(STORAGE_KEYS.DAMAGES, tickets);
    return true;
  }

  // B.2, B.3, B.4, B.5: Proses Tiket Kerusakan oleh Admin & Teknisi (Termasuk SLA ITIL 3a-3f)
  public static processDamageTicket(
    id: string,
    action:
      | 'distribusi-pic'
      | 'need-info'
      | 'reply-need-info'
      | 'jadwalkan-perbaikan'
      | 'butuh-suku-cadang'
      | 'vendor-eksternal'
      | 'lanjut-perbaikan'
      | 'eskalasi-problem-rfc'
      | 'approve-problem-escalation'
      | 'reject-problem-escalation'
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
      vendorEksternalNama?: string;
      vendorEksternalTiket?: string;
      workaround?: string;
      targetTicketType?: 'Problem' | 'RFC';
      problemJudul?: string;
      problemTargetHours?: number;
      customNowMs?: number;
    }
  ): { success: boolean; message: string; ticket?: DamageTicket; createdProblemTicket?: DamageTicket } {
    let effAction: string = action;
    if (action === 'jadwalkan-inspeksi') effAction = 'jadwalkan-perbaikan';
    else if (action === 'perbaikan' || action === 'lanjut-perbaikan') effAction = 'lanjut-perbaikan';
    else if (action === 'suku-cadang') effAction = 'butuh-suku-cadang';
    else if (action === 'selesai') effAction = 'selesai-perbaikan';
    else if (action === 'rusak-total') effAction = 'tidak-layak';
    else if (action === 'ubah-pic' || action === 'delegasikan' || action === 'verifikasi-delegasi') effAction = 'distribusi-pic';

    const active = this.getActiveUser();
    const isReporterAction =
      effAction === 'reply-need-info' ||
      effAction === 're-open' ||
      effAction === 'tutup-manual';
    if (isReporterAction && active.role === 'ACT-10') {
      AccessControlService.enforce(
        active,
        'buat_tiket',
        ['propose', 'manage'],
        `Konfirmasi / lengkapi tiket oleh pelapor (${effAction})`
      );
    } else {
      AccessControlService.enforce(
        active,
        effAction === 'distribusi-pic' ? 'distribusi_tiket' : 'tindakan_perbaikan',
        ['manage', 'execute', 'verify', 'propose'],
        `Memproses tiket kerusakan (${effAction})`
      );
    }

    const nowMs = options.customNowMs ?? Date.now();
    const tickets = this.getDamageTickets(nowMs);
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return { success: false, message: 'Tiket kerusakan tidak ditemukan!' };

    const ticket = tickets[index];
    const statusLama = ticket.status;
    const now = new Date(nowMs);
    const nowIso = now.toISOString();
    const nowStr = now.toLocaleString('id-ID');
    const operator = options.petugasName || active.nama;
    const asset = ticket.barcode ? this.getAssetByBarcodeOrUnique(ticket.barcode) : undefined;
    const slaConfig = this.getSlaConfig();

    // Helper untuk menghentikan pause aktif dan mengakumulasi durasi pause + menggeser slaDeadline
    const settleActivePause = (t: DamageTicket): Partial<DamageTicket> => {
      if (!t.slaPausedAtIso) return {};
      const pausedAt = parseFlexibleDate(t.slaPausedAtIso);
      const deltaMs = pausedAt ? Math.max(0, nowMs - pausedAt.getTime()) : 0;
      const newTotalPauseMs = (t.slaPausedTotalMs || 0) + deltaMs;
      const updatedHistory = (t.slaPauseHistory || []).map((h, i, arr) =>
        i === arr.length - 1 && !h.resumedAtIso
          ? { ...h, resumedAtIso: nowIso, durationMs: deltaMs }
          : h
      );
      const prevDeadline = parseFlexibleDate(t.slaDeadline);
      const shiftedDeadline = prevDeadline
        ? new Date(prevDeadline.getTime() + deltaMs).toISOString()
        : t.slaDeadline;

      return {
        slaPausedAtIso: undefined,
        slaPauseReason: undefined,
        slaPausedTotalMs: newTotalPauseMs,
        slaPauseHistory: updatedHistory,
        slaDeadline: shiftedDeadline
      };
    };

    // Auto-stamp First Response Time (FRT) upon first admin/technical action
    const firstResponseStamp =
      effAction !== 're-open' && effAction !== 'reply-need-info' && !ticket.firstResponseAtIso
        ? {
            firstResponseAtIso: nowIso,
            firstResponseBy: operator
          }
        : {};

    // 3e: Admin mengembalikan tiket ke pengguna (Need More Info) -> SLA RT tidak berjalan / terjeda
    if (effAction === 'need-info') {
      const note =
        (options.catatan || options.catatanAdmin || '').trim() ||
        'Mohon lengkapi bukti pendukung / tangkapan layar kendala agar dapat diproses ke Tahap 2.';
      const deadlineIso = new Date(nowMs + NEED_MORE_INFO_AUTO_CLOSE_HOURS * 3600000).toISOString();
      const pausePayload =
        ticket.slaStartedAtIso && !ticket.slaPausedAtIso
          ? {
              slaPausedAtIso: nowIso,
              slaPauseReason: 'Menunggu Informasi Tambahan dari Pelapor (Need More Info)',
              slaPauseHistory: [
                ...(ticket.slaPauseHistory || []),
                {
                  reason: 'Need More Info (Pelapor)',
                  pausedAtIso: nowIso
                }
              ]
            }
          : {};

      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...pausePayload,
        status: 'Need More Info',
        needMoreInfoAtIso: nowIso,
        needMoreInfoDeadlineIso: deadlineIso,
        needMoreInfoNote: note,
        catatanAdmin: note,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Need More Info',
            timestamp: nowStr,
            catatan: `Tiket dikembalikan ke pelapor (Need More Info): ${note}. Batas Auto-Close: 3x24 jam.`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Need More Info',
        catatan: `Dikembalikan ke pelapor (Need More Info): ${note}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Tiket ${ticket.id} dikembalikan ke pelapor (Need More Info). SLA Penyelesaian tidak berjalan & Auto-Close aktif dalam 3x24 jam.`,
        ticket: tickets[index]
      };
    }

    // 3e: Pelapor membalas permintaan informasi tambahan (Need More Info -> Open/Unassigned atau In Progress)
    if (effAction === 'reply-need-info') {
      if (ticket.status !== 'Need More Info') {
        return { success: false, message: 'Tiket tidak berada pada status Need More Info.' };
      }
      const replyText = (options.catatan || '').trim() || 'Informasi tambahan dan bukti telah dilengkapi oleh pelapor.';
      const resumed = ticket.slaStartedAtIso ? settleActivePause(ticket) : {};
      const nextStatus: DamageStatus = ticket.slaStartedAtIso ? 'In Progress' : 'Open/Unassigned';

      tickets[index] = {
        ...ticket,
        ...resumed,
        status: nextStatus,
        needMoreInfoReply: replyText,
        needMoreInfoRepliedAtIso: nowIso,
        catatanAdmin: `Balasan pelapor (${nowStr}): ${replyText}`,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: nextStatus,
            timestamp: nowStr,
            catatan: `Pelapor melengkapi data (Need More Info dibalas): ${replyText}`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: nextStatus,
        catatan: `Pelapor melengkapi informasi tambahan: ${replyText}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Informasi tambahan untuk tiket ${ticket.id} tersimpan! Status kembali ke ${nextStatus}.`,
        ticket: tickets[index]
      };
    }

    // Tahap 5: Lanjut Perbaikan (resume dari Tahap 4.a Suku Cadang atau 4.b Vendor Eksternal)
    if (effAction === 'lanjut-perbaikan') {
      const resumed = settleActivePause(ticket);
      const startIso = ticket.slaStartedAtIso || nowIso;
      const pauseNote =
        resumed.slaPausedTotalMs && ticket.slaPauseReason
          ? ` (SLA dilanjutkan; durasi jeda ${ticket.slaPauseReason} telah dikeluarkan dari perhitungan RT).`
          : '';

      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumed,
        slaStartedAtIso: startIso,
        status: 'In Progress',
        catatanAdmin: options.catatan || options.catatanAdmin || 'Perbaikan dilanjutkan oleh teknisi (Tahap 5).',
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'In Progress',
            timestamp: nowStr,
            catatan: `Tahap 5: Perbaikan dilanjutkan oleh ${operator}.${pauseNote}`,
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
        catatan: `Perbaikan dilanjutkan oleh ${operator}${pauseNote}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });
      return { success: true, message: `Perbaikan tiket ${ticket.id} dilanjutkan (SLA aktif kembali)!`, ticket: tickets[index] };
    }

    // B.2 (Tahap 2): Verifikasi Kelengkapan, Urgensi & Distribusi PIC -> Memulai Hitungan SLA RT (3a)
    if (effAction === 'distribusi-pic') {
      const matchedById = options.targetTechnicianId
        ? this.getUsers().find(u => u.id === options.targetTechnicianId)
        : undefined;
      const targetRole = (
        matchedById?.roleName ||
        options.picTeknisiBaru ||
        ticket.picTeknisi ||
        'IT Support & Helpdesk Specialist'
      ) as TechnicianRole;
      const matched = matchedById || this.getUsers().find(u => u.roleName === targetRole);
      const techName = options.namaPicBaru || matched?.nama || targetRole;

      const selectedUrgency: TicketUrgency = (options.urgensiBaru || ticket.urgensi || ticket.prioritas || 'Sedang') as TicketUrgency;
      const rule = getRuleForTicket(
        { ticketType: ticket.ticketType || 'Incident', urgensi: selectedUrgency, prioritas: selectedUrgency },
        slaConfig
      );
      const rtTargetHours = ticket.rtTargetHours && (ticket.ticketType === 'Problem' || ticket.ticketType === 'RFC')
        ? ticket.rtTargetHours
        : rule.rtTargetHours;

      // 3a: Jam mulai SLA RT ditetapkan tepat saat Admin memproses Tahap 2
      const slaStartedAtIso = ticket.slaStartedAtIso || nowIso;
      const slaStartMs = parseFlexibleDate(slaStartedAtIso)?.getTime() ?? nowMs;
      const resumed = ticket.slaPausedAtIso ? settleActivePause(ticket) : {};
      const accumulatedPause = resumed.slaPausedTotalMs ?? ticket.slaPausedTotalMs ?? 0;
      const deadlineIso = new Date(slaStartMs + rtTargetHours * 3600000 + accumulatedPause).toISOString();

      const noteText =
        options.catatan ||
        options.catatanAdmin ||
        (action === 'delegasikan'
          ? `Tiket didelegasikan ke ${targetRole} (${techName}) oleh ${operator}.`
          : `Tahap 2 disetujui oleh ${operator}. Urgensi: ${selectedUrgency} (SLA RT ${rtTargetHours} jam dimulai). PIC: ${targetRole}.`);

      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumed,
        status: 'Assigned',
        prioritas: selectedUrgency,
        urgensi: selectedUrgency,
        frtTargetMinutes: rule.frtTargetMinutes,
        rtTargetHours,
        slaTargetHours: rtTargetHours,
        slaStartedAtIso,
        slaDeadline: deadlineIso,
        picTeknisi: targetRole,
        namaPicTeknisi: techName,
        assignedTechnicianId: matched?.id,
        tanggalDitugaskan: ticket.tanggalDitugaskan || nowIso,
        kategoriMasalah: options.kategoriMasalah || ticket.kategoriMasalah,
        jenisAset: (options.jenisAset as any) || ticket.jenisAset,
        ...(action === 'delegasikan'
          ? {
              delegasiKeTechnicianId: matched?.id,
              namaDelegasiTeknisi: techName,
              delegasiDari: active.nama,
              tanggalDelegasi: nowStr,
              catatanDelegasi: noteText
            }
          : {}),
        catatanAdmin: noteText,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Assigned',
            timestamp: nowStr,
            catatan:
              action === 'delegasikan'
                ? `Delegasi tiket ke ${targetRole} (${techName}) oleh ${operator}.`
                : `Tahap 2: Urgensi ditetapkan "${selectedUrgency}" & didistribusikan ke ${targetRole} (${techName}). Hitungan SLA RT (${rtTargetHours} jam) dimulai.`,
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
        pesanPreview: `Tiket ${ticket.id} telah masuk Tahap 2 (Urgensi: ${selectedUrgency}, Target RT: ${rtTargetHours} jam) & ditugaskan ke ${techName}.`
      });

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Assigned',
        catatan:
          action === 'delegasikan'
            ? `Delegasi tiket ke ${targetRole} (${techName}) oleh ${operator}`
            : `Tahap 2: Urgensi ${selectedUrgency}, PIC ${targetRole} (${techName}) — SLA RT dimulai.`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message:
          action === 'delegasikan'
            ? `Tiket ${ticket.id} berhasil didelegasikan ke ${targetRole} (${techName})!`
            : `Tahap 2 selesai! Urgensi ${selectedUrgency} & SLA RT (${rtTargetHours} jam) dimulai.`,
        ticket: tickets[index]
      };
    }

    // B.3: Penjadwalan & Tindakan Perbaikan (In Progress)
    if (effAction === 'jadwalkan-perbaikan') {
      const resumed = settleActivePause(ticket);
      const schedule = options.jadwalPemeriksaan || `${nowStr} (Pemeriksaan Segera)`;
      const startIso = ticket.slaStartedAtIso || nowIso;
      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumed,
        slaStartedAtIso: startIso,
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

    // B.4 (3b): Tahap 4.a Penanganan Suku Cadang (Pending – Menunggu Suku Cadang) -> JEDA (PAUSE) SLA RT
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

      const resumedPrev = ticket.slaPausedAtIso ? settleActivePause(ticket) : {};
      const pauseReason = 'Menunggu Suku Cadang (Tahap 4.a)';
      const newHistory = [
        ...(resumedPrev.slaPauseHistory || ticket.slaPauseHistory || []),
        {
          reason: pauseReason,
          pausedAtIso: nowIso
        }
      ];

      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumedPrev,
        slaStartedAtIso: ticket.slaStartedAtIso || ticket.tanggalDitugaskan || ticket.createdAtIso || nowIso,
        slaPausedAtIso: nowIso,
        slaPauseReason: pauseReason,
        slaPauseHistory: newHistory,
        status: 'Pending – Menunggu Suku Cadang',
        cabangPerbaikan: 'Butuh Suku Cadang',
        kategoriPerbaikan: options.kategoriPerbaikan || 'Suku Cadang (Perlu Anggaran)',
        namaSukuCadang: parts.join(', '),
        sukuCadangList: partItems,
        sumberAnggaran: options.sumberAnggaran || 'Stok Internal PUSDATIN',
        catatanAdmin: options.catatan || `Tahap 4.a (SLA Terjeda): Menunggu pengadaan suku cadang: ${parts.join(', ')}`,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Pending – Menunggu Suku Cadang',
            timestamp: nowStr,
            catatan: `Tahap 4.a: Kebutuhan suku cadang ${parts.join(', ')} (Status: Diminta). Jam SLA terjeda (Paused) sampai Tahap 5.`,
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
        pesanPreview: `Tiket ${ticket.id} membutuhkan suku cadang: ${parts.join(', ')}. Timer SLA terjeda selama proses pengadaan.`
      });

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Pending – Menunggu Suku Cadang',
        catatan: `Tahap 4.a: ${parts.length} suku cadang dicatat. Timer SLA dijeda (Paused).`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Tiket ${ticket.id} masuk Tahap 4.a (Pending Suku Cadang) & SLA terjeda hingga Tahap 5!`,
        ticket: tickets[index]
      };
    }

    // 3c: Tahap Vendor Eksternal (Pending – Menunggu Vendor Eksternal) -> JEDA (PAUSE) SLA RT
    if (effAction === 'vendor-eksternal') {
      const vendorNama = (options.vendorEksternalNama || '').trim() || 'ISP / Vendor Eksternal';
      const vendorTiket = (options.vendorEksternalTiket || '').trim() || '-';
      const resumedPrev = ticket.slaPausedAtIso ? settleActivePause(ticket) : {};
      const pauseReason = `Menunggu Vendor Eksternal (${vendorNama})`;
      const newHistory = [
        ...(resumedPrev.slaPauseHistory || ticket.slaPauseHistory || []),
        {
          reason: pauseReason,
          pausedAtIso: nowIso
        }
      ];

      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumedPrev,
        slaStartedAtIso: ticket.slaStartedAtIso || ticket.tanggalDitugaskan || ticket.createdAtIso || nowIso,
        slaPausedAtIso: nowIso,
        slaPauseReason: pauseReason,
        slaPauseHistory: newHistory,
        status: 'Pending – Menunggu Vendor Eksternal',
        cabangPerbaikan: 'Vendor Eksternal',
        vendorEksternalNama: vendorNama,
        vendorEksternalTiket: vendorTiket,
        catatanAdmin:
          options.catatan ||
          options.catatanAdmin ||
          `Kendala berada di luar kendali internal kampus. Menunggu penanganan vendor eksternal: ${vendorNama} (Ref: ${vendorTiket}).`,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Pending – Menunggu Vendor Eksternal',
            timestamp: nowStr,
            catatan: `Eskalasi Vendor Eksternal: ${vendorNama} (No. Tiket Vendor: ${vendorTiket}). SLA terjeda (Paused) di luar kendali kampus.`,
            petugas: operator
          }
        ]
      };
      this.save(STORAGE_KEYS.DAMAGES, tickets);

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Pending – Menunggu Vendor Eksternal',
        catatan: `Dialihkan ke Vendor Eksternal: ${vendorNama} (${vendorTiket}). Timer SLA dijeda.`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Tiket ${ticket.id} dialihkan ke Vendor Eksternal (${vendorNama}) & SLA terjeda!`,
        ticket: tickets[index]
      };
    }

    // 3d: Tolak Pengajuan Eskalasi Problem Ticket oleh Atasan (ACT-02) / Admin (ACT-03)
    if (effAction === 'reject-problem-escalation') {
      if (!AccessControlService.isAdminOrPusdatinLead(active.role)) {
        return {
          success: false,
          message:
            'Penolakan eskalasi Problem Ticket hanya dapat dilakukan oleh Atasan (Kepala PUSDATIN) atau Admin.'
        };
      }
      if (ticket.problemApprovalStatus !== 'Menunggu Approval') {
        return {
          success: false,
          message: 'Tiket ini tidak memiliki pengajuan eskalasi Problem Ticket yang menunggu persetujuan.'
        };
      }

      const resumed = settleActivePause(ticket);
      const rejectNote =
        (options.catatanAdmin || options.catatan || '').trim() ||
        'Pengajuan eskalasi Problem Ticket ditolak oleh Atasan/Admin. Harap lanjutkan penanganan sebagai Insiden reguler.';

      const nextStatus: DamageStatus = ticket.slaStartedAtIso ? 'In Progress' : 'Assigned';
      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumed,
        status: nextStatus,
        problemApprovalStatus: 'Ditolak',
        problemApprovedBy: operator,
        problemApprovedAtIso: nowIso,
        problemApprovalDecisionNote: rejectNote,
        catatanAdmin: rejectNote,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: nextStatus,
            timestamp: nowStr,
            catatan: `Pengajuan Problem Ticket ditolak oleh ${operator}: ${rejectNote}`,
            petugas: operator
          }
        ]
      };

      this.save(STORAGE_KEYS.DAMAGES, tickets);
      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: nextStatus,
        catatan: `Approval Eskalasi Problem Ticket DITOLAK oleh ${operator}. Alasan: ${rejectNote}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Pengajuan Problem Ticket untuk ${ticket.id} ditolak. Tiket dikembalikan ke status ${nextStatus}.`,
        ticket: tickets[index]
      };
    }

    // 3d: Eskalasi Insiden -> Problem Ticket dengan Approval Atasan (ACT-02) atau Admin (ACT-03)
    if (effAction === 'eskalasi-problem-rfc' || effAction === 'approve-problem-escalation') {
      const isApprover = AccessControlService.isAdminOrPusdatinLead(active.role);

      if (effAction === 'approve-problem-escalation' && !isApprover) {
        return {
          success: false,
          message:
            'Persetujuan Problem Ticket hanya dapat dilakukan oleh Atasan (Kepala PUSDATIN) atau Admin.'
        };
      }

      const targetType: 'Problem' | 'RFC' =
        effAction === 'approve-problem-escalation'
          ? ticket.problemPendingType || options.targetTicketType || 'Problem'
          : options.targetTicketType || 'Problem';

      const workaroundText =
        effAction === 'approve-problem-escalation'
          ? (options.workaround || ticket.problemPendingWorkaround || options.resolusiAkhir || '').trim()
          : (options.workaround || options.resolusiAkhir || '').trim();

      if (!workaroundText) {
        return {
          success: false,
          message:
            'Harap isi solusi sementara (Workaround) sebelum menutup Insiden dan menerbitkan tiket Problem.'
        };
      }

      const problemRule = getRuleForTicket(
        {
          ticketType: targetType,
          prioritas: ticket.prioritas || 'Sedang',
          urgensi: ticket.urgensi || ticket.prioritas || 'Sedang'
        },
        slaConfig
      );
      const pendingOrInputHours =
        effAction === 'approve-problem-escalation'
          ? options.problemTargetHours || ticket.problemPendingTargetHours
          : options.problemTargetHours;
      const customRtHours =
        pendingOrInputHours && pendingOrInputHours > 0
          ? pendingOrInputHours
          : problemRule.rtTargetHours;

      const resolvedTitle =
        effAction === 'approve-problem-escalation'
          ? (options.problemJudul || ticket.problemPendingTitle || `[${targetType}] ${ticket.namaBarang}`).trim()
          : (options.problemJudul?.trim() || `[${targetType}] ${ticket.namaBarang}`);

      // Jika pemohon adalah Teknisi (bukan Atasan/Admin), ajukan untuk Approval terlebih dahulu & jeda SLA RT Insiden
      if (!isApprover) {
        const requestNote =
          (options.catatanAdmin || options.catatan || '').trim() ||
          `Memerlukan perbaikan arsitektur / akar masalah jangka panjang (${Math.round(customRtHours / 24)} hari).`;
        const pauseReason = 'Menunggu Approval Problem Ticket oleh Atasan/Admin';
        const pausePatch = ticket.slaPausedAtIso
          ? {}
          : {
              slaPausedAtIso: nowIso,
              slaPauseReason: pauseReason,
              slaPauseHistory: [
                ...(ticket.slaPauseHistory || []),
                { reason: pauseReason, pausedAtIso: nowIso }
              ]
            };

        tickets[index] = {
          ...ticket,
          ...firstResponseStamp,
          ...pausePatch,
          problemApprovalStatus: 'Menunggu Approval',
          problemApprovalRequestedBy: operator,
          problemApprovalRequestedAtIso: nowIso,
          problemApprovalRequestNote: requestNote,
          problemPendingType: targetType,
          problemPendingTitle: resolvedTitle,
          problemPendingWorkaround: workaroundText,
          problemPendingTargetHours: customRtHours,
          problemPendingPicTeknisi: options.picTeknisiBaru || ticket.picTeknisi || 'Lead Full Stack Developer',
          riwayatStatus: [
            ...(ticket.riwayatStatus || []),
            {
              status: ticket.status,
              timestamp: nowStr,
              catatan: `Teknisi (${operator}) mengajukan eskalasi ke ${targetType} ("${resolvedTitle}") dengan Workaround: ${workaroundText}. Menunggu Approval Atasan/Admin.`,
              petugas: operator
            }
          ]
        };

        this.save(STORAGE_KEYS.DAMAGES, tickets);
        this.addAuditTrail({
          entityType: 'Tiket Helpdesk',
          entityId: ticket.id,
          statusLama,
          statusBaru: 'Menunggu Approval Problem Ticket',
          catatan: `Pengajuan eskalasi ke ${targetType} oleh ${operator} menunggu persetujuan Atasan/Admin.`,
          idPengguna: active.id,
          namaPengguna: active.nama,
          rolePengguna: active.roleName
        });

        return {
          success: true,
          message: `Pengajuan eskalasi ${targetType} untuk ${ticket.id} berhasil dikirim! Menunggu persetujuan Atasan (Kepala PUSDATIN) atau Admin (SLA RT terjeda sementara).`,
          ticket: tickets[index]
        };
      }

      // Disetujui oleh Atasan (ACT-02) atau Admin (ACT-03) -> tutup Insiden via Workaround & terbitkan Problem Ticket
      const resumed = settleActivePause(ticket);
      const prefix = targetType === 'RFC' ? 'RFC' : 'PRB';
      const dateCode = nowIso.split('T')[0].replace(/-/g, '');
      const rand = Math.floor(100 + Math.random() * 900);
      const newProblemId = `${prefix}-${dateCode}-${rand}`;
      const problemDeadlineIso = new Date(nowMs + customRtHours * 3600000).toISOString();
      const decisionNote =
        (options.catatanAdmin || options.catatan || '').trim() ||
        `Disetujui oleh ${operator} (${active.roleName}) untuk penanganan akar masalah jangka panjang.`;

      const newProblemTicket: DamageTicket = {
        id: newProblemId,
        ticketType: targetType,
        kodeUnikAset: ticket.kodeUnikAset,
        barcode: ticket.barcode,
        namaBarang: resolvedTitle,
        pelapor: ticket.pelapor,
        kontakPelapor: ticket.kontakPelapor,
        emailPelapor: ticket.emailPelapor,
        kategoriMasalah: ticket.kategoriMasalah || 'Software',
        prioritas: ticket.urgensi || ticket.prioritas || 'Sedang',
        urgensi: ticket.urgensi || ticket.prioritas || 'Sedang',
        lokasi: ticket.lokasi,
        lokasiAwal: ticket.lokasiAwal,
        deskripsi:
          ticket.problemApprovalRequestNote ||
          options.catatan?.trim() ||
          `Eskalasi akar masalah dari Insiden ${ticket.id}. Membutuhkan perbaikan arsitektur / coding ulang sistem. Workaround awal: ${workaroundText}`,
        tanggalLapor: nowStr,
        createdAtIso: nowIso,
        firstResponseAtIso: nowIso,
        firstResponseBy: operator,
        slaStartedAtIso: nowIso,
        frtTargetMinutes: problemRule.frtTargetMinutes,
        rtTargetHours: customRtHours,
        slaTargetHours: customRtHours,
        slaDeadline: problemDeadlineIso,
        slaPausedTotalMs: 0,
        slaStatus: 'On Track',
        status: 'Assigned',
        jenisAset: ticket.jenisAset || 'Non-Fisik',
        picTeknisi:
          options.picTeknisiBaru ||
          ticket.problemPendingPicTeknisi ||
          ticket.picTeknisi ||
          'Lead Full Stack Developer',
        namaPicTeknisi:
          options.namaPicBaru ||
          ticket.problemApprovalRequestedBy ||
          ticket.namaPicTeknisi ||
          operator,
        tanggalDitugaskan: nowIso,
        linkedParentTicketId: ticket.id,
        workaround: workaroundText,
        problemApprovalStatus: 'Disetujui',
        problemApprovalRequestedBy: ticket.problemApprovalRequestedBy || operator,
        problemApprovalRequestedAtIso: ticket.problemApprovalRequestedAtIso || nowIso,
        problemApprovedBy: operator,
        problemApprovedAtIso: nowIso,
        problemApprovalDecisionNote: decisionNote,
        catatanAdmin: `Tiket ${targetType} diterbitkan dari Insiden ${ticket.id} (disetujui oleh ${operator}) dengan target penyelesaian jangka panjang (${customRtHours} jam / ${Math.round(customRtHours / 24)} hari).`,
        riwayatStatus: [
          {
            status: 'Assigned',
            timestamp: nowStr,
            catatan: `Tiket ${targetType} disetujui oleh ${operator} dari eskalasi Insiden ${ticket.id}. Target SLA: ${customRtHours} jam.`,
            petugas: operator
          }
        ]
      };

      const closingNote = `Workaround diterapkan agar layanan tetap berjalan: ${workaroundText}. Akar masalah dieskalasi ke tiket ${targetType} (${newProblemId}) [Disetujui oleh ${operator}].`;
      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumed,
        status: 'Resolved',
        workaround: workaroundText,
        linkedProblemTicketId: newProblemId,
        problemApprovalStatus: 'Disetujui',
        problemApprovedBy: operator,
        problemApprovedAtIso: nowIso,
        problemApprovalDecisionNote: decisionNote,
        waktuSelesai: nowStr,
        resolvedAt: nowIso,
        resolvedAtIso: nowIso,
        resolusiAkhir: closingNote,
        catatanAdmin: closingNote,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Resolved',
            timestamp: nowStr,
            catatan: `Insiden ditutup (Resolved) via Workaround & eskalasi menjadi ${targetType} ${newProblemId} disetujui oleh ${operator}.`,
            petugas: operator
          }
        ]
      };

      this.save(STORAGE_KEYS.DAMAGES, [newProblemTicket, ...tickets]);

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Resolved',
        catatan: `Insiden diselesaikan dengan Workaround & pembuatan tiket ${targetType} ${newProblemId} disetujui oleh ${operator}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Insiden ${ticket.id} ditutup dengan Workaround (SLA harian aman) & tiket ${targetType} baru (${newProblemId}) resmi disetujui oleh ${operator}!`,
        ticket: tickets[index],
        createdProblemTicket: newProblemTicket
      };
    }

    // B.5: Penyelesaian Perbaikan (Resolved)
    if (effAction === 'selesai-perbaikan') {
      const resumed = settleActivePause(ticket);
      const resolusi = options.resolusiAkhir || options.catatan || 'Perbaikan telah selesai dan perangkat telah berfungsi normal.';
      const statusFinalAset: AssetStatus = options.statusAsetBaru || 'Tersedia';

      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumed,
        status: 'Resolved',
        waktuSelesai: nowStr,
        resolvedAt: nowIso,
        resolvedAtIso: nowIso,
        resolusiAkhir: resolusi,
        catatanAdmin: resolusi,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Resolved',
            timestamp: nowStr,
            catatan: `Perbaikan diselesaikan oleh ${operator}. Resolusi: ${resolusi}. Pelapor dapat melakukan Re-open dalam 1x24 jam jika kendala berulang.`,
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
        pesanPreview: `Tiket ${ticket.id} telah SELESAI (Resolved). Resolusi: ${resolusi}. Jika masih error, silakan Re-open maksimal 1x24 jam.`
      });

      this.addAuditTrail({
        entityType: 'Tiket Helpdesk',
        entityId: ticket.id,
        statusLama,
        statusBaru: 'Resolved',
        catatan: `Perbaikan selesai oleh ${operator}. Status beralih ke Resolved (Re-open 1x24 jam aktif).`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return {
        success: true,
        message: `Tiket ${ticket.id} berstatus RESOLVED! Pelapor dapat konfirmasi selesai atau Re-open dalam 1x24 jam.`,
        ticket: tickets[index]
      };
    }

    // 3f: User Re-open Tiket (Wajib dalam jendela 1x24 jam saat status Resolved sebelum Closed)
    if (effAction === 're-open') {
      if (ticket.status !== 'Resolved') {
        return {
          success: false,
          message: `Tiket dengan status "${ticket.status}" tidak dapat dibuka kembali (hanya berlaku pada tiket Resolved sebelum Closed).`
        };
      }
      if (!canReopenResolvedTicket(ticket, nowMs)) {
        return {
          success: false,
          message: `Batas waktu pembukaan kembali tiket (${REOPEN_WINDOW_HOURS} jam / 1x24 jam setelah Resolved) telah terlewati.`
        };
      }
      const reason = (options.catatan || '').trim() || 'Masih error, belum bisa digunakan!';
      tickets[index] = {
        ...ticket,
        status: 'Re-opened',
        slaStartedAtIso: ticket.slaStartedAtIso || ticket.createdAtIso || nowIso,
        resolvedAtIso: undefined,
        resolvedAt: undefined,
        reopenedAtIso: nowIso,
        reopenReason: reason,
        reopenCount: (ticket.reopenCount || 0) + 1,
        catatanAdmin: `Re-opened oleh pelapor: ${reason}`,
        riwayatStatus: [
          ...(ticket.riwayatStatus || []),
          {
            status: 'Re-opened',
            timestamp: nowStr,
            catatan: `Tiket dibuka kembali oleh pengguna (Re-opened dalam 1x24 jam): "${reason}"`,
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
        catatan: `Tiket di-reopen oleh pengguna: ${reason}`,
        idPengguna: active.id,
        namaPengguna: active.nama,
        rolePengguna: active.roleName
      });

      return { success: true, message: `Tiket ${ticket.id} berhasil DIBUKA KEMBALI (Re-opened)!`, ticket: tickets[index] };
    }

    // B.5: Tutup Manual oleh User / Admin (Closed – Manual)
    if (effAction === 'tutup-manual') {
      const resumed = settleActivePause(ticket);
      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumed,
        status: 'Closed – Manual',
        closedMode: 'Manual',
        waktuSelesai: ticket.waktuSelesai || nowStr,
        resolvedAt: ticket.resolvedAt || nowIso,
        resolvedAtIso: ticket.resolvedAtIso || nowIso,
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
      const resumed = settleActivePause(ticket);
      tickets[index] = {
        ...ticket,
        ...firstResponseStamp,
        ...resumed,
        status: 'Closed – Manual',
        kondisiAkhirAset: 'Tidak Layak',
        waktuSelesai: nowStr,
        resolvedAt: nowIso,
        resolvedAtIso: nowIso,
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
  public static addSystemProposal(
    proposal: Omit<SystemProposal, 'id' | 'tanggalPengajuan' | 'status'> & { customNowMs?: number }
  ): SystemProposal {
    const { customNowMs, ...proposalPayload } = proposal;
    const list = this.getSystemProposals();
    const active = this.getActiveUser();
    const nowMs = customNowMs ?? Date.now();
    const nowDate = new Date(nowMs);
    const nowIso = nowDate.toISOString();
    const id = `SYS-${nowDate.getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
    const serviceSla = this.getServiceSlaConfig();

    const newProposal: SystemProposal = {
      ...proposalPayload,
      id,
      tanggalPengajuan: nowDate.toLocaleString('id-ID'),
      createdAtIso: proposalPayload.createdAtIso || nowIso,
      feasibilityTargetHours: proposalPayload.feasibilityTargetHours ?? serviceSla.proposal.feasibilityTargetHours,
      brdTargetHours: proposalPayload.brdTargetHours ?? serviceSla.proposal.brdTargetHours,
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
    const nowMs = payload?.customNowMs ?? Date.now();
    const nowDate = new Date(nowMs);
    const nowIso = nowDate.toISOString();
    const nowStr = nowDate.toLocaleString('id-ID');

    // Tahap 1: Verifikasi Kelengkapan oleh Admin (ACT-03) -> Menutup Feasibility Study SLA
    if (action === 'verifikasi_admin') {
      AccessControlService.enforce(active, 'pengajuan_sistem', ['verify', 'manage'], 'Verifikasi kelengkapan dokumen sistem baru');
      const lengkap = payload.lengkap ?? true;
      list[index] = {
        ...p,
        status: lengkap ? 'status_analisis' : 'status_verifikasi',
        verifiedAtIso: lengkap ? (p.verifiedAtIso || nowIso) : p.verifiedAtIso,
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

    // Tahap 2: Analisis Kebutuhan oleh System Analyst (ACT-05) -> Menutup BRD Specification SLA
    if (action === 'analisis_system_analyst') {
      AccessControlService.enforce(active, 'pengajuan_sistem', ['execute', 'manage'], 'Analisis kebutuhan sistem baru');
      list[index] = {
        ...p,
        status: 'status_keamanan',
        verifiedAtIso: p.verifiedAtIso || nowIso,
        brdCompletedAtIso: p.brdCompletedAtIso || nowIso,
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
          leadDev: 'Hilyah Haula Salsabiila, S.T.',
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
        liveAtIso: isCompleted ? (p.liveAtIso || nowIso) : p.liveAtIso,
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
        liveAtIso: p.liveAtIso || nowIso,
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

    // SLA Achievement & FRT/RT Metrics
    const slaAgg = computeAggregateSlaStats(damages, this.getSlaConfig());
    const totalSlaOverdue = damages.filter(d => d.slaStatus === 'Overdue').length;
    const slaAchievementRate = slaAgg.rtComplianceRate;

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
      frtComplianceRate: slaAgg.frtComplianceRate,
      rtComplianceRate: slaAgg.rtComplianceRate,
      avgFrtMinutes: slaAgg.avgFrtMinutes,
      avgRtHours: slaAgg.avgRtHours,
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

  // --- SLA CONFIG (FRT & RT PER URGENSI + PROBLEM / RFC) ---
  public static getSlaConfig(): SlaConfig {
    const saved = this.load<Partial<SlaConfig> | null>(STORAGE_KEYS.SLA_CONFIG, null);
    if (!saved) return DEFAULT_SLA_CONFIG;
    return {
      Kritis: saved.Kritis || DEFAULT_SLA_CONFIG.Kritis,
      Tinggi: saved.Tinggi || DEFAULT_SLA_CONFIG.Tinggi,
      Sedang: saved.Sedang || DEFAULT_SLA_CONFIG.Sedang,
      Rendah: saved.Rendah || DEFAULT_SLA_CONFIG.Rendah,
      Problem: saved.Problem || DEFAULT_SLA_CONFIG.Problem,
      RFC: saved.RFC || DEFAULT_SLA_CONFIG.RFC
    };
  }

  public static setSlaConfig(config: SlaConfig): { success: boolean; message: string } {
    const active = this.getActiveUser();
    if (active.role !== 'ACT-02' && active.role !== 'ACT-03') {
      return { success: false, message: 'Hanya Kepala PUSDATIN (ACT-02) atau Admin (ACT-03) yang dapat mengubah kebijakan SLA.' };
    }
    const sanitized: SlaConfig = {
      Kritis: {
        frtTargetMinutes: Math.max(1, Number(config.Kritis.frtTargetMinutes) || 15),
        rtTargetHours: Math.max(1, Number(config.Kritis.rtTargetHours) || 4)
      },
      Tinggi: {
        frtTargetMinutes: Math.max(1, Number(config.Tinggi.frtTargetMinutes) || 30),
        rtTargetHours: Math.max(1, Number(config.Tinggi.rtTargetHours) || 12)
      },
      Sedang: {
        frtTargetMinutes: Math.max(1, Number(config.Sedang.frtTargetMinutes) || 60),
        rtTargetHours: Math.max(1, Number(config.Sedang.rtTargetHours) || 24)
      },
      Rendah: {
        frtTargetMinutes: Math.max(1, Number(config.Rendah.frtTargetMinutes) || 120),
        rtTargetHours: Math.max(1, Number(config.Rendah.rtTargetHours) || 48)
      },
      Problem: {
        frtTargetMinutes: Math.max(1, Number(config.Problem?.frtTargetMinutes) || DEFAULT_SLA_CONFIG.Problem!.frtTargetMinutes),
        rtTargetHours: Math.max(1, Number(config.Problem?.rtTargetHours) || DEFAULT_SLA_CONFIG.Problem!.rtTargetHours)
      },
      RFC: {
        frtTargetMinutes: Math.max(1, Number(config.RFC?.frtTargetMinutes) || DEFAULT_SLA_CONFIG.RFC!.frtTargetMinutes),
        rtTargetHours: Math.max(1, Number(config.RFC?.rtTargetHours) || DEFAULT_SLA_CONFIG.RFC!.rtTargetHours)
      }
    };
    this.save(STORAGE_KEYS.SLA_CONFIG, sanitized);
    return { success: true, message: 'Kebijakan target SLA (FRT & RT termasuk Problem & RFC) berhasil diperbarui!' };
  }

  // --- MASTER PENANDATANGAN DOKUMEN & KEPALA PUSDATIN CONFIG ---
  public static getDefaultSignatoriesFromUsers(): DocumentSignatories {
    const users = this.getUsers();
    const pimpinanUniv = users.find(u => u.role === 'ACT-01' && u.statusAkun === 'Aktif') || users.find(u => u.role === 'ACT-01');
    const kepalaPusdatin = users.find(u => u.role === 'ACT-02' && u.statusAkun === 'Aktif') || users.find(u => u.role === 'ACT-02');
    const petugasAdmin = users.find(u => u.role === 'ACT-03' && u.statusAkun === 'Aktif') || users.find(u => u.role === 'ACT-03');
    const legacyKepala = this.load<{ nama?: string; nip?: string } | null>(STORAGE_KEYS.KEPALA, null);

    return {
      pimpinanUnivNama: pimpinanUniv?.nama || 'Arif Nurudin, M.T.',
      pimpinanUnivJabatan: pimpinanUniv?.unit || 'Rektor Universitas Muhammadiyah Cirebon',
      pimpinanUnivNip: 'NIDN. 0412057201',
      kepalaPusdatinNama: legacyKepala?.nama || kepalaPusdatin?.nama || 'Agust Isa Martinus, M.T.',
      kepalaPusdatinNip: legacyKepala?.nip || 'NIDN. 0418077501',
      petugasDefaultNama: petugasAdmin?.nama || 'Aditiya Ahmad Fadila, S.T.',
      petugasDefaultJabatan: petugasAdmin?.roleName || 'IT Support & Helpdesk Specialist'
    };
  }

  public static getDocumentSignatories(): DocumentSignatories {
    const defaults = this.getDefaultSignatoriesFromUsers();
    const saved = this.load<Partial<DocumentSignatories> | null>(STORAGE_KEYS.SIGNATORIES, null);
    if (!saved) return defaults;
    return {
      pimpinanUnivNama: saved.pimpinanUnivNama || defaults.pimpinanUnivNama,
      pimpinanUnivJabatan: saved.pimpinanUnivJabatan || defaults.pimpinanUnivJabatan,
      pimpinanUnivNip: saved.pimpinanUnivNip ?? defaults.pimpinanUnivNip,
      kepalaPusdatinNama: saved.kepalaPusdatinNama || defaults.kepalaPusdatinNama,
      kepalaPusdatinNip: saved.kepalaPusdatinNip ?? defaults.kepalaPusdatinNip,
      petugasDefaultNama: saved.petugasDefaultNama || defaults.petugasDefaultNama,
      petugasDefaultJabatan: saved.petugasDefaultJabatan || defaults.petugasDefaultJabatan
    };
  }

  public static setDocumentSignatories(signatories: DocumentSignatories): void {
    this.save(STORAGE_KEYS.SIGNATORIES, signatories);
    this.save(STORAGE_KEYS.KEPALA, {
      nama: signatories.kepalaPusdatinNama,
      nip: signatories.kepalaPusdatinNip
    });
  }

  public static syncSignatoriesFromMasterUsers(): DocumentSignatories {
    const users = this.getUsers();
    const current = this.getDocumentSignatories();
    const pimpinanUniv = users.find(u => u.role === 'ACT-01' && u.statusAkun === 'Aktif') || users.find(u => u.role === 'ACT-01');
    const kepalaPusdatin = users.find(u => u.role === 'ACT-02' && u.statusAkun === 'Aktif') || users.find(u => u.role === 'ACT-02');
    const petugasAdmin = users.find(u => u.role === 'ACT-03' && u.statusAkun === 'Aktif') || users.find(u => u.role === 'ACT-03');

    const synced: DocumentSignatories = {
      ...current,
      pimpinanUnivNama: pimpinanUniv?.nama || current.pimpinanUnivNama,
      pimpinanUnivJabatan: pimpinanUniv?.unit || current.pimpinanUnivJabatan,
      kepalaPusdatinNama: kepalaPusdatin?.nama || current.kepalaPusdatinNama,
      petugasDefaultNama: petugasAdmin?.nama || current.petugasDefaultNama,
      petugasDefaultJabatan: petugasAdmin?.roleName || current.petugasDefaultJabatan
    };
    this.setDocumentSignatories(synced);
    return synced;
  }

  public static getKepalaPusdatin(): { nama: string; nip: string } {
    const sig = this.getDocumentSignatories();
    return {
      nama: sig.kepalaPusdatinNama,
      nip: sig.kepalaPusdatinNip
    };
  }

  public static setKepalaPusdatin(nama: string, nip: string): void {
    const current = this.getDocumentSignatories();
    this.setDocumentSignatories({
      ...current,
      kepalaPusdatinNama: nama,
      kepalaPusdatinNip: nip
    });
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
      return { role: 'Cloud & Infrastructure Engineer', name: 'Jeri Maulana, S.T.' };
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
      return { role: 'System Analyst & Data Governance Specialist', name: 'Ayi Imaduddin, S.Kom.' };
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
      return { role: 'Cyber Security Officer', name: 'Mumun Munawar, S.T.' };
    }

    return { role: 'IT Support & Helpdesk Specialist', name: 'Aditiya Ahmad Fadila, S.T.' };
  }

  // --- SERVICE SLA CONFIG (PEMINJAMAN ASET & PENGAJUAN SISTEM BARU) ---
  public static getServiceSlaConfig(): ServiceSlaConfig {
    const saved = this.load<Partial<ServiceSlaConfig> | null>(STORAGE_KEYS.SERVICE_SLA_CONFIG, null);
    if (!saved) return DEFAULT_SERVICE_SLA_CONFIG;
    return {
      loan: {
        approvalTargetMinutes:
          saved.loan?.approvalTargetMinutes ?? DEFAULT_SERVICE_SLA_CONFIG.loan.approvalTargetMinutes,
        fulfillmentTargetHours:
          saved.loan?.fulfillmentTargetHours ?? DEFAULT_SERVICE_SLA_CONFIG.loan.fulfillmentTargetHours
      },
      proposal: {
        feasibilityTargetHours:
          saved.proposal?.feasibilityTargetHours ?? DEFAULT_SERVICE_SLA_CONFIG.proposal.feasibilityTargetHours,
        brdTargetHours:
          saved.proposal?.brdTargetHours ?? DEFAULT_SERVICE_SLA_CONFIG.proposal.brdTargetHours
      }
    };
  }

  public static setServiceSlaConfig(config: ServiceSlaConfig): { success: boolean; message: string } {
    const active = this.getActiveUser();
    if (active.role !== 'ACT-02' && active.role !== 'ACT-03') {
      return {
        success: false,
        message: 'Hanya Kepala PUSDATIN (ACT-02) atau Admin (ACT-03) yang dapat mengubah kebijakan SLA Layanan.'
      };
    }
    const sanitized: ServiceSlaConfig = {
      loan: {
        approvalTargetMinutes: Math.max(5, Number(config.loan?.approvalTargetMinutes) || 120),
        fulfillmentTargetHours: Math.max(1, Number(config.loan?.fulfillmentTargetHours) || 4)
      },
      proposal: {
        feasibilityTargetHours: Math.max(1, Number(config.proposal?.feasibilityTargetHours) || 24),
        brdTargetHours: Math.max(1, Number(config.proposal?.brdTargetHours) || 72)
      }
    };
    this.save(STORAGE_KEYS.SERVICE_SLA_CONFIG, sanitized);
    return {
      success: true,
      message: 'Target SLA Peminjaman Aset & Pengajuan Sistem Baru berhasil diperbarui!'
    };
  }

  // --- ITIL CONTINUAL IMPROVEMENT: SURVEI KEPUASAN PENGGUNA (CSAT) ---
  public static getSurveys(): SurveyResponse[] {
    return this.load<SurveyResponse[]>(STORAGE_KEYS.SURVEYS, INITIAL_SURVEYS);
  }

  public static getSurveyByEntity(moduleType: SurveyModuleType, entityId: string): SurveyResponse | undefined {
    return this.getSurveys().find(s => s.moduleType === moduleType && s.entityId === entityId);
  }

  public static submitSurveyResponse(params: {
    moduleType: SurveyModuleType;
    entityId: string;
    entityTitle: string;
    respondentName?: string;
    respondentEmail?: string;
    respondentUnit?: string;
    technicianOrPic?: string;
    ratings: { q1: number; q2: number; q3: number };
    feedbackText: string;
    customNowMs?: number;
  }): { success: boolean; message: string; survey?: SurveyResponse } {
    const active = this.getActiveUser();
    const existing = this.getSurveyByEntity(params.moduleType, params.entityId);
    if (existing) {
      return {
        success: false,
        message: `Survei kepuasan untuk layanan ${params.entityId} sudah pernah dikirimkan.`,
        survey: existing
      };
    }

    const q1 = Math.min(5, Math.max(1, Math.round(Number(params.ratings.q1) || 5)));
    const q2 = Math.min(5, Math.max(1, Math.round(Number(params.ratings.q2) || 5)));
    const q3 = Math.min(5, Math.max(1, Math.round(Number(params.ratings.q3) || 5)));
    const nowMs = params.customNowMs ?? Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const monthKey = nowIso.slice(0, 7);

    const newSurvey: SurveyResponse = {
      id: `SRV-${monthKey.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      moduleType: params.moduleType,
      entityId: params.entityId,
      entityTitle: params.entityTitle,
      respondentName: params.respondentName || active.nama,
      respondentEmail: params.respondentEmail || active.email,
      respondentUnit: params.respondentUnit || active.unit,
      technicianOrPic: params.technicianOrPic,
      ratings: { q1, q2, q3 },
      averageScore: computeSurveyAverageScore({ q1, q2, q3 }),
      feedbackText: (params.feedbackText || '').trim(),
      submittedAtIso: nowIso,
      monthKey
    };

    const current = this.getSurveys();
    this.save(STORAGE_KEYS.SURVEYS, [newSurvey, ...current]);

    return {
      success: true,
      message: `Terima kasih! Penilaian kepuasan Anda (${newSurvey.averageScore}/5.0) berhasil direkam untuk peningkatan layanan PUSDATIN UMC.`,
      survey: newSurvey
    };
  }

  // --- RESET & RESTORE ---
  public static resetToDefaultSeed(): void {
    try {
      localStorage.setItem(CLEAN_DB_VERSION_KEY, 'true');
      localStorage.removeItem(STORAGE_KEYS.KEPALA);
      localStorage.removeItem(STORAGE_KEYS.SIGNATORIES);
    } catch {
      // ignore storage errors
    }
    this.save(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
    this.save(STORAGE_KEYS.LOANS, INITIAL_LOANS);
    this.save(STORAGE_KEYS.DAMAGES, INITIAL_DAMAGES);
    this.save(STORAGE_KEYS.LOGS, []);
    this.save(STORAGE_KEYS.BUKU_PENERIMAAN, INITIAL_BUKU_PENERIMAAN);
    this.save(STORAGE_KEYS.BUKU_PENGELUARAN, INITIAL_BUKU_PENGELUARAN);
    this.save(STORAGE_KEYS.SYSTEM_PROPOSALS, INITIAL_SYSTEM_PROPOSALS);
    this.save(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.save(STORAGE_KEYS.AUDIT_TRAIL, INITIAL_AUDIT_TRAIL);
    this.save(STORAGE_KEYS.SURVEYS, INITIAL_SURVEYS);
    this.save(STORAGE_KEYS.USERS, SEED_USERS);
  }
}
