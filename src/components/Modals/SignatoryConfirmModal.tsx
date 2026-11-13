import React, { useEffect, useState } from 'react';
import { X, PenTool, Printer, CheckCircle2, RefreshCw } from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { DocumentSignatories } from '../../types';

export interface ConfirmedSignatoryValues {
  kepalaPusdatin: string;
  nipKepala: string;
  petugas: string;
  pimpinanUniv?: string;
  pimpinanUnivJabatan?: string;
  pimpinanUnivNip?: string;
}

interface SignatoryConfirmModalProps {
  isOpen: boolean;
  documentTitle: string;
  onClose: () => void;
  onConfirm: (values: ConfirmedSignatoryValues) => void;
  showPetugas?: boolean;
  showPimpinanUniv?: boolean;
  defaultPetugas?: string;
}

export const SignatoryConfirmModal: React.FC<SignatoryConfirmModalProps> = ({
  isOpen,
  documentTitle,
  onClose,
  onConfirm,
  showPetugas = true,
  showPimpinanUniv = false,
  defaultPetugas
}) => {
  const [form, setForm] = useState<ConfirmedSignatoryValues>({
    kepalaPusdatin: '',
    nipKepala: '',
    petugas: '',
    pimpinanUniv: '',
    pimpinanUnivJabatan: '',
    pimpinanUnivNip: ''
  });
  const [saveAsMaster, setSaveAsMaster] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const sig = AppDatabase.getDocumentSignatories();
      const active = AppDatabase.getActiveUser();
      setForm({
        kepalaPusdatin: sig.kepalaPusdatinNama,
        nipKepala: sig.kepalaPusdatinNip,
        petugas: defaultPetugas || active.nama || sig.petugasDefaultNama,
        pimpinanUniv: sig.pimpinanUnivNama,
        pimpinanUnivJabatan: sig.pimpinanUnivJabatan,
        pimpinanUnivNip: sig.pimpinanUnivNip
      });
      setSaveAsMaster(false);
    }
  }, [isOpen, defaultPetugas]);

  if (!isOpen) return null;

  const handleResetFromMaster = () => {
    const sig = AppDatabase.getDocumentSignatories();
    setForm({
      kepalaPusdatin: sig.kepalaPusdatinNama,
      nipKepala: sig.kepalaPusdatinNip,
      petugas: defaultPetugas || sig.petugasDefaultNama,
      pimpinanUniv: sig.pimpinanUnivNama,
      pimpinanUnivJabatan: sig.pimpinanUnivJabatan,
      pimpinanUnivNip: sig.pimpinanUnivNip
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveAsMaster) {
      const current: DocumentSignatories = AppDatabase.getDocumentSignatories();
      AppDatabase.setDocumentSignatories({
        ...current,
        kepalaPusdatinNama: form.kepalaPusdatin.trim() || current.kepalaPusdatinNama,
        kepalaPusdatinNip: form.nipKepala.trim(),
        petugasDefaultNama: form.petugas.trim() || current.petugasDefaultNama,
        ...(showPimpinanUniv
          ? {
              pimpinanUnivNama: (form.pimpinanUniv || '').trim() || current.pimpinanUnivNama,
              pimpinanUnivJabatan: (form.pimpinanUnivJabatan || '').trim() || current.pimpinanUnivJabatan,
              pimpinanUnivNip: (form.pimpinanUnivNip || '').trim()
            }
          : {})
      });
    }
    onConfirm(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-sm">
                Konfirmasi Penandatangan Dokumen
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {documentTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            aria-label="Tutup modal konfirmasi penandatangan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-[11px] text-slate-600">
            <span>Mengikuti data Master Penandatangan Dokumen PUSDATIN. Sesuaikan bila pejabat berubah.</span>
            <button
              type="button"
              onClick={handleResetFromMaster}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 shrink-0 cursor-pointer"
              title="Muat ulang dari Master Penandatangan"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Muat Master</span>
            </button>
          </div>

          {showPimpinanUniv && (
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2.5">
              <div className="text-[11px] font-bold text-amber-900">
                Pimpinan Universitas (Rektor / Wakil Rektor)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Pimpinan Universitas
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="signatory-pimpinan-nama"
                    value={form.pimpinanUniv || ''}
                    onChange={e => setForm({ ...form, pimpinanUniv: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jabatan Pimpinan
                  </label>
                  <input
                    type="text"
                    value={form.pimpinanUnivJabatan || ''}
                    onChange={e => setForm({ ...form, pimpinanUnivJabatan: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Kepala PUSDATIN <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                data-testid="signatory-kepala-nama"
                value={form.kepalaPusdatin}
                onChange={e => setForm({ ...form, kepalaPusdatin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                NIDN / NIP Kepala PUSDATIN
              </label>
              <input
                type="text"
                data-testid="signatory-kepala-nip"
                value={form.nipKepala}
                onChange={e => setForm({ ...form, nipKepala: e.target.value })}
                placeholder="NIDN. ..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>

          {showPetugas && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Petugas Penyerah / Pengelola <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                data-testid="signatory-petugas-nama"
                value={form.petugas}
                onChange={e => setForm({ ...form, petugas: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          )}

          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-slate-700">
            <input
              type="checkbox"
              checked={saveAsMaster}
              onChange={e => setSaveAsMaster(e.target.checked)}
              className="rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-[11px] font-semibold">
              Simpan perubahan ini ke Master Penandatangan Dokumen permanen
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              data-testid="confirm-signatory-print-btn"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Lanjutkan Cetak PDF</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
