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
    addIssue(issues, "P0_BLOCKER", "missing-couple-names", "Thiếu tên cô dâu/chú rể", "Điền đủ tên cô dâu, chú rể và tên hiển thị trước khi xuất bản.", "Cặp đôi & phần đầu thiệp");
  }

  if (hasPlaceholder(config.couple.bride) || hasPlaceholder(config.couple.groom) || hasPlaceholder(config.couple.displayName)) {
    addIssue(issues, "P0_BLOCKER", "placeholder-couple-names", "Tên cô dâu/chú rể vẫn là tên giữ chỗ", "Thiệp công khai không nên xuất bản khi còn tên mặc định.", "Cặp đôi & phần đầu thiệp");
  }

  if (isBlank(config.event.dateLabel) || isBlank(config.venue.name) || isBlank(config.venue.address)) {
    addIssue(issues, "P0_BLOCKER", "missing-event-venue", "Thiếu ngày cưới hoặc địa điểm", "Ngày hiển thị, địa điểm và địa chỉ cần đầy đủ để khách không bị nhầm.", "Địa điểm & giờ");
  }

  if (!isValidHttpUrl(config.venue.mapUrl)) {
    addIssue(issues, "P1_WARNING", "invalid-map-url", "Link Google Maps chưa hợp lệ", "Link bản đồ nên là http/https để nút chỉ đường hoạt động trên trang công khai.", "Địa điểm & giờ");
  }

  if (isBlank(config.rsvp.deadline) && isBlank(config.accommodation.rsvpDeadline)) {
    addIssue(issues, "P1_WARNING", "missing-rsvp-deadline", "Thiếu hạn hồi đáp", "Nên có hạn rõ để khách xác nhận và báo lưu trú đúng lúc.", "Lưu ý & ảnh");
  }

  const weddingDate = parseVietnameseDate(config.event.dateLabel) ?? parseVietnameseDate(config.couple.date);
  const rsvpDate = parseVietnameseDate(config.rsvp.deadline) ?? parseVietnameseDate(config.accommodation.rsvpDeadline);
  if (weddingDate && rsvpDate && rsvpDate > weddingDate) {
    addIssue(issues, "P0_BLOCKER", "rsvp-after-wedding", "Hạn hồi đáp sau ngày cưới", "Hạn hồi đáp cần trước ngày cưới để còn chuẩn bị chỗ ngồi và lưu trú.", "Lưu ý & ảnh");
  }

  const eventTimes = [config.event.welcomeTime, config.event.ceremonyTime, config.event.dinnerTime, config.event.afterPartyTime].map(timeToMinutes);
  if (eventTimes.some((time) => time === null)) {
    addIssue(issues, "P1_WARNING", "invalid-event-times", "Một số mốc giờ chưa đúng định dạng", "Dùng định dạng HH:mm để timeline và phần thông tin giờ nhất quán.", "Địa điểm & giờ");
  } else {
    for (let index = 1; index < eventTimes.length; index += 1) {
      if ((eventTimes[index] as number) < (eventTimes[index - 1] as number)) {
        addIssue(issues, "P1_WARNING", "event-times-out-of-order", "Mốc giờ sự kiện chưa theo thứ tự", "Đón khách, nghi thức, dùng tiệc và phần giao lưu nên tăng dần theo thời gian.", "Địa điểm & giờ");
        break;
      }
    }
  }

  config.timeline.forEach((item, index) => {
    if (timeToMinutes(item.time) === null) {
      addIssue(issues, "P1_WARNING", `timeline-time-${index}`, "Lịch trình có giờ chưa đúng định dạng", `Mốc ${index + 1} nên dùng HH:mm để dễ đối chiếu với địa điểm và thời gian.`, "Lịch trình");
    }
  });

  const allLayers = Object.entries(config.appearance.mediaLayers).flatMap(([section, layers]) =>
    layers.map((layer, index) => ({ section, index, layer: layer as MediaLayerWithType })),
  );

  allLayers.forEach(({ section, index, layer }) => {
    if (layer.type === "image" && !isBlank(layer.src) && isBlank(layer.alt)) {
      addIssue(issues, "P1_WARNING", `missing-alt-${section}-${index}`, "Thiếu alt text cho ảnh", `Lớp ${index + 1} ở ${section} cần alt text để hỗ trợ đọc màn hình tốt hơn.`, "Nền ảnh và video");
    }
    if (layer.type === "video" && !layer.mobileSrc) {
      addIssue(issues, "P1_WARNING", `video-no-mobile-${section}-${index}`, "Video layer thiếu bản di động", `Lớp video ${index + 1} ở ${section} nên có nguồn hoặc crop riêng cho di động.`, "Nền ảnh và video");
    }
    if (typeof layer.src === "string" && layer.src.startsWith("data:video")) {
      addIssue(issues, "P1_WARNING", `large-data-video-${section}-${index}`, "Video đang nằm trong settings", "Video dạng data URL rất dễ làm bản nháp hoặc bản xuất bản nặng và vượt giới hạn lưu trữ.", "Nền ảnh và video");
    }
  });

  const animatedVideos = allLayers.filter(({ layer }) => layer.type === "video" && layer.animation !== "none").length;
  if (animatedVideos > 2) {
    addIssue(issues, "P2_POLISH", "too-many-animated-videos", "Nhiều video đang chạy cùng lúc", "Giữ tối đa 1-2 video có chuyển động để trang vẫn sang và nhẹ.", "Nền ảnh và video");
  }

  const galleryPlaceholders = config.gallery.filter((src) => src.includes("gallery-") && src.endsWith(".svg")).length;
  if (config.gallery.length > 0 && galleryPlaceholders >= config.gallery.length) {
    addIssue(issues, "P2_POLISH", "placeholder-gallery", "Album vẫn dùng ảnh giữ chỗ", "Trước khi gửi khách thật, nên thay bằng ảnh cô dâu chú rể hoặc địa điểm thật để thiệp có cảm xúc hơn.", "Lưu ý & ảnh");
  }

  if (config.theme.colors.background.toLowerCase() === config.theme.colors.text.toLowerCase()) {
    addIssue(issues, "P0_BLOCKER", "zero-contrast", "Màu chữ trùng màu nền", "Màu chữ và màu nền cần khác nhau để khách đọc được.", "Giao diện");
  }

  return issues;
}

export function hasBlockingIssues(issues: InvitationIssue[]) {
  return issues.some((issue) => issue.severity === "P0_BLOCKER");
}
