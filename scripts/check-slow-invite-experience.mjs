import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = (process.env.INVITE_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.INVITE_TEST_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const networkKbps = Number(process.env.INVITE_TEST_KBPS || 0);
const framePath = (folder, index) =>
  `public/assets/${folder}/frame_${String(index).padStart(3, "0")}.webp`;

const applyNetworkProfile = async (page) => {
  if (!Number.isFinite(networkKbps) || networkKbps <= 0) return;
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (networkKbps * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: "cellular3g",
  });
};

const totalBytes = async (folder, count) =>
  (await Promise.all(
    Array.from({ length: count }, (_, index) =>
      stat(framePath(folder, index + 1))),
  )).reduce((total, file) => total + file.size, 0);

const [desktopSplashBytes, iPadDesktopSplashBytes, mobileSplashBytes, timelineBytes] = await Promise.all([
  totalBytes("splash-frames-desktop", 109),
  totalBytes("splash-frames-desktop-ipad", 109),
  totalBytes("splash-frames-mobile", 109),
  totalBytes("timeline-frames", 108),
]);
assert.ok(
  desktopSplashBytes < 9 * 1024 * 1024,
  `Desktop splash frames exceed 9 MiB: ${(desktopSplashBytes / 1024 / 1024).toFixed(2)} MiB.`,
);
assert.ok(
  iPadDesktopSplashBytes < 6 * 1024 * 1024,
  `iPad desktop splash frames exceed 6 MiB: ${(iPadDesktopSplashBytes / 1024 / 1024).toFixed(2)} MiB.`,
);
assert.ok(
  mobileSplashBytes < 7 * 1024 * 1024,
  `Mobile splash frames exceed 7 MiB: ${(mobileSplashBytes / 1024 / 1024).toFixed(2)} MiB.`,
);
assert.ok(
  timelineBytes < 9 * 1024 * 1024,
  `Timeline frames exceed 9 MiB: ${(timelineBytes / 1024 / 1024).toFixed(2)} MiB.`,
);

const browser = await chromium.launch({ headless: true });

try {
  const iPadContextOptions = {
    // Messenger can expose a sub-768px content viewport on an iPad. Portrait
    // deliberately uses the mobile composition; landscape uses desktop-iPad.
    viewport: { width: 744, height: 992 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    reducedMotion: "no-preference",
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 FBAN/MessengerForiOS",
  };

  const fallbackContext = await browser.newContext(iPadContextOptions);
  const fallbackPage = await fallbackContext.newPage();
  await applyNetworkProfile(fallbackPage);
  const fallbackConsoleErrors = [];
  const iPadDesktopSplashRequests = new Set();
  const fullDesktopSplashRequests = new Set();
  const mobileSplashRequests = new Set();
  let inviteApiRequests = 0;

  fallbackPage.on("console", (message) => {
    if (message.type() === "error") fallbackConsoleErrors.push(message.text());
  });
  fallbackPage.on("request", (request) => {
    const url = request.url();
    if (url.includes(`/api/invites/${token}`)) inviteApiRequests += 1;
    if (url.includes("/assets/splash-frames-desktop-ipad/")) {
      iPadDesktopSplashRequests.add(new URL(url).pathname);
    } else if (url.includes("/assets/splash-frames-desktop/")) {
      fullDesktopSplashRequests.add(new URL(url).pathname);
    }
    if (url.includes("/assets/splash-frames-mobile/")) {
      mobileSplashRequests.add(new URL(url).pathname);
    }
  });
  await fallbackPage.route("**/assets/timeline-frames/**", async (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/frame_001.webp")) {
      await route.continue();
    } else {
      await route.abort("failed");
    }
  });

  await fallbackPage.goto(`${baseUrl}/i/${token}?intro=1`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  const splash = fallbackPage.locator("#wedding-splash-screen");
  const openButton = fallbackPage.getByRole("button", {
    name: "Chạm để mở thiệp cưới",
    exact: true,
  });
  const hero = fallbackPage.locator("#home");

  await openButton.waitFor({ state: "visible", timeout: 120_000 });
  assert.equal(
    mobileSplashRequests.size,
    109,
    `A portrait iPad WebView must preload all 109 mobile splash frames; observed ${mobileSplashRequests.size}.`,
  );
  assert.equal(
    iPadDesktopSplashRequests.size,
    0,
    "A portrait iPad must not request the desktop-iPad splash sequence.",
  );
  assert.equal(
    fullDesktopSplashRequests.size,
    0,
    "A portrait iPad must not decode the full 1920×1080 desktop frame set.",
  );
  assert.ok(
    (await hero.getAttribute("class"))?.includes("hero-preparing"),
    "Hero must remain prepared and hidden before the splash opens.",
  );

  const preparingOpacityWithSkipClass = await fallbackPage.evaluate(() => {
    const root = document.documentElement;
    const logo = document.querySelector("#home .hero-logo-fade");
    const photo = document.querySelector("#home .hero-photo-fade");
    root.classList.add("splash-skipped");
    const opacity = {
      logo: logo ? Number(getComputedStyle(logo).opacity) : 1,
      photo: photo ? Number(getComputedStyle(photo).opacity) : 1,
    };
    root.classList.remove("splash-skipped");
    return opacity;
  });
  assert.equal(
    preparingOpacityWithSkipClass.logo,
    0,
    "The preparing hero logo must stay hidden when splash-skipped changes before React commits.",
  );
  assert.equal(
    preparingOpacityWithSkipClass.photo,
    0,
    "The preparing hero photo must stay hidden when splash-skipped changes before React commits.",
  );

  await fallbackPage.evaluate(() => {
    window.__heroHandoffSamples = [];
    window.__stopHeroHandoffSampling = false;

    const sampleHeroHandoff = () => {
      const currentHero = document.querySelector("#home");
      const logo = document.querySelector("#home .hero-logo-fade");
      if (currentHero && logo) {
        window.__heroHandoffSamples.push({
          heroClass: currentHero.className,
          logoOpacity: Number(getComputedStyle(logo).opacity),
          splashPresent: Boolean(document.querySelector("#wedding-splash-screen")),
        });
      }

      if (!window.__stopHeroHandoffSampling) {
        requestAnimationFrame(sampleHeroHandoff);
      }
    };

    requestAnimationFrame(sampleHeroHandoff);
  });

  await openButton.click();
  const splashCanvas = splash.locator("canvas");
  await splashCanvas.waitFor({ state: "visible", timeout: 10_000 });
  assert.deepEqual(
    await splashCanvas.evaluate((canvas) => ({
      width: canvas.width,
      height: canvas.height,
    })),
    { width: 720, height: 1280 },
    "Portrait iPad must render the mobile 720×1280 splash sequence.",
  );
  await fallbackPage.waitForTimeout(1_000);
  assert.ok(
    (await hero.getAttribute("class"))?.includes("hero-preparing"),
    "Opening the envelope must not start the hero animation behind the splash.",
  );

  await splash.waitFor({ state: "detached", timeout: 15_000 });
  await fallbackPage.waitForFunction(() =>
    document.querySelector("#home")?.classList.contains("hero-animating"),
  );

  await fallbackPage.waitForTimeout(100);
  const heroHandoffSamples = await fallbackPage.evaluate(() => {
    window.__stopHeroHandoffSampling = true;
    return window.__heroHandoffSamples;
  });
  const exposedPreparingFrames = heroHandoffSamples.filter(
    (sample) => sample.heroClass.includes("hero-preparing") && sample.logoOpacity > 0.001,
  );
  assert.deepEqual(
    exposedPreparingFrames,
    [],
    "No animation frame may expose the complete hero while React still reports hero-preparing.",
  );

  const heroLogo = fallbackPage.locator("#home .hero-logo-fade").first();
  const runningLogoAnimations = await heroLogo.evaluate((element) =>
    element.getAnimations().filter((animation) => animation.playState === "running").length,
  );
  assert.ok(
    runningLogoAnimations > 0,
    "The names-logo reveal must start only after the splash has fully detached.",
  );

  const timelineWrap = fallbackPage.locator(".timeline-path-video-wrap").first();
  await timelineWrap.scrollIntoViewIfNeeded();
  await timelineWrap.waitFor({ state: "visible" });
  const timelinePoster = timelineWrap.locator(
    'img.timeline-path-poster[src="/assets/timeline-frames/frame_001.webp"]',
  );
  await timelinePoster.waitFor({ state: "visible" });
  assert.equal(
    await timelinePoster.getAttribute("src"),
    "/assets/timeline-frames/frame_001.webp",
    "The timeline must retain the exact first frame as its poster while remaining frames are unavailable.",
  );

  const fallbackCanvas = timelineWrap.locator("canvas.timeline-road-motion");
  await fallbackPage.waitForFunction(() => {
    const canvas = document.querySelector(
      ".event-details-timeline-scene .timeline-path-video-wrap canvas.timeline-road-motion",
    );
    return canvas instanceof HTMLCanvasElement && canvas.width === 720 && canvas.height === 1280;
  });
  const timelineGeometry = await fallbackCanvas.evaluate((canvas) => {
    const media = canvas.parentElement;
    const outerWrap = media?.parentElement;
    const mediaRect = media?.getBoundingClientRect();
    const outerRect = outerWrap?.getBoundingClientRect();
    const posterRect = media?.querySelector(".timeline-path-poster")?.getBoundingClientRect();
    const feather = media ? getComputedStyle(media, "::after") : null;
    return {
      frameRatio: canvas.width / canvas.height,
      wrapRatio: mediaRect ? mediaRect.width / mediaRect.height : 0,
      mediaWidth: mediaRect?.width || 0,
      outerWidth: outerRect?.width || 0,
      posterWidth: posterRect?.width || 0,
      posterHeight: posterRect?.height || 0,
      canvasWidth: canvas.getBoundingClientRect().width,
      canvasHeight: canvas.getBoundingClientRect().height,
      featherContent: feather?.content || "none",
      featherBlur: feather?.backdropFilter || feather?.webkitBackdropFilter || "none",
    };
  });
  assert.ok(
    Math.abs(timelineGeometry.frameRatio - timelineGeometry.wrapRatio) < 0.02,
    `Timeline media and canvas must share a 9:16 stage; observed frame ${timelineGeometry.frameRatio.toFixed(3)} and media ${timelineGeometry.wrapRatio.toFixed(3)}.`,
  );
  assert.ok(
    timelineGeometry.outerWidth > timelineGeometry.mediaWidth,
    "The original wide timeline scene must remain intact around the centered media frame.",
  );
  assert.deepEqual(
    {
      width: timelineGeometry.posterWidth,
      height: timelineGeometry.posterHeight,
    },
    {
      width: timelineGeometry.canvasWidth,
      height: timelineGeometry.canvasHeight,
    },
    "Timeline poster and animated canvas must occupy identical media bounds.",
  );
  assert.notEqual(
    timelineGeometry.featherContent,
    "none",
    "The edge feather must be attached to the exact media frame.",
  );
  assert.notEqual(
    timelineGeometry.featherBlur,
    "none",
    "The timeline edge feather must retain a real blur.",
  );
  assert.equal(
    await fallbackCanvas.evaluate((element) => element.classList.contains("is-ready")),
    false,
    "An incomplete frame set must not start a janky timeline loop.",
  );

  const unexpectedFallbackErrors = fallbackConsoleErrors.filter(
    (message) => !message.includes("Failed to load resource"),
  );
  assert.deepEqual(
    unexpectedFallbackErrors,
    [],
    `Unexpected fallback console errors: ${unexpectedFallbackErrors.join(" | ")}`,
  );
  await fallbackContext.close();

  const landscapeContext = await browser.newContext({
    ...iPadContextOptions,
    viewport: { width: 992, height: 744 },
  });
  const landscapePage = await landscapeContext.newPage();
  await applyNetworkProfile(landscapePage);
  const landscapeIPadRequests = new Set();
  const landscapeMobileRequests = new Set();
  const landscapeFullDesktopRequests = new Set();
  landscapePage.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.includes("/assets/splash-frames-desktop-ipad/")) {
      landscapeIPadRequests.add(pathname);
    } else if (pathname.includes("/assets/splash-frames-desktop/")) {
      landscapeFullDesktopRequests.add(pathname);
    }
    if (pathname.includes("/assets/splash-frames-mobile/")) {
      landscapeMobileRequests.add(pathname);
    }
  });
  await landscapePage.goto(`${baseUrl}/i/${token}?intro=1`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await landscapePage.getByRole("button", {
    name: "Chạm để mở thiệp cưới",
    exact: true,
  }).waitFor({ state: "visible", timeout: 120_000 });
  assert.equal(
    landscapeIPadRequests.size,
    109,
    `A landscape iPad must preload all 109 desktop-iPad splash frames; observed ${landscapeIPadRequests.size}.`,
  );
  assert.equal(
    landscapeMobileRequests.size,
    0,
    "A landscape iPad must not request the mobile splash sequence.",
  );
  assert.equal(
    landscapeFullDesktopRequests.size,
    0,
    "A landscape iPad must not decode the full 1920×1080 desktop frame set.",
  );
  await landscapeContext.close();

  const zaloContext = await browser.newContext({
    ...iPadContextOptions,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Mobile/15E148 Zalo/24.7.2",
  });
  await zaloContext.addInitScript((inviteToken) => {
    window.localStorage.setItem(`wedding-splash:${inviteToken}`, "1");
    window.sessionStorage.setItem(`wedding-splash-seen:${inviteToken}`, "1");
  }, token);
  const zaloPage = await zaloContext.newPage();
  await applyNetworkProfile(zaloPage);
  const zaloConsoleErrors = [];
  const requestedTimelineFrames = new Set();
  const requestedTimelineVideos = [];

  zaloPage.on("console", (message) => {
    if (message.type() === "error") zaloConsoleErrors.push(message.text());
  });
  zaloPage.on("request", (request) => {
    const url = request.url();
    if (url.includes(`/api/invites/${token}`)) inviteApiRequests += 1;
    if (url.includes("/assets/timeline-frames/")) {
      requestedTimelineFrames.add(new URL(url).pathname);
    }
    if (url.includes("/assets/timeline-path.mp4") || url.includes("/assets/timeline-path-web.webm")) {
      requestedTimelineVideos.push(url);
    }
  });

  await zaloPage.goto(`${baseUrl}/i/${token}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await zaloPage.waitForFunction(() => {
    const timeline = document.querySelector(".timeline-path-video-wrap");
    if (!timeline) return false;
    timeline.scrollIntoView({ block: "center" });
    return true;
  });
  const zaloTimeline = zaloPage.locator(".timeline-path-video-wrap").first();
  const readyCanvas = zaloTimeline.locator("canvas.timeline-road-motion");
  await zaloPage.waitForFunction(() =>
    document.querySelector(".timeline-path-video-wrap canvas.timeline-road-motion")
      ?.classList.contains("is-ready"),
  undefined, { timeout: 120_000 });

  assert.equal(
    requestedTimelineFrames.size,
    108,
    `Zalo must load the complete 108-frame timeline; observed ${requestedTimelineFrames.size}.`,
  );
  assert.deepEqual(
    requestedTimelineVideos,
    [],
    "Timeline must not substitute MP4/WebM for the required frame sequence.",
  );
  const timelineTransferBytes = await zaloPage.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => entry.name.includes("/assets/timeline-frames/"))
      .reduce((total, entry) => total + (entry.transferSize || 0), 0),
  );
  assert.ok(
    timelineTransferBytes < 10 * 1024 * 1024,
    `Timeline frame transfer must remain below 10 MiB; observed ${(timelineTransferBytes / 1024 / 1024).toFixed(2)} MiB.`,
  );

  const firstCanvasSample = await readyCanvas.screenshot();
  await zaloPage.waitForTimeout(300);
  const secondCanvasSample = await readyCanvas.screenshot();
  assert.notDeepEqual(
    firstCanvasSample,
    secondCanvasSample,
    "The ready 108-frame canvas must advance between samples.",
  );

  assert.ok(
    inviteApiRequests <= 4,
    `Invite cache synchronization must not loop API requests; observed ${inviteApiRequests}.`,
  );
  assert.deepEqual(
    zaloConsoleErrors,
    [],
    `Zalo console errors: ${zaloConsoleErrors.join(" | ")}`,
  );
  await zaloContext.close();

  console.log(
    "Slow invitation experience passed: portrait iPad uses mobile splash, landscape iPad uses desktop splash, and the feathered Zalo timeline runs all 108 frames.",
  );
} finally {
  await browser.close();
}
