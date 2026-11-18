import React, { useMemo, useState } from 'react';
import { AppDatabase } from '../../services/db';
import { Asset } from '../../types';
import { BarcodeView } from '../BarcodeView';
import {
  Barcode,
  Search,
  Sliders,
  ArrowUp,
  Sparkles,
  RefreshCw,
  Smartphone,
  ExternalLink,
  AlertCircle,
  Check,
  Copy,
  FileText,
  Code2
} from 'lucide-react';
import {
  AlertTriangle,
  Link2
} from 'lucide-react';
import {
  BLUETOOTH_PRINT_APP_URL,
  buildAndroidReceiptResponseUrl,
  buildAndroidReceiptSchemeUrl,
  buildAndroidStickerResponseUrl,
  buildAndroidStickerSchemeUrl,
  getPublicBluetoothEndpoint,
  isAiStudioAuthProtectedHost,
  setPublicBluetoothEndpoint
} from '../../services/bluetoothPrintService';

export const BarcodeScannerThermal: React.FC = () => {
  // Search state
  const [searchBarcode, setSearchBarcode] = useState('');
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Custom Generator state
  const [customCode, setCustomCode] = useState('20495812');
  const [customName, setCustomName] = useState('Laptop ASUS ExpertBook B1');
  const [customFormat, setCustomFormat] = useState<'CODE128' | 'EAN8'>('CODE128');

  // Thermal Calibration
  const [pitchMm, setPitchMm] = useState<number>(28);
  const [paperFeedMm, setPaperFeedMm] = useState<number>(10);

  // Android Bluetooth Print Tester State
  const [btTestMode, setBtTestMode] = useState<'sticker' | 'receipt'>('sticker');
  const [docTitle, setDocTitle] = useState('BUKTI SERAH TERIMA LAYANAN IT');
  const [docSubtitle, setDocSubtitle] = useState('DOC-PUSDATIN-001');
  const [docBarcode, setDocBarcode] = useState('30918274');
  const [docLinesText, setDocLinesText] = useState(
    'Unit Kerja: Fakultas Teknik\nPetugas: Admin PUSDATIN\nStatus: Terverifikasi & Siap'
  );
  const [docLogoUrl, setDocLogoUrl] = useState('');
  const [docHtmlFooter, setDocHtmlFooter] = useState(
    '<center><b>PUSDATIN UMC CIREBON</b><br/>Dokumen sah cetak thermal</center>'
  );
  const [jsonPreview, setJsonPreview] = useState<string | null>(null);
  const [jsonPreviewError, setJsonPreviewError] = useState<string | null>(null);
  const [isFetchingJson, setIsFetchingJson] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Public Endpoint / Apps Script Relay state (for AI Studio preview where ais-dev/ais-pre requires login cookies)
  const isProtectedPreview = isAiStudioAuthProtectedHost();
  const [savedPublicEndpoint, setSavedPublicEndpoint] = useState<string>(() => getPublicBluetoothEndpoint());
  const [publicEndpointInput, setPublicEndpointInput] = useState<string>(() => getPublicBluetoothEndpoint());
  const [endpointNotice, setEndpointNotice] = useState<string | null>(null);
  const [showRelayGuide, setShowRelayGuide] = useState<boolean>(false);

  const parsedDocLines = useMemo(() => {
    return docLinesText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 10)
      .map(line => {
        const sepIndex = line.indexOf(':');
        if (sepIndex === -1) {
          return { label: 'Info', value: line };
        }
        return {
          label: line.slice(0, sepIndex).trim() || 'Info',
          value: line.slice(sepIndex + 1).trim() || '-'
        };
      });
  }, [docLinesText]);

  const activeResponseUrl = useMemo(() => {
    void savedPublicEndpoint;
    if (btTestMode === 'sticker') {
      return buildAndroidStickerResponseUrl({
        code: customCode || '20495812',
        name: customName || 'Test Print Thermal PUSDATIN UMC',
        kategori: 'Uji Cetak Android',
        lokasi: `Feed ${paperFeedMm}mm / Pitch ${pitchMm}mm`
      });
    }
    return buildAndroidReceiptResponseUrl({
      title: docTitle || 'DOKUMEN LAYANAN PAHAM',
      subtitle: docSubtitle || undefined,
      barcode: docBarcode || undefined,
      logoUrl: docLogoUrl.trim() || undefined,
      htmlContent: docHtmlFooter.trim() || undefined,
      lines: parsedDocLines
    });
  }, [
    savedPublicEndpoint,
    btTestMode,
    customCode,
    customName,
    paperFeedMm,
    pitchMm,
    docTitle,
    docSubtitle,
    docBarcode,
    docLogoUrl,
    docHtmlFooter,
    parsedDocLines
  ]);

  const activeSchemeUrl = useMemo(() => {
    void savedPublicEndpoint;
    if (btTestMode === 'sticker') {
      return buildAndroidStickerSchemeUrl({
        code: customCode || '20495812',
        name: customName || 'Test Print Thermal PUSDATIN UMC',
        kategori: 'Uji Cetak Android',
        lokasi: `Feed ${paperFeedMm}mm / Pitch ${pitchMm}mm`
      });
    }
    return buildAndroidReceiptSchemeUrl({
      title: docTitle || 'DOKUMEN LAYANAN PAHAM',
      subtitle: docSubtitle || undefined,
      barcode: docBarcode || undefined,
      logoUrl: docLogoUrl.trim() || undefined,
      htmlContent: docHtmlFooter.trim() || undefined,
      lines: parsedDocLines
    });
  }, [
    savedPublicEndpoint,
    btTestMode,
    customCode,
    customName,
    paperFeedMm,
    pitchMm,
    docTitle,
    docSubtitle,
    docBarcode,
    docLogoUrl,
    docHtmlFooter,
    parsedDocLines
  ]);

  const handleSearch = () => {
    const query = searchBarcode.trim();
    if (!query) {
      setSearchError('Masukkan kode barcode terlebih dahulu.');
      setFoundAsset(null);
      return;
    }
    const a = AppDatabase.getAssetByBarcode(query);
    if (a) {
      setFoundAsset(a);
      setSearchError(null);
    } else {
      setSearchError(`Barcode "${query}" tidak ditemukan dalam database aset.`);
      setFoundAsset(null);
    }
  };

  const handleGenerateRandomCode = () => {
    const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
    setCustomCode(random8);
  };

  const handlePreviewJson = async () => {
    setIsFetchingJson(true);
    setJsonPreviewError(null);
    try {
      const response = await fetch(activeResponseUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setJsonPreview(JSON.stringify(data, null, 2));
    } catch (err) {
      setJsonPreview(null);
      setJsonPreviewError(
        err instanceof Error ? `Gagal mengambil JSON endpoint: ${err.message}` : 'Gagal mengambil JSON endpoint.'
      );
    } finally {
      setIsFetchingJson(false);
    }
  };

  const handleCopySchemeUrl = async () => {
    try {
      await navigator.clipboard.writeText(activeSchemeUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pembuat & Cetak Barcode Thermal POS-58
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Buat barcode baru secara instan, cetak ulang barcode aset terdaftar, dan uji cetak stiker maupun dokumen struk via aplikasi Android Bluetooth Print.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Barcode Generator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Generator Barcode Instan</span>
            </h3>
            <button
              type="button"
              onClick={handleGenerateRandomCode}
              className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 font-bold bg-purple-50 px-2.5 py-1 rounded-md cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Generate Acak</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode Barcode
              </label>
              <input
                type="text"
                value={customCode}
                onChange={e => setCustomCode(e.target.value)}
                placeholder="Contoh: 20495812 / UMC-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Format
              </label>
              <select
                value={customFormat}
                onChange={e => setCustomFormat(e.target.value as 'CODE128' | 'EAN8')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="CODE128">CODE128 (Teks/Angka - Fleksibel)</option>
                <option value="EAN8">EAN8 (Standar 8 Angka)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Label Nama Barang
              </label>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Contoh: Laptop ASUS ExpertBook B1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Visual Barcode Component */}
          {customCode && (
            <div className="pt-2">
              <BarcodeView
                value={customCode}
                name={customName}
                format={customFormat}
                width={1.6}
                height={55}
                showActions={true}
              />
            </div>
          )}
        </div>

        {/* Search & Reprint Existing Asset Barcode */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-600" />
            <span>Cari Aset & Cetak Ulang Stiker</span>
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              data-testid="search-barcode-input"
              value={searchBarcode}
              onChange={e => {
                setSearchBarcode(e.target.value);
                if (searchError) setSearchError(null);
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Masukkan kode barcode (contoh: 30192847)..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
            <button
              type="button"
              data-testid="search-barcode-submit"
              onClick={handleSearch}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Cari
            </button>
          </div>

          {searchError && (
            <div
              role="alert"
              data-testid="barcode-search-error"
              className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{searchError}</span>
            </div>
          )}

          {foundAsset ? (
            <div className="space-y-3">
              <BarcodeView
                value={foundAsset.barcode}
                name={foundAsset.nama}
                format="CODE128"
                width={1.6}
                height={55}
                showActions={true}
              />
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 text-slate-600">
                <p><strong>Kategori:</strong> {foundAsset.kategori}</p>
                <p><strong>Lokasi:</strong> {foundAsset.lokasi}</p>
                <p><strong>Status:</strong> {foundAsset.status}</p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/80 text-center text-xs text-slate-400">
              Ketik kode barcode aset yang ingin dicetak ulang, lalu klik Cari.
            </div>
          )}
        </div>
      </div>

      {/* Printer Calibration Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-600" />
          <span>Kalibrasi Jarak Pitch & Feed Kertas Printer Label POS</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Ukuran stiker default PUSDATIN UMC adalah <strong>52 x 25 mm</strong> (1 baris roll thermal). Sesuaikan jarak celah agar posisi cetak pas di tengah.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Jarak Pitch Stiker (mm)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="20"
                max="60"
                value={pitchMm}
                onChange={e => setPitchMm(parseFloat(e.target.value) || 28)}
                className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
              />
              <span className="text-xs text-slate-500">Standar 28 mm (25mm stiker + 3mm celah)</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Uji Majukan Kertas (Feed mm)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={paperFeedMm}
                onChange={e => setPaperFeedMm(parseFloat(e.target.value) || 10)}
                className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setPaperFeedMm(prev => prev)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Gunakan tombol Test Print Android untuk menguji tarikan kertas langsung ke printer thermal"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Set {paperFeedMm} mm</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Android Bluetooth Print App Setup Guide & Live Tester */}
      <div
        data-testid="android-bt-guide-card"
        className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-emerald-950">
                Browser Print Android (Bluetooth Print / Thermer)
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Mendukung printer thermal Bluetooth & USB OTG via Chrome Android menggunakan protokol <code className="font-mono font-bold">my.bluetoothprint.scheme://&lt;RESPONSEURL&gt;</code> (Tipe 0: Teks, 1: Gambar/Logo, 2: Barcode, 4: HTML).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={BLUETOOTH_PRINT_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Play Store</span>
            </a>

            <button
              type="button"
              onClick={handlePreviewJson}
              disabled={isFetchingJson}
              data-testid="android-bt-preview-json-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{isFetchingJson ? 'Memuat JSON...' : 'Pratinjau JSON (<RESPONSEURL>)'}</span>
            </button>

            <a
              href={activeSchemeUrl}
              data-testid="android-bt-test-print"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{btTestMode === 'sticker' ? 'Test Print Stiker' : 'Test Print Dokumen'}</span>
            </a>
          </div>
        </div>

        {/* Diagnostic & Public Endpoint Override for AI Studio Preview Auth Wall */}
        <div
          data-testid="bt-endpoint-diagnostic-card"
          className={`rounded-xl border p-4 space-y-3 text-xs ${
            isProtectedPreview && !savedPublicEndpoint
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-white/90 border-emerald-200 text-slate-700'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isProtectedPreview && !savedPublicEndpoint ? 'text-amber-600' : 'text-emerald-600'
              }`}
            />
            <div className="space-y-1">
              <p className="font-bold">
                {isProtectedPreview && !savedPublicEndpoint
                  ? 'Perhatian Mode Preview (Penyebab Error "Invalid JSON Response: Value")'
                  : 'Pengaturan Endpoint Publik / Relay JSON Android'}
              </p>
              <p className="leading-relaxed">
                Aplikasi <strong>Thermer / Bluetooth Print</strong> mengambil JSON di luar sesi cookie Chrome Android.
                Pada URL preview berautentikasi Google (<code className="font-mono font-semibold">ais-dev-*</code> / <code className="font-semibold font-mono">ais-pre-*</code>), permintaan tanpa cookie diarahkan ke halaman HTML login sehingga muncul pesan <code className="font-mono font-bold">Invalid JSON Response: Value</code>.
                Solusi: <strong>Deploy aplikasi ke domain publik</strong> (tanpa login cookie) atau tempel <strong>URL Relay Publik (mis. Google Apps Script Web App <code className="font-mono">/exec</code>)</strong> di bawah ini agar seluruh tombol cetak thermal langsung berfungsi sekarang.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                data-testid="bt-public-endpoint-input"
                value={publicEndpointInput}
                onChange={e => {
                  setPublicEndpointInput(e.target.value);
                  if (endpointNotice) setEndpointNotice(null);
                }}
                placeholder="https://script.google.com/macros/s/.../exec atau https://paham.umc.ac.id"
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              type="button"
              data-testid="bt-public-endpoint-save"
              onClick={() => {
                const saved = setPublicBluetoothEndpoint(publicEndpointInput);
                setSavedPublicEndpoint(saved);
                setPublicEndpointInput(saved);
                setJsonPreview(null);
                setEndpointNotice(
                  saved
                    ? `Endpoint publik aktif disimpan: ${saved}`
                    : 'Endpoint dikembalikan ke origin bawaan browser.'
                );
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
            >
              Simpan Endpoint
            </button>
            {savedPublicEndpoint && (
              <button
                type="button"
                onClick={() => {
                  setPublicBluetoothEndpoint('');
                  setSavedPublicEndpoint('');
                  setPublicEndpointInput('');
                  setJsonPreview(null);
                  setEndpointNotice('Endpoint dikembalikan ke origin bawaan browser.');
                }}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer shrink-0"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowRelayGuide(prev => !prev)}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer shrink-0"
            >
              {showRelayGuide ? 'Tutup Skrip GAS' : 'Contoh Skrip Relay GAS'}
            </button>
          </div>

          {endpointNotice && (
            <p className="text-[11px] font-semibold text-emerald-700" data-testid="bt-endpoint-notice">
              {endpointNotice}
            </p>
          )}

          {showRelayGuide && (
            <div className="p-3 bg-slate-900 text-slate-100 rounded-lg space-y-1.5">
              <p className="text-[11px] text-emerald-300 font-bold">
                Deploy di Google Apps Script (Execute as: Me • Who has access: Anyone), lalu salin URL /exec:
              </p>
              <pre className="text-[11px] font-mono overflow-x-auto text-slate-100">{`function doGet(e) {
  var json = (e && e.parameter && e.parameter.payload) ? e.parameter.payload : "{}";
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}`}</pre>
            </div>
          )}
        </div>

        {/* Mode Switcher: Sticker vs Document Receipt */}
        <div className="bg-white/95 rounded-xl border border-emerald-200 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="bt-mode-sticker"
                onClick={() => {
                  setBtTestMode('sticker');
                  setJsonPreview(null);
                  setJsonPreviewError(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  btTestMode === 'sticker'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Mode Stiker Barcode (mode=sticker)</span>
              </button>
              <button
                type="button"
                data-testid="bt-mode-receipt"
                onClick={() => {
                  setBtTestMode('receipt');
                  setJsonPreview(null);
                  setJsonPreviewError(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  btTestMode === 'receipt'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Mode Dokumen / Struk (mode=receipt)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopySchemeUrl}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Tersalin!' : 'Salin Link Scheme'}</span>
            </button>
          </div>

          {btTestMode === 'receipt' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Dokumen (Tipe 0)</label>
                <input
                  type="text"
                  data-testid="bt-doc-title"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor / Subjudul Dokumen (Tipe 0)</label>
                <input
                  type="text"
                  data-testid="bt-doc-subtitle"
                  value={docSubtitle}
                  onChange={e => setDocSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Barcode Dokumen / Aset (Tipe 2 - Opsional)</label>
                <input
                  type="text"
                  value={docBarcode}
                  onChange={e => setDocBarcode(e.target.value)}
                  placeholder="Kosongkan jika tanpa barcode"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Gambar / Logo Header (Tipe 1 - Opsional)</label>
                <input
                  type="url"
                  data-testid="bt-doc-logo"
                  value={docLogoUrl}
                  onChange={e => setDocLogoUrl(e.target.value)}
                  placeholder="https://.../logo-pusdatin.png (kosongkan jika teks saja)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Baris Konten Dokumen (Format: Label: Nilai)</label>
                <textarea
                  rows={3}
                  value={docLinesText}
                  onChange={e => setDocLinesText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode HTML Footer (Tipe 4 - Opsional)</label>
                <textarea
                  rows={3}
                  data-testid="bt-doc-html"
                  value={docHtmlFooter}
                  onChange={e => setDocHtmlFooter(e.target.value)}
                  placeholder="<center><b>PUSDATIN UMC</b></center>"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              Mode stiker menggunakan data <strong>Generator Barcode Instan</strong> di atas (<span className="font-mono font-bold">{customCode || '20495812'}</span> — {customName || 'Aset'}) dan kalibrasi feed/pitch aktif. Ubah ke <strong>Mode Dokumen / Struk</strong> untuk mencetak formulir, tanda terima, atau uji format HTML & Logo.
            </p>
          )}

          {/* Active RESPONSEURL & Live JSON Output */}
          <div className="space-y-2">
            <div className="p-2.5 bg-slate-900 text-emerald-300 rounded-lg text-[11px] font-mono break-all">
              <span className="text-slate-400 select-none">Scheme URI: </span>
              {activeSchemeUrl}
            </div>

            {jsonPreviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{jsonPreviewError}</span>
              </div>
            )}

            {jsonPreview && (
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Respons JSON Endpoint (JSON_FORCE_OBJECT)
                </p>
                <pre
                  data-testid="android-bt-json-preview"
                  className="p-3 bg-slate-950 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800"
                >
                  {jsonPreview}
                </pre>
              </div>
            )}
          </div>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-emerald-950">
          <li className="bg-white/90 rounded-lg border border-emerald-200 p-3 space-y-1">
            <span className="font-bold block text-emerald-700">1. Aktifkan Browser Print</span>
            <span>Buka aplikasi <strong>Bluetooth Print</strong> di HP/Tablet Android Anda, hubungkan ke printer thermal Bluetooth/USB, lalu aktifkan opsi <strong>Browser Print</strong> di menu Settings.</span>
          </li>
          <li className="bg-white/90 rounded-lg border border-emerald-200 p-3 space-y-1">
            <span className="font-bold block text-emerald-700">2. Buka Web di Chrome Android</span>
            <span>Akses portal PAHAM PUSDATIN UMC melalui browser Chrome di Android pada URL aktif saat ini.</span>
          </li>
          <li className="bg-white/90 rounded-lg border border-emerald-200 p-3 space-y-1">
            <span className="font-bold block text-emerald-700">3. Klik Cetak Thermal Android</span>
            <span>Tekan tombol cetak thermal pada kartu barcode, Peminjaman Aset, Tiket Helpdesk, Buku Penerimaan/Pengeluaran, atau modul uji di atas untuk mencetak langsung.</span>
          </li>
        </ol>
      </div>
    </div>
  );
};
