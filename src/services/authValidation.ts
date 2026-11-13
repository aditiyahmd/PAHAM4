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
  error?: string;
}

/**
 * Validates SSO login strictly:
 * 1. Domain must end with @umc.ac.id or @student.umc.ac.id
 * 2. Account must be registered in Master Pengguna
 * 3. Account statusAkun must be 'Aktif'
 */
export function validateRegisteredSsoLogin(
  email: string,
  registeredUsers: AppUser[]
): SsoLoginValidationResult {
  const normalized = (email || '').trim().toLowerCase();

  if (!normalized) {
    return {
      ok: false,
      error: 'Harap masukkan email instansi terdaftar (@umc.ac.id atau @student.umc.ac.id).'
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
  if (!found) {
    return {
      ok: false,
      error: `Akun "${normalized}" belum terdaftar pada Master Data Pengguna PAHAM. Hubungi Admin PUSDATIN UMC untuk pendaftaran akun.`
    };
  }

  if (found.statusAkun === 'Nonaktif') {
    return {
      ok: false,
      error: `Akun "${normalized}" saat ini berstatus Nonaktif. Hubungi Administrator PUSDATIN UMC.`
    };
  }

  return {
    ok: true,
    user: found
  };
}
