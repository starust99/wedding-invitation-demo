import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const baseUrl = (process.env.CALENDAR_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const userAgents = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
  iphoneMessenger: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/MessengerForiOS;FBAV/514.0]",
  androidChrome: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/136.0.0.0 Mobile Safari/537.36",
  androidZalo: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/132.0.0.0 Mobile Safari/537.36 Zalo android",
  desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36",
};

async function requestCalendar(event, userAgent) {
  return fetch(`${baseUrl}/calendar/${event}`, {
    headers: { "user-agent": userAgent },
    redirect: "manual",
  });
}

async function assertIcsResponse(userAgent, expectedUid, expectedStart) {
  const response = await requestCalendar("thanh-le", userAgent);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /^text\/calendar; charset=utf-8/i);
  assert.match(response.headers.get("content-disposition") || "", /thanh-le-nhat-phuong\.ics/);
  assert.match(response.headers.get("vary") || "", /(?:^|,\s*)User-Agent(?:,|$)/i);
  assert.match(response.headers.get("cache-control") || "", /no-store/);

  const body = await response.text();
  assert.ok(body.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.match(body, new RegExp(`UID:${expectedUid}`));
  assert.match(body, new RegExp(`DTSTART:${expectedStart}`));
  assert.match(body, /Thánh lễ Hôn phối Nhật & Phương/);
  assert.doesNotMatch(body, /(?<!\r)\n/, "iCalendar output must use CRLF line endings.");
}

await assertIcsResponse(userAgents.iphoneSafari, "thanh-le-20261220@nhatphuong.love", "20261220T030000Z");
await assertIcsResponse(userAgents.iphoneMessenger, "thanh-le-20261220@nhatphuong.love", "20261220T030000Z");
await assertIcsResponse(userAgents.desktop, "thanh-le-20261220@nhatphuong.love", "20261220T030000Z");

for (const userAgent of [userAgents.androidChrome, userAgents.androidZalo]) {
  const response = await requestCalendar("tiec-cuoi", userAgent);
  assert.equal(response.status, 302);
  assert.match(response.headers.get("vary") || "", /(?:^|,\s*)User-Agent(?:,|$)/i);
  assert.match(response.headers.get("cache-control") || "", /no-store/);

  const location = new URL(response.headers.get("location"));
  assert.equal(location.origin, "https://calendar.google.com");
  assert.equal(location.searchParams.get("action"), "TEMPLATE");
  assert.equal(location.searchParams.get("dates"), "20261226T103000Z/20261226T140000Z");
  assert.equal(location.searchParams.get("ctz"), "Asia/Ho_Chi_Minh");
  assert.match(location.searchParams.get("text") || "", /Tiệc cưới Nhật & Phương/);
}

const missingResponse = await requestCalendar("khong-ton-tai", userAgents.desktop);
assert.equal(missingResponse.status, 404);

const rsvpSource = await readFile(new URL("../src/app/rsvp/page.tsx", import.meta.url), "utf8");
assert.match(rsvpSource, /href="\/calendar\/thanh-le"/);
assert.match(rsvpSource, /href="\/calendar\/tiec-cuoi"/);
assert.doesNotMatch(rsvpSource, /const openCalendar/);
assert.doesNotMatch(rsvpSource, /URL\.createObjectURL/);
assert.doesNotMatch(rsvpSource, /window\.open\(gcalUrl/);

console.log("Smart calendar checks passed: unchanged links, Apple/desktop ICS, Android Google Calendar, cache safety, and 404 handling.");
