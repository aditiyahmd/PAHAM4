import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { PdfReportService, MonthlyReportParams } from '../../services/pdfReportService';
import { FileText, Download, Calendar, Filter, CheckCircle2, FileCheck, Layers } from 'lucide-react';

export const MonthlyReportPdf: React.FC = () => {
  const [selectedBulan, setSelectedBulan] = useState('November');
  const [selectedTahun, setSelectedTahun] = useState('2026');
  const [selectedTipe, setSelectedTipe] = useState<'Semua' | 'Peminjaman' | 'Kerusakan' | 'Aset Terkini'>('Semua');
  const [kepalaNama, setKepalaNama] = useState(() => AppDatabase.getKepalaPusdatin().nama);
  const [kepalaNip, setKepalaNip] = useState(() => AppDatabase.getKepalaPusdatin().nip);
  const [petugasNama, setPetugasNama] = useState('Aditiya Ahmad Fadila');
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const assets = AppDatabase.getAssets();
  const loans = AppDatabase.getLoans();
  const damages = AppDatabase.getDamageTickets();
  const logs = AppDatabase.getLogs();

  const handleDownloadPdf = () => {
    setIsGenerating(true);

    if (saveAsDefault && kepalaNama.trim()) {
      AppDatabase.setKepalaPusdatin(kepalaNama.trim(), kepalaNip.trim());
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
          logs
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
      {/* Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pusat Pelaporan Bulanan Inventaris & Aset (Format PDF)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Hasilkan dokumen rekapitulasi resmi Universitas Muhammadiyah Cirebon berstandar A4 landscape lengkap dengan kop surat dan kolom tanda tangan pimpinan.
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-base text-slate-900">
          Parameter Laporan Periode
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Bulan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Bulan Laporan
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={selectedBulan}
                onChange={e => setSelectedBulan(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              >
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tahun */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tahun Anggaran
            </label>
            <select
              value={selectedTahun}
              onChange={e => setSelectedTahun(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Tipe Laporan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cakupan Data Rekap
            </label>
            <select
              value={selectedTipe}
              onChange={e => setSelectedTipe(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            >
              <option value="Semua">Semua Data (Komprehensif)</option>
              <option value="Peminjaman">Khusus Log Peminjaman Aset</option>
              <option value="Aset Terkini">Khusus Master Data Aset & Kondisi</option>
            </select>
          </div>
        </div>

        {/* Live Preview Strip */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Ringkasan Berkas yang Akan Dicetak:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block">Total Aset Masuk</span>
              <span className="font-mono text-base font-bold text-slate-900">{assets.length} Unit</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block">Transaksi Peminjaman</span>
              <span className="font-mono text-base font-bold text-blue-700">{loans.length} Tiket</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block">Aset Tersedia</span>
              <span className="font-mono text-base font-bold text-emerald-700">{assets.filter(a => a.status === 'Tersedia').length} Unit</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block">Perlu Servis / Rusak</span>
              <span className="font-mono text-base font-bold text-red-700">{assets.filter(a => a.status === 'Rusak' || a.status === 'Diperbaiki').length} Unit</span>
            </div>
          </div>
        </div>

        {/* Pengaturan Penandatangan (Kepala PUSDATIN & Petugas) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Identitas Penandatangan Dokumen Resmi (Format: ( Nama Lengkap ))
            </h4>
            <span className="text-[11px] text-slate-500">Dapat diedit bebas oleh Admin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Kepala PUSDATIN UMC
              </label>
              <input
                type="text"
                value={kepalaNama}
                onChange={e => setKepalaNama(e.target.value)}
                placeholder="Dr. Ir. H. Ahmad Dahlan, M.T."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                NIDN / NIP Kepala PUSDATIN
              </label>
              <input
                type="text"
                value={kepalaNip}
                onChange={e => setKepalaNip(e.target.value)}
                placeholder="NIDN. 0418077501"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Petugas Pengelola Aset
              </label>
              <input
                type="text"
                value={petugasNama}
                onChange={e => setPetugasNama(e.target.value)}
                placeholder="Aditiya Ahmad Fadila"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={e => setSaveAsDefault(e.target.checked)}
              className="rounded text-red-600"
            />
            <span className="text-xs text-slate-600">
              Simpan identitas Kepala PUSDATIN sebagai pengaturan default sistem
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Format PDF vektor beresolusi tinggi, siap untuk print atau lampiran rapat pimpinan.</span>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Memproses Berkas PDF...' : 'Unduh Laporan Bulanan (PDF)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
