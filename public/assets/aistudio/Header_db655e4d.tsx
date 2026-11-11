import React from 'react';
import { ShieldCheck, LogOut, Lock, Bell, Menu, LayoutDashboard, UserCheck, ArrowRightLeft } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  activeRole: 'user' | 'admin';
  onSwitchRole: (role: 'user' | 'admin') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenEmailLogs: () => void;
  onToggleMobileSidebar: () => void;
  pendingLoanCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  activeRole,
  onSwitchRole,
  onOpenLogin,
  onLogout,
  onOpenEmailLogs,
  onToggleMobileSidebar,
  pendingLoanCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Pusdatin_c64eee6c.png"
              alt="Logo PUSDATIN UMC"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                PUSDATIN UMC
              </span>
              <span className="text-xs text-slate-500 font-medium block">
                Sistem Informasi Aset & Inventaris
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher (Portal User vs Admin Workspace) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => onSwitchRole('user')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeRole === 'user'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Portal Civitas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isAdmin) {
                onSwitchRole('admin');
              } else {
                onOpenLogin();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeRole === 'admin'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-red-600" />
            <span>Admin PUSDATIN</span>
            {pendingLoanCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-red-600 text-white rounded-full">
                {pendingLoanCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Quick actions & Authentication */}
        <div className="flex items-center gap-2">
          {/* Email Log Trigger */}
          <button
            type="button"
            onClick={onOpenEmailLogs}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative"
            title="Lihat Log Notifikasi Email Otomatis"
          >
            <Bell className="w-4 h-4" />
            <span className="sr-only">Notifikasi Email</span>
          </button>

          {/* Admin Auth Status */}
          {isAdmin ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Aktif</span>
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Keluar dari sesi Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
