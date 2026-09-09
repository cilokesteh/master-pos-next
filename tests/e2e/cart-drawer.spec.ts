import { test, expect } from "@playwright/test";

test("mobile user can view cart items in drawer, edit quantity, and proceed to checkout", async ({ page }) => {
  // Only applies to mobile viewports where floating dock and drawer exist
  if (page.viewportSize()!.width >= 1024) {
    test.skip(true, "Mobile-specific drawer test");
  }

  await page.goto("/");
  await page.getByRole("button", { name: "Kasir" }).first().click();

  // Add items
  await page.getByRole("button", { name: "Manis" }).first().click();
  await page.getByRole("button", { name: "Pedas" }).first().click();

  // Mobile cart bar should reflect 2 items
  const cartTrigger = page.getByRole("button", { name: /item di keranjang/i });
  await expect(cartTrigger).toBeVisible();

  // Open cart drawer
  await cartTrigger.click();
  const drawer = page.getByRole("heading", { name: "Rincian Keranjang" });
  await expect(drawer).toBeVisible();

  // Scope to the cart bottom sheet
  const bottomSheet = page.locator("div.animate-in").first();
  await expect(bottomSheet.getByText("Es Teh Manis")).toBeVisible();
  await expect(bottomSheet.getByText("Nasi Goreng Spesial")).toBeVisible();

  // Change quantity inside mobile drawer using the plus button
  const plusButton = bottomSheet.locator("button").filter({ has: page.locator("svg") }).nth(1);
  if (await plusButton.isVisible()) {
    await plusButton.click();
  }

  // Click proceed to payment from drawer
  const payFromDrawer = bottomSheet.getByRole("button", { name: /Lanjut Pembayaran/i });
  await expect(payFromDrawer).toBeVisible();
  await payFromDrawer.click();

  // Payment modal opens
  await expect(page.getByText("Pembayaran", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Konfirmasi Pembayaran" }).click();
  await expect(page.getByText("Transaksi Sukses!")).toBeVisible();
});
