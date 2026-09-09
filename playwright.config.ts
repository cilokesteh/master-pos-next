import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    browserName: "chromium",
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "tablet", use: { viewport: { width: 820, height: 1180 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, isMobile: true } },
    { name: "mobile-345", use: { viewport: { width: 345, height: 740 }, isMobile: true } },
  ],
  webServer: {
    command: "pnpm build && pnpm exec serve out -l 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 180000,
  },
});
