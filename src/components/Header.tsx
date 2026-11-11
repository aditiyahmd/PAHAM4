import React from 'react';
import { ShieldCheck, LogOut, Lock, Bell, Menu, LayoutDashboard, UserCheck, AlertTriangle, Users } from 'lucide-react';
import { AppDatabase } from '../services/db';

interface HeaderProps {
  isAdmin: boolean;
  activeRole: 'user' | 'admin';
  onSwitchRole: (role: 'user' | 'admin') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenEmailLogs: () => void;
  onToggleMobileSidebar: () => void;
  onOpenActorSwitcher: () => void;
  pendingLoanCount: number;
  overdueCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  activeRole,
  onSwitchRole,
  onOpenLogin,
  onLogout,
  onOpenEmailLogs,
  onToggleMobileSidebar,
  onOpenActorSwitcher,
  pendingLoanCount,
  overdueCount = 0
}) => {
  const activeUser = AppDatabase.getActiveUser();

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
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900 tracking-tight block leading-tight">
                  PAHAM
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  PUSDATIN UMC
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Sistem Terpadu Inventaris, Helpdesk & Sistem Baru
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher (Portal Civitas vs Admin Workspace) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => onSwitchRole('user')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeRole === 'admin'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-red-600" />
            <span>Admin PUSDATIN</span>
            {overdueCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-red-600 text-white rounded-full flex items-center gap-0.5 animate-pulse" title={`${overdueCount} aset terlambat kembali`}>
                <AlertTriangle className="w-2.5 h-2.5" />
                {overdueCount}
              </span>
            )}
            {overdueCount === 0 && pendingLoanCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                {pendingLoanCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Actor Switcher & Auth */}
        <div className="flex items-center gap-2">
          {/* 10 Actor Switcher Button (Testing & RBAC Demonstration) */}
          <button
            type="button"
            onClick={onOpenActorSwitcher}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer transition-all"
            title="Ganti Peran Aktor (ACT-01 s/d ACT-10)"
          >
            <Users className="w-3.5 h-3.5 text-cyan-700" />
            <span className="hidden md:inline">{activeUser.role} - {activeUser.roleName.split(' ')[0]}</span>
            <span className="md:hidden font-mono text-[10px]">{activeUser.role}</span>
          </button>

          {/* Email / Notification Log Trigger */}
          <button
            type="button"
            onClick={onOpenEmailLogs}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Lihat Log Notifikasi WhatsApp & Email"
          >
            <Bell className="w-4 h-4" />
            <span className="sr-only">Notifikasi</span>
          </button>

          {/* Admin Auth Status */}
          {isAdmin ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer"
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
