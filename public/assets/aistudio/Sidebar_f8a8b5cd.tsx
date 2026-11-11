import React from 'react';
import {
  LayoutDashboard,
  Handshake,
  AlertTriangle,
  Search,
  Package,
  Barcode,
  FileText,
  Database,
  Lock,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeRole: 'user' | 'admin';
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingLoanCount: number;
  pendingDamageCount: number;
  onOpenLogin: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRole,
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  pendingLoanCount,
  pendingDamageCount,
  onOpenLogin
}) => {
  const userMenuItems: MenuItem[] = [
    { id: 'ajukan-pinjam', label: 'Ajukan Pinjam Aset', icon: Handshake },
    { id: 'lapor-rusak', label: 'Lapor Kerusakan', icon: AlertTriangle },
    { id: 'cek-progres', label: 'Cek Progres Laporan', icon: Search },
    { id: 'katalog-aset', label: 'Daftar Seluruh Aset Kampus', icon: Layers }
  ];

  const adminMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard Statistik', icon: LayoutDashboard },
    { id: 'seluruh-aset', label: 'Seluruh Aset PUSDATIN', icon: Layers },
    { id: 'kelola-pinjam', label: 'Kelola Peminjaman', icon: Handshake, badge: pendingLoanCount },
    { id: 'kelola-tiket', label: 'Kelola Tiket Rusak', icon: AlertTriangle, badge: pendingDamageCount },
    { id: 'barang-masuk', label: 'Input Aset Masuk & Barcode', icon: Package },
    { id: 'cetak-barcode', label: 'Printer Barcode POS-58', icon: Barcode },
    { id: 'laporan-pdf', label: 'Pelaporan Bulanan PDF', icon: FileText },
    { id: 'optimasi-db', label: 'Optimasi Database & Script', icon: Database }
  ];

  const currentItems = activeRole === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Pusdatin_c64eee6c.png"
              alt="Logo PUSDATIN UMC"
              className="h-9 w-auto object-contain"
            />
            <div>
              <span className="font-bold text-sm text-slate-900 block leading-tight">
                PUSDATIN UMC
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                {activeRole === 'admin' ? 'Workspace Admin' : 'Portal Layanan Civitas'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {activeRole === 'admin' ? 'Menu Administrator' : 'Menu Layanan Kampus'}
          </div>

          {currentItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white">
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-red-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info & quick switch */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          {activeRole === 'user' ? (
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="text-[11px] text-slate-500">
                Apakah Anda staf atau petugas pengelola inventaris PUSDATIN?
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenLogin();
                  onCloseMobile();
                }}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk Mode Admin</span>
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 text-center">
              PUSDATIN UMC v2.4 (Optimal)<br />
              Sistem Informasi Aset Terpadu
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
