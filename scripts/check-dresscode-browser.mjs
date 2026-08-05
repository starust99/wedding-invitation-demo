import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = (process.env.DRESSCODE_TEST_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const token = process.env.DRESSCODE_TEST_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const expectedAssets = [
  "/assets/dresscode-theme-v5.webp",
  "/assets/dresscode-pink-v6.webp",
  "/assets/dresscode-blue-v5.webp",
  "/assets/dresscode-yellow-v5.webp",
  "/assets/dresscode-green-v5.webp",
  "/assets/dresscode-cream-v5.webp",
  "/assets/dresscode-beige-v5.webp",
  "/assets/dresscode-brown-v5.webp",
];
const colorLabels = [
  "Hồng nhạt",
  "Xanh biển nhạt",
  "Vàng nhạt",
  "Xanh lá xô thơm",
  "Kem",
  "Be",
  "Nâu nhạt",
];

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
      "AppleWebKit/605.1.15 Mobile/15E148 Zalo iOS",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  const requestCounts = new Map(expectedAssets.map((asset) => [asset, 0]));
  const requestById = new Map();
  const transferRecords = new Map(expectedAssets.map((asset) => [asset, []]));
  const failedAssets = [];

  cdp.on("Network.requestWillBeSent", ({ requestId, request }) => {
    const pathname = new URL(request.url).pathname;
    if (!transferRecords.has(pathname)) return;
    const record = {
      requestId,
      fromCache: false,
      encodedDataLength: null,
    };
    requestById.set(requestId, { pathname, record });
    transferRecords.get(pathname).push(record);
  });
  cdp.on("Network.requestServedFromCache", ({ requestId }) => {
    const tracked = requestById.get(requestId);
    if (tracked) tracked.record.fromCache = true;
  });
  cdp.on("Network.responseReceived", ({ requestId, response }) => {
    const tracked = requestById.get(requestId);
    if (tracked && (response.fromDiskCache || response.fromPrefetchCache)) {
      tracked.record.fromCache = true;
    }
  });
  cdp.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => {
    const tracked = requestById.get(requestId);
    if (tracked) tracked.record.encodedDataLength = encodedDataLength;
  });

  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (requestCounts.has(pathname)) {
      requestCounts.set(pathname, requestCounts.get(pathname) + 1);
    }
  });
  page.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    if (requestCounts.has(pathname) && !response.ok()) {
      failedAssets.push(`${pathname}: ${response.status()}`);
    }
  });
  await page.goto(`${baseUrl}/i/${token}?intro=1`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  const openButton = page.getByRole("button", {
    name: "Chạm để mở thiệp cưới",
    exact: true,
  });
  await openButton.waitFor({ state: "visible", timeout: 120_000 });

  assert.deepEqual(failedAssets, [], "Every preloaded dress-code asset must return successfully.");
  for (const asset of expectedAssets) {
    assert.equal(
      requestCounts.get(asset),
      1,
      `${asset} must be requested exactly once during the splash preload phase.`,
    );
  }

  await openButton.click();
  await page.locator("#wedding-splash-screen").waitFor({ state: "detached", timeout: 15_000 });

  const palette = page.getByRole("group", { name: "Chọn màu trang phục" });
  await palette.scrollIntoViewIfNeeded();
  await palette.waitFor({ state: "visible", timeout: 10_000 });

  for (const label of colorLabels) {
    await page.getByRole("button", { name: `Xem gợi ý phối đồ màu ${label}` }).click();
    await page.waitForTimeout(450);
  }

  for (const asset of expectedAssets) {
    const records = transferRecords.get(asset);
    const networkTransfers = records.filter(
      (record) =>
        !record.fromCache &&
        record.encodedDataLength !== null &&
        record.encodedDataLength > 0,
    );
    assert.equal(
      networkTransfers.length,
      1,
      `${asset} transferred bytes more than once: ${JSON.stringify(records)}.`,
    );
  }

  console.log(
    "Dress-code browser check passed: all eight images loaded in the splash gate and seven color changes reused cache entries.",
  );
} finally {
  await browser.close();
}
