import type { WeddingDesignSystem } from "@/lib/design-system";

export const roseQuartzSerenityDesignSystem = {
  key: "rose-quartz-serenity",
  name: "Vườn hồng phấn - xanh sương",
  colorTokens: {
    background: "#FDFBF7",
    card: "#FFFFFF",
    primary: "#8FAADC",
    accent: "#F2C6CF",
    text: "#2F3A35",
    muted: "#7B8291",
    border: "#E9DDE5",
  },
  typographyIntent: ["Tiêu đề serif phải giống thiệp in sang.", "Phần chữ thân bài cần dịu, dễ đọc và ấm trên di động.", "Chỉ dùng nhãn uppercase nhỏ ở chỗ thật cần."],
  spacingRhythmRules: ["Giữ khoảng thở dọc rộng giữa các nhịp cảm xúc.", "Card phải có cảm giác xếp lớp như giấy, không phải module SaaS.", "Trên di động cần rõ khoảng cách giữa tiêu đề và nội dung."],
  sectionCompositionRules: ["Hero phải dẫn bằng cặp đôi, ngày và địa điểm, không rối.", "Lời mời nên nằm trên bề mặt như giấy.", "CTA phải lãng mạn nhưng vẫn rất rõ hành động."],
  motifFloralRules: ["Dùng hoa lá như không khí và viền, không đặt giữa nội dung chính.", "Hồng phấn và xanh sương phải cân bằng.", "Accent gold/cream phải giữ nhẹ."],
  motionRules: ["Ưu tiên reveal chậm, drift, veil và paper-lift.", "Tránh bounce lặp hay kiểu animation landing page.", "Tôn trọng reduced motion."],
  imageTreatmentRules: ["Dùng crop mềm, texture vườn, overlay nhẹ.", "Ảnh hero có thể điện ảnh, gallery nên như album.", "Mọi ảnh có ý nghĩa phải có alt text."],
  copyVoice: ["Tiếng Việt ấm áp là chính.", "Lãng mạn nhưng không sến.", "Chỉ dùng nhãn kiểu editorial tiếng Anh khi thật cần."],
  dos: ["Giữ thiệp thân mật và cao cấp.", "Ưu tiên rõ ràng ở RSVP.", "Dùng checklist trước khi xuất bản."],
  donts: ["Không làm giống landing page SaaS.", "Không nhồi quá nhiều lớp video.", "Không xuất bản khi còn tên giữ chỗ."],
  recommendedPreviewContexts: ["mobile", "desktop", "story", "print-card"],
} satisfies WeddingDesignSystem;
