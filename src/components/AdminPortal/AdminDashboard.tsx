import React, { useState } from 'react';
import { AppStatistics, LoanTicket, ActivityLog } from '../../types';
import { EmailNotificationService } from '../../services/emailService';
import { AppDatabase } from '../../services/db';
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
  MapPin,
  Bell,
  Phone,
  Mail,
  ExternalLink,
  ShieldAlert,
  RotateCcw,
  Activity,
  UserCheck,
  Server,
  Laptop,
  Shield,
  PackageSearch,
  AlertOctagon,
  TrendingUp,
  History
} from 'lucide-react';

interface AdminDashboardProps {
  stats: AppStatistics;
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, onNavigateTab }) => {
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueLoans = stats.overdueLoans || [];
  const damageTickets = AppDatabase.getDamageTickets();
  const technicians = AppDatabase.getTechnicians().filter(
    tech => tech.role !== 'ACT-01' && tech.role !== 'ACT-10'
  );

  const handleSendReminder = async (loan: LoanTicket) => {
    setSendingReminderId(loan.id);
    try {
      await EmailNotificationService.sendOverdueReminder(loan);
      alert(`Surat peringatan keterlambatan resmi berhasil dikirimkan ke email ${loan.email || loan.peminjam}!`);
    } catch {
      alert('Gagal mengirim email pengingat.');
    } finally {
      setSendingReminderId(null);
    }
  };

  const getDaysOverdue = (tglKembali: string) => {
    try {
      const target = new Date(tglKembali).getTime();
      const now = new Date(todayStr).getTime();
      const diff = Math.max(1, Math.floor((now - target) / (1000 * 60 * 60 * 24)));
      return diff;
    } catch {
      return 1;
    }
  };

  // Technician performance computation (Enhancement B.11)
  const technicianStats = technicians.map(tech => {
    const assigned = damageTickets.filter(t => t.assignedTechnicianId === tech.id || t.picTeknisi === tech.roleName || Boolean(tech.nama && t.namaPicTeknisi === tech.nama));
    const inProgress = assigned.filter(t => t.status === 'In Progress' || t.status === 'Pending – Menunggu Suku Cadang');
    const waiting = assigned.filter(t => t.status === 'Open/Unassigned' || t.status === 'Assigned');
    const completed = assigned.filter(t => t.status === 'Resolved' || t.status === 'Closed – Auto' || t.status === 'Closed – Manual');
    return {
      ...tech,
      totalAssigned: assigned.length,
      inProgressCount: inProgress.length,
      waitingCount: waiting.length,
      completedCount: completed.length
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. NOTIFIKASI TINGKAT TINGGI: ASET TERPINJAM TELAT DIKEMBALIKAN */}
      {stats.totalPinjamTerlambat > 0 && (
        <div className="bg-linear-to-r from-red-600 via-rose-600 to-amber-600 rounded-2xl p-5 text-white shadow-md animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs border border-white/30">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-red-700 text-[11px] font-black uppercase tracking-wider">
                    Peringatan Kritis
                  </span>
                  <span className="text-xs font-semibold text-red-100">
                    Sistem Monitoring Pengembalian Aset PUSDATIN
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white mt-1">
                  Perhatian: {stats.totalPinjamTerlambat} Aset Pinjaman Melewati Batas Waktu Pengembalian!
                </h3>
                <p className="text-xs text-red-100 mt-0.5 leading-relaxed max-w-3xl">
                  Terdapat peminjaman inventaris yang telah jatuh tempo namun fisik barang belum dikembalikan ke Ruang PUSDATIN. Segera lakukan penagihan via WhatsApp atau kirim surat peringatan otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={() => onNavigateTab('kelola-pinjam')}
                className="px-4 py-2 text-xs font-bold text-red-900 bg-white hover:bg-red-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Kelola & Tarik Kembali</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. NOTIFIKASI MONITORING PERBAIKAN ASET PUSDATIN (USER REQUEST B.6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notifikasi 1: Aset Sedang Proses Perbaikan */}
        <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                  Monitoring Servis
                </span>
                <span className="text-xs text-blue-100">Tim Teknisi PUSDATIN</span>
              </div>
              <h4 className="text-sm font-bold text-blue-50">
                Aset Sedang Dalam Proses Perbaikan:
              </h4>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                  {stats.totalSedangDiperbaiki || 0}
                </span>
                <span className="text-xs text-blue-100 font-semibold">Unit Perangkat</span>
              </div>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Aset sedang aktif dikerjakan oleh teknisi spesialis (hardware, software, server/jaringan).
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Wrench className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <span className="text-blue-100">
              Menunggu Suku Cadang: <strong>{stats.totalMenungguSparepart || 0} unit</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('kelola-tiket')}
              className="font-bold underline hover:text-blue-200 inline-flex items-center gap-1"
            >
              <span>Pantau Tiket</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Notifikasi 2: Aset Masuk ke PUSDATIN Belum Dikerjakan */}
        <div className="bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                  Antrean Masuk Lab
                </span>
                <span className="text-xs text-amber-100">Standby di Ruang PUSDATIN</span>
              </div>
              <h4 className="text-sm font-bold text-amber-50">
                Aset Sudah Masuk PUSDATIN Tapi Belum Dikerjakan:
              </h4>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                  {stats.totalAntreanTiket || 0}
                </span>
                <span className="text-xs text-amber-100 font-semibold">Unit Perangkat</span>
              </div>
              <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                Fisik perangkat sudah diserahkan ke PUSDATIN, namun teknisi belum memulai diagnosa/servis.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <span className="text-amber-100">
              Total Rusak Total (Afkir): <strong>{stats.tidakLayak || 0} unit</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('kelola-tiket')}
              className="font-bold underline hover:text-amber-200 inline-flex items-center gap-1"
            >
              <span>Tugaskan Teknisi</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 6 Primary Inventory Metrics */}
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

        {/* Terlambat */}
        <div
          className={`rounded-xl border p-4 shadow-xs transition-all ${
            stats.totalPinjamTerlambat > 0
              ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                stats.totalPinjamTerlambat > 0 ? 'text-red-700' : 'text-slate-500'
              }`}
            >
              Terlambat
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                stats.totalPinjamTerlambat > 0 ? 'text-red-600 animate-pulse' : 'text-slate-400'
              }`}
            />
          </div>
          <p
            className={`text-2xl font-bold font-mono tabular-nums ${
              stats.totalPinjamTerlambat > 0 ? 'text-red-700 font-black' : 'text-slate-900'
            }`}
          >
            {stats.totalPinjamTerlambat}
          </p>
          <span
            className={`text-[11px] mt-1 block font-semibold ${
              stats.totalPinjamTerlambat > 0 ? 'text-red-600' : 'text-slate-400'
            }`}
          >
            {stats.totalPinjamTerlambat > 0 ? 'Belum Dikembalikan' : 'Tepat Waktu'}
          </span>
        </div>

        {/* Rusak / Servis */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rusak / Servis</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {(stats.maintenance || 0) + (stats.totalSedangDiperbaiki || 0)}
          </p>
          <span className="text-[11px] text-amber-700 mt-1 block">
            {stats.maintenance || 0} Maintenance · {stats.totalSedangDiperbaiki || 0} Diservis
          </span>
        </div>
      </div>

      {/* TECHNICIAN PERFORMANCE ANALYTICS (USER REQUEST B.11 & B.7) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-red-600" />
              <h3 className="text-base font-bold text-slate-900">
                Dashboard Analitik Performa Teknisi PUSDATIN
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring beban kerja real-time dan penyelesaian tiket berdasarkan spesialisasi bidang teknisi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              {technicianStats.length} Teknisi Tersedia
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {technicianStats.map(tech => (
            <div
              key={tech.id}
              className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{tech.name || tech.nama}</h4>
                  <p className="text-[11px] text-slate-500">{tech.roleName || tech.role}</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" title="Aktif Bertugas" />
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/80 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Antrean</span>
                  <span className="text-xs font-bold font-mono text-amber-700">
                    {tech.waitingCount}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Proses</span>
                  <span className="text-xs font-bold font-mono text-blue-700">
                    {tech.inProgressCount}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Selesai</span>
                  <span className="text-xs font-bold font-mono text-emerald-700">
                    {tech.completedCount}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 flex justify-between items-center">
                <span>Total Tiket:</span>
                <span className="font-bold font-mono text-slate-900">{tech.totalAssigned} Tiket</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OVERDUE MONITORING TABLE */}
      {overdueLoans.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden shadow-xs">
          <div className="p-5 bg-red-50/50 border-b border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
                  <span>Daftar Aset Terlambat Dikembalikan (Perlu Tindakan Penagihan)</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-600 text-white rounded-full">
                    {overdueLoans.length} Unit
                  </span>
                </h3>
                <p className="text-xs text-red-700 mt-0.5">
                  Hubungi sivitas peminjam langsung via WhatsApp atau kirim pengingat resmi dari sistem PUSDATIN UMC.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('kelola-pinjam')}
              className="text-xs font-bold text-red-700 hover:text-red-900 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Buka Menu Kelola Pinjam</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID Tiket</th>
                  <th className="px-4 py-3">Peminjam & Unit</th>
                  <th className="px-4 py-3">Barang & Barcode</th>
                  <th className="px-4 py-3">Tgl Kembali</th>
                  <th className="px-4 py-3">Keterlambatan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueLoans.map(loan => {
                  const daysLate = getDaysOverdue(loan.tglKembali);
                  const cleanPhone = (loan.kontak || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Halo Bapak/Ibu ${loan.peminjam}, kami dari PUSDATIN UMC mengingatkan bahwa peminjaman aset "${loan.barangPinjaman}" (ID Tiket: ${loan.id}) telah melewati batas waktu pengembalian pada tanggal ${loan.tglKembali} (terlambat ${daysLate} hari). Mohon kesediaannya untuk mengembalikan aset tersebut ke Ruang PUSDATIN. Terima kasih.`
                      )}`
                    : null;

                  return (
                    <tr key={loan.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-red-700 whitespace-nowrap">
                        {loan.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{loan.peminjam}</p>
                        <p className="text-[11px] text-slate-500">
                          {loan.unit} · {loan.kontak || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{loan.barangPinjaman}</p>
                        <span className="font-mono text-[11px] text-slate-500">
                          BC: {loan.barcode || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-red-700 whitespace-nowrap">
                        {loan.tglKembali}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-100 text-red-800">
                          Terlambat {daysLate} Hari
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-2">
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors"
                            title="Chat WhatsApp Peminjam"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          type="button"
                          disabled={sendingReminderId === loan.id}
                          onClick={() => handleSendReminder(loan)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                          title="Kirim Surat Peringatan ke Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{sendingReminderId === loan.id ? 'Mengirim...' : 'Kirim Email'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigateTab('kelola-pinjam')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Proses Pengembalian</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* ACTIVITY AUDIT LOG (USER REQUEST B.9) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Aktivitas & Audit Operasional Sistem
            </h3>
          </div>
          <span className="text-xs text-slate-500">Pembaruan Real-Time</span>
        </div>

        <div className="space-y-2.5">
          {AppDatabase.getLogs().slice(0, 6).map((log: ActivityLog, idx: number) => (
            <div
              key={`${log.id || 'log'}-${idx}`}
              className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
            >
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">
                  <span className="text-slate-900 font-bold">{log.petugas || 'Petugas'}</span> — {log.keterangan}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="font-mono">{log.timestamp}</span>
                  {log.barcode && (
                    <span className="font-mono font-bold text-red-700 bg-red-50 px-1 py-0.2 rounded border border-red-200">
                      {log.barcode}
                    </span>
                  )}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 shrink-0">
                {log.jenisTransaksi}
              </span>
            </div>
          ))}
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
          onClick={() => onNavigateTab('kelola-tiket')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-xs transition-all text-left flex items-start justify-between"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900">Kelola Tiket Servis</h4>
            <p className="text-xs text-slate-500 mt-1">Laporan kerusakan dan pemulihan status penempatan</p>
          </div>
          <Wrench className="w-4 h-4 text-red-600 shrink-0" />
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
          onClick={() => onNavigateTab('kelola-master')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-xs transition-all text-left flex items-start justify-between"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900">Kelola Lokasi & Kategori</h4>
            <p className="text-xs text-slate-500 mt-1">Kelola master data lokasi kampus dan kategori aset</p>
          </div>
          <Layers className="w-4 h-4 text-red-600 shrink-0" />
        </button>
      </div>
    </div>
  );
};
