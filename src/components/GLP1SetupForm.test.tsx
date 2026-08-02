import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { dosePeriod, medicationProfile } from "../test/glp1Fixtures";
import { GLP1SetupForm } from "./GLP1SetupForm";

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe("GLP1SetupForm", () => {
  it("requires medication and prescribed-dose information", async () => {
    render(<GLP1SetupForm profile={null} dose={null} onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Review setup" })).toBeDisabled();
    await user().type(screen.getByLabelText("Medication name"), "My medication");
    await user().type(screen.getByLabelText("Prescribed dose label"), "2.5 mg");
    expect(screen.getByRole("button", { name: "Review setup" })).toBeEnabled();
    expect(screen.getByText(/does not send notifications/i)).toBeVisible();
  });

  it("normalizes daily schedules and saves only after review", async () => {
    const onSave = vi.fn();
    render(<GLP1SetupForm profile={null} dose={null} onSave={onSave} />);
    const u = user();
    await u.type(screen.getByLabelText("Medication name"), "My medication");
    await u.type(screen.getByLabelText("Prescribed dose label"), "2.5 mg");
    await u.selectOptions(screen.getByLabelText("Schedule"), "daily");
    await u.click(screen.getByLabelText("Save reminder preference"));
    await u.click(screen.getByRole("button", { name: "Review setup" }));
    expect(screen.getByRole("heading", { name: "Review GLP-1 setup" })).toBeVisible();
    expect(screen.getByText(/Follow the instructions from your prescriber/i)).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
    await u.click(screen.getByRole("button", { name: "Confirm setup" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ scheduleType: "daily", scheduledDays: [0, 1, 2, 3, 4, 5, 6], remindersEnabled: true }),
      expect.objectContaining({ prescribedDoseLabel: "2.5 mg" }),
    );
  });

  it("supports multiple custom weekdays and returning from review", async () => {
    const onSave = vi.fn();
    render(<GLP1SetupForm profile={null} dose={null} onSave={onSave} />);
    const u = user();
    await u.type(screen.getByLabelText("Medication name"), "My medication");
    await u.type(screen.getByLabelText("Prescribed dose label"), "oral dose");
    await u.selectOptions(screen.getByLabelText("Schedule"), "custom");
    await u.click(screen.getByRole("button", { name: "Mon" }));
    await u.click(screen.getByRole("button", { name: "Thu" }));
    await u.click(screen.getByRole("button", { name: "Review setup" }));
    await u.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Set up GLP-1 tracking" })).toBeVisible();
    await u.click(screen.getByRole("button", { name: "Review setup" }));
    await u.click(screen.getByRole("button", { name: "Confirm setup" }));
    expect(onSave.mock.calls[0][0].scheduledDays).toEqual(expect.arrayContaining([1, 4]));
  });

  it("prefills settings, records dose-change details, and cancels", async () => {
    const onSave = vi.fn(); const onCancel = vi.fn();
    render(<GLP1SetupForm profile={medicationProfile()} dose={dosePeriod()} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByRole("heading", { name: "GLP-1 settings" })).toBeVisible();
    expect(screen.getByLabelText("Medication name")).toHaveValue("User-entered medication");
    await user().type(screen.getByLabelText("Dose-change note"), "Prescriber update");
    await user().click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
