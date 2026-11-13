import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShoppingBag,
  PackageCheck,
  AlertTriangle,
  Flame,
  ArrowRight,
  User,
  Tag,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { AppDatabase, SparePartWithTicket } from '../../services/db';
import { SparePartStatus, TicketUrgency } from '../../types';
import { PdfReportService } from '../../services/pdfReportService';
import { SignatoryConfirmModal, ConfirmedSignatoryValues } from '../Modals/SignatoryConfirmModal';

interface SparePartsManagementViewProps {
  onDataChanged: () => void;
}

export const SparePartsManagementView: React.FC<SparePartsManagementViewProps> = ({ onDataChanged }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | SparePartStatus>('Semua');
  const [urgencyFilter, setUrgencyFilter] = useState<'Semua' | TicketUrgency>('Semua');
  const [selectedPart, setSelectedPart] = useState<SparePartWithTicket | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<SparePartStatus>('Sudah Dibeli');
  const [statusNote, setStatusNote] = useState('');
  const [isSignatoryModalOpen, setIsSignatoryModalOpen] = useState(false);

  const allParts = AppDatabase.getAllSpareParts();

  const filteredParts = allParts.filter(part => {
    const matchesSearch =
      part.namaKomponen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.namaPicTeknisi && part.namaPicTeknisi.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'Semua' || part.statusPengadaan === statusFilter;
    const matchesUrgency = urgencyFilter === 'Semua' || part.urgensi === urgencyFilter;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Metrics
  const totalParts = allParts.length;
  const belumDibeli = allParts.filter(p => p.statusPengadaan === 'Belum Dibeli').length;
  const sudahDibeli = allParts.filter(p => p.statusPengadaan === 'Sudah Dibeli').length;
  const sudahDigunakan = allParts.filter(p => p.statusPengadaan === 'Sudah Digunakan').length;

  const handleOpenStatusModal = (part: SparePartWithTicket) => {
    setSelectedPart(part);
    setNewStatus(part.statusPengadaan === 'Belum Dibeli' ? 'Sudah Dibeli' : 'Sudah Digunakan');
    setStatusNote('');
    setStatusModalOpen(true);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;

    const res = AppDatabase.updateSparePartStatus(
      selectedPart.ticketId,
      selectedPart.sparePartId,
      newStatus,
      undefined,
      statusNote.trim() || undefined
    );

    if (res.success) {
      setStatusModalOpen(false);
      setSelectedPart(null);
      onDataChanged();
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  const getUrgencyBadge = (urgensi: TicketUrgency) => {
    switch (urgensi) {
      case 'Kritis':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
            <Flame className="w-2.5 h-2.5" />
            Kritis
          </span>
        );
      case 'Tinggi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
            <AlertTriangle className="w-2.5 h-2.5" />
            Tinggi
          </span>
        );
      case 'Sedang':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            Sedang
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Rendah
          </span>
        );
    }
  };

  const getStatusBadge = (status: SparePartStatus) => {
    switch (status) {
      case 'Belum Dibeli':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            Belum Dibeli
          </span>
        );
      case 'Sudah Dibeli':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <ShoppingBag className="w-3 h-3 text-sky-700" />
            Sudah Dibeli (Stok Siap)
          </span>
        );
      case 'Sudah Digunakan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Sudah Digunakan / Dipasang
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Explanation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Pusat Kebutuhan & Pengadaan Suku Cadang Aset
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-md border border-red-200">
                Akses Penuh
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau seluruh komponen yang dibutuhkan pada tiket kerusakan. Perbarui status apakah suku cadang <strong>Belum Dibeli</strong>, <strong>Sudah Dibeli</strong>, atau <strong>Sudah Digunakan</strong> oleh teknisi.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Komponen Dibutuhkan</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalParts}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Semua tiket perbaikan</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Belum Dibeli</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-950">{belumDibeli}</div>
          <p className="text-[11px] text-amber-800 mt-0.5">Menunggu anggaran / belanja kampus</p>
        </div>

        <div className="bg-white rounded-2xl border border-sky-200 bg-sky-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900">Sudah Dibeli</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-950">{sudahDibeli}</div>
          <p className="text-[11px] text-sky-800 mt-0.5">Siap dipasang di Lab PUSDATIN</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Sudah Digunakan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-950">{sudahDigunakan}</div>
          <p className="text-[11px] text-emerald-800 mt-0.5">Tuntas dipasang pada aset</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nama komponen, nama aset, barcode, PIC..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="Semua">Semua Status</option>
              <option value="Belum Dibeli">Belum Dibeli ({belumDibeli})</option>
              <option value="Sudah Dibeli">Sudah Dibeli ({sudahDibeli})</option>
              <option value="Sudah Digunakan">Sudah Digunakan ({sudahDigunakan})</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Urgensi:</span>
            <select
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="Semua">Semua Urgensi</option>
              <option value="Kritis">Kritis</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Rendah">Rendah</option>
            </select>
          </div>

          {/* Cetak Laporan Suku Cadang PDF */}
          <button
            type="button"
            onClick={() => setIsSignatoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Cetak Rekap Kebutuhan Suku Cadang berdasarkan status yang dipilih"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF ({statusFilter})</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredParts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada data komponen suku cadang yang cocok.</p>
            <p className="text-xs text-slate-400">Silakan sesuaikan kata kunci pencarian atau filter status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nama Komponen / Suku Cadang</th>
                  <th className="px-4 py-3">Aset & Tiket Terkait</th>
                  <th className="px-4 py-3">Urgensi</th>
                  <th className="px-4 py-3">Teknisi / PIC</th>
                  <th className="px-4 py-3">Status Pengadaan</th>
                  <th className="px-4 py-3">Riwayat Waktu</th>
                  <th className="px-4 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.map(part => (
                  <tr key={part.sparePartId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Component Name */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{part.namaKomponen}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {part.sparePartId}
                      </div>
                    </td>

                    {/* Ticket & Asset */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{part.namaBarang}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-indigo-600 font-bold">{part.ticketId}</span>
                        <span>&bull;</span>
                        <span>{part.lokasi}</span>
                      </div>
                    </td>

                    {/* Urgency */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getUrgencyBadge(part.urgensi)}
                    </td>

                    {/* Technician */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{part.namaPicTeknisi || 'Tim PUSDATIN'}</div>
                      <div className="text-[10px] text-slate-500">{part.picTeknisi || '-'}</div>
                    </td>

                    {/* Procurement Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(part.statusPengadaan)}
                    </td>

                    {/* Timeline */}
                    <td className="px-4 py-3.5 text-[11px] text-slate-600 whitespace-nowrap">
                      <div>Dibutuhkan: <strong className="text-slate-800">{part.tanggalKebutuhan || '-'}</strong></div>
                      {part.tanggalBeli && (
                        <div className="text-sky-700">Dibeli: <strong>{part.tanggalBeli}</strong></div>
                      )}
                      {part.tanggalDigunakan && (
                        <div className="text-emerald-700">Digunakan: <strong>{part.tanggalDigunakan}</strong></div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(part)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Ubah Status</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Update Status Suku Cadang */}
      {statusModalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Update Status Pengadaan Suku Cadang
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tiket: {selectedPart.ticketId} &bull; {selectedPart.namaBarang}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-xs text-slate-500">Komponen yang diperbarui:</div>
                <div className="text-sm font-black text-slate-900">{selectedPart.namaKomponen}</div>
                <div className="text-xs text-slate-600">
                  PIC Penanganan: <strong>{selectedPart.namaPicTeknisi}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Status Pengadaan Baru:
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      newStatus === 'Belum Dibeli'
                        ? 'border-amber-500 bg-amber-50/60 font-bold text-amber-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="partStatus"
                        checked={newStatus === 'Belum Dibeli'}
                        onChange={() => setNewStatus('Belum Dibeli')}
                      />
                      <span>⏳ Belum Dibeli (Menunggu Pengadaan / Anggaran)</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      newStatus === 'Sudah Dibeli'
                        ? 'border-sky-500 bg-sky-50/60 font-bold text-sky-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="partStatus"
                        checked={newStatus === 'Sudah Dibeli'}
                        onChange={() => setNewStatus('Sudah Dibeli')}
                      />
                      <span>🛒 Sudah Dibeli (Tersedia / Siap Dipasang)</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      newStatus === 'Sudah Digunakan'
                        ? 'border-emerald-500 bg-emerald-50/60 font-bold text-emerald-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="partStatus"
                        checked={newStatus === 'Sudah Digunakan'}
                        onChange={() => setNewStatus('Sudah Digunakan')}
                      />
                      <span>✅ Sudah Digunakan / Dipasang pada Aset</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Pengadaan / Pemasangan (Opsional):
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="Contoh: Dibeli di Toko Komputer Cirebon / Sudah dipasang oleh teknisi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <SignatoryConfirmModal
        isOpen={isSignatoryModalOpen}
        documentTitle={`Laporan Pengadaan Suku Cadang (${statusFilter})`}
        onClose={() => setIsSignatoryModalOpen(false)}
        onConfirm={(values: ConfirmedSignatoryValues) => {
          const doc = PdfReportService.generateSparePartsPdf(filteredParts, statusFilter, {
            kepalaPusdatin: values.kepalaPusdatin,
            nipKepala: values.nipKepala,
            petugas: values.petugas
          });
          const safeStatus = statusFilter.replace(/[^a-zA-Z0-9_-]/g, '_');
          doc.save(`Laporan_Suku_Cadang_${safeStatus}_${new Date().toISOString().split('T')[0]}.pdf`);
        }}
      />
    </div>
  );
};
