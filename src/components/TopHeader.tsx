import React from "react";
import { ChevronLeft, ChevronRight, Calendar, LogOut, Flame } from "lucide-react";
import { addDays, formatDisplayDate, isFutureDate, isToday } from "../utils/dateUtils";

interface TopHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  username?: string;
  onLogout?: () => void;
  id?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  selectedDate,
  onDateChange,
  username,
  onLogout,
  id = "top-header-bar",
}) => {
  const handlePrevDay = () => {
    onDateChange(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    const nextDate = addDays(selectedDate, 1);
    if (!isFutureDate(nextDate)) {
      onDateChange(nextDate);
    }
  };

  const isAtToday = isToday(selectedDate);

  return (
    <header
      id={id}
      className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-2xs"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Flame className="w-5 h-5 fill-emerald-100" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
              Calorify
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Calorie Tracker
            </span>
          </div>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-2xs">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-90"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative px-2.5 py-1 flex items-center gap-1.5 cursor-pointer group">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              {formatDisplayDate(selectedDate)}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value && !isFutureDate(e.target.value)) {
                  onDateChange(e.target.value);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={isAtToday}
            className={`p-1.5 rounded-xl transition-all ${
              isAtToday
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-600 hover:text-slate-900 hover:bg-white active:scale-90"
            }`}
            title={isAtToday ? "Cannot navigate to future" : "Next Day"}
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Logout action */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
            title={`Log out (${username || "User"})`}
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
