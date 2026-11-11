import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { EmailNotificationService } from '../../services/emailService';
import { LoanTicket } from '../../types';
import { SubmissionSuccessModal } from '../Modals/SubmissionSuccessModal';
import { Send, CheckCircle2, Calendar, User, Building, Phone, Mail, Package, AlertCircle } from 'lucide-react';

interface LoanFormProps {
  onSuccessSubmit: (ticket: LoanTicket) => void;
  onNavigateTab?: (tabId: string, searchTicketId?: string) => void;
}

export const LoanForm: React.FC<LoanFormProps> = ({ onSuccessSubmit, onNavigateTab }) => {
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [unit, setUnit] = useState('');
  const [kontak, setKontak] = useState('');
  const [email, setEmail] = useState('');
  const [jenisBarang, setJenisBarang] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [tglPinjam, setTglPinjam] = useState(new Date().toISOString().split('T')[0]);
  const [tglKembali, setTglKembali] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [catatan, setCatatan] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<LoanTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const assets = AppDatabase.getAssets();
  const availableAssets = assets.filter(a => a.status === 'Tersedia');
  const masterLocations = AppDatabase.getMasterLocations();

  // Check if selected item is unavailable
  const matchedAsset = assets.find(a =>
    jenisBarang.trim() && (
      a.nama.toLowerCase() === jenisBarang.trim().toLowerCase() ||
      a.barcode === jenisBarang.trim()
    )
  );
  const isItemUnavailable = matchedAsset && matchedAsset.status !== 'Tersedia';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !nik || !unit || !kontak || !jenisBarang) {
      alert('Harap lengkapi semua kolom wajib!');
      return;
    }

    if (isItemUnavailable) {
      alert(`Peminjaman Ditolak: Perangkat "${matchedAsset?.nama}" sedang berstatus "${matchedAsset?.status}" dan tidak dapat dipinjam.`);
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const dateCode = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newId = `PJM-${dateCode}-${randomCode}`;

    const newLoan: LoanTicket = {
      id: newId,
      peminjam: nama.trim(),
      nik: nik.trim(),
      unit: unit.trim(),
      kontak: kontak.trim(),
      email: email.trim() || `${nik.trim().replace(/[^a-zA-Z0-9]/g, '')}@umc.ac.id`,
      barangPinjaman: jenisBarang.trim(),
      jumlah: Number(jumlah) || 1,
      tglPinjam,
      tglKembali,
      status: 'Menunggu',
      catatan: catatan.trim(),
      tglAju: now.toLocaleString('id-ID'),
      emailTerkirim: true
    };

    setTimeout(async () => {
      AppDatabase.addLoan(newLoan);
      await EmailNotificationService.sendLoanSubmitted(newLoan);
      setSubmittedTicket(newLoan);
      setShowSuccessModal(true);
      setIsSubmitting(false);
      onSuccessSubmit(newLoan);

      // Reset form
      setNama('');
      setNik('');
      setUnit('');
      setKontak('');
      setEmail('');
      setJenisBarang('');
      setJumlah(1);
      setCatatan('');
    }, 350);
  };


  return (
    <div className="space-y-6">
      {/* Banner / Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Formulir Pengajuan Peminjaman Aset
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Layanan peminjaman perangkat IT, multimedia, dan perlengkapan inventaris PUSDATIN UMC untuk sivitas akademika, dosen, tenaga kependidikan, dan organisasi mahasiswa.
            </p>
          </div>
        </div>
      </div>

      {submittedTicket && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-base">Pengajuan Berhasil Terkirim!</p>
              <p className="text-sm text-emerald-800 mt-0.5">
                Simpan nomor tiket: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-700">{submittedTicket.id}</span>
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Notifikasi email konfirmasi telah dikirimkan ke <strong>{submittedTicket.email}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedTicket(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs"
          >
            Tutup Pesan
          </button>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nama Peminjam */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Lengkap Peminjam <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Contoh: Hilyah Aulia, S.T. / Ahmad Fauzi"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>
          </div>

          {/* NIDN / NIK / NIM */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              NIDN / NIK / NIM <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={nik}
              onChange={e => setNik(e.target.value)}
              placeholder="Contoh: 0412088501 / 20210819001"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
            />
          </div>

          {/* Unit Kerja / Prodi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Unit Kerja / Fakultas / Prodi <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="Contoh: Biro BAU / Fakultas Teknik Informatika"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>
          </div>

          {/* Kontak / WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nomor WhatsApp / HP Aktif <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={kontak}
                onChange={e => setKontak(e.target.value)}
                placeholder="Contoh: 085964531388"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>
          </div>

          {/* Email Institusi untuk Notifikasi Otomatis */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Penerima Notifikasi Status (Otomatis)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Contoh: nama.anda@umc.ac.id (Wajib untuk menerima email persetujuan otomatis)"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sistem akan mengirimkan email konfirmasi saat pengajuan diterima, saat disetujui, dan saat barang dikembalikan.
            </p>
          </div>

          {/* Jenis Barang */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Jenis Barang yang Dibutuhkan <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              list="ready-assets-list"
              value={jenisBarang}
              onChange={e => setJenisBarang(e.target.value)}
              placeholder="Pilih atau ketik: Laptop ASUS, Proyektor, HDMI..."
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                isItemUnavailable
                  ? 'border-red-400 focus:ring-red-500/20 focus:border-red-600 bg-red-50/50'
                  : 'border-slate-200 focus:ring-red-500/20 focus:border-red-600'
              }`}
            />
            <datalist id="ready-assets-list">
              {availableAssets.map(a => (
                <option key={a.barcode} value={a.nama}>
                  Tersedia di {a.lokasi}
                </option>
              ))}
            </datalist>

            {/* Quick Suggestion Pills of Available Items */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500">Siap Pinjam:</span>
              {availableAssets.slice(0, 3).map(a => (
                <button
                  key={a.barcode}
                  type="button"
                  onClick={() => setJenisBarang(a.nama)}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-colors"
                >
                  {a.nama}
                </button>
              ))}
            </div>

            {/* Warning if Item is Damaged or Currently Used */}
            {isItemUnavailable && (
              <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p>Aset ini sedang berstatus <strong>"{matchedAsset?.status}"</strong> ({matchedAsset?.lokasi}).</p>
                  <p className="font-normal text-[11px] mt-0.5">Sesuai SOP, barang yang rusak, dalam perbaikan, atau sedang digunakan di ruangan tidak dapat dipinjam.</p>
                </div>
              </div>
            )}
          </div>

          {/* Jumlah */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Jumlah Total Unit <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={jumlah}
              onChange={e => setJumlah(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
            />
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tanggal Rencana Pinjam <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                required
                value={tglPinjam}
                onChange={e => setTglPinjam(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>
          </div>

          {/* Tanggal Selesai */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tanggal Rencana Pengembalian <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                required
                value={tglKembali}
                onChange={e => setTglKembali(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>
          </div>

          {/* Keperluan / Catatan */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Keterangan Kebutuhan / Acara
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Tuliskan tujuan peminjaman (contoh: Ujian Sidang Skripsi, Workshop Pembelajaran, Rapat Pleno Fakultas)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Peminjaman wajib dikembalikan tepat waktu dalam kondisi fisik utuh.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Peminjaman'}</span>
          </button>
        </div>
      </form>

      {/* Global Interactive Success Modal for Civitas */}
      <SubmissionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        ticketType="loan"
        loanTicket={submittedTicket}
        onNavigateToCheckProgress={ticketId => {
          if (onNavigateTab) {
            onNavigateTab('cek-progres', ticketId);
          }
        }}
      />
    </div>
  );
};

