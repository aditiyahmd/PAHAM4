import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Asset,
  DamageTicket,
  LoanTicket,
  SparePartItem,
  PicPerformanceReport,
  BukuPenerimaanItem,
  BukuPengeluaranItem,
  BukuAsetInventarisRekap,
  AppStatistics
} from '../types';
import { KOP_OFFICIAL_BASE64 } from './kopBase64';
import { AppDatabase } from './db';
import {
  computeAggregateSlaStats,
  computeSlaEvaluation,
  formatMinutesLabel,
  formatHoursLabel
} from './slaService';

export interface MonthlyReportParams {
  bulan: string;
  tahun: string;
  tipeLaporan: string;
  kategoriFilter?: string;
  lokasiFilter?: string;
  assets: Asset[];
  loans: LoanTicket[];
  damages: DamageTicket[];
  spareParts?: any[];
  logs?: any[];
  picReports?: PicPerformanceReport[];
  picPerformance?: PicPerformanceReport[];
  kepalaPusdatin?: string;
  nipKepala?: string;
  petugas?: string;
}

export class PdfReportService {
  /**
   * Surat Bukti / Berita Acara Peminjaman atau Pengembalian Aset
   */
  public static generateLoanReceiptPdf(
    loan: LoanTicket,
    options?: { kepalaPusdatin?: string; nipKepala?: string; petugas?: string }
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const isReturned = loan.status === 'Dikembalikan';
    const judulSurat = isReturned ? 'BERITA ACARA PENGEMBALIAN ASET' : 'SURAT BUKTI PEMINJAMAN ASET KAMPUS';
    const masterSig = AppDatabase.getDocumentSignatories();
    const kepalaNama = options?.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const kepalaNip = options?.nipKepala || masterSig.kepalaPusdatinNip;
    const petugasNama = options?.petugas || loan.petugas || masterSig.petugasDefaultNama;

    // Header Kop Surat Resmi UMC
    try {
      doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 15, 10, 180, 27);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(218, 36, 36);
      doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON', 105, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Pusat Data dan Teknologi Informasi (PUSDATIN)', 105, 24, { align: 'center' });
      doc.setLineWidth(0.8);
      doc.line(15, 37, 195, 37);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(judulSurat, 105, 44, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text(`Nomor Tiket: ${loan.id}`, 105, 49, { align: 'center' });

    // Tabel Informasi Peminjam
    autoTable(doc, {
      startY: 53,
      theme: 'grid',
      head: [['INFORMASI PEMINJAM', 'RINCIAN']],
      body: [
        ['Nama Lengkap', loan.peminjam],
        ['NIDN / NIK / NIM', loan.nik],
        ['Unit Kerja / Program Studi', loan.unit],
        ['Nomor WhatsApp / Kontak', loan.kontak],
        ['Email Institusi', loan.email || '-']
      ],
      headStyles: {
        fillColor: [218, 36, 36],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.2
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', textColor: [51, 65, 85] },
        1: { textColor: [15, 23, 42] }
      },
      margin: { left: 15, right: 15 }
    });

    const currentY = (doc as any).lastAutoTable.finalY + 4;

    // Tabel Spesifikasi Barang
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['SPESIFIKASI BARANG PINJAMAN', 'DETAIL ASET']],
      body: [
        ['Barang yang Diajukan', `${loan.barangPinjaman} (${loan.jumlah} Unit)`],
        ['Barcode Aset Dialokasikan', loan.barcode || '-'],
        ['Nama Resmi Aset', loan.namaBarangT || loan.barangPinjaman],
        ['Kondisi Saat Penyerahan', loan.kondisi || 'Baik / Berfungsi Normal'],
        ['Tanggal Rencana Pinjam', loan.tglPinjam],
        ['Batas Waktu Pengembalian', loan.tglKembali],
        ['Tanggal Pengambilan Barang', loan.tglAmbil || loan.tglPinjam],
        ...(isReturned ? [['Tanggal Aktual Dikembalikan', loan.tglDikembalikan || '-']] : []),
        ['Status Tiket', isReturned ? 'Dikembalikan (Selesai)' : 'Disetujui (Aktif)'],
        ['Petugas PUSDATIN Penyerah', petugasNama],
        ['Catatan Khusus', loan.catatan || '-']
      ],
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.2
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', textColor: [51, 65, 85] },
        1: { textColor: [15, 23, 42] }
      },
      margin: { left: 15, right: 15 }
    });

    const signY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);

    const todayDateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    doc.text(`Cirebon, ${todayDateStr}`, 145, signY);

    doc.text('Pihak Peminjam,', 30, signY + 6, { align: 'center' });
    doc.text('Petugas PUSDATIN,', 105, signY + 6, { align: 'center' });
    doc.text('Mengetahui,', 165, signY + 6, { align: 'center' });
    doc.text('Kepala PUSDATIN UMC', 165, signY + 10, { align: 'center' });

    const nameY = signY + 34;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${loan.peminjam} )`, 30, nameY, { align: 'center' });
    doc.text(`( ${petugasNama} )`, 105, nameY, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 165, nameY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`NIDN/NIK: ${loan.nik}`, 30, nameY + 4, { align: 'center' });
    doc.text('Pengelola Aset IT', 105, nameY + 4, { align: 'center' });
    if (kepalaNip) {
      doc.text(kepalaNip, 165, nameY + 4, { align: 'center' });
    }

    return doc;
  }

  /**
   * Laporan Bulanan Rekapitulasi Inventaris Resmi A4 Landscape (Enhanced User Request 5)
   */
  public static generateMonthlyReport(params: MonthlyReportParams): jsPDF {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const renderHeader = (pageTitle: string) => {
      try {
        doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 48.5, 7, 200, 27);
      } catch {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(218, 36, 36);
        doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON', 148.5, 14, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('Pusat Data dan Teknologi Informasi (PUSDATIN)', 148.5, 20, { align: 'center' });
        doc.setLineWidth(0.8);
        doc.line(15, 26, 282, 26);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(pageTitle, 148.5, 38, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Periode: ${params.bulan} ${params.tahun} | Cakupan: ${params.tipeLaporan}`, 148.5, 43, { align: 'center' });
    };

    renderHeader('LAPORAN REKAPITULASI INVENTARIS & LAYANAN PUSDATIN UMC (PAHAM)');

    let currentY = 48;

    // Helper to print summary KPI cards in PDF
    const totalAssets = params.assets.length;
    const assetsTersedia = params.assets.filter((a: Asset) => a.status === 'Tersedia').length;
    const assetsDipinjam = params.assets.filter((a: Asset) => a.status === 'Dipinjam').length;
    const assetsRusak = params.assets.filter((a: Asset) => a.status === 'Maintenance' || a.status === 'Rusak' || a.status === 'Diperbaiki' || a.status === 'Tidak Layak').length;

    const totalLoans = params.loans.length;
    const loansAktif = params.loans.filter((l: LoanTicket) => l.status === 'Diserahkan' || l.status === 'Dikonfirmasi').length;
    const loansKembali = params.loans.filter((l: LoanTicket) => l.status === 'Dikembalikan').length;
    const loansTerlambat = params.loans.filter((l: LoanTicket) => l.status === 'Terlambat').length;

    const totalDamages = params.damages.length;
    const damagesKritis = params.damages.filter((d: DamageTicket) => d.urgensi === 'Kritis' || d.prioritas === 'Kritis').length;
    const damagesSelesai = params.damages.filter((d: DamageTicket) => d.status === 'Resolved' || d.status === 'Closed – Auto' || d.status === 'Closed – Manual').length;
    const slaConfig = AppDatabase.getSlaConfig();
    const slaAgg = computeAggregateSlaStats(params.damages, slaConfig);

    // SECTION 1: RINGKASAN JUMLAH ASET & STATISTIK EKSEKUTIF
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['RINGKASAN EKSEKUTIF BULANAN PUSDATIN UMC', 'JUMLAH UNIT / TIKET', 'RINCIAN / DISTRIBUSI STATUS']],
      body: [
        ['Total Master Data Aset Kampus', `${totalAssets} Unit`, `Tersedia: ${assetsTersedia} | Dipinjam: ${assetsDipinjam} | Rusak/Servis: ${assetsRusak}`],
        ['Transaksi Peminjaman Aset', `${totalLoans} Transaksi`, `Aktif: ${loansAktif} | Selesai Kembali: ${loansKembali} | Terlambat: ${loansTerlambat}`],
        ['Tiket Kerusakan Perangkat', `${totalDamages} Laporan`, `Selesai: ${damagesSelesai} | Urgensi Kritis: ${damagesKritis} Unit`],
        ['Performa SLA Helpdesk (FRT & RT)', `FRT ${slaAgg.frtComplianceRate}% | RT ${slaAgg.rtComplianceRate}%`, `Rata-rata FRT: ${formatMinutesLabel(slaAgg.avgFrtMinutes)} | Rata-rata RT: ${formatHoursLabel(slaAgg.avgRtHours)}`],
        ['Kebutuhan Suku Cadang', `${params.spareParts?.length || 0} Komponen`, `Diminta/Belum: ${params.spareParts?.filter((s: any) => s.statusPengadaan === 'Diminta' || s.statusPengadaan === 'Belum Dibeli').length || 0} | Proses/Beli: ${params.spareParts?.filter((s: any) => s.statusPengadaan === 'Disetujui' || s.statusPengadaan === 'Dipesan' || s.statusPengadaan === 'Diterima' || s.statusPengadaan === 'Sudah Dibeli').length || 0} | Terpasang: ${params.spareParts?.filter((s: any) => s.statusPengadaan === 'Terpasang' || s.statusPengadaan === 'Sudah Digunakan').length || 0}`]
      ],
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 50, fontStyle: 'bold', halign: 'center', textColor: [185, 28, 28] },
        2: { textColor: [51, 65, 85] }
      },
      margin: { left: 15, right: 15 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // SECTION 2: KINERJA TIKET PER MASING-MASING PIC / TEKNISI (User Request 5)
    if (params.picPerformance && params.picPerformance.length > 0 && (params.tipeLaporan === 'Semua' || params.tipeLaporan === 'Kinerja PIC')) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('1. REKAPITULASI PENANGANAN TIKET PER MASING-MASING PIC / TEKNISI', 15, currentY);

      autoTable(doc, {
        startY: currentY + 2,
        theme: 'grid',
        head: [['No', 'ID PIC', 'Nama Teknisi / PIC', 'Bidang / Spesialisasi', 'Jenjang', 'Tiket Selesai', 'Tiket Proses', 'Total Ditangani', 'Rasio Penyelesaian']],
        body: params.picPerformance.map((p: PicPerformanceReport, idx: number) => [
          (idx + 1).toString(),
          p.technicianId,
          p.technicianName,
          p.role,
          p.level || 'Senior',
          `${p.totalResolved} Tiket`,
          `${p.totalInProgress} Tiket`,
          `${p.totalAssigned} Tiket`,
          `${p.resolutionRate}%`
        ]),
        headStyles: {
          fillColor: [109, 40, 217],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { cellWidth: 18, fontStyle: 'bold' },
          2: { fontStyle: 'bold', cellWidth: 48 },
          5: { halign: 'center', textColor: [16, 185, 129], fontStyle: 'bold' },
          6: { halign: 'center', textColor: [245, 158, 11] },
          7: { halign: 'center', fontStyle: 'bold' },
          8: { halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // SECTION 3: REKAPITULASI SUKU CADANG (User Request 4 & 5)
    if (params.spareParts && params.spareParts.length > 0 && (params.tipeLaporan === 'Semua' || params.tipeLaporan === 'Suku Cadang')) {
      if (currentY > 150) {
        doc.addPage('landscape');
        renderHeader('LAPORAN KEBUTUHAN SUKU CADANG & PENGADAAN');
        currentY = 48;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('2. REKAPITULASI KEBUTUHAN SUKU CADANG & STATUS PENGADAAN', 15, currentY);

      autoTable(doc, {
        startY: currentY + 2,
        theme: 'grid',
        head: [['No', 'ID Tiket', 'Perangkat Aset', 'Komponen / Suku Cadang', 'Urgensi', 'Status Pengadaan', 'PIC Penanganan', 'Tgl Dilaporkan']],
        body: params.spareParts.map((sp: any, idx: number) => [
          (idx + 1).toString(),
          sp.ticketId,
          sp.namaBarang,
          sp.namaKomponen,
          sp.urgensi,
          sp.statusPengadaan,
          sp.namaPicTeknisi,
          sp.tanggalLapor
        ]),
        headStyles: {
          fillColor: [217, 119, 6],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { cellWidth: 22, fontStyle: 'bold' },
          4: { halign: 'center', fontStyle: 'bold' },
          5: { halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // SECTION 4: TIKET KERUSAKAN & URGENSI
    if (params.tipeLaporan === 'Semua' || params.tipeLaporan === 'Kerusakan') {
      if (currentY > 145) {
        doc.addPage('landscape');
        renderHeader('LAPORAN TIKET KERUSAKAN & SERVIS PERANGKAT');
        currentY = 48;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('3. DAFTAR TIKET KERUSAKAN PERANGKAT & PENGUKURAN SLA (FRT & RT)', 15, currentY);

      autoTable(doc, {
        startY: currentY + 2,
        theme: 'grid',
        head: [['No', 'ID Tiket', 'Perangkat / Aset', 'Lokasi', 'Urgensi', 'FRT (Respons)', 'RT (Selesai)', 'PIC Teknisi', 'Status']],
        body: params.damages.map((d: DamageTicket, idx: number) => {
          const ev = computeSlaEvaluation(d, slaConfig);
          return [
            (idx + 1).toString(),
            d.id,
            d.namaBarang,
            d.lokasi,
            d.urgensi || 'Sedang',
            `${ev.frtLabel} (${ev.frtStatus})`,
            `${ev.rtLabel} (${ev.rtStatus})`,
            d.namaPicTeknisi || d.picTeknisi || '-',
            d.status
          ];
        }),
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 6.8,
          cellPadding: 1.7
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { cellWidth: 22, fontStyle: 'bold' },
          4: { halign: 'center', fontStyle: 'bold' },
          8: { halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // SECTION 5: TRANSAKSI PEMINJAMAN
    if (params.tipeLaporan === 'Peminjaman') {
      if (currentY > 145) {
        doc.addPage('landscape');
        renderHeader('LAPORAN TRANSAKSI PEMINJAMAN ASET');
        currentY = 48;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('DAFTAR TRANSAKSI PEMINJAMAN ASET', 15, currentY);

      autoTable(doc, {
        startY: currentY + 2,
        theme: 'grid',
        head: [['No', 'ID Tiket', 'Peminjam', 'Unit Kerja / Prodi', 'Kontak/WA', 'Barang Pinjaman', 'Barcode', 'Tgl Pinjam', 'Tgl Kembali', 'Status']],
        body: params.loans.map((l: LoanTicket, i: number) => [
          (i + 1).toString(),
          l.id,
          l.peminjam,
          l.unit,
          l.kontak,
          `${l.barangPinjaman} (${l.jumlah} Unit)`,
          l.barcode || '-',
          l.tglPinjam,
          l.tglKembali,
          l.status
        ]),
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // SECTION 6: MASTER DATA ASET (Jika dipilih khusus)
    if (params.tipeLaporan === 'Aset Terkini') {
      if (currentY > 145) {
        doc.addPage('landscape');
        renderHeader('LAPORAN MASTER DATA ASET & STATUS TERKINI');
        currentY = 48;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('DAFTAR MASTER DATA ASET & KONDISI INVENTARIS', 15, currentY);

      autoTable(doc, {
        startY: currentY + 2,
        theme: 'grid',
        head: [['No', 'Barcode', 'Nama Barang / Perangkat', 'Kategori', 'Status', 'Lokasi Penempatan', 'Tgl Masuk']],
        body: params.assets.map((a: Asset, i: number) => [
          (i + 1).toString(),
          a.barcode,
          a.nama,
          a.kategori,
          a.status,
          a.lokasi,
          a.tanggalMasuk
        ]),
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // TANDA TANGAN PIMPINAN
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);

    let signY = currentY + 6;
    if (signY > 155) {
      doc.addPage('landscape');
      renderHeader('LEMBAR PENGESAHAN LAPORAN BULANAN PUSDATIN');
      signY = 55;
    }

    const masterSig = AppDatabase.getDocumentSignatories();
    const petugasFinal = params.petugas || masterSig.petugasDefaultNama;
    const kepalaFinal = params.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const nipFinal = params.nipKepala || masterSig.kepalaPusdatinNip;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);

    const todayDateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    doc.text(`Cirebon, ${todayDateStr}`, 220, signY);

    doc.text('Petugas Pengelola Aset,', 50, signY + 6, { align: 'center' });
    doc.text('Mengetahui,', 220, signY + 6, { align: 'center' });
    doc.text('Kepala PUSDATIN UMC', 220, signY + 10, { align: 'center' });

    const nameY = signY + 30;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${petugasFinal} )`, 50, nameY, { align: 'center' });
    doc.text(`( ${kepalaFinal} )`, 220, nameY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Staff IT PUSDATIN UMC', 50, nameY + 4, { align: 'center' });
    if (nipFinal) {
      doc.text(nipFinal, 220, nameY + 4, { align: 'center' });
    }

    return doc;
  }

  /**
   * Cetak Berita Acara Serah Terima (BAST) Penerimaan Aset TI
   */
  public static generateBukuPenerimaanBastPdf(
    item: BukuPenerimaanItem,
    options?: { kepalaPusdatin?: string; nipKepala?: string; petugas?: string; [key: string]: any }
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const masterSig = AppDatabase.getDocumentSignatories();
    const kepalaNama = options?.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const kepalaNip = options?.nipKepala || masterSig.kepalaPusdatinNip;
    const petugasNama = options?.petugas || item.petugas || masterSig.petugasDefaultNama;

    try {
      doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 15, 10, 180, 27);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(218, 36, 36);
      doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON', 105, 18, { align: 'center' });
      doc.line(15, 37, 195, 37);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('BERITA ACARA SERAH TERIMA (BAST) PENERIMAAN ASET TI', 105, 43, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(185, 28, 28);
    doc.text(`Nomor BAST: ${item.nomorBeritaAcara}`, 105, 48, { align: 'center' });

    autoTable(doc, {
      startY: 52,
      theme: 'grid',
      head: [['INFORMASI PENERIMAAN / FAKTUR', 'KETERANGAN']],
      body: [
        ['Penyedia / Vendor / Rekanan', item.dari],
        ['Nomor Faktur / Invoice', item.nomorFaktur],
        ['Tanggal Faktur', item.tanggalFaktur],
        ['Tanggal Penerimaan Fisik', item.tanggalPenerimaan],
        ['Nomor Berita Acara', item.nomorBeritaAcara],
        ['Tanggal Berita Acara', item.tanggalBeritaAcara],
        ['Petugas Penerima PUSDATIN', petugasNama],
        ['Catatan / Peruntukan', item.keterangan || '-']
      ],
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
      margin: { left: 15, right: 15 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 4;

    // Rincian Barang
    const subItems = item.items && item.items.length > 0 ? item.items : [
      {
        namaAset: item.namaAset,
        kategori: item.kategori,
        banyaknya: item.banyaknya,
        hargaSatuan: item.hargaSatuan,
        jumlahHarga: item.jumlahHarga,
        unitRegisteredBarcodes: []
      }
    ];

    const bodyRows = subItems.map((s, idx) => [
      String(idx + 1),
      String(s.namaAset || '-'),
      String(s.kategori || '-'),
      `${s.banyaknya || 0} Unit`,
      `Rp ${(s.hargaSatuan || 0).toLocaleString('id-ID')}`,
      `Rp ${(s.jumlahHarga || 0).toLocaleString('id-ID')}`,
      s.unitRegisteredBarcodes && s.unitRegisteredBarcodes.length > 0
        ? `${s.unitRegisteredBarcodes.length} Terdaftar (${s.unitRegisteredBarcodes.slice(0, 3).join(', ')}${s.unitRegisteredBarcodes.length > 3 ? '...' : ''})`
        : 'Tercatat'
    ]);

    const totalQty = subItems.reduce((acc, curr) => acc + (curr.banyaknya || 0), 0);
    const grandTotal = subItems.reduce((acc, curr) => acc + (curr.jumlahHarga || 0), 0);

    bodyRows.push([
      'TOTAL',
      'Akumulasi Barang Diterima',
      '-',
      `${totalQty} Unit`,
      '-',
      `Rp ${grandTotal.toLocaleString('id-ID')}`,
      '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['No', 'Nama Perangkat / Aset', 'Kategori', 'Qty', 'Harga Satuan', 'Jumlah Harga', 'Registrasi Unit']],
      body: bodyRows,
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
    if (currentY > 230) {
      doc.addPage();
      currentY = 25;
    }

    const todayDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cirebon, ${todayDateStr}`, 145, currentY);

    const signY = currentY + 6;
    doc.setTextColor(0, 0, 0);
    doc.text('Pihak Penyedia / Pengirim,', 45, signY, { align: 'center' });
    doc.text('Petugas Penerima PUSDATIN,', 150, signY, { align: 'center' });

    const nameY = signY + 24;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${item.dari} )`, 45, nameY, { align: 'center' });
    doc.text(`( ${petugasNama} )`, 150, nameY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Mengetahui / Menyetujui,', 105, nameY + 8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Kepala PUSDATIN UMC', 105, nameY + 12, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 105, nameY + 30, { align: 'center' });
    if (kepalaNip) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(kepalaNip, 105, nameY + 34, { align: 'center' });
    }

    return doc;
  }

  /**
   * Cetak Rekapitulasi Buku Penerimaan Bulanan
   */
  public static generateBukuPenerimaanMonthlyPdf(
    items: BukuPenerimaanItem[],
    monthStr: string,
    options?: { kepalaPusdatin?: string; nipKepala?: string; petugas?: string; title?: string; [key: string]: any }
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const masterSig = AppDatabase.getDocumentSignatories();
    const kepalaNama = options?.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const kepalaNip = options?.nipKepala || masterSig.kepalaPusdatinNip;
    const petugasNama = options?.petugas || masterSig.petugasDefaultNama;

    try {
      doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 15, 8, 267, 26);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON - PUSDATIN', 148.5, 14, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`REKAPITULASI BUKU PENERIMAAN ASET TI - BULAN ${monthStr.toUpperCase()}`, 148.5, 38, { align: 'center' });

    const tableRows = items.map((it, idx) => [
      String(idx + 1),
      String(it.tanggalPenerimaan || '-'),
      String(it.dari || '-'),
      String(it.nomorFaktur || '-'),
      String(it.namaAset || (it.items ? `${it.items.length} Macam Barang` : '-')),
      String(it.kategori || (it.items ? it.items[0]?.kategori || 'Multi' : '-')),
      `${it.banyaknya || (it.items ? it.items.reduce((s, x) => s + (x.banyaknya || 0), 0) : 0)} Unit`,
      `Rp ${(it.hargaSatuan || 0).toLocaleString('id-ID')}`,
      `Rp ${(it.jumlahHarga || 0).toLocaleString('id-ID')}`,
      String(it.nomorBeritaAcara || '-')
    ]);

    const grandQty = items.reduce((s, it) => s + (it.banyaknya || 0), 0);
    const grandNilai = items.reduce((s, it) => s + (it.jumlahHarga || 0), 0);

    tableRows.push([
      'TOTAL',
      '-',
      '-',
      '-',
      'Akumulasi Penerimaan',
      '-',
      `${grandQty} Unit`,
      '-',
      `Rp ${grandNilai.toLocaleString('id-ID')}`,
      '-'
    ]);

    autoTable(doc, {
      startY: 44,
      theme: 'grid',
      head: [['No', 'Tgl Terima', 'Vendor/Rekanan', 'No Faktur', 'Nama Perangkat', 'Kategori', 'Qty', 'Harga Satuan', 'Jumlah Harga', 'Nomor BAST']],
      body: tableRows,
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        6: { halign: 'center', fontStyle: 'bold' },
        7: { halign: 'right' },
        8: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);
    let signY = (doc as any).lastAutoTable.finalY + 8;
    if (signY > 150) {
      doc.addPage('landscape');
      signY = 30;
    }

    const todayDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cirebon, ${todayDateStr}`, 215, signY);
    doc.text('Petugas Pengelola Aset,', 50, signY + 6, { align: 'center' });
    doc.text('Mengetahui, Kepala PUSDATIN UMC', 215, signY + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${petugasNama} )`, 50, signY + 26, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 215, signY + 26, { align: 'center' });
    if (kepalaNip) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      doc.text(kepalaNip, 215, signY + 30, { align: 'center' });
    }

    return doc;
  }

  /**
   * Cetak Berita Acara Serah Terima Pengeluaran Aset TI
   */
  public static generateBukuPengeluaranBastPdf(
    item: BukuPengeluaranItem,
    options?: { kepalaPusdatin?: string; nipKepala?: string; petugas?: string; [key: string]: any }
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const masterSig = AppDatabase.getDocumentSignatories();
    const kepalaNama = options?.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const kepalaNip = options?.nipKepala || masterSig.kepalaPusdatinNip;
    const petugasNama = options?.petugas || item.petugas || masterSig.petugasDefaultNama;

    try {
      doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 15, 10, 180, 27);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(218, 36, 36);
      doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON - PUSDATIN', 105, 18, { align: 'center' });
      doc.line(15, 37, 195, 37);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('BERITA ACARA PENGELUARAN & PENYERAHAN ASET TI', 105, 43, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(185, 28, 28);
    doc.text(`ID Pengeluaran: ${item.idPengeluaran}`, 105, 48, { align: 'center' });

    autoTable(doc, {
      startY: 52,
      theme: 'grid',
      head: [['INFORMASI PENGELUARAN ASET', 'KETERANGAN']],
      body: [
        ['Tanggal Penyerahan Fisik', item.tanggalPenyerahan],
        ['Peruntukan / Unit Kerja Tujuan', item.untuk],
        ['Jenis Pengeluaran', item.jenisPengeluaran],
        ['Petugas PUSDATIN', petugasNama],
        ['Catatan Keperluan', item.keterangan || '-']
      ],
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
      margin: { left: 15, right: 15 }
    });

    const subItems = item.items && item.items.length > 0 ? item.items : [
      {
        barcode: item.barcode,
        kodeUnikAset: item.kodeUnikAset,
        namaAset: item.namaAset,
        lokasi: item.untuk
      }
    ];

    const bodyRows = subItems.map((s, idx) => [
      String(idx + 1),
      s.kodeUnikAset,
      s.barcode,
      s.namaAset,
      s.lokasi || item.untuk
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: 'grid',
      head: [['No', 'Kode Unik Aset', 'Barcode', 'Nama Perangkat / Aset', 'Lokasi Penempatan']],
      body: bodyRows,
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { fontStyle: 'bold' } },
      margin: { left: 15, right: 15 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;
    if (currentY > 230) {
      doc.addPage();
      currentY = 25;
    }

    const todayDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cirebon, ${todayDateStr}`, 145, currentY);

    const signY = currentY + 6;
    doc.setTextColor(0, 0, 0);
    doc.text('Pihak Penerima Unit Kerja,', 45, signY, { align: 'center' });
    doc.text('Petugas Penyerah PUSDATIN,', 150, signY, { align: 'center' });

    const nameY = signY + 24;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${item.untuk} )`, 45, nameY, { align: 'center' });
    doc.text(`( ${petugasNama} )`, 150, nameY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Mengetahui / Menyetujui,', 105, nameY + 8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Kepala PUSDATIN UMC', 105, nameY + 12, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 105, nameY + 30, { align: 'center' });
    if (kepalaNip) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(kepalaNip, 105, nameY + 34, { align: 'center' });
    }

    return doc;
  }

  /**
   * Cetak Rekapitulasi Buku Pengeluaran Bulanan
   */
  public static generateBukuPengeluaranMonthlyPdf(
    items: BukuPengeluaranItem[],
    monthStr: string,
    options?: { kepalaPusdatin?: string; nipKepala?: string; petugas?: string; title?: string; [key: string]: any }
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const masterSig = AppDatabase.getDocumentSignatories();
    const kepalaNama = options?.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const kepalaNip = options?.nipKepala || masterSig.kepalaPusdatinNip;
    const petugasNama = options?.petugas || masterSig.petugasDefaultNama;

    try {
      doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 15, 8, 267, 26);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON - PUSDATIN', 148.5, 14, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `REKAPITULASI BUKU PENGELUARAN ASET TI - PERIODE ${monthStr.toUpperCase()}`,
      148.5,
      38,
      { align: 'center' }
    );

    const totalUnit = items.reduce((sum, it) => {
      const sub = it.items || it.subItems;
      return sum + (sub && sub.length > 0 ? sub.length : (it.jumlah || 1));
    }, 0);
    const totalPenggunaan = items.filter(it => it.jenisPengeluaran === 'Penggunaan').length;
    const totalPeminjaman = items.filter(it => it.jenisPengeluaran === 'Peminjaman').length;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Total Transaksi: ${items.length} Catatan (${totalUnit} Unit Aset) | Jalur Penggunaan: ${totalPenggunaan} | Jalur Peminjaman: ${totalPeminjaman}`,
      148.5,
      43,
      { align: 'center' }
    );

    const tableRows = items.map((it, idx) => {
      const sub = it.items || it.subItems;
      const isBatch = Boolean(sub && sub.length > 1);
      const assetNames = isBatch
        ? sub!.map((s: any) => `• ${s.namaAset}`).join('\n')
        : String(it.namaAset || '-');
      const assetCodes = isBatch
        ? sub!.map((s: any) => s.kodeUnikAset || s.barcode).join('\n')
        : `${it.kodeUnikAset || '-'}\n(${it.barcode || '-'})`;
      const unitCount = sub && sub.length > 0 ? sub.length : (it.jumlah || 1);

      return [
        String(idx + 1),
        String(it.idPengeluaran || '-'),
        String(it.tanggalPenyerahan || it.tanggalPengeluaran || '-'),
        assetCodes,
        assetNames,
        `${unitCount} Unit`,
        it.jenisPengeluaran === 'Penggunaan' ? 'Penggunaan' : 'Peminjaman',
        String(it.untuk || it.tujuanPengeluaran || '-'),
        String(it.petugas || 'Admin PUSDATIN'),
        String(it.keterangan || '-')
      ];
    });

    tableRows.push([
      'TOTAL',
      '-',
      '-',
      '-',
      'Akumulasi Pengeluaran Aset',
      `${totalUnit} Unit`,
      `${items.length} Dok`,
      '-',
      '-',
      '-'
    ]);

    autoTable(doc, {
      startY: 47,
      theme: 'grid',
      head: [
        [
          'No',
          'ID Pengeluaran',
          'Tgl Serah',
          'Kode Unik / Barcode',
          'Nama Aset Dikeluarkan',
          'Qty',
          'Jalur',
          'Untuk (Unit / Penerima)',
          'Petugas',
          'Keterangan'
        ]
      ],
      body: tableRows,
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 1.8 },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 24, fontStyle: 'bold' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 32 },
        5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 20, halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);
    let signY = (doc as any).lastAutoTable.finalY + 8;
    if (signY > 150) {
      doc.addPage('landscape');
      signY = 30;
    }

    const todayDateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cirebon, ${todayDateStr}`, 215, signY);
    doc.text('Petugas Pengelola Aset,', 50, signY + 6, { align: 'center' });
    doc.text('Mengetahui, Kepala PUSDATIN UMC', 215, signY + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${petugasNama} )`, 50, signY + 26, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 215, signY + 26, { align: 'center' });
    if (kepalaNip) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      doc.text(kepalaNip, 215, signY + 30, { align: 'center' });
    }

    return doc;
  }

  /**
   * Cetak Buku Aset Inventaris (Rekapitulasi Saldo & Rincian)
   */
  public static generateBukuInventarisPdf(
    rekapList: BukuAsetInventarisRekap[],
    assets: Asset[],
    options?: { kepalaPusdatin?: string; nipKepala?: string; petugas?: string; [key: string]: any }
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const masterSig = AppDatabase.getDocumentSignatories();
    const kepalaNama = options?.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const kepalaNip = options?.nipKepala || masterSig.kepalaPusdatinNip;
    const petugasNama = options?.petugas || masterSig.petugasDefaultNama;

    try {
      doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 15, 8, 267, 26);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON - PUSDATIN', 148.5, 14, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BUKU ASET INVENTARIS TI - REKAPITULASI SALDO STOK KAMPUS', 148.5, 38, { align: 'center' });

    const rekapRows = rekapList.map(r => [
      r.kategori,
      `${r.totalMasuk} Unit`,
      `${r.totalKeluar} Unit`,
      `${r.stokTersedia} Unit`,
      `Tersedia: ${r.rincianStatus.tersedia} | Dipinjam: ${r.rincianStatus.dipinjam} | Digunakan: ${r.rincianStatus.digunakan} | Servis: ${r.rincianStatus.maintenance + r.rincianStatus.tidakLayak}`,
      `Rp ${r.nilaiAsetTotal.toLocaleString('id-ID')}`
    ]);

    const totalMasukAll = rekapList.reduce((s, r) => s + r.totalMasuk, 0);
    const totalKeluarAll = rekapList.reduce((s, r) => s + r.totalKeluar, 0);
    const totalStokAll = rekapList.reduce((s, r) => s + r.stokTersedia, 0);
    const totalNilaiAll = rekapList.reduce((s, r) => s + r.nilaiAsetTotal, 0);

    rekapRows.push([
      'TOTAL KESELURUHAN',
      `${totalMasukAll} Unit`,
      `${totalKeluarAll} Unit`,
      `${totalStokAll} Unit`,
      `Total ${assets.length} Unit Tercatat Aktif`,
      `Rp ${totalNilaiAll.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: 44,
      theme: 'grid',
      head: [['Kategori Aset', 'Total Masuk', 'Total Keluar', 'Saldo Stok Siap', 'Rincian Status Operasional', 'Total Nilai Aset']],
      body: rekapRows,
      headStyles: { fillColor: [147, 51, 234], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);
    let signY = (doc as any).lastAutoTable.finalY + 8;
    if (signY > 150) {
      doc.addPage('landscape');
      signY = 30;
    }

    const todayDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cirebon, ${todayDateStr}`, 215, signY);
    doc.text('Petugas Pengelola Inventaris,', 50, signY + 6, { align: 'center' });
    doc.text('Mengetahui, Kepala PUSDATIN UMC', 215, signY + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${petugasNama} )`, 50, signY + 26, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 215, signY + 26, { align: 'center' });
    if (kepalaNip) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      doc.text(kepalaNip, 215, signY + 30, { align: 'center' });
    }

    return doc;
  }

  /**
   * Cetak Master Aset TI (filter berdasarkan bulan, kategori, atau lokasi)
   */
  public static generateMasterAsetPdf(
    assets: Asset[],
    filterDesc: string,
    options?: { kepalaPusdatin?: string; nipKepala?: string; petugas?: string; [key: string]: any }
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const masterSig = AppDatabase.getDocumentSignatories();
    const kepalaNama = options?.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const kepalaNip = options?.nipKepala || masterSig.kepalaPusdatinNip;
    const petugasNama = options?.petugas || masterSig.petugasDefaultNama;

    try {
      doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 15, 8, 267, 26);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON - PUSDATIN', 148.5, 14, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`DAFTAR MASTER ASET TI KAMPUS - FILTER: ${filterDesc.toUpperCase()}`, 148.5, 38, { align: 'center' });

    const rows = assets.map((a, idx) => [
      String(idx + 1),
      a.kodeUnikAset,
      a.barcode,
      a.nama,
      a.merekModel || '-',
      a.kategori,
      a.lokasi,
      a.pengguna ? `${a.pengguna} (${a.bidangPengguna || '-'})` : '-',
      a.tanggalMasuk,
      a.status
    ]);

    autoTable(doc, {
      startY: 44,
      theme: 'grid',
      head: [['No', 'Kode Unik', 'Barcode', 'Nama Perangkat', 'Merek/Model', 'Kategori', 'Lokasi Penempatan', 'Pengguna', 'Tgl Masuk', 'Status']],
      body: rows,
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 1.8 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { fontStyle: 'bold' },
        9: { fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);
    let signY = (doc as any).lastAutoTable.finalY + 8;
    if (signY > 150) {
      doc.addPage('landscape');
      signY = 30;
    }

    const todayDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cirebon, ${todayDateStr}`, 215, signY);
    doc.text('Petugas Pengelola Aset,', 50, signY + 6, { align: 'center' });
    doc.text('Mengetahui, Kepala PUSDATIN UMC', 215, signY + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${petugasNama} )`, 50, signY + 26, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 215, signY + 26, { align: 'center' });
    if (kepalaNip) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      doc.text(kepalaNip, 215, signY + 30, { align: 'center' });
    }

    return doc;
  }

  /**
   * Cetak Kebutuhan Suku Cadang berdasarkan Status
   */
  public static generateSparePartsPdf(
    parts: any[],
    statusTitle: string,
    options?: { kepalaPusdatin?: string; nipKepala?: string; petugas?: string }
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const masterSig = AppDatabase.getDocumentSignatories();
    const kepalaNama = options?.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const kepalaNip = options?.nipKepala || masterSig.kepalaPusdatinNip;
    const petugasNama = options?.petugas || masterSig.petugasDefaultNama;

    try {
      doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 15, 8, 267, 26);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON - PUSDATIN', 148.5, 14, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`LAPORAN KEBUTUHAN & STATUS PENGADAAN SUKU CADANG (${statusTitle.toUpperCase()})`, 148.5, 38, { align: 'center' });

    const rows = parts.map((p, idx) => [
      String(idx + 1),
      p.ticketId || '-',
      p.namaKomponen,
      p.namaBarang,
      p.lokasi || '-',
      p.urgensi || 'Sedang',
      p.statusPengadaan,
      p.namaPicTeknisi || p.picTeknisi || '-',
      p.catatan || '-'
    ]);

    autoTable(doc, {
      startY: 44,
      theme: 'grid',
      head: [['No', 'ID Tiket', 'Nama Suku Cadang', 'Aset Terdampak', 'Lokasi', 'Urgensi', 'Status Pengadaan', 'Teknisi PIC', 'Catatan']],
      body: rows,
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { fontStyle: 'bold' },
        6: { fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);
    let signY = (doc as any).lastAutoTable.finalY + 8;
    if (signY > 150) {
      doc.addPage('landscape');
      signY = 30;
    }

    const todayDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cirebon, ${todayDateStr}`, 215, signY);
    doc.text('Petugas Pengadaan Suku Cadang,', 50, signY + 6, { align: 'center' });
    doc.text('Mengetahui, Kepala PUSDATIN UMC', 215, signY + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${petugasNama} )`, 50, signY + 26, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 215, signY + 26, { align: 'center' });
    if (kepalaNip) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      doc.text(kepalaNip, 215, signY + 30, { align: 'center' });
    }

    return doc;
  }

  /**
   * Cetak Laporan Eksekutif Dashboard Pimpinan
   */
  public static generateExecutiveDashboardPdf(
    stats: AppStatistics,
    monthStr: string,
    options?: { kepalaPusdatin?: string; nipKepala?: string; petugas?: string; rektorNama?: string; pimpinanJabatan?: string; [key: string]: any }
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const masterSig = AppDatabase.getDocumentSignatories();
    const kepalaNama = options?.kepalaPusdatin || masterSig.kepalaPusdatinNama;
    const kepalaNip = options?.nipKepala || masterSig.kepalaPusdatinNip;
    const rektorNama = options?.rektorNama || masterSig.pimpinanUnivNama;
    const pimpinanJabatan = options?.pimpinanJabatan || masterSig.pimpinanUnivJabatan || 'Rektor / Pimpinan Universitas';

    try {
      doc.addImage(KOP_OFFICIAL_BASE64, 'PNG', 15, 10, 180, 27);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('UNIVERSITAS MUHAMMADIYAH CIREBON', 105, 18, { align: 'center' });
      doc.line(15, 37, 195, 37);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN EKSEKUTIF DASHBOARD PIMPINAN TI', 105, 43, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Periode: ${monthStr.toUpperCase()} | Sistem Informasi PAHAM PUSDATIN UMC`, 105, 48, { align: 'center' });

    autoTable(doc, {
      startY: 53,
      theme: 'grid',
      head: [['METRIK UTAMA TI KAMPUS', 'NILAI / JUMLAH', 'KETERANGAN']],
      body: [
        ['Total Master Aset TI', `${stats.totalAset} Unit`, 'Akumulasi perangkat tercatat di kampus'],
        ['Aset Siap Pakai (Tersedia)', `${stats.tersedia} Unit`, 'Standby di Ruang PUSDATIN / Lab'],
        ['Aset Sedang Digunakan', `${stats.digunakan} Unit`, 'Terpasang operasional unit kerja'],
        ['Aset Sedang Dipinjam', `${stats.dipinjam} Unit`, 'Peminjaman civitas akademika'],
        ['Aset Dalam Perbaikan / Servis', `${stats.maintenance || 0} Unit`, 'Proses reparasi & suku cadang'],
        ['Antrean Tiket Gangguan Masuk', `${stats.totalAntreanTiket} Tiket`, 'Tiket helpdesk baru & perlu ditangani'],
        ['Tiket Melewati Batas SLA', `${stats.totalSlaOverdue} Tiket`, stats.totalSlaOverdue === 0 ? 'Optimal (Tidak ada overdue)' : 'Perlu atensi teknis'],
        ['Kepatuhan First Response Time (FRT)', `${stats.frtComplianceRate ?? 100}%`, `Rata-rata respon pertama: ${formatMinutesLabel(stats.avgFrtMinutes ?? 0)}`],
        ['Kepatuhan Resolution Time (RT / SLA)', `${stats.rtComplianceRate ?? stats.slaAchievementRate}%`, `Rata-rata penyelesaian: ${formatHoursLabel(stats.avgRtHours ?? 0)}`],
        ['Peminjaman Menunggu Persetujuan', `${stats.totalPinjamMenunggu} Pengajuan`, 'Menunggu verifikasi admin'],
        ['Peminjaman Terlambat Kembali', `${stats.totalPinjamTerlambat} Unit`, stats.totalPinjamTerlambat === 0 ? 'Tertib' : 'Peringatan otomatis aktif'],
        ['Pengajuan Sistem Baru', `${stats.totalPengajuanSistem} Usulan`, `Dalam pengembangan: ${stats.pengajuanDalamPengembangan} sistem`]
      ],
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'center', fontStyle: 'bold', textColor: [185, 28, 28] }
      },
      margin: { left: 15, right: 15 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;
    if (currentY > 230) {
      doc.addPage();
      currentY = 25;
    }

    const todayDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cirebon, ${todayDateStr}`, 145, currentY);

    const signY = currentY + 6;
    doc.setTextColor(0, 0, 0);
    doc.text(`Mengetahui, ${pimpinanJabatan}`, 48, signY, { align: 'center' });
    doc.text('Kepala PUSDATIN UMC,', 150, signY, { align: 'center' });

    const nameY = signY + 24;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`( ${rektorNama} )`, 48, nameY, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 150, nameY, { align: 'center' });
    if (kepalaNip) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      doc.text(kepalaNip, 150, nameY + 4, { align: 'center' });
    }

    return doc;
  }
}
