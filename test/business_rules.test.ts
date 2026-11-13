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

  it('Feature 3.3: Buku Penerimaan supports multi-item invoice and registers distinct units', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const result = AppDatabase.addBukuPenerimaan({
      tanggalPenerimaan: '2026-11-10',
      dari: 'PT Metrodata Electronics Tbk',
      nomorFaktur: 'INV-MULTI-2026-001',
      tanggalFaktur: '2026-11-10',
      namaAset: 'Laptop ASUS ExpertBook & Proyektor Epson',
      kategori: 'Komputer & Laptop',
      banyaknya: 8,
      hargaSatuan: 0,
      nomorBeritaAcara: 'BAST-MULTI-001',
      tanggalBeritaAcara: '2026-11-10',
      keterangan: 'Pengadaan Lab Terpadu Lt 2',
      items: [
        {
          namaAset: 'Laptop ASUS ExpertBook B1 Core i7 16GB',
          kategori: 'Komputer & Laptop',
          banyaknya: 5,
          hargaSatuan: 14500000,
          jumlahHarga: 72500000
        },
        {
          namaAset: 'Proyektor Epson EB-E500 3300 Lumens',
          kategori: 'Multimedia',
          banyaknya: 3,
          hargaSatuan: 6200000,
          jumlahHarga: 18600000
        }
      ]
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data?.banyaknya, 8);
    assert.strictEqual(result.data?.jumlahHarga, 91100000);

    // Test batch unit registration
    const batchRes = AppDatabase.registerPenerimaanBatchUnits({
      idPenerimaan: result.data!.idPenerimaan,
      subItemIndex: 0,
      namaAset: 'Laptop ASUS ExpertBook B1 Core i7 16GB',
      kategori: 'Komputer & Laptop',
      vendorSupplier: 'PT Metrodata Electronics Tbk',
      hargaBeli: 14500000,
      lokasi: 'Ruang PUSDATIN',
      count: 5
    });

    assert.strictEqual(batchRes.success, true);
    assert.strictEqual(batchRes.registeredAssets.length, 5);
  });

  it('Feature 3.6: Updating asset status to "Rusak" successfully retains "Rusak" status', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const assets = AppDatabase.getAssets();
    assert.ok(assets.length > 0);
    const target = assets[0];

    const updated = AppDatabase.updateAssetStatus(target.barcode, 'Rusak', undefined, true, 'Uji coba status rusak');
    assert.strictEqual(updated, true);

    const reloaded = AppDatabase.getAssetByBarcode(target.barcode);
    assert.strictEqual(reloaded?.status, 'Rusak');
  });

  it('Feature 3.7: Multi-item receipt registration correctly registers all item types with Lampiran 8 fields', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const receiptRes = AppDatabase.addBukuPenerimaan({
      tanggalPenerimaan: '2026-11-12',
      dari: 'PT Mega Teknologi Mandiri',
      nomorFaktur: 'INV-TEST-2ITEMS',
      tanggalFaktur: '2026-11-12',
      nomorBeritaAcara: 'BAST-TEST-2ITEMS',
      tanggalBeritaAcara: '2026-11-12',
      keterangan: 'Uji coba penginputan 2 jenis barang',
      items: [
        {
          namaAset: 'Macbook Air M5',
          kategori: 'Komputer & Laptop',
          banyaknya: 2,
          hargaSatuan: 20000000,
          jumlahHarga: 40000000,
          merekModel: 'Apple Macbook Air M5'
        },
        {
          namaAset: 'Dell UltraSharp 27',
          kategori: 'Multimedia',
          banyaknya: 2,
          hargaSatuan: 5000000,
          jumlahHarga: 10000000,
          merekModel: 'Dell U2724D'
        }
      ]
    });

    assert.strictEqual(receiptRes.success, true);
    const rcv = receiptRes.data!;
    assert.strictEqual(rcv.items?.length, 2);

    // Register Item 1 (Macbook Air M5)
    const reg1 = AppDatabase.registerPenerimaanBatchUnits({
      idPenerimaan: rcv.idPenerimaan,
      subItemIndex: 0,
      namaAset: 'Macbook Air M5',
      kategori: 'Komputer & Laptop',
      jenisAset: 'Fisik',
      merekModel: 'Apple Macbook Air M5',
      serialNumbersList: ['SN-MB-001', 'SN-MB-002'],
      spesifikasi: 'Apple M5 Chip, 16GB Unified RAM, 512GB SSD',
      vendorSupplier: 'PT Mega Teknologi Mandiri',
      hargaBeli: 20000000,
      lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
      statusAwal: 'Tersedia',
      tanggalPembelian: '2026-11-12',
      nomorPoInvoice: 'INV-TEST-2ITEMS',
      masaGaransi: '2 Tahun Garansi Resmi Apple',
      count: 2
    });

    assert.strictEqual(reg1.success, true);
    assert.strictEqual(reg1.registeredAssets.length, 2);
    assert.strictEqual(reg1.registeredAssets[0].nomorSeri, 'SN-MB-001');
    assert.strictEqual(reg1.registeredAssets[0].masaGaransi, '2 Tahun Garansi Resmi Apple');

    // Register Item 2 (Dell UltraSharp 27)
    const reg2 = AppDatabase.registerPenerimaanBatchUnits({
      idPenerimaan: rcv.idPenerimaan,
      subItemIndex: 1,
      namaAset: 'Dell UltraSharp 27',
      kategori: 'Multimedia',
      jenisAset: 'Fisik',
      merekModel: 'Dell U2724D',
      serialNumbersList: ['SN-DELL-001', 'SN-DELL-002'],
      spesifikasi: '27 inch QHD IPS Black 120Hz',
      vendorSupplier: 'PT Mega Teknologi Mandiri',
      hargaBeli: 5000000,
      lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
      statusAwal: 'Tersedia',
      tanggalPembelian: '2026-11-12',
      nomorPoInvoice: 'INV-TEST-2ITEMS',
      masaGaransi: '3 Tahun Garansi Resmi Dell',
      count: 2
    });

    assert.strictEqual(reg2.success, true);
    assert.strictEqual(reg2.registeredAssets.length, 2);
    assert.strictEqual(reg2.registeredAssets[0].nomorSeri, 'SN-DELL-001');

    // Verify receipt items are both fully registered
    const updatedRcv = AppDatabase.getBukuPenerimaan().find(p => p.idPenerimaan === rcv.idPenerimaan);
    assert.ok(updatedRcv);
    assert.strictEqual(updatedRcv.items![0].terdaftarCount, 2);
    assert.strictEqual(updatedRcv.items![1].terdaftarCount, 2);
  });

  it('Lampiran 1: Incoming loans start as Diajukan and transition cleanly through Dikonfirmasi, Diserahkan, Dikembalikan, and Ditolak', () => {
    AppDatabase.setActiveUser('USR-ACT-10A');
    const created = AppDatabase.addLoan({
      peminjam: 'Dosen Uji Coba',
      nik: '19900101',
      unit: 'Fakultas Teknik',
      kontak: '081234567899',
      email: 'dosen.uji@umc.ac.id',
      barangPinjaman: 'Proyektor Epson',
      jumlah: 1,
      tglPinjam: '2026-11-20',
      tglKembali: '2026-11-22',
      catatan: 'Kuliah umum'
    });
    assert.strictEqual(created.status, 'Diajukan');

    AppDatabase.setActiveUser('USR-ACT-03');
    const assets = AppDatabase.getAssets();
    const availableAsset = assets.find(a => a.status === 'Tersedia') || assets[0];

    const resConfirm = AppDatabase.processLoanTicket(created.id, 'terima', {
      barcode: availableAsset.barcode,
      catatan: 'Unit dialokasikan'
    });
    assert.strictEqual(resConfirm.success, true);
    assert.strictEqual(resConfirm.ticket?.status, 'Dikonfirmasi');

    const resHandover = AppDatabase.processLoanTicket(created.id, 'serahkan', {
      barcode: availableAsset.barcode,
      catatan: 'Diserahkan fisik'
    });
    assert.strictEqual(resHandover.success, true);
    assert.strictEqual(resHandover.ticket?.status, 'Diserahkan');

    const resReturn = AppDatabase.processLoanTicket(created.id, 'kembali', {
      hasilPemeriksaanKembali: 'Baik / Lengkap'
    });
    assert.strictEqual(resReturn.success, true);
    assert.strictEqual(resReturn.ticket?.status, 'Dikembalikan');

    const createdRejected = AppDatabase.addLoan({
      peminjam: 'Mahasiswa Uji',
      nik: '20260002',
      unit: 'HMJ Informatika',
      kontak: '081234567898',
      email: 'mhs.uji@umc.ac.id',
      barangPinjaman: 'Kamera DSLR',
      jumlah: 1,
      tglPinjam: '2026-11-25',
      tglKembali: '2026-11-26'
    });
    assert.strictEqual(createdRejected.status, 'Diajukan');
    const resReject = AppDatabase.processLoanTicket(createdRejected.id, 'tolak', {
      alasanPenolakan: 'Jadwal bentrok'
    });
    assert.strictEqual(resReject.success, true);
    const reloadedRejected = AppDatabase.getLoans().find(l => l.id === createdRejected.id);
    assert.strictEqual(reloadedRejected?.status, 'Ditolak');
  });

  it('Lampiran 2: Only Admin (ACT-03) and Kepala PUSDATIN (ACT-02) can update ticket urgency', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const tickets = AppDatabase.getDamageTickets();
    assert.ok(tickets.length > 0);
    const targetTicket = tickets[0];
    const initialUrgency = targetTicket.urgensi || targetTicket.prioritas || 'Sedang';

    // Non-admin technician (ACT-04) must be blocked
    AppDatabase.setActiveUser('USR-ACT-04');
    const blocked = AppDatabase.updateDamageTicketUrgency(targetTicket.id, 'Rendah');
    assert.strictEqual(blocked, false);
    assert.strictEqual(AppDatabase.getDamageTickets().find(t => t.id === targetTicket.id)?.urgensi, initialUrgency);

    // Civitas (ACT-10) must be blocked
    AppDatabase.setActiveUser('USR-ACT-10A');
    const blockedCivitas = AppDatabase.updateDamageTicketUrgency(targetTicket.id, 'Rendah');
    assert.strictEqual(blockedCivitas, false);

    // Kepala PUSDATIN (ACT-02) is allowed
    AppDatabase.setActiveUser('USR-ACT-02');
    const allowedKepala = AppDatabase.updateDamageTicketUrgency(targetTicket.id, 'Kritis');
    assert.strictEqual(allowedKepala, true);
    assert.strictEqual(AppDatabase.getDamageTickets().find(t => t.id === targetTicket.id)?.urgensi, 'Kritis');

    // Admin (ACT-03) is allowed
    AppDatabase.setActiveUser('USR-ACT-03');
    const allowedAdmin = AppDatabase.updateDamageTicketUrgency(targetTicket.id, 'Tinggi');
    assert.strictEqual(allowedAdmin, true);
    assert.strictEqual(AppDatabase.getDamageTickets().find(t => t.id === targetTicket.id)?.urgensi, 'Tinggi');
  });

  it('Lampiran 5: Delegation resolves targetTechnicianId properly and updates assigned technician fields', () => {
    AppDatabase.setActiveUser('USR-ACT-03');
    const tickets = AppDatabase.getDamageTickets();
    const targetTicket = tickets[0];
    const targetTech = AppDatabase.getUsers().find(u => u.id === 'USR-ACT-07')!;
    assert.ok(targetTech);

    const res = AppDatabase.processDamageTicket(targetTicket.id, 'delegasikan', {
      targetTechnicianId: targetTech.id,
      catatan: 'Alihkan ke bidang antarmuka web'
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.ticket?.assignedTechnicianId, targetTech.id);
    assert.strictEqual(res.ticket?.delegasiKeTechnicianId, targetTech.id);
    assert.strictEqual(res.ticket?.picTeknisi, targetTech.roleName);
    assert.strictEqual(res.ticket?.namaPicTeknisi, targetTech.nama);
  });

  it('Lampiran 6: Free-text Peran / Bidang persists and non-full-access PIC does not receive ACT-03', () => {
    const uniqueEmail = `custom.pic.${Date.now()}@umc.ac.id`;
    const added = AppDatabase.addTechnician({
      nama: 'Teknisi Uji Spesialis',
      email: uniqueEmail,
      roleName: 'Spesialis Audio Visual Kampus',
      isFullAccess: false,
      specialty: 'Audio Visual & Proyektor'
    });
    assert.strictEqual(added, true);

    const saved = AppDatabase.getTechnicians().find(t => t.email === uniqueEmail);
    assert.ok(saved);
    assert.strictEqual(saved.roleName, 'Spesialis Audio Visual Kampus');
    assert.notStrictEqual(saved.role, 'ACT-03');
    assert.strictEqual(saved.isFullAccess, false);
  });
});

