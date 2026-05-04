import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { mapRSVPRow, toRSVPInsert, type RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

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

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = await request.json();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("rsvp_responses")
    .insert(toRSVPInsert(body))
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ response: mapRSVPRow(data as RSVPDatabaseRow), backend: "supabase" });
}
