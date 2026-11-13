import React, { useState } from 'react';
import {
  FileText,
  PlusCircle,
  PackagePlus,
  Barcode,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Printer,
  Eye,
  Trash2,
  Layers,
  ChevronDown,
  Filter,
  AlertCircle,
  X
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { BukuPenerimaanItem, PenerimaanBarangSubItem, Asset, AssetStatus } from '../../types';
import { UnifiedAssetCode } from '../QRCodeView';
import { PdfReportService } from '../../services/pdfReportService';
import { SignatoryConfirmModal, ConfirmedSignatoryValues } from '../Modals/SignatoryConfirmModal';

interface BukuPenerimaanViewProps {
  onDataChanged?: () => void;
}

interface NewItemRow {
  namaAset: string;
  kategori: string;
  banyaknya: number;
  hargaSatuan: number;
  merekModel: string;
  spesifikasi: string;
}

export const BukuPenerimaanView: React.FC<BukuPenerimaanViewProps> = ({ onDataChanged }) => {
  const [penerimaanList, setPenerimaanList] = useState<BukuPenerimaanItem[]>(() =>
    AppDatabase.getBukuPenerimaan()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBatchRegModalOpen, setIsBatchRegModalOpen] = useState(false);
  const [selectedPenerimaan, setSelectedPenerimaan] = useState<BukuPenerimaanItem | null>(null);
  const [selectedSubItem, setSelectedSubItem] = useState<PenerimaanBarangSubItem | null>(null);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);
  const [pendingPrint, setPendingPrint] = useState<
    | { type: 'bast'; item: BukuPenerimaanItem }
    | { type: 'monthly'; list: BukuPenerimaanItem[]; period: string }
    | null
  >(null);

  // Queue state for registering all items in multi-item receipt
  const [registrationQueue, setRegistrationQueue] = useState<PenerimaanBarangSubItem[]>([]);
  const [queueCurrentIndex, setQueueCurrentIndex] = useState<number>(0);
  const [totalQueueItems, setTotalQueueItems] = useState<number>(0);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Form State: Buku Penerimaan Multi-Item
  const [formHeader, setFormHeader] = useState({
    tanggalPenerimaan: new Date().toISOString().split('T')[0],
    dari: '',
    nomorFaktur: '',
    tanggalFaktur: new Date().toISOString().split('T')[0],
    nomorBeritaAcara: '',
    tanggalBeritaAcara: new Date().toISOString().split('T')[0],
    keterangan: ''
  });

  const [formItems, setFormItems] = useState<NewItemRow[]>([
    {
      namaAset: '',
      kategori: 'Komputer & Laptop',
      banyaknya: 1,
      hargaSatuan: 0,
      merekModel: '',
      spesifikasi: ''
    }
  ]);

  // Form State: Unit Registration Modal (Disamakan persis dengan form edit data aset Lampiran 8)
  const [batchRegForm, setBatchRegForm] = useState({
    namaAset: '',
    kategori: 'Komputer & Laptop',
    jenisAset: 'Fisik' as 'Fisik' | 'Non-Fisik',
    merekModel: '',
    nomorSeri: '',
    spesifikasi: '',
    statusAwal: 'Tersedia' as AssetStatus,
    lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
    pengguna: '',
    bidangPengguna: '',
    tanggalPembelian: new Date().toISOString().split('T')[0],
    nomorPoInvoice: '',
    vendorSupplier: '',
    hargaBeli: 0,
    masaGaransi: '2 Tahun Garansi Resmi',
    catatan: ''
  });

  const categories = AppDatabase.getMasterCategories();
  const locations = AppDatabase.getMasterLocations();
  const activeUser = AppDatabase.getActiveUser();

  const reloadData = () => {
    setPenerimaanList(AppDatabase.getBukuPenerimaan());
    if (onDataChanged) onDataChanged();
  };

  // Add Item Row to Multi-Item Receipt Form
  const handleAddItemRow = () => {
    setFormItems(prev => [
      ...prev,
      {
        namaAset: '',
        kategori: categories[0] || 'Komputer & Laptop',
        banyaknya: 1,
        hargaSatuan: 0,
        merekModel: '',
        spesifikasi: ''
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length <= 1) return;
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemRow = (index: number, field: keyof NewItemRow, value: any) => {
    setFormItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Calculated Grand Total for Form
  const grandTotalHarga = formItems.reduce(
    (sum, item) => sum + (Number(item.banyaknya) || 0) * (Number(item.hargaSatuan) || 0),
    0
  );
  const grandTotalUnit = formItems.reduce((sum, item) => sum + (Number(item.banyaknya) || 0), 0);

  // Open Batch Unit Registration Modal with Queue support
  const openBatchRegistration = (
    penerimaan: BukuPenerimaanItem,
    subItem: PenerimaanBarangSubItem,
    queue?: PenerimaanBarangSubItem[],
    currentIndex?: number,
    totalItems?: number
  ) => {
    setSelectedPenerimaan(penerimaan);
    setSelectedSubItem(subItem);

    const activeQueue = queue && queue.length > 0 ? queue : [subItem];
    setRegistrationQueue(activeQueue);
    setQueueCurrentIndex(currentIndex ?? 0);
    setTotalQueueItems(totalItems ?? activeQueue.length);

    const sisa = Math.max(0, subItem.banyaknya - (subItem.terdaftarCount || 0));
    // Pre-populate serial numbers per unit
    const sampleSNs = Array.from(
      { length: Math.max(sisa, 1) },
      (_, i) => `SN-${Date.now().toString().slice(-6)}-${i + 1}`
    ).join('\n');

    setBatchRegForm({
      namaAset: subItem.namaAset,
      kategori: subItem.kategori || 'Komputer & Laptop',
      jenisAset: 'Fisik',
      merekModel: subItem.merekModel || '',
      nomorSeri: sampleSNs,
      spesifikasi: subItem.spesifikasi || '',
      statusAwal: 'Tersedia',
      lokasi: 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)',
      pengguna: '',
      bidangPengguna: '',
      tanggalPembelian: penerimaan.tanggalFaktur || penerimaan.tanggalPenerimaan || new Date().toISOString().split('T')[0],
      nomorPoInvoice: penerimaan.nomorFaktur || '',
      vendorSupplier: penerimaan.dari || '',
      hargaBeli: Number(subItem.hargaSatuan) || 0,
      masaGaransi: '2 Tahun Garansi Resmi',
      catatan: ''
    });
    setIsBatchRegModalOpen(true);
  };

  const getEffectiveSubItems = (item: BukuPenerimaanItem): PenerimaanBarangSubItem[] => {
    if (item.items && item.items.length > 0) return item.items;
    const qty = item.banyaknya || item.jumlah || 1;
    const unitPrice = item.hargaSatuan || 0;
    return [
      {
        idSubItem: `${item.idPenerimaan}-01`,
        namaAset: item.namaAset || 'Perangkat Aset TI',
        kategori: item.kategori || categories[0] || 'Komputer & Laptop',
        banyaknya: qty,
        hargaSatuan: unitPrice,
        jumlahHarga: item.jumlahHarga || qty * unitPrice,
        terdaftarCount: item.tercatatUnitCount || 0
      }
    ];
  };

  // Submit Multi-Item Penerimaan
  const handleSubmitPenerimaan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHeader.dari || !formHeader.nomorFaktur) {
      setStatusBanner({
        type: 'error',
        message: 'Mohon lengkapi Pengirim/Vendor dan Nomor Faktur!'
      });
      return;
    }

    const invalidItem = formItems.find(it => !it.namaAset.trim() || it.banyaknya <= 0);
    if (invalidItem) {
      setStatusBanner({
        type: 'error',
        message: 'Mohon isi nama barang dan jumlah unit minimal 1 untuk semua item!'
      });
      return;
    }

    const bastNo = formHeader.nomorBeritaAcara.trim() || `BAST-${Date.now().toString().slice(-6)}`;

    const res = AppDatabase.addBukuPenerimaan({
      tanggalPenerimaan: formHeader.tanggalPenerimaan,
      dari: formHeader.dari,
      nomorFaktur: formHeader.nomorFaktur,
      tanggalFaktur: formHeader.tanggalFaktur,
      nomorBeritaAcara: bastNo,
      tanggalBeritaAcara: formHeader.tanggalBeritaAcara,
      keterangan: formHeader.keterangan,
      items: formItems.map(item => ({
        namaAset: item.namaAset,
        kategori: item.kategori,
        banyaknya: Number(item.banyaknya),
        hargaSatuan: Number(item.hargaSatuan),
        jumlahHarga: Number(item.banyaknya) * Number(item.hargaSatuan),
        merekModel: item.merekModel,
        spesifikasi: item.spesifikasi
      }))
    });

    if (res.success && res.data) {
      setStatusBanner({ type: 'success', message: res.message });
      setIsAddModalOpen(false);
      reloadData();
      // Start batch registration queue for all items in the receipt
      const unregItems = getEffectiveSubItems(res.data).filter(it => (it.terdaftarCount || 0) < it.banyaknya);
      if (unregItems.length > 0) {
        openBatchRegistration(res.data, unregItems[0], unregItems, 0, unregItems.length);
      }
    } else if (!res.success) {
      setStatusBanner({ type: 'error', message: res.message });
    }
  };

  // Submit Batch Registration
  const handleSubmitBatchRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPenerimaan || !selectedSubItem) return;

    const sisa = Math.max(0, selectedSubItem.banyaknya - (selectedSubItem.terdaftarCount || 0));
    if (sisa <= 0) {
      setStatusBanner({ type: 'info', message: 'Semua unit barang ini sudah diregistrasi.' });
      setIsBatchRegModalOpen(false);
      return;
    }

    const snLines = batchRegForm.nomorSeri
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const subIndex = selectedPenerimaan.items?.findIndex(
      it => (it.idSubItem && it.idSubItem === selectedSubItem.idSubItem) || it.namaAset === selectedSubItem.namaAset
    );

    const res = AppDatabase.registerPenerimaanBatchUnits({
      idPenerimaan: selectedPenerimaan.idPenerimaan,
      subItemIndex: subIndex !== undefined && subIndex >= 0 ? subIndex : 0,
      namaAset: batchRegForm.namaAset,
      kategori: batchRegForm.kategori,
      jenisAset: batchRegForm.jenisAset,
      merekModel: batchRegForm.merekModel,
      serialNumbersList: snLines,
      spesifikasi: batchRegForm.spesifikasi,
      vendorSupplier: batchRegForm.vendorSupplier,
      hargaBeli: Number(batchRegForm.hargaBeli),
      lokasi: batchRegForm.lokasi,
      statusAwal: batchRegForm.statusAwal,
      pengguna: batchRegForm.statusAwal === 'Digunakan' ? batchRegForm.pengguna : undefined,
      bidangPengguna: batchRegForm.statusAwal === 'Digunakan' ? batchRegForm.bidangPengguna : undefined,
      tanggalPembelian: batchRegForm.tanggalPembelian,
      nomorPoInvoice: batchRegForm.nomorPoInvoice,
      masaGaransi: batchRegForm.masaGaransi,
      catatan: batchRegForm.catatan,
      count: sisa
    });

    if (res.success) {
      reloadData();
      // Check remaining unregistered items in the current receipt
      const updatedPenerimaan = AppDatabase.getBukuPenerimaan().find(p => p.idPenerimaan === selectedPenerimaan.idPenerimaan);
      const remainingUnreg = updatedPenerimaan
        ? getEffectiveSubItems(updatedPenerimaan).filter(it => (it.terdaftarCount || 0) < it.banyaknya)
        : [];

      if (remainingUnreg.length > 0 && updatedPenerimaan) {
        const nextItem = remainingUnreg[0];
        const nextIndex = queueCurrentIndex + 1;
        setStatusBanner({
          type: 'success',
          message: `Berhasil meregistrasi ${sisa} unit "${batchRegForm.namaAset}". Melanjutkan registrasi barang ke-${nextIndex + 1} dari ${totalQueueItems}: "${nextItem.namaAset}".`
        });
        openBatchRegistration(updatedPenerimaan, nextItem, remainingUnreg, nextIndex, totalQueueItems);
      } else {
        setStatusBanner({
          type: 'success',
          message: `Seluruh ${totalQueueItems} jenis barang dalam faktur ${selectedPenerimaan.nomorFaktur} berhasil diregistrasi ke sistem inventaris!`
        });
        setIsBatchRegModalOpen(false);
        if (res.registeredAssets && res.registeredAssets.length > 0) {
          setSelectedAssetForQR(res.registeredAssets[0]);
        }
      }
    } else {
      setStatusBanner({ type: 'error', message: res.message });
    }
  };

  // Open Detail Modal
  const handleOpenDetail = (item: BukuPenerimaanItem) => {
    setSelectedPenerimaan(item);
    setIsDetailModalOpen(true);
  };

  // Print Single BAST (konfirmasi penandatangan lebih dulu)
  const handlePrintBast = (item: BukuPenerimaanItem) => {
    setPendingPrint({ type: 'bast', item });
  };

  // Print Monthly Receipts (konfirmasi penandatangan lebih dulu)
  const handlePrintMonthly = () => {
    const listToPrint = filterMonth
      ? penerimaanList.filter(p => p.tanggalPenerimaan.startsWith(filterMonth))
      : penerimaanList;

    if (listToPrint.length === 0) {
      setStatusBanner({
        type: 'info',
        message: 'Tidak ada data penerimaan untuk bulan yang dipilih.'
      });
      return;
    }

    setPendingPrint({ type: 'monthly', list: listToPrint, period: filterMonth || 'Semua Periode' });
  };

  const handleConfirmSignatoryPrint = (values: ConfirmedSignatoryValues) => {
    if (!pendingPrint) return;
    if (pendingPrint.type === 'bast') {
      const { item } = pendingPrint;
      const doc = PdfReportService.generateBukuPenerimaanBastPdf(item, {
        title: `Berita Acara Serah Terima Penerimaan - ${item.nomorBeritaAcara}`,
        kepalaPusdatin: values.kepalaPusdatin,
        nipKepala: values.nipKepala,
        petugas: values.petugas
      });
      const safeNo = (item.nomorBeritaAcara || item.idPenerimaan).replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`BAST_Penerimaan_${safeNo}.pdf`);
    } else {
      const { list, period } = pendingPrint;
      const doc = PdfReportService.generateBukuPenerimaanMonthlyPdf(list, period, {
        title: 'Laporan Rekapitulasi Buku Penerimaan Aset TI UMC',
        kepalaPusdatin: values.kepalaPusdatin,
        nipKepala: values.nipKepala,
        petugas: values.petugas
      });
      const safePeriod = period.replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`Rekap_Buku_Penerimaan_${safePeriod}.pdf`);
    }
    setPendingPrint(null);
  };

  // Filtering
  const filtered = penerimaanList.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (p.namaAset?.toLowerCase() || '').includes(term) ||
      p.dari.toLowerCase().includes(term) ||
      p.nomorFaktur.toLowerCase().includes(term) ||
      p.nomorBeritaAcara.toLowerCase().includes(term) ||
      p.idPenerimaan.toLowerCase().includes(term) ||
      (p.items && p.items.some(it => it.namaAset.toLowerCase().includes(term)));

    const matchMonth = filterMonth ? p.tanggalPenerimaan.startsWith(filterMonth) : true;

    return matchSearch && matchMonth;
  });

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
            Faktur multi-item, berita acara serah terima (BAST), registrasi unit fisik otomatis, dan cetak laporan PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintMonthly}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-all"
            title="Cetak Rekap Buku Penerimaan Bulanan"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap Bulanan PDF</span>
          </button>

          {(activeUser.role === 'ACT-02' || activeUser.role === 'ACT-03') && (
            <button
              type="button"
              onClick={() => {
                setFormItems([
                  {
                    namaAset: '',
                    kategori: 'Komputer & Laptop',
                    banyaknya: 1,
                    hargaSatuan: 0,
                    merekModel: '',
                    spesifikasi: ''
                  }
                ]);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Buku Penerimaan</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Status Banner */}
      {statusBanner && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusBanner.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-current shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Tutup notifikasi"
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search input (handles Nomor Berita Acara, Faktur, Aset, Vendor) */}
        <div className="md:col-span-6 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            placeholder="Cari nomor berita acara, faktur, vendor, atau nama barang..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        {/* Filter Month */}
        <div className="md:col-span-3 bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
          <Calendar className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
            title="Filter Bulan Penerimaan"
          />
          {filterMonth && (
            <button
              type="button"
              onClick={() => setFilterMonth('')}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1.5"
            >
              Reset
            </button>
          )}
        </div>

        {/* Total stats pill */}
        <div className="md:col-span-3 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
          <span className="text-xs text-emerald-800 font-semibold">Total Dokumen:</span>
          <span className="text-base font-bold text-emerald-900 font-mono">{filtered.length} BAST</span>
        </div>
      </div>

      {/* Table Buku Penerimaan */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ID & Tanggal</th>
                <th className="py-3.5 px-4">No. Faktur & BAST</th>
                <th className="py-3.5 px-4">Pengirim / Vendor</th>
                <th className="py-3.5 px-4">Daftar Barang & Kuantitas</th>
                <th className="py-3.5 px-4">Total Nilai</th>
                <th className="py-3.5 px-4">Status Registrasi</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(item => {
                const effectiveItems = getEffectiveSubItems(item);
                const totalItemUnits = effectiveItems.reduce((s, it) => s + it.banyaknya, 0);
                const totalRegistered =
                  item.items && item.items.length > 0
                    ? item.items.reduce((s, it) => s + (it.terdaftarCount || 0), 0)
                    : (item.tercatatUnitCount || 0);
                const isFullyRegistered = totalRegistered >= totalItemUnits;

                return (
                  <tr key={item.idPenerimaan} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-emerald-700 text-xs">
                        {item.idPenerimaan}
                      </div>
                      <div className="text-[11px] text-slate-500 whitespace-nowrap mt-0.5">
                        {item.tanggalPenerimaan}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-xs text-slate-900">{item.nomorFaktur}</div>
                      <div className="text-[11px] font-mono text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 inline-block mt-0.5">
                        {item.nomorBeritaAcara}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-xs text-slate-800">{item.dari}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.items && item.items.length > 0 ? (
                        <div className="space-y-1">
                          {item.items.map((sub, idx) => (
                            <div key={sub.idSubItem || `${item.idPenerimaan}-item-${idx}`} className="text-xs flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-800 truncate max-w-[200px]" title={sub.namaAset}>
                                • {sub.namaAset}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-slate-600 shrink-0">
                                {sub.banyaknya} unit
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{item.namaAset || 'Perangkat Aset'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.banyaknya || 1} Unit</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-xs whitespace-nowrap">
                      Rp {(item.jumlahHarga || 0).toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isFullyRegistered
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {totalRegistered} / {totalItemUnits} Unit
                        </span>
                      </div>
                      {!isFullyRegistered && (
                        <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
                          Belum selesai diregistrasi
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="Lihat Detail Penerimaan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintBast(item)}
                          className="p-1.5 text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 rounded-lg cursor-pointer transition-colors"
                          title="Cetak Berita Acara (BAST) PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {!isFullyRegistered && (activeUser.role === 'ACT-02' || activeUser.role === 'ACT-03') && (
                          <button
                            type="button"
                            onClick={() => {
                              const effectiveItems = getEffectiveSubItems(item);
                              const unregItems = effectiveItems.filter(it => (it.terdaftarCount || 0) < it.banyaknya);
                              const targetItem = unregItems[0] || effectiveItems[0];
                              if (targetItem) {
                                openBatchRegistration(item, targetItem, unregItems, 0, unregItems.length || 1);
                              }
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>Registrasi</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    Belum ada data buku penerimaan yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Input Buku Penerimaan Multi-Item (Satu Faktur Berisi Beberapa Barang) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Input Buku Penerimaan Aset Multi-Barang</h3>
                <p className="text-xs text-slate-500">Satu faktur dapat memuat beberapa jenis barang / aset sekaligus</p>
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
              {/* Header Dokumen Penerimaan */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Informasi Faktur & Berita Acara
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Penerimaan</label>
                    <input
                      type="date"
                      required
                      value={formHeader.tanggalPenerimaan}
                      onChange={e => setFormHeader({ ...formHeader, tanggalPenerimaan: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dari (Vendor / Rekanan)</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: PT. Metrodata Electronics Tbk"
                      value={formHeader.dari}
                      onChange={e => setFormHeader({ ...formHeader, dari: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Faktur / Invoice</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: INV/2026/XI/109"
                      value={formHeader.nomorFaktur}
                      onChange={e => setFormHeader({ ...formHeader, nomorFaktur: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Faktur</label>
                    <input
                      type="date"
                      required
                      value={formHeader.tanggalFaktur}
                      onChange={e => setFormHeader({ ...formHeader, tanggalFaktur: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Berita Acara (BAST)</label>
                    <input
                      type="text"
                      placeholder="Contoh: BAST-PUSDATIN/2026/XI/055"
                      value={formHeader.nomorBeritaAcara}
                      onChange={e => setFormHeader({ ...formHeader, nomorBeritaAcara: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Berita Acara</label>
                    <input
                      type="date"
                      value={formHeader.tanggalBeritaAcara}
                      onChange={e => setFormHeader({ ...formHeader, tanggalBeritaAcara: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Sumber Dana</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pengadaan Fasilitas Lab TI Kampus 2 UMC Tahun 2026"
                    value={formHeader.keterangan}
                    onChange={e => setFormHeader({ ...formHeader, keterangan: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Items in Invoice */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Barang dalam Faktur ({formItems.length} Jenis Barang)
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Tambah Barang ke Faktur
                  </button>
                </div>

                {formItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        Barang #{idx + 1}
                      </span>
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-red-500 hover:text-red-700 p-1 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nama Barang / Aset</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Laptop ASUS ExpertBook B1 Core i7 16GB"
                          value={item.namaAset}
                          onChange={e => handleUpdateItemRow(idx, 'namaAset', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Kategori</label>
                        <select
                          value={item.kategori}
                          onChange={e => handleUpdateItemRow(idx, 'kategori', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Banyaknya (Unit)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.banyaknya}
                          onChange={e => handleUpdateItemRow(idx, 'banyaknya', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Harga Satuan (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          step="50000"
                          required
                          value={item.hargaSatuan}
                          onChange={e => handleUpdateItemRow(idx, 'hargaSatuan', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-emerald-800 mb-0.5">Subtotal Harga</label>
                        <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold font-mono text-emerald-800">
                          Rp {((Number(item.banyaknya) || 0) * (Number(item.hargaSatuan) || 0)).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total Bar */}
                <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-950">Grand Total Faktur:</span>
                    <span className="ml-2 font-mono text-emerald-800 font-bold">{grandTotalUnit} Total Unit</span>
                  </div>
                  <div className="font-mono text-sm font-extrabold text-emerald-900">
                    Rp {grandTotalHarga.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Simpan Faktur & Lanjut Registrasi Unit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Batch Unit Registration Modal (Disamakan persis dengan form edit data aset Lampiran 8) */}
      {isBatchRegModalOpen && selectedPenerimaan && selectedSubItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Barang {queueCurrentIndex + 1} dari {totalQueueItems}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {selectedPenerimaan.idPenerimaan}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Registrasi Data Aset PUSDATIN</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Faktur: <span className="font-mono font-bold text-slate-700">{selectedPenerimaan.nomorFaktur}</span> · Menerbitkan Kode Unik Aset & Barcode otomatis
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchRegModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBatchRegistration} className="space-y-4 mt-4 text-xs">
              {/* Header Info Banner */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Nama Barang di Faktur: <strong className="text-slate-900">{selectedSubItem.namaAset}</strong></span>
                  <span className="font-mono font-bold text-purple-800 text-xs">
                    {Math.max(0, selectedSubItem.banyaknya - (selectedSubItem.terdaftarCount || 0))} Unit Belum Teregistrasi
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Total dalam Faktur: {selectedSubItem.banyaknya} unit (Sudah teregistrasi: {selectedSubItem.terdaftarCount || 0} unit)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Nama Aset */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Aset / Perangkat <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchRegForm.namaAset}
                    onChange={e => setBatchRegForm({ ...batchRegForm, namaAset: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Aset <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={batchRegForm.kategori}
                    onChange={e => setBatchRegForm({ ...batchRegForm, kategori: e.target.value })}
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
                    value={batchRegForm.jenisAset}
                    onChange={e => setBatchRegForm({ ...batchRegForm, jenisAset: e.target.value as 'Fisik' | 'Non-Fisik' })}
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
                    value={batchRegForm.merekModel}
                    onChange={e => setBatchRegForm({ ...batchRegForm, merekModel: e.target.value })}
                    placeholder="Contoh: ASUS ExpertBook B1 / HP AIO"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                </div>

                {/* Nomor Seri */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Nomor Seri (Serial Number)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {Math.max(0, selectedSubItem.banyaknya - (selectedSubItem.terdaftarCount || 0)) > 1 ? '1 baris per unit' : '1 unit'}
                    </span>
                  </div>
                  <textarea
                    rows={Math.min(4, Math.max(2, Math.max(0, selectedSubItem.banyaknya - (selectedSubItem.terdaftarCount || 0))))}
                    value={batchRegForm.nomorSeri}
                    onChange={e => setBatchRegForm({ ...batchRegForm, nomorSeri: e.target.value })}
                    placeholder="Masukkan nomor seri unit..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>

                {/* Spesifikasi Teknis */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Spesifikasi Teknis
                  </label>
                  <textarea
                    rows={2}
                    value={batchRegForm.spesifikasi}
                    onChange={e => setBatchRegForm({ ...batchRegForm, spesifikasi: e.target.value })}
                    placeholder="Keterangan spesifikasi teknis barang..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                </div>

                {/* Status Operasional */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Operasional <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={batchRegForm.statusAwal}
                    onChange={e => setBatchRegForm({ ...batchRegForm, statusAwal: e.target.value as AssetStatus })}
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

                {/* Lokasi Penempatan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lokasi Penempatan <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="batch-reg-locations"
                    value={batchRegForm.lokasi}
                    onChange={e => setBatchRegForm({ ...batchRegForm, lokasi: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  />
                  <datalist id="batch-reg-locations">
                    {locations.map(loc => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                {/* Conditional Pengguna & Bidang Pengguna */}
                {batchRegForm.statusAwal === 'Digunakan' && (
                  <>
                    <div>
                      <label className="block font-bold text-blue-900 mb-1">
                        Nama Pengguna (User) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={batchRegForm.pengguna}
                        onChange={e => setBatchRegForm({ ...batchRegForm, pengguna: e.target.value })}
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
                        value={batchRegForm.bidangPengguna}
                        onChange={e => setBatchRegForm({ ...batchRegForm, bidangPengguna: e.target.value })}
                        className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-slate-900 font-semibold"
                      />
                    </div>
                  </>
                )}

                {/* Tanggal Pembelian */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Pembelian
                  </label>
                  <input
                    type="date"
                    value={batchRegForm.tanggalPembelian}
                    onChange={e => setBatchRegForm({ ...batchRegForm, tanggalPembelian: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                {/* Nomor PO / Invoice */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor PO / Invoice
                  </label>
                  <input
                    type="text"
                    value={batchRegForm.nomorPoInvoice}
                    onChange={e => setBatchRegForm({ ...batchRegForm, nomorPoInvoice: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>

                {/* Nama Vendor / Supplier */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Vendor / Supplier
                  </label>
                  <input
                    type="text"
                    value={batchRegForm.vendorSupplier}
                    onChange={e => setBatchRegForm({ ...batchRegForm, vendorSupplier: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                {/* Harga Beli */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Harga Beli (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={batchRegForm.hargaBeli}
                    onChange={e => setBatchRegForm({ ...batchRegForm, hargaBeli: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>

                {/* Masa Garansi */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Masa Garansi
                  </label>
                  <input
                    type="text"
                    value={batchRegForm.masaGaransi}
                    onChange={e => setBatchRegForm({ ...batchRegForm, masaGaransi: e.target.value })}
                    placeholder="Contoh: 2 Tahun Garansi Resmi ASUS"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                {/* Catatan Perubahan (Log Aktivitas) */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Perubahan (Log Aktivitas)
                  </label>
                  <textarea
                    rows={2}
                    value={batchRegForm.catatan}
                    onChange={e => setBatchRegForm({ ...batchRegForm, catatan: e.target.value })}
                    placeholder="Keterangan perubahan..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Security & Code Notification */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  Sistem akan menerbitkan <strong>{Math.max(0, selectedSubItem.banyaknya - (selectedSubItem.terdaftarCount || 0))} Kode Unik Aset (AST-UMC-...)</strong> dan Barcode secara otomatis untuk masing-masing unit fisik.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchRegModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  {totalQueueItems > 1 && queueCurrentIndex < totalQueueItems - 1
                    ? 'Batal / Selesai Nanti'
                    : 'Batal'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>
                    {totalQueueItems > 1 && queueCurrentIndex < totalQueueItems - 1
                      ? `Registrasi & Lanjut ke Barang Berikutnya (${queueCurrentIndex + 2}/${totalQueueItems})`
                      : 'Selesai & Registrasi Unit Ini'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Detail Penerimaan Modal */}
      {isDetailModalOpen && selectedPenerimaan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">
                  {selectedPenerimaan.idPenerimaan}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">
                  Detail Berita Acara Penerimaan (BAST)
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
              {/* Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Nomor Faktur:</span>
                  <strong className="text-slate-900">{selectedPenerimaan.nomorFaktur}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Nomor BAST:</span>
                  <strong className="text-cyan-800 font-mono">{selectedPenerimaan.nomorBeritaAcara}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Vendor / Rekanan:</span>
                  <strong className="text-slate-900">{selectedPenerimaan.dari}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Tanggal Terima:</span>
                  <strong className="text-slate-900">{selectedPenerimaan.tanggalPenerimaan}</strong>
                </div>
              </div>

              {/* Items List with Registration Action */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Daftar Barang dalam Faktur Ini:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Nama Barang</th>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3">Banyaknya</th>
                        <th className="py-2 px-3">Harga Satuan</th>
                        <th className="py-2 px-3">Subtotal</th>
                        <th className="py-2 px-3">Status Unit</th>
                        <th className="py-2 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPenerimaan.items && selectedPenerimaan.items.length > 0 ? (
                        selectedPenerimaan.items.map((sub, idx) => {
                          const isComplete = (sub.terdaftarCount || 0) >= sub.banyaknya;
                          return (
                            <tr key={sub.idSubItem || `detail-sub-${idx}`}>
                              <td className="py-2 px-3 font-semibold text-slate-900">{sub.namaAset}</td>
                              <td className="py-2 px-3 text-slate-600">{sub.kategori}</td>
                              <td className="py-2 px-3 font-mono font-bold">{sub.banyaknya} unit</td>
                              <td className="py-2 px-3 font-mono">Rp {sub.hargaSatuan.toLocaleString('id-ID')}</td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                                Rp {sub.jumlahHarga.toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {sub.terdaftarCount || 0}/{sub.banyaknya} Terdaftar
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                {!isComplete && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsDetailModalOpen(false);
                                      const unregItems = (selectedPenerimaan.items || []).filter(it => (it.terdaftarCount || 0) < it.banyaknya);
                                      const itemIdx = unregItems.findIndex(it => it.namaAset === sub.namaAset);
                                      const startIdx = itemIdx >= 0 ? itemIdx : 0;
                                      openBatchRegistration(selectedPenerimaan, sub, unregItems, startIdx, unregItems.length || 1);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Registrasi Unit
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        (() => {
                          const fallbackItems = getEffectiveSubItems(selectedPenerimaan);
                          const sub = fallbackItems[0];
                          const isComplete = (sub.terdaftarCount || 0) >= sub.banyaknya;
                          return (
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-900">{sub.namaAset}</td>
                              <td className="py-2 px-3 text-slate-600">{sub.kategori}</td>
                              <td className="py-2 px-3 font-mono font-bold">{sub.banyaknya} unit</td>
                              <td className="py-2 px-3 font-mono">Rp {sub.hargaSatuan.toLocaleString('id-ID')}</td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                                Rp {sub.jumlahHarga.toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {sub.terdaftarCount || 0}/{sub.banyaknya} Terdaftar
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                {!isComplete && (activeUser.role === 'ACT-02' || activeUser.role === 'ACT-03') ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsDetailModalOpen(false);
                                      openBatchRegistration(selectedPenerimaan, sub, [sub], 0, 1);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Registrasi Unit
                                  </button>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          );
                        })()
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Units Created from this receipt */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Unit Aset Terdaftar di Master Aset:</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {AppDatabase.getAssets()
                    .filter(a => a.idPenerimaanTerkait === selectedPenerimaan.idPenerimaan)
                    .map(unit => (
                      <div
                        key={unit.barcode}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{unit.nama}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Kode: <span className="text-emerald-700 font-bold">{unit.kodeUnikAset}</span> | SN: {unit.nomorSeri} | Lokasi: {unit.lokasi}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedAssetForQR(unit)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Barcode className="w-3 h-3 text-emerald-600" />
                          <span>Label Barcode</span>
                        </button>
                      </div>
                    ))}
                  {AppDatabase.getAssets().filter(a => a.idPenerimaanTerkait === selectedPenerimaan.idPenerimaan).length === 0 && (
                    <div className="text-slate-400 text-center py-4 bg-slate-50 rounded-lg">
                      Belum ada unit fisik yang didaftarkan dari faktur ini.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePrintBast(selectedPenerimaan)}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Surat BAST PDF</span>
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

      {/* MODAL 4: Barcode Preview */}
      {selectedAssetForQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-emerald-600" />
                Label Barcode Aset Resmi
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAssetForQR(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
              className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <SignatoryConfirmModal
        isOpen={Boolean(pendingPrint)}
        documentTitle={
          pendingPrint?.type === 'bast'
            ? `BAST Penerimaan: ${pendingPrint.item.nomorBeritaAcara}`
            : `Rekap Buku Penerimaan (${pendingPrint?.type === 'monthly' ? pendingPrint.period : ''})`
        }
        onClose={() => setPendingPrint(null)}
        onConfirm={handleConfirmSignatoryPrint}
      />
    </div>
  );
};

