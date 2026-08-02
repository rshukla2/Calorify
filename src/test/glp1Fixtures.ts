import {
  GLP1MedicationProfile,
  MealRecord,
  MedicationAdministration,
  MedicationDosePeriod,
  SymptomEntry,
  UserProfile,
} from "../types";

const timestamps = { createdAt: "2026-07-01T13:00:00.000Z", updatedAt: "2026-07-01T13:00:00.000Z" };

export const medicationProfile = (overrides: Partial<GLP1MedicationProfile> = {}): GLP1MedicationProfile => ({
  id: "med_1",
  medicationName: "User-entered medication",
  medicationForm: "weekly_injection",
  scheduleType: "weekly",
  scheduledDays: [6],
  scheduledTime: "08:00",
  treatmentStartDate: "2026-07-04",
  userEnteredInstructions: null,
  remindersEnabled: false,
  trackInjectionSite: true,
  isActive: true,
  ...timestamps,
  ...overrides,
});

export const dosePeriod = (overrides: Partial<MedicationDosePeriod> = {}): MedicationDosePeriod => ({
  id: "dose_1",
  medicationProfileId: "med_1",
  doseValue: 2.5,
  doseUnit: "mg",
  prescribedDoseLabel: "2.5 mg",
  effectiveStartDate: "2026-07-04",
  effectiveEndDate: null,
  changeNote: null,
  ...timestamps,
  ...overrides,
});

export const administration = (overrides: Partial<MedicationAdministration> = {}): MedicationAdministration => ({
  id: "admin_1",
  medicationProfileId: "med_1",
  dosePeriodId: "dose_1",
  scheduledAt: "2026-08-01T13:00:00.000Z",
  administeredAt: "2026-08-01T13:10:00.000Z",
  recordedTimeZone: "America/Chicago",
  status: "taken_as_scheduled",
  userEnteredDoseLabel: "2.5 mg",
  injectionSite: "Abdomen",
  injectionSiteReaction: null,
  notes: null,
  ...timestamps,
  ...overrides,
});

export const mealRecord = (overrides: Partial<MealRecord> = {}): MealRecord => ({
  id: "meal_1",
  mealType: "breakfast",
  mealStartedAt: "2026-08-01T14:00:00.000Z",
  mealEndedAt: null,
  recordedTimeZone: "America/Chicago",
  mealSize: "small",
  hungerBefore: 3,
  fullnessAfter: 3,
  stoppingReason: "Comfortably satisfied",
  notes: null,
  ...timestamps,
  ...overrides,
});

export const symptomEntry = (overrides: Partial<SymptomEntry> = {}): SymptomEntry => ({
  id: "symptom_1",
  symptomType: "nausea",
  symptomLabel: "Nausea",
  startedAt: "2026-08-01T15:00:00.000Z",
  endedAt: null,
  recordedTimeZone: "America/Chicago",
  isOngoing: true,
  severity: "mild",
  intensity: null,
  episodeCount: 1,
  affectedEating: false,
  affectedDrinking: false,
  affectedSleep: false,
  affectedDailyActivity: false,
  relatedMealId: null,
  closestAdministrationId: "admin_1",
  contextTags: [],
  urgentSigns: [],
  userConcerned: false,
  notes: null,
  safetyTierShown: 1,
  ...timestamps,
  ...overrides,
});

export const userProfile: UserProfile = {
  id: "user_1", name: "Test User", age: 35, biologicalSex: "female", heightCm: 165,
  weightKg: 75, activityLevel: "moderately_active", goal: "lose_weight", bmr: 1500,
  maintenanceCalories: 2100, dailyCalorieGoal: 1700, proteinGoalGrams: 120,
  carbGoalGrams: 170, fatGoalGrams: 57, createdAt: timestamps.createdAt, updatedAt: timestamps.updatedAt,
};
