import {
  buildGoogleCalendarUrl,
  buildIcsCalendar,
  getWeddingCalendarEvent,
  shouldUseGoogleCalendar,
} from "@/lib/wedding-calendar";

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
  const event = getWeddingCalendarEvent(eventId);

  if (!event) {
    return new Response("Không tìm thấy sự kiện.", {
      status: 404,
      headers: {
        ...sharedHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const userAgent = request.headers.get("user-agent") ?? "";

  if (shouldUseGoogleCalendar(userAgent)) {
    return new Response(null, {
      status: 302,
      headers: {
        ...sharedHeaders,
        Location: buildGoogleCalendarUrl(event),
      },
    });
  }

  return new Response(buildIcsCalendar(event), {
    status: 200,
    headers: {
      ...sharedHeaders,
      "Content-Disposition": `attachment; filename="${event.fileName}"`,
      "Content-Language": "vi",
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}

