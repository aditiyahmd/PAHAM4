export type BluetoothPrintAlign = 0 | 1 | 2;
export type BluetoothPrintTextFormat = 0 | 1 | 2 | 3 | 4;

export interface BluetoothPrintTextEntry {
  type: 0;
  content: string;
  bold: 0 | 1;
  align: BluetoothPrintAlign;
  format: BluetoothPrintTextFormat;
}

export interface BluetoothPrintImageEntry {
  type: 1;
  path: string;
  align: BluetoothPrintAlign;
}

export interface BluetoothPrintBarcodeEntry {
  type: 2;
  value: string;
  width: number;
  height: number;
  align: BluetoothPrintAlign;
}

export interface BluetoothPrintQrEntry {
  type: 3;
  value: string;
  size: number;
  align: BluetoothPrintAlign;
}

export interface BluetoothPrintHtmlEntry {
  type: 4;
  content: string;
}

export type BluetoothPrintEntry =
  | BluetoothPrintTextEntry
  | BluetoothPrintImageEntry
  | BluetoothPrintBarcodeEntry
  | BluetoothPrintQrEntry
  | BluetoothPrintHtmlEntry;

export type BluetoothPrintResponseMap = Record<string, BluetoothPrintEntry>;

export interface StickerPrintItem {
  code: string;
  name?: string;
  kategori?: string;
  lokasi?: string;
}

export interface ReceiptPrintLine {
  label: string;
  value: string;
}

export interface ReceiptPrintParams {
  title: string;
  subtitle?: string;
  barcode?: string;
  lines: ReceiptPrintLine[];
}

export const BLUETOOTH_PRINT_SCHEME = 'my.bluetoothprint.scheme://';
export const BLUETOOTH_PRINT_APP_URL =
  'https://play.google.com/store/apps/details?id=mate.bluetoothprint';

/**
 * Normalizes Indonesian/UTF-8 text into clean ASCII-safe printable characters
 * for ESC/POS thermal printers so symbols do not render as garbled glyphs.
 */
export function sanitizeThermalText(input: string, maxLength = 80): string {
  const cleaned = (input || '')
    .replace(/[·•–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLength - 3))}...`;
}

/**
 * Converts an ordered array of print entries into a numerically indexed object
 * ("0", "1", "2", ...) matching PHP `json_encode($a, JSON_FORCE_OBJECT)` expected
 * by the Android Bluetooth Print (`mate.bluetoothprint`) app.
 */
export function toForceObjectMap(entries: BluetoothPrintEntry[]): BluetoothPrintResponseMap {
  const result: BluetoothPrintResponseMap = {};
  entries.forEach((entry, idx) => {
    result[String(idx)] = entry;
  });
  return result;
}

function appendStickerEntries(entries: BluetoothPrintEntry[], item: StickerPrintItem): void {
  const cleanCode = sanitizeThermalText(item.code || 'AST-000', 40) || 'AST-000';
  const cleanName = item.name ? sanitizeThermalText(item.name, 42) : '';
  const metaParts = [item.kategori, item.lokasi]
    .map(v => (v ? sanitizeThermalText(v, 24) : ''))
    .filter(Boolean);
  const metaLine = metaParts.length > 0 ? sanitizeThermalText(metaParts.join(' - '), 48) : '';

  entries.push({
    type: 0,
    content: 'PUSDATIN UMC - ASET RESMI',
    bold: 1,
    align: 1,
    format: 0
  });

  entries.push({
    type: 2,
    value: cleanCode,
    width: 100,
    height: 50,
    align: 1
  });

  entries.push({
    type: 0,
    content: cleanCode,
    bold: 1,
    align: 1,
    format: 0
  });

  if (cleanName) {
    entries.push({
      type: 0,
      content: cleanName,
      bold: 1,
      align: 1,
      format: 4
    });
  }

  if (metaLine) {
    entries.push({
      type: 0,
      content: metaLine,
      bold: 0,
      align: 1,
      format: 4
    });
  }

  entries.push({
    type: 0,
    content: ' ',
    bold: 0,
    align: 0,
    format: 0
  });
}

export function buildStickerPrintPayload(item: StickerPrintItem): BluetoothPrintResponseMap {
  const entries: BluetoothPrintEntry[] = [];
  appendStickerEntries(entries, item);
  entries.push({
    type: 0,
    content: ' ',
    bold: 0,
    align: 0,
    format: 0
  });
  return toForceObjectMap(entries);
}

export function buildBatchStickerPrintPayload(items: StickerPrintItem[]): BluetoothPrintResponseMap {
  const safeItems = items.length > 0 ? items : [{ code: 'AST-000', name: 'Aset PUSDATIN UMC' }];
  const entries: BluetoothPrintEntry[] = [];
  safeItems.forEach((item, index) => {
    appendStickerEntries(entries, item);
    if (index < safeItems.length - 1) {
      entries.push({
        type: 0,
        content: '--------------------------------',
        bold: 0,
        align: 1,
        format: 4
      });
    }
  });
  entries.push({
    type: 0,
    content: ' ',
    bold: 0,
    align: 0,
    format: 0
  });
  return toForceObjectMap(entries);
}

export function buildReceiptPrintPayload(params: ReceiptPrintParams): BluetoothPrintResponseMap {
  const entries: BluetoothPrintEntry[] = [];

  entries.push({
    type: 0,
    content: 'PUSDATIN UMC',
    bold: 1,
    align: 1,
    format: 1
  });

  entries.push({
    type: 0,
    content: sanitizeThermalText(params.title || 'DOKUMEN LAYANAN PAHAM', 42),
    bold: 1,
    align: 1,
    format: 0
  });

  if (params.subtitle) {
    entries.push({
      type: 0,
      content: sanitizeThermalText(params.subtitle, 46),
      bold: 0,
      align: 1,
      format: 4
    });
  }

  entries.push({
    type: 0,
    content: '--------------------------------',
    bold: 0,
    align: 1,
    format: 0
  });

  (params.lines || []).forEach(line => {
    const k = sanitizeThermalText(line.label, 18);
    const v = sanitizeThermalText(line.value || '-', 48);
    entries.push({
      type: 0,
      content: `${k}: ${v}`,
      bold: 0,
      align: 0,
      format: 4
    });
  });

  if (params.barcode && params.barcode !== 'Tanpa Barcode' && params.barcode !== '-') {
    const cleanBarcode = sanitizeThermalText(params.barcode, 32);
    entries.push({
      type: 0,
      content: '--------------------------------',
      bold: 0,
      align: 1,
      format: 0
    });
    entries.push({
      type: 2,
      value: cleanBarcode,
      width: 100,
      height: 50,
      align: 1
    });
    entries.push({
      type: 0,
      content: cleanBarcode,
      bold: 1,
      align: 1,
      format: 0
    });
  }

  entries.push({
    type: 0,
    content: '--------------------------------',
    bold: 0,
    align: 1,
    format: 0
  });

  entries.push({
    type: 0,
    content: 'PAHAM - PUSDATIN UMC CIREBON',
    bold: 0,
    align: 1,
    format: 4
  });

  entries.push({
    type: 0,
    content: ' ',
    bold: 0,
    align: 0,
    format: 0
  });
  entries.push({
    type: 0,
    content: ' ',
    bold: 0,
    align: 0,
    format: 0
  });

  return toForceObjectMap(entries);
}

/**
 * Resolves the active base origin for generating `<RESPONSEURL>` links.
 */
export function getActiveOrigin(explicitOrigin?: string): string {
  if (explicitOrigin) return explicitOrigin.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

export function buildAndroidStickerResponseUrl(
  item: StickerPrintItem,
  explicitOrigin?: string
): string {
  const origin = getActiveOrigin(explicitOrigin);
  const qs = new URLSearchParams();
  qs.set('mode', 'sticker');
  qs.set('code', (item.code || 'AST-000').trim());
  if (item.name) qs.set('name', item.name.trim());
  if (item.kategori) qs.set('kategori', item.kategori.trim());
  if (item.lokasi) qs.set('lokasi', item.lokasi.trim());
  return `${origin}/api/bluetooth-print?${qs.toString()}`;
}

export function buildAndroidStickerSchemeUrl(
  item: StickerPrintItem,
  explicitOrigin?: string
): string {
  return `${BLUETOOTH_PRINT_SCHEME}${buildAndroidStickerResponseUrl(item, explicitOrigin)}`;
}

export function buildAndroidBatchResponseUrl(
  items: StickerPrintItem[],
  explicitOrigin?: string
): string {
  const origin = getActiveOrigin(explicitOrigin);
  const compact = items.slice(0, 20).map(it => ({
    c: (it.code || 'AST-000').trim(),
    n: (it.name || '').trim().slice(0, 36),
    k: (it.kategori || '').trim().slice(0, 20),
    l: (it.lokasi || '').trim().slice(0, 24)
  }));
  const qs = new URLSearchParams();
  qs.set('mode', 'batch');
  qs.set('items', JSON.stringify(compact));
  return `${origin}/api/bluetooth-print?${qs.toString()}`;
}

export function buildAndroidBatchSchemeUrl(
  items: StickerPrintItem[],
  explicitOrigin?: string
): string {
  return `${BLUETOOTH_PRINT_SCHEME}${buildAndroidBatchResponseUrl(items, explicitOrigin)}`;
}

export function buildAndroidReceiptResponseUrl(
  params: ReceiptPrintParams,
  explicitOrigin?: string
): string {
  const origin = getActiveOrigin(explicitOrigin);
  const qs = new URLSearchParams();
  qs.set('mode', 'receipt');
  qs.set('title', params.title.trim().slice(0, 48));
  if (params.subtitle) qs.set('subtitle', params.subtitle.trim().slice(0, 48));
  if (params.barcode) qs.set('barcode', params.barcode.trim().slice(0, 32));
  const compactLines = (params.lines || []).slice(0, 14).map(l => ({
    k: l.label.trim().slice(0, 20),
    v: (l.value || '-').trim().slice(0, 56)
  }));
  qs.set('lines', JSON.stringify(compactLines));
  return `${origin}/api/bluetooth-print?${qs.toString()}`;
}

export function buildAndroidReceiptSchemeUrl(
  params: ReceiptPrintParams,
  explicitOrigin?: string
): string {
  return `${BLUETOOTH_PRINT_SCHEME}${buildAndroidReceiptResponseUrl(params, explicitOrigin)}`;
}
