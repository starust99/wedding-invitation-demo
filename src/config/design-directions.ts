import type { ThemeKey } from "@/config/theme-presets";
import type { SiteSettings, WeddingConfig } from "@/lib/site-settings";

export type VisualDirectionKey = "rose-quartz-serenity" | "dalat-garden-elegant" | "editorial-black-tie" | "modern-minimal" | "destination-postcard";

type BackgroundKey = keyof WeddingConfig["appearance"]["backgrounds"];
type DirectionPatch = {
  themeKey: ThemeKey;
  content: Partial<WeddingConfig>;
};

export type VisualDirection = {
  key: VisualDirectionKey;
  name: string;
  tagline: string;
  description: string;
  themeKey: ThemeKey;
  copyTone: string;
  animationIntensity: "soft" | "balanced" | "cinematic";
  floralDensity: "minimal" | "balanced" | "lush";
  mediaSuggestions: string[];
  sectionBackgrounds: Partial<Record<BackgroundKey, string>>;
  dressCodePalette: string[];
  patch: DirectionPatch;
};

const directions = [
  {
    key: "rose-quartz-serenity",
    name: "Hồng phấn - xanh sương",
    tagline: "Thiệp vườn lãng mạn",
    description: "Tone hiện tại: mềm, sáng, hồng phấn và xanh sương, nhiều cảm giác giấy cưới cao cấp.",
    themeKey: "rose-quartz-serenity",
    copyTone: "Ấm áp, trang trọng vừa đủ, giàu cảm xúc nhưng không sến.",
    animationIntensity: "cinematic",
    floralDensity: "lush",
    mediaSuggestions: ["Ảnh đầu trang vườn hoa", "lớp giấy mịn", "cánh hoa chuyển động nhẹ", "bố cục ảnh kỷ niệm"],
    sectionBackgrounds: {
      page: "cream",
      hero: "plain",
      invitation: "softGradient",
      itinerary: "plain",
      timeline: "plain",
      venue: "plain",
      dressCode: "card",
      guestNotes: "softGradient",
      gallery: "plain",
      cta: "primaryGradient",
    },
    dressCodePalette: ["#F7CAC9", "#92A8D1", "#FFF7FB", "#E9DDE5", "#6F7483"],
    patch: {
      themeKey: "rose-quartz-serenity",
      content: {
        theme: { animationEnabled: true } as WeddingConfig["theme"],
        sections: {
          cta: {
            eyebrow: "Xác nhận lời mời",
            title: "Hẹn gặp ở Đà Lạt",
            description: "Hãy xác nhận tham dự và cho gia đình biết nhu cầu lưu trú để chuẩn bị chu đáo hơn.",
            buttonLabel: "Gửi lời hồi đáp",
          },
        } as WeddingConfig["sections"],
      },
    },
  },
  {
    key: "dalat-garden-elegant",
    name: "Vườn Đà Lạt thanh lịch",
    tagline: "Resort ngoài trời, ấm và xanh",
    description: "Nhấn vào resort Đà Lạt, Hồ Tuyền Lâm, chi tiết lá hoa và cảm giác thân mật trong khí trời se lạnh.",
    themeKey: "dalat-garden-elegant",
    copyTone: "Gần gũi, có địa điểm rõ, ưu tiên trải nghiệm khách mời.",
    animationIntensity: "balanced",
    floralDensity: "balanced",
    mediaSuggestions: ["Ảnh resort hoặc Hồ Tuyền Lâm", "chất liệu vải linen", "góc hoa lá", "bản đồ địa điểm"],
    sectionBackgrounds: {
      page: "cream",
      hero: "plain",
      invitation: "card",
      itinerary: "softGradient",
      timeline: "plain",
      venue: "accentGradient",
      dressCode: "plain",
      guestNotes: "card",
      gallery: "plain",
      cta: "primaryGradient",
    },
    dressCodePalette: ["#EAD9C2", "#9CAF88", "#F8F1E8", "#D6BFA3", "#6F7E68"],
    patch: {
      themeKey: "dalat-garden-elegant",
      content: {
        sections: {
          itinerary: {
            eyebrow: "Lịch trình tiệc cưới",
            title: "Một buổi tối giữa rừng thông Đà Lạt",
            description: "Gia đình chuẩn bị một buổi tiệc ngoài trời thân mật, có đón khách, nghi thức, dùng tiệc và giao lưu nhẹ nhàng.",
            cardEyebrow: "Terracotta Đà Lạt",
            cardDescription: "{venueName} · {venueLocation}",
            items: [
              { label: "Đón khách", description: "Đón khách, chụp ảnh lưu niệm và ổn định chỗ ngồi." },
              { label: "Nghi thức", description: "Khoảnh khắc chính của buổi lễ ngoài trời." },
              { label: "Dùng tiệc", description: "Dùng tiệc tối giữa không khí se lạnh Đà Lạt." },
              { label: "Giao lưu", description: "Âm nhạc và những câu chuyện vui." },
            ],
          },
          venue: {
            eyebrow: "Thông tin & địa điểm",
            description: "Không gian resort gần Hồ Tuyền Lâm, đủ riêng tư để buổi tối thật ấm áp và gần gũi.",
            visualEyebrow: "{venueArea}",
            visualTitle: "Hồ Tuyền Lâm",
            detailEyebrow: "Địa chỉ",
            areaLabel: "Khu vực",
            locationLabel: "Vị trí",
            mapButtonLabel: "Chỉ đường",
          },
        } as WeddingConfig["sections"],
      },
    },
  },
  {
    key: "editorial-black-tie",
    name: "Trang trọng ngà than",
    tagline: "Ngà, than, champagne",
    description: "Trang trọng hơn, ít chữ hơn, giống trang mở đầu của một tạp chí cưới cao cấp.",
    themeKey: "ivory-resort-classic",
    copyTone: "Trang trọng, gọn, có nhịp tạp chí và nhiều khoảng thở.",
    animationIntensity: "soft",
    floralDensity: "minimal",
    mediaSuggestions: ["Ảnh chân dung đen trắng", "hạt giấy ngà", "đường vàng mảnh", "ảnh địa điểm ngang rộng"],
    sectionBackgrounds: {
      page: "cream",
      hero: "plain",
      invitation: "card",
      itinerary: "plain",
      timeline: "card",
      venue: "plain",
      dressCode: "card",
      guestNotes: "plain",
      gallery: "card",
      cta: "primaryGradient",
    },
    dressCodePalette: ["#F7F1E8", "#D8C3A5", "#B9A17B", "#45413C", "#1F1D1B"],
    patch: {
      themeKey: "ivory-resort-classic",
      content: {
        invitation: {
          title: "Trân trọng kính mời",
          message: "Gia đình trân trọng kính mời quý khách đến chung vui trong buổi tiệc cưới thân mật tại Đà Lạt.",
          closing: "Sự hiện diện của quý khách là niềm vinh hạnh và niềm vui rất lớn với gia đình.",
        },
        sections: {
          hero: {
            eyebrow: "Lễ cưới",
            imageAlt: "Ảnh bìa thiệp cưới cao cấp",
            locationLine: "{eventDate} · {venueName}",
            showScrollCue: true,
          },
          invitation: { eyebrow: "Lời mời" },
        } as WeddingConfig["sections"],
      },
    },
  },
  {
    key: "modern-minimal",
    name: "Tối giản hiện đại",
    tagline: "Rộng và dẫn bằng chữ",
    description: "Tối giản, nhiều khoảng thở, tập trung vào tên, ngày, địa điểm và phần hồi đáp rõ ràng.",
    themeKey: "ivory-resort-classic",
    copyTone: "Ngắn, rõ, không trang trí quá nhiều.",
    animationIntensity: "soft",
    floralDensity: "minimal",
    mediaSuggestions: ["Một ảnh đầu trang duy nhất", "nền giấy phẳng", "khối địa điểm sạch", "ít lớp chuyển động"],
    sectionBackgrounds: {
      page: "cream",
      hero: "plain",
      invitation: "plain",
      itinerary: "card",
      timeline: "plain",
      venue: "card",
      dressCode: "plain",
      guestNotes: "card",
      gallery: "plain",
      cta: "plain",
    },
    dressCodePalette: ["#F8F6F0", "#DDD3C6", "#B6B0A6", "#6D6A63", "#2E2A25"],
    patch: {
      themeKey: "ivory-resort-classic",
      content: {
        sections: {
          guestNotes: {
            eyebrow: "Lưu ý khách mời",
            title: "Trước khi đến",
            description: "Một vài thông tin ngắn để khách mời chuẩn bị thoải mái cho buổi tối ở Đà Lạt.",
            weatherEyebrow: "Thời tiết",
            accommodationEyebrow: "Lưu trú",
            rsvpDeadlinePrefix: "Xác nhận trước",
          },
        } as WeddingConfig["sections"],
      },
    },
  },
  {
    key: "destination-postcard",
    name: "Bưu thiếp Đà Lạt",
    tagline: "Hành trình, bản đồ, địa điểm",
    description: "Cảm giác thiệp mời đi Đà Lạt: bưu thiếp, bản đồ, dấu tem và các gợi ý về hành trình khách mời.",
    themeKey: "warm-terracotta-evening",
    copyTone: "Thân mật, có chất du lịch, nhắc rõ di chuyển và lưu trú.",
    animationIntensity: "balanced",
    floralDensity: "balanced",
    mediaSuggestions: ["Minh hoạ bản đồ", "chất giấy bưu thiếp", "dấu tem địa điểm", "ảnh hành trình"],
    sectionBackgrounds: {
      page: "cream",
      hero: "accentGradient",
      invitation: "card",
      itinerary: "softGradient",
      timeline: "plain",
      venue: "accentGradient",
      dressCode: "plain",
      guestNotes: "softGradient",
      gallery: "card",
      cta: "primaryGradient",
    },
    dressCodePalette: ["#E7B88A", "#C97956", "#F6E6D4", "#8A6F5A", "#5E4A3E"],
    patch: {
      themeKey: "warm-terracotta-evening",
      content: {
        sections: {
          cta: {
            eyebrow: "Xác nhận lời mời",
            title: "Xác nhận lịch trình tham dự",
            description: "Xác nhận tham dự sớm để gia đình chuẩn bị chỗ ngồi, lưu trú và những hỗ trợ cần thiết tại Đà Lạt.",
            buttonLabel: "Xác nhận tham dự",
          },
        } as WeddingConfig["sections"],
      },
    },
  },
] as const satisfies readonly VisualDirection[];

export const visualDirections = directions;

function mergeContentPatch(content: WeddingConfig, patch: Partial<WeddingConfig>): WeddingConfig {
  return {
    ...content,
    ...patch,
    project: {
      ...content.project,
      ...patch.project,
    },
    sections: {
      ...content.sections,
      ...patch.sections,
    },
    appearance: {
      ...content.appearance,
      ...patch.appearance,
      backgrounds: {
        ...content.appearance.backgrounds,
        ...patch.appearance?.backgrounds,
      },
      mediaLayers: {
        ...content.appearance.mediaLayers,
        ...patch.appearance?.mediaLayers,
      },
    },
    invitation: {
      ...content.invitation,
      ...patch.invitation,
    },
    dressCode: {
      ...content.dressCode,
      ...patch.dressCode,
      colors: patch.dressCode?.colors ?? content.dressCode.colors,
    },
    theme: {
      ...content.theme,
      ...patch.theme,
      colors: {
        ...content.theme.colors,
        ...patch.theme?.colors,
      },
      fonts: {
        ...content.theme.fonts,
        ...patch.theme?.fonts,
      },
    },
  };
}

export function applyVisualDirection(settings: SiteSettings, direction: VisualDirection): SiteSettings {
  return {
    ...settings,
    themeKey: direction.patch.themeKey,
    content: mergeContentPatch(settings.content, {
      ...direction.patch.content,
      project: {
        ...settings.content.project,
        visualDirectionKey: direction.key,
      },
      appearance: {
        ...settings.content.appearance,
        backgrounds: {
          ...settings.content.appearance.backgrounds,
          ...direction.sectionBackgrounds,
        },
      },
      dressCode: {
        ...settings.content.dressCode,
        colors: direction.dressCodePalette,
      },
    }),
  };
}
