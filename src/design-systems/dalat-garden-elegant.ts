import type { WeddingDesignSystem } from "@/lib/design-system";

export const dalatGardenElegantDesignSystem = {
  key: "dalat-garden-elegant",
  name: "Vườn thanh lịch Đà Lạt",
  colorTokens: {
    background: "#FBF7EF",
    card: "#FFFDF8",
    primary: "#6F7E68",
    accent: "#EAD9C2",
    text: "#2F332B",
    muted: "#7C746A",
    border: "#E5D8C7",
  },
  typographyIntent: ["Tiêu đề phải thanh lịch như resort, không thô.", "Phần chữ thân bài cần giải thích thông tin rõ ràng.", "Nhãn có thể nhắc tới địa điểm, vườn, hồ và giờ đến."],
  spacingRhythmRules: ["Section địa điểm và lưu ý khách có thể đậm thông tin hơn.", "Card phải thoáng để thông tin không thành giấy tờ hành chính.", "Dùng khối ấm để dẫn nhịp thông tin."],
  sectionCompositionRules: ["Section địa điểm nên nhấn vào Hồ Tuyền Lâm và hướng đến nơi.", "Lịch trình phải cho thấy dòng chảy buổi tối rõ ràng.", "Lưu ý khách phải giảm mơ hồ về thời tiết và lưu trú."],
  motifFloralRules: ["Gợi ý thực vật phải giống chi tiết resort và vườn.", "Dùng lá, linen và beige ấm nhiều hơn hoa nặng.", "Tránh cliché điểm đến du lịch."],
  motionRules: ["Motion cân bằng, chỉ nhẹ nhàng và tinh tế.", "Địa điểm và lịch trình nên chuyển động rõ nhưng yên.", "Video layer phải có ích, không gây rối."],
  imageTreatmentRules: ["Ưu tiên hình ảnh địa điểm, hồ, thông và ánh chiều tối.", "Dùng overlay ấm để giữ đồng bộ.", "Hình bản đồ và đường đi phải đọc được."],
  copyVoice: ["Ấm, thực tế và cao cấp.", "Nhắc bối cảnh Đà Lạt khi thật cần.", "Tránh giọng nghi lễ quá nặng."],
  dos: ["Làm khách dễ hiểu phần logistics.", "Cho thấy không khí resort.", "Đặt lưu ý lưu trú ở vị trí nổi bật."],
  donts: ["Không để chi tiết điểm đến che mất cảm xúc của thiệp.", "Không dùng quá nhiều hiệu ứng postcard.", "Không làm card địa điểm chật."],
  recommendedPreviewContexts: ["mobile", "desktop", "tablet"],
} satisfies WeddingDesignSystem;
