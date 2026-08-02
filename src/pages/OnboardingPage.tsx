import React from "react";
import { UserProfile } from "../types";
import { ProfileForm } from "../components/ProfileForm";
import { Flame } from "lucide-react";

interface OnboardingPageProps {
  username: string;
  onComplete: (profile: UserProfile) => void;
  id?: string;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  username,
  onComplete,
  id = "onboarding-page-screen",
}) => {
  return (
    <div id={id} className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-100 text-emerald-700 mb-1">
            <Flame className="w-8 h-8 fill-emerald-200" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Welcome to Calorify, {username}!
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Let's customize your nutrition plan. Enter your stats to calculate your
            precise BMR, maintenance calories, and target macros.
          </p>
        </div>

        {/* Profile Setup Form */}
        <ProfileForm
          onSave={onComplete}
          isInitialOnboarding={true}
          initialProfile={null}
        />
      </div>
    </div>
  );
};
