import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  XCircle,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { BukuAsetInventarisRekap, Asset } from '../../types';
import { PdfReportService } from '../../services/pdfReportService';
import { SignatoryConfirmModal, ConfirmedSignatoryValues } from '../Modals/SignatoryConfirmModal';
import { ItilPeriodSelector } from './ItilPeriodSelector';
import {
  getStandardPeriodLabel,
  matchesReportingPeriod,
  ReportingCadence
} from '../../services/reportGovernanceService';

interface BukuInventarisRekapViewProps {
  onDataChanged?: () => void;
}

export const BukuInventarisRekapView: React.FC<BukuInventarisRekapViewProps> = () => {
  const [rekapList, setRekapList] = useState<BukuAsetInventarisRekap[]>(() =>
    AppDatabase.getBukuAsetInventarisRekap()
  );
  const [assets, setAssets] = useState<Asset[]>(() => AppDatabase.getAssets());
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [cadence, setCadence] = useState<ReportingCadence>('semua');
  const [periodKey, setPeriodKey] = useState<string>('');
  const [isSignatoryModalOpen, setIsSignatoryModalOpen] = useState(false);

  const categories = AppDatabase.getMasterCategories();

  const totalNilaiKampus = rekapList.reduce((sum, r) => sum + r.nilaiAsetTotal, 0);
  const totalStokTersedia = rekapList.reduce((sum, r) => sum + r.stokTersedia, 0);

  const filteredAssets = assets.filter(a => {
    const matchCat = selectedCategory === 'Semua' || a.kategori === selectedCategory;
    const matchStatus = selectedStatus === 'Semua' || a.status === selectedStatus;
    const matchCadence = matchesReportingPeriod(a.tanggalMasuk || a.tanggalPembelian, cadence, periodKey);
    const matchSearch =
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.kodeUnikAset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchStatus && matchCadence && matchSearch;
  });

  const handlePrintInventaris = () => {
    setIsSignatoryModalOpen(true);
  };

  const handleConfirmPrintInventaris = (values: ConfirmedSignatoryValues) => {
    const periodLabel = getStandardPeriodLabel(cadence, periodKey);
    const doc = PdfReportService.generateBukuInventarisPdf(rekapList, filteredAssets, {
      title: `Laporan Saldo Stok & Valuasi Inventaris TI UMC (${periodLabel})`,
      kepalaPusdatin: values.kepalaPusdatin,
      nipKepala: values.nipKepala,
      petugas: values.petugas
    });
    doc.save(`Buku_Aset_Inventaris_UMC_${periodKey || new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportCsv = () => {
    const headers = [
      'Kategori',
      'Total Masuk',
      'Total Keluar',
      'Stok Tersedia',
      'Digunakan',
      'Dipinjam',
      'Maintenance',
      'Tidak Layak',
      'Nilai Valuasi (Rp)'
    ];
    const rows = rekapList.map(r => [
      `"${r.kategori.replace(/"/g, '""')}"`,
      String(r.totalMasuk),
      String(r.totalKeluar),
      String(r.stokTersedia),
      String(r.rincianStatus.digunakan),
      String(r.rincianStatus.dipinjam),
      String(r.rincianStatus.maintenance),
      String(r.rincianStatus.tidakLayak),
      String(r.nilaiAsetTotal)
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Saldo_Stok_Opname_UMC_${periodKey || 'Semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-bold font-mono">
              MODUL A.3 · ITAM STOCK OPNAME
            </span>
            <h1 className="text-xl font-bold text-slate-900">Laporan Saldo Stok &amp; Valuasi (Buku Aset Inventaris)</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Rekapitulasi saldo masuk vs. keluar secara real-time (<strong>Total Masuk − Total Keluar = Stok Tersedia</strong>) dan posisi status operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="export-inventaris-csv-btn"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV (Stock Opname)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintInventaris}
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan PDF</span>
          </button>
        </div>
      </div>

      <ItilPeriodSelector
        menuId="buku-inventaris-rekap"
        dates={assets.map(a => a.tanggalMasuk || a.tanggalPembelian)}
        cadence={cadence}
        periodKey={periodKey}
        onChangeCadence={setCadence}
        onChangePeriodKey={setPeriodKey}
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Total Nilai Aset TI Kampus</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            Rp {totalNilaiKampus.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Akumulasi seluruh unit tercatat</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Total Stok Tersedia (Ready)</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {totalStokTersedia} <span className="text-xs font-sans text-slate-500">Unit</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Saldo stok siap digunakan / dipinjam</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Sedang Digunakan / Dipasang</div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {assets.filter(a => a.status === 'Digunakan').length} <span className="text-xs font-sans text-slate-500">Unit</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Operasional unit kerja / lab</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Dalam Perawatan (Maintenance)</div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {assets.filter(a => a.status === 'Maintenance').length} <span className="text-xs font-sans text-slate-500">Unit</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Sedang diperbaiki / suku cadang</div>
        </div>
      </div>

      {/* Saldo Rekapitulasi Per Kategori (Tabel 9, BR-005) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          Rekapitulasi Saldo Stok per Kategori (BR-005)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Kategori Aset</th>
                <th className="py-3 px-4">Total Masuk (Penerimaan)</th>
                <th className="py-3 px-4">Total Keluar (Pengeluaran)</th>
                <th className="py-3 px-4">Saldo Stok Tersedia</th>
                <th className="py-3 px-4">Status Operasional</th>
                <th className="py-3 px-4 text-right">Nilai Aset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rekapList.map(item => (
                <tr key={item.kategori} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.kategori}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-700 text-xs">
                    +{item.totalMasuk} Unit
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-700 text-xs">
                    -{item.totalKeluar} Unit
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {item.stokTersedia} Tersedia
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700 font-semibold" title="Digunakan">
                        💻 {item.rincianStatus.digunakan} Dipakai
                      </span>
                      <span className="text-purple-700 font-semibold" title="Dipinjam">
                        🔄 {item.rincianStatus.dipinjam} Dipinjam
                      </span>
                      {item.rincianStatus.maintenance > 0 && (
                        <span className="text-amber-700 font-semibold" title="Maintenance">
                          ⚠️ {item.rincianStatus.maintenance} Servis
                        </span>
                      )}
                      {item.rincianStatus.tidakLayak > 0 && (
                        <span className="text-rose-700 font-semibold" title="Tidak Layak">
                          ❌ {item.rincianStatus.tidakLayak} Afkir
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                    Rp {item.nilaiAsetTotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter & Detail Unit Fisik */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-900 text-base">Rincian Unit Aset Fisik Real-time</h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode unik, barcode, nama..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="outline-none bg-transparent w-48 text-xs"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
            >
              <option value="Semua">Semua Kategori</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold"
            >
              <option value="Semua">Semua Status (Section 4.1)</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Digunakan">Digunakan</option>
              <option value="Dipinjam">Dipinjam</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Tidak Layak">Tidak Layak</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Kode Unik (BR-001)</th>
                <th className="py-3 px-4">Nama Aset</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Status Operasional (4.1)</th>
                <th className="py-3 px-4">Lokasi Fisik Terkini</th>
                <th className="py-3 px-4">Harga Beli</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAssets.map(asset => (
                <tr key={asset.kodeUnikAset || asset.barcode} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {asset.kodeUnikAset}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Scan: {asset.barcode}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-xs">{asset.nama}</div>
                    <div className="text-[11px] text-slate-500">{asset.merekModel}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{asset.kategori}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        asset.status === 'Tersedia'
                          ? 'bg-emerald-100 text-emerald-800'
                          : asset.status === 'Digunakan'
                          ? 'bg-blue-100 text-blue-800'
                          : asset.status === 'Dipinjam'
                          ? 'bg-purple-100 text-purple-800'
                          : asset.status === 'Maintenance'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{asset.lokasi}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-800">
                    {asset.hargaBeli ? `Rp ${asset.hargaBeli.toLocaleString('id-ID')}` : '-'}
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada unit aset yang cocok dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <SignatoryConfirmModal
        isOpen={isSignatoryModalOpen}
        documentTitle="Laporan Buku Aset Inventaris & Rekapitulasi Saldo"
        onClose={() => setIsSignatoryModalOpen(false)}
        onConfirm={handleConfirmPrintInventaris}
      />
    </div>
  );
};
