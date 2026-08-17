import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminPanelSource = readFileSync(
  new URL("../src/components/admin/InviteAdminPanel.tsx", import.meta.url),
  "utf8",
);
const invitesSource = readFileSync(
  new URL("../src/lib/invites.ts", import.meta.url),
  "utf8",
);
const inviteSpreadsheetSource = readFileSync(
  new URL("../src/lib/invite-spreadsheet.ts", import.meta.url),
  "utf8",
);
const inviteCsvSource = readFileSync(
  new URL("../src/lib/csv.ts", import.meta.url),
  "utf8",
);
const inviteAccessGateSource = readFileSync(
  new URL("../src/components/InviteAccessGate.tsx", import.meta.url),
  "utf8",
);
const splashIntroSource = readFileSync(
  new URL("../src/components/WeddingSplashIntro.tsx", import.meta.url),
  "utf8",
);
const cinematicRevealSource = readFileSync(
  new URL("../src/components/ui/CinematicReveal.tsx", import.meta.url),
  "utf8",
);
const sharePageSource = readFileSync(
  new URL("../src/lib/invite-share-page.tsx", import.meta.url),
  "utf8",
);
const shareCacheSource = readFileSync(
  new URL("../src/lib/invite-share-cache.ts", import.meta.url),
  "utf8",
);
const canonicalShareRouteSource = readFileSync(
  new URL("../src/app/g/[token]/page.tsx", import.meta.url),
  "utf8",
);
const nextConfigSource = readFileSync(
  new URL("../next.config.ts", import.meta.url),
  "utf8",
);
assert.match(adminPanelSource, /async function prewarmInvitePreview\(url: string\): Promise<boolean>/);
assert.match(adminPanelSource, /async function prepareInvitePreviews\(targetInvitees: Invitee\[\], origin: string\)/);
assert.match(adminPanelSource, /credentials: "omit"/);
assert.match(adminPanelSource, /keepalive: true/);
assert.match(adminPanelSource, /navigator\.clipboard\.writeText\(url\);\s*void prewarmInvitePreview\(url\);/);
assert.match(adminPanelSource, /if \(!selectedInvitee\?\.token\) return;\s*void prewarmInvitePreview\(buildInviteUrl\(selectedInvitee\.token, window\.location\.origin\)\);/);
assert.match(adminPanelSource, /await prepareInvitePreviews\(targetInvitees, window\.location\.origin\)/);
assert.match(adminPanelSource, /link chưa sẵn sàng nên chưa xuất file/);
assert.match(invitesSource, /export const publishedInviteRoute = "\/g";/);
assert.match(invitesSource, /return `\$\{publishedInviteRoute\}\/\$\{encodeURIComponent\(token\)\}`;/);
assert.match(invitesSource, /return `\$\{base\}\$\{buildInvitePath\(token\)\}`;/);
assert.match(inviteSpreadsheetSource, /inviteUrl: buildInviteUrl\(invitee\.token, origin\)/);
assert.match(inviteCsvSource, /escapeCsv\(buildInviteUrl\(invitee\.token, origin\)\)/);
assert.match(inviteAccessGateSource, /\(dạng \/g\/…\)/);
assert.match(splashIntroSource, /pathname\.match\(\/\^\\\/\(\?:g\|i\|m\|t\|w\)\\\/\(\[\^\/\?#\]\+\)\/\)/);
assert.match(cinematicRevealSource, /pathname\.match\(\/\^\\\/\(\?:g\|i\|m\|t\|w\)\\\/\(\[\^\/\?#\]\+\)\/\)/);
assert.match(sharePageSource, /unstable_cache\(/);
assert.match(sharePageSource, /export async function listSharedInvitationTokens\(\): Promise<string\[\]>/);
assert.match(sharePageSource, /invitee\.guestName\s*\|\|\s*invitee\.displayLabel/);
assert.match(canonicalShareRouteSource, /export async function generateStaticParams\(\)/);
assert.match(canonicalShareRouteSource, /await listSharedInvitationTokens\(\)/);
assert.match(shareCacheSource, /sharedInvitationRoutes = \["\/g", "\/w", "\/t"\]/);
for (const crawler of ["facebookexternalhit", "Facebot", "meta-externalagent", "meta-externalfetcher", "Zalo", "TelegramBot", "Viber", "Line", "KakaoTalk", "Pinterestbot"]) {
  assert.ok(nextConfigSource.includes(crawler), `htmlLimitedBots must include ${crawler}`);
}

const baseUrl = (process.env.INVITE_PREVIEW_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.INVITE_PREVIEW_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const sharedRoute = `/g/${encodeURIComponent(token)}`;
const compatibilityRoutes = [
  `/w/${encodeURIComponent(token)}`,
  `/t/${encodeURIComponent(token)}`,
];
const imagePath = "/assets/meta/og-wedding-1200x630-20260817.jpg";
const imageUrl = `https://nhatphuong.love${imagePath}`;
const maxHeaderMs = Number(process.env.INVITE_PREVIEW_MAX_HEADER_MS || 0);
const userAgents = [
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "facebookexternalhit/1.1",
  "Facebot",
  "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
  "meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
  "ZaloBot/1.0",
  "Mozilla/5.0 ZaloPC/24.8",
  "WhatsApp/2.24.17.79 A",
  "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  "Discordbot/2.0",
  "TelegramBot (like TwitterBot)",
  "Twitterbot/1.0",
  "LinkedInBot/1.0",
  "Applebot/0.1",
  "Viber/21.7.0.0",
  "Line/14.12.0",
  "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/139.0 Mobile Safari/537.36",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function getMetaContent(head, property) {
  const match = head.match(new RegExp(`property="${escapeRegExp(property)}" content="([^"]*)"`, "i"));
  return match ? decodeHtmlAttribute(match[1]) : "";
}

async function resolveExpectedGuestName() {
  if (process.env.INVITE_PREVIEW_GUEST_NAME) return process.env.INVITE_PREVIEW_GUEST_NAME;

  const response = await fetch(`${baseUrl}/api/invites/${encodeURIComponent(token)}`);
  assert.equal(response.status, 200, "preview fixture must resolve through the invitation API");
  const payload = await response.json();
  const guestName = String(payload?.invitee?.guestName || "").trim();
  assert.ok(guestName, "preview fixture must include Cụm tên khách");
  return guestName;
}

async function assertInvitationPage(route, userAgent, expectedGuestName) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${route}`, {
    headers: { "user-agent": userAgent },
    redirect: "manual",
  });
  const headerMs = performance.now() - startedAt;
  assert.equal(response.status, 200, `${userAgent}: ${route} must be directly crawlable`);
  assert.match(response.headers.get("content-type") || "", /^text\/html/i);
  assert.doesNotMatch(
    response.headers.get("cache-control") || "",
    /private|no-store/i,
    `${userAgent}: shared invitation HTML must remain edge-cacheable`,
  );
  if (maxHeaderMs > 0) {
    assert.ok(
      headerMs <= maxHeaderMs,
      `${userAgent}: response headers took ${headerMs.toFixed(0)}ms (budget ${maxHeaderMs}ms)`,
    );
  }

  const html = await response.text();
  const headEnd = html.indexOf("</head>");
  assert.ok(headEnd > 0, `${userAgent}: response must contain a complete head`);
  const head = html.slice(0, headEnd + 7);
  const absolutePageUrl = `https://nhatphuong.love${route}`;

  assert.match(head, /property="og:title"/i, `${userAgent}: OG title must be emitted inside head`);
  assert.match(head, /property="og:description"/i, `${userAgent}: OG description must be emitted inside head`);
  assert.equal(
    getMetaContent(head, "og:title"),
    `Thiệp mời: ${expectedGuestName} | Nhật & Phương`,
    `${userAgent}: OG title must preserve Cụm tên khách`,
  );
  assert.equal(
    getMetaContent(head, "og:description"),
    `Trân trọng mời ${expectedGuestName} đến chung vui trong ngày trọng đại của Nhật & Phương.`,
    `${userAgent}: OG description must preserve Cụm tên khách`,
  );
  assert.match(
    head,
    new RegExp(`property="og:url" content="${escapeRegExp(absolutePageUrl)}"`, "i"),
    `${userAgent}: OG URL must match the shared content URL`,
  );
  assert.match(
    head,
    new RegExp(`property="og:image" content="${escapeRegExp(imageUrl)}"`, "i"),
    `${userAgent}: OG image must use a fresh physical filename`,
  );
  assert.match(head, /property="og:image:secure_url"/i);
  assert.match(head, /property="og:image:type" content="image\/jpeg"/i);
  assert.match(head, /property="og:image:width" content="1200"/i);
  assert.match(head, /property="og:image:height" content="630"/i);
  assert.match(
    head,
    new RegExp(`<link rel="canonical" href="${escapeRegExp(absolutePageUrl)}"`, "i"),
    `${userAgent}: canonical URL must stay on the shared route`,
  );
  const ogImageOffset = Buffer.byteLength(html.slice(0, html.indexOf('property="og:image"')));
  assert.ok(
    ogImageOffset > 0 && ogImageOffset < 4096,
    `${userAgent}: OG image must begin inside the first 4096 bytes (observed ${ogImageOffset})`,
  );
  assert.doesNotMatch(html, /window\.location\.(?:replace|assign)|http-equiv=["']refresh/i);
  assert.match(
    html,
    /data-od-id="token-wedding-invitation"/i,
    `${userAgent}: shared URL must render the real invitation rather than a preview gateway`,
  );

  return { bytes: Buffer.byteLength(html), headBytes: Buffer.byteLength(head), headerMs };
}

const expectedGuestName = await resolveExpectedGuestName();
let largestPage = { bytes: 0, headBytes: 0 };
const sharedHeaderTimes = [];
for (const userAgent of userAgents) {
  const result = await assertInvitationPage(sharedRoute, userAgent, expectedGuestName);
  if (result.bytes > largestPage.bytes) largestPage = result;
  sharedHeaderTimes.push(result.headerMs);
}

for (const route of compatibilityRoutes) {
  await assertInvitationPage(route, userAgents[0], expectedGuestName);
}

const rangedPageResponse = await fetch(`${baseUrl}${sharedRoute}`, {
  headers: {
    "user-agent": userAgents[0],
    range: "bytes=0-4095",
  },
});
assert.ok([200, 206].includes(rangedPageResponse.status));
const rangedPageHtml = await rangedPageResponse.text();
assert.match(rangedPageHtml, /property="og:title"/i, "first 4096 HTML bytes must include OG title");
assert.match(rangedPageHtml, /property="og:image"/i, "first 4096 HTML bytes must include OG image");

const invalidResponse = await fetch(`${baseUrl}/g/not-a-real-invite-token-preview-check`, {
  headers: { "user-agent": userAgents[0] },
  redirect: "manual",
});
assert.equal(invalidResponse.status, 404, "invalid shared tokens must remain status-correct");
assert.match(await invalidResponse.text(), /name="robots" content="[^"]*noindex/i);

const robotsResponse = await fetch(`${baseUrl}/robots.txt`, { redirect: "manual" });
assert.equal(robotsResponse.status, 200, "robots.txt must be explicit and crawlable");
assert.match(robotsResponse.headers.get("content-type") || "", /^text\/plain/i);
const robots = await robotsResponse.text();
assert.match(robots, /User-Agent: facebookexternalhit[\s\S]*Allow: \//i);
assert.match(robots, /User-Agent: \*[\s\S]*Allow: \//i);

const imageHeadResponse = await fetch(`${baseUrl}${imagePath}`, {
  method: "HEAD",
  headers: { "user-agent": userAgents[0] },
});
assert.equal(imageHeadResponse.status, 200);
assert.equal(imageHeadResponse.headers.get("content-type"), "image/jpeg");
assert.ok(Number(imageHeadResponse.headers.get("content-length")) > 10_000);
assert.ok(Number(imageHeadResponse.headers.get("content-length")) < 300_000);
assert.match(imageHeadResponse.headers.get("cache-control") || "", /max-age=31536000/);
assert.match(imageHeadResponse.headers.get("cache-control") || "", /immutable/);

const imageFullResponse = await fetch(`${baseUrl}${imagePath}`, {
  headers: { "user-agent": userAgents[0] },
});
assert.equal(imageFullResponse.status, 200);
const fullImage = new Uint8Array(await imageFullResponse.arrayBuffer());
assert.deepEqual([...fullImage.slice(0, 2)], [0xff, 0xd8], "OG image must be a valid JPEG stream");

function readJpegFrame(bytes) {
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        marker,
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
      };
    }
    if (segmentLength < 2) break;
    offset += 2 + segmentLength;
  }
  return null;
}

const jpegFrame = readJpegFrame(fullImage);
assert.deepEqual(
  jpegFrame,
  { marker: 0xc0, width: 1200, height: 630 },
  "OG image must be a baseline 1200x630 JPEG",
);

const imageResponse = await fetch(`${baseUrl}${imagePath}`, {
  headers: {
    "user-agent": userAgents[0],
    range: "bytes=0-1023",
  },
});
assert.equal(imageResponse.status, 206, "OG image must support Meta range requests");
assert.equal(imageResponse.headers.get("content-type"), "image/jpeg");
assert.match(imageResponse.headers.get("content-range") || "", /^bytes 0-1023\//);
const image = new Uint8Array(await imageResponse.arrayBuffer());
assert.equal(image.byteLength, 1024);
assert.deepEqual([...image.slice(0, 2)], [0xff, 0xd8], "OG image must be a valid JPEG stream");

console.log(
  `Invite preview checks passed: ${userAgents.length} crawler/browser agents received personalized Cụm tên khách metadata on the edge-cacheable /g invitation, with a baseline 1200x630 OG image inside the first 4096 bytes (full head ${largestPage.headBytes} bytes, response-header max ${Math.max(...sharedHeaderTimes).toFixed(0)}ms); /w and /t compatibility, build-time /g generation, publish-ready Admin warming, robots.txt, and HTML/JPEG range delivery also passed.`,
);
