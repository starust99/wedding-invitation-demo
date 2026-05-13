#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const outDir = process.argv[2] || "output/review-2026-05-10";
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const adminPassword = process.env.ADMIN_PASSWORD || "demo-admin";

const now = new Date().toISOString();
const sampleInvitee = {
  id: "11111111-1111-4111-8111-111111111111",
  token: "chu-sau-demo",
  inviteUnit: "household",
  guestName: "Ông Sáu",
  displayLabel: "Chú Sáu",
  invitationName: "Chú Sáu",
  honorific: "Chú",
  envelopeLine: "Kính mời: Chú Sáu và gia đình",
  insideInviteLine: "Gia đình chúng con trân trọng kính mời Chú Sáu và gia đình đến chung vui trong lễ cưới của hai cháu Nhật & Phương.",
  invitedBy: "parents",
  relationship: "ông của cô dâu/chú rể",
  hostRelationship: "chú",
  hostPronoun: "gia đình chúng con",
  coupleReference: "hai cháu",
  householdMode: "family",
  plusOnePolicy: "family",
  guestGroup: "Họ nội",
  audienceTags: ["family", "paternal"],
  expectedGuestCount: 2,
  phone: "",
  email: "",
  notes: "Case ba mẹ đứng mời, khách là vai ông với cô dâu/chú rể nhưng trên thiệp gọi Chú Sáu.",
  inviteStatus: "invited",
  createdAt: now,
  updatedAt: now,
  supplement: {
    id: "22222222-2222-4222-8222-222222222222",
    inviteeId: "11111111-1111-4111-8111-111111111111",
    tableZone: "",
    tableName: "",
    seatNote: "",
    arrivalNote: "",
    status: "draft",
    updatedAt: now,
  },
};

const sampleResponses = [];
const sampleRules = [
  { audienceTag: "family", allowedPhotoTags: ["public", "family"] },
  { audienceTag: "paternal", allowedPhotoTags: ["public", "paternal"] },
];

function routeJson(route, body) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  baseURL: baseUrl,
});

await context.addInitScript(({ invitees, rules, responses }) => {
  window.localStorage.setItem("wedding-demo-invitees", invitees);
  window.localStorage.setItem("wedding-demo-album-rules", rules);
  window.localStorage.setItem("wedding-demo-media-assets", "[]");
  window.localStorage.setItem("wedding-demo-rsvp-responses", responses);
}, {
  invitees: JSON.stringify([sampleInvitee]),
  rules: JSON.stringify(sampleRules),
  responses: JSON.stringify(sampleResponses),
});

async function newPage(width, height) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  await page.route("**/api/admin/invites", async (route) => {
    if (route.request().method() === "GET") {
      await routeJson(route, {
        backend: "local",
        invitees: [sampleInvitee],
        mediaAssets: [],
        albumRules: sampleRules,
      });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/rsvp", async (route) => {
    if (route.request().method() === "GET") {
      await routeJson(route, {
        backend: "local",
        responses: sampleResponses,
      });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/invites/chu-sau-demo", async (route) => {
    if (route.request().method() === "GET") {
      await routeJson(route, {
        backend: "local",
        invitee: sampleInvitee,
        albumRules: sampleRules,
        mediaAssets: [],
      });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/invites/chu-sau-demo/rsvp", async (route) => {
    if (route.request().method() === "POST") {
      await routeJson(route, { response: { ...sampleResponses[0], backend: "local" } });
      return;
    }
    await route.continue();
  });
  return page;
}

async function shot(name, url, width, height, options = {}) {
  const page = await newPage(width, height);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (options.waitForText) {
    await page.locator("body", { hasText: options.waitForText }).waitFor({ state: "visible", timeout: 30000 });
  }
  if (options.scrollText) {
    await page.getByText(options.scrollText).scrollIntoViewIfNeeded();
  }
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: false,
  });
  await page.close();
}

async function loginAdmin() {
  const page = await newPage(1440, 900);
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator('input[type="password"]').fill(adminPassword);
  await Promise.all([
    page.waitForURL("**/admin", { timeout: 30000 }),
    page.getByRole("button", { name: "Vào admin" }).click(),
  ]);
  await page.close();
}

await loginAdmin();
await shot("home-desktop", `${baseUrl}/`, 1440, 900);
await shot("home-mobile", `${baseUrl}/`, 390, 844);
await shot("invite-desktop", `${baseUrl}/i/chu-sau-demo`, 1440, 900, { waitForText: "Chú Sáu" });
await shot("invite-mobile", `${baseUrl}/i/chu-sau-demo`, 390, 844, { waitForText: "Chú Sáu" });
await shot("rsvp-desktop", `${baseUrl}/rsvp?invite=chu-sau-demo`, 1440, 900, { waitForText: "Xác nhận tham dự" });
await shot("rsvp-mobile", `${baseUrl}/rsvp?invite=chu-sau-demo`, 390, 844, { waitForText: "Xác nhận tham dự" });
await shot("admin-desktop", `${baseUrl}/admin`, 1440, 900, { waitForText: "Khách đang chọn" });
await shot("admin-mobile", `${baseUrl}/admin`, 390, 844, { waitForText: "Khách đang chọn", scrollText: "Khách đang chọn" });

await browser.close();
console.log(`done: ${outDir}`);
