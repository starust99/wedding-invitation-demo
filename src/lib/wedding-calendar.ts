import { weddingConfig } from "@/config/wedding.config";

export type WeddingCalendarEventId = "thanh-le" | "tiec-cuoi";

export type WeddingCalendarEvent = {
  id: WeddingCalendarEventId;
  title: string;
  startUtc: string;
  endUtc: string;
  timeLabel: string;
  location: string;
  mapUrl: string;
  description: string;
  fileName: string;
  uid: string;
};

const invitationUrl = "https://nhatphuong.love";

const weddingCalendarEvents: Record<WeddingCalendarEventId, WeddingCalendarEvent> = {
  "thanh-le": {
    id: "thanh-le",
    title: `Thánh lễ Hôn phối ${weddingConfig.couple.displayName}`,
    startUtc: "20261220T030000Z",
    endUtc: "20261220T043000Z",
    timeLabel: "10:00 ngày 20/12/2026",
    location: `${weddingConfig.church.name} (${weddingConfig.church.address})`,
    mapUrl: weddingConfig.church.mapUrl,
    description: `Thánh lễ Hôn phối của ${weddingConfig.couple.displayName}.`,
    fileName: "Lich-Thanh-le-Nhat-Phuong.ics",
    uid: "thanh-le-20261220@nhatphuong.love",
  },
  "tiec-cuoi": {
    id: "tiec-cuoi",
    title: `Tiệc cưới ${weddingConfig.couple.displayName}`,
    startUtc: "20261226T103000Z",
    endUtc: "20261226T140000Z",
    timeLabel: "17:30 ngày 26/12/2026",
    location: `${weddingConfig.venue.name} (${weddingConfig.venue.address})`,
    mapUrl: weddingConfig.venue.mapUrl,
    description: `Tiệc cưới của ${weddingConfig.couple.displayName}.`,
    fileName: "Lich-Tiec-cuoi-Nhat-Phuong.ics",
    uid: "tiec-cuoi-20261226@nhatphuong.love",
  },
};

export function getWeddingCalendarEvent(value: string) {
  return weddingCalendarEvents[value as WeddingCalendarEventId] ?? null;
}

export function shouldUseGoogleCalendar(userAgent: string) {
  return /Android/i.test(userAgent);
}

export function shouldPresentIcsInline(userAgent: string) {
  const isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && /Mobile\//i.test(userAgent));
  const isExternalIosBrowser = /Version\/\d+(?:\.\d+)*.*Safari|CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
  const isMacSafari = /Macintosh/i.test(userAgent)
    && /Version\/\d+(?:\.\d+)*.*Safari/i.test(userAgent)
    && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/i.test(userAgent);

  return (isAppleMobile && isExternalIosBrowser) || isMacSafari;
}

function eventDetails(event: WeddingCalendarEvent) {
  return [
    event.description,
    `Thời gian: ${event.timeLabel}.`,
    `Địa điểm: ${event.location}.`,
    `Chỉ đường: ${event.mapUrl}`,
    `Thiệp cưới: ${invitationUrl}`,
  ].join("\n");
}

export function buildGoogleCalendarUrl(event: WeddingCalendarEvent) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set("dates", `${event.startUtc}/${event.endUtc}`);
  url.searchParams.set("details", eventDetails(event));
  url.searchParams.set("location", event.location);
  url.searchParams.set("ctz", "Asia/Ho_Chi_Minh");
  return url.toString();
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldIcsLine(value: string) {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let current = "";

  for (const character of value) {
    if (encoder.encode(current + character).length > 75) {
      lines.push(current);
      current = ` ${character}`;
    } else {
      current += character;
    }
  }

  lines.push(current);
  return lines.join("\r\n");
}

export function buildIcsCalendar(event: WeddingCalendarEvent) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//nhatphuong.love//Wedding Calendar//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    "DTSTAMP:20260731T000000Z",
    `DTSTART:${event.startUtc}`,
    `DTEND:${event.endUtc}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `DESCRIPTION:${escapeIcsText(eventDetails(event))}`,
    `URL:${invitationUrl}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
