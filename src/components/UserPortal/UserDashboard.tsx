import React from 'react';
import { AppStatistics, Asset } from '../../types';
import { AppDatabase } from '../../services/db';
import {
  Package,
  CheckCircle2,
  Monitor,
  Clock,
  AlertTriangle,
  Wrench,
  Layers,
  MapPin,
  Handshake,
  Search,
  ArrowRight,
  ShieldCheck,
  Laptop,
  Projector,
  Volume2,
  Cable,
  Building,
  Info
} from 'lucide-react';

interface UserDashboardProps {
  stats: AppStatistics;
  onNavigateTab: (tabId: string) => void;
  onSelectAssetForLoan?: (assetName: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  stats,
  onNavigateTab,
  onSelectAssetForLoan
}) => {
  const assets = AppDatabase.getAssets();

  // Categorized available items ready for borrowing
  const readyLaptops = assets.filter(a => a.kategori === 'Komputer & Laptop' && a.status === 'Tersedia');
  const readyProjectors = assets.filter(a => a.kategori === 'Multimedia' && a.nama.toLowerCase().includes('proyektor') && a.status === 'Tersedia');
  const readyAudio = assets.filter(a => a.kategori === 'Multimedia' && (a.nama.toLowerCase().includes('sound') || a.nama.toLowerCase().includes('speaker')) && a.status === 'Tersedia');
  const readyCables = assets.filter(a => a.kategori === 'Kabel & Aksesoris' && a.status === 'Tersedia');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-red-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <img
            src="/assets/aistudio/umc_seal_logo_31e5fdc7.png"
            alt="Watermark UMC"
            className="w-72 h-auto"
          />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            <span>PAHAM · PUSDATIN Universitas Muhammadiyah Cirebon</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            PAHAM (PUSDATIN Asset & Helpdesk Assistance Management)
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Portal resmi pelayanan peminjaman perangkat perkuliahan, pelaporan gangguan sarana teknologi informasi, dan monitoring status ketersediaan inventaris kampus UMC.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('ajukan-pinjam')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Handshake className="w-4 h-4" />
              <span>Ajukan Peminjaman Aset</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('lapor-rusak')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors backdrop-blur-xs cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Lapor Kerusakan Perangkat</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('pengajuan-sistem-user')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors backdrop-blur-xs cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Ajukan Sistem Baru (F-DEV-01)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('cek-progres')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors backdrop-blur-xs cursor-pointer"
            >
              <Search className="w-4 h-4 text-blue-400" />
              <span>Lacak Status Tiket</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 KPI Cards (Persis seperti yang ada di Admin PUSDATIN sesuai Requirement 1) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Statistik Ketersediaan & Kondisi Aset Kampus
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">Pembaruan Real-Time</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Aset */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Aset</span>
              <Package className="w-4 h-4 text-slate-700" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.totalAset}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Inventaris Kampus</span>
          </div>

          {/* Tersedia */}
          <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs bg-emerald-50/20 hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tersedia</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
              {stats.tersedia}
            </p>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Siap Dipinjam</span>
          </div>

          {/* Digunakan */}
          <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-xs bg-blue-50/20 hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Digunakan</span>
              <Monitor className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-blue-600 tabular-nums">
              {stats.digunakan}
            </p>
            <span className="text-[11px] text-blue-700 mt-1 block">Aktif di Lab/Unit</span>
          </div>

          {/* Dipinjam */}
          <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-xs bg-indigo-50/20 hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between text-indigo-700 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Dipinjam</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-indigo-600 tabular-nums">
              {stats.dipinjam}
            </p>
            <span className="text-[11px] text-indigo-700 mt-1 block">Masa Pinjam Aktif</span>
          </div>

          {/* Rusak */}
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-xs bg-red-50/20 hover:border-red-300 transition-all">
            <div className="flex items-center justify-between text-red-700 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Maintenance</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-red-600 tabular-nums">
              {stats.maintenance ?? stats.rusak ?? 0}
            </p>
            <span className="text-[11px] text-red-700 mt-1 block">Perlu Servis</span>
          </div>

          {/* Perbaikan */}
          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs bg-amber-50/20 hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Diperbaiki</span>
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
              {stats.totalSedangDiperbaiki ?? stats.diperbaiki ?? 0}
            </p>
            <span className="text-[11px] text-amber-700 mt-1 block">Sedang Ditangani</span>
          </div>
        </div>
      </div>

      {/* Ringkasan Ketersediaan Perangkat Populer (Agregat Siap Pinjam) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Status Ketersediaan Perangkat Siap Pinjam (Live Stock)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perangkat berada di Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt. 2, Kampus 2 Watubelah) dalam kondisi baik dan siap dialokasikan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('ajukan-pinjam')}
            className="text-xs font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Buka Formulir Peminjaman</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Laptop & Notebook */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-100 text-emerald-800">
                  {readyLaptops.length} Unit Siap
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">Laptop / Komputer</h4>
              <p className="text-xs text-slate-500 mt-1">
                ASUS ExpertBook, Lenovo ThinkPad untuk ujian sidang, akreditasi, & rapat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ajukan-pinjam')}
              className="mt-4 w-full py-1.5 text-xs font-bold text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 rounded-lg transition-colors text-center"
            >
              Ajukan Laptop
            </button>
          </div>

          {/* LCD Proyektor */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Projector className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-100 text-emerald-800">
                  {readyProjectors.length} Unit Siap
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">LCD Proyektor & Layar</h4>
              <p className="text-xs text-slate-500 mt-1">
                Epson 3300 Lumens HDMI/VGA untuk kuliah tamu, seminar, dan presentasi prodi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ajukan-pinjam')}
              className="mt-4 w-full py-1.5 text-xs font-bold text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 rounded-lg transition-colors text-center"
            >
              Ajukan Proyektor
            </button>
          </div>

          {/* Sound & Mic */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-100 text-emerald-800">
                  {readyAudio.length} Unit Siap
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">Sound Portable & Mic</h4>
              <p className="text-xs text-slate-500 mt-1">
                Speaker wireless Baretone + 2 Mic untuk kegiatan Ormawa & kegiatan outdoor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ajukan-pinjam')}
              className="mt-4 w-full py-1.5 text-xs font-bold text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 rounded-lg transition-colors text-center"
            >
              Ajukan Sound
            </button>
          </div>

          {/* Kabel & Konverter */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Cable className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-100 text-emerald-800">
                  {readyCables.length} Unit Siap
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">Kabel & Konverter</h4>
              <p className="text-xs text-slate-500 mt-1">
                Kabel HDMI 10M, VGA to HDMI, Roll kabel listrik, dan adaptor display.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ajukan-pinjam')}
              className="mt-4 w-full py-1.5 text-xs font-bold text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 rounded-lg transition-colors text-center"
            >
              Ajukan Kabel
            </button>
          </div>
        </div>
      </div>

      {/* Distribution by Category and Location (Mirip dengan yang ada di Admin PUSDATIN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Distribusi Kategori Inventaris</h3>
            </div>
            <span className="text-xs text-slate-500">
              {Object.keys(stats.kategoriMap).length} Kategori
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.kategoriMap).map(([kat, count]) => {
              const pct = Math.round((count / Math.max(stats.totalAset, 1)) * 100);
              return (
                <div key={kat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{kat}</span>
                    <span className="font-mono text-slate-900 font-bold tabular-nums">
                      {count} Unit ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lokasi */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Persebaran Penempatan Aset Kampus</h3>
            </div>
            <span className="text-xs text-slate-500">
              {Object.keys(stats.lokasiMap).length} Titik Fasilitas
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.lokasiMap).map(([lok, count]) => {
              const pct = Math.round((count / Math.max(stats.totalAset, 1)) * 100);
              return (
                <div key={lok} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 line-clamp-1">{lok}</span>
                    <span className="font-mono text-slate-900 font-bold tabular-nums shrink-0">
                      {count} Unit
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alur Pelayanan & Informasi Helpdesk PUSDATIN */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-red-600" />
          <span>Alur Standar Operasional Pelayanan PUSDATIN UMC</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs inline-flex items-center justify-center">
              1
            </span>
            <p className="font-bold text-slate-900 pt-1">Pengajuan Formulir</p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Isi data peminjam atau rincian kerusakan via portal ini. Simpan ID tiket Anda (PJM-... / TKT-...).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center">
              2
            </span>
            <p className="font-bold text-slate-900 pt-1">Verifikasi Petugas</p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Petugas PUSDATIN memeriksa kelayakan, mengalokasikan barcode fisik, dan mengirim notifikasi email.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center">
              3
            </span>
            <p className="font-bold text-slate-900 pt-1">Penyerahan Fisik</p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Ambil perangkat di Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2, Kampus 2) dengan menandatangani Berita Acara resmi.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs inline-flex items-center justify-center">
              4
            </span>
            <p className="font-bold text-slate-900 pt-1">Pengembalian Tepat Waktu</p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Kembalikan barang sebelum batas tempo. Petugas memeriksa fisik dan menerbitkan bukti pengembalian.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-950">
          <div>
            <span className="font-bold block">Ruang Layanan PUSDATIN UMC:</span>
            <span>Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon. Jam operasional : senin - Jum'at 08.00 - 16.00 WIB, Sabtu 08.00 - 14.00 WIB</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('ajukan-pinjam')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shrink-0 shadow-2xs"
          >
            Mulai Peminjaman
          </button>
        </div>
      </div>
    </div>
  );
};
