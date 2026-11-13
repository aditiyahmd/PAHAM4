import React, { useState, useEffect } from 'react';
import { AppDatabase } from './services/db';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LandingPageView } from './components/LandingPageView';
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
import { AllAssetsMasterView } from './components/AdminPortal/AllAssetsMasterView';
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
  const [pageMode, setPageMode] = useState<'landing' | 'user' | 'admin' | 'executive'>('landing');
  const [activeTab, setActiveTab] = useState<string>('dashboard-pimpinan');
  const [activeTrackId, setActiveTrackId] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => sessionStorage.getItem('pusdatin_sso_logged_in') === 'true'
  );

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
  }, [activeTab, pageMode, isLoggedIn]);

  const activeUser = AppDatabase.getActiveUser();

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setIsDesktopSidebarCollapsed(prev => !prev);
    } else {
      setIsMobileSidebarOpen(prev => !prev);
    }
  };

  const handleLoginSuccess = () => {
    sessionStorage.setItem('pusdatin_sso_logged_in', 'true');
    setIsLoggedIn(true);
    const user = AppDatabase.getActiveUser();
    refreshData();
    if (user.role === 'ACT-01') {
      setPageMode('executive');
      setActiveTab('dashboard-pimpinan');
    } else if (user.role === 'ACT-10') {
      setPageMode('user');
      setActiveTab('dashboard-civitas');
    } else {
      setPageMode('admin');
      if (user.role === 'ACT-02') {
        setActiveTab('dashboard-pimpinan');
      } else if (user.role === 'ACT-03') {
        setActiveTab('dashboard');
      } else if (user.role === 'ACT-04') {
        setActiveTab('dashboard-pic');
      } else {
        setActiveTab('dashboard-pic');
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pusdatin_sso_logged_in');
    sessionStorage.removeItem('pusdatin_admin_auth');
    setIsLoggedIn(false);
    const civitas = AppDatabase.getUsers().find(u => u.role === 'ACT-10');
    if (civitas) AppDatabase.setActiveUser(civitas.id);
    setIsMobileSidebarOpen(false);
    setPageMode('landing');
  };

  const handleNavigatePage = (mode: 'landing' | 'user' | 'admin' | 'executive') => {
    setPageMode(mode);
    if (mode === 'user') {
      const civitas = AppDatabase.getUsers().find(u => u.role === 'ACT-10');
      if (civitas) AppDatabase.setActiveUser(civitas.id);
      setActiveTab('dashboard-civitas');
    } else if (mode === 'executive') {
      const rektor = AppDatabase.getUsers().find(u => u.role === 'ACT-01');
      if (rektor) AppDatabase.setActiveUser(rektor.id);
      setActiveTab('dashboard-pimpinan');
    } else if (mode === 'admin') {
      const current = AppDatabase.getActiveUser();
      if (current.role === 'ACT-10' || current.role === 'ACT-01') {
        const adminUser = AppDatabase.getUsers().find(u => u.role === 'ACT-03');
        if (adminUser) AppDatabase.setActiveUser(adminUser.id);
      }
      setActiveTab('dashboard');
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
    sessionStorage.setItem('pusdatin_sso_logged_in', 'true');
    setIsLoggedIn(true);
    if (user.role === 'ACT-01') {
      setPageMode('executive');
      setActiveTab('dashboard-pimpinan');
    } else if (user.role === 'ACT-10') {
      setPageMode('user');
      setActiveTab('dashboard-civitas');
    } else {
      setPageMode('admin');
      if (user.role === 'ACT-02') {
        setActiveTab('dashboard-pimpinan');
      } else if (user.role === 'ACT-03') {
        setActiveTab('dashboard');
      } else if (user.role === 'ACT-04') {
        setActiveTab('dashboard-pic');
      } else {
        setActiveTab('dashboard-pic');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <Header
        pageMode={pageMode}
        isLoggedIn={isLoggedIn}
        activeUser={isLoggedIn ? activeUser : undefined}
        isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
        onNavigatePage={handleNavigatePage}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenEmailLogs={() => setIsEmailModalOpen(true)}
        onToggleSidebar={handleToggleSidebar}
        onOpenActorSwitcher={() => setIsActorModalOpen(true)}
        pendingLoanCount={stats.totalPinjamMenunggu}
        pendingDamageCount={stats.totalAntreanTiket}
        overdueCount={stats.totalPinjamTerlambat}
      />

      {/* LANDING PAGE MODE (Halaman Utama) */}
      {pageMode === 'landing' ? (
        <main className="flex-1">
          <LandingPageView
            isLoggedIn={isLoggedIn}
            onLogin={() => setIsLoginModalOpen(true)}
            onGoToPortal={() => handleLoginSuccess()}
            onSelectRoleQuick={(roleCode: string) => {
              const users = AppDatabase.getUsers();
              const target = users.find(u => u.role === roleCode || u.id === roleCode);
              if (target) {
                AppDatabase.setActiveUser(target.id);
                sessionStorage.setItem('pusdatin_sso_logged_in', 'true');
                setIsLoggedIn(true);
                refreshData();
                if (target.role === 'ACT-01') {
                  setPageMode('executive');
                  setActiveTab('dashboard-pimpinan');
                } else if (target.role === 'ACT-10') {
                  setPageMode('user');
                  setActiveTab('dashboard-civitas');
                } else {
                  setPageMode('admin');
                  setActiveTab('dashboard');
                }
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            onQuickTrack={(ticketId: string) => {
              setActiveTrackId(ticketId);
              setPageMode('user');
              setActiveTab('cek-progres');
            }}
          />
        </main>
      ) : (
        /* PORTAL MODES (USER, EXECUTIVE, ADMIN) */
        <div className="flex-1 flex w-full">
          {/* Navigation Sidebar */}
          <Sidebar
            pageMode={pageMode}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onNavigateHome={() => setPageMode('landing')}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            isDesktopCollapsed={isDesktopSidebarCollapsed}
            onToggleDesktopCollapse={() => setIsDesktopSidebarCollapsed(prev => !prev)}
            pendingLoanCount={stats.totalPinjamMenunggu}
            pendingDamageCount={stats.totalAntreanTiket}
            overdueCount={stats.totalPinjamTerlambat}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onOpenActorSwitcher={() => setIsActorModalOpen(true)}
          />

          {/* Main Viewport Content */}
          <main
            className={`flex-1 min-w-0 transition-all duration-300 ${
              isDesktopSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-72'
            } p-4 sm:p-6 lg:p-8`}
          >
            {/* 1. USER PORTAL VIEWS */}
            {pageMode === 'user' && (
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

            {/* 2. EXECUTIVE PORTAL VIEWS (Rektor & Wakil Rektor 1) */}
            {pageMode === 'executive' && (
              <div className="max-w-6xl mx-auto space-y-6">
                {activeTab === 'dashboard-pimpinan' && (
                  <ExecutiveDashboard
                    onNavigateTab={handleSelectTab}
                    isExecutiveOnly={true}
                  />
                )}

                {activeTab === 'seluruh-aset' && (
                  <AllAssetsMasterView
                    isReadOnly={true}
                    onDataChanged={refreshData}
                  />
                )}

                {activeTab === 'buku-inventaris-rekap' && (
                  <BukuInventarisRekapView onDataChanged={refreshData} />
                )}
              </div>
            )}

            {/* 3. ADMIN & STAFF PORTAL VIEWS */}
            {pageMode === 'admin' && (
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
                  <PicDashboard onNavigateTab={handleSelectTab} />
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

                {activeTab === 'kelola-master' && (
                  <MasterDataManagement onDataChanged={refreshData} />
                )}
              </div>
            )}
          </main>
        </div>
      )}

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
