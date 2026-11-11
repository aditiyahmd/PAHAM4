import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { Asset } from '../../types';
import { Search, CheckCircle, MapPin, Tag, ArrowRight } from 'lucide-react';

interface AssetCatalogProps {
  onSelectForLoan: (assetName: string) => void;
}

export const AssetCatalog: React.FC<AssetCatalogProps> = ({ onSelectForLoan }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  const assets = AppDatabase.getAssets();
  const categories = ['Semua', ...Array.from(new Set(assets.map(a => a.kategori)))];

  const filtered = assets.filter(a => {
    const matchesSearch =
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.barcode.includes(searchTerm) ||
      a.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || a.kategori === selectedCategory;
    const matchesStatus = selectedStatus === 'Semua' || a.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Katalog Ketersediaan Aset & Perangkat Kampus
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Daftar aset laboratorium, perlengkapan rapat, dan perangkat komputasi di bawah pengelolaan PUSDATIN UMC.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>Total Terdata:</span>
            <span className="font-mono font-bold text-slate-900">{assets.length} Unit</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nama perangkat, barcode, atau lokasi..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
          />
        </div>

        {/* Status & Categories Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {['Semua', 'Tersedia', 'Digunakan', 'Dipinjam', 'Rusak'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedStatus === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Categories Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Assets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(asset => {
          const isAvailable = asset.status === 'Tersedia';

          return (
            <div
              key={asset.barcode}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] text-slate-500 font-semibold">
                    BC: {asset.barcode}
                  </span>
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                    isAvailable ? 'bg-emerald-100 text-emerald-800' :
                    asset.status === 'Dipinjam' ? 'bg-indigo-100 text-indigo-800' :
                    asset.status === 'Rusak' ? 'bg-red-100 text-red-800' :
                    asset.status === 'Diperbaiki' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {isAvailable ? '✓ Tersedia' :
                     asset.status === 'Rusak' ? '✕ Rusak' :
                     asset.status === 'Diperbaiki' ? '⚙ Perbaikan' :
                     asset.status === 'Digunakan' ? '🔒 Digunakan' :
                     '⏱ Dipinjam'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                  {asset.nama}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{asset.kategori}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{asset.lokasi}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Masuk: {asset.tanggalMasuk}
                </span>

                {isAvailable ? (
                  <button
                    type="button"
                    onClick={() => onSelectForLoan(asset.nama)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                  >
                    <span>Ajukan Pinjam</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    Sedang {asset.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
