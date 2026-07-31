import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookie,
  adminSessionMaxAgeSeconds,
  createAdminSessionToken,
  isAdminAuthConfigured,
  isValidAdminPassword,
} from "@/lib/admin-auth";

function shouldUseSecureCookie(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return new URL(request.url).protocol === "https:" || forwardedProto === "https";
}

function getSafeDestination(value: FormDataEntryValue | string | null) {
  const destination = typeof value === "string" ? value : "";
  if (destination === "/" || destination.startsWith("/?")) return destination;
  if (destination === "/admin" || destination.startsWith("/admin/") || destination.startsWith("/admin?")) return destination;
  return "/admin";
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderPasswordPage(nextPath: string, hasError = false) {
  const errorMarkup = hasError ? '<p role="alert">Incorrect password.</p>' : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Enter password</title>
    <style>
      *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#f8f3ea;color:#2e2a25;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;display:grid;place-items:center;padding:20px}form{width:min(100%,320px)}label{display:block;font-size:14px;font-weight:600}.row{display:flex;gap:8px;margin-top:8px}input{min-width:0;min-height:44px;flex:1;border:1px solid #cfc4b5;border-radius:8px;background:#fffdf8;padding:0 12px;font:inherit;outline:none}input:focus{border-color:#5f6f4e;box-shadow:0 0 0 2px rgba(95,111,78,.15)}button{min-width:44px;min-height:44px;border:0;border-radius:8px;background:#5f6f4e;color:#fffdf8;font-size:19px;cursor:pointer}p{margin:8px 0 0;color:#9b4e5c;font-size:12px}
    </style>
  </head>
  <body>
    <form method="post" action="/admin/login" autocomplete="on">
      <label for="password">Enter password:</label>
      <div class="row">
        <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
        <button type="submit" aria-label="Submit password">→</button>
      </div>
      <input name="next" type="hidden" value="${escapeAttribute(nextPath)}">
      ${errorMarkup}
    </form>
  </body>
</html>`;
}

function htmlResponse(nextPath: string, hasError = false, status = 200) {
  return new NextResponse(renderPasswordPage(nextPath, hasError), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}

export function GET(request: NextRequest) {
  const nextPath = getSafeDestination(request.nextUrl.searchParams.get("next"));
  return htmlResponse(nextPath, request.nextUrl.searchParams.get("error") === "1");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = formData.get("password");
  const nextPath = getSafeDestination(formData.get("next"));

  if (!isAdminAuthConfigured()) {
    return htmlResponse(nextPath, true, 500);
  }

  if (typeof password !== "string" || !isValidAdminPassword(password)) {
    return htmlResponse(nextPath, true, 401);
  }

  const sessionToken = createAdminSessionToken();
  if (!sessionToken) {
    return htmlResponse(nextPath, true, 500);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  response.cookies.set(adminSessionCookie, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: adminSessionMaxAgeSeconds,
  });
  return response;
}
