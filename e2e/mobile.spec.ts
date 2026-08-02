import { expect, test } from "@playwright/test";
import { openGLP1, seedApp } from "./fixtures";

test("mobile navigation, focus, touch targets, and safety alerts remain accessible", async ({ page }) => {
  await seedApp(page, true);
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.getByRole("button", { name: "Dashboard" })).toBeVisible();
  await openGLP1(page);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.getByRole("button", { name: "Log Symptom" }).first().click();
  await page.getByRole("button", { name: "Add details" }).click();
  await page.getByLabel("Difficulty breathing").check();
  await page.getByRole("button", { name: "Save" }).click();
  const alert = page.getByRole("alert");
  await expect(alert).toHaveAttribute("aria-live", "assertive");
  await expect(alert).toContainText("local emergency services");
  const box = await page.getByRole("button", { name: "Save entry" }).boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(40);
});
