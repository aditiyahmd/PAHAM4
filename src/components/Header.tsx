import React from 'react';
import {
  LogOut,
  Bell,
  Menu,
  LayoutDashboard,
  UserCheck,
  Crown,
  Home,
  Users,
  LogIn
} from 'lucide-react';
import { AppDatabase } from '../services/db';

interface HeaderProps {
  pageMode: 'landing' | 'user' | 'admin' | 'executive';
  onNavigatePage: (mode: 'landing' | 'user' | 'admin' | 'executive') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenEmailLogs: () => void;
  onToggleMobileSidebar: () => void;
  onOpenActorSwitcher: () => void;
  pendingLoanCount: number;
  pendingDamageCount: number;
  overdueCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  pageMode,
  onNavigatePage,
  onOpenLogin,
  onLogout,
  onOpenEmailLogs,
  onToggleMobileSidebar,
  onOpenActorSwitcher,
  pendingLoanCount,
  pendingDamageCount,
  overdueCount = 0
}) => {
  const activeUser = AppDatabase.getActiveUser();
  const isLoggedIn = sessionStorage.getItem('pusdatin_sso_logged_in') === 'true';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          {pageMode !== 'landing' && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigatePage('landing')}
            title="Kembali ke Halaman Utama"
          >
            <img
              src="/assets/aistudio/Pusdatin_c64eee6c.png"
              alt="Logo PUSDATIN UMC"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900 tracking-tight block leading-tight">
                  PAHAM
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  PUSDATIN UMC
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Sistem Terpadu Aset, Helpdesk & Sistem Baru
              </span>
            </div>
          </div>
        </div>

        {/* Center: System Portal Switcher Tabs */}
        <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => onNavigatePage('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              pageMode === 'landing'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-slate-600" />
            <span>Halaman Utama</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigatePage('user')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              pageMode === 'user'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Halaman User</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigatePage('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              pageMode === 'admin'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-red-600" />
            <span>Halaman Admin</span>
            {pendingDamageCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-red-600 text-white rounded-full">
                {pendingDamageCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigatePage('executive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              pageMode === 'executive'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>Halaman Eksekutif</span>
          </button>
        </div>

        {/* Right: Actor Switcher, Logs, and Auth Status */}
        <div className="flex items-center gap-2">
          {/* Quick Actor Switcher Modal (Uji 10 Aktor RBAC) */}
          <button
            type="button"
            onClick={onOpenActorSwitcher}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer transition-all"
            title="Ganti Peran Aktor (ACT-01 s/d ACT-10)"
          >
            <Users className="w-3.5 h-3.5 text-cyan-700" />
            <span className="hidden lg:inline">{activeUser.role} - {activeUser.roleName.split(' ')[0]}</span>
            <span className="lg:hidden font-mono text-[10px]">{activeUser.role}</span>
          </button>

          {/* Email / Notification Logs */}
          <button
            type="button"
            onClick={onOpenEmailLogs}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Lihat Log Notifikasi WhatsApp & Email"
          >
            <Bell className="w-4 h-4" />
            <span className="sr-only">Notifikasi</span>
          </button>

          {/* Login / Logout SSO Google */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Keluar dari sesi akun saat ini"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login SSO Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

