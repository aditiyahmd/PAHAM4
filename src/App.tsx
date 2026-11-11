import React, { useState, useEffect } from 'react';
import { AppDatabase } from './services/db';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { UserDashboard } from './components/UserPortal/UserDashboard';
import { LoanForm } from './components/UserPortal/LoanForm';
import { DamageReportForm } from './components/UserPortal/DamageReportForm';
import { TicketTracker } from './components/UserPortal/TicketTracker';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { LoanManagement } from './components/AdminPortal/LoanManagement';
import { DamageTicketManagement } from './components/AdminPortal/DamageTicketManagement';
import { AssetInventory } from './components/AdminPortal/AssetInventory';
import { AllAssetsMasterView } from './components/AdminPortal/AllAssetsMasterView';
import { BarcodeScannerThermal } from './components/AdminPortal/BarcodeScannerThermal';
import { MonthlyReportPdf } from './components/AdminPortal/MonthlyReportPdf';
import { MasterDataManagement } from './components/AdminPortal/MasterDataManagement';
import { PicDashboard } from './components/AdminPortal/PicDashboard';
import { SparePartsManagementView } from './components/AdminPortal/SparePartsManagementView';
import { AdminLoginModal } from './components/Modals/AdminLoginModal';
import { EmailNotificationModal } from './components/Modals/EmailNotificationModal';

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('pusdatin_admin_auth') === 'true';
  });

  const [activeRole, setActiveRole] = useState<'user' | 'admin'>('user');
  const [activeTab, setActiveTab] = useState<string>('dashboard-civitas');
  const [activeTrackId, setActiveTrackId] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

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
    const tech = AppDatabase.getActiveTechnician();
    if (tech && !tech.isFullAccess) {
      setActiveTab('dashboard-pic');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('pusdatin_admin_auth');
    AppDatabase.setActiveTechnician(null);
    setActiveRole('user');
    setActiveTab('dashboard-civitas');
  };

  const handleSwitchRole = (role: 'user' | 'admin') => {
    setActiveRole(role);
    if (role === 'admin') {
      const tech = AppDatabase.getActiveTechnician();
      if (tech && !tech.isFullAccess) {
        setActiveTab('dashboard-pic');
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
    const tech = AppDatabase.getActiveTechnician();
    if (tech && !tech.isFullAccess && activeRole === 'admin') {
      // Restricted PIC can only access their dashboard and their damage tickets
      if (tabId !== 'dashboard-pic' && tabId !== 'kelola-tiket') {
        setActiveTab('dashboard-pic');
        return;
      }
    }
    setActiveTab(tabId);
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

              {activeTab === 'cek-progres' && (
                <TicketTracker initialSearchId={activeTrackId} />
              )}
            </div>
          )}

          {/* ADMIN PORTAL VIEWS */}
          {activeRole === 'admin' && (
            <div className="max-w-6xl mx-auto space-y-6">
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

              {activeTab === 'seluruh-aset' && (
                <AllAssetsMasterView onDataChanged={refreshData} />
              )}

              {activeTab === 'suku-cadang' && (
                <SparePartsManagementView onDataChanged={refreshData} />
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
    </div>
  );
}
