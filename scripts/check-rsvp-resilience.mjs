import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = (process.env.RSVP_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.RSVP_TEST_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const inviteApiPath = `/api/invites/${token}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function selectBothEvents(page) {
  const yesButtons = page.getByRole("button", { name: "Có", exact: true });
  await yesButtons.first().waitFor({ state: "visible" });
  assert.equal(await yesButtons.count(), 2, "RSVP must expose exactly two event attendance choices.");
  await yesButtons.nth(0).click();
  await yesButtons.nth(1).click();
}

async function requireExplicitStayDecision(page) {
  const noStayButton = page.getByRole("button", { name: "Không nghỉ lại", exact: true });
  await noStayButton.waitFor({ state: "visible" });
  assert.doesNotMatch(
    await noStayButton.getAttribute("class") || "",
    /bg-\[#7a4a4a\]/,
    "Lodging must open without preselecting 'Không nghỉ lại'.",
  );
  assert.equal(
    await noStayButton.getAttribute("aria-pressed"),
    "false",
    "'Không nghỉ lại' must expose an unselected state to assistive technology.",
  );

  await page.getByRole("button", { name: "XEM LẠI VÀ HOÀN TẤT", exact: true }).click();
  await page.getByText("Vui lòng chọn phương án lưu trú.", { exact: true }).waitFor();
  assert.equal(
    await page.getByRole("heading", { name: "Xác nhận thông tin hồi đáp", exact: true }).count(),
    0,
    "Review must wait for an explicit lodging choice.",
  );

  await noStayButton.click();
  await page.getByText("Vui lòng chọn phương án lưu trú.", { exact: true }).waitFor({ state: "hidden" });
}

async function fillLodgingGuest(page) {
  await page.getByRole("button", { name: /Đêm 25\/12/ }).click();
  const fullName = page.getByPlaceholder("VD: Nguyễn Văn A", { exact: true });
  await fullName.fill("Nguyễn Văn A");
  return fullName;
}

async function assertDraftValue(fullName) {
  assert.equal(await fullName.inputValue(), "Nguyễn Văn A", "Lodging guest draft was lost.");
}

const browser = await chromium.launch({ headless: true });

try {
  const inviteResponse = await fetch(`${baseUrl}${inviteApiPath}`);
  assert.equal(inviteResponse.ok, true, `Could not load test invite (${inviteResponse.status}).`);
  const invitePayload = await inviteResponse.json();
  assert.ok(invitePayload.invitee, "Invite API did not return an invitee.");
  const familyInvitee = {
    ...invitePayload.invitee,
    guestGroup: "[Nhà Trai] Họ nội",
    postCeremonyPartyInvited: false,
    rsvp: undefined,
  };

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript((invitee) => {
    window.localStorage.setItem("wedding-demo-invitees", JSON.stringify([invitee]));
  }, familyInvitee);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.route(`**${inviteApiPath}`, async (route) => {
    await delay(2_500);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ invitee: familyInvitee }),
    });
  });

  await page.goto(`${baseUrl}/rsvp?invite=${token}`, { waitUntil: "domcontentloaded" });

  await selectBothEvents(page);
  await requireExplicitStayDecision(page);
  const firstPass = await fillLodgingGuest(page);
  await delay(3_000);
  await assertDraftValue(firstPass);

  await page.getByRole("button", { name: "XEM LẠI VÀ HOÀN TẤT", exact: true }).click();
  await page.getByRole("heading", { name: "Xác nhận thông tin hồi đáp", exact: true }).waitFor();
  assert.match(await page.locator("main").innerText(), /Nguyễn Văn A/);

  await page.reload({ waitUntil: "domcontentloaded" });
  const restoredFullName = page.getByPlaceholder("VD: Nguyễn Văn A", { exact: true });
  await restoredFullName.waitFor({ state: "visible" });
  await assertDraftValue(restoredFullName);

  assert.deepEqual(consoleErrors, [], `Browser console errors: ${consoleErrors.join(" | ")}`);
  await context.close();

  const directContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const directPage = await directContext.newPage();
  await directPage.route(`**${inviteApiPath}`, async (route) => {
    await delay(2_000);
    await route.continue();
  });

  await directPage.goto(`${baseUrl}/rsvp?invite=${token}`, { waitUntil: "domcontentloaded" });
  await directPage.getByText("Đang chuẩn bị thông tin dành riêng cho Quý khách…", { exact: true }).waitFor();
  assert.equal(
    await directPage.getByRole("button", { name: "Có", exact: true }).count(),
    0,
    "Interactive RSVP controls must stay hidden until direct-link hydration finishes.",
  );
  await directPage.getByText("THÁNH LỄ HÔN PHỐI", { exact: true }).waitFor({ timeout: 15_000 });
  await directContext.close();

  const friendToken = "rsvp-friend-count-test";
  const friendInvitee = {
    ...invitePayload.invitee,
    id: `${invitePayload.invitee.id}-friend-test`,
    token: friendToken,
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
    expectedGuestCount: 1,
    postCeremonyPartyInvited: false,
    inviteStatus: "invited",
    rsvp: undefined,
  };
  const friendContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await friendContext.addInitScript((invitee) => {
    window.localStorage.setItem("wedding-demo-invitees", JSON.stringify([invitee]));
  }, friendInvitee);
  const friendPage = await friendContext.newPage();
  await friendPage.route(`**/api/invites/${friendToken}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ invitee: friendInvitee }),
    });
  });

  await friendPage.goto(`${baseUrl}/rsvp?invite=${friendToken}`, { waitUntil: "domcontentloaded" });
  await selectBothEvents(friendPage);
  await friendPage.getByText("ĐI BAO NHIÊU NGƯỜI?", { exact: true }).waitFor();
  assert.equal(
    await friendPage.getByText("LƯU TRÚ", { exact: true }).count(),
    0,
    "Friends and colleagues must not be asked for resort lodging.",
  );
  await friendPage.getByRole("button", { name: "Tăng số người tham dự", exact: true }).click();
  await friendPage.getByText("2 người", { exact: true }).waitFor();
  await friendPage.getByRole("button", { name: "XEM LẠI VÀ HOÀN TẤT", exact: true }).click();
  await friendPage.getByRole("heading", { name: "Xác nhận thông tin hồi đáp", exact: true }).waitFor();
  await friendPage.getByText("3. SỐ NGƯỜI THAM DỰ", { exact: true }).waitFor();
  await friendContext.close();

  console.log("RSVP resilience checks passed: family lodging, non-family party size, delayed hydration, review, reload draft, and direct-link loading gate.");
} finally {
  await browser.close();
}
