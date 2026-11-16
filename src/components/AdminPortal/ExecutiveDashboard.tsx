import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Download,
  Calendar,
  PackagePlus,
  PackageMinus,
  CheckSquare,
  Wrench,
  Server,
  Star,
  ArrowRight,
  Building2
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { AppStatistics, PicPerformanceReport } from '../../types';
import { PdfReportService } from '../../services/pdfReportService';
import { formatMinutesLabel, formatHoursLabel } from '../../services/slaService';
import { SignatoryConfirmModal, ConfirmedSignatoryValues } from '../Modals/SignatoryConfirmModal';
import {
  computeExecutiveDashboardMetrics,
  getAvailablePeriodKeys,
  getStandardPeriodLabel,
  matchesReportingPeriod,
  ReportingCadence
} from '../../services/reportGovernanceService';

interface ExecutiveDashboardProps {
  onNavigateTab?: (tab: string) => void;
  isExecutiveOnly?: boolean;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateTab,
  isExecutiveOnly = false
}) => {
  const [stats, setStats] = useState<AppStatistics>(() => AppDatabase.getStatistics());
  const [picReports, setPicReports] = useState<PicPerformanceReport[]>(() =>
    AppDatabase.getPicPerformanceReport()
  );
  const [countdown, setCountdown] = useState<number>(6);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  const [dashboardTab, setDashboardTab] = useState<'eksekutif' | 'operasional'>('eksekutif');
  const [cadence, setCadence] = useState<ReportingCadence>('semua');
  const [periodKey, setPeriodKey] = useState<string>('');
  const [isSignatoryModalOpen, setIsSignatoryModalOpen] = useState(false);

  const activeUser = AppDatabase.getActiveUser();
  const isRektorOrWarek =
    isExecutiveOnly ||
    activeUser?.role === 'ACT-01' ||
    activeUser?.id === 'USR-ACT-01A' ||
    activeUser?.id === 'USR-ACT-01B';

  const penerimaanList = AppDatabase.getBukuPenerimaan();
  const pengeluaranList = AppDatabase.getBukuPengeluaran();
  const allAssets = AppDatabase.getAssets();
  const rekapKategori = AppDatabase.getBukuAsetInventarisRekap();
  const damageTickets = AppDatabase.getDamageTickets();
  const loanTickets = AppDatabase.getLoans();
  const proposals = AppDatabase.getSystemProposals();
  const surveys = AppDatabase.getSurveys();
  const spareParts = AppDatabase.getAllSpareParts();
  const slaConfig = AppDatabase.getSlaConfig();
  const serviceSlaConfig = AppDatabase.getServiceSlaConfig();

  const allGovernanceDates: (string | undefined)[] = [
    ...allAssets.map(a => a.tanggalMasuk || a.tanggalPembelian),
    ...damageTickets.map(t => t.createdAtIso || t.tanggalLapor),
    ...loanTickets.map(l => l.createdAtIso || l.tglAju || l.tglPinjam),
    ...proposals.map(p => p.createdAtIso || p.tanggalPengajuan),
    ...surveys.map(s => s.submittedAtIso || s.monthKey)
  ];

  const availablePeriodKeys = cadence === 'semua' ? [] : getAvailablePeriodKeys(allGovernanceDates, cadence);

  const handleSelectCadence = (next: ReportingCadence) => {
    setCadence(next);
    if (next === 'semua') {
      setPeriodKey('');
      return;
    }
    const keys = getAvailablePeriodKeys(allGovernanceDates, next);
    setPeriodKey(keys[0] || '');
  };

  // Filtered collections for selected cadence
  const scopedAssets =
    cadence === 'semua'
      ? allAssets
      : allAssets.filter(a => matchesReportingPeriod(a.tanggalMasuk || a.tanggalPembelian, cadence, periodKey));
  const scopedTickets =
    cadence === 'semua'
      ? damageTickets
      : damageTickets.filter(t => matchesReportingPeriod(t.createdAtIso || t.tanggalLapor, cadence, periodKey));
  const scopedLoans =
    cadence === 'semua'
      ? loanTickets
      : loanTickets.filter(l => matchesReportingPeriod(l.createdAtIso || l.tglAju || l.tglPinjam, cadence, periodKey));
  const scopedProposals =
    cadence === 'semua'
      ? proposals
      : proposals.filter(p => matchesReportingPeriod(p.createdAtIso || p.tanggalPengajuan, cadence, periodKey));
  const scopedSurveys =
    cadence === 'semua'
      ? surveys
      : surveys.filter(s => matchesReportingPeriod(s.submittedAtIso || s.monthKey, cadence, periodKey));

  const execMetrics = computeExecutiveDashboardMetrics({
    assets: scopedAssets,
    rekapList: rekapKategori,
    loans: scopedLoans,
    damageTickets: scopedTickets,
    proposals: scopedProposals,
    surveys: scopedSurveys,
    spareParts,
    slaConfig,
    serviceSlaConfig
  });

  const activePeriodLabel = getStandardPeriodLabel(cadence, periodKey);

  const handleRefresh = () => {
    setStats(AppDatabase.getStatistics());
    setPicReports(AppDatabase.getPicPerformanceReport());
    setCountdown(6);
  };

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleRefresh();
          return 6;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled]);

  const handleExportExcelCsv = () => {
    const rows = [
      ['Unit / Fakultas', 'Total Unit', 'Komputer', 'Networking', 'Multimedia', 'Lainnya', 'Total Valuasi (Rp)'],
      ...execMetrics.portfolio.facultyUnitCompositions.map(f => [
        `"${f.unitName.replace(/"/g, '""')}"`,
        String(f.totalUnits),
        String(f.komputer),
        String(f.networking),
        String(f.multimedia),
        String(f.lainnya),
        String(f.valuationRp)
      ])
    ];

    const csvContent = '\uFEFF' + rows.map(e => e.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Laporan_Eksekutif_Portofolio_PUSDATIN_${periodKey || 'Semua'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmExecutivePdf = (values: ConfirmedSignatoryValues) => {
    const doc = PdfReportService.generateExecutiveDashboardPdf(stats, periodKey || 'Semua Periode', {
      penerimaanCount: penerimaanList.length,
      pengeluaranCount: pengeluaranList.length,
      totalAsetValue: execMetrics.portfolio.totalValuationRp,
      executiveMetrics: execMetrics,
      cadenceLabel: activePeriodLabel,
      rektorNama: values.pimpinanUniv,
      pimpinanJabatan: values.pimpinanUnivJabatan,
      kepalaPusdatin: values.kepalaPusdatin,
      nipKepala: values.nipKepala
    });
    const safePeriod = (periodKey || 'Semua').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Laporan_Dashboard_Eksekutif_UMC_${safePeriod}.pdf`);
  };

  const totalBarangMasuk = penerimaanList.reduce((acc, curr) => {
    if (curr.items && curr.items.length > 0) {
      return acc + curr.items.reduce((sum, it) => sum + (it.banyaknya || it.jumlah || 0), 0);
    }
    return acc + (curr.banyaknya || curr.jumlah || 0);
  }, 0);

  const totalBarangKeluar = pengeluaranList.reduce((acc, curr) => {
    if (curr.items && curr.items.length > 0) return acc + curr.items.length;
    return acc + 1;
  }, 0);

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-x-hidden" data-testid="executive-dashboard-root">
      {/* Top Executive Command Header */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-mono font-bold text-amber-400">
              {isRektorOrWarek ? 'TATA KELOLA EKSEKUTIF UMC' : 'MANAJEMEN PUSDATIN UMC'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activePeriodLabel}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-0.5">Dashboard Eksekutif</h1>
          <p className="text-xs text-slate-300 mt-1">
            Tata kelola strategis ITIL: Valuasi aset kampus per fakultas, kepatuhan SLA &ge; 90%, indeks CSAT, serta transformasi digital &amp; proyeksi RAPBU.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-200 whitespace-nowrap">
            <RefreshCw
              className={`w-3.5 h-3.5 text-cyan-400 ${autoRefreshEnabled ? 'animate-spin' : ''}`}
              style={{ animationDuration: '4s' }}
            />
            <span className="font-mono tabular-nums">{countdown}s</span>
            <button
              type="button"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className="text-[11px] text-cyan-300 underline cursor-pointer"
            >
              {autoRefreshEnabled ? 'Jeda' : 'Aktifkan'}
            </button>
          </div>

          <button
            type="button"
            data-testid="exec-export-csv-btn"
            onClick={handleExportExcelCsv}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            data-testid="exec-download-pdf-btn"
            onClick={() => setIsSignatoryModalOpen(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* Standardized 3-Tier Reporting Cadence Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Kadenza Pelaporan Eksekutif ITIL:</span>{' '}
          <strong className="font-mono text-slate-800">{activePeriodLabel}</strong>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'semua', label: 'Semua' },
                { id: 'bulanan', label: 'Bulanan' },
                { id: 'triwulanan', label: 'Triwulan' },
                { id: 'semesteran', label: 'Semester' },
                { id: 'tahunan', label: 'Tahunan' }
              ] as { id: ReportingCadence; label: string }[]
            ).map(opt => (
              <button
                key={opt.id}
                type="button"
                data-testid={`exec-cadence-${opt.id}`}
                onClick={() => handleSelectCadence(opt.id)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  cadence === opt.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {cadence !== 'semua' && availablePeriodKeys.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                data-testid="exec-period-select"
                value={periodKey || availablePeriodKeys[0]}
                onChange={e => setPeriodKey(e.target.value)}
                className="bg-transparent text-xs font-mono font-semibold text-slate-900 outline-none cursor-pointer"
              >
                {availablePeriodKeys.map(k => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex flex-wrap sm:flex-nowrap border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setDashboardTab('eksekutif')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            dashboardTab === 'eksekutif'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dashboard Eksekutif (Strategis)</span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardTab('operasional')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            dashboardTab === 'operasional'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Ringkasan Logistik &amp; Mutasi Aset</span>
        </button>
      </div>

      {dashboardTab === 'eksekutif' && (
        <div className="space-y-6">
          {/* 4 TOP STRATEGIC KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* a. Valuasi */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Valuasi Aset IT Kampus</span>
                <TrendingUp className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-2">
                Rp {execMetrics.portfolio.totalValuationRp.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                {execMetrics.portfolio.totalUnits} Unit · Rata-rata Rp {execMetrics.portfolio.averageUnitValueRp.toLocaleString('id-ID')}
              </div>
            </div>

            {/* b. Kepatuhan SLA Menyeluruh */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Kepatuhan SLA Gabungan</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    execMetrics.slaGovernance.meetsTarget ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {execMetrics.slaGovernance.combinedSlaComplianceRate}%
                </span>
                <span className="text-[11px] text-slate-500">
                  Target &ge; {execMetrics.slaGovernance.institutionalTargetRate}%
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                Insiden {execMetrics.slaGovernance.incidentSlaRate}% · Peminjaman {execMetrics.slaGovernance.loanSlaRate}%
              </div>
            </div>

            {/* c. Indeks CSAT */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Indeks Kepuasan (CSAT)</span>
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    execMetrics.csatGovernance.meetsTarget ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {execMetrics.csatGovernance.overallAverage}/5.0
                </span>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  ({execMetrics.csatGovernance.csatPercentage}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {execMetrics.csatGovernance.totalResponses} Responden · Target &ge; 4.0 / 85%
              </div>
            </div>

            {/* d. Transformasi Digital & RAPBU */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Proyeksi Anggaran RAPBU</span>
                <Server className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-2">
                Rp {execMetrics.digitalTransformation.totalEstimatedRapbuRp.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {execMetrics.digitalTransformation.criticalGapCount} Defisit Kritis ·{' '}
                {execMetrics.digitalTransformation.approvedAndActiveCount} RFC Aktif
              </div>
            </div>
          </div>

          {/* MODUL A: VALUASI & PORTOFOLIO ASET PER FAKULTAS / UNIT KERJA */}
          <section
            data-testid="exec-module-portfolio"
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-700" />
                  <span>a. Valuasi &amp; Portofolio Aset IT per Fakultas / Unit Kerja</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Komposisi perangkat komputer, jaringan, dan multimedia di seluruh fakultas dan unit kerja UMC.
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('seluruh-aset')}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Master Aset &amp; Registri CI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Fakultas / Unit Kerja</th>
                    <th className="py-2.5 px-3 text-right">Total Unit</th>
                    <th className="py-2.5 px-3 text-right">Komputer &amp; Laptop</th>
                    <th className="py-2.5 px-3 text-right">Jaringan &amp; Server</th>
                    <th className="py-2.5 px-3 text-right">Multimedia</th>
                    <th className="py-2.5 px-3 text-right">Lainnya</th>
                    <th className="py-2.5 px-3 text-right">Valuasi Investasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {execMetrics.portfolio.facultyUnitCompositions.map(row => (
                    <tr key={row.unitName} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.unitName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        {row.totalUnits}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.komputer}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.networking}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.multimedia}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.lainnya}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        Rp {row.valuationRp.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  {execMetrics.portfolio.facultyUnitCompositions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Tidak ada aset tercatat pada periode yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* MODUL B & C: KINERJA SLA + RECURRING INCIDENTS & INDEKS KEPUASAN CSAT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* b. Kinerja Mutu Layanan, Tren Eskalasi & Insiden Berulang */}
            <section
              data-testid="exec-module-sla"
              className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            >
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  b. Kinerja Mutu Layanan, SLA &amp; Insiden Berulang
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan capaian SLA terhadap target universitas (&ge; {execMetrics.slaGovernance.institutionalTargetRate}%) dan identifikasi <em>Recurring Incidents</em>.
                </p>
              </div>

              {/* SLA Comparison Bars */}
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Helpdesk Insiden (FRT & RT)', val: execMetrics.slaGovernance.incidentSlaRate },
                  { label: 'Pemenuhan Peminjaman Aset IT', val: execMetrics.slaGovernance.loanSlaRate },
                  { label: 'Respon Analisis Awal RFC Sistem', val: execMetrics.slaGovernance.proposalInitialSlaRate }
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700">{item.label}</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          item.val >= 90 ? 'text-emerald-700' : item.val >= 75 ? 'text-amber-700' : 'text-rose-700'
                        }`}
                      >
                        {item.val}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.val >= 90 ? 'bg-emerald-600' : item.val >= 75 ? 'bg-amber-500' : 'bg-rose-600'
                        }`}
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tren Bulanan & Recurring Incidents */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Insiden Berulang (Recurring) &amp; Eskalasi Problem/RFC
                  </span>
                  <span className="font-mono text-slate-600 tabular-nums">
                    {execMetrics.slaGovernance.problemAndRfcEscalations} Eskalasi
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {execMetrics.slaGovernance.recurringIncidents.slice(0, 4).map(rec => (
                    <div key={rec.groupName} className="px-3 py-2 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-800 truncate">{rec.groupName}</div>
                        <div className="text-[11px] text-slate-500">
                          {rec.problemOrRfcCount > 0
                            ? `${rec.problemOrRfcCount} eskalasi Problem/RFC`
                            : 'Insiden perangkat rutin'}
                        </div>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-slate-900 shrink-0">
                        {rec.totalTickets} tiket
                      </span>
                    </div>
                  ))}
                  {execMetrics.slaGovernance.recurringIncidents.length === 0 && (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      Tidak ada insiden tercatat pada periode ini.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* c. Indeks Kepuasan Pengguna (Continual Improvement / CSAT) */}
            <section
              data-testid="exec-module-csat"
              className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    c. Indeks Kepuasan Pengguna (ITIL CSAT)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluasi kepuasan sivitas lintas modul terhadap standar mutu PUSDATIN (&ge; 4.0 / 85%).
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('rekap-survei')}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Rekap Survei &rarr;
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: 'Helpdesk Kerusakan',
                    score: execMetrics.csatGovernance.byModule.Incident.avgScore,
                    count: execMetrics.csatGovernance.byModule.Incident.count
                  },
                  {
                    label: 'Peminjaman Aset',
                    score: execMetrics.csatGovernance.byModule.Loan.avgScore,
                    count: execMetrics.csatGovernance.byModule.Loan.count
                  },
                  {
                    label: 'Sistem Baru (RFC)',
                    score: execMetrics.csatGovernance.byModule.SystemProposal.avgScore,
                    count: execMetrics.csatGovernance.byModule.SystemProposal.count
                  }
                ].map(mod => (
                  <div key={mod.label} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="text-[11px] font-medium text-slate-600 block">{mod.label}</span>
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                      {mod.score}/5.0
                    </div>
                    <span className="text-[11px] text-slate-500">{mod.count} respons</span>
                  </div>
                ))}
              </div>

              {!isRektorOrWarek ? (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-800 mb-2">
                    Ringkasan Kepatuhan SLA Teknisi (Internal PUSDATIN)
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Teknisi</th>
                          <th className="py-2 px-3 text-right">Tugas</th>
                          <th className="py-2 px-3 text-right">Selesai</th>
                          <th className="py-2 px-3 text-right">SLA %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {picReports.slice(0, 5).map(pic => (
                          <tr key={pic.technicianId} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-900">{pic.technicianName}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">{pic.totalAssigned}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700">
                              {pic.totalResolved}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold tabular-nums">
                              {pic.slaOnTimeRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-800 mb-2">
                    Ringkasan Nilai Aset per Kategori Utama
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Kategori</th>
                          <th className="py-2 px-3 text-right">Unit</th>
                          <th className="py-2 px-3 text-right">Nilai (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rekapKategori.map(rk => (
                          <tr key={rk.kategori}>
                            <td className="py-2 px-3 font-medium text-slate-900">{rk.kategori}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">{rk.totalMasuk}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold tabular-nums">
                              Rp {rk.nilaiAsetTotal.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* MODUL D: STRATEGI, TRANSFORMASI DIGITAL & RESPON ANGGARAN (RAPBU) */}
          <section
            data-testid="exec-module-strategy"
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  d. Strategi Transformasi Digital (RFC) &amp; Efisiensi Anggaran (RAPBU)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Progres aplikasi strategis yang mendukung akreditasi/operasional kampus serta proyeksi kebutuhan pengadaan (Gap Analysis).
                </p>
              </div>
              <div className="flex items-center gap-3">
                {onNavigateTab && (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('pengajuan-sistem')}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap cursor-pointer"
                    >
                      Portofolio RFC &rarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('suku-cadang')}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap cursor-pointer"
                    >
                      Analisis RAPBU &rarr;
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strategic RFC List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Usulan Pengembangan Sistem Baru ({execMetrics.digitalTransformation.totalProposals} Usulan)
                </div>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {execMetrics.digitalTransformation.strategicProposals.slice(0, 4).map(p => (
                    <div key={p.id} className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{p.namaSistem}</div>
                        <div className="text-[11px] text-slate-500">
                          {p.unitKerja} ·{' '}
                          {p.status === 'status_verifikasi'
                            ? 'Tahap 1: Feasibility Study'
                            : p.status === 'status_analisis'
                            ? 'Tahap 2: Analisis BRD'
                            : p.status === 'status_keamanan'
                            ? 'Tahap 3: Uji Keamanan'
                            : p.status === 'status_approval'
                            ? 'Tahap 4: Approval Pimpinan'
                            : p.status === 'status_pengembangan'
                            ? 'Tahap 5: Sprint Pengembangan'
                            : p.status}
                        </div>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-slate-800 shrink-0">
                        {p.pengembangan?.progresPersen ?? (p.status === 'Selesai' || p.status === 'Serah Terima' ? 100 : 25)}%
                      </span>
                    </div>
                  ))}
                  {execMetrics.digitalTransformation.strategicProposals.length === 0 && (
                    <div className="p-4 text-xs text-slate-400 text-center">
                      Tidak ada usulan sistem strategis pada periode ini.
                    </div>
                  )}
                </div>
              </div>

              {/* RAPBU Gap Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Prioritas Kebutuhan Pengadaan &amp; RAPBU</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    Total Rp {execMetrics.digitalTransformation.totalEstimatedRapbuRp.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {execMetrics.digitalTransformation.gapRows.slice(0, 4).map(g => (
                    <div key={g.categoryOrItem} className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{g.categoryOrItem}</div>
                        <div className="text-[11px] text-slate-500">
                          Stok siap: {g.readyStockCount} · Defisit: {g.netGap} unit ({g.priority})
                        </div>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-slate-900 shrink-0">
                        Rp {g.estimatedBudgetRp.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: LOGISTIK & MUTASI ASET */}
      {dashboardTab === 'operasional' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Buku Penerimaan Aset</span>
                <PackagePlus className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
                {penerimaanList.length} BAST
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Total {totalBarangMasuk} unit masuk</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Buku Pengeluaran Aset</span>
                <PackageMinus className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
                {pengeluaranList.length} Mutasi
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Total {totalBarangKeluar} unit keluar</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Tiket Kerusakan Aktif</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
                {damageTickets.filter(t => t.status !== 'Resolved' && !t.status.startsWith('Closed')).length} Tiket
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {damageTickets.filter(t => t.status === 'In Progress').length} sedang diperbaiki
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Peminjaman Berjalan</span>
                <CheckSquare className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
                {loanTickets.filter(l => l.status === 'Diserahkan' || l.status === 'Disetujui' || l.status === 'Dikonfirmasi').length} Unit
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {loanTickets.filter(l => l.status === 'Diajukan' || l.status === 'Menunggu').length} menunggu persetujuan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Penerimaan Aset Terkini</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-3">No. BAST</th>
                      <th className="py-2 px-3">Vendor</th>
                      <th className="py-2 px-3 text-right">Nilai Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {penerimaanList.slice(0, 5).map(p => (
                      <tr key={p.idPenerimaan}>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">{p.nomorBeritaAcara}</td>
                        <td className="py-2 px-3 text-slate-700">{p.dari}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold tabular-nums text-emerald-700">
                          Rp {(p.jumlahHarga || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Pengeluaran &amp; Distribusi Terkini</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-3">ID Mutasi</th>
                      <th className="py-2 px-3">Tujuan</th>
                      <th className="py-2 px-3">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pengeluaranList.slice(0, 5).map(pg => (
                      <tr key={pg.idPengeluaran}>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">{pg.idPengeluaran}</td>
                        <td className="py-2 px-3 text-slate-700">{pg.untuk}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{pg.tanggalPenyerahan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <SignatoryConfirmModal
        isOpen={isSignatoryModalOpen}
        documentTitle={`Laporan Dashboard Eksekutif PUSDATIN (${activePeriodLabel})`}
        showPimpinanUniv={true}
        showPetugas={false}
        onClose={() => setIsSignatoryModalOpen(false)}
        onConfirm={handleConfirmExecutivePdf}
      />
    </div>
  );
};
