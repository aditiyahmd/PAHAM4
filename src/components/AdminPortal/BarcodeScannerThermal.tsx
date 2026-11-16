import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { Asset } from '../../types';
import { BarcodeView } from '../BarcodeView';
import { Barcode, Search, Sliders, ArrowUp, Sparkles, RefreshCw, Smartphone, ExternalLink } from 'lucide-react';
import {
  BLUETOOTH_PRINT_APP_URL,
  buildAndroidStickerSchemeUrl
} from '../../services/bluetoothPrintService';

export const BarcodeScannerThermal: React.FC = () => {
  // Search state
  const [searchBarcode, setSearchBarcode] = useState('');
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);

  // Custom Generator state
  const [customCode, setCustomCode] = useState('20495812');
  const [customName, setCustomName] = useState('Laptop ASUS ExpertBook B1');
  const [customFormat, setCustomFormat] = useState<'CODE128' | 'EAN8'>('CODE128');

  // Thermal Calibration
  const [pitchMm, setPitchMm] = useState<number>(28);
  const [paperFeedMm, setPaperFeedMm] = useState<number>(10);

  const handleSearch = () => {
    if (!searchBarcode.trim()) return;
    const a = AppDatabase.getAssetByBarcode(searchBarcode.trim());
    if (a) {
      setFoundAsset(a);
    } else {
      alert('Barcode tidak ditemukan dalam database.');
      setFoundAsset(null);
    }
  };

  const handleGenerateRandomCode = () => {
    const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
    setCustomCode(random8);
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
              Buat barcode baru secara instan, cetak ulang barcode aset terdaftar, dan kalibrasi posisi cetak stiker thermal 52 x 25 mm pada printer struk POS 58mm.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Barcode Generator (Can make any barcode immediately!) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Generator Barcode Instan</span>
            </h3>
            <button
              type="button"
              onClick={handleGenerateRandomCode}
              className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 font-bold bg-purple-50 px-2.5 py-1 rounded-md"
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
                onChange={e => setCustomFormat(e.target.value as any)}
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
              value={searchBarcode}
              onChange={e => setSearchBarcode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Masukkan kode barcode (contoh: 30192847)..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
            >
              Cari
            </button>
          </div>

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

      {/* Android Bluetooth Print App Setup Guide & Test Print */}
      <div
        data-testid="android-bt-guide-card"
        className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-emerald-950">
                Cetak Langsung dari Android (Aplikasi Bluetooth Print)
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Mendukung printer thermal Bluetooth maupun USB OTG melalui browser Chrome Android menggunakan skema <code className="font-mono font-bold">my.bluetoothprint.scheme://</code>.
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
              <span>Unduh Aplikasi (Play Store)</span>
            </a>

            <a
              href={buildAndroidStickerSchemeUrl({
                code: customCode || '20495812',
                name: customName || 'Test Print Thermal PUSDATIN UMC',
                kategori: 'Uji Cetak Android',
                lokasi: `Feed ${paperFeedMm}mm / Pitch ${pitchMm}mm`
              })}
              data-testid="android-bt-test-print"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Test Print via Android</span>
            </a>
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
            <span className="font-bold block text-emerald-700">3. Klik Print Thermal Android</span>
            <span>Tekan tombol hijau <strong>Print Thermal Android</strong> pada kartu barcode atau struk tiket; aplikasi Bluetooth Print otomatis mengambil data JSON dan mencetak ke printer.</span>
          </li>
        </ol>
      </div>
    </div>
  );
};
