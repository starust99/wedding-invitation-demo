export type PreviewContextKey = "mobile" | "tablet" | "desktop" | "print-card" | "story" | "rsvp";

export type PreviewContext = {
  key: PreviewContextKey;
  label: string;
  description: string;
  width: number;
  height: number;
  scale: number;
  mode: "scroll" | "crop";
  targetId?: string;
};

export const previewContexts = [
  {
    key: "mobile",
    label: "Mobile",
    description: "390px invitation flow, ưu tiên đọc nhanh và RSVP rõ.",
    width: 390,
    height: 760,
    scale: 1,
    mode: "scroll",
  },
  {
    key: "tablet",
    label: "Tablet",
    description: "768px layout để bắt lỗi spacing ở breakpoint trung gian.",
    width: 768,
    height: 900,
    scale: 0.72,
    mode: "scroll",
  },
  {
    key: "desktop",
    label: "Desktop",
    description: "1440px website view cho PC và laptop lớn.",
    width: 1440,
    height: 980,
    scale: 0.45,
    mode: "scroll",
  },
  {
    key: "print-card",
    label: "Print 5x7",
    description: "Crop tỉ lệ 5x7 để kiểm tra cảm giác thiệp in.",
    width: 500,
    height: 700,
    scale: 0.92,
    mode: "crop",
  },
  {
    key: "story",
    label: "Story 9:16",
    description: "Instagram story crop, xem hero có đủ đẹp khi share dọc không.",
    width: 405,
    height: 720,
    scale: 1,
    mode: "crop",
  },
  {
    key: "rsvp",
    label: "RSVP jump",
    description: "Preview nhanh CTA/RSVP area để kiểm tra lời kêu gọi xác nhận.",
    width: 390,
    height: 760,
    scale: 1,
    mode: "scroll",
    targetId: "rsvp",
  },
] as const satisfies readonly PreviewContext[];
