export type ArtifactRecipeKey = "web-invitation" | "rsvp-form" | "save-the-date" | "print-card" | "story-share" | "guest-info-card" | "venue-map-card" | "thank-you-card";

export type ArtifactStatus = "draft" | "ready" | "exported";

export type ArtifactRecipe = {
  key: ArtifactRecipeKey;
  name: string;
  description: string;
  output: string;
  recommendedFor: string[];
  dependencies: string[];
};

export const artifactRecipes = [
  {
    key: "web-invitation",
    name: "Thiệp web",
    description: "Thiệp cưới web toàn trang với hero, lịch trình, địa điểm, lưu ý khách, album và nút hồi đáp.",
    output: "Website responsive đã xuất bản",
    recommendedFor: ["mọi khách", "chia sẻ trên điện thoại", "domain Vercel"],
    dependencies: ["hai bạn", "sự kiện", "địa điểm", "theme", "media"],
  },
  {
    key: "rsvp-form",
    name: "Form hồi đáp",
    description: "Biểu mẫu hồi đáp với tham dự, lưu trú, thực đơn và di chuyển.",
    output: "Biểu mẫu tương tác",
    recommendedFor: ["vận hành khách mời", "lên kế hoạch lưu trú"],
    dependencies: ["lời hồi đáp", "lưu trú", "sự kiện"],
  },
  {
    key: "save-the-date",
    name: "Lưu ngày cưới",
    description: "Mẫu thông báo ngắn, tập trung vào hai bạn, ngày cưới, địa điểm và một ảnh hero.",
    output: "Thiệp mini có thể chia sẻ",
    recommendedFor: ["thông báo sớm", "chia sẻ qua chat"],
    dependencies: ["hai bạn", "ngày cưới", "ảnh hero"],
  },
  {
    key: "print-card",
    name: "Thiệp in",
    description: "Bản mô phỏng 5x7 để định hướng thiệp in và mật độ chữ.",
    output: "Thông số bố cục in",
    recommendedFor: ["bàn giao cho planner", "thiệp giấy"],
    dependencies: ["lời mời", "theme", "bản xem trước in"],
  },
  {
    key: "story-share",
    name: "Khung dọc chia sẻ",
    description: "Mẫu dọc 9:16 để chia sẻ trên Instagram hoặc Facebook.",
    output: "Thông số bố cục 9:16",
    recommendedFor: ["chia sẻ mạng xã hội", "teaser hình ảnh"],
    dependencies: ["ảnh đầu trang", "ngày cưới", "địa điểm"],
  },
  {
    key: "guest-info-card",
    name: "Card lưu ý khách",
    description: "Card gọn cho thời tiết, lưu trú, trang phục và ghi chú đến nơi.",
    output: "Thông số card lưu ý",
    recommendedFor: ["khách đi xa", "nhóm gia đình"],
    dependencies: ["thời tiết", "lưu trú", "trang phục"],
  },
  {
    key: "venue-map-card",
    name: "Card bản đồ",
    description: "Mẫu tập trung vào địa điểm với địa chỉ, khu vực, bản đồ và lời dẫn đường.",
    output: "Thông số card bản đồ",
    recommendedFor: ["hướng dẫn đến nơi", "gửi cho tài xế"],
    dependencies: ["địa điểm", "link bản đồ"],
  },
  {
    key: "thank-you-card",
    name: "Card cảm ơn",
    description: "Mẫu sau tiệc cho lời cảm ơn ấm áp và ảnh kỷ niệm nổi bật.",
    output: "Thông số card cảm ơn",
    recommendedFor: ["sau tiệc", "gửi ảnh tiếp theo"],
    dependencies: ["album", "giọng chữ"],
  },
] as const satisfies readonly ArtifactRecipe[];
