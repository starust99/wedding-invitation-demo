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
    label: "Điện thoại",
    description: "Luồng thiệp rộng 390px, ưu tiên đọc nhanh và phần hồi đáp rõ.",
    width: 390,
    height: 760,
    scale: 1,
    mode: "scroll",
  },
  {
    key: "tablet",
    label: "Máy tính bảng",
    description: "Bố cục 768px để bắt lỗi khoảng cách ở điểm gãy trung gian.",
    width: 768,
    height: 900,
    scale: 0.72,
    mode: "scroll",
  },
  {
    key: "desktop",
    label: "Màn hình lớn",
    description: "Khung 1440px cho máy tính bàn và laptop lớn.",
    width: 1440,
    height: 980,
    scale: 0.45,
    mode: "scroll",
  },
  {
    key: "print-card",
    label: "Thiệp in 5x7",
    description: "Cắt khung 5x7 để kiểm tra cảm giác thiệp in.",
    width: 500,
    height: 700,
    scale: 0.92,
    mode: "crop",
  },
  {
    key: "story",
    label: "Khung dọc 9:16",
    description: "Khung dọc 9:16, xem hero có đẹp khi chia sẻ theo chiều dọc không.",
    width: 405,
    height: 720,
    scale: 1,
    mode: "crop",
  },
  {
    key: "rsvp",
    label: "Nhảy tới hồi đáp",
    description: "Xem nhanh khu vực nút hồi đáp để kiểm tra lời mời xác nhận.",
    width: 390,
    height: 760,
    scale: 1,
    mode: "scroll",
    targetId: "rsvp",
  },
] as const satisfies readonly PreviewContext[];
