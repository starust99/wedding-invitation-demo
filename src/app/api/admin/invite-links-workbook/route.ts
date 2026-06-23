import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { buildInviteLinksWorkbook } from "@/lib/invite-spreadsheet";
import { createInvitee, type Invitee } from "@/lib/invites";

export const runtime = "nodejs";

type InviteLinksPayload = {
  invitees?: Invitee[];
  origin?: string;
};

function resolveOrigin(request: Request, origin: unknown) {
  const productionOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (process.env.NODE_ENV === "production" && productionOrigin) {
    return productionOrigin;
  }

  if (typeof origin === "string" && origin.trim()) {
    return origin.trim().replace(/\/$/, "");
  }

  const forwardedProto = request.headers.get("x-forwarded-proto") || "http";
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : productionOrigin || "";
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as InviteLinksPayload;
  const tokenPool = new Set<string>();
  const invitees = Array.isArray(body.invitees) ? body.invitees.map((invitee) => createInvitee(invitee, tokenPool)) : [];

  if (invitees.length === 0) {
    return NextResponse.json({ error: "Chưa có khách mời để xuất link." }, { status: 400 });
  }

  const workbook = await buildInviteLinksWorkbook(invitees, resolveOrigin(request, body.origin));
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="danh-sach-link-thiep-moi.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
