import React from 'react';
import {
  LayoutDashboard,
  Handshake,
  AlertTriangle,
  Search,
  Package,
  Layers,
  ChevronRight,
  Wrench,
  BookOpen,
  ArrowUpRight,
  Code2,
  LockKeyhole,
  BarChart3,
  Users,
  X,
  Lock,
  Home
} from 'lucide-react';
import { AppDatabase } from '../services/db';

interface SidebarProps {
  pageMode: 'landing' | 'user' | 'admin' | 'executive';
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onNavigateHome: () => void;
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  pageMode,
  activeTab,
  onSelectTab,
  onNavigateHome,
  isOpenMobile,
  onCloseMobile,
  pendingLoanCount,
  pendingDamageCount,
  overdueCount = 0,
  onOpenLogin,
  onOpenActorSwitcher
}) => {
  const activeUser = AppDatabase.getActiveUser();

  // Count tickets assigned/delegated to current user
  const myAssignedTicketsCount = AppDatabase.getDamageTickets().filter(
    t => ((t as any).delegatedToUserId === activeUser.id || t.assignedTechnicianId === activeUser.id) &&
         t.status !== 'Resolved' && t.status !== 'Selesai' && !t.status.startsWith('Closed')
  ).length;

  // 1. User Portal Menu Items (Dosen, Karyawan, Mahasiswa)
  // Note: "Ajukan Sistem Baru" only appears for Dosen or Karyawan (hidden for Mahasiswa)
  const isMahasiswa = activeUser.civitasType === 'Mahasiswa';
  const userMenuItems: MenuItem[] = [
    { id: 'dashboard-civitas', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ajukan-pinjam', label: 'Ajukan Pinjam Aset', icon: Handshake },
    { id: 'lapor-rusak', label: 'Lapor Kerusakan', icon: AlertTriangle },
    ...(!isMahasiswa
      ? [{ id: 'pengajuan-sistem-user', label: 'Ajukan Sistem Baru', icon: Code2 }]
      : []),
    { id: 'cek-progres', label: 'Cek Progres & Konfigurasi', icon: Search }
  ];

  // 2. Executive Portal Menu Items (Rektor & Wakil Rektor 1)
  const executiveMenuItems: MenuItem[] = [
    {
      id: 'dashboard-pimpinan',
      label: 'Dashboard Pimpinan',
      icon: BarChart3
    },
    {
      id: 'seluruh-aset',
      label: 'Master Aset',
      icon: Package
    },
    {
      id: 'buku-inventaris-rekap',
      label: 'Buku Aset Inventaris',
      icon: Layers
    }
  ];

  // 3. Admin Portal Menu Items by Technical Role (Section 2.3)
  const roleCode = activeUser.role;
  let adminMenuItems: MenuItem[] = [];

  if (roleCode === 'ACT-02' || roleCode === 'ACT-03') {
    // Pimpinan PUSDATIN & IT Support Specialist (Admin Sistem): Semua menu
    adminMenuItems = [
      {
        id: 'dashboard-pimpinan',
        label: 'Dashboard Pimpinan',
        icon: BarChart3
      },
      {
        id: 'dashboard',
        label: 'Dashboard Operasional',
        icon: LayoutDashboard
      },
      {
        id: 'buku-penerimaan',
        label: 'Buku Penerimaan',
        icon: BookOpen
      },
      {
        id: 'buku-pengeluaran',
        label: 'Buku Pengeluaran',
        icon: ArrowUpRight
      },
      {
        id: 'buku-inventaris-rekap',
        label: 'Buku Aset Inventaris',
        icon: Layers
      },
      {
        id: 'seluruh-aset',
        label: 'Master Aset',
        icon: Package
      },
      {
        id: 'kelola-pinjam',
        label: 'Kelola Peminjaman',
        icon: Handshake,
        badge: pendingLoanCount > 0 ? pendingLoanCount : (overdueCount > 0 ? overdueCount : undefined),
        badgeColor: overdueCount > 0 ? 'bg-red-600' : 'bg-amber-600'
      },
      {
        id: 'kelola-tiket',
        label: 'Helpdesk & Tiket SLA',
        icon: AlertTriangle,
        badge: pendingDamageCount,
        badgeColor: 'bg-red-600'
      },
      {
        id: 'suku-cadang',
        label: 'Kebutuhan Suku Cadang',
        icon: Wrench,
        badge: AppDatabase.getAllSpareParts().filter(s => s.statusPengadaan === 'Diminta').length || undefined,
        badgeColor: 'bg-amber-600'
      },
      {
        id: 'pengajuan-sistem',
        label: 'Pengajuan Sistem Baru',
        icon: Code2,
        badge: AppDatabase.getSystemProposals().filter(p => p.status === 'status_verifikasi').length || undefined,
        badgeColor: 'bg-cyan-600'
      },
      {
        id: 'audit-trail',
        label: 'Audit Terpadu',
        icon: LockKeyhole
      },
      {
        id: 'kelola-master',
        label: 'Master Data & Pengguna',
        icon: Users
      }
    ];
  } else if (roleCode === 'ACT-04') {
    // Cloud & Infrastructure Engineer: Dashboard dengan notifikasi tiket yang didelegasikan kepadanya, dan Helpdesk & Tiket SLA
    adminMenuItems = [
      {
        id: 'dashboard-pic',
        label: 'Dashboard Tim Teknis',
        icon: LayoutDashboard,
        badge: myAssignedTicketsCount > 0 ? myAssignedTicketsCount : undefined,
        badgeColor: 'bg-red-600'
      },
      {
        id: 'kelola-tiket',
        label: 'Helpdesk & Tiket SLA',
        icon: AlertTriangle,
        badge: myAssignedTicketsCount > 0 ? myAssignedTicketsCount : undefined,
        badgeColor: 'bg-red-600'
      }
    ];
  } else {
    // ACT-05, ACT-06, ACT-07, ACT-08, ACT-09:
    // Dashboard dengan notifikasi tiket yang didelegasikan, Helpdesk & Tiket SLA, dan Pengajuan Sistem Baru
    adminMenuItems = [
      {
        id: 'dashboard-pic',
        label: 'Dashboard Tim Teknis',
        icon: LayoutDashboard,
        badge: myAssignedTicketsCount > 0 ? myAssignedTicketsCount : undefined,
        badgeColor: 'bg-red-600'
      },
      {
        id: 'kelola-tiket',
        label: 'Helpdesk & Tiket SLA',
        icon: AlertTriangle,
        badge: myAssignedTicketsCount > 0 ? myAssignedTicketsCount : undefined,
        badgeColor: 'bg-red-600'
      },
      {
        id: 'pengajuan-sistem',
        label: 'Pengajuan Sistem Baru',
        icon: Code2,
        badge: AppDatabase.getSystemProposals().filter(p => p.status === 'status_verifikasi').length || undefined,
        badgeColor: 'bg-cyan-600'
      }
    ];
  }

  // Pick current menu item set based on pageMode
  let currentItems: MenuItem[] = [];
  let portalTitle = 'Portal Layanan Civitas';

  if (pageMode === 'user') {
    currentItems = userMenuItems;
    portalTitle = `Portal Civitas (${activeUser.civitasType || 'User'})`;
  } else if (pageMode === 'executive') {
    currentItems = executiveMenuItems;
    portalTitle = 'Portal Eksekutif (Pimpinan)';
  } else if (pageMode === 'admin') {
    currentItems = adminMenuItems;
    portalTitle = `Portal PUSDATIN (${activeUser.role})`;
  }

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
              className="h-9 w-auto object-contain cursor-pointer"
              onClick={onNavigateHome}
            />
            <div>
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={onNavigateHome}>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                  PAHAM
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-100 text-red-700 rounded border border-red-200">
                  UMC
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                {portalTitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">

          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {pageMode === 'user'
              ? 'Menu Layanan Civitas'
              : pageMode === 'executive'
              ? 'Menu Pimpinan Universitas'
              : `Menu Teknis (${activeUser.role})`}
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white shrink-0 ${
                      item.badgeColor || 'bg-red-600'
                    }`}
                  >
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
          <div className="text-[11px] text-slate-500 text-center space-y-1">
            <div>
              <strong className="text-slate-800">PUSDATIN UMC</strong>
            </div>
            <div className="text-[10px] text-slate-400">
              Sistem Terpadu Inventaris, Helpdesk & Sistem Baru
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

