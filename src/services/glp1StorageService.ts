import { GLP1_DUPLICATE_WINDOW_MINUTES, STORAGE_KEYS } from "../constants";
import {
  GLP1MedicationProfile,
  GLP1Preferences,
  MealRecord,
  MedicationAdministration,
  MedicationDosePeriod,
  SymptomEntry,
} from "../types";

const read = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const stringOrNull = (value: unknown) => value === null || typeof value === "string";

const validProfile = (value: unknown): value is GLP1MedicationProfile =>
  object(value) &&
  typeof value.id === "string" &&
  typeof value.medicationName === "string" &&
  ["weekly_injection", "daily_injection", "daily_tablet", "other"].includes(String(value.medicationForm)) &&
  ["daily", "weekly", "custom"].includes(String(value.scheduleType)) &&
  Array.isArray(value.scheduledDays) && value.scheduledDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
  typeof value.scheduledTime === "string" &&
  typeof value.treatmentStartDate === "string" &&
  typeof value.isActive === "boolean";

const validDose = (value: unknown): value is MedicationDosePeriod =>
  object(value) && typeof value.id === "string" && typeof value.medicationProfileId === "string" &&
  typeof value.prescribedDoseLabel === "string" && typeof value.effectiveStartDate === "string" &&
  stringOrNull(value.effectiveEndDate);

const validAdministration = (value: unknown): value is MedicationAdministration =>
  object(value) && typeof value.id === "string" && typeof value.medicationProfileId === "string" &&
  stringOrNull(value.scheduledAt) && stringOrNull(value.administeredAt) && typeof value.recordedTimeZone === "string" &&
  ["taken_as_scheduled", "taken_early", "taken_late", "postponed", "skipped", "not_sure"].includes(String(value.status));

const validSymptom = (value: unknown): value is SymptomEntry =>
  object(value) && typeof value.id === "string" && typeof value.symptomType === "string" &&
  typeof value.symptomLabel === "string" && typeof value.startedAt === "string" &&
  ["mild", "moderate", "severe"].includes(String(value.severity)) &&
  Array.isArray(value.contextTags) && Array.isArray(value.urgentSigns);

const validMeal = (value: unknown): value is MealRecord =>
  object(value) && typeof value.id === "string" &&
  ["breakfast", "lunch", "dinner", "snacks"].includes(String(value.mealType)) &&
  stringOrNull(value.mealStartedAt) && typeof value.recordedTimeZone === "string";

const list = <T>(key: string, valid: (value: unknown) => value is T): T[] => {
  const value = read(key);
  return Array.isArray(value) ? value.filter(valid) : [];
};

const defaultPreferences: GLP1Preferences = {
  duplicateWindowMinutes: GLP1_DUPLICATE_WINDOW_MINUTES,
  descriptiveReminders: false,
};

export const glp1StorageService = {
  getProfile(): GLP1MedicationProfile | null {
    const value = read(STORAGE_KEYS.GLP1_PROFILE);
    return validProfile(value) ? value : null;
  },
  saveProfile(value: GLP1MedicationProfile) { write(STORAGE_KEYS.GLP1_PROFILE, value); },
  getDoses: () => list(STORAGE_KEYS.GLP1_DOSES, validDose),
  saveDoses(value: MedicationDosePeriod[]) { write(STORAGE_KEYS.GLP1_DOSES, value); },
  getAdministrations: () => list(STORAGE_KEYS.GLP1_ADMINISTRATIONS, validAdministration),
  saveAdministrations(value: MedicationAdministration[]) { write(STORAGE_KEYS.GLP1_ADMINISTRATIONS, value); },
  getSymptoms: () => list(STORAGE_KEYS.GLP1_SYMPTOMS, validSymptom),
  saveSymptoms(value: SymptomEntry[]) { write(STORAGE_KEYS.GLP1_SYMPTOMS, value); },
  getMeals: () => list(STORAGE_KEYS.GLP1_MEALS, validMeal),
  saveMeals(value: MealRecord[]) { write(STORAGE_KEYS.GLP1_MEALS, value); },
  getPreferences(): GLP1Preferences {
    const value = read(STORAGE_KEYS.GLP1_PREFERENCES);
    return object(value) && typeof value.duplicateWindowMinutes === "number" && Number.isFinite(value.duplicateWindowMinutes) && value.duplicateWindowMinutes > 0 &&
      typeof value.descriptiveReminders === "boolean"
      ? value as unknown as GLP1Preferences
      : defaultPreferences;
  },
  savePreferences(value: GLP1Preferences) { write(STORAGE_KEYS.GLP1_PREFERENCES, value); },
  exportData() {
    return {
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      doseHistory: this.getDoses(),
      administrations: this.getAdministrations(),
      symptoms: this.getSymptoms(),
      meals: this.getMeals(),
      preferences: this.getPreferences(),
    };
  },
  deleteAll() {
    [STORAGE_KEYS.GLP1_PROFILE, STORAGE_KEYS.GLP1_DOSES, STORAGE_KEYS.GLP1_ADMINISTRATIONS,
      STORAGE_KEYS.GLP1_SYMPTOMS, STORAGE_KEYS.GLP1_MEALS, STORAGE_KEYS.GLP1_PREFERENCES]
      .forEach((key) => localStorage.removeItem(key));
  },
};
