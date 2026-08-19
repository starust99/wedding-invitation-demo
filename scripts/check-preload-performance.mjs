import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";

const baseUrl = (process.env.INVITE_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const token = process.env.INVITE_TEST_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const networkKbps = Number(process.env.INVITE_TEST_KBPS || 3000);
const assertBudgets = process.env.PRELOAD_ASSERT_BUDGETS === "1";

async function prepareContext(browserType, options) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext(options);
  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.__weddingPreloadMetric = null;
    window.addEventListener("weddingPreloadReady", (event) => {
      window.__weddingPreloadMetric = event.detail;
    });
  });
  return { browser, context };
}

async function runChromiumProfile() {
  const { browser, context } = await prepareContext(chromium, {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.setCacheDisabled", { cacheDisabled: true });
  await session.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (networkKbps * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: "cellular3g",
  });

  const mobileFrames = new Set();
  const otherSplashFrames = new Set();
  const dressRequests = new Set();
  let assetRequests = 0;
  let audioRequests = 0;
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.includes("/assets/")) assetRequests += 1;
    if (pathname.endsWith("/assets/audio/co-chut-ngot-ngao.mp3")) audioRequests += 1;
    if (pathname.includes("/assets/splash-frames-mobile/")) mobileFrames.add(pathname);
    if (pathname.includes("/assets/splash-frames-desktop-ipad/") || pathname.includes("/assets/splash-frames-desktop/")) {
      otherSplashFrames.add(pathname);
    }
    if (/\/assets\/dresscode-(theme|pink|blue|yellow|green|cream|beige|brown)-/.test(pathname)) {
      dressRequests.add(pathname);
    }
  });

  const navigationStartedAt = Date.now();
  let firstVisibleProgressMs = null;
  let tenPercentMs = null;
  await page.goto(`${baseUrl}/g/${encodeURIComponent(token)}?intro=1`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  const openButton = page.getByRole("button", { name: "Chạm để mở thiệp cưới", exact: true });
  while (!(await openButton.isVisible().catch(() => false))) {
    const copy = await page.locator("#wedding-splash-screen p").last().textContent().catch(() => "");
    const progress = Number(copy?.match(/(\d+)%/)?.[1] || 0);
    const elapsed = Date.now() - navigationStartedAt;
    if (progress > 0 && firstVisibleProgressMs === null) firstVisibleProgressMs = elapsed;
    if (progress >= 10 && tenPercentMs === null) tenPercentMs = elapsed;
    if (elapsed > 120_000) throw new Error("The /g preload did not become ready within 120 seconds.");
    await page.waitForTimeout(100);
  }

  const readyMs = Date.now() - navigationStartedAt;
  const componentMetric = await page.evaluate(() => window.__weddingPreloadMetric);
  assert.equal(mobileFrames.size, 109, `Mobile /g must load all 109 splash frames; observed ${mobileFrames.size}.`);
  assert.equal(otherSplashFrames.size, 0, "Mobile /g must not fetch a desktop splash sequence.");
  assert.equal(audioRequests, 1, `The full wedding track must use one network request; observed ${audioRequests}.`);
  assert.ok(componentMetric, "The preload component must publish its timing metric.");
  assert.ok(componentMetric.criticalBytes < 11 * 1024 * 1024, `Critical lane exceeds 11 MiB: ${componentMetric.criticalBytes}.`);
  assert.deepEqual(
    await page.locator("#wedding-audio").evaluate((audio) => ({
      preloadedBlob: audio.dataset.preloadedBlob,
      usesBlob: audio.src.startsWith("blob:"),
    })),
    { preloadedBlob: "1", usesBlob: true },
    "The complete original wedding track must be ready as a local blob before opening.",
  );

  if (assertBudgets) {
    assert.ok(firstVisibleProgressMs !== null && firstVisibleProgressMs <= 5_000, `First progress exceeded 5s: ${firstVisibleProgressMs}ms.`);
    assert.ok(tenPercentMs !== null && tenPercentMs <= 10_000, `10% progress exceeded 10s: ${tenPercentMs}ms.`);
    assert.ok(readyMs <= 38_000, `3 Mbps cold-cache preload exceeded 38s: ${readyMs}ms.`);
  }

  const openingStartedAt = Date.now();
  await openButton.click();
  const canvas = page.locator("#wedding-splash-screen canvas");
  await canvas.waitFor({ state: "visible", timeout: 10_000 });
  assert.deepEqual(await canvas.evaluate((element) => ({ width: element.width, height: element.height })), {
    width: 720,
    height: 1280,
  });
  await page.waitForFunction(() => {
    const audio = document.querySelector("#wedding-audio");
    return audio instanceof HTMLAudioElement && !audio.paused;
  }, undefined, { timeout: 5_000 });
  await page.locator("#wedding-splash-screen").waitFor({ state: "detached", timeout: 15_000 });
  const openingDurationMs = Date.now() - openingStartedAt;
  assert.ok(
    openingDurationMs >= 5_900 && openingDurationMs <= 8_500,
    `The unchanged splash handoff must remain near 6.4s; observed ${openingDurationMs}ms.`,
  );
  await page.waitForFunction(() => document.querySelector("#home")?.classList.contains("hero-animating"));

  const result = {
    engine: "chromium",
    networkKbps,
    firstVisibleProgressMs,
    tenPercentMs,
    readyMs,
    componentMetric,
    mobileFrameRequests: mobileFrames.size,
    deferredDressRequestsByGateReady: dressRequests.size,
    assetRequests,
    audioRequests,
    openingDurationMs,
  };
  await browser.close();
  return result;
}

async function runWebKitContract() {
  const { browser, context } = await prepareContext(webkit, {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
      "AppleWebKit/605.1.15 Mobile/15E148 Zalo/24.7.2",
  });
  const page = await context.newPage();
  const mobileFrames = new Set();
  const consoleErrors = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.includes("/assets/splash-frames-mobile/")) mobileFrames.add(pathname);
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(`${baseUrl}/g/${encodeURIComponent(token)}?intro=1`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const openButton = page.getByRole("button", { name: "Chạm để mở thiệp cưới", exact: true });
  await openButton.waitFor({ state: "visible", timeout: 60_000 });
  assert.equal(mobileFrames.size, 109, `WebKit /g must load all 109 mobile splash frames; observed ${mobileFrames.size}.`);
  assert.deepEqual(consoleErrors, [], `WebKit console errors: ${consoleErrors.join(" | ")}`);
  const componentMetric = await page.evaluate(() => window.__weddingPreloadMetric);
  assert.ok(componentMetric, "WebKit must publish its preload timing metric.");
  await browser.close();
  return { engine: "webkit", componentMetric, mobileFrameRequests: mobileFrames.size };
}

async function runTabletContract(viewport, expectedFolder) {
  const { browser, context } = await prepareContext(chromium, {
    viewport,
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 FBAN/MessengerForiOS",
  });
  const page = await context.newPage();
  const expectedFrames = new Set();
  const unexpectedFrames = new Set();
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (!pathname.includes("/assets/splash-frames-")) return;
    if (pathname.includes(`/assets/${expectedFolder}/`)) expectedFrames.add(pathname);
    else unexpectedFrames.add(pathname);
  });
  await page.goto(`${baseUrl}/g/${encodeURIComponent(token)}?intro=1`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.getByRole("button", { name: "Chạm để mở thiệp cưới", exact: true })
    .waitFor({ state: "visible", timeout: 60_000 });
  assert.equal(expectedFrames.size, 109, `${expectedFolder} must contain all 109 requested frames.`);
  assert.equal(unexpectedFrames.size, 0, `Tablet requested an incorrect splash lane: ${[...unexpectedFrames][0] || "unknown"}.`);
  const componentMetric = await page.evaluate(() => window.__weddingPreloadMetric);
  await browser.close();
  return { engine: "chromium-tablet", viewport, expectedFolder, componentMetric };
}

const results = [
  await runChromiumProfile(),
  await runWebKitContract(),
  await runTabletContract({ width: 744, height: 992 }, "splash-frames-mobile"),
  await runTabletContract({ width: 992, height: 744 }, "splash-frames-desktop-ipad"),
];
console.log(JSON.stringify(results, null, 2));
