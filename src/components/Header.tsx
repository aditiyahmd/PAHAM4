import React from 'react';
import {
  LogOut,
  Bell,
  Menu,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  pageMode: 'landing' | 'user' | 'admin' | 'executive';
  isLoggedIn: boolean;
  activeUser?: AppUser;
  isDesktopSidebarCollapsed: boolean;
  onNavigatePage: (mode: 'landing' | 'user' | 'admin' | 'executive') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenEmailLogs: () => void;
  onToggleSidebar: () => void;
  onOpenActorSwitcher?: () => void;
  pendingLoanCount: number;
  pendingDamageCount: number;
  overdueCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  pageMode,
  isLoggedIn,
  activeUser,
  isDesktopSidebarCollapsed,
  onNavigatePage,
  onOpenLogin,
  onLogout,
  onOpenEmailLogs,
  onToggleSidebar
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div
        className={`${
          pageMode === 'landing' ? 'max-w-7xl mx-auto' : 'w-full'
        } px-4 sm:px-6 h-16 flex items-center justify-between gap-4`}
      >
        {/* Left: Universal Sidebar Toggle (all viewports in portals) & Brand */}
        <div className="flex items-center gap-3 min-w-0">
          {pageMode !== 'landing' && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 border border-slate-200/80 focus:outline-none cursor-pointer transition-colors shrink-0"
              aria-label="Toggle navigation menu"
              title={isDesktopSidebarCollapsed ? 'Tampilkan Menu Samping' : 'Perkecil / Tutup Menu Samping'}
            >
              <span className="lg:hidden">
                <Menu className="w-5 h-5" />
              </span>
              <span className="hidden lg:inline-flex">
                {isDesktopSidebarCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5 text-red-600" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </span>
            </button>
          )}

          <div
            className="flex items-center gap-3 cursor-pointer group min-w-0"
            onClick={() => onNavigatePage('landing')}
            title="Kembali ke Halaman Utama"
          >
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-2xs p-1 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-13_at_10.12.42_2b1f1e05.jpeg"
                alt="Logo UMC PUSDATIN"
                className="h-full w-full object-contain rounded-md transition-transform group-hover:scale-105"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-950 tracking-tight leading-tight">
                  PAHAM
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 shrink-0">
                  PUSDATIN UMC
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block truncate">
                Sistem Terpadu Aset, Helpdesk & Sistem Baru
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation (Only on Landing Page) */}
        {pageMode === 'landing' && (
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#tentang-sistem" className="hover:text-red-700 transition-colors">
              Tentang Sistem
            </a>
            <a href="#alur-sop" className="hover:text-red-700 transition-colors">
              Alur SOP Layanan
            </a>
            <a href="#profil-pusdatin" className="hover:text-red-700 transition-colors">
              Profil PUSDATIN
            </a>
            <a href="#struktur-organisasi" className="hover:text-red-700 transition-colors">
              Struktur Organisasi
            </a>
          </nav>
        )}

        {/* Right: Notification Logs and Auth Status */}
        <div className="flex items-center gap-2 shrink-0">
          {pageMode !== 'landing' && (
            <button
              type="button"
              onClick={onOpenEmailLogs}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative cursor-pointer"
              title="Lihat Log Notifikasi WhatsApp & Email"
            >
              <Bell className="w-4 h-4" />
              <span className="sr-only">Notifikasi</span>
            </button>
          )}

          {/* Login / Logout SSO Google */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              {activeUser && (
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <span className="text-xs font-bold text-slate-900 max-w-[180px] truncate">
                    {activeUser.nama}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {activeUser.role} · {activeUser.roleName}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={onLogout}
                data-testid="logout-button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                title="Keluar dari sesi akun saat ini"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              data-testid="login-button"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
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
