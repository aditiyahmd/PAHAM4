import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    length: store.size,
    key: () => null
  } as any;
}

if (typeof globalThis.sessionStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.sessionStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    length: store.size,
    key: () => null
  } as any;
}

import { AppDatabase } from '../src/services/db';
import {
  ITIL_REPORT_CATALOG,
  extractYearMonthKey,
  getQuarterFromMonthKey,
  getSemesterFromMonthKey,
  matchesReportingPeriod,
  getStandardPeriodLabel,
  getAvailablePeriodKeys,
  computeAssetGapAnalysis,
  computeOperationalDashboardMetrics,
  computeExecutiveDashboardMetrics
} from '../src/services/reportGovernanceService';
import { PdfReportService } from '../src/services/pdfReportService';
import { DEFAULT_SERVICE_SLA_CONFIG, DEFAULT_SLA_CONFIG } from '../src/services/slaService';
import { seedTestFixtures } from './testHelpers';

describe('ITIL Reporting Governance, Operational & Executive Dashboards, and Export Suite', () => {
  beforeEach(() => {
    seedTestFixtures();
    AppDatabase.setActiveUser('USR-ACT-02');
  });

  it('ITIL Report Catalog covers all 9 menus with accurate ITIL report titles and export formats', () => {
    const requiredMenus = [
      'buku-penerimaan',
      'buku-pengeluaran',
      'buku-inventaris-rekap',
      'seluruh-aset',
      'kelola-pinjam',
      'kelola-tiket',
      'suku-cadang',
      'pengajuan-sistem',
      'rekap-survei'
    ];
    for (const menuId of requiredMenus) {
      assert.ok(ITIL_REPORT_CATALOG[menuId], `Catalog missing ${menuId}`);
      assert.ok(ITIL_REPORT_CATALOG[menuId].itilReportTitle.length > 5);
      assert.ok(ITIL_REPORT_CATALOG[menuId].preferredFormats.length >= 1);
    }
    assert.strictEqual(ITIL_REPORT_CATALOG['buku-penerimaan'].itilReportTitle, 'Laporan BAST & Audit Inbound');
    assert.strictEqual(ITIL_REPORT_CATALOG['buku-pengeluaran'].itilReportTitle, 'Laporan Mutasi & Distribusi');
    assert.strictEqual(ITIL_REPORT_CATALOG['buku-inventaris-rekap'].itilReportTitle, 'Laporan Saldo Stok & Valuasi');
    assert.strictEqual(ITIL_REPORT_CATALOG['seluruh-aset'].itilReportTitle, 'Katalog & Registri CI (Configuration Item)');
    assert.strictEqual(ITIL_REPORT_CATALOG['kelola-pinjam'].itilReportTitle, 'Laporan Kepatuhan Fulfillment & Peminjaman');
    assert.strictEqual(ITIL_REPORT_CATALOG['kelola-tiket'].itilReportTitle, 'Laporan Kinerja Layanan Teknis');
    assert.strictEqual(ITIL_REPORT_CATALOG['suku-cadang'].itilReportTitle, 'Laporan Analisis Kesenjangan (Gap Analysis)');
    assert.strictEqual(ITIL_REPORT_CATALOG['pengajuan-sistem'].itilReportTitle, 'Laporan Alur 5-Tahap RFC (Request for Change)');
    assert.strictEqual(ITIL_REPORT_CATALOG['rekap-survei'].itilReportTitle, 'Laporan Indeks CSAT (Customer Satisfaction Score)');
  });

  it('3-Tier Reporting Cadence helpers normalize dates and match Bulanan, Triwulanan, Semesteran, & Tahunan', () => {
    assert.strictEqual(extractYearMonthKey('2026-11-14T08:30:00Z'), '2026-11');
    assert.strictEqual(extractYearMonthKey('2026-02-05'), '2026-02');
    assert.strictEqual(getQuarterFromMonthKey('2026-11'), '2026-Q4');
    assert.strictEqual(getQuarterFromMonthKey('2026-04'), '2026-Q2');
    assert.strictEqual(getSemesterFromMonthKey('2026-06'), '2026-S1');
    assert.strictEqual(getSemesterFromMonthKey('2026-11'), '2026-S2');

    assert.strictEqual(matchesReportingPeriod('2026-11-10', 'semua', ''), true);
    assert.strictEqual(matchesReportingPeriod('2026-11-10', 'bulanan', '2026-11'), true);
    assert.strictEqual(matchesReportingPeriod('2026-10-10', 'bulanan', '2026-11'), false);
    assert.strictEqual(matchesReportingPeriod('2026-10-10', 'triwulanan', '2026-Q4'), true);
    assert.strictEqual(matchesReportingPeriod('2026-07-01', 'semesteran', '2026-S2'), true);
    assert.strictEqual(matchesReportingPeriod('2026-01-15', 'semesteran', '2026-S2'), false);
    assert.strictEqual(matchesReportingPeriod('2026-01-15', 'tahunan', '2026'), true);

    assert.ok(getStandardPeriodLabel('bulanan', '2026-11').includes('November 2026'));
    assert.ok(getStandardPeriodLabel('triwulanan', '2026-Q4').includes('Triwulan IV'));
    assert.ok(getStandardPeriodLabel('semesteran', '2026-S1').includes('Semester I'));
    assert.ok(getStandardPeriodLabel('tahunan', '2026').includes('2026'));

    const keys = getAvailablePeriodKeys(['2026-02-01', '2026-11-12', '2026-10-05'], 'triwulanan');
    assert.deepStrictEqual(keys, ['2026-Q4', '2026-Q1']);
  });

  it('Gap Analysis computes deficits and estimated RAPBU procurement costs accurately', () => {
    const assets = AppDatabase.getAssets();
    const rekap = AppDatabase.getBukuAsetInventarisRekap();
    const parts = AppDatabase.getAllSpareParts();

    const gapRows = computeAssetGapAnalysis(assets, rekap, parts, 2);
    assert.ok(gapRows.length >= 1, 'Gap analysis must produce category/component rows');
    for (const row of gapRows) {
      assert.ok(row.netGap >= 0);
      assert.ok(row.estimatedBudgetRp >= 0);
      assert.ok(['Kritis (Defisit)', 'Perhatian (Menipis)', 'Aman (Terpenuhi)'].includes(row.priority));
    }
  });

  it('Gap Analysis returns 0 deficits, Aman (Terpenuhi), and Rp 0 RAPBU when categories have no data', () => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
    AppDatabase.resetToDefaultSeed();

    const emptyGapRows = computeAssetGapAnalysis(
      AppDatabase.getAssets(),
      AppDatabase.getBukuAsetInventarisRekap(),
      AppDatabase.getAllSpareParts(),
      2
    );
    assert.ok(emptyGapRows.length >= 7);
    for (const row of emptyGapRows) {
      assert.strictEqual(row.readyStockCount, 0);
      assert.strictEqual(row.demandSparePartsCount, 0);
      assert.strictEqual(row.damagedReplacementCount, 0);
      assert.strictEqual(row.totalDemandCount, 0);
      assert.strictEqual(row.netGap, 0);
      assert.strictEqual(row.estimatedUnitCostRp, 0);
      assert.strictEqual(row.estimatedBudgetRp, 0);
      assert.strictEqual(row.priority, 'Aman (Terpenuhi)');
    }
    const totalRapbu = emptyGapRows.reduce((sum, r) => sum + r.estimatedBudgetRp, 0);
    assert.strictEqual(totalRapbu, 0);
  });

  it('Operational Dashboard metrics cover all 4 ITIL operational modules with overdue loan detection', () => {
    // Inject an explicit overdue loan for deterministic test verification
    const overdueLoan = AppDatabase.addLoan({
      peminjam: 'Dosen Uji Overdue',
      nik: '049999999',
      unit: 'Fakultas Teknik',
      kontak: '08120000111',
      email: 'overdue@umc.ac.id',
      barangPinjaman: 'Proyektor Epson EB-X500',
      jumlah: 1,
      tglPinjam: '2026-10-01',
      tglKembali: '2026-10-05',
      catatan: 'Uji alert overdue'
    });
    const availAsset = AppDatabase.getAssets().find(a => a.status === 'Tersedia');
    if (availAsset) {
      AppDatabase.processLoanTicket(overdueLoan.id, 'terima', {
        barcode: availAsset.barcode,
        namaBarang: availAsset.nama,
        completeHandover: true
      });
    }

    const metrics = computeOperationalDashboardMetrics({
      assets: AppDatabase.getAssets(),
      rekapList: AppDatabase.getBukuAsetInventarisRekap(),
      loans: AppDatabase.getLoans(),
      damageTickets: AppDatabase.getDamageTickets(),
      proposals: AppDatabase.getSystemProposals(),
      technicians: AppDatabase.getTechnicians(),
      todayStr: '2026-11-15'
    });

    assert.ok(metrics.incidentQueue.total >= 1);
    assert.ok(metrics.technicianWorkloads.length >= 1);
    assert.ok(metrics.loanFulfillment.overdueCount >= 1);
    assert.ok(metrics.loanFulfillment.overdueLoans.some(l => l.id === overdueLoan.id));
    assert.strictEqual(metrics.inventoryHealth.totalAssets, AppDatabase.getAssets().length);
    assert.strictEqual(metrics.inventoryHealth.criticalStockThreshold, 2);
    assert.ok(metrics.rfcPipeline.totalProposals >= 1);
  });

  it('Executive Dashboard metrics cover all 4 strategic modules (Portfolio, SLA >= 90%, CSAT, RFC & RAPBU)', () => {
    const metrics = computeExecutiveDashboardMetrics({
      assets: AppDatabase.getAssets(),
      rekapList: AppDatabase.getBukuAsetInventarisRekap(),
      loans: AppDatabase.getLoans(),
      damageTickets: AppDatabase.getDamageTickets(),
      proposals: AppDatabase.getSystemProposals(),
      surveys: AppDatabase.getSurveys(),
      spareParts: AppDatabase.getAllSpareParts()
    });

    assert.ok(metrics.portfolio.totalValuationRp > 0);
    assert.ok(metrics.portfolio.facultyUnitCompositions.length >= 1);
    const totalFromComp = metrics.portfolio.facultyUnitCompositions.reduce(
      (s, f) => s + f.komputer + f.networking + f.multimedia + f.lainnya,
      0
    );
    assert.strictEqual(totalFromComp, metrics.portfolio.totalUnits);

    assert.strictEqual(metrics.slaGovernance.institutionalTargetRate, 90);
    assert.ok(metrics.slaGovernance.recurringIncidents.length >= 1);
    assert.strictEqual(metrics.csatGovernance.targetScore, 4.0);
    assert.strictEqual(metrics.csatGovernance.targetPercentage, 85);
    assert.ok(metrics.digitalTransformation.gapRows.length >= 1);
  });

  it('All new ITIL official PDF generators produce valid non-empty PDF outputs', () => {
    const stats = AppDatabase.getStatistics();
    const execMetrics = computeExecutiveDashboardMetrics({
      assets: AppDatabase.getAssets(),
      rekapList: AppDatabase.getBukuAsetInventarisRekap(),
      loans: AppDatabase.getLoans(),
      damageTickets: AppDatabase.getDamageTickets(),
      proposals: AppDatabase.getSystemProposals(),
      surveys: AppDatabase.getSurveys(),
      spareParts: AppDatabase.getAllSpareParts()
    });

    const execPdf = PdfReportService.generateExecutiveDashboardPdf(stats, '2026-11', {
      totalAsetValue: execMetrics.portfolio.totalValuationRp,
      executiveMetrics: execMetrics,
      cadenceLabel: 'Laporan Tahunan (2026)'
    });
    assert.ok(execPdf.getNumberOfPages() >= 1);
    assert.ok(execPdf.output('arraybuffer').byteLength > 1000);

    const loanPdf = PdfReportService.generateLoanComplianceMonthlyPdf(
      AppDatabase.getLoans(),
      'November 2026',
      DEFAULT_SERVICE_SLA_CONFIG
    );
    assert.ok(loanPdf.output('arraybuffer').byteLength > 1000);

    const sampleTicket = AppDatabase.getDamageTickets()[0];
    const completionPdf = PdfReportService.generateIncidentCompletionSheetPdf(
      sampleTicket,
      DEFAULT_SLA_CONFIG
    );
    assert.ok(completionPdf.output('arraybuffer').byteLength > 1000);

    const rfcPdf = PdfReportService.generateRfcPortfolioReportPdf(
      AppDatabase.getSystemProposals(),
      'Laporan Tahunan (2026)',
      DEFAULT_SERVICE_SLA_CONFIG
    );
    assert.ok(rfcPdf.output('arraybuffer').byteLength > 1000);

    const gapPdf = PdfReportService.generateGapAnalysisPdf(
      execMetrics.digitalTransformation.gapRows,
      'Triwulan IV (2026)'
    );
    assert.ok(gapPdf.output('arraybuffer').byteLength > 1000);
  });
});
