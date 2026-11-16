import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import {
  buildBatchStickerPrintPayload,
  buildReceiptPrintPayload,
  buildStickerPrintPayload,
  type ReceiptPrintLine,
  type StickerPrintItem
} from './src/services/bluetoothPrintService.ts';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // CORS & headers required for Android Bluetooth Print (mate.bluetoothprint) external fetch
  app.use('/api/bluetooth-print', (_req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (_req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'paham-pusdatin-umc' });
  });

  /**
   * JSON Response endpoint for Android Bluetooth Print app (mate.bluetoothprint).
   * Supports:
   *  - mode=sticker (default): ?code=...&name=...&kategori=...&lokasi=...
   *  - mode=batch: ?items=[{"c":"...","n":"...","k":"...","l":"..."}]
   *  - mode=receipt: ?title=...&subtitle=...&barcode=...&lines=[{"k":"...","v":"..."}]
   */
  app.get('/api/bluetooth-print', (req: Request, res: Response) => {
    const mode = String(req.query.mode || 'sticker').trim().toLowerCase();

    if (mode === 'batch') {
      let items: StickerPrintItem[] = [];
      const rawItems = typeof req.query.items === 'string' ? req.query.items : '';
      if (rawItems) {
        try {
          const parsed = JSON.parse(rawItems);
          if (Array.isArray(parsed)) {
            items = parsed.map((entry: Record<string, unknown>) => ({
              code: String(entry.c ?? entry.code ?? 'AST-000'),
              name: entry.n != null || entry.name != null ? String(entry.n ?? entry.name) : undefined,
              kategori:
                entry.k != null || entry.kategori != null
                  ? String(entry.k ?? entry.kategori)
                  : undefined,
              lokasi:
                entry.l != null || entry.lokasi != null ? String(entry.l ?? entry.lokasi) : undefined
            }));
          }
        } catch {
          items = [];
        }
      }
      const payload = buildBatchStickerPrintPayload(items);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(payload));
      return;
    }

    if (mode === 'receipt') {
      const title = String(req.query.title || 'BUKTI LAYANAN PAHAM');
      const subtitle = req.query.subtitle ? String(req.query.subtitle) : undefined;
      const barcode = req.query.barcode ? String(req.query.barcode) : undefined;

      let lines: ReceiptPrintLine[] = [];
      const rawLines = typeof req.query.lines === 'string' ? req.query.lines : '';
      if (rawLines) {
        try {
          const parsed = JSON.parse(rawLines);
          if (Array.isArray(parsed)) {
            lines = parsed.map((entry: Record<string, unknown>) => ({
              label: String(entry.k ?? entry.label ?? '-'),
              value: String(entry.v ?? entry.value ?? '-')
            }));
          }
        } catch {
          lines = [];
        }
      }

      const payload = buildReceiptPrintPayload({ title, subtitle, barcode, lines });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(JSON.stringify(payload));
      return;
    }

    // Default: single barcode sticker
    const code = String(req.query.code || '20495812');
    const name = req.query.name ? String(req.query.name) : undefined;
    const kategori = req.query.kategori ? String(req.query.kategori) : undefined;
    const lokasi = req.query.lokasi ? String(req.query.lokasi) : undefined;

    const payload = buildStickerPrintPayload({ code, name, kategori, lokasi });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(payload));
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const port = Number(process.env.PORT || 3000);

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`PAHAM PUSDATIN UMC server running on http://0.0.0.0:${port}`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
