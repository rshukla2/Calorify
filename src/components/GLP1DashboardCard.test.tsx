import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { administration, dosePeriod, medicationProfile, symptomEntry } from "../test/glp1Fixtures";
import { GLP1DashboardCard } from "./GLP1DashboardCard";

const actions = () => ({ onOpen: vi.fn(), onSetup: vi.fn(), onLogMedication: vi.fn(), onLogSymptom: vi.fn() });
describe("GLP1DashboardCard", () => {
  it("shows an optional setup invitation when inactive or absent", async () => {
    const callbacks = actions();
    render(<GLP1DashboardCard profile={null} dose={null} administrations={[]} symptoms={[]} {...callbacks} />);
    expect(screen.getByText("Manage Your GLP-1 Progress")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Set up" }));
    expect(callbacks.onSetup).toHaveBeenCalledOnce();
  });

  it("uses neutral active-state language and exposes all actions", async () => {
    const callbacks = actions();
    render(<GLP1DashboardCard profile={medicationProfile()} dose={dosePeriod()} administrations={[administration()]} symptoms={[symptomEntry()]} {...callbacks} />);
    expect(screen.getByText("User-entered medication")).toBeVisible();
    expect(screen.getByText(/User-entered dose: 2.5 mg/)).toBeVisible();
    expect(screen.getByText(/Next scheduled/)).toBeVisible();
    expect(screen.getByText(/Last recorded/)).toBeVisible();
    expect(screen.queryByText(/overdue|take your dose/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Log Medication" }));
    await userEvent.click(screen.getByRole("button", { name: "Log Symptom" }));
    await userEvent.click(screen.getByRole("button", { name: /Open Timeline/ }));
    expect(callbacks.onLogMedication).toHaveBeenCalledOnce();
    expect(callbacks.onLogSymptom).toHaveBeenCalledOnce();
    expect(callbacks.onOpen).toHaveBeenCalledOnce();
  });

  it("renders neutral missing-record states", () => {
    render(<GLP1DashboardCard profile={medicationProfile()} dose={null} administrations={[]} symptoms={[]} {...actions()} />);
    expect(screen.getByText(/User-entered dose: Not recorded/)).toBeVisible();
    expect(screen.getByText("No administration recorded")).toBeVisible();
    expect(screen.getByText("Recent symptoms: None recorded")).toBeVisible();
  });
});
