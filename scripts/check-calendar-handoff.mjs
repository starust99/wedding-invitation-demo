import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import ts from "typescript";

const handoffModuleUrl = new URL("../src/lib/calendar-handoff.ts", import.meta.url);
const handoffSource = await readFile(handoffModuleUrl, "utf8");
const transpiledHandoff = ts.transpileModule(handoffSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const handoffModule = await import(
  `data:text/javascript;base64,${Buffer.from(transpiledHandoff.outputText).toString("base64")}`
);
const {
  CALENDAR_HANDOFF_HELP_DELAY_MS,
  getCalendarHandoffGuidance,
} = handoffModule;

const cases = [
  {
    name: "iPhone Safari explains a downloaded calendar file",
    environment: {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
      platform: "iPhone",
      maxTouchPoints: 5,
    },
    expectedKind: "downloaded-file",
    expected: /Mở mục Tải về.*chọn Thêm/,
  },
  {
    name: "iPhone Zalo points to Safari",
    environment: {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Zalo/24.7.2",
      platform: "iPhone",
      maxTouchPoints: 5,
    },
    expectedKind: "external-browser",
    expected: /Trên Zalo:.*Mở bằng Safari/,
  },
  {
    name: "Android Zalo points to Chrome",
    environment: {
      userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/132.0.0.0 Mobile Safari/537.36 Zalo android",
      platform: "Linux armv8l",
      maxTouchPoints: 5,
    },
    expectedKind: "external-browser",
    expected: /Trên Zalo:.*Mở bằng Chrome/,
  },
  {
    name: "iPhone Messenger uses its menu",
    environment: {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/MessengerForiOS;FBAV/514.0]",
      platform: "iPhone",
      maxTouchPoints: 5,
    },
    expectedKind: "external-browser",
    expected: /Trên Messenger:.*Mở bằng Safari/,
  },
  {
    name: "Android Telegram points to Chrome",
    environment: {
      userAgent: "Mozilla/5.0 (Linux; Android 15; wv) AppleWebKit/537.36 Version/4.0 Chrome/136.0 Mobile Safari/537.36 Telegram",
      platform: "Linux armv8l",
      maxTouchPoints: 5,
    },
    expectedKind: "external-browser",
    expected: /Trên Telegram:.*Mở bằng Chrome/,
  },
  {
    name: "Android KakaoTalk uses its real menu label",
    environment: {
      userAgent: "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 KAKAOTALK 25.6.2",
      platform: "Linux armv8l",
      maxTouchPoints: 5,
    },
    expectedKind: "external-browser",
    expected: /다른 브라우저로 열기/,
  },
  {
    name: "iPhone WhatsApp explains the long-press fallback",
    environment: {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 WhatsApp/2.25.20",
      platform: "iPhone",
      maxTouchPoints: 5,
    },
    expectedKind: "external-browser",
    expected: /Trên WhatsApp:.*chạm giữ liên kết.*Safari/,
  },
  {
    name: "unnamed iOS WebView gets generic Safari help",
    environment: {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      platform: "iPhone",
      maxTouchPoints: 5,
    },
    expectedKind: "external-browser",
    expected: /biểu tượng chia sẻ.*Safari/,
  },
  {
    name: "unnamed Android WebView gets generic Chrome help",
    environment: {
      userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9 Build/AP3A; wv) AppleWebKit/537.36 Version/4.0 Chrome/136.0 Mobile Safari/537.36",
      platform: "Linux armv8l",
      maxTouchPoints: 5,
    },
    expectedKind: "external-browser",
    expected: /biểu tượng chia sẻ.*Chrome/,
  },
  {
    name: "macOS Chrome explains the downloaded calendar file",
    environment: {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136.0 Safari/537.36",
      platform: "MacIntel",
      maxTouchPoints: 0,
    },
    expectedKind: "downloaded-file",
    expected: /Mở tệp lịch vừa tải xuống.*ứng dụng Lịch/,
  },
  {
    name: "Windows Chrome explains Outlook or Calendar",
    environment: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0 Safari/537.36",
      platform: "Win32",
      maxTouchPoints: 0,
    },
    expectedKind: "downloaded-file",
    expected: /Outlook hoặc ứng dụng Lịch/,
  },
  {
    name: "ordinary Android Chrome stays silent for its Google Calendar redirect",
    environment: {
      userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/136.0 Mobile Safari/537.36",
      platform: "Linux armv8l",
      maxTouchPoints: 5,
    },
    expected: null,
  },
];

for (const testCase of cases) {
  const result = getCalendarHandoffGuidance(testCase.environment);
  if (testCase.expected === null) {
    assert.equal(result, null, testCase.name);
  } else {
    assert.ok(result, `${testCase.name}: expected guidance`);
    assert.equal(result.kind, testCase.expectedKind, testCase.name);
    assert.match(result.message, testCase.expected, testCase.name);
  }
}

assert.equal(CALENDAR_HANDOFF_HELP_DELAY_MS, 2_800);

const rsvpSource = await readFile(new URL("../src/app/rsvp/page.tsx", import.meta.url), "utf8");
assert.equal((rsvpSource.match(/onClick=\{handleCalendarHandoffAttempt\}/g) || []).length, 2);
assert.match(rsvpSource, /aria-live="polite"/);
assert.match(rsvpSource, /Chưa mở được lịch\?/);

const e2eBaseUrl = process.env.CALENDAR_HANDOFF_E2E_BASE_URL?.replace(/\/$/, "");

async function openSubmittedRsvp(browser, userAgent) {
  const context = await browser.newContext({
    userAgent,
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(() => {
    window.sessionStorage.setItem("admin_rsvp_bypass", "true");
    window.addEventListener("click", (event) => {
      const target = event.target;
      const calendarLink = target instanceof Element
        ? target.closest('a[href^="/calendar/"]')
        : null;
      if (calendarLink) event.preventDefault();
    }, true);
  });

  const page = await context.newPage();
  await page.route("**/api/rsvp", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ response: { id: "calendar-handoff-check" } }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`${e2eBaseUrl}/rsvp`, { waitUntil: "domcontentloaded" });
  await page.getByText("THÁNH LỄ HÔN PHỐI", { exact: true }).waitFor({ timeout: 15_000 });

  const yesButtons = page.getByRole("button", { name: "Có", exact: true });
  assert.equal(await yesButtons.count(), 2);
  await yesButtons.nth(0).click();
  await yesButtons.nth(1).click();
  await page.getByRole("button", { name: "Không nghỉ lại", exact: true }).click();
  await page.getByRole("button", { name: "XEM LẠI VÀ HOÀN TẤT", exact: true }).click();
  await page.getByRole("heading", { name: "Xác nhận thông tin hồi đáp", exact: true }).waitFor();
  await page.getByRole("button", { name: "Xác nhận gửi hồi đáp", exact: true }).click();
  await page.getByText("Thêm vào lịch", { exact: true }).waitFor();

  return { context, page };
}

if (e2eBaseUrl) {
  const browser = await chromium.launch({ headless: true });
  try {
    const zalo = await openSubmittedRsvp(browser, cases[1].environment.userAgent);
    await zalo.page.getByRole("link", { name: "THÁNH LỄ", exact: true }).click();
    await zalo.page.getByText(/Chưa mở được lịch\?.*Trên Zalo:/).waitFor({
      timeout: CALENDAR_HANDOFF_HELP_DELAY_MS + 2_000,
    });
    if (process.env.CALENDAR_HANDOFF_SCREENSHOT) {
      await zalo.page.screenshot({ path: process.env.CALENDAR_HANDOFF_SCREENSHOT });
    }

    await zalo.page.getByRole("link", { name: "THÁNH LỄ", exact: true }).click();
    await zalo.page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await zalo.page.waitForTimeout(CALENDAR_HANDOFF_HELP_DELAY_MS + 300);
    assert.equal(
      await zalo.page.getByText(/Chưa mở được lịch\?/).count(),
      0,
      "A blur signal must cancel pending fallback help.",
    );
    await zalo.context.close();

    const safari = await openSubmittedRsvp(browser, cases[0].environment.userAgent);
    await safari.page.getByRole("link", { name: "THÁNH LỄ", exact: true }).click();
    await safari.page.getByText(/Chưa mở được lịch\?.*Mở mục Tải về/).waitFor({
      timeout: CALENDAR_HANDOFF_HELP_DELAY_MS + 2_000,
    });
    if (process.env.CALENDAR_HANDOFF_DOWNLOAD_SCREENSHOT) {
      await safari.page.screenshot({ path: process.env.CALENDAR_HANDOFF_DOWNLOAD_SCREENSHOT });
    }

    await safari.page.getByRole("link", { name: "THÁNH LỄ", exact: true }).click();
    await safari.page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await safari.page.waitForTimeout(CALENDAR_HANDOFF_HELP_DELAY_MS + 300);
    assert.equal(
      await safari.page.getByText(/Chưa mở được lịch\?/).count(),
      0,
      "A successful Safari handoff signal must cancel downloaded-file recovery help.",
    );
    await safari.context.close();
  } finally {
    await browser.close();
  }
}

console.log(`Calendar handoff checks passed: named app guidance, generic WebView fallback, device-specific downloaded-file recovery, Android silence, delayed inline help, unchanged links${e2eBaseUrl ? ", and browser behavior" : ""}.`);
