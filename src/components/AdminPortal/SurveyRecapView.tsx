import React, { useState } from 'react';
import {
  Star,
  Download,
  Printer,
  Filter,
  Sparkles,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { PdfReportService } from '../../services/pdfReportService';
import {
  SurveyModuleType,
  SurveyResponse
} from '../../types';
import {
  computeAggregateSurveyStats,
  filterSurveysByMonthAndModule,
  getEmojiForScore,
  getModuleLabel
} from '../../services/surveyService';
import { SignatoryConfirmModal, ConfirmedSignatoryValues } from '../Modals/SignatoryConfirmModal';

export const SurveyRecapView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // '' = Semua Periode
  const [moduleFilter, setModuleFilter] = useState<'Semua' | SurveyModuleType>('Semua');
  const [showSignatoryModal, setShowSignatoryModal] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const allSurveys = AppDatabase.getSurveys();
  const filteredSurveys = filterSurveysByMonthAndModule(
    allSurveys,
    selectedMonth || 'Semua',
    moduleFilter
  );
  const agg = computeAggregateSurveyStats(filteredSurveys);

  const distinctMonths = Array.from(new Set(allSurveys.map(s => s.monthKey))).sort((a, b) =>
    b.localeCompare(a)
  );

  const formatMonthLabel = (mKey: string) => {
    if (!mKey) return 'Semua Bulan & Tahun';
    const [yr, mo] = mKey.split('-');
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ];
    const idx = Math.max(0, Math.min(11, (parseInt(mo, 10) || 1) - 1));
    return `${monthNames[idx]} ${yr}`;
  };

  const moduleFilterLabel =
    moduleFilter === 'Semua' ? 'Semua Modul Layanan' : getModuleLabel(moduleFilter);

  const handleExportCsv = () => {
    const headers = [
      'ID Survei',
      'Tanggal Submit',
      'Periode',
      'Modul Layanan',
      'ID Tiket / Usulan',
      'Nama Layanan / Perangkat / Sistem',
      'Responden',
      'Unit Kerja',
      'PIC / Teknisi',
      'Skor Aspek 1',
      'Skor Aspek 2',
      'Skor Aspek 3',
      'Rata-Rata CSAT',
      'Saran / Masukan'
    ];

    const rows = filteredSurveys.map((s: SurveyResponse) => [
      `"${s.id}"`,
      `"${s.submittedAtIso.slice(0, 10)}"`,
      `"${s.monthKey}"`,
      `"${getModuleLabel(s.moduleType)}"`,
      `"${s.entityId}"`,
      `"${(s.entityTitle || '').replace(/"/g, '""')}"`,
      `"${(s.respondentName || '').replace(/"/g, '""')}"`,
      `"${(s.respondentUnit || '').replace(/"/g, '""')}"`,
      `"${(s.technicianOrPic || '-').replace(/"/g, '""')}"`,
      String(s.ratings.q1),
      String(s.ratings.q2),
      String(s.ratings.q3),
      String(s.averageScore),
      `"${(s.feedbackText || '-').replace(/"/g, '""')}"`
    ]);

    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Rekap_Survei_CSAT_PUSDATIN_${selectedMonth || 'Semua'}_${moduleFilter}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedbackBanner('Rekapitulasi Survei Kepuasan Pengguna berhasil diekspor ke CSV.');
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const handleConfirmPdf = (sig: ConfirmedSignatoryValues) => {
    const periodLabel = formatMonthLabel(selectedMonth);
    const doc = PdfReportService.generateSurveyRecapMonthlyPdf(
      filteredSurveys,
      periodLabel,
      moduleFilterLabel,
      {
        kepalaPusdatin: sig.kepalaPusdatin,
        nipKepala: sig.nipKepala,
        petugas: sig.petugas,
        pimpinanUniv: sig.pimpinanUniv,
        pimpinanUnivJabatan: sig.pimpinanUnivJabatan
      }
    );
    doc.save(
      `Laporan_Rekap_Survei_CSAT_${selectedMonth || 'Semua'}_${moduleFilter}.pdf`
    );
    setShowSignatoryModal(false);
    setFeedbackBanner(
      `Laporan PDF Rekapitulasi Survei Kepuasan (${periodLabel}) berhasil diunduh.`
    );
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
              ITIL CONTINUAL IMPROVEMENT
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Rekapitulasi Survei Kepuasan Pengguna (CSAT)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Evaluasi terpadu kepuasan sivitas akademika pada modul <strong>Laporan Kerusakan</strong>,{' '}
            <strong>Peminjaman Aset IT</strong>, dan <strong>Pasca-Implementasi Sistem Baru</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="export-survey-csv-btn"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            data-testid="print-survey-recap-pdf-btn"
            onClick={() => setShowSignatoryModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Unduh Laporan PDF</span>
          </button>
        </div>
      </div>

      {feedbackBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Filter Periode (Bulan & Tahun) dan Modul */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Periode Bulan &amp; Tahun:</span>
          </span>
          <input
            type="month"
            data-testid="survey-month-filter"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
          />
          <button
            type="button"
            onClick={() => setSelectedMonth('')}
            className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedMonth === ''
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Periode
          </button>
          {distinctMonths.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMonth(m)}
              className={`px-2.5 py-1.5 rounded-lg font-mono font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedMonth === m
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-0.5 shrink-0" />
          {(
            [
              { id: 'Semua', label: 'Semua Modul' },
              { id: 'Incident', label: 'Laporan Kerusakan' },
              { id: 'Loan', label: 'Peminjaman Aset' },
              { id: 'SystemProposal', label: 'Sistem Baru' }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              data-testid={`survey-module-filter-${tab.id}`}
              onClick={() => setModuleFilter(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                moduleFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" data-testid="survey-kpi-strip">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Responden Survei
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-slate-900">
              {agg.totalResponses}
            </span>
            <span className="text-xs text-slate-500">Respons ({formatMonthLabel(selectedMonth)})</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Skor Rata-Rata CSAT
          </span>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-600">
              {agg.overallAverage} / 5.0
            </span>
            <span className="text-xl">{agg.totalResponses > 0 ? getEmojiForScore(agg.overallAverage) : '😐'}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Indeks Kepuasan (Skor ≥ 4)
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-700">
              {agg.csatPercentage}%
            </span>
            <span className="text-[11px] text-slate-500">Target ITIL ≥ 85%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Skor Per Layanan
          </span>
          <div className="mt-1.5 text-[11px] text-slate-700 font-semibold space-y-0.5">
            <div>Kerusakan: <strong>{agg.byModule.Incident.avgScore || '-'}</strong>/5 ({agg.byModule.Incident.count})</div>
            <div>Peminjaman: <strong>{agg.byModule.Loan.avgScore || '-'}</strong>/5 ({agg.byModule.Loan.count})</div>
            <div>Sistem Baru: <strong>{agg.byModule.SystemProposal.avgScore || '-'}</strong>/5 ({agg.byModule.SystemProposal.count})</div>
          </div>
        </div>
      </div>

      {/* Per-Module Aspect Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">1. Laporan Kerusakan (Incident)</h3>
            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap shrink-0">
              {agg.byModule.Incident.avgScore || 0} / 5 ⭐
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Q1. Kecepatan Respons &amp; Solusi</span>
              <strong className="font-mono text-slate-900">{agg.byModule.Incident.q1Avg || '-'}/5</strong>
            </div>
            <div className="flex justify-between">
              <span>Q2. Ketepatan Solusi Teknisi</span>
              <strong className="font-mono text-slate-900">{agg.byModule.Incident.q2Avg || '-'}/5</strong>
            </div>
            <div className="flex justify-between">
              <span>Q3. Keramahan &amp; Komunikasi</span>
              <strong className="font-mono text-slate-900">{agg.byModule.Incident.q3Avg || '-'}/5</strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">2. Peminjaman Aset IT (Loan)</h3>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 whitespace-nowrap shrink-0">
              {agg.byModule.Loan.avgScore || 0} / 5 ⭐
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Q1. Kondisi &amp; Kelayakan Aset</span>
              <strong className="font-mono text-slate-900">{agg.byModule.Loan.q1Avg || '-'}/5</strong>
            </div>
            <div className="flex justify-between">
              <span>Q2. Kemudahan Proses Pengajuan</span>
              <strong className="font-mono text-slate-900">{agg.byModule.Loan.q2Avg || '-'}/5</strong>
            </div>
            <div className="flex justify-between">
              <span>Q3. Kecepatan Approval &amp; Serah Terima</span>
              <strong className="font-mono text-slate-900">{agg.byModule.Loan.q3Avg || '-'}/5</strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">3. Pasca-Implementasi Sistem Baru</h3>
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap shrink-0">
              {agg.byModule.SystemProposal.avgScore || 0} / 5 ⭐
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Q1. Kemudahan Antarmuka (UI/UX)</span>
              <strong className="font-mono text-slate-900">{agg.byModule.SystemProposal.q1Avg || '-'}/5</strong>
            </div>
            <div className="flex justify-between">
              <span>Q2. Stabilitas &amp; Kesesuaian Fitur</span>
              <strong className="font-mono text-slate-900">{agg.byModule.SystemProposal.q2Avg || '-'}/5</strong>
            </div>
            <div className="flex justify-between">
              <span>Q3. Panduan &amp; Dukungan Tim IT</span>
              <strong className="font-mono text-slate-900">{agg.byModule.SystemProposal.q3Avg || '-'}/5</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Rincian Tanggapan &amp; Umpan Balik Pengguna ({filteredSurveys.length})</span>
          </h3>
        </div>

        {filteredSurveys.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">
              Belum ada data survei kepuasan pada periode &amp; modul yang dipilih.
            </p>
            <p className="text-slate-400">
              Ubah filter bulan atau pilih "Semua Periode" untuk melihat seluruh riwayat survei.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Modul Layanan</th>
                    <th className="px-4 py-3">ID &amp; Objek Layanan</th>
                    <th className="px-4 py-3">Responden &amp; Unit</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Q1 / Q2 / Q3</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Skor CSAT</th>
                    <th className="px-4 py-3">Saran / Kebutuhan Lanjutan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSurveys.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                        {s.submittedAtIso.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.moduleType === 'Incident'
                            ? 'bg-amber-100 text-amber-800'
                            : s.moduleType === 'Loan'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {getModuleLabel(s.moduleType)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-red-700 block">{s.entityId}</span>
                        <span className="font-semibold text-slate-900">{s.entityTitle}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{s.respondentName}</span>
                        <span className="text-[11px] text-slate-500">{s.respondentUnit}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                        {s.ratings.q1} / {s.ratings.q2} / {s.ratings.q3}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 font-mono font-bold text-amber-900">
                          <span>{getEmojiForScore(s.averageScore)}</span>
                          <span>{s.averageScore}/5</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs">
                        {s.feedbackText || <span className="text-slate-400 italic">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-slate-100">
              {filteredSurveys.map(s => (
                <div key={s.id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-red-700">{s.entityId}</span>
                      <p className="font-bold text-slate-900">{s.entityTitle}</p>
                      <p className="text-[11px] text-slate-500">{s.respondentName} ({s.respondentUnit})</p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 font-mono font-bold text-amber-900 shrink-0">
                      {getEmojiForScore(s.averageScore)} {s.averageScore}/5 ⭐
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <span>{getModuleLabel(s.moduleType)}</span>
                    <span className="font-mono">Q1:{s.ratings.q1} · Q2:{s.ratings.q2} · Q3:{s.ratings.q3}</span>
                  </div>
                  {s.feedbackText && (
                    <p className="text-slate-700 bg-slate-50 p-2 rounded-lg flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{s.feedbackText}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Signatory Modal before PDF Generation */}
      <SignatoryConfirmModal
        isOpen={showSignatoryModal}
        documentTitle={`Laporan Rekapitulasi Survei Kepuasan (CSAT) — ${formatMonthLabel(selectedMonth)}`}
        onClose={() => setShowSignatoryModal(false)}
        onConfirm={handleConfirmPdf}
        showPetugas={false}
        showPimpinanUniv={true}
      />
    </div>
  );
};
