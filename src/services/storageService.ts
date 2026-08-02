import { STORAGE_KEYS } from "../constants";
import { AuthSession, FoodLogEntry, UserProfile } from "../types";
import { getTodayDateString } from "../utils/dateUtils";

/**
 * Calorify Local Storage Service
 * Centralizes all persistence and error handling for local data.
 */

function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage key "${key}":`, error);
    return false;
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error);
  }
}

export const storageService = {
  // --- Auth Session ---
  getAuthSession(): AuthSession {
    return getItem<AuthSession>(STORAGE_KEYS.AUTH, {
      isLoggedIn: false,
      username: "",
      loginAt: "",
    });
  },

  saveAuthSession(session: AuthSession): boolean {
    return setItem(STORAGE_KEYS.AUTH, session);
  },

  clearAuthSession(): void {
    removeItem(STORAGE_KEYS.AUTH);
  },

  // --- Onboarding ---
  getOnboardingComplete(): boolean {
    return getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE, false);
  },

  setOnboardingComplete(complete: boolean): boolean {
    return setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, complete);
  },

  // --- User Profile ---
  getProfile(): UserProfile | null {
    return getItem<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  },

  saveProfile(profile: UserProfile): boolean {
    return setItem(STORAGE_KEYS.PROFILE, profile);
  },

  // --- Selected Date ---
  getSelectedDate(): string {
    return getItem<string>(STORAGE_KEYS.SELECTED_DATE, getTodayDateString());
  },

  setSelectedDate(date: string): boolean {
    return setItem(STORAGE_KEYS.SELECTED_DATE, date);
  },

  // --- Food Logs ---
  getFoodLogs(): FoodLogEntry[] {
    const logs = getItem<FoodLogEntry[]>(STORAGE_KEYS.FOOD_LOGS, []);
    if (!Array.isArray(logs)) return [];
    // Ensure backwards compatibility with older entries without `source`
    return logs.map((log) => ({
      ...log,
      source: log.source || "manual",
    }));
  },

  saveFoodLogs(logs: FoodLogEntry[]): boolean {
    return setItem(STORAGE_KEYS.FOOD_LOGS, logs);
  },

  addFoodLogEntry(entry: FoodLogEntry): FoodLogEntry[] {
    const logs = this.getFoodLogs();
    const updated = [entry, ...logs];
    this.saveFoodLogs(updated);
    return updated;
  },

  addMultipleFoodLogEntries(entries: FoodLogEntry[]): FoodLogEntry[] {
    const logs = this.getFoodLogs();
    const updated = [...entries, ...logs];
    this.saveFoodLogs(updated);
    return updated;
  },

  updateFoodLogEntry(updatedEntry: FoodLogEntry): FoodLogEntry[] {
    const logs = this.getFoodLogs();
    const updated = logs.map((item) =>
      item.id === updatedEntry.id ? updatedEntry : item
    );
    this.saveFoodLogs(updated);
    return updated;
  },

  deleteFoodLogEntry(id: string): FoodLogEntry[] {
    const logs = this.getFoodLogs();
    const updated = logs.filter((item) => item.id !== id);
    this.saveFoodLogs(updated);
    return updated;
  },

  // --- Recent Food Searches ---
  getRecentSearches(): string[] {
    return getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES, []);
  },

  addRecentSearch(query: string): string[] {
    const current = this.getRecentSearches();
    const filtered = current.filter((q) => q.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, 10);
    setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
    return updated;
  },

  // --- Chat History ---
  getChatHistory(): any[] {
    return getItem<any[]>(STORAGE_KEYS.CHAT_HISTORY, []);
  },

  saveChatHistory(history: any[]): boolean {
    // Keep max 50 recent messages to prevent storage overflow
    const trimmed = history.slice(-50);
    return setItem(STORAGE_KEYS.CHAT_HISTORY, trimmed);
  },

  clearChatHistory(): void {
    removeItem(STORAGE_KEYS.CHAT_HISTORY);
  },

  // --- Reset All App Data ---
  resetAllData(): void {
    removeItem(STORAGE_KEYS.PROFILE);
    removeItem(STORAGE_KEYS.FOOD_LOGS);
    removeItem(STORAGE_KEYS.SELECTED_DATE);
    removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    removeItem(STORAGE_KEYS.AUTH);
    removeItem(STORAGE_KEYS.GLP1_PROFILE);
    removeItem(STORAGE_KEYS.GLP1_DOSES);
    removeItem(STORAGE_KEYS.GLP1_ADMINISTRATIONS);
    removeItem(STORAGE_KEYS.GLP1_SYMPTOMS);
    removeItem(STORAGE_KEYS.GLP1_MEALS);
    removeItem(STORAGE_KEYS.GLP1_PREFERENCES);
  },
};
