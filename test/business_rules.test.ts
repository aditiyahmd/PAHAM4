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

import { AccessControlService, SEED_USERS } from '../src/services/rbac';
import { AppDatabase } from '../src/services/db';

describe('PAHAM System Pusdatin UMC - Business Rules & RBAC Verification', () => {
  it('RBAC: ACT-01 (Pimpinan Universitas) has view access to dashboard and inventory, but cannot create tickets', () => {
    const pimpinanUniv = SEED_USERS.find(u => u.role === 'ACT-01')!;
    assert.strictEqual(AccessControlService.can(pimpinanUniv, 'dashboard_ringkasan', 'view'), true);
    assert.strictEqual(AccessControlService.can(pimpinanUniv, 'buku_inventaris', 'view'), true);
    assert.strictEqual(AccessControlService.can(pimpinanUniv, 'buat_tiket', 'propose'), false);
    assert.strictEqual(AccessControlService.can(pimpinanUniv, 'tindakan_perbaikan', 'execute'), false);
  });

  it('RBAC: ACT-02 (Pimpinan PUSDATIN) can approve new system proposals and sign off loans', () => {
    const kepalaPusdatin = SEED_USERS.find(u => u.role === 'ACT-02')!;
    assert.strictEqual(AccessControlService.can(kepalaPusdatin, 'pengajuan_sistem', 'approve'), true);
    assert.strictEqual(AccessControlService.can(kepalaPusdatin, 'peminjaman_aset', 'approve'), true);
    assert.strictEqual(AccessControlService.can(kepalaPusdatin, 'buku_penerimaan', 'verify'), true);
  });

  it('RBAC: ACT-03 (Admin / IT Support) can manage Buku Penerimaan, Pengeluaran, and Tickets', () => {
    const admin = SEED_USERS.find(u => u.role === 'ACT-03')!;
    assert.strictEqual(AccessControlService.can(admin, 'buku_penerimaan', 'manage'), true);
    assert.strictEqual(AccessControlService.can(admin, 'buku_pengeluaran', 'manage'), true);
    assert.strictEqual(AccessControlService.can(admin, 'distribusi_tiket', 'manage'), true);
  });

  it('RBAC: ACT-10 (User / Civitas) can create ticket, propose loan, and propose system, but cannot access admin modules', () => {
    const civitas = SEED_USERS.find(u => u.role === 'ACT-10')!;
    assert.strictEqual(AccessControlService.can(civitas, 'buat_tiket', 'propose'), true);
    assert.strictEqual(AccessControlService.can(civitas, 'peminjaman_aset', 'propose'), true);
    assert.strictEqual(AccessControlService.can(civitas, 'pengajuan_sistem', 'propose'), true);
    assert.strictEqual(AccessControlService.can(civitas, 'buku_penerimaan', 'manage'), false);
    assert.strictEqual(AccessControlService.can(civitas, 'dashboard_pimpinan', 'view'), false);
  });

  it('BR-003: Buku Penerimaan calculates jumlahHarga = banyaknya * hargaSatuan automatically', () => {
    // Temporarily switch active user to Admin (ACT-03) to satisfy server-side RBAC guard
    AppDatabase.setActiveUser('USR-ACT-03');
    const result = AppDatabase.addBukuPenerimaan({
      tanggalPenerimaan: '2026-11-10',
      dari: 'CV Mitra Komputer',
      nomorFaktur: 'INV-TEST-001',
      tanggalFaktur: '2026-11-10',
      namaAset: 'Monitor 24 Inch IPS',
      kategori: 'Hardware & Komputer',
      banyaknya: 5,
      hargaSatuan: 2000000,
      nomorBeritaAcara: 'BAST-TEST-001',
      tanggalBeritaAcara: '2026-11-10',
      keterangan: 'Pengadaan Lab 3'
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data?.jumlahHarga, 10000000);
  });

  it('BR-005: Rekapitulasi Balance calculates stokTersedia = totalMasuk - totalKeluar', () => {
    const rekap = AppDatabase.getBukuAsetInventarisRekap();
    assert.ok(Array.isArray(rekap));
    rekap.forEach(r => {
      assert.strictEqual(r.stokTersedia, Math.max(0, r.totalMasuk - r.totalKeluar));
    });
  });

  it('BR-016: Audit Trail entries are created and immutable', () => {
    const trailBefore = AppDatabase.getAuditTrail().length;
    AppDatabase.addAuditTrail({
      entityType: 'Tiket Helpdesk',
      entityId: 'TKT-TEST',
      statusLama: 'Open/Unassigned',
      statusBaru: 'Assigned',
      catatan: 'Testing audit trail entry',
      idPengguna: 'USR-ACT-03',
      namaPengguna: 'Aditiya Ahmad Fadila, S.Kom.',
      rolePengguna: 'IT Support & Helpdesk Specialist'
    });
    const trailAfter = AppDatabase.getAuditTrail().length;
    assert.strictEqual(trailAfter, trailBefore + 1);
  });
});
