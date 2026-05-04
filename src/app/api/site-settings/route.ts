import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { defaultSettings, type SiteSettings } from "@/lib/site-settings";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ settings: defaultSettings, backend: "local" });
  }

  const url = new URL(request.url);
  const draft = url.searchParams.get("draft") === "1";

  if (draft && !(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("content, theme_key, published_content, published_theme_key, published_at")
    .eq("id", "main")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ settings: defaultSettings, backend: "supabase" });
  }

  const settings: SiteSettings = draft
    ? { content: data.content, themeKey: data.theme_key, publishedAt: data.published_at ?? undefined }
    : {
        content: data.published_content ?? data.content,
        themeKey: data.published_theme_key ?? data.theme_key,
        publishedAt: data.published_at ?? undefined,
      };

  return NextResponse.json({ settings, backend: "supabase" });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = await request.json() as SiteSettings & { publish?: boolean };
  const supabase = getSupabaseServerClient();
  const payload = body.publish
    ? {
        id: "main",
        content: body.content,
        theme_key: body.themeKey,
        published_content: body.content,
        published_theme_key: body.themeKey,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : {
        id: "main",
        content: body.content,
        theme_key: body.themeKey,
        updated_at: new Date().toISOString(),
      };

  const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, backend: "supabase" });
}
