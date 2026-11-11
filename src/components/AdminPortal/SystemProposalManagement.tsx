import React, { useState } from 'react';
import {
  Code2,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileText,
  UserCheck,
  Server,
  Layers,
  ChevronRight,
  Terminal,
  ExternalLink,
  PlusCircle,
  BarChart2,
  Upload
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { SystemProposal, SystemProposalStatus } from '../../types';
import { AccessControlService } from '../../services/rbac';
import { WhatsAppNotificationService } from '../../services/whatsappService';

interface SystemProposalManagementProps {
  onDataChanged?: () => void;
}

export const SystemProposalManagement: React.FC<SystemProposalManagementProps> = ({ onDataChanged }) => {
  const [proposals, setProposals] = useState<SystemProposal[]>(() =>
    AppDatabase.getSystemProposals()
  );
  const [selectedProposal, setSelectedProposal] = useState<SystemProposal | null>(() => {
    const list = AppDatabase.getSystemProposals();
    return list[0] || null;
  });

  const [activeTab, setActiveTab] = useState<'detail' | 'tahap' | 'dokumen' | 'aset_baru'>('detail');

  // Action Modals State
  const [actionType, setActionType] = useState<string | null>(null);
  const [catatanAction, setCatatanAction] = useState('');
  const [progresPersenInput, setProgresPersenInput] = useState(70);
  const [deskripsiProgres, setDeskripsiProgres] = useState('');

  // Asset Creation from System (BR-015)
  const [formAsetBaru, setFormAsetBaru] = useState({
    namaAset: '',
    jenisAset: 'Server VPS' as 'Server VPS' | 'Lisensi Software' | 'Perangkat Pendukung',
    spesifikasi: '',
    hargaBeli: 0
  });

  const activeUser = AppDatabase.getActiveUser();

  const reloadData = () => {
    const list = AppDatabase.getSystemProposals();
    setProposals(list);
    if (selectedProposal) {
      const refreshed = list.find(p => p.id === selectedProposal.id) || list[0] || null;
      setSelectedProposal(refreshed);
    }
    if (onDataChanged) onDataChanged();
  };

  const handleAdvance = (action: string, payload: any) => {
    if (!selectedProposal) return;
    try {
      const res = AppDatabase.advanceSystemProposal(selectedProposal.id, action as any, payload);
      alert(res.message);
      setActionType(null);
      setCatatanAction('');
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !formAsetBaru.namaAset) return;

    try {
      const res = AppDatabase.registerAssetFromSystemProposal({
        proposalId: selectedProposal.id,
        namaAset: formAsetBaru.namaAset,
        jenisAset: formAsetBaru.jenisAset,
        spesifikasi: formAsetBaru.spesifikasi,
        hargaBeli: Number(formAsetBaru.hargaBeli)
      });
      alert(res.message);
      reloadData();
      setActiveTab('detail');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (st: SystemProposalStatus) => {
    switch (st) {
      case 'status_verifikasi':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-xs">Tahap 1: Verifikasi Admin</span>;
      case 'status_analisis':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full text-xs">Tahap 2: Analisis Kebutuhan</span>;
      case 'status_keamanan':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full text-xs">Tahap 3: Uji Keamanan (Security)</span>;
      case 'status_approval':
        return <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full text-xs">Tahap 4: Approval Kepala PUSDATIN</span>;
      case 'status_pengembangan':
        return <span className="bg-cyan-100 text-cyan-800 font-bold px-2.5 py-1 rounded-full text-xs">Tahap 5: Sprint Pengembangan</span>;
      case 'Selesai':
      case 'Serah Terima':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs">✅ Selesai & Diserahterimakan</span>;
      case 'Ditolak':
        return <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full text-xs">Ditolak</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-full text-xs">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-100 text-cyan-800 text-xs font-bold font-mono">
              MODUL 5.4 & F-DEV
            </span>
            <h1 className="text-xl font-bold text-slate-900">Pengajuan Sistem Baru & Pengembangan Aplikasi</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Alur 5-Tahap Terintegrasi: <strong>Verifikasi</strong> (Admin) → <strong>Analisis</strong> (System Analyst) → <strong>Keamanan</strong> (Cyber Security) → <strong>Approval</strong> (Pimpinan PUSDATIN) → <strong>Eksekusi & Serah Terima</strong> (Lead Dev & Programmer).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Peran Anda: <strong className="text-slate-900">{activeUser.roleName} ({activeUser.role})</strong>
          </div>
        </div>
      </div>

      {/* Main Split View: Left List, Right Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Proposals List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Daftar Usulan Sistem ({proposals.length})
          </div>

          {proposals.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedProposal(item)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedProposal?.id === item.id
                  ? 'bg-cyan-50/70 border-cyan-300 shadow-xs ring-1 ring-cyan-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded">
                  {item.id}
                </span>
                <span className="text-[10px] text-slate-400">{item.tanggalPengajuan.split(' ')[0]}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-2 line-clamp-2">{item.namaSistem}</h3>
              <p className="text-xs text-slate-500 mt-1">Pengusul: {item.pemohon} ({item.unitKerja})</p>

              <div className="mt-3 flex items-center justify-between">
                <div>{getStatusBadge(item.status)}</div>
                {item.pengembangan && (
                  <span className="text-xs font-mono font-bold text-cyan-700">
                    {item.pengembangan.progresPersen}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: 5-Stage Workstation & Technical Documents */}
        <div className="lg:col-span-2 space-y-4">
          {selectedProposal ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* Proposal Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-200">
                      {selectedProposal.id}
                    </span>
                    {getStatusBadge(selectedProposal.status)}
                  </div>
                  <div className="text-xs text-slate-400">Diajukan: {selectedProposal.tanggalPengajuan}</div>
                </div>

                <h2 className="text-lg font-bold text-slate-900 mt-2">{selectedProposal.namaSistem}</h2>
                <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>👤 Pengusul: <strong>{selectedProposal.pemohon}</strong></span>
                  <span>🏛 Unit: <strong>{selectedProposal.unitKerja}</strong></span>
                  <span>📱 WA: <strong>{selectedProposal.kontakWhatsapp}</strong></span>
                </div>
              </div>

              {/* Workstation Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-100 pb-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('detail')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'detail' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Deskripsi & Latar Belakang
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tahap')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'tahap' ? 'bg-cyan-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Alur 5-Tahap & Eksekusi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('dokumen')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'dokumen' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Dokumen Teknis (F-DEV-03)
                </button>
                {selectedProposal.status === 'Selesai' || selectedProposal.status === 'Serah Terima' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('aset_baru');
                      setFormAsetBaru({
                        namaAset: selectedProposal.asetDihasilkan?.namaAset || `Server VPS / Lisensi ${selectedProposal.namaSistem}`,
                        jenisAset: selectedProposal.asetDihasilkan?.jenisAset || 'Server VPS',
                        spesifikasi: selectedProposal.asetDihasilkan?.spesifikasi || 'Node Server Ubuntu 24.04 LTS, Docker Container',
                        hargaBeli: 5000000
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      activeTab === 'aset_baru' ? 'bg-emerald-700 text-white font-bold' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    Registrasi Aset Baru (BR-015)
                  </button>
                ) : null}
              </div>

              {/* Tab 1: Detail & Scope */}
              {activeTab === 'detail' && (
                <div className="space-y-4 text-xs leading-relaxed">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 text-sm mb-1">Deskripsi Kebutuhan:</div>
                    <p className="text-slate-700">{selectedProposal.deskripsiKebutuhan}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 text-sm mb-1">Latar Belakang & Urgensi:</div>
                    <p className="text-slate-700">{selectedProposal.latarBelakang}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 text-sm mb-1">Target Pengguna:</div>
                    <p className="text-slate-700">{selectedProposal.targetPengguna}</p>
                  </div>

                  {selectedProposal.asetDihasilkan && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-emerald-900 text-sm">Aset Dihasilkan dari Sistem:</div>
                        <div className="text-emerald-800 text-xs">
                          {selectedProposal.asetDihasilkan.namaAset} ({selectedProposal.asetDihasilkan.jenisAset})
                        </div>
                        {selectedProposal.asetDihasilkan.kodeUnikAset && (
                          <div className="font-mono text-[11px] text-emerald-700 mt-0.5">
                            Kode Unik Aset: <strong>{selectedProposal.asetDihasilkan.kodeUnikAset}</strong>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold px-2 py-1 bg-emerald-200 text-emerald-900 rounded-lg">
                        {selectedProposal.asetDihasilkan.sudahDiregistrasi ? 'Tercatat di Aset' : 'Belum Diregistrasi'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: 5-Stage Timeline & Action Panel */}
              {activeTab === 'tahap' && (
                <div className="space-y-4">
                  {/* Visual 5-Stage Stepper */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className={`p-2.5 rounded-xl border ${selectedProposal.verifikasiAdmin ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className="font-bold">1. Verifikasi</div>
                      <div className="text-[10px]">Admin</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${selectedProposal.analisisKebutuhan ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className="font-bold">2. Analisis</div>
                      <div className="text-[10px]">System Analyst</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${selectedProposal.verifikasiKeamanan ? 'bg-purple-50 border-purple-300 text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className="font-bold">3. Keamanan</div>
                      <div className="text-[10px]">Cyber Security</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${selectedProposal.approvalPimpinan ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className="font-bold">4. Approval</div>
                      <div className="text-[10px]">Pimpinan Pusdatin</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${selectedProposal.pengembangan?.serahTerimaServiceDesk ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : selectedProposal.pengembangan ? 'bg-cyan-50 border-cyan-300 text-cyan-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className="font-bold">5. Eksekusi</div>
                      <div className="text-[10px]">Dev & Serah Terima</div>
                    </div>
                  </div>

                  {/* Stage Details Cards */}
                  <div className="space-y-3 text-xs">
                    {/* Tahap 1 Card */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Tahap 1: Verifikasi Kelengkapan Admin</span>
                        {selectedProposal.verifikasiAdmin ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai ({selectedProposal.verifikasiAdmin.tanggal})
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold">Menunggu Verifikasi</span>
                        )}
                      </div>
                      {selectedProposal.verifikasiAdmin && (
                        <p className="text-slate-600 mt-1">Catatan: {selectedProposal.verifikasiAdmin.catatan} (Petugas: {selectedProposal.verifikasiAdmin.petugas})</p>
                      )}
                      {!selectedProposal.verifikasiAdmin && (activeUser.role === 'ACT-03' || activeUser.role === 'ACT-02') && (
                        <button
                          type="button"
                          onClick={() => handleAdvance('verifikasi_admin', { lengkap: true, catatan: 'Dokumen pengusulan dan TOR telah lengkap sesuai standar PUSDATIN.' })}
                          className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Verifikasi Dokumen Lengkap
                        </button>
                      )}
                    </div>

                    {/* Tahap 2 Card */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Tahap 2: Analisis Kebutuhan & Arsitektur Data (ACT-05)</span>
                        {selectedProposal.analisisKebutuhan ? (
                          <span className="text-blue-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai ({selectedProposal.analisisKebutuhan.tanggal})
                          </span>
                        ) : (
                          <span className="text-slate-400">Menunggu Tahap 2</span>
                        )}
                      </div>
                      {selectedProposal.analisisKebutuhan && (
                        <div className="mt-1 space-y-1 text-slate-600">
                          <div>Arsitektur Data: <strong>{selectedProposal.analisisKebutuhan.arsitekturData}</strong></div>
                          <div>Estimasi: <strong>{selectedProposal.analisisKebutuhan.estimasiSprintWeeks} Minggu</strong> (Analyst: {selectedProposal.analisisKebutuhan.analystName})</div>
                        </div>
                      )}
                      {selectedProposal.status === 'status_analisis' && (activeUser.role === 'ACT-05' || activeUser.role === 'ACT-02') && (
                        <button
                          type="button"
                          onClick={() => handleAdvance('analisis_system_analyst', {
                            arsitekturData: 'Relational Database PostgreSQL dengan REST API Gateway & Token JWT',
                            lingkupFitur: 'Portal Civitas, Sinkronisasi Data SIAKAD, Dashboard Koordinator',
                            estimasiSprintWeeks: 4,
                            catatan: 'Analisis kebutuhan dan pemetaan entitas basis data telah selesai dirancang.'
                          })}
                          className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Selesaikan Analisis Kebutuhan
                        </button>
                      )}
                    </div>

                    {/* Tahap 3 Card */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Tahap 3: Uji Aspek Keamanan & Proteksi Data (ACT-09)</span>
                        {selectedProposal.verifikasiKeamanan ? (
                          <span className="text-purple-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lolos ({selectedProposal.verifikasiKeamanan.tanggal})
                          </span>
                        ) : (
                          <span className="text-slate-400">Menunggu Tahap 3</span>
                        )}
                      </div>
                      {selectedProposal.verifikasiKeamanan && (
                        <div className="mt-1 space-y-1 text-slate-600">
                          <div>Risiko Keamanan: <strong>{selectedProposal.verifikasiKeamanan.risikoKeamanan}</strong> | Enkripsi: {selectedProposal.verifikasiKeamanan.rekomendasiEnkripsi}</div>
                          <div>Auditor: {selectedProposal.verifikasiKeamanan.auditorName} ({selectedProposal.verifikasiKeamanan.catatan})</div>
                        </div>
                      )}
                      {selectedProposal.status === 'status_keamanan' && (activeUser.role === 'ACT-09' || activeUser.role === 'ACT-02') && (
                        <button
                          type="button"
                          onClick={() => handleAdvance('verifikasi_keamanan', {
                            risikoKeamanan: 'Rendah',
                            rekomendasiEnkripsi: 'Enkripsi password bcrypt, TLS 1.3, proteksi SQL Injection & XSS sanitization',
                            statusVerifikasi: 'Lolos',
                            catatan: 'Audit kepatuhan keamanan informasi telah memenuhi standar PUSDATIN UMC.'
                          })}
                          className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Verifikasi & Loloskan Keamanan
                        </button>
                      )}
                    </div>

                    {/* Tahap 4 Card */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Tahap 4: Otorisasi & Approval Kepala PUSDATIN (ACT-02)</span>
                        {selectedProposal.approvalPimpinan ? (
                          <span className="text-indigo-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {selectedProposal.approvalPimpinan.keputusan} ({selectedProposal.approvalPimpinan.tanggal})
                          </span>
                        ) : (
                          <span className="text-slate-400">Menunggu Tahap 4</span>
                        )}
                      </div>
                      {selectedProposal.approvalPimpinan && (
                        <p className="text-slate-600 mt-1">Disetujui oleh: {selectedProposal.approvalPimpinan.pejabat} - {selectedProposal.approvalPimpinan.catatan}</p>
                      )}
                      {selectedProposal.status === 'status_approval' && (activeUser.role === 'ACT-02' || activeUser.role === 'ACT-01') && (
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleAdvance('approval_pimpinan', { keputusan: 'Disetujui', catatan: 'Disetujui untuk dikembangkan internal PUSDATIN pada sprint berjalan.' })}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Setujui Pengembangan (Approve)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdvance('approval_pimpinan', { keputusan: 'Ditolak', catatan: 'Belum sesuai dengan roadmap prioritas tahun berjalan.' })}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Tolak Usulan
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tahap 5 Card: Progres Pengembangan & Serah Terima (F-DEV-02) */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Tahap 5: Sprint Eksekusi, Code Review & Serah Terima</span>
                        {selectedProposal.pengembangan && (
                          <span className="text-cyan-800 font-bold font-mono">
                            {selectedProposal.pengembangan.progresPersen}% Selesai
                          </span>
                        )}
                      </div>

                      {selectedProposal.pengembangan && (
                        <div className="mt-3 space-y-2">
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-cyan-600 h-2 rounded-full transition-all"
                              style={{ width: `${selectedProposal.pengembangan.progresPersen}%` }}
                            ></div>
                          </div>

                          <div className="font-semibold text-slate-700 text-xs">Riwayat Progres Sprint (F-DEV-02):</div>
                          <div className="space-y-1.5">
                            {selectedProposal.pengembangan.logProgres.map((log, i) => (
                              <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 flex justify-between items-center text-[11px]">
                                <div>
                                  <span className="font-semibold text-slate-900">{log.petugas}:</span> {log.deskripsi}
                                </div>
                                <span className="font-mono text-cyan-700 font-bold shrink-0 ml-2">{log.progres}%</span>
                              </div>
                            ))}
                          </div>

                          {/* Tombol Update Progres bagi Developer (ACT-06, ACT-07, ACT-08) */}
                          {(activeUser.role === 'ACT-06' || activeUser.role === 'ACT-07' || activeUser.role === 'ACT-08' || activeUser.role === 'ACT-03') && selectedProposal.status === 'status_pengembangan' && (
                            <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl space-y-2">
                              <div className="font-bold text-cyan-900 text-xs">Catat Progres Sprint Baru:</div>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <div className="sm:col-span-3">
                                  <input
                                    type="text"
                                    placeholder="Uraian pekerjaan, modul UI, API, testing..."
                                    value={deskripsiProgres}
                                    onChange={e => setDeskripsiProgres(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={progresPersenInput}
                                    onChange={e => setProgresPersenInput(parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!deskripsiProgres) return alert('Isi uraian pekerjaan!');
                                      handleAdvance('update_progres_dev', {
                                        progresPersen: progresPersenInput,
                                        deskripsi: deskripsiProgres
                                      });
                                      setDeskripsiProgres('');
                                    }}
                                    className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                                  >
                                    Submit
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Serah Terima ke Service Desk */}
                          {selectedProposal.status === 'Selesai' && !selectedProposal.pengembangan.serahTerimaServiceDesk && (activeUser.role === 'ACT-06' || activeUser.role === 'ACT-02') && (
                            <button
                              type="button"
                              onClick={() => handleAdvance('serah_terima', {})}
                              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Lakukan Serah Terima ke Service Desk (BR-015)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Manajemen Dokumen Teknis (F-DEV-03) */}
              {activeTab === 'dokumen' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Dokumen Teknis & Spesifikasi Terlampir</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProposal.dokumenTeknis?.map((doc, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs">
                        <FileText className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate">{doc.namaDokumen}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">Tipe: <span className="font-semibold text-cyan-800">{doc.tipe}</span></div>
                          <div className="text-slate-400 text-[10px]">Diunggah: {doc.tanggalUpload}</div>
                        </div>
                      </div>
                    ))}
                    {(!selectedProposal.dokumenTeknis || selectedProposal.dokumenTeknis.length === 0) && (
                      <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                        Belum ada dokumen teknis yang diunggah.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Registrasi Aset Baru dari Sistem Selesai (BR-015 / Integrasi 5) */}
              {activeTab === 'aset_baru' && (
                <form onSubmit={handleRegisterAsset} className="space-y-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 text-xs">
                  <div>
                    <h3 className="font-bold text-emerald-950 text-sm">
                      Registrasi Aset Server / Lisensi ke Pendataan Aset (BR-015)
                    </h3>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Sistem baru yang telah selesai menghasilkan aset (seperti Server VPS, Lisensi Komersial, atau Appliance) wajib didaftarkan ke Buku Penerimaan Aset Modul Pendataan Aset.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Aset yang Dihasilkan</label>
                      <input
                        type="text"
                        required
                        value={formAsetBaru.namaAset}
                        onChange={e => setFormAsetBaru({ ...formAsetBaru, namaAset: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Jenis Aset</label>
                      <select
                        value={formAsetBaru.jenisAset}
                        onChange={e => setFormAsetBaru({ ...formAsetBaru, jenisAset: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Server VPS">Server VPS / Cloud Node</option>
                        <option value="Lisensi Software">Lisensi Software / Database</option>
                        <option value="Perangkat Pendukung">Perangkat Pendukung / Appliance</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Spesifikasi Teknis</label>
                    <input
                      type="text"
                      placeholder="Contoh: 4 vCPU, 8GB RAM, 80GB SSD NVMe, Docker Containerized"
                      value={formAsetBaru.spesifikasi}
                      onChange={e => setFormAsetBaru({ ...formAsetBaru, spesifikasi: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estimasi Nilai / Harga Pengadaan (Rp)</label>
                    <input
                      type="number"
                      value={formAsetBaru.hargaBeli}
                      onChange={e => setFormAsetBaru({ ...formAsetBaru, hargaBeli: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('detail')}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <Server className="w-3.5 h-3.5" />
                      Daftarkan ke Buku Penerimaan Aset
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Pilih pengajuan sistem di sebelah kiri untuk melihat workstation pengembangan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
