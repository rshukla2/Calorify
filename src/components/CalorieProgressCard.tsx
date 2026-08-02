import React from "react";
import { Flame, AlertCircle } from "lucide-react";

interface CalorieProgressCardProps {
  goal: number;
  consumed: number;
  id?: string;
}

export const CalorieProgressCard: React.FC<CalorieProgressCardProps> = ({
  goal,
  consumed,
  id = "calorie-progress-card",
}) => {
  const remaining = goal - consumed;
  const isOverGoal = remaining < 0;
  const absOverGoal = Math.abs(remaining);
  const percentage = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;
  const rawPercentage = goal > 0 ? Math.round((consumed / goal) * 100) : 0;

  // SVG ring parameters
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      id={id}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Calories</h3>
            <p className="text-xs text-slate-500">Daily Target: {goal.toLocaleString()} kcal</p>
          </div>
        </div>

        {isOverGoal ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
            <AlertCircle className="w-3.5 h-3.5" />
            {absOverGoal.toLocaleString()} kcal over
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            {remaining.toLocaleString()} kcal left
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Progress Ring */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-slate-100"
              strokeWidth="9"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={isOverGoal ? "text-rose-500" : "text-emerald-500"}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              {rawPercentage}%
            </span>
            <span className="text-[10px] uppercase font-medium text-slate-400">of goal</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 space-y-3">
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Consumed</span>
            <span className="text-lg font-bold text-slate-800">
              {consumed.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-500">kcal</span>
            </span>
          </div>

          <div
            className={`p-2.5 rounded-xl border ${
              isOverGoal
                ? "bg-rose-50/80 border-rose-100"
                : "bg-emerald-50/80 border-emerald-100"
            }`}
          >
            <span
              className={`text-xs block ${
                isOverGoal ? "text-rose-600 font-medium" : "text-emerald-700 font-medium"
              }`}
            >
              {isOverGoal ? "Over Goal" : "Remaining"}
            </span>
            <span
              className={`text-lg font-bold ${
                isOverGoal ? "text-rose-700" : "text-emerald-800"
              }`}
            >
              {isOverGoal ? `+${absOverGoal.toLocaleString()}` : remaining.toLocaleString()}{" "}
              <span className="text-xs font-normal opacity-80">kcal</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
