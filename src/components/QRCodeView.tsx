import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
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

  const handlePrintLabel = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [70, 45] });

    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.35);
    doc.rect(2, 2, 66, 41);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text('PUSDATIN UMC - INVENTARIS RESMI', 35, 5.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON', 35, 8.2, { align: 'center' });

    if (activeTab === 'qr') {
      const imgUrl =
        qrDataUrl ||
        (await QRCode.toDataURL(qrPayload, {
          width: 280,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'M'
        }));
      doc.addImage(imgUrl, 'PNG', 24.5, 9.8, 21, 21);
    } else {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, (barcode || 'AST-000').trim(), {
        format: 'CODE128',
        width: 2,
        height: 48,
        displayValue: true,
        font: 'monospace',
        fontSize: 12,
        textMargin: 4,
        margin: 6,
        background: '#ffffff',
        lineColor: '#0f172a'
      });
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 11.5, 50, 17.5);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const shortName = namaAset.length > 42 ? `${namaAset.slice(0, 40)}...` : namaAset;
    doc.text(shortName, 35, 34.2, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(kodeUnikAset || barcode, 35, 37.6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    const metaText = `Scan: ${barcode}${lokasi ? ' | ' + lokasi : ''}`;
    const shortMeta = metaText.length > 52 ? `${metaText.slice(0, 50)}...` : metaText;
    doc.text(shortMeta, 35, 40.8, { align: 'center' });

    const safeCode = (kodeUnikAset || barcode).replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Label_Aset_${safeCode}.pdf`);
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
