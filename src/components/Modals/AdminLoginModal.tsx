import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, X, Check, ArrowRight, UserCheck, Sparkles, Building2 } from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { SEED_USERS } from '../../services/rbac';
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
  const [activeTab, setActiveTab] = useState<'pilih-akun' | 'input-email'>('pilih-akun');

  if (!isOpen) return null;

  const handleSelectUser = (user: AppUser) => {
    AppDatabase.setActiveUser(user.id);
    onSuccessLogin(user);
    onClose();
  };

  const handleManualEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage('Harap masukkan email Google atau instansi @umc.ac.id!');
      return;
    }

    const allUsers = AppDatabase.getUsers();
    let found = allUsers.find(u => u.email.toLowerCase() === trimmed);

    if (!found) {
      // If email ends with @student.umc.ac.id or contains student, treat as Mahasiswa
      if (trimmed.includes('student') || trimmed.includes('mhs')) {
        found = {
          id: `USR-MHS-${Date.now()}`,
          nama: emailInput.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
          email: trimmed,
          role: 'ACT-10',
          roleName: 'User (Civitas Akademika)',
          civitasType: 'Mahasiswa',
          unit: 'Fakultas / Program Studi UMC',
          phone: '085700000000',
          statusAkun: 'Aktif',
          sumberData: 'SSO Google'
        };
      } else {
        // Default to Civitas Karyawan/Dosen
        found = {
          id: `USR-CIV-${Date.now()}`,
          nama: emailInput.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
          email: trimmed,
          role: 'ACT-10',
          roleName: 'User (Civitas Akademika)',
          civitasType: 'Dosen',
          unit: 'Unit Kerja / Dosen UMC',
          phone: '081200000000',
          statusAkun: 'Aktif',
          sumberData: 'SSO Google'
        };
      }
      AppDatabase.addUser(found);
    }

    AppDatabase.setActiveUser(found.id);
    onSuccessLogin(found);
    setEmailInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
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
                Masuk menggunakan akun Google / email instansi terdaftar
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
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('pilih-akun')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'pilih-akun'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pilih Akun Terdaftar (1-Klik)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('input-email')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'input-email'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Input Email Institusi
          </button>
        </div>

        {activeTab === 'pilih-akun' ? (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="text-[11px] font-semibold text-slate-500 px-1">
              Pilih profil pengguna sesuai jabatan Anda untuk diarahkan langsung ke halaman sistem:
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {SEED_USERS.map(user => {
                const isExecutive = user.role === 'ACT-01';
                const isPusdatin = user.role === 'ACT-02' || user.role === 'ACT-03';
                const isTeknisi = ['ACT-04', 'ACT-05', 'ACT-06', 'ACT-07', 'ACT-08', 'ACT-09'].includes(user.role);

                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 group-hover:bg-red-50 group-hover:text-red-700 transition-colors">
                        {user.nama.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{user.nama}</span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                              isExecutive
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : isPusdatin
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : isTeknisi
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-purple-100 text-purple-800 border-purple-200'
                            }`}
                          >
                            {isExecutive
                              ? 'Halaman Eksekutif'
                              : isPusdatin || isTeknisi
                              ? 'Halaman Admin'
                              : 'Halaman User'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate">{user.email}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user.unit}</div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-red-600 transition-colors">
                      <span className="text-[11px]">Masuk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualEmailLogin} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Google / Institusi UMC
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
                  placeholder="nama.user@umc.ac.id atau akun@student.umc.ac.id"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold leading-relaxed">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lanjutkan dengan SSO Google</span>
            </button>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <p>• Email dosen/karyawan (@umc.ac.id) otomatis mendapatkan akses sesuai unit.</p>
              <p>• Email mahasiswa (@student.umc.ac.id) otomatis masuk ke Halaman User.</p>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          Universitas Muhammadiyah Cirebon • PUSDATIN Asset & Helpdesk Assistance Management
        </div>
      </div>
    </div>
  );
};
