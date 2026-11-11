import React, { useState } from 'react';
import { EmailNotificationService } from '../../services/emailService';
import { EmailLog } from '../../types';
import { Mail, CheckCircle2, Clock, X, ExternalLink, Send } from 'lucide-react';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  if (!isOpen) return null;

  const logs = EmailNotificationService.getLogs();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Log Notifikasi Email Otomatis
              </h3>
              <p className="text-xs text-slate-500">
                Riwayat pesan terkirim ke civitas kampus saat status peminjaman berubah.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
          {/* List of Sent Emails */}
          <div className="border border-slate-200 rounded-xl overflow-y-auto divide-y divide-slate-100">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada log pengiriman email.
              </div>
            ) : (
              logs.map(log => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => setSelectedLog(log)}
                  className={`w-full text-left p-3.5 transition-colors ${
                    selectedLog?.id === log.id
                      ? 'bg-blue-50/70 border-l-3 border-blue-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {log.ticketId}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="font-semibold text-xs text-slate-900 line-clamp-1">
                    {log.subject}
                  </p>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span className="line-clamp-1">{log.to}</span>
                    <span className="text-emerald-700 font-bold shrink-0">Terkirim</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Email Preview Panel */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col overflow-y-auto">
            {selectedLog ? (
              <div className="space-y-3">
                <div className="pb-3 border-b border-slate-200 text-xs space-y-1">
                  <p><strong>Subjek:</strong> {selectedLog.subject}</p>
                  <p><strong>Kepada:</strong> {selectedLog.recipientName} &lt;{selectedLog.to}&gt;</p>
                  <p><strong>ID Tiket:</strong> {selectedLog.ticketId}</p>
                  <p className="text-slate-400">
                    <strong>Waktu:</strong> {new Date(selectedLog.timestamp).toLocaleString('id-ID')}
                  </p>
                </div>

                <div
                  className="bg-white rounded-lg p-3 text-xs border border-slate-200"
                  dangerouslySetInnerHTML={{ __html: selectedLog.bodyHtml }}
                />
              </div>
            ) : (
              <div className="my-auto text-center text-xs text-slate-400 p-6">
                Pilih salah satu log di sebelah kiri untuk melihat pratinjau pesan email yang diterima peminjam.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
