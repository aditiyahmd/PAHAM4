import { describe, it } from 'node:test';
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

describe('PAHAM Refinements Suite - SLA, SSO Domain & Registered Users, One-Step Loan, Signatories & Black BAST Font', () => {
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

  it('Refinement 7: validateRegisteredSsoLogin strictly enforces @umc.ac.id / @student.umc.ac.id domain, registration, and Aktif status', () => {
    const users = AppDatabase.getUsers();

    // Active institutional staff (@umc.ac.id)
    const adminRes = validateRegisteredSsoLogin('aditiya.it@umc.ac.id', users);
    assert.strictEqual(adminRes.ok, true);
    assert.strictEqual(adminRes.user?.role, 'ACT-03');

    // Active student (@student.umc.ac.id)
    const studentRes = validateRegisteredSsoLogin('m.rizki@student.umc.ac.id', users);
    assert.strictEqual(studentRes.ok, true);
    assert.strictEqual(studentRes.user?.civitasType, 'Mahasiswa');

    // Rejected non-UMC domain
    const gmailRes = validateRegisteredSsoLogin('budi@gmail.com', users);
    assert.strictEqual(gmailRes.ok, false);
    assert.ok(gmailRes.error?.includes('@umc.ac.id'));

    // Rejected unregistered @umc.ac.id domain
    const unregRes = validateRegisteredSsoLogin('tidak.terdaftar@umc.ac.id', users);
    assert.strictEqual(unregRes.ok, false);
    assert.ok(unregRes.error?.includes('belum terdaftar'));

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
});
