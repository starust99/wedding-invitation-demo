#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const targetUrl = process.argv[2] || "http://localhost:3000";
const outputDir = process.argv[3] || "output/browser-shots";
const cdpUrl = process.env.CDP_URL || "http://127.0.0.1:9222";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.connectOverCDP(cdpUrl);
const context = browser.contexts()[0] || (await browser.newContext());

for (const viewport of viewports) {
  const page = await context.newPage();
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("body").waitFor({ state: "visible", timeout: 30000 });
  await page.screenshot({
    path: path.join(outputDir, `${viewport.name}.png`),
    fullPage: false,
  });
  await page.close();
  console.log(`${viewport.name}: ${path.join(outputDir, `${viewport.name}.png`)}`);
}

await browser.close();
console.log(`done: ${outputDir}`);
