import type { WeddingConfig } from "@/lib/site-settings";

export type InvitationIssueSeverity = "P0_BLOCKER" | "P1_WARNING" | "P2_POLISH";

export type InvitationIssue = {
  id: string;
  severity: InvitationIssueSeverity;
  title: string;
  detail: string;
  target: string;
};

type MediaLayer = WeddingConfig["appearance"]["mediaLayers"]["hero"][number];

type MediaLayerWithType = MediaLayer & {
  type: "image" | "video";
};

const placeholderValues = ["Cô Dâu", "Chú Rể", "Bride", "Groom", "Tên cô dâu", "Tên chú rể"];

function isBlank(value: string | undefined) {
  return !value || value.trim().length === 0;
}

function hasPlaceholder(value: string | undefined) {
  if (!value) return false;
  return placeholderValues.some((placeholder) => value.toLowerCase().includes(placeholder.toLowerCase()));
}

function parseVietnameseDate(value: string | undefined) {
  if (!value) return null;
  const match = value.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function isValidHttpUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function timeToMinutes(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function addIssue(issues: InvitationIssue[], severity: InvitationIssueSeverity, id: string, title: string, detail: string, target: string) {
  issues.push({ id, severity, title, detail, target });
}

export function lintInvitation(config: WeddingConfig): InvitationIssue[] {
  const issues: InvitationIssue[] = [];

  if (isBlank(config.couple.bride) || isBlank(config.couple.groom) || isBlank(config.couple.displayName)) {
    addIssue(issues, "P0_BLOCKER", "missing-couple-names", "Thiếu tên cô dâu/chú rể", "Điền đủ bride, groom và display name trước khi publish.", "Couple & Hero");
  }

  if (hasPlaceholder(config.couple.bride) || hasPlaceholder(config.couple.groom) || hasPlaceholder(config.couple.displayName)) {
    addIssue(issues, "P0_BLOCKER", "placeholder-couple-names", "Tên cô dâu/chú rể vẫn là placeholder", "Public invitation không nên publish khi còn Cô Dâu/Chú Rể mặc định.", "Couple & Hero");
  }

  if (isBlank(config.event.dateLabel) || isBlank(config.venue.name) || isBlank(config.venue.address)) {
    addIssue(issues, "P0_BLOCKER", "missing-event-venue", "Thiếu ngày giờ hoặc địa điểm", "Ngày hiển thị, venue và địa chỉ cần đầy đủ để khách không bị nhầm.", "Venue & Time");
  }

  if (!isValidHttpUrl(config.venue.mapUrl)) {
    addIssue(issues, "P1_WARNING", "invalid-map-url", "Google Maps URL chưa hợp lệ", "Map URL nên là link http/https để nút chỉ đường hoạt động trên public page.", "Venue & Time");
  }

  if (isBlank(config.rsvp.deadline) && isBlank(config.accommodation.rsvpDeadline)) {
    addIssue(issues, "P1_WARNING", "missing-rsvp-deadline", "Thiếu deadline RSVP", "Nên có deadline rõ để khách xác nhận và báo lưu trú đúng hạn.", "Notes & Gallery");
  }

  const weddingDate = parseVietnameseDate(config.event.dateLabel) ?? parseVietnameseDate(config.couple.date);
  const rsvpDate = parseVietnameseDate(config.rsvp.deadline) ?? parseVietnameseDate(config.accommodation.rsvpDeadline);
  if (weddingDate && rsvpDate && rsvpDate > weddingDate) {
    addIssue(issues, "P0_BLOCKER", "rsvp-after-wedding", "Deadline RSVP sau ngày cưới", "Deadline RSVP cần trước ngày cưới để còn chuẩn bị chỗ ngồi/lưu trú.", "Notes & Gallery");
  }

  const eventTimes = [config.event.welcomeTime, config.event.ceremonyTime, config.event.dinnerTime, config.event.afterPartyTime].map(timeToMinutes);
  if (eventTimes.some((time) => time === null)) {
    addIssue(issues, "P1_WARNING", "invalid-event-times", "Một số mốc giờ chưa đúng định dạng", "Dùng định dạng HH:mm để timeline và venue/time nhất quán.", "Venue & Time");
  } else {
    for (let index = 1; index < eventTimes.length; index += 1) {
      if ((eventTimes[index] as number) < (eventTimes[index - 1] as number)) {
        addIssue(issues, "P1_WARNING", "event-times-out-of-order", "Mốc giờ sự kiện chưa theo thứ tự", "Đón khách, ceremony, dinner và after party nên tăng dần theo thời gian.", "Venue & Time");
        break;
      }
    }
  }

  config.timeline.forEach((item, index) => {
    if (timeToMinutes(item.time) === null) {
      addIssue(issues, "P1_WARNING", `timeline-time-${index}`, "Timeline có giờ chưa đúng định dạng", `Mốc ${index + 1} nên dùng HH:mm để dễ đối chiếu với venue/time.`, "Timeline");
    }
  });

  const allLayers = Object.entries(config.appearance.mediaLayers).flatMap(([section, layers]) =>
    layers.map((layer, index) => ({ section, index, layer: layer as MediaLayerWithType })),
  );

  allLayers.forEach(({ section, index, layer }) => {
    if (layer.type === "image" && !isBlank(layer.src) && isBlank(layer.alt)) {
      addIssue(issues, "P1_WARNING", `missing-alt-${section}-${index}`, "Thiếu alt text cho ảnh", `Layer ${index + 1} ở ${section} cần alt text để accessibility tốt hơn.`, "Section Background Media");
    }
    if (layer.type === "video" && !layer.mobileSrc) {
      addIssue(issues, "P1_WARNING", `video-no-mobile-${section}-${index}`, "Video layer thiếu mobile fallback", `Layer video ${index + 1} ở ${section} nên có mobile source/crop riêng.`, "Section Background Media");
    }
    if (typeof layer.src === "string" && layer.src.startsWith("data:video")) {
      addIssue(issues, "P1_WARNING", `large-data-video-${section}-${index}`, "Video upload đang nằm trong settings", "Data URL video rất dễ làm draft/publish nặng hoặc vượt giới hạn storage.", "Section Background Media");
    }
  });

  const animatedVideos = allLayers.filter(({ layer }) => layer.type === "video" && layer.animation !== "none").length;
  if (animatedVideos > 2) {
    addIssue(issues, "P2_POLISH", "too-many-animated-videos", "Nhiều video layer đang animate cùng lúc", "Giữ tối đa 1-2 video animate để trang vẫn premium và nhẹ.", "Section Background Media");
  }

  const galleryPlaceholders = config.gallery.filter((src) => src.includes("gallery-") && src.endsWith(".svg")).length;
  if (galleryPlaceholders >= config.gallery.length) {
    addIssue(issues, "P2_POLISH", "placeholder-gallery", "Gallery vẫn dùng placeholder", "Trước khi gửi khách thật, nên thay bằng ảnh couple/venue thật để thiệp có cảm xúc hơn.", "Notes & Gallery");
  }

  if (config.theme.colors.background.toLowerCase() === config.theme.colors.text.toLowerCase()) {
    addIssue(issues, "P0_BLOCKER", "zero-contrast", "Màu chữ trùng màu nền", "Text color và background color cần khác nhau để khách đọc được.", "Theme");
  }

  return issues;
}

export function hasBlockingIssues(issues: InvitationIssue[]) {
  return issues.some((issue) => issue.severity === "P0_BLOCKER");
}
