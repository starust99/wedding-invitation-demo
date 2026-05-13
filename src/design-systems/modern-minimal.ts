import type { WeddingDesignSystem } from "@/lib/design-system";

export const modernMinimalDesignSystem = {
  key: "modern-minimal",
  name: "Tối giản hiện đại",
  colorTokens: {
    background: "#F8F6F0",
    card: "#FFFFFF",
    primary: "#2E2A25",
    accent: "#DDD3C6",
    text: "#2E2A25",
    muted: "#6D6A63",
    border: "#E7E0D6",
  },
  typographyIntent: ["Chữ dẫn nhịp chính.", "Tiêu đề có thể lớn, nhưng phần chữ phải gọn.", "Dùng phân cấp rõ thay vì trang trí."],
  spacingRhythmRules: ["Nhiều khoảng thở, ít khối hơn.", "Mỗi section chỉ nên có một hành động chính.", "Di động phải dễ lướt và nhanh."],
  sectionCompositionRules: ["Mỗi section phải có lý do tồn tại.", "Thông tin địa điểm, giờ và hồi đáp phải thật rõ.", "Gallery không được lấn át thiệp chính."],
  motifFloralRules: ["Dùng rất ít hoặc không dùng họa tiết hoa.", "Nếu có, chỉ nên là nét mảnh hoặc gần như ẩn.", "Không viền dày đặc."],
  motionRules: ["Chỉ dùng fade/lift nhẹ.", "Không chạy motion trang trí lặp.", "Tắt animation media không cần thiết."],
  imageTreatmentRules: ["Ưu tiên một ảnh hero mạnh.", "Dùng crop sạch và lớp phủ trung tính.", "Tránh chồng quá nhiều texture."],
  copyVoice: ["Ngắn.", "Thẳng.", "Ấm vừa đủ."],
  dos: ["Bỏ copy thừa.", "Kiểm tra mobile trước.", "Làm nút hồi đáp thật rõ."],
  donts: ["Không thêm clutter trang trí.", "Không dùng quá nhiều lớp media.", "Không viết đoạn prose dài."],
  recommendedPreviewContexts: ["mobile", "desktop", "print-card"],
} satisfies WeddingDesignSystem;
