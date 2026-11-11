import React, { useState, useEffect } from 'react';
import { AppDatabase } from '../../services/db';
import { PdfReportService } from '../../services/pdfReportService';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ArrowRight,
  Printer,
  Package,
  Wrench,
  User,
  Building,
  Calendar,
  Layers,
  MapPin,
  Check,
  RotateCcw,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { LoanTicket, DamageTicket } from '../../types';

interface TicketTrackerProps {
  initialSearchId?: string;
}

export const TicketTracker: React.FC<TicketTrackerProps> = ({ initialSearchId = '' }) => {
  const [query, setQuery] = useState(initialSearchId);
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
      d.pelapor.toLowerCase().includes(q) ||
      (d.kontakPelapor && d.kontakPelapor.includes(q))
    );

    setMatchedLoans(loans);
    setMatchedDamages(damages);
    setHasSearched(true);
  };

  useEffect(() => {
    if (initialSearchId) {
      setQuery(initialSearchId);
      handleSearch(initialSearchId);
    }
  }, [initialSearchId]);

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
            onClick={() => { setQuery('PJM-20261102-1042'); handleSearch('PJM-20261102-1042'); }}
            className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
          >
            PJM-20261102-1042
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
            onClick={() => { setQuery('TKT-20261106-101'); handleSearch('TKT-20261106-101'); }}
            className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
          >
            TKT-20261106-101
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

                    {/* ENHANCEMENT B.1a: INFORMASI PENGAMBILAN ASET UNTUK USER */}
                    {isApproved && (
                      <div className="bg-emerald-50/80 border-b border-emerald-200/80 p-4 px-6 text-xs text-emerald-950">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-emerald-900">
                                Informasi Pengambilan & Serah Terima Aset
                              </span>
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300">
                                {loan.metodePengambilan || 'Diambil di Ruang PUSDATIN'}
                              </span>
                            </div>
                            <p className="text-slate-700">
                              <strong>Kapan Bisa Diambil/Diterima:</strong>{' '}
                              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                {loan.jadwalPengambilan || `${loan.tglAmbil || loan.tglPinjam} pukul 09:00 WIB`}
                              </span>
                            </p>
                            <p className="text-slate-700">
                              <strong>Lokasi / Alur Serah Terima:</strong>{' '}
                              <span>{loan.lokasiPengambilan || 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon)'}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
                                  Batas waktu peminjaman adalah <strong>{loan.tglKembali}</strong>. Fisik perangkat belum dicatat kembali di sistem PUSDATIN UMC. Harap segera menyerahkan kembali barang inventaris beserta seluruh kelengkapannya ke Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon) untuk penerbitan Berita Acara Pengembalian.
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

              {/* Matched Damage Reports with PIC and Spare Part status */}
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

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        dmg.status === 'Closed' || dmg.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                        dmg.status === 'In Progress' || dmg.status === 'Perbaikan' ? 'bg-blue-100 text-blue-800' :
                        dmg.status === 'Pending Procurement' || dmg.status === 'Menunggu Suku Cadang' ? 'bg-amber-100 text-amber-800' :
                        dmg.status === 'Assigned' || dmg.status === 'Diterima' ? 'bg-purple-100 text-purple-800' :
                        dmg.status === 'Rusak Total' ? 'bg-rose-100 text-rose-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dmg.status}
                      </span>
                    </div>
                  </div>

                  {/* SOP 5-Step Progress Bar */}
                  <div className="bg-slate-50/70 p-4 border-b border-slate-100">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>Progres Alur Standar Operasional (SOP 5-Tahap):</span>
                      {dmg.kategoriMasalah && (
                        <span className="text-[10px] text-blue-700 font-semibold lowercase">
                          [{dmg.kategoriMasalah} &bull; {dmg.jenisAset || 'Fisik'}]
                        </span>
                      )}
                    </div>
                    {(() => {
                      const getStepNumber = (st: string) => {
                        if (st === 'Open' || st === 'Baru') return 1;
                        if (st === 'Assigned' || st === 'Diterima') return 2;
                        if (st === 'In Progress' || st === 'Perbaikan') return 3;
                        if (st === 'Pending Procurement' || st === 'Menunggu Suku Cadang') return 4;
                        if (st === 'Closed' || st === 'Selesai' || st === 'Rusak Total') return 5;
                        return 1;
                      };
                      const currentStep = getStepNumber(dmg.status);

                      const steps = [
                        { num: 1, label: '1. Pelaporan', desc: 'Tiket dibuat' },
                        { num: 2, label: '2. Verifikasi & Delegasi', desc: 'Admin & PIC' },
                        { num: 3, label: '3. Penjadwalan Inspeksi', desc: 'Jadwal teknisi' },
                        { num: 4, label: '4. Tindakan Perbaikan', desc: 'Eksekusi teknis' },
                        { num: 5, label: '5. Selesai (Closed)', desc: 'Aset diperbarui' }
                      ];

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {steps.map(s => {
                            const isDone = s.num < currentStep || (currentStep === 5 && s.num === 5);
                            const isCurrent = s.num === currentStep && currentStep !== 5;

                            return (
                              <div
                                key={s.num}
                                className={`p-2 rounded-lg border text-center transition-all ${
                                  isDone
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : isCurrent
                                    ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-400/30 font-bold'
                                    : 'bg-white border-slate-200 text-slate-400 opacity-60'
                                }`}
                              >
                                <div className="text-[11px] font-bold">
                                  {isDone ? '✓ ' : ''}{s.label}
                                </div>
                                <div className="text-[10px] mt-0.5 text-slate-500">
                                  {s.desc}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* PIC Teknisi & Jadwal Banner */}
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Cpu className="w-4 h-4 text-slate-500" />
                      <span>
                        <strong>PIC Teknisi:</strong> {dmg.picTeknisi || 'IT Support & Helpdesk Specialist'}
                      </span>
                    </div>
                    {dmg.jadwalPemeriksaan && (
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>Inspeksi: {dmg.jadwalPemeriksaan}</span>
                      </span>
                    )}
                    {dmg.metodePerbaikan && !dmg.jadwalPemeriksaan && (
                      <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold text-[11px]">
                        Metode: {dmg.metodePerbaikan}
                      </span>
                    )}
                  </div>

                  {/* Spare parts banner if applicable */}
                  {dmg.sukuCadangList && dmg.sukuCadangList.length > 0 && (
                    <div className="bg-amber-50/70 border-b border-amber-200/70 px-6 py-3 text-xs text-amber-950">
                      <p className="font-bold flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-600" />
                        <span>Kebutuhan Suku Cadang ({dmg.sukuCadangList.length} Item):</span>
                        {dmg.status === 'Pending Procurement' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px]">
                            Menunggu Pembelian
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {dmg.sukuCadangList.map((sp, idx) => (
                          <span key={idx} className="bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-[11px]">
                            {sp.namaKomponen} ({sp.statusPengadaan})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-6 space-y-4 text-xs">
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

                    {/* Timeline History */}
                    {dmg.riwayatStatus && dmg.riwayatStatus.length > 0 && (
                      <div className="pt-2">
                        <span className="font-bold text-slate-700 block mb-2">Riwayat Progres Tiket:</span>
                        <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                          {dmg.riwayatStatus.map((item, idx) => (
                            <div key={idx} className="relative text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{item.status}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                              </div>
                              <p className="text-slate-600 mt-0.5">{item.catatan}</p>
                            </div>
                          ))}
                        </div>
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
