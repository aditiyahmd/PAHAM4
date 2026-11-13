import React, { useRef, useState } from 'react';
import {
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Upload,
  Trash2,
  Download
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { SystemProposal } from '../../types';
import { WhatsAppNotificationService } from '../../services/whatsappService';

interface UploadedAttachment {
  id: string;
  namaDokumen: string;
  tipe: 'TOR' | 'Arsitektur' | 'Uji Keamanan' | 'Manual Panduan';
  urlOrFilename: string;
  tanggalUpload: string;
  fileDataUrl: string;
  fileSize: number;
  mimeType: string;
}

const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface SystemProposalFormProps {
  onSuccessSubmit?: (proposal: SystemProposal) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SystemProposalForm: React.FC<SystemProposalFormProps> = ({
  onSuccessSubmit
}) => {
  const activeUser = AppDatabase.getActiveUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    namaSistem: '',
    pemohon: activeUser.nama || 'Dr. Hendra Wijaya, M.Pd.',
    unitKerja: activeUser.unit || 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    nidnNik: '0419087502',
    kontakWhatsapp: activeUser.phone || '081234567890',
    email: activeUser.email || 'hendra.dosen@umc.ac.id',
    deskripsiKebutuhan: '',
    latarBelakang: '',
    targetPengguna: 'Dosen, Mahasiswa, dan Tenaga Kependidikan UMC'
  });

  const [selectedDocType, setSelectedDocType] = useState<'TOR' | 'Arsitektur' | 'Uji Keamanan' | 'Manual Panduan'>('TOR');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [formError, setFormError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdProposal, setCreatedProposal] = useState<SystemProposal | null>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        setFormError(
          `File "${file.name}" melebihi batas ukuran 5 MB (${formatBytes(file.size)}). Mohon pilih file yang lebih kecil.`
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const resultDataUrl = typeof reader.result === 'string' ? reader.result : '';
        const newDoc: UploadedAttachment = {
          id: `DOC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          namaDokumen: file.name,
          tipe: selectedDocType,
          urlOrFilename: file.name,
          tanggalUpload: new Date().toLocaleString('id-ID'),
          fileDataUrl: resultDataUrl,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream'
        };
        setAttachments(prev => [...prev, newDoc]);
      };
      reader.onerror = () => {
        setFormError(`Gagal membaca file "${file.name}". Silakan coba lagi.`);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.namaSistem.trim() || !form.deskripsiKebutuhan.trim() || !form.latarBelakang.trim()) {
      setFormError('Mohon lengkapi Nama Sistem, Deskripsi Kebutuhan, dan Latar Belakang.');
      return;
    }

    if (attachments.length === 0) {
      setFormError('Lampiran dokumen (TOR / Surat Permohonan / Spesifikasi) wajib diunggah sebelum mengirim pengajuan!');
      return;
    }

    const proposal = AppDatabase.addSystemProposal({
      namaSistem: form.namaSistem.trim(),
      pemohon: form.pemohon.trim(),
      unitKerja: form.unitKerja.trim(),
      nidnNik: form.nidnNik.trim(),
      kontakWhatsapp: form.kontakWhatsapp.trim(),
      email: form.email.trim(),
      deskripsiKebutuhan: form.deskripsiKebutuhan.trim(),
      latarBelakang: form.latarBelakang.trim(),
      targetPengguna: form.targetPengguna.trim(),
      dokumenTeknis: attachments.map(att => ({
        namaDokumen: att.namaDokumen,
        tipe: att.tipe,
        urlOrFilename: att.urlOrFilename,
        tanggalUpload: att.tanggalUpload,
        fileDataUrl: att.fileDataUrl,
        fileSize: att.fileSize,
        mimeType: att.mimeType
      }))
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
          <div>Lampiran Dokumen: <strong>{createdProposal.dokumenTeknis?.length || 0} File Terunggah</strong></div>
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
              setAttachments([]);
              setFormError('');
              setForm({
                namaSistem: '',
                pemohon: activeUser.nama,
                unitKerja: activeUser.unit,
                nidnNik: '0419087502',
                kontakWhatsapp: activeUser.phone,
                email: activeUser.email,
                deskripsiKebutuhan: '',
                latarBelakang: '',
                targetPengguna: 'Dosen, Mahasiswa, dan Tenaga Kependidikan UMC'
              });
            }}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
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
          <h1 className="text-xl font-bold text-slate-900">Pengajuan Sistem Baru &amp; Fitur Aplikasi</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Civitas akademika (Dosen, Fakultas, Program Studi, Unit Kerja) dapat mengajukan usulan aplikasi atau sistem informasi baru lengkap dengan dokumen lampiran untuk dikaji tim PUSDATIN UMC.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          data-testid="proposal-form-error"
          className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

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
          <label className="block font-semibold text-slate-700 mb-1">
            Nama Usulan Sistem / Aplikasi Baru <span className="text-red-600">*</span>
          </label>
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
          <label className="block font-semibold text-slate-700 mb-1">
            Deskripsi Kebutuhan &amp; Fitur Utama yang Diharapkan <span className="text-red-600">*</span>
          </label>
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
          <label className="block font-semibold text-slate-700 mb-1">
            Latar Belakang Permasalahan &amp; Urgensi <span className="text-red-600">*</span>
          </label>
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

        {/* Upload File Lampiran Dokumen */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block font-bold text-slate-800 text-xs">
                Unggah Lampiran Dokumen Pendukung (TOR / Surat Permohonan / Spesifikasi) <span className="text-red-600">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Format didukung: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Maks. 5 MB per file). Bisa mengunggah lebih dari 1 file.
              </p>
            </div>

            <select
              value={selectedDocType}
              onChange={e => setSelectedDocType(e.target.value as any)}
              aria-label="Jenis Dokumen Lampiran"
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="TOR">TOR / Kerangka Acuan</option>
              <option value="Arsitektur">Dokumen Spesifikasi / Alur</option>
              <option value="Manual Panduan">Draft / Contoh Formulir</option>
              <option value="Uji Keamanan">Dokumen Kepatuhan / Keamanan</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              ref={fileInputRef}
              id="proposal-attachment-input"
              data-testid="proposal-attachment-input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFilesSelected}
              className="hidden"
            />
            <button
              type="button"
              data-testid="upload-attachment-btn"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-white hover:bg-cyan-50 text-cyan-800 border border-dashed border-cyan-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors w-full"
            >
              <Upload className="w-4 h-4 text-cyan-700" />
              <span>Pilih &amp; Upload File Lampiran dari Komputer</span>
            </button>
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-2" data-testid="uploaded-attachments-list">
              <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                <span>{attachments.length} Dokumen Lampiran Siap Dikirim:</span>
              </div>
              {attachments.map(att => (
                <div
                  key={att.id}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-cyan-700 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{att.namaDokumen}</div>
                      <div className="text-[10px] text-slate-500">
                        <span className="font-semibold text-cyan-800">{att.tipe}</span> · {formatBytes(att.fileSize)} · {att.tanggalUpload}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={att.fileDataUrl}
                      download={att.namaDokumen}
                      className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg"
                      title="Unduh file lampiran"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      aria-label={`Hapus lampiran ${att.namaDokumen}`}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Hapus lampiran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 text-center py-2 bg-white/70 rounded-lg border border-slate-200">
              Belum ada file lampiran diunggah. Wajib melampirkan minimal 1 dokumen pendukung.
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            data-testid="submit-proposal-btn"
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
