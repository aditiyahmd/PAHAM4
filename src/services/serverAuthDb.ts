import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { AppUser, ActorCode, TechnicianRole } from '../types/index.ts';
import {
  isAllowedInstitutionalEmail,
  inferCivitasTypeFromEmail,
  formatDisplayNameFromEmail,
  validateNewPasswordSetup
} from './authValidation.ts';

export interface StoredAuthUser extends Omit<AppUser, 'password'> {
  passwordHash?: string;
  passwordSet: boolean;
  googleUid?: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface VerifiedGoogleIdentity {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
}

export type TokenVerifierFn = (idToken: string) => Promise<VerifiedGoogleIdentity>;

/**
 * Hashes a plain password with a fresh 16-byte random salt using Node's built-in scrypt KDF.
 */
export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Constant-time verification of a plain password against a stored `scrypt$salt$hash` string.
 */
export function verifyPasswordHash(plainPassword: string, storedHash?: string): boolean {
  if (!plainPassword || !storedHash) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = crypto.scryptSync(plainPassword, salt, 64);
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function sanitizeUserForClient(record: StoredAuthUser): AppUser {
  const { passwordHash, createdAtIso: _c, updatedAtIso: _u, ...rest } = record;
  return {
    ...rest,
    passwordSet: Boolean(record.passwordSet && passwordHash)
  };
}

function createInitialAdminRecord(): StoredAuthUser {
  const now = new Date().toISOString();
  return {
    id: 'USR-ACT-03',
    nama: 'Aditiya Ahmad Fadila, S.T.',
    email: 'aditiya.ahmad@umc.ac.id',
    role: 'ACT-03',
    roleName: 'IT Support & Helpdesk Specialist',
    unit: 'PUSDATIN UMC',
    phone: '085964531388',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    specialty:
      'Admin Sistem: Pengelolaan Aset, Faktur Penerimaan, Distribusi Pengeluaran, Tiket SLA & Seluruh Menu',
    isFullAccess: true,
    passwordHash: hashPassword('234448adit'),
    passwordSet: true,
    createdAtIso: now,
    updatedAtIso: now
  };
}

function loadFirebaseApiKey(): string {
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return parsed.apiKey || '';
  } catch {
    return '';
  }
}

/**
 * Verifies a Firebase Auth ID token using Firebase Identity Toolkit REST `accounts:lookup`.
 */
export async function verifyFirebaseIdTokenViaRest(
  idToken: string
): Promise<VerifiedGoogleIdentity> {
  const trimmed = (idToken || '').trim();
  if (!trimmed) {
    throw new Error('Token autentikasi Google tidak ditemukan.');
  }

  const apiKey = loadFirebaseApiKey();
  if (!apiKey) {
    throw new Error('Konfigurasi Firebase API key tidak ditemukan.');
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: trimmed })
    }
  );

  if (!res.ok) {
    throw new Error('Verifikasi token Google gagal atau sesi Google kedaluwarsa.');
  }

  const data = (await res.json()) as {
    users?: Array<{
      localId?: string;
      email?: string;
      displayName?: string;
      emailVerified?: boolean;
    }>;
  };

  const user = data.users?.[0];
  if (!user || !user.localId || !user.email) {
    throw new Error('Identitas akun Google tidak valid.');
  }

  return {
    uid: user.localId,
    email: user.email.trim().toLowerCase(),
    displayName: user.displayName || undefined,
    emailVerified: Boolean(user.emailVerified)
  };
}

export class ServerAuthDatabase {
  private readonly dbFilePath: string;
  private readonly tokenVerifier: TokenVerifierFn;

  constructor(
    dbFilePath: string = path.resolve(process.cwd(), '.data', 'auth-users.json'),
    tokenVerifier: TokenVerifierFn = verifyFirebaseIdTokenViaRest
  ) {
    this.dbFilePath = dbFilePath;
    this.tokenVerifier = tokenVerifier;
  }

  private ensureInitialized(): StoredAuthUser[] {
    const dir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dbFilePath)) {
      const initial = [createInitialAdminRecord()];
      fs.writeFileSync(this.dbFilePath, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    try {
      const raw = fs.readFileSync(this.dbFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as StoredAuthUser[];
      }
    } catch {
      // fall through to recreate clean admin database
    }
    const initial = [createInitialAdminRecord()];
    fs.writeFileSync(this.dbFilePath, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }

  private writeUsers(users: StoredAuthUser[]): void {
    const dir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dbFilePath, JSON.stringify(users, null, 2), 'utf8');
  }

  public getAllUsersSanitized(): AppUser[] {
    return this.ensureInitialized().map(sanitizeUserForClient);
  }

  public getRawUsersForTest(): StoredAuthUser[] {
    return this.ensureInitialized();
  }

  public findByEmail(email: string): StoredAuthUser | undefined {
    const normalized = (email || '').trim().toLowerCase();
    return this.ensureInitialized().find(u => u.email.trim().toLowerCase() === normalized);
  }

  /**
   * Step 1 & 2a: Verify Google OAuth ID token in backend and check whether user has configured a local password yet.
   */
  public async processGoogleSignIn(idToken: string): Promise<{
    ok: boolean;
    status: number;
    requiresPasswordSetup?: boolean;
    isNewUser?: boolean;
    user?: AppUser;
    error?: string;
  }> {
    let verified: VerifiedGoogleIdentity;
    try {
      verified = await this.tokenVerifier(idToken);
    } catch (err) {
      return {
        ok: false,
        status: 401,
        error: err instanceof Error ? err.message : 'Verifikasi Google gagal.'
      };
    }

    if (!verified.emailVerified) {
      return {
        ok: false,
        status: 403,
        error: 'Email Google Anda belum terverifikasi.'
      };
    }

    const email = verified.email.trim().toLowerCase();
    if (!isAllowedInstitutionalEmail(email)) {
      return {
        ok: false,
        status: 403,
        error:
          'Akses ditolak! Hanya email resmi Universitas Muhammadiyah Cirebon (@umc.ac.id atau @student.umc.ac.id) yang diizinkan masuk.'
      };
    }

    const users = this.ensureInitialized();
    const idx = users.findIndex(u => u.email.trim().toLowerCase() === email);

    if (idx >= 0) {
      const existing = users[idx];
      if (existing.statusAkun === 'Nonaktif') {
        return {
          ok: false,
          status: 403,
          error: `Akun "${email}" saat ini berstatus Nonaktif. Hubungi Administrator PUSDATIN UMC.`
        };
      }

      const hasPassword = Boolean(existing.passwordSet && existing.passwordHash);
      if (hasPassword && existing.googleUid !== verified.uid) {
        users[idx] = {
          ...existing,
          googleUid: verified.uid,
          updatedAtIso: new Date().toISOString()
        };
        this.writeUsers(users);
      }

      return {
        ok: true,
        status: 200,
        requiresPasswordSetup: !hasPassword,
        isNewUser: false,
        user: sanitizeUserForClient(users[idx])
      };
    }

    // New institutional user logging in via Google for the first time -> preview user & require password setup
    const civitasType = inferCivitasTypeFromEmail(email);
    const previewUser: AppUser = {
      id: `USR-SSO-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      nama: verified.displayName || formatDisplayNameFromEmail(email),
      email,
      googleUid: verified.uid,
      role: 'ACT-10',
      roleName: 'User (Civitas Akademika)',
      civitasType,
      unit:
        civitasType === 'Mahasiswa'
          ? 'Mahasiswa Universitas Muhammadiyah Cirebon'
          : 'Civitas Akademika UMC',
      phone: '',
      statusAkun: 'Aktif',
      sumberData: 'SSO Google',
      passwordSet: false,
      specialty:
        civitasType === 'Mahasiswa'
          ? 'Mahasiswa: Peminjaman Aset & Lapor Kerusakan'
          : 'Civitas UMC: Peminjaman Aset, Lapor Kerusakan & Ajukan Sistem Baru',
      isFullAccess: false
    };

    return {
      ok: true,
      status: 200,
      requiresPasswordSetup: true,
      isNewUser: true,
      user: previewUser
    };
  }

  /**
   * Step 2b: After Google OAuth succeeds for first-time user, hash and save the local password linked to Google email & UID.
   */
  public async completeFirstTimePasswordSetup(
    idToken: string,
    password: string,
    confirmPassword: string
  ): Promise<{ ok: boolean; status: number; user?: AppUser; error?: string }> {
    let verified: VerifiedGoogleIdentity;
    try {
      verified = await this.tokenVerifier(idToken);
    } catch (err) {
      return {
        ok: false,
        status: 401,
        error: err instanceof Error ? err.message : 'Sesi verifikasi Google kedaluwarsa. Silakan ulangi Masuk dengan Google.'
      };
    }

    if (!verified.emailVerified) {
      return {
        ok: false,
        status: 403,
        error: 'Email Google Anda belum terverifikasi.'
      };
    }

    const email = verified.email.trim().toLowerCase();
    if (!isAllowedInstitutionalEmail(email)) {
      return {
        ok: false,
        status: 403,
        error:
          'Akses ditolak! Hanya email resmi Universitas Muhammadiyah Cirebon (@umc.ac.id atau @student.umc.ac.id) yang diizinkan masuk.'
      };
    }

    const pwdCheck = validateNewPasswordSetup(password, confirmPassword);
    if (!pwdCheck.ok) {
      return {
        ok: false,
        status: 400,
        error: pwdCheck.error
      };
    }

    const users = this.ensureInitialized();
    const idx = users.findIndex(u => u.email.trim().toLowerCase() === email);
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);

    if (idx >= 0) {
      if (users[idx].statusAkun === 'Nonaktif') {
        return {
          ok: false,
          status: 403,
          error: `Akun "${email}" saat ini berstatus Nonaktif. Hubungi Administrator PUSDATIN UMC.`
        };
      }
      users[idx] = {
        ...users[idx],
        googleUid: verified.uid,
        passwordHash,
        passwordSet: true,
        updatedAtIso: now
      };
      this.writeUsers(users);
      return {
        ok: true,
        status: 200,
        user: sanitizeUserForClient(users[idx])
      };
    }

    const civitasType = inferCivitasTypeFromEmail(email);
    const newRecord: StoredAuthUser = {
      id: `USR-SSO-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      nama: verified.displayName || formatDisplayNameFromEmail(email),
      email,
      googleUid: verified.uid,
      role: 'ACT-10',
      roleName: 'User (Civitas Akademika)',
      civitasType,
      unit:
        civitasType === 'Mahasiswa'
          ? 'Mahasiswa Universitas Muhammadiyah Cirebon'
          : 'Civitas Akademika UMC',
      phone: '',
      statusAkun: 'Aktif',
      sumberData: 'SSO Google',
      passwordHash,
      passwordSet: true,
      specialty:
        civitasType === 'Mahasiswa'
          ? 'Mahasiswa: Peminjaman Aset & Lapor Kerusakan'
          : 'Civitas UMC: Peminjaman Aset, Lapor Kerusakan & Ajukan Sistem Baru',
      isFullAccess: false,
      createdAtIso: now,
      updatedAtIso: now
    };

    users.push(newRecord);
    this.writeUsers(users);
    return {
      ok: true,
      status: 201,
      user: sanitizeUserForClient(newRecord)
    };
  }

  /**
   * Step 3b: Standard Email + Password login verified against hashed password (`scrypt` + `timingSafeEqual`).
   */
  public loginWithPassword(
    emailInput: string,
    passwordInput: string
  ): { ok: boolean; status: number; user?: AppUser; error?: string } {
    const email = (emailInput || '').trim().toLowerCase();
    if (!email) {
      return { ok: false, status: 400, error: 'Harap masukkan email instansi UMC Anda.' };
    }

    if (!isAllowedInstitutionalEmail(email)) {
      return {
        ok: false,
        status: 403,
        error:
          'Akses ditolak! Hanya email resmi Universitas Muhammadiyah Cirebon (@umc.ac.id atau @student.umc.ac.id) yang diizinkan masuk.'
      };
    }

    if (!passwordInput || !passwordInput.trim()) {
      return { ok: false, status: 400, error: 'Harap masukkan password Anda.' };
    }

    const found = this.findByEmail(email);
    if (!found || !found.passwordSet || !found.passwordHash) {
      return {
        ok: false,
        status: 401,
        error:
          'Akun belum terdaftar atau belum mengatur password. Silakan klik "Masuk dengan Google" terlebih dahulu untuk login pertama kali dan membuat password.'
      };
    }

    if (found.statusAkun === 'Nonaktif') {
      return {
        ok: false,
        status: 403,
        error: `Akun "${email}" saat ini berstatus Nonaktif. Hubungi Administrator PUSDATIN UMC.`
      };
    }

    if (!verifyPasswordHash(passwordInput, found.passwordHash)) {
      return {
        ok: false,
        status: 401,
        error: 'Email atau password salah. Silakan periksa kembali kredensial Anda.'
      };
    }

    return {
      ok: true,
      status: 200,
      user: sanitizeUserForClient(found)
    };
  }

  /**
   * Admin user management sync (create/update/status toggle/delete) hashing any provided password.
   */
  public adminUpsertUser(payload: {
    id?: string;
    nama: string;
    email: string;
    role: ActorCode;
    roleName: TechnicianRole;
    civitasType?: 'Dosen' | 'Karyawan' | 'Mahasiswa';
    unit?: string;
    phone?: string;
    specialty?: string;
    isFullAccess?: boolean;
    level?: 'Senior' | 'Junior' | 'Lead' | 'Staff';
    statusAkun?: 'Aktif' | 'Nonaktif';
    password?: string;
  }): { ok: boolean; user?: AppUser; error?: string } {
    const email = (payload.email || '').trim().toLowerCase();
    if (!isAllowedInstitutionalEmail(email)) {
      return {
        ok: false,
        error: 'Email wajib menggunakan domain resmi @umc.ac.id atau @student.umc.ac.id.'
      };
    }

    const users = this.ensureInitialized();
    const idx = users.findIndex(
      u => (payload.id && u.id === payload.id) || u.email.trim().toLowerCase() === email
    );
    const now = new Date().toISOString();
    const trimmedPassword = payload.password && payload.password.trim() ? payload.password : '';

    if (idx >= 0) {
      const current = users[idx];
      const nextHash = trimmedPassword ? hashPassword(trimmedPassword) : current.passwordHash;
      const nextSet = Boolean(nextHash);
      users[idx] = {
        ...current,
        nama: payload.nama || current.nama,
        email,
        role: payload.role || current.role,
        roleName: payload.roleName || current.roleName,
        civitasType: payload.role !== 'ACT-10' ? undefined : payload.civitasType ?? current.civitasType,
        unit: payload.unit ?? current.unit,
        phone: payload.phone ?? current.phone,
        specialty: payload.specialty ?? current.specialty,
        isFullAccess: payload.isFullAccess ?? current.isFullAccess,
        level: payload.level ?? current.level,
        statusAkun: payload.statusAkun ?? current.statusAkun,
        passwordHash: nextHash,
        passwordSet: nextSet,
        updatedAtIso: now
      };
      this.writeUsers(users);
      return { ok: true, user: sanitizeUserForClient(users[idx]) };
    }

    const nextHash = trimmedPassword ? hashPassword(trimmedPassword) : undefined;
    const newRecord: StoredAuthUser = {
      id: payload.id || `USR-${Date.now()}`,
      nama: payload.nama,
      email,
      role: payload.role || 'ACT-10',
      roleName: payload.roleName || 'User (Civitas Akademika)',
      civitasType: payload.role === 'ACT-10' ? payload.civitasType : undefined,
      unit: payload.unit || 'PUSDATIN UMC',
      phone: payload.phone || '081234567890',
      statusAkun: payload.statusAkun || 'Aktif',
      sumberData: 'SSO Google',
      specialty: payload.specialty || '',
      isFullAccess: Boolean(payload.isFullAccess || payload.role === 'ACT-02' || payload.role === 'ACT-03'),
      level: payload.level,
      passwordHash: nextHash,
      passwordSet: Boolean(nextHash),
      createdAtIso: now,
      updatedAtIso: now
    };
    users.push(newRecord);
    this.writeUsers(users);
    return { ok: true, user: sanitizeUserForClient(newRecord) };
  }

  public adminDeleteUser(userId: string): boolean {
    const users = this.ensureInitialized();
    const filtered = users.filter(u => u.id !== userId);
    if (filtered.length === users.length) return false;
    this.writeUsers(filtered);
    return true;
  }
}

export const defaultServerAuthDb = new ServerAuthDatabase();
