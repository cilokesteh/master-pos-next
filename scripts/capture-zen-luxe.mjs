import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";

// Start serve
const server = spawn("pnpm", ["exec", "serve", "out", "-l", "4173"], {
  stdio: "ignore",
  detached: false,
});

await new Promise((r) => setTimeout(r, 1500));

const browser = await chromium.launch({ headless: true });

// 1. Mobile 375px Dark Mode
const contextDark = await browser.newContext({
  viewport: { width: 375, height: 812 },
  isMobile: true,
  colorScheme: "dark",
});
const pageDark = await contextDark.newPage();
await pageDark.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
await pageDark.getByRole("button", { name: "Manis" }).first().click();
await pageDark.screenshot({ path: "/tmp/zen_luxe_mobile_dark.png", fullPage: true });

// 2. Mobile 375px Light Mode
const contextLight = await browser.newContext({
  viewport: { width: 375, height: 812 },
  isMobile: true,
  colorScheme: "light",
});
const pageLight = await contextLight.newPage();
await pageLight.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
await pageLight.getByRole("button", { name: "Manis" }).first().click();
await pageLight.screenshot({ path: "/tmp/zen_luxe_mobile_light.png", fullPage: true });

// 3. Desktop 1440px Dark Mode (Split cockpit)
const contextDesktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const pageDesk = await contextDesktop.newPage();
await pageDesk.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
await pageDesk.getByRole("button", { name: "Manis" }).first().click();
await pageDesk.screenshot({ path: "/tmp/zen_luxe_desktop_dark.png" });

await browser.close();
server.kill();
console.log("ALL_CAPTURED_SUCCESS");
