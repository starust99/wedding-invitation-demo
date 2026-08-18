import {
  buildGoogleCalendarUrl,
  buildIcsCalendar,
  getWeddingCalendarEvent,
  shouldPresentIcsInline,
  shouldUseGoogleCalendar,
} from "@/lib/wedding-calendar";
import { defaultSettings, normalizeSettings, settingsSchemaVersion } from "@/lib/site-settings";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { resolveInviteEventAccess } from "@/lib/invite-event-access";

export const dynamic = "force-dynamic";

const sharedHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  Vary: "User-Agent",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ event: string }> },
) {
  const { event: eventId } = await params;
  let settings = defaultSettings;

  if (hasSupabaseEnv()) {
    const { data } = await getSupabaseServerClient()
      .from("site_settings")
      .select("content, theme_key, published_content, published_theme_key, published_at")
      .eq("id", "main")
      .maybeSingle();

    if (data) {
      settings = normalizeSettings({
        schemaVersion: settingsSchemaVersion,
        content: data.published_content ?? data.content,
        themeKey: data.published_theme_key ?? data.theme_key,
        publishedAt: data.published_at ?? undefined,
      });
    }
  }

  const event = getWeddingCalendarEvent(eventId, settings.content);

  if (!event) {
    return new Response("Không tìm thấy sự kiện.", {
      status: 404,
      headers: {
        ...sharedHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const requestUrl = new URL(request.url);
  const inviteToken = requestUrl.searchParams.get("invite")?.trim();

  if (eventId === "thanh-le" && inviteToken && hasSupabaseEnv()) {
    const { data: invitee, error: inviteeError } = await getSupabaseServerClient()
      .from("invitees")
      .select("guest_group, post_ceremony_party_invited")
      .eq("token", inviteToken)
      .maybeSingle();

    const eventAccess = resolveInviteEventAccess({
      guestGroup: invitee?.guest_group,
      postCeremonyPartyInvited: invitee?.post_ceremony_party_invited,
    });
    if (inviteeError || !invitee || !eventAccess.canViewCeremony) {
      return new Response("Không tìm thấy sự kiện.", {
        status: inviteeError ? 500 : 404,
        headers: {
          ...sharedHeaders,
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
  }

  const personalInvitationUrl = inviteToken
    ? `https://nhatphuong.love/i/${encodeURIComponent(inviteToken)}`
    : "https://nhatphuong.love";
  const personalizedEvent = {
    ...event,
    invitationUrl: personalInvitationUrl,
  };

  const userAgent = request.headers.get("user-agent") ?? "";
  const forceIcsDownload = requestUrl.searchParams.get("download") === "1";

  if (!forceIcsDownload && shouldUseGoogleCalendar(userAgent)) {
    return new Response(null, {
      status: 302,
      headers: {
        ...sharedHeaders,
        Location: buildGoogleCalendarUrl(personalizedEvent),
      },
    });
  }

  return new Response(buildIcsCalendar(personalizedEvent), {
    status: 200,
    headers: {
        ...sharedHeaders,
        "Content-Disposition": `${shouldPresentIcsInline(userAgent) ? "inline" : "attachment"}; filename="${personalizedEvent.fileName}"`,
      "Content-Language": "vi",
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}
