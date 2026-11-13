import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { Download, Printer, Copy, Check } from 'lucide-react';

export interface BarcodeCardParams {
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

  // High-contrast, extra-thick thermal-ready barcode bars (no gray aliasing)
  const barsCanvas = document.createElement('canvas');
  JsBarcode(barsCanvas, cleanValue, {
    format: actualFormat,
    width: 5,
    height: 150,
    displayValue: false,
    margin: 4,
    background: '#ffffff',
    lineColor: '#000000'
  });

  const cardWidth = 960;
  const cardHeight = 490;
  const canvas = document.createElement('canvas');
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  // Solid pure white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Thick solid pure-black border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, cardWidth - 28, cardHeight - 28);

  // Header: PUSDATIN UMC · ASET RESMI
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 30px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PUSDATIN UMC · ASET RESMI', cardWidth / 2, 58);

  // Barcode bars centered horizontally without blurred scaling
  const maxBarWidth = cardWidth - 108;
  const targetWidth = Math.min(maxBarWidth, Math.max(640, barsCanvas.width));
  const barX = Math.round((cardWidth - targetWidth) / 2);
  const barY = 92;
  const barH = 188;
  ctx.drawImage(barsCanvas, barX, barY, targetWidth, barH);

  // Bold solid black monospace digits
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 34px "Courier New", Courier, monospace';
  ctx.fillText(cleanValue, cardWidth / 2, 314);

  // Bold Asset Name
  const displayName = (name || 'Aset TI UMC').trim();
  const truncatedName = displayName.length > 46 ? `${displayName.slice(0, 44)}...` : displayName;
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 28px Arial, Helvetica, sans-serif';
  ctx.fillText(truncatedName, cardWidth / 2, 376);

  // High-contrast dark metadata (prints solidly on thermal printers)
  const metaText = [kategori, lokasi].filter(Boolean).join(' · ');
  if (metaText) {
    const truncatedMeta = metaText.length > 58 ? `${metaText.slice(0, 56)}...` : metaText;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
    ctx.fillText(truncatedMeta, cardWidth / 2, 426);
  }

  return canvas;
}

/**
 * Draws a crisp, pure-black high-contrast thermal barcode sticker (58mm x 30mm) onto an existing jsPDF page.
 */
export function drawBarcodeStickerOnPdf(doc: jsPDF, params: BarcodeCardParams): void {
  const cleanValue = (params.value || 'AST-000').trim();
  let actualFormat: 'CODE128' | 'EAN8' = params.format || 'CODE128';
  if (actualFormat === 'EAN8' && !/^\d{7,8}$/.test(cleanValue)) {
    actualFormat = 'CODE128';
  }

  // Generate bars ONLY at ultra-crisp 5px module width so bitmap bars stay thick & bold on thermal paper
  const barsCanvas = document.createElement('canvas');
  JsBarcode(barsCanvas, cleanValue, {
    format: actualFormat,
    width: 5,
    height: 150,
    displayValue: false,
    margin: 2,
    background: '#ffffff',
    lineColor: '#000000'
  });

  const barcodePng = barsCanvas.toDataURL('image/png');

  // Solid black rectangular border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(1.5, 1.5, 55, 27);

  // Pure black bold vector header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(0, 0, 0);
  doc.text('PUSDATIN UMC · ASET RESMI', 29, 5.0, { align: 'center' });

  // Thick solid black barcode bars
  doc.addImage(barcodePng, 'PNG', 5.5, 6.2, 47, 11.2, undefined, 'FAST');

  // Crisp pure-black vector monospace code below bars (never cropped or faint)
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(cleanValue, 29, 20.6, { align: 'center' });

  if (params.name) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(0, 0, 0);
    const shortName = params.name.length > 38 ? `${params.name.slice(0, 36)}...` : params.name;
    doc.text(shortName, 29, 24.0, { align: 'center' });
  }

  if (params.kategori || params.lokasi) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.0);
    doc.setTextColor(0, 0, 0);
    const meta = [params.kategori, params.lokasi].filter(Boolean).join(' · ');
    const shortMeta = meta.length > 46 ? `${meta.slice(0, 44)}...` : meta;
    doc.text(shortMeta, 29, 26.8, { align: 'center' });
  }
}

export function printBarcodeStickerPdf(params: BarcodeCardParams): void {
  const cleanValue = (params.value || 'AST-000').trim();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [58, 30] });
  drawBarcodeStickerOnPdf(doc, params);
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
  width = 2.4,
  height = 60,
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
        {/* High-contrast Bordered Label Preview matching Thermal Stiker Barcode Resmi */}
        <div
          data-testid="barcode-sticker-card"
          className="w-full max-w-[330px] border-2 border-black bg-white px-4 py-3 text-center space-y-1.5"
        >
          <div className="text-[11px] font-black tracking-wide text-black uppercase">
            PUSDATIN UMC · ASET RESMI
          </div>

          <div className="bg-white overflow-hidden flex justify-center w-full py-0.5">
            <svg ref={svgRef} className="max-w-full h-auto" />
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <span className="font-mono text-sm font-black text-black tracking-widest">
              {value}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="text-slate-500 hover:text-black p-0.5 rounded transition-colors cursor-pointer"
              title="Salin kode barcode"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {name && (
            <div className="font-extrabold text-xs text-black leading-snug line-clamp-2 pt-0.5">
              {name}
            </div>
          )}

          {metaLine && (
            <div className="text-[10px] font-semibold text-slate-800 line-clamp-1">
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
