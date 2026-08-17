import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = (process.env.RSVP_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

function createInvitee({ token, invited }) {
  const now = "2026-08-17T00:00:00.000Z";
  return {
    id: `11111111-1111-4111-8111-${invited ? "111111111111" : "222222222222"}`,
    token,
    inviteUnit: "individual",
    guestName: "Anh Minh",
    displayLabel: "Anh Minh",
    salutationCluster: "Anh",
    displaySalutation: "Anh Minh",
    invitationName: "Anh Minh",
    honorific: "Anh",
    envelopeLine: "Anh Minh",
    insideInviteLine: "Anh Minh",
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
    postCeremonyPartyInvited: invited,
    phone: "",
    email: "",
    notes: "",
    inviteStatus: "invited",
    createdAt: now,
    updatedAt: now,
  };
}

async function openRsvp(browser, invitee, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 390, height: 844 },
    reducedMotion: options.reducedMotion || "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.route(`**/api/invites/${invitee.token}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ invitee }),
    });
  });
  await page.goto(`${baseUrl}/rsvp?invite=${invitee.token}`, { waitUntil: "domcontentloaded" });
  await page.getByText("THÁNH LỄ HÔN PHỐI", { exact: true }).waitFor();
  return { context, page, consoleErrors };
}

async function selectPrimaryEvents(page, { ceremony, banquet }) {
  const ceremonyButton = page.getByRole("button", { name: ceremony ? "Có" : "Không", exact: true }).nth(0);
  const banquetButton = page.getByRole("button", { name: banquet ? "Có" : "Không", exact: true }).nth(1);
  await ceremonyButton.click();
  await banquetButton.click();
  assert.equal(await ceremonyButton.getAttribute("aria-pressed"), "true");
  assert.equal(await banquetButton.getAttribute("aria-pressed"), "true");
}

const browser = await chromium.launch({ headless: true });

try {
  const regularInvitee = createInvitee({ token: "rsvp-conditional-party-test", invited: false });
  const regular = await openRsvp(browser, regularInvitee);
  assert.equal(await regular.page.getByText("Tiệc thân mật", { exact: true }).count(), 0);
  assert.equal(await regular.page.getByRole("button", { name: "Tiếp tục", exact: true }).count(), 1);
  assert.equal(await regular.page.getByRole("button", { name: "Xem lại và hoàn tất", exact: true }).count(), 0);

  await selectPrimaryEvents(regular.page, { ceremony: true, banquet: false });
  await regular.page.locator(".rsvp-review-tap-guide").waitFor();
  await regular.page.getByRole("button", { name: "Tiếp tục", exact: true }).click();

  await regular.page.getByText("Tiệc thân mật", { exact: true }).waitFor();
  assert.equal(await regular.page.getByText("THÁNH LỄ HÔN PHỐI", { exact: true }).count(), 0);
  assert.equal(await regular.page.getByText("TIỆC CƯỚI", { exact: true }).count(), 0);
  await regular.page.getByText("Sau Thánh lễ hôn phối", { exact: true }).waitFor();
  await regular.page.getByText("11:30 – Chủ Nhật, 20/12/2026", { exact: true }).waitFor();
  await regular.page.getByText("Nhà Thờ Giáo Xứ Tam Hải", { exact: true }).waitFor();
  assert.equal(await regular.page.locator('img[data-rsvp-intimate-party-icon="true"]').count(), 1);
  await regular.page.getByText("Kính mời Quý khách dự buổi tiệc chung vui cùng gia đình sau Thánh lễ", { exact: true }).waitFor();

  const editButton = regular.page.getByRole("button", { name: "Chỉnh sửa", exact: true });
  const partyCard = regular.page.locator(".rsvp-paper-card");
  assert.ok(
    (await editButton.boundingBox()).y < (await partyCard.boundingBox()).y,
    "The edit action must sit above the intimate-party card.",
  );
  await editButton.click();
  await regular.page.getByText("THÁNH LỄ HÔN PHỐI", { exact: true }).waitFor();
  assert.equal(
    await regular.page.getByRole("button", { name: "Có", exact: true }).nth(0).getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await regular.page.getByRole("button", { name: "Không", exact: true }).nth(1).getAttribute("aria-pressed"),
    "true",
  );

  await regular.page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await regular.page.getByRole("button", { name: "Có", exact: true }).click();
  await regular.page.locator(".rsvp-review-tap-guide").waitFor();
  await regular.page.getByRole("button", { name: "Xem lại và hoàn tất", exact: true }).click();
  await regular.page.getByRole("heading", { name: "Xem lại hồi đáp", exact: true }).waitFor();
  await regular.page.getByText("Thánh lễ Hôn phối", { exact: true }).waitFor();
  await regular.page.getByText("Tiệc thân mật", { exact: true }).waitFor();
  await regular.page.getByText("11:30 – Chủ Nhật, 20/12/2026", { exact: true }).waitFor();
  await regular.page.getByText("Tiệc cưới", { exact: true }).waitFor();
  assert.deepEqual(regular.consoleErrors, []);
  await regular.context.close();

  const directInvitee = createInvitee({ token: "rsvp-direct-review-test", invited: false });
  const direct = await openRsvp(browser, directInvitee, { viewport: { width: 1280, height: 900 } });
  await selectPrimaryEvents(direct.page, { ceremony: true, banquet: true });
  await direct.page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await direct.page.getByRole("heading", { name: "Xem lại hồi đáp", exact: true }).waitFor();
  assert.equal(await direct.page.getByText("Tiệc thân mật", { exact: true }).count(), 0);
  assert.deepEqual(direct.consoleErrors, []);
  await direct.context.close();

  const closeInvitee = createInvitee({ token: "rsvp-initial-party-test", invited: true });
  const close = await openRsvp(browser, closeInvitee);
  assert.equal(await close.page.getByRole("button", { name: "Tiếp tục", exact: true }).count(), 0);
  await close.page.getByRole("button", { name: "Có", exact: true }).nth(0).click();
  await close.page.getByText("Tiệc thân mật", { exact: true }).waitFor();
  await close.page.getByText("11:30 – Chủ Nhật, 20/12/2026", { exact: true }).waitFor();
  assert.equal(await close.page.locator('img[data-rsvp-intimate-party-icon="true"]').count(), 1);
  await close.page.getByRole("button", { name: "Có", exact: true }).nth(1).click();
  await close.page.getByRole("button", { name: "Có", exact: true }).nth(2).click();
  await close.page.getByRole("button", { name: "Xem lại và hoàn tất", exact: true }).waitFor();
  await close.page.locator(".rsvp-review-tap-guide").waitFor();
  assert.deepEqual(close.consoleErrors, []);
  await close.context.close();

  const reducedInvitee = createInvitee({ token: "rsvp-reduced-motion-test", invited: false });
  const reduced = await openRsvp(browser, reducedInvitee, { reducedMotion: "reduce" });
  await selectPrimaryEvents(reduced.page, { ceremony: true, banquet: true });
  const staticGuide = reduced.page.locator(".rsvp-review-tap-guide");
  await staticGuide.waitFor();
  assert.equal(await staticGuide.evaluate((element) => getComputedStyle(element).animationName), "none");
  assert.equal(await staticGuide.isVisible(), true);
  assert.deepEqual(reduced.consoleErrors, []);
  await reduced.context.close();

  console.log("RSVP branching checks passed: regular decline step, preserved edits, direct review, initial close-guest invitation, review summary, and reduced motion.");
} finally {
  await browser.close();
}
