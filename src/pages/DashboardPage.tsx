import React from "react";
import { Plus, Sparkles, Utensils } from "lucide-react";
import { DailySummary } from "../components/DailySummary";
import { CalorieProgressCard } from "../components/CalorieProgressCard";
import { GoalSummaryCard } from "../components/GoalSummaryCard";
import { MacroProgressCard } from "../components/MacroProgressCard";
import { MEAL_TYPES } from "../constants";
import { DailyTotals, FoodLogEntry, MealType, UserProfile } from "../types";
import { formatDisplayDate } from "../utils/dateUtils";
import { GLP1MedicationProfile, MedicationAdministration, MedicationDosePeriod, SymptomEntry } from "../types";
import { GLP1DashboardCard } from "../components/GLP1DashboardCard";

interface DashboardPageProps {
  profile: UserProfile;
  selectedDate: string;
  totals: DailyTotals;
  entriesByMeal: Record<MealType, FoodLogEntry[]>;
  onAddFood: (mealType?: MealType) => void;
  onNavigateToTab: (tab: "meals" | "history" | "profile") => void;
  id?: string;
  glp1: { profile: GLP1MedicationProfile | null; dose: MedicationDosePeriod | null; administrations: MedicationAdministration[]; symptoms: SymptomEntry[] };
  onOpenGLP1: () => void;
  onSetupGLP1: () => void;
  onLogMedication: () => void;
  onLogSymptom: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  profile,
  selectedDate,
  totals,
  entriesByMeal,
  onAddFood,
  onNavigateToTab,
  id = "dashboard-page-container",
  glp1, onOpenGLP1, onSetupGLP1, onLogMedication, onLogSymptom,
}) => {
  return (
    <div id={id} className="space-y-5 pb-20">
      {/* Greeting Banner */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Hello, {profile.name}! 👋
          </h2>
          <p className="text-xs text-slate-500">
            Overview for <span className="font-semibold text-emerald-700">{formatDisplayDate(selectedDate)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAddFood("breakfast")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log Food
        </button>
      </div>

      <GLP1DashboardCard profile={glp1.profile} dose={glp1.dose} administrations={glp1.administrations} symptoms={glp1.symptoms} onOpen={onOpenGLP1} onSetup={onSetupGLP1} onLogMedication={onLogMedication} onLogSymptom={onLogSymptom}/>

      {/* Main Progress Ring & Macro Cards */}
      <CalorieProgressCard
        goal={profile.dailyCalorieGoal}
        consumed={totals.totalCalories}
      />

      <MacroProgressCard
        proteinGoal={profile.proteinGoalGrams}
        proteinConsumed={totals.totalProtein}
        carbGoal={profile.carbGoalGrams}
        carbConsumed={totals.totalCarbs}
        fatGoal={profile.fatGoalGrams}
        fatConsumed={totals.totalFat}
      />

      {/* Meal Breakdown Quick Summary */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" /> Meal Breakdown
          </h3>
          <button
            type="button"
            onClick={() => onNavigateToTab("meals")}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            View All Meals →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {MEAL_TYPES.map((meal) => {
            const items = entriesByMeal[meal.value] || [];
            const mealCals = items.reduce((sum, item) => sum + (item.calories || 0), 0);

            return (
              <div
                key={meal.value}
                onClick={() => onAddFood(meal.value)}
                className="p-3 bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">{meal.label}</span>
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    +
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-extrabold text-slate-900">
                    {mealCals} <span className="text-[10px] font-normal text-slate-500">kcal</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Macro Totals */}
      <DailySummary totals={totals} />

      {/* Nutrition Plan Summary */}
      <GoalSummaryCard profile={profile} />
    </div>
  );
};
