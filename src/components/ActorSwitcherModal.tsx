import React from 'react';
import { UserCheck, Shield, ChevronRight, Check } from 'lucide-react';
import { AppDatabase } from '../services/db';
import { AppUser, ActorCode } from '../types';

interface ActorSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: AppUser) => void;
}

export const ActorSwitcherModal: React.FC<ActorSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSelectUser
}) => {
  if (!isOpen) return null;

  const activeUser = AppDatabase.getActiveUser();
  const users = AppDatabase.getUsers();

  const handleSelect = (user: AppUser) => {
    AppDatabase.setActiveUser(user.id);
    onSelectUser(user);
    onClose();
  };

  const getActorBadgeColor = (code: ActorCode) => {
    switch (code) {
      case 'ACT-01':
      case 'ACT-02':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'ACT-03':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'ACT-04':
      case 'ACT-05':
      case 'ACT-06':
      case 'ACT-07':
      case 'ACT-08':
      case 'ACT-09':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'ACT-10':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Ganti Akun & Peran Pengguna (10 Aktor RBAC)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Uji hak akses matriks RBAC (Section 3) dengan berpindah peran secara instan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* List of 10 Actors */}
        <div className="overflow-y-auto divide-y divide-slate-100 py-2 flex-1 space-y-1">
          {users.map(user => {
            const isSelected = activeUser.id === user.id;

            return (
              <div
                key={user.id}
                onClick={() => handleSelect(user)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/80 border border-emerald-300 shadow-2xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border shrink-0 ${getActorBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">{user.nama}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {user.sumberData}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-700 mt-0.5">{user.roleName}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.specialty}</div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Aktif
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
          <span>Prinsip: <strong>Deny by default</strong> (Server-side & Logic RBAC)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
