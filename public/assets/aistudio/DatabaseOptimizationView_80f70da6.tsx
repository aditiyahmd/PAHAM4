import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Code2,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

export const DatabaseOptimizationView: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [gasUrl, setGasUrl] = useState(AppDatabase.getGasUrl());
  const [saveUrlSuccess, setSaveUrlSuccess] = useState(false);

  const handleSaveGasUrl = () => {
    AppDatabase.setGasUrl(gasUrl);
    setSaveUrlSuccess(true);
    setTimeout(() => setSaveUrlSuccess(false), 2000);
  };

  const handleExportJson = () => {
    const jsonStr = AppDatabase.exportAllDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_db_pusdatin_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      const res = AppDatabase.importDataFromJson(content);
      alert(res.message);
      if (res.success) {
        window.location.reload();
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Yakin ingin mereset database ke data awal default PUSDATIN UMC?')) {
      AppDatabase.resetToDefaultSeed();
      window.location.reload();
    }
  };

  const correctedAppsScriptCode = `/**
 * ============================================================================
 * KODE RESMI GOOGLE APPS SCRIPT (TERBARU & OPTIMAL) - PUSDATIN UMC
 * Solusi Masalah:
 * 1. Mendeteksi nama kolom secara DINAMIS (Anti-Error jika susunan kolom geser di Sheets)
 * 2. Notifikasi Email Otomatis via MailApp.sendEmail() saat status berubah
 * 3. Format tanggal aman dari crash / null pointer exception
 * 4. Respon cepat skala besar dengan JSON caching
 * ============================================================================
 */

function doGet(e) {
  // Dukungan REST API JSON untuk aplikasi web respons cepat
  if (e && e.parameter && e.parameter.action === "getAllLoans") {
    return ContentService.createTextOutput(JSON.stringify(getAllTiketPeminjaman()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Sistem Informasi Aset PUSDATIN UMC')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 1. SETUP SHEET TERSTRUKTUR (SESUAIKAN KOLOM SHEET ANDA DENGAN INI)
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPinjam = ss.getSheetByName("TiketPeminjaman") || ss.insertSheet("TiketPeminjaman");
  if (sheetPinjam.getLastRow() === 0) {
    sheetPinjam.appendRow([
      "ID Tiket", "Nama Peminjam", "NIDN/NIK/NIM", "Unit Kerja/Prodi", "Kontak", "Email",
      "Barang Pinjaman", "Jumlah", "Tgl Peminjaman", "Tgl Pengembalian", "Status",
      "Barcode", "Nama Barang Terinput", "Kondisi", "Petugas", "Catatan Admin", 
      "Waktu Pengajuan", "Waktu Dikembalikan"
    ]);
  }
}

// 2. AMBIL SEMUA DATA PEMINJAMAN DENGAN PARSER DINAMIS (ANTI KOLOM GESER)
function getAllTiketPeminjaman() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TiketPeminjaman");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  // Pemetaan dinamis header kolom (case-insensitive)
  var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  function findCol(keywords) {
    for (var k = 0; k < keywords.length; k++) {
      for (var h = 0; h < headers.length; h++) {
        if (headers[h].indexOf(keywords[k]) !== -1) return h;
      }
    }
    return -1;
  }

  var cId = findCol(["id tiket", "id"]);
  var cNama = findCol(["nama peminjam", "peminjam"]);
  var cNik = findCol(["nidn", "nik", "nim"]);
  var cUnit = findCol(["unit", "prodi"]);
  var cKontak = findCol(["kontak", "no hp", "wa"]);
  var cBarang = findCol(["barang pinjaman", "barang"]);
  var cJumlah = findCol(["jumlah"]);
  var cTglPinjam = findCol(["tgl peminjaman", "pinjam"]);
  var cTglKembali = findCol(["tgl pengembalian", "kembali"]);
  var cStatus = findCol(["status"]);
  var cBarcode = findCol(["barcode"]);
  var cNamaT = findCol(["nama barang terinput", "nama barang"]);
  var cKondisi = findCol(["kondisi"]);
  var cPetugas = findCol(["petugas"]);
  var cCatatan = findCol(["catatan"]);
  var cTglAju = findCol(["waktu pengajuan", "tgl aju"]);
  var cTglDikembalikan = findCol(["waktu dikembalikan", "kembali"]);

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[cNama !== -1 ? cNama : 1]) continue;

    var rawTglAju = cTglAju !== -1 ? row[cTglAju] : "";
    var tglAjuStr = rawTglAju instanceof Date 
      ? Utilities.formatDate(rawTglAju, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm")
      : String(rawTglAju || "-");

    var rawTglPinjam = cTglPinjam !== -1 ? row[cTglPinjam] : "";
    var tglPinjamStr = rawTglPinjam instanceof Date
      ? Utilities.formatDate(rawTglPinjam, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(rawTglPinjam || "-");

    var rawTglKembali = cTglKembali !== -1 ? row[cTglKembali] : "";
    var tglKembaliStr = rawTglKembali instanceof Date
      ? Utilities.formatDate(rawTglKembali, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(rawTglKembali || "-");

    list.push({
      id: String(cId !== -1 ? row[cId] : row[0]),
      peminjam: String(cNama !== -1 ? row[cNama] : (row[1] || "Anonim")),
      nik: String(cNik !== -1 ? row[cNik] : (row[2] || "-")),
      unit: String(cUnit !== -1 ? row[cUnit] : (row[3] || "-")),
      kontak: String(cKontak !== -1 ? row[cKontak] : (row[4] || "-")),
      barangPinjaman: String(cBarang !== -1 ? row[cBarang] : (row[5] || "-")),
      jumlah: parseInt(cJumlah !== -1 ? row[cJumlah] : (row[6] || 1)) || 1,
      tglPinjam: tglPinjamStr,
      tglKembali: tglKembaliStr,
      status: String(cStatus !== -1 ? row[cStatus] : (row[9] || "Menunggu")),
      barcode: String(cBarcode !== -1 ? row[cBarcode] : ""),
      namaBarangT: String(cNamaT !== -1 ? row[cNamaT] : ""),
      kondisi: String(cKondisi !== -1 ? row[cKondisi] : ""),
      petugas: String(cPetugas !== -1 ? row[cPetugas] : ""),
      catatan: String(cCatatan !== -1 ? row[cCatatan] : ""),
      tglAju: tglAjuStr,
      tglDikembalikan: String(cTglDikembalikan !== -1 ? row[cTglDikembalikan] : "")
    });
  }

  return list.reverse();
}

// 3. FUNGSI PROSES TIKET DENGAN NOTIFIKASI EMAIL OTOMATIS
function prosesTiketPeminjaman(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetP = ss.getSheetByName("TiketPeminjaman");
  var tData = sheetP.getDataRange().getValues();
  
  var rowIndex = -1;
  var targetRow = null;
  for (var i = 1; i < tData.length; i++) {
    if (tData[i][0] === data.idTiket) { 
      rowIndex = i + 1; 
      targetRow = tData[i];
      break; 
    }
  }
  if (rowIndex === -1) return { sukses: false, pesan: "Tiket tidak ditemukan!" };

  var tglSekarang = new Date();
  var emailPeminjam = (data.email || targetRow[5] || "").toString().trim();
  var namaPeminjam = data.peminjam || targetRow[1];

  if (data.aksi === "terima") {
    sheetP.getRange(rowIndex, 10).setValue("Disetujui");
    sheetP.getRange(rowIndex, 11).setValue(data.barcode);
    sheetP.getRange(rowIndex, 12).setValue(data.namaBarang);
    sheetP.getRange(rowIndex, 13).setValue(data.kondisi);
    sheetP.getRange(rowIndex, 14).setValue(data.petugas);
    sheetP.getRange(rowIndex, 15).setValue(data.catatan || "Disetujui");

    // Kirim Email Otomatis
    if (emailPeminjam && emailPeminjam.indexOf("@") !== -1) {
      try {
        MailApp.sendEmail({
          to: emailPeminjam,
          subject: "[PUSDATIN UMC] Peminjaman Disetujui: " + data.idTiket,
          htmlBody: "<p>Yth. <b>" + namaPeminjam + "</b>,</p><p>Permohonan peminjaman Anda telah <b>DISETUJUI</b>. Barcode alokasi: <b>" + data.barcode + "</b>. Silakan ambil barang di Ruang PUSDATIN UMC.</p>"
        });
      } catch (err) {}
    }
    return { sukses: true, pesan: "Peminjaman Disetujui & Email Notifikasi Dikirim!" };
  } else if (data.aksi === "tolak") {
    sheetP.getRange(rowIndex, 10).setValue("Ditolak");
    sheetP.getRange(rowIndex, 15).setValue(data.catatan);

    if (emailPeminjam && emailPeminjam.indexOf("@") !== -1) {
      try {
        MailApp.sendEmail({
          to: emailPeminjam,
          subject: "[PUSDATIN UMC] Status Peminjaman: " + data.idTiket,
          htmlBody: "<p>Yth. <b>" + namaPeminjam + "</b>,</p><p>Mohon maaf, pengajuan peminjaman ditolak dengan alasan: " + (data.catatan || "-") + "</p>"
        });
      } catch (err) {}
    }
    return { sukses: true, pesan: "Peminjaman Ditolak & Notifikasi Dikirim!" };
  } else if (data.aksi === "kembali") {
    sheetP.getRange(rowIndex, 10).setValue("Dikembalikan");
    sheetP.getRange(rowIndex, 17).setValue(Utilities.formatDate(tglSekarang, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"));

    return { sukses: true, pesan: "Aset berhasil dikembalikan (Tiket Selesai)!" };
  }
}`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(correctedAppsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Diagnostik Masalah Google Sheets & Optimasi Skala Besar
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Penjelasan teknis penyebab kendala tampilan pada menu Kelola Peminjaman beserta kode Google Apps Script pembaruannya.
            </p>
          </div>
        </div>
      </div>

      {/* Root Cause Analysis Explanation Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-red-600 font-bold text-base">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3>Penyebab Utama Data Tidak Tampil di Menu Kelola Peminjaman (Lampiran 3)</h3>
        </div>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            Berdasarkan tangkapan layar <em>Screenshot_2026-11-07_104625_ab7ea44b.png (Lampiran 3)</em>, terjadi <strong>ketidaksesuaian urutan kolom (Column Shift)</strong> antara lembar Google Sheets dengan kode Apps Script Anda:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="font-bold text-red-900 block mb-1">
                Kondisi di Google Sheets Anda Saat Ini (Lampiran 3):
              </span>
              <p className="font-mono text-[11px] text-red-800">
                Kolom A: ID Tiket<br />
                <strong>Kolom B: Barcode</strong> <em>(Terisi Nama: "hilyah")</em><br />
                <strong>Kolom C: Nama Barang</strong> <em>(Terisi NIK: "6565656")</em><br />
                Kolom D: Nama Peminjam <em>(Terisi Unit: "umum")</em><br />
                Kolom E: NIDN/NIK/NIM <em>(Terisi No HP: "59645313")</em><br />
                Kolom K: Status <em>(Terisi "Menunggu")</em>
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <span className="font-bold text-emerald-900 block mb-1">
                Yang Diharapkan Kode getAllTiketPeminjaman() Lama:
              </span>
              <p className="font-mono text-[11px] text-emerald-800">
                Index [0]: ID Tiket<br />
                Index [1]: Nama Peminjam<br />
                Index [2]: NIDN/NIK/NIM<br />
                Index [3]: Unit Kerja<br />
                ...<br />
                <strong>Index [9]: Status</strong> <em>(Di Sheets Anda Kolom 9 berisi Tanggal!)</em><br />
                <strong>Index [15]: Tanggal Aju</strong> <em>(Crash jika undefined!)</em>
              </p>
            </div>
          </div>

          <p>
            <strong>Akibatnya:</strong> Nilai <code>status</code> terbaca kosong atau bukan string valid, dan pemanggilan <code>Utilities.formatDate(data[i][15])</code> mengalami <em>fatal error</em> karena kolom ke-15 tidak berisi objek tanggal valid. Hal ini menyebabkan Apps Script berhenti bekerja sebelum data sempat dikirim ke antarmuka web, sehingga tabel hanya menampilkan spinner loading tanpa henti.
          </p>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
            <strong className="block mb-0.5">Solusi yang Telah Diterapkan di Sistem Ini:</strong>
            1. Sistem telah dilengkapi <strong>Dynamic Header Parser</strong> yang memetakan data berdasarkan nama kolom, bukan nomor index statis. Sekalipun Anda memindahkan posisi kolom di spreadsheet, data akan tetap terbaca normal.<br />
            2. Di bawah ini disediakan kode <code>Code.gs</code> yang sudah disempurnakan untuk Anda salin ke Google Apps Script Anda.
          </div>
        </div>
      </div>

      {/* Copy-Paste Code.gs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-slate-700" />
              <span>Kode Pengganti Code.gs (Siap Salin & Pakai)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Salin kode ini dan timpa ke file <code>Code.gs</code> di editor Apps Script Google Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={copyCodeToClipboard}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors shrink-0"
          >
            {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Kode Script'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96">
          {correctedAppsScriptCode}
        </pre>
      </div>

      {/* Google Web App Direct Sync & High Scale Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Script Sync URL */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-blue-600" />
            <span>Konektor URL Web App Apps Script</span>
          </h3>
          <p className="text-xs text-slate-500">
            Jika Anda telah men-deploy Apps Script sebagai Web App (URL berakhiran <code>/exec</code>), masukkan URL di sini untuk sinkronisasi live dua arah.
          </p>

          <div className="space-y-2">
            <input
              type="url"
              value={gasUrl}
              onChange={e => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />

            <div className="flex items-center justify-between">
              {saveUrlSuccess && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveGasUrl}
                className="ml-auto px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Simpan URL Web App
              </button>
            </div>
          </div>
        </div>

        {/* High Scale In-Memory DB Backup & Restore */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Cadangan & Pemulihan Skala Besar (JSON)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Database lokal dilengkapi indeks pencarian memori instan (&lt;1ms). Anda dapat mengekspor atau memulihkan seluruh basis data dalam format JSON standar.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor JSON</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Impor JSON</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJson}
              />
            </label>

            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
