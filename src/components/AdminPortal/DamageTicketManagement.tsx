import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { WhatsAppNotificationService } from '../../services/whatsappService';
import {
  DamageTicket,
  AssetStatus,
  RepairCategory,
  TechnicianRole,
  TicketUrgency,
  TicketType,
  TechnicianUser,
  SlaConfig
} from '../../types';
import {
  computeSlaEvaluation,
  computeAggregateSlaStats,
  computeTechnicianSlaBreakdown,
  filterTicketsForTechnician,
  formatMinutesLabel,
  formatHoursLabel,
  DEFAULT_SLA_CONFIG
} from '../../services/slaService';
import { PdfReportService } from '../../services/pdfReportService';
import { BarcodeScannerModal } from '../Modals/BarcodeScannerModal';
import { SignatoryConfirmModal, ConfirmedSignatoryValues } from '../Modals/SignatoryConfirmModal';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Wrench,
  Clock,
  Filter,
  MapPin,
  Building,
  Phone,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Info,
  MessageCircle,
  ArrowUpDown,
  Download,
  Camera,
  UserCheck,
  Shield,
  Laptop,
  Server,
  HardDrive,
  PackageSearch,
  FileSpreadsheet,
  AlertOctagon,
  Calendar,
  Flame,
  Plus,
  Trash2,
  Send,
  Users,
  ShieldAlert,
  CalendarClock,
  Cpu,
  Layers,
  ArrowRight,
  GitBranch,
  Check,
  HelpCircle,
  SlidersHorizontal,
  Gauge,
  PauseCircle,
  Globe,
  Printer,
  Award
} from 'lucide-react';

interface DamageTicketManagementProps {
  onDataChanged: () => void;
}

export const DamageTicketManagement: React.FC<DamageTicketManagementProps> = ({ onDataChanged }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<'Semua' | TicketType>('Semua');
  const [picFilter, setPicFilter] = useState<string>('Semua');
  const [urgencyFilter, setUrgencyFilter] = useState<'Semua' | TicketUrgency>('Semua');
  const [sortBy, setSortBy] = useState<'terbaru' | 'terlama' | 'urgensi' | 'status'>('terbaru');
  const [selectedTicket, setSelectedTicket] = useState<DamageTicket | null>(null);

  // SOP Modal action types
  const currentUser = AppDatabase.getActiveUser();
  const canAccessTahap2 = currentUser?.role === 'ACT-02' || currentUser?.role === 'ACT-03';
  const canEditUrgency = currentUser?.role === 'ACT-02' || currentUser?.role === 'ACT-03';

  const [actionType, setActionType] = useState<
    | 'verifikasi-delegasi'
    | 'need-info'
    | 'jadwalkan-inspeksi'
    | 'perbaikan'
    | 'suku-cadang'
    | 'vendor-eksternal'
    | 'lanjut-perbaikan'
    | 'eskalasi-problem-rfc'
    | 'rusak-total'
    | 'selesai'
    | 'ubah-pic'
    | 'delegasikan'
  >('jadwalkan-inspeksi');

  // Modal form states
  const [catatanAdmin, setCatatanAdmin] = useState('');
  const [kategoriMasalahModal, setKategoriMasalahModal] = useState<'Hardware' | 'Software'>('Hardware');
  const [jenisAsetModal, setJenisAsetModal] = useState<'Fisik' | 'Non-Fisik'>('Fisik');
  const [jadwalInspeksiModal, setJadwalInspeksiModal] = useState('');
  const [skenarioModal, setSkenarioModal] = useState<'Non-Fisik (Remote/Server)' | 'Fisik (On-site)' | 'Fisik (Bawa ke PUSDATIN)'>('Fisik (On-site)');
  const [resolusiAkhirModal, setResolusiAkhirModal] = useState('');

  // Vendor eksternal (3c) & Problem/RFC escalation (3d) states
  const [vendorEksternalNama, setVendorEksternalNama] = useState('');
  const [vendorEksternalTiket, setVendorEksternalTiket] = useState('');
  const [workaroundInput, setWorkaroundInput] = useState('');
  const [targetProblemType, setTargetProblemType] = useState<'Problem' | 'RFC'>('Problem');
  const [problemJudulInput, setProblemJudulInput] = useState('');
  const [problemTargetHoursInput, setProblemTargetHoursInput] = useState<number>(336);
  const [modalError, setModalError] = useState<string | null>(null);

  const [statusAsetBaru, setStatusAsetBaru] = useState<AssetStatus>('Tersedia');
  const [lokasiTujuan, setLokasiTujuan] = useState('');
  const [dibawaKePusdatin, setDibawaKePusdatin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Suku cadang multi-komponen states
  const [repairCategory, setRepairCategory] = useState<RepairCategory>('Suku Cadang (Stok Ada)');
  const [komponenList, setKomponenList] = useState<string[]>([]);
  const [newKomponenInput, setNewKomponenInput] = useState('');
  const [reassignedPic, setReassignedPic] = useState<TechnicianRole>('IT Support & Helpdesk Specialist');
  const [modalUrgency, setModalUrgency] = useState<TicketUrgency>('Sedang');

  // Delegasi states
  const [targetDelegasiId, setTargetDelegasiId] = useState('');

  // Scanner modal states
  const [showInternalScanner, setShowInternalScanner] = useState(false);

  // Post-process WhatsApp dispatch modal
  const [damageDispatchModal, setDamageDispatchModal] = useState<{
    ticket: DamageTicket;
    statusType: string;
    waUrl: string | null;
    message: string;
  } | null>(null);

  // Internal damage ticket creation states (temuan tim pusdatin)
  const [showInternalModal, setShowInternalModal] = useState(false);
  const [internalBarcode, setInternalBarcode] = useState('');
  const [internalNamaBarang, setInternalNamaBarang] = useState('');
  const [internalLokasi, setInternalLokasi] = useState('');
  const [internalPelapor, setInternalPelapor] = useState('Tim Teknis PUSDATIN (Internal)');
  const [internalDeskripsi, setInternalDeskripsi] = useState('');
  const [internalUrgensi, setInternalUrgensi] = useState<TicketUrgency>('Sedang');
  const [internalStatus, setInternalStatus] = useState<'Open' | 'Assigned' | 'In Progress'>('Open');
  const [internalMetode, setInternalMetode] = useState<'Di Lokasi' | 'Dibawa ke PUSDATIN'>('Dibawa ke PUSDATIN');
  const [internalError, setInternalError] = useState<string | null>(null);

  // SLA Configuration (FRT & RT) & Technician SLA Print states
  const [slaConfig, setSlaConfig] = useState<SlaConfig>(() => AppDatabase.getSlaConfig());
  const [showSlaModal, setShowSlaModal] = useState(false);
  const [slaDraft, setSlaDraft] = useState<SlaConfig>(() => AppDatabase.getSlaConfig());
  const [slaFeedback, setSlaFeedback] = useState<string | null>(null);
  const [showSlaPrintSelector, setShowSlaPrintSelector] = useState(false);
  const [slaPrintMode, setSlaPrintMode] = useState<'recap' | 'individual'>('recap');
  const [slaPrintTechId, setSlaPrintTechId] = useState<string>('');
  const [slaPrintMonth, setSlaPrintMonth] = useState<string>('');
  const [pendingSlaPrint, setPendingSlaPrint] = useState<{
    mode: 'individual' | 'recap';
    techId?: string;
    periodMonth: string;
  } | null>(null);

  const tickets = AppDatabase.getDamageTickets();
  const allAssets = AppDatabase.getAssets();

  const handleSelectAssetForInternal = (barcode: string) => {
    setInternalBarcode(barcode);
    const found = allAssets.find(a => a.barcode === barcode);
    if (found) {
      setInternalNamaBarang(found.nama);
      setInternalLokasi(found.lokasi);
    }
  };

  const handleCreateInternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNamaBarang.trim() || !internalDeskripsi.trim()) {
      setInternalError('Harap isi nama perangkat dan deskripsi kerusakan.');
      return;
    }

    setInternalError(null);
    setIsProcessing(true);
    const asset = internalBarcode.trim() ? AppDatabase.getAssetByBarcodeOrUnique(internalBarcode.trim()) : undefined;
    const createdTicket = AppDatabase.addDamageTicket({
      barcode: internalBarcode.trim() || 'Tanpa Barcode',
      kodeUnikAset: asset?.kodeUnikAset || `AST-${internalBarcode.trim() || 'INTERNAL'}`,
      namaBarang: internalNamaBarang.trim(),
      lokasi: internalLokasi.trim() || 'Ruang PUSDATIN Kampus 1',
      lokasiAwal: internalLokasi.trim() || 'Ruang PUSDATIN Kampus 1',
      deskripsi: internalDeskripsi.trim(),
      pelapor: internalPelapor.trim(),
      kontakPelapor: '085964531388',
      prioritas: internalUrgensi,
      urgensi: internalUrgensi,
      metodePerbaikan: internalMetode,
      kategoriMasalah: 'Hardware',
      jenisAset: 'Fisik'
    });
    const id = createdTicket.id;

    setTimeout(() => {
      setIsProcessing(false);
      setShowInternalModal(false);
      setInternalBarcode('');
      setInternalNamaBarang('');
      setInternalLokasi('');
      setInternalDeskripsi('');
      setSlaFeedback(`Berhasil mencatat temuan kerusakan internal (${id}).`);
      onDataChanged();
      setTimeout(() => setSlaFeedback(null), 4000);
    }, 250);
  };

  const activeTech = AppDatabase.getActiveTechnician();
  const isRestrictedPic = activeTech && !activeTech.isFullAccess;
  const techniciansList = AppDatabase.getTechnicians();
  const pusdatinTechnicians = techniciansList.filter(t => t.role !== 'ACT-01' && t.role !== 'ACT-10');
  const delegatableTechnicians = techniciansList.filter(
    tc =>
      tc.role !== 'ACT-01' &&
      tc.role !== 'ACT-02' &&
      tc.role !== 'ACT-10' &&
      tc.id !== activeTech?.id
  );
  const availableRoles: TechnicianRole[] = Array.from(
    new Set(pusdatinTechnicians.map(t => (t.roleName || t.role) as TechnicianRole))
  );

  const handleQuickUpdateUrgency = (ticketId: string, newUrgency: TicketUrgency) => {
    AppDatabase.updateDamageTicketUrgency(ticketId, newUrgency);
    onDataChanged();
  };

  const handleAddKomponen = () => {
    const val = newKomponenInput.trim();
    if (!val) return;
    if (komponenList.includes(val)) {
      setModalError(`Komponen "${val}" sudah ada dalam daftar.`);
      return;
    }
    setModalError(null);
    setKomponenList(prev => [...prev, val]);
    setNewKomponenInput('');
  };

  const handleRemoveKomponen = (idx: number) => {
    setKomponenList(prev => prev.filter((_, i) => i !== idx));
  };

  // SOP Stage Filter Logic
  const filteredTickets = tickets.filter(t => {
    // PIC Access Control: restricted PIC only sees their own assigned/delegated tickets
    if (isRestrictedPic && activeTech) {
      const isMine =
        t.assignedTechnicianId === activeTech.id ||
        t.picTeknisi === activeTech.roleName ||
        (t.delegasiDari && activeTech.nama && t.delegasiDari.includes(activeTech.nama));
      if (!isMine) return false;
    }

    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.pelapor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.kontakPelapor && t.kontakPelapor.includes(searchTerm)) ||
      t.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.picTeknisi && t.picTeknisi.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.barcode.includes(searchTerm);

    const matchesTicketType = ticketTypeFilter === 'Semua' || (t.ticketType || 'Incident') === ticketTypeFilter;

    let matchesStatus = true;
    if (statusFilter === 'Semua') {
      matchesStatus = true;
    } else if (statusFilter === 'Open') {
      matchesStatus = t.status === 'Open/Unassigned' || t.status === 'Open' || t.status === 'Baru' || t.status === 'Re-opened';
    } else if (statusFilter === 'Need More Info') {
      matchesStatus = t.status === 'Need More Info';
    } else if (statusFilter === 'Assigned') {
      matchesStatus = t.status === 'Assigned' || t.status === 'Diterima';
    } else if (statusFilter === 'In Progress') {
      matchesStatus = t.status === 'In Progress' || t.status === 'Perbaikan';
    } else if (statusFilter === 'Pending Procurement') {
      matchesStatus =
        t.status === 'Pending – Menunggu Suku Cadang' ||
        t.status === 'Pending – Menunggu Vendor Eksternal' ||
        (t.status as string) === 'Pending Procurement' ||
        (t.status as string) === 'Menunggu Suku Cadang';
    } else if (statusFilter === 'Closed') {
      matchesStatus = t.status === 'Resolved' || t.status === 'Closed – Auto' || t.status === 'Closed – Manual' || (t.status as string) === 'Closed' || (t.status as string) === 'Selesai';
    } else {
      matchesStatus = t.status === statusFilter;
    }

    const matchesPic = picFilter === 'Semua' || t.picTeknisi === picFilter;
    const matchesUrgency = urgencyFilter === 'Semua' || t.urgensi === urgencyFilter;

    return matchesSearch && matchesTicketType && matchesStatus && matchesPic && matchesUrgency;
  });

  const urgencyOrder: Record<string, number> = { Kritis: 4, Tinggi: 3, Sedang: 2, Rendah: 1 };
  const statusOrder: Record<string, number> = {
    'Open/Unassigned': 7,
    'Need More Info': 6,
    Assigned: 5,
    'In Progress': 4,
    'Pending – Menunggu Suku Cadang': 3,
    'Pending – Menunggu Vendor Eksternal': 3,
    Resolved: 2,
    'Closed – Auto': 1,
    'Closed – Manual': 1,
    'Re-opened': 6
  };

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'terbaru') return b.id.localeCompare(a.id);
    if (sortBy === 'terlama') return a.id.localeCompare(b.id);
    if (sortBy === 'urgensi') {
      const uA = urgencyOrder[a.urgensi || 'Sedang'] || 2;
      const uB = urgencyOrder[b.urgensi || 'Sedang'] || 2;
      return uB - uA;
    }
    if (sortBy === 'status') {
      const sA = statusOrder[a.status] || 0;
      const sB = statusOrder[b.status] || 0;
      return sB - sA;
    }
    return 0;
  });

  // Scope base tickets for KPI cards and SLA metrics dynamically by active restricted technician & selected PIC filter
  let picScopedTickets = tickets;
  if (isRestrictedPic && activeTech) {
    picScopedTickets = filterTicketsForTechnician(picScopedTickets, activeTech);
  }
  if (picFilter !== 'Semua') {
    picScopedTickets = picScopedTickets.filter(t => t.picTeknisi === picFilter);
  }
  const slaSummary = computeAggregateSlaStats(picScopedTickets, slaConfig);

  // KPI Stage Counts (disesuaikan dengan tiket teknisi / PIC yang dipilih)
  const stageCounts = {
    total: picScopedTickets.length,
    open: picScopedTickets.filter(t => t.status === 'Open/Unassigned' || (t.status as string) === 'Open' || (t.status as string) === 'Baru' || t.status === 'Re-opened').length,
    needInfo: picScopedTickets.filter(t => t.status === 'Need More Info').length,
    assigned: picScopedTickets.filter(t => t.status === 'Assigned' || (t.status as string) === 'Diterima').length,
    inProgress: picScopedTickets.filter(t => t.status === 'In Progress' || (t.status as string) === 'Perbaikan').length,
    pendingProcurement: picScopedTickets.filter(t => t.status === 'Pending – Menunggu Suku Cadang' || t.status === 'Pending – Menunggu Vendor Eksternal').length,
    closed: picScopedTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed – Auto' || t.status === 'Closed – Manual').length,
    incidents: picScopedTickets.filter(t => (t.ticketType || 'Incident') === 'Incident').length,
    problems: picScopedTickets.filter(t => t.ticketType === 'Problem').length,
    rfcs: picScopedTickets.filter(t => t.ticketType === 'RFC').length
  };

  const handleOpenSlaPrint = () => {
    if (isRestrictedPic && activeTech) {
      setPendingSlaPrint({
        mode: 'individual',
        techId: activeTech.id,
        periodMonth: ''
      });
      return;
    }
    const defaultTech = pusdatinTechnicians.find(t => t.role !== 'ACT-02') || pusdatinTechnicians[0];
    setSlaPrintMode('recap');
    setSlaPrintTechId(defaultTech?.id || '');
    setShowSlaPrintSelector(true);
  };

  const handleConfirmSlaPrintPdf = (sig: ConfirmedSignatoryValues) => {
    if (!pendingSlaPrint) return;
    const { mode, techId, periodMonth } = pendingSlaPrint;
    const periodTickets = periodMonth
      ? tickets.filter(t => (t.createdAtIso || t.tanggalLapor || '').startsWith(periodMonth))
      : tickets;
    const periodLabel = periodMonth || 'Semua Periode Aktif';
    const allBreakdown = computeTechnicianSlaBreakdown(periodTickets, pusdatinTechnicians, slaConfig);

    if (mode === 'individual') {
      const targetTech =
        pusdatinTechnicians.find(t => t.id === techId) ||
        activeTech ||
        pusdatinTechnicians[0];
      const techSummary =
        allBreakdown.find(b => b.technicianId === targetTech?.id) ||
        allBreakdown[0];
      const techTickets = targetTech
        ? filterTicketsForTechnician(periodTickets, targetTech)
        : [];
      const doc = PdfReportService.generateTechnicianSlaPdf(
        {
          mode: 'individual',
          periodLabel,
          technician: techSummary,
          tickets: techTickets,
          slaConfig
        },
        {
          kepalaPusdatin: sig.kepalaPusdatin,
          nipKepala: sig.nipKepala,
          petugas: targetTech?.nama || sig.petugas
        }
      );
      const safeName = (targetTech?.nama || 'Teknisi').replace(/[^a-zA-Z0-9]+/g, '_');
      doc.save(`Nilai_SLA_Teknisi_${safeName}_${periodMonth || 'Semua'}.pdf`);
      setSlaFeedback(`Laporan Nilai SLA Individu (${targetTech?.nama}) berhasil diunduh dalam format PDF.`);
    } else {
      const overallSummary = computeAggregateSlaStats(periodTickets, slaConfig);
      const doc = PdfReportService.generateTechnicianSlaPdf(
        {
          mode: 'recap',
          periodLabel,
          recapRows: allBreakdown,
          overallSummary,
          slaConfig
        },
        {
          kepalaPusdatin: sig.kepalaPusdatin,
          nipKepala: sig.nipKepala,
          petugas: sig.petugas
        }
      );
      doc.save(`Rekap_Evaluasi_SLA_Teknisi_${periodMonth || 'Semua'}.pdf`);
      setSlaFeedback(`Rekap Evaluasi Nilai SLA Seluruh Teknisi berhasil diunduh dalam format PDF.`);
    }

    setPendingSlaPrint(null);
    setTimeout(() => setSlaFeedback(null), 4500);
  };

  const openProcessModal = (t: DamageTicket, specificAction?: typeof actionType) => {
    setSelectedTicket(t);
    setModalError(null);

    let defaultAction: typeof actionType = canAccessTahap2 ? 'verifikasi-delegasi' : 'jadwalkan-inspeksi';
    if (specificAction) {
      defaultAction = specificAction;
    } else if (t.status === 'Open/Unassigned' || t.status === 'Open' || t.status === 'Baru' || t.status === 'Re-opened') {
      defaultAction = canAccessTahap2 ? 'verifikasi-delegasi' : 'jadwalkan-inspeksi';
    } else if (t.status === 'Need More Info') {
      defaultAction = canAccessTahap2 ? 'verifikasi-delegasi' : 'jadwalkan-inspeksi';
    } else if (t.status === 'Assigned' || t.status === 'Diterima') {
      defaultAction = 'jadwalkan-inspeksi';
    } else if (t.status === 'In Progress' || t.status === 'Perbaikan') {
      defaultAction = 'perbaikan';
    } else if (
      t.status === 'Pending – Menunggu Suku Cadang' ||
      t.status === 'Pending – Menunggu Vendor Eksternal' ||
      (t.status as string) === 'Pending Procurement' ||
      (t.status as string) === 'Menunggu Suku Cadang'
    ) {
      defaultAction = 'lanjut-perbaikan';
    } else {
      defaultAction = 'selesai';
    }

    setActionType(defaultAction);
    setCatatanAdmin(t.catatanAdmin || '');
    setKategoriMasalahModal(t.kategoriMasalah === 'Software' ? 'Software' : 'Hardware');
    setJenisAsetModal(t.jenisAset || 'Fisik');
    setJadwalInspeksiModal(t.jadwalPemeriksaan || '');
    setSkenarioModal(t.skenarioPerbaikan || (t.jenisAset === 'Non-Fisik' ? 'Non-Fisik (Remote/Server)' : 'Fisik (On-site)'));
    setResolusiAkhirModal(t.resolusiAkhir || '');
    setDibawaKePusdatin(t.metodePerbaikan === 'Dibawa ke PUSDATIN');
    setRepairCategory(t.kategoriPerbaikan || 'Suku Cadang (Stok Ada)');
    setVendorEksternalNama(t.vendorEksternalNama || '');
    setVendorEksternalTiket(t.vendorEksternalTiket || '');
    setWorkaroundInput(t.workaround || '');
    setTargetProblemType('Problem');
    setProblemJudulInput(`[Problem] ${t.namaBarang}`);
    setProblemTargetHoursInput((slaConfig.Problem || DEFAULT_SLA_CONFIG.Problem!).rtTargetHours);

    // Populate multiple components if existing
    if (t.sukuCadangList && t.sukuCadangList.length > 0) {
      setKomponenList(t.sukuCadangList.map(s => s.namaKomponen));
    } else if (t.namaSukuCadang) {
      setKomponenList(t.namaSukuCadang.split(',').map(s => s.trim()).filter(Boolean));
    } else {
      setKomponenList([]);
    }
    setNewKomponenInput('');

    setReassignedPic(t.picTeknisi || 'IT Support & Helpdesk Specialist');
    setModalUrgency(t.urgensi || 'Sedang');

    // Default target delegasi (di luar pimpinan universitas & pimpinan PUSDATIN)
    const otherTech = delegatableTechnicians[0];
    setTargetDelegasiId(otherTech ? otherTech.id : '');

    // Default status akhir aset
    if (t.jenisAset === 'Non-Fisik') {
      setStatusAsetBaru('Berfungsi Kembali');
      setLokasiTujuan(t.lokasiAwal || t.lokasi);
    } else {
      setStatusAsetBaru('Digunakan');
      setLokasiTujuan(t.lokasiAwal || t.lokasi);
    }
  };

  const handleStatusAsetBaruChange = (newStatus: AssetStatus) => {
    setStatusAsetBaru(newStatus);
    if (!selectedTicket) return;

    if (newStatus === 'Tersedia') {
      setLokasiTujuan('Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)');
    } else if (newStatus === 'Digunakan' || newStatus === 'Berfungsi Kembali') {
      const restoredLocation = selectedTicket.lokasiAwal || selectedTicket.lokasi;
      setLokasiTujuan(restoredLocation);
    }
  };

  const handleProcessSubmit = () => {
    if (!selectedTicket) return;
    setModalError(null);

    if (actionType === 'eskalasi-problem-rfc' && !workaroundInput.trim()) {
      setModalError('Harap isi Workaround (solusi sementara) untuk pengguna sebelum membuat tiket Problem / RFC.');
      return;
    }

    setIsProcessing(true);

    const res = AppDatabase.processDamageTicket(selectedTicket.id, actionType, {
      catatanAdmin,
      catatan: catatanAdmin,
      statusAsetBaru,
      dibawaKePusdatin,
      lokasiBaruCustom: actionType === 'selesai' ? lokasiTujuan : undefined,
      kategoriMasalah: kategoriMasalahModal,
      jenisAset: jenisAsetModal,
      jadwalPemeriksaan: actionType === 'jadwalkan-inspeksi' ? jadwalInspeksiModal : undefined,
      skenarioPerbaikan: skenarioModal,
      resolusiAkhir: resolusiAkhirModal,
      kategoriPerbaikan: actionType === 'suku-cadang' ? repairCategory : actionType === 'rusak-total' ? 'Rusak Total (Afkir)' : undefined,
      komponenList: actionType === 'suku-cadang' ? komponenList : undefined,
      namaSukuCadang: actionType === 'suku-cadang' ? komponenList.join(', ') : undefined,
      picTeknisiBaru: actionType === 'ubah-pic' || actionType === 'verifikasi-delegasi' || actionType === 'eskalasi-problem-rfc' ? reassignedPic : undefined,
      targetTechnicianId: actionType === 'delegasikan' ? targetDelegasiId : undefined,
      urgensiBaru: modalUrgency,
      vendorEksternalNama: actionType === 'vendor-eksternal' ? vendorEksternalNama : undefined,
      vendorEksternalTiket: actionType === 'vendor-eksternal' ? vendorEksternalTiket : undefined,
      workaround: actionType === 'eskalasi-problem-rfc' ? workaroundInput : undefined,
      targetTicketType: actionType === 'eskalasi-problem-rfc' ? targetProblemType : undefined,
      problemJudul: actionType === 'eskalasi-problem-rfc' ? problemJudulInput : undefined,
      problemTargetHours: actionType === 'eskalasi-problem-rfc' ? problemTargetHoursInput : undefined
    });

    if (!res.success) {
      setIsProcessing(false);
      setModalError(res.message);
      return;
    }

    let displayStatusLabel = 'Diperbarui';
    if (actionType === 'verifikasi-delegasi') displayStatusLabel = 'Assigned (SLA RT Dimulai)';
    else if (actionType === 'need-info') displayStatusLabel = 'Need More Info (Auto-Close 3x24j)';
    else if (actionType === 'jadwalkan-inspeksi') displayStatusLabel = 'In Progress (Inspeksi Dijadwalkan)';
    else if (actionType === 'perbaikan' || actionType === 'lanjut-perbaikan') displayStatusLabel = 'In Progress (SLA Aktif)';
    else if (actionType === 'suku-cadang') displayStatusLabel = 'Pending Suku Cadang (SLA Terjeda)';
    else if (actionType === 'vendor-eksternal') displayStatusLabel = 'Pending Vendor Eksternal (SLA Terjeda)';
    else if (actionType === 'eskalasi-problem-rfc') displayStatusLabel = `Resolved via Workaround & ${targetProblemType}`;
    else if (actionType === 'rusak-total') displayStatusLabel = 'Closed (Rusak Total / Afkir)';
    else if (actionType === 'selesai') displayStatusLabel = 'Resolved (Konfirmasi 1x24j)';

    const waNote = catatanAdmin || resolusiAkhirModal || workaroundInput || `Status tiket diperbarui menjadi: ${displayStatusLabel}`;
    const waUrl = WhatsAppNotificationService.getDamageStatusUrl(selectedTicket, displayStatusLabel as any, waNote);

    setTimeout(() => {
      setIsProcessing(false);
      const prevTicket = selectedTicket;
      setSelectedTicket(null);
      onDataChanged();

      setDamageDispatchModal({
        ticket: prevTicket,
        statusType: displayStatusLabel,
        waUrl,
        message: res.message
      });
    }, 250);
  };

  const getWaLink = (phone?: string, ticketId?: string, deviceName?: string) => {
    if (!phone) return null;
    const clean = phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
    if (!clean) return null;
    const msg = `Halo, kami dari Tim Teknis PUSDATIN UMC terkait laporan perbaikan IT "${deviceName || 'perangkat'}" (Tiket: ${ticketId || ''}). Apakah kami dapat mengonfirmasi jadwal pemeriksaan? Terima kasih.`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  const handleSaveSlaConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AppDatabase.setSlaConfig(slaDraft);
    if (!res.success) {
      setSlaFeedback(res.message);
      return;
    }
    setSlaConfig(AppDatabase.getSlaConfig());
    setShowSlaModal(false);
    setSlaFeedback(res.message);
    onDataChanged();
    setTimeout(() => setSlaFeedback(null), 4000);
  };

  const exportToExcelCsv = () => {
    const headers = [
      'ID Tiket',
      'Tanggal Lapor',
      'Nama Barang / Aset',
      'Barcode',
      'Lokasi',
      'Pelapor',
      'Kontak WA',
      'Status Tiket (SOP)',
      'Kategori Masalah',
      'Jenis Aset',
      'Urgensi',
      'PIC Teknisi',
      'Jadwal Pemeriksaan',
      'Skenario & Cabang',
      'Suku Cadang',
      'Target FRT (Menit)',
      'Realisasi FRT',
      'Status FRT',
      'Target RT (Jam)',
      'Realisasi RT',
      'Status RT',
      'Resolusi Akhir',
      'Catatan Penanganan'
    ];
    const rows = sortedTickets.map(t => {
      const sla = computeSlaEvaluation(t, slaConfig);
      return [
        `"${t.id}"`,
        `"${t.tanggalLapor}"`,
        `"${(t.namaBarang || '').replace(/"/g, '""')}"`,
        `"${t.barcode || '-'}"`,
        `"${(t.lokasi || '').replace(/"/g, '""')}"`,
        `"${(t.pelapor || '').replace(/"/g, '""')}"`,
        `"${t.kontakPelapor || '-'}"`,
        `"${t.status}"`,
        `"${t.kategoriMasalah || '-'}"`,
        `"${t.jenisAset || 'Fisik'}"`,
        `"${t.urgensi || 'Sedang'}"`,
        `"${t.picTeknisi || '-'}"`,
        `"${t.jadwalPemeriksaan || '-'}"`,
        `"${t.skenarioPerbaikan || t.cabangPerbaikan || '-'}"`,
        `"${t.namaSukuCadang || '-'}"`,
        String(sla.frtTargetMinutes),
        `"${sla.frtLabel}"`,
        `"${sla.frtStatus}"`,
        String(sla.rtTargetHours),
        `"${sla.rtLabel}"`,
        `"${sla.rtStatus}"`,
        `"${(t.resolusiAkhir || '').replace(/"/g, '""')}"`,
        `"${(t.catatanAdmin || '').replace(/"/g, '""')}"`
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SOP_Tiket_Perbaikan_IT_PUSDATIN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderRoleBadge = (role?: TechnicianRole | string) => {
    switch (role) {
      case 'Cloud & Infrastructure Engineer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Server className="w-2.5 h-2.5 text-sky-600" />
            <span>Cloud & Infra</span>
          </span>
        );
      case 'Lead Full Stack Developer':
      case 'Frontend Programmer':
      case 'Backend Programmer':
      case 'Programmer':
      case 'Junior Programmer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-800 border border-violet-200">
            <Laptop className="w-2.5 h-2.5 text-violet-600" />
            <span>{role}</span>
          </span>
        );
      case 'System Analyst & Data Governance Specialist':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Laptop className="w-2.5 h-2.5 text-indigo-600" />
            <span>System Analyst</span>
          </span>
        );
      case 'Cyber Security Officer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Shield className="w-2.5 h-2.5 text-emerald-600" />
            <span>Cyber Sec</span>
          </span>
        );
      case 'Kepala PUSDATIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-800 border border-red-200">
            <ShieldAlert className="w-2.5 h-2.5 text-red-600" />
            <span>Kepala PUSDATIN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Wrench className="w-2.5 h-2.5 text-amber-600" />
            <span>IT Support & Helpdesk</span>
          </span>
        );
    }
  };

  const renderStageBadge = (status: string) => {
    if (status === 'Open/Unassigned' || status === 'Open' || status === 'Baru') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span>1. Open / Baru</span>
        </span>
      );
    }
    if (status === 'Re-opened') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
          <RotateCcw className="w-3 h-3 text-rose-700" />
          <span>Re-opened</span>
        </span>
      );
    }
    if (status === 'Need More Info') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-amber-700" />
          <span>Need More Info</span>
        </span>
      );
    }
    if (status === 'Assigned' || status === 'Diterima') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-purple-600" />
          <span>2. Assigned</span>
        </span>
      );
    }
    if (status === 'In Progress' || status === 'Perbaikan') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
          <Wrench className="w-3 h-3 text-blue-600" />
          <span>3. In Progress</span>
        </span>
      );
    }
    if (status === 'Pending – Menunggu Suku Cadang' || status === 'Pending Procurement' || status === 'Menunggu Suku Cadang') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
          <PauseCircle className="w-3 h-3 text-amber-700" />
          <span>4.a Suku Cadang (Jeda SLA)</span>
        </span>
      );
    }
    if (status === 'Pending – Menunggu Vendor Eksternal') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 inline-flex items-center gap-1">
          <Globe className="w-3 h-3 text-cyan-700" />
          <span>4.b Vendor Eksternal (Jeda SLA)</span>
        </span>
      );
    }
    if (status === 'Rusak Total') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
          <AlertOctagon className="w-3 h-3 text-rose-600" />
          <span>5. Closed (Rusak Total)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>{status === 'Resolved' ? '5. Resolved' : status === 'Closed – Auto' ? 'Auto-Closed' : '5. Closed / Selesai'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Sistem Tiket Perbaikan IT (Alur SOP 5-Tahap)</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              {sortedTickets.length} Laporan
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Standar Operasional Prosedur: 1. Pelaporan (Open) &rarr; 2. Verifikasi & Delegasi (Assigned) &rarr; 3. Penjadwalan Inspeksi (In Progress) &rarr; 4. Eksekusi Perbaikan (Fisik / Non-Fisik / Suku Cadang) &rarr; 5. Penyelesaian & Pembaruan Status (Closed).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="print-technician-sla-btn"
            onClick={handleOpenSlaPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-xs transition-colors cursor-pointer"
            title={isRestrictedPic ? 'Cetak Laporan Nilai SLA Pribadi (PDF)' : 'Cetak Evaluasi Nilai SLA Individu atau Rekap Seluruh Teknisi'}
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>{isRestrictedPic ? 'Cetak Nilai SLA Saya' : 'Cetak Nilai SLA Teknisi'}</span>
          </button>

          {canEditUrgency && (
            <button
              type="button"
              data-testid="open-sla-policy-btn"
              onClick={() => {
                setSlaDraft(AppDatabase.getSlaConfig());
                setShowSlaModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Konfigurasi Target FRT & RT SLA per Tingkat Urgensi"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Atur Target SLA (FRT & RT)</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportToExcelCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Download Data Format CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInternalModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>+ Catat Temuan Kerusakan Internal</span>
          </button>
        </div>
      </div>

      {slaFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{slaFeedback}</span>
        </div>
      )}

      {/* Restricted PIC Notice */}
      {isRestrictedPic && activeTech && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <span>Halaman Kerja Khusus PIC: {activeTech.role}</span>
            </div>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Menampilkan tiket yang didelegasikan khusus kepada peran Anda. Anda dapat menjadwalkan pemeriksaan, melakukan perbaikan On-site/Lab, mendata suku cadang (Pending Procurement), atau mendelegasikan tiket ke tim lain.
            </p>
          </div>
        </div>
      )}

      {/* SOP Stage Interactive Metric Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('Semua')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Semua' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === 'Semua' ? 'text-slate-300' : 'text-slate-500'}`}>
            Semua Tiket
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{stageCounts.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Open')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Open' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === 'Open' ? 'text-red-100' : 'text-red-600'}`}>
            1. Open / Reopen
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{stageCounts.open}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Need More Info')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Need More Info' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === 'Need More Info' ? 'text-amber-100' : 'text-amber-700'}`}>
            Need More Info
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{stageCounts.needInfo}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Assigned')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Assigned' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === 'Assigned' ? 'text-purple-100' : 'text-purple-600'}`}>
            2. Assigned
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{stageCounts.assigned}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('In Progress')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'In Progress' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === 'In Progress' ? 'text-blue-100' : 'text-blue-600'}`}>
            3. In Progress
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{stageCounts.inProgress}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Pending Procurement')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Pending Procurement' ? 'bg-cyan-700 text-white border-cyan-700' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === 'Pending Procurement' ? 'text-cyan-100' : 'text-cyan-700'}`}>
            4. Pending (Jeda)
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{stageCounts.pendingProcurement}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Closed')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Closed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === 'Closed' ? 'text-emerald-100' : 'text-emerald-600'}`}>
            5. Resolved/Closed
          </span>
          <span className="text-xl font-bold font-mono mt-0.5 block">{stageCounts.closed}</span>
        </button>
      </div>

      {(isRestrictedPic || picFilter !== 'Semua') && (
        <div
          data-testid="sla-scope-banner"
          className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-950"
        >
          <span className="font-semibold">
            Cakupan Metrik &amp; SLA Aktif:{' '}
            <strong>
              {isRestrictedPic && activeTech
                ? `${activeTech.nama} (${activeTech.roleName})`
                : picFilter}
            </strong>{' '}
            ({picScopedTickets.length} tiket tercatat)
          </span>
          {!isRestrictedPic && picFilter !== 'Semua' && (
            <button
              type="button"
              onClick={() => setPicFilter('Semua')}
              className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
            >
              Tampilkan Semua Teknisi
            </button>
          )}
        </div>
      )}

      {/* SLA FRT & RT Performance Monitoring Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" data-testid="sla-kpi-strip">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="leading-snug">Kepatuhan FRT (Respons Pertama)</span>
            <Gauge className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-indigo-700">
              {slaSummary.frtComplianceRate}%
            </span>
            <span className="text-[11px] text-slate-500">
              Rata-rata {formatMinutesLabel(slaSummary.avgFrtMinutes)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="leading-snug">Kepatuhan RT (Penyelesaian)</span>
            <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-700">
              {slaSummary.rtComplianceRate}%
            </span>
            <span className="text-[11px] text-slate-500">
              Rata-rata {formatHoursLabel(slaSummary.avgRtHours)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="leading-snug">Status Timer SLA Saat Ini</span>
            <PauseCircle className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          </div>
          <div className="mt-1.5 text-[11px] text-slate-700 font-semibold space-y-0.5">
            <div>{slaSummary.waitingStage2Count} Menunggu Tahap 2 (RT belum jalan)</div>
            <div>{slaSummary.pausedCount} Tiket Sedang Terjeda (Paused)</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="leading-snug">Status Pelanggaran SLA</span>
            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${slaSummary.rtOverdueCount + slaSummary.frtOverdueCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className="mt-1.5 text-xs font-bold">
            {slaSummary.rtOverdueCount + slaSummary.frtOverdueCount > 0 ? (
              <span className="text-rose-700">
                {slaSummary.frtOverdueCount} FRT Overdue · {slaSummary.rtOverdueCount} RT Overdue
              </span>
            ) : (
              <span className="text-emerald-700">0 Pelanggaran SLA Aktif</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            Problem: {Math.round((slaConfig.Problem?.rtTargetHours || 336) / 24)}h · RFC: {Math.round((slaConfig.RFC?.rtTargetHours || 720) / 24)}h
          </div>
        </div>
      </div>

      {/* Filter, Search, Incident/Problem/RFC Tabs & Sorting Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5" data-testid="ticket-type-tabs">
            {(
              [
                { key: 'Semua', label: `Semua Jenis (${stageCounts.total})` },
                { key: 'Incident', label: `Insiden Harian (${stageCounts.incidents})` },
                { key: 'Problem', label: `Problem Ticket (${stageCounts.problems})` },
                { key: 'RFC', label: `Change Request / RFC (${stageCounts.rfcs})` }
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTicketTypeFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  ticketTypeFilter === tab.key
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari ID tiket (TKT/PRB/RFC), nama barang, pelapor, lokasi..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>

          <select
            value={picFilter}
            onChange={e => setPicFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white"
          >
            <option value="Semua">Semua PIC Teknisi (Peran)</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white"
          >
            <option value="terbaru">Urutkan: Tiket Terbaru</option>
            <option value="terlama">Urutkan: Tiket Terlama</option>
            <option value="urgensi">Urutkan: Urgensi Kritis Dahulu</option>
            <option value="status">Urutkan: Alur Status SOP</option>
          </select>
        </div>
      </div>

      {/* Table of Damage Tickets */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">ID & Urgensi</th>
                <th className="px-4 py-3.5">Perangkat & Jenis</th>
                <th className="px-4 py-3.5">Lokasi & Pelapor</th>
                <th className="px-4 py-3.5">PIC Teknisi (Peran)</th>
                <th className="px-4 py-3.5">Tahap SOP & Jadwal</th>
                <th className="px-4 py-3.5">Komitmen SLA (FRT & RT)</th>
                <th className="px-4 py-3.5">Gejala / Kebutuhan Part</th>
                <th className="px-4 py-3.5 text-right">Tindakan SOP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <p className="font-bold text-sm">Tidak ada tiket yang sesuai kriteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci atau reset filter status.</p>
                  </td>
                </tr>
              ) : (
                sortedTickets.map(t => {
                  const waLink = getWaLink(t.kontakPelapor, t.id, t.namaBarang);
                  const slaEval = computeSlaEvaluation(t, slaConfig);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* ID, Jenis Tiket & Urgensi */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{t.id}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                              t.ticketType === 'Problem'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : t.ticketType === 'RFC'
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {t.ticketType || 'Incident'}
                          </span>
                        </div>
                        {(t.linkedProblemTicketId || t.linkedParentTicketId) && (
                          <div className="text-[9px] font-mono text-indigo-700 mt-0.5">
                            {t.linkedProblemTicketId ? `↳ Eskalasi: ${t.linkedProblemTicketId}` : `↳ Induk: ${t.linkedParentTicketId}`}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-1">
                          {canEditUrgency ? (
                            <select
                              value={t.urgensi || 'Sedang'}
                              onChange={e => handleQuickUpdateUrgency(t.id, e.target.value as TicketUrgency)}
                              title="Ubah Urgensi Tiket (Hak Admin & Kepala PUSDATIN)"
                              className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 border cursor-pointer focus:outline-none transition-colors ${
                                t.urgensi === 'Kritis' ? 'bg-red-100 text-red-800 border-red-300 font-extrabold' :
                                t.urgensi === 'Tinggi' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                t.urgensi === 'Sedang' ? 'bg-sky-100 text-sky-800 border-sky-300' :
                                'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="Kritis">🔥 Kritis</option>
                              <option value="Tinggi">⚠️ Tinggi</option>
                              <option value="Sedang">⚡ Sedang</option>
                              <option value="Rendah">🟢 Rendah</option>
                            </select>
                          ) : (
                            <span
                              title="Urgensi hanya dapat diubah oleh Admin (IT Support & Helpdesk Specialist) dan Kepala PUSDATIN"
                              className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-md px-2 py-0.5 border ${
                                t.urgensi === 'Kritis' ? 'bg-red-100 text-red-800 border-red-300 font-extrabold' :
                                t.urgensi === 'Tinggi' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                t.urgensi === 'Sedang' ? 'bg-sky-100 text-sky-800 border-sky-300' :
                                'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {t.urgensi === 'Kritis'
                                ? '🔥 Kritis'
                                : t.urgensi === 'Tinggi'
                                ? '⚠️ Tinggi'
                                : t.urgensi === 'Sedang'
                                ? '⚡ Sedang'
                                : '🟢 Rendah'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Perangkat & Jenis */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{t.namaBarang}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-0.5">
                          <span className="font-mono text-slate-500">BC: {t.barcode || 'Tanpa Barcode'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {t.jenisAset || 'Fisik'}
                          </span>
                          {t.kategoriMasalah && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                              {t.kategoriMasalah}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lokasi & Pelapor */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{t.lokasi}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-slate-600 font-medium">{t.pelapor}</span>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                              title="Chat WhatsApp Pelapor"
                            >
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              <span>WA</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* PIC Role-only dropdown & badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {renderRoleBadge(t.picTeknisi)}
                        {t.delegasiKeTechnicianId && (
                          <div className="mt-1 px-1.5 py-0.5 rounded bg-violet-50 border border-violet-200 text-[9px] text-violet-800 font-medium">
                            ↳ Delegasi: <strong>{t.namaDelegasiTeknisi || 'Teknisi'}</strong>
                          </div>
                        )}
                      </td>

                      {/* SOP Stage Badge & Inspection Schedule */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {renderStageBadge(t.status)}
                        {t.jadwalPemeriksaan && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-800 font-medium mt-1">
                            <CalendarClock className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate max-w-[170px]">{t.jadwalPemeriksaan}</span>
                          </div>
                        )}
                      </td>

                      {/* SLA FRT & RT Evaluation Cell */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-1 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold border ${
                                slaEval.frtStatus === 'Memenuhi SLA' || slaEval.frtStatus === 'Dalam Batas'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : slaEval.frtStatus === 'Mendekati Batas'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              FRT: {slaEval.frtStatus}
                            </span>
                            <span className="font-mono text-slate-600">{slaEval.frtLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold border ${
                                slaEval.rtStatus === 'Memenuhi SLA' || slaEval.rtStatus === 'Dalam Batas'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : slaEval.rtStatus === 'Terjeda (Paused)'
                                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                  : slaEval.rtStatus === 'Menunggu Tahap 2'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : slaEval.rtStatus === 'Mendekati Batas'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              RT: {slaEval.rtStatus}
                            </span>
                            <span className="font-mono text-slate-600">{slaEval.rtLabel}</span>
                          </div>
                          {t.vendorEksternalNama && (
                            <div className="text-[9px] text-cyan-800 font-semibold">
                              Vendor: {t.vendorEksternalNama} ({t.vendorEksternalTiket || '-'})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Gejala / Catatan / Suku Cadang */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="line-clamp-2 text-slate-700">{t.deskripsi}</p>
                        {t.workaround && (
                          <div className="mt-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] text-emerald-900 font-semibold">
                            Workaround: {t.workaround}
                          </div>
                        )}
                        {t.sukuCadangList && t.sukuCadangList.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {t.sukuCadangList.map((sp, idx) => (
                              <span
                                key={idx}
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                                  sp.statusPengadaan === 'Sudah Digunakan' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  sp.statusPengadaan === 'Sudah Dibeli' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                  'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {sp.namaKomponen}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </td>

                      {/* Contextual SOP Action Button */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {t.status === 'Open/Unassigned' || t.status === 'Open' || t.status === 'Baru' || t.status === 'Re-opened' ? (
                          <button
                            type="button"
                            onClick={() => openProcessModal(t, canAccessTahap2 ? 'verifikasi-delegasi' : 'jadwalkan-inspeksi')}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{canAccessTahap2 ? 'Tahap 2: Verifikasi & SLA' : 'Proses Tiket'}</span>
                          </button>
                        ) : t.status === 'Need More Info' ? (
                          <button
                            type="button"
                            onClick={() => openProcessModal(t, canAccessTahap2 ? 'verifikasi-delegasi' : 'need-info')}
                            className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-lg shadow-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Pantau Need Info</span>
                          </button>
                        ) : t.status === 'Assigned' || t.status === 'Diterima' ? (
                          <button
                            type="button"
                            onClick={() => openProcessModal(t, 'jadwalkan-inspeksi')}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            <span>Jadwalkan Inspeksi</span>
                          </button>
                        ) : t.status === 'Pending – Menunggu Suku Cadang' ||
                          t.status === 'Pending – Menunggu Vendor Eksternal' ||
                          (t.status as string) === 'Pending Procurement' ||
                          (t.status as string) === 'Menunggu Suku Cadang' ? (
                          <button
                            type="button"
                            onClick={() => openProcessModal(t, 'lanjut-perbaikan')}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Tahap 5: Lanjut SLA</span>
                          </button>
                        ) : t.status === 'In Progress' || t.status === 'Perbaikan' ? (
                          <button
                            type="button"
                            onClick={() => openProcessModal(t, 'perbaikan')}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Tindakan Perbaikan</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openProcessModal(t, 'selesai')}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            Rincian Tiket
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guided SOP 5-Tahap Action Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-red-600 border border-slate-200">
                    {selectedTicket.id}
                  </span>
                  {renderStageBadge(selectedTicket.status)}
                </div>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {selectedTicket.namaBarang}
                </h3>
                <p className="text-xs text-slate-500">
                  Pelapor: <strong>{selectedTicket.pelapor}</strong> &bull; Lokasi: {selectedTicket.lokasi}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Ticket SLA FRT & RT Real-Time Summary */}
            {(() => {
              const ticketSla = computeSlaEvaluation(selectedTicket, slaConfig);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">First Response Time (FRT)</div>
                    <div className="flex items-center justify-between mt-1 gap-1">
                      <span className="font-mono font-semibold text-slate-800">{ticketSla.frtLabel}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          ticketSla.frtStatus === 'Melewati SLA'
                            ? 'bg-rose-100 text-rose-800'
                            : ticketSla.frtStatus === 'Mendekati Batas'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ticketSla.frtStatus}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Resolution Time (RT)</div>
                    <div className="flex items-center justify-between mt-1 gap-1">
                      <span className="font-mono font-semibold text-slate-800">{ticketSla.rtLabel}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          ticketSla.rtStatus === 'Melewati SLA'
                            ? 'bg-rose-100 text-rose-800'
                            : ticketSla.rtStatus === 'Terjeda (Paused)'
                            ? 'bg-cyan-100 text-cyan-800'
                            : ticketSla.rtStatus === 'Menunggu Tahap 2'
                            ? 'bg-slate-200 text-slate-700'
                            : ticketSla.rtStatus === 'Mendekati Batas'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ticketSla.rtStatus}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                {modalError}
              </div>
            )}

            {/* SOP Stage Selector / Mode Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Tahapan / Keputusan Penanganan SOP:
              </label>
              <select
                data-testid="ticket-action-select"
                value={actionType}
                onChange={e => {
                  setModalError(null);
                  setActionType(e.target.value as any);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              >
                {canAccessTahap2 && (
                  <option value="verifikasi-delegasi">
                    Tahap 2: Verifikasi Kelengkapan, Urgensi &amp; Penugasan PIC (Mulai SLA RT)
                  </option>
                )}
                {canAccessTahap2 && (
                  <option value="need-info">
                    Kembalikan ke Pelapor: Butuh Info Tambahan (Need More Info · Auto-Close 3x24j)
                  </option>
                )}
                <option value="jadwalkan-inspeksi">
                  Tahap 3: Pemeriksaan &amp; Penjadwalan oleh Teknisi
                </option>
                <option value="perbaikan">
                  Tahap 4: Mulai Tindakan Perbaikan
                </option>
                <option value="suku-cadang">
                  Tahap 4.a: Butuh Suku Cadang → Pending Procurement (Jeda SLA)
                </option>
                <option value="vendor-eksternal">
                  Tahap 4.b: Vendor Eksternal / Gangguan ISP → Pending Vendor (Jeda SLA)
                </option>
                <option value="rusak-total">
                  Tahap 4.c: Rusak Total (Beyond Economic Repair) → Afkir
                </option>
                <option value="lanjut-perbaikan">
                  Tahap 5: Lanjutkan Perbaikan (Aktifkan Kembali SLA)
                </option>
                <option value="eskalasi-problem-rfc">
                  Eskalasi Problem / RFC: Tutup Insiden via Workaround &amp; Buat Tiket Problem/RFC
                </option>
                <option value="selesai">
                  Tahap 6: Penyelesaian &amp; Pembaruan Status (Resolved)
                </option>
                <option value="delegasikan">
                  Internal: Alihkan Tiket ke Teknisi Lain
                </option>
              </select>
            </div>

            {/* Sub-form Tahap 2: Verifikasi, Penetapan Urgensi & Delegasi PIC (Mulai SLA RT) */}
            {actionType === 'verifikasi-delegasi' && (
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <UserCheck className="w-4 h-4 text-purple-700" />
                  <span>Tahap 2: Verifikasi Kelengkapan, Jenis Urgensi &amp; Penugasan PIC (Mulai SLA RT)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tetapkan Jenis Urgensi SLA: <span className="text-red-600">*</span>
                    </label>
                    <select
                      data-testid="tahap2-urgency-select"
                      value={modalUrgency}
                      onChange={e => setModalUrgency(e.target.value as TicketUrgency)}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg font-bold text-slate-900"
                    >
                      <option value="Kritis">Kritis (RT {slaConfig.Kritis.rtTargetHours} jam)</option>
                      <option value="Tinggi">Tinggi (RT {slaConfig.Tinggi.rtTargetHours} jam)</option>
                      <option value="Sedang">Sedang (RT {slaConfig.Sedang.rtTargetHours} jam)</option>
                      <option value="Rendah">Rendah (RT {slaConfig.Rendah.rtTargetHours} jam)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kategori Masalah: <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={kategoriMasalahModal}
                      onChange={e => setKategoriMasalahModal(e.target.value as 'Hardware' | 'Software')}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg font-bold text-slate-900"
                    >
                      <option value="Hardware">Hardware (Perangkat Keras &amp; Fisik)</option>
                      <option value="Software">Software (Sistem, Jaringan, Web, Database)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jenis Aset: <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={jenisAsetModal}
                      onChange={e => setJenisAsetModal(e.target.value as 'Fisik' | 'Non-Fisik')}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg font-bold text-slate-900"
                    >
                      <option value="Fisik">Aset Fisik (Barang Inventaris)</option>
                      <option value="Non-Fisik">Aset Non-Fisik (Sistem Informasi, Server Cloud)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tugaskan ke PIC Teknisi: <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={reassignedPic}
                      onChange={e => setReassignedPic(e.target.value as TechnicianRole)}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg font-bold text-slate-900"
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-2.5 bg-white/80 rounded-lg border border-purple-200 text-[11px] text-purple-900 leading-relaxed">
                  Perhitungan SLA Penyelesaian (RT) akan <strong>resmi dimulai sekarang</strong> berdasarkan tingkat urgensi <strong>{modalUrgency}</strong> dan tiket masuk daftar kerja PIC terpilih.
                </div>
              </div>
            )}

            {/* Sub-form Need More Info (3e) */}
            {actionType === 'need-info' && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>Kembalikan Tiket ke Pelapor (Need More Info · Auto-Close 3x24 Jam)</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Gunakan status ini jika bukti atau kronologi dari pelapor kurang lengkap. <strong>SLA Penyelesaian tidak akan berjalan</strong> sampai pelapor membalas. Jika tidak ada balasan dalam <strong>3x24 jam (72 jam)</strong>, sistem otomatis menutup tiket (Closed – Auto).
                </p>
              </div>
            )}

            {/* Sub-form Tahap 3: Pemeriksaan & Penjadwalan oleh Teknisi */}
            {actionType === 'jadwalkan-inspeksi' && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <CalendarClock className="w-4 h-4 text-blue-700" />
                  <span>Tahap 3: Jadwalkan Waktu Pemeriksaan / Inspeksi</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jadwal Waktu Pemeriksaan Teknisi: <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={jadwalInspeksiModal}
                    onChange={e => setJadwalInspeksiModal(e.target.value)}
                    placeholder="Contoh: 08/11/2026 pukul 09:30 WIB (Pemeriksaan di Lab FKIP)"
                    className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>

                <p className="text-[11px] text-blue-800 leading-relaxed bg-white/70 p-2.5 rounded border border-blue-200">
                  Status tiket akan berubah menjadi <strong>In Progress / Sedang Diproses</strong>. Pelapor dapat melihat jadwal estimasi kehadiran teknisi di pelacak tiket.
                </p>
              </div>
            )}

            {/* Sub-form Tahap 4: Tindakan Perbaikan (Execution) */}
            {actionType === 'perbaikan' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Wrench className="w-4 h-4 text-slate-700" />
                  <span>Tahap 4: Diagnosis & Penentuan Skenario Perbaikan</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Skenario Penanganan:
                  </label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-2 p-2.5 bg-white border rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="skenario"
                        checked={skenarioModal === 'Non-Fisik (Remote/Server)'}
                        onChange={() => setSkenarioModal('Non-Fisik (Remote/Server)')}
                        className="mt-0.5"
                      />
                      <div>
                        <strong className="text-slate-900 block">Skenario A: Aset Non-Fisik (Sistem, Jaringan, Software)</strong>
                        <span className="text-slate-500 text-[11px]">
                          Perbaikan langsung dari jarak jauh (Remote) atau di ruang server. Langsung lanjut ke Penyelesaian.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2.5 bg-white border rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="skenario"
                        checked={skenarioModal === 'Fisik (On-site)'}
                        onChange={() => {
                          setSkenarioModal('Fisik (On-site)');
                          setDibawaKePusdatin(false);
                        }}
                        className="mt-0.5"
                      />
                      <div>
                        <strong className="text-slate-900 block">Skenario B: Aset Fisik &mdash; Perbaikan On-site</strong>
                        <span className="text-slate-500 text-[11px]">
                          Teknisi mendatangi lokasi perangkat dan melakukan perbaikan langsung di tempat.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2.5 bg-white border rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="skenario"
                        checked={skenarioModal === 'Fisik (Bawa ke PUSDATIN)'}
                        onChange={() => {
                          setSkenarioModal('Fisik (Bawa ke PUSDATIN)');
                          setDibawaKePusdatin(true);
                        }}
                        className="mt-0.5"
                      />
                      <div>
                        <strong className="text-slate-900 block">Skenario B: Aset Fisik &mdash; Bawa ke Lab PUSDATIN</strong>
                        <span className="text-slate-500 text-[11px]">
                          Perangkat membutuhkan alat khusus dan dipindahkan sementara ke Lab Service PUSDATIN.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-form Tahap 4 (Cabang B1): Butuh Suku Cadang -> Pending Procurement */}
            {actionType === 'suku-cadang' && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <PackageSearch className="w-4 h-4 text-amber-700" />
                    <span>Tahap 4.a: Butuh Suku Cadang &rarr; Pending Procurement</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded-full">
                    {komponenList.length} Komponen Terdata
                  </span>
                </div>

                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Saat memilih Tahap 4.a, status menjadi <strong>Pending – Menunggu Suku Cadang</strong> dan perhitungan <strong>SLA terjeda (Pause)</strong> otomatis hingga teknisi melanjutkan ke Tahap 5.
                </p>

                {/* Input Komponen */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Input Nama Komponen Spare Part:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKomponenInput}
                      onChange={e => setNewKomponenInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKomponen();
                        }
                      }}
                      placeholder="Misal: RAM DDR4 8GB, Fan Processor, Roller Karet..."
                      className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-medium text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddKomponen}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>

                  {/* List of Added Components */}
                  <div className="flex flex-wrap gap-1.5 p-1 bg-white/70 rounded-lg border border-amber-200 min-h-[40px]">
                    {komponenList.length === 0 ? (
                      <span className="text-slate-400 text-xs italic p-1">Belum ada komponen yang ditambahkan.</span>
                    ) : (
                      komponenList.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-950 shadow-2xs"
                        >
                          <PackageSearch className="w-3 h-3 text-amber-600" />
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKomponen(idx)}
                            className="text-slate-400 hover:text-red-600 ml-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-form Tahap 4.b: Vendor Eksternal (3c) */}
            {actionType === 'vendor-eksternal' && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-950">
                  <Globe className="w-4 h-4 text-cyan-700" />
                  <span>Tahap 4.b: Menunggu Vendor Eksternal / ISP (SLA Terjeda)</span>
                </div>
                <p className="text-[11px] text-cyan-900 leading-relaxed">
                  Gunakan tahapan ini jika gangguan berasal dari pihak di luar kendali kampus (misal: gangguan jaringan ISP atau klaim garansi resmi vendor). <strong>Timer SLA terjeda</strong> hingga pihak eksternal selesai.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Vendor / ISP Eksternal:
                    </label>
                    <input
                      type="text"
                      value={vendorEksternalNama}
                      onChange={e => setVendorEksternalNama(e.target.value)}
                      placeholder="Contoh: PT Telkom Astinet / Biznet / Service Center ASUS"
                      className="w-full px-3 py-2 bg-white border border-cyan-300 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Tiket / Referensi Vendor:
                    </label>
                    <input
                      type="text"
                      value={vendorEksternalTiket}
                      onChange={e => setVendorEksternalTiket(e.target.value)}
                      placeholder="Contoh: INC-ISP-20261113"
                      className="w-full px-3 py-2 bg-white border border-cyan-300 rounded-lg font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sub-form Eskalasi Insiden -> Problem / Request for Change (3d) */}
            {actionType === 'eskalasi-problem-rfc' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                  <GitBranch className="w-4 h-4 text-indigo-700" />
                  <span>Tutup Insiden via Workaround &amp; Buat Tiket Problem / RFC</span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Jika perbaikan memerlukan bongkar arsitektur atau coding ulang aplikasi, berikan <strong>Workaround</strong> (solusi sementara) untuk menutup Insiden harian ini (SLA harian aman), lalu terbitkan tiket jangka panjang bertipe <strong>Problem</strong> atau <strong>RFC</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jenis Tiket Baru: <span className="text-red-600">*</span>
                    </label>
                    <select
                      data-testid="escalate-target-type"
                      value={targetProblemType}
                      onChange={e => {
                        const next = e.target.value as 'Problem' | 'RFC';
                        setTargetProblemType(next);
                        setProblemTargetHoursInput(
                          next === 'RFC'
                            ? (slaConfig.RFC || DEFAULT_SLA_CONFIG.RFC!).rtTargetHours
                            : (slaConfig.Problem || DEFAULT_SLA_CONFIG.Problem!).rtTargetHours
                        );
                      }}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-bold text-slate-900"
                    >
                      <option value="Problem">Problem Ticket (Akar Masalah Sistem)</option>
                      <option value="RFC">Request for Change / RFC (Perubahan Sistem)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Target SLA Panjang (Jam):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={24}
                        value={problemTargetHoursInput}
                        onChange={e => setProblemTargetHoursInput(Math.max(24, Number(e.target.value) || 336))}
                        className="w-28 px-3 py-2 bg-white border border-indigo-300 rounded-lg font-mono font-bold text-slate-900"
                      />
                      <span className="text-[11px] text-indigo-800 font-semibold">
                        ≈ {Math.round((problemTargetHoursInput / 24) * 10) / 10} hari
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Workaround / Solusi Sementara untuk Pengguna: <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    data-testid="workaround-input"
                    value={workaroundInput}
                    onChange={e => setWorkaroundInput(e.target.value)}
                    placeholder="Contoh: Gunakan portal cadangan atau export CSV manual sementara modul SIAKAD direfaktor..."
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Tiket {targetProblemType}:
                  </label>
                  <input
                    type="text"
                    value={problemJudulInput}
                    onChange={e => setProblemJudulInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Sub-form Tahap 5: Lanjutkan Perbaikan */}
            {actionType === 'lanjut-perbaikan' && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Tahap 5: Kendala Suku Cadang / Vendor Selesai &mdash; Lanjutkan Perbaikan</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Status tiket kembali menjadi <strong>In Progress</strong> dan <strong>jam SLA kembali aktif berjalan</strong> (durasi masa jeda dikeluarkan otomatis dari hitungan RT).
                </p>
              </div>
            )}

            {/* Sub-form Tahap 4.c: Rusak Total (Beyond Economic Repair) */}
            {actionType === 'rusak-total' && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                  <AlertOctagon className="w-4 h-4 text-rose-700" />
                  <span>Tahap 4.c: Rusak Total (Beyond Economic Repair) &rarr; Afkir</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Teknisi mendiagnosis barang tidak dapat diselamatkan secara teknis atau biaya perbaikan melampaui nilai ekonomis aset. Proses perbaikan dihentikan, barang masuk gudang afkir/penghapusan. Status Aset otomatis menjadi <strong>Tidak Layak / Afkir</strong> dan Tiket menjadi <strong>Closed</strong>.
                </p>
              </div>
            )}

            {/* Sub-form Tahap 5: Penyelesaian & Pembaruan Status (Resolution & Closure) */}
            {actionType === 'selesai' && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Tahap 6: Penyelesaian & Pembaruan Status (Resolution & Closure)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Rincian Resolusi Akhir: <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={resolusiAkhirModal}
                    onChange={e => setResolusiAkhirModal(e.target.value)}
                    placeholder="Contoh: Penggantian pasta thermal & cleaning kipas pendingin tuntas normal..."
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Pembaruan Status Aset Berdasarkan Skenario: <span className="text-red-600">*</span>
                  </label>
                  {selectedTicket.jenisAset === 'Non-Fisik' ? (
                    <div className="p-3 bg-white border border-emerald-300 rounded-lg text-xs">
                      <span className="font-bold text-emerald-900 block">Aset Non-Fisik:</span>
                      <span className="text-emerald-800">
                        Status Aset otomatis diperbarui menjadi <strong>"Berfungsi Kembali"</strong>.
                      </span>
                    </div>
                  ) : (
                    <select
                      value={statusAsetBaru}
                      onChange={e => handleStatusAsetBaruChange(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900"
                    >
                      <option value="Digunakan">
                        Digunakan (Dikembalikan ke Lokasi Semula / User Awal)
                      </option>
                      <option value="Tersedia">
                        Tersedia di PUSDATIN (Ditarik sebagai Stok Cadangan)
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Lokasi Penempatan Akhir Aset:
                  </label>
                  <input
                    type="text"
                    required
                    value={lokasiTujuan}
                    onChange={e => setLokasiTujuan(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold"
                  />
                </div>

                <p className="text-[11px] text-emerald-800 leading-relaxed bg-white/70 p-2 rounded border border-emerald-200">
                  Status Tiket otomatis menjadi <strong>Closed / Selesai</strong> dan status operasional aset diperbarui di katalog master.
                </p>
              </div>
            )}

            {/* Sub-form Delegasikan */}
            {actionType === 'delegasikan' && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-900">
                  <Users className="w-4 h-4 text-violet-700" />
                  <span>Internal: Alihkan Tiket ke Teknisi Lain</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pilih Peran / Bidang Teknisi Penerima Delegasi:
                  </label>
                  <select
                    value={targetDelegasiId}
                    onChange={e => setTargetDelegasiId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-violet-300 rounded-lg text-xs font-bold text-slate-900"
                  >
                    {delegatableTechnicians.map(tc => (
                      <option key={tc.id} value={tc.id}>
                        {tc.roleName || tc.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Sub-form Ubah PIC */}
            {actionType === 'ubah-pic' && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                  <UserCheck className="w-4 h-4 text-sky-700" />
                  <span>Alihkan Tugas ke Peran PIC Lain</span>
                </div>
                <select
                  value={reassignedPic}
                  onChange={e => setReassignedPic(e.target.value as TechnicianRole)}
                  className="w-full px-3 py-2 bg-white border border-sky-300 rounded-lg text-xs font-bold text-slate-900"
                >
                  {availableRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Catatan Admin / Teknisi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Catatan Progres / Log Tindakan:
              </label>
              <textarea
                rows={2}
                value={catatanAdmin}
                onChange={e => setCatatanAdmin(e.target.value)}
                placeholder="Tuliskan catatan teknis atau keterangan tindakan..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProcessSubmit}
                className="px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                {isProcessing ? 'Menyimpan...' : 'Simpan Pembaruan SOP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Damage Creation Modal */}
      {showInternalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Catat Temuan Kerusakan Internal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInternalModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInternalSubmit} className="space-y-3.5 text-xs">
              {internalError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
                  {internalError}
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Barcode Aset (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={internalBarcode}
                    onChange={e => handleSelectAssetForInternal(e.target.value)}
                    placeholder="Scan atau ketik kode barcode..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInternalScanner(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Perangkat / Aset <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={internalNamaBarang}
                  onChange={e => setInternalNamaBarang(e.target.value)}
                  placeholder="Misal: Printer Epson L3210 di Lab 1"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lokasi Temuan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={internalLokasi}
                  onChange={e => setInternalLokasi(e.target.value)}
                  placeholder="Misal: Lab Komputer 1 (Kampus 1)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi Kerusakan / Kendala <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={internalDeskripsi}
                  onChange={e => setInternalDeskripsi(e.target.value)}
                  placeholder="Rincian kendala yang ditemukan..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={internalUrgensi}
                    onChange={e => setInternalUrgensi(e.target.value as TicketUrgency)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  >
                    <option value="Kritis">🔥 Kritis</option>
                    <option value="Tinggi">⚠️ Tinggi</option>
                    <option value="Sedang">⚡ Sedang</option>
                    <option value="Rendah">🟢 Rendah</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Tiket Awal
                  </label>
                  <select
                    value={internalStatus}
                    onChange={e => setInternalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  >
                    <option value="Open">1. Open / Baru</option>
                    <option value="Assigned">2. Assigned (Didelegasikan)</option>
                    <option value="In Progress">3. In Progress (Langsung Diproses)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInternalModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 cursor-pointer font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {isProcessing ? 'Menyimpan...' : 'Simpan Temuan Kerusakan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Scanner Modal */}
      {showInternalScanner && (
        <BarcodeScannerModal
          isOpen={showInternalScanner}
          onClose={() => setShowInternalScanner(false)}
          onScanSuccess={(detectedCode) => {
            handleSelectAssetForInternal(detectedCode);
            setShowInternalScanner(false);
          }}
        />
      )}

      {/* Post-Process WhatsApp Dispatch Modal */}
      {damageDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">
                Status Berhasil Diperbarui!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {damageDispatchModal.message}
              </p>
            </div>

            {damageDispatchModal.waUrl ? (
              <a
                href={damageDispatchModal.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Kirim Notifikasi WhatsApp ke Pelapor</span>
              </a>
            ) : null}

            <button
              type="button"
              onClick={() => setDamageDispatchModal(null)}
              className="w-full py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfigurasi Kebijakan SLA (FRT & RT) per Urgensi */}
      {showSlaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <span>Pengaturan Target SLA Helpdesk (FRT & RT)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur batas waktu First Response Time (menit) dan Resolution Time (jam) berdasarkan tingkat urgensi tiket.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSlaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlaConfig} className="space-y-4 text-xs">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Jenis / Urgensi Tiket</th>
                      <th className="px-4 py-2.5">Target FRT (Menit)</th>
                      <th className="px-4 py-2.5">Target RT (Jam)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(['Kritis', 'Tinggi', 'Sedang', 'Rendah'] as TicketUrgency[]).map(level => (
                      <tr key={level}>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{level} (Insiden)</td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min={1}
                            required
                            data-testid={`sla-frt-${level}`}
                            value={slaDraft[level].frtTargetMinutes}
                            onChange={e =>
                              setSlaDraft(prev => ({
                                ...prev,
                                [level]: {
                                  ...prev[level],
                                  frtTargetMinutes: Math.max(1, Number(e.target.value) || 1)
                                }
                              }))
                            }
                            className="w-28 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min={1}
                            required
                            data-testid={`sla-rt-${level}`}
                            value={slaDraft[level].rtTargetHours}
                            onChange={e =>
                              setSlaDraft(prev => ({
                                ...prev,
                                [level]: {
                                  ...prev[level],
                                  rtTargetHours: Math.max(1, Number(e.target.value) || 1)
                                }
                              }))
                            }
                            className="w-28 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </td>
                      </tr>
                    ))}
                    {(['Problem', 'RFC'] as const).map(longKey => {
                      const ruleVal = slaDraft[longKey] || DEFAULT_SLA_CONFIG[longKey]!;
                      return (
                        <tr key={longKey} className="bg-indigo-50/40">
                          <td className="px-4 py-2.5 font-bold text-indigo-950">
                            {longKey === 'Problem' ? 'Problem Ticket' : 'Change Request (RFC)'}
                            <span className="block text-[10px] font-normal text-indigo-700">
                              Jangka Panjang ({Math.round(ruleVal.rtTargetHours / 24)} hari)
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              min={1}
                              required
                              data-testid={`sla-frt-${longKey}`}
                              value={ruleVal.frtTargetMinutes}
                              onChange={e =>
                                setSlaDraft(prev => ({
                                  ...prev,
                                  [longKey]: {
                                    ...ruleVal,
                                    frtTargetMinutes: Math.max(1, Number(e.target.value) || 1)
                                  }
                                }))
                              }
                              className="w-28 px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-slate-900"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              min={1}
                              required
                              data-testid={`sla-rt-${longKey}`}
                              value={ruleVal.rtTargetHours}
                              onChange={e =>
                                setSlaDraft(prev => ({
                                  ...prev,
                                  [longKey]: {
                                    ...ruleVal,
                                    rtTargetHours: Math.max(1, Number(e.target.value) || 1)
                                  }
                                }))
                              }
                              className="w-28 px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-slate-900"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSlaDraft(DEFAULT_SLA_CONFIG)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Reset ke Standar Awal
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSlaModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    data-testid="save-sla-policy-btn"
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Simpan Kebijakan SLA
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pilihan Cetak Evaluasi Nilai SLA Teknisi (Admin & Pimpinan PUSDATIN) */}
      {showSlaPrintSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span>Cetak Evaluasi Nilai SLA Teknisi PUSDATIN</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cetak laporan performa SLA individu untuk masing-masing teknisi atau rekapan menyeluruh untuk evaluasi Admin &amp; Kepala PUSDATIN.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSlaPrintSelector(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Jenis Laporan Evaluasi SLA</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="sla-print-mode-recap"
                    onClick={() => setSlaPrintMode('recap')}
                    className={`px-3 py-2 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                      slaPrintMode === 'recap'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Rekap Seluruh Teknisi
                  </button>
                  <button
                    type="button"
                    data-testid="sla-print-mode-individual"
                    onClick={() => setSlaPrintMode('individual')}
                    className={`px-3 py-2 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                      slaPrintMode === 'individual'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Per Teknisi (Individu)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Bulan (Opsional)</label>
                <input
                  type="month"
                  value={slaPrintMonth}
                  onChange={e => setSlaPrintMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            {slaPrintMode === 'individual' && (
              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">Pilih Teknisi / PIC PUSDATIN</label>
                <select
                  data-testid="sla-print-tech-select"
                  value={slaPrintTechId}
                  onChange={e => setSlaPrintTechId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  {pusdatinTechnicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.nama} — {tech.roleName} ({tech.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Preview Tabel Skor SLA Teknisi */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Teknisi</th>
                    <th className="px-3 py-2 text-center">Tiket</th>
                    <th className="px-3 py-2 text-center">Selesai</th>
                    <th className="px-3 py-2 text-center">FRT %</th>
                    <th className="px-3 py-2 text-center">RT %</th>
                    <th className="px-3 py-2 text-center">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const periodTickets = slaPrintMonth
                      ? tickets.filter(t => (t.createdAtIso || t.tanggalLapor || '').startsWith(slaPrintMonth))
                      : tickets;
                    const rows = computeTechnicianSlaBreakdown(periodTickets, pusdatinTechnicians, slaConfig);
                    const filteredRows =
                      slaPrintMode === 'individual'
                        ? rows.filter(r => r.technicianId === slaPrintTechId)
                        : rows;
                    return filteredRows.map(r => (
                      <tr key={r.technicianId} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <span className="font-bold text-slate-900 block">{r.technicianName}</span>
                          <span className="text-[10px] text-slate-500">{r.roleName}</span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold">{r.totalTickets}</td>
                        <td className="px-3 py-2 text-center font-mono text-emerald-700 font-bold">{r.resolvedCount}</td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-indigo-700">{r.frtComplianceRate}%</td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-emerald-700">{r.rtComplianceRate}%</td>
                        <td className="px-3 py-2 text-center font-mono text-rose-700 font-bold">
                          {r.frtOverdueCount + r.rtOverdueCount}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSlaPrintSelector(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                data-testid="sla-print-proceed-signatory-btn"
                onClick={() => {
                  setPendingSlaPrint({
                    mode: slaPrintMode,
                    techId: slaPrintMode === 'individual' ? slaPrintTechId : undefined,
                    periodMonth: slaPrintMonth
                  });
                  setShowSlaPrintSelector(false);
                }}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Lanjut Konfirmasi Penandatangan &amp; Cetak PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfigurasi Penandatangan Resmi untuk Cetak Nilai SLA */}
      <SignatoryConfirmModal
        isOpen={Boolean(pendingSlaPrint)}
        documentTitle={
          pendingSlaPrint?.mode === 'individual'
            ? 'Laporan Nilai SLA & Kinerja Individu Teknisi'
            : 'Rekapitulasi Evaluasi Nilai SLA Seluruh Teknisi PUSDATIN'
        }
        onClose={() => setPendingSlaPrint(null)}
        onConfirm={handleConfirmSlaPrintPdf}
        showPetugas={true}
        defaultPetugas={
          pendingSlaPrint?.mode === 'individual'
            ? pusdatinTechnicians.find(t => t.id === pendingSlaPrint.techId)?.nama || activeTech?.nama
            : currentUser?.nama
        }
      />
    </div>
  );
};
