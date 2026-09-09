import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
for (const [width, height] of [[345, 740], [390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true });
  const page = await context.newPage();
  await page.goto("https://master-pos-next.pages.dev", { waitUntil: "networkidle" });
  await page.screenshot({ path: `/tmp/master-pos-${width}.png`, fullPage: true });
  const audit = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    viewportHeight: innerHeight,
    bodyHeight: document.body.scrollHeight,
    navButtons: [...document.querySelectorAll("nav button")].map((el) => el.textContent?.trim()),
    offenders: [...document.querySelectorAll("body *")]
      .filter((el) => el.getBoundingClientRect().right > innerWidth + 2)
      .slice(0, 15)
      .map((el) => ({ tag: el.tagName, cls: el.className, right: Math.round(el.getBoundingClientRect().right) })),
  }));
  console.log(width, JSON.stringify(audit));
  await context.close();
}
await browser.close();
