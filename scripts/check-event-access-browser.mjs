import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = (process.env.EVENT_ACCESS_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const serverInviteToken = process.env.EVENT_ACCESS_TEST_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const browser = await chromium.launch({ headless: true });

function createInvitee({ token, invited, guestGroup }) {
  const now = "2026-08-18T00:00:00.000Z";
  return {
    id: invited ? "88888888-8888-4888-8888-888888888888" : "99999999-9999-4999-8999-999999999999",
    token,
    inviteUnit: "individual",
    guestName: invited ? "Chú Thành" : "Chú Minh",
    displayLabel: invited ? "Chú Thành" : "Chú Minh",
    salutationCluster: "Chú",
    displaySalutation: invited ? "Chú Thành" : "Chú Minh",
    invitationName: invited ? "Chú Thành" : "Chú Minh",
    honorific: "Chú",
    envelopeLine: "",
    insideInviteLine: "",
    invitedBy: "parents",
    relationship: "Khách gia đình",
    hostRelationship: "Khách gia đình",
    hostPronoun: "gia đình",
    coupleReference: "Nhật & Phương",
    householdMode: "single",
    plusOnePolicy: "none",
    guestGroup,
    audienceTags: [],
    expectedGuestCount: 1,
    postCeremonyPartyInvited: invited,
    notes: "",
    inviteStatus: "invited",
    createdAt: now,
    updatedAt: now,
  };
}

async function openInvite(invitee, viewport) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(({ invite }) => {
    window.localStorage.setItem("wedding-demo-invitees", JSON.stringify([invite]));
    window.localStorage.setItem(`wedding-splash:${invite.token}`, "1");
    window.sessionStorage.setItem(`wedding-splash-seen:${invite.token}`, "1");
  }, { invite: invitee });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Encountered a script tag while rendering React component")) {
      consoleErrors.push(message.text());
    }
  });
  await page.route(`**/api/invites/${invitee.token}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ backend: "local", invitee }),
    });
  });
  await page.goto(`${baseUrl}/i/${invitee.token}`, { waitUntil: "domcontentloaded" });
  await page.locator("#tiec-cuoi").waitFor({ state: "attached", timeout: 20_000 });
  await page.getByText(invitee.displayLabel, { exact: true }).first().waitFor({ state: "attached", timeout: 20_000 });
  return { context, page, consoleErrors };
}

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const banquetOnlyInvitee = createInvitee({
      token: serverInviteToken,
      invited: false,
      guestGroup: "[Nhà Trai] Khách mẹ",
    });
    const banquetOnly = await openInvite(banquetOnlyInvitee, viewport);
    assert.equal(await banquetOnly.page.locator("#thanh-le-hon-phoi").count(), 0);
    assert.equal(await banquetOnly.page.locator("#tiec-cuoi").count(), 1);
    assert.equal(await banquetOnly.page.getByText("Thánh lễ hôn phối", { exact: true }).count(), 0);
    const overflow = await banquetOnly.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, `Banquet-only invitation overflowed by ${overflow}px at ${viewport.width}px.`);
    assert.deepEqual(banquetOnly.consoleErrors, []);
    await banquetOnly.context.close();
  }

  const directInvitee = createInvitee({
    token: serverInviteToken,
    invited: true,
    guestGroup: "[Nhà Trai] Họ ngoại",
  });
  const direct = await openInvite(directInvitee, { width: 768, height: 1024 });
  await direct.page.locator("#thanh-le-hon-phoi").waitFor({ state: "attached" });
  assert.equal(await direct.page.locator("#tiec-cuoi").count(), 1);
  assert.deepEqual(direct.consoleErrors, []);
  await direct.context.close();

  console.log("Event-access browser checks passed: banquet-only Nhà Trai invitations hide ceremony at mobile/desktop, while flagged Nhà Trai invitations retain it.");
} finally {
  await browser.close();
}
