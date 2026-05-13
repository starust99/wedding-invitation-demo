import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { parseInviteWorkbook } from "@/lib/invite-spreadsheet";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const coupleDisplayName = formData.get("coupleDisplayName");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file Excel." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Chỉ nhận file .xlsx." }, { status: 400 });
  }

  const parsed = await parseInviteWorkbook(await file.arrayBuffer(), [], {
    coupleDisplayName: typeof coupleDisplayName === "string" ? coupleDisplayName : undefined,
  });
  return NextResponse.json(parsed);
}
