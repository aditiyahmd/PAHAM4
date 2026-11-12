import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { Asset, AssetStatus } from '../../types';
import { BarcodeView } from '../BarcodeView';
import { AssetDetailHistoryModal } from '../Modals/AssetDetailHistoryModal';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Clock,
  Wrench,
  Download,
  Barcode,
  MapPin,
  Tag,
  Printer,
  ChevronRight,
  Eye,
  X,
  Edit,
  User,
  Building,
  DollarSign,
  FileText,
  ShieldCheck,
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import { PdfReportService } from '../../services/pdfReportService';

interface AllAssetsMasterViewProps {
  onDataChanged: () => void;
  isReadOnly?: boolean;
}

export const AllAssetsMasterView: React.FC<AllAssetsMasterViewProps> = ({
  onDataChanged,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedLokasi, setSelectedLokasi] = useState<string>('Semua');
  const [filterBulanMasuk, setFilterBulanMasuk] = useState<string>('');
  const [sortBulanMasuk, setSortBulanMasuk] = useState<'desc' | 'asc' | 'none'>('desc');

  const [viewingBarcodeAsset, setViewingBarcodeAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  // Edit modal state
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editKategori, setEditKategori] = useState('');
  const [editMerekModel, setEditMerekModel] = useState('');
  const [editNomorSeri, setEditNomorSeri] = useState('');
  const [editSpesifikasi, setEditSpesifikasi] = useState('');
  const [editStatus, setEditStatus] = useState<AssetStatus>('Tersedia');
  const [editPengguna, setEditPengguna] = useState('');
  const [editBidangPengguna, setEditBidangPengguna] = useState('');
  const [editLokasi, setEditLokasi] = useState('');
  const [editTanggalPembelian, setEditTanggalPembelian] = useState('');
  const [editNomorPoInvoice, setEditNomorPoInvoice] = useState('');
  const [editVendorSupplier, setEditVendorSupplier] = useState('');
  const [editHargaBeli, setEditHargaBeli] = useState<number | ''>('');
  const [editMasaGaransi, setEditMasaGaransi] = useState('');
  const [editJenisAset, setEditJenisAset] = useState<'Fisik' | 'Non-Fisik'>('Fisik');
  const [editCatatan, setEditCatatan] = useState('');

  const assets = AppDatabase.getAssets();
  const masterCategories = AppDatabase.getMasterCategories();
  const masterLocations = AppDatabase.getMasterLocations();

  // Unique categories and locations for filters
  const categories = Array.from(new Set([...masterCategories, ...assets.map(a => a.kategori)])).filter(Boolean);
  const locations = Array.from(new Set([...masterLocations, ...assets.map(a => a.lokasi)])).filter(Boolean);

  const filteredAssets = assets
    .filter(a => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        a.nama.toLowerCase().includes(q) ||
        a.barcode.includes(searchTerm) ||
        (a.kodeUnikAset && a.kodeUnikAset.toLowerCase().includes(q)) ||
        a.lokasi.toLowerCase().includes(q) ||
        (a.merekModel && a.merekModel.toLowerCase().includes(q)) ||
        (a.nomorSeri && a.nomorSeri.toLowerCase().includes(q)) ||
        (a.pengguna && a.pengguna.toLowerCase().includes(q)) ||
        (a.bidangPengguna && a.bidangPengguna.toLowerCase().includes(q)) ||
        (a.nomorPoInvoice && a.nomorPoInvoice.toLowerCase().includes(q)) ||
        (a.vendorSupplier && a.vendorSupplier.toLowerCase().includes(q)) ||
        (a.spesifikasi && a.spesifikasi.toLowerCase().includes(q));

      const matchesStatus = selectedStatus === 'Semua' || a.status === selectedStatus;
      const matchesKategori = selectedKategori === 'Semua' || a.kategori === selectedKategori;
      const matchesLokasi = selectedLokasi === 'Semua' || a.lokasi === selectedLokasi;
      const matchesBulan = filterBulanMasuk
        ? (a.tanggalMasuk && a.tanggalMasuk.startsWith(filterBulanMasuk)) ||
          (a.tanggalPembelian && a.tanggalPembelian.startsWith(filterBulanMasuk))
        : true;

      return matchesSearch && matchesStatus && matchesKategori && matchesLokasi && matchesBulan;
    })
    .sort((a, b) => {
      if (sortBulanMasuk === 'none') return 0;
      const dateA = a.tanggalMasuk || a.tanggalPembelian || '';
      const dateB = b.tanggalMasuk || b.tanggalPembelian || '';
      if (sortBulanMasuk === 'desc') {
        return dateB.localeCompare(dateA);
      } else {
        return dateA.localeCompare(dateB);
      }
    });

  const countByStatus = {
    total: assets.length,
    tersedia: assets.filter(a => a.status === 'Tersedia').length,
    digunakan: assets.filter(a => a.status === 'Digunakan').length,
    dipinjam: assets.filter(a => a.status === 'Dipinjam').length,
    rusak: assets.filter(a => a.status === 'Rusak').length,
    diperbaiki: assets.filter(a => a.status === 'Diperbaiki').length,
    rusakTotal: assets.filter(a => a.status === 'Rusak Total').length
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setEditNama(asset.nama);
    setEditKategori(asset.kategori);
    setEditMerekModel(asset.merekModel || '');
    setEditNomorSeri(asset.nomorSeri || '');
    setEditSpesifikasi(asset.spesifikasi || '');
    setEditStatus(asset.status);
    setEditPengguna(asset.pengguna || '');
    setEditBidangPengguna(asset.bidangPengguna || '');
    setEditLokasi(asset.lokasi);
    setEditTanggalPembelian(asset.tanggalPembelian || '');
    setEditNomorPoInvoice(asset.nomorPoInvoice || '');
    setEditVendorSupplier(asset.vendorSupplier || '');
    setEditHargaBeli(typeof asset.hargaBeli === 'number' ? asset.hargaBeli : '');
    setEditMasaGaransi(asset.masaGaransi || '');
    setEditJenisAset(asset.jenisAset || 'Fisik');
    setEditCatatan('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    if (editStatus === 'Digunakan' && (!editPengguna.trim() || !editBidangPengguna.trim())) {
      alert('Untuk aset dengan status "Digunakan", nama Pengguna dan Bidang Pengguna wajib diisi!');
      return;
    }

    const updatedData: Partial<Asset> = {
      nama: editNama.trim(),
      kategori: editKategori,
      merekModel: editMerekModel.trim() || undefined,
      nomorSeri: editNomorSeri.trim() || undefined,
      spesifikasi: editSpesifikasi.trim() || undefined,
      status: editStatus,
      pengguna: editStatus === 'Digunakan' ? editPengguna.trim() : undefined,
      bidangPengguna: editStatus === 'Digunakan' ? editBidangPengguna.trim() : undefined,
      lokasi: editLokasi.trim(),
      tanggalPembelian: editTanggalPembelian || undefined,
      nomorPoInvoice: editNomorPoInvoice.trim() || undefined,
      vendorSupplier: editVendorSupplier.trim() || undefined,
      hargaBeli: typeof editHargaBeli === 'number' ? editHargaBeli : undefined,
      masaGaransi: editMasaGaransi.trim() || undefined,
      jenisAset: editJenisAset
    };

    AppDatabase.updateAssetFull(
      editingAsset.barcode,
      updatedData,
      true,
      editCatatan || `Pembaruan data aset ${editNama} (${editingAsset.barcode}) oleh Admin PUSDATIN`
    );

    setEditingAsset(null);
    onDataChanged();
    alert(`Data aset ${editNama} (${editingAsset.barcode}) berhasil diperbarui dengan status: ${editStatus}!`);
  };

  const handlePrintPdf = () => {
    const filterDesc = [
      filterBulanMasuk ? `Bulan Masuk: ${filterBulanMasuk}` : null,
      selectedKategori !== 'Semua' ? `Kategori: ${selectedKategori}` : null,
      selectedLokasi !== 'Semua' ? `Lokasi: ${selectedLokasi}` : null,
      selectedStatus !== 'Semua' ? `Status: ${selectedStatus}` : null
    ]
      .filter(Boolean)
      .join(' | ') || 'Semua Data Master Aset';

    PdfReportService.generateMasterAsetPdf(filteredAssets, filterDesc, {
      title: 'Laporan Master Aset TI Universitas Muhammadiyah Cirebon'
    });
  };

  const exportCsv = () => {
    const headers = [
      'Barcode',
      'Kode Unik Aset',
      'Nama Aset',
      'Kategori',
      'Jenis Aset',
      'Merek & Model',
      'Nomor Seri',
      'Spesifikasi',
      'Status',
      'Pengguna',
      'Bidang Pengguna',
      'Lokasi',
      'Tanggal Pembelian',
      'Nomor PO/Invoice',
      'Vendor/Supplier',
      'Harga Beli (Rp)',
      'Masa Garansi',
      'Tanggal Registrasi'
    ];
    const rows = filteredAssets.map(a => [
      a.barcode,
      a.kodeUnikAset || '',
      `"${(a.nama || '').replace(/"/g, '""')}"`,
      `"${a.kategori}"`,
      a.jenisAset || 'Fisik',
      `"${(a.merekModel || '').replace(/"/g, '""')}"`,
      `"${(a.nomorSeri || '').replace(/"/g, '""')}"`,
      `"${(a.spesifikasi || '').replace(/"/g, '""')}"`,
      a.status,
      `"${(a.pengguna || '').replace(/"/g, '""')}"`,
      `"${(a.bidangPengguna || '').replace(/"/g, '""')}"`,
      `"${(a.lokasi || '').replace(/"/g, '""')}"`,
      a.tanggalPembelian || '',
      `"${(a.nomorPoInvoice || '').replace(/"/g, '""')}"`,
      `"${(a.vendorSupplier || '').replace(/"/g, '""')}"`,
      a.hargaBeli || '',
      `"${(a.masaGaransi || '').replace(/"/g, '""')}"`,
      a.tanggalMasuk
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Aset_PUSDATIN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Master Aset PUSDATIN UMC</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-md border border-slate-200">
              {assets.length} Total Aset
            </span>
            {isReadOnly && (
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                Mode Read-Only (Pimpinan)
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Katalog master seluruh inventaris perangkat IT, server, jaringan, multimedia, dan software Universitas Muhammadiyah Cirebon.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Cetak Laporan Master Aset PDF berdasarkan filter saat ini"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Master Aset</span>
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setSelectedStatus('Semua')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Semua' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedStatus === 'Semua' ? 'text-slate-300' : 'text-slate-500'}`}>
            Semua Aset
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Tersedia')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Tersedia' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedStatus === 'Tersedia' ? 'text-emerald-100' : 'text-emerald-600'}`}>
            Tersedia
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.tersedia}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Digunakan')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Digunakan' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedStatus === 'Digunakan' ? 'text-blue-100' : 'text-blue-600'}`}>
            Digunakan
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.digunakan}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Dipinjam')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Dipinjam' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedStatus === 'Dipinjam' ? 'text-indigo-100' : 'text-indigo-600'}`}>
            Dipinjam
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.dipinjam}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Rusak')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Rusak' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedStatus === 'Rusak' ? 'text-red-100' : 'text-red-600'}`}>
            Rusak
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.rusak}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Rusak Total')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Rusak Total' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedStatus === 'Rusak Total' ? 'text-rose-100' : 'text-rose-600'}`}>
            Rusak Total (Afkir)
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.rusakTotal}</span>
        </button>
      </div>

      {/* Filter, Sort, and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari kode unik, barcode, nama, SN, pengguna..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          {/* Filter Bulan Masuk */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="month"
              value={filterBulanMasuk}
              onChange={e => setFilterBulanMasuk(e.target.value)}
              className="w-full bg-transparent outline-none text-xs text-slate-700"
              title="Filter Bulan Masuk / Pembelian"
            />
            {filterBulanMasuk && (
              <button
                type="button"
                onClick={() => setFilterBulanMasuk('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Kategori */}
          <select
            value={selectedKategori}
            onChange={e => setSelectedKategori(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white"
          >
            <option value="Semua">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Filter Lokasi */}
          <select
            value={selectedLokasi}
            onChange={e => setSelectedLokasi(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white"
          >
            <option value="Semua">Semua Lokasi</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Sort Bar & Active Filter Info */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Menampilkan <strong>{filteredAssets.length}</strong> dari {assets.length} aset
            </span>

            {/* Sort Bulan Masuk */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Urutkan:</span>
              <button
                type="button"
                onClick={() => setSortBulanMasuk(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowUpDown className="w-3 h-3 text-slate-500" />
                <span>Bulan Masuk ({sortBulanMasuk === 'desc' ? 'Terbaru' : 'Terlama'})</span>
              </button>
            </div>
          </div>

          {(searchTerm || selectedStatus !== 'Semua' || selectedKategori !== 'Semua' || selectedLokasi !== 'Semua' || filterBulanMasuk) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('Semua');
                setSelectedKategori('Semua');
                setSelectedLokasi('Semua');
                setFilterBulanMasuk('');
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer underline"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Table View of All Assets */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Kode Unik & Barcode</th>
                <th className="px-4 py-3.5">Nama Perangkat & Merek</th>
                <th className="px-4 py-3.5">Kategori & Jenis</th>
                <th className="px-4 py-3.5">Pengguna & Lokasi</th>
                <th className="px-4 py-3.5">Bulan Masuk / PO</th>
                <th className="px-4 py-3.5">Status Kondisi</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <p className="font-bold text-sm">Tidak ada aset yang sesuai kriteria filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci atau reset filter.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  return (
                    <tr key={asset.barcode} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 block w-fit">
                          {asset.kodeUnikAset}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingBarcodeAsset(asset)}
                          className="font-mono text-slate-500 hover:text-slate-800 text-[10px] flex items-center gap-1 mt-1 cursor-pointer"
                          title="Klik untuk cetak label barcode"
                        >
                          <Barcode className="w-3 h-3 text-slate-400" />
                          <span>{asset.barcode}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <p className="font-bold">{asset.nama}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          {asset.merekModel && <span>{asset.merekModel}</span>}
                          {asset.nomorSeri && (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-[10px]">
                              SN: {asset.nomorSeri}
                            </span>
                          )}
                        </div>
                        {asset.spesifikasi && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{asset.spesifikasi}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold border border-slate-200 block w-fit">
                          {asset.kategori}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {asset.jenisAset || 'Fisik'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {asset.pengguna ? (
                          <div className="text-blue-900 font-semibold text-[11px]">
                            👤 {asset.pengguna} <span className="text-slate-500">({asset.bidangPengguna || '-'})</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-1 text-slate-600 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{asset.lokasi}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-[11px]">
                        <div className="font-semibold text-slate-800">
                          {asset.tanggalMasuk || asset.tanggalPembelian || '-'}
                        </div>
                        {asset.nomorPoInvoice && <div className="font-mono text-[10px] text-slate-500">{asset.nomorPoInvoice}</div>}
                        {asset.vendorSupplier && <div className="text-slate-400 text-[10px] line-clamp-1">{asset.vendorSupplier}</div>}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                          asset.status === 'Tersedia' ? 'bg-emerald-100 text-emerald-800' :
                          asset.status === 'Digunakan' ? 'bg-blue-100 text-blue-800' :
                          asset.status === 'Dipinjam' ? 'bg-indigo-100 text-indigo-800' :
                          asset.status === 'Rusak Total' ? 'bg-rose-100 text-rose-800' :
                          asset.status === 'Rusak' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {asset.status === 'Tersedia' ? '✓ Tersedia' :
                           asset.status === 'Digunakan' ? '🔒 Digunakan' :
                           asset.status === 'Dipinjam' ? '⏱ Dipinjam' :
                           asset.status === 'Rusak Total' ? '⛔ Rusak Total' :
                           asset.status === 'Rusak' ? '✕ Rusak' :
                           '⚙ Diperbaiki'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailAsset(asset)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          title="Lihat Detail & Riwayat Aset"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Rincian</span>
                        </button>

                        {/* Edit Button is hidden if isReadOnly === true (Halaman Eksekutif) */}
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(asset)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title="Edit Seluruh Data Aset"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setViewingBarcodeAsset(asset)}
                          className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="Cetak Barcode"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview & Cetak Barcode */}
      {viewingBarcodeAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Label Barcode Aset
              </span>
              <button
                type="button"
                onClick={() => setViewingBarcodeAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <BarcodeView
              value={viewingBarcodeAsset.barcode}
              name={viewingBarcodeAsset.nama}
              kategori={viewingBarcodeAsset.kategori}
              lokasi={viewingBarcodeAsset.lokasi}
              format="CODE128"
              width={1.6}
              height={50}
            />

            <button
              type="button"
              onClick={() => setViewingBarcodeAsset(null)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Edit Modal for All Asset Fields (Without 'Berfungsi Kembali') */}
      {editingAsset && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Data Aset PUSDATIN</h3>
                <span className="font-mono text-xs text-purple-700 font-bold">
                  {editingAsset.kodeUnikAset} · {editingAsset.nama}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Nama Aset */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Aset / Perangkat <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNama}
                    onChange={e => setEditNama(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Aset <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={editKategori}
                    onChange={e => setEditKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Jenis Aset */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Aset
                  </label>
                  <select
                    value={editJenisAset}
                    onChange={e => setEditJenisAset(e.target.value as 'Fisik' | 'Non-Fisik')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="Fisik">Fisik (Barang / Hardware)</option>
                    <option value="Non-Fisik">Non-Fisik (Sistem, Jaringan, Software)</option>
                  </select>
                </div>

                {/* Merek & Model */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Merek dan Model
                  </label>
                  <input
                    type="text"
                    value={editMerekModel}
                    onChange={e => setEditMerekModel(e.target.value)}
                    placeholder="Contoh: ASUS ExpertBook B1 / HP AIO"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                </div>

                {/* Nomor Seri */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Seri (Serial Number)
                  </label>
                  <input
                    type="text"
                    value={editNomorSeri}
                    onChange={e => setEditNomorSeri(e.target.value)}
                    placeholder="Contoh: SN-88912-2026"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>

                {/* Spesifikasi */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Spesifikasi Teknis
                  </label>
                  <textarea
                    rows={2}
                    value={editSpesifikasi}
                    onChange={e => setEditSpesifikasi(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                </div>

                {/* Status Aset (Bereskan status operasional: dapat diubah ke Rusak, hapus Berfungsi Kembali) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Operasional <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as AssetStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  >
                    <option value="Tersedia">Tersedia (Ready di PUSDATIN)</option>
                    <option value="Digunakan">Digunakan (Terpasang / Digunakan Unit)</option>
                    <option value="Dipinjam">Dipinjam (Sedang Dipinjam)</option>
                    <option value="Rusak">Rusak (Malfungsi / Butuh Perbaikan)</option>
                    <option value="Diperbaiki">Diperbaiki (Dalam Servis Teknisi)</option>
                    <option value="Rusak Total">Rusak Total / Afkir</option>
                  </select>
                </div>

                {/* Lokasi */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lokasi Penempatan <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editLokasi}
                    onChange={e => setEditLokasi(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  />
                </div>

                {/* Conditional Pengguna & Bidang Pengguna */}
                {editStatus === 'Digunakan' && (
                  <>
                    <div>
                      <label className="block font-bold text-blue-900 mb-1">
                        Nama Pengguna (User) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editPengguna}
                        onChange={e => setEditPengguna(e.target.value)}
                        className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-slate-900 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-blue-900 mb-1">
                        Bidang / Unit Pengguna <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editBidangPengguna}
                        onChange={e => setEditBidangPengguna(e.target.value)}
                        className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-slate-900 font-semibold"
                      />
                    </div>
                  </>
                )}

                {/* Data Pengadaan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Pembelian
                  </label>
                  <input
                    type="date"
                    value={editTanggalPembelian}
                    onChange={e => setEditTanggalPembelian(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor PO / Invoice
                  </label>
                  <input
                    type="text"
                    value={editNomorPoInvoice}
                    onChange={e => setEditNomorPoInvoice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Vendor / Supplier
                  </label>
                  <input
                    type="text"
                    value={editVendorSupplier}
                    onChange={e => setEditVendorSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Harga Beli (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editHargaBeli}
                    onChange={e => setEditHargaBeli(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Masa Garansi
                  </label>
                  <input
                    type="text"
                    value={editMasaGaransi}
                    onChange={e => setEditMasaGaransi(e.target.value)}
                    placeholder="Contoh: 2 Tahun Garansi Resmi ASUS"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Perubahan (Log Aktivitas)
                  </label>
                  <textarea
                    rows={2}
                    value={editCatatan}
                    onChange={e => setEditCatatan(e.target.value)}
                    placeholder="Keterangan perubahan..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Seluruh Perubahan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Riwayat Aset Lengkap */}
      {detailAsset && (
        <AssetDetailHistoryModal
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
        />
      )}
    </div>
  );
};

