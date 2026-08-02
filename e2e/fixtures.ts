import { Page } from "@playwright/test";

export const ordinaryStorage = {
  calorify_auth_session: { isLoggedIn: true, username: "Test User", loginAt: "2026-08-01T12:00:00Z" },
  calorify_onboarding_complete: true,
  calorify_profile: {
    id:"user_1",name:"Test User",age:35,biologicalSex:"female",heightCm:165,weightKg:75,
    activityLevel:"moderately_active",goal:"lose_weight",bmr:1500,maintenanceCalories:2100,
    dailyCalorieGoal:1700,proteinGoalGrams:120,carbGoalGrams:170,fatGoalGrams:57,
    createdAt:"2026-07-01T12:00:00Z",updatedAt:"2026-07-01T12:00:00Z",
  },
  calorify_food_logs: [],
};

export const glp1Storage = {
  "calorieTracker.glp1Profile.v1": {
    id:"med_1",medicationName:"User-entered medication",medicationForm:"weekly_injection",
    scheduleType:"weekly",scheduledDays:[6],scheduledTime:"08:00",treatmentStartDate:"2026-07-04",
    userEnteredInstructions:null,remindersEnabled:false,trackInjectionSite:true,isActive:true,
    createdAt:"2026-07-04T13:00:00Z",updatedAt:"2026-07-04T13:00:00Z",
  },
  "calorieTracker.glp1DoseHistory.v1": [{
    id:"dose_1",medicationProfileId:"med_1",doseValue:2.5,doseUnit:"mg",prescribedDoseLabel:"2.5 mg",
    effectiveStartDate:"2026-07-04",effectiveEndDate:null,changeNote:null,
    createdAt:"2026-07-04T13:00:00Z",updatedAt:"2026-07-04T13:00:00Z",
  }],
};

export async function seedApp(page: Page, withGLP1 = false) {
  await page.goto("/");
  await page.evaluate(({ ordinary, glp1 }) => {
    localStorage.clear();
    Object.entries(ordinary).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
    Object.entries(glp1).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
  }, { ordinary: ordinaryStorage, glp1: withGLP1 ? glp1Storage : {} });
  await page.reload();
}

export async function openGLP1(page: Page) {
  await page.getByRole("button", { name: /Open Timeline/ }).click();
}
