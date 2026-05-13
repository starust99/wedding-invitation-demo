import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: "Admin password is not configured." }, { status: 500 });
  }

  if (!isValidAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const sessionToken = createAdminSessionToken();
  if (!sessionToken) {
    return NextResponse.json({ error: "Admin session could not be created." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookie, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: adminSessionMaxAgeSeconds,
  });

  return response;
}
