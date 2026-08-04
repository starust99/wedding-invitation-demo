import { weddingConfig } from "@/config/wedding.config";
import type { WeddingConfig } from "@/lib/site-settings";

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

const defaultWeddingCalendarEvents: Record<WeddingCalendarEventId, WeddingCalendarEvent> = {
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

function parseDate(value: string, fallback: string) {
  const iso = value.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const vi = value.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  if (vi) return `${vi[3]}-${vi[2].padStart(2, "0")}-${vi[1].padStart(2, "0")}`;
  return fallback;
}

function parseTime(value: string, fallback: string) {
  return /^\d{1,2}:\d{2}$/.test(value.trim()) ? value.trim() : fallback;
}

function toUtcStamp(date: string, time: string, durationMinutes = 90) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, hour - 7, minute));
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const format = (dateValue: Date) => dateValue.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return { startUtc: format(start), endUtc: format(end) };
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function createWeddingCalendarEvents(config: WeddingConfig): Record<WeddingCalendarEventId, WeddingCalendarEvent> {
  const churchDate = parseDate(config.eventDetailsConfig.content.churchDate, "2026-12-20");
  const churchTime = parseTime(config.eventDetailsConfig.content.churchTime, "10:00");
  const banquetDate = parseDate(config.couple.date || config.event.dateLabel, "2026-12-26");
  const banquetTime = parseTime(config.event.welcomeTime, "17:30");
  const churchUtc = toUtcStamp(churchDate, churchTime, 90);
  const banquetUtc = toUtcStamp(banquetDate, banquetTime, 210);

  return {
    "thanh-le": {
      ...defaultWeddingCalendarEvents["thanh-le"],
      title: `Thánh lễ Hôn phối ${config.couple.displayName}`,
      ...churchUtc,
      timeLabel: `${churchTime} ngày ${formatDateLabel(churchDate)}`,
      location: `${config.church.name} (${config.church.address})`,
      mapUrl: config.church.mapUrl,
      description: `Thánh lễ Hôn phối của ${config.couple.displayName}.`,
      uid: `thanh-le-${churchDate.replaceAll("-", "")}@nhatphuong.love`,
    },
    "tiec-cuoi": {
      ...defaultWeddingCalendarEvents["tiec-cuoi"],
      title: `Tiệc cưới ${config.couple.displayName}`,
      ...banquetUtc,
      timeLabel: `${banquetTime} ngày ${formatDateLabel(banquetDate)}`,
      location: `${config.venue.name} (${config.venue.address})`,
      mapUrl: config.venue.mapUrl,
      description: `Tiệc cưới của ${config.couple.displayName}.`,
      uid: `tiec-cuoi-${banquetDate.replaceAll("-", "")}@nhatphuong.love`,
    },
  };
}

export function getWeddingCalendarEvent(value: string, config?: WeddingConfig) {
  const runtimeConfig = config ?? weddingConfig as unknown as WeddingConfig;
  return createWeddingCalendarEvents(runtimeConfig)[value as WeddingCalendarEventId] ?? null;
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
