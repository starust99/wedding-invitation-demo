import type { WeddingDesignSystem } from "@/lib/design-system";

export const editorialBlackTieDesignSystem = {
  key: "editorial-black-tie",
  name: "Ngà than trang trọng",
  colorTokens: {
    background: "#F7F1E8",
    card: "#FFFDF8",
    primary: "#45413C",
    accent: "#D8C3A5",
    text: "#1F1D1B",
    muted: "#7D756B",
    border: "#E4D8CA",
  },
  typographyIntent: ["Tiêu đề serif lớn nhưng phải có tiết chế kiểu tạp chí.", "Khối chữ ngắn, canh hàng rõ và nhãn yên.", "Tránh trang trí chữ ngoài bộ serif/display."],
  spacingRhythmRules: ["Dùng khoảng trống như một thứ xa xỉ.", "Ưu tiên ít card hơn nhưng lớn hơn.", "Giữ độ dài dòng hẹp cho lời mời."],
  sectionCompositionRules: ["Hero có thể rất trang trọng và tối giản.", "Section lời mời nên giống một thông báo in.", "Gallery phải có cảm giác được chọn lọc, không phải scrapbook."],
  motifFloralRules: ["Hoa lá nên gần như vắng mặt hoặc đơn sắc.", "Dùng đường mảnh, chi tiết champagne và texture giấy.", "Không quá rậm kiểu vườn."],
  motionRules: ["Motion gần như vô hình: fade, lift, reveal chậm.", "Tránh motion trang trí lặp.", "Ưu tiên cảm giác tinh tế hơn là trình diễn."],
  imageTreatmentRules: ["Crop đen trắng hoặc editorial ấm là hợp nhất.", "Dùng tương phản cao nhưng vẫn phải đọc tốt.", "Giữ số lượng ảnh vừa phải."],
  copyVoice: ["Trang trọng.", "Ngắn gọn.", "Nghi lễ nhưng không cứng."],
  dos: ["Cắt phần chữ thừa.", "Xem trước khung thiệp in thường xuyên.", "Giữ CTA thanh lịch nhưng rõ."],
  donts: ["Không dùng giọng vui đùa.", "Không chồng nhiều trang trí.", "Không animate quá tay."],
  recommendedPreviewContexts: ["desktop", "print-card", "mobile"],
} satisfies WeddingDesignSystem;
