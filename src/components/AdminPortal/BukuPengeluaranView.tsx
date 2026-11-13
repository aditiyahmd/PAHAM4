import React, { useState } from 'react';
import {
  FileText,
  Search,
  ArrowUpRight,
  Calendar,
  Building,
  CheckCircle2,
  Info,
  ShieldCheck,
  Printer,
  Eye,
  PlusCircle,
  Trash2,
  PackageCheck
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { BukuPengeluaranItem, Asset } from '../../types';
import { PdfReportService } from '../../services/pdfReportService';
import { SignatoryConfirmModal, ConfirmedSignatoryValues } from '../Modals/SignatoryConfirmModal';

interface BukuPengeluaranViewProps {
  onDataChanged?: () => void;
}

export const BukuPengeluaranView: React.FC<BukuPengeluaranViewProps> = ({ onDataChanged }) => {
  const [pengeluaranList, setPengeluaranList] = useState<BukuPengeluaranItem[]>(() =>
    AppDatabase.getBukuPengeluaran()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<'Semua' | 'Penggunaan' | 'Peminjaman'>('Semua');

  // Multi-item Issuance Modal (Jalur 1)
  const [isJalur1ModalOpen, setIsJalur1ModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPengeluaran, setSelectedPengeluaran] = useState<BukuPengeluaranItem | null>(null);
  const [pendingBastItem, setPendingBastItem] = useState<BukuPengeluaranItem | null>(null);

  // Form State: Multi-Asset Pengeluaran
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [quickInputCode, setQuickInputCode] = useState('');
  const [untuk, setUntuk] = useState('');
  const [tanggalPenyerahan, setTanggalPenyerahan] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');

  const activeUser = AppDatabase.getActiveUser();
  const allAvailableAssets = AppDatabase.getAssets().filter(a => a.status === 'Tersedia');

  const reloadData = () => {
    setPengeluaranList(AppDatabase.getBukuPengeluaran());
    if (onDataChanged) onDataChanged();
  };

  // Add Asset to multi-selection by code or click
  const handleAddAssetByCode = (code: string) => {
    if (!code.trim()) return;
    const found = AppDatabase.getAssetByBarcodeOrUnique(code.trim());
    if (!found) {
      alert(`Aset dengan kode "${code}" tidak ditemukan!`);
      return;
    }
    if (selectedAssets.some(a => a.barcode === found.barcode)) {
      alert('Aset ini sudah ada di daftar pengeluaran!');
      return;
    }
    setSelectedAssets(prev => [...prev, found]);
    setQuickInputCode('');
  };

  const handleRemoveAsset = (barcode: string) => {
    setSelectedAssets(prev => prev.filter(a => a.barcode !== barcode));
  };

  // Submit Multi-Asset Pengeluaran
  const handleSubmitJalur1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssets.length === 0) {
      alert('Pilih minimal 1 aset untuk dikeluarkan!');
      return;
    }
    if (!untuk.trim()) {
      alert('Mohon isi peruntukan ("Untuk") penyerahan aset!');
      return;
    }

    const res = AppDatabase.recordMultiPengeluaranPenggunaan({
      assetCodes: selectedAssets.map(a => a.kodeUnikAset || a.barcode),
      untuk,
      tanggalPenyerahan,
      keterangan,
      petugas: `${activeUser.nama} (${activeUser.roleName})`
    });

    if (res.success) {
      alert(res.message);
      setIsJalur1ModalOpen(false);
      setSelectedAssets([]);
      setUntuk('');
      setKeterangan('');
      reloadData();
    } else {
      alert(res.message);
    }
  };

  // Print Single Pengeluaran BAST (konfirmasi penandatangan lebih dulu)
  const handlePrintBast = (item: BukuPengeluaranItem) => {
    setPendingBastItem(item);
  };

  const handleConfirmPrintBast = (values: ConfirmedSignatoryValues) => {
    if (!pendingBastItem) return;
    const doc = PdfReportService.generateBukuPengeluaranBastPdf(pendingBastItem, {
      title: `Berita Acara Pengeluaran / Penyerahan Aset - ${pendingBastItem.idPengeluaran}`,
      kepalaPusdatin: values.kepalaPusdatin,
      nipKepala: values.nipKepala,
      petugas: values.petugas
    });
    const safeId = pendingBastItem.idPengeluaran.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`BAST_Pengeluaran_${safeId}.pdf`);
    setPendingBastItem(null);
  };

  const filtered = pengeluaranList.filter(item => {
    const matchSearch =
      item.namaAset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kodeUnikAset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.untuk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.idPengeluaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((item.items || item.subItems) && (item.items || item.subItems)!.some((sub: any) => sub.namaAset?.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchFilter = filterJenis === 'Semua' || item.jenisPengeluaran === filterJenis;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              MODUL A.2
            </span>
            <h1 className="text-xl font-bold text-slate-900">Buku Pengeluaran Aset TI</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mencatat mutasi pengeluaran multi-aset untuk keperluan yang sama (Jalur 1) dan pengeluaran otomatis peminjaman (Jalur 2).
          </p>
        </div>

        {(activeUser.role === 'ACT-02' || activeUser.role === 'ACT-03') && (
          <button
            type="button"
            onClick={() => {
              setSelectedAssets([]);
              setUntuk('');
              setKeterangan('');
              setIsJalur1ModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Pengeluaran Aset (Multi-Barang)</span>
          </button>
        )}
      </div>

      {/* Info Rules Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Jalur 1 — Pengeluaran karena Penggunaan (Multi-Barang)</div>
            <p className="mt-1 text-slate-600">
              Satu kali penginputan dapat mengeluarkan beberapa jenis aset sekaligus untuk ruangan/unit yang sama. Status aset beralih otomatis menjadi <strong>Digunakan</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Jalur 2 — Pengeluaran karena Peminjaman (BR-004)</div>
            <p className="mt-1 text-slate-600">
              Dipicu otomatis saat persetujuan serah terima peminjaman: status aset menjadi <strong>Dipinjam</strong> dan dicatat ke Buku Pengeluaran.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Cari nama aset, kode unik, penerima, atau ID pengeluaran..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterJenis('Semua')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterJenis === 'Semua' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterJenis('Penggunaan')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterJenis === 'Penggunaan' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
          >
            Penggunaan
          </button>
          <button
            type="button"
            onClick={() => setFilterJenis('Peminjaman')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterJenis === 'Peminjaman' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
          >
            Peminjaman
          </button>
        </div>

        <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-600 font-semibold">Total Pengeluaran:</span>
          <span className="text-base font-bold text-slate-900 font-mono">{filtered.length} Catatan</span>
        </div>
      </div>

      {/* Table Buku Pengeluaran */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ID & Tanggal</th>
                <th className="py-3.5 px-4">Aset yang Dikeluarkan</th>
                <th className="py-3.5 px-4">Jalur & Status</th>
                <th className="py-3.5 px-4">Untuk (Penerima)</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4">Petugas</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(item => (
                <tr key={item.idPengeluaran} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-blue-700 text-xs">
                      {item.idPengeluaran}
                    </div>
                    <div className="text-[11px] text-slate-500 whitespace-nowrap mt-0.5">
                      {item.tanggalPenyerahan}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {(item.items || item.subItems) && (item.items || item.subItems)!.length > 1 ? (
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{(item.items || item.subItems)!.length} Aset Diserahkan</span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                            Batch
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          {(item.items || item.subItems)!.map((sub: any, idx: number) => (
                            <div key={idx} className="truncate max-w-[240px]">
                              • <span className="font-mono font-bold text-slate-700">{sub.kodeUnikAset}</span>: {sub.namaAset}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{item.namaAset}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Kode: <span className="text-slate-800 font-bold">{item.kodeUnikAset}</span>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                        item.jenisPengeluaran === 'Penggunaan'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.jenisPengeluaran === 'Penggunaan' ? 'Jalur 1 (Penggunaan)' : 'Jalur 2 (Peminjaman)'}
                    </span>
                    {item.idTiketPeminjaman && (
                      <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                        Tiket: {item.idTiketPeminjaman}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                    {item.untuk}
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                    {item.keterangan || '-'}
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {item.petugas || 'Admin PUSDATIN'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPengeluaran(item);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Lihat Detail Pengeluaran"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintBast(item)}
                        className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        title="Cetak Surat Penyerahan Aset PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    Belum ada catatan pengeluaran aset yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Input Multi-Barang Pengeluaran (Keperluan yang Sama) */}
      {isJalur1ModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Pengeluaran Aset untuk Penggunaan (Multi-Barang)
                </h3>
                <p className="text-xs text-slate-500">
                  Keluarkan beberapa jenis aset sekaligus untuk ruangan/keperluan yang sama
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJalur1ModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitJalur1} className="space-y-4 mt-4 text-sm">
              {/* Target & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Untuk (Unit / Fakultas / Ruangan Penerima)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lab Komputer 3 Gedung B / Ruang Dekanat FKIP"
                    value={untuk}
                    onChange={e => setUntuk(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Penyerahan
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalPenyerahan}
                    onChange={e => setTanggalPenyerahan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Asset Selection Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pilih Aset yang Dikeluarkan
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ketik/Scan Kode Unik Aset atau Barcode..."
                    value={quickInputCode}
                    onChange={e => setQuickInputCode(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAssetByCode(quickInputCode);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddAssetByCode(quickInputCode)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                  >
                    Tambah
                  </button>
                </div>

                {/* Quick Pick dropdown from Available assets */}
                <div className="text-xs">
                  <span className="text-slate-500 block mb-1">Atau pilih dari aset berstatus 'Tersedia':</span>
                  <select
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    onChange={e => {
                      if (e.target.value) {
                        handleAddAssetByCode(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pilih aset dari stok tersedia --</option>
                    {allAvailableAssets
                      .filter(a => !selectedAssets.some(sa => sa.barcode === a.barcode))
                      .map(a => (
                        <option key={a.barcode} value={a.barcode}>
                          {a.kodeUnikAset} - {a.nama} ({a.kategori})
                        </option>
                      ))}
                  </select>
                </div>

                {/* List of currently selected assets */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700">
                    Aset yang dipilih ({selectedAssets.length} unit):
                  </div>

                  {selectedAssets.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {selectedAssets.map((asset, idx) => (
                        <div
                          key={asset.barcode}
                          className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs shadow-2xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-slate-900 truncate">
                              {idx + 1}. {asset.nama}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Kode: <strong className="text-blue-700">{asset.kodeUnikAset}</strong> | SN: {asset.nomorSeri}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(asset.barcode)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer shrink-0"
                            title="Hapus aset dari daftar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-center py-3 bg-white rounded-lg border border-dashed border-slate-200 text-xs">
                      Belum ada aset yang dipilih. Silakan scan atau pilih dari dropdown di atas.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan penempatan perangkat atau kebutuhan operasional..."
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsJalur1ModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedAssets.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Keluarkan {selectedAssets.length} Aset Ini</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Detail Pengeluaran Modal */}
      {isDetailModalOpen && selectedPengeluaran && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {selectedPengeluaran.idPengeluaran}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  Detail Dokumen Pengeluaran Aset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Tanggal Penyerahan:</span>
                  <strong className="text-slate-900">{selectedPengeluaran.tanggalPenyerahan}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Jalur Pengeluaran:</span>
                  <strong className="text-blue-700 font-semibold">{selectedPengeluaran.jenisPengeluaran}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Petugas Penyerah:</span>
                  <strong className="text-slate-900">{selectedPengeluaran.petugas}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Untuk (Unit / Ruangan Penerima):</span>
                  <strong className="text-slate-900 font-semibold">{selectedPengeluaran.untuk}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">ID Tiket / Referensi:</span>
                  <strong className="text-emerald-700 font-mono">{selectedPengeluaran.idTiketPeminjaman || '-'}</strong>
                </div>
              </div>

              {/* Asset List */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Daftar Aset yang Dikeluarkan:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Kode Unik Aset</th>
                        <th className="py-2 px-3">Nama Barang</th>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3">Nomor Seri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedPengeluaran.items || selectedPengeluaran.subItems) && (selectedPengeluaran.items || selectedPengeluaran.subItems)!.length > 0 ? (
                        (selectedPengeluaran.items || selectedPengeluaran.subItems)!.map((sub: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono font-bold text-blue-700">{sub.kodeUnikAset}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{sub.namaAset}</td>
                            <td className="py-2 px-3 text-slate-600">{sub.kategori || '-'}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{sub.barcode || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">{selectedPengeluaran.kodeUnikAset}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{selectedPengeluaran.namaAset}</td>
                          <td className="py-2 px-3 text-slate-600">{selectedPengeluaran.kategori || '-'}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{selectedPengeluaran.barcode}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Catatan Keterangan:</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                  {selectedPengeluaran.keterangan || 'Tidak ada catatan keterangan khusus.'}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePrintBast(selectedPengeluaran)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Penyerahan Aset PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <SignatoryConfirmModal
        isOpen={Boolean(pendingBastItem)}
        documentTitle={
          pendingBastItem
            ? `BAST Pengeluaran Aset: ${pendingBastItem.idPengeluaran}`
            : 'BAST Pengeluaran Aset'
        }
        defaultPetugas={pendingBastItem?.petugas}
        onClose={() => setPendingBastItem(null)}
        onConfirm={handleConfirmPrintBast}
      />
    </div>
  );
};

