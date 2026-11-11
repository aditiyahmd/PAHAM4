import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { PdfReportService } from '../../services/pdfReportService';
import { EmailNotificationService } from '../../services/emailService';
import { LoanTicket, LoanStatus, Asset } from '../../types';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ChevronRight,
  Barcode,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Plus,
  Mail,
  Bell,
  Package,
  X,
  FileCheck,
  Send,
  Building,
  User
} from 'lucide-react';

interface LoanManagementProps {
  onDataChanged: () => void;
}

export const LoanManagement: React.FC<LoanManagementProps> = ({ onDataChanged }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | LoanStatus | 'Terlambat'>('Semua');
  const [selectedTicket, setSelectedTicket] = useState<LoanTicket | null>(null);

  // Modal form states for processing existing loan
  const [modalAction, setModalAction] = useState<'terima' | 'tolak' | 'kembali'>('terima');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [namaBarangAuto, setNamaBarangAuto] = useState('');
  const [kondisi, setKondisi] = useState('Baik / Lengkap');
  const [petugas, setPetugas] = useState('Admin PUSDATIN UMC');
  const [catatan, setCatatan] = useState('');
  const [tglAmbilInput, setTglAmbilInput] = useState(new Date().toISOString().split('T')[0]);
  const [tglKembaliInput, setTglKembaliInput] = useState(new Date().toISOString().split('T')[0]);
  const [barcodeWarning, setBarcodeWarning] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Print Berita Acara modal state & dynamic Kepala PUSDATIN
  const [printingReceiptTicket, setPrintingReceiptTicket] = useState<LoanTicket | null>(null);
  const [receiptKepalaNama, setReceiptKepalaNama] = useState(() => AppDatabase.getKepalaPusdatin().nama);
  const [receiptKepalaNip, setReceiptKepalaNip] = useState(() => AppDatabase.getKepalaPusdatin().nip);
  const [receiptPetugas, setReceiptPetugas] = useState('Aditiya Ahmad Fadila');
  const [saveAsDefaultKepala, setSaveAsDefaultKepala] = useState(true);

  // Direct Walk-In Loan Modal states
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [directPeminjam, setDirectPeminjam] = useState('');
  const [directNik, setDirectNik] = useState('');
  const [directUnit, setDirectUnit] = useState('Biro Administrasi Akademik (BAA)');
  const [directKontak, setDirectKontak] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directBarcode, setDirectBarcode] = useState('');
  const [directBarangPinjaman, setDirectBarangPinjaman] = useState('');
  const [directJumlah, setDirectJumlah] = useState(1);
  const [directTglPinjam, setDirectTglPinjam] = useState(new Date().toISOString().split('T')[0]);
  const [directTglKembali, setDirectTglKembali] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [directTglAmbil, setDirectTglAmbil] = useState(new Date().toISOString().split('T')[0]);
  const [directPetugasName, setDirectPetugasName] = useState('Aditiya Ahmad Fadila');
  const [directKondisi, setDirectKondisi] = useState('Baik / Berfungsi Normal');
  const [directCatatan, setDirectCatatan] = useState('');
  const [directBarcodeWarning, setDirectBarcodeWarning] = useState<string | null>(null);

  const loans = AppDatabase.getLoans();
  const allAssets = AppDatabase.getAssets();
  const availableAssets = allAssets.filter(a => a.status === 'Tersedia');

  const todayStr = new Date().toISOString().split('T')[0];

  // Identifikasi peminjaman yang aktif dan belum dikembalikan melebihi tenggat (Overdue)
  const overdueLoans = loans.filter(l => l.status === 'Disetujui' && l.tglKembali < todayStr);

  const filteredLoans = loans.filter(l => {
    const matchesSearch =
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.peminjam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.barangPinjaman.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.barcode && l.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'Terlambat') {
      return matchesSearch && l.status === 'Disetujui' && l.tglKembali < todayStr;
    }
    const matchesStatus = statusFilter === 'Semua' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openProcessModal = (ticket: LoanTicket) => {
    setSelectedTicket(ticket);
    setModalAction(ticket.status === 'Disetujui' ? 'kembali' : 'terima');
    setBarcodeInput(ticket.barcode || '');
    setNamaBarangAuto(ticket.namaBarangT || '');
    setKondisi(ticket.kondisi || 'Baik / Berfungsi Normal');
    setPetugas(ticket.petugas || 'Admin PUSDATIN UMC');
    setCatatan(ticket.catatan || '');
    setTglAmbilInput(ticket.tglAmbil || ticket.tglPinjam || todayStr);
    setTglKembaliInput(ticket.tglDikembalikan || todayStr);
    setBarcodeWarning(null);
  };

  const handleBarcodeLookup = () => {
    if (!barcodeInput.trim()) return;
    const barcodes = barcodeInput.split(',').map(b => b.trim()).filter(Boolean);
    const names: string[] = [];
    let warningMsg = '';

    for (const bc of barcodes) {
      const asset = AppDatabase.getAssetByBarcode(bc);
      if (asset) {
        names.push(asset.nama);
        if (asset.status === 'Rusak' || asset.status === 'Diperbaiki') {
          warningMsg = `Aset "${asset.nama}" (Barcode: ${bc}) berstatus "${asset.status}". Barang rusak atau dalam perbaikan TIDAK BISA dipinjam!`;
        } else if (asset.status === 'Digunakan') {
          warningMsg = `Aset "${asset.nama}" (Barcode: ${bc}) sedang berstatus "Digunakan" di ${asset.lokasi}. Barang yang sedang digunakan TIDAK BISA dipinjam!`;
        } else if (asset.status === 'Dipinjam') {
          warningMsg = `Aset "${asset.nama}" (Barcode: ${bc}) saat ini sedang "Dipinjam" pihak lain!`;
        }
      }
    }

    setBarcodeWarning(warningMsg || null);
    if (names.length > 0) {
      setNamaBarangAuto(names.join(', '));
    } else {
      alert('Barcode tidak ditemukan dalam katalog aset.');
    }
  };

  const handleProcessSubmit = () => {
    if (!selectedTicket) return;

    if (modalAction === 'terima' && !barcodeInput.trim()) {
      alert('Harap alokasikan nomor barcode aset sebelum menyetujui peminjaman!');
      return;
    }

    setIsProcessing(true);

    const res = AppDatabase.processLoanTicket(selectedTicket.id, modalAction, {
      barcode: barcodeInput,
      namaBarang: namaBarangAuto || selectedTicket.barangPinjaman,
      kondisi,
      petugas,
      catatan,
      tglAmbil: tglAmbilInput,
      tglDikembalikan: tglKembaliInput
    });

    setTimeout(() => {
      setIsProcessing(false);
      if (!res.success) {
        alert(res.message);
        return;
      }
      setSelectedTicket(null);
      onDataChanged();
      alert(res.message);
    }, 250);
  };

  const openPrintReceiptModal = (ticket: LoanTicket) => {
    setPrintingReceiptTicket(ticket);
    const kepalaData = AppDatabase.getKepalaPusdatin();
    setReceiptKepalaNama(kepalaData.nama);
    setReceiptKepalaNip(kepalaData.nip);
    setReceiptPetugas(ticket.petugas || 'Aditiya Ahmad Fadila');
  };

  const handleExecutePrintReceipt = () => {
    if (!printingReceiptTicket) return;

    if (saveAsDefaultKepala && receiptKepalaNama.trim()) {
      AppDatabase.setKepalaPusdatin(receiptKepalaNama.trim(), receiptKepalaNip.trim());
    }

    const doc = PdfReportService.generateLoanReceiptPdf(printingReceiptTicket, {
      kepalaPusdatin: receiptKepalaNama.trim(),
      nipKepala: receiptKepalaNip.trim(),
      petugas: receiptPetugas.trim()
    });

    const isReturned = printingReceiptTicket.status === 'Dikembalikan';
    const fileName = isReturned
      ? `Berita_Acara_Pengembalian_${printingReceiptTicket.id}.pdf`
      : `Berita_Acara_Peminjaman_${printingReceiptTicket.id}.pdf`;

    doc.save(fileName);
    setPrintingReceiptTicket(null);
  };

  // Direct walk-in asset selection
  const handleDirectAssetSelect = (barcode: string) => {
    setDirectBarcode(barcode);
    const asset = AppDatabase.getAssetByBarcode(barcode);
    if (asset) {
      setDirectBarangPinjaman(asset.nama);
      if (asset.status !== 'Tersedia') {
        setDirectBarcodeWarning(`Perhatian: Status aset ini "${asset.status}". Hanya aset dengan status "Tersedia" yang dapat dipinjamkan!`);
      } else {
        setDirectBarcodeWarning(null);
      }
    }
  };

  const handleDirectLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPeminjam.trim() || !directNik.trim() || !directBarcode.trim() || !directBarangPinjaman.trim()) {
      alert('Harap lengkapi semua data wajib (Peminjam, NIDN/NIK/NIM, Barcode, Nama Barang)!');
      return;
    }

    if (directBarcodeWarning) {
      alert(directBarcodeWarning);
      return;
    }

    const res = AppDatabase.createDirectLoanByAdmin({
      peminjam: directPeminjam.trim(),
      nik: directNik.trim(),
      unit: directUnit,
      kontak: directKontak.trim() || '085964531388',
      email: directEmail.trim() || `${directNik.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@umc.ac.id`,
      barangPinjaman: directBarangPinjaman.trim(),
      jumlah: directJumlah,
      tglPinjam: directTglPinjam,
      tglKembali: directTglKembali,
      barcode: directBarcode.trim(),
      namaBarangT: directBarangPinjaman.trim(),
      kondisi: directKondisi,
      petugas: directPetugasName,
      catatan: directCatatan.trim() || 'Peminjaman langsung (walk-in) diinput oleh petugas PUSDATIN UMC',
      tglAmbil: directTglAmbil
    });

    if (!res.success) {
      alert(res.message);
      return;
    }

    alert(res.message);
    setShowDirectModal(false);
    onDataChanged();

    // Reset direct form
    setDirectPeminjam('');
    setDirectNik('');
    setDirectKontak('');
    setDirectEmail('');
    setDirectBarcode('');
    setDirectBarangPinjaman('');
    setDirectCatatan('');
    setDirectBarcodeWarning(null);

    // Offer to immediately print Berita Acara
    if (res.ticket) {
      openPrintReceiptModal(res.ticket);
    }
  };

  // Send single overdue reminder email
  const handleSendSingleReminder = async (loan: LoanTicket) => {
    try {
      await EmailNotificationService.sendOverdueReminder(loan);
      alert(`Peringatan resmi keterlambatan pengembalian berhasil dikirimkan ke email ${loan.email || loan.peminjam}!`);
      onDataChanged();
    } catch {
      alert('Gagal mengirim email pengingat.');
    }
  };

  // Send batch overdue reminders
  const handleSendAllOverdueReminders = async () => {
    if (overdueLoans.length === 0) return;
    const confirmSend = window.confirm(
      `Kirim notifikasi email peringatan pengembalian ke seluruh ${overdueLoans.length} peminjam yang terlambat?`
    );
    if (!confirmSend) return;

    for (const loan of overdueLoans) {
      await EmailNotificationService.sendOverdueReminder(loan);
    }

    alert(`Berhasil mengirimkan ${overdueLoans.length} surat peringatan keterlambatan pengembalian aset ke email peminjam!`);
    onDataChanged();
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Manajemen & Verifikasi Peminjaman Aset
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              {filteredLoans.length} Data
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Validasi pengajuan peminjaman sivitas, alokasikan barcode perangkat fisik, pantau pengembalian, dan terbitkan Berita Acara resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Input Peminjaman Langsung oleh Admin */}
          <button
            type="button"
            onClick={() => setShowDirectModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Input Peminjaman Langsung (Walk-In)</span>
          </button>
        </div>
      </div>

      {/* OVERDUE ALERT BANNER (Pemberitahuan Peminjaman Belum Dikembalikan) */}
      {overdueLoans.length > 0 && (
        <div className="bg-linear-to-r from-red-50 via-rose-50 to-amber-50 border border-red-200 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
                  <span>Pemberitahuan: {overdueLoans.length} Aset Terpinjam Belum Dikembalikan!</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full">
                    Lewat Tenggat
                  </span>
                </h3>
                <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                  Terdapat perangkat yang masa peminjamannya telah melewati batas waktu pengembalian dan belum diserahkan kembali ke Ruang PUSDATIN UMC.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setStatusFilter('Terlambat')}
                className="px-3 py-1.5 text-xs font-bold text-red-900 bg-white hover:bg-red-100 border border-red-300 rounded-lg transition-colors"
              >
                Lihat ({overdueLoans.length}) Terlambat
              </button>
              <button
                type="button"
                onClick={handleSendAllOverdueReminders}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Kirim Peringatan Email ke Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari ID tiket, peminjam, barcode, unit..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-lg border border-slate-200/80">
          {(['Semua', 'Menunggu', 'Disetujui', 'Dikembalikan', 'Ditolak'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st} {st !== 'Semua' && `(${loans.filter(l => l.status === st).length})`}
            </button>
          ))}

          {/* Tab Filter Khusus Terlambat */}
          <button
            type="button"
            onClick={() => setStatusFilter('Terlambat')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'Terlambat'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <span>Belum Kembali</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'Terlambat' ? 'bg-red-800 text-white' : 'bg-red-200 text-red-900'
            }`}>
              {overdueLoans.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Table View (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold">Tidak ada data peminjaman yang cocok.</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter status.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">ID Tiket</th>
                    <th className="px-4 py-3.5">Peminjam & Unit</th>
                    <th className="px-4 py-3.5">Barang Pinjaman</th>
                    <th className="px-4 py-3.5">Jadwal Pinjam</th>
                    <th className="px-4 py-3.5">Status Pengembalian</th>
                    <th className="px-4 py-3.5">Alokasi Barcode</th>
                    <th className="px-4 py-3.5 text-right">Aksi Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.map(loan => {
                    const isWaiting = loan.status === 'Menunggu';
                    const isApproved = loan.status === 'Disetujui';
                    const isReturned = loan.status === 'Dikembalikan';
                    const isOverdue = isApproved && loan.tglKembali < todayStr;
                    const isDueToday = isApproved && loan.tglKembali === todayStr;

                    return (
                      <tr
                        key={loan.id}
                        className={`transition-colors ${
                          isOverdue ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-4 py-3.5 font-mono font-bold text-red-700 whitespace-nowrap">
                          {loan.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{loan.peminjam}</p>
                          <p className="text-[11px] text-slate-500">{loan.unit} · {loan.kontak}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">{loan.barangPinjaman}</p>
                          <span className="text-[11px] text-slate-500">{loan.jumlah} Unit</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          <p>{loan.tglPinjam}</p>
                          <p className={`text-[11px] font-semibold ${isOverdue ? 'text-red-700' : 'text-slate-500'}`}>
                            s/d {loan.tglKembali}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isOverdue ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md bg-red-100 text-red-800 border border-red-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span>Belum Dikembalikan (Terlambat)</span>
                            </div>
                          ) : isDueToday ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Jatuh Tempo Hari Ini</span>
                            </div>
                          ) : isApproved ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                              Dipinjam (Aktif)
                            </span>
                          ) : isWaiting ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">
                              Menunggu Verifikasi
                            </span>
                          ) : isReturned ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800">
                              Selesai / Dikembalikan
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-100 text-red-800">
                              Ditolak
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700">
                          {loan.barcode ? (
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {loan.barcode}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Belum dialokasi</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                          {/* Send Reminder button if overdue */}
                          {isOverdue && (
                            <button
                              type="button"
                              onClick={() => handleSendSingleReminder(loan)}
                              className="inline-flex items-center gap-1 p-1.5 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                              title="Kirim Peringatan Email Keterlambatan"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openProcessModal(loan)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                          >
                            <span>Proses</span>
                          </button>

                          {(isApproved || isReturned) && (
                            <button
                              type="button"
                              onClick={() => openPrintReceiptModal(loan)}
                              className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                              title="Cetak Berita Acara PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredLoans.map(loan => {
                const isApproved = loan.status === 'Disetujui';
                const isOverdue = isApproved && loan.tglKembali < todayStr;

                return (
                  <div
                    key={loan.id}
                    className={`p-4 space-y-3 ${isOverdue ? 'bg-red-50/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-sm text-red-700 block">
                          {loan.id}
                        </span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{loan.peminjam}</p>
                        <p className="text-xs text-slate-500">{loan.unit}</p>
                      </div>

                      {isOverdue ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-800 border border-red-300">
                          ⚠️ Terlambat
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                          loan.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' :
                          loan.status === 'Menunggu' ? 'bg-amber-100 text-amber-800' :
                          loan.status === 'Dikembalikan' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {loan.status}
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1 text-slate-600">
                      <p><strong>Barang:</strong> {loan.barangPinjaman} ({loan.jumlah} Unit)</p>
                      <p><strong>Jadwal:</strong> {loan.tglPinjam} s/d <span className={isOverdue ? 'text-red-700 font-bold' : ''}>{loan.tglKembali}</span></p>
                      {loan.barcode && <p className="font-mono"><strong>Barcode:</strong> {loan.barcode}</p>}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">{loan.kontak}</span>
                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <button
                            type="button"
                            onClick={() => handleSendSingleReminder(loan)}
                            className="p-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg"
                            title="Kirim Email Peringatan"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(loan.status === 'Disetujui' || loan.status === 'Dikembalikan') && (
                          <button
                            type="button"
                            onClick={() => openPrintReceiptModal(loan)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg"
                          >
                            PDF
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openProcessModal(loan)}
                          className="px-4 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                        >
                          Proses Tiket
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MODAL INPUT PEMINJAMAN LANGSUNG (WALK-IN) OLEH ADMIN */}
      {showDirectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Input Peminjaman Aset Langsung (Walk-In)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Petugas melayani peminjaman langsung di Ruang PUSDATIN UMC
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectLoanSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Section 1: Data Peminjam */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Identitas Peminjam</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Nama Lengkap Peminjam <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directPeminjam}
                      onChange={e => setDirectPeminjam(e.target.value)}
                      placeholder="Contoh: Hilyah Aulia, S.Kom."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      NIDN / NIK / NIM <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directNik}
                      onChange={e => {
                        setDirectNik(e.target.value);
                        if (!directEmail) {
                          setDirectEmail(`${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}@umc.ac.id`);
                        }
                      }}
                      placeholder="Contoh: 6565656"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Unit Kerja / Program Studi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={directUnit}
                      onChange={e => setDirectUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                    >
                      <option value="Biro Administrasi Umum (BAU)">Biro Administrasi Umum (BAU)</option>
                      <option value="Biro Administrasi Akademik (BAA)">Biro Administrasi Akademik (BAA)</option>
                      <option value="Fakultas Teknik (FT)">Fakultas Teknik (FT)</option>
                      <option value="Fakultas Ekonomi (FE)">Fakultas Ekonomi (FE)</option>
                      <option value="Fakultas Keguruan dan Ilmu Pendidikan (FKIP)">FKIP</option>
                      <option value="Fakultas Ilmu Kesehatan (FIKES)">FIKES</option>
                      <option value="Lembaga Penelitian dan Pengabdian (LPPM)">LPPM</option>
                      <option value="Perpustakaan Pusat UMC">Perpustakaan Pusat UMC</option>
                      <option value="Pimpinan Universitas / Rektorat">Pimpinan Universitas / Rektorat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      No. WhatsApp / HP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directKontak}
                      onChange={e => setDirectKontak(e.target.value)}
                      placeholder="Contoh: 085964531388"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Email Institusi (Untuk Notifikasi Berita Acara Otomatis)
                    </label>
                    <input
                      type="email"
                      value={directEmail}
                      onChange={e => setDirectEmail(e.target.value)}
                      placeholder="Contoh: peminjam@umc.ac.id"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pemilihan Aset & Alokasi Barcode */}
              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>2. Alokasi Perangkat Aset PUSDATIN</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Pilih Langsung dari Aset yang Berstatus "Tersedia":
                    </label>
                    <select
                      value={directBarcode}
                      onChange={e => handleDirectAssetSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    >
                      <option value="">-- Pilih Aset yang Siap Dipinjam --</option>
                      {availableAssets.map(a => (
                        <option key={a.barcode} value={a.barcode}>
                          [{a.barcode}] {a.nama} ({a.lokasi}) - {a.kategori}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Nomor Barcode Fisik <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={directBarcode}
                          onChange={e => handleDirectAssetSelect(e.target.value)}
                          placeholder="Scan atau ketik nomor barcode..."
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Nama Barang / Spesifikasi Resmi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={directBarangPinjaman}
                        onChange={e => setDirectBarangPinjaman(e.target.value)}
                        placeholder="Contoh: Laptop ASUS ExpertBook B1 Core i7"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                      />
                    </div>
                  </div>

                  {directBarcodeWarning && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{directBarcodeWarning}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Waktu, Kondisi, dan Petugas */}
              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>3. Jadwal & Penyerahan Fisik</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Tanggal Pinjam <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={directTglPinjam}
                      onChange={e => setDirectTglPinjam(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Waktu Pengambilan Barang <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={directTglAmbil}
                      onChange={e => setDirectTglAmbil(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Batas Waktu Pengembalian <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={directTglKembali}
                      onChange={e => setDirectTglKembali(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-red-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Petugas PUSDATIN Penyerah
                    </label>
                    <input
                      type="text"
                      value={directPetugasName}
                      onChange={e => setDirectPetugasName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Kondisi Saat Diserahkan
                    </label>
                    <input
                      type="text"
                      value={directKondisi}
                      onChange={e => setDirectKondisi(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Jumlah Unit
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={directJumlah}
                      onChange={e => setDirectJumlah(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Catatan / Keperluan Peminjaman
                    </label>
                    <input
                      type="text"
                      value={directCatatan}
                      onChange={e => setDirectCatatan(e.target.value)}
                      placeholder="Contoh: Kebutuhan rapat senat akademik dan presentasi prodi"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 leading-relaxed">
                💡 <strong>Alur Otomatis:</strong> Setelah disimpan, tiket langsung berstatus <strong>Disetujui</strong>, status aset otomatis berubah menjadi <strong>Dipinjam</strong>, dan Anda akan langsung diarahkan untuk mencetak Berita Acara Peminjaman resmi.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDirectModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(directBarcodeWarning)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Peminjaman & Cetak Berita Acara</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROSES TIKET PEMINJAMAN DARI USER */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-mono font-bold text-sm text-red-700 block">
                  {selectedTicket.id}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Tindakan & Validasi Peminjaman Aset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Ringkasan Pengajuan */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Peminjam:</span>
                  <span className="font-bold text-slate-900">{selectedTicket.peminjam} ({selectedTicket.nik})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit / Prodi:</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Barang Diajukan:</span>
                  <span className="font-bold text-slate-900">{selectedTicket.barangPinjaman} ({selectedTicket.jumlah} Unit)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rencana Pinjam:</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.tglPinjam} s/d {selectedTicket.tglKembali}</span>
                </div>
              </div>

              {/* Action Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Pilih Tindakan Petugas:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAction('terima')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                      modalAction === 'terima'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Setujui Pinjaman
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAction('kembali')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                      modalAction === 'kembali'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ↩ Terima Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAction('tolak')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                      modalAction === 'tolak'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Tolak
                  </button>
                </div>
              </div>

              {/* Fields saat Setujui Pinjaman */}
              {modalAction === 'terima' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alokasi Nomor Barcode Aset Kampus <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={barcodeInput}
                        onChange={e => setBarcodeInput(e.target.value)}
                        placeholder="Contoh: 20495812 (atau pisahkan koma)"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                      />
                      <button
                        type="button"
                        onClick={handleBarcodeLookup}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                      >
                        Cek Aset
                      </button>
                    </div>
                  </div>

                  {barcodeWarning && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{barcodeWarning}</span>
                    </div>
                  )}

                  {namaBarangAuto && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Barang Teridentifikasi:
                      </label>
                      <input
                        type="text"
                        value={namaBarangAuto}
                        onChange={e => setNamaBarangAuto(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tanggal Pengambilan Barang <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={tglAmbilInput}
                        onChange={e => setTglAmbilInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                      <span className="text-[10px] text-slate-500">Kapan sivitas dapat mengambil barang</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kondisi Saat Penyerahan
                      </label>
                      <input
                        type="text"
                        value={kondisi}
                        onChange={e => setKondisi(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Petugas PUSDATIN Penyerah
                    </label>
                    <input
                      type="text"
                      value={petugas}
                      onChange={e => setPetugas(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Fields saat Terima Kembali */}
              {modalAction === 'kembali' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                    ℹ️ Mengembalikan aset <strong>{selectedTicket.barcode || 'Barang Pinjaman'}</strong> ke status <strong>Tersedia</strong> dalam inventaris.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Pengembalian Aktual (Tiket Ditutup) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={tglKembaliInput}
                      onChange={e => setTglKembaliInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kondisi Saat Dikembalikan
                    </label>
                    <input
                      type="text"
                      value={kondisi}
                      onChange={e => setKondisi(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Fields Catatan / Alasan Tolak */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {modalAction === 'tolak' ? 'Alasan Penolakan (Wajib dikirim ke peminjam)' : 'Catatan Khusus Admin'}
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder={modalAction === 'tolak' ? 'Tuliskan alasan penolakan...' : 'Catatan opsional...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing || Boolean(barcodeWarning && modalAction === 'terima')}
                onClick={handleProcessSubmit}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Menyimpan...' : 'Simpan & Kirim Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK BERITA ACARA RESMI */}
      {printingReceiptTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cetak Berita Acara Resmi PUSDATIN
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID Tiket: <strong className="font-mono text-red-700">{printingReceiptTicket.id}</strong> ({printingReceiptTicket.status === 'Dikembalikan' ? 'Pengembalian' : 'Peminjaman'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrintingReceiptTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Kepala PUSDATIN UMC:
                </label>
                <input
                  type="text"
                  value={receiptKepalaNama}
                  onChange={e => setReceiptKepalaNama(e.target.value)}
                  placeholder="Nama Kepala PUSDATIN..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  NIP / NIDN Kepala PUSDATIN (Opsional):
                </label>
                <input
                  type="text"
                  value={receiptKepalaNip}
                  onChange={e => setReceiptKepalaNip(e.target.value)}
                  placeholder="Contoh: NIP. 19800512 200501 1 002"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Petugas PUSDATIN Penyerah:
                </label>
                <input
                  type="text"
                  value={receiptPetugas}
                  onChange={e => setReceiptPetugas(e.target.value)}
                  placeholder="Nama Petugas Penyerah..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveAsDefaultKepala}
                  onChange={e => setSaveAsDefaultKepala(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span className="text-xs text-slate-600">
                  Simpan sebagai nama Kepala PUSDATIN default untuk cetakan selanjutnya
                </span>
              </label>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 leading-relaxed">
                ℹ️ Format Kop Surat dan stempel universitas resmi telah disesuaikan dengan standar UMC, dan seluruh nama penandatangan dicetak rapi <strong>dalam kurung</strong>: <code>( Nama Lengkap )</code>.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPrintingReceiptTicket(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePrintReceipt}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Unduh & Cetak PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
