import { expect, test } from "@playwright/test";
import { openGLP1, seedApp } from "./fixtures";

test("completes first-time setup and exposes dashboard/profile entry points", async ({ page }) => {
  await seedApp(page);
  await page.getByRole("button", { name: "Set up" }).click();
  await page.getByLabel("Medication name").fill("My prescribed medication");
  await page.getByLabel("Prescribed dose label").fill("2.5 mg");
  await page.getByRole("button", { name: "Review setup" }).click();
  await expect(page.getByText(/does not determine your dose/)).toBeVisible();
  await page.getByRole("button", { name: "Confirm setup" }).click();
  await expect(page.getByRole("heading", { name: "Manage GLP-1 Progress" })).toBeVisible();
  await expect(page.getByText(/User-entered prescribed dose/)).toContainText("2.5 mg");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("My prescribed medication")).toBeVisible();
  await page.getByRole("button", { name: "Profile" }).click();
  await expect(page.getByText(/Active · manage schedule/)).toBeVisible();
});

test("logs medication and resolves a nearby duplicate without clinical claims", async ({ page }) => {
  await seedApp(page, true); await openGLP1(page);
  await page.getByRole("button", { name: "Log Medication" }).first().click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Log Medication" }).first().click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/already exists near this time/)).toBeVisible();
  await expect(page.getByText(/took too much/i)).toHaveCount(0);
  await page.getByRole("button", { name: "Save new anyway" }).click();
  await page.getByRole("button", { name: "timeline", exact: true }).click();
  await expect(page.getByText("Medication recorded")).toHaveCount(2);
  await page.getByLabel("Event type").selectOption("administration");
  await page.getByRole("button", { name: "Edit medication entry" }).first().click();
  await expect(page.getByRole("heading", { name: "Edit medication" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
});

test("shows each symptom safety tier and always allows saving", async ({ page }) => {
  await seedApp(page, true); await openGLP1(page);
  await page.getByRole("button", { name: "Log Symptom" }).first().click();
  await page.getByLabel("Still ongoing").uncheck();
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Log Symptom" }).first().click();
  await page.getByLabel("Severity").selectOption("moderate");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("alert")).toContainText("healthcare provider or pharmacist");
  await page.getByRole("button", { name: "Save entry" }).click();
  await page.getByRole("button", { name: "Log Symptom" }).first().click();
  await page.getByRole("button", { name: "Add details" }).click();
  await page.getByLabel("Difficulty breathing").check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("alert")).toContainText("local emergency services");
  await page.getByRole("button", { name: "Save entry" }).click();
  await page.getByRole("button", { name: "timeline", exact: true }).click();
  await page.getByLabel("Event type").selectOption("symptom");
  await expect(page.getByText("Nausea")).toHaveCount(3);
  await expect(page.getByText(/do(?:es)? not prove/)).toBeVisible();
});

test("creates shared meal context and displays it in the timeline", async ({ page }) => {
  await seedApp(page, true);
  await page.getByRole("button", { name: "Log Food" }).click();
  await page.getByLabel("Add GLP-1 meal timing and appetite context").check();
  await page.getByLabel("Meal size").selectOption("small");
  await page.getByLabel("Hunger before (1-5)").fill("3");
  await page.getByLabel("Fullness after (1-5)").fill("4");
  await page.getByRole("button", { name: "Manual" }).click();
  await page.getByLabel(/Food Name/).fill("Oatmeal");
  await page.getByLabel(/Calories/).fill("300");
  await page.getByRole("button", { name: /Save Food Entry/ }).click();
  await page.getByRole("button", { name: /Open Timeline/ }).click();
  await page.getByRole("button", { name: "timeline", exact: true }).click();
  await page.getByLabel("Event type").selectOption("meal");
  await expect(page.getByText("Breakfast")).toBeVisible();
  await expect(page.getByText(/300 kcal · 1 item/)).toBeVisible();
});

test("exports, deactivates, reactivates, and permanently deletes only GLP-1 data", async ({ page }) => {
  await seedApp(page, true); await openGLP1(page);
  await page.getByRole("button", { name: "settings" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export GLP-1 data/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^calorify-glp1-.*\.json$/);
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Deactivate and preserve data/ }).click();
  await page.getByRole("button", { name: "Profile" }).click();
  await expect(page.getByText(/Inactive · your prior records are preserved/)).toBeVisible();
  await page.getByRole("button", { name: "Set up" }).click();
  await page.getByRole("button", { name: "settings" }).click();
  await page.getByRole("button", { name: /Permanently delete GLP-1 data/ }).click();
  await expect(page.getByText("Manage Your GLP-1 Progress")).toBeVisible();
  const ordinary = await page.evaluate(() => ({ profile: localStorage.getItem("calorify_profile"), food: localStorage.getItem("calorify_food_logs"), glp1: localStorage.getItem("calorieTracker.glp1Profile.v1") }));
  expect(ordinary.profile).not.toBeNull(); expect(ordinary.food).not.toBeNull(); expect(ordinary.glp1).toBeNull();
});
