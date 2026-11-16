import React, { useState } from 'react';
import { AppStatistics, LoanTicket, ActivityLog } from '../../types';
import { EmailNotificationService } from '../../services/emailService';
import { WhatsAppNotificationService } from '../../services/whatsappService';
import { AppDatabase } from '../../services/db';
import { computeOperationalDashboardMetrics } from '../../services/reportGovernanceService';
import {
  Package,
  AlertTriangle,
  Wrench,
  Clock,
  ArrowRight,
  Layers,
  Mail,
  ShieldAlert,
  RotateCcw,
  UserCheck,
  Code2,
  History,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

interface AdminDashboardProps {
  stats: AppStatistics;
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, onNavigateTab }) => {
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const assets = AppDatabase.getAssets();
  const rekapList = AppDatabase.getBukuAsetInventarisRekap();
  const loans = AppDatabase.getLoans();
  const damageTickets = AppDatabase.getDamageTickets();
  const proposals = AppDatabase.getSystemProposals();
  const technicians = AppDatabase.getTechnicians();
  const slaConfig = AppDatabase.getSlaConfig();
  const serviceSlaConfig = AppDatabase.getServiceSlaConfig();

  const ops = computeOperationalDashboardMetrics({
    assets,
    rekapList,
    loans,
    damageTickets,
    proposals,
    technicians,
    slaConfig,
    serviceSlaConfig,
    criticalStockThreshold: 2,
    todayStr
  });

  const handleSendReminder = async (loan: LoanTicket) => {
    setSendingReminderId(loan.id);
    try {
      await EmailNotificationService.sendOverdueReminder(loan);
      setStatusBanner({
        type: 'success',
        message: `Pengingat keterlambatan berhasil dikirim ke email ${loan.email || loan.peminjam} (${loan.id}).`
      });
    } catch {
      setStatusBanner({
        type: 'error',
        message: `Gagal mengirim email pengingat untuk tiket ${loan.id}.`
      });
    } finally {
      setSendingReminderId(null);
    }
  };

  const getDaysOverdue = (tglKembali: string) => {
    const target = new Date(tglKembali).getTime();
    const now = new Date(todayStr).getTime();
    return Math.max(1, Math.floor((now - target) / (1000 * 60 * 60 * 24)));
  };

  const overdueLoans = ops.loanFulfillment.overdueLoans;

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-x-hidden" data-testid="operational-dashboard-root">
      {/* Header Operasional */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="font-mono uppercase tracking-wider text-slate-700">ITIL Operations Command</span>
            <span aria-hidden="true">·</span>
            <span>Pemantauan Real-Time Harian</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Dashboard Operasional PUSDATIN UMC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengawasan terpadu antrean insiden SLA, pemenuhan peminjaman aset, kesehatan stok gudang, dan pipeline RFC pengembangan sistem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('kelola-tiket')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            Buka Helpdesk SLA
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('kelola-pinjam')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kelola Peminjaman
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {statusBanner && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Tutup notifikasi"
            className="p-1 rounded hover:bg-black/5 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODUL A: HELPDESK & INSIDEN (INCIDENT QUEUE + BEBAN KERJA TEKNISI) */}
      <section
        data-testid="ops-module-incident"
        className="bg-white rounded-xl border border-slate-200 p-5 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">
                a. Modul Helpdesk &amp; Insiden (Incident Queue)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Status antrean tiket berdasarkan tahapan SOP, peringatan SLA mendekati batas/overdue, dan beban kerja per teknisi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('kelola-tiket')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Lihat Semua Tiket ({ops.incidentQueue.total})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stage Queue + SLA Risk Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">Open / Reopen</span>
            <span className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
              {ops.incidentQueue.openReopen}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">Need Info</span>
            <span className="text-xl font-bold font-mono tabular-nums text-amber-700 mt-1 block">
              {ops.incidentQueue.needMoreInfo}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">Assigned</span>
            <span className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
              {ops.incidentQueue.assigned}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">In Progress</span>
            <span className="text-xl font-bold font-mono tabular-nums text-blue-700 mt-1 block">
              {ops.incidentQueue.inProgress}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">Pending (Jeda)</span>
            <span className="text-xl font-bold font-mono tabular-nums text-slate-700 mt-1 block">
              {ops.incidentQueue.pendingPaused}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">Resolved / Closed</span>
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1 block">
              {ops.incidentQueue.resolvedClosed}
            </span>
          </div>
          <div
            className={`p-3 rounded-lg border ${
              ops.incidentQueue.approachingSlaCount > 0
                ? 'border-amber-300 bg-amber-50/70'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <span className="text-[11px] font-medium text-amber-800 block">Mendekati SLA</span>
            <span className="text-xl font-bold font-mono tabular-nums text-amber-700 mt-1 block">
              {ops.incidentQueue.approachingSlaCount}
            </span>
          </div>
          <div
            className={`p-3 rounded-lg border ${
              ops.incidentQueue.frtOverdueCount + ops.incidentQueue.rtOverdueCount > 0
                ? 'border-rose-300 bg-rose-50/70'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <span className="text-[11px] font-medium text-rose-800 block">FRT / RT Overdue</span>
            <span className="text-xl font-bold font-mono tabular-nums text-rose-700 mt-1 block">
              {ops.incidentQueue.frtOverdueCount} / {ops.incidentQueue.rtOverdueCount}
            </span>
          </div>
        </div>

        {/* Beban Kerja Teknisi (Workload) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Beban Kerja Teknisi (Workload PIC Real-Time)</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              FRT On-Time: {ops.incidentQueue.frtComplianceRate}% · RT On-Time: {ops.incidentQueue.rtComplianceRate}%
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Nama Teknisi &amp; Peran</th>
                  <th className="py-2.5 px-3 text-right">Beban Aktif</th>
                  <th className="py-2.5 px-3 text-right">Menunggu</th>
                  <th className="py-2.5 px-3 text-right">Dikerjakan</th>
                  <th className="py-2.5 px-3 text-right">Terjeda</th>
                  <th className="py-2.5 px-3 text-right">Selesai</th>
                  <th className="py-2.5 px-3 text-right">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ops.technicianWorkloads.map(tech => (
                  <tr key={tech.technicianId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{tech.name}</div>
                      <div className="text-[11px] text-slate-500">{tech.roleName}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                      {tech.activeLoad}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-700">
                      {tech.waitingCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-blue-700">
                      {tech.inProgressCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {tech.pausedCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                      {tech.resolvedCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                      <span className={tech.overdueCount > 0 ? 'text-rose-700' : 'text-slate-400'}>
                        {tech.overdueCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* MODUL B: PEMENUHAN ASET & PEMINJAMAN (SERVICE REQUEST + OVERDUE ACTIONS) */}
      <section
        data-testid="ops-module-loan"
        className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">
                b. Modul Pemenuhan Aset &amp; Peminjaman (Service Fulfillment)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring tiket menunggu persetujuan, siap diambil, tingkat kepatuhan SLA, dan penagihan keterlambatan (Overdue).
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('kelola-pinjam')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Kelola Peminjaman</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">Menunggu Approval</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1 block">
              {ops.loanFulfillment.waitingApprovalCount}
            </span>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">Siap Diambil (Fulfillment)</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1 block">
              {ops.loanFulfillment.readyForHandoverCount}
            </span>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">Sedang Dipinjam</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
              {ops.loanFulfillment.activeBorrowedCount}
            </span>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-medium text-slate-500 block">SLA Approval / Siap</span>
            <span className="text-lg font-bold font-mono tabular-nums text-emerald-700 mt-1 block">
              {ops.loanFulfillment.approvalComplianceRate}% / {ops.loanFulfillment.fulfillmentComplianceRate}%
            </span>
          </div>
          <div
            className={`p-3.5 rounded-lg border ${
              overdueLoans.length > 0 ? 'border-rose-300 bg-rose-50/70' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <span className="text-[11px] font-medium text-rose-800 block">Alert Overdue</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-700 mt-1 block">
              {overdueLoans.length}
            </span>
          </div>
        </div>

        {/* Overdue Action Table */}
        {overdueLoans.length > 0 ? (
          <div className="border border-rose-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {overdueLoans.length} Aset Peminjaman Melewati Batas Pengembalian — Tindakan Cepat
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5">ID Tiket</th>
                    <th className="px-3.5 py-2.5">Peminjam &amp; Unit</th>
                    <th className="px-3.5 py-2.5">Perangkat</th>
                    <th className="px-3.5 py-2.5">Tenggat &amp; Telat</th>
                    <th className="px-3.5 py-2.5 text-right">Aksi Penagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueLoans.map(loan => {
                    const daysLate = getDaysOverdue(loan.tglKembali);
                    const waUrl = WhatsAppNotificationService.getOverdueReminderUrl(loan, daysLate);
                    return (
                      <tr key={loan.id} className="hover:bg-rose-50/30">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-rose-700 whitespace-nowrap">
                          {loan.id}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-slate-900">{loan.peminjam}</div>
                          <div className="text-[11px] text-slate-500">{loan.unit}</div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="font-medium text-slate-800">{loan.namaBarangT || loan.barangPinjaman}</div>
                          <div className="text-[11px] font-mono text-slate-500">BC: {loan.barcode || '-'}</div>
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="font-mono font-semibold text-slate-800">{loan.tglKembali}</div>
                          <div className="text-[11px] font-bold text-rose-700">+{daysLate} hari terlambat</div>
                        </td>
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md whitespace-nowrap"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <button
                              type="button"
                              disabled={sendingReminderId === loan.id}
                              onClick={() => handleSendReminder(loan)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md whitespace-nowrap cursor-pointer disabled:opacity-50"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>{sendingReminderId === loan.id ? 'Mengirim...' : 'Email'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigateTab('kelola-pinjam')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md whitespace-nowrap cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Proses</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-xs text-emerald-800 font-medium">
            Seluruh aset pinjaman dikembalikan tepat waktu (0 keterlambatan aktif).
          </div>
        )}
      </section>

      {/* MODUL C & D: KETERSEDIAAN STOK & PIPELINE RFC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* c. Modul Ketersediaan Stok (Inventory Health) */}
        <section
          data-testid="ops-module-inventory"
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-bold text-slate-900">
                  c. Modul Ketersediaan Stok (Inventory Health)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Peringatan stok menipis (&le; {ops.inventoryHealth.criticalStockThreshold} unit) dan unit dalam pemeliharaan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('buku-inventaris-rekap')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Buku Inventaris &rarr;
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            <div className="p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Total</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {ops.inventoryHealth.totalAssets}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-emerald-700 block">Tersedia</span>
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-700">
                {ops.inventoryHealth.readyCount}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-blue-700 block">Digunakan</span>
              <span className="text-lg font-bold font-mono tabular-nums text-blue-700">
                {ops.inventoryHealth.inUseCount}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-700 block">Dipinjam</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {ops.inventoryHealth.borrowedCount}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40">
              <span className="text-[10px] text-amber-800 block">Servis</span>
              <span className="text-lg font-bold font-mono tabular-nums text-amber-700">
                {ops.inventoryHealth.inServiceUnitsCount}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/40">
              <span className="text-[10px] text-rose-800 block">Afkir</span>
              <span className="text-lg font-bold font-mono tabular-nums text-rose-700">
                {ops.inventoryHealth.unusableCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-700">
              Status Pemeliharaan: <strong>{ops.inventoryHealth.inServiceUnitsCount} unit</strong> dalam servis &amp;{' '}
              <strong>{ops.inventoryHealth.waitingPartsUnitsCount} unit</strong> menunggu suku cadang
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('suku-cadang')}
              className="font-semibold text-slate-800 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cek Gap &rarr;
            </button>
          </div>

          {/* Stok Kritis Table */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Peringatan Stok Kritis (&le; {ops.inventoryHealth.criticalStockThreshold} Unit Siap Pakai)</span>
            </div>
            {ops.inventoryHealth.criticalCategories.length > 0 ? (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {ops.inventoryHealth.criticalCategories.map(cat => (
                  <div
                    key={cat.kategori}
                    className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-slate-800">{cat.kategori}</span>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <span className="text-slate-500">Total: {cat.totalUnit}</span>
                      <span
                        className={`font-bold ${
                          cat.status === 'Habis' ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        Sisa {cat.stokTersedia} ({cat.status})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                Semua kategori aset berada di atas ambang stok kritis.
              </p>
            )}
          </div>
        </section>

        {/* d. Modul Pengembangan Sistem (Pipeline RFC) */}
        <section
          data-testid="ops-module-rfc"
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-bold text-slate-900">
                  d. Modul Pengembangan Sistem (Pipeline RFC)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Progres antrean 5-tahap Request for Change dari verifikasi kelayakan hingga sprint aplikasi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('pengajuan-sistem')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Kelola RFC &rarr;
            </button>
          </div>

          {/* 5 Stage Pipeline Strip */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            <div className="p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">1. Verifikasi</span>
              <span className="text-lg font-bold font-mono tabular-nums text-amber-700">
                {ops.rfcPipeline.tahap1Feasibility}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">2. BRD</span>
              <span className="text-lg font-bold font-mono tabular-nums text-blue-700">
                {ops.rfcPipeline.tahap2Brd}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">3. Security</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-800">
                {ops.rfcPipeline.tahap3Keamanan}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">4. Approval</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-800">
                {ops.rfcPipeline.tahap4Approval}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">5. Sprint</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {ops.rfcPipeline.tahap5Sprint}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40">
              <span className="text-[10px] text-emerald-700 block">Go-Live</span>
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-700">
                {ops.rfcPipeline.goLive}
              </span>
            </div>
          </div>

          {/* Active RFC Progress Table */}
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
            {ops.rfcPipeline.activeItems.length > 0 ? (
              ops.rfcPipeline.activeItems.slice(0, 5).map(prop => {
                const pct = prop.pengembangan?.progresPersen ?? (prop.status === 'Selesai' || prop.status === 'Serah Terima' ? 100 : 20);
                return (
                  <div key={prop.id} className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-mono font-semibold text-slate-500 mr-2">{prop.id}</span>
                        <span className="font-semibold text-slate-900 truncate">{prop.namaSistem}</span>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-slate-800 shrink-0">
                        {pct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{prop.unitKerja} · {prop.pemohon}</span>
                      <span>{prop.status}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-xs text-slate-500 text-center">
                Belum ada pengajuan sistem baru aktif saat ini.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* LOG AUDIT OPERASIONAL REAL-TIME & NAVIGASI CEPAT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <span>Audit Log Aktivitas Operasional Terkini</span>
            </h3>
            <span className="text-[11px] text-slate-500">Terbaru</span>
          </div>

          <div className="divide-y divide-slate-100">
            {AppDatabase.getLogs().slice(0, 5).map((log: ActivityLog, idx: number) => (
              <div key={`${log.id || 'log'}-${idx}`} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="text-slate-800">
                    <strong className="text-slate-900">{log.petugas || 'Petugas'}</strong> — {log.keterangan}
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {log.timestamp} {log.barcode ? `· BC: ${log.barcode}` : ''}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                  {log.jenisTransaksi}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>Akses Cepat Operasional</span>
          </h3>
          {[
            { id: 'buku-penerimaan', label: 'Buku Penerimaan (BAST Inbound)' },
            { id: 'buku-pengeluaran', label: 'Buku Pengeluaran (Mutasi)' },
            { id: 'suku-cadang', label: 'Kebutuhan Aset (Gap Analysis)' },
            { id: 'seluruh-aset', label: 'Master Aset & Registri CI' }
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigateTab(item.id)}
              className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer"
            >
              <span>{item.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
