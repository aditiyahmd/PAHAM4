import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Server,
  Layers,
  Users
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { AppStatistics, PicPerformanceReport } from '../../types';

interface ExecutiveDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<AppStatistics>(() => AppDatabase.getStatistics());
  const [picReports, setPicReports] = useState<PicPerformanceReport[]>(() =>
    AppDatabase.getPicPerformanceReport()
  );
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<number>(4);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  const activeUser = AppDatabase.getActiveUser();

  const handleRefresh = () => {
    setStats(AppDatabase.getStatistics());
    setPicReports(AppDatabase.getPicPerformanceReport());
    setLastRefreshed(new Date());
    setCountdown(4);
  };

  // AC-D1: Refresh real-time < 5 detik
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleRefresh();
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled]);

  // AC-D2: Unduh Laporan Excel / CSV
  const handleExportExcelCsv = () => {
    const assets = AppDatabase.getAssets();
    const rows = [
      ['Kode Unik Aset', 'Barcode', 'Nama Aset', 'Kategori', 'Status Operasional', 'Lokasi', 'Harga Beli (Rp)'],
      ...assets.map(a => [
        a.kodeUnikAset,
        a.barcode,
        `"${a.nama.replace(/"/g, '""')}"`,
        a.kategori,
        a.status,
        `"${a.lokasi.replace(/"/g, '""')}"`,
        a.hargaBeli || 0
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Eksekutif_Pusdatin_UMC_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rekapKategori = AppDatabase.getBukuAsetInventarisRekap();
  const totalNilaiAset = rekapKategori.reduce((s, r) => s + r.nilaiAsetTotal, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-bold font-mono">
              ACT-01 & ACT-02
            </span>
            <h1 className="text-xl font-bold">Dashboard Pimpinan & Eksekutif TI</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Sistem Informasi Terpadu PUSDATIN Universitas Muhammadiyah Cirebon. Real-time Refresh & SLA Compliance (Section 5.5).
          </p>
        </div>

        {/* Live Refresh Counter & Export Buttons (AC-D1, AC-D2) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${autoRefreshEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>Auto Refresh: <strong>{countdown}s</strong></span>
            <button
              type="button"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className="text-[10px] text-cyan-400 underline ml-1 cursor-pointer"
            >
              {autoRefreshEnabled ? 'Jeda' : 'Aktifkan'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcelCsv}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Excel / CSV (AC-D2)
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('laporan-pdf')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4" />
              Unduh PDF Resmi (AC-D2)
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards: Aset, Helpdesk, SLA, & Peminjaman */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SLA Achievement Rate (F-DASH-03) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>SLA Achievement Rate</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-700 mt-2">
            {stats.slaAchievementRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            {stats.totalSlaOverdue > 0 ? (
              <span className="text-rose-600 font-bold">⚠️ {stats.totalSlaOverdue} Tiket Overdue</span>
            ) : (
              <span className="text-emerald-700 font-bold">✅ 100% On-Time SLA</span>
            )}
          </div>
        </div>

        {/* Nilai Total Investasi TI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Investasi Aset TI</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-slate-900 mt-2">
            Rp {(totalNilaiAset / 1000000).toFixed(1)} Jt
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalAset} Unit Terdaftar di Master
          </div>
        </div>

        {/* Status Aset Terkini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Ketersediaan Perangkat</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
            {stats.tersedia} <span className="text-xs font-normal text-slate-500">Ready / {stats.digunakan} Pakai</span>
          </div>
          <div className="text-[11px] text-purple-700 font-semibold mt-1">
            {stats.dipinjam} Sedang Dipinjam
          </div>
        </div>

        {/* Sistem Baru dalam Pengembangan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Pengembangan Aplikasi</span>
            <Server className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-purple-700 mt-2">
            {stats.pengajuanDalamPengembangan} <span className="text-xs font-normal text-slate-500">Sprint Aktif</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total {stats.totalPengajuanSistem} Pengajuan Masuk
          </div>
        </div>
      </div>

      {/* Row 2: Status Operasional Aset vs Kinerja PIC Helpdesk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rekap Status Aset (Section 4.1) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Distribusi Status Operasional Aset (Section 4.1)
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">Tersedia (Ready)</span>
                <span className="font-mono">{stats.tersedia} Unit ({Math.round((stats.tersedia / (stats.totalAset || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${(stats.tersedia / (stats.totalAset || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700">Digunakan (Terpasang)</span>
                <span className="font-mono">{stats.digunakan} Unit ({Math.round((stats.digunakan / (stats.totalAset || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats.digunakan / (stats.totalAset || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-purple-700">Dipinjam Civitas</span>
                <span className="font-mono">{stats.dipinjam} Unit ({Math.round((stats.dipinjam / (stats.totalAset || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(stats.dipinjam / (stats.totalAset || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">Maintenance (Perbaikan)</span>
                <span className="font-mono">{stats.maintenance} Unit ({Math.round((stats.maintenance / (stats.totalAset || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${(stats.maintenance / (stats.totalAset || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700">Tidak Layak (Afkir)</span>
                <span className="font-mono">{stats.tidakLayak} Unit ({Math.round((stats.tidakLayak / (stats.totalAset || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-rose-600 h-2 rounded-full" style={{ width: `${(stats.tidakLayak / (stats.totalAset || 1)) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Kinerja & SLA PIC Teknisi (F-DASH-03) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Kinerja Helpdesk & SLA per PIC Teknisi
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Teknisi & Role</th>
                  <th className="py-2.5 px-3 text-center">Ditugaskan</th>
                  <th className="py-2.5 px-3 text-center">Selesai</th>
                  <th className="py-2.5 px-3 text-right">SLA On-Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {picReports.map(pic => (
                  <tr key={pic.technicianId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{pic.technicianName}</div>
                      <div className="text-[10px] text-slate-500">{pic.role}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">{pic.totalAssigned}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{pic.totalResolved}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${pic.slaOnTimeRate >= 90 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                        {pic.slaOnTimeRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
