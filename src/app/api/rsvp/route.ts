import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { mapRSVPRow, type RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ responses: [], backend: "local" });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("rsvp_responses")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ responses: (data as RSVPDatabaseRow[]).map(mapRSVPRow), backend: "supabase" });
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? [...new Set(body.ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0))]
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "Thiếu danh sách ID cần xoá." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: rowsToDelete } = await supabase
    .from("rsvp_responses")
    .select("invitee_id, invite_token")
    .in("id", ids);

  const { error } = await supabase
    .from("rsvp_responses")
    .delete()
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (rowsToDelete && rowsToDelete.length > 0) {
    const inviteeIds = rowsToDelete.map((r) => r.invitee_id).filter((id): id is string => Boolean(id));
    const tokens = rowsToDelete.map((r) => r.invite_token).filter((t): t is string => Boolean(t));

    if (inviteeIds.length > 0) {
      await supabase.from("invitees").update({ invite_status: "invited", updated_at: new Date().toISOString() }).in("id", inviteeIds);
    }
    if (tokens.length > 0) {
      await supabase.from("invitees").update({ invite_status: "invited", updated_at: new Date().toISOString() }).in("token", tokens);
    }
  }

  return NextResponse.json({ ok: true, deletedIds: ids, backend: "supabase" });
}
