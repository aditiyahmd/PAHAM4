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
  X
} from 'lucide-react';

interface AllAssetsMasterViewProps {
  onDataChanged: () => void;
}

export const AllAssetsMasterView: React.FC<AllAssetsMasterViewProps> = ({ onDataChanged }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedLokasi, setSelectedLokasi] = useState<string>('Semua');
  const [viewingBarcodeAsset, setViewingBarcodeAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  // Quick edit modal
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editStatus, setEditStatus] = useState<AssetStatus>('Tersedia');
  const [editLokasi, setEditLokasi] = useState('');
  const [editCatatan, setEditCatatan] = useState('');

  const assets = AppDatabase.getAssets();

  // Unique categories and locations for filters
  const categories = Array.from(new Set(assets.map(a => a.kategori))).filter(Boolean);
  const locations = Array.from(new Set(assets.map(a => a.lokasi))).filter(Boolean);

  const filteredAssets = assets.filter(a => {
    const matchesSearch =
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.spesifikasi && a.spesifikasi.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = selectedStatus === 'Semua' || a.status === selectedStatus;
    const matchesKategori = selectedKategori === 'Semua' || a.kategori === selectedKategori;
    const matchesLokasi = selectedLokasi === 'Semua' || a.lokasi === selectedLokasi;

    return matchesSearch && matchesStatus && matchesKategori && matchesLokasi;
  });

  const countByStatus = {
    total: assets.length,
    tersedia: assets.filter(a => a.status === 'Tersedia').length,
    digunakan: assets.filter(a => a.status === 'Digunakan').length,
    dipinjam: assets.filter(a => a.status === 'Dipinjam').length,
    rusak: assets.filter(a => a.status === 'Rusak').length,
    diperbaiki: assets.filter(a => a.status === 'Diperbaiki').length
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setEditStatus(asset.status);
    setEditLokasi(asset.lokasi);
    setEditCatatan('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    AppDatabase.updateAssetStatus(
      editingAsset.barcode,
      editStatus,
      editLokasi,
      true,
      editCatatan || `Update status aset oleh admin PUSDATIN menjadi ${editStatus}`
    );

    setEditingAsset(null);
    onDataChanged();
    alert(`Status aset ${editingAsset.nama} (${editingAsset.barcode}) berhasil diperbarui menjadi ${editStatus}!`);
  };

  const exportCsv = () => {
    const headers = ['Barcode', 'Nama Barang', 'Kategori', 'Status', 'Lokasi', 'Tanggal Registrasi'];
    const rows = filteredAssets.map(a => [
      a.barcode,
      `"${a.nama.replace(/"/g, '""')}"`,
      `"${a.kategori}"`,
      a.status,
      `"${a.lokasi.replace(/"/g, '""')}"`,
      a.tanggalMasuk
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Data_Seluruh_Aset_PUSDATIN_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span>Daftar Seluruh Aset PUSDATIN UMC</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-md border border-slate-200">
              {assets.length} Total Aset
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Katalog terpadu seluruh inventaris perangkat IT, server, jaringan, multimedia, dan fasilitas kampus Universitas Muhammadiyah Cirebon.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* KPI Metric Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setSelectedStatus('Semua')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'Semua' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${selectedStatus === 'Semua' ? 'text-slate-300' : 'text-slate-500'}`}>
            Semua Aset
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Tersedia')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'Tersedia' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${selectedStatus === 'Tersedia' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Tersedia (Siap)
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.tersedia}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Digunakan')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'Digunakan' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${selectedStatus === 'Digunakan' ? 'text-blue-100' : 'text-blue-700'}`}>
            Digunakan (Ruang)
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.digunakan}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Dipinjam')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'Dipinjam' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${selectedStatus === 'Dipinjam' ? 'text-indigo-100' : 'text-indigo-700'}`}>
            Sedang Dipinjam
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.dipinjam}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Rusak')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'Rusak' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${selectedStatus === 'Rusak' ? 'text-red-100' : 'text-red-700'}`}>
            Rusak
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.rusak}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Diperbaiki')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'Diperbaiki' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${selectedStatus === 'Diperbaiki' ? 'text-amber-100' : 'text-amber-700'}`}>
            Servis / Bengkel
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{countByStatus.diperbaiki}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari barcode, nama barang, lokasi, spek..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Kategori */}
          <select
            value={selectedKategori}
            onChange={e => setSelectedKategori(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="Semua">Semua Lokasi</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {(searchTerm || selectedStatus !== 'Semua' || selectedKategori !== 'Semua' || selectedLokasi !== 'Semua') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('Semua');
                setSelectedKategori('Semua');
                setSelectedLokasi('Semua');
              }}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Reset Filter
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
                <th className="px-4 py-3.5">Barcode Aset</th>
                <th className="px-4 py-3.5">Nama Perangkat / Tipe</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">Lokasi Saat Ini</th>
                <th className="px-4 py-3.5">Status Kondisi</th>
                <th className="px-4 py-3.5">Tgl Masuk</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <p className="font-bold text-sm">Tidak ada aset yang sesuai kriteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci atau reset filter status.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const isAvailable = asset.status === 'Tersedia';

                  return (
                    <tr key={asset.barcode} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingBarcodeAsset(asset)}
                          className="font-mono font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 inline-flex items-center gap-1.5 transition-colors"
                          title="Klik untuk cetak label barcode"
                        >
                          <Barcode className="w-3.5 h-3.5 text-red-600" />
                          <span>{asset.barcode}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <p className="font-bold">{asset.nama}</p>
                        {asset.spesifikasi && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">{asset.spesifikasi}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] border border-slate-200">
                          {asset.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{asset.lokasi}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                          isAvailable ? 'bg-emerald-100 text-emerald-800' :
                          asset.status === 'Digunakan' ? 'bg-blue-100 text-blue-800' :
                          asset.status === 'Dipinjam' ? 'bg-indigo-100 text-indigo-800' :
                          asset.status === 'Rusak' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {isAvailable ? '✓ Tersedia' :
                           asset.status === 'Digunakan' ? '🔒 Digunakan' :
                           asset.status === 'Dipinjam' ? '⏱ Dipinjam' :
                           asset.status === 'Rusak' ? '✕ Rusak' :
                           '⚙ Diperbaiki'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        {asset.tanggalMasuk}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailAsset(asset)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors"
                          title="Lihat Riwayat Peminjaman, Kerusakan & Lokasi"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Riwayat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(asset)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                        >
                          Ubah Status
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewingBarcodeAsset(asset)}
                          className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
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
                className="text-slate-400 hover:text-slate-600 p-1"
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
              className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Ubah Status & Lokasi Aset Cepat */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Ubah Status Aset</h3>
                <span className="font-mono text-xs text-red-600 font-bold">
                  {editingAsset.barcode} · {editingAsset.nama}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Baru Aset
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as AssetStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value="Tersedia">Tersedia (Siap Digunakan / Dipinjam)</option>
                  <option value="Digunakan">Digunakan (Terpasang Aktif di Ruangan)</option>
                  <option value="Dipinjam">Dipinjam (Sedang Dipinjam)</option>
                  <option value="Rusak">Rusak (Malfungsi / Perlu Ditinjau)</option>
                  <option value="Diperbaiki">Diperbaiki (Dalam Penanganan Teknisi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi / Ruangan Penempatan
                </label>
                <input
                  type="text"
                  required
                  value={editLokasi}
                  onChange={e => setEditLokasi(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Pembaruan (Log Aktivitas)
                </label>
                <textarea
                  rows={2}
                  value={editCatatan}
                  onChange={e => setEditCatatan(e.target.value)}
                  placeholder="Keterangan perubahan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                >
                  Simpan Perubahan
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
