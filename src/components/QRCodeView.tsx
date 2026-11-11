import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { QrCode, Barcode, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

interface UnifiedAssetCodeProps {
  namaAset: string;
  barcode: string; // Scan code
  kodeUnikAset: string; // BR-001: Immutable unique code
  kategori?: string;
  lokasi?: string;
  size?: number;
  showDetails?: boolean;
  showThermalPrintButton?: boolean;
}

export const UnifiedAssetCode: React.FC<UnifiedAssetCodeProps> = ({
  namaAset,
  barcode,
  kodeUnikAset,
  kategori,
  lokasi,
  size = 140,
  showDetails = true,
  showThermalPrintButton = true
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'barcode'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  // Payload memuat nama aset, kode pemindaian, dan kode unik aset (BR-002)
  const qrPayload = JSON.stringify({
    kodeUnik: kodeUnikAset || barcode,
    barcode: barcode,
    nama: namaAset,
    kategori: kategori || 'IT Asset',
    sistem: 'PAHAM PUSDATIN UMC'
  });

  useEffect(() => {
    QRCode.toDataURL(qrPayload, {
      width: size * 2,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, [qrPayload, size]);

  useEffect(() => {
    if (activeTab === 'barcode' && barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, barcode || 'AST-000', {
          format: 'CODE128',
          width: 1.6,
          height: 48,
          displayValue: true,
          font: 'JetBrains Mono',
          fontSize: 12,
          textMargin: 4,
          lineColor: '#0f172a'
        });
      } catch (e) {
        console.error('JsBarcode error:', e);
      }
    }
  }, [activeTab, barcode]);

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label Aset - ${kodeUnikAset || barcode}</title>
          <style>
            @page {
              size: 70mm 45mm;
              margin: 2mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 6px;
              color: #0f172a;
              box-sizing: border-box;
            }
            .label-card {
              border: 1.5px dashed #64748b;
              border-radius: 6px;
              padding: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              max-width: 250px;
              margin: 0 auto;
            }
            .header {
              font-size: 9px;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .sub-header {
              font-size: 7.5px;
              color: #64748b;
              margin-bottom: 6px;
            }
            .qr-img {
              width: 110px;
              height: 110px;
              margin: 2px auto;
            }
            .asset-name {
              font-size: 11px;
              font-weight: 700;
              margin-top: 4px;
              line-height: 1.2;
            }
            .asset-code {
              font-family: monospace;
              font-size: 10px;
              font-weight: 700;
              background: #f1f5f9;
              padding: 2px 6px;
              border-radius: 4px;
              margin-top: 3px;
              display: inline-block;
            }
            .meta {
              font-size: 7.5px;
              color: #475569;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">PUSDATIN UMC - INVENTARIS RESMI</div>
            <div class="sub-header">UNIVERSITAS MUHAMMADIYAH CIREBON</div>
            <img class="qr-img" src="${qrDataUrl}" alt="QR Aset" />
            <div class="asset-name">${namaAset}</div>
            <div class="asset-code">${kodeUnikAset || barcode}</div>
            <div class="meta">Scan: ${barcode} ${lokasi ? '| ' + lokasi : ''}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col items-center">
      {/* Tab Selector: QR Code vs Barcode */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mb-3 self-center text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
            activeTab === 'qr'
              ? 'bg-white text-emerald-800 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
          QR Code (BR-002)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('barcode')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
            activeTab === 'barcode'
              ? 'bg-white text-blue-800 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Barcode className="w-3.5 h-3.5 text-blue-600" />
          Barcode 128
        </button>
      </div>

      {/* Visual Render Container */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center min-h-[170px] w-full max-w-[220px]">
        {activeTab === 'qr' ? (
          qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code ${namaAset}`}
              style={{ width: `${size}px`, height: `${size}px` }}
              className="rounded-lg shadow-2xs bg-white p-1"
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-400 text-xs">
              Membuat QR Code...
            </div>
          )
        ) : (
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs w-full overflow-hidden flex justify-center">
            <svg ref={barcodeSvgRef} className="max-w-full"></svg>
          </div>
        )}
      </div>

      {/* Details Box */}
      {showDetails && (
        <div className="mt-3 text-center w-full">
          <div className="font-bold text-slate-800 text-sm line-clamp-1">{namaAset}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
              ID: {kodeUnikAset || barcode}
            </span>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 font-semibold">
              Scan: {barcode}
            </span>
          </div>
          {lokasi && <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">📍 {lokasi}</div>}
        </div>
      )}

      {/* Action Buttons */}
      {showThermalPrintButton && (
        <div className="mt-3 flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={handlePrintLabel}
            className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Label Fisik
          </button>
          {qrDataUrl && activeTab === 'qr' && (
            <a
              href={qrDataUrl}
              download={`QR_${kodeUnikAset || barcode}.png`}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs border border-slate-200 cursor-pointer"
              title="Unduh PNG"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
