import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const views = ["Kasir", "Laporan", "Kasbon"];

async function enableDark(page: any) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("pos_theme", "dark");
    document.documentElement.classList.add("dark");
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
}

test("dark theme has no hardcoded white surfaces and passes serious contrast checks", async ({ page }) => {
  await enableDark(page);

  for (const view of views) {
    await page.getByRole("button", { name: view, exact: true }).first().click();
    const violations = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = violations.violations.filter((v) => ["serious", "critical"].includes(v.impact || ""));
    expect(serious, `${view}: ${JSON.stringify(serious.map((v) => ({ id: v.id, nodes: v.nodes.length })))}`).toEqual([]);
  }
});

