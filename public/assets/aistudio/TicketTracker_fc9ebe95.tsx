import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { PdfReportService } from '../../services/pdfReportService';
import { Search, CheckCircle2, Clock, AlertTriangle, FileText, ArrowRight, Printer } from 'lucide-react';
import { LoanTicket, DamageTicket } from '../../types';

export const TicketTracker: React.FC = () => {
  const [query, setQuery] = useState('');
  const [matchedLoans, setMatchedLoans] = useState<LoanTicket[]>([]);
  const [matchedDamages, setMatchedDamages] = useState<DamageTicket[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (keywordToSearch?: string) => {
    const q = (keywordToSearch ?? query).trim().toLowerCase();
    if (!q) return;

    const allLoans = AppDatabase.getLoans();
    const allDamages = AppDatabase.getDamageTickets();

    const loans = allLoans.filter(l =>
      l.id.toLowerCase().includes(q) ||
      l.peminjam.toLowerCase().includes(q) ||
      (l.barcode && l.barcode.toLowerCase().includes(q)) ||
      l.barangPinjaman.toLowerCase().includes(q) ||
      l.nik.toLowerCase().includes(q)
    );

    const damages = allDamages.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.barcode.toLowerCase().includes(q) ||
      d.namaBarang.toLowerCase().includes(q) ||
      d.pelapor.toLowerCase().includes(q)
    );

    setMatchedLoans(loans);
    setMatchedDamages(damages);
    setHasSearched(true);
  };

  const downloadReceipt = (loan: LoanTicket) => {
    const doc = PdfReportService.generateLoanReceiptPdf(loan);
    const fileName = loan.status === 'Dikembalikan'
      ? `Berita_Acara_Pengembalian_${loan.id}.pdf`
      : `Berita_Acara_Peminjaman_${loan.id}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Cek Progres Laporan & Tiket Peminjaman
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pantau status penanganan peminjaman aset maupun progres perbaikan barang secara real-time menggunakan ID Tiket atau Barcode.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Masukkan ID Tiket (PJM-... / TKT-...) atau Barcode Aset..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            Lacak Tiket
          </button>
        </div>

        {/* Quick Suggestion Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-500">
          <span>Contoh cepat:</span>
          <button
            type="button"
            onClick={() => { setQuery('PJM-20261107-1042'); handleSearch('PJM-20261107-1042'); }}
            className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
          >
            PJM-20261107-1042
          </button>
          <button
            type="button"
            onClick={() => { setQuery('PJM-20261105-0814'); handleSearch('PJM-20261105-0814'); }}
            className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
          >
            PJM-20261105-0814
          </button>
          <button
            type="button"
            onClick={() => { setQuery('TKT-20261107-101'); handleSearch('TKT-20261107-101'); }}
            className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
          >
            TKT-20261107-101
          </button>
        </div>
      </div>

      {/* Results View */}
      {hasSearched && (
        <div className="space-y-6">
          {matchedLoans.length === 0 && matchedDamages.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Data Tiket Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Pastikan nomor ID Tiket atau Barcode yang Anda masukkan sudah benar. Anda juga dapat mencari berdasarkan nama peminjam atau pelapor.
              </p>
            </div>
          ) : (
            <>
              {/* Matched Loans */}
              {matchedLoans.map(loan => {
                const isWaiting = loan.status === 'Menunggu';
                const isApproved = loan.status === 'Disetujui';
                const isReturned = loan.status === 'Dikembalikan';
                const isRejected = loan.status === 'Ditolak';

                return (
                  <div key={loan.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* Header Strip */}
                    <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-red-700">{loan.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            Peminjaman Aset
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Diajukan oleh: <strong>{loan.peminjam}</strong> ({loan.unit}) · Diajukan pada: {loan.tglAju}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => downloadReceipt(loan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-red-600" />
                            <span>Cetak Bukti Pinjam (PDF)</span>
                          </button>
                        )}

                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' :
                          isWaiting ? 'bg-amber-100 text-amber-800' :
                          isReturned ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {loan.status}
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Steps */}
                    <div className="p-6 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Alur Verifikasi Peminjaman:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        {/* Step 1 */}
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            ✓
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">1. Pengajuan</p>
                            <p className="text-[11px] text-slate-500">Tiket masuk antrean</p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isApproved || isReturned ? 'bg-emerald-600 text-white' :
                            isWaiting ? 'bg-amber-500 text-white animate-pulse' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            {isApproved || isReturned ? '✓' : '2'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">2. Verifikasi</p>
                            <p className="text-[11px] text-slate-500">
                              {isWaiting ? 'Sedang ditinjau admin' : 'Terverifikasi'}
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isApproved || isReturned ? 'bg-emerald-600 text-white' :
                            isRejected ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isApproved || isReturned ? '✓' : isRejected ? '✕' : '3'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">3. Penyerahan</p>
                            <p className="text-[11px] text-slate-500">
                              {isApproved ? 'Siap diambil di PUSDATIN' : isRejected ? 'Ditolak' : 'Menunggu alokasi'}
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isReturned ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isReturned ? '✓' : '4'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">4. Pengembalian</p>
                            <p className="text-[11px] text-slate-500">
                              {isReturned ? `Kembali: ${loan.tglDikembalikan}` : `Target: ${loan.tglKembali}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details Table */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Barang yang Diminta:</span>
                          <span className="font-semibold text-slate-900">{loan.barangPinjaman} ({loan.jumlah} Unit)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Periode Pinjam:</span>
                          <span className="font-semibold text-slate-900">{loan.tglPinjam} s/d {loan.tglKembali}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">NIDN/NIK/NIM:</span>
                          <span className="font-mono text-slate-900">{loan.nik}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Barcode Aset Dialokasikan:</span>
                          <span className="font-mono font-bold text-red-700">{loan.barcode || '- Belum dialokasikan -'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Petugas PUSDATIN:</span>
                          <span className="font-semibold text-slate-900">{loan.petugas || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Catatan Khusus:</span>
                          <span className="text-slate-700">{loan.catatan || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* OVERDUE / UNRETURNED NOTICE FOR BORROWERS */}
                    {isApproved && (
                      <div className="px-6 pb-6">
                        {(() => {
                          const today = new Date().toISOString().split('T')[0];
                          const isOverdue = loan.tglKembali < today;
                          const isDueToday = loan.tglKembali === today;

                          if (isOverdue) {
                            return (
                              <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs space-y-1">
                                <div className="flex items-center gap-2 font-bold text-red-700">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  <span>PERINGATAN: ASET BELUM DIKEMBALIKAN (TENGGAT TERLEWATI)</span>
                                </div>
                                <p className="leading-relaxed text-red-800">
                                  Batas waktu peminjaman adalah <strong>{loan.tglKembali}</strong>. Fisik perangkat belum dicatat kembali di sistem PUSDATIN UMC. Harap segera menyerahkan kembali barang inventaris beserta seluruh kelengkapannya ke Ruang PUSDATIN (Gedung Rektorat Lantai 1) untuk penerbitan Berita Acara Pengembalian.
                                </p>
                              </div>
                            );
                          }

                          if (isDueToday) {
                            return (
                              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
                                <div className="flex items-center gap-2 font-bold text-amber-800">
                                  <Clock className="w-4 h-4 shrink-0" />
                                  <span>PENGINGAT: HARI INI BATAS AKHIR PENGEMBALIAN ASET</span>
                                </div>
                                <p className="leading-relaxed text-amber-800">
                                  Masa peminjaman berakhir hari ini ({loan.tglKembali}). Mohon kembalikan perangkat ke Ruang PUSDATIN sebelum jam operasional kantor berakhir.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                              <span>📌 Status Peminjaman: <strong>Aktif Digunakan</strong> (Batas waktu: <strong>{loan.tglKembali}</strong>).</span>
                              <span className="text-[11px] text-emerald-700">Jaga kondisi aset dengan baik</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Matched Damage Reports */}
              {matchedDamages.map(dmg => (
                <div key={dmg.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-amber-700">{dmg.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                          Tiket Kerusakan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Perangkat: <strong>{dmg.namaBarang}</strong> · Lokasi: {dmg.lokasi}
                      </p>
                    </div>

                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      dmg.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                      dmg.status === 'Perbaikan' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {dmg.status}
                    </span>
                  </div>

                  <div className="p-6 space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Gejala Kerusakan Dilaporkan:</span>
                      <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                        {dmg.deskripsi}
                      </p>
                    </div>

                    {dmg.catatanAdmin && (
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Catatan Tindakan Teknisi PUSDATIN:</span>
                        <p className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-blue-900 leading-relaxed">
                          {dmg.catatanAdmin}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
