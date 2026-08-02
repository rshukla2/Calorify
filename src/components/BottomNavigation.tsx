import React from "react";
import { LayoutDashboard, Utensils, History, Sparkles, User } from "lucide-react";
import { TabType } from "../types";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  id?: string;
}

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "meals", label: "Meals", icon: Utensils },
  { id: "coach", label: "AI Coach", icon: Sparkles },
  { id: "history", label: "History", icon: History },
  { id: "profile", label: "Profile", icon: User },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  id = "bottom-nav-bar",
}) => {
  return (
    <nav
      id={id}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 shadow-lg"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-emerald-700 font-bold bg-emerald-50"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 transition-transform ${
                  isActive ? "scale-110 text-emerald-600" : ""
                }`}
              />
              <span className="text-[11px] leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
