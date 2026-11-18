import { AppUser } from '../types';

const ALLOWED_INSTITUTIONAL_EMAIL_REGEX = /^[a-z0-9._%+-]+@(umc\.ac\.id|student\.umc\.ac\.id)$/i;

export function isAllowedInstitutionalEmail(email: string): boolean {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  return ALLOWED_INSTITUTIONAL_EMAIL_REGEX.test(normalized);
}

export function inferCivitasTypeFromEmail(email: string): 'Mahasiswa' | 'Dosen' {
  const normalized = (email || '').trim().toLowerCase();
  return normalized.endsWith('@student.umc.ac.id') ? 'Mahasiswa' : 'Dosen';
}

export interface SsoLoginValidationResult {
  ok: boolean;
  user?: AppUser;
  isNewUser?: boolean;
  requiresPasswordSetup?: boolean;
  error?: string;
}

export function formatDisplayNameFromEmail(email: string): string {
  const localPart = (email || '').split('@')[0] || 'Civitas UMC';
  const cleaned = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Civitas UMC';
  return cleaned
    .split(' ')
    .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

/**
 * Checks whether an AppUser already has a configured password.
 */
export function hasUserConfiguredPassword(user?: AppUser): boolean {
  if (!user) return false;
  if (user.passwordSet === true) return true;
  if (user.passwordSet === false) return false;
  return Boolean(user.password && user.password.trim().length > 0);
}

/**
 * Google Sign-In / First-Time Email Verification:
 * - Only @umc.ac.id and @student.umc.ac.id are allowed.
 * - Active registered users WITH a configured password log in immediately (no re-setup required).
 * - Unregistered institutional emails OR registered users WITHOUT a configured password
 *   are marked `requiresPasswordSetup: true` so the user must create a password first.
 */
export function validateGoogleLogin(
  email: string,
  registeredUsers: AppUser[]
): SsoLoginValidationResult {
  const normalized = (email || '').trim().toLowerCase();

  if (!normalized) {
    return {
      ok: false,
      error: 'Harap masukkan email instansi UMC (@umc.ac.id atau @student.umc.ac.id).'
    };
  }

  if (!isAllowedInstitutionalEmail(normalized)) {
    return {
      ok: false,
      error:
        'Akses ditolak! Hanya email resmi Universitas Muhammadiyah Cirebon (@umc.ac.id atau @student.umc.ac.id) yang diizinkan masuk.'
    };
  }

  const found = registeredUsers.find(u => u.email.trim().toLowerCase() === normalized);
  if (found) {
    if (found.statusAkun === 'Nonaktif') {
      return {
        ok: false,
        error: `Akun "${normalized}" saat ini berstatus Nonaktif. Hubungi Administrator PUSDATIN UMC.`
      };
    }

    const hasPwd = hasUserConfiguredPassword(found);
    return {
      ok: true,
      user: found,
      isNewUser: false,
      requiresPasswordSetup: !hasPwd
    };
  }

  const civitasType = inferCivitasTypeFromEmail(normalized);
  const autoUser: AppUser = {
    id: `USR-SSO-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    nama: formatDisplayNameFromEmail(normalized),
    email: normalized,
    role: 'ACT-10',
    roleName: 'User (Civitas Akademika)',
    civitasType,
    unit: civitasType === 'Mahasiswa' ? 'Mahasiswa Universitas Muhammadiyah Cirebon' : 'Civitas Akademika UMC',
    phone: '',
    statusAkun: 'Aktif',
    sumberData: 'SSO Google',
    password: undefined,
    passwordSet: false,
    specialty:
      civitasType === 'Mahasiswa'
        ? 'Mahasiswa: Peminjaman Aset & Lapor Kerusakan'
        : 'Civitas UMC: Peminjaman Aset, Lapor Kerusakan & Ajukan Sistem Baru',
    isFullAccess: false
  };

  return {
    ok: true,
    user: autoUser,
    isNewUser: true,
    requiresPasswordSetup: true
  };
}

/**
 * Standard Email + Password login:
 * - Only works for users who already registered and configured their password
 *   (or pre-configured accounts like Admin aditiya.ahmad@umc.ac.id).
 * - Unregistered or passwordless users are instructed to log in first using "Masuk dengan Google".
 */
export function validatePasswordLogin(
  email: string,
  password: string,
  registeredUsers: AppUser[]
): SsoLoginValidationResult {
  const normalized = (email || '').trim().toLowerCase();

  if (!normalized) {
    return {
      ok: false,
      error: 'Harap masukkan email instansi UMC Anda.'
    };
  }

  if (!isAllowedInstitutionalEmail(normalized)) {
    return {
      ok: false,
      error:
        'Akses ditolak! Hanya email resmi Universitas Muhammadiyah Cirebon (@umc.ac.id atau @student.umc.ac.id) yang diizinkan masuk.'
    };
  }

  if (!password || !password.trim()) {
    return {
      ok: false,
      error: 'Harap masukkan password Anda.'
    };
  }

  const found = registeredUsers.find(u => u.email.trim().toLowerCase() === normalized);
  if (!found || !hasUserConfiguredPassword(found)) {
    return {
      ok: false,
      error:
        'Akun belum terdaftar atau belum mengatur password. Silakan klik "Masuk dengan Google" terlebih dahulu untuk login pertama kali dan membuat password.'
    };
  }

  if (found.statusAkun === 'Nonaktif') {
    return {
      ok: false,
      error: `Akun "${normalized}" saat ini berstatus Nonaktif. Hubungi Administrator PUSDATIN UMC.`
    };
  }

  if (found.password !== password) {
    return {
      ok: false,
      error: 'Email atau password salah. Silakan periksa kembali kredensial Anda.'
    };
  }

  return {
    ok: true,
    user: found,
    isNewUser: false,
    requiresPasswordSetup: false
  };
}

/**
 * Validates new password creation during first-time login setup.
 */
export function validateNewPasswordSetup(
  password: string,
  confirmPassword: string
): { ok: boolean; error?: string } {
  const trimmed = (password || '').trim();
  if (!trimmed || trimmed.length < 6) {
    return {
      ok: false,
      error: 'Password baru minimal harus terdiri dari 6 karakter.'
    };
  }
  if (password !== confirmPassword) {
    return {
      ok: false,
      error: 'Konfirmasi password tidak cocok. Silakan ketik ulang dengan benar.'
    };
  }
  return { ok: true };
}

/**
 * Backward-compatible alias for SSO validation callers.
 */
export function validateRegisteredSsoLogin(
  email: string,
  registeredUsers: AppUser[]
): SsoLoginValidationResult {
  return validateGoogleLogin(email, registeredUsers);
}
