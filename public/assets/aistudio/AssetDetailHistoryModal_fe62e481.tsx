import React, { useState } from 'react';
import { Asset, LoanTicket, DamageTicket, ActivityLog } from '../../types';
import { AppDatabase } from '../../services/db';
import {
  X,
  Package,
  Barcode,
  Calendar,
  MapPin,
  Clock,
  Handshake,
  AlertTriangle,
  History,
  CheckCircle2,
  Phone,
  User,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface AssetDetailHistoryModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSelectForLoan?: (asset: Asset) => void;
}

export const AssetDetailHistoryModal: React.FC<AssetDetailHistoryModalProps> = ({
  asset,
  onClose,
  onSelectForLoan
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'pinjam' | 'kerusakan' | 'lokasi'>('info');

  if (!asset) return null;

  // Filter histories specifically for this asset
  const allLoans = AppDatabase.getLoans();
  const allDamages = AppDatabase.getDamageTickets();
  const allLogs = AppDatabase.getLogs();

  const loanHistory = allLoans.filter(l =>
    (l.barcode && l.barcode.includes(asset.barcode)) ||
    (l.namaBarangT && l.namaBarangT.toLowerCase() === asset.nama.toLowerCase())
  );

  const damageHistory = allDamages.filter(d =>
    d.barcode === asset.barcode ||
    (d.namaBarang && d.namaBarang.toLowerCase() === asset.nama.toLowerCase())
  );

  const locationLogs = allLogs.filter(log =>
    log.barcode === asset.barcode
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Strip */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-900 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-red-400 border border-slate-700">
                  {asset.barcode}
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  asset.status === 'Tersedia' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  asset.status === 'Digunakan' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  asset.status === 'Dipinjam' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {asset.status}
                </span>
                <span className="text-xs text-slate-400">· {asset.kategori}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                {asset.nama}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Lokasi Saat Ini: <strong>{asset.lokasi}</strong></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 px-5 pt-3 bg-slate-50/70 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-red-600 text-red-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Spesifikasi & Detail</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pinjam')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pinjam'
                ? 'border-red-600 text-red-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>Riwayat Peminjaman</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {loanHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kerusakan')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'kerusakan'
                ? 'border-red-600 text-red-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Riwayat Kerusakan & Servis</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {damageHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lokasi')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'lokasi'
                ? 'border-red-600 text-red-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Lokasi & Mutasi</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {locationLogs.length}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: INFORMASI & SPESIFIKASI */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5">
                    Data Fisik Perangkat
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Nomor Barcode:</span>
                    <span className="font-mono font-bold text-red-700">{asset.barcode}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Nama Perangkat:</span>
                    <span className="font-semibold text-slate-900">{asset.nama}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Kategori:</span>
                    <span className="font-semibold text-slate-800">{asset.kategori}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Nomor Seri:</span>
                    <span className="font-mono text-slate-800">{asset.nomorSeri || '-'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5">
                    Status & Penempatan
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Status Operasional:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      asset.status === 'Tersedia' ? 'bg-emerald-100 text-emerald-800' :
                      asset.status === 'Digunakan' ? 'bg-blue-100 text-blue-800' :
                      asset.status === 'Dipinjam' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Lokasi Penempatan:</span>
                    <span className="font-semibold text-slate-900">{asset.lokasi}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Tanggal Registrasi:</span>
                    <span className="text-slate-800">{asset.tanggalMasuk}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Kepemilikan Aset:</span>
                    <span className="font-semibold text-slate-800">PUSDATIN Universitas Muhammadiyah Cirebon</span>
                  </div>
                </div>
              </div>

              {/* Spesifikasi Teknis */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Spesifikasi Teknis & Kelengkapan:
                </h4>
                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {asset.spesifikasi || 'Spesifikasi standar universitas. Perangkat dalam kondisi prima dan terdata dalam katalog aset resmi.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT PEMINJAMAN */}
          {activeTab === 'pinjam' && (
            <div className="space-y-3">
              {loanHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Handshake className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-slate-600">Belum ada riwayat peminjaman.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Perangkat ini belum pernah dipinjamkan oleh sivitas.</p>
                </div>
              ) : (
                loanHistory.map(loan => (
                  <div key={loan.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-red-700 block text-xs">
                          {loan.id}
                        </span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {loan.peminjam} ({loan.nik})
                        </p>
                        <p className="text-[11px] text-slate-500">{loan.unit} · Kontak: {loan.kontak}</p>
                      </div>

                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                        loan.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' :
                        loan.status === 'Dikembalikan' ? 'bg-blue-100 text-blue-800' :
                        loan.status === 'Menunggu' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {loan.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block">Jadwal Pinjam:</span>
                        <strong>{loan.tglPinjam} s/d {loan.tglKembali}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Tgl Diambil:</span>
                        <span>{loan.tglAmbil || loan.tglPinjam}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Tgl Dikembalikan:</span>
                        <span className="font-semibold text-blue-700">{loan.tglDikembalikan || 'Belum dikembalikan'}</span>
                      </div>
                    </div>

                    {loan.catatan && (
                      <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                        Catatan: {loan.catatan}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: RIWAYAT KERUSAKAN & SERVIS */}
          {activeTab === 'kerusakan' && (
            <div className="space-y-3">
              {damageHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-700">Kondisi Prima (Zero Damage Record)</p>
                  <p className="text-xs text-slate-400 mt-0.5">Tidak pernah ada catatan kerusakan atau keluhan teknis yang dilaporkan.</p>
                </div>
              ) : (
                damageHistory.map(dmg => (
                  <div key={dmg.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-amber-700 block text-xs">
                          {dmg.id}
                        </span>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          Lokasi Insiden: <strong>{dmg.lokasi}</strong>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Pelapor: <strong>{dmg.pelapor}</strong> · No. HP: {dmg.kontakPelapor || '-'} · Tgl: {dmg.tanggalLapor}
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                        dmg.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                        dmg.status === 'Perbaikan' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dmg.status}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      <strong>Gejala Kerusakan:</strong>
                      <p className="mt-0.5">{dmg.deskripsi}</p>
                    </div>

                    {dmg.catatanAdmin && (
                      <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 text-blue-900 text-[11px]">
                        <strong>Tindakan Teknisi PUSDATIN:</strong>
                        <p className="mt-0.5">{dmg.catatanAdmin}</p>
                        {dmg.tanggalSelesai && (
                          <span className="text-[10px] text-blue-600 block mt-1">Selesai pada: {dmg.tanggalSelesai}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: RIWAYAT LOKASI & MUTASI */}
          {activeTab === 'lokasi' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0 text-blue-700" />
                <span>
                  Lokasi Resmi Terkini: <strong>{asset.lokasi}</strong> (Status: <strong>{asset.status}</strong>)
                </span>
              </div>

              {locationLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  Aset terdaftar di {asset.lokasi} sejak {asset.tanggalMasuk}. Belum ada mutasi lokasi fisik lain.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {locationLogs.map((log, idx) => (
                    <div key={log.id || idx} className="relative">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-xs" />
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-200 text-slate-800">
                              {log.jenisTransaksi}
                            </span>
                            <span>{log.lokasi}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {log.keterangan}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Aset Terverifikasi PUSDATIN UMC
          </div>
          <div className="flex items-center gap-2">
            {onSelectForLoan && asset.status === 'Tersedia' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectForLoan(asset);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Pilih untuk Dipinjam</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
