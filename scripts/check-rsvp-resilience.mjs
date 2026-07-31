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

async function fillNotes(page) {
  const notes = page.getByPlaceholder(
    "Quý khách có thể nhắn giờ đến dự kiến, yêu cầu ghế trẻ em, hỗ trợ đi lại hoặc hỗ trợ người lớn tuổi,... nếu có",
    { exact: true },
  );
  const dietaryNote = page.getByPlaceholder(
    "Ăn chay, dị ứng, kiêng món, không dùng rượu/cồn, hoặc cần suất trẻ em nếu có.",
    { exact: true },
  );
  await notes.fill("Đến trễ");
  await dietaryNote.fill("ăn chay");
  return { notes, dietaryNote };
}

async function assertDraftValues(notes, dietaryNote) {
  assert.equal(await notes.inputValue(), "Đến trễ", "Arrival note was lost.");
  assert.equal(await dietaryNote.inputValue(), "ăn chay", "Dietary note was lost.");
}

const browser = await chromium.launch({ headless: true });

try {
  const inviteResponse = await fetch(`${baseUrl}${inviteApiPath}`);
  assert.equal(inviteResponse.ok, true, `Could not load test invite (${inviteResponse.status}).`);
  const invitePayload = await inviteResponse.json();
  assert.ok(invitePayload.invitee, "Invite API did not return an invitee.");

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript((invitee) => {
    window.localStorage.setItem("wedding-demo-invitees", JSON.stringify([invitee]));
  }, invitePayload.invitee);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.route(`**${inviteApiPath}`, async (route) => {
    await delay(2_500);
    await route.continue();
  });

  await page.goto(`${baseUrl}/rsvp?invite=${token}`, { waitUntil: "domcontentloaded" });

  await selectBothEvents(page);
  await requireExplicitStayDecision(page);
  const firstPass = await fillNotes(page);
  await delay(3_000);
  await assertDraftValues(firstPass.notes, firstPass.dietaryNote);

  await page.getByRole("button", { name: "XEM LẠI VÀ HOÀN TẤT", exact: true }).click();
  await page.getByRole("heading", { name: "Xác nhận thông tin hồi đáp", exact: true }).waitFor();
  assert.match(await page.locator("main").innerText(), /Đến trễ/);
  assert.match(await page.locator("main").innerText(), /ăn chay/);

  await page.reload({ waitUntil: "domcontentloaded" });
  const restoredNotes = page.getByPlaceholder(
    "Quý khách có thể nhắn giờ đến dự kiến, yêu cầu ghế trẻ em, hỗ trợ đi lại hoặc hỗ trợ người lớn tuổi,... nếu có",
    { exact: true },
  );
  const restoredDietaryNote = page.getByPlaceholder(
    "Ăn chay, dị ứng, kiêng món, không dùng rượu/cồn, hoặc cần suất trẻ em nếu có.",
    { exact: true },
  );
  await restoredNotes.waitFor({ state: "visible" });
  await assertDraftValues(restoredNotes, restoredDietaryNote);

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

  console.log("RSVP resilience checks passed: explicit lodging choice, delayed hydration, review, reload draft, and direct-link loading gate.");
} finally {
  await browser.close();
}
