import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { DamageTicket, AssetStatus } from '../../types';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Wrench,
  Clock,
  Filter,
  MapPin,
  Building
} from 'lucide-react';

interface DamageTicketManagementProps {
  onDataChanged: () => void;
}

export const DamageTicketManagement: React.FC<DamageTicketManagementProps> = ({ onDataChanged }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [selectedTicket, setSelectedTicket] = useState<DamageTicket | null>(null);

  // Modal actions
  const [actionType, setActionType] = useState<'terima' | 'perbaikan' | 'selesai'>('terima');
  const [catatanAdmin, setCatatanAdmin] = useState('');
  const [statusAsetBaru, setStatusAsetBaru] = useState<AssetStatus>('Tersedia');
  const [dibawaKePusdatin, setDibawaKePusdatin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Internal damage ticket creation states (temuan tim pusdatin)
  const [showInternalModal, setShowInternalModal] = useState(false);
  const [internalBarcode, setInternalBarcode] = useState('');
  const [internalNamaBarang, setInternalNamaBarang] = useState('');
  const [internalLokasi, setInternalLokasi] = useState('');
  const [internalPelapor, setInternalPelapor] = useState('Tim Teknis PUSDATIN (Internal)');
  const [internalDeskripsi, setInternalDeskripsi] = useState('');
  const [internalUrgensi, setInternalUrgensi] = useState<'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis'>('Sedang');
  const [internalStatus, setInternalStatus] = useState<'Diterima' | 'Perbaikan'>('Diterima');
  const [internalMetode, setInternalMetode] = useState<'Di Lokasi' | 'Dibawa ke PUSDATIN'>('Dibawa ke PUSDATIN');

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
      alert('Harap isi nama perangkat dan deskripsi kerusakan!');
      return;
    }

    setIsProcessing(true);
    const created = AppDatabase.createInternalDamageTicket({
      barcode: internalBarcode.trim() || 'Tanpa Barcode',
      namaBarang: internalNamaBarang.trim(),
      lokasi: internalLokasi.trim() || 'Ruang PUSDATIN Kampus 1',
      deskripsi: internalDeskripsi.trim(),
      pelapor: internalPelapor.trim(),
      status: internalStatus,
      metodePerbaikan: internalMetode,
      urgensi: internalUrgensi
    });

    setTimeout(() => {
      setIsProcessing(false);
      setShowInternalModal(false);
      // Reset form
      setInternalBarcode('');
      setInternalNamaBarang('');
      setInternalLokasi('');
      setInternalDeskripsi('');
      onDataChanged();
      alert(`Berhasil mencatat temuan kerusakan internal (${created.id})! Status aset telah diperbarui.`);
    }, 250);
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.pelapor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.barcode.includes(searchTerm);

    const matchesStatus = statusFilter === 'Semua' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openProcessModal = (t: DamageTicket) => {
    setSelectedTicket(t);
    setActionType(t.status === 'Baru' ? 'terima' : t.status === 'Diterima' ? 'perbaikan' : 'selesai');
    setCatatanAdmin(t.catatanAdmin || '');
    setDibawaKePusdatin(t.metodePerbaikan === 'Dibawa ke PUSDATIN');
    setStatusAsetBaru('Tersedia');
  };

  const handleProcessSubmit = () => {
    if (!selectedTicket) return;

    setIsProcessing(true);
    const res = AppDatabase.processDamageTicket(selectedTicket.id, actionType, {
      catatanAdmin,
      statusAsetBaru,
      dibawaKePusdatin
    });

    setTimeout(() => {
      setIsProcessing(false);
      setSelectedTicket(null);
      onDataChanged();
      alert(res.message);
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Manajemen Tiket Kerusakan & Servis</span>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              {filteredTickets.length} Laporan
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pantau laporan kendala perangkat sivitas dan input temuan kerusakan dari pengecekan rutin tim teknis PUSDATIN UMC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowInternalModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>+ Catat Temuan Aset Rusak (Pemeriksaan Tim)</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200">
              Antrean: {tickets.filter(t => t.status === 'Baru' || t.status === 'Diterima').length}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200">
              Perbaikan: {tickets.filter(t => t.status === 'Perbaikan').length}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              Selesai: {tickets.filter(t => t.status === 'Selesai').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari ID tiket, nama barang, pelapor, lokasi..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-lg border border-slate-200/80">
          {['Semua', 'Baru', 'Diterima', 'Perbaikan', 'Selesai'].map(st => (
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
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Damage Tickets */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">ID Tiket</th>
                <th className="px-4 py-3.5">Perangkat & Barcode</th>
                <th className="px-4 py-3.5">Lokasi & Pelapor</th>
                <th className="px-4 py-3.5">Deskripsi Gejala</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Tgl Lapor</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-amber-700 whitespace-nowrap">
                    {t.id}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900">{t.namaBarang}</p>
                    <span className="font-mono text-[11px] text-slate-500">
                      BC: {t.barcode || 'Tanpa Barcode'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{t.lokasi}</p>
                    <p className="text-[11px] text-slate-500">{t.pelapor}</p>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <p className="line-clamp-2 text-slate-700">{t.deskripsi}</p>
                    {t.catatanAdmin && (
                      <p className="text-[11px] text-blue-700 mt-0.5 line-clamp-1 italic">
                        Teknisi: {t.catatanAdmin}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                      t.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'Perbaikan' ? 'bg-blue-100 text-blue-800' :
                      t.status === 'Diterima' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                    {t.tanggalLapor}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openProcessModal(t)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                    >
                      Tindak Lanjuti
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Proses Tiket Kerusakan
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedTicket.id} · {selectedTicket.namaBarang}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tindakan Penanganan Teknisi
              </label>
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              >
                <option value="terima">Terima & Jadwalkan Pemeriksaan</option>
                <option value="perbaikan">Mulai Proses Perbaikan / Servis</option>
                <option value="selesai">Selesai Diperbaiki (Kembalikan ke Operasional)</option>
              </select>
            </div>

            {actionType === 'perbaikan' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Metode Lokasi Penanganan:
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="metode"
                      checked={!dibawaKePusdatin}
                      onChange={() => setDibawaKePusdatin(false)}
                      className="text-red-600"
                    />
                    <span>Perbaikan di Lokasi Unit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="metode"
                      checked={dibawaKePusdatin}
                      onChange={() => setDibawaKePusdatin(true)}
                      className="text-red-600"
                    />
                    <span>Bawa ke Ruang PUSDATIN (Lab Service)</span>
                  </label>
                </div>
              </div>
            )}

            {actionType === 'selesai' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status Akhir Aset Setelah Diperbaiki
                </label>
                <select
                  value={statusAsetBaru}
                  onChange={e => setStatusAsetBaru(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Tersedia">Tersedia (Siap Digunakan Kembali)</option>
                  <option value="Digunakan">Digunakan (Langsung Terpasang di Ruangan)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Catatan Teknisi / Tindakan yang Dilakukan
              </label>
              <textarea
                rows={3}
                value={catatanAdmin}
                onChange={e => setCatatanAdmin(e.target.value)}
                placeholder="Tuliskan komponen yang diganti atau perbaikan yang dilakukan..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProcessSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                {isProcessing ? 'Menyimpan...' : 'Simpan Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Temuan Kerusakan Internal PUSDATIN */}
      {showInternalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Catat Temuan Kerusakan Aset (Pemeriksaan Internal)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Input hasil inspeksi atau pengecekan berkala tim teknis PUSDATIN UMC
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInternalModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInternalSubmit} className="space-y-4">
              {/* Pilih Aset Terdaftar atau Ketik Manual */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih dari Master Data Aset Kampus (Opsional untuk Auto-Fill)
                </label>
                <select
                  value={internalBarcode}
                  onChange={e => handleSelectAssetForInternal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                >
                  <option value="">-- Pilih Aset Terdaftar / Ketik Barcode di Bawah --</option>
                  {allAssets.map(a => (
                    <option key={a.barcode} value={a.barcode}>
                      [{a.barcode}] {a.nama} ({a.lokasi}) - Status: {a.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barcode Aset <span className="text-slate-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={internalBarcode}
                    onChange={e => setInternalBarcode(e.target.value)}
                    placeholder="Contoh: 20495812"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Barang / Perangkat <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={internalNamaBarang}
                    onChange={e => setInternalNamaBarang(e.target.value)}
                    placeholder="Contoh: PC All-in-One Lab 3 / Switch Core"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi Temuan Perangkat
                  </label>
                  <input
                    type="text"
                    value={internalLokasi}
                    onChange={e => setInternalLokasi(e.target.value)}
                    placeholder="Contoh: Lab Komputer 2 Kampus 1"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Petugas / Teknisi Pemeriksa
                  </label>
                  <input
                    type="text"
                    value={internalPelapor}
                    onChange={e => setInternalPelapor(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={internalUrgensi}
                    onChange={e => setInternalUrgensi(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Rendah">Rendah (Pemeliharaan Berkala)</option>
                    <option value="Sedang">Sedang (Kendala Parsial)</option>
                    <option value="Tinggi">Tinggi (Mengganggu Operasional)</option>
                    <option value="Kritis">Kritis (Perangkat Mati Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Awal Penanganan
                  </label>
                  <select
                    value={internalStatus}
                    onChange={e => setInternalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Diterima">Diterima (Antrean Servis)</option>
                    <option value="Perbaikan">Langsung Mulai Perbaikan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Perbaikan
                  </label>
                  <select
                    value={internalMetode}
                    onChange={e => setInternalMetode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Dibawa ke PUSDATIN">Dibawa ke Lab PUSDATIN</option>
                    <option value="Di Lokasi">Perbaikan di Lokasi Unit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Kerusakan / Gejala yang Ditemukan <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={internalDeskripsi}
                  onChange={e => setInternalDeskripsi(e.target.value)}
                  placeholder="Jelaskan kondisi fisik atau malfungsi yang ditemukan saat inspeksi (misal: Layar flickering, port LAN tidak terdeteksi, power supply konslet)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                ⚠️ Jika barcode diisi, status aset di katalog inventaris otomatis akan diubah menjadi <strong>Rusak</strong> / <strong>Diperbaiki</strong> sehingga tidak dapat dipinjam oleh sivitas lain.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInternalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                >
                  {isProcessing ? 'Menyimpan...' : 'Simpan Temuan Kerusakan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
