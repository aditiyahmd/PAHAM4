import React, { useState } from 'react';
import {
  FileText,
  Search,
  ArrowUpRight,
  QrCode,
  Calendar,
  Building,
  CheckCircle2,
  Info,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { BukuPengeluaranItem, Asset } from '../../types';

interface BukuPengeluaranViewProps {
  onDataChanged?: () => void;
}

export const BukuPengeluaranView: React.FC<BukuPengeluaranViewProps> = ({ onDataChanged }) => {
  const [pengeluaranList, setPengeluaranList] = useState<BukuPengeluaranItem[]>(() =>
    AppDatabase.getBukuPengeluaran()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<'Semua' | 'Penggunaan' | 'Peminjaman'>('Semua');

  // Form State Jalur 1: Pengeluaran karena Penggunaan
  const [isJalur1ModalOpen, setIsJalur1ModalOpen] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
  const [untuk, setUntuk] = useState('');
  const [tanggalPenyerahan, setTanggalPenyerahan] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');

  const activeUser = AppDatabase.getActiveUser();

  const reloadData = () => {
    setPengeluaranList(AppDatabase.getBukuPengeluaran());
    if (onDataChanged) onDataChanged();
  };

  const handleLookupAsset = (code: string) => {
    setInputCode(code);
    if (!code.trim()) {
      setScannedAsset(null);
      return;
    }
    const found = AppDatabase.getAssetByBarcodeOrUnique(code);
    setScannedAsset(found || null);
  };

  const handleSubmitJalur1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedAsset) {
      alert('Aset belum dipilih atau kode tidak valid!');
      return;
    }
    if (!untuk.trim()) {
      alert('Mohon isi peruntukan ("Untuk") penyerahan aset!');
      return;
    }

    const res = AppDatabase.recordPengeluaranPenggunaan({
      barcodeOrUniqueCode: scannedAsset.kodeUnikAset || scannedAsset.barcode,
      untuk,
      tanggalPenyerahan,
      keterangan
    });

    if (res.success) {
      alert(res.message);
      setIsJalur1ModalOpen(false);
      setInputCode('');
      setScannedAsset(null);
      setUntuk('');
      setKeterangan('');
      reloadData();
    } else {
      alert(res.message);
    }
  };

  const filtered = pengeluaranList.filter(item => {
    const matchSearch =
      item.namaAset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kodeUnikAset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.untuk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.idPengeluaran.toLowerCase().includes(searchTerm.toLowerCase());
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
            Mencatat mutasi pengeluaran aset karena <strong>Penggunaan</strong> (Jalur 1) dan pengeluaran otomatis dari <strong>Peminjaman</strong> (Jalur 2 / BR-004 & BR-011).
          </p>
        </div>

        {activeUser.role === 'ACT-03' && (
          <button
            type="button"
            onClick={() => setIsJalur1ModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
            Pengeluaran karena Penggunaan (Jalur 1)
          </button>
        )}
      </div>

      {/* Info Rules Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Jalur 1 — Pengeluaran karena Penggunaan</div>
            <p className="mt-1 text-slate-600">
              Admin scan QR Code/input kode unik aset, sistem auto-isi rincian aset, kemudian Admin mengisi peruntukan (unit/ruangan). Status aset otomatis beralih menjadi <strong>Digunakan</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Jalur 2 — Pengeluaran karena Peminjaman (BR-004)</div>
            <p className="mt-1 text-slate-600">
              Tidak diinput manual di sini! Jalur 2 dipicu otomatis oleh Modul C saat peminjaman diserahkan resmi: status aset menjadi <strong>Dipinjam</strong> dan otomatis tercatat ke Buku Pengeluaran.
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
            placeholder="Cari berdasarkan nama aset, kode unik, atau penerima..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-sm outline-none bg-transparent"
          />
        </div>

        <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterJenis('Semua')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterJenis === 'Semua' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterJenis('Penggunaan')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterJenis === 'Penggunaan' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
          >
            Jalur 1 (Penggunaan)
          </button>
          <button
            type="button"
            onClick={() => setFilterJenis('Peminjaman')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterJenis === 'Peminjaman' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
          >
            Jalur 2 (Peminjaman)
          </button>
        </div>

        <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-600 font-semibold">Total Pengeluaran Aset:</span>
          <span className="text-base font-bold text-slate-900 font-mono">{filtered.length} Catatan</span>
        </div>
      </div>

      {/* Table Buku Pengeluaran */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ID Pengeluaran</th>
                <th className="py-3.5 px-4">Tgl Serah</th>
                <th className="py-3.5 px-4">Kode Unik & Barcode</th>
                <th className="py-3.5 px-4">Nama Aset</th>
                <th className="py-3.5 px-4">Jenis Jalur</th>
                <th className="py-3.5 px-4">Untuk (Penerima)</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(item => (
                <tr key={item.idPengeluaran} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700 text-xs">
                    {item.idPengeluaran}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {item.tanggalPenyerahan}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                      {item.kodeUnikAset}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Scan: {item.barcode}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {item.namaAset}
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
                    {item.keterangan}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {item.petugas || 'Admin PUSDATIN'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    Belum ada catatan pengeluaran aset yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Jalur 1: Pengeluaran karena Penggunaan (A.2 Jalur 1) */}
      {isJalur1ModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pengeluaran karena Penggunaan (A.2 Jalur 1)</h3>
                <p className="text-xs text-slate-500">Scan QR Code atau input kode aset untuk diserahkan</p>
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Scan QR Code / Input Kode Unik / Barcode
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: AST-UMC-2026-001 atau 30192848"
                    value={inputCode}
                    onChange={e => handleLookupAsset(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Auto-filled Asset Details */}
              {scannedAsset ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-emerald-900 text-sm">{scannedAsset.nama}</div>
                  <div className="text-emerald-800">
                    Kode Unik: <strong className="font-mono">{scannedAsset.kodeUnikAset}</strong> | Kategori: {scannedAsset.kategori}
                  </div>
                  <div className="text-emerald-700">
                    Status Saat Ini: <span className="font-bold">{scannedAsset.status}</span> | Lokasi: {scannedAsset.lokasi}
                  </div>
                </div>
              ) : (
                inputCode.trim() && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Aset tidak ditemukan. Pastikan kode unik atau barcode benar.
                  </div>
                )
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Untuk (Unit / Fakultas / Ruangan Penerima)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ruang Dekanat FKIP Lt. 2 / BAA UMC"
                  value={untuk}
                  onChange={e => setUntuk(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Tanggal Penyerahan
                </label>
                <input
                  type="date"
                  required
                  value={tanggalPenyerahan}
                  onChange={e => setTanggalPenyerahan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4. Keterangan Pengeluaran
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan penempatan perangkat atau kebutuhan operasional..."
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
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
                  disabled={!scannedAsset}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Catat Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
