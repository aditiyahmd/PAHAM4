import {
  Asset,
  AppUser,
  BukuAsetInventarisRekap,
  BukuPenerimaanItem,
  BukuPengeluaranItem,
  DamageTicket,
  LoanTicket,
  ServiceSlaConfig,
  SlaConfig,
  SurveyResponse,
  SystemProposal
} from '../types';
import {
  computeAggregateLoanSlaStats,
  computeAggregateProposalSlaStats,
  computeAggregateSlaStats,
  computeSlaEvaluation,
  computeTechnicianSlaBreakdown,
  DEFAULT_SERVICE_SLA_CONFIG,
  DEFAULT_SLA_CONFIG,
  isPausedTicketStatus,
  isResolvedTicketStatus,
  parseFlexibleDate
} from './slaService';
import { computeAggregateSurveyStats } from './surveyService';

export type ReportingCadence = 'semua' | 'bulanan' | 'triwulanan' | 'semesteran' | 'tahunan';

export interface ItilReportMenuSpec {
  menuId: string;
  menuTitle: string;
  itilReportTitle: string;
  itilPractice: string;
  description: string;
  standardCadence: 'Bulanan (Operational)' | 'Triwulanan / Semesteran (Audit)' | 'Tahunan (Executive)';
  preferredFormats: ('PDF Resmi Ber-Kop / BAST' | 'CSV / Excel (Spreadsheet)')[];
  audience: string;
}

export const ITIL_REPORT_CATALOG: Record<string, ItilReportMenuSpec> = {
  'buku-penerimaan': {
    menuId: 'buku-penerimaan',
    menuTitle: 'Buku Penerimaan',
    itilReportTitle: 'Laporan BAST & Audit Inbound',
    itilPractice: 'Asset & Procurement Governance',
    description: 'Rekapitulasi faktur, verifikasi vendor, pencatatan BAST digital, dan registrasi serial number unit fisik.',
    standardCadence: 'Bulanan (Operational)',
    preferredFormats: ['PDF Resmi Ber-Kop / BAST'],
    audience: 'Kepala PUSDATIN & Auditor Keuangan'
  },
  'buku-pengeluaran': {
    menuId: 'buku-pengeluaran',
    menuTitle: 'Buku Pengeluaran',
    itilReportTitle: 'Laporan Mutasi & Distribusi',
    itilPractice: 'Asset Lifecycle Fulfillment',
    description: 'Pelacakan pengeluaran aset untuk operasional ruangan maupun peminjaman sementara civitas.',
    standardCadence: 'Bulanan (Operational)',
    preferredFormats: ['PDF Resmi Ber-Kop / BAST'],
    audience: 'Kepala PUSDATIN & Auditor Keuangan'
  },
  'buku-inventaris-rekap': {
    menuId: 'buku-inventaris-rekap',
    menuTitle: 'Buku Aset Inventaris',
    itilReportTitle: 'Laporan Saldo Stok & Valuasi',
    itilPractice: 'IT Asset Management (ITAM)',
    description: 'Rekapitulasi saldo masuk vs. keluar secara real-time dan posisi status operasional (tersedia, dipakai, dipinjam, servis).',
    standardCadence: 'Triwulanan / Semesteran (Audit)',
    preferredFormats: ['CSV / Excel (Spreadsheet)', 'PDF Resmi Ber-Kop / BAST'],
    audience: 'Tim Audit Internal & Kepala PUSDATIN'
  },
  'seluruh-aset': {
    menuId: 'seluruh-aset',
    menuTitle: 'Master Aset',
    itilReportTitle: 'Katalog & Registri CI (Configuration Item)',
    itilPractice: 'Service Configuration Management',
    description: 'Laporan inventaris universal seluruh perangkat, spesifikasi teknis, riwayat PO, valuasi finansial, dan status kondisi fisik.',
    standardCadence: 'Triwulanan / Semesteran (Audit)',
    preferredFormats: ['CSV / Excel (Spreadsheet)', 'PDF Resmi Ber-Kop / BAST'],
    audience: 'Staf Stock Opname, Kepala PUSDATIN & Rektorat'
  },
  'kelola-pinjam': {
    menuId: 'kelola-pinjam',
    menuTitle: 'Kelola Peminjaman',
    itilReportTitle: 'Laporan Kepatuhan Fulfillment & Peminjaman',
    itilPractice: 'Service Request Management',
    description: 'Monitoring Approval Time, Fulfillment Time, serta pengawasan aset pinjaman yang melewati batas waktu (Overdue).',
    standardCadence: 'Bulanan (Operational)',
    preferredFormats: ['PDF Resmi Ber-Kop / BAST', 'CSV / Excel (Spreadsheet)'],
    audience: 'Kepala PUSDATIN & Peminjam'
  },
  'kelola-tiket': {
    menuId: 'kelola-tiket',
    menuTitle: 'Helpdesk & Tiket SLA',
    itilReportTitle: 'Laporan Kinerja Layanan Teknis',
    itilPractice: 'Incident & Problem Management',
    description: 'Analisis kepatuhan FRT (First Response Time), RT (Resolution Time), serta eskalasi tiket insiden harian/problem.',
    standardCadence: 'Bulanan (Operational)',
    preferredFormats: ['PDF Resmi Ber-Kop / BAST', 'CSV / Excel (Spreadsheet)'],
    audience: 'Admin, Teknisi & Kepala PUSDATIN'
  },
  'suku-cadang': {
    menuId: 'suku-cadang',
    menuTitle: 'Kebutuhan Aset & Suku Cadang',
    itilReportTitle: 'Laporan Analisis Kesenjangan (Gap Analysis)',
    itilPractice: 'Capacity & Demand Management',
    description: 'Proyeksi kebutuhan unit kerja/fakultas dibandingkan dengan ketersediaan stok inventaris gudang PUSDATIN.',
    standardCadence: 'Triwulanan / Semesteran (Audit)',
    preferredFormats: ['CSV / Excel (Spreadsheet)', 'PDF Resmi Ber-Kop / BAST'],
    audience: 'Tim Audit, Kepala PUSDATIN & Perencanaan RAPBU'
  },
  'pengajuan-sistem': {
    menuId: 'pengajuan-sistem',
    menuTitle: 'Pengajuan Sistem Baru',
    itilReportTitle: 'Laporan Alur 5-Tahap RFC (Request for Change)',
    itilPractice: 'Change Enablement & SDLC',
    description: 'Pemantauan status Feasibility Study, Analisis BRD, Uji Keamanan, hingga Sprint Pengembangan aplikasi.',
    standardCadence: 'Tahunan (Executive)',
    preferredFormats: ['CSV / Excel (Spreadsheet)', 'PDF Resmi Ber-Kop / BAST'],
    audience: 'Rektor / Warek & Tim Akreditasi (LAM/BAN-PT)'
  },
  'rekap-survei': {
    menuId: 'rekap-survei',
    menuTitle: 'Rekap Survei Kepuasan',
    itilReportTitle: 'Laporan Indeks CSAT (Customer Satisfaction Score)',
    itilPractice: 'Continual Improvement',
    description: 'Evaluasi mutu layanan per modul (kerusakan, peminjaman, sistem baru) terhadap target mutu ITIL (>= 85%).',
    standardCadence: 'Tahunan (Executive)',
    preferredFormats: ['CSV / Excel (Spreadsheet)', 'PDF Resmi Ber-Kop / BAST'],
    audience: 'Rektor / Warek, Kepala PUSDATIN & Akreditasi BAN-PT'
  }
};

/**
 * Normalizes flexible date string ('YYYY-MM-DD', ISO, 'DD/MM/YYYY') into 'YYYY-MM'.
 */
export function extractYearMonthKey(dateInput?: string): string {
  if (!dateInput) return '';
  const isoMatch = dateInput.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`;
  const parsed = parseFlexibleDate(dateInput);
  if (!parsed) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
}

export function getQuarterFromMonthKey(monthKey: string): string {
  const m = monthKey.match(/^(\d{4})-(\d{2})/);
  if (!m) return '';
  const yr = m[1];
  const mo = parseInt(m[2], 10);
  const q = Math.ceil(mo / 3);
  return `${yr}-Q${q}`;
}

export function getSemesterFromMonthKey(monthKey: string): string {
  const m = monthKey.match(/^(\d{4})-(\d{2})/);
  if (!m) return '';
  const yr = m[1];
  const mo = parseInt(m[2], 10);
  const s = mo <= 6 ? 1 : 2;
  return `${yr}-S${s}`;
}

export function matchesReportingPeriod(
  dateInput: string | undefined,
  cadence: ReportingCadence,
  periodKey: string
): boolean {
  if (cadence === 'semua' || !periodKey) return true;
  const ym = extractYearMonthKey(dateInput);
  if (!ym) return false;
  if (cadence === 'bulanan') return ym === periodKey;
  if (cadence === 'triwulanan') return getQuarterFromMonthKey(ym) === periodKey;
  if (cadence === 'semesteran') return getSemesterFromMonthKey(ym) === periodKey;
  if (cadence === 'tahunan') return ym.startsWith(periodKey.slice(0, 4));
  return true;
}

export function getStandardPeriodLabel(cadence: ReportingCadence, periodKey: string): string {
  if (cadence === 'semua' || !periodKey) return 'Semua Periode Aktif';
  if (cadence === 'bulanan') {
    const [yr, mo] = periodKey.split('-');
    const names = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const idx = Math.max(0, Math.min(11, (parseInt(mo, 10) || 1) - 1));
    return `Laporan Bulanan (${names[idx]} ${yr})`;
  }
  if (cadence === 'triwulanan') {
    const [yr, qPart] = periodKey.split('-Q');
    const map: Record<string, string> = {
      '1': 'Triwulan I (Jan–Mar)',
      '2': 'Triwulan II (Apr–Jun)',
      '3': 'Triwulan III (Jul–Sep)',
      '4': 'Triwulan IV (Okt–Des)'
    };
    return `${map[qPart] || `Triwulan ${qPart}`} ${yr}`;
  }
  if (cadence === 'semesteran') {
    const [yr, sPart] = periodKey.split('-S');
    return sPart === '1'
      ? `Laporan Semester I / Ganjil (${yr}, Jan–Jun)`
      : `Laporan Semester II / Genap (${yr}, Jul–Des)`;
  }
  return `Laporan Tahunan (${periodKey.slice(0, 4)})`;
}

export function getAvailablePeriodKeys(
  dates: (string | undefined)[],
  cadence: ReportingCadence
): string[] {
  const yms = dates.map(extractYearMonthKey).filter(Boolean);
  if (yms.length === 0) {
    const now = new Date();
    const fallbackYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    yms.push(fallbackYm);
  }
  if (cadence === 'bulanan') {
    return Array.from(new Set(yms)).sort((a, b) => b.localeCompare(a));
  }
  if (cadence === 'triwulanan') {
    return Array.from(new Set(yms.map(getQuarterFromMonthKey).filter(Boolean))).sort((a, b) =>
      b.localeCompare(a)
    );
  }
  if (cadence === 'semesteran') {
    return Array.from(new Set(yms.map(getSemesterFromMonthKey).filter(Boolean))).sort((a, b) =>
      b.localeCompare(a)
    );
  }
  if (cadence === 'tahunan') {
    return Array.from(new Set(yms.map(y => y.slice(0, 4)))).sort((a, b) => b.localeCompare(a));
  }
  return [];
}

// ============================================================================
// GAP ANALYSIS (KEBUTUHAN ASET & SUKU CADANG VS STOK GUDANG)
// ============================================================================

export interface GapAnalysisRow {
  categoryOrItem: string;
  readyStockCount: number;
  demandSparePartsCount: number;
  damagedReplacementCount: number;
  totalDemandCount: number;
  netGap: number; // positive = deficit / needs procurement
  priority: 'Kritis (Defisit)' | 'Perhatian (Menipis)' | 'Aman (Terpenuhi)';
  estimatedUnitCostRp: number;
  estimatedBudgetRp: number;
  recommendation: string;
}

export function computeAssetGapAnalysis(
  assets: Asset[],
  rekapList: BukuAsetInventarisRekap[],
  spareParts: { namaKomponen: string; statusPengadaan: string; urgensi: string; namaBarang?: string }[],
  criticalThreshold: number = 2
): GapAnalysisRow[] {
  const rows: GapAnalysisRow[] = [];

  rekapList.forEach(rk => {
    const catAssets = assets.filter(a => a.kategori === rk.kategori);
    const avgPrice =
      catAssets.length > 0
        ? Math.round(
            catAssets.reduce((s, a) => s + (a.hargaBeli || 0), 0) /
              Math.max(1, catAssets.filter(a => (a.hargaBeli || 0) > 0).length || catAssets.length)
          )
        : 2500000;

    const unfulfilledPartsForCat = spareParts.filter(
      sp =>
        (sp.statusPengadaan === 'Belum Dibeli' || sp.statusPengadaan === 'Diminta') &&
        catAssets.some(a => a.nama === sp.namaBarang)
    ).length;

    const damagedReplacement = rk.rincianStatus.tidakLayak || 0;
    const hasCategoryActivity =
      catAssets.length > 0 ||
      rk.totalMasuk > 0 ||
      unfulfilledPartsForCat > 0 ||
      damagedReplacement > 0;

    if (!hasCategoryActivity) {
      rows.push({
        categoryOrItem: rk.kategori,
        readyStockCount: 0,
        demandSparePartsCount: 0,
        damagedReplacementCount: 0,
        totalDemandCount: 0,
        netGap: 0,
        priority: 'Aman (Terpenuhi)',
        estimatedUnitCostRp: 0,
        estimatedBudgetRp: 0,
        recommendation: 'Belum ada data aset atau pengajuan kebutuhan pada kategori ini.'
      });
      return;
    }

    const safetyBufferDeficit = rk.stokTersedia <= criticalThreshold ? criticalThreshold - rk.stokTersedia + 1 : 0;
    const totalDemand = Math.max(unfulfilledPartsForCat + damagedReplacement, safetyBufferDeficit);
    const netGap = Math.max(0, totalDemand - Math.max(0, rk.stokTersedia - 1));

    let priority: GapAnalysisRow['priority'] = 'Aman (Terpenuhi)';
    if (rk.stokTersedia === 0 || netGap >= 2 || damagedReplacement > 0) {
      priority = 'Kritis (Defisit)';
    } else if (rk.stokTersedia <= criticalThreshold || netGap > 0 || unfulfilledPartsForCat > 0) {
      priority = 'Perhatian (Menipis)';
    }

    const estCost = netGap > 0 ? netGap * (avgPrice || 1500000) : 0;

    let recommendation = 'Stok gudang PUSDATIN mencukupi kebutuhan operasional.';
    if (damagedReplacement > 0 && rk.stokTersedia <= criticalThreshold) {
      recommendation = `Segera ajukan pengadaan ${Math.max(1, netGap)} unit pengganti aset afkir & cadangan stok.`;
    } else if (unfulfilledPartsForCat > 0) {
      recommendation = `Prioritaskan pembelian ${unfulfilledPartsForCat} komponen suku cadang tertunda.`;
    } else if (rk.stokTersedia <= criticalThreshold) {
      recommendation = `Stok siap pakai tersisa ${rk.stokTersedia} unit; disarankan restock buffer minimal ${criticalThreshold + 1} unit.`;
    }

    rows.push({
      categoryOrItem: rk.kategori,
      readyStockCount: rk.stokTersedia,
      demandSparePartsCount: unfulfilledPartsForCat,
      damagedReplacementCount: damagedReplacement,
      totalDemandCount: totalDemand,
      netGap,
      priority,
      estimatedUnitCostRp: avgPrice || 1500000,
      estimatedBudgetRp: estCost,
      recommendation
    });
  });

  // Ensure any unfulfilled spare parts not matched to a category are visible as procurement items
  const pendingParts = spareParts.filter(
    sp => sp.statusPengadaan === 'Belum Dibeli' || sp.statusPengadaan === 'Diminta'
  );
  if (pendingParts.length > 0 && rows.every(r => r.demandSparePartsCount === 0)) {
    rows.push({
      categoryOrItem: 'Komponen & Suku Cadang Perbaikan',
      readyStockCount: 0,
      demandSparePartsCount: pendingParts.length,
      damagedReplacementCount: 0,
      totalDemandCount: pendingParts.length,
      netGap: pendingParts.length,
      priority: 'Kritis (Defisit)',
      estimatedUnitCostRp: 750000,
      estimatedBudgetRp: pendingParts.length * 750000,
      recommendation: `Terdapat ${pendingParts.length} pengajuan komponen yang menunggu persetujuan belanja.`
    });
  }

  return rows.sort((a, b) => {
    const score = (p: GapAnalysisRow['priority']) =>
      p === 'Kritis (Defisit)' ? 0 : p === 'Perhatian (Menipis)' ? 1 : 2;
    return score(a.priority) - score(b.priority);
  });
}

// ============================================================================
// OPERATIONAL DASHBOARD METRICS (4 ITIL MODULES)
// ============================================================================

export interface OperationalDashboardMetrics {
  incidentQueue: {
    total: number;
    openReopen: number;
    needMoreInfo: number;
    assigned: number;
    inProgress: number;
    pendingPaused: number;
    resolvedClosed: number;
    frtOverdueCount: number;
    rtOverdueCount: number;
    approachingSlaCount: number;
    frtComplianceRate: number;
    rtComplianceRate: number;
  };
  technicianWorkloads: {
    technicianId: string;
    name: string;
    roleName: string;
    totalAssigned: number;
    activeLoad: number; // open + assigned + inProgress + paused
    inProgressCount: number;
    waitingCount: number;
    pausedCount: number;
    resolvedCount: number;
    overdueCount: number;
  }[];
  loanFulfillment: {
    waitingApprovalCount: number;
    readyForHandoverCount: number;
    activeBorrowedCount: number;
    returnedCount: number;
    overdueCount: number;
    overdueLoans: LoanTicket[];
    approvalComplianceRate: number;
    fulfillmentComplianceRate: number;
  };
  inventoryHealth: {
    totalAssets: number;
    readyCount: number;
    inUseCount: number;
    borrowedCount: number;
    inServiceUnitsCount: number;
    waitingPartsUnitsCount: number;
    unusableCount: number;
    criticalStockThreshold: number;
    criticalCategories: {
      kategori: string;
      stokTersedia: number;
      totalUnit: number;
      status: 'Habis' | 'Menipis';
    }[];
  };
  rfcPipeline: {
    totalProposals: number;
    tahap1Feasibility: number;
    tahap2Brd: number;
    tahap3Keamanan: number;
    tahap4Approval: number;
    tahap5Sprint: number;
    goLive: number;
    ditolak: number;
    activeItems: SystemProposal[];
  };
}

export function computeOperationalDashboardMetrics(params: {
  assets: Asset[];
  rekapList: BukuAsetInventarisRekap[];
  loans: LoanTicket[];
  damageTickets: DamageTicket[];
  proposals: SystemProposal[];
  technicians: AppUser[];
  sparePartsCountWaiting?: number;
  slaConfig?: SlaConfig;
  serviceSlaConfig?: ServiceSlaConfig;
  criticalStockThreshold?: number;
  todayStr?: string;
}): OperationalDashboardMetrics {
  const {
    assets,
    rekapList,
    loans,
    damageTickets,
    proposals,
    technicians,
    slaConfig = DEFAULT_SLA_CONFIG,
    serviceSlaConfig = DEFAULT_SERVICE_SLA_CONFIG,
    criticalStockThreshold = 2,
    todayStr = new Date().toISOString().split('T')[0]
  } = params;

  // a. Incident Queue & SLA Monitoring
  const slaAgg = computeAggregateSlaStats(damageTickets, slaConfig);
  const evals = damageTickets.map(t => ({ ticket: t, ev: computeSlaEvaluation(t, slaConfig) }));
  const approachingSlaCount = evals.filter(
    x => !x.ev.isResolved && x.ev.overallSlaStatus === 'Mendekati Batas'
  ).length;

  const openReopen = damageTickets.filter(
    t =>
      t.status === 'Open/Unassigned' ||
      t.status === 'Open' ||
      t.status === 'Baru' ||
      t.status === 'Re-opened'
  ).length;
  const needMoreInfo = damageTickets.filter(t => t.status === 'Need More Info').length;
  const assigned = damageTickets.filter(t => t.status === 'Assigned').length;
  const inProgress = damageTickets.filter(t => t.status === 'In Progress').length;
  const pendingPaused = damageTickets.filter(t => isPausedTicketStatus(t.status)).length;
  const resolvedClosed = damageTickets.filter(t => isResolvedTicketStatus(t.status)).length;

  // Beban Kerja Teknisi (Workload)
  const techList = technicians.filter(u => u.role !== 'ACT-01' && u.role !== 'ACT-10');
  const technicianWorkloads = computeTechnicianSlaBreakdown(
    damageTickets,
    techList,
    slaConfig
  ).map(bd => {
    const activeLoad = bd.openCount + bd.inProgressCount + bd.pausedCount;
    return {
      technicianId: bd.technicianId,
      name: bd.technicianName,
      roleName: bd.roleName,
      totalAssigned: bd.totalTickets,
      activeLoad,
      inProgressCount: bd.inProgressCount,
      waitingCount: bd.openCount,
      pausedCount: bd.pausedCount,
      resolvedCount: bd.resolvedCount,
      overdueCount: Math.max(bd.frtOverdueCount, bd.rtOverdueCount)
    };
  });

  // b. Asset Fulfillment & Loan
  const loanSla = computeAggregateLoanSlaStats(loans, serviceSlaConfig);
  const waitingApprovalCount = loans.filter(
    l => l.status === 'Diajukan' || l.status === 'Menunggu'
  ).length;
  const readyForHandoverCount = loans.filter(
    l => l.status === 'Dikonfirmasi' || l.status === 'Diterima'
  ).length;
  const activeBorrowedCount = loans.filter(
    l => l.status === 'Diserahkan' || l.status === 'Disetujui' || l.status === 'Terlambat'
  ).length;
  const returnedCount = loans.filter(
    l => l.status === 'Dikembalikan' || l.status === 'Diterima Kembali' || l.status === 'Ditutup'
  ).length;
  const overdueLoans = loans.filter(
    l =>
      (l.status === 'Diserahkan' || l.status === 'Disetujui' || l.status === 'Terlambat') &&
      Boolean(l.tglKembali) &&
      l.tglKembali < todayStr
  );

  // c. Inventory Health
  const readyCount = assets.filter(a => a.status === 'Tersedia').length;
  const inUseCount = assets.filter(a => a.status === 'Digunakan').length;
  const borrowedCount = assets.filter(a => a.status === 'Dipinjam').length;
  const maintenanceAssets = assets.filter(
    a => a.status === 'Maintenance' || a.status === 'Diperbaiki' || a.status === 'Rusak'
  ).length;
  const inServiceUnitsCount = Math.max(maintenanceAssets, inProgress);
  const waitingPartsUnitsCount = damageTickets.filter(
    t => t.status === 'Pending – Menunggu Suku Cadang'
  ).length;
  const unusableCount = assets.filter(
    a => a.status === 'Tidak Layak' || a.status === 'Rusak Total'
  ).length;

  const criticalCategories = rekapList
    .filter(r => r.stokTersedia <= criticalStockThreshold)
    .map(r => ({
      kategori: r.kategori,
      stokTersedia: r.stokTersedia,
      totalUnit: r.totalMasuk,
      status: (r.stokTersedia === 0 ? 'Habis' : 'Menipis') as 'Habis' | 'Menipis'
    }));

  // d. RFC Pipeline
  const tahap1Feasibility = proposals.filter(p => p.status === 'status_verifikasi').length;
  const tahap2Brd = proposals.filter(p => p.status === 'status_analisis').length;
  const tahap3Keamanan = proposals.filter(p => p.status === 'status_keamanan').length;
  const tahap4Approval = proposals.filter(p => p.status === 'status_approval').length;
  const tahap5Sprint = proposals.filter(p => p.status === 'status_pengembangan').length;
  const goLive = proposals.filter(
    p => p.status === 'Selesai' || p.status === 'Serah Terima'
  ).length;
  const ditolak = proposals.filter(p => p.status === 'Ditolak').length;

  return {
    incidentQueue: {
      total: damageTickets.length,
      openReopen,
      needMoreInfo,
      assigned,
      inProgress,
      pendingPaused,
      resolvedClosed,
      frtOverdueCount: slaAgg.frtOverdueCount,
      rtOverdueCount: slaAgg.rtOverdueCount,
      approachingSlaCount,
      frtComplianceRate: slaAgg.frtComplianceRate,
      rtComplianceRate: slaAgg.rtComplianceRate
    },
    technicianWorkloads,
    loanFulfillment: {
      waitingApprovalCount,
      readyForHandoverCount,
      activeBorrowedCount,
      returnedCount,
      overdueCount: overdueLoans.length,
      overdueLoans,
      approvalComplianceRate: loanSla.approvalComplianceRate,
      fulfillmentComplianceRate: loanSla.fulfillmentComplianceRate
    },
    inventoryHealth: {
      totalAssets: assets.length,
      readyCount,
      inUseCount,
      borrowedCount,
      inServiceUnitsCount,
      waitingPartsUnitsCount,
      unusableCount,
      criticalStockThreshold,
      criticalCategories
    },
    rfcPipeline: {
      totalProposals: proposals.length,
      tahap1Feasibility,
      tahap2Brd,
      tahap3Keamanan,
      tahap4Approval,
      tahap5Sprint,
      goLive,
      ditolak,
      activeItems: proposals.filter(p => p.status !== 'Ditolak')
    }
  };
}

// ============================================================================
// EXECUTIVE DASHBOARD METRICS (4 STRATEGIC MODULES)
// ============================================================================

export interface FacultyAssetComposition {
  unitName: string;
  totalUnits: number;
  valuationRp: number;
  komputer: number;
  networking: number;
  multimedia: number;
  lainnya: number;
}

export interface RecurringIncidentGroup {
  groupName: string;
  totalTickets: number;
  problemOrRfcCount: number;
  unresolvedCount: number;
}

export interface ExecutiveDashboardMetrics {
  portfolio: {
    totalValuationRp: number;
    totalUnits: number;
    averageUnitValueRp: number;
    facultyUnitCompositions: FacultyAssetComposition[];
  };
  slaGovernance: {
    institutionalTargetRate: number; // >= 90%
    combinedSlaComplianceRate: number;
    incidentSlaRate: number;
    loanSlaRate: number;
    proposalInitialSlaRate: number;
    meetsTarget: boolean;
    recurringIncidents: RecurringIncidentGroup[];
    problemAndRfcEscalations: number;
    monthlyIncidentTrend: { monthKey: string; label: string; incidents: number; escalations: number }[];
  };
  csatGovernance: {
    overallAverage: number; // 0..5
    csatPercentage: number; // 0..100%
    totalResponses: number;
    targetScore: number; // >= 4.0
    targetPercentage: number; // >= 85%
    meetsTarget: boolean;
    byModule: {
      Incident: { count: number; avgScore: number };
      Loan: { count: number; avgScore: number };
      SystemProposal: { count: number; avgScore: number };
    };
  };
  digitalTransformation: {
    totalProposals: number;
    approvedAndActiveCount: number;
    goLiveCount: number;
    strategicProposals: SystemProposal[];
    gapRows: GapAnalysisRow[];
    totalEstimatedRapbuRp: number;
    criticalGapCount: number;
  };
}

function classifyUnitBucket(asset: Asset): string {
  const src = `${asset.bidangPengguna || ''} ${asset.lokasi || ''}`.toLowerCase();
  if (src.includes('teknik') || src.includes('ft')) return 'Fakultas Teknik';
  if (src.includes('fkip') || src.includes('keguruan')) return 'FKIP (Keguruan & Ilmu Pendidikan)';
  if (src.includes('feb') || src.includes('ekonomi')) return 'FEB (Ekonomi & Bisnis)';
  if (src.includes('fik') || src.includes('kesehatan')) return 'FIK (Ilmu Kesehatan)';
  if (src.includes('fisip') || src.includes('hukum')) return 'FISIP & Fakultas Hukum';
  if (src.includes('fai') || src.includes('agama islam')) return 'FAI (Agama Islam)';
  if (src.includes('rektorat') || src.includes('baa') || src.includes('bau') || src.includes('keuangan'))
    return 'Rektorat & Biro Administrasi';
  if (src.includes('lab') || src.includes('server') || src.includes('pusdatin') || src.includes('noc'))
    return 'PUSDATIN, NOC & Lab Terpadu';
  return asset.bidangPengguna || 'Unit Kerja Kampus Lainnya';
}

function classifyDeviceType(kategori: string): 'komputer' | 'networking' | 'multimedia' | 'lainnya' {
  const k = (kategori || '').toLowerCase();
  if (k.includes('komputer') || k.includes('laptop') || k.includes('pc') || k.includes('workstation'))
    return 'komputer';
  if (k.includes('jaringan') || k.includes('network') || k.includes('router') || k.includes('switch') || k.includes('wifi') || k.includes('server'))
    return 'networking';
  if (k.includes('proyektor') || k.includes('multimedia') || k.includes('audio') || k.includes('kamera') || k.includes('display'))
    return 'multimedia';
  return 'lainnya';
}

export function computeExecutiveDashboardMetrics(params: {
  assets: Asset[];
  rekapList: BukuAsetInventarisRekap[];
  loans: LoanTicket[];
  damageTickets: DamageTicket[];
  proposals: SystemProposal[];
  surveys: SurveyResponse[];
  spareParts: { namaKomponen: string; statusPengadaan: string; urgensi: string; namaBarang?: string }[];
  slaConfig?: SlaConfig;
  serviceSlaConfig?: ServiceSlaConfig;
}): ExecutiveDashboardMetrics {
  const {
    assets,
    rekapList,
    loans,
    damageTickets,
    proposals,
    surveys,
    spareParts,
    slaConfig = DEFAULT_SLA_CONFIG,
    serviceSlaConfig = DEFAULT_SERVICE_SLA_CONFIG
  } = params;

  // a. Valuasi & Portofolio per Fakultas/Unit
  const totalValuationRp = assets.reduce((sum, a) => sum + (a.hargaBeli || 0), 0);
  const averageUnitValueRp = assets.length > 0 ? Math.round(totalValuationRp / assets.length) : 0;

  const compMap: Record<string, FacultyAssetComposition> = {};
  assets.forEach(a => {
    const unitName = classifyUnitBucket(a);
    if (!compMap[unitName]) {
      compMap[unitName] = {
        unitName,
        totalUnits: 0,
        valuationRp: 0,
        komputer: 0,
        networking: 0,
        multimedia: 0,
        lainnya: 0
      };
    }
    const row = compMap[unitName];
    row.totalUnits += 1;
    row.valuationRp += a.hargaBeli || 0;
    const dtype = classifyDeviceType(a.kategori);
    row[dtype] += 1;
  });

  const facultyUnitCompositions = Object.values(compMap).sort((a, b) => b.totalUnits - a.totalUnits);

  // b. SLA Governance & Recurring Incidents
  const incSla = computeAggregateSlaStats(damageTickets, slaConfig);
  const loanSla = computeAggregateLoanSlaStats(loans, serviceSlaConfig);
  const propSla = computeAggregateProposalSlaStats(proposals, serviceSlaConfig);

  const incidentSlaRate = Math.round((incSla.frtComplianceRate + incSla.rtComplianceRate) / 2);
  const loanSlaRate = Math.round((loanSla.approvalComplianceRate + loanSla.fulfillmentComplianceRate) / 2);
  const proposalInitialSlaRate = Math.round(
    (propSla.feasibilityComplianceRate + propSla.brdComplianceRate) / 2
  );
  const combinedSlaComplianceRate = Math.round((incidentSlaRate + loanSlaRate) / 2);
  const institutionalTargetRate = 90;

  // Group recurring incidents by device/location cluster
  const recMap: Record<string, RecurringIncidentGroup> = {};
  damageTickets.forEach(t => {
    const groupName = t.namaBarang || t.lokasi || 'Infrastruktur Umum';
    if (!recMap[groupName]) {
      recMap[groupName] = {
        groupName,
        totalTickets: 0,
        problemOrRfcCount: 0,
        unresolvedCount: 0
      };
    }
    recMap[groupName].totalTickets += 1;
    if (t.ticketType === 'Problem' || t.ticketType === 'RFC' || Boolean(t.linkedParentTicketId)) {
      recMap[groupName].problemOrRfcCount += 1;
    }
    if (!isResolvedTicketStatus(t.status)) {
      recMap[groupName].unresolvedCount += 1;
    }
  });

  const recurringIncidents = Object.values(recMap).sort(
    (a, b) => b.totalTickets - a.totalTickets || b.problemOrRfcCount - a.problemOrRfcCount
  );

  // Monthly incident vs escalation trend
  const monthBuckets: Record<string, { incidents: number; escalations: number }> = {};
  damageTickets.forEach(t => {
    const ym = extractYearMonthKey(t.createdAtIso || t.tanggalLapor) || '2026-11';
    if (!monthBuckets[ym]) monthBuckets[ym] = { incidents: 0, escalations: 0 };
    monthBuckets[ym].incidents += 1;
    if (t.ticketType === 'Problem' || t.ticketType === 'RFC' || Boolean(t.linkedParentTicketId)) {
      monthBuckets[ym].escalations += 1;
    }
  });
  const monthlyIncidentTrend = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, val]) => ({
      monthKey,
      label: monthKey,
      incidents: val.incidents,
      escalations: val.escalations
    }));

  const problemAndRfcEscalations = damageTickets.filter(
    t => t.ticketType === 'Problem' || t.ticketType === 'RFC' || Boolean(t.linkedParentTicketId)
  ).length;

  // c. CSAT Governance
  const csatAgg = computeAggregateSurveyStats(surveys);
  const csatMeetsTarget =
    csatAgg.totalResponses === 0 ||
    csatAgg.overallAverage >= 4.0 ||
    csatAgg.csatPercentage >= 85;

  // d. Strategic Transformation & Budget (RAPBU)
  const strategicProposals = proposals.filter(p => p.status !== 'Ditolak');
  const approvedAndActiveCount = proposals.filter(
    p => p.status === 'status_approval' || p.status === 'status_pengembangan'
  ).length;
  const goLiveCount = proposals.filter(
    p => p.status === 'Selesai' || p.status === 'Serah Terima'
  ).length;

  const gapRows = computeAssetGapAnalysis(assets, rekapList, spareParts, 2);
  const totalEstimatedRapbuRp = gapRows.reduce((s, r) => s + r.estimatedBudgetRp, 0);
  const criticalGapCount = gapRows.filter(r => r.priority === 'Kritis (Defisit)').length;

  return {
    portfolio: {
      totalValuationRp,
      totalUnits: assets.length,
      averageUnitValueRp,
      facultyUnitCompositions
    },
    slaGovernance: {
      institutionalTargetRate,
      combinedSlaComplianceRate,
      incidentSlaRate,
      loanSlaRate,
      proposalInitialSlaRate,
      meetsTarget: combinedSlaComplianceRate >= institutionalTargetRate,
      recurringIncidents,
      problemAndRfcEscalations,
      monthlyIncidentTrend
    },
    csatGovernance: {
      overallAverage: csatAgg.overallAverage,
      csatPercentage: csatAgg.csatPercentage,
      totalResponses: csatAgg.totalResponses,
      targetScore: 4.0,
      targetPercentage: 85,
      meetsTarget: csatMeetsTarget,
      byModule: {
        Incident: {
          count: csatAgg.byModule.Incident.count,
          avgScore: csatAgg.byModule.Incident.avgScore
        },
        Loan: {
          count: csatAgg.byModule.Loan.count,
          avgScore: csatAgg.byModule.Loan.avgScore
        },
        SystemProposal: {
          count: csatAgg.byModule.SystemProposal.count,
          avgScore: csatAgg.byModule.SystemProposal.avgScore
        }
      }
    },
    digitalTransformation: {
      totalProposals: proposals.length,
      approvedAndActiveCount,
      goLiveCount,
      strategicProposals,
      gapRows,
      totalEstimatedRapbuRp,
      criticalGapCount
    }
  };
}
