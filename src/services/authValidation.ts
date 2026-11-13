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
 * Validates institutional SSO login:
 * 1. Domain must end with @umc.ac.id or @student.umc.ac.id (all others rejected)
 * 2. If registered in Master Pengguna: must have statusAkun === 'Aktif'
 * 3. If not yet in Master Pengguna: auto-provisions an active Civitas (ACT-10) account
 *    (@student.umc.ac.id -> Mahasiswa, @umc.ac.id -> Dosen/Pegawai)
 */
export function validateRegisteredSsoLogin(
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

    return {
      ok: true,
      user: found,
      isNewUser: false
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
    specialty:
      civitasType === 'Mahasiswa'
        ? 'Mahasiswa: Peminjaman Aset & Lapor Kerusakan'
        : 'Civitas UMC: Peminjaman Aset, Lapor Kerusakan & Ajukan Sistem Baru',
    isFullAccess: false
  };

  return {
    ok: true,
    user: autoUser,
    isNewUser: true
  };
}
