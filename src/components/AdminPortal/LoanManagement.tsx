import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { PdfReportService } from '../../services/pdfReportService';
import { EmailNotificationService } from '../../services/emailService';
import { WhatsAppNotificationService } from '../../services/whatsappService';
import { LoanTicket, LoanStatus, Asset, LoanHandoverMethod } from '../../types';
import { BarcodeScannerModal } from '../Modals/BarcodeScannerModal';
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
  User,
  MessageCircle,
  ArrowRightLeft,
  Layers,
  Camera,
  Download,
  MapPin
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

  // Enhancement B.1a: Metode Penyerahan & Waktu Pengambilan
  const [metodePengambilan, setMetodePengambilan] = useState<LoanHandoverMethod>('Diambil di Ruang PUSDATIN');
  const [jadwalPengambilan, setJadwalPengambilan] = useState('Hari ini pukul 14:00 WIB');
  const [lokasiPengambilan, setLokasiPengambilan] = useState('Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)');

  // Scanner modal triggers (Enhancement B.3)
  const [showScannerForApproval, setShowScannerForApproval] = useState(false);
  const [showScannerForDirect, setShowScannerForDirect] = useState(false);

  // Alternate asset allocation state for case study conflict resolution
  const [isAlternateAllocation, setIsAlternateAllocation] = useState(false);
  const [selectedAlternateBarcode, setSelectedAlternateBarcode] = useState('');

  // Post-action dispatch modal (WhatsApp & Email confirmation)
  const [completedActionModal, setCompletedActionModal] = useState<{
    ticket: LoanTicket;
    action: 'terima' | 'kembali' | 'tolak';
    waUrl: string | null;
    emailSent: boolean;
    message: string;
  } | null>(null);

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

  const getDaysLate = (tglKembali: string) => {
    const diff = Math.max(0, new Date(todayStr).getTime() - new Date(tglKembali).getTime());
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // SMART CONFLICT DETECTOR: Mendeteksi pengajuan peminjaman bersamaan untuk aset yang sama (Case Study B.2b)
  const pendingLoans = loans.filter(l => l.status === 'Menunggu');
  const conflictMap: Record<string, LoanTicket[]> = {};
  pendingLoans.forEach(l => {
    const key = l.barangPinjaman.toLowerCase().trim();
    if (!conflictMap[key]) conflictMap[key] = [];
    conflictMap[key].push(l);
  });
  const conflictGroups = Object.entries(conflictMap).filter(([_, list]) => list.length > 1);

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

  const openProcessModal = (ticket: LoanTicket, defaultAction?: 'terima' | 'kembali' | 'tolak', preselectedBarcode?: string) => {
    setSelectedTicket(ticket);
    const initialAction = defaultAction || (ticket.status === 'Disetujui' ? 'kembali' : 'terima');
    setModalAction(initialAction);
    setBarcodeInput(preselectedBarcode || ticket.barcode || '');
    setNamaBarangAuto(ticket.namaBarangT || '');
    setKondisi(ticket.kondisi || 'Baik / Berfungsi Normal');
    setPetugas(ticket.petugas || 'Admin PUSDATIN UMC');
    setCatatan(ticket.catatan || '');
    setTglAmbilInput(ticket.tglAmbil || ticket.tglPinjam || todayStr);
    setTglKembaliInput(ticket.tglDikembalikan || todayStr);
    setBarcodeWarning(null);
    setIsAlternateAllocation(false);
    setSelectedAlternateBarcode(preselectedBarcode || '');

    // Initialize handover details (Enhancement B.1a)
    setMetodePengambilan(ticket.metodePengambilan || 'Diambil di Ruang PUSDATIN');
    setJadwalPengambilan(ticket.jadwalPengambilan || `${ticket.tglPinjam} pukul 09:00 WIB`);
    setLokasiPengambilan(
      ticket.lokasiPengambilan ||
      'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon)'
    );

    if (preselectedBarcode) {
      const asset = availableAssets.find(a => a.barcode === preselectedBarcode);
      if (asset) {
        setNamaBarangAuto(asset.nama);
        if (asset.nama.toLowerCase() !== ticket.barangPinjaman.toLowerCase()) {
          setIsAlternateAllocation(true);
        }
      }
    }
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

    const finalBarcode = barcodeInput.trim();
    const finalNamaBarang = namaBarangAuto || selectedTicket.barangPinjaman;
    const finalCatatan = isAlternateAllocation
      ? `${catatan ? catatan + ' · ' : ''}Dialihkan ke unit pengganti setara: ${finalNamaBarang}`
      : catatan;

    const res = AppDatabase.processLoanTicket(selectedTicket.id, modalAction, {
      barcode: finalBarcode,
      namaBarang: finalNamaBarang,
      kondisi,
      petugas,
      catatan: finalCatatan,
      tglAmbil: tglAmbilInput,
      tglDikembalikan: tglKembaliInput,
      metodePengambilan,
      jadwalPengambilan,
      lokasiPengambilan
    });

    setTimeout(() => {
      setIsProcessing(false);
      if (!res.success) {
        alert(res.message);
        return;
      }

      const updatedTicket: LoanTicket = {
        ...selectedTicket,
        status: modalAction === 'terima' ? 'Disetujui' : modalAction === 'kembali' ? 'Dikembalikan' : 'Ditolak',
        barcode: finalBarcode,
        namaBarangT: finalNamaBarang,
        kondisi,
        petugas,
        catatan: finalCatatan,
        tglAmbil: tglAmbilInput,
        tglDikembalikan: tglKembaliInput,
        metodePengambilan,
        jadwalPengambilan,
        lokasiPengambilan
      };

      let waUrl: string | null = null;
      if (modalAction === 'terima') {
        if (isAlternateAllocation) {
          waUrl = WhatsAppNotificationService.getAlternateAssignedUrl(updatedTicket, selectedTicket.barangPinjaman, finalNamaBarang);
        } else {
          waUrl = WhatsAppNotificationService.getLoanApprovedUrl(updatedTicket);
        }
      } else if (modalAction === 'kembali') {
        waUrl = WhatsAppNotificationService.getLoanReturnedUrl(updatedTicket);
      } else if (modalAction === 'tolak') {
        waUrl = WhatsAppNotificationService.getLoanRejectedUrl(selectedTicket, catatan || 'Ketersediaan stok tidak mencukupi');
      }

      setSelectedTicket(null);
      setIsAlternateAllocation(false);
      setSelectedAlternateBarcode('');
      onDataChanged();

      // Tampilkan popup konfirmasi aksi WhatsApp & Berita Acara
      setCompletedActionModal({
        ticket: updatedTicket,
        action: modalAction,
        waUrl,
        emailSent: true,
        message: res.message
      });
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

  // Enhancement B.10: Ekspor data tiket peminjaman ke format Excel (CSV)
  const exportToExcelCsv = () => {
    const headers = [
      'ID Tiket',
      'Peminjam',
      'NIK/NIM',
      'Unit/Fakultas',
      'Kontak WhatsApp',
      'Email Institusi',
      'Barang Pinjaman',
      'Jumlah Unit',
      'Tgl Pinjam',
      'Tgl Kembali',
      'Status Peminjaman',
      'Barcode Aset',
      'Metode Penyerahan',
      'Jadwal Pengambilan',
      'Lokasi Penyerahan',
      'Petugas PUSDATIN'
    ];
    const rows = filteredLoans.map(l => [
      l.id,
      `"${(l.peminjam || '').replace(/"/g, '""')}"`,
      `"${l.nik || ''}"`,
      `"${(l.unit || '').replace(/"/g, '""')}"`,
      `"${l.kontak || ''}"`,
      `"${l.email || ''}"`,
      `"${(l.namaBarangT || l.barangPinjaman || '').replace(/"/g, '""')}"`,
      l.jumlah,
      l.tglPinjam,
      l.tglKembali,
      l.status,
      `"${l.barcode || ''}"`,
      `"${l.metodePengambilan || 'Diambil di Ruang PUSDATIN'}"`,
      `"${l.jadwalPengambilan || ''}"`,
      `"${(l.lokasiPengambilan || '').replace(/"/g, '""')}"`,
      `"${l.petugas || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Peminjaman_Aset_PAHAM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          {/* Export CSV / Excel Button (Enhancement B.10) */}
          <button
            type="button"
            onClick={exportToExcelCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors shrink-0"
            title="Download seluruh data peminjaman dalam format Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor Excel (CSV)</span>
          </button>

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

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
              {/* WhatsApp Pengingat Langsung */}
              <a
                href={WhatsAppNotificationService.getOverdueReminderUrl(overdueLoans[0], getDaysLate(overdueLoans[0].tglKembali)) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-xs transition-colors"
                title={`Kirim pesan WhatsApp pengingat keterlambatan ke ${overdueLoans[0].peminjam}`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                <span>WhatsApp Pengingat ({overdueLoans[0].peminjam.split(' ')[0]})</span>
              </a>

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
                <span>Kirim Email ke Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART CONFLICT DETECTOR (Case Study B.2b: Solusi Perebutan / Permintaan Bersamaan) */}
      {conflictGroups.length > 0 && (
        <div className="bg-linear-to-r from-amber-50 via-orange-50 to-indigo-50 border-2 border-amber-300 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-950">
                    Smart Conflict Detector: Terdeteksi {conflictGroups.length} Perebutan / Permintaan Aset Bersamaan!
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded-full border border-amber-300">
                    Solusi Cepat Admin
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Terdapat lebih dari satu sivitas yang mengajukan permohonan pinjam untuk tipe perangkat yang sama di waktu berdekatan. Sistem PAHAM menyediakan pembagian prioritas berbasis FIFO (waktu pengajuan) dan pengalihan ke unit alternatif yang setara.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {conflictGroups.map(([itemKey, ticketList]) => {
              // Cari alternatif aset yang setara di katalog
              const substituteAssets = availableAssets.filter(
                a => a.kategori === 'Komputer & Laptop' || a.nama.toLowerCase().includes('laptop') || a.nama.toLowerCase().includes('dell') || a.nama.toLowerCase().includes('lenovo') || a.nama.toLowerCase().includes('asus')
              );

              return (
                <div key={itemKey} className="bg-white rounded-xl border border-amber-200 p-4 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                        Perangkat Diperebutkan:
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {ticketList[0].barangPinjaman}
                      </h4>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg">
                      {ticketList.length} Pengajuan Menunggu Konfirmasi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ticketList.map((t, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div
                          key={t.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                            isFirst
                              ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500/10'
                              : 'bg-indigo-50/40 border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isFirst ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                            }`}>
                              {isFirst ? '★ Prioritas 1 (Diajukan Lebih Awal - FIFO)' : `Antrean #${idx + 1}`}
                            </span>
                            <span className="font-mono text-slate-500 text-[10px]">{t.tglAju || t.tglPinjam}</span>
                          </div>

                          <div>
                            <p className="font-bold text-slate-900 text-sm">{t.peminjam}</p>
                            <p className="text-slate-500 text-[11px]">{t.unit} · NIK/NIDN: {t.nik}</p>
                            <p className="text-slate-600 text-[11px] mt-1 bg-white/70 p-1.5 rounded border border-slate-200/60">
                              <strong>Keperluan:</strong> {t.catatan || 'Tidak ada catatan'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                            {isFirst ? (
                              <button
                                type="button"
                                onClick={() => openProcessModal(t, 'terima', '30192848')}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Setujui Unit Utama ({t.barangPinjaman.split(' ')[0]} Asus)</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openProcessModal(t, 'terima', substituteAssets[0]?.barcode || '')}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg shadow-xs transition-colors"
                                  title="Alihkan peminjam ini ke unit laptop pengganti yang setara"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                  <span>Alihkan ke Unit Pengganti</span>
                                </button>
                                <a
                                  href={WhatsAppNotificationService.getAlternateAssignedUrl(t, t.barangPinjaman, substituteAssets[0]?.nama || 'Laptop Pengganti PUSDATIN') || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors"
                                  title="Kirim pesan WhatsApp konfirmasi pengalihan unit atau penjadwalan ulang"
                                >
                                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                    <span>
                      💡 <strong>Rekomendasi PUSDATIN:</strong> Berikan unit utama kepada peminjam yang mengajukan lebih awal/urgensi akademik tinggi, dan alihkan pengaju berikutnya ke stok pengganti setara (tersedia {substituteAssets.length} unit alternatif).
                    </span>
                  </div>
                </div>
              );
            })}
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
                              <span>Belum Dikembalikan ({getDaysLate(loan.tglKembali)} Hari)</span>
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
                          {/* Send WhatsApp & Email Reminder if overdue */}
                          {isOverdue && (
                            <>
                              <a
                                href={WhatsAppNotificationService.getOverdueReminderUrl(loan, getDaysLate(loan.tglKembali)) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                                title="Kirim Peringatan Keterlambatan via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleSendSingleReminder(loan)}
                                className="inline-flex items-center gap-1 p-1.5 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                                title="Kirim Peringatan Email Keterlambatan"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>
                            </>
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
                          ⚠️ Terlambat ({getDaysLate(loan.tglKembali)} Hari)
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
                          <>
                            <a
                              href={WhatsAppNotificationService.getOverdueReminderUrl(loan, getDaysLate(loan.tglKembali)) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg inline-flex items-center gap-1"
                              title="Kirim Peringatan WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WA</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleSendSingleReminder(loan)}
                              className="p-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg"
                              title="Kirim Email Peringatan"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          </>
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
                      <div className="flex gap-2">
                        <div className="relative flex-1">
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
                        <button
                          type="button"
                          onClick={() => setShowScannerForDirect(true)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors font-bold text-xs"
                          title="Foto / Scan Barcode Kamera"
                        >
                          <Camera className="w-4 h-4" />
                          <span className="hidden sm:inline">Foto</span>
                        </button>
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
                  {/* Pilihan Cepat dari Stok Tersedia (Termasuk Solusi Unit Alternatif) */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Pilih dari Stok Fisik Tersedia (Termasuk Unit Alternatif):</span>
                      </label>
                      {isAlternateAllocation && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                          Unit Pengganti Aktif
                        </span>
                      )}
                    </div>
                    <select
                      value={selectedAlternateBarcode}
                      onChange={e => {
                        const bc = e.target.value;
                        setSelectedAlternateBarcode(bc);
                        if (!bc) return;
                        const asset = availableAssets.find(a => a.barcode === bc);
                        if (asset) {
                          setBarcodeInput(asset.barcode);
                          setNamaBarangAuto(asset.nama);
                          setBarcodeWarning(null);
                          if (asset.nama.toLowerCase() !== selectedTicket.barangPinjaman.toLowerCase()) {
                            setIsAlternateAllocation(true);
                          } else {
                            setIsAlternateAllocation(false);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- Pilih Unit dari Stok Fisik Tersedia ({availableAssets.length} Unit) --</option>
                      {availableAssets.map(a => (
                        <option key={a.barcode} value={a.barcode}>
                          {a.nama} ({a.kategori}) — Barcode: {a.barcode} [{a.lokasi}]
                        </option>
                      ))}
                    </select>

                    {isAlternateAllocation && (
                      <p className="text-[11px] text-indigo-800 bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                        💡 <strong>Mode Pengalihan Unit:</strong> Pengajuan awal meminta <em>&quot;{selectedTicket.barangPinjaman}&quot;</em>. Anda mengalihkan ke unit setara <em>&quot;{namaBarangAuto}&quot;</em>. Sistem akan menyiapkan notifikasi WhatsApp dan email khusus pengalihan perangkat.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Barcode Aset Terpilih <span className="text-red-500">*</span>
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
                        onClick={() => setShowScannerForApproval(true)}
                        className="px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Foto / Scan Barcode Kamera"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Foto</span>
                      </button>
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

                  {/* B.1a: Solusi Pengambilan / Penyerahan Aset */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                      <span>Mekanisme & Jadwal Penyerahan Aset ke Peminjam</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Metode Penyerahan:
                        </label>
                        <select
                          value={metodePengambilan}
                          onChange={e => {
                            const val = e.target.value as LoanHandoverMethod;
                            setMetodePengambilan(val);
                            if (val === 'Diambil di Ruang PUSDATIN') {
                              setLokasiPengambilan('Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 UMC)');
                            } else {
                              setLokasiPengambilan(`Ruangan Unit ${selectedTicket.unit} (Diantar oleh Tim Teknis PUSDATIN)`);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="Diambil di Ruang PUSDATIN">🏢 Diambil di Ruang PUSDATIN</option>
                          <option value="Diserahkan oleh Tim Teknis ke Lokasi Peminjam">🚚 Diserahkan oleh Tim Teknis (Antar ke Lokasi)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Kapan Aset Bisa Diambil / Diterima:
                        </label>
                        <input
                          type="text"
                          value={jadwalPengambilan}
                          onChange={e => setJadwalPengambilan(e.target.value)}
                          placeholder="Misal: Hari ini pukul 14:00 WIB"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Lokasi Pengambilan / Posko Penyerahan:
                      </label>
                      <input
                        type="text"
                        value={lokasiPengambilan}
                        onChange={e => setLokasiPengambilan(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fields saat Terima Kembali (Clearance Workflow) */}
              {modalAction === 'kembali' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-700" />
                      <span>Standar Operasional Pengembalian Aset (Clearance PUSDATIN)</span>
                    </p>
                    <p className="text-blue-800 text-[11px] leading-relaxed">
                      Perangkat <strong>{selectedTicket.namaBarangT || selectedTicket.barangPinjaman}</strong> (Barcode: <strong>{selectedTicket.barcode}</strong>) akan dipulihkan statusnya menjadi <strong>Tersedia</strong> dan disimpan di <strong>Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)</strong>.
                    </p>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Hasil Pemeriksaan Fisik & Fungsi Saat Serah Terima:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setKondisi('Baik, Lengkap & Berfungsi Normal')}
                        className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                          kondisi.includes('Baik')
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block font-bold">✓ Baik & Lengkap</span>
                        <span className="text-[10px] text-slate-500 font-normal">Kabel, adaptor & fisik utuh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setKondisi('Ada Catatan Kendala / Kerusakan Fisik')}
                        className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                          kondisi.includes('Kerusakan') || kondisi.includes('Kendala')
                            ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block font-bold">⚠️ Ada Kendala Fisik</span>
                        <span className="text-[10px] text-slate-500 font-normal">Perlu servis teknisi</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rincian Kondisi / Catatan Pemeriksaan
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
                <span>{isProcessing ? 'Menyimpan...' : 'Simpan & Kirim Notifikasi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DISPATCH NOTIFIKASI WHATSAPP & BERITA ACARA POST-PROCESS */}
      {completedActionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tindakan Tiket Berhasil Disimpan!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tiket <strong className="font-mono text-red-700">{completedActionModal.ticket.id}</strong> berstatus: <strong className="text-emerald-700">{completedActionModal.ticket.status}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedActionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Peminjam:</span>
                <span className="font-bold text-slate-900">{completedActionModal.ticket.peminjam} ({completedActionModal.ticket.kontak})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Barang:</span>
                <span className="font-semibold text-slate-800">{completedActionModal.ticket.namaBarangT || completedActionModal.ticket.barangPinjaman}</span>
              </div>
              {completedActionModal.ticket.barcode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Barcode Aset:</span>
                  <span className="font-mono font-bold text-slate-800">{completedActionModal.ticket.barcode}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 text-emerald-800 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Notifikasi email resmi telah terkirim ke: <strong>{completedActionModal.ticket.email || completedActionModal.ticket.peminjam}</strong></span>
              </div>
            </div>

            {/* WhatsApp Dispatch Button */}
            {completedActionModal.waUrl && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <p className="text-xs text-emerald-950 font-bold flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span>Kirim Notifikasi WhatsApp Resmi ke Peminjam</span>
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Draf pesan WhatsApp resmi berformat standar PAHAM UMC (dengan nomor tiket, barcode, dan instruksi penyerahan/clearance) telah disiapkan. Klik tombol di bawah untuk membuka obrolan:
                </p>
                <a
                  href={completedActionModal.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Buka WhatsApp & Kirim Pesan ke {completedActionModal.ticket.kontak}</span>
                </a>
              </div>
            )}

            {/* Berita Acara & Close Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              {(completedActionModal.action === 'terima' || completedActionModal.action === 'kembali') ? (
                <button
                  type="button"
                  onClick={() => {
                    const t = completedActionModal.ticket;
                    setCompletedActionModal(null);
                    openPrintReceiptModal(t);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Cetak Berita Acara PDF</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setCompletedActionModal(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
              >
                Selesai & Tutup
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

      {/* Camera Barcode Scanner for Approval */}
      {showScannerForApproval && (
        <BarcodeScannerModal
          title="Scan / Foto Barcode Aset untuk Persetujuan"
          onClose={() => setShowScannerForApproval(false)}
          onScanSuccess={(detectedBarcode) => {
            setBarcodeInput(detectedBarcode);
            setShowScannerForApproval(false);
            const asset = AppDatabase.getAssetByBarcode(detectedBarcode);
            if (asset) {
              setNamaBarangAuto(asset.nama);
              if (selectedTicket && asset.nama.toLowerCase() !== selectedTicket.barangPinjaman.toLowerCase()) {
                setIsAlternateAllocation(true);
              } else {
                setIsAlternateAllocation(false);
              }
              if (asset.status !== 'Tersedia') {
                setBarcodeWarning(`Aset "${asset.nama}" (Barcode: ${detectedBarcode}) berstatus "${asset.status}". Hanya aset "Tersedia" yang dapat dipinjam!`);
              } else {
                setBarcodeWarning(null);
              }
            } else {
              setBarcodeWarning('Barcode terdeteksi tetapi belum terdaftar di katalog!');
            }
          }}
        />
      )}

      {/* Camera Barcode Scanner for Direct Walk-in Loan */}
      {showScannerForDirect && (
        <BarcodeScannerModal
          title="Scan / Foto Barcode Aset (Peminjaman Walk-In)"
          onClose={() => setShowScannerForDirect(false)}
          onScanSuccess={(detectedBarcode) => {
            handleDirectAssetSelect(detectedBarcode);
            setShowScannerForDirect(false);
          }}
        />
      )}
    </div>
  );
};
