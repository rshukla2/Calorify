import React from "react";
import { Plus, Utensils } from "lucide-react";
import { DailySummary } from "../components/DailySummary";
import { EmptyState } from "../components/EmptyState";
import { MealSection } from "../components/MealSection";
import { MEAL_TYPES } from "../constants";
import { DailyTotals, FoodLogEntry, MealType } from "../types";
import { formatDisplayDate } from "../utils/dateUtils";

interface MealsPageProps {
  selectedDate: string;
  entriesByMeal: Record<MealType, FoodLogEntry[]>;
  totalEntriesCount: number;
  totals: DailyTotals;
  onAddFood: (mealType?: MealType) => void;
  onEditFood: (entry: FoodLogEntry) => void;
  onDeleteFood: (id: string) => void;
  id?: string;
}

export const MealsPage: React.FC<MealsPageProps> = ({
  selectedDate,
  entriesByMeal,
  totalEntriesCount,
  totals,
  onAddFood,
  onEditFood,
  onDeleteFood,
  id = "meals-page-container",
}) => {
  return (
    <div id={id} className="space-y-5 pb-20">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600" /> Food Logs
          </h2>
          <p className="text-xs text-slate-500">
            {formatDisplayDate(selectedDate)} • {totalEntriesCount}{" "}
            {totalEntriesCount === 1 ? "entry" : "entries"} ({totals.totalCalories} kcal)
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAddFood("breakfast")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Food
        </button>
      </div>

      {/* Daily Macro Summary */}
      <DailySummary totals={totals} />

      {/* Empty State if no entries at all */}
      {totalEntriesCount === 0 ? (
        <EmptyState
          title="No meals logged yet"
          description={`Start tracking your nutrition for ${formatDisplayDate(
            selectedDate
          )} by logging your first meal.`}
          icon={Utensils}
          actionLabel="Log First Food"
          onAction={() => onAddFood("breakfast")}
        />
      ) : (
        /* Meal Sections */
        <div className="space-y-2">
          {MEAL_TYPES.map((meal) => (
            <MealSection
              key={meal.value}
              mealType={meal.value}
              title={meal.label}
              entries={entriesByMeal[meal.value] || []}
              onAddFood={onAddFood}
              onEditFood={onEditFood}
              onDeleteFood={onDeleteFood}
            />
          ))}
        </div>
      )}
    </div>
  );
};
