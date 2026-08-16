import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = (process.env.INVITE_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.INVITE_TEST_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const browser = await chromium.launch({ headless: true });

async function openCanonicalInvite({ sessionSeen }) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  await context.addInitScript(({ inviteToken, hasSessionSeen }) => {
    // Reproduce a guest who opened an older compatibility URL before /g became
    // canonical. Persistent history must not suppress the first intro of a new
    // browser session, while a repeat open in that same session may skip it.
    window.localStorage.setItem(`wedding-splash:${inviteToken}`, "1");
    const sessionKey = `wedding-splash-seen:${inviteToken}`;
    if (hasSessionSeen) {
      window.sessionStorage.setItem(sessionKey, "1");
    } else {
      window.sessionStorage.removeItem(sessionKey);
    }
  }, { inviteToken: token, hasSessionSeen: sessionSeen });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(`${baseUrl}/g/${encodeURIComponent(token)}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });

  return { context, page, consoleErrors };
}

try {
  const firstSession = await openCanonicalInvite({ sessionSeen: false });
  const splash = firstSession.page.locator("#wedding-splash-screen");
  await splash.waitFor({ state: "visible", timeout: 15_000 });
  const firstState = await firstSession.page.evaluate(() => ({
    splashActive: document.documentElement.classList.contains("splash-active"),
    splashSkipped: document.documentElement.classList.contains("splash-skipped"),
    bodyOverflow: document.body.style.overflow,
  }));
  assert.equal(firstState.splashActive, true, "The canonical /g intro must activate in a new session.");
  assert.equal(firstState.splashSkipped, false, "The canonical /g intro must not be marked as skipped.");
  assert.equal(firstState.bodyOverflow, "hidden", "The page must stay locked behind the intro.");
  assert.deepEqual(firstSession.consoleErrors, []);
  await firstSession.context.close();

  const repeatSession = await openCanonicalInvite({ sessionSeen: true });
  await repeatSession.page.locator("#home").waitFor({ state: "visible", timeout: 15_000 });
  await repeatSession.page.waitForTimeout(500);
  assert.equal(
    await repeatSession.page.locator("#wedding-splash-screen").count(),
    0,
    "A repeat open in the same session may bypass the intro.",
  );
  assert.deepEqual(repeatSession.consoleErrors, []);
  await repeatSession.context.close();

  console.log("Published invite intro checks passed: /g shows the intro once per browser session even when persistent history exists.");
} finally {
  await browser.close();
}
