import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Download, Printer, Copy, Check } from 'lucide-react';

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
  height = 56,
  displayValue = true,
  fontSize = 14,
  showActions = true,
  className = '',
  isStickerCard = true
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
          displayValue,
          fontSize,
          font: 'JetBrains Mono, monospace',
          textMargin: 4,
          margin: 6,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (err) {
        console.error('Error rendering barcode with JsBarcode', err);
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  const copyCode = () => {
    navigator.clipboard.writeText(value.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBarcodePng = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = (svgElement.clientWidth || 280) * 2;
      canvas.height = (svgElement.clientHeight || 110) * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(image, 0, 0);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Barcode_${value}_${(name || 'Aset').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        downloadLink.href = pngUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const printThermalLabel = () => {
    const printWin = window.open('', '_blank', 'width=380,height=300');
    if (!printWin) {
      alert('Harap izinkan popup browser untuk mencetak stiker thermal.');
      return;
    }

    const svgHtml = svgRef.current ? svgRef.current.outerHTML : '';
    const cleanTitle = name ? name.replace(/"/g, '&quot;') : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stiker Barcode - ${value}</title>
        <style>
          @page { size: 58mm 28mm; margin: 0; }
          body {
            margin: 0;
            padding: 1.5mm 0 0 0;
            font-family: Arial, sans-serif;
            width: 48mm;
            text-align: center;
            box-sizing: border-box;
          }
          .brand {
            font-size: 7pt;
            font-weight: bold;
            letter-spacing: 0.5px;
            color: #000;
            margin-bottom: 0.5mm;
          }
          .barcode-container svg {
            display: block;
            margin: 0 auto;
            max-width: 44mm;
            height: 12mm;
          }
          .title {
            font-size: 8pt;
            font-weight: bold;
            margin-top: 0.8mm;
            line-height: 1.1;
            max-height: 6.5mm;
            overflow: hidden;
            word-break: break-word;
          }
          .code {
            font-size: 7.5pt;
            font-family: monospace;
            font-weight: bold;
            margin-top: 0.4mm;
          }
        </style>
      </head>
      <body>
        <div class="brand">PUSDATIN UMC</div>
        <div class="barcode-container">
          ${svgHtml}
        </div>
        ${cleanTitle ? `<div class="title">${cleanTitle}</div>` : ''}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col ${className}`}>
      {isStickerCard && (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-[11px]">
          <span className="font-bold tracking-wider uppercase text-slate-200">
            PUSDATIN UMC · ASET RESMI
          </span>
          <span className="text-slate-400 font-mono text-[10px]">
            52 x 25 mm
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col items-center justify-center text-center">
        {name && (
          <h4 className="font-bold text-sm text-slate-900 mb-2 leading-snug px-2 max-w-sm">
            {name}
          </h4>
        )}

        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs overflow-hidden flex justify-center w-full max-w-[320px]">
          <svg ref={svgRef} className="max-w-full h-auto" />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 tracking-wider">
            {value}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
            title="Salin kode barcode"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {(kategori || lokasi) && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 text-[11px] text-slate-500">
            {kategori && <span>{kategori}</span>}
            {kategori && lokasi && <span>·</span>}
            {lokasi && <span className="line-clamp-1">{lokasi}</span>}
          </div>
        )}
      </div>

      {showActions && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={downloadBarcodePng}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh PNG</span>
          </button>

          <button
            type="button"
            onClick={printThermalLabel}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Stiker</span>
          </button>
        </div>
      )}
    </div>
  );
};
