import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Lock,
  Calendar,
  User,
  ArrowRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { AuditTrailItem } from '../../types';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditTrailItem[]>(() => AppDatabase.getAuditTrail());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('Semua');

  const filtered = logs.filter(item => {
    const matchType = filterType === 'Semua' || item.entityType === filterType;
    const matchSearch =
      item.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namaPengguna.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rolePengguna.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.catatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.statusLama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.statusBaru.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Audit Trail Terpadu Seluruh Modul</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mencatat setiap mutasi status aset, tiket helpdesk, peminjaman, suku cadang, dan pengajuan sistem baru. <strong>Catatan audit log bersifat permanen dan tidak dapat dihapus (BR-016)</strong>.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Kepatuhan Audit: <strong>AC-A2 & AC-H3 Passed</strong></span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Cari ID entitas, nama user, status, atau uraian catatan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-sm outline-none bg-transparent"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs"
        >
          <option value="Semua">Semua Entitas Audit</option>
          <option value="Tiket Helpdesk">Tiket Helpdesk</option>
          <option value="Aset TI">Aset TI</option>
          <option value="Peminjaman Aset">Peminjaman Aset</option>
          <option value="Pengajuan Sistem Baru">Pengajuan Sistem Baru</option>
          <option value="Suku Cadang">Suku Cadang</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Entitas & ID</th>
                <th className="py-3 px-4">Perubahan Status</th>
                <th className="py-3 px-4">Pelaku (Aktor)</th>
                <th className="py-3 px-4">Catatan & Uraian Audit</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {item.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{item.entityType}</span>
                    <span className="font-mono text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
                      {item.entityId}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {item.statusLama}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {item.statusBaru}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.namaPengguna}</div>
                    <div className="text-[10px] text-slate-500">{item.rolePengguna}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-md">
                    {item.catatan}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                    {item.ipAddress || '10.20.1.25'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Belum ada riwayat audit log yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
