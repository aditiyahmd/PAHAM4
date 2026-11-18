import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

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
import { EmailNotificationService } from '../src/services/emailService';
import { SEED_USERS } from '../src/services/rbac';
import {
  validateGoogleLogin,
  validatePasswordLogin,
  validateNewPasswordSetup
} from '../src/services/authValidation';
import {
  ServerAuthDatabase,
  hashPassword,
  verifyPasswordHash,
  type VerifiedGoogleIdentity
} from '../src/services/serverAuthDb';
import { createApp } from '../server';

describe('Clean Database Wipe & Dual Google/Password Auth Flow (Client + Server Hashed DB)', () => {
  let tempDir: string;

  beforeEach(() => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paham-auth-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('Fresh database initializes completely empty except single Admin without plaintext password in client bundle', () => {
    const users = AppDatabase.getUsers();
    assert.strictEqual(users.length, 1);
    assert.strictEqual(SEED_USERS.length, 1);
    assert.strictEqual(users[0].email, 'aditiya.ahmad@umc.ac.id');
    assert.strictEqual(users[0].password, undefined);
    assert.strictEqual(users[0].passwordSet, true);
    assert.strictEqual(users[0].role, 'ACT-03');
    assert.strictEqual(users[0].isFullAccess, true);

    assert.strictEqual(AppDatabase.getAssets().length, 0);
    assert.strictEqual(AppDatabase.getLoans().length, 0);
    assert.strictEqual(AppDatabase.getDamageTickets().length, 0);
    assert.strictEqual(AppDatabase.getLogs().length, 0);
    assert.strictEqual(AppDatabase.getBukuPenerimaan().length, 0);
    assert.strictEqual(AppDatabase.getBukuPengeluaran().length, 0);
    assert.strictEqual(AppDatabase.getSystemProposals().length, 0);
    assert.strictEqual(AppDatabase.getSurveys().length, 0);
    assert.strictEqual(AppDatabase.getAuditTrail().length, 0);
    assert.strictEqual(AppDatabase.getNotifications().length, 0);
    assert.strictEqual(EmailNotificationService.getLogs().length, 0);

    // Master dropdown taxonomies stay intact so forms remain immediately usable
    assert.ok(AppDatabase.getMasterLocations().length > 0);
    assert.ok(AppDatabase.getMasterCategories().length > 0);
  });

  it('One-time clean DB migration wipes pre-existing legacy data without wiping newly created data later', () => {
    globalThis.localStorage.setItem('pusdatin_assets_v4', JSON.stringify([{ barcode: '111', nama: 'Legacy Asset' }]));
    globalThis.localStorage.setItem('pusdatin_users_v4', JSON.stringify([{ id: 'OLD', email: 'old@umc.ac.id', role: 'ACT-10' }]));
    globalThis.localStorage.setItem('pusdatin_email_logs_v4', JSON.stringify([{ id: 'EML-OLD' }]));

    assert.strictEqual(AppDatabase.getAssets().length, 0);
    assert.strictEqual(AppDatabase.getUsers().length, 1);
    assert.strictEqual(AppDatabase.getUsers()[0].email, 'aditiya.ahmad@umc.ac.id');
    assert.strictEqual(EmailNotificationService.getLogs().length, 0);

    const created = AppDatabase.addAsset({
      barcode: '99887766',
      kodeUnikAset: 'AST-NEW-1',
      nama: 'Laptop Pengadaan Baru',
      kategori: 'Komputer & Laptop',
      jenisAset: 'Fisik',
      status: 'Tersedia',
      lokasi: 'Ruang PUSDATIN',
      tanggalMasuk: '2026-11-18'
    });
    assert.strictEqual(created.barcode, '99887766');
    assert.strictEqual(AppDatabase.getAssets().length, 1);
  });

  it('hashPassword uses unique random salt with scrypt and verifyPasswordHash enforces constant-time match', () => {
    const h1 = hashPassword('234448adit');
    const h2 = hashPassword('234448adit');
    assert.ok(h1.startsWith('scrypt$'));
    assert.notStrictEqual(h1, h2);
    assert.ok(!h1.includes('234448adit'));
    assert.strictEqual(verifyPasswordHash('234448adit', h1), true);
    assert.strictEqual(verifyPasswordHash('234448adit', h2), true);
    assert.strictEqual(verifyPasswordHash('wrong-pass', h1), false);
    assert.strictEqual(verifyPasswordHash('234448adit', 'malformed'), false);
  });

  it('ServerAuthDatabase bootstraps single Admin with hashed password (aditiya.ahmad@umc.ac.id / 234448adit) and never leaks passwordHash', () => {
    const dbPath = path.join(tempDir, 'auth-users.json');
    const authDb = new ServerAuthDatabase(dbPath);

    const raw = authDb.getRawUsersForTest();
    assert.strictEqual(raw.length, 1);
    assert.strictEqual(raw[0].email, 'aditiya.ahmad@umc.ac.id');
    assert.ok(raw[0].passwordHash?.startsWith('scrypt$'));

    const clientUsers = authDb.getAllUsersSanitized();
    assert.strictEqual(clientUsers.length, 1);
    assert.strictEqual('passwordHash' in clientUsers[0], false);
    assert.strictEqual(clientUsers[0].passwordSet, true);

    const okLogin = authDb.loginWithPassword('aditiya.ahmad@umc.ac.id', '234448adit');
    assert.strictEqual(okLogin.ok, true);
    assert.strictEqual(okLogin.status, 200);
    assert.strictEqual(okLogin.user?.role, 'ACT-03');
    assert.strictEqual('passwordHash' in (okLogin.user || {}), false);

    const badLogin = authDb.loginWithPassword('aditiya.ahmad@umc.ac.id', 'salah123');
    assert.strictEqual(badLogin.ok, false);
    assert.strictEqual(badLogin.status, 401);
  });

  it('HTTP /api/auth/* end-to-end: Google OAuth first-time -> Buat Password (hashed) -> repeat Google skips setup -> Email+Password login succeeds', async () => {
    const dbPath = path.join(tempDir, 'auth-users.json');
    const mockTokens: Record<string, VerifiedGoogleIdentity> = {
      'token-dosen-baru': {
        uid: 'google-uid-dosen-1',
        email: 'dosen.baru@umc.ac.id',
        displayName: 'Dosen Baru UMC',
        emailVerified: true
      },
      'token-mhs-baru': {
        uid: 'google-uid-mhs-1',
        email: '220511099@student.umc.ac.id',
        displayName: 'Mahasiswa UMC',
        emailVerified: true
      },
      'token-gmail-luar': {
        uid: 'google-uid-luar',
        email: 'orangluar@gmail.com',
        displayName: 'External Gmail',
        emailVerified: true
      },
      'token-admin': {
        uid: 'google-uid-admin',
        email: 'aditiya.ahmad@umc.ac.id',
        displayName: 'Aditiya Ahmad Fadila',
        emailVerified: true
      }
    };

    const authDb = new ServerAuthDatabase(dbPath, async idToken => {
      const match = mockTokens[idToken];
      if (!match) throw new Error('Invalid mock token');
      return match;
    });

    const app = createApp(authDb);
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', () => resolve()));
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 1. Admin logs in cleanly with Email + Password
      const adminPwdRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'aditiya.ahmad@umc.ac.id', password: '234448adit' })
      });
      assert.strictEqual(adminPwdRes.status, 200);
      const adminPwdJson = (await adminPwdRes.json()) as any;
      assert.strictEqual(adminPwdJson.ok, true);
      assert.strictEqual(adminPwdJson.user.role, 'ACT-03');
      assert.strictEqual(adminPwdJson.user.passwordHash, undefined);

      // 2. Admin can also sign in with Google immediately without Buat Password prompt
      const adminGoogleRes = await fetch(`${baseUrl}/api/auth/google-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'token-admin' })
      });
      assert.strictEqual(adminGoogleRes.status, 200);
      const adminGoogleJson = (await adminGoogleRes.json()) as any;
      assert.strictEqual(adminGoogleJson.ok, true);
      assert.strictEqual(adminGoogleJson.requiresPasswordSetup, false);

      // 3. Before Google sign-in, dosen.baru@umc.ac.id cannot use Email + Password
      const prePwdRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dosen.baru@umc.ac.id', password: 'PasswordKuat99' })
      });
      assert.strictEqual(prePwdRes.status, 401);
      const prePwdJson = (await prePwdRes.json()) as any;
      assert.ok(prePwdJson.error.includes('Masuk dengan Google'));

      // 4. External @gmail.com rejected via Google OAuth & Password endpoints
      const gmailGoogleRes = await fetch(`${baseUrl}/api/auth/google-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'token-gmail-luar' })
      });
      assert.strictEqual(gmailGoogleRes.status, 403);

      const gmailPwdRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'orangluar@gmail.com', password: 'Password123' })
      });
      assert.strictEqual(gmailPwdRes.status, 403);

      // 5. First-time Google OAuth for dosen.baru@umc.ac.id returns requiresPasswordSetup: true
      const firstGoogleRes = await fetch(`${baseUrl}/api/auth/google-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'token-dosen-baru' })
      });
      assert.strictEqual(firstGoogleRes.status, 200);
      const firstGoogleJson = (await firstGoogleRes.json()) as any;
      assert.strictEqual(firstGoogleJson.ok, true);
      assert.strictEqual(firstGoogleJson.isNewUser, true);
      assert.strictEqual(firstGoogleJson.requiresPasswordSetup, true);
      assert.strictEqual(firstGoogleJson.user.civitasType, 'Dosen');

      // 6. Submitting mismatched/short password on /api/auth/setup-password is rejected
      const badSetupRes = await fetch(`${baseUrl}/api/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: 'token-dosen-baru',
          password: '123',
          confirmPassword: '123'
        })
      });
      assert.strictEqual(badSetupRes.status, 400);

      // 7. Valid password creation hashes password and links to verified Google email & UID
      const setupRes = await fetch(`${baseUrl}/api/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: 'token-dosen-baru',
          password: 'PasswordDosen#2026',
          confirmPassword: 'PasswordDosen#2026'
        })
      });
      assert.strictEqual(setupRes.status, 201);
      const setupJson = (await setupRes.json()) as any;
      assert.strictEqual(setupJson.ok, true);
      assert.strictEqual(setupJson.user.email, 'dosen.baru@umc.ac.id');
      assert.strictEqual(setupJson.user.googleUid, 'google-uid-dosen-1');
      assert.strictEqual(setupJson.user.passwordSet, true);
      assert.strictEqual(setupJson.user.passwordHash, undefined);

      // Verify raw persisted DB file contains salted scrypt hash (NOT plaintext)
      const persistedRaw = fs.readFileSync(dbPath, 'utf8');
      assert.ok(!persistedRaw.includes('PasswordDosen#2026'));
      assert.ok(persistedRaw.includes('scrypt$'));

      // 8. Second Google login skips Buat Password (requiresPasswordSetup: false)
      const secondGoogleRes = await fetch(`${baseUrl}/api/auth/google-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'token-dosen-baru' })
      });
      assert.strictEqual(secondGoogleRes.status, 200);
      const secondGoogleJson = (await secondGoogleRes.json()) as any;
      assert.strictEqual(secondGoogleJson.ok, true);
      assert.strictEqual(secondGoogleJson.isNewUser, false);
      assert.strictEqual(secondGoogleJson.requiresPasswordSetup, false);

      // 9. Subsequent Email + Password login succeeds with the created password & rejects wrong password
      const wrongPwdRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dosen.baru@umc.ac.id', password: 'WrongPassword' })
      });
      assert.strictEqual(wrongPwdRes.status, 401);

      const secondPwdRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dosen.baru@umc.ac.id', password: 'PasswordDosen#2026' })
      });
      assert.strictEqual(secondPwdRes.status, 200);
      const secondPwdJson = (await secondPwdRes.json()) as any;
      assert.strictEqual(secondPwdJson.ok, true);
      assert.strictEqual(secondPwdJson.user.email, 'dosen.baru@umc.ac.id');

      // 10. Deactivated user is blocked from BOTH Google & Email+Password login
      const dosenId = secondPwdJson.user.id;
      const deactRes = await fetch(`${baseUrl}/api/auth/admin-sync-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dosenId,
          nama: 'Dosen Baru UMC',
          email: 'dosen.baru@umc.ac.id',
          role: 'ACT-10',
          roleName: 'User (Civitas Akademika)',
          civitasType: 'Dosen',
          statusAkun: 'Nonaktif'
        })
      });
      assert.strictEqual(deactRes.status, 200);

      const blockedGoogle = await fetch(`${baseUrl}/api/auth/google-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'token-dosen-baru' })
      });
      assert.strictEqual(blockedGoogle.status, 403);

      const blockedPwd = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dosen.baru@umc.ac.id', password: 'PasswordDosen#2026' })
      });
      assert.strictEqual(blockedPwd.status, 403);
    } finally {
      server.close();
    }
  });

  it('Client domain & password validation helpers remain consistent', () => {
    const users = AppDatabase.getUsers();
    assert.strictEqual(validateGoogleLogin('aditiya.ahmad@umc.ac.id', users).requiresPasswordSetup, false);
    assert.strictEqual(validateGoogleLogin('220511099@student.umc.ac.id', users).requiresPasswordSetup, true);
    assert.strictEqual(validateGoogleLogin('orangluar@gmail.com', users).ok, false);
    assert.strictEqual(validatePasswordLogin('dosen.baru@umc.ac.id', 'rahasia123', users).ok, false);
    assert.strictEqual(validateNewPasswordSetup('12345', '12345').ok, false);
    assert.strictEqual(validateNewPasswordSetup('rahasia123', 'rahasia123').ok, true);
  });
});
