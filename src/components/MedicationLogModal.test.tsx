import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { administration, dosePeriod, medicationProfile } from "../test/glp1Fixtures";
import { MedicationLogModal } from "./MedicationLogModal";

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const renderModal = (overrides: Record<string, unknown> = {}) => {
  const props = { open: true, profile: medicationProfile(), dose: dosePeriod(), editing: null,
    onClose: vi.fn(), onSave: vi.fn(() => null), onEditDuplicate: vi.fn(), ...overrides };
  render(<MedicationLogModal {...props as any} />);
  return props;
};

describe("MedicationLogModal", () => {
  it("shows injection fields only when configured and saves neutral records", async () => {
    const props = renderModal();
    expect(screen.getByLabelText("Injection site")).toBeVisible();
    await user().selectOptions(screen.getByLabelText("Injection site"), "Abdomen");
    await user().click(screen.getByRole("button", { name: "Save" }));
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
      status: "taken_as_scheduled", userEnteredDoseLabel: "2.5 mg", injectionSite: "Abdomen",
    }), false);
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it.each(["postponed", "skipped"])("shows missed/delayed guidance for %s", async (status) => {
    renderModal();
    await user().selectOptions(screen.getByLabelText("Status"), status);
    expect(screen.getByText(/Instructions for missed or delayed medication differ/i)).toBeVisible();
    expect(screen.getByLabelText("Actual date and time")).toBeDisabled();
  });

  it("hides injection fields for tablets or disabled tracking", () => {
    renderModal({ profile: medicationProfile({ medicationForm: "daily_tablet", trackInjectionSite: false }) });
    expect(screen.queryByLabelText("Injection site")).not.toBeInTheDocument();
  });

  it("offers all duplicate-resolution actions", async () => {
    const duplicate = administration();
    const props = renderModal({ onSave: vi.fn().mockReturnValueOnce(duplicate).mockReturnValueOnce(null) });
    const u = user();
    await u.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText(/already exists near this time/i)).toBeVisible();
    await u.click(screen.getByRole("button", { name: "Edit existing" }));
    expect(props.onEditDuplicate).toHaveBeenCalledWith(duplicate);
    await u.click(screen.getByRole("button", { name: "Save new anyway" }));
    expect(props.onSave).toHaveBeenLastCalledWith(expect.any(Object), true);
  });

  it("returns to the form, supports editing, and cancels", async () => {
    const duplicate = administration(); const onClose = vi.fn();
    const { rerender } = render(<MedicationLogModal open profile={medicationProfile()} dose={dosePeriod()} editing={null} onClose={onClose} onSave={vi.fn(() => duplicate)} onEditDuplicate={vi.fn()} />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "Save" }));
    await u.click(screen.getByRole("button", { name: "Return to form" }));
    expect(screen.getByRole("heading", { name: "Log medication" })).toBeVisible();
    rerender(<MedicationLogModal open profile={medicationProfile()} dose={dosePeriod()} editing={duplicate} onClose={onClose} onSave={vi.fn(() => null)} onEditDuplicate={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Edit medication" })).toBeVisible();
    await u.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
