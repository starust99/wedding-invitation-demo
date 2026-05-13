import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { generateInviteToken } from "@/lib/invites";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data: invitee, error: readError } = await supabase
    .from("invitees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  if (!invitee) {
    return NextResponse.json({ error: "Invitee not found" }, { status: 404 });
  }

  const { data: existing } = await supabase.from("invitees").select("token").neq("id", id);
  const existingTokens = new Set<string>((existing ?? []).map((row) => row.token as string));
  const nextToken = generateInviteToken(String(invitee.display_label || invitee.guest_name || "khach-moi"), existingTokens);

  const { error: updateError } = await supabase
    .from("invitees")
    .update({ token: nextToken, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ token: nextToken });
}
