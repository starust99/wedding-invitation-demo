import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, isValidAdminSessionToken } from "@/lib/admin-auth";

function isLoginPage(pathname: string) {
  return pathname === "/admin/login";
}

const messengerWebProbePath = "/g/messenger-web-probe-20260817";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === messengerWebProbePath) {
    console.info(JSON.stringify({
      event: "messenger-web-preview-probe",
      userAgent: request.headers.get("user-agent") ?? "",
      accept: request.headers.get("accept") ?? "",
      purpose: request.headers.get("purpose") ?? request.headers.get("sec-purpose") ?? "",
    }));
    return NextResponse.next();
  }

  if (isLoginPage(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(adminSessionCookie)?.value;
  if (isValidAdminSessionToken(sessionToken)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/g/messenger-web-probe-20260817"],
};
