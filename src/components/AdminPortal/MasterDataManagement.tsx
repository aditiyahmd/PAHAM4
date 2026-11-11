import React, { useState } from 'react';
import { AppDatabase } from '../../services/db';
import { TechnicianUser, TechnicianRole } from '../../types';
import {
  MapPin,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Tag,
  Info,
  Users,
  Shield,
  Key,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Edit2,
  Lock,
  UserCheck
} from 'lucide-react';

interface MasterDataManagementProps {
  onDataChanged: () => void;
}

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({ onDataChanged }) => {
  const [activeTab, setActiveTab] = useState<'teknisi' | 'lokasi' | 'kategori'>('teknisi');

  // Master Data States
  const [locations, setLocations] = useState(() => AppDatabase.getMasterLocations());
  const [categories, setCategories] = useState(() => AppDatabase.getMasterCategories());
  const [technicians, setTechnicians] = useState(() => AppDatabase.getTechnicians());

  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingLocation, setEditingLocation] = useState<{ oldName: string; newName: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [searchLoc, setSearchLoc] = useState('');
  const [searchCat, setSearchCat] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Technician Form & Modal States
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingTech, setEditingTech] = useState<TechnicianUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Tech Form Inputs
  const [techName, setTechName] = useState('');
  const [techRole, setTechRole] = useState<TechnicianRole>('Programmer');
  const [techEmail, setTechEmail] = useState('');
  const [techPassword, setTechPassword] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techSpecialty, setTechSpecialty] = useState('');
  const [techIsFullAccess, setTechIsFullAccess] = useState(false);
  const [techLevel, setTechLevel] = useState<'Lead' | 'Senior' | 'Junior'>('Senior');

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Technician Form Handlers
  const openAddTechModal = () => {
    setEditingTech(null);
    setTechName('');
    setTechRole('Programmer');
    setTechEmail('');
    setTechPassword('admin');
    setTechPhone('081234567890');
    setTechSpecialty('SIAKAD & Modul Web');
    setTechIsFullAccess(false);
    setTechLevel('Junior');
    setShowTechModal(true);
  };

  const openEditTechModal = (tech: TechnicianUser) => {
    setEditingTech(tech);
    setTechName(tech.name);
    setTechRole(tech.role);
    setTechEmail(tech.email);
    setTechPassword(tech.password || 'admin');
    setTechPhone(tech.phone || '');
    setTechSpecialty(tech.specialty || '');
    setTechIsFullAccess(Boolean(tech.isFullAccess));
    setTechLevel(tech.level === 'Junior' || tech.level === 'Lead' ? tech.level : 'Senior');
    setShowTechModal(true);
  };

  const handleSaveTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techName.trim() || !techEmail.trim() || !techPassword.trim()) {
      showFeedback('error', 'Nama, Email (Username), dan Password wajib diisi!');
      return;
    }

    if (editingTech) {
      // Update
      const success = AppDatabase.updateTechnician({
        ...editingTech,
        name: techName.trim(),
        role: techRole,
        email: techEmail.trim().toLowerCase(),
        password: techPassword.trim(),
        phone: techPhone.trim(),
        specialty: techSpecialty.trim(),
        isFullAccess: techIsFullAccess,
        level: techLevel
      });

      if (success) {
        setTechnicians(AppDatabase.getTechnicians());
        setShowTechModal(false);
        onDataChanged();
        showFeedback('success', `Kredensial PIC ${techName} berhasil diperbarui!`);
      } else {
        showFeedback('error', 'Gagal memperbarui kredensial PIC.');
      }
    } else {
      // Add
      const created = AppDatabase.addTechnician({
        name: techName.trim(),
        role: techRole,
        email: techEmail.trim().toLowerCase(),
        password: techPassword.trim(),
        phone: techPhone.trim(),
        specialty: techSpecialty.trim(),
        isFullAccess: techIsFullAccess,
        level: techLevel
      });

      if (created) {
        setTechnicians(AppDatabase.getTechnicians());
        setShowTechModal(false);
        onDataChanged();
        showFeedback('success', `Akun PIC baru "${techName}" berhasil dibuat dengan email "${techEmail}"!`);
      } else {
        showFeedback('error', 'Gagal membuat akun PIC baru.');
      }
    }
  };

  const handleDeleteTechnician = (tech: TechnicianUser) => {
    if (tech.isFullAccess && (tech.role === 'Kepala PUSDATIN' || tech.id === 'TECH-000')) {
      alert('Akun Kepala PUSDATIN utama tidak boleh dihapus demi keamanan sistem.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun PIC "${tech.name}" (${tech.email})?`)) {
      const success = AppDatabase.deleteTechnician(tech.id);
      if (success) {
        setTechnicians(AppDatabase.getTechnicians());
        onDataChanged();
        showFeedback('success', `Akun PIC "${tech.name}" telah dihapus.`);
      } else {
        showFeedback('error', 'Akun PIC ini tidak dapat dihapus.');
      }
    }
  };

  // Location Handlers
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;

    const success = AppDatabase.addMasterLocation(newLocation.trim());
    if (success) {
      setLocations(AppDatabase.getMasterLocations());
      setNewLocation('');
      onDataChanged();
      showFeedback('success', `Lokasi "${newLocation.trim()}" berhasil ditambahkan ke master data!`);
    } else {
      showFeedback('error', 'Lokasi tersebut sudah terdaftar dalam master data.');
    }
  };

  const handleDeleteLocation = (loc: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus lokasi "${loc}" dari master data?`)) {
      AppDatabase.deleteMasterLocation(loc);
      setLocations(AppDatabase.getMasterLocations());
      onDataChanged();
      showFeedback('success', `Lokasi "${loc}" telah dihapus.`);
    }
  };

  const handleUpdateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !editingLocation.newName.trim()) return;
    const success = AppDatabase.updateMasterLocation(editingLocation.oldName, editingLocation.newName.trim());
    if (success) {
      setLocations(AppDatabase.getMasterLocations());
      showFeedback('success', `Lokasi "${editingLocation.oldName}" berhasil diperbarui menjadi "${editingLocation.newName.trim()}"!`);
      setEditingLocation(null);
      onDataChanged();
    } else {
      showFeedback('error', 'Gagal memperbarui nama lokasi atau nama baru sudah terdaftar.');
    }
  };

  // Category Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    const success = AppDatabase.addMasterCategory(newCategory.trim());
    if (success) {
      setCategories(AppDatabase.getMasterCategories());
      setNewCategory('');
      onDataChanged();
      showFeedback('success', `Kategori "${newCategory.trim()}" berhasil ditambahkan!`);
    } else {
      showFeedback('error', 'Kategori tersebut sudah terdaftar dalam master data.');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${cat}" dari master data?`)) {
      AppDatabase.deleteMasterCategory(cat);
      setCategories(AppDatabase.getMasterCategories());
      onDataChanged();
      showFeedback('success', `Kategori "${cat}" telah dihapus.`);
    }
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.newName.trim()) return;
    const success = AppDatabase.updateMasterCategory(editingCategory.oldName, editingCategory.newName.trim());
    if (success) {
      setCategories(AppDatabase.getMasterCategories());
      showFeedback('success', `Kategori "${editingCategory.oldName}" berhasil diperbarui menjadi "${editingCategory.newName.trim()}"!`);
      setEditingCategory(null);
      onDataChanged();
    } else {
      showFeedback('error', 'Gagal memperbarui nama kategori atau nama baru sudah terdaftar.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Manajemen Master Data & Kredensial PIC</span>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              Hak Akses Penuh
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi akun teknisi/PIC (email & password), hak akses sistem, serta master lokasi dan kategori aset kampus.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('teknisi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'teknisi'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-red-600" />
            <span>Akun & PIC ({technicians.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lokasi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'lokasi'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Lokasi ({locations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kategori')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'kategori'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kategori ({categories.length})</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* TAB 1: KELOLA AKUN PIC / TEKNISI (USER REQUEST 1) */}
      {activeTab === 'teknisi' && (
        <div className="space-y-6">
          {/* Info Card Role & Access rules */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 rounded-xl p-5 text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-amber-200">
                  Konsep Autentikasi & Hak Akses PIC (Role-Based Access Control)
                </h3>
              </div>
              <button
                type="button"
                onClick={openAddTechModal}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Akun PIC Baru</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Setiap PIC memiliki username (berupa <strong>email</strong>) dan <strong>password</strong> tersendiri yang dapat dikelola oleh Admin.
              Ketika PIC login: jika bukan <strong>Kepala PUSDATIN</strong> atau <strong>IT Support & Helpdesk</strong>, tampilannya hanya memuat <strong>Dashboard PIC</strong> dan <strong>Kelola Tiket Rusak</strong> khusus bidang mereka atau yang didelegasikan ke mereka. PIC Programmer senior juga dapat mendelegasikan tiket ke programmer junior.
            </p>
          </div>

          {/* Table of Technicians */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Daftar Akun PIC & Teknisi PUSDATIN</h3>
                <p className="text-xs text-slate-500">Kelola kredensial login, hak akses, dan spesialisasi masing-masing petugas</p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {technicians.length} Petugas Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ID & Nama Lengkap</th>
                    <th className="px-4 py-3">Peran / Bidang</th>
                    <th className="px-4 py-3">Username (Email)</th>
                    <th className="px-4 py-3">Password</th>
                    <th className="px-4 py-3">Tingkat & Hak Akses</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {technicians.map(t => {
                    const isPassVisible = showPasswords[t.id];

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{t.name}</div>
                          <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>ID: {t.id}</span>
                            {t.phone && <span>· WA: {t.phone}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 block">{t.role}</span>
                          <span className="text-[10px] text-slate-500">{t.specialty || '-'}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                              {isPassVisible ? t.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(t.id)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                              title={isPassVisible ? 'Sembunyikan password' : 'Lihat password'}
                            >
                              {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            {t.isFullAccess ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                👑 Hak Akses Penuh
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                                🎯 Akses Khusus PIC
                              </span>
                            )}
                            <div className="text-[10px] text-slate-500 font-medium">
                              Jenjang: <strong className="text-slate-700">{t.level || 'Senior'}</strong>
                              {t.reportsTo && (
                                <span className="block text-[9px] text-violet-600">
                                  Lapor ke: {technicians.find(tc => tc.id === t.reportsTo)?.name || t.reportsTo}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditTechModal(t)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTechnician(t)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Add / Edit Technician */}
          {showTechModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {editingTech ? 'Edit Kredensial & Data PIC' : 'Tambah Akun PIC Baru'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {editingTech ? `Mengubah data akun ${editingTech.name}` : 'Buat akun username dan password baru untuk teknisi'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTechModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveTechnician} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Lengkap & Gelar: <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={techName}
                      onChange={e => setTechName(e.target.value)}
                      placeholder="Contoh: Dimas Saputra, S.Kom."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Peran / Bidang: <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={techRole}
                        onChange={e => setTechRole(e.target.value as TechnicianRole)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:bg-white"
                      >
                        <option value="Programmer">Programmer</option>
                        <option value="Junior Programmer">Junior Programmer</option>
                        <option value="Cloud & Infrastructure Engineer">Cloud & Infrastructure Engineer</option>
                        <option value="Cyber Security Officer">Cyber Security Officer</option>
                        <option value="IT Support & Helpdesk Specialist">IT Support & Helpdesk Specialist</option>
                        <option value="Kepala PUSDATIN">Kepala PUSDATIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jenjang Petugas:
                      </label>
                      <select
                        value={techLevel}
                        onChange={e => setTechLevel(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:bg-white"
                      >
                        <option value="Lead">Lead / Koordinator</option>
                        <option value="Senior">Senior Specialist</option>
                        <option value="Junior">Junior Staff</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Username Login (Email): <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={techEmail}
                        onChange={e => setTechEmail(e.target.value)}
                        placeholder="cth: dimas.dev@umc.ac.id"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Password Login: <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={techPassword}
                        onChange={e => setTechPassword(e.target.value)}
                        placeholder="cth: admin / sandi123"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        No. WhatsApp / HP:
                      </label>
                      <input
                        type="text"
                        value={techPhone}
                        onChange={e => setTechPhone(e.target.value)}
                        placeholder="cth: 081234567890"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Spesialisasi Teknis:
                      </label>
                      <input
                        type="text"
                        value={techSpecialty}
                        onChange={e => setTechSpecialty(e.target.value)}
                        placeholder="cth: Backend PHP/NodeJS, SIAKAD"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Hak Akses Toggle */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                      <input
                        type="checkbox"
                        checked={techIsFullAccess}
                        onChange={e => setTechIsFullAccess(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span>Berikan Hak Akses Penuh (Full System Admin)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                      Jika dicentang, pengguna ini dapat mengakses seluruh menu (semua aset, peminjaman, suku cadang, laporan bulanan, dan master data).
                      Jika tidak dicentang (default untuk PIC), pengguna hanya dapat mengakses <strong>Dashboard PIC</strong> dan <strong>Kelola Tiket Rusak</strong> khusus bidang mereka.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowTechModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
                    >
                      Simpan Akun PIC
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER LOKASI (USER REQUEST 4) */}
      {activeTab === 'lokasi' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Master Lokasi Ruangan & Gedung Kampus</h3>
                  <p className="text-xs text-slate-500">
                    Admin berhak akses penuh dapat menambah, mengubah, dan menghapus lokasi aset kampus
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 self-start sm:self-auto">
                Total {locations.length} Lokasi Terdaftar
              </span>
            </div>

            {/* Input Form Tambah Lokasi */}
            <form onSubmit={handleAddLocation} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                + Tambah Lokasi Ruangan Baru:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="Ketik nama lokasi (cth: Ruang Laboratorium Multimedia Lt.3 Kampus 2)..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Lokasi</span>
                </button>
              </div>
            </form>

            {/* Search Filter */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchLoc}
                  onChange={e => setSearchLoc(e.target.value)}
                  placeholder="Cari nama lokasi ruangan..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <span className="text-xs text-slate-500">
                Menampilkan {locations.filter(l => l.toLowerCase().includes(searchLoc.toLowerCase())).length} dari {locations.length} lokasi
              </span>
            </div>

            {/* List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {locations
                .filter(l => l.toLowerCase().includes(searchLoc.toLowerCase()))
                .map((loc, idx) => (
                  <div
                    key={loc}
                    className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-slate-400 font-mono text-[10px] w-6 shrink-0">{idx + 1}.</span>
                      <span className="font-semibold text-slate-900 truncate">{loc}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() => setEditingLocation({ oldName: loc, newName: loc })}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Ubah Nama Lokasi"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(loc)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Lokasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <p className="text-[11px] text-slate-500 bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Daftar master lokasi ini otomatis tersinkronisasi dan menjadi opsi pada formulir pengaduan kerusakan, pengajuan peminjaman aset, mutasi perbaikan lab PUSDATIN, dan pencatatan barang masuk.
              </span>
            </p>
          </div>

          {/* Modal Edit Lokasi */}
          {editingLocation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-900">Ubah Nama Lokasi</h3>
                  <button
                    type="button"
                    onClick={() => setEditingLocation(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleUpdateLocation} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Lokasi Saat Ini:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingLocation.oldName}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Lokasi Baru: <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={editingLocation.newName}
                      onChange={e => setEditingLocation({ ...editingLocation, newName: e.target.value })}
                      placeholder="Masukkan nama lokasi baru..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingLocation(null)}
                      className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MASTER KATEGORI (USER REQUEST 4) */}
      {activeTab === 'kategori' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Master Kategori Aset Inventaris</h3>
                  <p className="text-xs text-slate-500">
                    Admin berhak akses penuh dapat menambah, mengubah, dan menghapus kategori klasifikasi aset
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                Total {categories.length} Kategori Terdaftar
              </span>
            </div>

            {/* Input Form Tambah Kategori */}
            <form onSubmit={handleAddCategory} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                + Tambah Kategori Aset Baru:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Ketik nama kategori (cth: Server & Data Center Rack, Audio System)..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Kategori</span>
                </button>
              </div>
            </form>

            {/* Search Filter */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchCat}
                  onChange={e => setSearchCat(e.target.value)}
                  placeholder="Cari nama kategori aset..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
              <span className="text-xs text-slate-500">
                Menampilkan {categories.filter(c => c.toLowerCase().includes(searchCat.toLowerCase())).length} dari {categories.length} kategori
              </span>
            </div>

            {/* List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {categories
                .filter(c => c.toLowerCase().includes(searchCat.toLowerCase()))
                .map((cat, idx) => (
                  <div
                    key={cat}
                    className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-slate-400 font-mono text-[10px] w-6 shrink-0">{idx + 1}.</span>
                      <span className="font-semibold text-slate-900 truncate">{cat}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Ubah Nama Kategori"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <p className="text-[11px] text-slate-500 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Kategori mempermudah pengelompokan inventaris pada katalog aset master, pencetakan barcode POS-58, serta rekapitulasi data pada Laporan Bulanan PDF resmi PUSDATIN.
              </span>
            </p>
          </div>

          {/* Modal Edit Kategori */}
          {editingCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-900">Ubah Nama Kategori</h3>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleUpdateCategory} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Kategori Saat Ini:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingCategory.oldName}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Kategori Baru: <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={editingCategory.newName}
                      onChange={e => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                      placeholder="Masukkan nama kategori baru..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
