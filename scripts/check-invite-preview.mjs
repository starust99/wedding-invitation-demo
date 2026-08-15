import assert from "node:assert/strict";

const baseUrl = (process.env.INVITE_PREVIEW_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.INVITE_PREVIEW_TOKEN || "gia-dinh-anh-chi-hien-hong-b30c877d";
const expectedVersion = "20260816";
const metaUserAgents = [
  "facebookexternalhit/1.1 (+https://www.facebook.com/externalhit_uatext.php)",
  "Facebot",
  "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
  "meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
];

for (const userAgent of metaUserAgents) {
  const response = await fetch(`${baseUrl}/t/${encodeURIComponent(token)}`, {
    headers: { "user-agent": userAgent },
    redirect: "manual",
  });
  assert.equal(response.status, 200, `${userAgent}: invite route must be directly crawlable`);
  assert.match(response.headers.get("content-type") || "", /^text\/html/i);

  const html = await response.text();
  const head = html.slice(0, html.indexOf("</head>") + 7);
  assert.match(head, /property="og:title"/i, `${userAgent}: OG title must be emitted inside head`);
  assert.match(head, /property="og:description"/i, `${userAgent}: OG description must be emitted inside head`);
  assert.match(
    head,
    new RegExp(`property="og:url" content="[^"]*/t/${token}"`, "i"),
    `${userAgent}: OG URL must preserve the short public link`,
  );
  assert.match(
    head,
    new RegExp(`property="og:image" content="[^"]*og-invitation-v2\\.jpg\\?v=${expectedVersion}"`, "i"),
    `${userAgent}: OG image must use the fresh preview version`,
  );
  assert.match(
    html,
    new RegExp(`window\\.location\\.replace\\("/i/${token}"\\)`),
    `${userAgent}: a human opening the preview URL must be handed to the invitation`,
  );
  assert.ok(
    html.length < 8_000,
    `${userAgent}: preview HTML must stay lightweight enough for Messenger's composer timeout`,
  );
}

const imageResponse = await fetch(`${baseUrl}/assets/og-invitation-v2.jpg?v=${expectedVersion}`, {
  headers: { "user-agent": metaUserAgents[0] },
});
assert.equal(imageResponse.status, 200);
assert.equal(imageResponse.headers.get("content-type"), "image/jpeg");
const image = new Uint8Array(await imageResponse.arrayBuffer());
assert.ok(image.byteLength > 100_000, "OG image must not be an empty or placeholder response.");
assert.deepEqual([...image.slice(0, 2)], [0xff, 0xd8], "OG image must be a valid JPEG stream.");

console.log("Invite preview checks passed: all Meta crawler agents receive versioned OG metadata in head and a valid JPEG thumbnail.");
