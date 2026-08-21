import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseUrl = (process.env.RSVP_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const suppliedQrSha256 = "14e0bdc252d5f5f160eddd1de11c807580051c4bb46e967072be728154f02c17";
const screenshotDir = process.env.RSVP_WISH_SCREENSHOT_DIR;
if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });

function source(path) {
  return readFileSync(join(rootDir, path), "utf8");
}

const qr = readFileSync(join(rootDir, "public/assets/wedding/ui/rsvp/cash-gift-qr.png"));
assert.equal(createHash("sha256").update(qr).digest("hex"), suppliedQrSha256);

const migration = source("supabase/migrations/20260822_minimize_guest_rsvp_data.sql");
assert.match(migration, /wish_message text/);
assert.match(migration, /wish_sent_at timestamptz/);
assert.match(migration, /char_length\(wish_message\) between 1 and 500/);
assert.match(migration, /notify pgrst, 'reload schema'/);

const routeSource = source("src/app/api/invites/[token]/wish/route.ts");
assert.match(routeSource, /rsvpWishSchema\.safeParse/);
assert.match(routeSource, /\.is\("wish_message", null\)/);
assert.doesNotMatch(routeSource, /Legacy|notes/);
assert.match(routeSource, /status: 409/);
assert.doesNotMatch(source("src/app/api/invites/[token]/rsvp/route.ts"), /Legacy|notes/);

const pageSource = source("src/app/rsvp/page.tsx");
assert.match(pageSource, /cash-gift-qr\.png/);
assert.match(pageSource, /unoptimized/);
assert.match(pageSource, /RSVP_WISH_MAX_LENGTH/);

const adminSource = source("src/components/admin/InviteAdminPanel.tsx");
assert.match(adminSource, /Lời chúc: tất cả/);
assert.match(adminSource, /response\.wishMessage/);
assert.match(source("src/lib/csv.ts"), /Thời gian gửi lời chúc/);
assert.match(source("src/app/api/admin/rsvp-workbook/route.ts"), /Số lời chúc đã nhận/);

const token = "rsvp-wish-browser-test";
const now = "2026-08-18T00:00:00.000Z";
const invitee = {
  id: "77777777-7777-4777-8777-777777777777",
  token,
  inviteUnit: "individual",
  guestName: "Chị An",
  displayLabel: "Chị An",
  salutationCluster: "Chị",
  displaySalutation: "Chị An",
  invitationName: "Chị An",
  honorific: "Chị",
  envelopeLine: "Chị An",
  insideInviteLine: "Chị An",
  invitedBy: "couple",
  relationship: "Bạn",
  hostRelationship: "Bạn",
  hostPronoun: "mình",
  coupleReference: "Nhật & Phương",
  householdMode: "single",
  plusOnePolicy: "none",
  guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
  audienceTags: [],
  expectedGuestCount: 1,
  postCeremonyPartyInvited: false,
  notes: "",
  inviteStatus: "invited",
  createdAt: now,
  updatedAt: now,
};

function buildResponse(wishMessage, wishSentAt) {
  return {
    id: "88888888-8888-4888-8888-888888888888",
    inviteeId: invitee.id,
    inviteToken: token,
    displayLabel: invitee.displayLabel,
    name: invitee.displayLabel,
    attendingCeremony: true,
    attendingBanquet: true,
    attending: "yes",
    guestCount: 1,
    guestGroup: invitee.guestGroup,
    accommodationNeeded: false,
    stayingGuestCount: 0,
    lodgingGuests: [],
    childrenCount: 0,
    wishMessage,
    wishSentAt,
    submittedAt: now,
  };
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  let wishRequestCount = 0;
  let receivedWish = "";

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.route(`**/api/invites/${token}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ invitee }),
    });
  });
  await page.route(`**/api/invites/${token}/rsvp`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ response: buildResponse(), backend: "supabase", hasSubmittedRsvp: true }),
    });
  });
  await page.route(`**/api/invites/${token}/wish`, async (route) => {
    wishRequestCount += 1;
    const payload = route.request().postDataJSON();
    receivedWish = payload.message;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        response: buildResponse(payload.message, "2026-08-18T05:30:00.000Z"),
        backend: "supabase",
      }),
    });
  });

  await page.goto(`${baseUrl}/rsvp?invite=${token}`, { waitUntil: "domcontentloaded" });
  await page.getByText("THÁNH LỄ HÔN PHỐI", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Có", exact: true }).nth(0).click();
  await page.getByRole("button", { name: "Có", exact: true }).nth(1).click();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await page.getByRole("heading", { name: "Xem lại hồi đáp", exact: true }).waitFor();
  await page.getByRole("button", { name: "Xác nhận gửi hồi đáp", exact: true }).click();

  await page.getByRole("heading", { name: "Đã xác nhận", exact: true }).waitFor();
  assert.equal(await page.getByText(/Lời hồi đáp đã được gửi thành công/).count(), 0);

  const wishButton = page.getByRole("button", { name: "Gửi lời chúc", exact: true });
  const giftButton = page.getByRole("button", { name: /Gửi quà mừng/ });
  await wishButton.waitFor();
  await giftButton.waitFor();
  if (screenshotDir) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(screenshotDir, "01-default.png"), fullPage: true });
  }
  assert.notEqual(
    await wishButton.evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgba(0, 0, 0, 0)",
  );
  assert.equal(await giftButton.evaluate((element) => getComputedStyle(element).borderTopWidth), "0px");

  await giftButton.click();
  const qrImage = page.getByRole("img", { name: "Mã QR gửi quà mừng đến Nhật và Phương" });
  await qrImage.waitFor();
  assert.match(await qrImage.getAttribute("src"), /\/assets\/wedding\/ui\/rsvp\/cash-gift-qr\.png$/);
  await giftButton.click();
  await qrImage.waitFor({ state: "hidden" });

  await wishButton.click();
  const textarea = page.getByLabel("Lời chúc dành cho Nhật và Phương");
  await textarea.waitFor();
  assert.equal(await textarea.getAttribute("maxlength"), "500");
  await textarea.fill("Chúc Nhật & Phương luôn bình an và hạnh phúc!");
  if (screenshotDir) await page.screenshot({ path: join(screenshotDir, "02-composer.png"), fullPage: true });

  await giftButton.click();
  await qrImage.waitFor();
  assert.equal(await textarea.isVisible(), false);
  await giftButton.click();
  await wishButton.click();
  assert.equal(await textarea.inputValue(), "Chúc Nhật & Phương luôn bình an và hạnh phúc!");

  await page.getByRole("button", { name: "Gửi", exact: true }).click();
  await page.getByText("Đã gửi lời chúc", { exact: true }).waitFor();
  await page.waitForTimeout(300);
  assert.equal(wishRequestCount, 1);
  assert.equal(receivedWish, "Chúc Nhật & Phương luôn bình an và hạnh phúc!");
  assert.equal(await page.getByRole("button", { name: "Gửi lời chúc", exact: true }).count(), 0);
  assert.equal(await giftButton.evaluate((element) => getComputedStyle(element).borderTopWidth), "1px");
  const calendarButton = page.getByRole("link", { name: "Thánh lễ", exact: true });
  await calendarButton.waitFor();
  const [giftPillStyle, calendarPillStyle] = await Promise.all([
    giftButton.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, border: style.borderTopColor };
    }),
    calendarButton.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, border: style.borderTopColor };
    }),
  ]);
  assert.deepEqual(giftPillStyle, calendarPillStyle);

  await giftButton.click();
  await qrImage.waitFor();
  if (screenshotDir) {
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(screenshotDir, "03-sent-gift.png"), fullPage: true });
  }
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const bodyOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(bodyOverflow <= 1, `Expected no horizontal overflow at ${viewport.width}px, received ${bodyOverflow}px.`);
  }
  assert.deepEqual(consoleErrors, []);

  await context.close();
  console.log("RSVP wish checks passed: immutable contract, exact QR, default disclosure, inline composer, sent state, Admin/export wiring, reduced motion, and mobile overflow.");
} finally {
  await browser.close();
}
