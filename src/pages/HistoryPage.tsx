import React from "react";
import { Calendar, ChevronRight, History as HistoryIcon, Utensils } from "lucide-react";
import { FoodLogEntry, UserProfile } from "../types";
import { calculateDailyTotals } from "../utils/calculations";
import {
  formatDisplayDate,
  formatFullDate,
  getLastNDays,
} from "../utils/dateUtils";

interface HistoryPageProps {
  profile: UserProfile;
  historyByDate: Record<string, FoodLogEntry[]>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onNavigateToTab: (tab: "meals") => void;
  id?: string;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  profile,
  historyByDate,
  selectedDate,
  onSelectDate,
  onNavigateToTab,
  id = "history-page-container",
}) => {
  // Get last 7 days array
  const last7Days = getLastNDays(7);

  // Get sorted list of all logged dates (descending)
  const loggedDates = Object.keys(historyByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div id={id} className="space-y-5 pb-20">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-emerald-600" /> Log History
        </h2>
        <p className="text-xs text-slate-500">
          Review daily calorie intake and macronutrient trends
        </p>
      </div>

      {/* 7-Day Visual Calorie Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">7-Day Calorie Summary</h3>
            <p className="text-xs text-slate-500">
              Daily Target: {profile.dailyCalorieGoal} kcal
            </p>
          </div>
        </div>

        {/* CSS Chart Bar Grid */}
        <div className="pt-4 pb-2 border-b border-slate-100">
          <div className="relative h-36 flex items-end justify-between gap-2 px-1">
            {/* Target Line */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400 z-10 opacity-70"
              style={{ bottom: "60%" }}
            >
              <span className="absolute -top-3 right-0 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                Goal: {profile.dailyCalorieGoal}
              </span>
            </div>

            {last7Days.map((dateStr) => {
              const dayLogs = historyByDate[dateStr] || [];
              const dayTotals = calculateDailyTotals(dayLogs);
              const calories = dayTotals.totalCalories;
              const goal = profile.dailyCalorieGoal;

              // Compute bar height percentage relative to 1.3x goal for display headroom
              const maxScale = goal * 1.3;
              const heightPct = Math.min(100, Math.round((calories / maxScale) * 100));
              const isOver = calories > goal;
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => onSelectDate(dateStr)}
                  className="flex-1 flex flex-col items-center group cursor-pointer"
                >
                  {/* Calorie tooltip label */}
                  <span className="text-[10px] font-bold text-slate-700 mb-1 opacity-80 group-hover:opacity-100">
                    {calories > 0 ? calories : "-"}
                  </span>

                  {/* Bar wrapper */}
                  <div className="w-full bg-slate-100 rounded-t-xl h-28 flex items-end justify-center p-1 relative">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isSelected
                          ? isOver
                            ? "bg-rose-500 ring-2 ring-rose-300"
                            : "bg-emerald-600 ring-2 ring-emerald-300"
                          : isOver
                          ? "bg-rose-400 hover:bg-rose-500"
                          : calories > 0
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-slate-200"
                      }`}
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                  </div>

                  {/* Date label */}
                  <span
                    className={`text-[10px] font-semibold mt-1.5 transition-colors ${
                      isSelected ? "text-emerald-700 font-bold" : "text-slate-500"
                    }`}
                  >
                    {formatDisplayDate(dateStr).split(",")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logged History List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 px-1">Log Entries by Date</h3>

        {loggedDates.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-slate-100 space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No previous meal history</p>
            <p className="text-xs text-slate-400">
              Food entries logged across different days will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {loggedDates.map((dateStr) => {
              const dayLogs = historyByDate[dateStr] || [];
              const dayTotals = calculateDailyTotals(dayLogs);
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    onSelectDate(dateStr);
                    onNavigateToTab("meals");
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
                    isSelected
                      ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200"
                      : "bg-white border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {formatFullDate(dateStr)}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                          Selected
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      {dayLogs.length} {dayLogs.length === 1 ? "item" : "items"} •{" "}
                      <span className="font-semibold text-amber-700">
                        {Math.round(dayTotals.totalProtein)}g P
                      </span>{" "}
                      •{" "}
                      <span className="font-semibold text-blue-700">
                        {Math.round(dayTotals.totalCarbs)}g C
                      </span>{" "}
                      •{" "}
                      <span className="font-semibold text-rose-700">
                        {Math.round(dayTotals.totalFat)}g F
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 block">
                        {dayTotals.totalCalories}{" "}
                        <span className="text-xs font-normal text-slate-500">kcal</span>
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
