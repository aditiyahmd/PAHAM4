import React from 'react';
import {
  LayoutDashboard,
  Handshake,
  AlertTriangle,
  Search,
  Package,
  Barcode,
  FileText,
  Lock,
  X,
  Layers,
  ChevronRight,
  ShieldCheck,
  Clock,
  Wrench,
  BookOpen,
  ArrowUpRight,
  Code2,
  LockKeyhole,
  BarChart3,
  Users
} from 'lucide-react';
import { AppDatabase } from '../services/db';
import { AccessControlService } from '../services/rbac';

interface SidebarProps {
  activeRole: 'user' | 'admin';
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingLoanCount: number;
  pendingDamageCount: number;
  overdueCount?: number;
  onOpenLogin: () => void;
  onOpenActorSwitcher?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
  moduleKey?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRole,
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  pendingLoanCount,
  pendingDamageCount,
  overdueCount = 0,
  onOpenLogin,
  onOpenActorSwitcher
}) => {
  const activeUser = AppDatabase.getActiveUser();

  // Portal Civitas Items (ACT-10)
  const userMenuItems: MenuItem[] = [
    { id: 'dashboard-civitas', label: 'Dashboard Informasi Aset', icon: LayoutDashboard },
    { id: 'ajukan-pinjam', label: 'Ajukan Pinjam Aset (Modul C)', icon: Handshake },
    { id: 'lapor-rusak', label: 'Lapor Kerusakan IT (Modul B)', icon: AlertTriangle },
    { id: 'pengajuan-sistem-user', label: 'Ajukan Sistem Baru (F-DEV-01)', icon: Code2 },
    { id: 'cek-progres', label: 'Cek Progres & Konfirmasi (BR-008)', icon: Search }
  ];

  // Admin & Staff Workspace Items with RBAC Mapping
  const allAdminMenuItems: MenuItem[] = [
    {
      id: 'dashboard-pimpinan',
      label: 'Dashboard Pimpinan (5.5)',
      icon: BarChart3,
      moduleKey: 'dashboard_pimpinan',
      badge: statsOverdueBadge(overdueCount),
      badgeColor: 'bg-red-600'
    },
    {
      id: 'dashboard',
      label: 'Dashboard Operasional',
      icon: LayoutDashboard,
      moduleKey: 'dashboard_ringkasan'
    },
    {
      id: 'buku-penerimaan',
      label: 'Buku Penerimaan Aset (A.1)',
      icon: BookOpen,
      moduleKey: 'buku_penerimaan'
    },
    {
      id: 'buku-pengeluaran',
      label: 'Buku Pengeluaran (A.2)',
      icon: ArrowUpRight,
      moduleKey: 'buku_pengeluaran'
    },
    {
      id: 'buku-inventaris-rekap',
      label: 'Buku Aset Inventaris (A.3)',
      icon: Layers,
      moduleKey: 'buku_inventaris'
    },
    {
      id: 'seluruh-aset',
      label: 'Master Aset & Registrasi QR',
      icon: Package,
      moduleKey: 'registrasi_aset_qr'
    },
    {
      id: 'kelola-pinjam',
      label: 'Kelola Peminjaman (Modul C)',
      icon: Handshake,
      moduleKey: 'peminjaman_aset',
      badge: pendingLoanCount > 0 ? pendingLoanCount : (overdueCount > 0 ? overdueCount : undefined),
      badgeColor: overdueCount > 0 ? 'bg-red-600' : 'bg-amber-600'
    },
    {
      id: 'kelola-tiket',
      label: 'Helpdesk & Tiket SLA (Modul B)',
      icon: AlertTriangle,
      moduleKey: 'distribusi_tiket',
      badge: pendingDamageCount,
      badgeColor: 'bg-red-600'
    },
    {
      id: 'suku-cadang',
      label: 'Kebutuhan Suku Cadang (B.4)',
      icon: Wrench,
      moduleKey: 'suku_cadang',
      badge: AppDatabase.getAllSpareParts().filter(s => s.statusPengadaan === 'Diminta').length || undefined,
      badgeColor: 'bg-amber-600'
    },
    {
      id: 'pengajuan-sistem',
      label: 'Pengajuan Sistem Baru (5.4)',
      icon: Code2,
      moduleKey: 'pengajuan_sistem',
      badge: AppDatabase.getSystemProposals().filter(p => p.status === 'status_verifikasi').length || undefined,
      badgeColor: 'bg-cyan-600'
    },
    {
      id: 'audit-trail',
      label: 'Audit Trail Terpadu (BR-016)',
      icon: LockKeyhole,
      moduleKey: 'audit_trail'
    },
    {
      id: 'cetak-barcode',
      label: 'Label QR & Barcode (BR-002)',
      icon: Barcode,
      moduleKey: 'registrasi_aset_qr'
    },
    {
      id: 'laporan-pdf',
      label: 'Laporan Eksekutif PDF',
      icon: FileText,
      moduleKey: 'dashboard_pimpinan'
    },
    {
      id: 'kelola-master',
      label: 'Master Data & 10 Aktor',
      icon: Users,
      moduleKey: 'registrasi_aset_qr'
    }
  ];

  function statsOverdueBadge(count: number) {
    return count > 0 ? count : undefined;
  }

  // Filter admin menu items by active user role RBAC permissions
  const filteredAdminItems = allAdminMenuItems.filter(item => {
    if (!item.moduleKey) return true;
    return AccessControlService.canAccess(activeUser.role, item.moduleKey);
  });

  const currentItems = activeRole === 'user' ? userMenuItems : filteredAdminItems;

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
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                  PAHAM
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-100 text-red-700 rounded border border-red-200">
                  UMC
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                {activeRole === 'admin' ? `Peran: ${activeUser.role}` : 'Portal Layanan Civitas'}
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

        {/* Current Active User Profile Banner in Sidebar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{activeUser.nama}</div>
              <div className="text-[10px] text-slate-500 truncate">{activeUser.roleName} ({activeUser.role})</div>
            </div>

            {onOpenActorSwitcher && (
              <button
                type="button"
                onClick={onOpenActorSwitcher}
                className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 rounded-md text-[10px] font-bold cursor-pointer shrink-0 transition-all shadow-2xs"
                title="Ganti Peran Aktor"
              >
                Ganti Aktor
              </button>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {activeRole === 'admin' ? `Menu Hak Akses (${activeUser.role})` : 'Menu Layanan Civitas Kampus'}
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-700 font-bold shadow-2xs border border-red-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 ? (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white shrink-0 ${item.badgeColor || 'bg-red-600'}`}>
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-red-600 shrink-0" />
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
                Akses Pimpinan atau Tim Teknis PUSDATIN UMC?
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenLogin();
                  onCloseMobile();
                }}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk Mode Administrator</span>
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 text-center space-y-1">
              <div>
                <strong className="text-slate-800">PAHAM UMC</strong> (Kontrak Sistem PUSDATIN)
              </div>
              <div className="text-[10px] text-slate-400">
                10 Aktor RBAC • 16 Tabel • WhatsApp Gateway
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
