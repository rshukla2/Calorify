import React from "react";
import { DailyTotals } from "../types";

interface DailySummaryProps {
  totals: DailyTotals;
  id?: string;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  totals,
  id = "daily-summary-card",
}) => {
  return (
    <div id={id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
        Daily Macro Totals
      </h3>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block">Calories</span>
          <span className="text-sm font-bold text-slate-900">
            {totals.totalCalories}{" "}
            <span className="text-[10px] font-normal text-slate-500">kcal</span>
          </span>
        </div>

        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/60">
          <span className="text-[11px] text-amber-800 block">Protein</span>
          <span className="text-sm font-bold text-amber-900">
            {Math.round(totals.totalProtein)}{" "}
            <span className="text-[10px] font-normal text-amber-700">g</span>
          </span>
        </div>

        <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/60">
          <span className="text-[11px] text-blue-800 block">Carbs</span>
          <span className="text-sm font-bold text-blue-900">
            {Math.round(totals.totalCarbs)}{" "}
            <span className="text-[10px] font-normal text-blue-700">g</span>
          </span>
        </div>

        <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100/60">
          <span className="text-[11px] text-rose-800 block">Fat</span>
          <span className="text-sm font-bold text-rose-900">
            {Math.round(totals.totalFat)}{" "}
            <span className="text-[10px] font-normal text-rose-700">g</span>
          </span>
        </div>
      </div>
    </div>
  );
};
