import React from "react";
import { Edit2, Trash2, Sparkles, Camera } from "lucide-react";
import { FoodLogEntry } from "../types";

interface FoodLogItemProps {
  entry: FoodLogEntry;
  onEdit: (entry: FoodLogEntry) => void;
  onDelete: (id: string) => void;
  id?: string;
}

export const FoodLogItem: React.FC<FoodLogItemProps> = ({
  entry,
  onEdit,
  onDelete,
  id,
}) => {
  return (
    <div
      id={id || `food-item-${entry.id}`}
      className="bg-white rounded-xl p-3.5 border border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between gap-3 shadow-2xs group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h5 className="text-sm font-semibold text-slate-800 truncate">
            {entry.foodName}
          </h5>

          {entry.source === "ai_text" && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-md border border-emerald-100"
              title="Estimated by AI Text Search"
            >
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              <span>AI</span>
            </span>
          )}

          {entry.source === "ai_image" && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded-md border border-purple-100"
              title="Estimated by AI Photo Analysis"
            >
              <Camera className="w-2.5 h-2.5 text-purple-600" />
              <span>Photo</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-1.5 truncate">
          {entry.servingAmount} {entry.servingUnit}{" "}
          {entry.servingDescription ? `• ${entry.servingDescription}` : ""}
        </p>

        {/* Macros micro badges */}
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <span className="text-amber-700 font-semibold">{entry.proteinGrams}g P</span>
          <span className="text-slate-300">•</span>
          <span className="text-blue-700 font-semibold">{entry.carbGrams}g C</span>
          <span className="text-slate-300">•</span>
          <span className="text-rose-700 font-semibold">{entry.fatGrams}g F</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span className="text-sm font-bold text-slate-900 block">
            {entry.calories}{" "}
            <span className="text-xs font-normal text-slate-500">kcal</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Edit Food"
            aria-label={`Edit ${entry.foodName}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Food"
            aria-label={`Delete ${entry.foodName}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
