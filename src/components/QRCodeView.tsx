import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, Download, Smartphone } from 'lucide-react';
import { printBarcodeStickerPdf, renderBarcodeCardCanvas } from './BarcodeView';
import { buildAndroidStickerSchemeUrl } from '../services/bluetoothPrintService';

interface UnifiedAssetCodeProps {
  namaAset: string;
  barcode: string; // Scan code
  kodeUnikAset?: string;
  kategori?: string;
  lokasi?: string;
  size?: number;
  showDetails?: boolean;
  showThermalPrintButton?: boolean;
}

export const UnifiedAssetCode: React.FC<UnifiedAssetCodeProps> = ({
  namaAset,
  barcode,
  kategori,
  lokasi,
  showThermalPrintButton = true
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);
  const cleanCode = (barcode || 'AST-000').trim();

  useEffect(() => {
    if (barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, cleanCode, {
          format: 'CODE128',
          width: 2.4,
          height: 60,
          displayValue: false,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (e) {
        console.error('JsBarcode error:', e);
      }
    }
  }, [cleanCode]);

  const handlePrintLabel = () => {
    printBarcodeStickerPdf({
      value: cleanCode,
      name: namaAset,
      kategori,
      lokasi,
      format: 'CODE128'
    });
  };

  const handleDownloadPng = () => {
    const cardCanvas = renderBarcodeCardCanvas({
      value: cleanCode,
      name: namaAset,
      kategori,
      lokasi,
      format: 'CODE128'
    });
    const link = document.createElement('a');
    link.download = `Stiker_Barcode_${cleanCode}_${namaAset.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = cardCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metaLine = [kategori, lokasi].filter(Boolean).join(' · ');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col items-center space-y-3">
      {/* Full Bordered Barcode Card Preview */}
      <div
        data-testid="unified-barcode-card"
        className="w-full border-2 border-black bg-white px-4 py-3 text-center space-y-1.5"
      >
        <div className="text-[11px] font-black tracking-wide text-black uppercase">
          PUSDATIN UMC · ASET RESMI
        </div>

        <div className="bg-white w-full overflow-hidden flex justify-center py-0.5">
          <svg ref={barcodeSvgRef} className="max-w-full h-auto" />
        </div>

        <div className="font-mono text-sm font-black text-black tracking-widest">
          {cleanCode}
        </div>

        <div className="font-extrabold text-xs text-black leading-snug line-clamp-2 pt-0.5">
          {namaAset}
        </div>

        {metaLine && (
          <div className="text-[10px] font-semibold text-slate-800 line-clamp-1">
            {metaLine}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showThermalPrintButton && (
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PNG</span>
            </button>
            <button
              type="button"
              onClick={handlePrintLabel}
              className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Stiker PDF</span>
            </button>
          </div>

          <a
            href={buildAndroidStickerSchemeUrl({
              code: cleanCode,
              name: namaAset,
              kategori,
              lokasi
            })}
            data-testid="android-bt-print-unified-sticker"
            title="Cetak langsung ke printer thermal Bluetooth/USB via aplikasi Android Bluetooth Print"
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Print Thermal Android (Bluetooth Print)</span>
          </a>
        </div>
      )}
    </div>
  );
};
