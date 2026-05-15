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
      eyebrow: "Lịch trình",
      title: "Buổi tiệc tại Terracotta",
      description: "",
      cardEyebrow: "Ngày cưới",
      cardDescription: "{venueName} · {venueLocation}",
      items: [
        { label: "Đón khách", description: "Gia đình đón khách, chụp ảnh lưu niệm và mời khách ổn định chỗ ngồi." },
        { label: "Nghi thức", description: "Khoảnh khắc chính của buổi lễ, nơi Nhật & Phương gửi lời chào đến hai bên gia đình và khách quý." },
        { label: "Nâng ly", description: "Cùng nâng ly chúc mừng ngày vui của cô dâu chú rể." },
        { label: "Dùng tiệc", description: "Dùng bữa tối ấm cúng trong không gian ngoài trời của Terracotta." },
        { label: "Giao lưu", description: "Âm nhạc, trò chuyện và những khoảnh khắc thân tình trong buổi tối." },
        { label: "Lời cảm ơn", description: "Gia đình gửi lời cảm ơn và chụp ảnh cùng khách mời trước khi khép lại buổi tiệc." },
      ],
    },
    timeline: {
      eyebrow: "Lịch trình",
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
      hero: "plain",
      invitation: "softGradient",
      itinerary: "plain",
      timeline: "plain",
      venue: "plain",
      dressCode: "plain",
      guestNotes: "plain",
      gallery: "plain",
      cta: "primaryGradient",
      },
      galleryObjectPositions: ["center center", "center center", "center center", "center center"],
      mediaLayers: {
        hero: [] as MediaLayerConfig[],
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
      "Gia đình trân trọng kính mời quý khách đến chung vui trong tiệc cưới của Nhật & Phương tại Terracotta Hotel & Resort Đà Lạt.",
    closing: "Sự hiện diện của quý khách là niềm vinh hạnh và là niềm vui rất lớn với gia đình.",
  },
  venue: {
    name: "Terracotta Hotel & Resort Đà Lạt",
    area: "Sảnh Quảng trường",
    location: "Hồ Tuyền Lâm, Đà Lạt, Việt Nam",
    address: "Sảnh Quảng Trường, Terracotta Hotel & Resort Đà Lạt, Hồ Tuyền Lâm, Đà Lạt",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=S%E1%BA%A3nh%20Qu%E1%BA%A3ng%20Tr%C6%B0%E1%BB%9Dng%20Terracotta%20Hotel%20%26%20Resort%20%C4%90%C3%A0%20L%E1%BA%A1t",
    note: "Không gian ngoài trời thoáng đãng, đủ trang trọng cho nghi thức và đủ ấm cúng cho một buổi tối thân tình.",
  },
  event: {
    dateLabel: "Thứ Bảy, 26.12.2026",
    welcomeTime: "17:30",
    ceremonyTime: "18:00",
    dinnerTime: "18:30",
    afterPartyTime: "20:00",
  },
  timeline: [
    { time: "17:30", title: "Đón khách", description: "Gia đình đón khách, chụp ảnh lưu niệm và mời khách ổn định chỗ ngồi." },
    { time: "18:00", title: "Nghi thức", description: "Khoảnh khắc chính của buổi lễ, với sự chứng kiến của gia đình và khách quý." },
    { time: "18:30", title: "Nâng ly", description: "Cùng nâng ly chúc mừng ngày vui của cô dâu chú rể." },
    { time: "19:30", title: "Dùng tiệc", description: "Dùng bữa tối ấm cúng trong không gian ngoài trời của Terracotta." },
    { time: "20:00", title: "Giao lưu", description: "Âm nhạc, trò chuyện và những khoảnh khắc thân tình trong buổi tối." },
    { time: "21:00", title: "Lời cảm ơn & chụp hình", description: "Gia đình gửi lời cảm ơn và chụp ảnh cùng khách mời." },
  ],
  dressCode: {
    title: "Sắc pastel vườn xuân",
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
    rsvpDeadline: "26.11.2026",
  },
  gallery: ["/gallery-clean-1.svg", "/gallery-clean-2.svg", "/gallery-clean-3.svg", "/gallery-clean-4.svg"],
  hero: {
    coverImage: "",
    mobileCoverImage: "",
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
    deadline: "26.11.2026",
    askAccommodation: true,
    askDietary: true,
    askTransport: false,
  },
} as const;
