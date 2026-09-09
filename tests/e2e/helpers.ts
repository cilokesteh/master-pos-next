import { Page, expect } from "@playwright/test";

export async function addProductToCart(page: Page, productName: string, variantName?: string) {
  // Click the product card
  await page.getByRole("button", { name: new RegExp(productName, "i") }).click();
  
  // If variant modal appears and variantName specified, click variant
  if (variantName) {
    const modal = page.locator("div:has-text('PILIH VARIAN MENU:')").last();
    if (await modal.isVisible()) {
      await modal.getByRole("button", { name: variantName, exact: true }).click();
    }
  }
}
