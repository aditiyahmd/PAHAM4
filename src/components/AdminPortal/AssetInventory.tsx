import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { Asset, AssetStatus } from '../../types';
import { BarcodeView } from '../BarcodeView';
import { BarcodeScannerModal } from '../Modals/BarcodeScannerModal';
import { AssetDetailHistoryModal } from '../Modals/AssetDetailHistoryModal';
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
  Sparkles,
  Camera,
  Plus,
  Building,
  User,
  Calendar,
  DollarSign,
  ShieldCheck,
  FileText,
  Tag
} from 'lucide-react';

interface AssetInventoryProps {
  onDataChanged: () => void;
}

export const AssetInventory: React.FC<AssetInventoryProps> = ({ onDataChanged }) => {
  const masterLocations = AppDatabase.getMasterLocations();
  const masterCategories = AppDatabase.getMasterCategories();

  // Input form state matching all Part A fields
  const [namaBarang, setNamaBarang] = useState('');
  const [kategori, setKategori] = useState(() => masterCategories[0] || 'Komputer & Laptop');
  const [merekModel, setMerekModel] = useState('');
  const [nomorSeri, setNomorSeri] = useState('');
  const [spesifikasi, setSpesifikasi] = useState('');
  const [statusAwal, setStatusAwal] = useState<AssetStatus>('Tersedia');
  const [pengguna, setPengguna] = useState('');
  const [bidangPengguna, setBidangPengguna] = useState('');
  const [lokasi, setLokasi] = useState(() => masterLocations[0] || 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)');
  const [isCustomLokasi, setIsCustomLokasi] = useState(false);
  const [customLokasiInput, setCustomLokasiInput] = useState('');
  const [tanggalPembelian, setTanggalPembelian] = useState(() => new Date().toISOString().split('T')[0]);
  const [nomorPoInvoice, setNomorPoInvoice] = useState('');
  const [vendorSupplier, setVendorSupplier] = useState('');
  const [hargaBeli, setHargaBeli] = useState<number | ''>('');
  const [masaGaransi, setMasaGaransi] = useState('');
  const [jenisAset, setJenisAset] = useState<'Fisik' | 'Non-Fisik'>('Fisik');

  const [customBarcode, setCustomBarcode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [jumlah, setJumlah] = useState(1);
  const [generatedItems, setGeneratedItems] = useState<{ barcode: string; nama: string; kategori: string; lokasi: string }[]>([]);
  const [isModalBarcodeOpen, setIsModalBarcodeOpen] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  // Preview modals
  const [viewingBarcodeAsset, setViewingBarcodeAsset] = useState<Asset | null>(null);
  const [detailModalAsset, setDetailModalAsset] = useState<Asset | null>(null);

  const assets = AppDatabase.getAssets();

  const handleSimpanBarang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) return;

    if (statusAwal === 'Digunakan' && (!pengguna.trim() || !bidangPengguna.trim())) {
      alert('Untuk aset dengan status "Digunakan", nama Pengguna dan Bidang Pengguna wajib diisi!');
      return;
    }

    const newItems: { barcode: string; nama: string; kategori: string; lokasi: string }[] = [];
    const jml = Math.max(1, jumlah);
    const finalLokasi = (isCustomLokasi ? customLokasiInput.trim() : lokasi) || 'Ruang PUSDATIN';
    const nowIso = new Date().toISOString().split('T')[0];

    for (let i = 0; i < jml; i++) {
      let finalBarcode = '';
      if (customBarcode.trim() && i === 0) {
        finalBarcode = customBarcode.trim();
      } else {
        // Generate unique 8-digit EAN-8 compliant barcode
        const randomPrefix = Math.floor(1000000 + Math.random() * 9000000);
        let sum = 0;
        const strCode = randomPrefix.toString();
        for (let j = 0; j < 7; j++) {
          const d = parseInt(strCode.charAt(j));
          sum += j % 2 === 0 ? d * 3 : d * 1;
        }
        const checksum = (10 - (sum % 10)) % 10;
        finalBarcode = strCode + checksum.toString();
      }

      const newAsset: Asset = {
        barcode: finalBarcode,
        kodeUnikAset: `AST-UMC-${new Date().getFullYear()}-${finalBarcode}`,
        nama: namaBarang.trim(),
        kategori,
        merekModel: merekModel.trim() || undefined,
        nomorSeri: nomorSeri.trim() || undefined,
        spesifikasi: spesifikasi.trim() || undefined,
        status: statusAwal,
        pengguna: statusAwal === 'Digunakan' ? pengguna.trim() : undefined,
        bidangPengguna: statusAwal === 'Digunakan' ? bidangPengguna.trim() : undefined,
        lokasi: finalLokasi,
        lokasiAwal: finalLokasi,
        tanggalMasuk: nowIso,
        tanggalPembelian: tanggalPembelian || undefined,
        nomorPoInvoice: nomorPoInvoice.trim() || undefined,
        vendorSupplier: vendorSupplier.trim() || undefined,
        hargaBeli: typeof hargaBeli === 'number' ? hargaBeli : undefined,
        masaGaransi: masaGaransi.trim() || undefined,
        jenisAset: jenisAset
      };

      AppDatabase.addAsset(newAsset);
      newItems.push({
        barcode: finalBarcode,
        nama: namaBarang.trim(),
        kategori,
        lokasi: finalLokasi
      });
    }

    setGeneratedItems(newItems);
    setIsModalBarcodeOpen(true);

    // Reset Form
    setNamaBarang('');
    setMerekModel('');
    setNomorSeri('');
    setSpesifikasi('');
    setStatusAwal('Tersedia');
    setPengguna('');
    setBidangPengguna('');
    setCustomBarcode('');
    setNomorPoInvoice('');
    setVendorSupplier('');
    setHargaBeli('');
    setMasaGaransi('');
    setJumlah(1);
    onDataChanged();
  };

  const exportToCsv = () => {
    const headers = [
      'Barcode',
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
      'Tanggal Masuk'
    ];
    const rows = assets.map(a => [
      a.barcode,
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
    link.setAttribute('download', `Daftar_Aset_Lengkap_PUSDATIN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch =
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.barcode.includes(searchTerm) ||
      a.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.merekModel && a.merekModel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.nomorSeri && a.nomorSeri.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.pengguna && a.pengguna.toLowerCase().includes(searchTerm.toLowerCase()));
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
        <title>Cetak Label Barcode</title>
        <style>
          body { font-family: monospace; margin: 0; padding: 10px; }
          .thermal-ticket { border-bottom: 1px dashed #000; padding: 10px 0; text-align: center; }
          .brand { font-weight: bold; font-size: 14px; }
          .barcode-box { font-size: 22px; letter-spacing: 2px; margin: 6px 0; }
          .title { font-size: 11px; margin-bottom: 4px; }
          .code { font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body onload="window.print()">
        ${ticketsHtml}
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
              Registrasi Barang Masuk & Input Aset Lengkap PUSDATIN
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Input data aset terpadu (merek & model, nomor seri, spesifikasi, pengguna & bidang, vendor/PO, harga beli, masa garansi) yang tersinkronisasi penuh dengan katalog Seluruh Aset PUSDATIN.
            </p>
          </div>
        </div>

        <form onSubmit={handleSimpanBarang} className="space-y-5">
          {/* Section 1: Informasi Pokok & Identitas Aset */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <Tag className="w-3.5 h-3.5 text-purple-600" />
              <span>1. Identitas Pokok & Klasifikasi Perangkat</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Aset / Perangkat <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaBarang}
                  onChange={e => setNamaBarang(e.target.value)}
                  placeholder="Contoh: Laptop ASUS ExpertBook B1 Core i7 16GB"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori Aset <span className="text-red-600">*</span>
                </label>
                <select
                  value={kategori}
                  onChange={e => setKategori(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                >
                  {masterCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Merek dan Model
                </label>
                <input
                  type="text"
                  value={merekModel}
                  onChange={e => setMerekModel(e.target.value)}
                  placeholder="Contoh: ASUS ExpertBook B1402CBA / Dell 5430"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Seri (Serial Number)
                </label>
                <input
                  type="text"
                  value={nomorSeri}
                  onChange={e => setNomorSeri(e.target.value)}
                  placeholder="Contoh: ASUS-EXP-2026-001 / SN12345678"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jenis Aset
                </label>
                <select
                  value={jenisAset}
                  onChange={e => setJenisAset(e.target.value as 'Fisik' | 'Non-Fisik')}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                >
                  <option value="Fisik">Aset Fisik (Hardware / Barang)</option>
                  <option value="Non-Fisik">Aset Non-Fisik (Sistem, Jaringan, Software, Lisensi)</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Spesifikasi Teknis
                </label>
                <textarea
                  rows={2}
                  value={spesifikasi}
                  onChange={e => setSpesifikasi(e.target.value)}
                  placeholder="Contoh: Intel Core i7-1255U, 16GB RAM DDR4, 512GB SSD NVMe, Layar 14 FHD IPS..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Status, Pengguna, dan Lokasi */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Status Operasional, Pengguna & Lokasi Penempatan</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status Operasional Awal <span className="text-red-600">*</span>
                </label>
                <select
                  value={statusAwal}
                  onChange={e => setStatusAwal(e.target.value as AssetStatus)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="Tersedia">Tersedia (Siap di PUSDATIN / Standby Pinjam)</option>
                  <option value="Digunakan">Digunakan (Sedang Dipakai Unit/Staff Tertentu)</option>
                  <option value="Dipinjam">Dipinjam (Peminjaman Aktif)</option>
                  <option value="Rusak">Rusak (Memerlukan Servis)</option>
                </select>
              </div>

              {/* Conditional Pengguna & Bidang Pengguna if Digunakan */}
              {statusAwal === 'Digunakan' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1.5">
                      Nama Pengguna (User) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={pengguna}
                      onChange={e => setPengguna(e.target.value)}
                      placeholder="Contoh: Hilyah Aulia, S.T. / Dr. Sunardi"
                      className="w-full px-3.5 py-2.5 bg-blue-50 border border-blue-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1.5">
                      Bidang / Unit Pengguna <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bidangPengguna}
                      onChange={e => setBidangPengguna(e.target.value)}
                      placeholder="Contoh: Biro Administrasi Umum (BAU) / FKIP"
                      className="w-full px-3.5 py-2.5 bg-blue-50 border border-blue-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 flex items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600" />
                  <span>Aset berstatus <strong>{statusAwal}</strong> berada di ruang penyimpanan PUSDATIN dan dapat dipinjamkan sewaktu-waktu.</span>
                </div>
              )}

              {/* Lokasi Penempatan */}
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Lokasi Penempatan Master <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomLokasi(!isCustomLokasi)}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-800 underline"
                  >
                    {isCustomLokasi ? 'Pilih dari Master' : '+ Input Lokasi Khusus'}
                  </button>
                </div>

                {!isCustomLokasi ? (
                  <select
                    value={lokasi}
                    onChange={e => setLokasi(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  >
                    {masterLocations.map(loc => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={customLokasiInput}
                    onChange={e => setCustomLokasiInput(e.target.value)}
                    placeholder="Ketik lokasi spesifik..."
                    className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Pengadaan, Pembelian, Vendor & Garansi */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Data Pengadaan, Vendor, PO & Masa Garansi</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Pembelian
                </label>
                <input
                  type="date"
                  value={tanggalPembelian}
                  onChange={e => setTanggalPembelian(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor PO / Invoice
                </label>
                <input
                  type="text"
                  value={nomorPoInvoice}
                  onChange={e => setNomorPoInvoice(e.target.value)}
                  placeholder="PO/UMC-IT/2026/X/089"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Vendor / Supplier
                </label>
                <input
                  type="text"
                  value={vendorSupplier}
                  onChange={e => setVendorSupplier(e.target.value)}
                  placeholder="PT. Metrodata Electronics / CV. Komputindo"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Harga Beli (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={hargaBeli}
                  onChange={e => setHargaBeli(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="14500000"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Masa Garansi
                </label>
                <input
                  type="text"
                  value={masaGaransi}
                  onChange={e => setMasaGaransi(e.target.value)}
                  placeholder="Contoh: 2 Tahun Garansi Resmi ASUS (s/d Oktober 2028)"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Barcode & Jumlah Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Barcode Khusus / Scan Fisik <span className="text-slate-400 font-normal">(Opsional - Kosongkan jika auto-generate)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customBarcode}
                  onChange={e => setCustomBarcode(e.target.value)}
                  placeholder="Kosongkan untuk auto-generate sistem 8 digit barcode..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Foto / Scan Barcode Kamera"
                >
                  <Camera className="w-4 h-4" />
                  <span>Foto Barcode</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jumlah Unit Masuk
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={jumlah}
                onChange={e => setJumlah(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              type="submit"
              className="py-3 px-8 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Barcode className="w-4 h-4" />
              <span>Simpan Aset Lengkap & Terbitkan Barcode</span>
            </button>
          </div>
        </form>
      </div>

      {/* Asset List & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Katalog Aset Terdaftar ({filteredAssets.length} dari {assets.length})
            </h3>
            <p className="text-xs text-slate-500">
              Klik Barcode untuk cetak stiker thermal atau klik Lihat Rincian untuk memeriksa data spesifikasi, pengguna, dan invoice aset.
            </p>
          </div>

          <button
            type="button"
            onClick={exportToCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV Lengkap</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari barcode, nama, merek, SN, pengguna..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          <div>
            <select
              value={selectedKategori}
              onChange={e => setSelectedKategori(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            >
              <option value="Semua">Semua Kategori</option>
              {masterCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            >
              <option value="Semua">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Digunakan">Digunakan</option>
              <option value="Dipinjam">Dipinjam</option>
              <option value="Rusak">Rusak</option>
              <option value="Diperbaiki">Diperbaiki</option>
              <option value="Berfungsi Kembali">Berfungsi Kembali</option>
              <option value="Rusak Total">Rusak Total</option>
            </select>
          </div>
        </div>

        {/* Assets Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3">Nama Perangkat & Merek</th>
                  <th className="px-4 py-3">Kategori & Jenis</th>
                  <th className="px-4 py-3">Pengguna & Lokasi</th>
                  <th className="px-4 py-3">Invoice & Garansi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada aset yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map(asset => (
                    <tr key={asset.barcode} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingBarcodeAsset(asset)}
                          className="hover:text-purple-600 underline flex items-center gap-1 cursor-pointer"
                          title="Klik untuk cetak label barcode"
                        >
                          <Barcode className="w-3.5 h-3.5 text-purple-600" />
                          <span>{asset.barcode}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <div className="font-bold text-slate-900">{asset.nama}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {asset.merekModel && <span>{asset.merekModel}</span>}
                          {asset.nomorSeri && (
                            <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px]">
                              SN: {asset.nomorSeri}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{asset.kategori}</span>
                        <div className="text-[10px] text-slate-500">{asset.jenisAset || 'Fisik'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {asset.pengguna ? (
                          <div className="text-blue-900 font-semibold text-[11px]">
                            👤 {asset.pengguna} <span className="text-slate-500">({asset.bidangPengguna || '-'})</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{asset.lokasi}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">
                        {asset.nomorPoInvoice && <div className="font-mono">{asset.nomorPoInvoice}</div>}
                        {asset.vendorSupplier && <div className="text-slate-500 line-clamp-1">{asset.vendorSupplier}</div>}
                        {asset.masaGaransi && <div className="text-[10px] text-emerald-700 font-medium">{asset.masaGaransi}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          asset.status === 'Tersedia' ? 'bg-emerald-100 text-emerald-800' :
                          asset.status === 'Digunakan' ? 'bg-blue-100 text-blue-800' :
                          asset.status === 'Dipinjam' ? 'bg-indigo-100 text-indigo-800' :
                          asset.status === 'Berfungsi Kembali' ? 'bg-teal-100 text-teal-800' :
                          asset.status === 'Rusak Total' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailModalAsset(asset)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail & Riwayat Aset"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingBarcodeAsset(asset)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Barcode Thermal"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Batch Barcode Generation Modal */}
      {isModalBarcodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {generatedItems.length} Aset Berhasil Didaftarkan!
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalBarcodeOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Perangkat telah tercatat ke dalam sistem inventaris PUSDATIN dengan data terpadu. Anda dapat mencetak stiker thermal atau mengunduh barcode di bawah ini.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generatedItems.map(item => (
                <BarcodeView
                  key={item.barcode}
                  value={item.barcode}
                  name={item.nama}
                  kategori={item.kategori}
                  lokasi={item.lokasi}
                  format="CODE128"
                  showActions={true}
                  className="border border-slate-200 shadow-2xs"
                />
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={printBatchThermalLabels}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Semua Label (POS-58)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalBarcodeOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Barcode Preview Modal */}
      {viewingBarcodeAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Pratinjau Label Barcode
              </h3>
              <button
                type="button"
                onClick={() => setViewingBarcodeAsset(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
            />

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setViewingBarcodeAsset(null)}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanSuccess={(detectedCode) => {
            setCustomBarcode(detectedCode);
            setShowScanner(false);
          }}
        />
      )}

      {/* Full Asset Detail Modal */}
      {detailModalAsset && (
        <AssetDetailHistoryModal
          asset={detailModalAsset}
          onClose={() => setDetailModalAsset(null)}
        />
      )}
    </div>
  );
};
