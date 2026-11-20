import { describe, it, before } from 'node:test';
import assert from 'node:assert';

// Mock storage for Node test environment
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
  parseFlexibleDate,
  computeSlaEvaluation,
  computeAggregateSlaStats
} from '../src/services/slaService';
import { validateRegisteredSsoLogin } from '../src/services/authValidation';
import { PdfReportService } from '../src/services/pdfReportService';
import { DamageTicket } from '../src/types';
import { seedTestFixtures } from './testHelpers';

describe('PAHAM Refinements Suite - SLA, SSO Domain & Registered Users, One-Step Loan, Signatories & Black BAST Font', () => {
  before(() => {
    seedTestFixtures();
  });

  it('Refinement 6a: parseFlexibleDate parses ISO timestamps and Indonesian DD/MM/YYYY formats cleanly', () => {
    const isoDate = parseFlexibleDate('2026-11-12T09:15:00.000Z');
    assert.ok(isoDate instanceof Date && !Number.isNaN(isoDate.getTime()));

    const idDotDate = parseFlexibleDate('12/11/2026, 14.30.00');
    assert.ok(idDotDate instanceof Date && !Number.isNaN(idDotDate.getTime()));
    assert.strictEqual(idDotDate?.getFullYear(), 2026);
    assert.strictEqual(idDotDate?.getMonth(), 10);
    assert.strictEqual(idDotDate?.getDate(), 12);
    assert.strictEqual(idDotDate?.getHours(), 14);
    assert.strictEqual(idDotDate?.getMinutes(), 30);

    const idColonDate = parseFlexibleDate('05-03-2026 08:45');
    assert.ok(idColonDate instanceof Date);
    assert.strictEqual(idColonDate?.getDate(), 5);
    assert.strictEqual(idColonDate?.getMonth(), 2);
    assert.strictEqual(idColonDate?.getHours(), 8);
    assert.strictEqual(idColonDate?.getMinutes(), 45);
  });

  it('Refinement 6b: computeSlaEvaluation and computeAggregateSlaStats evaluate FRT & RT Met vs Overdue accurately', () => {
    const baseCreated = '2026-11-10T08:00:00.000Z';
    const metTicket: DamageTicket = {
      id: 'TKT-SLA-MET',
      pelapor: 'Dosen Uji',
      unit: 'Teknik',
      kontak: '08123456',
      barang: 'Proyektor',
      lokasi: 'R.201',
      kategori: 'Multimedia',
      urgensi: 'Kritis',
      prioritas: 'Kritis',
      deskripsi: 'Mati total',
      status: 'Resolved',
      tanggalLapor: baseCreated,
      createdAtIso: baseCreated,
      firstResponseAtIso: '2026-11-10T08:10:00.000Z', // 10 mnt <= 15 mnt
      resolvedAtIso: '2026-11-10T10:30:00.000Z', // 2.5 jam <= 4 jam
      slaDeadline: '2026-11-10T12:00:00.000Z',
      slaTargetHours: 4
    };

    const metEval = computeSlaEvaluation(metTicket, DEFAULT_SLA_CONFIG);
    assert.strictEqual(metEval.frtStatus, 'Memenuhi SLA');
    assert.strictEqual(metEval.rtStatus, 'Memenuhi SLA');
    assert.strictEqual(metEval.overallSlaStatus, 'On Track');

    const overdueTicket: DamageTicket = {
      id: 'TKT-SLA-OVER',
      pelapor: 'Staff Uji',
      unit: 'BAA',
      kontak: '08123457',
      barang: 'PC Admin',
      lokasi: 'R.102',
      kategori: 'Komputer & Laptop',
      urgensi: 'Kritis',
      prioritas: 'Kritis',
      deskripsi: 'BSOD',
      status: 'Resolved',
      tanggalLapor: baseCreated,
      createdAtIso: baseCreated,
      firstResponseAtIso: '2026-11-10T08:45:00.000Z', // 45 mnt > 15 mnt
      resolvedAtIso: '2026-11-10T15:00:00.000Z', // 7 jam > 4 jam
      slaDeadline: '2026-11-10T12:00:00.000Z',
      slaTargetHours: 4
    };

    const overEval = computeSlaEvaluation(overdueTicket, DEFAULT_SLA_CONFIG);
    assert.strictEqual(overEval.frtStatus, 'Melewati SLA');
    assert.strictEqual(overEval.rtStatus, 'Melewati SLA');
    assert.strictEqual(overEval.overallSlaStatus, 'Overdue');

    const agg = computeAggregateSlaStats([metTicket, overdueTicket], DEFAULT_SLA_CONFIG);
    assert.strictEqual(agg.totalTickets, 2);
    assert.strictEqual(agg.frtComplianceRate, 50);
    assert.strictEqual(agg.rtComplianceRate, 50);
    assert.strictEqual(agg.frtOverdueCount, 1);
    assert.strictEqual(agg.rtOverdueCount, 1);
  });

  it('Refinement 6c: AppDatabase.setSlaConfig validates & persists SLA FRT/RT targets, and ticket lifecycle auto-stamps FRT & RT timestamps', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const slaRes = AppDatabase.setSlaConfig({
      Kritis: { frtTargetMinutes: 10, rtTargetHours: 3 },
      Tinggi: { frtTargetMinutes: 25, rtTargetHours: 10 },
      Sedang: { frtTargetMinutes: 45, rtTargetHours: 20 },
      Rendah: { frtTargetMinutes: 90, rtTargetHours: 36 }
    });
    assert.strictEqual(slaRes.success, true);
    assert.strictEqual(AppDatabase.getSlaConfig().Kritis.frtTargetMinutes, 10);
    assert.strictEqual(AppDatabase.getSlaConfig().Kritis.rtTargetHours, 3);

    const created = AppDatabase.addDamageTicket({
      pelapor: 'Pelapor SLA Auto',
      unit: 'Prodi Informatika',
      kontak: '08111222333',
      barang: 'Switch Lab',
      lokasi: 'Lab Komputer 1',
      kategori: 'Jaringan & Internet',
      urgensi: 'Kritis',
      deskripsi: 'Koneksi lab terputus'
    });
    assert.ok(created.createdAtIso);
    assert.strictEqual(created.frtTargetMinutes, 10);
    assert.strictEqual(created.rtTargetHours, 3);
    assert.strictEqual(created.firstResponseAtIso, undefined);

    // Assign / start work -> auto-stamps firstResponseAtIso
    const assigned = AppDatabase.processDamageTicket(created.id, 'delegasikan', {
      targetTechnicianId: 'USR-ACT-04',
      catatan: 'Ditugaskan segera'
    });
    assert.strictEqual(assigned.success, true);
    assert.ok(assigned.ticket?.firstResponseAtIso);

    // Resolve -> auto-stamps resolvedAtIso
    const resolved = AppDatabase.processDamageTicket(created.id, 'selesai-perbaikan', {
      resolusiAkhir: 'Ganti port uplink'
    });
    assert.strictEqual(resolved.success, true);
    assert.ok(resolved.ticket?.resolvedAtIso);

    // Restore default SLA config
    AppDatabase.setSlaConfig(DEFAULT_SLA_CONFIG);
  });

  it('Refinement 7 & Improvement 2: validateRegisteredSsoLogin allows all @umc.ac.id & @student.umc.ac.id (auto-provisioning ACT-10) and enforces Aktif status', () => {
    const users = AppDatabase.getUsers();

    // Active institutional staff (@umc.ac.id)
    const adminRes = validateRegisteredSsoLogin('aditiya.ahmad@umc.ac.id', users);
    assert.strictEqual(adminRes.ok, true);
    assert.strictEqual(adminRes.user?.role, 'ACT-03');
    assert.strictEqual(adminRes.isNewUser, false);

    // Active student (@student.umc.ac.id)
    const studentRes = validateRegisteredSsoLogin('m.rizki@student.umc.ac.id', users);
    assert.strictEqual(studentRes.ok, true);
    assert.strictEqual(studentRes.user?.civitasType, 'Mahasiswa');
    assert.strictEqual(studentRes.isNewUser, false);

    // Rejected non-UMC domain
    const gmailRes = validateRegisteredSsoLogin('budi@gmail.com', users);
    assert.strictEqual(gmailRes.ok, false);
    assert.ok(gmailRes.error?.includes('@umc.ac.id'));

    // Auto-provision unregistered @umc.ac.id email as ACT-10 Dosen
    const unregStaff = validateRegisteredSsoLogin('dosen.baru@umc.ac.id', users);
    assert.strictEqual(unregStaff.ok, true);
    assert.strictEqual(unregStaff.isNewUser, true);
    assert.strictEqual(unregStaff.user?.role, 'ACT-10');
    assert.strictEqual(unregStaff.user?.civitasType, 'Dosen');
    assert.strictEqual(unregStaff.user?.statusAkun, 'Aktif');

    // Auto-provision unregistered @student.umc.ac.id email as ACT-10 Mahasiswa
    const unregStudent = validateRegisteredSsoLogin('220511099@student.umc.ac.id', users);
    assert.strictEqual(unregStudent.ok, true);
    assert.strictEqual(unregStudent.isNewUser, true);
    assert.strictEqual(unregStudent.user?.role, 'ACT-10');
    assert.strictEqual(unregStudent.user?.civitasType, 'Mahasiswa');

    // Deactivated registered user is rejected until reactivated
    AppDatabase.setActiveUser('USR-ACT-03');
    const toggledOff = AppDatabase.toggleUserStatus('USR-ACT-10C');
    assert.strictEqual(toggledOff?.statusAkun, 'Nonaktif');

    const deactivatedRes = validateRegisteredSsoLogin('m.rizki@student.umc.ac.id', AppDatabase.getUsers());
    assert.strictEqual(deactivatedRes.ok, false);
    assert.ok(deactivatedRes.error?.includes('Nonaktif'));

    // Reactivate student account cleanly
    const toggledOn = AppDatabase.toggleUserStatus('USR-ACT-10C');
    assert.strictEqual(toggledOn?.statusAkun, 'Aktif');
  });

  it('Refinement 5: One-step Setujui Pinjaman (completeHandover: true) transitions directly to Diserahkan and logs BukuPengeluaran', () => {
    AppDatabase.setActiveUser('USR-ACT-10B');
    const loan = AppDatabase.addLoan({
      peminjam: 'Mahasiswa OneStep',
      nik: '2205110099',
      unit: 'Teknik Informatika',
      kontak: '08199887766',
      email: 'm.rizki@student.umc.ac.id',
      barangPinjaman: 'Laptop Uji OneStep',
      jumlah: 1,
      tglPinjam: '2026-11-15',
      tglKembali: '2026-11-17',
      catatan: 'Praktikum'
    });
    assert.strictEqual(loan.status, 'Diajukan');

    AppDatabase.setActiveUser('USR-ACT-03');
    const availAsset = AppDatabase.getAssets().find(a => a.status === 'Tersedia');
    assert.ok(availAsset);

    const outBefore = AppDatabase.getBukuPengeluaran().length;
    const approveRes = AppDatabase.processLoanTicket(loan.id, 'terima', {
      barcode: availAsset.barcode,
      catatan: 'Disetujui & diserahkan 1 langkah',
      completeHandover: true
    });

    assert.strictEqual(approveRes.success, true);
    assert.strictEqual(approveRes.ticket?.status, 'Diserahkan');
    assert.strictEqual(AppDatabase.getAssetByBarcode(availAsset.barcode)?.status, 'Dipinjam');
    assert.ok(AppDatabase.getBukuPengeluaran().length >= outBefore + 1);

    // Return asset to restore clean state
    const retRes = AppDatabase.processLoanTicket(loan.id, 'kembali', {
      hasilPemeriksaanKembali: 'Baik / Lengkap'
    });
    assert.strictEqual(retRes.success, true);
    assert.strictEqual(AppDatabase.getAssetByBarcode(availAsset.barcode)?.status, 'Tersedia');
  });

  it('Refinement 8 & 3: DocumentSignatories updates, syncs from Master Users, and BAST PDF renders black signature text', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    AppDatabase.setDocumentSignatories({
      pimpinanUnivNama: 'Prof. Dr. Rektor Baru, M.T.',
      pimpinanUnivJabatan: 'Rektor UMC',
      pimpinanUnivNip: 'NIDN. 0412057201',
      kepalaPusdatinNama: 'Dr. Kepala Baru PUSDATIN, M.Kom.',
      kepalaPusdatinNip: 'NIDN. 999888777',
      petugasDefaultNama: 'Petugas Aset Baru, S.Kom.',
      petugasDefaultJabatan: 'IT Support & Helpdesk Specialist'
    });
    const savedSig = AppDatabase.getDocumentSignatories();
    assert.strictEqual(savedSig.kepalaPusdatinNama, 'Dr. Kepala Baru PUSDATIN, M.Kom.');
    assert.strictEqual(savedSig.petugasDefaultNama, 'Petugas Aset Baru, S.Kom.');

    // Sync from Master Users restores ACT-01 & ACT-02 names
    const synced = AppDatabase.syncSignatoriesFromMasterUsers();
    const act01 = AppDatabase.getUsers().find(u => u.role === 'ACT-01');
    const act02 = AppDatabase.getUsers().find(u => u.role === 'ACT-02');
    assert.strictEqual(synced.pimpinanUnivNama, act01?.nama);
    assert.strictEqual(synced.kepalaPusdatinNama, act02?.nama);

    // Generate BAST PDF and inspect generated stream for black text color on signatures
    const doc = PdfReportService.generateBukuPenerimaanBastPdf({
      idPenerimaan: 'RCV-TEST-BLK',
      tanggalPenerimaan: '2026-11-12',
      dari: 'PT Penyedia Uji',
      nomorFaktur: 'INV-BLK-01',
      tanggalFaktur: '2026-11-12',
      namaAset: 'Server Rak Uji',
      kategori: 'Server & Infrastruktur',
      banyaknya: 1,
      hargaSatuan: 15000000,
      jumlahHarga: 15000000,
      nomorBeritaAcara: 'BAST-BLK-01',
      tanggalBeritaAcara: '2026-11-12',
      keterangan: 'Pengujian warna teks tanda tangan hitam',
      petugas: 'Petugas Penerima Uji'
    });

    const pdfRaw = doc.output('datauristring');
    assert.ok(pdfRaw.startsWith('data:application/pdf'));

    // Inspect internal jsPDF page stream for black text commands (0 g / 0 0 0 rg) around signature labels
    const pageStream = ((doc as any).internal.pages[1] || []).join('\n');
    const sigIdx = pageStream.indexOf('Pihak Penyedia');
    assert.ok(sigIdx > -1, 'BAST signature section must exist in PDF stream');
    const sigSnippet = pageStream.slice(Math.max(0, sigIdx - 120), sigIdx + 600);
    assert.ok(
      /0\.?0*\s+g|0\s+0\s+0\s+rg/.test(sigSnippet),
      'Signature text must set black color'
    );
    assert.strictEqual(sigSnippet.includes('0.855') || sigSnippet.includes('0.725'), false, 'Signature text must NOT use red color');
  });

  it('ITIL SLA 3a: RT clock stays Menunggu Tahap 2 on new ticket until Admin processes Stage 2 with Urgensi', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    AppDatabase.setSlaConfig(DEFAULT_SLA_CONFIG);

    const t0 = new Date('2026-11-16T08:00:00.000Z').getTime();
    const tPlus1h = t0 + 1 * 3600000;
    const tPlus3h = t0 + 3 * 3600000;

    const ticket = AppDatabase.addDamageTicket({
      kodeUnikAset: 'AST-SLA-3A',
      barcode: '88001122',
      namaBarang: 'Router Core Lab',
      pelapor: 'Dosen Jaringan',
      kontakPelapor: '0812000111',
      lokasi: 'Lab Jaringan',
      kategoriMasalah: 'Jaringan & Internet',
      prioritas: 'Sedang',
      deskripsi: 'Router lambat di jam sibuk',
      customNowMs: t0
    });

    assert.strictEqual(ticket.slaDeadline, 'Menunggu Tahap 2');
    const evalBeforeStage2 = computeSlaEvaluation(ticket, DEFAULT_SLA_CONFIG, tPlus1h);
    assert.strictEqual(evalBeforeStage2.isRtStarted, false);
    assert.strictEqual(evalBeforeStage2.rtStatus, 'Menunggu Tahap 2');
    assert.strictEqual(evalBeforeStage2.rtElapsedHours, 0);

    // Admin memproses Tahap 2 pada t0 + 1 jam dan menetapkan urgensi Kritis (target RT 4 jam)
    const stage2Res = AppDatabase.processDamageTicket(ticket.id, 'verifikasi-delegasi', {
      urgensiBaru: 'Kritis',
      targetTechnicianId: 'USR-ACT-04',
      catatan: 'Tahap 2 diverifikasi dengan urgensi Kritis',
      customNowMs: tPlus1h
    });
    assert.strictEqual(stage2Res.success, true);
    assert.ok(stage2Res.ticket?.slaStartedAtIso);
    assert.strictEqual(stage2Res.ticket?.urgensi, 'Kritis');
    assert.strictEqual(stage2Res.ticket?.rtTargetHours, 4);

    // Evaluasi pada t0 + 3 jam -> RT berjalan = 2 jam (bukan 3 jam dari createdAtIso)
    const evalAfterStage2 = computeSlaEvaluation(stage2Res.ticket!, DEFAULT_SLA_CONFIG, tPlus3h);
    assert.strictEqual(evalAfterStage2.isRtStarted, true);
    assert.strictEqual(Math.round(evalAfterStage2.rtElapsedHours * 10) / 10, 2);
    assert.strictEqual(evalAfterStage2.rtStatus, 'Dalam Batas');
  });

  it('ITIL SLA 3b & 3c: Stage 4.a Spare Parts and Stage 4.b Vendor Eksternal pause RT SLA and resume cleanly at Stage 5', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const t0 = new Date('2026-11-17T08:00:00.000Z').getTime();
    const tAssign = t0 + 15 * 60000; // +15m
    const tPauseParts = tAssign + 1 * 3600000; // +1h kerja
    const tResumeParts = tPauseParts + 10 * 3600000; // 10h terjeda suku cadang
    const tPauseVendor = tResumeParts + 1 * 3600000; // +1h kerja
    const tResumeVendor = tPauseVendor + 6 * 3600000; // 6h terjeda vendor eksternal
    const tResolve = tResumeVendor + 1 * 3600000; // +1h kerja (total kerja = 3h <= 4h)

    const ticket = AppDatabase.addDamageTicket({
      kodeUnikAset: 'AST-SLA-PAUSE',
      barcode: '88003344',
      namaBarang: 'Switch Distribusi',
      pelapor: 'Staff NOC',
      kontakPelapor: '0812000222',
      lokasi: 'Gedung Rektorat',
      kategoriMasalah: 'Jaringan & Internet',
      prioritas: 'Kritis',
      deskripsi: 'Port SFP & link ISP bermasalah',
      customNowMs: t0
    });

    AppDatabase.processDamageTicket(ticket.id, 'verifikasi-delegasi', {
      urgensiBaru: 'Kritis',
      targetTechnicianId: 'USR-ACT-04',
      customNowMs: tAssign
    });

    // 3b: Tahap 4.a (Menunggu Suku Cadang)
    const pausedParts = AppDatabase.processDamageTicket(ticket.id, 'butuh-suku-cadang', {
      namaSukuCadang: 'Transceiver SFP+ 10G',
      customNowMs: tPauseParts
    });
    assert.strictEqual(pausedParts.success, true);
    assert.strictEqual(pausedParts.ticket?.status, 'Pending – Menunggu Suku Cadang');
    const evalWhilePaused = computeSlaEvaluation(pausedParts.ticket!, DEFAULT_SLA_CONFIG, tPauseParts + 5 * 3600000);
    assert.strictEqual(evalWhilePaused.isPaused, true);
    assert.strictEqual(evalWhilePaused.rtStatus, 'Terjeda (Paused)');

    // Tahap 5: Resume
    const resumed1 = AppDatabase.processDamageTicket(ticket.id, 'lanjut-perbaikan', {
      catatan: 'SFP+ terpasang, lanjut cek uplink ISP',
      customNowMs: tResumeParts
    });
    assert.strictEqual(resumed1.success, true);
    assert.strictEqual(resumed1.ticket?.status, 'In Progress');

    // 3c: Tahap 4.b Vendor Eksternal
    const pausedVendor = AppDatabase.processDamageTicket(ticket.id, 'vendor-eksternal', {
      vendorEksternalNama: 'PT Telkom Indonesia (Astinet)',
      vendorEksternalTiket: 'ISP-INC-99881',
      customNowMs: tPauseVendor
    });
    assert.strictEqual(pausedVendor.success, true);
    assert.strictEqual(pausedVendor.ticket?.status, 'Pending – Menunggu Vendor Eksternal');
    assert.strictEqual(pausedVendor.ticket?.vendorEksternalNama, 'PT Telkom Indonesia (Astinet)');
    assert.strictEqual(pausedVendor.ticket?.vendorEksternalTiket, 'ISP-INC-99881');
    const evalVendorPaused = computeSlaEvaluation(pausedVendor.ticket!, DEFAULT_SLA_CONFIG, tPauseVendor + 3 * 3600000);
    assert.strictEqual(evalVendorPaused.rtStatus, 'Terjeda (Paused)');

    // Tahap 5: Resume lalu selesai
    AppDatabase.processDamageTicket(ticket.id, 'lanjut-perbaikan', {
      catatan: 'ISP pulih',
      customNowMs: tResumeVendor
    });
    const resolved = AppDatabase.processDamageTicket(ticket.id, 'selesai-perbaikan', {
      resolusiAkhir: 'Link normal dan stabil',
      customNowMs: tResolve
    });
    assert.strictEqual(resolved.success, true);

    const finalEval = computeSlaEvaluation(resolved.ticket!, DEFAULT_SLA_CONFIG, tResolve);
    assert.strictEqual(finalEval.pausedTotalMinutes, (10 + 6) * 60);
    assert.strictEqual(Math.round(finalEval.rtElapsedHours * 10) / 10, 3);
    assert.strictEqual(finalEval.rtStatus, 'Memenuhi SLA');
  });

  it('ITIL SLA 3d: Escalating Incident via Workaround closes Incident cleanly and creates Problem/RFC ticket with multi-week SLA', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const t0 = new Date('2026-11-18T08:00:00.000Z').getTime();

    const incident = AppDatabase.addDamageTicket({
      kodeUnikAset: 'AST-SIAKAD-01',
      barcode: '88005566',
      namaBarang: 'Modul KRS SIAKAD',
      pelapor: 'Biro Akademik',
      kontakPelapor: '0812000333',
      lokasi: 'Cloud Server UMC',
      kategoriMasalah: 'Software',
      prioritas: 'Kritis',
      deskripsi: 'Deadlock query saat input KRS massal, perlu refactor modul database',
      customNowMs: t0
    });

    AppDatabase.processDamageTicket(incident.id, 'verifikasi-delegasi', {
      urgensiBaru: 'Kritis',
      targetTechnicianId: 'USR-ACT-06',
      customNowMs: t0 + 10 * 60000
    });

    const escRes = AppDatabase.processDamageTicket(incident.id, 'eskalasi-problem-rfc', {
      targetTicketType: 'Problem',
      workaround: 'Aktivasi antrean batch KRS per fakultas agar mahasiswa tetap bisa isi KRS.',
      problemJudul: '[Problem] Refactor Concurrency Modul KRS SIAKAD',
      problemTargetHours: 336, // 14 hari
      customNowMs: t0 + 60 * 60000
    });

    assert.strictEqual(escRes.success, true);
    assert.strictEqual(escRes.ticket?.status, 'Resolved');
    assert.ok(escRes.ticket?.workaround?.includes('antrean batch'));
    assert.ok(escRes.createdProblemTicket);
    assert.ok(escRes.createdProblemTicket?.id.startsWith('PRB-'));
    assert.strictEqual(escRes.createdProblemTicket?.ticketType, 'Problem');
    assert.strictEqual(escRes.createdProblemTicket?.linkedParentTicketId, incident.id);
    assert.strictEqual(escRes.createdProblemTicket?.rtTargetHours, 336);
    assert.strictEqual(escRes.ticket?.linkedProblemTicketId, escRes.createdProblemTicket?.id);
  });

  it('ITIL SLA 3d-approval: Technician Problem escalation waits for Atasan/Admin approval, blocks self-approval, supports reject & approve', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const t0 = new Date('2026-11-18T08:00:00.000Z').getTime();

    const incident = AppDatabase.addDamageTicket({
      kodeUnikAset: 'AST-SIAKAD-02',
      barcode: '88005577',
      namaBarang: 'Portal Nilai Akademik',
      pelapor: 'BAAK UMC',
      kontakPelapor: '0812000334',
      lokasi: 'Cloud Server UMC',
      kategoriMasalah: 'Software',
      prioritas: 'Kritis',
      deskripsi: 'Deadlock transaksi database saat input nilai serentak',
      customNowMs: t0
    });

    AppDatabase.processDamageTicket(incident.id, 'verifikasi-delegasi', {
      urgensiBaru: 'Kritis',
      targetTechnicianId: 'USR-ACT-06',
      customNowMs: t0 + 10 * 60000
    });

    // 1. Teknisi (USR-ACT-06) mengajukan eskalasi ke Problem Ticket -> Menunggu Approval & SLA terjeda
    AppDatabase.setActiveUser('USR-ACT-06');
    const techReq = AppDatabase.processDamageTicket(incident.id, 'eskalasi-problem-rfc', {
      targetTicketType: 'Problem',
      workaround: 'Sementara input nilai dilakukan bertahap per prodi',
      problemJudul: '[Problem] Perbaikan Deadlock Database Portal Nilai',
      problemTargetHours: 336,
      catatan: 'Butuh optimasi query index & locking transaksi',
      customNowMs: t0 + 40 * 60000
    });

    assert.strictEqual(techReq.success, true);
    assert.strictEqual(techReq.ticket?.problemApprovalStatus, 'Menunggu Approval');
    assert.ok(techReq.ticket?.slaPausedAtIso);
    assert.notStrictEqual(techReq.ticket?.status, 'Resolved');
    assert.strictEqual(techReq.createdProblemTicket, undefined);

    // 2. Teknisi dilarang menyetujui atau menolak pengajuannya sendiri
    const selfApprove = AppDatabase.processDamageTicket(incident.id, 'approve-problem-escalation', {
      customNowMs: t0 + 50 * 60000
    });
    assert.strictEqual(selfApprove.success, false);
    assert.ok(selfApprove.message.includes('Atasan'));

    const selfReject = AppDatabase.processDamageTicket(incident.id, 'reject-problem-escalation', {
      customNowMs: t0 + 55 * 60000
    });
    assert.strictEqual(selfReject.success, false);

    // 3. Atasan (ACT-02) menolak pengajuan -> Insiden kembali In Progress & SLA aktif lagi
    AppDatabase.setActiveUser('USR-ACT-02');
    const rejected = AppDatabase.processDamageTicket(incident.id, 'reject-problem-escalation', {
      catatanAdmin: 'Coba restart connection pool dulu sebelum buat Problem Ticket',
      customNowMs: t0 + 70 * 60000
    });
    assert.strictEqual(rejected.success, true);
    assert.strictEqual(rejected.ticket?.problemApprovalStatus, 'Ditolak');
    assert.strictEqual(rejected.ticket?.status, 'In Progress');
    assert.strictEqual(rejected.ticket?.slaPausedAtIso, undefined);

    // 4. Teknisi mengajukan ulang lalu disetujui oleh Atasan (ACT-02) -> Insiden Resolved & PRB terbit
    AppDatabase.setActiveUser('USR-ACT-06');
    const reRequest = AppDatabase.processDamageTicket(incident.id, 'eskalasi-problem-rfc', {
      targetTicketType: 'Problem',
      workaround: 'Antrean upload nilai per fakultas diaktifkan',
      problemJudul: '[Problem] Refactor Locking Portal Nilai',
      problemTargetHours: 336,
      catatan: 'Connection pool sudah direstart tetapi deadlock tetap berulang',
      customNowMs: t0 + 90 * 60000
    });
    assert.strictEqual(reRequest.ticket?.problemApprovalStatus, 'Menunggu Approval');

    AppDatabase.setActiveUser('USR-ACT-02');
    const approved = AppDatabase.processDamageTicket(incident.id, 'approve-problem-escalation', {
      catatanAdmin: 'Disetujui Kepala PUSDATIN untuk refactor kuartal ini',
      customNowMs: t0 + 120 * 60000
    });
    assert.strictEqual(approved.success, true);
    assert.strictEqual(approved.ticket?.status, 'Resolved');
    assert.strictEqual(approved.ticket?.problemApprovalStatus, 'Disetujui');
    assert.ok(approved.ticket?.problemApprovedBy);
    assert.ok(approved.createdProblemTicket?.id.startsWith('PRB-'));
    assert.strictEqual(approved.createdProblemTicket?.linkedParentTicketId, incident.id);
    assert.strictEqual(approved.createdProblemTicket?.rtTargetHours, 336);
  });

  it('ITIL SLA 3e: Need More Info halts RT SLA, resumes on user reply, and auto-closes as Closed – Auto after 3x24 hours', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const t0 = new Date('2026-11-19T09:00:00.000Z').getTime();

    // Kasus 1: Pelapor membalas sebelum 72 jam
    const t1 = AppDatabase.addDamageTicket({
      kodeUnikAset: 'AST-INFO-1',
      barcode: '88007711',
      namaBarang: 'Aplikasi Presensi',
      pelapor: 'Karyawan Uji',
      kontakPelapor: '0812000444',
      lokasi: 'Kampus 1',
      kategoriMasalah: 'Software',
      prioritas: 'Sedang',
      deskripsi: 'Error tidak jelas tanpa screenshot',
      customNowMs: t0
    });

    const needInfoRes = AppDatabase.processDamageTicket(t1.id, 'need-info', {
      catatan: 'Mohon lampirkan screenshot error code & waktu kejadian',
      customNowMs: t0 + 20 * 60000
    });
    assert.strictEqual(needInfoRes.success, true);
    assert.strictEqual(needInfoRes.ticket?.status, 'Need More Info');

    // SLA RT belum berjalan selama status Need More Info
    const evalWaiting = computeSlaEvaluation(needInfoRes.ticket!, DEFAULT_SLA_CONFIG, t0 + 30 * 3600000);
    assert.strictEqual(evalWaiting.isRtStarted, false);
    assert.strictEqual(evalWaiting.rtElapsedHours, 0);

    // Pelapor (ACT-10 Civitas) membalas pada +24 jam -> kembali siap diproses
    AppDatabase.setActiveUser('USR-ACT-10C');
    const replied = AppDatabase.processDamageTicket(t1.id, 'reply-need-info', {
      catatan: 'Berikut screenshot error HTTP 502 pukul 08:45',
      customNowMs: t0 + 24 * 3600000
    });
    assert.strictEqual(replied.success, true);
    assert.strictEqual(replied.ticket?.status, 'Open/Unassigned');
    AppDatabase.setActiveUser('USR-ACT-03');

    // Kasus 2: Pelapor tidak membalas melewati 3x24 jam (72 jam) -> Auto-Close sistem
    const t2 = AppDatabase.addDamageTicket({
      kodeUnikAset: 'AST-INFO-2',
      barcode: '88007722',
      namaBarang: 'Printer Akademik',
      pelapor: 'Pelapor Pasif',
      kontakPelapor: '0812000555',
      lokasi: 'BAAK',
      kategoriMasalah: 'Hardware',
      prioritas: 'Rendah',
      deskripsi: 'Hasil cetak buram',
      customNowMs: t0
    });

    AppDatabase.processDamageTicket(t2.id, 'need-info', {
      catatan: 'Sebutkan nomor ruangan & barcode printer',
      customNowMs: t0 + 30 * 60000
    });

    // Cek sebelum 72 jam: masih Need More Info
    const before72h = AppDatabase.getDamageTickets(t0 + 70 * 3600000).find(x => x.id === t2.id);
    assert.strictEqual(before72h?.status, 'Need More Info');

    // Cek setelah 72+ jam: otomatis Closed – Auto oleh sistem
    const after73h = AppDatabase.getDamageTickets(t0 + 73 * 3600000).find(x => x.id === t2.id);
    assert.strictEqual(after73h?.status, 'Closed – Auto');
    assert.strictEqual(after73h?.closedBySystem, true);
  });

  it('ITIL SLA 3f: Pelapor can Re-open Resolved ticket within 1x24 hours and is blocked after 24 hours', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const t0 = new Date('2026-11-20T08:00:00.000Z').getTime();
    const tResolved = t0 + 2 * 3600000;

    const ticket = AppDatabase.addDamageTicket({
      kodeUnikAset: 'AST-REOPEN-1',
      barcode: '88009900',
      namaBarang: 'Proyektor Aula',
      pelapor: 'Dosen Pengajar',
      kontakPelapor: '0812000666',
      lokasi: 'Aula Utama',
      kategoriMasalah: 'Hardware',
      prioritas: 'Tinggi',
      deskripsi: 'Tampilan HDMI berkedip',
      customNowMs: t0
    });

    AppDatabase.processDamageTicket(ticket.id, 'verifikasi-delegasi', {
      urgensiBaru: 'Tinggi',
      customNowMs: t0 + 15 * 60000
    });

    const resolvedRes = AppDatabase.processDamageTicket(ticket.id, 'selesai-perbaikan', {
      resolusiAkhir: 'Kabel HDMI diganti baru',
      customNowMs: tResolved
    });
    assert.strictEqual(resolvedRes.ticket?.status, 'Resolved');

    // Pelapor (ACT-10 Civitas) melewati 24 jam (misal +25 jam dari tResolved) -> ditolak untuk Re-open
    AppDatabase.setActiveUser('USR-ACT-10C');
    const lateReopen = AppDatabase.processDamageTicket(ticket.id, 're-open', {
      catatan: 'Masih error setelah 25 jam',
      customNowMs: tResolved + 25 * 3600000
    });
    assert.strictEqual(lateReopen.success, false);
    assert.ok(lateReopen.message.includes('1x24 jam'));

    // Dalam jendela 1x24 jam (+12 jam dari tResolved) -> berhasil Re-opened
    const timelyReopen = AppDatabase.processDamageTicket(ticket.id, 're-open', {
      catatan: 'Masih error, belum bisa digunakan!',
      customNowMs: tResolved + 12 * 3600000
    });
    assert.strictEqual(timelyReopen.success, true);
    assert.strictEqual(timelyReopen.ticket?.status, 'Re-opened');
    assert.strictEqual(timelyReopen.ticket?.reopenCount, 1);
    assert.strictEqual(timelyReopen.ticket?.reopenReason, 'Masih error, belum bisa digunakan!');
  });

  it('Improvement 1: SystemProposal persists uploaded attachment file metadata and base64 data URL', () => {
    AppDatabase.setActiveUser('USR-ACT-10A');
    const proposal = AppDatabase.addSystemProposal({
      namaSistem: 'Sistem Pelaporan Penelitian Dosen',
      pemohon: 'Dr. Hendra Wijaya',
      unitKerja: 'LPPM UMC',
      nidnNik: '0419087502',
      kontakWhatsapp: '0812999888',
      email: 'hendra.dosen@umc.ac.id',
      deskripsiKebutuhan: 'Upload proposal PDF & review multi-tahap',
      latarBelakang: 'Digitalisasi pengajuan hibah penelitian internal',
      targetPengguna: 'Dosen dan LPPM UMC',
      dokumenTeknis: [
        {
          namaDokumen: 'TOR_Penelitian_UMC.pdf',
          tipe: 'TOR',
          urlOrFilename: 'TOR_Penelitian_UMC.pdf',
          tanggalUpload: '2026-11-13',
          fileDataUrl: 'data:application/pdf;base64,JVBERi0xLjQK',
          fileSize: 2048,
          mimeType: 'application/pdf'
        }
      ]
    });

    assert.ok(proposal.id.startsWith('SYS-'));
    const fetched = AppDatabase.getSystemProposals().find(p => p.id === proposal.id);
    assert.ok(fetched);
    assert.strictEqual(fetched?.dokumenTeknis?.length, 1);
    assert.strictEqual(fetched?.dokumenTeknis?.[0].namaDokumen, 'TOR_Penelitian_UMC.pdf');
    assert.strictEqual(fetched?.dokumenTeknis?.[0].fileDataUrl, 'data:application/pdf;base64,JVBERi0xLjQK');
    assert.strictEqual(fetched?.dokumenTeknis?.[0].fileSize, 2048);
  });

  it('Improvement 3: PdfReportService.generateBukuPengeluaranMonthlyPdf produces valid PDF document with monthly rows', () => {
    const sampleItems = AppDatabase.getBukuPengeluaran();
    const doc = PdfReportService.generateBukuPengeluaranMonthlyPdf(sampleItems, '2026-11', {
      title: 'Laporan Rekapitulasi Buku Pengeluaran Aset TI UMC',
      kepalaPusdatin: 'Dr. Ir. H. Ahmad Dahlan, M.T.',
      nipKepala: 'NIDN. 0418077501',
      petugas: 'Aditiya Ahmad Fadila, S.Kom.'
    });

    const dataUri = doc.output('datauristring');
    assert.ok(dataUri.startsWith('data:application/pdf'));
    const pageStream = ((doc as any).internal.pages[1] || []).join('\n');
    assert.ok(pageStream.includes('REKAPITULASI BUKU PENGELUARAN ASET TI'));
  });

  it('Improvement 4: AppDatabase.addAsset creates unique collision-free assets reflected in getAssets()', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const beforeCount = AppDatabase.getAssets().length;

    const a1 = AppDatabase.addAsset({
      barcode: '',
      kodeUnikAset: '',
      nama: 'Access Point Aruba Instant On AP22',
      kategori: 'Jaringan & Internet',
      jenisAset: 'Fisik',
      merekModel: 'Aruba AP22',
      nomorSeri: 'SN-ARUBA-001',
      status: 'Tersedia',
      lokasi: 'Gedung Rektorat Lt.2',
      tanggalMasuk: '2026-11-13'
    });

    const a2 = AppDatabase.addAsset({
      barcode: '',
      kodeUnikAset: '',
      nama: 'Access Point Aruba Instant On AP22',
      kategori: 'Jaringan & Internet',
      jenisAset: 'Fisik',
      merekModel: 'Aruba AP22',
      nomorSeri: 'SN-ARUBA-002',
      status: 'Tersedia',
      lokasi: 'Gedung Rektorat Lt.2',
      tanggalMasuk: '2026-11-13'
    });

    assert.notStrictEqual(a1.barcode, a2.barcode);
    assert.notStrictEqual(a1.kodeUnikAset, a2.kodeUnikAset);
    assert.strictEqual(a1.barcode.length, 8);
    assert.strictEqual(a2.barcode.length, 8);
    assert.strictEqual(AppDatabase.getAssets().length, beforeCount + 2);
  });
});
