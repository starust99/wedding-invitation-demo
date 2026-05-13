import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { createMediaAsset, defaultAlbumRules, type AlbumRule, type MediaAsset } from "@/lib/invites";
import {
  mapAlbumRuleRow,
  mapMediaAssetRow,
  toAlbumRuleUpsert,
  toMediaAssetUpsert,
  type AlbumRuleDatabaseRow,
  type MediaAssetDatabaseRow,
} from "@/lib/invite-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

type MediaPayload = {
  asset?: Partial<MediaAsset>;
  assets?: MediaAsset[];
  albumRules?: AlbumRule[];
};

async function deleteMissingRows(
  table: "media_assets" | "album_rules",
  column: "id" | "audience_tag",
  keepValues: string[],
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from(table).select(column);

  if (error) return error;

  const keep = new Set(keepValues);
  const deleteValues = (data ?? [])
    .map((row) => String((row as Record<string, unknown>)[column] ?? ""))
    .filter((value) => value && !keep.has(value));

  if (deleteValues.length === 0) return null;

  const { error: deleteError } = await supabase.from(table).delete().in(column, deleteValues);
  return deleteError;
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ backend: "local", mediaAssets: [], albumRules: defaultAlbumRules });
  }

  const supabase = getSupabaseServerClient();
  const [mediaResult, rulesResult] = await Promise.all([
    supabase.from("media_assets").select("*").order("updated_at", { ascending: false }),
    supabase.from("album_rules").select("*").order("audience_tag", { ascending: true }),
  ]);

  if (mediaResult.error) return NextResponse.json({ error: mediaResult.error.message }, { status: 500 });
  if (rulesResult.error) return NextResponse.json({ error: rulesResult.error.message }, { status: 500 });

  return NextResponse.json({
    backend: "supabase",
    mediaAssets: (mediaResult.data ?? []).map((row) => mapMediaAssetRow(row as MediaAssetDatabaseRow)),
    albumRules: (rulesResult.data ?? []).map((row) => mapAlbumRuleRow(row as AlbumRuleDatabaseRow)),
  });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = await request.json() as MediaPayload;
  const hasAssetList = Array.isArray(body.assets);
  const hasRuleList = Array.isArray(body.albumRules);
  const assets = hasAssetList ? body.assets ?? [] : body.asset ? [createMediaAsset(body.asset)] : [];
  const supabase = getSupabaseServerClient();

  if (assets.length > 0) {
    const { error } = await supabase.from("media_assets").upsert(assets.map(toMediaAssetUpsert), { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (hasAssetList) {
    const deleteError = await deleteMissingRows("media_assets", "id", assets.map((asset) => asset.id));
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (body.albumRules?.length) {
    const { error } = await supabase.from("album_rules").upsert(body.albumRules.map(toAlbumRuleUpsert), { onConflict: "audience_tag" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (hasRuleList) {
    const deleteError = await deleteMissingRows("album_rules", "audience_tag", (body.albumRules ?? []).map((rule) => rule.audienceTag));
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, backend: "supabase" });
}
