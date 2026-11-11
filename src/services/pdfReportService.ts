import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LoanTicket, MonthlyReportParams, SparePartItem, PicPerformanceReport } from '../types';
import { KOP_OFFICIAL_BASE64 } from './kopBase64';

export type { MonthlyReportParams };

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
    const kepalaNama = options?.kepalaPusdatin || 'Dr. Ir. H. Ahmad Dahlan, M.T.';
    const kepalaNip = options?.nipKepala || 'NIDN. 0418077501';
    const petugasNama = options?.petugas || loan.petugas || 'Aditiya Ahmad Fadila';

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
    doc.setTextColor(30, 41, 59);

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
    doc.text(`( ${loan.peminjam} )`, 30, nameY, { align: 'center' });
    doc.text(`( ${petugasNama} )`, 105, nameY, { align: 'center' });
    doc.text(`( ${kepalaNama} )`, 165, nameY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
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
    const assetsTersedia = params.assets.filter(a => a.status === 'Tersedia').length;
    const assetsDipinjam = params.assets.filter(a => a.status === 'Dipinjam').length;
    const assetsRusak = params.assets.filter(a => a.status === 'Rusak' || a.status === 'Diperbaiki' || a.status === 'Rusak Total').length;

    const totalLoans = params.loans.length;
    const loansAktif = params.loans.filter(l => l.status === 'Disetujui').length;
    const loansKembali = params.loans.filter(l => l.status === 'Dikembalikan').length;
    const loansTerlambat = params.loans.filter(l => l.status === 'Terlambat').length;

    const totalDamages = params.damages.length;
    const damagesKritis = params.damages.filter(d => d.urgensi === 'Kritis').length;
    const damagesSelesai = params.damages.filter(d => d.status === 'Selesai').length;

    // SECTION 1: RINGKASAN JUMLAH ASET & STATISTIK EKSEKUTIF
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['RINGKASAN EKSEKUTIF BULANAN PUSDATIN UMC', 'JUMLAH UNIT / TIKET', 'RINCIAN / DISTRIBUSI STATUS']],
      body: [
        ['Total Master Data Aset Kampus', `${totalAssets} Unit`, `Tersedia: ${assetsTersedia} | Dipinjam: ${assetsDipinjam} | Rusak/Servis: ${assetsRusak}`],
        ['Transaksi Peminjaman Aset', `${totalLoans} Transaksi`, `Aktif: ${loansAktif} | Selesai Kembali: ${loansKembali} | Terlambat: ${loansTerlambat}`],
        ['Tiket Kerusakan Perangkat', `${totalDamages} Laporan`, `Selesai: ${damagesSelesai} | Urgensi Kritis: ${damagesKritis} Unit`],
        ['Kebutuhan Suku Cadang', `${params.spareParts?.length || 0} Komponen`, `Belum Dibeli: ${params.spareParts?.filter((s: any) => s.statusPengadaan === 'Belum Dibeli').length || 0} | Sudah Dibeli: ${params.spareParts?.filter((s: any) => s.statusPengadaan === 'Sudah Dibeli').length || 0} | Terpasang: ${params.spareParts?.filter((s: any) => s.statusPengadaan === 'Sudah Digunakan').length || 0}`]
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
      doc.text('3. DAFTAR TIKET KERUSAKAN PERANGKAT & TINGKAT URGENSI', 15, currentY);

      autoTable(doc, {
        startY: currentY + 2,
        theme: 'grid',
        head: [['No', 'ID Tiket', 'Perangkat / Aset', 'Barcode', 'Lokasi', 'Pelapor', 'Urgensi', 'PIC Teknisi', 'Status', 'Tgl Lapor']],
        body: params.damages.map((d, idx) => [
          (idx + 1).toString(),
          d.id,
          d.namaBarang,
          d.barcode || '-',
          d.lokasi,
          d.pelapor,
          d.urgensi || 'Sedang',
          d.namaPicTeknisi || d.picTeknisi || '-',
          d.status,
          d.tanggalLapor
        ]),
        headStyles: {
          fillColor: [220, 38, 38],
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
          6: { halign: 'center', fontStyle: 'bold' },
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
        body: params.loans.map((l, i) => [
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
        body: params.assets.map((a, i) => [
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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

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
    doc.text(`( ${params.petugas} )`, 50, nameY, { align: 'center' });
    doc.text(`( ${params.kepalaPusdatin} )`, 220, nameY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Staff IT PUSDATIN UMC', 50, nameY + 4, { align: 'center' });
    if (params.nipKepala) {
      doc.text(params.nipKepala, 220, nameY + 4, { align: 'center' });
    }

    return doc;
  }
}
