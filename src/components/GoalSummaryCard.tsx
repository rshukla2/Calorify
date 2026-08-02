import React from "react";
import { ActivityLevel, PrimaryGoal, UserProfile } from "../types";
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from "../constants";
import { Target, Zap } from "lucide-react";

interface GoalSummaryCardProps {
  profile: UserProfile;
  id?: string;
}

export const GoalSummaryCard: React.FC<GoalSummaryCardProps> = ({
  profile,
  id = "goal-summary-card",
}) => {
  const goalObj = GOAL_OPTIONS.find((g) => g.value === profile.goal);
  const activityObj = ACTIVITY_OPTIONS.find((a) => a.value === profile.activityLevel);

  return (
    <div id={id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Nutrition Plan</h4>
            <p className="text-xs text-slate-500">{goalObj?.label || "Weight Management"}</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          {profile.dailyCalorieGoal} kcal / day
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 block text-[10px]">BMR</span>
          <span className="font-bold text-slate-800">{profile.bmr} kcal</span>
        </div>

        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 block text-[10px]">Maintenance</span>
          <span className="font-bold text-slate-800">{profile.maintenanceCalories} kcal</span>
        </div>

        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 block text-[10px]">Activity</span>
          <span className="font-bold text-slate-800 truncate block">
            {activityObj?.label || "Sedentary"}
          </span>
        </div>

        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 block text-[10px]">Weekly Rate</span>
          <span className="font-bold text-slate-800">
            {profile.weeklyGoalKg ? `${profile.weeklyGoalKg} kg/wk` : "Maintain"}
          </span>
        </div>
      </div>
    </div>
  );
};
