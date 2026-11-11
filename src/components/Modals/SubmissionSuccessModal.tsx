import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Search,
  Printer,
  X,
  Sparkles,
  Calendar,
  Building,
  User,
  ArrowRight
} from 'lucide-react';
import { LoanTicket, DamageTicket } from '../../types';
import { WhatsAppNotificationService } from '../../services/whatsappService';

interface SubmissionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketType: 'loan' | 'damage';
  loanTicket?: LoanTicket | null;
  damageTicket?: DamageTicket | null;
  onNavigateToCheckProgress?: (ticketId: string) => void;
}

export const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
  isOpen,
  onClose,
  ticketType,
  loanTicket,
  damageTicket,
  onNavigateToCheckProgress
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const ticketId = ticketType === 'loan' ? loanTicket?.id : damageTicket?.id;
  const applicantName = ticketType === 'loan' ? loanTicket?.peminjam : damageTicket?.pelapor;
  const itemName = ticketType === 'loan' ? (loanTicket?.barangPinjaman || loanTicket?.namaBarangT) : damageTicket?.namaBarang;
  const userEmail = ticketType === 'loan' ? loanTicket?.email : damageTicket?.emailPelapor;
  const userPhone = ticketType === 'loan' ? loanTicket?.kontak : damageTicket?.kontakPelapor;

  const waUrl =
    ticketType === 'loan' && loanTicket
      ? WhatsAppNotificationService.getLoanSubmittedCivitasUrl(loanTicket)
      : ticketType === 'damage' && damageTicket
      ? WhatsAppNotificationService.getDamageSubmittedCivitasUrl(damageTicket)
      : null;

  const handleCopyTicket = () => {
    if (ticketId) {
      navigator.clipboard.writeText(ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header Badge */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-xs border border-white/30 shadow-md">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs border border-white/30 inline-block mb-1">
            {ticketType === 'loan' ? 'Peminjaman Terdaftar' : 'Laporan Kerusakan Terdaftar'}
          </span>

          <h3 className="text-xl font-extrabold text-white">
            Pengajuan Berhasil Dikirim!
          </h3>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto">
            Sistem PAHAM telah mencatat berkas Anda dan mengirimkan tanda terima otomatis.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Ticket ID Box with One-Click Copy */}
          <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Nomor Tiket Registrasi Anda
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black font-mono tracking-wider text-emerald-700 bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                {ticketId}
              </span>
              <button
                type="button"
                onClick={handleCopyTicket}
                className="p-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1 transition-colors"
                title="Salin Nomor Tiket"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] text-emerald-600">Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span className="text-[11px] hidden sm:inline">Salin</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Anda tidak perlu menghafal kode ini karena sudah tersimpan di email & WhatsApp Anda.
            </p>
          </div>

          {/* Quick Summary Details */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-200/70">
              <span className="text-slate-500">Nama Pemohon:</span>
              <span className="font-bold text-slate-800">{applicantName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/70">
              <span className="text-slate-500">Perangkat / Aset:</span>
              <span className="font-bold text-slate-800">{itemName}</span>
            </div>
            {ticketType === 'loan' && loanTicket && (
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-500">Jadwal Pinjam:</span>
                <span className="font-bold text-slate-800">{loanTicket.tglPinjam} s/d {loanTicket.tglKembali}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Notifikasi Dikirim ke:</span>
              <span className="font-semibold text-emerald-700">{userEmail || userPhone}</span>
            </div>
          </div>

          {/* Direct Actions: WhatsApp & Check Progress */}
          <div className="space-y-2.5 pt-1">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Simpan / Buka Bukti Tiket di WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                if (ticketId && onNavigateToCheckProgress) {
                  onNavigateToCheckProgress(ticketId);
                }
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Pantau Status Penanganan Tiket Ini</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg"
          >
            Tutup & Buat Ajuan Lain
          </button>
        </div>
      </div>
    </div>
  );
};
