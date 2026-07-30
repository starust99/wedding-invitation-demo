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

export const dynamic = "force-dynamic";

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

  const responsesByKey = new Map<string, RSVPDatabaseRow>();
  for (const response of (responsesResult.data ?? []) as RSVPDatabaseRow[]) {
    if (response.invitee_id) responsesByKey.set(`id:${response.invitee_id}`, response);
    if (response.invite_token) responsesByKey.set(`token:${response.invite_token}`, response);
    if (response.display_label && !responsesByKey.has(`label:${response.display_label.trim().toLowerCase()}`)) {
      responsesByKey.set(`label:${response.display_label.trim().toLowerCase()}`, response);
    }
    if (response.name && !responsesByKey.has(`name:${response.name.trim().toLowerCase()}`)) {
      responsesByKey.set(`name:${response.name.trim().toLowerCase()}`, response);
    }
  }

  const invitees = (inviteesResult.data ?? []).map((row) => {
    const invitee = mapInviteRow(row as InviteeDatabaseRow, supplementsByInvitee.get((row as InviteeDatabaseRow).id) ? mapSupplementRow(supplementsByInvitee.get((row as InviteeDatabaseRow).id)!) : undefined);
    const response =
      responsesByKey.get(`id:${invitee.id}`) ||
      responsesByKey.get(`token:${invitee.token}`) ||
      responsesByKey.get(`label:${invitee.displayLabel.trim().toLowerCase()}`) ||
      responsesByKey.get(`name:${invitee.guestName.trim().toLowerCase()}`);
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
