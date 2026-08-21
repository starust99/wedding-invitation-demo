import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = (process.env.RSVP_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.RSVP_TEST_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const inviteApiPath = `/api/invites/${token}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function selectBanquetOnly(page) {
  const yesButtons = page.getByRole("button", { name: "Có", exact: true });
  await yesButtons.first().waitFor({ state: "visible" });
  assert.equal(await yesButtons.count(), 1, "Banquet-only Nhà Trai RSVP must expose one attendance choice.");
  await yesButtons.first().click();
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

  await page.getByRole("button", { name: "Xem lại và hoàn tất", exact: true }).click();
  await page.getByText("Vui lòng chọn phương án lưu trú.", { exact: true }).waitFor();
  assert.equal(
    await page.getByRole("heading", { name: "Xem lại hồi đáp", exact: true }).count(),
    0,
    "Review must wait for an explicit lodging choice.",
  );

  await noStayButton.click();
  await page.getByText("Vui lòng chọn phương án lưu trú.", { exact: true }).waitFor({ state: "hidden" });
}

async function fillLodgingGuest(page) {
  await page.getByRole("button", { name: /Đêm 26\/12/ }).click();
  const fullName = page.getByPlaceholder("VD: Nguyễn Văn A", { exact: true });
  await fullName.waitFor({ state: "visible" });
  assert.equal(
    await fullName.evaluate((input) => document.activeElement === input),
    false,
    "Choosing a lodging night must not focus the guest-name field or open the mobile keyboard.",
  );
  await page.getByRole("button", { name: "Xem lại và hoàn tất", exact: true }).click();
  const missingNameError = page.getByText("Nhập họ tên người lưu trú.", { exact: true });
  await missingNameError.waitFor();
  await fullName.fill("Nguyễn Văn A");
  await missingNameError.waitFor({ state: "hidden" });
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

  await selectBanquetOnly(page);
  assert.equal(await page.getByText("THÁNH LỄ HÔN PHỐI", { exact: true }).count(), 0);
  await page.getByText(
    "Gia đình sẽ chuẩn bị phòng tại Resort Terracotta cho Quý khách. Xin Quý khách vui lòng xác nhận nhu cầu nghỉ lại.",
    { exact: true },
  ).waitFor();
  assert.equal(
    await page.getByRole("button", { name: /Đêm 25\/12/ }).count(),
    0,
    "Nhà Trai family guests must not be offered the night of 25/12.",
  );
  assert.equal(
    await page.getByRole("button", { name: /Cả hai đêm/ }).count(),
    0,
    "Nhà Trai family guests must not be offered both nights.",
  );
  await requireExplicitStayDecision(page);
  const firstPass = await fillLodgingGuest(page);
  await delay(3_000);
  await assertDraftValue(firstPass);

  await page.getByRole("button", { name: "Xem lại và hoàn tất", exact: true }).click();
  await page.getByRole("heading", { name: "Xem lại hồi đáp", exact: true }).waitFor();
  assert.match(await page.locator("main").innerText(), /Nguyễn Văn A/);

  await page.reload({ waitUntil: "domcontentloaded" });
  const restoredFullName = page.getByPlaceholder("VD: Nguyễn Văn A", { exact: true });
  await restoredFullName.waitFor({ state: "visible" });
  await assertDraftValue(restoredFullName);

  assert.deepEqual(consoleErrors, [], `Browser console errors: ${consoleErrors.join(" | ")}`);
  await context.close();

  const alignmentContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  await alignmentContext.addInitScript((invitee) => {
    window.localStorage.setItem("wedding-demo-invitees", JSON.stringify([invitee]));
  }, familyInvitee);
  const alignmentPage = await alignmentContext.newPage();
  await alignmentPage.route(`**${inviteApiPath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ invitee: familyInvitee }),
    });
  });
  await alignmentPage.goto(`${baseUrl}/rsvp?invite=${token}`, { waitUntil: "domcontentloaded" });
  await selectBanquetOnly(alignmentPage);
  await alignmentPage.getByRole("button", { name: /Đêm 26\/12/ }).click();
  await alignmentPage.getByRole("button", { name: "Xem lại và hoàn tất", exact: true }).click();
  await alignmentPage.getByText("Nhập họ tên người lưu trú.", { exact: true }).waitFor();

  const nameInputBox = await alignmentPage.locator('[data-rsvp-lodging-name-input="true"]').boundingBox();
  const childToggleBox = await alignmentPage.locator('[data-rsvp-lodging-child-toggle="true"]').boundingBox();
  assert.ok(nameInputBox && childToggleBox, "Lodging alignment controls must be measurable.");
  assert.ok(
    Math.abs(nameInputBox.y - childToggleBox.y) <= 1,
    `Child toggle moved out of line after validation (${nameInputBox.y}px vs ${childToggleBox.y}px).`,
  );
  await alignmentContext.close();

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
  await directPage.getByText("TIỆC CƯỚI", { exact: true }).waitFor({ timeout: 30_000 });
  await directContext.close();

  const friendToken = "rsvp-friend-count-test";
  const friendInvitee = {
    ...invitePayload.invitee,
    id: `${invitePayload.invitee.id}-friend-test`,
    token: friendToken,
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
    expectedGuestCount: 4,
    postCeremonyPartyInvited: false,
    terracottaLodgingEligible: false,
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
  const friendYesButtons = friendPage.getByRole("button", { name: "Có", exact: true });
  await friendYesButtons.first().waitFor({ state: "visible" });
  assert.equal(
    await friendPage.getByText("SỐ NGƯỜI THAM DỰ:", { exact: true }).count(),
    0,
    "The banquet guest count must stay hidden before a Tiệc cưới response is selected.",
  );
  await friendYesButtons.nth(0).click();
  assert.equal(
    await friendPage.getByText("SỐ NGƯỜI THAM DỰ:", { exact: true }).count(),
    0,
    "Selecting only Thánh lễ Hôn phối must not reveal the Tiệc cưới guest count.",
  );
  await friendYesButtons.nth(1).click();
  await friendPage.getByText("SỐ NGƯỜI THAM DỰ:", { exact: true }).waitFor();
  await friendPage.getByText("1 người", { exact: true }).waitFor();
  assert.equal(
    await friendPage.getByRole("button", { name: "Giảm số người tham dự", exact: true }).isDisabled(),
    true,
    "A new non-family RSVP must start at exactly one guest, independent of the imported estimate.",
  );
  assert.equal(
    await friendPage.getByText("LƯU TRÚ", { exact: true }).count(),
    0,
    "Friends and colleagues must not be asked for resort lodging.",
  );

  const eligibleFriendToken = "rsvp-eligible-friend-lodging-test";
  const eligibleFriendInvitee = {
    ...friendInvitee,
    id: `${invitePayload.invitee.id}-eligible-friend-test`,
    token: eligibleFriendToken,
    terracottaLodgingEligible: true,
  };
  const eligibleFriendContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await eligibleFriendContext.addInitScript((invitee) => {
    window.localStorage.setItem("wedding-demo-invitees", JSON.stringify([invitee]));
  }, eligibleFriendInvitee);
  const eligibleFriendPage = await eligibleFriendContext.newPage();
  await eligibleFriendPage.route(`**/api/invites/${eligibleFriendToken}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ invitee: eligibleFriendInvitee }),
    });
  });
  await eligibleFriendPage.goto(`${baseUrl}/rsvp?invite=${eligibleFriendToken}`, { waitUntil: "domcontentloaded" });
  const eligibleFriendYesButtons = eligibleFriendPage.getByRole("button", { name: "Có", exact: true });
  await eligibleFriendYesButtons.first().waitFor({ state: "visible" });
  await eligibleFriendYesButtons.nth(1).click();
  await eligibleFriendPage.getByText("LƯU TRÚ", { exact: true }).waitFor();
  await eligibleFriendContext.close();
  const noButtons = friendPage.getByRole("button", { name: "Không", exact: true });
  await noButtons.nth(0).click();
  await noButtons.nth(1).click();
  await friendPage.getByText("SỐ NGƯỜI THAM DỰ:", { exact: true }).waitFor({ state: "hidden" });
  await friendPage.getByRole("button", { name: "Có", exact: true }).nth(1).click();
  await friendPage.getByText("1 người", { exact: true }).waitFor();
  await friendPage.getByRole("button", { name: "Tăng số người tham dự", exact: true }).click();
  await friendPage.getByText("2 người", { exact: true }).waitFor();
  await friendPage.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await friendPage.getByRole("heading", { name: "Xem lại hồi đáp", exact: true }).waitFor();
  const banquetReviewRow = friendPage.getByText("Tiệc cưới", { exact: true }).locator("xpath=../..");
  await banquetReviewRow.getByText("Số người tham dự:", { exact: false }).waitFor();
  await banquetReviewRow.getByText("2 người", { exact: true }).waitFor();
  assert.equal(
    await banquetReviewRow.getByText("Sẽ tham dự", { exact: true }).locator("svg").count(),
    0,
    "Positive attendance copy should not carry a decorative check icon.",
  );
  assert.equal(
    await friendPage.getByRole("heading", { name: "Số người tham dự", exact: true }).count(),
    0,
    "The banquet guest count must stay inside the Tiệc cưới review row instead of becoming a separate section.",
  );
  await friendContext.close();

  const invalidContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const invalidPage = await invalidContext.newPage();
  await invalidPage.route("**/api/invites/invite-does-not-exist", async (route) => {
    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Not found" }) });
  });
  await invalidPage.goto(`${baseUrl}/rsvp?invite=invite-does-not-exist`, { waitUntil: "domcontentloaded" });
  await invalidPage.getByRole("heading", { name: "Không tìm thấy lời mời", exact: true }).waitFor();
  assert.equal(await invalidPage.locator('input[type="password"]').count(), 0, "Invalid public invites must never expose an admin password field.");
  assert.equal(await invalidPage.getByText(/Admin/i).count(), 0, "Invalid public invites must not expose admin actions or labels.");
  await invalidContext.close();

  console.log("RSVP resilience checks passed: Nhà Trai banquet-only family lodging, validation alignment, non-family party size, delayed hydration, review, reload draft, and direct-link loading gate.");
} finally {
  await browser.close();
}
