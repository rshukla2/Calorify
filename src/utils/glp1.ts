import { GLP1_DUPLICATE_WINDOW_MINUTES } from "../constants";
import { GLP1MedicationProfile, MedicationAdministration, SymptomEntry, SymptomSeverity } from "../types";

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
export const toLocalInputValue = (iso?: string | null) => {
  const d = iso ? new Date(iso) : new Date();
  const shifted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
};
export const localInputToIso = (value: string) => new Date(value).toISOString();

export function scheduledOccurrences(profile: GLP1MedicationProfile, from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const start = new Date(`${profile.treatmentStartDate}T00:00:00`);
  const cursor = new Date(from); cursor.setHours(0, 0, 0, 0);
  const end = new Date(to); end.setHours(23, 59, 59, 999);
  const [hour, minute] = profile.scheduledTime.split(":").map(Number);
  while (cursor <= end) {
    const allowed = cursor >= start && (profile.scheduleType === "daily" || profile.scheduledDays.includes(cursor.getDay()));
    if (allowed) { const event = new Date(cursor); event.setHours(hour || 0, minute || 0, 0, 0); out.push(event); }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function nextScheduled(profile: GLP1MedicationProfile, now = new Date()): Date | null {
  return scheduledOccurrences(profile, new Date(now.getTime() - 86400000), new Date(now.getTime() + 32 * 86400000)).find(d => d >= now) || null;
}

export function treatmentWeek(profile: GLP1MedicationProfile, now = new Date()): number {
  const start = new Date(`${profile.treatmentStartDate}T00:00:00`);
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / 604800000) + 1);
}

export function relativeTime(from: string | Date, to: string | Date): string {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  const abs = Math.abs(ms); const mins = Math.round(abs / 60000);
  const amount = mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.floor(mins / 60)} hr${Math.floor(mins / 60) === 1 ? "" : "s"}${mins % 60 ? ` ${mins % 60} min` : ""}` : `${Math.floor(mins / 1440)} day${Math.floor(mins / 1440) === 1 ? "" : "s"}`;
  return `${amount} ${ms >= 0 ? "after" : "before"}`;
}

export function findDuplicateAdministration(candidate: Pick<MedicationAdministration, "id" | "medicationProfileId" | "administeredAt" | "scheduledAt">, entries: MedicationAdministration[], windowMinutes = GLP1_DUPLICATE_WINDOW_MINUTES) {
  const at = candidate.administeredAt || candidate.scheduledAt;
  if (!at) return null;
  return entries.find(e => e.id !== candidate.id && e.medicationProfileId === candidate.medicationProfileId && !!(e.administeredAt || e.scheduledAt) && Math.abs(new Date(e.administeredAt || e.scheduledAt!).getTime() - new Date(at).getTime()) <= windowMinutes * 60000) || null;
}

export function symptomSafetyTier(input: { severity: SymptomSeverity; urgentSigns?: string[]; affectedEating?: boolean | null; affectedDrinking?: boolean | null; affectedDailyActivity?: boolean | null; isOngoing?: boolean; contextTags?: string[]; userConcerned?: boolean }): 1 | 2 | 3 {
  if (input.urgentSigns?.length) return 3;
  if (input.severity !== "mild" || input.affectedEating || input.affectedDrinking || input.affectedDailyActivity || input.isOngoing || input.contextTags?.includes("After a prescribed dose change") || input.userConcerned) return 2;
  return 1;
}

export const symptomSafetyMessage = (tier: 1 | 2 | 3) => tier === 3
  ? "This entry may require prompt medical attention. Contact a healthcare professional or urgent medical service now. If you believe this is an emergency, contact local emergency services."
  : tier === 2 ? "Consider contacting your healthcare provider or pharmacist for personalized advice, especially if the symptom continues or worsens." : null;

export function closestAdministration(at: string, entries: MedicationAdministration[]) {
  return entries.filter(e => e.administeredAt).sort((a, b) => Math.abs(new Date(a.administeredAt!).getTime() - new Date(at).getTime()) - Math.abs(new Date(b.administeredAt!).getTime() - new Date(at).getTime()))[0] || null;
}

export type TimelineEvent = { id: string; type: "scheduled" | "administration" | "meal" | "symptom" | "dose"; at: string; title: string; detail: string; sourceId?: string };
