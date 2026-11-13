import React, { useState } from 'react';
import { AppStatistics } from '../../types';
import { AppDatabase } from '../../services/db';
import {
  Handshake,
  AlertTriangle,
  Wrench,
  Search,
  ShieldCheck,
  Workflow,
  Code2,
  Info,
  ArrowRight
} from 'lucide-react';

interface UserDashboardProps {
  stats: AppStatistics;
  onNavigateTab: (tabId: string) => void;
  onSelectAssetForLoan?: (assetName: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigateTab
}) => {
  const activeUser = AppDatabase.getActiveUser();
  const isMahasiswa = activeUser?.civitasType === 'Mahasiswa';
  const [activeSopTab, setActiveSopTab] = useState<'pinjam' | 'rusak' | 'sistem'>('pinjam');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-red-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-13_at_10.12.42_2b1f1e05.jpeg"
            alt="Watermark UMC"
            className="w-60 h-60 object-contain rounded-full"
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

            {!isMahasiswa && (
              <button
                type="button"
                onClick={() => onNavigateTab('pengajuan-sistem-user')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors backdrop-blur-xs cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>Ajukan Sistem Baru (F-DEV-01)</span>
              </button>
            )}

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

      {/* Alur SOP (Standard Operating Procedure) - Disamakan persis dengan Landing Page */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600">
            Standar Operasional Prosedur
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950">
            Alur SOP Pelayanan PUSDATIN UMC
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {isMahasiswa
              ? 'Pelajari alur langkah terstandar untuk peminjaman aset dan pelaporan kerusakan perangkat kampus.'
              : 'Pelajari alur langkah terstandar untuk peminjaman aset, pelaporan kerusakan, dan usulan aplikasi baru.'}
          </p>
        </div>

        {/* SOP Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSopTab('pinjam')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSopTab === 'pinjam'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SOP Peminjaman Aset
            </button>
            <button
              type="button"
              onClick={() => setActiveSopTab('rusak')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSopTab === 'rusak'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SOP Lapor Kerusakan
            </button>
            {!isMahasiswa && (
              <button
                type="button"
                onClick={() => setActiveSopTab('sistem')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSopTab === 'sistem'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SOP Usulan Sistem Baru
              </button>
            )}
          </div>
        </div>

        {/* SOP Step Content */}
        <div className="bg-slate-50/60 p-6 rounded-2xl border border-slate-200">
          {activeSopTab === 'pinjam' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-red-600" />
                  <span>Alur SOP Peminjaman Aset TI (Civitas Akademika)</span>
                </h3>
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-200">
                  5 Tahap Standar
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                  <h4 className="font-bold text-xs text-slate-900">Pengajuan Online</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    User login via SSO Google dan mengisi formulir peminjaman dengan data kegiatan & tanggal pinjam.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</div>
                  <h4 className="font-bold text-xs text-slate-900">Verifikasi Admin</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Admin memeriksa ketersediaan unit fisik dan mengalokasikan barcode perangkat yang siap pakai.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</div>
                  <h4 className="font-bold text-xs text-slate-900">Persetujuan Tiket</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pimpinan menyetujui tiket peminjaman (status beralih menjadi Disetujui).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">4</div>
                  <h4 className="font-bold text-xs text-slate-900">Serah Terima Fisik</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Peminjam mengambil unit di Ruang PUSDATIN dan memeriksa kelengkapan perangkat.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">5</div>
                  <h4 className="font-bold text-xs text-emerald-950">Diterima Kembali</h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Pengembalian fisik, pengecekan kelayakan unit, dan pencetakan Berita Acara resmi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSopTab === 'rusak' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Alur SOP Pelaporan & Penanganan Kerusakan IT (Helpdesk SLA)</span>
                </h3>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                  Tahap 1 s/d Tahap 6
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center">1</div>
                  <h4 className="font-bold text-xs text-slate-900">Lapor Rusak</h4>
                  <p className="text-[10px] text-slate-500">Pelapor submit kendala & kode aset via formulir PAHAM.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center">2</div>
                  <h4 className="font-bold text-xs text-slate-900">Tahap 2: Triage</h4>
                  <p className="text-[10px] text-slate-500">Khusus Pimpinan PUSDATIN & Admin mendisposisi ke PIC Teknisi.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">3</div>
                  <h4 className="font-bold text-xs text-slate-900">Tahap 3: Inspeksi</h4>
                  <p className="text-[10px] text-slate-500">Teknisi memeriksa dan menjadwalkan tindakan perbaikan.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">4</div>
                  <h4 className="font-bold text-xs text-slate-900">Tahap 4: Tindakan</h4>
                  <p className="text-[10px] text-slate-500">Eksekusi teknis / 4.a Butuh Suku Cadang / 4.b Afkir Rusak Total.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center">5</div>
                  <h4 className="font-bold text-xs text-slate-900">Tahap 5: Lanjutan</h4>
                  <p className="text-[10px] text-slate-500">Suku cadang tiba, perbaikan dilanjutkan sampai tuntas.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">6</div>
                  <h4 className="font-bold text-xs text-emerald-950">Tahap 6: Resolusi</h4>
                  <p className="text-[10px] text-emerald-800">Tiket dinyatakan Resolved & aset siap digunakan kembali.</p>
                </div>
              </div>
            </div>
          )}

          {!isMahasiswa && activeSopTab === 'sistem' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-emerald-600" />
                  <span>Alur SOP Pengajuan & Pengembangan Sistem Baru (Khusus Dosen & Karyawan)</span>
                </h3>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                  Siklus Rekayasa Software
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                  <h4 className="font-bold text-xs text-slate-900">Pengajuan Kebutuhan</h4>
                  <p className="text-[11px] text-slate-500">
                    Dosen atau unit kerja mengajukan latar belakang dan sasaran sistem yang dibutuhkan.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</div>
                  <h4 className="font-bold text-xs text-slate-900">Analisis Kebutuhan</h4>
                  <p className="text-[11px] text-slate-500">
                    System Analyst & Data Governance Specialist menyusun arsitektur data & estimasi sprint.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</div>
                  <h4 className="font-bold text-xs text-slate-900">Audit Keamanan</h4>
                  <p className="text-[11px] text-slate-500">
                    Cyber Security Officer menguji risiko keamanan, enkripsi data, dan kepatuhan privasi.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">4</div>
                  <h4 className="font-bold text-xs text-slate-900">Approval Pimpinan</h4>
                  <p className="text-[11px] text-slate-500">
                    Pimpinan PUSDATIN memberikan persetujuan alokasi sumber daya dan jadwal sprint.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">5</div>
                  <h4 className="font-bold text-xs text-emerald-950">Sprint Pengembangan</h4>
                  <p className="text-[11px] text-emerald-800">
                    Lead Developer, Frontend & Backend Programmer mengeksekusi coding hingga rilis.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Ruang Layanan */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-950">
          <div>
            <span className="font-bold flex items-center gap-1.5 mb-1">
              <Info className="w-4 h-4 text-red-600" />
              Ruang Layanan PUSDATIN UMC:
            </span>
            <span>Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon. Jam operasional : Senin - Jum'at 08.00 - 16.00 WIB, Sabtu 08.00 - 14.00 WIB</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('ajukan-pinjam')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shrink-0 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Mulai Peminjaman</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
