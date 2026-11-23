import { ActivityLevel, BiologicalSex, MealType, PrimaryGoal } from "../types";

export const STORAGE_KEYS = {
  PROFILE: "calorify_profile",
  FOOD_LOGS: "calorify_food_logs",
  SELECTED_DATE: "calorify_selected_date",
  ONBOARDING_COMPLETE: "calorify_onboarding_complete",
  AUTH: "calorify_auth_session",
  RECENT_SEARCHES: "calorify_recent_searches",
  CHAT_HISTORY: "calorify_chat_history",
  GLP1_PROFILE: "calorieTracker.glp1Profile.v1",
  GLP1_DOSES: "calorieTracker.glp1DoseHistory.v1",
  GLP1_ADMINISTRATIONS: "calorieTracker.medicationAdministrations.v1",
  GLP1_SYMPTOMS: "calorieTracker.glp1Symptoms.v1",
  GLP1_MEALS: "calorieTracker.glp1Meals.v1",
  GLP1_PREFERENCES: "calorieTracker.glp1Preferences.v1",
} as const;

export const GLP1_DUPLICATE_WINDOW_MINUTES = 120;
export const GLP1_SYMPTOMS = [
  ["nausea", "Nausea"], ["vomiting", "Vomiting"], ["diarrhea", "Diarrhea"],
  ["constipation", "Constipation"], ["abdominal_pain", "Abdominal pain"],
  ["bloating", "Bloating"], ["reflux", "Heartburn or reflux"], ["burping", "Burping"],
  ["reduced_appetite", "Reduced appetite"], ["headache", "Headache"],
  ["dizziness", "Dizziness"], ["fatigue", "Fatigue"],
  ["injection_site_irritation", "Injection-site irritation"],
  ["possible_low_blood_sugar", "Possible low-blood-sugar symptoms"], ["other", "Other"],
] as const;
export const GLP1_CONTEXT_TAGS = ["Before eating", "After a small meal", "After a large meal", "After a high-fat meal", "Empty stomach", "After alcohol", "After exercise", "During travel", "After a prescribed dose change", "Unsure", "Other"];
export const GLP1_URGENT_SIGNS = ["Severe or persistent abdominal pain", "Difficulty breathing", "Difficulty swallowing", "Swelling of the face, lips, tongue, or throat", "Inability to keep fluids down", "Signs of significant dehydration", "Fainting or severe confusion"];
export const INJECTION_SITES = ["Abdomen", "Left thigh", "Right thigh", "Left upper arm", "Right upper arm", "Other", "Prefer not to record"];

export interface ActivityOption {
  value: ActivityLevel;
  label: string;
  description: string;
  multiplier: number;
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Little or no exercise, desk job",
    multiplier: 1.2,
  },
  {
    value: "lightly_active",
    label: "Lightly Active",
    description: "Light exercise 1-3 days per week",
    multiplier: 1.375,
  },
  {
    value: "moderately_active",
    label: "Moderately Active",
    description: "Moderate exercise 3-5 days per week",
    multiplier: 1.55,
  },
  {
    value: "very_active",
    label: "Very Active",
    description: "Hard exercise 6-7 days per week",
    multiplier: 1.725,
  },
  {
    value: "extra_active",
    label: "Extra Active",
    description: "Very intense exercise or physical job",
    multiplier: 1.9,
  },
];

export interface GoalOption {
  value: PrimaryGoal;
  label: string;
  description: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    value: "lose_weight",
    label: "Lose Weight",
    description: "Create a safe caloric deficit to lose weight",
  },
  {
    value: "maintain_weight",
    label: "Maintain Weight",
    description: "Eat at your maintenance level to stay current weight",
  },
  {
    value: "gain_weight",
    label: "Gain Weight / Muscle",
    description: "Create a controlled caloric surplus to gain weight",
  },
];

export const WEEKLY_CHANGE_OPTIONS = [
  { value: 0.25, label: "0.25 kg / week (~0.55 lbs)" },
  { value: 0.5, label: "0.50 kg / week (~1.1 lbs)" },
  { value: 0.75, label: "0.75 kg / week (~1.65 lbs)" },
  { value: 1.0, label: "1.00 kg / week (~2.2 lbs)" },
];

export const MEAL_TYPES: { value: MealType; label: string; icon: string; description: string }[] = [
  { value: "breakfast", label: "Breakfast", icon: "Sunrise", description: "Start your day with energy" },
  { value: "lunch", label: "Lunch", icon: "Sun", description: "Midday nourishment" },
  { value: "dinner", label: "Dinner", icon: "Sunset", description: "Evening meal" },
  { value: "snacks", label: "Snacks", icon: "Cookie", description: "Bites & beverages between meals" },
];

export const COMMON_SERVING_UNITS = [
  "g",
  "oz",
  "ml",
  "cup",
  "tbsp",
  "tsp",
  "serving",
  "slice",
  "piece",
  "can",
  "bottle",
  "bowl",
  "scoop",
];

// Safety minimum calories
export const CALORIE_FLOORS: Record<BiologicalSex, number> = {
  female: 1200,
  male: 1500,
};

// Default macro ratio (Protein 30%, Carbs 40%, Fat 30%)
export const DEFAULT_MACRO_SPLIT = {
  proteinPercent: 30,
  carbPercent: 40,
  fatPercent: 30,
};
