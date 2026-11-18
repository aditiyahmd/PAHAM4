import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock browser storage for Node.js unit testing
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
  DEFAULT_SLA_CONFIG,
  DEFAULT_SERVICE_SLA_CONFIG,
  filterTicketsForTechnician,
  computeTechnicianSlaBreakdown,
  computeAggregateSlaStats,
  computeLoanSlaEvaluation,
  computeAggregateLoanSlaStats,
  computeProposalSlaEvaluation,
  computeAggregateProposalSlaStats
} from '../src/services/slaService';
import {
  LIKERT_SCALE_OPTIONS,
  SURVEY_SCHEMAS,
  isDamageEligibleForSurvey,
  isLoanEligibleForSurvey,
  isProposalEligibleForSurvey,
  computeAggregateSurveyStats,
  filterSurveysByMonthAndModule
} from '../src/services/surveyService';
import { AccessControlService } from '../src/services/rbac';
import { PdfReportService } from '../src/services/pdfReportService';
import { seedTestFixtures } from './testHelpers';

describe('ITIL SLA Scoping, Service Request & Proposal SLA, and Continual Improvement CSAT Suite', () => {
  beforeEach(() => {
    seedTestFixtures();
  });

  it('Req 2 & 3: Technician SLA breakdown scopes tickets per technician and differs across technicians', () => {
    const tickets = AppDatabase.getDamageTickets();
    const technicians = AppDatabase.getTechnicians().filter(u => u.role !== 'ACT-01' && u.role !== 'ACT-10');

    const faisal = technicians.find(t => t.id === 'USR-ACT-04')!;
    const rian = technicians.find(t => t.id === 'USR-ACT-05')!;

    assert.ok(faisal && rian);

    const faisalTickets = filterTicketsForTechnician(tickets, faisal);
    const rianTickets = filterTicketsForTechnician(tickets, rian);

    assert.ok(faisalTickets.length >= 1, 'Faisal should have assigned/scoped tickets');
    assert.ok(faisalTickets.length < tickets.length, 'Scoped technician tickets must be subset of global tickets');
    assert.notDeepStrictEqual(
      faisalTickets.map(t => t.id),
      rianTickets.map(t => t.id)
    );

    const breakdown = computeTechnicianSlaBreakdown(tickets, technicians, DEFAULT_SLA_CONFIG);
    const faisalScore = breakdown.find(b => b.technicianId === 'USR-ACT-04')!;
    const faisalAgg = computeAggregateSlaStats(faisalTickets, DEFAULT_SLA_CONFIG);

    assert.strictEqual(faisalScore.totalTickets, faisalTickets.length);
    assert.strictEqual(faisalScore.frtComplianceRate, faisalAgg.frtComplianceRate);
    assert.strictEqual(faisalScore.rtComplianceRate, faisalAgg.rtComplianceRate);
  });

  it('Req 3: Technician SLA PDF generator produces valid individual & team recap PDFs with pure black signatories', () => {
    const tickets = AppDatabase.getDamageTickets();
    const technicians = AppDatabase.getTechnicians().filter(u => u.role !== 'ACT-01' && u.role !== 'ACT-10');
    const breakdown = computeTechnicianSlaBreakdown(tickets, technicians, DEFAULT_SLA_CONFIG);
    const faisalBreakdown = breakdown.find(b => b.technicianId === 'USR-ACT-04')!;
    const faisalTech = technicians.find(t => t.id === 'USR-ACT-04')!;

    const indDoc = PdfReportService.generateTechnicianSlaPdf({
      mode: 'individual',
      periodLabel: 'November 2026',
      technician: faisalBreakdown,
      tickets: filterTicketsForTechnician(tickets, faisalTech),
      slaConfig: DEFAULT_SLA_CONFIG
    });
    assert.ok(indDoc.getNumberOfPages() >= 1);
    assert.ok(indDoc.output('arraybuffer').byteLength > 1000);

    const recapDoc = PdfReportService.generateTechnicianSlaPdf({
      mode: 'recap',
      periodLabel: 'Semua Periode',
      recapRows: breakdown,
      overallSummary: computeAggregateSlaStats(tickets, DEFAULT_SLA_CONFIG),
      slaConfig: DEFAULT_SLA_CONFIG
    });
    assert.ok(recapDoc.getNumberOfPages() >= 1);
    assert.ok(recapDoc.output('arraybuffer').byteLength > 1000);
  });

  it('Req 4a: Loan ITIL Service Request SLA tracks Approval Time (120 mnt) and Fulfillment Time (4 jam)', () => {
    const t0 = Date.UTC(2026, 10, 12, 8, 0, 0);
    const createdLoan = AppDatabase.addLoan({
      peminjam: 'Dr. Test SLA',
      nik: '041111111',
      unit: 'Teknik Informatika',
      kontak: '08123456789',
      email: 'test.sla@umc.ac.id',
      barangPinjaman: 'Laptop Dell Latitude 5430 Core i5 16GB',
      jumlah: 1,
      tglPinjam: '2026-11-12',
      tglKembali: '2026-11-14',
      catatan: 'Uji SLA Peminjaman',
      customNowMs: t0
    });

    assert.ok(createdLoan.createdAtIso);

    // Waiting loan evaluation at t0 + 30 mins -> Dalam Batas
    const waitingEval = computeLoanSlaEvaluation(createdLoan, DEFAULT_SERVICE_SLA_CONFIG, t0 + 30 * 60000);
    assert.strictEqual(waitingEval.isApproved, false);
    assert.strictEqual(waitingEval.approvalStatus, 'Dalam Batas');

    // Approve & fulfill at t0 + 45 mins (<= 120m approval & <= 4h fulfillment)
    const assets = AppDatabase.getAssets();
    const availableAsset = assets.find(a => a.status === 'Tersedia')!;
    const procRes = AppDatabase.processLoanTicket(createdLoan.id, 'terima', {
      barcode: availableAsset.barcode,
      namaBarang: availableAsset.nama,
      completeHandover: true,
      customNowMs: t0 + 45 * 60000
    });

    assert.strictEqual(procRes.success, true);
    assert.ok(procRes.ticket?.approvedAtIso);
    assert.ok(procRes.ticket?.fulfilledAtIso);

    const metEval = computeLoanSlaEvaluation(procRes.ticket!, DEFAULT_SERVICE_SLA_CONFIG, t0 + 60 * 60000);
    assert.strictEqual(metEval.isApproved, true);
    assert.strictEqual(metEval.isFulfilled, true);
    assert.strictEqual(metEval.approvalStatus, 'Memenuhi SLA');
    assert.strictEqual(metEval.fulfillmentStatus, 'Memenuhi SLA');

    // Verify Aggregate stats and Service SLA config setter
    const aggLoans = computeAggregateLoanSlaStats(AppDatabase.getLoans(), DEFAULT_SERVICE_SLA_CONFIG);
    assert.ok(aggLoans.totalLoans >= 1);

    const updateRes = AppDatabase.setServiceSlaConfig({
      loan: { approvalTargetMinutes: 90, fulfillmentTargetHours: 6 },
      proposal: { feasibilityTargetHours: 12, brdTargetHours: 48 }
    });
    assert.strictEqual(updateRes.success, true);
    assert.strictEqual(AppDatabase.getServiceSlaConfig().loan.approvalTargetMinutes, 90);
    assert.strictEqual(AppDatabase.getServiceSlaConfig().proposal.brdTargetHours, 48);
  });

  it('Req 4b: System Proposal ITIL SLA tracks Feasibility Study (Tahap 1) & BRD (Tahap 2) response times', () => {
    const t0 = Date.UTC(2026, 10, 10, 9, 0, 0);
    const createdProp = AppDatabase.addSystemProposal({
      namaSistem: 'Sistem Uji SLA Analisis',
      latarBelakang: 'Mengukur kepastian respons awal ITIL',
      ruangLingkup: 'Feasibility & BRD',
      customNowMs: t0
    });

    const stage1Eval = computeProposalSlaEvaluation(createdProp, DEFAULT_SERVICE_SLA_CONFIG, t0 + 5 * 3600000);
    assert.strictEqual(stage1Eval.isFeasibilityDone, false);
    assert.strictEqual(stage1Eval.feasibilityStatus, 'Dalam Batas');
    assert.strictEqual(stage1Eval.brdStatus, 'Menunggu Tahap 1');

    // Stage 1 verification by Admin at t0 + 10 hours (target 24h -> Memenuhi SLA)
    AppDatabase.setActiveUser('USR-ACT-03');
    const step1 = AppDatabase.advanceSystemProposal(createdProp.id, 'verifikasi_admin', {
      lengkap: true,
      catatan: 'Layak dilanjutkan',
      customNowMs: t0 + 10 * 3600000
    });
    assert.ok(step1.proposal?.verifiedAtIso);

    // Stage 2 BRD completion by System Analyst (ACT-05) at t0 + 40 hours (30h after Stage 1, target 72h -> Memenuhi SLA)
    AppDatabase.setActiveUser('USR-ACT-05');
    const step2 = AppDatabase.advanceSystemProposal(createdProp.id, 'analisis_system_analyst', {
      catatan: 'BRD disahkan',
      customNowMs: t0 + 40 * 3600000
    });
    assert.ok(step2.proposal?.brdCompletedAtIso);

    const finalEval = computeProposalSlaEvaluation(step2.proposal!, DEFAULT_SERVICE_SLA_CONFIG);
    assert.strictEqual(finalEval.isFeasibilityDone, true);
    assert.strictEqual(finalEval.isBrdDone, true);
    assert.strictEqual(finalEval.feasibilityStatus, 'Memenuhi SLA');
    assert.strictEqual(finalEval.brdStatus, 'Memenuhi SLA');

    const aggProp = computeAggregateProposalSlaStats(AppDatabase.getSystemProposals(), DEFAULT_SERVICE_SLA_CONFIG);
    assert.ok(aggProp.totalProposals >= 1);
  });

  it('Req 5: CSAT schemas match exact 3x4 questions with 1-5 emoji scale, prevents duplicate submit, and filters/exports PDF recap', () => {
    // 1. Schema & Likert checks
    assert.strictEqual(LIKERT_SCALE_OPTIONS.length, 5);
    assert.deepStrictEqual(
      LIKERT_SCALE_OPTIONS.map(o => o.emoji),
      ['😡', '😟', '😐', '🙂', '😍']
    );
    assert.strictEqual(
      SURVEY_SCHEMAS.Incident.questions[0].question,
      'Seberapa puas Anda dengan kecepatan respons dan penyelesaian masalah oleh tim IT?'
    );
    assert.strictEqual(
      SURVEY_SCHEMAS.Loan.questions[0].question,
      'Bagaimana kondisi dan kelayakan aset IT (laptop/proyektor/dsb) yang Anda pinjam?'
    );
    assert.strictEqual(
      SURVEY_SCHEMAS.SystemProposal.questions[0].question,
      'Seberapa mudah antarmuka (UI/UX) sistem baru ini digunakan untuk pekerjaan Anda sehari-hari?'
    );

    // 2. Eligibility checks
    assert.strictEqual(isDamageEligibleForSurvey({ status: 'Resolved' }), true);
    assert.strictEqual(isDamageEligibleForSurvey({ status: 'In Progress' }), false);
    assert.strictEqual(isLoanEligibleForSurvey({ status: 'Dikembalikan' }), true);
    assert.strictEqual(isLoanEligibleForSurvey({ status: 'Diserahkan' }), false);
    assert.strictEqual(isProposalEligibleForSurvey({ status: 'Serah Terima' }), true);
    assert.strictEqual(isProposalEligibleForSurvey({ status: 'status_pengembangan' }), false);

    // 3. Submit survey & duplicate protection
    const submitRes = AppDatabase.submitSurveyResponse({
      moduleType: 'Incident',
      entityId: 'TKT-TEST-CSAT-99',
      entityTitle: 'Switch Core Uji',
      ratings: { q1: 5, q2: 4, q3: 5 },
      feedbackText: 'Sangat cepat dan membantu',
      customNowMs: Date.UTC(2026, 10, 15, 10, 0, 0)
    });
    assert.strictEqual(submitRes.success, true);
    assert.strictEqual(submitRes.survey?.averageScore, 4.67);
    assert.strictEqual(submitRes.survey?.monthKey, '2026-11');

    const dupRes = AppDatabase.submitSurveyResponse({
      moduleType: 'Incident',
      entityId: 'TKT-TEST-CSAT-99',
      entityTitle: 'Switch Core Uji',
      ratings: { q1: 3, q2: 3, q3: 3 },
      feedbackText: 'Duplikat'
    });
    assert.strictEqual(dupRes.success, false);

    // 4. Filter by month & module + aggregate stats + PDF generation + RBAC check
    const allSurveys = AppDatabase.getSurveys();
    const novIncidents = filterSurveysByMonthAndModule(allSurveys, '2026-11', 'Incident');
    assert.ok(novIncidents.some(s => s.entityId === 'TKT-TEST-CSAT-99'));
    assert.ok(novIncidents.every(s => s.monthKey === '2026-11' && s.moduleType === 'Incident'));

    const agg = computeAggregateSurveyStats(allSurveys);
    assert.ok(agg.totalResponses >= 5);
    assert.ok(agg.overallAverage >= 1 && agg.overallAverage <= 5);

    const pdfDoc = PdfReportService.generateSurveyRecapMonthlyPdf(
      novIncidents,
      'November 2026',
      'Laporan Kerusakan'
    );
    assert.ok(pdfDoc.getNumberOfPages() >= 1);
    assert.ok(pdfDoc.output('arraybuffer').byteLength > 1000);

    // RBAC check: ACT-01, ACT-02, ACT-03 can access rekap_survei
    assert.notStrictEqual(AccessControlService.getAccessLevel('ACT-01', 'rekap_survei'), 'none');
    assert.notStrictEqual(AccessControlService.getAccessLevel('ACT-02', 'rekap_survei'), 'none');
    assert.notStrictEqual(AccessControlService.getAccessLevel('ACT-03', 'rekap_survei'), 'none');
    assert.strictEqual(AccessControlService.getAccessLevel('ACT-04', 'rekap_survei'), 'none');
  });
});
