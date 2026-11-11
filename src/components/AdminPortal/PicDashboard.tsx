import React from 'react';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  UserCheck,
  Send,
  Layers,
  ArrowRight,
  Sparkles,
  Flame,
  FileCode,
  HardDrive,
  Cpu
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { DamageTicket, TechnicianUser } from '../../types';

interface PicDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const PicDashboard: React.FC<PicDashboardProps> = ({ onNavigateTab }) => {
  const activeTech: TechnicianUser | null = AppDatabase.getActiveTechnician();
  const allTickets: DamageTicket[] = AppDatabase.getDamageTickets();

  // Filter tickets specifically for this technician or their role
  const myTickets = allTickets.filter(t => {
    if (!activeTech) return true;
    return (
      t.assignedTechnicianId === activeTech.id ||
      t.picTeknisi === activeTech.roleName ||
      Boolean(activeTech.nama && t.delegasiDari && t.delegasiDari.includes(activeTech.nama))
    );
  });

  const activeAssigned = myTickets.filter(
    t =>
      t.status === 'Open/Unassigned' ||
      t.status === 'Assigned' ||
      t.status === 'In Progress' ||
      t.status === 'Re-opened'
  );
  const waitingSpareParts = myTickets.filter(
    t => t.status === 'Pending – Menunggu Suku Cadang'
  );
  const finishedTickets = myTickets.filter(
    t => t.status === 'Resolved' || t.status === 'Closed – Auto' || t.status === 'Closed – Manual'
  );
  const criticalTickets = myTickets.filter(
    t =>
      (t.urgensi === 'Kritis' || t.prioritas === 'Kritis' || t.urgensi === 'Tinggi' || t.prioritas === 'Tinggi') &&
      t.status !== 'Resolved' &&
      t.status !== 'Closed – Auto' &&
      t.status !== 'Closed – Manual'
  );
  const delegatedTickets = myTickets.filter(t => !!t.delegasiDari);

  const getUrgencyBadge = (urgensi?: string) => {
    switch (urgensi) {
      case 'Kritis':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
            <Flame className="w-2.5 h-2.5" />
            Kritis
          </span>
        );
      case 'Tinggi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
            <AlertTriangle className="w-2.5 h-2.5" />
            Tinggi
          </span>
        );
      case 'Sedang':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            Sedang
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Rendah
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                Portal PIC Terfokus
              </span>
              {activeTech?.level === 'Junior' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Junior Member
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Selamat Bertugas, {activeTech?.nama || activeTech?.name || 'Petugas PUSDATIN'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Spesialisasi: <strong className="text-white">{activeTech?.roleName || activeTech?.role}</strong> &bull; {activeTech?.specialty}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('kelola-tiket')}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>Kelola Tiket Tugas Anda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Critical / Urgent Tickets Alert Banner */}
      {criticalTickets.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-rose-900">
                Perhatian: Terdapat {criticalTickets.length} Tiket Kategori Kritis / Tinggi Membutuhkan Penanganan Segera!
              </h4>
            </div>
            <p className="text-xs text-rose-700 mt-0.5">
              Tiket ini berhubungan dengan perkuliahan, ujian, server, atau layanan darurat kampus. Prioritaskan perbaikan hari ini.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {criticalTickets.slice(0, 3).map(ct => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => onNavigateTab('kelola-tiket')}
                  className="px-2.5 py-1 bg-white border border-rose-300 rounded-lg text-xs font-bold text-rose-900 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                >
                  <span className="font-mono text-[11px]">{ct.id}</span>
                  <span className="truncate max-w-[150px]">{ct.namaBarang}</span>
                  {getUrgencyBadge(ct.urgensi)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Antrean Aktif Anda</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {activeAssigned.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Baru, Diterima & Dalam Pengerjaan</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Menunggu Sparepart</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {waitingSpareParts.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Komponen suku cadang diajukan</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tiket Didelegasikan</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {delegatedTickets.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Delegasi programmer / teknisi</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tuntas Diperbaiki</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {finishedTickets.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total tiket selesai dikerjakan</p>
        </div>
      </div>

      {/* Delegation Notice for Programmer */}
      {((activeTech?.roleName as string) === 'Programmer' ||
        (activeTech?.roleName as string) === 'Junior Programmer' ||
        activeTech?.role === 'ACT-06' ||
        activeTech?.role === 'ACT-07' ||
        activeTech?.role === 'ACT-08') && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-violet-950">
                Fitur Delegasi Tim Programmer PUSDATIN UMC
              </h4>
              <p className="text-xs text-violet-800 leading-relaxed">
                {(activeTech?.roleName as string) === 'Programmer' || activeTech?.role === 'ACT-06'
                  ? 'Sebagai Lead / Senior Programmer, Anda dapat mendelegasikan tiket kerusakan (seperti perbaikan modul aplikasi, query SQL, atau bug frontend) kepada Junior Programmer melalui menu "Kelola Tiket Rusak Anda" dengan memilih aksi Delegasi.'
                  : 'Sebagai Frontend/Backend Programmer, Anda menerima tiket yang didelegasikan oleh Lead Dev. Anda dapat memperbarui progress pekerjaan dan mencatat catatan perbaikan teknis.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Tasks Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Tugas Tiket Anda Saat Ini ({myTickets.length})
            </h3>
            <p className="text-xs text-slate-500">
              Hanya menampilkan data aset dan tiket yang ditugaskan atau didelegasikan khusus kepada Anda
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('kelola-tiket')}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>Buka Panel Penuh</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {myTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold">Tidak ada antrean tiket kerusakan untuk Anda saat ini.</p>
            <p className="text-xs text-slate-400">Semua perangkat dalam lingkup tugas Anda berfungsi normal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-3">ID Tiket</th>
                  <th className="px-4 py-3">Nama Perangkat / Modul</th>
                  <th className="px-4 py-3">Urgensi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pelapor / Lokasi</th>
                  <th className="px-4 py-3">Suku Cadang / Delegasi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myTickets.slice(0, 6).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {t.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{t.namaBarang}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{t.deskripsi}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getUrgencyBadge(t.urgensi)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'Menunggu Suku Cadang'
                            ? 'bg-amber-100 text-amber-800'
                            : t.status === 'Perbaikan'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{t.pelapor}</div>
                      <div className="text-[11px] text-slate-500">{t.lokasi}</div>
                    </td>
                    <td className="px-4 py-3">
                      {t.sukuCadangList && t.sukuCadangList.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          <Wrench className="w-2.5 h-2.5" />
                          {t.sukuCadangList.length} Komponen
                        </span>
                      ) : t.delegasiDari ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-50 text-violet-800 border border-violet-200 text-[10px] font-semibold">
                          <Send className="w-2.5 h-2.5" />
                          Delegasi: {t.delegasiDari.split(',')[0]}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('kelola-tiket')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Proses Tiket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
