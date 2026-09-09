import { test, expect } from "@playwright/test";

async function assertNoHorizontalOverflow(page: any) {
  const data = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll("body *"))
      .filter((el) => el.getBoundingClientRect().right > cw + 2)
      .slice(0, 10)
      .map((el) => ({
        tag: el.tagName,
        cls: (el as HTMLElement).className,
        right: Math.round(el.getBoundingClientRect().right),
      }));
    return { sw, cw, offenders };
  });
  expect(data.sw, `Overflow detected on ${page.viewportSize()?.width}px: ${JSON.stringify(data.offenders)}`).toBeLessThanOrEqual(data.cw + 2);
}

test("responsive mobile layout has zero overflow on 345px and 390px", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Master POS").first()).toBeVisible();
  await expect(page.getByText("Es Teh Manis").first()).toBeVisible();
  await assertNoHorizontalOverflow(page);

  // Bottom navigation works
  await page.getByRole("button", { name: "Laporan" }).first().click();
  await expect(page.getByText("Total Omzet")).toBeVisible();
  await assertNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Kasbon" }).first().click();
  await expect(page.getByText("Buku Kasbon & Piutang Pelanggan")).toBeVisible();
  await assertNoHorizontalOverflow(page);

  // Drawer menu works for secondary items
  if (page.viewportSize()!.width < 1024) {
    await page.getByRole("button", { name: "Lainnya" }).click();
    await expect(page.getByText("Menu Utama")).toBeVisible();
    await page.getByRole("button", { name: "Shift" }).last().click();
    await expect(page.getByText("Shift & Arus Kas Laci (Petty Cash)")).toBeVisible();
    await assertNoHorizontalOverflow(page);
  }
});

test("mobile cashier tap to cart, floating checkout dock, and payment modal work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Kasir" }).first().click();

  // Tap variant button
  await page.getByRole("button", { name: "Manis" }).first().click();

  // Floating dock appears
  const dockPay = page.getByRole("button", { name: /Bayar/i }).first();
  await expect(dockPay).toBeVisible();
  await dockPay.click();

  // Payment modal opens cleanly
  await expect(page.getByText("Pembayaran", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Konfirmasi Pembayaran" }).click();
  await expect(page.getByText("Transaksi Sukses!")).toBeVisible();
  await page.getByRole("button", { name: /Selesai/ }).click();
});
