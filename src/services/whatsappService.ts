import { LoanTicket, DamageTicket } from '../types';

export class WhatsAppNotificationService {
  private static formatPhone(phone?: string): string {
    if (!phone) return '';
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      return '62' + clean.slice(1);
    }
    if (clean.startsWith('62')) {
      return clean;
    }
    return clean ? '62' + clean : '';
  }

  public static getLoanSubmittedCivitasUrl(loan: LoanTicket): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UMC*
*Tanda Terima: Pengajuan Peminjaman Aset*

Yth. *${loan.peminjam}* (${loan.unit}),
Pengajuan peminjaman aset Anda telah *BERHASIL DITERIMA* oleh sistem inventaris PAHAM PUSDATIN UMC.

📋 *Rincian Pengajuan:*
• Nomor Tiket: *${loan.id}*
• Aset Diminta: *${loan.barangPinjaman}* (${loan.jumlah} Unit)
• Rencana Pinjam: *${loan.tglPinjam}* s/d *${loan.tglKembali}*
• Waktu Pengajuan: *${loan.tglAju}*
• Status: *Menunggu Verifikasi Admin PUSDATIN*

💡 *Catatan:* Simpan nomor tiket ini untuk melacak status persetujuan di Portal Civitas pada menu "Cek Progres Laporan".
Notifikasi resmi akan kami kirimkan begitu pengajuan Anda disetujui. Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  public static getDamageSubmittedCivitasUrl(ticket: DamageTicket): string | null {
    const phone = this.formatPhone(ticket.kontakPelapor);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UMC*
*Tanda Terima: Laporan Kerusakan IT & Fasilitas*

Yth. *${ticket.pelapor}*,
Laporan gangguan perangkat IT Anda telah *BERHASIL DITERIMA* oleh Helpdesk PUSDATIN UMC.

📋 *Rincian Tiket:*
• Nomor Tiket: *${ticket.id}*
• Perangkat: *${ticket.namaBarang}*
• Lokasi Aset: *${ticket.lokasi}*
• Waktu Lapor: *${ticket.tanggalLapor}*
• PIC Ditugaskan: *${ticket.namaPicTeknisi || 'Tim Teknis PUSDATIN'}* (${ticket.picTeknisi || 'Helpdesk Specialist'})
• Status: *Baru (Antrean Penanganan)*

💡 *Catatan:* Tim teknisi PUSDATIN akan segera melakukan inspeksi ke lokasi atau menindaklanjuti perbaikan. Pantau progres tiket Anda melalui menu "Cek Progres Laporan". Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  public static getLoanApprovedUrl(loan: LoanTicket): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const handoverMethod = loan.metodePengambilan || 'Diambil di Ruang PUSDATIN';
    const handoverSchedule = loan.jadwalPengambilan || `${loan.tglAmbil || loan.tglPinjam} pukul 09:00 WIB`;
    const handoverLocation = loan.lokasiPengambilan || (
      handoverMethod === 'Diambil di Ruang PUSDATIN'
        ? 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon)'
        : `Diserahkan Tim Teknis ke lokasi Anda (${loan.unit})`
    );

    const msg =
`*PAHAM - PUSDATIN UMC*
*Pemberitahuan: Peminjaman Aset DISETUJUI*

Yth. *${loan.peminjam}* (${loan.unit}),
Pengajuan peminjaman aset Anda telah *DISETUJUI* oleh Admin PUSDATIN UMC.

📋 *Rincian Tiket:*
• No. Tiket: *${loan.id}*
• Barang: *${loan.namaBarangT || loan.barangPinjaman}* (${loan.jumlah} Unit)
• Barcode Aset: *${loan.barcode || '-'}*
• Batas Kembali: *${loan.tglKembali}*

📦 *Informasi Pengambilan / Penyerahan Aset:*
• Metode: *${handoverMethod}*
• Jadwal Serah Terima: *${handoverSchedule}*
• Lokasi Penyerahan: *${handoverLocation}*

Mohon membawa kartu identitas/KTM untuk penandatanganan Berita Acara Peminjaman resmi. Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  public static getLoanReturnedUrl(loan: LoanTicket): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const returnDate = loan.tglDikembalikan || new Date().toISOString().split('T')[0];
    const msg =
`*PAHAM - PUSDATIN UMC*
*Konfirmasi: Aset Telah Berhasil DIKEMBALIKAN*

Yth. *${loan.peminjam}*,
Terima kasih. Perangkat inventaris kampus dengan rincian berikut:

📋 *Data Pengembalian:*
• No. Tiket: *${loan.id}*
• Barang: *${loan.namaBarangT || loan.barangPinjaman}* (Barcode: *${loan.barcode}*)
• Tanggal Kembali: *${returnDate}*
• Kondisi Serah Terima: *${loan.kondisi || 'Baik & Lengkap'}*
• Petugas Pemeriksa: *${loan.petugas || 'Admin PUSDATIN'}*

Status peminjaman ini telah *SELESAI (CLEAR)* dan bebas dari tanggungan inventaris. Berita Acara Pengembalian telah diterbitkan oleh sistem PAHAM UMC. Terima kasih atas kerja samanya.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  public static getLoanRejectedUrl(loan: LoanTicket, reason: string): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UMC*
*Informasi Pengajuan Peminjaman Aset*

Yth. *${loan.peminjam}*,
Menindaklanjuti permohonan peminjaman aset dengan No. Tiket *${loan.id}* (${loan.barangPinjaman}):

Mohon maaf, permohonan Anda belum dapat disetujui dengan catatan:
⚠️ *Alasan:* _${reason}_

Jika memerlukan alternatif perangkat lain atau penjadwalan ulang, silakan berkonsultasi ke Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2 Kampus 2 Watubelah). Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  public static getOverdueReminderUrl(loan: LoanTicket, daysLate: number): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const msg =
`*PERINGATAN RESMI: PUSDATIN UMC (PAHAM)*
*Keterlambatan Pengembalian Aset Kampus*

Yth. *${loan.peminjam}* (${loan.unit}),
Sistem inventaris PAHAM mendeteksi peminjaman berikut telah *MELEWATI BATAS WAKTU (${daysLate} Hari)*:

⚠️ *Rincian Aset Terpinjam:*
• No. Tiket: *${loan.id}*
• Barang: *${loan.namaBarangT || loan.barangPinjaman}* (Barcode: *${loan.barcode}*)
• Batas Waktu Pengembalian: *${loan.tglKembali}*

Mohon kerjasamanya untuk *segera menyerahkan kembali* fisik perangkat beserta charger/kabel lengkap ke:
📍 *Ruang PUSDATIN UMC* (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon).

Harap segera ditindaklanjuti agar tidak menghambat operasional perkuliahan civitas lain. Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  public static getAlternateAssignedUrl(loan: LoanTicket, originalItem: string, alternateItem: string): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UMC*
*Persetujuan dengan Pengalihan Unit Pengganti*

Yth. *${loan.peminjam}* (${loan.unit}),
Pengajuan pinjaman Anda (*${loan.id}*) telah kami tinjau. Karena perangkat *${originalItem}* telah dialokasikan untuk peminjam sebelumnya, kami telah mengalihkan permohonan Anda ke unit alternatif yang setara:

✅ *Perangkat Pengganti Dialokasikan:*
• *${alternateItem}* (Barcode: *${loan.barcode}*)
• Batas Waktu: *${loan.tglKembali}*

Silakan ambil perangkat di Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt. 2 Kampus 2 Watubelah). Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  public static getDamageStatusUrl(ticket: DamageTicket, statusType: string, note: string): string | null {
    const phone = this.formatPhone(ticket.kontakPelapor);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UMC*
*Pembaruan Status Laporan Kerusakan IT (SOP PUSDATIN)*

Yth. *${ticket.pelapor}*,
Laporan gangguan perangkat yang Anda laporkan telah diperbarui oleh Tim Teknis PUSDATIN:

🛠 *Rincian Tiket:*
• No. Tiket: *${ticket.id}*
• Perangkat: *${ticket.namaBarang}* (Barcode: *${ticket.barcode}*)
• Status Terkini: *${statusType}*
• Lokasi Aset: *${ticket.lokasi}*
• Catatan Teknisi: _${note}_

Terima kasih atas laporan Anda dalam menjaga fasilitas teknologi kampus UMC.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }
}
