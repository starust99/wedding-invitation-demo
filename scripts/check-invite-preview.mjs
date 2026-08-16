import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminPanelSource = readFileSync(
  new URL("../src/components/admin/InviteAdminPanel.tsx", import.meta.url),
  "utf8",
);
assert.match(adminPanelSource, /function prewarmInvitePreview\(url: string\)/);
assert.match(adminPanelSource, /credentials: "omit"/);
assert.match(adminPanelSource, /keepalive: true/);
assert.match(adminPanelSource, /navigator\.clipboard\.writeText\(url\);\s*prewarmInvitePreview\(url\);/);

const baseUrl = (process.env.INVITE_PREVIEW_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.INVITE_PREVIEW_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const sharedRoute = `/w/${encodeURIComponent(token)}`;
const legacyRoute = `/t/${encodeURIComponent(token)}`;
const imagePath = "/assets/meta/og-wedding-20260816.jpg";
const imageUrl = `https://nhatphuong.love${imagePath}`;
const maxHeaderMs = Number(process.env.INVITE_PREVIEW_MAX_HEADER_MS || 0);
const userAgents = [
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "facebookexternalhit/1.1",
  "Facebot",
  "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
  "meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
  "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/139.0 Mobile Safari/537.36",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertInvitationPage(route, userAgent) {
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
  assert.match(head, /property="og:image:width" content="1672"/i);
  assert.match(head, /property="og:image:height" content="941"/i);
  assert.match(
    head,
    new RegExp(`<link rel="canonical" href="${escapeRegExp(absolutePageUrl)}"`, "i"),
    `${userAgent}: canonical URL must stay on the shared route`,
  );
  assert.doesNotMatch(html, /window\.location\.(?:replace|assign)|http-equiv=["']refresh/i);
  assert.match(
    html,
    /data-od-id="token-wedding-invitation"/i,
    `${userAgent}: shared URL must render the real invitation rather than a preview gateway`,
  );

  return { bytes: Buffer.byteLength(html), headBytes: Buffer.byteLength(head), headerMs };
}

let largestPage = { bytes: 0, headBytes: 0 };
const sharedHeaderTimes = [];
for (const userAgent of userAgents) {
  const result = await assertInvitationPage(sharedRoute, userAgent);
  if (result.bytes > largestPage.bytes) largestPage = result;
  sharedHeaderTimes.push(result.headerMs);
}

await assertInvitationPage(legacyRoute, userAgents[0]);

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
assert.ok(Number(imageHeadResponse.headers.get("content-length")) > 100_000);

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
  `Invite preview checks passed: ${userAgents.length} crawler/browser agents received the edge-cacheable /w invitation with OG metadata in the first ${largestPage.headBytes} bytes (response-header max ${Math.max(...sharedHeaderTimes).toFixed(0)}ms); admin copy prewarming, /t compatibility, robots.txt, and JPEG range delivery also passed.`,
);
