import React, { useState, useEffect } from 'react';
import { AppDatabase } from '../../services/db';
import { TechnicianUser, TechnicianRole, ActorCode, DocumentSignatories } from '../../types';
import { isAllowedInstitutionalEmail, inferCivitasTypeFromEmail } from '../../services/authValidation';
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
  Edit2,
  Lock,
  UserCheck,
  PenTool,
  RefreshCw,
  Power
} from 'lucide-react';

interface MasterDataManagementProps {
  onDataChanged: () => void;
}

const ACTOR_ROLE_OPTIONS: { code: ActorCode; defaultRoleName: TechnicianRole; label: string }[] = [
  { code: 'ACT-01', defaultRoleName: 'Pimpinan Universitas', label: 'ACT-01 — Pimpinan Universitas (Rektor/Warek)' },
  { code: 'ACT-02', defaultRoleName: 'Kepala PUSDATIN', label: 'ACT-02 — Kepala PUSDATIN' },
  { code: 'ACT-03', defaultRoleName: 'IT Support & Helpdesk Specialist', label: 'ACT-03 — Admin / IT Support & Helpdesk Specialist' },
  { code: 'ACT-04', defaultRoleName: 'Cloud & Infrastructure Engineer', label: 'ACT-04 — Cloud & Infrastructure Engineer' },
  { code: 'ACT-05', defaultRoleName: 'System Analyst & Data Governance Specialist', label: 'ACT-05 — System Analyst & Data Governance' },
  { code: 'ACT-06', defaultRoleName: 'Lead Full Stack Developer', label: 'ACT-06 — Lead Full Stack Developer' },
  { code: 'ACT-07', defaultRoleName: 'Frontend Programmer', label: 'ACT-07 — Frontend Programmer' },
  { code: 'ACT-08', defaultRoleName: 'Backend Programmer', label: 'ACT-08 — Backend Programmer' },
  { code: 'ACT-09', defaultRoleName: 'Cyber Security Officer', label: 'ACT-09 — Cyber Security Officer' },
  { code: 'ACT-10', defaultRoleName: 'User (Civitas Akademika)', label: 'ACT-10 — Civitas Akademika (Dosen / Karyawan / Mahasiswa)' }
];

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({ onDataChanged }) => {
  const [activeTab, setActiveTab] = useState<'teknisi' | 'lokasi' | 'kategori' | 'penandatangan'>('teknisi');

  // Master Data States
  const [locations, setLocations] = useState(() => AppDatabase.getMasterLocations());
  const [categories, setCategories] = useState(() => AppDatabase.getMasterCategories());
  const [technicians, setTechnicians] = useState(() => AppDatabase.getUsers());
  const [signatories, setSignatories] = useState<DocumentSignatories>(() =>
    AppDatabase.getDocumentSignatories()
  );

  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingLocation, setEditingLocation] = useState<{ oldName: string; newName: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [searchLoc, setSearchLoc] = useState('');
  const [searchCat, setSearchCat] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Form & Modal States
  const [showTechModal, setShowTechModal] = useState(false);
  const [editingTech, setEditingTech] = useState<TechnicianUser | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/users')
      .then(res => (res.ok ? res.json() : null))
      .then((data: { ok?: boolean; users?: TechnicianUser[] } | null) => {
        if (active && data?.ok && Array.isArray(data.users) && data.users.length > 0) {
          AppDatabase.replaceUsers(data.users);
          setTechnicians(AppDatabase.getUsers());
        }
      })
      .catch(() => {
        // fallback to localStorage if server is unavailable in isolated unit mode
      });
    return () => {
      active = false;
    };
  }, []);

  // User Form Inputs
  const [techName, setTechName] = useState('');
  const [techActorCode, setTechActorCode] = useState<ActorCode>('ACT-04');
  const [techRole, setTechRole] = useState<TechnicianRole>('Cloud & Infrastructure Engineer');
  const [techCivitasType, setTechCivitasType] = useState<'Dosen' | 'Karyawan' | 'Mahasiswa'>('Dosen');
  const [techUnit, setTechUnit] = useState('PUSDATIN UMC');
  const [techEmail, setTechEmail] = useState('');
  const [techPassword, setTechPassword] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techSpecialty, setTechSpecialty] = useState('');
  const [techIsFullAccess, setTechIsFullAccess] = useState(false);
  const [techLevel, setTechLevel] = useState<'Lead' | 'Senior' | 'Junior'>('Senior');

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // User Form Handlers
  const openAddTechModal = () => {
    setEditingTech(null);
    setTechName('');
    setTechActorCode('ACT-10');
    setTechRole('User (Civitas Akademika)');
    setTechCivitasType('Dosen');
    setTechUnit('Fakultas Teknik UMC');
    setTechEmail('');
    setTechPassword('');
    setTechPhone('081234567890');
    setTechSpecialty('');
    setTechIsFullAccess(false);
    setTechLevel('Senior');
    setShowTechModal(true);
  };

  const openEditTechModal = (tech: TechnicianUser) => {
    setEditingTech(tech);
    setTechName(tech.nama || tech.name || '');
    setTechActorCode(tech.role || 'ACT-04');
    setTechRole(tech.roleName || (tech.role as any));
    setTechCivitasType(tech.civitasType || inferCivitasTypeFromEmail(tech.email));
    setTechUnit(tech.unit || 'PUSDATIN UMC');
    setTechEmail(tech.email);
    setTechPassword('');
    setTechPhone(tech.phone || '');
    setTechSpecialty(tech.specialty || '');
    setTechIsFullAccess(Boolean(tech.isFullAccess));
    setTechLevel(tech.level === 'Junior' || tech.level === 'Lead' ? tech.level : 'Senior');
    setShowTechModal(true);
  };

  const syncUserToServer = async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/auth/admin-sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; user?: TechnicianUser };
        if (data.ok && data.user) {
          AppDatabase.upsertUser(data.user);
          setTechnicians(AppDatabase.getUsers());
        }
      }
    } catch {
      // ignore offline error
    }
  };

  const handleSaveTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = techEmail.trim().toLowerCase();
    if (!techName.trim() || !techRole.trim() || !normalizedEmail) {
      showFeedback('error', 'Nama, Peran / Bidang, dan Email Institusi wajib diisi!');
      return;
    }

    if (!isAllowedInstitutionalEmail(normalizedEmail)) {
      showFeedback('error', 'Email wajib menggunakan domain resmi @umc.ac.id atau @student.umc.ac.id.');
      return;
    }

    if (editingTech) {
      const hasPasswordAfterEdit = Boolean(
        techPassword.trim() || editingTech.passwordSet || editingTech.password
      );
      const updatedPayload = {
        ...editingTech,
        nama: techName.trim(),
        name: techName.trim(),
        role: techActorCode,
        roleName: techRole.trim() as TechnicianRole,
        civitasType: techActorCode === 'ACT-10' ? techCivitasType : undefined,
        unit: techUnit.trim() || 'PUSDATIN UMC',
        email: normalizedEmail,
        password: techPassword.trim() || undefined,
        passwordSet: hasPasswordAfterEdit,
        phone: techPhone.trim(),
        specialty: techSpecialty.trim(),
        isFullAccess: techIsFullAccess || techActorCode === 'ACT-02' || techActorCode === 'ACT-03',
        level: techLevel
      };
      const success = AppDatabase.updateTechnician(updatedPayload);

      if (success) {
        void syncUserToServer(updatedPayload);
        setTechnicians(AppDatabase.getUsers());
        setShowTechModal(false);
        onDataChanged();
        showFeedback('success', `Data akun ${techName} (${normalizedEmail}) berhasil diperbarui!`);
      } else {
        showFeedback('error', 'Gagal memperbarui data akun.');
      }
    } else {
      const newPayload = {
        id: `USR-${Date.now()}`,
        nama: techName.trim(),
        name: techName.trim(),
        role: techActorCode,
        roleName: techRole.trim() as TechnicianRole,
        civitasType: techActorCode === 'ACT-10' ? techCivitasType : undefined,
        unit: techUnit.trim() || 'PUSDATIN UMC',
        email: normalizedEmail,
        password: techPassword.trim() || undefined,
        phone: techPhone.trim(),
        specialty: techSpecialty.trim(),
        isFullAccess: techIsFullAccess || techActorCode === 'ACT-02' || techActorCode === 'ACT-03',
        level: techLevel,
        statusAkun: 'Aktif' as const
      };
      const created = AppDatabase.addTechnician(newPayload);

      if (created) {
        void syncUserToServer(newPayload);
        setTechnicians(AppDatabase.getUsers());
        setShowTechModal(false);
        onDataChanged();
        showFeedback('success', `Akun baru "${techName}" (${normalizedEmail}) berhasil didaftarkan untuk Login SSO!`);
      } else {
        showFeedback('error', `Email "${normalizedEmail}" sudah terdaftar sebelumnya.`);
      }
    }
  };

  const handleToggleUserStatus = (tech: TechnicianUser) => {
    if (tech.role === 'ACT-02' || tech.id === 'TECH-000') {
      showFeedback('error', 'Akun Kepala PUSDATIN utama tidak dapat dinonaktifkan.');
      return;
    }
    const updated = AppDatabase.toggleUserStatus(tech.id);
    if (updated) {
      void syncUserToServer(updated as unknown as Record<string, unknown>);
      setTechnicians(AppDatabase.getUsers());
      onDataChanged();
      showFeedback(
        'success',
        `Status akun ${updated.nama} (${updated.email}) diubah menjadi ${updated.statusAkun}.`
      );
    }
  };

  const handleDeleteTechnician = (tech: TechnicianUser) => {
    if (tech.isFullAccess && (tech.roleName === 'Kepala PUSDATIN' || tech.role === 'ACT-02' || tech.id === 'TECH-000')) {
      showFeedback('error', 'Akun Kepala PUSDATIN utama tidak boleh dihapus demi keamanan sistem.');
      return;
    }
    if (tech.id === 'USR-ACT-03') {
      showFeedback('error', 'Akun Admin sistem utama tidak dapat dihapus.');
      return;
    }

    if (confirmDeleteUserId !== tech.id) {
      setConfirmDeleteUserId(tech.id);
      return;
    }

    const displayName = tech.nama || tech.name || tech.email;
    const success = AppDatabase.deleteTechnician(tech.id);
    setConfirmDeleteUserId(null);
    if (success) {
      void fetch(`/api/auth/admin-user/${encodeURIComponent(tech.id)}`, { method: 'DELETE' }).catch(() => {});
      setTechnicians(AppDatabase.getUsers());
      onDataChanged();
      showFeedback('success', `Akun "${displayName}" telah dihapus.`);
    } else {
      showFeedback('error', 'Akun ini tidak dapat dihapus.');
    }
  };

  const handleSaveSignatories = (e: React.FormEvent) => {
    e.preventDefault();
    AppDatabase.setDocumentSignatories(signatories);
    setSignatories(AppDatabase.getDocumentSignatories());
    onDataChanged();
    showFeedback('success', 'Master Penandatangan Dokumen Resmi berhasil disimpan & berlaku di seluruh cetakan PDF.');
  };

  const handleSyncSignatoriesFromUsers = () => {
    const synced = AppDatabase.syncSignatoriesFromMasterUsers();
    setSignatories(synced);
    onDataChanged();
    showFeedback('success', 'Data Penandatangan Dokumen berhasil disinkronkan dari Master Akun Pengguna (ACT-01 / ACT-02 / ACT-03).');
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
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('teknisi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'teknisi'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-red-600" />
            <span>Akun & Pengguna ({technicians.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lokasi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
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
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kategori'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kategori ({categories.length})</span>
          </button>
          <button
            type="button"
            data-testid="tab-penandatangan"
            onClick={() => {
              setSignatories(AppDatabase.getDocumentSignatories());
              setActiveTab('penandatangan');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'penandatangan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-purple-600" />
            <span>Penandatangan Dokumen</span>
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
                data-testid="add-master-user-btn"
                onClick={openAddTechModal}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Akun Pengguna SSO</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hanya email resmi terdaftar (<code className="text-amber-300">@umc.ac.id</code> dan <code className="text-amber-300">@student.umc.ac.id</code>) dengan status <strong>Aktif</strong> yang dapat masuk melalui Login SSO Google. Kelola seluruh akun Pimpinan, Tim Teknis PUSDATIN, serta Civitas Akademika di sini.
            </p>
          </div>

          {/* Table of Users */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Daftar Akun Pengguna Terdaftar (Master SSO & PIC)</h3>
                <p className="text-xs text-slate-500">Kelola kredensial login, aktor RBAC (ACT-01 s/d ACT-10), status aktif, dan spesialisasi</p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {technicians.length} Akun Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ID & Nama Lengkap</th>
                    <th className="px-4 py-3">Aktor & Peran</th>
                    <th className="px-4 py-3">Email Institusi</th>
                    <th className="px-4 py-3">Password</th>
                    <th className="px-4 py-3">Status & Hak Akses</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {technicians.map(t => {
                    const isActive = t.statusAkun !== 'Nonaktif';
                    const hasPasswordConfigured = Boolean(
                      t.passwordSet === true || (t.password && t.password.trim().length > 0 && t.passwordSet !== false)
                    );

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{t.nama || t.name}</div>
                          <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{t.id}</span>
                            {t.unit && <span>· {t.unit}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                              {t.role}
                            </span>
                            {t.civitasType && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                                {t.civitasType}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-slate-800 block mt-0.5">{t.roleName || t.role}</span>
                          {t.specialty && <span className="text-[10px] text-slate-500">{t.specialty}</span>}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              hasPasswordConfigured
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <Lock className="w-3 h-3" />
                            <span>{hasPasswordConfigured ? 'Sudah diatur (Hash)' : 'Belum diatur'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}
                              >
                                {t.statusAkun || 'Aktif'}
                              </span>
                              {t.isFullAccess && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  Penuh
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Jenjang: <strong className="text-slate-700">{t.level || 'Senior'}</strong>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(t)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                                isActive
                                  ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                              title={isActive ? 'Nonaktifkan akun SSO' : 'Aktifkan akun SSO'}
                            >
                              <Power className="w-3 h-3" />
                              <span>{isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditTechModal(t)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            {confirmDeleteUserId === t.id ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteTechnician(t)}
                                className="px-2 py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                              >
                                Konfirmasi Hapus
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteTechnician(t)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Akun"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
                      {editingTech ? `Mengubah data akun ${editingTech.nama || editingTech.name}` : 'Buat akun username dan password baru untuk teknisi'}
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
                      placeholder="Contoh: Hilyah Haula Salsabiila, S.T."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Aktor RBAC (ACT-01 s/d ACT-10): <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={techActorCode}
                        onChange={e => {
                          const code = e.target.value as ActorCode;
                          setTechActorCode(code);
                          const matched = ACTOR_ROLE_OPTIONS.find(opt => opt.code === code);
                          if (matched) setTechRole(matched.defaultRoleName);
                          if (code === 'ACT-02' || code === 'ACT-03') {
                            setTechIsFullAccess(true);
                          } else {
                            setTechIsFullAccess(false);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white"
                      >
                        {ACTOR_ROLE_OPTIONS.map(opt => (
                          <option key={opt.code} value={opt.code}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Label Peran / Jabatan: <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={techRole}
                        onChange={e => setTechRole(e.target.value as TechnicianRole)}
                        placeholder="Contoh: IT Support & Helpdesk Specialist"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {techActorCode === 'ACT-10' ? (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Jenis Civitas (ACT-10):
                        </label>
                        <select
                          value={techCivitasType}
                          onChange={e => setTechCivitasType(e.target.value as 'Dosen' | 'Karyawan' | 'Mahasiswa')}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:bg-white"
                        >
                          <option value="Dosen">Dosen</option>
                          <option value="Karyawan">Karyawan</option>
                          <option value="Mahasiswa">Mahasiswa</option>
                        </select>
                      </div>
                    ) : (
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
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Unit / Fakultas / Prodi:
                      </label>
                      <input
                        type="text"
                        value={techUnit}
                        onChange={e => setTechUnit(e.target.value)}
                        placeholder="cth: PUSDATIN UMC / Prodi Teknik Informatika"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Email Institusi (@umc.ac.id / @student.umc.ac.id): <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={techEmail}
                        onChange={e => {
                          const val = e.target.value;
                          setTechEmail(val);
                          if (techActorCode === 'ACT-10' && val.toLowerCase().endsWith('@student.umc.ac.id')) {
                            setTechCivitasType('Mahasiswa');
                          }
                        }}
                        placeholder="cth: dosen@umc.ac.id / nim@student.umc.ac.id"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Password / PIN Lokal: <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={techPassword}
                        onChange={e => setTechPassword(e.target.value)}
                        placeholder="Kosongkan agar user atur saat login pertama"
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
                      Aktif otomatis untuk ACT-02 (Kepala PUSDATIN) dan ACT-03 (Admin IT Support).
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowTechModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Simpan Akun Pengguna
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

      {/* TAB 4: MASTER PENANDATANGAN DOKUMEN RESMI */}
      {activeTab === 'penandatangan' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Master Penandatangan Dokumen Resmi (BAST & Laporan PDF)
                </h3>
                <p className="text-xs text-slate-500">
                  Menentukan pejabat penandatangan default untuk seluruh dokumen PDF dan dapat dikonfirmasi ulang sebelum mencetak.
                </p>
              </div>
            </div>

            <button
              type="button"
              data-testid="sync-signatories-btn"
              onClick={handleSyncSignatoriesFromUsers}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan dari Master Akun</span>
            </button>
          </div>

          <form onSubmit={handleSaveSignatories} className="space-y-5 text-xs">
            {/* Pimpinan Universitas */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                1. Pimpinan Universitas (Rektor / Wakil Rektor — Laporan Eksekutif)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pimpinan Universitas:</label>
                  <input
                    type="text"
                    required
                    data-testid="master-sig-pimpinan-nama"
                    value={signatories.pimpinanUnivNama}
                    onChange={e => setSignatories({ ...signatories, pimpinanUnivNama: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan Pimpinan:</label>
                  <input
                    type="text"
                    required
                    value={signatories.pimpinanUnivJabatan}
                    onChange={e => setSignatories({ ...signatories, pimpinanUnivJabatan: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP / NIDN Pimpinan (Opsional):</label>
                  <input
                    type="text"
                    value={signatories.pimpinanUnivNip}
                    onChange={e => setSignatories({ ...signatories, pimpinanUnivNip: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Pimpinan PUSDATIN */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                2. Pimpinan PUSDATIN UMC (Mengetahui / Menyetujui BAST & Laporan)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Kepala PUSDATIN:</label>
                  <input
                    type="text"
                    required
                    data-testid="master-sig-kepala-nama"
                    value={signatories.kepalaPusdatinNama}
                    onChange={e => setSignatories({ ...signatories, kepalaPusdatinNama: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIDN / NIP Kepala PUSDATIN:</label>
                  <input
                    type="text"
                    data-testid="master-sig-kepala-nip"
                    value={signatories.kepalaPusdatinNip}
                    onChange={e => setSignatories({ ...signatories, kepalaPusdatinNip: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Petugas Default */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                3. Petugas Pengelola Aset / Penyerah Default
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Petugas Default:</label>
                  <input
                    type="text"
                    required
                    data-testid="master-sig-petugas-nama"
                    value={signatories.petugasDefaultNama}
                    onChange={e => setSignatories({ ...signatories, petugasDefaultNama: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan Petugas:</label>
                  <input
                    type="text"
                    required
                    value={signatories.petugasDefaultJabatan}
                    onChange={e => setSignatories({ ...signatories, petugasDefaultJabatan: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                data-testid="save-signatories-btn"
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                Simpan Penandatangan Dokumen
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
