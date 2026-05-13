import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { buildInviteTemplateWorkbook } from "@/lib/invite-spreadsheet";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const coupleDisplayName = new URL(request.url).searchParams.get("coupleDisplayName") ?? undefined;
  const workbook = await buildInviteTemplateWorkbook({ coupleDisplayName });
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="mau-danh-sach-khach-moi.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
