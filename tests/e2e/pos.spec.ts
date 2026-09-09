import { test, expect } from "@playwright/test";

async function assertNoOverflow(page: any) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    offenders: Array.from(document.querySelectorAll("body *"))
      .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 2)
      .slice(0, 10)
      .map((el) => ({ tag: el.tagName, className: (el as HTMLElement).className })),
  }));
  expect(overflow.scrollWidth, JSON.stringify(overflow.offenders)).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

test("shell, modules, and responsive layout work", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  await page.goto("/");
  await expect(page.getByText("Master POS").first()).toBeVisible();
  await expect(page.getByText("Es Teh Manis").first()).toBeVisible();
  await assertNoOverflow(page);

  const isMobile = page.viewportSize()!.width < 1024;
  if (isMobile) {
    await page.getByRole("button", { name: "Laporan" }).first().click();
    await assertNoOverflow(page);
    await page.getByRole("button", { name: "Kasbon" }).first().click();
    await assertNoOverflow(page);
    await page.getByRole("button", { name: "Lainnya" }).first().click();
    await page.getByRole("button", { name: "Shift" }).last().click();
    await assertNoOverflow(page);
  } else {
    for (const label of ["Laporan", "Shift", "Produk", "Kasbon", "Backup"]) {
      await page.getByRole("button", { name: label, exact: true }).first().click();
      await assertNoOverflow(page);
    }
  }

  expect(errors).toEqual([]);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-shell.png`, fullPage: true });
});

test("cashier transaction persists to IndexedDB and report", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Manis" }).first().click();

  const isMobile = page.viewportSize()!.width < 1024;
  if (isMobile) {
    const payTrigger = page.getByRole("button", { name: /Bayar/i }).first();
    await expect(payTrigger).toBeVisible();
    await payTrigger.click();
  } else {
    const payButton = page.getByRole("button", { name: /Bayar Pesanan/i }).first();
    await expect(payButton).toBeVisible();
    await payButton.click();
  }

  await expect(page.getByText("Pembayaran", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Konfirmasi Pembayaran" }).click();
  await expect(page.getByText("Transaksi Sukses!")).toBeVisible();
  await page.getByRole("button", { name: /Selesai/ }).click();

  const txCount = await page.evaluate(async () => {
    const req = indexedDB.open("master_pos_umkm_db");
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return await new Promise<number>((resolve, reject) => {
      const count = db.transaction("transactions").objectStore("transactions").count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    });
  });
  expect(txCount).toBe(1);

  await page.getByRole("button", { name: "Laporan" }).first().click();
  await expect(page.getByText("Rp 3.000").first()).toBeVisible();
});

test("product CRUD and backup download work", async ({ page }) => {
  await page.goto("/");
  const isMobile = page.viewportSize()!.width < 1024;
  if (isMobile) {
    await page.getByRole("button", { name: "Lainnya" }).first().click();
    await page.getByRole("button", { name: "Produk" }).last().click();
  } else {
    await page.getByRole("button", { name: "Produk", exact: true }).first().click();
  }

  await page.getByRole("button", { name: "Tambah Produk" }).click();
  await page.getByPlaceholder(/Es Teh Manis/).fill("Sate Usus");
  await page.getByPlaceholder("15000").fill("3000");
  await page.getByPlaceholder("9000").fill("1200");
  await page.getByRole("button", { name: "Simpan Produk" }).click();
  await expect(page.getByText("Sate Usus")).toBeVisible();

  if (isMobile) {
    await page.getByRole("button", { name: "Lainnya" }).first().click();
    await page.getByRole("button", { name: "Backup" }).last().click();
  } else {
    await page.getByRole("button", { name: "Backup", exact: true }).first().click();
  }

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Unduh File Cadangan/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/backup_master_pos_.*\.json/);
});

test("PWA service worker registers and offline reload serves app", async ({ page, context }) => {
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || ""), { timeout: 15000 }).toContain("/sw.js");
  await context.setOffline(true);
  const failedRequests: string[] = [];
  page.on("requestfailed", (request) => failedRequests.push(request.url()));
  await page.reload();
  await expect(page.getByText("Master POS").first()).toBeVisible();
  await expect(page.getByText("Es Teh Manis").first()).toBeVisible();
  expect(failedRequests.filter((url) => url.startsWith("http://127.0.0.1:4173"))).toEqual([]);
});
