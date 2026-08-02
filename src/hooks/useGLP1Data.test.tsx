import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { glp1StorageService } from "../services/glp1StorageService";
import { administration, dosePeriod, mealRecord, medicationProfile, symptomEntry } from "../test/glp1Fixtures";
import { useGLP1Data } from "./useGLP1Data";

const setupInput = () => {
  const { id: _id, createdAt: _created, updatedAt: _updated, ...profile } = medicationProfile();
  const { id: _doseId, medicationProfileId: _profileId, effectiveEndDate: _end, createdAt: _dc, updatedAt: _du, ...dose } = dosePeriod();
  return { profile, dose };
};

const administrationInput = (overrides = {}) => {
  const { id: _id, createdAt: _created, updatedAt: _updated, ...input } = administration(overrides);
  return input;
};

const symptomInput = (overrides = {}) => {
  const { id: _id, createdAt: _created, updatedAt: _updated, safetyTierShown: _tier,
    closestAdministrationId: _closest, ...input } = symptomEntry(overrides);
  return input;
};

describe("useGLP1Data", () => {
  it("hydrates all validated state and derives current status", () => {
    glp1StorageService.saveProfile(medicationProfile());
    glp1StorageService.saveDoses([dosePeriod()]);
    glp1StorageService.saveAdministrations([administration()]);
    glp1StorageService.saveSymptoms([symptomEntry()]);
    glp1StorageService.saveMeals([mealRecord()]);
    const { result } = renderHook(() => useGLP1Data());
    expect(result.current.profile?.id).toBe("med_1");
    expect(result.current.currentDose?.id).toBe("dose_1");
    expect(result.current.derived.last?.id).toBe("admin_1");
    expect(result.current.derived.week).toBeGreaterThan(0);
    expect(result.current.meals).toHaveLength(1);
  });

  it("creates setup once without duplicating an unchanged dose", () => {
    const { result } = renderHook(() => useGLP1Data());
    const input = setupInput();
    act(() => result.current.saveSetup(input.profile, input.dose));
    expect(result.current.profile?.medicationName).toBe("User-entered medication");
    expect(result.current.doses).toHaveLength(1);
    act(() => result.current.saveSetup(input.profile, input.dose));
    expect(result.current.doses).toHaveLength(1);
  });

  it("closes an active dose period and preserves history when the prescription changes", () => {
    const { result } = renderHook(() => useGLP1Data());
    const input = setupInput();
    act(() => result.current.saveSetup(input.profile, input.dose));
    act(() => result.current.saveSetup(input.profile, {
      ...input.dose, prescribedDoseLabel: "5 mg", doseValue: 5,
      effectiveStartDate: "2026-08-01", changeNote: "Prescriber change",
    }));
    expect(result.current.doses).toHaveLength(2);
    expect(result.current.doses[0].effectiveEndDate).toBe("2026-08-01");
    expect(result.current.currentDose?.prescribedDoseLabel).toBe("5 mg");
  });

  it("supports administration CRUD, duplicate review, and force-save", () => {
    glp1StorageService.saveProfile(medicationProfile());
    const { result } = renderHook(() => useGLP1Data());
    act(() => expect(result.current.saveAdministration(administrationInput())).toBeNull());
    expect(result.current.administrations).toHaveLength(1);
    const duplicate = administrationInput({ administeredAt: "2026-08-01T14:00:00.000Z" });
    act(() => expect(result.current.saveAdministration(duplicate)).toMatchObject({ id: expect.any(String) }));
    expect(result.current.administrations).toHaveLength(1);
    act(() => expect(result.current.saveAdministration(duplicate, true)).toBeNull());
    expect(result.current.administrations).toHaveLength(2);
    const existing = result.current.administrations[0];
    act(() => result.current.saveAdministration({ ...administrationInput(), id: existing.id, notes: "Edited" }, true));
    expect(result.current.administrations.find((entry) => entry.id === existing.id)?.notes).toBe("Edited");
    act(() => result.current.deleteAdministration(existing.id));
    expect(result.current.administrations).toHaveLength(1);
  });

  it("associates symptoms, calculates tiers, edits, and deletes", () => {
    glp1StorageService.saveAdministrations([administration()]);
    const { result } = renderHook(() => useGLP1Data());
    let savedId = "";
    act(() => { savedId = result.current.saveSymptom(symptomInput({ affectedDrinking: true })).id; });
    expect(result.current.symptoms[0]).toMatchObject({ closestAdministrationId: "admin_1", safetyTierShown: 2 });
    act(() => result.current.saveSymptom({ ...symptomInput({ severity: "severe", urgentSigns: ["Difficulty breathing"] }), id: savedId }));
    expect(result.current.symptoms[0].safetyTierShown).toBe(3);
    act(() => result.current.deleteSymptom(savedId));
    expect(result.current.symptoms).toEqual([]);
  });

  it("creates shared meals and updates preferences", () => {
    const { result } = renderHook(() => useGLP1Data());
    const { id: _id, createdAt: _created, updatedAt: _updated, ...meal } = mealRecord();
    let mealId = "";
    act(() => { mealId = result.current.createMeal(meal); });
    expect(mealId).toMatch(/^meal_/);
    expect(result.current.meals[0].mealSize).toBe("small");
    act(() => result.current.setPreferences({ duplicateWindowMinutes: 60, descriptiveReminders: true }));
    expect(result.current.preferences.duplicateWindowMinutes).toBe(60);
    expect(glp1StorageService.getPreferences().descriptiveReminders).toBe(true);
  });

  it("deactivates and reactivates without deleting records", () => {
    glp1StorageService.saveProfile(medicationProfile());
    glp1StorageService.saveSymptoms([symptomEntry()]);
    const { result } = renderHook(() => useGLP1Data());
    act(() => result.current.deactivate());
    expect(result.current.profile?.isActive).toBe(false);
    expect(result.current.symptoms).toHaveLength(1);
    act(() => result.current.reactivate());
    expect(result.current.profile?.isActive).toBe(true);
  });

  it("exports a JSON download and permanently clears only GLP-1 state", () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    glp1StorageService.saveProfile(medicationProfile());
    glp1StorageService.saveDoses([dosePeriod()]);
    const { result } = renderHook(() => useGLP1Data());
    act(() => result.current.exportData());
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    act(() => result.current.deleteAll());
    expect(result.current.profile).toBeNull();
    expect(result.current.doses).toEqual([]);
    expect(glp1StorageService.getProfile()).toBeNull();
  });

  it("handles activation methods safely without a profile", () => {
    const { result } = renderHook(() => useGLP1Data());
    act(() => { result.current.deactivate(); result.current.reactivate(); });
    expect(result.current.profile).toBeNull();
  });
});
