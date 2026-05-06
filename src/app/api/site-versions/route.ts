import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import type { SiteSettings } from "@/lib/site-settings";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";
import type { SiteVersion, SiteVersionSource } from "@/lib/site-versions";

type VersionRow = {
  id: string;
  settings: SiteSettings;
  label: string;
  source: SiteVersionSource;
  created_at: string;
  published_at: string | null;
};

type CreateBody = {
  settings: SiteSettings;
  label: string;
  source?: SiteVersionSource;
};

type PublishBody = {
  versionId: string;
  publish: true;
};

function toVersion(row: VersionRow): SiteVersion {
  return {
    id: row.id,
    settings: row.settings,
    label: row.label,
    source: row.source,
    createdAt: row.created_at,
    publishedAt: row.published_at ?? undefined,
  };
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ versions: [], backend: "local" });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_versions")
    .select("id, settings, label, source, created_at, published_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions: (data as VersionRow[]).map(toVersion), backend: "supabase" });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = await request.json() as CreateBody | PublishBody;
  const supabase = getSupabaseServerClient();

  if ("publish" in body) {
    const { data: version, error: readError } = await supabase
      .from("site_versions")
      .select("id, settings, label, source, created_at, published_at")
      .eq("id", body.versionId)
      .maybeSingle();

    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
    if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    const row = version as VersionRow;
    const settings = row.settings;
    const publishedAt = new Date().toISOString();
    const { error: settingsError } = await supabase.from("site_settings").upsert({
      id: "main",
      content: settings.content,
      theme_key: settings.themeKey,
      published_content: settings.content,
      published_theme_key: settings.themeKey,
      published_at: publishedAt,
      updated_at: publishedAt,
    }, { onConflict: "id" });

    if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 });

    const { data: updatedVersion, error: updateError } = await supabase
      .from("site_versions")
      .update({ published_at: publishedAt })
      .eq("id", body.versionId)
      .select("id, settings, label, source, created_at, published_at")
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ version: toVersion(updatedVersion as VersionRow), backend: "supabase" });
  }

  const createdAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("site_versions")
    .insert({
      settings: body.settings,
      label: body.label.trim() || "Untitled snapshot",
      source: body.source ?? "manual",
      created_at: createdAt,
    })
    .select("id, settings, label, source, created_at, published_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ version: toVersion(data as VersionRow), backend: "supabase" });
}
