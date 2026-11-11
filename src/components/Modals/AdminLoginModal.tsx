import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, X, KeyRound } from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { TechnicianUser } from '../../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: TechnicianUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = emailInput.trim();
    const trimmedPassword = passwordInput.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage('Harap isi email institusi dan password!');
      return;
    }

    const user = AppDatabase.authenticateUser(trimmedEmail, trimmedPassword);
    if (user) {
      AppDatabase.setActiveTechnician(user);
      onSuccessLogin(user);
      setEmailInput('');
      setPasswordInput('');
      onClose();
    } else {
      setErrorMessage('Kombinasi email atau password salah! Silakan periksa kembali kredensial Anda.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Login Petugas & PIC PUSDATIN
              </h3>
              <p className="text-xs text-slate-500">
                Masuk menggunakan email resmi dan kata sandi petugas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Secure Form */}
        <form onSubmit={handleLogin} className="space-y-4 pt-1">
          {/* Email / Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Institusi / Akun PIC
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                autoFocus
                value={emailInput}
                onChange={e => {
                  setEmailInput(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="nama.pic@umc.ac.id"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password PIC
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={passwordInput}
                onChange={e => {
                  setPasswordInput(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold leading-relaxed">
              {errorMessage}
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Masuk ke Workspace PUSDATIN</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
            Manajemen akun dan perubahan kata sandi dikelola secara terpusat oleh Admin pada menu <strong>Master Data & Akun PIC</strong>.
          </p>
        </form>
      </div>
    </div>
  );
};
