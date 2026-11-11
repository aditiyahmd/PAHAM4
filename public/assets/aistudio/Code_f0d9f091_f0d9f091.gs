function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Sistem Informasi Aset PUSDATIN UMC')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// SETUP SHEET AWAL
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetAset = ss.getSheetByName("DataAset") || ss.insertSheet("DataAset");
  if(sheetAset.getLastRow() == 0) sheetAset.appendRow(["Barcode", "Nama Barang", "Kategori", "Status", "Lokasi", "Tanggal Masuk"]);
  
  var sheetRiwayat = ss.getSheetByName("Riwayat") || ss.insertSheet("Riwayat");
  if(sheetRiwayat.getLastRow() == 0) sheetRiwayat.appendRow(["Timestamp", "Barcode", "Nama Barang", "Jenis Transaksi", "Lokasi", "Keterangan"]);
  
  var sheetTiket = ss.getSheetByName("TiketKerusakan") || ss.insertSheet("TiketKerusakan");
  if(sheetTiket.getLastRow() == 0) sheetTiket.appendRow(["ID Tiket", "Barcode", "Nama Barang", "Pelapor", "Lokasi", "Deskripsi", "Tanggal Lapor", "Status", "Tanggal Selesai", "Catatan Admin"]);
  
  var sheetRef = ss.getSheetByName("Referensi") || ss.insertSheet("Referensi");
  if(sheetRef.getLastRow() == 0) {
    sheetRef.appendRow(["Kategori", "Lokasi"]);
    sheetRef.appendRow(["Networking", "Gedung Rektorat Lt.1"]);
    sheetRef.appendRow(["Komputer", "Gedung FKIP"]);
  }
  
  var sheetPinjam = ss.getSheetByName("TiketPeminjaman") || ss.insertSheet("TiketPeminjaman");
  if(sheetPinjam.getLastRow() == 0) {
    sheetPinjam.appendRow(["ID Tiket", "Nama Peminjam", "NIDN/NIK/NIM", "Unit Kerja/Prodi", "Kontak", "Barang Pinjaman", "Jumlah", "Tgl Peminjaman", "Tgl Pengembalian", "Status", "Barcode", "Nama Barang Terinput", "Kondisi", "Petugas", "Catatan Admin", "Waktu Pengajuan", "Waktu Dikembalikan"]);
  }
}

function getReferensi() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Referensi");
  if(!sheet) return { kategori: [], lokasi: [] };
  var data = sheet.getDataRange().getValues();
  var kategori = [];
  var lokasi = [];
  for(var i=1; i<data.length; i++) {
    if(data[i][0] && kategori.indexOf(data[i][0]) === -1) kategori.push(data[i][0]);
    if(data[i][1] && lokasi.indexOf(data[i][1]) === -1) lokasi.push(data[i][1]);
  }
  return { kategori: kategori, lokasi: lokasi };
}

function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DataAset");
  
  var stats = { total: 0, tersedia: 0, digunakan: 0, rusak: 0, diperbaiki: 0, dipinjam: 0, kategori: {}, lokasi: {} };
  
  if(!sheet) return stats;
  var data = sheet.getDataRange().getValues();
  for(var i=1; i<data.length; i++) {
    stats.total++;
    var st = data[i][3];
    if(st === "Tersedia") stats.tersedia++;
    else if(st === "Digunakan" || st === "Keluar") stats.digunakan++;
    else if(st === "Rusak") stats.rusak++;
    else if(st === "Diperbaiki") stats.diperbaiki++;
    else if(st === "Dipinjam") stats.dipinjam++;
    
    var kat = data[i][2] || "Lainnya";
    stats.kategori[kat] = (stats.kategori[kat] || 0) + 1;
    
    var lok = data[i][4] || "Tanpa Lokasi";
    stats.lokasi[lok] = (stats.lokasi[lok] || 0) + 1;
  }
  return stats;
}

function simpanBarangMasuk(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetAset = ss.getSheetByName("DataAset");
  var sheetRiwayat = ss.getSheetByName("Riwayat");
  var sheetRef = ss.getSheetByName("Referensi");
  var refData = getReferensi();
  
  var kategoriBaru = data.kategori ? data.kategori.toString().trim() : "";
  if(kategoriBaru !== "" && refData.kategori.indexOf(kategoriBaru) === -1) {
    var valsKategori = sheetRef.getRange("A:A").getValues().filter(function(row) { return row[0] !== ""; });
    sheetRef.getRange(valsKategori.length + 1, 1).setValue(kategoriBaru);
  }
  
  var lokasiBaru = data.lokasi ? data.lokasi.toString().trim() : "";
  if(lokasiBaru !== "" && refData.lokasi.indexOf(lokasiBaru) === -1) {
    var valsLokasi = sheetRef.getRange("B:B").getValues().filter(function(row) { return row[0] !== ""; });
    sheetRef.getRange(valsLokasi.length + 1, 2).setValue(lokasiBaru);
  }
  
  var hasilBarcodes = [];
  var waktu = new Date();
  var jumlah = parseInt(data.jumlah) || 1;
  for(var i = 0; i < jumlah; i++) {
    var newBarcode = generateEAN8Code();
    hasilBarcodes.push({ barcode: newBarcode, nama: data.namaBarang });
    
    sheetAset.appendRow([newBarcode, data.namaBarang, data.kategori, "Tersedia", data.lokasi, waktu]);
    sheetRiwayat.appendRow([waktu, newBarcode, data.namaBarang, "Masuk", data.lokasi, "Input Barang Baru"]);
  }
  
  return hasilBarcodes;
}

function generateEAN8Code() {
  var code = "";
  for (var i = 0; i < 7; i++) { code += Math.floor(Math.random() * 10); }
  var sum = 0;
  for (var i = 0; i < 7; i++) {
    var digit = parseInt(code.charAt(i));
    sum += (i % 2 === 0) ? (digit * 3) : (digit * 1);
  }
  var checksum = (10 - (sum % 10)) % 10;
  return code + checksum;
}

function getDetailAset(barcode) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DataAset");
  if(!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for(var i=1; i<data.length; i++) {
    if(data[i][0].toString() === barcode.toString()) {
      return { row: i+1, barcode: data[i][0], nama: data[i][1], kategori: data[i][2], status: data[i][3], lokasi: data[i][4] };
    }
  }
  return null;
}

function prosesTransaksi(data) {
  var detail = getDetailAset(data.barcode);
  if(!detail) return { sukses: false, pesan: "Aset tidak ditemukan!" };
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetAset = ss.getSheetByName("DataAset");
  var sheetRiwayat = ss.getSheetByName("Riwayat");
  var tgl = new Date();
  
  var statusBaru = detail.status;
  var lokasiBaru = detail.lokasi;
  
  if(data.jenis === "Keluar") { statusBaru = "Digunakan"; lokasiBaru = data.lokasi || detail.lokasi; }
  else if(data.jenis === "Rusak") { statusBaru = "Rusak"; }
  else if(data.jenis === "Perbaikan") { statusBaru = "Diperbaiki"; }
  else if(data.jenis === "Selesai Perbaikan") { statusBaru = "Tersedia"; }
  else if(data.jenis === "Pinjam") { statusBaru = "Dipinjam"; lokasiBaru = data.lokasi || detail.lokasi; }
  else if(data.jenis === "Kembali") { statusBaru = "Tersedia"; }
  
  sheetAset.getRange(detail.row, 4).setValue(statusBaru);
  sheetAset.getRange(detail.row, 5).setValue(lokasiBaru);
  sheetRiwayat.appendRow([tgl, data.barcode, detail.nama, data.jenis, lokasiBaru, data.keterangan]);
  
  return { sukses: true, pesan: "Transaksi " + data.jenis + " berhasil diproses!" };
}

function getDataLaporanGabungan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetAset = ss.getSheetByName("DataAset");
  var sheetRiwayat = ss.getSheetByName("Riwayat");
  
  var asetData = sheetAset ? sheetAset.getDataRange().getValues() : [];
  var riwayatData = sheetRiwayat ? sheetRiwayat.getDataRange().getValues() : [];
  
  if(asetData.length > 1) {
    for(var i=1; i<asetData.length; i++) {
      if(asetData[i][5] instanceof Date) { asetData[i][5] = Utilities.formatDate(asetData[i][5], Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"); }
    }
  }
  if(riwayatData.length > 1) {
    for(var j=1; j<riwayatData.length; j++) {
      if(riwayatData[j][0] instanceof Date) { riwayatData[j][0] = Utilities.formatDate(riwayatData[j][0], Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"); }
    }
  }
  return { aset: asetData, riwayat: riwayatData };
}

function getRiwayatSpesifik(barcode) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Riwayat");
  if(!sheet) return [];
  var data = sheet.getDataRange().getValues();
  
  var hasil = [];
  for(var i=data.length-1; i>=1; i--) {
    if(data[i][1].toString() === barcode.toString()) {
      var wkt = data[i][0];
      if(wkt instanceof Date) wkt = Utilities.formatDate(wkt, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
      hasil.push({ waktu: wkt, barcode: data[i][1], nama: data[i][2], transaksi: data[i][3], lokasi: data[i][4], keterangan: data[i][5] });
    }
  }
  return hasil;
}

function buatLaporanKerusakan(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetTiket = ss.getSheetByName("TiketKerusakan");
  
  var tgl = new Date();
  var idTiket = "TKT-" + Utilities.formatDate(tgl, Session.getScriptTimeZone(), "yyyyMMdd") + "-" + Math.floor(100 + Math.random() * 900);
  
  var namaBarangFix = data.namaBarang;
  
  if(data.barcode) {
    var detail = getDetailAset(data.barcode);
    if(detail) {
      namaBarangFix = detail.nama;
      var sheetAset = ss.getSheetByName("DataAset");
      sheetAset.getRange(detail.row, 4).setValue("Rusak");
      
      var sheetRiwayat = ss.getSheetByName("Riwayat");
      sheetRiwayat.appendRow([
        tgl, data.barcode, detail.nama, "Lapor Rusak", detail.lokasi, 
        "Tiket: " + idTiket + " - " + (data.deskripsi || "Tidak ada deskripsi")
      ]);
    }
  }
  
  sheetTiket.appendRow([idTiket, data.barcode || "Tanpa Barcode", namaBarangFix, data.pelapor || "Anonim", data.lokasi, data.deskripsi, tgl, "Baru", "", ""]);
  return { sukses: true, pesan: "Laporan terkirim! Simpan ID TIKET Anda: " + idTiket };
}

function getJumlahTiketBaru() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TiketKerusakan");
  if(!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  
  var count = 0;
  for(var i=1; i<data.length; i++) { if(data[i][7] === "Baru") count++; }
  return count;
}

function getAllTiketKerusakan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TiketKerusakan");
  if(!sheet) return [];
  var data = sheet.getDataRange().getValues();
  
  var list = [];
  for(var i=1; i<data.length; i++) {
    var tglLapor = data[i][6];
    var tglSelesai = data[i][8];
    
    if(tglLapor instanceof Date) tglLapor = Utilities.formatDate(tglLapor, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    if(tglSelesai instanceof Date) tglSelesai = Utilities.formatDate(tglSelesai, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    
    list.push({ id: data[i][0], barcode: data[i][1], namaBarang: data[i][2], pelapor: data[i][3], lokasi: data[i][4], deskripsi: data[i][5], tanggalLapor: tglLapor, status: data[i][7], tanggalSelesai: tglSelesai, catatanAdmin: data[i][9] });
  }
  return list.reverse();
}

function prosesTiketKerusakan(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetTiket = ss.getSheetByName("TiketKerusakan");
  var sheetAset = ss.getSheetByName("DataAset");
  var sheetRiwayat = ss.getSheetByName("Riwayat");
  var tgl = new Date();
  
  var tData = sheetTiket.getDataRange().getValues();
  var rowIndex = -1;
  
  var barcode = "";
  for(var i=1; i<tData.length; i++) {
    if(tData[i][0] === data.idTiket) { rowIndex = i+1; barcode = tData[i][1]; break; }
  }
  if(rowIndex === -1) return { sukses: false, pesan: "Tiket tidak ditemukan" };
  
  var detailAset = barcode && barcode !== "Tanpa Barcode" ? getDetailAset(barcode) : null;
  
  if(data.aksi === "terima") {
    if(detailAset) {
      sheetAset.getRange(detailAset.row, 4).setValue("Rusak");
      sheetRiwayat.appendRow([tgl, barcode, detailAset.nama, "Tiket Diterima", detailAset.lokasi, "Admin: " + (data.catatanAdmin || "Tiket diterima oleh admin")]);
    }
    sheetTiket.getRange(rowIndex, 8).setValue("Diterima");
    sheetTiket.getRange(rowIndex, 10).setValue(data.catatanAdmin || "Diterima oleh Admin");
    return { sukses: true, pesan: "Tiket Berhasil Diterima!" };
  } 
  else if(data.aksi === "perbaikan") {
    var ketMetode = "Perbaikan di Lokasi";
    if(detailAset) {
      sheetAset.getRange(detailAset.row, 4).setValue("Diperbaiki");
      
      var lokasiPerbaikan = detailAset.lokasi;
      if (data.dibawaKePusdatin === true || data.dibawaKePusdatin === "true") {
        lokasiPerbaikan = "Ruang PUSDATIN";
        sheetAset.getRange(detailAset.row, 5).setValue(lokasiPerbaikan); 
        ketMetode = "Dibawa ke Ruang PUSDATIN";
      }
      sheetRiwayat.appendRow([tgl, barcode, detailAset.nama, "Mulai Perbaikan", lokasiPerbaikan, "Metode: " + ketMetode + " | Catatan: " + (data.catatanAdmin || "-")]);
    }
    sheetTiket.getRange(rowIndex, 8).setValue("Perbaikan");
    sheetTiket.getRange(rowIndex, 10).setValue(data.catatanAdmin || "Sedang dalam perbaikan (" + ketMetode + ")");
    return { sukses: true, pesan: "Status tiket diubah ke Perbaikan!" };
  }
  else if(data.aksi === "selesai") {
    var stBaru = data.statusAsetBaru || "Tersedia";
    var lokasiFinal = detailAset ? detailAset.lokasi : "Gudang Pusat";
    
    if(detailAset) {
      sheetAset.getRange(detailAset.row, 4).setValue(stBaru);
      sheetRiwayat.appendRow([tgl, barcode, detailAset.nama, "Selesai Perbaikan", lokasiFinal, "Aset selesai diperbaiki. Status: " + stBaru]);
    }
    sheetTiket.getRange(rowIndex, 8).setValue("Selesai");
    sheetTiket.getRange(rowIndex, 9).setValue(new Date());
    sheetTiket.getRange(rowIndex, 10).setValue(data.catatanAdmin || "Selesai ditangani");
    return { sukses: true, pesan: "Tiket ditutup & Selesai!" };
  }
  return { sukses: false, pesan: "Aksi tidak dikenal" };
}

function cariTiketSpesifik(keyword) {
  if (!keyword) return [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TiketKerusakan");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var list = [];
  var kw = keyword.toString().toLowerCase().trim();
  
  for (var i = 1; i < data.length; i++) {
    var idTiket = data[i][0].toString().toLowerCase();
    var barcode = data[i][1].toString().toLowerCase();
    
    if (idTiket === kw || barcode === kw) {
      var tglLapor = data[i][6];
      var tglSelesai = data[i][8];
      if (tglLapor instanceof Date) tglLapor = Utilities.formatDate(tglLapor, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
      if (tglSelesai instanceof Date) tglSelesai = Utilities.formatDate(tglSelesai, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
      
      list.push({ id: data[i][0], barcode: data[i][1], namaBarang: data[i][2], pelapor: data[i][3], lokasi: data[i][4], deskripsi: data[i][5], tanggalLapor: tglLapor, status: data[i][7], tanggalSelesai: tglSelesai, catatanAdmin: data[i][9] });
    }
  }
  return list; 
}

function getProgresSpesifik(keyword) {
  if (!keyword) return [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var kw = keyword.toString().toLowerCase().trim();
  var list = [];
  
  // Pencarian di Tiket Kerusakan
  var sheetRusak = ss.getSheetByName("TiketKerusakan");
  if (sheetRusak) {
    var dataR = sheetRusak.getDataRange().getValues();
    for (var i = dataR.length - 1; i >= 1; i--) {
      if (dataR[i][0].toString().toLowerCase() === kw || dataR[i][1].toString().toLowerCase() === kw) {
        var tL = dataR[i][6] instanceof Date ? Utilities.formatDate(dataR[i][6], Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : dataR[i][6];
        list.push({ jenisLayanan: "Lapor Rusak", id: dataR[i][0], tglLapor: tL, item: dataR[i][2], pelapor: dataR[i][3], info: dataR[i][5], status: dataR[i][7], catatanAdmin: dataR[i][9] });
      }
    }
  }
  
  // Pencarian di Tiket Peminjaman
  var sheetPinjam = ss.getSheetByName("TiketPeminjaman");
  if (sheetPinjam) {
    var dataP = sheetPinjam.getDataRange().getValues();
    for (var j = dataP.length - 1; j >= 1; j--) {
      if (dataP[j][0].toString().toLowerCase() === kw || dataP[j][10].toString().toLowerCase().includes(kw)) {
        var tP = dataP[j][15] instanceof Date ? Utilities.formatDate(dataP[j][15], Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : dataP[j][15];
        var itemTeks = dataP[j][5] + " (" + dataP[j][6] + " Unit)";
        list.push({ jenisLayanan: "Peminjaman", id: dataP[j][0], tglLapor: tP, item: itemTeks, pelapor: dataP[j][1], info: "Unit: " + dataP[j][3], status: dataP[j][9], catatanAdmin: dataP[j][14] });
      }
    }
  }
  return list;
}

// 2. Fungsi untuk User membuat Tiket Peminjaman
function buatTiketPeminjaman(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TiketPeminjaman") || ss.insertSheet("TiketPeminjaman");
  
  var tglPengajuan = new Date();
  var idTiket = "PJM-" + Utilities.formatDate(tglPengajuan, Session.getScriptTimeZone(), "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
  
  sheet.appendRow([
    idTiket, data.nama, data.nik, data.unit, data.kontak, data.jenisBarang, data.jumlah, 
    data.tglPinjam, data.tglKembali, "Menunggu", "", "", "", "", "", tglPengajuan, ""
  ]);
  return { sukses: true, pesan: "Pengajuan peminjaman berhasil! Simpan ID Tiket Anda: " + idTiket };
}

// 3. Fungsi untuk Admin mengambil semua Tiket Peminjaman
function getAllTiketPeminjaman() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("TiketPeminjaman");
  if(!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var list = [];
  for(var i=1; i<data.length; i++) {
    var tglAju = data[i][15] instanceof Date ? Utilities.formatDate(data[i][15], Session.getScriptTimeZone(), "dd/MM/yyyy") : data[i][15];
    list.push({
      id: data[i][0], peminjam: data[i][1], nik: data[i][2], unit: data[i][3], kontak: data[i][4],
      barangPinjaman: data[i][5], jumlah: data[i][6], tglPinjam: data[i][7], tglKembali: data[i][8],
      status: data[i][9], barcode: data[i][10], namaBarangT: data[i][11], kondisi: data[i][12], 
      petugas: data[i][13], catatan: data[i][14], tglAju: tglAju, tglDikembalikan: data[i][16]
    });
  }
  return list.reverse();
}

// 4. Fungsi Admin memproses tiket Peminjaman
function prosesTiketPeminjaman(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetP = ss.getSheetByName("TiketPeminjaman");
  var sheetAset = ss.getSheetByName("DataAset");
  var sheetRiwayat = ss.getSheetByName("Riwayat");
  var tData = sheetP.getDataRange().getValues();
  
  var rowIndex = -1;
  for(var i=1; i<tData.length; i++) {
    if(tData[i][0] === data.idTiket) { rowIndex = i+1; break; }
  }
  if(rowIndex === -1) return { sukses: false, pesan: "Tiket tidak ditemukan!" };
  
  var tglSekarang = new Date();
  
  if(data.aksi === "terima") {
    sheetP.getRange(rowIndex, 10).setValue("Disetujui");
    sheetP.getRange(rowIndex, 11).setValue(data.barcode); // Barcode yang diinput admin
    sheetP.getRange(rowIndex, 12).setValue(data.namaBarang); // Nama otomatis
    sheetP.getRange(rowIndex, 13).setValue(data.kondisi);
    sheetP.getRange(rowIndex, 14).setValue(data.petugas);
    sheetP.getRange(rowIndex, 15).setValue(data.catatan || "Disetujui");
    
    // Ubah status di DataAset ke "Dipinjam" & Catat Riwayat
    var barcodes = data.barcode.split(",");
    barcodes.forEach(function(bc) {
      var bcTrim = bc.trim();
      if(bcTrim) {
        var detail = getDetailAset(bcTrim);
        if(detail) {
          sheetAset.getRange(detail.row, 4).setValue("Dipinjam");
          sheetRiwayat.appendRow([tglSekarang, bcTrim, detail.nama, "Pinjam", detail.lokasi, "Dipinjam oleh: " + data.peminjam + " (Tiket: " + data.idTiket + ")"]);
        }
      }
    });
    return { sukses: true, pesan: "Peminjaman Disetujui!" };
  } 
  else if(data.aksi === "tolak") {
    sheetP.getRange(rowIndex, 10).setValue("Ditolak");
    sheetP.getRange(rowIndex, 15).setValue(data.catatan);
    return { sukses: true, pesan: "Peminjaman Ditolak!" };
  }
  else if(data.aksi === "kembali") {
    sheetP.getRange(rowIndex, 10).setValue("Dikembalikan");
    sheetP.getRange(rowIndex, 17).setValue(Utilities.formatDate(tglSekarang, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"));
    
    // Kembalikan status aset ke "Tersedia"
    var bcTersimpan = sheetP.getRange(rowIndex, 11).getValue().toString().split(",");
    bcTersimpan.forEach(function(bc) {
      var bcTrim = bc.trim();
      if(bcTrim) {
        var detail = getDetailAset(bcTrim);
        if(detail) {
          sheetAset.getRange(detail.row, 4).setValue("Tersedia");
          sheetRiwayat.appendRow([tglSekarang, bcTrim, detail.nama, "Kembali", detail.lokasi, "Dikembalikan oleh: " + data.peminjam]);
        }
      }
    });
    return { sukses: true, pesan: "Aset berhasil dikembalikan!" };
  }
}

function getStatistikPerbaikan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TiketKerusakan");
  if (!sheet) return { totalAntrean: 0, sedangDiproses: 0 };
  
  var data = sheet.getDataRange().getValues();
  var antrean = 0;
  var diproses = 0;
  
  var indeksKolomStatus = 7;
  
  for (var i = 1; i < data.length; i++) {
    var status = data[i][indeksKolomStatus] ? data[i][indeksKolomStatus].toString().trim().toLowerCase() : ""; 
    
    if (status === "menunggu" || status === "antrean" || status === "baru" || status === "diterima") {
      antrean++;
    } else if (status === "perbaikan" || status === "sedang diperbaiki" || status === "diproses") {
      diproses++;
    }
  }
  
  return { totalAntrean: antrean, sedangDiproses: diproses };
}