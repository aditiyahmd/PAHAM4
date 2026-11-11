import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { EmailNotificationService } from '../../services/emailService';
import { DamageTicket, Asset, TicketUrgency } from '../../types';
import { SubmissionSuccessModal } from '../Modals/SubmissionSuccessModal';
import { BarcodeScannerModal } from '../Modals/BarcodeScannerModal';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Send,
  Search,
  Building,
  Phone,
  User,
  Sparkles,
  ShieldCheck,
  Cpu,
  Flame
} from 'lucide-react';

interface DamageReportFormProps {
  onSuccessSubmit: (ticket: DamageTicket) => void;
  onNavigateTab?: (tabId: string, searchTicketId?: string) => void;
}

export const DamageReportForm: React.FC<DamageReportFormProps> = ({
  onSuccessSubmit,
  onNavigateTab
}) => {
  const [barcode, setBarcode] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [customLokasi, setCustomLokasi] = useState('');
  const [pelapor, setPelapor] = useState('');
  const [kontak, setKontak] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [urgensi, setUrgensi] = useState<TicketUrgency>('Sedang');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<DamageTicket | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const masterLocations = AppDatabase.getMasterLocations();

  // Smart PIC Live preview detection
  const detectedPic = AppDatabase.determinePic(`${namaBarang} ${deskripsi}`);

  const handleBarcodeLookup = () => {
    if (!barcode.trim()) return;
    setIsSearchingBarcode(true);
    const asset = AppDatabase.getAssetByBarcode(barcode.trim());
    setTimeout(() => {
      if (asset) {
        setNamaBarang(asset.nama);
        setLokasi(asset.lokasi);
      } else {
        alert('Barcode tidak ditemukan di database. Anda tetap dapat mengisi nama barang secara manual.');
      }
      setIsSearchingBarcode(false);
    }, 200);
  };

  const handleBarcodeDetectedFromScanner = (scannedBarcode: string, asset?: Asset) => {
    setBarcode(scannedBarcode);
    if (asset) {
      setNamaBarang(asset.nama);
      setLokasi(asset.lokasi);
    } else {
      const found = AppDatabase.getAssetByBarcode(scannedBarcode);
      if (found) {
        setNamaBarang(found.nama);
        setLokasi(found.lokasi);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = lokasi === 'Lainnya' ? customLokasi.trim() : (lokasi.trim() || masterLocations[0]);

    if (!namaBarang || !finalLocation || !deskripsi) {
      alert('Harap isi Nama Barang, Lokasi, dan Deskripsi Kerusakan!');
      return;
    }

    const matchedAsset = barcode ? AppDatabase.getAssetByBarcodeOrUnique(barcode) : undefined;

    const newTicket = AppDatabase.addDamageTicket({
      barcode: barcode.trim() || 'Tanpa Barcode',
      kodeUnikAset: matchedAsset?.kodeUnikAset || (barcode.trim() ? `AST-UMC-${barcode.trim()}` : 'AST-NON-TAG'),
      namaBarang: namaBarang.trim(),
      pelapor: pelapor.trim() || 'Civitas UMC',
      kontakPelapor: kontak.trim() || '081234567890',
      emailPelapor: 'civitas@umc.ac.id',
      lokasi: finalLocation,
      lokasiAwal: finalLocation,
      deskripsi: deskripsi.trim(),
      kategoriMasalah: detectedPic.role.includes('Cloud') ? 'Jaringan / Server / Cloud' : detectedPic.role.includes('Cyber') ? 'Keamanan / Email' : detectedPic.role.includes('Analyst') ? 'Software / Sistem' : 'Hardware',
      prioritas: urgensi,
      urgensi: urgensi
    });

    EmailNotificationService.sendDamageReportSubmitted(newTicket);
    setSubmittedTicket(newTicket);
    setShowSuccessModal(true);
    onSuccessSubmit(newTicket);

    // Reset Form
    setBarcode('');
    setNamaBarang('');
    setLokasi('');
    setCustomLokasi('');
    setPelapor('');
    setKontak('');
    setDeskripsi('');
    setUrgensi('Sedang');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Lapor Kerusakan Aset & Fasilitas IT
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Laporkan gangguan perangkat komputer, jaringan Wi-Fi, proyektor kelas, atau printer kampus untuk segera ditangani oleh tim teknis PUSDATIN UMC.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        {/* Scan Barcode Assist Box with Interactive Camera Button */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Barcode Aset (Opsional - Jika Aset Memiliki Stiker Barcode PUSDATIN)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeLookup(); } }}
                placeholder="Scan stiker atau ketik kode barcode (contoh: 30192848)"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleBarcodeLookup}
                disabled={isSearchingBarcode || !barcode}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCameraModal(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
                title="Buka Kamera untuk foto / scan barcode langsung"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Foto / Scan Barcode</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Jika barcode discan atau difoto, data nama perangkat dan lokasi akan terisi otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Perangkat / Barang <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={namaBarang}
              onChange={e => setNamaBarang(e.target.value)}
              placeholder="Contoh: Proyektor InFocus Ruang 302 / PC Lab / Access Point"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>

          {/* Master Lokasi Dropdown (Enhancement B.5: User tinggal pilih, tidak perlu ketik manual) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lokasi Aset Ditempatkan / Ditemukan <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                required
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              >
                <option value="">-- Pilih Lokasi Ruangan / Gedung Kampus --</option>
                {masterLocations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                <option value="Lainnya">+ Tulis Lokasi Lainnya...</option>
              </select>
            </div>

            {lokasi === 'Lainnya' && (
              <input
                type="text"
                required
                value={customLokasi}
                onChange={e => setCustomLokasi(e.target.value)}
                placeholder="Tuliskan nama ruangan / lokasi lengkap..."
                className="w-full mt-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Pelapor <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={pelapor}
                onChange={e => setPelapor(e.target.value)}
                placeholder="Nama dosen / staf / mahasiswa pelapor"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nomor WhatsApp Pelapor (Aktif) <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={kontak}
                onChange={e => setKontak(e.target.value)}
                placeholder="Contoh: 081234567890 (Untuk konfirmasi kedatangan teknisi)"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Nomor tiket dan konfirmasi jadwal teknisi akan dikirimkan ke nomor ini.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Deskripsi Kerusakan / Gejala Masalah <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={deskripsi}
              onChange={e => setDeskripsi(e.target.value)}
              placeholder="Jelaskan detail kendala (contoh: lampu indikator merah, tampilan proyektor bergaris, Wi-Fi tidak memancarkan sinyal SSID, laptop tidak bisa booting ke Windows, dsb.)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>

          {/* User Request 2: Tingkat Urgensi Laporan */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tingkat Urgensi Kerusakan <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  urgensi === 'Kritis'
                    ? 'border-red-600 bg-red-50/70 text-red-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-red-700">
                    <Flame className="w-3.5 h-3.5 animate-pulse text-red-600" />
                    <span>Kritis</span>
                  </div>
                  <input
                    type="radio"
                    name="urgensi"
                    value="Kritis"
                    checked={urgensi === 'Kritis'}
                    onChange={() => setUrgensi('Kritis')}
                    className="text-red-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-1.5 leading-snug">
                  Menghentikan perkuliahan, ujian, server, atau layanan utama rektorat.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  urgensi === 'Tinggi'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tinggi</span>
                  </div>
                  <input
                    type="radio"
                    name="urgensi"
                    value="Tinggi"
                    checked={urgensi === 'Tinggi'}
                    onChange={() => setUrgensi('Tinggi')}
                    className="text-amber-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-1.5 leading-snug">
                  Perangkat utama lab komputer / dosen rusak, sangat mendesak.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  urgensi === 'Sedang'
                    ? 'border-sky-600 bg-sky-50/70 text-sky-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sky-700">
                    <span>Sedang (Normal)</span>
                  </div>
                  <input
                    type="radio"
                    name="urgensi"
                    value="Sedang"
                    checked={urgensi === 'Sedang'}
                    onChange={() => setUrgensi('Sedang')}
                    className="text-sky-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-1.5 leading-snug">
                  Kerusakan standar harian, masih ada perangkat cadangan.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  urgensi === 'Rendah'
                    ? 'border-slate-600 bg-slate-100 text-slate-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span>Rendah</span>
                  </div>
                  <input
                    type="radio"
                    name="urgensi"
                    value="Rendah"
                    checked={urgensi === 'Rendah'}
                    onChange={() => setUrgensi('Rendah')}
                    className="text-slate-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-1.5 leading-snug">
                  Kerusakan kosmetik, kabel pelindung, atau minor non-krusial.
                </p>
              </label>
            </div>
          </div>

          {/* Smart PIC Routing Detection Live Preview */}
          {(namaBarang.trim() || deskripsi.trim()) && (
            <div className="md:col-span-2 p-3 bg-linear-to-r from-slate-50 to-amber-50/50 rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Cpu className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Klasifikasi Penugasan Otomatis:</strong> Tiket ini akan diarahkan ke{' '}
                  <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    {detectedPic.role} ({detectedPic.name})
                  </span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Auto-Assigned PIC</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Laporan Kerusakan</span>
          </button>
        </div>
      </form>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onSelectBarcode={handleBarcodeDetectedFromScanner}
        title="Foto / Scan Barcode Aset"
        description="Arahkan kamera ke stiker barcode fisik aset PUSDATIN UMC untuk auto-fill nama dan lokasi barang."
      />

      {/* Global Interactive Success Modal for Civitas */}
      <SubmissionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        ticketType="damage"
        damageTicket={submittedTicket}
        onNavigateToCheckProgress={ticketId => {
          if (onNavigateTab) {
            onNavigateTab('cek-progres', ticketId);
          }
        }}
      />
    </div>
  );
};
