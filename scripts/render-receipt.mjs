import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("https://master-pos-next.pages.dev");
await page.getByRole("button", { name: "Manis" }).first().click();
await page.getByRole("button", { name: /Bayar/i }).first().click();
await page.getByRole("button", { name: "Konfirmasi Pembayaran" }).click();

const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "PDF" }).click();
const download = await downloadPromise;
const pdfPath = "/tmp/test_receipt.pdf";
await download.saveAs(pdfPath);
await browser.close();

execSync(`python3 -c "import fitz; doc=fitz.open('/tmp/test_receipt.pdf'); page=doc.load_page(0); pix=page.get_pixmap(dpi=150); pix.save('/tmp/test_receipt.png')"`);
console.log("RENDERED_PNG_OK");
