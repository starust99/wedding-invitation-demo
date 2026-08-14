import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const baseUrl = (process.env.CALENDAR_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const userAgents = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
  iphoneMessenger: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/MessengerForiOS;FBAV/514.0]",
  androidChrome: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/136.0.0.0 Mobile Safari/537.36",
  androidMessenger: "Mozilla/5.0 (Linux; Android 15; Pixel 9 Build/AP3A; wv) AppleWebKit/537.36 Version/4.0 Chrome/136.0 Mobile Safari/537.36 [FBAN/Orca-Android;FBAV/536.0.0.0.68]",
  androidZalo: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/132.0.0.0 Mobile Safari/537.36 Zalo android",
  ipadSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15",
  macChrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36",
  windowsChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36",
};

async function requestCalendar(event, userAgent) {
  return fetch(`${baseUrl}/calendar/${event}`, {
    headers: { "user-agent": userAgent },
    redirect: "manual",
  });
}

async function assertIcsResponse(userAgent, expectedDisposition, expectedUid, expectedStart) {
  const response = await requestCalendar("thanh-le", userAgent);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /^text\/calendar; charset=utf-8/i);
  assert.match(
    response.headers.get("content-disposition") || "",
    new RegExp(`^${expectedDisposition}; filename="Lich-Thanh-le-Nhat-Phuong\\.ics"$`, "i"),
  );
  assert.match(response.headers.get("vary") || "", /(?:^|,\s*)User-Agent(?:,|$)/i);
  assert.match(response.headers.get("cache-control") || "", /no-store/);

  const body = await response.text();
  assert.ok(body.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.match(body, new RegExp(`UID:${expectedUid}`));
  assert.match(body, new RegExp(`DTSTART:${expectedStart}`));
  assert.match(body, /Thánh lễ Hôn phối Nhật & Phương/);
  assert.doesNotMatch(body, /(?<!\r)\n/, "iCalendar output must use CRLF line endings.");
}

for (const userAgent of [userAgents.iphoneSafari, userAgents.ipadSafari, userAgents.macSafari]) {
  await assertIcsResponse(userAgent, "inline", "thanh-le-20261220@nhatphuong.love", "20261220T030000Z");
}

for (const userAgent of [
  userAgents.iphoneMessenger,
  userAgents.androidMessenger,
  userAgents.androidZalo,
  userAgents.macChrome,
  userAgents.windowsChrome,
]) {
  await assertIcsResponse(userAgent, "attachment", "thanh-le-20261220@nhatphuong.love", "20261220T030000Z");
}

const banquetDownload = await requestCalendar("tiec-cuoi", userAgents.windowsChrome);
assert.equal(banquetDownload.status, 200);
assert.match(
  banquetDownload.headers.get("content-disposition") || "",
  /^attachment; filename="Lich-Tiec-cuoi-Nhat-Phuong\.ics"$/i,
);

const albumReminder = await fetch(`${baseUrl}/calendar/album?invite=chu-hai-test-123`, {
  headers: { "user-agent": userAgents.iphoneSafari },
  redirect: "manual",
});
assert.equal(albumReminder.status, 200);
assert.match(
  albumReminder.headers.get("content-disposition") || "",
  /^inline; filename="Xem-Album-Anh-Nhat-Phuong\.ics"$/i,
);
const albumBody = await albumReminder.text();
assert.match(albumBody, /SUMMARY:Xem album ảnh Nhật & Phương/);
assert.match(albumBody, /UID:album-\d{8}@nhatphuong\.love/);
assert.match(albumBody, /DTSTART:20270131T170000Z/);
assert.match(albumBody, /Album ảnh sẽ được cập nhật tại thiệp mời/);
assert.match(albumBody, /URL:https:\/\/nhatphuong\.love\/i\/chu-hai-test-123/);

const androidChromeRedirect = await requestCalendar("tiec-cuoi", userAgents.androidChrome);
assert.equal(androidChromeRedirect.status, 302);
assert.match(androidChromeRedirect.headers.get("vary") || "", /(?:^|,\s*)User-Agent(?:,|$)/i);
assert.match(androidChromeRedirect.headers.get("cache-control") || "", /no-store/);

const location = new URL(androidChromeRedirect.headers.get("location"));
assert.equal(location.origin, "https://calendar.google.com");
assert.equal(location.searchParams.get("action"), "TEMPLATE");
assert.equal(location.searchParams.get("dates"), "20261226T103000Z/20261226T140000Z");
assert.equal(location.searchParams.get("ctz"), "Asia/Ho_Chi_Minh");
assert.match(location.searchParams.get("text") || "", /Tiệc cưới Nhật & Phương/);

const forcedAndroidIcs = await fetch(`${baseUrl}/calendar/tiec-cuoi?download=1`, {
  headers: { "user-agent": userAgents.androidChrome },
  redirect: "manual",
});
assert.equal(forcedAndroidIcs.status, 200);
assert.match(forcedAndroidIcs.headers.get("content-type") || "", /^text\/calendar; charset=utf-8/i);
assert.match(
  forcedAndroidIcs.headers.get("content-disposition") || "",
  /^attachment; filename="Lich-Tiec-cuoi-Nhat-Phuong\.ics"$/i,
);

const missingResponse = await requestCalendar("khong-ton-tai", userAgents.windowsChrome);
assert.equal(missingResponse.status, 404);

const rsvpSource = await readFile(new URL("../src/app/rsvp/page.tsx", import.meta.url), "utf8");
assert.match(rsvpSource, /\/calendar\/thanh-le/);
assert.match(rsvpSource, /\/calendar\/tiec-cuoi/);
assert.match(rsvpSource, /\/calendar\/album/);
assert.match(rsvpSource, /const albumEventLabel = hasCeremony && hasBanquet/);
assert.match(rsvpSource, /"Thánh lễ Hôn phối và Tiệc cưới"/);
assert.match(rsvpSource, /: hasCeremony/);
assert.match(rsvpSource, /"Thánh lễ Hôn phối"/);
assert.match(rsvpSource, /: "Tiệc cưới"/);
assert.match(rsvpSource, /Album hình ảnh kỷ niệm \$\{albumEventLabel\} sẽ được đăng tải tại thiệp mời này vào ngày \$\{albumAvailableDate\}\./);
assert.doesNotMatch(rsvpSource, /Rất mong .*quay lại ghé thăm/);
assert.doesNotMatch(rsvpSource, /để cùng chia sẻ những khoảnh khắc đáng nhớ nhất/);
assert.doesNotMatch(rsvpSource, /\/calendar\/album-thanh-le/);
assert.doesNotMatch(rsvpSource, /\/calendar\/album-tiec-cuoi/);
assert.doesNotMatch(rsvpSource, /const openCalendar/);
assert.doesNotMatch(rsvpSource, /URL\.createObjectURL/);
assert.doesNotMatch(rsvpSource, /window\.open\(gcalUrl/);
assert.match(rsvpSource, /buildAndroidCalendarIntent/);
assert.match(rsvpSource, /fallbackUrl\.searchParams\.set\("download", "1"\)/);

console.log("Smart calendar checks passed: Apple inline ICS, Android in-app native/fallback flow, external Android Google Calendar, cache safety, and 404 handling.");
