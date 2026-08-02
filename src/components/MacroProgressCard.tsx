import React from "react";

interface MacroItem {
  label: string;
  consumed: number;
  goal: number;
  colorClass: string;
  bgLightClass: string;
  barColorClass: string;
}

interface MacroProgressCardProps {
  proteinGoal: number;
  proteinConsumed: number;
  carbGoal: number;
  carbConsumed: number;
  fatGoal: number;
  fatConsumed: number;
  id?: string;
}

export const MacroProgressCard: React.FC<MacroProgressCardProps> = ({
  proteinGoal,
  proteinConsumed,
  carbGoal,
  carbConsumed,
  fatGoal,
  fatConsumed,
  id = "macro-progress-card",
}) => {
  const macros: MacroItem[] = [
    {
      label: "Protein",
      consumed: Math.round(proteinConsumed),
      goal: Math.round(proteinGoal),
      colorClass: "text-amber-700",
      bgLightClass: "bg-amber-50 border-amber-100",
      barColorClass: "bg-amber-500",
    },
    {
      label: "Carbs",
      consumed: Math.round(carbConsumed),
      goal: Math.round(carbGoal),
      colorClass: "text-blue-700",
      bgLightClass: "bg-blue-50 border-blue-100",
      barColorClass: "bg-blue-500",
    },
    {
      label: "Fat",
      consumed: Math.round(fatConsumed),
      goal: Math.round(fatGoal),
      colorClass: "text-rose-700",
      bgLightClass: "bg-rose-50 border-rose-100",
      barColorClass: "bg-rose-500",
    },
  ];

  return (
    <div id={id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Macronutrients</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {macros.map((macro) => {
          const remaining = macro.goal - macro.consumed;
          const isOver = remaining < 0;
          const pct = macro.goal > 0 ? Math.min(100, Math.round((macro.consumed / macro.goal) * 100)) : 0;

          return (
            <div
              key={macro.label}
              className={`p-3.5 rounded-xl border ${macro.bgLightClass} transition-all`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold ${macro.colorClass}`}>
                  {macro.label}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {pct}%
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <span className="text-base font-bold text-slate-900">
                  {macro.consumed}{" "}
                  <span className="text-xs font-normal text-slate-500">/ {macro.goal} g</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden border border-slate-200/50 mb-2">
                <div
                  className={`h-full ${macro.barColorClass} transition-all duration-300 rounded-full`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="text-[11px] font-medium text-slate-500">
                {isOver ? (
                  <span className="text-rose-600 font-semibold">
                    +{Math.abs(remaining)} g over
                  </span>
                ) : (
                  <span>{remaining} g remaining</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
