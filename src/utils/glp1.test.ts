import { describe, expect, it, vi } from "vitest";
import { administration, medicationProfile } from "../test/glp1Fixtures";
import {
  closestAdministration,
  findDuplicateAdministration,
  localInputToIso,
  localTimeZone,
  nextScheduled,
  relativeTime,
  scheduledOccurrences,
  symptomSafetyMessage,
  symptomSafetyTier,
  toLocalInputValue,
  treatmentWeek,
} from "./glp1";

describe("GLP-1 schedule calculations", () => {
  it("generates weekly occurrences across month and year boundaries", () => {
    const profile = medicationProfile({ scheduledDays: [3], treatmentStartDate: "2025-12-01" });
    const dates = scheduledOccurrences(profile, new Date(2025, 11, 29), new Date(2026, 0, 8));
    expect(dates.map((date) => [date.getFullYear(), date.getMonth(), date.getDate(), date.getDay()])).toEqual([
      [2025, 11, 31, 3],
      [2026, 0, 7, 3],
    ]);
  });

  it("generates each day for daily schedules", () => {
    const profile = medicationProfile({ scheduleType: "daily", scheduledDays: [] });
    expect(scheduledOccurrences(profile, new Date(2026, 7, 1), new Date(2026, 7, 3))).toHaveLength(3);
  });

  it("generates all selected weekdays for a custom schedule", () => {
    const profile = medicationProfile({ scheduleType: "custom", scheduledDays: [1, 4] });
    const dates = scheduledOccurrences(profile, new Date(2026, 7, 3), new Date(2026, 7, 9));
    expect(dates.map((date) => date.getDay())).toEqual([1, 4]);
  });

  it("does not create occurrences before treatment starts", () => {
    const profile = medicationProfile({ treatmentStartDate: "2026-08-05", scheduleType: "daily" });
    const dates = scheduledOccurrences(profile, new Date(2026, 7, 1), new Date(2026, 7, 6));
    expect(dates.map((date) => date.getDate())).toEqual([5, 6]);
  });

  it("keeps planned local clock time across a daylight-saving transition", () => {
    const profile = medicationProfile({ scheduleType: "daily", scheduledTime: "08:30", treatmentStartDate: "2026-03-01" });
    const dates = scheduledOccurrences(profile, new Date(2026, 2, 7), new Date(2026, 2, 9));
    expect(dates.map((date) => `${date.getHours()}:${date.getMinutes()}`)).toEqual(["8:30", "8:30", "8:30"]);
  });

  it("finds the next occurrence and returns null when the search window has none", () => {
    const weekly = medicationProfile({ scheduledDays: [1], scheduledTime: "08:00" });
    expect(nextScheduled(weekly, new Date(2026, 7, 1, 9))?.getDay()).toBe(1);
    expect(nextScheduled({ ...weekly, treatmentStartDate: "2030-01-01" }, new Date(2026, 7, 1))).toBeNull();
  });

  it("calculates treatment weeks with a floor of one", () => {
    const profile = medicationProfile({ treatmentStartDate: "2026-07-04" });
    expect(treatmentWeek(profile, new Date(2026, 6, 4))).toBe(1);
    expect(treatmentWeek(profile, new Date(2026, 6, 18))).toBe(3);
    expect(treatmentWeek(profile, new Date(2026, 5, 1))).toBe(1);
  });
});

describe("time formatting and relationships", () => {
  it.each([
    ["2026-01-01T08:00:00Z", "2026-01-01T08:15:00Z", "15 min after"],
    ["2026-01-01T08:00:00Z", "2026-01-01T09:20:00Z", "1 hr 20 min after"],
    ["2026-01-01T08:00:00Z", "2026-01-03T08:00:00Z", "2 days after"],
    ["2026-01-01T08:00:00Z", "2026-01-01T07:00:00Z", "1 hr before"],
  ])("formats %s to %s", (from, to, expected) => expect(relativeTime(from, to)).toBe(expected));

  it("round-trips local datetime input values", () => {
    const iso = localInputToIso("2026-08-01T10:30");
    expect(toLocalInputValue(iso)).toBe("2026-08-01T10:30");
    expect(toLocalInputValue(null)).toMatch(/^2026-08-01T/);
    expect(localTimeZone()).toEqual(expect.any(String));
  });

  it("finds the closest recorded administration and ignores unsaved times", () => {
    const first = administration({ id: "first", administeredAt: "2026-08-01T10:00:00Z" });
    const second = administration({ id: "second", administeredAt: "2026-08-01T14:00:00Z" });
    const skipped = administration({ id: "skipped", administeredAt: null });
    expect(closestAdministration("2026-08-01T13:30:00Z", [first, second, skipped])?.id).toBe("second");
    expect(closestAdministration("2026-08-01T13:30:00Z", [skipped])).toBeNull();
  });
});

describe("duplicate administration detection", () => {
  const existing = administration({ id: "existing", administeredAt: "2026-08-01T13:00:00Z" });

  it("matches entries for the same medication inside and on the boundary", () => {
    expect(findDuplicateAdministration({ ...existing, id: "new", administeredAt: "2026-08-01T15:00:00Z" }, [existing], 120)?.id).toBe("existing");
  });

  it("ignores edits, other medications, missing times, and entries beyond the window", () => {
    expect(findDuplicateAdministration(existing, [existing])).toBeNull();
    expect(findDuplicateAdministration({ ...existing, id: "new", medicationProfileId: "other" }, [existing])).toBeNull();
    expect(findDuplicateAdministration({ ...existing, id: "new", administeredAt: null, scheduledAt: null }, [existing])).toBeNull();
    expect(findDuplicateAdministration({ ...existing, id: "new", administeredAt: "2026-08-01T15:01:00Z" }, [existing], 120)).toBeNull();
  });
});

describe("symptom safety", () => {
  it("uses Tier 1 only for routine mild records", () => expect(symptomSafetyTier({ severity: "mild" })).toBe(1));

  it.each([
    { severity: "moderate" as const }, { severity: "severe" as const },
    { severity: "mild" as const, affectedEating: true },
    { severity: "mild" as const, affectedDrinking: true },
    { severity: "mild" as const, affectedDailyActivity: true },
    { severity: "mild" as const, isOngoing: true },
    { severity: "mild" as const, contextTags: ["After a prescribed dose change"] },
    { severity: "mild" as const, userConcerned: true },
  ])("uses Tier 2 for $severity or a concerning response", (input) => expect(symptomSafetyTier(input)).toBe(2));

  it("uses Tier 3 only when an urgent sign was selected", () => {
    expect(symptomSafetyTier({ severity: "mild", urgentSigns: ["Difficulty breathing"] })).toBe(3);
    expect(symptomSafetyTier({ severity: "severe", urgentSigns: [] })).toBe(2);
  });

  it("returns neutral safety messages", () => {
    expect(symptomSafetyMessage(1)).toBeNull();
    expect(symptomSafetyMessage(2)).toContain("healthcare provider or pharmacist");
    expect(symptomSafetyMessage(3)).toContain("local emergency services");
  });
});
