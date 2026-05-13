import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { parseInviteCsv, type Invitee } from "@/lib/invites";
import {
  mapMediaAssetRow,
  mapAlbumRuleRow,
  mapInviteSupplementRow as mapSupplementRow,
  mapInviteeRow as mapInviteRow,
  toInviteeUpsert,
  type AlbumRuleDatabaseRow,
  type InviteSupplementDatabaseRow,
  type InviteeDatabaseRow,
  type MediaAssetDatabaseRow,
} from "@/lib/invite-mapper";
import { mapRSVPRow, type RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

type AdminInvitePayload = {
  invitees?: Invitee[];
  csv?: string;
};

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ backend: "local", invitees: [], supplements: [], mediaAssets: [], albumRules: [] });
  }

  const supabase = getSupabaseServerClient();
  const [
    inviteesResult,
    supplementsResult,
    responsesResult,
    mediaResult,
    albumRulesResult,
  ] = await Promise.all([
    supabase.from("invitees").select("*").order("updated_at", { ascending: false }),
    supabase.from("invite_supplements").select("*"),
    supabase.from("rsvp_responses").select("*").order("submitted_at", { ascending: false }),
    supabase.from("media_assets").select("*").order("updated_at", { ascending: false }),
    supabase.from("album_rules").select("*"),
  ]);

  if (inviteesResult.error) return NextResponse.json({ error: inviteesResult.error.message }, { status: 500 });
  if (supplementsResult.error) return NextResponse.json({ error: supplementsResult.error.message }, { status: 500 });
  if (responsesResult.error) return NextResponse.json({ error: responsesResult.error.message }, { status: 500 });
  if (mediaResult.error) return NextResponse.json({ error: mediaResult.error.message }, { status: 500 });
  if (albumRulesResult.error) return NextResponse.json({ error: albumRulesResult.error.message }, { status: 500 });

  const supplementsByInvitee = new Map<string, InviteSupplementDatabaseRow>();
  for (const supplement of (supplementsResult.data ?? []) as InviteSupplementDatabaseRow[]) {
    supplementsByInvitee.set(supplement.invitee_id, supplement);
  }

  const responsesByToken = new Map<string, RSVPDatabaseRow>();
  for (const response of (responsesResult.data ?? []) as RSVPDatabaseRow[]) {
    const key = response.invite_token || response.display_label || response.name;
    if (!responsesByToken.has(key)) responsesByToken.set(key, response);
  }

  const invitees = (inviteesResult.data ?? []).map((row) => {
    const invitee = mapInviteRow(row as InviteeDatabaseRow, supplementsByInvitee.get((row as InviteeDatabaseRow).id) ? mapSupplementRow(supplementsByInvitee.get((row as InviteeDatabaseRow).id)!) : undefined);
    const rsvpKey = invitee.token || invitee.displayLabel || invitee.guestName;
    const response = responsesByToken.get(rsvpKey);
    return response ? { ...invitee, rsvp: mapRSVPRow(response) } : invitee;
  });

  return NextResponse.json({
    backend: "supabase",
    invitees,
    mediaAssets: (mediaResult.data ?? []).map((row) => mapMediaAssetRow(row as MediaAssetDatabaseRow)),
    albumRules: (albumRulesResult.data ?? []).map((row) => mapAlbumRuleRow(row as AlbumRuleDatabaseRow)),
  });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = await request.json() as AdminInvitePayload;
  const invitees = body.invitees ?? (body.csv ? parseInviteCsv(body.csv).invitees : []);

  if (invitees.length === 0) {
    return NextResponse.json({ error: "No invitees provided" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("invitees")
    .upsert(invitees.map((invitee) => ({
      ...toInviteeUpsert(invitee),
      created_at: invitee.createdAt,
    })), { onConflict: "token" })
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    backend: "supabase",
    invitees: (data ?? []).map((row) => mapInviteRow(row as InviteeDatabaseRow)),
  });
}
