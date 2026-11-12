import React, { useState } from 'react';
import {
  ShieldCheck,
  Package,
  Layers,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Code2,
  Users,
  Server,
  Cpu,
  FileText,
  Lock,
  ExternalLink,
  ChevronRight,
  Building2,
  Workflow,
  Sparkles,
  BarChart3,
  Award,
  BookOpen,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { AppDatabase } from '../services/db';

interface LandingPageViewProps {
  onLogin: () => void;
  onQuickTrack: (ticketId: string) => void;
  onSelectRoleQuick: (roleCode: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onLogin,
  onQuickTrack,
  onSelectRoleQuick
}) => {
  const [activeSopTab, setActiveSopTab] = useState<'pinjam' | 'rusak' | 'sistem'>('pinjam');
  const [trackInput, setTrackInput] = useState('');
  const stats = AppDatabase.getStatistics();

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onQuickTrack(trackInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* HERO NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Pusdatin_c64eee6c.png"
              alt="Logo PUSDATIN UMC"
              className="h-11 w-auto object-contain"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-950">PAHAM</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-red-100 text-red-700 rounded border border-red-200">
                  UMC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                PUSDATIN Asset & Helpdesk Assistance Management
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#tentang-sistem" className="hover:text-red-700 transition-colors">
              Tentang Sistem
            </a>
            <a href="#alur-sop" className="hover:text-red-700 transition-colors">
              Alur SOP Layanan
            </a>
            <a href="#profil-pusdatin" className="hover:text-red-700 transition-colors">
              Profil PUSDATIN
            </a>
            <a href="#struktur-organisasi" className="hover:text-red-700 transition-colors">
              Struktur Organisasi
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login SSO Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50/60 via-slate-50 to-white pt-12 pb-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Portal Resmi Pelayanan Aset & Helpdesk TI Kampus</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              Sistem Tata Kelola Aset, Layanan Helpdesk & Usulan Sistem Terpadu
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              <strong>PAHAM</strong> (PUSDATIN Asset & Helpdesk Assistance Management) mengintegrasikan
              inventarisasi aset kampus berbasis barcode/QR, peminjaman perangkat, penanganan kerusakan berstandar SLA,
              hingga tata kelola pengajuan aplikasi baru di lingkungan Universitas Muhammadiyah Cirebon.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onLogin}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Masuk</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <a
                href="#alur-sop"
                className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>Pelajari Alur SOP</span>
              </a>
            </div>

            {/* Quick Ticket Tracker */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto text-left">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-red-600" />
                <span>Lacak Status Tiket Cepat (Peminjaman / Laporan Kerusakan):</span>
              </div>
              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={trackInput}
                  onChange={e => setTrackInput(e.target.value)}
                  placeholder="Masukkan Nomor Tiket (contoh: TKT-2026-..., PINJAM-...)"
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  Lacak
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PENJELASAN SISTEM PAHAM */}
      <section id="tentang-sistem" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-red-600">
              Transformasi Digital Kampus
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              Mengenal Sistem PAHAM PUSDATIN UMC
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              PAHAM (PUSDATIN Asset & Helpdesk Assistance Management) adalah platform terpadu
              yang dibangun untuk menjamin akuntabilitas, transparansi, dan kecepatan respon
              terhadap seluruh kebutuhan teknologi informasi di Universitas Muhammadiyah Cirebon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">1. Manajemen Aset & Kode Unik QR</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencatatan aset sejak Buku Penerimaan (faktur multi-item), registrasi fisik ber-barcode unik,
                pengeluaran ke unit kerja, hingga Buku Aset Inventaris yang menghitung saldo stok riil kampus secara otomatis.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">2. Helpdesk & Tiket SLA Berjenjang</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penanganan gangguan perangkat keras, jaringan internet, dan software dengan SLA terukur (Kritis 4 jam, Tinggi 12 jam,
                Sedang 24 jam). Dilengkapi tahap investigasi, pengadaan suku cadang, hingga penutupan tiket.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">3. Siklus Usulan Sistem & Aplikasi Baru</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fasilitas resmi bagi Dosen dan Unit Kerja untuk mengusulkan sistem informasi baru. Melewati verifikasi
                analis sistem, uji keamanan siber, otorisasi pimpinan, hingga sprint pengembangan oleh tim developer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ALUR SOP (Standard Operating Procedure) */}
      <section id="alur-sop" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Standar Operasional Prosedur
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              Alur SOP Pelayanan PUSDATIN UMC
            </h2>
            <p className="text-sm text-slate-600">
              Pelajari alur langkah terstandar untuk peminjaman aset, pelaporan kerusakan, dan usulan aplikasi baru.
            </p>
          </div>

          {/* SOP Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs">
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
            </div>
          </div>

          {/* SOP Step Content */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-5xl mx-auto">
            {activeSopTab === 'pinjam' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-red-600" />
                    <span>Alur SOP Peminjaman Aset TI (Civitas Akademika)</span>
                  </h3>
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    5 Tahap Standar
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                    <h4 className="font-bold text-xs text-slate-900">Pengajuan Online</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      User login via SSO Google dan mengisi formulir peminjaman dengan data kegiatan & tanggal pinjam.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</div>
                    <h4 className="font-bold text-xs text-slate-900">Verifikasi Admin</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Admin memeriksa ketersediaan unit fisik dan mengalokasikan barcode perangkat yang siap pakai.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</div>
                    <h4 className="font-bold text-xs text-slate-900">Persetujuan Tiket</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Pimpinan menyetujui tiket peminjaman (status beralih menjadi Disetujui).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">4</div>
                    <h4 className="font-bold text-xs text-slate-900">Serah Terima Fisik</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Peminjam mengambil unit di Ruang PUSDATIN dan memeriksa kelengkapan perangkat.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
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
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>Alur SOP Pelaporan & Penanganan Kerusakan IT (Helpdesk SLA)</span>
                  </h3>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Tahap 1 s/d Tahap 6
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center">1</div>
                    <h4 className="font-bold text-xs text-slate-900">Lapor Rusak</h4>
                    <p className="text-[10px] text-slate-500">Pelapor submit kendala & kode aset via formulir PAHAM.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center">2</div>
                    <h4 className="font-bold text-xs text-slate-900">Tahap 2: Triage</h4>
                    <p className="text-[10px] text-slate-500">Khusus Pimpinan PUSDATIN & Admin mendisposisi ke PIC Teknisi.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">3</div>
                    <h4 className="font-bold text-xs text-slate-900">Tahap 3: Inspeksi</h4>
                    <p className="text-[10px] text-slate-500">Teknisi memeriksa dan menjadwalkan tindakan perbaikan.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">4</div>
                    <h4 className="font-bold text-xs text-slate-900">Tahap 4: Tindakan</h4>
                    <p className="text-[10px] text-slate-500">Eksekusi teknis / 4.a Butuh Suku Cadang / 4.b Afkir Rusak Total.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center">5</div>
                    <h4 className="font-bold text-xs text-slate-900">Tahap 5: Lanjutan</h4>
                    <p className="text-[10px] text-slate-500">Suku cadang tiba, perbaikan dilanjutkan sampai tuntas.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">6</div>
                    <h4 className="font-bold text-xs text-emerald-950">Tahap 6: Resolusi</h4>
                    <p className="text-[10px] text-emerald-800">Tiket dinyatakan Resolved & aset siap digunakan kembali.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSopTab === 'sistem' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-emerald-600" />
                    <span>Alur SOP Pengajuan & Pengembangan Sistem Baru (Khusus Dosen & Karyawan)</span>
                  </h3>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Siklus Rekayasa Software
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                    <h4 className="font-bold text-xs text-slate-900">Pengajuan Kebutuhan</h4>
                    <p className="text-[11px] text-slate-500">
                      Dosen atau unit kerja mengajukan latar belakang dan sasaran sistem yang dibutuhkan.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</div>
                    <h4 className="font-bold text-xs text-slate-900">Analisis Kebutuhan</h4>
                    <p className="text-[11px] text-slate-500">
                      System Analyst & Data Governance Specialist menyusun arsitektur data & estimasi sprint.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</div>
                    <h4 className="font-bold text-xs text-slate-900">Audit Keamanan</h4>
                    <p className="text-[11px] text-slate-500">
                      Cyber Security Officer menguji risiko keamanan, enkripsi data, dan kepatuhan privasi.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">4</div>
                    <h4 className="font-bold text-xs text-slate-900">Approval Pimpinan</h4>
                    <p className="text-[11px] text-slate-500">
                      Pimpinan PUSDATIN memberikan persetujuan alokasi sumber daya dan jadwal sprint.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
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
        </div>
      </section>

      {/* 6. PROFIL PUSDATIN UMC & TUPOKSI */}
      <section id="profil-pusdatin" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="p-3 bg-red-50 rounded-2xl border border-red-100 inline-block">
                <img
                  src="/assets/aistudio/umc_seal_logo_31e5fdc7.png"
                  alt="Seal UMC"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                Pusat Data dan Teknologi Informasi (PUSDATIN) UMC
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                PUSDATIN adalah unit pelaksana teknis di lingkungan Universitas Muhammadiyah Cirebon
                yang bertugas merencanakan, mengembangkan, mengelola, serta memelihara seluruh infrastruktur jaringan,
                sistem informasi, keamanan siber, dan data terpadu guna mendukung Tri Dharma Perguruan Tinggi yang unggul dan berkemajuan.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p><strong>Lokasi Operasional:</strong> Gedung Laboratorium Terpadu Lantai 2, Kampus 2 UMC</p>
                <p><strong>Kontak Layanan:</strong> helpdesk-pusdatin@umc.ac.id | Telp: (0231) 204276</p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-red-600" />
                <span>Tugas Pokok & Fungsi (Tupoksi) PUSDATIN UMC</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <h4 className="font-bold text-xs text-slate-900">Infrastruktur & Cloud Computing</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Menyediakan konektivitas Wi-Fi kampus, routing switch, server VPS, domain, email institusi, dan data center berkeandalan tinggi.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <h4 className="font-bold text-xs text-slate-900">Pengembangan Sistem & SIAKAD</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Membangun, mengintegrasikan, dan memelihara aplikasi akademik, kepegawaian, keuangan, dan sistem informasi manajemen universitas.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <h4 className="font-bold text-xs text-slate-900">Helpdesk & IT Support Lapangan</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Memberikan asistensi teknis, perbaikan perangkat komputer dosen/karyawan, multimedia ruang kuliah, dan peminjaman inventaris.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <h4 className="font-bold text-xs text-slate-900">Keamanan Siber & Tata Kelola Data</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Melakukan mitigasi insiden siber, audit kerentanan, enkripsi data civitas, dan standardisasi hak akses sistem informasi kampus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. STRUKTUR ORGANISASI PUSDATIN UMC (BAGAN RESMI) */}
      <section id="struktur-organisasi" className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Hirarki & Tata Kerja
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Struktur Organisasi PUSDATIN UMC
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Bagan resmi struktur organisasi dan pembagian divisi di lingkungan PUSDATIN Universitas Muhammadiyah Cirebon
            </p>
          </div>

          {/* Interactive Organizational Hierarchy Chart */}
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Level 1: Rektor */}
            <div className="flex justify-center">
              <div className="bg-slate-800 border-2 border-amber-400/80 p-4 rounded-2xl text-center w-72 shadow-lg">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                  Pimpinan Universitas
                </span>
                <h4 className="font-extrabold text-sm text-white mt-0.5">Rektor</h4>
                <p className="text-xs text-slate-300">Prof. Dr. H. Arif Nurudin, M.T.</p>
              </div>
            </div>

            {/* Connector */}
            <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

            {/* Level 2: Wakil Rektor 1 */}
            <div className="flex justify-center">
              <div className="bg-slate-800 border border-slate-600 p-3.5 rounded-2xl text-center w-80 shadow-md">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Bidang Akademik & Sistem Informasi
                </span>
                <h4 className="font-extrabold text-sm text-white mt-0.5">Wakil Rektor 1</h4>
                <p className="text-xs text-slate-300">Dr. Hj. Eni Murniasih, M.Pd.</p>
              </div>
            </div>

            {/* Connector */}
            <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

            {/* Level 3: Pimpinan PUSDATIN */}
            <div className="flex justify-center">
              <div className="bg-red-950/90 border-2 border-red-500 p-4 rounded-2xl text-center w-88 shadow-xl">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block">
                  Kepala Unit Pelaksana Teknis
                </span>
                <h4 className="font-black text-base text-white mt-0.5">Pimpinan PUSDATIN</h4>
                <p className="text-xs font-semibold text-slate-200">Dr. Ir. H. Ahmad Dahlan, M.T.</p>
              </div>
            </div>

            {/* Connector to Divisions */}
            <div className="w-0.5 h-8 bg-slate-700 mx-auto" />

            {/* Level 4: 4 Bidang Spesialis PUSDATIN */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Bidang 1 */}
              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-red-400 uppercase block">Admin Sistem</span>
                <h5 className="font-bold text-xs text-white">IT Support & Helpdesk Specialist</h5>
                <p className="text-[11px] text-slate-300">Aditiya Ahmad Fadila, S.Kom.</p>
                <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-700/60">
                  Manajemen Aset, Faktur, Helpdesk & Tiket SLA
                </div>
              </div>

              {/* Bidang 2 */}
              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase block">Infrastruktur</span>
                <h5 className="font-bold text-xs text-white">Cloud & Infrastructure Engineer</h5>
                <p className="text-[11px] text-slate-300">Ir. Faisal Hakim, M.T.</p>
                <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-700/60">
                  Jaringan Kampus, Server VPS & Cloud NOC
                </div>
              </div>

              {/* Bidang 3: System Analyst & Developers */}
              <div className="bg-slate-800/90 border border-purple-500/50 p-4 rounded-2xl space-y-2 md:col-span-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase block">Sistem & Data</span>
                <h5 className="font-bold text-xs text-white">System Analyst & Data Governance</h5>
                <p className="text-[11px] text-slate-300">Novi Andriani, M.Kom.</p>

                {/* Sub-teams: Lead Dev & Programmers */}
                <div className="pt-2 border-t border-slate-700/60 space-y-1.5 text-[10px]">
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700 text-slate-300">
                    <strong className="text-white block">Lead Full Stack Developer:</strong>
                    Bayu Pratama, S.Kom.
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700 text-slate-300">
                    <strong className="text-white block">Frontend Programmers:</strong>
                    Dimas Saputra, S.Kom. (UI/UX)
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700 text-slate-300">
                    <strong className="text-white block">Backend Programmers:</strong>
                    Eko Prasetyo, S.Kom. (API/DB)
                  </div>
                </div>
              </div>

              {/* Bidang 4 */}
              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Keamanan Siber</span>
                <h5 className="font-bold text-xs text-white">Cyber Security Officer</h5>
                <p className="text-[11px] text-slate-300">Rian Hidayat, M.Kom.</p>
                <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-700/60">
                  Audit Keamanan, Proteksi Data & Enkripsi
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Pusdatin_c64eee6c.png"
              alt="Logo PUSDATIN UMC"
              className="h-8 w-auto object-contain brightness-90"
            />
            <div>
              <div className="font-bold text-slate-200">
                PUSDATIN Universitas Muhammadiyah Cirebon
              </div>
              <div className="text-[11px] text-slate-500">
                Sistem Informasi PAHAM - Versi 4.0 Terintegrasi
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Hak Cipta © 2026 UMC. Hak Cipta Dilindungi Undang-Undang.</span>
            <button
              type="button"
              onClick={onLogin}
              className="text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
            >
              Login Petugas
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
