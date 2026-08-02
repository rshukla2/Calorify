import { describe, expect, it } from "vitest";
import { GLP1_DUPLICATE_WINDOW_MINUTES, STORAGE_KEYS } from "../constants";
import { administration, dosePeriod, mealRecord, medicationProfile, symptomEntry } from "../test/glp1Fixtures";
import { glp1StorageService } from "./glp1StorageService";

describe("GLP-1 storage validation", () => {
  it("round-trips every versioned record collection", () => {
    glp1StorageService.saveProfile(medicationProfile());
    glp1StorageService.saveDoses([dosePeriod()]);
    glp1StorageService.saveAdministrations([administration()]);
    glp1StorageService.saveSymptoms([symptomEntry()]);
    glp1StorageService.saveMeals([mealRecord()]);
    glp1StorageService.savePreferences({ duplicateWindowMinutes: 90, descriptiveReminders: true });

    expect(glp1StorageService.getProfile()?.id).toBe("med_1");
    expect(glp1StorageService.getDoses()).toEqual([dosePeriod()]);
    expect(glp1StorageService.getAdministrations()).toEqual([administration()]);
    expect(glp1StorageService.getSymptoms()).toEqual([symptomEntry()]);
    expect(glp1StorageService.getMeals()).toEqual([mealRecord()]);
    expect(glp1StorageService.getPreferences()).toEqual({ duplicateWindowMinutes: 90, descriptiveReminders: true });
  });

  it.each([
    [STORAGE_KEYS.GLP1_DOSES, () => glp1StorageService.getDoses()],
    [STORAGE_KEYS.GLP1_ADMINISTRATIONS, () => glp1StorageService.getAdministrations()],
    [STORAGE_KEYS.GLP1_SYMPTOMS, () => glp1StorageService.getSymptoms()],
    [STORAGE_KEYS.GLP1_MEALS, () => glp1StorageService.getMeals()],
  ])("recovers from malformed JSON in %s", (key, getRecords) => {
    localStorage.setItem(key, "{");
    expect(getRecords()).toEqual([]);
  });

  it("rejects malformed profiles and preferences", () => {
    localStorage.setItem(STORAGE_KEYS.GLP1_PROFILE, JSON.stringify({ id: "incomplete" }));
    localStorage.setItem(STORAGE_KEYS.GLP1_PREFERENCES, JSON.stringify({ duplicateWindowMinutes: -1 }));
    expect(glp1StorageService.getProfile()).toBeNull();
    expect(glp1StorageService.getPreferences()).toEqual({
      duplicateWindowMinutes: GLP1_DUPLICATE_WINDOW_MINUTES,
      descriptiveReminders: false,
    });
  });

  it("retains valid collection members while skipping malformed records", () => {
    localStorage.setItem(STORAGE_KEYS.GLP1_SYMPTOMS, JSON.stringify([symptomEntry(), { id: "bad" }]));
    localStorage.setItem(STORAGE_KEYS.GLP1_ADMINISTRATIONS, JSON.stringify([administration(), { id: "bad" }]));
    localStorage.setItem(STORAGE_KEYS.GLP1_DOSES, JSON.stringify([dosePeriod(), { id: "bad" }]));
    localStorage.setItem(STORAGE_KEYS.GLP1_MEALS, JSON.stringify([mealRecord(), { id: "bad" }]));
    expect(glp1StorageService.getSymptoms()).toHaveLength(1);
    expect(glp1StorageService.getAdministrations()).toHaveLength(1);
    expect(glp1StorageService.getDoses()).toHaveLength(1);
    expect(glp1StorageService.getMeals()).toHaveLength(1);
  });
});

describe("export and scoped deletion", () => {
  it("exports validated records with a deterministic timestamp", () => {
    glp1StorageService.saveProfile(medicationProfile());
    glp1StorageService.saveDoses([dosePeriod()]);
    const exported = glp1StorageService.exportData();
    expect(exported.exportedAt).toBe("2026-08-01T15:00:00.000Z");
    expect(exported.profile?.medicationName).toBe("User-entered medication");
    expect(exported.doseHistory).toHaveLength(1);
    expect(exported).toHaveProperty("administrations");
    expect(exported).toHaveProperty("symptoms");
    expect(exported).toHaveProperty("meals");
  });

  it("deletes every GLP-1 key without touching ordinary Calorify data", () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.setItem(key, "saved"));
    glp1StorageService.deleteAll();
    expect(localStorage.getItem(STORAGE_KEYS.GLP1_PROFILE)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.GLP1_DOSES)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.GLP1_ADMINISTRATIONS)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.GLP1_SYMPTOMS)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.GLP1_MEALS)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.PROFILE)).toBe("saved");
    expect(localStorage.getItem(STORAGE_KEYS.FOOD_LOGS)).toBe("saved");
  });
});
