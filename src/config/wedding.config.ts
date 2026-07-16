import { defaultWeddingHeroConfig } from "@/lib/wedding/hero-config";
import { defaultEventDetailsConfig } from "@/lib/wedding/event-details-config";
import type { AiTweakSuggestion } from "@/lib/ai-tweak-schema";

type MediaLayerConfig = {
  id: string;
  type: "image" | "video";
  src: string;
  mobileSrc: string;
  alt: string;
  opacity: number;
  scale: {
    desktop: number;
    mobile: number;
  };
  objectPosition: {
    desktop: string;
    mobile: string;
  };
  animation: "none" | "slowZoom" | "float" | "fade";
};

export const weddingConfig = {
  themeName: "Vườn mùa đông Đà Lạt",
  project: {
    visualDirectionKey: "rose-quartz-serenity",
    ai: {
      tweakHistory: [] as AiTweakSuggestion[],
    },
    artifacts: {
      enabled: ["web-invitation", "rsvp-form"],
      recipes: {
        "web-invitation": { status: "ready" },
        "rsvp-form": { status: "ready" },
        "save-the-date": { status: "draft" },
        "print-card": { status: "draft" },
        "story-share": { status: "draft" },
        "guest-info-card": { status: "draft" },
        "venue-map-card": { status: "draft" },
        "thank-you-card": { status: "draft" },
      },
    },
    discovery: {
      coupleStory: "Một buổi tối mùa đông ở Đà Lạt, nơi gia đình và những người thân quý cùng hiện diện để chứng kiến ngày vui của Nhật & Phương.",
      desiredTone: "romantic",
      guestAudience: "Gia đình, bạn bè thân thiết và những người đã đồng hành cùng cô dâu chú rể.",
      culturalNotes: "Tiếng Việt là chính. Câu chữ ưu tiên phép lịch sự Việt Nam, xưng hô đúng vai vế, mềm nhưng không sến.",
      mustHaveSections: ["venue", "timeline", "gallery", "rsvp"],
      constraints: "Mobile-first, tự nhiên, chỉn chu, không sến và không nhồi quá nhiều chi tiết.",
      photoMoodboardNotes: "Pastel pink, pastel blue, warm white, natural green và khoảng thở lớn.",
      printDigitalPriority: "digital",
    },
  },
  couple: {
    bride: "Phương",
    groom: "Nhật",
    displayName: "Nhật & Phương",
    date: "2026-12-26",
    tagline: "Khu vườn mùa xuân giữa Đà Lạt mùa đông",
  },
  sections: {
    hero: {
      eyebrow: "26.12.2026 · Đà Lạt",
      imageAlt: "Ảnh bìa thiệp cưới khu vườn",
      locationLine: "{venueName} · {venueLocation}",
      showScrollCue: true,
    },
    invitation: {
      eyebrow: "Lời mời từ gia đình",
    },
    itinerary: {
      eyebrow: "Lịch trình Tiệc",
      title: "Buổi tiệc tại Terracotta",
      description: "",
      cardEyebrow: "Ngày cưới",
      cardDescription: "{venueName} · {venueLocation}",
      items: [
        { label: "Đón khách", description: "Gia đình đón khách, chụp ảnh lưu niệm và mời khách ổn định chỗ ngồi." },
        { label: "Khai mạc", description: "Bắt đầu buổi tiệc tối ấm cúng." },
        { label: "Nghi lễ", description: "Các nghi thức cưới chính thức của Nhật & Phương." },
        { label: "Nâng ly khai tiệc", description: "Cùng nâng ly và dùng bữa tối ấm cúng." },
        { label: "Giao lưu", description: "Âm nhạc, trò chuyện và những khoảnh khắc thân tình." },
        { label: "Chụp ảnh kỷ niệm", description: "Chụp hình lưu niệm cùng cô dâu chú rể." },
      ],
    },
    timeline: {
      eyebrow: "Lịch trình Tiệc",
      title: "Buổi tiệc tại Terracotta",
    },
    venue: {
      eyebrow: "Thông tin và địa điểm",
      description: "Sảnh Quảng Trường tại Terracotta Hotel & Resort Đà Lạt là điểm hẹn của buổi tối, giữa không khí se lạnh và khoảng xanh bên Hồ Tuyền Lâm.",
      visualEyebrow: "Terracotta Đà Lạt",
      visualTitle: "Sảnh Quảng Trường",
      detailEyebrow: "Địa chỉ",
      areaLabel: "Khu vực",
      locationLabel: "Vị trí",
      mapButtonLabel: "Mở chỉ đường",
    },
    dressCode: {
      eyebrow: "Trang phục",
    },
    guestNotes: {
      eyebrow: "Lưu ý khách mời",
      title: "Để buổi tối trọn vẹn hơn",
      description: "Một vài ghi chú nhỏ để khách mời chuẩn bị nhẹ nhàng cho thời tiết, trang phục và việc di chuyển ở Đà Lạt.",
      weatherEyebrow: "Thời tiết Đà Lạt",
      accommodationEyebrow: "Lưu trú",
      rsvpDeadlinePrefix: "Xác nhận trước",
    },
    gallery: {
      eyebrow: "Khoảnh khắc",
      title: "Góc ảnh cưới",
      description: "",
      itemLabel: "Ảnh",
      imageAltPrefix: "Ảnh cưới",
    },
    cta: {
      eyebrow: "Hồi đáp",
      title: "Xác nhận tham dự",
      description: "Gia đình mong nhận được lời hồi đáp sớm để chuẩn bị đón tiếp chu đáo.",
      buttonLabel: "Gửi hồi đáp",
    },
  },
  appearance: {
    backgrounds: {
      page: "cream",
      hero: "accentGradient",
      invitation: "softGradient",
      itinerary: "accentGradient",
      timeline: "plain",
      venue: "primaryGradient",
      dressCode: "plain",
      guestNotes: "plain",
      gallery: "plain",
      cta: "primaryGradient",
    },
    galleryObjectPositions: ["center center", "center center", "center center", "center center", "50% 50%"],
    mediaLayers: {
      hero: [
        {
          id: "hero-cover",
          type: "image",
          src: "https://res.cloudinary.com/dt1b5ua11/image/upload/c_limit,f_auto,q_auto,w_2400/v1/wedding-invitation-demo/hero/2026-05-06-n-p-1_120aa-optimized?_a=BAMAAAOd0",
          mobileSrc: "https://res.cloudinary.com/dt1b5ua11/image/upload/c_limit,f_auto,q_auto,w_2400/v1/wedding-invitation-demo/hero-mobile/2026-05-06-n-p-1_120aa-optimized?_a=BAMAAAOd0",
          alt: "Enchanted garden wedding cover",
          opacity: 1,
          scale: {
            desktop: 1,
            mobile: 1,
          },
          objectPosition: {
            desktop: "20% 21%",
            mobile: "45% top",
          },
          animation: "slowZoom",
        },
      ] as MediaLayerConfig[],
      invitation: [] as MediaLayerConfig[],
      itinerary: [] as MediaLayerConfig[],
      timeline: [] as MediaLayerConfig[],
      venue: [] as MediaLayerConfig[],
      dressCode: [] as MediaLayerConfig[],
      guestNotes: [] as MediaLayerConfig[],
      gallery: [] as MediaLayerConfig[],
      cta: [] as MediaLayerConfig[],
    },
  },
  invitation: {
    title: "Trân trọng kính mời",
    message:
      "Quý khách đến chung vui và ghi dấu những khoảnh khắc đáng nhớ cùng Nhật & Phương.",
    closing: "Sự hiện diện của quý khách là niềm vinh hạnh và là niềm vui rất lớn với gia đình.",
  },
  venue: {
    name: "Terracotta Hotel & Resort Đà Lạt",
    area: "Sảnh Quảng trường",
    location: "Đà Lạt, Việt Nam",
    address: "Sảnh Quảng Trường, Terracotta Hotel & Resort Đà Lạt, Đà Lạt",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=S%E1%BA%A3nh%20Qu%E1%BA%A3ng%20Tr%C6%B0%E1%BB%9Dng%20Terracotta%20Hotel%20%26%20Resort%20%C4%90%C3%A0%20L%E1%BA%A1t",
    note: "Không gian ngoài trời thoáng đãng, đủ trang trọng cho nghi thức và đủ ấm cúng cho một buổi tối thân tình.",
  },
  church: {
    name: "Nhà Thờ Giáo Xứ Tam Hải",
    address: "180 Đ. Tam Châu, Tam Bình, Hồ Chí Minh",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nh%C3%A0%20th%E1%BB%9D%20Gi%C3%A1o%20x%E1%BB%A9%20Tam%20H%E1%BA%A3i%20180%20Tam%20Ch%C3%A2u%20Tam%20B%C3%ACnh%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c",
  },
  event: {
    dateLabel: "Thứ Bảy, 26.12.2026",
    welcomeTime: "17:30",
    ceremonyTime: "19:10",
    dinnerTime: "19:20",
    afterPartyTime: "20:00",
  },
  timeline: [
    { time: "17:30", title: "Đón khách", description: "Gia đình đón khách, chụp ảnh lưu niệm và mời khách ổn định chỗ ngồi." },
    { time: "19:00", title: "Khai mạc", description: "Bắt đầu buổi tiệc tối ấm cúng." },
    { time: "19:10", title: "Nghi lễ", description: "Các nghi thức cưới chính thức của Nhật & Phương." },
    { time: "19:20", title: "Nâng ly khai tiệc", description: "Cùng nâng ly và dùng bữa tối ấm cúng." },
    { time: "20:00", title: "Giao lưu", description: "Âm nhạc, trò chuyện và những khoảnh khắc thân tình." },
    { time: "20:50", title: "Chụp ảnh kỷ niệm", description: "Chụp hình lưu niệm cùng cô dâu chú rể." },
  ],
  dressCode: {
    title: "Sắc màu vườn xuân",
    note: "Khách mời có thể chọn trang phục thanh lịch theo sắc hồng pastel, xanh dương pastel, trắng kem hoặc xanh lá tự nhiên. Nên ưu tiên chất liệu thoải mái vì buổi tiệc diễn ra ngoài trời.",
    colors: ["#FADCD9", "#D4E4F7", "#FEF8E7", "#B5D5A4", "#5C5247"],
  },
  weatherNote: {
    title: "Một chút lưu ý cho buổi tối",
    description:
      "Buổi tiệc diễn ra trong không gian mở. Khách mời nên mang theo áo khoác nhẹ để thoải mái hơn khi di chuyển và tham dự buổi tối Đà Lạt.",
  },
  accommodation: {
    enabled: true,
    title: "Hỗ trợ lưu trú tại resort",
    description:
      "Nếu khách mời cần hỗ trợ lưu trú tại resort, vui lòng đăng ký trong form RSVP để gia đình sắp xếp thông tin với Terracotta được chu đáo.",
    rsvpDeadline: "26/09/2026",
  },
  gallery: [
    "https://res.cloudinary.com/dt1b5ua11/image/upload/c_limit,f_auto,q_auto,w_1800/v1/wedding-invitation-demo/gallery/2026-05-12-n-p-1_75a",
    "https://res.cloudinary.com/dt1b5ua11/image/upload/c_limit,f_auto,q_auto,w_1800/v1/wedding-invitation-demo/gallery/2026-05-12-n-p-1_230a-optimized",
    "https://res.cloudinary.com/dt1b5ua11/image/upload/c_limit,f_auto,q_auto,w_1800/v1/wedding-invitation-demo/gallery/2026-05-12-n-p-2_299a-optimized",
    "https://res.cloudinary.com/dt1b5ua11/image/upload/c_limit,f_auto,q_auto,w_1800/v1/wedding-invitation-demo/gallery/2026-05-12-n-p-1_535a-optimized",
    "https://res.cloudinary.com/dt1b5ua11/image/upload/c_limit,f_auto,q_auto,w_1800/v1/wedding-invitation-demo/gallery/2026-05-12-n-p-2_199a-optimized",
  ],
  hero: {
    coverImage: "https://res.cloudinary.com/dt1b5ua11/image/upload/c_limit,f_auto,q_auto,w_2400/v1/wedding-invitation-demo/hero/2026-05-06-n-p-1_120aa-optimized?_a=BAMAAAOd0",
    mobileCoverImage: "https://res.cloudinary.com/dt1b5ua11/image/upload/c_limit,f_auto,q_auto,w_2400/v1/wedding-invitation-demo/hero-mobile/2026-05-06-n-p-1_120aa-optimized?_a=BAMAAAOd0",
  },
  heroEditorConfig: defaultWeddingHeroConfig,
  eventDetailsConfig: defaultEventDetailsConfig,
  theme: {
    colors: {
      background: "#FFFAF7",
      card: "#FFFFFF",
      primary: "#92A8D1",
      accent: "#F7CAC9",
      text: "#252934",
      muted: "#7B8291",
      border: "#E9DDE5",
    },
    fonts: {
      heading: "Cormorant Garamond",
      body: "Be Vietnam Pro",
    },
    animationEnabled: true,
  },
  rsvp: {
    deadline: "26/09/2026",
    askAccommodation: true,
    askDietary: true,
    askTransport: false,
  },
  postWeddingGallery: {
    enabled: true,
    availableAfter: "2026-12-27T00:00:00+07:00",
    defaultUrl: "https://drive.google.com/drive/folders/link-anh-mac-dinh",
    groupLinks: {
      "[Nhà Trai] Họ nội": "https://drive.google.com/drive/folders/link-anh-nha-trai",
      "[Nhà Gái] Họ ngoại": "https://drive.google.com/drive/folders/link-anh-nha-gai",
      "[Nhật] Bạn bè & Đồng nghiệp": "https://drive.google.com/drive/folders/link-anh-ban-be-nhat",
      "[Phương] Bạn bè & Đồng nghiệp": "https://drive.google.com/drive/folders/link-anh-ban-be-phuong",
    } as Record<string, string>,
  },
} as const;
