import { NextResponse } from "next/server";
import { defaultAlbumRules, filterMediaAssetsForInvitee } from "@/lib/invites";
import {
  mapAlbumRuleRow,
  mapInviteSupplementRow,
  mapInviteeRow,
  mapMediaAssetRow,
  type AlbumRuleDatabaseRow,
  type InviteSupplementDatabaseRow,
  type InviteeDatabaseRow,
  type MediaAssetDatabaseRow,
} from "@/lib/invite-mapper";
import { mapRSVPRow, type RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { token } = await params;
  const supabase = getSupabaseServerClient();
  const { data: inviteeRow, error: inviteeError } = await supabase
    .from("invitees")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteeError) {
    return NextResponse.json({ error: inviteeError.message }, { status: 500 });
  }

  if (!inviteeRow) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const invitee = inviteeRow as InviteeDatabaseRow;
  const [supplementResult, rsvpResult, mediaResult, rulesResult] = await Promise.all([
    supabase.from("invite_supplements").select("*").eq("invitee_id", invitee.id).maybeSingle(),
    supabase.from("rsvp_responses").select("*").or(`invite_token.eq.${token},invitee_id.eq.${invitee.id}`).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("media_assets").select("*").eq("status", "published").order("updated_at", { ascending: false }),
    supabase.from("album_rules").select("*"),
  ]);

  if (supplementResult.error) return NextResponse.json({ error: supplementResult.error.message }, { status: 500 });
  if (rsvpResult.error) return NextResponse.json({ error: rsvpResult.error.message }, { status: 500 });
  if (mediaResult.error) return NextResponse.json({ error: mediaResult.error.message }, { status: 500 });
  if (rulesResult.error) return NextResponse.json({ error: rulesResult.error.message }, { status: 500 });

  const supplement = supplementResult.data
    ? mapInviteSupplementRow(supplementResult.data as InviteSupplementDatabaseRow)
    : undefined;
  const rsvp = rsvpResult.data ? mapRSVPRow(rsvpResult.data as RSVPDatabaseRow) : undefined;
  const mappedInvitee = mapInviteeRow(invitee, supplement, rsvp);
  const rules = rulesResult.data?.length
    ? (rulesResult.data as AlbumRuleDatabaseRow[]).map(mapAlbumRuleRow)
    : defaultAlbumRules;
  const mediaAssets = (mediaResult.data ?? []).map((row) => mapMediaAssetRow(row as MediaAssetDatabaseRow));

  return NextResponse.json({
    backend: "supabase",
    invitee: mappedInvitee,
    albumRules: rules,
    mediaAssets: filterMediaAssetsForInvitee(mediaAssets, mappedInvitee, rules),
  });
}
