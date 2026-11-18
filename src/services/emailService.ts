import { LoanTicket, DamageTicket, EmailLog } from '../types';

const STORAGE_EMAIL_LOGS = 'pusdatin_email_logs_v2';
const STORAGE_EMAIL_CLEAN_V5 = 'pusdatin_email_clean_v5';

const INITIAL_EMAIL_LOGS: EmailLog[] = [];

export class EmailNotificationService {
  private static ensureCleanLogs(): void {
    try {
      if (localStorage.getItem(STORAGE_EMAIL_CLEAN_V5) !== 'true') {
        localStorage.setItem(STORAGE_EMAIL_LOGS, JSON.stringify([]));
        localStorage.setItem(STORAGE_EMAIL_CLEAN_V5, 'true');
      }
    } catch {
      // ignore storage errors
    }
  }

  public static getLogs(): EmailLog[] {
    this.ensureCleanLogs();
    try {
      const data = localStorage.getItem(STORAGE_EMAIL_LOGS);
      if (!data) return INITIAL_EMAIL_LOGS;
      return JSON.parse(data);
    } catch {
      return INITIAL_EMAIL_LOGS;
    }
  }

  private static recordLog(log: EmailLog): void {
    const logs = this.getLogs();
    try {
      localStorage.setItem(STORAGE_EMAIL_LOGS, JSON.stringify([log, ...logs]));
    } catch (e) {
      console.error('Failed to save email log', e);
    }
  }

  public static async sendLoanSubmitted(loan: LoanTicket): Promise<void> {
    const recipient = loan.email || `${loan.nik.toLowerCase().replace(/[^a-z0-9]/g, '') || 'civitas'}@umc.ac.id`;
    const newLog: EmailLog = {
      id: `EML-${Date.now()}`,
      ticketId: loan.id,
      recipientName: loan.peminjam,
      to: recipient,
      subject: `[PAHAM PUSDATIN UMC] Tanda Terima Pengajuan Peminjaman Aset (${loan.id})`,
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #b91c1c;">PAHAM · PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON</h3>
          <p>Yth. <strong>${loan.peminjam}</strong> (${loan.unit}),</p>
          <p>Terima kasih. Pengajuan peminjaman aset Anda dengan nomor tiket <strong>${loan.id}</strong> telah <strong>BERHASIL TERCATAT</strong> dalam antrean verifikasi petugas PUSDATIN UMC.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 35%;">Nomor Tiket</td><td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #b91c1c;">${loan.id}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Perangkat Diminta</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${loan.barangPinjaman} (${loan.jumlah} Unit)</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Jadwal Pinjam</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${loan.tglPinjam} s/d ${loan.tglKembali}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Status Saat Ini</td><td style="padding: 6px; border: 1px solid #cbd5e1; color: #d97706; font-weight: bold;">Menunggu Verifikasi Admin</td></tr>
          </table>
          <p>Anda tidak perlu mencatat nomor tiket ini secara manual karena tersimpan di email ini. Anda dapat mengecek status persetujuan kapan saja di Portal Civitas menu <strong>Cek Progres Laporan</strong>.</p>
          <p style="font-size: 11px; color: #64748b;">Pemberitahuan otomatis dari Sistem PAHAM UMC.</p>
        </div>
      `,
      timestamp: new Date().toISOString()
    };
    this.recordLog(newLog);
  }

  public static async sendDamageReportSubmitted(ticket: DamageTicket): Promise<void> {
    const recipient = ticket.emailPelapor || `${ticket.pelapor.toLowerCase().replace(/[^a-z0-9]/g, '') || 'civitas'}@umc.ac.id`;
    const newLog: EmailLog = {
      id: `EML-${Date.now()}`,
      ticketId: ticket.id,
      recipientName: ticket.pelapor,
      to: recipient,
      subject: `[PAHAM PUSDATIN UMC] Tanda Terima Laporan Kerusakan IT (${ticket.id})`,
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #d97706;">PAHAM · PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON</h3>
          <p>Yth. <strong>${ticket.pelapor}</strong>,</p>
          <p>Laporan kerusakan perangkat IT Anda telah <strong>BERHASIL DITERIMA</strong> oleh Helpdesk PUSDATIN UMC dengan nomor tiket <strong>${ticket.id}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 35%;">Nomor Tiket</td><td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #b91c1c;">${ticket.id}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Perangkat</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${ticket.namaBarang} (Barcode: ${ticket.barcode})</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Lokasi Insiden</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${ticket.lokasi}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">PIC Teknisi Ditugaskan</td><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${ticket.namaPicTeknisi || 'Tim Teknis PUSDATIN'} (${ticket.picTeknisi || 'Helpdesk Specialist'})</td></tr>
          </table>
          <p>Tim teknisi akan segera menindaklanjuti laporan Anda. Anda dapat memantau penanganan secara real-time di Portal Civitas menu <strong>Cek Progres Laporan</strong>.</p>
        </div>
      `,
      timestamp: new Date().toISOString()
    };
    this.recordLog(newLog);
  }

  public static async sendLoanApproved(loan: LoanTicket): Promise<void> {
    const recipient = loan.email || `${loan.peminjam.toLowerCase().replace(/\s+/g, '')}@umc.ac.id`;
    const handover = loan.metodePengambilan || 'Diambil di Ruang PUSDATIN';
    const schedule = loan.jadwalPengambilan || `${loan.tglAmbil || loan.tglPinjam} pukul 09:00 WIB`;
    const location = loan.lokasiPengambilan || (
      handover === 'Diambil di Ruang PUSDATIN'
        ? 'Ruang PUSDATIN (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon)'
        : `Diserahkan langsung oleh Tim Teknis ke lokasi peminjam (${loan.unit})`
    );

    const newLog: EmailLog = {
      id: `EML-${Date.now()}`,
      ticketId: loan.id,
      recipientName: loan.peminjam,
      to: recipient,
      subject: `[PAHAM PUSDATIN UMC] Permohonan Peminjaman Aset DISETUJUI (${loan.id})`,
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #b91c1c;">PAHAM · PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON</h3>
          <p>Yth. <strong>${loan.peminjam}</strong> (${loan.unit}),</p>
          <p>Pemberitahuan resmi bahwa permohonan peminjaman aset Anda dengan nomor tiket <strong>${loan.id}</strong> telah <strong>DISETUJUI</strong> oleh petugas PUSDATIN UMC.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 35%;">Barang Pinjaman</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${loan.namaBarangT || loan.barangPinjaman} (${loan.jumlah} Unit)</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Barcode Aset</td><td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${loan.barcode || '-'}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Jadwal Pinjam</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${loan.tglPinjam} s/d ${loan.tglKembali}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Metode Penyerahan</td><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #15803d;">${handover}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Jadwal Pengambilan</td><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${schedule}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Lokasi Serah Terima</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${location}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Petugas Penyerah</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${loan.petugas || 'Admin PUSDATIN UMC'}</td></tr>
          </table>
          <p>Mohon menyiapkan kartu identitas / KTM untuk penandatanganan Berita Acara Peminjaman resmi.</p>
          <p style="font-size: 11px; color: #64748b;">Jam Operasional PUSDATIN: Senin - Jum'at 08.00 - 16.00 WIB, Sabtu 08.00 - 14.00 WIB.</p>
        </div>
      `,
      timestamp: new Date().toISOString()
    };
    this.recordLog(newLog);
  }

  public static async sendLoanReturned(loan: LoanTicket): Promise<void> {
    const recipient = loan.email || `${loan.peminjam.toLowerCase().replace(/\s+/g, '')}@umc.ac.id`;
    const newLog: EmailLog = {
      id: `EML-${Date.now()}`,
      ticketId: loan.id,
      recipientName: loan.peminjam,
      to: recipient,
      subject: `[PAHAM PUSDATIN UMC] Bukti Pengembalian Aset Selesai (${loan.id})`,
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #15803d;">PAHAM · PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON</h3>
          <p>Yth. <strong>${loan.peminjam}</strong>,</p>
          <p>Terima kasih. Perangkat inventaris untuk tiket <strong>${loan.id}</strong> (${loan.namaBarangT || loan.barangPinjaman}, Barcode: <strong>${loan.barcode}</strong>) telah <strong>DITERIMA KEMBALI</strong> di Ruang PUSDATIN Gedung Laboratorium Terpadu Lt. 2 pada tanggal <strong>${loan.tglDikembalikan || new Date().toISOString().split('T')[0]}</strong>.</p>
          <p>Kondisi saat kembali: <strong>${loan.kondisi || 'Baik & Lengkap'}</strong>.</p>
          <p>Status peminjaman ini telah <strong>SELESAI (CLEAR)</strong> dan ditutup secara resmi di sistem PAHAM.</p>
        </div>
      `,
      timestamp: new Date().toISOString()
    };
    this.recordLog(newLog);
  }

  public static async sendLoanRejected(loan: LoanTicket, reason: string): Promise<void> {
    const recipient = loan.email || `${loan.peminjam.toLowerCase().replace(/\s+/g, '')}@umc.ac.id`;
    const newLog: EmailLog = {
      id: `EML-${Date.now()}`,
      ticketId: loan.id,
      recipientName: loan.peminjam,
      to: recipient,
      subject: `[PAHAM PUSDATIN UMC] Informasi Status Pengajuan Peminjaman (${loan.id})`,
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #b91c1c;">PAHAM · PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON</h3>
          <p>Yth. <strong>${loan.peminjam}</strong>,</p>
          <p>Mohon maaf, pengajuan peminjaman aset untuk <strong>${loan.barangPinjaman}</strong> (${loan.id}) belum dapat disetujui saat ini.</p>
          <p><strong>Alasan / Catatan Petugas:</strong> <em>${reason}</em></p>
          <p>Jika ada kebutuhan mendesak atau konsultasi perangkat pengganti, silakan hubungi Ruang PUSDATIN di Gedung Laboratorium Terpadu Lt. 2 Kampus 2.</p>
        </div>
      `,
      timestamp: new Date().toISOString()
    };
    this.recordLog(newLog);
  }

  public static async sendOverdueReminder(loan: LoanTicket): Promise<void> {
    const recipient = loan.email || `${loan.peminjam.toLowerCase().replace(/\s+/g, '')}@umc.ac.id`;
    const newLog: EmailLog = {
      id: `EML-${Date.now()}`,
      ticketId: loan.id,
      recipientName: loan.peminjam,
      to: recipient,
      subject: `[PERINGATAN RESMI] Batas Waktu Pengembalian Aset PUSDATIN UMC (${loan.id})`,
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; color: #7f1d1d; line-height: 1.6; border: 2px solid #ef4444; padding: 20px; border-radius: 8px;">
          <h3 style="color: #b91c1c; margin-top: 0;">PERINGATAN PENGEMBALIAN ASET KAMPUS</h3>
          <p>Yth. <strong>${loan.peminjam}</strong> (${loan.unit}),</p>
          <p>Sistem inventaris PAHAM mendeteksi bahwa masa peminjaman aset Anda telah <strong>MELEWATI BATAS WAKTU (OVERDUE)</strong>:</p>
          <ul>
            <li><strong>ID Tiket:</strong> ${loan.id}</li>
            <li><strong>Barang Pinjaman:</strong> ${loan.namaBarangT || loan.barangPinjaman}</li>
            <li><strong>Barcode Aset:</strong> ${loan.barcode || '-'}</li>
            <li><strong>Batas Pengembalian:</strong> ${loan.tglKembali}</li>
          </ul>
          <p>Mohon segera menyerahkan kembali fisik perangkat beserta aksesoris lengkap ke <strong>Ruang PUSDATIN UMC (Gedung Laboratorium Terpadu Lantai 2, Kampus 2 Jl. Watubelah No 40 Sumber-Cirebon)</strong> hari ini.</p>
        </div>
      `,
      timestamp: new Date().toISOString()
    };
    this.recordLog(newLog);
  }

  public static async sendDamageStatusUpdate(ticket: DamageTicket, statusTitle: string, note: string): Promise<void> {
    const recipient = `${ticket.pelapor.toLowerCase().replace(/[^a-z0-9]/g, '') || 'civitas'}@umc.ac.id`;
    const newLog: EmailLog = {
      id: `EML-${Date.now()}`,
      ticketId: ticket.id,
      recipientName: ticket.pelapor,
      to: recipient,
      subject: `[PAHAM PUSDATIN UMC] Pembaruan Status Tiket Kerusakan: ${ticket.status} (${ticket.id})`,
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #d97706;">PAHAM · PUSDATIN UNIVERSITAS MUHAMMADIYAH CIREBON</h3>
          <p>Yth. <strong>${ticket.pelapor}</strong>,</p>
          <p>Laporan kerusakan perangkat <strong>${ticket.namaBarang}</strong> (${ticket.id}) saat ini berstatus: <strong>${ticket.status} (${statusTitle})</strong>.</p>
          <p><strong>Catatan Teknisi:</strong> ${note}</p>
          <p>Lokasi Aset: <strong>${ticket.lokasi}</strong>.</p>
        </div>
      `,
      timestamp: new Date().toISOString()
    };
    this.recordLog(newLog);
  }
}
