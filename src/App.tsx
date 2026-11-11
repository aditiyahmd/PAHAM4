import React, { useState, useEffect } from 'react';
import { AppDatabase } from './services/db';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { UserDashboard } from './components/UserPortal/UserDashboard';
import { LoanForm } from './components/UserPortal/LoanForm';
import { DamageReportForm } from './components/UserPortal/DamageReportForm';
import { TicketTracker } from './components/UserPortal/TicketTracker';
import { SystemProposalForm } from './components/UserPortal/SystemProposalForm';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { ExecutiveDashboard } from './components/AdminPortal/ExecutiveDashboard';
import { BukuPenerimaanView } from './components/AdminPortal/BukuPenerimaanView';
import { BukuPengeluaranView } from './components/AdminPortal/BukuPengeluaranView';
import { BukuInventarisRekapView } from './components/AdminPortal/BukuInventarisRekapView';
import { LoanManagement } from './components/AdminPortal/LoanManagement';
import { DamageTicketManagement } from './components/AdminPortal/DamageTicketManagement';
import { AssetInventory } from './components/AdminPortal/AssetInventory';
import { AllAssetsMasterView } from './components/AdminPortal/AllAssetsMasterView';
import { BarcodeScannerThermal } from './components/AdminPortal/BarcodeScannerThermal';
import { MonthlyReportPdf } from './components/AdminPortal/MonthlyReportPdf';
import { MasterDataManagement } from './components/AdminPortal/MasterDataManagement';
import { PicDashboard } from './components/AdminPortal/PicDashboard';
import { SparePartsManagementView } from './components/AdminPortal/SparePartsManagementView';
import { SystemProposalManagement } from './components/AdminPortal/SystemProposalManagement';
import { AuditTrailView } from './components/AdminPortal/AuditTrailView';
import { AdminLoginModal } from './components/Modals/AdminLoginModal';
import { EmailNotificationModal } from './components/Modals/EmailNotificationModal';
import { ActorSwitcherModal } from './components/ActorSwitcherModal';
import { AppUser } from './types';

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('pusdatin_admin_auth') === 'true';
  });

  const [activeRole, setActiveRole] = useState<'user' | 'admin'>('admin');
  const [activeTab, setActiveTab] = useState<string>('dashboard-pimpinan');
  const [activeTrackId, setActiveTrackId] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isActorModalOpen, setIsActorModalOpen] = useState(false);

  // Statistics
  const [stats, setStats] = useState(() => AppDatabase.getStatistics());

  const refreshData = () => {
    setStats(AppDatabase.getStatistics());
  };

  useEffect(() => {
    refreshData();
  }, [activeTab, activeRole]);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    sessionStorage.setItem('pusdatin_admin_auth', 'true');
    setActiveRole('admin');
    const user = AppDatabase.getActiveUser();
    if (user.role === 'ACT-01' || user.role === 'ACT-02') {
      setActiveTab('dashboard-pimpinan');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('pusdatin_admin_auth');
    const civitas = AppDatabase.getUsers().find(u => u.role === 'ACT-10');
    if (civitas) AppDatabase.setActiveUser(civitas.id);
    setActiveRole('user');
    setActiveTab('dashboard-civitas');
  };

  const handleSwitchRole = (role: 'user' | 'admin') => {
    setActiveRole(role);
    if (role === 'admin') {
      const user = AppDatabase.getActiveUser();
      if (user.role === 'ACT-01' || user.role === 'ACT-02') {
        setActiveTab('dashboard-pimpinan');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setActiveTab('dashboard-civitas');
    }
  };

  const handleSelectTab = (tabId: string, searchTicketId?: string) => {
    if (searchTicketId) {
      setActiveTrackId(searchTicketId);
    }
    setActiveTab(tabId);
  };

  const handleSelectActor = (user: AppUser) => {
    refreshData();
    if (user.role === 'ACT-10') {
      setActiveRole('user');
      setActiveTab('dashboard-civitas');
    } else {
      setIsAdmin(true);
      sessionStorage.setItem('pusdatin_admin_auth', 'true');
      setActiveRole('admin');
      if (user.role === 'ACT-01' || user.role === 'ACT-02') {
        setActiveTab('dashboard-pimpinan');
      } else if (user.role === 'ACT-03') {
        setActiveTab('dashboard');
      } else if (user.role === 'ACT-04' || user.role === 'ACT-05' || user.role === 'ACT-09') {
        setActiveTab('kelola-tiket');
      } else if (user.role === 'ACT-06' || user.role === 'ACT-07' || user.role === 'ACT-08') {
        setActiveTab('pengajuan-sistem');
      } else {
        setActiveTab('dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <Header
        isAdmin={isAdmin}
        activeRole={activeRole}
        onSwitchRole={handleSwitchRole}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenEmailLogs={() => setIsEmailModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onOpenActorSwitcher={() => setIsActorModalOpen(true)}
        pendingLoanCount={stats.totalPinjamMenunggu}
        overdueCount={stats.totalPinjamTerlambat}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeRole={activeRole}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          pendingLoanCount={stats.totalPinjamMenunggu}
          pendingDamageCount={stats.totalAntreanTiket}
          overdueCount={stats.totalPinjamTerlambat}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenActorSwitcher={() => setIsActorModalOpen(true)}
        />

        {/* Main Viewport Content */}
        <main className="flex-1 lg:pl-72 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* USER PORTAL VIEWS */}
          {activeRole === 'user' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {activeTab === 'dashboard-civitas' && (
                <UserDashboard
                  stats={stats}
                  onNavigateTab={handleSelectTab}
                  onSelectAssetForLoan={() => setActiveTab('ajukan-pinjam')}
                />
              )}

              {activeTab === 'ajukan-pinjam' && (
                <LoanForm
                  onSuccessSubmit={() => {
                    refreshData();
                  }}
                  onNavigateTab={handleSelectTab}
                />
              )}

              {activeTab === 'lapor-rusak' && (
                <DamageReportForm
                  onSuccessSubmit={() => {
                    refreshData();
                  }}
                  onNavigateTab={handleSelectTab}
                />
              )}

              {activeTab === 'pengajuan-sistem-user' && (
                <SystemProposalForm
                  onSuccessSubmit={() => {
                    refreshData();
                  }}
                  onNavigateTab={handleSelectTab}
                />
              )}

              {activeTab === 'cek-progres' && (
                <TicketTracker initialSearchId={activeTrackId} />
              )}
            </div>
          )}

          {/* ADMIN & STAFF PORTAL VIEWS */}
          {activeRole === 'admin' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {activeTab === 'dashboard-pimpinan' && (
                <ExecutiveDashboard onNavigateTab={handleSelectTab} />
              )}

              {activeTab === 'dashboard' && (
                <AdminDashboard
                  stats={stats}
                  onNavigateTab={tab => setActiveTab(tab)}
                />
              )}

              {activeTab === 'dashboard-pic' && (
                <PicDashboard
                  onNavigateTab={handleSelectTab}
                />
              )}

              {activeTab === 'buku-penerimaan' && (
                <BukuPenerimaanView onDataChanged={refreshData} />
              )}

              {activeTab === 'buku-pengeluaran' && (
                <BukuPengeluaranView onDataChanged={refreshData} />
              )}

              {activeTab === 'buku-inventaris-rekap' && (
                <BukuInventarisRekapView onDataChanged={refreshData} />
              )}

              {activeTab === 'seluruh-aset' && (
                <AllAssetsMasterView onDataChanged={refreshData} />
              )}

              {activeTab === 'suku-cadang' && (
                <SparePartsManagementView onDataChanged={refreshData} />
              )}

              {activeTab === 'pengajuan-sistem' && (
                <SystemProposalManagement onDataChanged={refreshData} />
              )}

              {activeTab === 'audit-trail' && (
                <AuditTrailView />
              )}

              {activeTab === 'kelola-pinjam' && (
                <LoanManagement onDataChanged={refreshData} />
              )}

              {activeTab === 'kelola-tiket' && (
                <DamageTicketManagement onDataChanged={refreshData} />
              )}

              {activeTab === 'barang-masuk' && (
                <AssetInventory onDataChanged={refreshData} />
              )}

              {activeTab === 'cetak-barcode' && <BarcodeScannerThermal />}

              {activeTab === 'laporan-pdf' && <MonthlyReportPdf />}

              {activeTab === 'kelola-master' && (
                <MasterDataManagement onDataChanged={refreshData} />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccessLogin={handleLoginSuccess}
      />

      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      <ActorSwitcherModal
        isOpen={isActorModalOpen}
        onClose={() => setIsActorModalOpen(false)}
        onSelectUser={handleSelectActor}
      />
    </div>
  );
}
