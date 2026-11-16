import React, { useState, useEffect } from 'react';
import { AppDatabase } from '../../services/db';
import { PdfReportService } from '../../services/pdfReportService';
import {
  computeSlaEvaluation,
  computeLoanSlaEvaluation,
  computeProposalSlaEvaluation,
  canReopenResolvedTicket,
  REOPEN_WINDOW_HOURS
} from '../../services/slaService';
import {
  isDamageEligibleForSurvey,
  isLoanEligibleForSurvey,
  isProposalEligibleForSurvey,
  getEmojiForScore
} from '../../services/surveyService';
import { CsatSurveyModal } from './CsatSurveyModal';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Package,
  Wrench,
  Check,
  RotateCcw,
  Cpu,
  Gauge,
  MessageSquare,
  GitBranch,
  Send,
  Info,
  Star,
  Sparkles,
  Code2,
  Smartphone
} from 'lucide-react';
import { buildAndroidReceiptSchemeUrl } from '../../services/bluetoothPrintService';
import { LoanTicket, DamageTicket, SystemProposal, SurveyModuleType } from '../../types';

interface TicketTrackerProps {
  initialSearchId?: string;
}

export const TicketTracker: React.FC<TicketTrackerProps> = ({ initialSearchId = '' }) => {
  const [query, setQuery] = useState(initialSearchId);
  const [matchedLoans, setMatchedLoans] = useState<LoanTicket[]>([]);
  const [matchedDamages, setMatchedDamages] = useState<DamageTicket[]>([]);
  const [matchedProposals, setMatchedProposals] = useState<SystemProposal[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [needMoreInfoReplyMap, setNeedMoreInfoReplyMap] = useState<Record<string, string>>({});
  const [reopenReasonMap, setReopenReasonMap] = useState<Record<string, string>>({});
  const [trackerFeedback, setTrackerFeedback] = useState<
    Record<string, { type: 'success' | 'error'; message: string }>
  >({});
  const [surveyVersion, setSurveyVersion] = useState(0);
  const [surveySuccessBanner, setSurveySuccessBanner] = useState<string | null>(null);
  const [activeSurveyTarget, setActiveSurveyTarget] = useState<{
    moduleType: SurveyModuleType;
    entityId: string;
    entityTitle: string;
    technicianOrPic?: string;
    defaultRespondentName?: string;
    defaultRespondentUnit?: string;
  } | null>(null);

  const serviceSlaConfig = AppDatabase.getServiceSlaConfig();
  const activeUser = AppDatabase.getActiveUser();

  const handleSearch = (keywordToSearch?: string) => {
    const q = (keywordToSearch ?? query).trim().toLowerCase();
    if (!q) return;

    const allLoans = AppDatabase.getLoans();
    const allDamages = AppDatabase.getDamageTickets();
    const allProposals = AppDatabase.getSystemProposals();

    const loans = allLoans.filter(l =>
      l.id.toLowerCase().includes(q) ||
      l.peminjam.toLowerCase().includes(q) ||
      (l.barcode && l.barcode.toLowerCase().includes(q)) ||
      l.barangPinjaman.toLowerCase().includes(q) ||
      l.nik.toLowerCase().includes(q)
    );

    const damages = allDamages.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.barcode.toLowerCase().includes(q) ||
      d.namaBarang.toLowerCase().includes(q) ||
      d.pelapor.toLowerCase().includes(q) ||
      (d.kontakPelapor && d.kontakPelapor.includes(q))
    );

    const proposals = allProposals.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.namaSistem.toLowerCase().includes(q) ||
      p.pemohon.toLowerCase().includes(q) ||
      p.unitKerja.toLowerCase().includes(q)
    );

    setMatchedLoans(loans);
    setMatchedDamages(damages);
    setMatchedProposals(proposals);
    setHasSearched(true);
  };

  useEffect(() => {
    if (initialSearchId) {
      setQuery(initialSearchId);
      handleSearch(initialSearchId);
    }
  }, [initialSearchId]);

  const downloadReceipt = (loan: LoanTicket) => {
    const doc = PdfReportService.generateLoanReceiptPdf(loan);
    const fileName = loan.status === 'Dikembalikan'
      ? `Berita_Acara_Pengembalian_${loan.id}.pdf`
      : `Berita_Acara_Peminjaman_${loan.id}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Cek Progres Laporan & Tiket Peminjaman
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pantau status penanganan peminjaman aset maupun progres perbaikan barang secara real-time menggunakan ID Tiket atau Barcode.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Masukkan ID Tiket (PJM-... / TKT-... / PRB-... / RFC-...) atau Barcode Aset..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            Lacak Tiket
          </button>
        </div>

        {/* Quick Suggestion Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-500">
          <span>Contoh cepat:</span>
          <button
            type="button"
            onClick={() => { setQuery('PJM-20261102-1042'); handleSearch('PJM-20261102-1042'); }}
            className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            PJM-20261102-1042
          </button>
          <button
            type="button"
            onClick={() => { setQuery('TKT-20261105-088'); handleSearch('TKT-20261105-088'); }}
            className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            TKT-20261105-088
          </button>
          <button
            type="button"
            onClick={() => { setQuery('SYS-2026-003'); handleSearch('SYS-2026-003'); }}
            className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            SYS-2026-003
          </button>
          <button
            type="button"
            onClick={() => { setQuery('TKT-20261106-101'); handleSearch('TKT-20261106-101'); }}
            className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            TKT-20261106-101
          </button>
        </div>
      </div>

      {surveySuccessBanner && (
        <div
          data-testid="survey-success-banner"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2.5 shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{surveySuccessBanner}</span>
        </div>
      )}

      {/* Layanan Selesai / Go-Live yang Siap Survei Kepuasan (CSAT) */}
      {!hasSearched && (() => {
        const eligibleIncidents = AppDatabase.getDamageTickets().filter(isDamageEligibleForSurvey).slice(0, 2);
        const eligibleLoans = AppDatabase.getLoans().filter(isLoanEligibleForSurvey).slice(0, 2);
        const eligibleProposals = AppDatabase.getSystemProposals().filter(isProposalEligibleForSurvey).slice(0, 2);
        const hasAny = eligibleIncidents.length + eligibleLoans.length + eligibleProposals.length > 0;
        if (!hasAny) return null;

        return (
          <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-4" data-testid="ready-for-survey-section">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Layanan Selesai &amp; Pasca-Implementasi — Siap Survei Kepuasan (CSAT ITIL)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik layanan di bawah ini untuk melihat progres SLA atau langsung mengisi survei kepuasan pengguna (skala 1–5).
                </p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                Continual Improvement
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {eligibleIncidents.map(inc => {
                const existing = AppDatabase.getSurveyByEntity('Incident', inc.id);
                return (
                  <div key={inc.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Laporan Kerusakan · {inc.status}</span>
                      <p className="font-bold text-slate-900 mt-1.5 line-clamp-1">{inc.namaBarang}</p>
                      <p className="font-mono text-[11px] text-slate-500">{inc.id} · {inc.pelapor}</p>
                    </div>
                    {existing ? (
                      <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sudah Disurvei ({existing.averageScore}/5 {getEmojiForScore(existing.averageScore)})</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid={`open-survey-${inc.id}`}
                        onClick={() =>
                          setActiveSurveyTarget({
                            moduleType: 'Incident',
                            entityId: inc.id,
                            entityTitle: inc.namaBarang,
                            technicianOrPic: inc.picTeknisi,
                            defaultRespondentName: inc.pelapor
                          })
                        }
                        className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span>Isi Survei Kerusakan</span>
                      </button>
                    )}
                  </div>
                );
              })}

              {eligibleLoans.map(ln => {
                const existing = AppDatabase.getSurveyByEntity('Loan', ln.id);
                return (
                  <div key={ln.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">Peminjaman Aset · {ln.status}</span>
                      <p className="font-bold text-slate-900 mt-1.5 line-clamp-1">{ln.barangPinjaman}</p>
                      <p className="font-mono text-[11px] text-slate-500">{ln.id} · {ln.peminjam}</p>
                    </div>
                    {existing ? (
                      <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sudah Disurvei ({existing.averageScore}/5 {getEmojiForScore(existing.averageScore)})</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid={`open-survey-${ln.id}`}
                        onClick={() =>
                          setActiveSurveyTarget({
                            moduleType: 'Loan',
                            entityId: ln.id,
                            entityTitle: ln.barangPinjaman,
                            technicianOrPic: ln.petugas,
                            defaultRespondentName: ln.peminjam,
                            defaultRespondentUnit: ln.unit
                          })
                        }
                        className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span>Isi Survei Peminjaman</span>
                      </button>
                    )}
                  </div>
                );
              })}

              {eligibleProposals.map(prop => {
                const existing = AppDatabase.getSurveyByEntity('SystemProposal', prop.id);
                return (
                  <div key={prop.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Pasca-Implementasi · Go-Live</span>
                      <p className="font-bold text-slate-900 mt-1.5 line-clamp-1">{prop.namaSistem}</p>
                      <p className="font-mono text-[11px] text-slate-500">{prop.id} · {prop.unitKerja}</p>
                    </div>
                    {existing ? (
                      <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sudah Disurvei ({existing.averageScore}/5 {getEmojiForScore(existing.averageScore)})</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid={`open-survey-${prop.id}`}
                        onClick={() =>
                          setActiveSurveyTarget({
                            moduleType: 'SystemProposal',
                            entityId: prop.id,
                            entityTitle: prop.namaSistem,
                            technicianOrPic: 'Tim Pengembang PUSDATIN',
                            defaultRespondentName: activeUser.nama,
                            defaultRespondentUnit: prop.unitKerja
                          })
                        }
                        className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span>Evaluasi Pasca Go-Live</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Results View */}
      {hasSearched && (
        <div className="space-y-6">
          {matchedLoans.length === 0 && matchedDamages.length === 0 && matchedProposals.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Data Tiket Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Pastikan nomor ID Tiket atau Barcode yang Anda masukkan sudah benar. Anda juga dapat mencari berdasarkan nama peminjam, pelapor, atau pengusul sistem.
              </p>
            </div>
          ) : (
            <>
              {/* Matched Loans */}
              {matchedLoans.map(loan => {
                const isWaiting = loan.status === 'Diajukan' || loan.status === 'Menunggu';
                const isApproved =
                  loan.status === 'Dikonfirmasi' ||
                  loan.status === 'Diterima' ||
                  loan.status === 'Diserahkan' ||
                  loan.status === 'Disetujui' ||
                  loan.status === 'Terlambat';
                const isReturned =
                  loan.status === 'Dikembalikan' ||
                  loan.status === 'Diterima Kembali' ||
                  loan.status === 'Ditutup';
                const isRejected = loan.status === 'Ditolak';
                const displayLoanStatus = isWaiting
                  ? 'Baru'
                  : loan.status === 'Dikonfirmasi'
                  ? 'Dikonfirmasi'
                  : loan.status === 'Diserahkan'
                  ? 'Diserahkan'
                  : loan.status;

                return (
                  <div key={loan.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* Header Strip */}
                    <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-red-700">{loan.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            Peminjaman Aset
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Diajukan oleh: <strong>{loan.peminjam}</strong> ({loan.unit}) · Diajukan pada: {loan.tglAju}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => downloadReceipt(loan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-red-600" />
                            <span>Cetak Bukti Pinjam (PDF)</span>
                          </button>
                        )}

                        <a
                          href={buildAndroidReceiptSchemeUrl({
                            title: 'BUKTI TIKET PEMINJAMAN ASET',
                            subtitle: loan.id,
                            barcode: loan.barcode || undefined,
                            lines: [
                              { label: 'Peminjam', value: loan.peminjam },
                              { label: 'Unit', value: loan.unit },
                              { label: 'Perangkat', value: loan.namaBarangT || loan.barangPinjaman },
                              { label: 'Tgl Pinjam', value: loan.tglPinjam },
                              { label: 'Tgl Kembali', value: loan.tglKembali },
                              { label: 'Status', value: displayLoanStatus }
                            ]
                          })}
                          data-testid={`android-bt-print-loan-${loan.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Struk Android (BT)</span>
                        </a>

                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' :
                          isWaiting ? 'bg-sky-100 text-sky-800' :
                          isReturned ? 'bg-blue-100 text-blue-800' :
                          isRejected ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {displayLoanStatus}
                        </span>
                      </div>
                    </div>

                    {/* ENHANCEMENT B.1a: INFORMASI PENGAMBILAN ASET UNTUK USER */}
                    {isApproved && (
                      <div className="bg-emerald-50/80 border-b border-emerald-200/80 p-4 px-6 text-xs text-emerald-950">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-emerald-900">
                                Informasi Pengambilan & Serah Terima Aset
                              </span>
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300">
                                {loan.metodePengambilan || 'Diambil di Ruang PUSDATIN'}
                              </span>
                            </div>
                            <p className="text-slate-700">
                              <strong>Kapan Bisa Diambil/Diterima:</strong>{' '}
                              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                {loan.jadwalPengambilan || `${loan.tglAmbil || loan.tglPinjam} pukul 09:00 WIB`}
                              </span>
                            </p>
                            <p className="text-slate-700">
                              <strong>Lokasi / Alur Serah Terima:</strong>{' '}
                              <span>{loan.lokasiPengambilan || 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon)'}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Details Table */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Barang yang Diminta:</span>
                          <span className="font-semibold text-slate-900">{loan.barangPinjaman} ({loan.jumlah} Unit)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Periode Pinjam:</span>
                          <span className="font-semibold text-slate-900">{loan.tglPinjam} s/d {loan.tglKembali}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">NIDN/NIK/NIM:</span>
                          <span className="font-mono text-slate-900">{loan.nik}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Barcode Aset Dialokasikan:</span>
                          <span className="font-mono font-bold text-red-700">{loan.barcode || '- Belum dialokasikan -'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Petugas PUSDATIN:</span>
                          <span className="font-semibold text-slate-900">{loan.petugas || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Catatan Khusus:</span>
                          <span className="text-slate-700">{loan.catatan || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* OVERDUE / UNRETURNED NOTICE FOR BORROWERS */}
                    {isApproved && (
                      <div className="px-6 pb-6">
                        {(() => {
                          const today = new Date().toISOString().split('T')[0];
                          const isOverdue = loan.tglKembali < today;
                          const isDueToday = loan.tglKembali === today;

                          if (isOverdue) {
                            return (
                              <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs space-y-1">
                                <div className="flex items-center gap-2 font-bold text-red-700">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  <span>PERINGATAN: ASET BELUM DIKEMBALIKAN (TENGGAT TERLEWATI)</span>
                                </div>
                                <p className="leading-relaxed text-red-800">
                                  Batas waktu peminjaman adalah <strong>{loan.tglKembali}</strong>. Fisik perangkat belum dicatat kembali di sistem PUSDATIN UMC. Harap segera menyerahkan kembali barang inventaris beserta seluruh kelengkapannya ke Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon) untuk penerbitan Berita Acara Pengembalian.
                                </p>
                              </div>
                            );
                          }

                          if (isDueToday) {
                            return (
                              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
                                <div className="flex items-center gap-2 font-bold text-amber-800">
                                  <Clock className="w-4 h-4 shrink-0" />
                                  <span>PENGINGAT: HARI INI BATAS AKHIR PENGEMBALIAN ASET</span>
                                </div>
                                <p className="leading-relaxed text-amber-800">
                                  Masa peminjaman berakhir hari ini ({loan.tglKembali}). Mohon kembalikan perangkat ke Ruang PUSDATIN sebelum jam operasional kantor berakhir.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                              <span>📌 Status Peminjaman: <strong>Aktif Digunakan</strong> (Batas waktu: <strong>{loan.tglKembali}</strong>).</span>
                              <span className="text-[11px] text-emerald-700">Jaga kondisi aset dengan baik</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {/* SLA Service Request Indicator + CSAT Survey for Returned Loans */}
                    {(() => {
                      const loanSla = computeLoanSlaEvaluation(loan, serviceSlaConfig);
                      const existingLoanSurvey = AppDatabase.getSurveyByEntity('Loan', loan.id);
                      const canFillSurvey = isLoanEligibleForSurvey(loan);
                      return (
                        <div className="px-6 pb-6 space-y-3 text-xs">
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">
                              Komitmen SLA Layanan (ITIL):
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                Approval: <strong>{loanSla.approvalStatus}</strong> ({loanSla.approvalLabel})
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                Penyiapan Barang: <strong>{loanSla.fulfillmentStatus}</strong>
                              </span>
                            </div>
                          </div>

                          {canFillSurvey && (
                            existingLoanSurvey ? (
                              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Survei Kepuasan Peminjaman Telah Dikirim ({existingLoanSurvey.averageScore} / 5 {getEmojiForScore(existingLoanSurvey.averageScore)})</span>
                                </div>
                                <span className="text-[11px] text-emerald-700">Terima kasih atas partisipasi Anda!</span>
                              </div>
                            ) : (
                              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <span className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <span>Aset Telah Dikembalikan — Mohon Isi Survei Kepuasan (CSAT)</span>
                                  </span>
                                  <p className="text-indigo-800 text-[11px] mt-0.5">
                                    Bantu PUSDATIN meningkatkan kualitas perangkat dan kecepatan serah-terima peminjaman.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  data-testid={`open-survey-${loan.id}`}
                                  onClick={() =>
                                    setActiveSurveyTarget({
                                      moduleType: 'Loan',
                                      entityId: loan.id,
                                      entityTitle: loan.barangPinjaman,
                                      technicianOrPic: loan.petugas,
                                      defaultRespondentName: loan.peminjam,
                                      defaultRespondentUnit: loan.unit
                                    })
                                  }
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                                  <span>Isi Survei Kepuasan (1–5)</span>
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}

              {/* Matched Damage Reports with PIC and Spare Part status */}
              {matchedDamages.map(dmg => {
                const ticketType = dmg.ticketType || 'Incident';
                const canReopen = canReopenResolvedTicket(dmg);
                const feedback = trackerFeedback[dmg.id];

                return (
                <div key={dmg.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-base text-amber-700">{dmg.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                          ticketType === 'Problem'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : ticketType === 'RFC'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {ticketType === 'Problem' ? 'Problem Ticket' : ticketType === 'RFC' ? 'Change Request (RFC)' : 'Tiket Insiden'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Perangkat: <strong>{dmg.namaBarang}</strong> · Lokasi: {dmg.lokasi}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={buildAndroidReceiptSchemeUrl({
                          title: 'TIKET PERBAIKAN HELPDESK',
                          subtitle: dmg.id,
                          barcode: dmg.barcode && dmg.barcode !== 'Tanpa Barcode' ? dmg.barcode : undefined,
                          lines: [
                            { label: 'Pelapor', value: dmg.pelapor },
                            { label: 'Lokasi', value: dmg.lokasi || '-' },
                            { label: 'Perangkat', value: dmg.namaBarang },
                            { label: 'PIC Teknisi', value: dmg.picTeknisi || '-' },
                            { label: 'Urgensi', value: dmg.urgensi || 'Sedang' },
                            { label: 'Status', value: dmg.status }
                          ]
                        })}
                        data-testid={`android-bt-print-damage-${dmg.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Struk Android (BT)</span>
                      </a>

                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        dmg.status === 'Resolved' || dmg.status === 'Closed – Auto' || dmg.status === 'Closed – Manual' ? 'bg-emerald-100 text-emerald-800' :
                        dmg.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        dmg.status === 'Need More Info' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        dmg.status === 'Pending – Menunggu Suku Cadang' ? 'bg-amber-100 text-amber-800' :
                        dmg.status === 'Pending – Menunggu Vendor Eksternal' ? 'bg-indigo-100 text-indigo-800' :
                        dmg.status === 'Assigned' ? 'bg-purple-100 text-purple-800' :
                        dmg.status === 'Re-opened' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {dmg.status}
                      </span>
                    </div>
                  </div>

                  {/* SOP 5-Step Progress Bar */}
                  <div className="bg-slate-50/70 p-4 border-b border-slate-100">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>Progres Alur Standar Operasional (SOP 5-Tahap):</span>
                      {dmg.kategoriMasalah && (
                        <span className="text-[10px] text-blue-700 font-semibold lowercase">
                          [{dmg.kategoriMasalah} &bull; {dmg.jenisAset || 'Fisik'}]
                        </span>
                      )}
                    </div>
                    {(() => {
                      const getStepNumber = (st: string) => {
                        if (st === 'Open/Unassigned' || st === 'Open' || st === 'Baru' || st === 'Need More Info' || st === 'Re-opened') return 1;
                        if (st === 'Assigned' || st === 'Diterima') return 2;
                        if (st === 'In Progress' || st === 'Perbaikan') return 3;
                        if (
                          st === 'Pending – Menunggu Suku Cadang' ||
                          st === 'Pending – Menunggu Vendor Eksternal' ||
                          st === 'Pending Procurement' ||
                          st === 'Menunggu Suku Cadang'
                        ) return 4;
                        if (st === 'Resolved' || st === 'Closed – Auto' || st === 'Closed – Manual' || st === 'Closed' || st === 'Selesai' || st === 'Rusak Total') return 5;
                        return 1;
                      };
                      const currentStep = getStepNumber(dmg.status);

                      const steps = [
                        { num: 1, label: '1. Pelaporan', desc: 'Tiket dibuat' },
                        { num: 2, label: '2. Verifikasi & Delegasi', desc: 'Admin & PIC' },
                        { num: 3, label: '3. Penjadwalan Inspeksi', desc: 'Jadwal teknisi' },
                        { num: 4, label: '4. Tindakan Perbaikan', desc: 'Eksekusi teknis' },
                        { num: 5, label: '5. Selesai (Closed)', desc: 'Aset diperbarui' }
                      ];

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {steps.map(s => {
                            const isDone = s.num < currentStep || (currentStep === 5 && s.num === 5);
                            const isCurrent = s.num === currentStep && currentStep !== 5;

                            return (
                              <div
                                key={s.num}
                                className={`p-2 rounded-lg border text-center transition-all ${
                                  isDone
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : isCurrent
                                    ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-400/30 font-bold'
                                    : 'bg-white border-slate-200 text-slate-400 opacity-60'
                                }`}
                              >
                                <div className="text-[11px] font-bold">
                                  {isDone ? '✓ ' : ''}{s.label}
                                </div>
                                <div className="text-[10px] mt-0.5 text-slate-500">
                                  {s.desc}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* PIC Teknisi & Jadwal Banner */}
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Cpu className="w-4 h-4 text-slate-500" />
                      <span>
                        <strong>PIC Teknisi:</strong> {dmg.picTeknisi || 'IT Support & Helpdesk Specialist'}
                      </span>
                    </div>
                    {dmg.jadwalPemeriksaan && (
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>Inspeksi: {dmg.jadwalPemeriksaan}</span>
                      </span>
                    )}
                    {dmg.metodePerbaikan && !dmg.jadwalPemeriksaan && (
                      <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold text-[11px]">
                        Metode: {dmg.metodePerbaikan}
                      </span>
                    )}
                  </div>

                  {/* Komitmen Layanan (SLA FRT & RT) */}
                  {(() => {
                    const slaEval = computeSlaEvaluation(dmg, AppDatabase.getSlaConfig());
                    const getSlaBadgeClass = (state: string) => {
                      if (state === 'Melewati SLA') return 'bg-rose-100 text-rose-800';
                      if (state === 'Mendekati Batas') return 'bg-amber-100 text-amber-800';
                      if (state === 'Terjeda (Paused)') return 'bg-cyan-100 text-cyan-800';
                      if (state === 'Menunggu Tahap 2') return 'bg-slate-100 text-slate-700';
                      return 'bg-emerald-100 text-emerald-800';
                    };
                    return (
                      <div className="bg-indigo-50/50 border-b border-indigo-100 px-6 py-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                            <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                            <span>
                              Komitmen & Realisasi SLA ({ticketType} · Urgensi: {dmg.urgensi || dmg.prioritas || 'Sedang'})
                            </span>
                          </div>
                          {slaEval.pausedTotalMinutes > 0 && (
                            <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                              Durasi Jeda Dikecualikan: {slaEval.pausedTotalMinutes} mnt
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="p-2.5 rounded-lg bg-white border border-indigo-100 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-500 block">First Response Time (FRT)</span>
                              <span className="font-mono font-semibold text-slate-900">{slaEval.frtLabel}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${getSlaBadgeClass(slaEval.frtStatus)}`}>
                              {slaEval.frtStatus}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-indigo-100 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-500 block">Resolution Time (RT)</span>
                              <span className="font-mono font-semibold text-slate-900">{slaEval.rtLabel}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${getSlaBadgeClass(slaEval.rtStatus)}`}>
                              {slaEval.rtStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3c: Vendor Eksternal Banner */}
                  {(dmg.status === 'Pending – Menunggu Vendor Eksternal' || dmg.vendorEksternalNama) && (
                    <div className="bg-indigo-50/70 border-b border-indigo-200/70 px-6 py-3 text-xs text-indigo-950">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            Penanganan Pihak / Vendor Eksternal: {dmg.vendorEksternalNama || 'Vendor / ISP Eksternal'}
                          </p>
                          <p className="text-indigo-800 mt-0.5">
                            No. Referensi Vendor: <span className="font-mono font-semibold">{dmg.vendorEksternalTiket || '-'}</span>
                            {dmg.status === 'Pending – Menunggu Vendor Eksternal' && ' · Jam SLA Penyelesaian terjeda selama menunggu tindak lanjut vendor eksternal.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3d: Linked Problem / RFC & Workaround Banner */}
                  {(dmg.linkedProblemTicketId || dmg.linkedParentTicketId || dmg.workaround) && (
                    <div className="bg-purple-50/70 border-b border-purple-200/70 px-6 py-3 text-xs text-purple-950 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-purple-700" />
                          <span>Tautan Eskalasi ITIL (Workaround &amp; Problem/RFC)</span>
                        </span>
                        {dmg.linkedProblemTicketId && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuery(dmg.linkedProblemTicketId!);
                              handleSearch(dmg.linkedProblemTicketId!);
                            }}
                            className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-purple-700 text-white hover:bg-purple-800 cursor-pointer"
                          >
                            Lihat Tiket Lanjutan: {dmg.linkedProblemTicketId}
                          </button>
                        )}
                        {dmg.linkedParentTicketId && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuery(dmg.linkedParentTicketId!);
                              handleSearch(dmg.linkedParentTicketId!);
                            }}
                            className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-purple-300 text-purple-800 hover:bg-purple-100 cursor-pointer"
                          >
                            Insiden Asal: {dmg.linkedParentTicketId}
                          </button>
                        )}
                      </div>
                      {dmg.workaround && (
                        <p className="text-purple-900">
                          <strong>Workaround (Solusi Sementara):</strong> {dmg.workaround}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Spare parts banner if applicable */}
                  {dmg.sukuCadangList && dmg.sukuCadangList.length > 0 && (
                    <div className="bg-amber-50/70 border-b border-amber-200/70 px-6 py-3 text-xs text-amber-950">
                      <p className="font-bold flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-600" />
                        <span>Kebutuhan Suku Cadang ({dmg.sukuCadangList.length} Item):</span>
                        {dmg.status === 'Pending Procurement' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px]">
                            Menunggu Pembelian
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {dmg.sukuCadangList.map((sp, idx) => (
                          <span key={idx} className="bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-[11px]">
                            {sp.namaKomponen} ({sp.statusPengadaan})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-6 space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Gejala Kerusakan Dilaporkan:</span>
                      <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                        {dmg.deskripsi}
                      </p>
                    </div>

                    {dmg.catatanAdmin && (
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Catatan Tindakan Teknisi PUSDATIN:</span>
                        <p className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-blue-900 leading-relaxed">
                          {dmg.catatanAdmin}
                        </p>
                      </div>
                    )}

                    {/* Inline Action Feedback Banner */}
                    {feedback && (
                      <div
                        className={`p-3 rounded-lg border text-xs font-medium ${
                          feedback.type === 'success'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}
                      >
                        {feedback.message}
                      </div>
                    )}

                    {/* 3e: Need More Info Interactive Reply Box + Auto-Close 3x24 Jam */}
                    {dmg.status === 'Need More Info' && (
                      <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1">
                            <span className="font-bold text-amber-950 text-sm block">
                              Butuh Informasi Tambahan dari Pelapor (Need More Info)
                            </span>
                            <p className="text-amber-900 leading-relaxed">
                              <strong>Permintaan Admin:</strong>{' '}
                              {dmg.needMoreInfoNote || 'Mohon lengkapi detail kendala / bukti tambahan agar tiket dapat diproses.'}
                            </p>
                            <p className="text-[11px] text-amber-800">
                              Jam SLA Penyelesaian tidak berjalan hingga Anda membalas. Batas waktu Auto-Close 3x24 jam:{' '}
                              <span className="font-mono font-bold">
                                {dmg.needMoreInfoDeadlineIso
                                  ? new Date(dmg.needMoreInfoDeadlineIso).toLocaleString('id-ID')
                                  : '72 jam sejak permintaan info'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <textarea
                          rows={2}
                          value={needMoreInfoReplyMap[dmg.id] || ''}
                          onChange={e =>
                            setNeedMoreInfoReplyMap(prev => ({ ...prev, [dmg.id]: e.target.value }))
                          }
                          placeholder="Tulis informasi tambahan, kronologi lengkap, atau tautan bukti pendukung di sini..."
                          className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const replyText = (needMoreInfoReplyMap[dmg.id] || '').trim();
                              if (!replyText) {
                                setTrackerFeedback(prev => ({
                                  ...prev,
                                  [dmg.id]: {
                                    type: 'error',
                                    message: 'Harap isi informasi tambahan terlebih dahulu sebelum mengirim balasan.'
                                  }
                                }));
                                return;
                              }
                              const res = AppDatabase.processDamageTicket(dmg.id, 'reply-need-info', {
                                catatan: replyText
                              });
                              setTrackerFeedback(prev => ({
                                ...prev,
                                [dmg.id]: {
                                  type: res.success ? 'success' : 'error',
                                  message: res.message
                                }
                              }));
                              if (res.success) {
                                setNeedMoreInfoReplyMap(prev => ({ ...prev, [dmg.id]: '' }));
                                handleSearch();
                              }
                            }}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim Kelengkapan Info &amp; Lanjutkan Tiket</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* BR-008 & 3f: Konfirmasi Penyelesaian & Re-open dalam 1x24 Jam */}
                    {dmg.status === 'Resolved' && (
                      <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span className="font-bold text-emerald-900 text-sm">
                            Konfirmasi Penyelesaian dari Pelapor (Jendela Re-open {REOPEN_WINDOW_HOURS} Jam)
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs">
                          Teknisi telah menyelesaikan perbaikan tiket ini. Jika sudah berfungsi normal, tutup tiket sekarang. Jika kendala masih muncul, Anda dapat membuka kembali (<strong>Re-opened</strong>) maksimal <strong>1x24 jam</strong> setelah status Resolved.
                        </p>
                        {canReopen ? (
                          <input
                            type="text"
                            value={reopenReasonMap[dmg.id] ?? ''}
                            onChange={e =>
                              setReopenReasonMap(prev => ({ ...prev, [dmg.id]: e.target.value }))
                            }
                            placeholder="Masih error, belum bisa digunakan! (isi alasan jika ingin Re-open)"
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          />
                        ) : (
                          <div className="p-2.5 bg-white/80 border border-emerald-200 rounded-lg text-[11px] text-slate-600">
                            Jendela pembukaan kembali (1x24 jam setelah Resolved) telah terlewati. Silakan konfirmasi selesai atau buat tiket baru jika ada kendala lanjutan.
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const res = AppDatabase.processDamageTicket(dmg.id, 'tutup-manual', {
                                catatan: 'Pelapor mengonfirmasi masalah selesai via Portal Civitas.'
                              });
                              setTrackerFeedback(prev => ({
                                ...prev,
                                [dmg.id]: {
                                  type: res.success ? 'success' : 'error',
                                  message: res.message
                                }
                              }));
                              handleSearch();
                            }}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Konfirmasi Selesai (Closed – Manual)</span>
                          </button>
                          <button
                            type="button"
                            disabled={!canReopen}
                            onClick={() => {
                              const reason =
                                (reopenReasonMap[dmg.id] || '').trim() ||
                                'Masih error, belum bisa digunakan!';
                              const res = AppDatabase.processDamageTicket(dmg.id, 're-open', {
                                catatan: reason
                              });
                              setTrackerFeedback(prev => ({
                                ...prev,
                                [dmg.id]: {
                                  type: res.success ? 'success' : 'error',
                                  message: res.message
                                }
                              }));
                              if (res.success) {
                                setReopenReasonMap(prev => ({ ...prev, [dmg.id]: '' }));
                                handleSearch();
                              }
                            }}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs ${
                              canReopen
                                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Kendala Masih Ada (Re-opened · Batas 1x24 Jam)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 5a: CSAT Survey Prompt Otomatis saat Resolved / Closed */}
                    {isDamageEligibleForSurvey(dmg) && (() => {
                      const existingDmgSurvey = AppDatabase.getSurveyByEntity('Incident', dmg.id);
                      return existingDmgSurvey ? (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-emerald-900 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Survei Kepuasan Perbaikan Telah Dikirim ({existingDmgSurvey.averageScore} / 5 {getEmojiForScore(existingDmgSurvey.averageScore)})</span>
                          </div>
                          <span className="text-[11px] text-emerald-700">Masukan Anda tercatat untuk evaluasi teknisi PUSDATIN.</span>
                        </div>
                      ) : (
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-indigo-600" />
                              <span>Penanganan Tiket Selesai — Isi Survei Kepuasan Layanan ITIL</span>
                            </span>
                            <p className="text-indigo-800 text-[11px] mt-0.5">
                              Nilai kecepatan respons, ketepatan solusi, dan komunikasi teknisi dalam 30 detik.
                            </p>
                          </div>
                          <button
                            type="button"
                            data-testid={`open-survey-${dmg.id}`}
                            onClick={() =>
                              setActiveSurveyTarget({
                                moduleType: 'Incident',
                                entityId: dmg.id,
                                entityTitle: dmg.namaBarang,
                                technicianOrPic: dmg.picTeknisi,
                                defaultRespondentName: dmg.pelapor
                              })
                            }
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                            <span>Isi Survei Kepuasan (1–5)</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Timeline History */}
                    {dmg.riwayatStatus && dmg.riwayatStatus.length > 0 && (
                      <div className="pt-2">
                        <span className="font-bold text-slate-700 block mb-2">Riwayat Progres Tiket:</span>
                        <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                          {dmg.riwayatStatus.map((item, idx) => (
                            <div key={idx} className="relative text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{item.status}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                              </div>
                              <p className="text-slate-600 mt-0.5">{item.catatan}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}

              {/* Matched System Proposals (F-DEV / Pengajuan Sistem Baru & Evaluasi Pasca Go-Live) */}
              {matchedProposals.map(prop => {
                const propSla = computeProposalSlaEvaluation(prop, serviceSlaConfig);
                const existingPropSurvey = AppDatabase.getSurveyByEntity('SystemProposal', prop.id);
                const canSurveyProp = isProposalEligibleForSurvey(prop);

                return (
                  <div key={prop.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-cyan-700">{prop.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 font-semibold border border-cyan-200 inline-flex items-center gap-1">
                            <Code2 className="w-3 h-3" />
                            <span>Pengajuan Sistem Baru</span>
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{prop.namaSistem}</h3>
                        <p className="text-xs text-slate-500">
                          Pengusul: <strong>{prop.pemohon}</strong> ({prop.unitKerja}) · Diajukan: {prop.tanggalPengajuan}
                        </p>
                      </div>

                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        canSurveyProp ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {prop.status === 'Serah Terima' || prop.status === 'Selesai' ? 'Selesai / Go-Live' : prop.status}
                      </span>
                    </div>

                    <div className="p-5 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-slate-500 block font-semibold">SLA Feasibility Study (Tahap 1)</span>
                            <span className="font-mono font-bold text-slate-900">{propSla.feasibilityLabel}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            propSla.feasibilityStatus === 'Memenuhi SLA' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                          }`}>
                            {propSla.feasibilityStatus}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-slate-500 block font-semibold">SLA Spesifikasi BRD (Tahap 2)</span>
                            <span className="font-mono font-bold text-slate-900">{propSla.brdLabel}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            propSla.brdStatus === 'Memenuhi SLA' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {propSla.brdStatus}
                          </span>
                        </div>
                      </div>

                      {canSurveyProp && (
                        existingPropSurvey ? (
                          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-emerald-900 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Evaluasi Pasca-Implementasi Telah Dikirim ({existingPropSurvey.averageScore} / 5 {getEmojiForScore(existingPropSurvey.averageScore)})</span>
                            </div>
                            <span className="text-[11px] text-emerald-700">Masukan Anda menjadi dasar backlog rilis berikutnya.</span>
                          </div>
                        ) : (
                          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <span>Survei Evaluasi Pasca-Implementasi Sistem Baru (1–3 Bulan Pasca Go-Live)</span>
                              </span>
                              <p className="text-indigo-800 text-[11px] mt-0.5">
                                Berikan evaluasi UI/UX, stabilitas fitur, dukungan adaptasi tim IT, dan usulan fitur lanjutan.
                              </p>
                            </div>
                            <button
                              type="button"
                              data-testid={`open-survey-${prop.id}`}
                              onClick={() =>
                                setActiveSurveyTarget({
                                  moduleType: 'SystemProposal',
                                  entityId: prop.id,
                                  entityTitle: prop.namaSistem,
                                  technicianOrPic: 'Tim Pengembang PUSDATIN',
                                  defaultRespondentName: activeUser.nama,
                                  defaultRespondentUnit: prop.unitKerja
                                })
                              }
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                              <span>Isi Evaluasi Sistem (1–5)</span>
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Modal Survei Kepuasan Pengguna (ITIL Continual Improvement) */}
      {activeSurveyTarget && (
        <CsatSurveyModal
          isOpen={Boolean(activeSurveyTarget)}
          moduleType={activeSurveyTarget.moduleType}
          entityId={activeSurveyTarget.entityId}
          entityTitle={activeSurveyTarget.entityTitle}
          technicianOrPic={activeSurveyTarget.technicianOrPic}
          defaultRespondentName={activeSurveyTarget.defaultRespondentName}
          defaultRespondentUnit={activeSurveyTarget.defaultRespondentUnit}
          onClose={() => setActiveSurveyTarget(null)}
          onSubmitted={survey => {
            const msg = `Terima kasih! Penilaian survei kepuasan (${survey.averageScore}/5) untuk ${survey.entityId} telah berhasil disimpan.`;
            setActiveSurveyTarget(null);
            setSurveyVersion(v => v + 1);
            setSurveySuccessBanner(msg);
            setTrackerFeedback(prev => ({
              ...prev,
              [survey.entityId]: {
                type: 'success',
                message: msg
              }
            }));
          }}
        />
      )}
    </div>
  );
};
