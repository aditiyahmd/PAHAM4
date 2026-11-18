import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Eye, EyeOff, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { validateNewPasswordSetup } from '../../services/authValidation';
import {
  signInWithGooglePopup,
  signOutFirebaseSession,
  syncFirestoreUserProfile
} from '../../firebase';
import { AppUser } from '../../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: AppUser) => void;
}

type LoginModalMode = 'main' | 'setup_password';

const REMEMBER_EMAIL_KEY = 'pusdatin_remembered_email';

const GoogleGIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

function mapFirebaseGoogleError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const msg = err instanceof Error ? err.message : String(err);

  if (code === 'auth/popup-closed-by-user') {
    return 'Login Google dibatalkan sebelum selesai.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Pop-up login Google diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba lagi.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Permintaan login Google sebelumnya dibatalkan. Silakan klik Masuk dengan Google lagi.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Koneksi jaringan ke layanan Google gagal. Periksa koneksi internet Anda.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Domain aplikasi belum diotorisasi di konfigurasi Firebase Authentication.';
  }
  return msg || 'Terjadi kesalahan saat autentikasi dengan Google.';
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin
}) => {
  const [mode, setMode] = useState<LoginModalMode>('main');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [pendingSetup, setPendingSetup] = useState<{
    user: AppUser;
    idToken: string;
    uid: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode('main');
      setErrorMessage('');
      setPasswordInput('');
      setShowPassword(false);
      setPendingSetup(null);
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setIsLoadingGoogle(false);
      setIsLoadingLogin(false);
      try {
        const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
        setEmailInput(savedEmail);
        setRememberMe(Boolean(savedEmail));
      } catch {
        setEmailInput('');
        setRememberMe(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const persistRememberedEmail = (email: string) => {
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      // ignore storage errors
    }
  };

  const resetAndClose = () => {
    setMode('main');
    setErrorMessage('');
    setPasswordInput('');
    setPendingSetup(null);
    setNewPassword('');
    setConfirmPassword('');
    setIsLoadingGoogle(false);
    setIsLoadingLogin(false);
    onClose();
  };

  const completeLogin = (user: AppUser) => {
    persistRememberedEmail(user.email);
    AppDatabase.upsertUser(user);
    AppDatabase.setActiveUser(user.id);
    onSuccessLogin(user);
    resetAndClose();
  };

  const handleGoogleButtonClick = async () => {
    if (isLoadingGoogle || isLoadingLogin) return;
    setErrorMessage('');
    setIsLoadingGoogle(true);

    try {
      const googleResult = await signInWithGooglePopup();

      const res = await fetch('/api/auth/google-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: googleResult.idToken })
      });
      const data = (await res.json()) as {
        ok?: boolean;
        requiresPasswordSetup?: boolean;
        user?: AppUser;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.user) {
        await signOutFirebaseSession();
        setErrorMessage(
          data.error ||
            'Login Google ditolak. Gunakan email resmi instansi UMC (@umc.ac.id atau @student.umc.ac.id).'
        );
        return;
      }

      if (data.requiresPasswordSetup) {
        void syncFirestoreUserProfile(googleResult.uid, data.user, false).catch(() => {});
        setPendingSetup({
          user: data.user,
          idToken: googleResult.idToken,
          uid: googleResult.uid
        });
        setNewPassword('');
        setConfirmPassword('');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setMode('setup_password');
        return;
      }

      void syncFirestoreUserProfile(googleResult.uid, data.user, true).catch(() => {});
      completeLogin(data.user);
    } catch (err) {
      setErrorMessage(mapFirebaseGoogleError(err));
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoadingLogin || isLoadingGoogle) return;
    setErrorMessage('');
    setIsLoadingLogin(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput
        })
      });
      const data = (await res.json()) as {
        ok?: boolean;
        user?: AppUser;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.user) {
        setErrorMessage(
          data.error || 'Email atau password salah. Silakan periksa kembali kredensial Anda.'
        );
        return;
      }

      completeLogin(data.user);
    } catch {
      setErrorMessage('Gagal terhubung ke server autentikasi. Silakan coba beberapa saat lagi.');
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSetupPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoadingLogin) return;
    setErrorMessage('');

    if (!pendingSetup) {
      setMode('main');
      return;
    }

    const check = validateNewPasswordSetup(newPassword, confirmPassword);
    if (!check.ok) {
      setErrorMessage(check.error || 'Password baru tidak valid.');
      return;
    }

    setIsLoadingLogin(true);
    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: pendingSetup.idToken,
          password: newPassword,
          confirmPassword
        })
      });
      const data = (await res.json()) as {
        ok?: boolean;
        user?: AppUser;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.user) {
        setErrorMessage(
          data.error || 'Gagal menyimpan password baru. Silakan ulangi Masuk dengan Google.'
        );
        return;
      }

      void syncFirestoreUserProfile(pendingSetup.uid, data.user, true).catch(() => {});
      completeLogin(data.user);
    } catch {
      setErrorMessage('Gagal menyimpan password ke server. Silakan coba lagi.');
    } finally {
      setIsLoadingLogin(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-[420px] w-full p-7 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={resetAndClose}
          data-testid="close-login-modal"
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Tutup modal login"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Centered Logo Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm p-2 flex items-center justify-center mb-4">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-13_at_10.12.42_2b1f1e05.jpeg"
              alt="Logo UMC PUSDATIN"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          {mode === 'main' && (
            <>
              <h3 id="login-modal-title" className="text-2xl font-extrabold text-slate-950 tracking-tight">
                Selamat Datang
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Silakan masuk untuk melanjutkan
              </p>
            </>
          )}

          {mode === 'setup_password' && (
            <>
              <h3 id="login-modal-title" className="text-2xl font-extrabold text-slate-950 tracking-tight">
                Buat Password
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Akun Google Anda belum memiliki password lokal. Buat password untuk menautkannya agar ke depan bisa masuk via Google maupun Email &amp; Password.
              </p>
            </>
          )}
        </div>

        {/* MODE 1: MAIN LOGIN CARD */}
        {mode === 'main' && (
          <div>
            {/* Real Browser Google Sign-In Button */}
            <button
              type="button"
              data-testid="google-login-button"
              disabled={isLoadingGoogle || isLoadingLogin}
              onClick={handleGoogleButtonClick}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60 border border-slate-200 rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2.5 text-sm font-semibold text-slate-800 cursor-pointer"
            >
              {isLoadingGoogle ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-500 shrink-0" />
              ) : (
                <GoogleGIcon className="w-5 h-5 shrink-0" />
              )}
              <span>{isLoadingGoogle ? 'Menghubungkan Google...' : 'Masuk dengan Google'}</span>
            </button>

            {/* ATAU Divider */}
            <div className="relative flex items-center my-5">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink-0 mx-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                ATAU
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="sso-email-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  EMAIL
                </label>
                <input
                  id="sso-email-input"
                  type="email"
                  autoFocus
                  data-testid="sso-email-input"
                  value={emailInput}
                  onChange={e => {
                    setEmailInput(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="nama@umc.ac.id"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="password-login-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="password-login-input"
                    type={showPassword ? 'text' : 'password'}
                    data-testid="password-login-input"
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    data-testid="toggle-password-visibility"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label="Tampilkan atau sembunyikan password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  data-testid="remember-me-checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">Ingat Saya</span>
              </label>

              {errorMessage && (
                <div
                  data-testid="sso-login-error"
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                data-testid="sso-submit-button"
                disabled={isLoadingLogin || isLoadingGoogle}
                className="w-full py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoadingLogin && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isLoadingLogin ? 'Memverifikasi...' : 'Masuk'}</span>
              </button>
            </form>
          </div>
        )}

        {/* MODE 2: FIRST-TIME MANDATORY PASSWORD CREATION (BUAT PASSWORD) */}
        {mode === 'setup_password' && pendingSetup && (
          <form onSubmit={handleSetupPasswordSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-950 truncate">
                  {pendingSetup.user.email}
                </div>
                <div className="text-[11px] font-medium text-emerald-700 mt-0.5">
                  Email Google terverifikasi ·{' '}
                  {pendingSetup.user.civitasType || pendingSetup.user.roleName}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="setup-password-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                PASSWORD BARU
              </label>
              <div className="relative">
                <input
                  id="setup-password-input"
                  type={showNewPassword ? 'text' : 'password'}
                  autoFocus
                  data-testid="setup-password-input"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Tampilkan atau sembunyikan password baru"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="setup-confirm-password-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                KONFIRMASI PASSWORD
              </label>
              <div className="relative">
                <input
                  id="setup-confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  data-testid="setup-confirm-password-input"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Ulangi password baru"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Tampilkan atau sembunyikan konfirmasi password"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div
                data-testid="sso-login-error"
                role="alert"
                className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              data-testid="setup-password-submit"
              disabled={isLoadingLogin}
              className="w-full py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoadingLogin ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{isLoadingLogin ? 'Menyimpan...' : 'Simpan Password & Masuk'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await signOutFirebaseSession();
                setErrorMessage('');
                setPendingSetup(null);
                setMode('main');
              }}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ganti Akun Google</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
