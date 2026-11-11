import React, { useState } from 'react';
import {
  Code,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Paperclip
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { SystemProposal } from '../../types';
import { WhatsAppNotificationService } from '../../services/whatsappService';

interface SystemProposalFormProps {
  onSuccessSubmit?: (proposal: SystemProposal) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SystemProposalForm: React.FC<SystemProposalFormProps> = ({
  onSuccessSubmit,
  onNavigateTab
}) => {
  const activeUser = AppDatabase.getActiveUser();

  const [form, setForm] = useState({
    namaSistem: '',
    pemohon: activeUser.nama || 'Dr. Hendra Wijaya, M.Pd.',
    unitKerja: activeUser.unit || 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    nidnNik: '0419087502',
    kontakWhatsapp: activeUser.phone || '081234567890',
    email: activeUser.email || 'hendra.dosen@umc.ac.id',
    deskripsiKebutuhan: '',
    latarBelakang: '',
    targetPengguna: 'Dosen, Mahasiswa, dan Tenaga Kependidikan UMC',
    namaDokumenTor: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdProposal, setCreatedProposal] = useState<SystemProposal | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaSistem || !form.deskripsiKebutuhan || !form.latarBelakang) {
      alert('Mohon lengkapi Nama Sistem, Deskripsi Kebutuhan, dan Latar Belakang!');
      return;
    }

    const docs = form.namaDokumenTor ? [
      {
        namaDokumen: form.namaDokumenTor,
        tipe: 'TOR' as const,
        urlOrFilename: form.namaDokumenTor,
        tanggalUpload: new Date().toLocaleString('id-ID')
      }
    ] : [];

    const proposal = AppDatabase.addSystemProposal({
      namaSistem: form.namaSistem,
      pemohon: form.pemohon,
      unitKerja: form.unitKerja,
      nidnNik: form.nidnNik,
      kontakWhatsapp: form.kontakWhatsapp,
      email: form.email,
      deskripsiKebutuhan: form.deskripsiKebutuhan,
      latarBelakang: form.latarBelakang,
      targetPengguna: form.targetPengguna,
      dokumenTeknis: docs
    });

    setCreatedProposal(proposal);
    setIsSubmitted(true);
    if (onSuccessSubmit) onSuccessSubmit(proposal);
  };

  if (isSubmitted && createdProposal) {
    const waUrl = WhatsAppNotificationService.getSystemProposalStatusUrl(
      createdProposal,
      'Tahap 1: Verifikasi Kelengkapan Dokumen oleh Admin',
      'Pengajuan Anda telah tercatat di PUSDATIN UMC.'
    );

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto shadow-xs space-y-4">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Pengajuan Sistem Baru Berhasil Terkirim!</h2>
        <p className="text-xs text-slate-500">
          Nomor Registrasi Pengajuan Anda:
        </p>
        <div className="font-mono text-lg font-extrabold text-cyan-800 bg-cyan-50 py-2 px-4 rounded-xl border border-cyan-200 inline-block">
          {createdProposal.id}
        </div>

        <div className="p-4 bg-slate-50 rounded-xl text-left text-xs text-slate-600 space-y-1.5 border border-slate-200">
          <div>Nama Sistem: <strong>{createdProposal.namaSistem}</strong></div>
          <div>Unit Pengusul: <strong>{createdProposal.unitKerja}</strong></div>
          <div>Tahapan Selanjutnya: <strong>Tahap 1: Verifikasi Berkas (Admin PUSDATIN)</strong></div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              Kirim Tanda Terima ke WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setCreatedProposal(null);
              setForm({
                namaSistem: '',
                pemohon: activeUser.nama,
                unitKerja: activeUser.unit,
                nidnNik: '0419087502',
                kontakWhatsapp: activeUser.phone,
                email: activeUser.email,
                deskripsiKebutuhan: '',
                latarBelakang: '',
                targetPengguna: 'Dosen, Mahasiswa, dan Tenaga Kependidikan UMC',
                namaDokumenTor: ''
              });
            }}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700"
          >
            Ajukan Sistem Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-cyan-100 text-cyan-800 text-xs font-bold font-mono">
            F-DEV-01
          </span>
          <h1 className="text-xl font-bold text-slate-900">Pengajuan Sistem Baru & Fitur Aplikasi</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Civitas akademika (Dosen, Fakultas, Program Studi, Unit Kerja) dapat mengajukan usulan aplikasi atau sistem informasi baru untuk dikaji dan dikembangkan oleh tim PUSDATIN UMC.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Pemohon (Otomatis dari SSO Google)</label>
            <input
              type="text"
              required
              value={form.pemohon}
              onChange={e => setForm({ ...form, pemohon: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Unit Kerja / Fakultas / Prodi</label>
            <input
              type="text"
              required
              value={form.unitKerja}
              onChange={e => setForm({ ...form, unitKerja: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">NIDN / NIK / NIM</label>
            <input
              type="text"
              required
              value={form.nidnNik}
              onChange={e => setForm({ ...form, nidnNik: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp Aktif (Notifikasi)</label>
            <input
              type="tel"
              required
              value={form.kontakWhatsapp}
              onChange={e => setForm({ ...form, kontakWhatsapp: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Resmi Civitas (@umc.ac.id)</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Nama Usulan Sistem / Aplikasi Baru</label>
          <input
            type="text"
            required
            placeholder="Contoh: Sistem Informasi Manajemen Yudisium & Ijazah Digital UMC"
            value={form.namaSistem}
            onChange={e => setForm({ ...form, namaSistem: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Deskripsi Kebutuhan & Fitur Utama yang Diharapkan</label>
          <textarea
            rows={3}
            required
            placeholder="Jelaskan alur yang dibutuhkan, input data, siapa yang mengisi, dan output apa yang diinginkan..."
            value={form.deskripsiKebutuhan}
            onChange={e => setForm({ ...form, deskripsiKebutuhan: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Latar Belakang Permasalahan & Urgensi</label>
          <textarea
            rows={2}
            required
            placeholder="Apa kendala saat ini yang dihadapi jika sistem belum dibangun? Mengapa mendesak?"
            value={form.latarBelakang}
            onChange={e => setForm({ ...form, latarBelakang: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Target Pengguna Sistem</label>
          <input
            type="text"
            value={form.targetPengguna}
            onChange={e => setForm({ ...form, targetPengguna: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Lampiran Dokumen TOR / Spesifikasi Teknis (Opsional - F-DEV-03)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: TOR_Pengembangan_Sistem_Yudisium_v1.pdf"
              value={form.namaDokumenTor}
              onChange={e => setForm({ ...form, namaDokumenTor: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Kirim Pengajuan Sistem Baru (F-DEV-01)
          </button>
        </div>
      </form>
    </div>
  );
};
