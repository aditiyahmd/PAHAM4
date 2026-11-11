import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { Asset } from '../../types';
import { BarcodeView } from '../BarcodeView';
import {
  PackagePlus,
  Search,
  Barcode,
  Layers,
  MapPin,
  Download,
  Filter,
  CheckCircle2,
  Printer,
  Eye,
  X,
  Sparkles
} from 'lucide-react';

interface AssetInventoryProps {
  onDataChanged: () => void;
}

export const AssetInventory: React.FC<AssetInventoryProps> = ({ onDataChanged }) => {
  // Input form state
  const [namaBarang, setNamaBarang] = useState('');
  const [kategori, setKategori] = useState('Networking');
  const [lokasi, setLokasi] = useState('Gedung Rektorat Lt.1');
  const [jumlah, setJumlah] = useState(1);
  const [generatedItems, setGeneratedItems] = useState<{ barcode: string; nama: string; kategori: string; lokasi: string }[]>([]);
  const [isModalBarcodeOpen, setIsModalBarcodeOpen] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  // Preview single barcode modal
  const [viewingBarcodeAsset, setViewingBarcodeAsset] = useState<Asset | null>(null);

  const assets = AppDatabase.getAssets();

  const handleSimpanBarang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) return;

    const newItems: { barcode: string; nama: string; kategori: string; lokasi: string }[] = [];
    const jml = Math.max(1, jumlah);

    for (let i = 0; i < jml; i++) {
      // Generate unique 8-digit EAN-8 compliant barcode
      const randomPrefix = Math.floor(1000000 + Math.random() * 9000000);
      let sum = 0;
      const strCode = randomPrefix.toString();
      for (let j = 0; j < 7; j++) {
        const d = parseInt(strCode.charAt(j));
        sum += j % 2 === 0 ? d * 3 : d * 1;
      }
      const checksum = (10 - (sum % 10)) % 10;
      const finalBarcode = strCode + checksum.toString();

      const newAsset: Asset = {
        barcode: finalBarcode,
        nama: namaBarang.trim(),
        kategori,
        lokasi,
        status: 'Tersedia',
        tanggalMasuk: new Date().toISOString().split('T')[0]
      };

      AppDatabase.addAsset(newAsset);
      newItems.push({
        barcode: finalBarcode,
        nama: namaBarang.trim(),
        kategori,
        lokasi
      });
    }

    setGeneratedItems(newItems);
    setIsModalBarcodeOpen(true);
    setNamaBarang('');
    setJumlah(1);
    onDataChanged();
  };

  const exportToCsv = () => {
    const headers = ['Barcode', 'Nama Barang', 'Kategori', 'Status', 'Lokasi', 'Tanggal Masuk'];
    const rows = assets.map(a => [
      a.barcode,
      `"${a.nama.replace(/"/g, '""')}"`,
      `"${a.kategori}"`,
      a.status,
      `"${a.lokasi}"`,
      a.tanggalMasuk
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Aset_PUSDATIN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch =
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.barcode.includes(searchTerm) ||
      a.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori = selectedKategori === 'Semua' || a.kategori === selectedKategori;
    const matchesStatus = selectedStatus === 'Semua' || a.status === selectedStatus;
    return matchesSearch && matchesKategori && matchesStatus;
  });

  const printBatchThermalLabels = () => {
    const printWin = window.open('', '_blank', 'width=380,height=300');
    if (!printWin) {
      alert('Harap izinkan popup browser untuk mencetak stiker thermal.');
      return;
    }

    let ticketsHtml = '';
    generatedItems.forEach(item => {
      ticketsHtml += `
        <div class="thermal-ticket">
          <div class="brand">PUSDATIN UMC</div>
          <div class="barcode-box">||| | | ||| | |||</div>
          <div class="title">${item.nama.replace(/"/g, '&quot;')}</div>
          <div class="code">* ${item.barcode} *</div>
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Batch Stiker Barcode</title>
        <style>
          @page { size: 58mm 28mm; margin: 0; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          .thermal-ticket {
            width: 48mm;
            height: 25mm;
            margin: 0 auto;
            padding: 1.5mm 0 0 0;
            text-align: center;
            box-sizing: border-box;
            break-after: page;
            page-break-after: always;
          }
          .thermal-ticket:last-child { break-after: auto; page-break-after: auto; }
          .brand { font-size: 7pt; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 0.5mm; }
          .barcode-box { font-family: monospace; font-size: 14pt; font-weight: bold; letter-spacing: 2px; }
          .title { font-size: 8pt; font-weight: bold; margin-top: 0.8mm; line-height: 1.1; max-height: 6.5mm; overflow: hidden; }
          .code { font-size: 7.5pt; font-family: monospace; font-weight: bold; margin-top: 0.4mm; }
        </style>
      </head>
      <body>
        ${ticketsHtml}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Input Barang Masuk Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Registrasi Barang Masuk & Pembuatan Barcode Otomatis
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Daftarkan perangkat baru ke database inventaris PUSDATIN UMC dan terbitkan stiker barcode resmi yang dapat langsung dicetak atau diunduh.
            </p>
          </div>
        </div>

        <form onSubmit={handleSimpanBarang} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Barang / Perangkat <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={namaBarang}
                onChange={e => setNamaBarang(e.target.value)}
                placeholder="Contoh: HP AIO ProOne 400 G4 / Cisco Switch"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={e => setKategori(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              >
                <option value="Networking">Networking</option>
                <option value="Komputer & Laptop">Komputer & Laptop</option>
                <option value="Multimedia">Multimedia & Proyektor</option>
                <option value="Kabel & Aksesoris">Kabel & Aksesoris</option>
                <option value="Server & Storage">Server & Storage</option>
                <option value="Perlengkapan Kantor">Perlengkapan Kantor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jumlah Unit
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={jumlah}
                onChange={e => setJumlah(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lokasi Penempatan Awal
              </label>
              <input
                type="text"
                required
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
                placeholder="Contoh: Gedung Rektorat Lt.1 / Ruang PUSDATIN Kampus 1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Barcode className="w-4 h-4" />
                <span>Simpan & Buat Barcode</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Asset List & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span>Daftar Master Data Aset PUSDATIN UMC</span>
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {filteredAssets.length} Item
            </span>
          </h3>

          <button
            type="button"
            onClick={exportToCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari barcode, nama, lokasi..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <select
            value={selectedKategori}
            onChange={e => setSelectedKategori(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="Semua">-- Semua Kategori --</option>
            <option value="Networking">Networking</option>
            <option value="Komputer & Laptop">Komputer & Laptop</option>
            <option value="Multimedia">Multimedia & Proyektor</option>
            <option value="Kabel & Aksesoris">Kabel & Aksesoris</option>
            <option value="Server & Storage">Server & Storage</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="Semua">-- Semua Status --</option>
            <option value="Tersedia">Tersedia</option>
            <option value="Digunakan">Digunakan</option>
            <option value="Dipinjam">Dipinjam</option>
            <option value="Rusak">Rusak</option>
            <option value="Diperbaiki">Diperbaiki</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3">Nama Perangkat</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tgl Masuk</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset, index) => (
                <tr key={asset.barcode} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">{index + 1}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{asset.barcode}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{asset.nama}</td>
                  <td className="px-4 py-3 text-slate-600">{asset.kategori}</td>
                  <td className="px-4 py-3 text-slate-600">{asset.lokasi}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      asset.status === 'Tersedia' ? 'bg-emerald-100 text-emerald-800' :
                      asset.status === 'Digunakan' ? 'bg-blue-100 text-blue-800' :
                      asset.status === 'Dipinjam' ? 'bg-indigo-100 text-indigo-800' :
                      asset.status === 'Rusak' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono">
                    {asset.tanggalMasuk}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setViewingBarcodeAsset(asset)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
                      title="Lihat barcode visual"
                    >
                      <Barcode className="w-3.5 h-3.5" />
                      <span>Barcode</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REDESIGNED BARCODE RESULT MODAL (Fix for Lampiran 1) */}
      {isModalBarcodeOpen && generatedItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                    Barcode Berhasil Diterbitkan!
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {generatedItems.length} unit aset berhasil disimpan ke database inventaris PUSDATIN UMC.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalBarcodeOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sticker Preview Body */}
            <div className="flex-1 overflow-y-auto py-1">
              {generatedItems.length === 1 ? (
                /* SINGLE ITEM: Centered, Beautifully Proportioned Sticker Card */
                <div className="max-w-md mx-auto space-y-3">
                  <BarcodeView
                    value={generatedItems[0].barcode}
                    name={generatedItems[0].nama}
                    kategori={generatedItems[0].kategori}
                    lokasi={generatedItems[0].lokasi}
                    format="CODE128"
                    showActions={true}
                    className="border-2 border-slate-200 shadow-sm"
                  />
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-center">
                    Label siap ditempel pada fisik perangkat. Ukuran standar: <strong>52 x 25 mm</strong> (Printer Thermal POS-58).
                  </div>
                </div>
              ) : (
                /* MULTIPLE ITEMS: Grid with Batch action */
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200 text-xs">
                    <span className="font-semibold text-purple-900">
                      Total {generatedItems.length} label barcode siap dicetak.
                    </span>
                    <button
                      type="button"
                      onClick={printBatchThermalLabels}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Semua ({generatedItems.length})</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {generatedItems.map((item, idx) => (
                      <BarcodeView
                        key={idx}
                        value={item.barcode}
                        name={item.nama}
                        kategori={item.kategori}
                        lokasi={item.lokasi}
                        format="CODE128"
                        showActions={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                PUSDATIN Universitas Muhammadiyah Cirebon
              </span>
              <button
                type="button"
                onClick={() => setIsModalBarcodeOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl shadow-xs transition-colors"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Single Existing Asset Barcode */}
      {viewingBarcodeAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-slate-700" />
                <span>Stiker Barcode Resmi Aset</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingBarcodeAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <BarcodeView
              value={viewingBarcodeAsset.barcode}
              name={viewingBarcodeAsset.nama}
              kategori={viewingBarcodeAsset.kategori}
              lokasi={viewingBarcodeAsset.lokasi}
              format="CODE128"
              showActions={true}
              className="border-2 border-slate-200 shadow-sm"
            />

            <div className="text-[11px] text-slate-500 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              Status Aset: <strong className="text-slate-800">{viewingBarcodeAsset.status}</strong> · Terdaftar: {viewingBarcodeAsset.tanggalMasuk}
            </div>

            <button
              type="button"
              onClick={() => setViewingBarcodeAsset(null)}
              className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
