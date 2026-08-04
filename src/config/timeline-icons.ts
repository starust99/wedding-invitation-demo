export type TimelineIconOption = {
  id: string;
  label: string;
  src: string;
};

export const timelineIconOptions: TimelineIconOption[] = [
  { id: "welcome", label: "Đón khách", src: "/assets/wedding/timeline/icon-1730.png" },
  { id: "opening", label: "Khai mạc", src: "/assets/wedding/timeline/icon-1900.png" },
  { id: "ceremony", label: "Nghi lễ", src: "/assets/wedding/timeline/icon-1910.png" },
  { id: "toast", label: "Nâng ly", src: "/assets/wedding/timeline/icon-1920.png" },
  { id: "music", label: "Giao lưu", src: "/assets/wedding/timeline/icon-2000.png" },
  { id: "photo", label: "Chụp ảnh", src: "/assets/wedding/timeline/icon-2050.png" },
  { id: "dinner", label: "Dùng tiệc", src: "/assets/wedding/timeline/library/dinner-service.png" },
  { id: "cake", label: "Cắt bánh", src: "/assets/wedding/timeline/library/cake-cutting.png" },
  { id: "dance", label: "Khiêu vũ", src: "/assets/wedding/timeline/library/first-dance.png" },
  { id: "speech", label: "Phát biểu", src: "/assets/wedding/timeline/library/speech.png" },
  { id: "bouquet", label: "Tung hoa", src: "/assets/wedding/timeline/library/bouquet.png" },
  { id: "candle", label: "Thắp nến", src: "/assets/wedding/timeline/library/candle-lighting.png" },
  { id: "sparklers", label: "Pháo sáng", src: "/assets/wedding/timeline/library/sparklers.png" },
  { id: "gift", label: "Quà tặng", src: "/assets/wedding/timeline/library/gift.png" },
  { id: "dessert", label: "Tráng miệng", src: "/assets/wedding/timeline/library/dessert.png" },
  { id: "farewell", label: "Tiễn khách", src: "/assets/wedding/timeline/library/farewell-car.png" },
];

export function resolveTimelineIcon(title: string, explicitIcon?: string): string | null {
  if (explicitIcon?.trim()) return explicitIcon.trim();

  const normalized = title.toLowerCase();
  if (normalized.includes("đón khách")) return timelineIconOptions[0].src;
  if (normalized.includes("khai mạc")) return timelineIconOptions[1].src;
  if (normalized.includes("nghi lễ") || normalized.includes("nghi thức")) return timelineIconOptions[2].src;
  if (normalized.includes("nâng ly") || normalized.includes("khai tiệc") || normalized.includes("dùng tiệc")) return timelineIconOptions[3].src;
  if (normalized.includes("giao lưu")) return timelineIconOptions[4].src;
  if (normalized.includes("chụp ảnh") || normalized.includes("chụp hình") || normalized.includes("cảm ơn") || normalized.includes("kỷ niệm")) return timelineIconOptions[5].src;
  return null;
}
