import { useCallback, useEffect, useMemo, useState } from "react";
import { storageService } from "../services/storageService";
import { AuthSession, FoodLogEntry, MealType, TabType, UserProfile } from "../types";
import { calculateDailyTotals } from "../utils/calculations";
import { getTodayDateString } from "../utils/dateUtils";

export function useCalorifyData() {
  const [auth, setAuth] = useState<AuthSession>(() => storageService.getAuthSession());
  const [profile, setProfile] = useState<UserProfile | null>(() => storageService.getProfile());
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(() =>
    storageService.getOnboardingComplete()
  );
  const [selectedDate, setSelectedDateState] = useState<string>(() =>
    storageService.getSelectedDate()
  );
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>(() =>
    storageService.getFoodLogs()
  );
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Modal states for Food Entry Form
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [editingFoodEntry, setEditingFoodEntry] = useState<FoodLogEntry | null>(null);
  const [preselectedMealType, setPreselectedMealType] = useState<MealType>("breakfast");

  // Sync selected date with storage
  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
    storageService.setSelectedDate(date);
  }, []);

  // Login handler
  const login = useCallback((username: string) => {
    const session: AuthSession = {
      isLoggedIn: true,
      username: username.trim() || "User",
      loginAt: new Date().toISOString(),
    };
    storageService.saveAuthSession(session);
    setAuth(session);
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    storageService.clearAuthSession();
    setAuth({ isLoggedIn: false, username: "", loginAt: "" });
  }, []);

  // Save profile handler
  const saveProfile = useCallback((profileData: UserProfile) => {
    storageService.saveProfile(profileData);
    storageService.setOnboardingComplete(true);
    setProfile(profileData);
    setIsOnboardingComplete(true);
  }, []);

  // Food Entry CRUD handlers
  const saveFoodEntry = useCallback(
    (entryData: Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
      const now = new Date().toISOString();

      if (entryData.id) {
        // Edit existing
        const updatedEntry: FoodLogEntry = {
          ...(entryData as FoodLogEntry),
          updatedAt: now,
        };
        const updatedLogs = storageService.updateFoodLogEntry(updatedEntry);
        setFoodLogs(updatedLogs);
      } else {
        // Create new
        const newEntry: FoodLogEntry = {
          ...entryData,
          id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          createdAt: now,
          updatedAt: now,
        };
        const updatedLogs = storageService.addFoodLogEntry(newEntry);
        setFoodLogs(updatedLogs);
      }

      setIsFoodModalOpen(false);
      setEditingFoodEntry(null);
    },
    []
  );

  const saveMultipleFoodEntries = useCallback(
    (entriesData: Array<Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString();
      const newEntries: FoodLogEntry[] = entriesData.map((data, index) => ({
        ...data,
        id: `food_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      }));

      const updatedLogs = storageService.addMultipleFoodLogEntries(newEntries);
      setFoodLogs(updatedLogs);
      setIsFoodModalOpen(false);
      setEditingFoodEntry(null);
    },
    []
  );

  const deleteFoodEntry = useCallback((id: string) => {
    const updated = storageService.deleteFoodLogEntry(id);
    setFoodLogs(updated);
  }, []);

  // Modal open helpers
  const openAddFoodModal = useCallback((mealType: MealType = "breakfast") => {
    setEditingFoodEntry(null);
    setPreselectedMealType(mealType);
    setIsFoodModalOpen(true);
  }, []);

  const openEditFoodModal = useCallback((entry: FoodLogEntry) => {
    setEditingFoodEntry(entry);
    setPreselectedMealType(entry.mealType);
    setIsFoodModalOpen(true);
  }, []);

  const closeFoodModal = useCallback(() => {
    setIsFoodModalOpen(false);
    setEditingFoodEntry(null);
  }, []);

  // Reset all data
  const resetAllData = useCallback(() => {
    storageService.resetAllData();
    setAuth({ isLoggedIn: false, username: "", loginAt: "" });
    setProfile(null);
    setIsOnboardingComplete(false);
    setFoodLogs([]);
    setSelectedDateState(getTodayDateString());
    setActiveTab("dashboard");
    setIsFoodModalOpen(false);
    setEditingFoodEntry(null);
  }, []);

  // Computed data for the currently selected date
  const selectedDateEntries = useMemo(() => {
    return foodLogs.filter((entry) => entry.date === selectedDate);
  }, [foodLogs, selectedDate]);

  const selectedDateTotals = useMemo(() => {
    return calculateDailyTotals(selectedDateEntries);
  }, [selectedDateEntries]);

  const entriesByMeal = useMemo(() => {
    const grouped: Record<MealType, FoodLogEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    selectedDateEntries.forEach((entry) => {
      if (grouped[entry.mealType]) {
        grouped[entry.mealType].push(entry);
      }
    });
    return grouped;
  }, [selectedDateEntries]);

  // Group food logs by date for history view
  const historyByDate = useMemo(() => {
    const datesMap: Record<string, FoodLogEntry[]> = {};
    foodLogs.forEach((entry) => {
      if (!datesMap[entry.date]) {
        datesMap[entry.date] = [];
      }
      datesMap[entry.date].push(entry);
    });
    return datesMap;
  }, [foodLogs]);

  return {
    auth,
    profile,
    isOnboardingComplete,
    selectedDate,
    setSelectedDate,
    foodLogs,
    activeTab,
    setActiveTab,
    login,
    logout,
    saveProfile,
    saveFoodEntry,
    saveMultipleFoodEntries,
    deleteFoodEntry,
    resetAllData,

    // Modal state
    isFoodModalOpen,
    editingFoodEntry,
    preselectedMealType,
    openAddFoodModal,
    openEditFoodModal,
    closeFoodModal,

    // Computed
    selectedDateEntries,
    selectedDateTotals,
    entriesByMeal,
    historyByDate,
  };
}
