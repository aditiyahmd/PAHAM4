import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { Download, Printer, Copy, Check } from 'lucide-react';

interface BarcodeCardParams {
  value: string;
  name?: string;
  kategori?: string;
  lokasi?: string;
  format?: 'CODE128' | 'EAN8';
}

export function renderBarcodeCardCanvas({
  value,
  name,
  kategori,
  lokasi,
  format = 'CODE128'
}: BarcodeCardParams): HTMLCanvasElement {
  const cleanValue = (value || 'AST-000').trim();
  let actualFormat: 'CODE128' | 'EAN8' = format;
  if (format === 'EAN8' && !/^\d{7,8}$/.test(cleanValue)) {
    actualFormat = 'CODE128';
  }

  // Generate raw barcode bars (without built-in text so we can draw crisp centered monospace digits like reference sticker)
  const barsCanvas = document.createElement('canvas');
  JsBarcode(barsCanvas, cleanValue, {
    format: actualFormat,
    width: 3,
    height: 112,
    displayValue: false,
    margin: 4,
    background: '#ffffff',
    lineColor: '#000000'
  });

  const cardWidth = 720;
  const cardHeight = 380;
  const canvas = document.createElement('canvas');
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // White card background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Outer dark rectangular border matching reference sticker
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, cardWidth - 20, cardHeight - 20);

  // Header: PUSDATIN UMC · ASET RESMI
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PUSDATIN UMC · ASET RESMI', cardWidth / 2, 46);

  // Barcode bars centered horizontally
  const maxBarWidth = cardWidth - 88;
  const targetWidth = Math.min(maxBarWidth, Math.max(460, barsCanvas.width));
  const barX = (cardWidth - targetWidth) / 2;
  const barY = 74;
  const barH = 148;
  ctx.drawImage(barsCanvas, barX, barY, targetWidth, barH);

  // Monospace barcode digits beneath bars
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 26px "JetBrains Mono", "Courier New", monospace';
  ctx.fillText(cleanValue, cardWidth / 2, 248);

  // Asset Name
  const displayName = (name || 'Aset TI UMC').trim();
  const truncatedName = displayName.length > 46 ? `${displayName.slice(0, 44)}...` : displayName;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
  ctx.fillText(truncatedName, cardWidth / 2, 298);

  // Metadata: Kategori · Lokasi
  const metaText = [kategori, lokasi].filter(Boolean).join(' · ');
  if (metaText) {
    const truncatedMeta = metaText.length > 58 ? `${metaText.slice(0, 56)}...` : metaText;
    ctx.fillStyle = '#64748b';
    ctx.font = '18px Arial, Helvetica, sans-serif';
    ctx.fillText(truncatedMeta, cardWidth / 2, 336);
  }

  return canvas;
}

export function printBarcodeStickerPdf(params: BarcodeCardParams): void {
  const cleanValue = (params.value || 'AST-000').trim();
  let actualFormat: 'CODE128' | 'EAN8' = params.format || 'CODE128';
  if (actualFormat === 'EAN8' && !/^\d{7,8}$/.test(cleanValue)) {
    actualFormat = 'CODE128';
  }

  const canvas = document.createElement('canvas');
  JsBarcode(canvas, cleanValue, {
    format: actualFormat,
    width: 2,
    height: 52,
    displayValue: true,
    fontSize: 13,
    font: 'monospace',
    textMargin: 3,
    margin: 6,
    background: '#ffffff',
    lineColor: '#000000'
  });

  const barcodePng = canvas.toDataURL('image/png');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [58, 30] });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.35);
  doc.rect(1.5, 1.5, 55, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PUSDATIN UMC · ASET RESMI', 29, 4.8, { align: 'center' });

  doc.addImage(barcodePng, 'PNG', 5, 6, 48, 15.5);

  if (params.name) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(15, 23, 42);
    const shortName = params.name.length > 40 ? `${params.name.slice(0, 38)}...` : params.name;
    doc.text(shortName, 29, 24.4, { align: 'center' });
  }

  if (params.kategori || params.lokasi) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    const meta = [params.kategori, params.lokasi].filter(Boolean).join(' · ');
    const shortMeta = meta.length > 48 ? `${meta.slice(0, 46)}...` : meta;
    doc.text(shortMeta, 29, 27.1, { align: 'center' });
  }

  const safeCode = cleanValue.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Stiker_Barcode_${safeCode}.pdf`);
}

interface BarcodeViewProps {
  value: string;
  name?: string;
  kategori?: string;
  lokasi?: string;
  format?: 'CODE128' | 'EAN8';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  showActions?: boolean;
  className?: string;
  isStickerCard?: boolean;
}

export const BarcodeView: React.FC<BarcodeViewProps> = ({
  value,
  name,
  kategori,
  lokasi,
  format = 'CODE128',
  width = 1.8,
  height = 52,
  showActions = true,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        let actualFormat = format;
        if (format === 'EAN8' && !/^\d{7,8}$/.test(value.trim())) {
          actualFormat = 'CODE128';
        }

        JsBarcode(svgRef.current, value.trim(), {
          format: actualFormat,
          width,
          height,
          displayValue: false,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (err) {
        console.error('Error rendering barcode with JsBarcode', err);
      }
    }
  }, [value, format, width, height]);

  const copyCode = () => {
    navigator.clipboard.writeText(value.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBarcodePng = () => {
    const cardCanvas = renderBarcodeCardCanvas({
      value,
      name,
      kategori,
      lokasi,
      format
    });
    const pngUrl = cardCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = `Stiker_Barcode_${value.trim()}_${(name || 'Aset').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    downloadLink.href = pngUrl;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const printThermalLabel = () => {
    printBarcodeStickerPdf({
      value,
      name,
      kategori,
      lokasi,
      format
    });
  };

  const metaLine = [kategori, lokasi].filter(Boolean).join(' · ');

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col ${className}`}>
      <div className="p-4 flex-1 flex flex-col items-center justify-center">
        {/* Bordered Label Preview matching Stiker Barcode Resmi */}
        <div
          data-testid="barcode-sticker-card"
          className="w-full max-w-[330px] border-2 border-slate-900 bg-white px-4 py-3 text-center space-y-1.5"
        >
          <div className="text-[11px] font-extrabold tracking-wide text-slate-950 uppercase">
            PUSDATIN UMC · ASET RESMI
          </div>

          <div className="bg-white overflow-hidden flex justify-center w-full py-0.5">
            <svg ref={svgRef} className="max-w-full h-auto" />
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <span className="font-mono text-xs font-bold text-slate-900 tracking-widest">
              {value}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors cursor-pointer"
              title="Salin kode barcode"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {name && (
            <div className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 pt-0.5">
              {name}
            </div>
          )}

          {metaLine && (
            <div className="text-[10px] text-slate-500 line-clamp-1">
              {metaLine}
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={downloadBarcodePng}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh PNG</span>
          </button>

          <button
            type="button"
            onClick={printThermalLabel}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Stiker</span>
          </button>
        </div>
      )}
    </div>
  );
};
