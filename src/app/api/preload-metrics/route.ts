import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const viewportValues = new Set(["mobile", "desktop-ipad", "desktop"]);
const runtimeValues = new Set(["webkit", "embedded-webview", "chromium", "other"]);

function boundedNumber(value: unknown, maximum: number) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > maximum) return null;
  return Math.round(number);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2_048) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const viewport = typeof body?.viewport === "string" && viewportValues.has(body.viewport)
    ? body.viewport
    : null;
  const runtimeClass = typeof body?.runtimeClass === "string" && runtimeValues.has(body.runtimeClass)
    ? body.runtimeClass
    : null;
  const preloadDurationMs = boundedNumber(body?.preloadDurationMs, 180_000);
  const firstProgressMs = boundedNumber(body?.firstProgressMs, 180_000);
  const criticalBytes = boundedNumber(body?.criticalBytes, 30_000_000);

  if (!viewport || !runtimeClass || preloadDurationMs === null || firstProgressMs === null || criticalBytes === null) {
    return NextResponse.json({ error: "Invalid preload metric" }, { status: 400 });
  }

  // Deliberately exclude the invitation token, guest name, IP and RSVP data.
  // Vercel's request headers add only coarse country/edge context for comparing
  // the same preload across continents.
  console.info("wedding_preload_metric", JSON.stringify({
    viewport,
    runtimeClass,
    preloadDurationMs,
    firstProgressMs,
    criticalBytes,
    country: request.headers.get("x-vercel-ip-country") || "unknown",
    edge: (request.headers.get("x-vercel-id") || "unknown").split("::")[0],
  }));

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
