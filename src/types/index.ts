/**
 * Calorify - Core Data Types & Interfaces
 */

export type BiologicalSex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export type PrimaryGoal = "lose_weight" | "maintain_weight" | "gain_weight";

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  biologicalSex: BiologicalSex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: PrimaryGoal;
  weeklyGoalKg?: number; // e.g., 0.25, 0.5, 0.75, 1.0 kg/week
  bmr: number;
  maintenanceCalories: number;
  dailyCalorieGoal: number;
  proteinGoalGrams: number;
  carbGoalGrams: number;
  fatGoalGrams: number;
  createdAt: string;
  updatedAt: string;
}

export interface FoodLogEntry {
  id: string;
  mealId?: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodName: string;
  servingDescription: string;
  servingAmount: number;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  source: "manual" | "ai_text" | "ai_image";
  aiMetadata?: {
    confidence?: number;
    assumptions?: string[];
    originalQuery?: string;
    estimatedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type GLP1MedicationForm = "weekly_injection" | "daily_injection" | "daily_tablet" | "other";
export type GLP1ScheduleType = "daily" | "weekly" | "custom";
export type AdministrationStatus = "taken_as_scheduled" | "taken_early" | "taken_late" | "postponed" | "skipped" | "not_sure";
export type SymptomSeverity = "mild" | "moderate" | "severe";

export interface GLP1MedicationProfile {
  id: string;
  medicationName: string;
  medicationForm: GLP1MedicationForm;
  scheduleType: GLP1ScheduleType;
  scheduledDays: number[];
  scheduledTime: string;
  treatmentStartDate: string;
  userEnteredInstructions: string | null;
  remindersEnabled: boolean;
  trackInjectionSite: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationDosePeriod {
  id: string;
  medicationProfileId: string;
  doseValue: number | null;
  doseUnit: string | null;
  prescribedDoseLabel: string;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  changeNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationAdministration {
  id: string;
  medicationProfileId: string;
  dosePeriodId: string | null;
  scheduledAt: string | null;
  administeredAt: string | null;
  recordedTimeZone: string;
  status: AdministrationStatus;
  userEnteredDoseLabel: string | null;
  injectionSite: string | null;
  injectionSiteReaction: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealRecord {
  id: string;
  mealType: MealType;
  mealStartedAt: string | null;
  mealEndedAt: string | null;
  recordedTimeZone: string;
  mealSize: "small" | "medium" | "large" | "not_sure" | null;
  hungerBefore: number | null;
  fullnessAfter: number | null;
  stoppingReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SymptomEntry {
  id: string;
  symptomType: string;
  symptomLabel: string;
  startedAt: string;
  endedAt: string | null;
  recordedTimeZone: string;
  isOngoing: boolean;
  severity: SymptomSeverity;
  intensity: number | null;
  episodeCount: number | null;
  affectedEating: boolean | null;
  affectedDrinking: boolean | null;
  affectedSleep: boolean | null;
  affectedDailyActivity: boolean | null;
  relatedMealId: string | null;
  closestAdministrationId: string | null;
  contextTags: string[];
  urgentSigns: string[];
  userConcerned: boolean;
  notes: string | null;
  safetyTierShown: 1 | 2 | 3;
  createdAt: string;
  updatedAt: string;
}

export interface GLP1Preferences {
  duplicateWindowMinutes: number;
  descriptiveReminders: boolean;
}

export interface AuthSession {
  isLoggedIn: boolean;
  username: string;
  loginAt: string;
}

export interface DailyTotals {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export type TabType = "dashboard" | "meals" | "history" | "coach" | "profile";

export type AIRequestStatus =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "rate_limited";

export interface AIFoodEstimateAlternative {
  label: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export interface AIFoodEstimate {
  foodName: string;
  description: string;
  servingDescription: string;
  baseServingAmount: number;
  baseServingUnit: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  confidence: number;
  assumptions: string[];
  alternatives?: AIFoodEstimateAlternative[];
}

export interface AIPhotoDetectedItem {
  id: string;
  foodName: string;
  servingDescription: string;
  baseServingAmount: number;
  baseServingUnit: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  confidence: number;
  assumptions: string[];
}

export interface AIPhotoNutritionEstimate {
  mealName: string;
  detectedItems: AIPhotoDetectedItem[];
  totals: {
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
  };
  overallConfidence: number;
  notes: string[];
}

export interface NutritionChatContext {
  profile: {
    name?: string;
    age: number;
    biologicalSex: BiologicalSex;
    heightCm: number;
    weightKg: number;
    activityLevel: string;
    goal: string;
    bmr: number;
    maintenanceCalories: number;
    dailyCalorieGoal: number;
    proteinGoalGrams: number;
    carbGoalGrams: number;
    fatGoalGrams: number;
  };
  selectedDate: string;
  dailyTotals: {
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
  };
  remaining: {
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
  };
  meals: Array<{
    mealType: string;
    foodName: string;
    servingDescription: string;
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
  }>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedPrompts?: string[];
  safetyNotice?: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  suggestedPrompts?: string[];
  safetyNotice?: string;
}
