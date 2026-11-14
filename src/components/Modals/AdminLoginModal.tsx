import React, { useState } from 'react';
import { Lock, Mail, X, ShieldAlert } from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { validateRegisteredSsoLogin } from '../../services/authValidation';
import { AppUser } from '../../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: AppUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleManualEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const allUsers = AppDatabase.getUsers();
    const validation = validateRegisteredSsoLogin(emailInput, allUsers);

    if (!validation.ok || !validation.user) {
      setErrorMessage(
        validation.error ||
          'Login ditolak. Gunakan email resmi instansi UMC (@umc.ac.id atau @student.umc.ac.id).'
      );
      return;
    }

    if (validation.isNewUser) {
      AppDatabase.addUser(validation.user);
    }

    AppDatabase.setActiveUser(validation.user.id);
    onSuccessLogin(validation.user);
    setEmailInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-950">
                Single Sign-On (SSO) Google UMC
              </h3>
              <p className="text-xs text-slate-500">
                Masuk menggunakan email resmi Universitas Muhammadiyah Cirebon
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup modal login"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Institutional Email SSO Login Form */}
        <form onSubmit={handleManualEmailLogin} className="space-y-4 pt-1">
          <div>
            <label htmlFor="sso-email-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Institusi UMC (@umc.ac.id / @student.umc.ac.id)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="sso-email-input"
                type="email"
                required
                autoFocus
                data-testid="sso-email-input"
                value={emailInput}
                onChange={e => {
                  setEmailInput(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="nama@umc.ac.id atau nim@student.umc.ac.id"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
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
            data-testid="sso-submit-button"
            className="w-full py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lanjutkan dengan SSO Google</span>
          </button>

        </form>

        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          Universitas Muhammadiyah Cirebon • PUSDATIN Asset & Helpdesk Assistance Management
        </div>
      </div>
    </div>
  );
};
