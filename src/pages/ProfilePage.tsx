import React, { useState } from "react";
import { UserProfile } from "../types";
import { ProfileForm } from "../components/ProfileForm";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { LogOut, RotateCcw, User, ShieldAlert } from "lucide-react";

interface ProfilePageProps {
  profile: UserProfile;
  username: string;
  onSaveProfile: (profile: UserProfile) => void;
  onLogout: () => void;
  onResetData: () => void;
  id?: string;
  glp1Active?: boolean;
  glp1HasData?: boolean;
  onManageGLP1?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  username,
  onSaveProfile,
  onLogout,
  onResetData,
  id = "profile-page-container",
  glp1Active, glp1HasData, onManageGLP1,
}) => {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  return (
    <div id={id} className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {profile.name || username}
            </h2>
            <p className="text-xs text-slate-500">
              Profile Settings & Nutrition Goals
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>

      {/* Editable Profile Form */}
      <ProfileForm
        initialProfile={profile}
        onSave={onSaveProfile}
        isInitialOnboarding={false}
      />

      <div className="bg-violet-50/60 border border-violet-200 p-5 rounded-2xl flex items-center justify-between gap-3">
        <div><h3 className="text-sm font-bold text-violet-950">Manage Your GLP-1 Progress</h3><p className="text-xs text-violet-800">{glp1Active ? "Active · manage schedule, records, and privacy" : glp1HasData ? "Inactive · your prior records are preserved" : "Optional medication, meal timing, and symptom tracking"}</p></div>
        <button type="button" onClick={onManageGLP1} className="px-4 py-2.5 text-xs font-bold text-white bg-violet-600 rounded-xl shrink-0">{glp1Active?"Manage":"Set up"}</button>
      </div>

      {/* Danger Zone: Reset App Data */}
      <div className="bg-rose-50/60 border border-rose-200/80 p-5 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h3 className="text-sm font-bold text-rose-900">Danger Zone</h3>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed">
          Resetting app data will permanently delete your profile settings, food logs,
          GLP-1 medication and symptom health records, and session data stored in this browser.
        </p>

        <button
          type="button"
          onClick={() => setIsResetDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All App Data
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        title="Reset All App Data?"
        message="Are you sure you want to reset Calorify? This cannot be undone and will delete food entries, profile data, and GLP-1 medication and symptom health records stored in this browser."
        confirmLabel="Reset Everything"
        cancelLabel="Keep My Data"
        isDangerous={true}
        onConfirm={() => {
          setIsResetDialogOpen(false);
          onResetData();
        }}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
};
