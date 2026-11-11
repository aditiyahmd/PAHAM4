import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { DamageTicket } from '../../types';
import { AlertTriangle, Camera, CheckCircle2, Send, Search, Building } from 'lucide-react';

interface DamageReportFormProps {
  onSuccessSubmit: (ticket: DamageTicket) => void;
}

export const DamageReportForm: React.FC<DamageReportFormProps> = ({ onSuccessSubmit }) => {
  const [barcode, setBarcode] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [pelapor, setPelapor] = useState('');
  const [kontak, setKontak] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<DamageTicket | null>(null);

  const handleBarcodeLookup = () => {
    if (!barcode.trim()) return;
    setIsSearchingBarcode(true);
    const asset = AppDatabase.getAssetByBarcode(barcode.trim());
    setTimeout(() => {
      if (asset) {
        setNamaBarang(asset.nama);
        setLokasi(asset.lokasi);
      } else {
        alert('Barcode tidak ditemukan di database. Anda tetap dapat mengisi nama barang secara manual.');
      }
      setIsSearchingBarcode(false);
    }, 200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate Barcode Reader extraction from photo
    const sampleBarcodes = ['30192848', '50291847', '10928374', '20495812'];
    const detected = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
    setBarcode(detected);

    const asset = AppDatabase.getAssetByBarcode(detected);
    if (asset) {
      setNamaBarang(asset.nama);
      setLokasi(asset.lokasi);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang || !lokasi || !deskripsi) {
      alert('Harap isi Nama Barang, Lokasi, dan Deskripsi Kerusakan!');
      return;
    }

    const now = new Date();
    const dateCode = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const randomCode = Math.floor(100 + Math.random() * 900);
    const newId = `TKT-${dateCode}-${randomCode}`;

    const newTicket: DamageTicket = {
      id: newId,
      barcode: barcode.trim() || 'Tanpa Barcode',
      namaBarang: namaBarang.trim(),
      pelapor: pelapor.trim() || 'Civitas UMC (Anonim)',
      kontakPelapor: kontak.trim(),
      lokasi: lokasi.trim(),
      deskripsi: deskripsi.trim(),
      tanggalLapor: now.toLocaleString('id-ID'),
      status: 'Baru'
    };

    AppDatabase.addDamageTicket(newTicket);
    setSubmittedTicket(newTicket);
    onSuccessSubmit(newTicket);

    // Reset
    setBarcode('');
    setNamaBarang('');
    setLokasi('');
    setPelapor('');
    setKontak('');
    setDeskripsi('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Lapor Kerusakan Aset & Fasilitas IT
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Laporkan gangguan perangkat komputer, jaringan Wi-Fi, proyektor kelas, atau printer kampus untuk segera ditangani oleh tim teknis PUSDATIN UMC.
            </p>
          </div>
        </div>
      </div>

      {submittedTicket && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-base">Laporan Kerusakan Berhasil Didaftarkan!</p>
              <p className="text-sm text-emerald-800 mt-0.5">
                Nomor Tiket Anda: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-700">{submittedTicket.id}</span>
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Gunakan nomor tiket ini pada menu "Cek Progres Laporan" untuk memantau status penanganan teknisi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedTicket(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs"
          >
            Tutup
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        {/* Scan Barcode Assist Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Barcode Aset (Opsional - Jika Aset Memiliki Stiker Barcode PUSDATIN)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeLookup(); } }}
                placeholder="Scan stiker atau ketik kode barcode (contoh: 30192848)"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleBarcodeLookup}
                disabled={isSearchingBarcode || !barcode}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari Aset</span>
              </button>

              <label className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Barcode</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Jika barcode terdeteksi, nama barang dan lokasinya akan terisi otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Perangkat / Barang <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={namaBarang}
              onChange={e => setNamaBarang(e.target.value)}
              placeholder="Contoh: Proyektor InFocus Ruang 302 / PC Laboratorium"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lokasi Aset Ditempatkan <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
                placeholder="Contoh: Gedung FKIP Lt. 2 R.204 / Gedung Rektorat"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Pelapor
            </label>
            <input
              type="text"
              value={pelapor}
              onChange={e => setPelapor(e.target.value)}
              placeholder="Nama dosen / staf / mahasiswa"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nomor WhatsApp Pelapor
            </label>
            <input
              type="tel"
              value={kontak}
              onChange={e => setKontak(e.target.value)}
              placeholder="Untuk konfirmasi kedatangan teknisi"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Deskripsi Kerusakan / Gejala Masalah <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={deskripsi}
              onChange={e => setDeskripsi(e.target.value)}
              placeholder="Jelaskan detail kendala (contoh: lampu indikator merah, tampilan bergaris, Wi-Fi tidak memancarkan sinyal SSID, laptop tidak bisa booting ke Windows, dsb.)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Laporan Kerusakan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
