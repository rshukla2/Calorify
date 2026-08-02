import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { administration, dosePeriod, mealRecord, medicationProfile, symptomEntry } from "../test/glp1Fixtures";
import { GLP1Page } from "./GLP1Page";

const makeProps = () => ({
  profile: medicationProfile(), dose: dosePeriod(), doses: [dosePeriod()],
  administrations: [administration()], symptoms: [symptomEntry()], meals: [mealRecord()],
  foodLogs: [{ id: "food_1", mealId: "meal_1", date: "2026-08-01", mealType: "breakfast" as const,
    foodName: "Oatmeal", servingDescription: "1 bowl", servingAmount: 1, servingUnit: "bowl",
    calories: 300, proteinGrams: 12, carbGrams: 50, fatGrams: 6, source: "manual" as const,
    createdAt: "2026-08-01T14:00:00Z", updatedAt: "2026-08-01T14:00:00Z" }],
  onBack: vi.fn(), onSetup: vi.fn(), onLogMedication: vi.fn(), onEditMedication: vi.fn(),
  onDeleteMedication: vi.fn(), onLogSymptom: vi.fn(), onEditSymptom: vi.fn(),
  onDeleteSymptom: vi.fn(), onDeactivate: vi.fn(), onDeleteAll: vi.fn(), onExport: vi.fn(),
});

describe("GLP1Page", () => {
  it("renders an observational overview and primary actions", async () => {
    const props = makeProps(); render(<GLP1Page {...props} />);
    expect(screen.getByRole("heading", { name: "Manage GLP-1 Progress" })).toBeVisible();
    expect(screen.getByText(/Tracking and educational tool/)).toBeVisible();
    expect(screen.getByText(/User-entered prescribed dose/)).toBeVisible();
    expect(screen.getByText(/does not prove/)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Log Medication" }));
    await userEvent.click(screen.getByRole("button", { name: "Log Symptom" }));
    expect(props.onLogMedication).toHaveBeenCalledOnce();
    expect(props.onLogSymptom).toHaveBeenCalledOnce();
  });

  it("combines, filters, groups, edits, and deletes timeline events", async () => {
    const props = makeProps(); render(<GLP1Page {...props} />); const u = userEvent.setup();
    await u.click(screen.getByRole("button", { name: "timeline" }));
    expect(screen.getByText("Medication recorded")).toBeVisible();
    expect(screen.getByText("Breakfast")).toBeVisible();
    expect(screen.getByText("Nausea")).toBeVisible();
    expect(screen.getAllByText(/do(?:es)? not prove/).length).toBeGreaterThan(0);
    await u.selectOptions(screen.getByLabelText("Event type"), "symptom");
    expect(screen.getByText("Nausea")).toBeVisible();
    expect(screen.queryByText("Medication recorded")).not.toBeInTheDocument();
    await u.selectOptions(screen.getByLabelText("Group by"), "week");
    expect(screen.getByRole("heading", { name: /Treatment week \d+/ })).toBeVisible();
    await u.click(screen.getByRole("button", { name: "Edit symptom entry" }));
    expect(props.onEditSymptom).toHaveBeenCalledWith(expect.objectContaining({ id: "symptom_1" }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await u.click(screen.getByRole("button", { name: "Delete symptom entry" }));
    expect(props.onDeleteSymptom).toHaveBeenCalledWith("symptom_1");
  });

  it("supports medication editing and a custom empty date range", async () => {
    const props = makeProps(); render(<GLP1Page {...props} />); const u = userEvent.setup();
    await u.click(screen.getByRole("button", { name: "timeline" }));
    await u.click(screen.getByRole("button", { name: "Edit medication entry" }));
    expect(props.onEditMedication).toHaveBeenCalledWith(expect.objectContaining({ id: "admin_1" }));
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await u.click(screen.getByRole("button", { name: "Delete medication entry" }));
    expect(props.onDeleteMedication).not.toHaveBeenCalled();
    await u.clear(screen.getByLabelText("From")); await u.type(screen.getByLabelText("From"), "2030-01-01");
    await u.clear(screen.getByLabelText("To")); await u.type(screen.getByLabelText("To"), "2030-01-02");
    expect(screen.getByText("No events in this range.")).toBeVisible();
  });

  it("exposes privacy controls with confirmation and keeps the back action", async () => {
    const props = makeProps(); render(<GLP1Page {...props} />); const u = userEvent.setup();
    await u.click(screen.getByRole("button", { name: "Back" }));
    expect(props.onBack).toHaveBeenCalledOnce();
    await u.click(screen.getByRole("button", { name: "settings" }));
    expect(screen.getByText(/stay in this browser/)).toBeVisible();
    await u.click(screen.getByRole("button", { name: /Export GLP-1 data/ }));
    expect(props.onExport).toHaveBeenCalledOnce();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await u.click(screen.getByRole("button", { name: /Deactivate and preserve data/ }));
    await u.click(screen.getByRole("button", { name: /Permanently delete GLP-1 data/ }));
    expect(props.onDeactivate).toHaveBeenCalledOnce();
    expect(props.onDeleteAll).toHaveBeenCalledOnce();
  });

  it("renders empty symptom and administration states", () => {
    const props = { ...makeProps(), administrations: [], symptoms: [] };
    render(<GLP1Page {...props} />);
    expect(screen.getByText("No administration recorded")).toBeVisible();
    expect(screen.getByText("No recent symptom records")).toBeVisible();
  });

  it("supports relative and ungrouped range views plus all event filters", async () => {
    const props = makeProps();
    props.symptoms = [
      symptomEntry({ id: "resolved", isOngoing: false, endedAt: "2026-08-01T16:00:00Z" }),
      symptomEntry({ id: "no-end", isOngoing: false, endedAt: null, closestAdministrationId: null }),
    ];
    render(<GLP1Page {...props} />); const u = userEvent.setup();
    await u.click(screen.getByRole("button", { name: "timeline" }));
    await u.clear(screen.getByLabelText("From")); await u.type(screen.getByLabelText("From"), "2026-07-01");
    await u.selectOptions(screen.getByLabelText("Group by"), "relative");
    expect(screen.getAllByText(/after medication|before medication/).length).toBeGreaterThan(0);
    await u.selectOptions(screen.getByLabelText("Group by"), "range");
    await u.selectOptions(screen.getByLabelText("Event type"), "scheduled");
    expect(screen.getAllByText("Scheduled administration").length).toBeGreaterThan(0);
    await u.selectOptions(screen.getByLabelText("Event type"), "dose");
    expect(screen.getByText("Prescribed dose period")).toBeVisible();
    await u.selectOptions(screen.getByLabelText("Event type"), "meal");
    expect(screen.getByText("Breakfast")).toBeVisible();
  });

  it("confirms medication deletion and triggers timeline add actions", async () => {
    const props = makeProps(); render(<GLP1Page {...props} />); const u = userEvent.setup();
    await u.click(screen.getByRole("button", { name: "timeline" }));
    await u.click(screen.getByRole("button", { name: /Medication$/ }));
    await u.click(screen.getByRole("button", { name: /Symptom$/ }));
    expect(props.onLogMedication).toHaveBeenCalledOnce();
    expect(props.onLogSymptom).toHaveBeenCalledOnce();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await u.click(screen.getByRole("button", { name: "Delete medication entry" }));
    expect(props.onDeleteMedication).toHaveBeenCalledWith("admin_1");
  });
});
