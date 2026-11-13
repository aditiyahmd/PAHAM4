import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Layers,
  Users,
  Download,
  Calendar,
  PackagePlus,
  PackageMinus,
  CheckSquare,
  Wrench,
  ShieldCheck,
  Server
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { AppStatistics, PicPerformanceReport } from '../../types';
import { PdfReportService } from '../../services/pdfReportService';

interface ExecutiveDashboardProps {
  onNavigateTab?: (tab: string) => void;
  isExecutiveOnly?: boolean;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateTab,
  isExecutiveOnly = false
}) => {
  const [stats, setStats] = useState<AppStatistics>(() => AppDatabase.getStatistics());
  const [picReports, setPicReports] = useState<PicPerformanceReport[]>(() =>
    AppDatabase.getPicPerformanceReport()
  );
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<number>(4);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  // Sub-tabs: "Dashboard Pimpinan" vs "Dashboard Operasional" (Requirement 3.1 & 3.2)
  const [dashboardTab, setDashboardTab] = useState<'pimpinan' | 'operasional'>('pimpinan');

  // Month selector for reporting (Requirement 3.1)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const activeUser = AppDatabase.getActiveUser();
  const isRektorOrWarek =
    isExecutiveOnly ||
    activeUser?.role === 'ACT-01' ||
    activeUser?.id === 'USR-ACT-01A' ||
    activeUser?.id === 'USR-ACT-01B';

  const penerimaanList = AppDatabase.getBukuPenerimaan();
  const pengeluaranList = AppDatabase.getBukuPengeluaran();
  const allAssets = AppDatabase.getAssets();
  const damageTickets = AppDatabase.getDamageTickets();
  const loanTickets = AppDatabase.getLoans();

  const handleRefresh = () => {
    setStats(AppDatabase.getStatistics());
    setPicReports(AppDatabase.getPicPerformanceReport());
    setLastRefreshed(new Date());
    setCountdown(4);
  };

  // Real-time refresh ticker
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

  // Export CSV
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
    link.setAttribute('download', `Laporan_Eksekutif_Pusdatin_UMC_${selectedMonth}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Full PDF (Requirement 3.1)
  const rekapKategori = AppDatabase.getBukuAsetInventarisRekap();
  const totalNilaiAset = rekapKategori.reduce((s, r) => s + r.nilaiAsetTotal, 0);

  // Export Full PDF (Requirement 3.1)
  const handleDownloadPdfReport = () => {
    const doc = PdfReportService.generateExecutiveDashboardPdf(stats, selectedMonth, {
      penerimaanCount: penerimaanList.length,
      pengeluaranCount: pengeluaranList.length,
      totalAsetValue: totalNilaiAset
    });
    const safeMonth = (selectedMonth || 'Periode').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Laporan_Eksekutif_Dashboard_UMC_${safeMonth}.pdf`);
  };

  // Operational metrics
  const totalBarangMasuk = penerimaanList.reduce((acc, curr) => {
    if (curr.items && curr.items.length > 0) {
      return acc + curr.items.reduce((sum, it) => sum + (it.banyaknya || it.jumlah || 0), 0);
    }
    return acc + (curr.banyaknya || curr.jumlah || 0);
  }, 0);

  const totalBarangKeluar = pengeluaranList.reduce((acc, curr) => {
    if (curr.items && curr.items.length > 0) {
      return acc + curr.items.length;
    }
    return acc + 1;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-bold font-mono">
              {isRektorOrWarek ? 'EKSEKUTIF UMC' : 'PUSDATIN'}
            </span>
            <h1 className="text-xl font-bold">Dashboard Pimpinan</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Pusat Komando & Analitik Strategis Teknologi Informasi PUSDATIN Universitas Muhammadiyah Cirebon.
          </p>
        </div>

        {/* Live Refresh Counter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Filter (Requirement 3.1) */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-400 text-[11px]">Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-white border-0 outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <RefreshCw
              className={`w-3.5 h-3.5 text-cyan-400 ${autoRefreshEnabled ? 'animate-spin' : ''}`}
              style={{ animationDuration: '4s' }}
            />
            <span>Auto: <strong>{countdown}s</strong></span>
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
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="Ekspor CSV Data Master"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>

          {/* Unduh Seluruh Dashboard PDF (Requirement 3.1) */}
          <button
            type="button"
            onClick={handleDownloadPdfReport}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            title="Unduh seluruh ringkasan dashboard pimpinan dalam bentuk PDF resmi"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Switcher: Dashboard Pimpinan vs Dashboard Operasional (Requirement 3.1) */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setDashboardTab('pimpinan')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            dashboardTab === 'pimpinan'
              ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dashboard Pimpinan (Strategis)</span>
        </button>

        <button
          onClick={() => setDashboardTab('operasional')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            dashboardTab === 'operasional'
              ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Dashboard Operasional (Logistik & Aset)</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD PIMPINAN (STRATEGIS) */}
      {dashboardTab === 'pimpinan' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* SLA Achievement Rate */}
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

            {/* Total Investasi TI */}
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

            {/* Ketersediaan Perangkat */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Ketersediaan Perangkat</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
                {stats.tersedia}{' '}
                <span className="text-xs font-normal text-slate-500">Ready / {stats.digunakan} Pakai</span>
              </div>
              <div className="text-[11px] text-purple-700 font-semibold mt-1">
                {stats.dipinjam} Sedang Dipinjam
              </div>
            </div>

            {/* Pengembangan Aplikasi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Pengembangan Aplikasi</span>
                <Server className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-purple-700 mt-2">
                {stats.pengajuanDalamPengembangan}{' '}
                <span className="text-xs font-normal text-slate-500">Sprint Aktif</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Total {stats.totalPengajuanSistem} Pengajuan Masuk
              </div>
            </div>
          </div>

          {/* Row 2: Status Operasional Aset vs Kinerja PIC Helpdesk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rekap Distribusi Status Aset */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Distribusi Status Operasional Aset Master
              </h2>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700">Tersedia (Ready)</span>
                    <span className="font-mono">
                      {stats.tersedia} Unit ({Math.round((stats.tersedia / (stats.totalAset || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${(stats.tersedia / (stats.totalAset || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-blue-700">Digunakan (Terpasang)</span>
                    <span className="font-mono">
                      {stats.digunakan} Unit ({Math.round((stats.digunakan / (stats.totalAset || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(stats.digunakan / (stats.totalAset || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-purple-700">Dipinjam Civitas</span>
                    <span className="font-mono">
                      {stats.dipinjam} Unit ({Math.round((stats.dipinjam / (stats.totalAset || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(stats.dipinjam / (stats.totalAset || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-700">Maintenance / Rusak</span>
                    <span className="font-mono">
                      {stats.maintenance} Unit ({Math.round((stats.maintenance / (stats.totalAset || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full"
                      style={{ width: `${(stats.maintenance / (stats.totalAset || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-700">Tidak Layak (Afkir)</span>
                    <span className="font-mono">
                      {stats.tidakLayak} Unit ({Math.round((stats.tidakLayak / (stats.totalAset || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-rose-600 h-2 rounded-full"
                      style={{ width: `${(stats.tidakLayak / (stats.totalAset || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirement 3.2: Analitik performa teknisi PUSDATIN TIDAK ditampilkan untuk Rektor dan Wakil Rektor 1 */}
            {!isRektorOrWarek ? (
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
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                            {pic.totalResolved}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded ${
                                pic.slaOnTimeRate >= 90
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {pic.slaOnTimeRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* When viewing as Rektor or Warek 1, replace with Rekap Nilai Aset per Kategori */
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Ringkasan Nilai Aset per Kategori
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3 text-center">Total Unit</th>
                        <th className="py-2 px-3 text-right">Total Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rekapKategori.map(rk => (
                        <tr key={rk.kategori} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{rk.kategori}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{rk.jumlahAset} Unit</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            Rp {rk.nilaiAsetTotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD OPERASIONAL (Requirement 3.2: Logistik, Buku Penerimaan, & Buku Pengeluaran) */}
      {dashboardTab === 'operasional' && (
        <div className="space-y-6">
          {/* Summary Cards: Penerimaan & Pengeluaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
                <span>Buku Penerimaan Aset</span>
                <PackagePlus className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-emerald-950 mt-2">
                {penerimaanList.length} <span className="text-xs font-normal text-emerald-700">Faktur/BAST</span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1 font-medium">
                Total {totalBarangMasuk} Unit Barang Diterima
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-blue-800 font-bold">
                <span>Buku Pengeluaran Aset</span>
                <PackageMinus className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-blue-950 mt-2">
                {pengeluaranList.length} <span className="text-xs font-normal text-blue-700">Distribusi</span>
              </div>
              <p className="text-[11px] text-blue-800 mt-1 font-medium">
                Total {totalBarangKeluar} Unit Barang Terpasang
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
                <span>Tiket Kerusakan Aktif</span>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-amber-950 mt-2">
                {damageTickets.filter(t => t.status !== 'Resolved' && !t.status.startsWith('Closed')).length}{' '}
                <span className="text-xs font-normal text-amber-700">Tiket</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1 font-medium">
                {damageTickets.filter(t => t.status === 'In Progress').length} Dalam Pengerjaan
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-purple-50/30 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-purple-800 font-bold">
                <span>Peminjaman Aset Berjalan</span>
                <CheckSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-purple-950 mt-2">
                {loanTickets.filter(l => l.status === 'Diserahkan' || l.status === 'Disetujui' || l.status === 'Dikonfirmasi').length}{' '}
                <span className="text-xs font-normal text-purple-700">Aset</span>
              </div>
              <p className="text-[11px] text-purple-800 mt-1 font-medium">
                {loanTickets.filter(l => l.status === 'Diajukan' || l.status === 'Menunggu').length} Menunggu Review
              </p>
            </div>
          </div>

          {/* Operational Tables: Penerimaan Terkini & Pengeluaran Terkini */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 5 Penerimaan Terakhir */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-emerald-600" />
                  Penerimaan Aset Terkini
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {penerimaanList.length} BAST Masuk
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">No. BAST</th>
                      <th className="py-2.5 px-3">Sumber / Vendor</th>
                      <th className="py-2.5 px-3 text-center">Tanggal</th>
                      <th className="py-2.5 px-3 text-right">Nilai Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {penerimaanList.slice(0, 5).map(p => (
                      <tr key={p.idPenerimaan} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-slate-900">{p.nomorBeritaAcara}</div>
                          <div className="text-[10px] text-slate-500">
                            {p.items ? `${p.items.length} macam barang` : p.namaAset}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{p.dari}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                          {p.tanggalPenerimaan}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          Rp {(p.jumlahHarga || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5 Pengeluaran Terakhir */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <PackageMinus className="w-4 h-4 text-blue-600" />
                  Pengeluaran & Distribusi Terkini
                </h3>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {pengeluaranList.length} Distribusi
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">ID / Aset</th>
                      <th className="py-2.5 px-3">Tujuan / Ruangan</th>
                      <th className="py-2.5 px-3 text-center">Tanggal</th>
                      <th className="py-2.5 px-3">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {pengeluaranList.slice(0, 5).map(pg => (
                      <tr key={pg.idPengeluaran} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-slate-900">{pg.idPengeluaran}</div>
                          <div className="text-[10px] text-slate-500">
                            {pg.items ? `${pg.items.length} jenis aset` : pg.namaAset}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 font-semibold">{pg.untuk}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                          {pg.tanggalPenyerahan}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{pg.petugas || 'Admin PUSDATIN'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
