import { ACTIVITY_OPTIONS, CALORIE_FLOORS, DEFAULT_MACRO_SPLIT } from "../constants";
import { ActivityLevel, BiologicalSex, FoodLogEntry, PrimaryGoal } from "../types";

/**
 * Calculates BMR using the Mifflin-St Jeor equation.
 *
 * For males: BMR = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
 * For females: BMR = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  biologicalSex: BiologicalSex
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;

  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (biologicalSex === "male") {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  return Math.round(Math.max(0, bmr));
}

/**
 * Calculates maintenance calories based on BMR and physical activity level multiplier.
 */
export function calculateMaintenanceCalories(
  bmr: number,
  activityLevel: ActivityLevel
): number {
  const activity = ACTIVITY_OPTIONS.find((a) => a.value === activityLevel);
  const multiplier = activity ? activity.multiplier : 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates recommended daily calorie goal based on primary goal and weekly target.
 *
 * 1 kg of body weight ≈ 7,700 calories
 * Daily adjustment = (weeklyGoalKg * 7700) / 7 = weeklyGoalKg * 1100
 */
export function calculateRecommendedCalorieGoal(
  maintenanceCalories: number,
  goal: PrimaryGoal,
  biologicalSex: BiologicalSex,
  weeklyGoalKg: number = 0.5
): number {
  if (maintenanceCalories <= 0) return 2000;

  if (goal === "maintain_weight") {
    return Math.round(maintenanceCalories);
  }

  // Daily adjustment derived from weekly weight change goal
  const dailyAdjustment = Math.round(weeklyGoalKg * 1100);

  let target = maintenanceCalories;
  if (goal === "lose_weight") {
    target = maintenanceCalories - dailyAdjustment;
  } else if (goal === "gain_weight") {
    target = maintenanceCalories + dailyAdjustment;
  }

  // Enforce safety limits
  const minCalorieFloor = CALORIE_FLOORS[biologicalSex] || 1200;
  target = Math.max(minCalorieFloor, target);

  return Math.round(target);
}

/**
 * Calculates default macronutrient goals (grams) based on calorie goal.
 * Default split: Protein 30%, Carbs 40%, Fat 30%
 * Protein & Carbs: 4 kcal/gram
 * Fat: 9 kcal/gram
 */
export function calculateDefaultMacroGoals(dailyCalorieGoal: number): {
  proteinGoalGrams: number;
  carbGoalGrams: number;
  fatGoalGrams: number;
} {
  const calories = Math.max(0, dailyCalorieGoal);

  const proteinCalories = calories * (DEFAULT_MACRO_SPLIT.proteinPercent / 100);
  const carbCalories = calories * (DEFAULT_MACRO_SPLIT.carbPercent / 100);
  const fatCalories = calories * (DEFAULT_MACRO_SPLIT.fatPercent / 100);

  return {
    proteinGoalGrams: Math.round(proteinCalories / 4),
    carbGoalGrams: Math.round(carbCalories / 4),
    fatGoalGrams: Math.round(fatCalories / 9),
  };
}

/**
 * Computes calories from macros (P: 4, C: 4, F: 9)
 */
export function calculateMacroCalories(
  proteinGrams: number,
  carbGrams: number,
  fatGrams: number
): number {
  return proteinGrams * 4 + carbGrams * 4 + fatGrams * 9;
}

/**
 * Computes daily totals from food log entries.
 */
export function calculateDailyTotals(entries: FoodLogEntry[]): {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
} {
  return entries.reduce(
    (acc, entry) => {
      acc.totalCalories += entry.calories || 0;
      acc.totalProtein += entry.proteinGrams || 0;
      acc.totalCarbs += entry.carbGrams || 0;
      acc.totalFat += entry.fatGrams || 0;
      return acc;
    },
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );
}

/**
 * Scale food item nutrition proportionally when serving quantity changes.
 */
export function scaleNutrition(
  baseCalories: number,
  baseProtein: number,
  baseCarbs: number,
  baseFat: number,
  baseAmount: number,
  newAmount: number
): {
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
} {
  if (baseAmount <= 0 || newAmount < 0) {
    return { calories: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0 };
  }

  const ratio = newAmount / baseAmount;

  return {
    calories: Math.round(baseCalories * ratio),
    proteinGrams: Math.round((baseProtein * ratio) * 10) / 10,
    carbGrams: Math.round((baseCarbs * ratio) * 10) / 10,
    fatGrams: Math.round((baseFat * ratio) * 10) / 10,
  };
}

/**
 * Unit Conversion Helpers for UI (Metric <-> Imperial)
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches: inches === 12 ? 0 : inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}
