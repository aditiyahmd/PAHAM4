import { LoanTicket, DamageTicket, SystemProposal } from '../types';

export class WhatsAppNotificationService {
  public static formatPhone(phone?: string): string {
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

  // Modul C: Pengajuan Peminjaman Diajukan (C.1)
  public static getLoanSubmittedCivitasUrl(loan: LoanTicket): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON*
*Tanda Terima: Pengajuan Peminjaman Aset (AC-P1)*

Yth. *${loan.peminjam}* (${loan.unit}),
Pengajuan peminjaman aset Anda telah *BERHASIL DITERIMA* oleh sistem PAHAM PUSDATIN UMC.

📋 *Rincian Pengajuan:*
• Nomor Tiket: *${loan.id}*
• Aset Diminta: *${loan.barangPinjaman}* (${loan.jumlah} Unit)
• Rencana Pinjam: *${loan.tglPinjam}* s/d *${loan.tglKembali}*
• Waktu Pengajuan: *${loan.tglAju}*
• Status: *Diajukan (Menunggu Keputusan Admin)*

💡 Simpan nomor tiket ini untuk melacak status persetujuan di Portal Civitas pada menu "Cek Progres Laporan". Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Modul C: Peminjaman Disetujui / Dikonfirmasi (C.3)
  public static getLoanApprovedUrl(loan: LoanTicket): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const handoverMethod = loan.metodePengambilan || 'Diambil di Ruang PUSDATIN';
    const handoverSchedule = loan.jadwalPengambilan || `${loan.tglAmbil || loan.tglPinjam} pukul 09:00 WIB`;
    const handoverLocation = loan.lokasiPengambilan || 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2)';

    const msg =
`*PAHAM - PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON*
*Pemberitahuan: Peminjaman Aset DIKONFIRMASI & DISETUJUI*

Yth. *${loan.peminjam}* (${loan.unit}),
Pengajuan peminjaman aset Anda telah *DISETUJUI* oleh Admin PUSDATIN UMC.

📋 *Rincian Tiket:*
• No. Tiket: *${loan.id}*
• Barang Dialokasikan: *${loan.namaBarangT || loan.barangPinjaman}* (${loan.jumlah} Unit)
• Kode Unik Aset: *${loan.kodeUnikAset || loan.barcode || '-'}*
• Batas Kembali: *${loan.tglKembali}*

📦 *Informasi Penyerahan Aset:*
• Metode: *${handoverMethod}*
• Jadwal: *${handoverSchedule}*
• Lokasi: *${handoverLocation}*

Mohon membawa kartu identitas untuk penandatanganan Berita Acara / Surat Peminjaman resmi. Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Modul C: Alokasi Alternatif Aset (C.3b)
  public static getAlternateAssignedUrl(loan: LoanTicket, originalItem: string, alternateItem: string): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON*
*Pemberitahuan: Penyesuaian Alokasi Alternatif Peminjaman Aset*

Yth. *${loan.peminjam}* (${loan.unit}),
Pengajuan peminjaman aset Anda (Tiket: *${loan.id}*) telah disetujui dengan pengalihan unit alternatif:

📋 *Penyesuaian Barang:*
• Permohonan Awal: *${originalItem}*
• Unit Alternatif yang Disiapkan: *${alternateItem}* (Kode: *${loan.kodeUnikAset || loan.barcode || '-'}*)
• Batas Kembali: *${loan.tglKembali}*

Silakan konfirmasi dan ambil unit di Ruang PUSDATIN sesuai jadwal yang telah ditentukan. Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Modul C: Peminjaman Diserahkan & Surat Diterbitkan (C.4)
  public static getLoanHandedOverUrl(loan: LoanTicket): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON*
*Konfirmasi: Aset Telah Resmi DISERAHKAN (BR-011)*

Yth. *${loan.peminjam}* (${loan.unit}),
Aset inventaris resmi diserahkan kepada Anda.

📋 *Rincian Surat Peminjaman:*
• No. Surat: *${loan.nomorSuratPeminjaman || 'SP-PUSDATIN/' + loan.id}*
• No. Tiket: *${loan.id}*
• Aset: *${loan.namaBarangT || loan.barangPinjaman}* (Kode: *${loan.kodeUnikAset || loan.barcode}*)
• Kondisi Serah Terima: *${loan.kondisi || 'Baik / Berfungsi Normal'}*
• Tanggal Pengembalian: *${loan.tglKembali}*
• Petugas Penyerah: *${loan.petugas || 'Admin PUSDATIN'}*

⚠️ Harap menjaga fisik perangkat dan mengembalikan tepat waktu sebelum batas akhir untuk mendukung perkuliahan civitas lain. Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Modul C: Pengembalian Aset (C.5)
  public static getLoanReturnedUrl(loan: LoanTicket): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const returnDate = loan.tglDikembalikan || new Date().toISOString().split('T')[0];
    const kondisi = loan.hasilPemeriksaanKembali || 'Baik / Lengkap';

    const msg =
`*PAHAM - PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON*
*Konfirmasi: Aset Telah Berhasil DIKEMBALIKAN (AC-P4)*

Yth. *${loan.peminjam}*,
Aset inventaris dengan No. Tiket *${loan.id}* telah resmi diterima kembali di Ruang PUSDATIN UMC.

📋 *Data Pengembalian:*
• Barang: *${loan.namaBarangT || loan.barangPinjaman}* (${loan.kodeUnikAset || loan.barcode})
• Tanggal Kembali: *${returnDate}*
• Hasil Pemeriksaan: *${kondisi}*
• Petugas: *${loan.petugas || 'Admin PUSDATIN'}*

Status peminjaman ini telah *SELESAI (CLEAR)*. Terima kasih atas kerja samanya dalam memelihara fasilitas kampus.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Modul C: Penolakan Peminjaman
  public static getLoanRejectedUrl(loan: LoanTicket, reason: string): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON*
*Informasi: Pengajuan Peminjaman Aset Belum Dapat Disetujui*

Yth. *${loan.peminjam}*,
Menindaklanjuti permohonan peminjaman aset dengan No. Tiket *${loan.id}* (${loan.barangPinjaman}):

Mohon maaf, permohonan Anda belum dapat disetujui saat ini.
⚠️ *Alasan:* _${reason}_

Silakan menghubungi Ruang PUSDATIN Kampus 2 jika memerlukan alternatif penjadwalan lain. Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Modul C: Pengingat Keterlambatan (C.6, BR-013)
  public static getOverdueReminderUrl(loan: LoanTicket, daysLate: number): string | null {
    const phone = this.formatPhone(loan.kontak);
    if (!phone) return null;

    const msg =
`*PERINGATAN RESMI: PUSDATIN UMC (PAHAM)*
*Keterlambatan Pengembalian Aset Kampus (BR-013)*

Yth. *${loan.peminjam}* (${loan.unit}),
Sistem inventaris PAHAM mendeteksi peminjaman berikut telah *MELEWATI BATAS WAKTU (${daysLate} Hari)*:

⚠️ *Rincian Aset:*
• No. Tiket: *${loan.id}*
• Barang: *${loan.namaBarangT || loan.barangPinjaman}* (${loan.kodeUnikAset || loan.barcode})
• Batas Waktu Pengembalian: *${loan.tglKembali}*

Mohon kerjasamanya untuk *segera menyerahkan kembali* fisik perangkat beserta kabel/aksesoris ke Ruang PUSDATIN (Gedung Laboratorium Terpadu Lt.2 Kampus 2 Watubelah). Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Modul B: Tiket Kerusakan Dibuat (B.1, BR-006)
  public static getDamageSubmittedCivitasUrl(ticket: DamageTicket): string | null {
    const phone = this.formatPhone(ticket.kontakPelapor);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON*
*Tanda Terima: Laporan Kerusakan IT & Fasilitas (AC-H1)*

Yth. *${ticket.pelapor}*,
Laporan gangguan perangkat IT Anda telah *BERHASIL DITERIMA* oleh Helpdesk PUSDATIN UMC.

📋 *Rincian Tiket:*
• Nomor Tiket: *${ticket.id}*
• Perangkat / Fasilitas: *${ticket.namaBarang}* (Kode: *${ticket.kodeUnikAset || ticket.barcode}*)
• Lokasi: *${ticket.lokasi}*
• Target SLA: *${ticket.slaTargetHours} Jam* (Batas: *${ticket.slaDeadline}*)
• Status: *Open/Unassigned*

Tim teknisi PUSDATIN akan segera melakukan inspeksi dan penanganan. Pantau progres tiket Anda melalui menu "Cek Progres Laporan". Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Modul B: Pembaruan Status Tiket Kerusakan (B.2 - B.5)
  public static getDamageStatusUrl(ticket: DamageTicket, statusType: string, note: string): string | null {
    const phone = this.formatPhone(ticket.kontakPelapor);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON*
*Pembaruan Status Helpdesk IT (Tiket: ${ticket.id})*

Yth. *${ticket.pelapor}*,
Status laporan kerusakan Anda telah diperbarui oleh Tim Teknis PUSDATIN:

🛠 *Rincian Status:*
• Perangkat: *${ticket.namaBarang}*
• Status Terkini: *${statusType}*
• PIC Teknisi: *${ticket.namaPicTeknisi || 'Tim Teknis PUSDATIN'}* (${ticket.picTeknisi || '-'})
• Catatan: _${note}_
${statusType === 'Resolved' ? '\n💡 *Konfirmasi Penyelesaian (BR-008):* Mohon konfirmasi di Portal jika kendala telah teratasi. Jika tidak ada konfirmasi dalam 2 hari kerja, sistem akan menutup tiket secara otomatis (Closed – Auto).' : ''}

Terima kasih atas kerja samanya dalam merawat fasilitas teknologi kampus UMC.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Modul D: Pengajuan Sistem Baru (Section 5.4)
  public static getSystemProposalStatusUrl(proposal: SystemProposal, statusLabel: string, note?: string): string | null {
    const phone = this.formatPhone(proposal.kontakWhatsapp);
    if (!phone) return null;

    const msg =
`*PAHAM - PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON*
*Pemberitahuan: Progres Pengajuan Sistem Baru (F-DEV-01)*

Yth. *${proposal.pemohon}* (${proposal.unitKerja}),
Pengajuan sistem baru Anda dengan ID *${proposal.id}*:
📌 *"${proposal.namaSistem}"*

Telah memasuki tahapan: *${statusLabel}*
${note ? '• Catatan Tim: _' + note + '_' : ''}

Anda dapat memantau dokumen analisis, pengujian keamanan, dan progres sprint pengembangan di Portal PAHAM PUSDATIN UMC. Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }
}
