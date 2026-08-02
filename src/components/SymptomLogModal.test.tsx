import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mealRecord, symptomEntry } from "../test/glp1Fixtures";
import { SymptomLogModal } from "./SymptomLogModal";

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const renderModal = (overrides: Record<string, unknown> = {}) => {
  const props = { open: true, meals: [mealRecord()], editing: null, onClose: vi.fn(),
    onSave: vi.fn((value) => symptomEntry({ ...value, id: value.id || "saved" })), ...overrides };
  render(<SymptomLogModal {...props as any} />);
  return props;
};

describe("SymptomLogModal", () => {
  it("provides the four-field quick flow and saves a routine Tier 1 entry", async () => {
    const props = renderModal();
    expect(screen.getByLabelText("Symptom")).toHaveValue("nausea");
    expect(screen.getByLabelText("Severity")).toHaveValue("mild");
    expect((screen.getByLabelText("Start date and time") as HTMLInputElement).value).toMatch(/^2026-08-01T/);
    expect(screen.getByLabelText("Still ongoing")).toBeChecked();
    await user().click(screen.getByLabelText("Still ongoing"));
    await user().click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ symptomType: "nausea", severity: "mild" }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("shows an accessible Tier 2 notice and still permits saving unchanged", async () => {
    const props = renderModal(); const u = user();
    await u.click(screen.getByRole("button", { name: "Add details" }));
    await u.click(screen.getByLabelText("Drinking"));
    await u.click(screen.getByRole("button", { name: "Save" }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent(/healthcare provider or pharmacist/i);
    expect(props.onSave).not.toHaveBeenCalled();
    await u.click(screen.getByRole("button", { name: "Save entry" }));
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ affectedDrinking: true }));
  });

  it("shows prompt-attention language only after an explicit urgent sign", async () => {
    const props = renderModal(); const u = user();
    await u.click(screen.getByRole("button", { name: "Add details" }));
    await u.click(screen.getByLabelText("Difficulty breathing"));
    await u.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/local emergency services/i);
    await u.click(screen.getByRole("button", { name: "Save entry" }));
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ urgentSigns: ["Difficulty breathing"] }));
  });

  it("captures detailed context, a related meal, and resolved timing", async () => {
    const props = renderModal(); const u = user();
    await u.click(screen.getByRole("button", { name: "Add details" }));
    await u.click(screen.getByLabelText("Still ongoing"));
    expect(screen.getByLabelText("End date and time")).toBeVisible();
    await u.type(screen.getByLabelText("End date and time"), "2026-08-01T12:00");
    await u.clear(screen.getByLabelText("Intensity (0–10)")); await u.type(screen.getByLabelText("Intensity (0–10)"), "6");
    await u.selectOptions(screen.getByLabelText("Closest meal"), "meal_1");
    await u.click(screen.getByRole("button", { name: "After a small meal" }));
    await u.type(screen.getByLabelText("Notes"), "User-authored context");
    await u.click(screen.getByRole("button", { name: "Save" }));
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
      isOngoing: false, intensity: 6, relatedMealId: "meal_1",
      contextTags: ["After a small meal"], notes: "User-authored context",
    }));
  });

  it("prefills an existing episode, hides details, and cancels", async () => {
    const onClose = vi.fn();
    renderModal({ editing: symptomEntry({ endedAt: "2026-08-01T16:00:00Z", isOngoing: false }), onClose });
    expect(screen.getByRole("heading", { name: "Edit symptom" })).toBeVisible();
    await user().click(screen.getByRole("button", { name: "Hide details" }));
    expect(screen.queryByLabelText("Intensity (0–10)")).not.toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
