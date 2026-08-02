import React from "react";
import { Plus, Sunrise, Sun, Sunset, Cookie } from "lucide-react";
import { FoodLogEntry, MealType } from "../types";
import { FoodLogItem } from "./FoodLogItem";

interface MealSectionProps {
  mealType: MealType;
  title: string;
  entries: FoodLogEntry[];
  onAddFood: (mealType: MealType) => void;
  onEditFood: (entry: FoodLogEntry) => void;
  onDeleteFood: (id: string) => void;
  id?: string;
}

const MEAL_ICONS = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Sunset,
  snacks: Cookie,
};

const MEAL_COLORS = {
  breakfast: "bg-amber-100 text-amber-700",
  lunch: "bg-emerald-100 text-emerald-700",
  dinner: "bg-indigo-100 text-indigo-700",
  snacks: "bg-purple-100 text-purple-700",
};

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  title,
  entries,
  onAddFood,
  onEditFood,
  onDeleteFood,
  id,
}) => {
  const Icon = MEAL_ICONS[mealType] || Sun;
  const colorClass = MEAL_COLORS[mealType] || "bg-emerald-100 text-emerald-700";

  const totalCalories = entries.reduce((acc, curr) => acc + (curr.calories || 0), 0);

  return (
    <div
      id={id || `meal-section-${mealType}`}
      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs mb-4"
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
            <p className="text-xs text-slate-500">
              {entries.length} {entries.length === 1 ? "item" : "items"} •{" "}
              <span className="font-semibold text-slate-700">{totalCalories} kcal</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAddFood(mealType)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition-colors active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Food
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-slate-400 mb-2">No food logged for {title.toLowerCase()}</p>
          <button
            type="button"
            onClick={() => onAddFood(mealType)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            + Log {title}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <FoodLogItem
              key={entry.id}
              entry={entry}
              onEdit={onEditFood}
              onDelete={onDeleteFood}
            />
          ))}
        </div>
      )}
    </div>
  );
};
