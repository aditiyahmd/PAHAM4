import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  BLUETOOTH_PRINT_SCHEME,
  buildAndroidBatchSchemeUrl,
  buildAndroidReceiptSchemeUrl,
  buildAndroidStickerSchemeUrl,
  buildBatchStickerPrintPayload,
  buildReceiptPrintPayload,
  buildStickerPrintPayload,
  sanitizeThermalText
} from '../src/services/bluetoothPrintService.ts';
import { createApp } from '../server.ts';

describe('Android Bluetooth Print (mate.bluetoothprint) Integration', () => {
  it('Generates valid JSON_FORCE_OBJECT sticker payload with barcode entry (type 2) and text entries (type 0)', () => {
    const payload = buildStickerPrintPayload({
      code: '30918274',
      name: 'Laptop Dell Latitude 5430 Core i5',
      kategori: 'Komputer & Laptop',
      lokasi: 'Ruang PUSDATIN'
    });

    assert.equal(payload['0'].type, 0);
    assert.equal(payload['0'].content, 'PUSDATIN UMC - ASET RESMI');
    assert.equal(payload['0'].bold, 1);
    assert.equal(payload['0'].align, 1);

    assert.equal(payload['1'].type, 2);
    if (payload['1'].type === 2) {
      assert.equal(payload['1'].value, '30918274');
      assert.equal(payload['1'].width, 100);
      assert.equal(payload['1'].height, 50);
      assert.equal(payload['1'].align, 1);
    }

    assert.equal(payload['2'].type, 0);
    if (payload['2'].type === 0) {
      assert.equal(payload['2'].content, '30918274');
    }

    assert.equal(sanitizeThermalText('Aset · Resmi — UMC'), 'Aset - Resmi - UMC');
  });

  it('Builds my.bluetoothprint.scheme:// URLs for sticker, batch, and receipt', () => {
    const origin = 'https://paham.umc.ac.id';
    const stickerUrl = buildAndroidStickerSchemeUrl(
      { code: '30918274', name: 'Switch Cisco', kategori: 'Jaringan', lokasi: 'Lab 2' },
      origin
    );
    assert.ok(stickerUrl.startsWith(`${BLUETOOTH_PRINT_SCHEME}${origin}/api/bluetooth-print?`));
    assert.ok(stickerUrl.includes('mode=sticker'));
    assert.ok(stickerUrl.includes('code=30918274'));

    const batchUrl = buildAndroidBatchSchemeUrl(
      [
        { code: '11112222', name: 'PC 1' },
        { code: '33334444', name: 'PC 2' }
      ],
      origin
    );
    assert.ok(batchUrl.startsWith(`${BLUETOOTH_PRINT_SCHEME}${origin}/api/bluetooth-print?`));
    assert.ok(batchUrl.includes('mode=batch'));

    const receiptUrl = buildAndroidReceiptSchemeUrl(
      {
        title: 'BUKTI TIKET PEMINJAMAN ASET',
        subtitle: 'PJM-20261102-1042',
        barcode: '30918274',
        lines: [{ label: 'Peminjam', value: 'Dr. Hendra' }]
      },
      origin
    );
    assert.ok(receiptUrl.startsWith(`${BLUETOOTH_PRINT_SCHEME}${origin}/api/bluetooth-print?`));
    assert.ok(receiptUrl.includes('mode=receipt'));
  });

  it('Express /api/bluetooth-print endpoint returns valid JSON with CORS headers for sticker, batch, and receipt', async () => {
    const app = createApp();
    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));

    try {
      const address = server.address();
      assert.ok(address && typeof address === 'object');
      const baseUrl = `http://127.0.0.1:${address.port}`;

      // 1. Sticker mode
      const stickerRes = await fetch(
        `${baseUrl}/api/bluetooth-print?mode=sticker&code=30918274&name=Laptop+Dell&kategori=Komputer&lokasi=PUSDATIN`
      );
      assert.equal(stickerRes.status, 200);
      assert.equal(stickerRes.headers.get('access-control-allow-origin'), '*');
      assert.ok((stickerRes.headers.get('content-type') || '').includes('application/json'));
      const stickerJson = (await stickerRes.json()) as Record<string, any>;
      assert.equal(stickerJson['0'].type, 0);
      assert.equal(stickerJson['1'].type, 2);
      assert.equal(stickerJson['1'].value, '30918274');

      // 2. Batch mode
      const batchItems = JSON.stringify([
        { c: '10000001', n: 'Router 1', k: 'Jaringan', l: 'Lab' },
        { c: '10000002', n: 'Router 2', k: 'Jaringan', l: 'Lab' }
      ]);
      const batchRes = await fetch(
        `${baseUrl}/api/bluetooth-print?mode=batch&items=${encodeURIComponent(batchItems)}`
      );
      assert.equal(batchRes.status, 200);
      const batchJson = (await batchRes.json()) as Record<string, any>;
      const batchBarcodes = Object.values(batchJson).filter((e: any) => e.type === 2);
      assert.equal(batchBarcodes.length, 2);

      // 3. Receipt mode (with optional type 1 logoUrl & type 4 htmlContent)
      const lines = JSON.stringify([{ k: 'Pelapor', v: 'Budi' }, { k: 'Status', v: 'Resolved' }]);
      const logoUrl = 'https://umc.ac.id/logo.png';
      const htmlFooter = '<center><b>PUSDATIN UMC</b></center>';
      const receiptRes = await fetch(
        `${baseUrl}/api/bluetooth-print?mode=receipt&title=TIKET+HELPDESK&subtitle=TKT-001&barcode=30918274&logoUrl=${encodeURIComponent(logoUrl)}&html=${encodeURIComponent(htmlFooter)}&lines=${encodeURIComponent(lines)}`
      );
      assert.equal(receiptRes.status, 200);
      const receiptJson = (await receiptRes.json()) as Record<string, any>;
      assert.equal(receiptJson['0'].type, 1);
      assert.equal(receiptJson['0'].path, logoUrl);
      assert.equal(receiptJson['1'].content, 'PUSDATIN UMC');
      const receiptBarcodes = Object.values(receiptJson).filter((e: any) => e.type === 2);
      assert.equal(receiptBarcodes.length, 1);
      const receiptHtmls = Object.values(receiptJson).filter((e: any) => e.type === 4);
      assert.equal(receiptHtmls.length, 1);
      assert.equal((receiptHtmls[0] as any).content, htmlFooter);

      // Verify payload builders match server output keys
      const directBatch = buildBatchStickerPrintPayload([
        { code: '10000001', name: 'Router 1', kategori: 'Jaringan', lokasi: 'Lab' }
      ]);
      assert.ok(directBatch['0']);
      const directReceipt = buildReceiptPrintPayload({
        title: 'TEST',
        logoUrl,
        htmlContent: htmlFooter,
        lines: [{ label: 'Unit', value: 'FT' }]
      });
      assert.equal(directReceipt['0'].type, 1);
      const directSchemeWithRich = buildAndroidReceiptSchemeUrl(
        {
          title: 'DOKUMEN RESMI',
          logoUrl,
          htmlContent: htmlFooter,
          lines: [{ label: 'Unit', value: 'FT' }]
        },
        'https://paham.umc.ac.id'
      );
      assert.ok(directSchemeWithRich.includes('logoUrl='));
      assert.ok(directSchemeWithRich.includes('html='));
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it('Detects AI Studio auth-protected preview hosts and supports public domain / Apps Script /exec relay overrides', async () => {
    const mod = await import('../src/services/bluetoothPrintService.ts');
    assert.equal(mod.isAiStudioAuthProtectedHost('ais-dev-223ptbhf4z64bkksrc3bsw-435918410777.asia-southeast1.run.app'), true);
    assert.equal(mod.isAiStudioAuthProtectedHost('ais-pre-223ptbhf4z64bkksrc3bsw-435918410777.asia-southeast1.run.app'), true);
    assert.equal(mod.isAiStudioAuthProtectedHost('paham.umc.ac.id'), false);
    assert.equal(mod.isAiStudioAuthProtectedHost('localhost'), false);

    // Mock localStorage in Node test runtime
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k)
    };

    try {
      mod.setPublicBluetoothEndpoint('https://paham.umc.ac.id/');
      const domainUrl = mod.buildAndroidStickerResponseUrl({ code: '12345678' });
      assert.ok(domainUrl.startsWith('https://paham.umc.ac.id/api/bluetooth-print?'));

      const gasExec = 'https://script.google.com/macros/s/AKfycbTest123/exec';
      mod.setPublicBluetoothEndpoint(gasExec);
      const relayUrl = mod.buildAndroidReceiptResponseUrl({
        title: 'TES RELAY',
        lines: [{ label: 'Unit', value: 'PUSDATIN' }]
      });
      assert.ok(relayUrl.startsWith(`${gasExec}?payload=`));
      const parsedPayloadParam = new URL(relayUrl).searchParams.get('payload');
      assert.ok(parsedPayloadParam);
      const decoded = JSON.parse(parsedPayloadParam);
      assert.equal(decoded['0'].content, 'PUSDATIN UMC');
      assert.equal(decoded['1'].content, 'TES RELAY');

      mod.setPublicBluetoothEndpoint('');
      assert.equal(mod.getPublicBluetoothEndpoint(), '');
    } finally {
      delete (globalThis as any).localStorage;
    }
  });
});
