import React from 'react';
import { AppStatistics } from '../../types';
import {
  Package,
  CheckCircle2,
  Monitor,
  AlertTriangle,
  Wrench,
  Clock,
  ArrowRight,
  FileText,
  Barcode,
  Layers,
  MapPin
} from 'lucide-react';

interface AdminDashboardProps {
  stats: AppStatistics;
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, onNavigateTab }) => {
  return (
    <div className="space-y-6">
      {/* Alert Banner if there are pending items */}
      {(stats.totalPinjamMenunggu > 0 || stats.totalAntreanTiket > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">Perlu Tindakan Petugas:</span>{' '}
              {stats.totalPinjamMenunggu > 0 && (
                <span><strong>{stats.totalPinjamMenunggu} pengajuan pinjam baru</strong> menunggu persetujuan. </span>
              )}
              {stats.totalAntreanTiket > 0 && (
                <span><strong>{stats.totalAntreanTiket} laporan kerusakan</strong> perlu ditindaklanjuti.</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.totalPinjamMenunggu > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('kelola-pinjam')}
                className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg shadow-xs"
              >
                Proses Peminjaman
              </button>
            )}
            {stats.totalAntreanTiket > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('kelola-tiket')}
                className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300"
              >
                Cek Tiket Rusak
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Aset */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Aset</span>
            <Package className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {stats.totalAset}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Semua Perangkat</span>
        </div>

        {/* Tersedia */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tersedia</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {stats.tersedia}
          </p>
          <span className="text-[11px] text-emerald-700 mt-1 block">Siap Dialokasikan</span>
        </div>

        {/* Digunakan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Digunakan</span>
            <Monitor className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-600 tabular-nums">
            {stats.digunakan}
          </p>
          <span className="text-[11px] text-blue-700 mt-1 block">Aktif di Unit/Lab</span>
        </div>

        {/* Dipinjam */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Dipinjam</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-600 tabular-nums">
            {stats.dipinjam}
          </p>
          <span className="text-[11px] text-indigo-700 mt-1 block">Dalam Peminjaman</span>
        </div>

        {/* Rusak */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rusak</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-red-600 tabular-nums">
            {stats.rusak}
          </p>
          <span className="text-[11px] text-red-700 mt-1 block">Perlu Penanganan</span>
        </div>

        {/* Perbaikan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Perbaikan</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {stats.diperbaiki}
          </p>
          <span className="text-[11px] text-amber-700 mt-1 block">Sedang Diservis</span>
        </div>
      </div>

      {/* Distribution by Category and Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Distribusi Kategori Aset</h3>
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
              <h3 className="text-sm font-bold text-slate-900">Persebaran Lokasi Aset Kampus</h3>
            </div>
            <span className="text-xs text-slate-500">
              {Object.keys(stats.lokasiMap).length} Titik Lokasi
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

      {/* Quick Action Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab('kelola-pinjam')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-xs transition-all text-left flex items-start justify-between"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900">Kelola Peminjaman</h4>
            <p className="text-xs text-slate-500 mt-1">Verifikasi tiket peminjaman dan alokasi barcode</p>
          </div>
          <ArrowRight className="w-4 h-4 text-red-600 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('laporan-pdf')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-xs transition-all text-left flex items-start justify-between"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900">Laporan Bulanan PDF</h4>
            <p className="text-xs text-slate-500 mt-1">Ekspor rekapitulasi inventaris ke dokumen resmi</p>
          </div>
          <FileText className="w-4 h-4 text-red-600 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('barang-masuk')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-xs transition-all text-left flex items-start justify-between"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900">Input Barang Masuk</h4>
            <p className="text-xs text-slate-500 mt-1">Registrasi aset baru dan generate barcode</p>
          </div>
          <Package className="w-4 h-4 text-red-600 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('cetak-barcode')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-xs transition-all text-left flex items-start justify-between"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900">Printer Thermal POS</h4>
            <p className="text-xs text-slate-500 mt-1">Cetak stiker barcode thermal 58mm kalibrasi</p>
          </div>
          <Barcode className="w-4 h-4 text-red-600 shrink-0" />
        </button>
      </div>
    </div>
  );
};
