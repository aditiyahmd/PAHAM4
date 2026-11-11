import React, { useState } from 'react';
import {
  FileText,
  PlusCircle,
  PackagePlus,
  QrCode,
  Search,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { BukuPenerimaanItem, Asset } from '../../types';
import { UnifiedAssetCode } from '../QRCodeView';

interface BukuPenerimaanViewProps {
  onDataChanged?: () => void;
}

export const BukuPenerimaanView: React.FC<BukuPenerimaanViewProps> = ({ onDataChanged }) => {
  const [penerimaanList, setPenerimaanList] = useState<BukuPenerimaanItem[]>(() =>
    AppDatabase.getBukuPenerimaan()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedPenerimaan, setSelectedPenerimaan] = useState<BukuPenerimaanItem | null>(null);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);

  // Form State: Buku Penerimaan
  const [formPenerimaan, setFormPenerimaan] = useState({
    tanggalPenerimaan: new Date().toISOString().split('T')[0],
    dari: '',
    nomorFaktur: '',
    tanggalFaktur: new Date().toISOString().split('T')[0],
    namaAset: '',
    kategori: 'Komputer & Laptop',
    banyaknya: 1,
    hargaSatuan: 0,
    nomorBeritaAcara: '',
    tanggalBeritaAcara: new Date().toISOString().split('T')[0],
    keterangan: ''
  });

  // Form State: Registrasi Unit Fisik (A.1.2)
  const [formUnit, setFormUnit] = useState({
    namaAset: '',
    kategori: 'Komputer & Laptop',
    merekModel: '',
    nomorSeri: '',
    spesifikasi: '',
    jenisAset: 'Fisik' as 'Fisik' | 'Non-Fisik',
    lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    statusAwal: 'Tersedia' as 'Tersedia' | 'Digunakan' | 'Dipinjam',
    vendorSupplier: '',
    hargaBeli: 0,
    masaGaransi: '2 Tahun Garansi Resmi'
  });

  const categories = AppDatabase.getMasterCategories();
  const locations = AppDatabase.getMasterLocations();
  const activeUser = AppDatabase.getActiveUser();

  const reloadData = () => {
    setPenerimaanList(AppDatabase.getBukuPenerimaan());
    if (onDataChanged) onDataChanged();
  };

  // BR-003: Jumlah harga otomatis dihitung sistem = banyaknya * harga_satuan
  const calculatedJumlahHarga = (Number(formPenerimaan.banyaknya) || 0) * (Number(formPenerimaan.hargaSatuan) || 0);

  const handleSubmitPenerimaan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPenerimaan.namaAset || !formPenerimaan.dari || !formPenerimaan.nomorFaktur) {
      alert('Mohon lengkapi Nama Aset, Pengirim/Vendor, dan Nomor Faktur!');
      return;
    }

    const res = AppDatabase.addBukuPenerimaan({
      tanggalPenerimaan: formPenerimaan.tanggalPenerimaan,
      dari: formPenerimaan.dari,
      nomorFaktur: formPenerimaan.nomorFaktur,
      tanggalFaktur: formPenerimaan.tanggalFaktur,
      namaAset: formPenerimaan.namaAset,
      kategori: formPenerimaan.kategori,
      banyaknya: Number(formPenerimaan.banyaknya),
      hargaSatuan: Number(formPenerimaan.hargaSatuan),
      nomorBeritaAcara: formPenerimaan.nomorBeritaAcara || `BAST-${Date.now().toString().slice(-6)}`,
      tanggalBeritaAcara: formPenerimaan.tanggalBeritaAcara,
      keterangan: formPenerimaan.keterangan
    });

    if (res.success && res.data) {
      alert(res.message);
      setIsAddModalOpen(false);
      reloadData();
      // Buka modal registrasi unit fisik
      openUnitModal(res.data);
    }
  };

  const openUnitModal = (item: BukuPenerimaanItem) => {
    setSelectedPenerimaan(item);
    setFormUnit({
      namaAset: item.namaAset,
      kategori: item.kategori,
      merekModel: '',
      nomorSeri: '',
      spesifikasi: '',
      jenisAset: 'Fisik',
      lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
      statusAwal: 'Tersedia',
      vendorSupplier: item.dari,
      hargaBeli: item.hargaSatuan,
      masaGaransi: '2 Tahun Garansi Resmi'
    });
    setIsUnitModalOpen(true);
  };

  const handleSubmitUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUnit.namaAset) return;

    const barcode = String(Math.floor(10000000 + Math.random() * 90000000));
    const allAssets = AppDatabase.getAssets();
    // BR-001: Kode Unik Aset bersifat unik dan tidak dapat diubah
    const kodeUnikAset = `AST-UMC-${new Date().getFullYear()}-${String(allAssets.length + 1).padStart(3, '0')}`;

    const newAsset: Asset = {
      barcode,
      kodeUnikAset,
      nama: formUnit.namaAset,
      kategori: formUnit.kategori,
      merekModel: formUnit.merekModel,
      nomorSeri: formUnit.nomorSeri || `SN-${barcode}`,
      spesifikasi: formUnit.spesifikasi,
      lokasi: formUnit.lokasi,
      status: formUnit.statusAwal,
      tanggalMasuk: new Date().toISOString().split('T')[0],
      tanggalPembelian: selectedPenerimaan?.tanggalFaktur || new Date().toISOString().split('T')[0],
      nomorPoInvoice: selectedPenerimaan?.nomorFaktur,
      vendorSupplier: formUnit.vendorSupplier || selectedPenerimaan?.dari,
      hargaBeli: Number(formUnit.hargaBeli),
      masaGaransi: formUnit.masaGaransi,
      jenisAset: formUnit.jenisAset,
      lokasiAwal: formUnit.lokasi,
      idPenerimaanTerkait: selectedPenerimaan?.idPenerimaan
    };

    AppDatabase.addAsset(newAsset);
    alert(`Unit fisik berhasil diregistrasi dengan Kode Unik: ${kodeUnikAset} & Barcode: ${barcode}!`);
    setIsUnitModalOpen(false);
    setSelectedAssetForQR(newAsset);
    reloadData();
  };

  const filtered = penerimaanList.filter(
    p =>
      p.namaAset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dari.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nomorFaktur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.idPenerimaan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              MODUL A.1
            </span>
            <h1 className="text-xl font-bold text-slate-900">Buku Penerimaan Aset TI</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mencatat faktur pengadaan, berita acara penerimaan, perhitungan otomatis harga (BR-003), dan registrasi unit fisik dengan Kode Unik (BR-001) & QR Code (BR-002).
          </p>
        </div>

        {activeUser.role === 'ACT-03' && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Input Buku Penerimaan
          </button>
        )}
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama aset, nomor faktur, vendor, atau ID penerimaan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-sm outline-none bg-transparent"
          />
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
          <span className="text-xs text-emerald-800 font-semibold">Total Dokumen Penerimaan:</span>
          <span className="text-lg font-bold text-emerald-900 font-mono">{penerimaanList.length}</span>
        </div>
      </div>

      {/* Table Buku Penerimaan */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ID Penerimaan</th>
                <th className="py-3.5 px-4">Tgl Terima</th>
                <th className="py-3.5 px-4">Faktur & Berita Acara</th>
                <th className="py-3.5 px-4">Nama Aset & Kategori</th>
                <th className="py-3.5 px-4">Banyaknya</th>
                <th className="py-3.5 px-4">Harga Satuan</th>
                <th className="py-3.5 px-4">Jumlah Harga (BR-003)</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(item => (
                <tr key={item.idPenerimaan} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-xs">
                    {item.idPenerimaan}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {item.tanggalPenerimaan}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-xs text-slate-900">{item.nomorFaktur}</div>
                    <div className="text-[11px] text-slate-500">Dari: {item.dari}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.nomorBeritaAcara}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{item.namaAset}</div>
                    <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {item.banyaknya} Unit
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                    Rp {item.hargaSatuan.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-xs">
                    Rp {item.jumlahHarga.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openUnitModal(item)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto border border-slate-200 cursor-pointer transition-all"
                    >
                      <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
                      Registrasi Unit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    Belum ada data penerimaan aset yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Input Buku Penerimaan Aset */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Input Buku Penerimaan Aset (A.1.1)</h3>
                <p className="text-xs text-slate-500">Mencatat dokumen faktur & Berita Acara Penerimaan</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPenerimaan} className="space-y-4 mt-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Penerimaan</label>
                  <input
                    type="date"
                    required
                    value={formPenerimaan.tanggalPenerimaan}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, tanggalPenerimaan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dari (Vendor / Rekanan)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT. Metrodata Electronics Tbk"
                    value={formPenerimaan.dari}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, dari: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Faktur / Invoice</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: INV/2026/X/089"
                    value={formPenerimaan.nomorFaktur}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, nomorFaktur: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Faktur</label>
                  <input
                    type="date"
                    required
                    value={formPenerimaan.tanggalFaktur}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, tanggalFaktur: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Aset</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Laptop ASUS ExpertBook B1 Core i7"
                    value={formPenerimaan.namaAset}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, namaAset: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Aset</label>
                  <select
                    value={formPenerimaan.kategori}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Banyaknya (Unit)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPenerimaan.banyaknya}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, banyaknya: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    required
                    value={formPenerimaan.hargaSatuan}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, hargaSatuan: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1">Jumlah Harga (BR-003)</label>
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold font-mono text-emerald-800">
                    Rp {calculatedJumlahHarga.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Berita Acara Penerimaan (BAST)</label>
                  <input
                    type="text"
                    placeholder="Contoh: BAST-PUSDATIN/2026/X/041"
                    value={formPenerimaan.nomorBeritaAcara}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, nomorBeritaAcara: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Berita Acara</label>
                  <input
                    type="date"
                    value={formPenerimaan.tanggalBeritaAcara}
                    onChange={e => setFormPenerimaan({ ...formPenerimaan, tanggalBeritaAcara: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan sumber dana, program kerja, atau unit tujuan..."
                  value={formPenerimaan.keterangan}
                  onChange={e => setFormPenerimaan({ ...formPenerimaan, keterangan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Buku Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrasi Unit Fisik (A.1.2 & BR-001) */}
      {isUnitModalOpen && selectedPenerimaan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {selectedPenerimaan.idPenerimaan}
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg">Registrasi Masing-Masing Barang (A.1.2)</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menerbitkan Kode Unik Aset (BR-001) dan Label QR Code/Barcode (BR-002)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitUnit} className="space-y-4 mt-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Aset</label>
                  <input
                    type="text"
                    required
                    value={formUnit.namaAset}
                    onChange={e => setFormUnit({ ...formUnit, namaAset: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Aset</label>
                  <select
                    value={formUnit.kategori}
                    onChange={e => setFormUnit({ ...formUnit, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Merek & Model</label>
                  <input
                    type="text"
                    placeholder="Contoh: ASUS ExpertBook B1 B1402CBA"
                    value={formUnit.merekModel}
                    onChange={e => setFormUnit({ ...formUnit, merekModel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Seri (Serial Number / SN)</label>
                  <input
                    type="text"
                    placeholder="Contoh: SN-84920188"
                    value={formUnit.nomorSeri}
                    onChange={e => setFormUnit({ ...formUnit, nomorSeri: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Spesifikasi Teknis</label>
                <input
                  type="text"
                  placeholder="Contoh: Intel Core i7-1255U, 16GB RAM, 512GB SSD"
                  value={formUnit.spesifikasi}
                  onChange={e => setFormUnit({ ...formUnit, spesifikasi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Operasional Awal</label>
                  <select
                    value={formUnit.statusAwal}
                    onChange={e => setFormUnit({ ...formUnit, statusAwal: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-emerald-800"
                  >
                    <option value="Tersedia">Tersedia (Ready di Pusdatin)</option>
                    <option value="Digunakan">Digunakan (Langsung Terpasang)</option>
                    <option value="Dipinjam">Dipinjam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Aset</label>
                  <select
                    value={formUnit.jenisAset}
                    onChange={e => setFormUnit({ ...formUnit, jenisAset: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Fisik">Fisik (Hardware)</option>
                    <option value="Non-Fisik">Non-Fisik (Software / Lisensi)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Masa Garansi</label>
                  <input
                    type="text"
                    value={formUnit.masaGaransi}
                    onChange={e => setFormUnit({ ...formUnit, masaGaransi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Penempatan Fisik Awal</label>
                <select
                  value={formUnit.lokasi}
                  onChange={e => setFormUnit({ ...formUnit, lokasi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Sistem Otomatis:</strong> Setelah disimpan, sistem akan menerbitkan <strong>Kode Unik Aset (BR-001)</strong> permanen dan QR Code/Barcode label (BR-002) yang memuat nama aset, kode scan, dan kode unik aset untuk ditempel pada fisik barang.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  Registrasi & Buat Label QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Code Preview & Print */}
      {selectedAssetForQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Label QR Code & Barcode Aset
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAssetForQR(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <UnifiedAssetCode
              namaAset={selectedAssetForQR.nama}
              barcode={selectedAssetForQR.barcode}
              kodeUnikAset={selectedAssetForQR.kodeUnikAset}
              kategori={selectedAssetForQR.kategori}
              lokasi={selectedAssetForQR.lokasi}
            />

            <button
              type="button"
              onClick={() => setSelectedAssetForQR(null)}
              className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
