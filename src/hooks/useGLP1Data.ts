import { useCallback, useMemo, useState } from "react";
import { glp1StorageService } from "../services/glp1StorageService";
import { GLP1MedicationProfile, GLP1Preferences, MealRecord, MedicationAdministration, MedicationDosePeriod, SymptomEntry } from "../types";
import { closestAdministration, findDuplicateAdministration, nextScheduled, symptomSafetyTier, treatmentWeek } from "../utils/glp1";

const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function useGLP1Data() {
  const [profile, setProfile] = useState<GLP1MedicationProfile | null>(() => glp1StorageService.getProfile());
  const [doses, setDoses] = useState(() => glp1StorageService.getDoses());
  const [administrations, setAdministrations] = useState(() => glp1StorageService.getAdministrations());
  const [symptoms, setSymptoms] = useState(() => glp1StorageService.getSymptoms());
  const [meals, setMeals] = useState(() => glp1StorageService.getMeals());
  const [preferences, setPreferences] = useState<GLP1Preferences>(() => glp1StorageService.getPreferences());

  const saveSetup = useCallback((input: Omit<GLP1MedicationProfile, "id" | "createdAt" | "updatedAt">, dose: Pick<MedicationDosePeriod, "doseValue" | "doseUnit" | "prescribedDoseLabel" | "effectiveStartDate" | "changeNote">) => {
    const now = new Date().toISOString(); const existing = glp1StorageService.getProfile();
    const p: GLP1MedicationProfile = { ...input, id: existing?.id || id("med"), createdAt: existing?.createdAt || now, updatedAt: now };
    glp1StorageService.saveProfile(p); setProfile(p);
    const history = glp1StorageService.getDoses(); const active = history.find(d => !d.effectiveEndDate);
    if (!active || active.prescribedDoseLabel !== dose.prescribedDoseLabel || active.effectiveStartDate !== dose.effectiveStartDate) {
      const closed = history.map(d => !d.effectiveEndDate ? { ...d, effectiveEndDate: dose.effectiveStartDate, updatedAt: now } : d);
      const next: MedicationDosePeriod = { ...dose, id: id("dose"), medicationProfileId: p.id, effectiveEndDate: null, createdAt: now, updatedAt: now };
      const all = [...closed, next]; glp1StorageService.saveDoses(all); setDoses(all);
    }
  }, []);

  const saveAdministration = useCallback((input: Omit<MedicationAdministration, "id" | "createdAt" | "updatedAt"> & { id?: string }, force = false) => {
    const current = glp1StorageService.getAdministrations(); const now = new Date().toISOString();
    const candidate: MedicationAdministration = { ...input, id: input.id || id("admin"), createdAt: current.find(x => x.id === input.id)?.createdAt || now, updatedAt: now };
    const duplicate = findDuplicateAdministration(candidate, current, preferences.duplicateWindowMinutes);
    if (duplicate && !force) return duplicate;
    const all = input.id ? current.map(x => x.id === input.id ? candidate : x) : [candidate, ...current]; glp1StorageService.saveAdministrations(all); setAdministrations(all); return null;
  }, [preferences.duplicateWindowMinutes]);
  const deleteAdministration = useCallback((entryId: string) => { const all = glp1StorageService.getAdministrations().filter(x => x.id !== entryId); glp1StorageService.saveAdministrations(all); setAdministrations(all); }, []);

  const saveSymptom = useCallback((input: Omit<SymptomEntry, "id" | "createdAt" | "updatedAt" | "safetyTierShown" | "closestAdministrationId"> & { id?: string }) => {
    const current = glp1StorageService.getSymptoms(); const now = new Date().toISOString(); const closest = closestAdministration(input.startedAt, glp1StorageService.getAdministrations());
    const entry: SymptomEntry = { ...input, id: input.id || id("symptom"), closestAdministrationId: closest?.id || null, safetyTierShown: symptomSafetyTier(input), createdAt: current.find(x => x.id === input.id)?.createdAt || now, updatedAt: now };
    const all = input.id ? current.map(x => x.id === input.id ? entry : x) : [entry, ...current]; glp1StorageService.saveSymptoms(all); setSymptoms(all); return entry;
  }, []);
  const deleteSymptom = useCallback((entryId: string) => { const all = glp1StorageService.getSymptoms().filter(x => x.id !== entryId); glp1StorageService.saveSymptoms(all); setSymptoms(all); }, []);

  const createMeal = useCallback((input: Omit<MealRecord, "id" | "createdAt" | "updatedAt">) => { const now = new Date().toISOString(); const entry = { ...input, id: id("meal"), createdAt: now, updatedAt: now }; const all = [entry, ...glp1StorageService.getMeals()]; glp1StorageService.saveMeals(all); setMeals(all); return entry.id; }, []);
  const deactivate = useCallback(() => { if (!profile) return; const p = { ...profile, isActive: false, updatedAt: new Date().toISOString() }; glp1StorageService.saveProfile(p); setProfile(p); }, [profile]);
  const reactivate = useCallback(() => { if (!profile) return; const p = { ...profile, isActive: true, updatedAt: new Date().toISOString() }; glp1StorageService.saveProfile(p); setProfile(p); }, [profile]);
  const deleteAll = useCallback(() => { glp1StorageService.deleteAll(); setProfile(null); setDoses([]); setAdministrations([]); setSymptoms([]); setMeals([]); }, []);
  const exportData = useCallback(() => { const blob = new Blob([JSON.stringify(glp1StorageService.exportData(), null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `calorify-glp1-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); }, []);

  const currentDose = useMemo(() => doses.filter(d => !d.effectiveEndDate).sort((a,b) => b.effectiveStartDate.localeCompare(a.effectiveStartDate))[0] || null, [doses]);
  const derived = useMemo(() => ({ next: profile ? nextScheduled(profile) : null, week: profile ? treatmentWeek(profile) : 0, last: administrations.filter(a => a.administeredAt).sort((a,b) => b.administeredAt!.localeCompare(a.administeredAt!))[0] || null }), [profile, administrations]);

  return { profile, doses, administrations, symptoms, meals, preferences, setPreferences: (p: GLP1Preferences) => { glp1StorageService.savePreferences(p); setPreferences(p); }, currentDose, derived, saveSetup, saveAdministration, deleteAdministration, saveSymptom, deleteSymptom, createMeal, deactivate, reactivate, deleteAll, exportData };
}
