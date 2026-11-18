import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { PdfReportService, MonthlyReportParams } from '../../services/pdfReportService';
import { computeAggregateSlaStats, formatMinutesLabel, formatHoursLabel } from '../../services/slaService';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  FileCheck,
  Layers,
  Wrench,
  Users,
  PackageSearch,
  Flame,
  AlertTriangle,
  Building,
  TrendingUp,
  Clock,
  Printer,
  RefreshCw
} from 'lucide-react';

export const MonthlyReportPdf: React.FC = () => {
  const [selectedBulan, setSelectedBulan] = useState('November');
  const [selectedTahun, setSelectedTahun] = useState('2026');
  const [selectedTipe, setSelectedTipe] = useState<'Semua' | 'Peminjaman' | 'Kerusakan' | 'Aset Terkini' | 'Suku Cadang' | 'Kinerja PIC'>('Semua');
  const [kepalaNama, setKepalaNama] = useState(() => AppDatabase.getDocumentSignatories().kepalaPusdatinNama);
  const [kepalaNip, setKepalaNip] = useState(() => AppDatabase.getDocumentSignatories().kepalaPusdatinNip);
  const [petugasNama, setPetugasNama] = useState(() => AppDatabase.getDocumentSignatories().petugasDefaultNama);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const assets = AppDatabase.getAssets();
  const loans = AppDatabase.getLoans();
  const damages = AppDatabase.getDamageTickets();
  const logs = AppDatabase.getLogs();
  const spareParts = AppDatabase.getAllSpareParts();
  const picPerformance = AppDatabase.getPicPerformanceReport();
  const slaSummary = computeAggregateSlaStats(damages, AppDatabase.getSlaConfig());

  // Asset Metrics
  const totalAssets = assets.length;
  const assetsTersedia = assets.filter(a => a.status === 'Tersedia').length;
  const assetsDipinjam = assets.filter(a => a.status === 'Dipinjam').length;
  const assetsRusak = assets.filter(a => a.status === 'Rusak' || a.status === 'Diperbaiki' || a.status === 'Rusak Total').length;

  // Category breakdown
  const categoryCounts = assets.reduce((acc, curr) => {
    acc[curr.kategori] = (acc[curr.kategori] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Loan Metrics
  const loansPending = loans.filter(l => l.status === 'Menunggu').length;
  const loansAktif = loans.filter(l => l.status === 'Disetujui').length;
  const loansKembali = loans.filter(l => l.status === 'Dikembalikan').length;
  const loansTerlambat = loans.filter(l => l.status === 'Terlambat').length;

  // Damage Urgency Metrics
  const damageKritis = damages.filter(d => d.urgensi === 'Kritis').length;
  const damageTinggi = damages.filter(d => d.urgensi === 'Tinggi').length;
  const damageSedang = damages.filter(d => d.urgensi === 'Sedang' || !d.urgensi).length;
  const damageRendah = damages.filter(d => d.urgensi === 'Rendah').length;

  // Spare Parts Metrics
  const sparePartsBelumBeli = spareParts.filter(s => s.statusPengadaan === 'Belum Dibeli').length;
  const sparePartsSudahBeli = spareParts.filter(s => s.statusPengadaan === 'Sudah Dibeli').length;
  const sparePartsDigunakan = spareParts.filter(s => s.statusPengadaan === 'Sudah Digunakan').length;

  const handleLoadFromMasterSignatories = () => {
    const sig = AppDatabase.getDocumentSignatories();
    setKepalaNama(sig.kepalaPusdatinNama);
    setKepalaNip(sig.kepalaPusdatinNip);
    setPetugasNama(sig.petugasDefaultNama);
  };

  const handleDownloadPdf = () => {
    setIsGenerating(true);

    if (saveAsDefault && kepalaNama.trim()) {
      const current = AppDatabase.getDocumentSignatories();
      AppDatabase.setDocumentSignatories({
        ...current,
        kepalaPusdatinNama: kepalaNama.trim(),
        kepalaPusdatinNip: kepalaNip.trim(),
        petugasDefaultNama: petugasNama.trim() || current.petugasDefaultNama
      });
    }

    setTimeout(() => {
      try {
        const reportParams: MonthlyReportParams = {
          bulan: selectedBulan,
          tahun: selectedTahun,
          tipeLaporan: selectedTipe,
          kepalaPusdatin: kepalaNama.trim(),
          nipKepala: kepalaNip.trim(),
          petugas: petugasNama.trim(),
          assets,
          loans,
          damages,
          logs,
          spareParts,
          picPerformance
        };

        const doc = PdfReportService.generateMonthlyReport(reportParams);
        doc.save(`Laporan_PUSDATIN_UMC_${selectedBulan}_${selectedTahun}_${selectedTipe}.pdf`);
      } catch (err: any) {
        console.error('PDF error', err);
        alert(`Gagal membuat PDF: ${err.message}`);
      } finally {
        setIsGenerating(false);
      }
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pusat Pelaporan Bulanan & Kinerja PUSDATIN UMC
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Rekapitulasi berkas resmi (PDF A4 Landscape) lengkap dengan ringkasan jumlah aset, transaksi peminjaman, tiket kerusakan, pengadaan suku cadang, dan kinerja masing-masing PIC/teknisi.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isGenerating}
          onClick={handleDownloadPdf}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-colors shrink-0 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isGenerating ? 'Menyusun Berkas...' : 'Unduh Laporan Resmi (PDF)'}</span>
        </button>
      </div>

      {/* Control Panel: Periode & Parameter */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-600" />
            <span>Parameter Periode & Cakupan Laporan</span>
          </h3>
          <span className="text-xs text-slate-500">Standar Berita Acara Universitas Muhammadiyah Cirebon</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Bulan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Bulan Laporan
            </label>
            <select
              value={selectedBulan}
              onChange={e => setSelectedBulan(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tahun Anggaran
            </label>
            <select
              value={selectedTahun}
              onChange={e => setSelectedTahun(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Cakupan Data */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cakupan Data Rekapitulasi
            </label>
            <select
              value={selectedTipe}
              onChange={e => setSelectedTipe(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Semua">Semua Bab (Lengkap & Komprehensif)</option>
              <option value="Kinerja PIC">Khusus Rekap Kinerja & Tiket PIC Teknisi</option>
              <option value="Suku Cadang">Khusus Kebutuhan & Pengadaan Suku Cadang</option>
              <option value="Kerusakan">Khusus Tiket Kerusakan & Urgensi</option>
              <option value="Peminjaman">Khusus Log Transaksi Peminjaman</option>
              <option value="Aset Terkini">Khusus Master Data Aset & Kondisi</option>
            </select>
          </div>
        </div>

        {/* Pengaturan Penandatangan (Kepala PUSDATIN & Petugas) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Identitas Penandatangan Dokumen Resmi (Mengikuti Master Penandatangan)
            </h4>
            <button
              type="button"
              onClick={handleLoadFromMasterSignatories}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Muat dari Master Penandatangan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Kepala PUSDATIN UMC:
              </label>
              <input
                type="text"
                value={kepalaNama}
                onChange={e => setKepalaNama(e.target.value)}
                placeholder="Agust Isa Martinus, M.T."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                NIDN / NIP Kepala PUSDATIN:
              </label>
              <input
                type="text"
                value={kepalaNip}
                onChange={e => setKepalaNip(e.target.value)}
                placeholder="NIDN. 0418077501"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Petugas Pengelola Aset:
              </label>
              <input
                type="text"
                value={petugasNama}
                onChange={e => setPetugasNama(e.target.value)}
                placeholder="Aditiya Ahmad Fadila, S.T."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5 VISUAL SUMMARY SECTIONS (USER REQUEST 5) */}

      {/* 1. RINGKASAN JUMLAH ASET */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">1. Ringkasan Jumlah Aset Kampus</h3>
              <p className="text-xs text-slate-500">Distribusi inventaris berdasarkan status kesiapan dan kategori barang</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-red-50 text-red-700 rounded-lg border border-red-200">
            Total {totalAssets} Unit Aset
          </span>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <span className="text-[11px] font-semibold text-emerald-800 block">Tersedia di PUSDATIN</span>
            <span className="font-mono text-xl font-bold text-emerald-700">{assetsTersedia}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Siap dialokasikan / dipinjam</span>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-[11px] font-semibold text-blue-800 block">Sedang Dipinjam</span>
            <span className="font-mono text-xl font-bold text-blue-700">{assetsDipinjam}</span>
            <span className="text-[10px] text-blue-600 block mt-0.5">Digunakan dosen / unit</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
            <span className="text-[11px] font-semibold text-amber-800 block">Dalam Perbaikan / Servis</span>
            <span className="font-mono text-xl font-bold text-amber-700">{assets.filter(a => a.status === 'Diperbaiki').length}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">Penanganan teknisi</span>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
            <span className="text-[11px] font-semibold text-rose-800 block">Rusak / Afkir Total</span>
            <span className="font-mono text-xl font-bold text-rose-700">{assets.filter(a => a.status === 'Rusak' || a.status === 'Rusak Total').length}</span>
            <span className="text-[10px] text-rose-600 block mt-0.5">Tidak dapat dipinjam</span>
          </div>
        </div>

        {/* Category Breakdown Badges */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-700 block mb-2">Sebaran per Kategori Aset:</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryCounts).map(([cat, cnt]) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-1.5"
              >
                <span>{cat}:</span>
                <strong className="font-mono text-red-700">{cnt}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TRANSAKSI PEMINJAMAN */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">2. Transaksi Peminjaman Aset Sivitas</h3>
              <p className="text-xs text-slate-500">Aktivitas peminjaman perangkat IT untuk perkuliahan, rapat, dan kegiatan kampus</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            {loans.length} Total Transaksi
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-600 block">Menunggu Konfirmasi</span>
            <span className="font-mono text-xl font-bold text-slate-800">{loansPending}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Verifikasi PUSDATIN</span>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-[11px] font-semibold text-blue-800 block">Peminjaman Aktif</span>
            <span className="font-mono text-xl font-bold text-blue-700">{loansAktif}</span>
            <span className="text-[10px] text-blue-600 block mt-0.5">Sedang digunakan</span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <span className="text-[11px] font-semibold text-emerald-800 block">Selesai Dikembalikan</span>
            <span className="font-mono text-xl font-bold text-emerald-700">{loansKembali}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Aset kembali utuh</span>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
            <span className="text-[11px] font-semibold text-rose-800 block">Terlambat Kembali</span>
            <span className="font-mono text-xl font-bold text-rose-700">{loansTerlambat}</span>
            <span className="text-[10px] text-rose-600 block mt-0.5">Perlu tindak lanjut WA</span>
          </div>
        </div>
      </div>

      {/* 3. REKAPITULASI TIKET RUSAK & TINGKAT URGENSI */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">3. Rekapitulasi Tiket Kerusakan & Urgensi</h3>
              <p className="text-xs text-slate-500">Klasifikasi tingkat keparahan laporan kerusakan perangkat untuk prioritas penanganan</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
            {damages.length} Tiket Masuk
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-red-300 bg-red-50/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-900">Urgensi Kritis</span>
              <Flame className="w-4 h-4 text-red-600 animate-pulse" />
            </div>
            <span className="font-mono text-xl font-bold text-red-700 block mt-1">{damageKritis} Tiket</span>
            <span className="text-[10px] text-red-600 block mt-0.5">Server / Lab Mati Total</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/60">
            <span className="text-[11px] font-bold text-amber-900 block">Urgensi Tinggi</span>
            <span className="font-mono text-xl font-bold text-amber-700 block mt-1">{damageTinggi} Tiket</span>
            <span className="text-[10px] text-amber-700 block mt-0.5">Mengganggu operasional</span>
          </div>

          <div className="p-3.5 rounded-xl border border-sky-300 bg-sky-50/60">
            <span className="text-[11px] font-bold text-sky-900 block">Urgensi Sedang</span>
            <span className="font-mono text-xl font-bold text-sky-700 block mt-1">{damageSedang} Tiket</span>
            <span className="text-[10px] text-sky-700 block mt-0.5">Kendala parsial / lambat</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
            <span className="text-[11px] font-bold text-slate-800 block">Urgensi Rendah</span>
            <span className="font-mono text-xl font-bold text-slate-700 block mt-1">{damageRendah} Tiket</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Pemeliharaan berkala</span>
          </div>
        </div>

        {/* Ringkasan Performa SLA FRT & RT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs">
            <span className="text-[11px] font-bold text-indigo-900 block">Kepatuhan FRT (First Response)</span>
            <span className="font-mono text-lg font-extrabold text-indigo-700">{slaSummary.frtComplianceRate}%</span>
            <span className="text-[10px] text-indigo-700 block">Rata-rata: {formatMinutesLabel(slaSummary.avgFrtMinutes)}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
            <span className="text-[11px] font-bold text-emerald-900 block">Kepatuhan RT (Resolution Time)</span>
            <span className="font-mono text-lg font-extrabold text-emerald-700">{slaSummary.rtComplianceRate}%</span>
            <span className="text-[10px] text-emerald-700 block">Rata-rata: {formatHoursLabel(slaSummary.avgRtHours)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-800 block">Tiket Melewati Batas SLA</span>
            <span className="font-mono text-lg font-extrabold text-rose-700">
              {slaSummary.frtOverdueCount} FRT / {slaSummary.rtOverdueCount} RT
            </span>
            <span className="text-[10px] text-slate-500 block">Evaluasi komitmen layanan PUSDATIN</span>
          </div>
        </div>
      </div>

      {/* 4. REKAPITULASI SUKU CADANG */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <PackageSearch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">4. Rekapitulasi Kebutuhan Suku Cadang</h3>
              <p className="text-xs text-slate-500">Monitoring pengadaan spare part dari tiket kerusakan (Belum Dibeli, Sudah Dibeli, Sudah Digunakan)</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-300">
            {spareParts.length} Komponen Terdata
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
            <span className="text-xs font-bold text-rose-900 block">⏳ Belum Dibeli (Perlu Pengadaan)</span>
            <span className="font-mono text-2xl font-bold text-rose-700 block mt-1">{sparePartsBelumBeli} Unit</span>
            <span className="text-[11px] text-rose-700 block mt-1">Perlu diajukan ke RKAT / bagian belanja kampus</span>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-xs font-bold text-blue-900 block">📦 Sudah Dibeli (Tiba di PUSDATIN)</span>
            <span className="font-mono text-2xl font-bold text-blue-700 block mt-1">{sparePartsSudahBeli} Unit</span>
            <span className="text-[11px] text-blue-700 block mt-1">Komponen tersedia, siap dipasang teknisi</span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <span className="text-xs font-bold text-emerald-900 block">✅ Sudah Digunakan (Terpasang)</span>
            <span className="font-mono text-2xl font-bold text-emerald-700 block mt-1">{sparePartsDigunakan} Unit</span>
            <span className="text-[11px] text-emerald-700 block mt-1">Perbaikan selesai dan unit beroperasi normal</span>
          </div>
        </div>
      </div>

      {/* 5. REKAPITULASI KINERJA & TIKET DI MASING-MASING PIC / TEKNISI */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">5. Kinerja & Penanganan Tiket per PIC / Teknisi</h3>
              <p className="text-xs text-slate-500">Statistik beban kerja, rasio penyelesaian, dan penugasan per personil teknis PUSDATIN</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg border border-violet-200">
            {picPerformance.length} Personil Teknis
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nama Petugas / PIC</th>
                <th className="px-4 py-3">Bidang Spesialisasi</th>
                <th className="px-4 py-3">Jenjang</th>
                <th className="px-4 py-3 text-center">Tiket Selesai</th>
                <th className="px-4 py-3 text-center">Dalam Proses</th>
                <th className="px-4 py-3 text-center">Total Beban</th>
                <th className="px-4 py-3 text-center">Tingkat Penyelesaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {picPerformance.map(p => (
                <tr key={p.technicianId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <div>{p.technicianName}</div>
                    <span className="font-mono text-[10px] text-slate-500">{p.technicianId}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.level === 'Lead' ? 'bg-amber-100 text-amber-900' :
                      p.level === 'Junior' ? 'bg-purple-100 text-purple-900' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {p.level || 'Senior'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                    {p.totalResolved}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-amber-700">
                    {p.totalInProgress}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                    {p.totalAssigned}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">{p.resolutionRate}%</span>
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${p.resolutionRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
