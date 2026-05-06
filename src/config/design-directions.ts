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
    name: "Rose Quartz Serenity",
    tagline: "Romantic garden invitation",
    description: "Tone hiện tại: mềm, hồng phấn + xanh serenity, vintage garden và nhiều cảm giác giấy cưới cao cấp.",
    themeKey: "rose-quartz-serenity",
    copyTone: "Ấm áp, trang trọng vừa đủ, giàu cảm xúc nhưng không sến.",
    animationIntensity: "cinematic",
    floralDensity: "lush",
    mediaSuggestions: ["Hero floral garden", "paper texture overlay", "soft petal motion", "gallery ảnh couple thật"],
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
    dressCodePalette: ["#F2C6CF", "#8FAADC", "#F9F7F7", "#E9DDE5", "#7B8291"],
    patch: {
      themeKey: "rose-quartz-serenity",
      content: {
        theme: { animationEnabled: true } as WeddingConfig["theme"],
        sections: {
          cta: {
            eyebrow: "RSVP",
            title: "Hẹn gặp bạn ở Đà Lạt",
            description: "Hãy xác nhận tham dự và cho chúng mình biết nhu cầu lưu trú để chuẩn bị chu đáo hơn.",
            buttonLabel: "Điền RSVP",
          },
        } as WeddingConfig["sections"],
      },
    },
  },
  {
    key: "dalat-garden-elegant",
    name: "Đà Lạt Garden Elegant",
    tagline: "Outdoor resort, botanical, warm",
    description: "Nhấn vào resort Đà Lạt, Hồ Tuyền Lâm, botanical details và cảm giác thân mật trong khí trời se lạnh.",
    themeKey: "dalat-garden-elegant",
    copyTone: "Gần gũi, có địa điểm rõ, ưu tiên trải nghiệm khách mời.",
    animationIntensity: "balanced",
    floralDensity: "balanced",
    mediaSuggestions: ["Ảnh resort/Hồ Tuyền Lâm", "texture linen", "botanical corner", "venue map visual"],
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
            eyebrow: "Wedding Reception",
            title: "Một buổi tối giữa rừng thông Đà Lạt",
            description: "Tụi mình chuẩn bị một buổi tiệc ngoài trời thân mật, có welcome drink, ceremony, dinner và after party nhẹ nhàng.",
            cardEyebrow: "Terracotta Dalat",
            cardDescription: "{venueName} · {venueLocation}",
            items: [
              { label: "Đón khách", description: "Check-in, chụp ảnh và welcome drink trong khu resort." },
              { label: "Ceremony", description: "Khoảnh khắc chính của buổi lễ ngoài trời." },
              { label: "Khai tiệc", description: "Dùng tiệc tối giữa không khí se lạnh Đà Lạt." },
              { label: "After party", description: "Âm nhạc, đồ uống và những câu chuyện vui." },
            ],
          },
          venue: {
            eyebrow: "Venue",
            description: "Không gian resort gần Hồ Tuyền Lâm, đủ riêng tư để buổi tối của tụi mình thật ấm áp và gần gũi.",
            visualEyebrow: "{venueArea}",
            visualTitle: "Hồ Tuyền Lâm",
            detailEyebrow: "Where to arrive",
            areaLabel: "Khu vực",
            locationLabel: "Vị trí",
            mapButtonLabel: "Mở Google Maps",
          },
        } as WeddingConfig["sections"],
      },
    },
  },
  {
    key: "editorial-black-tie",
    name: "Editorial Black Tie",
    tagline: "Ivory, charcoal, champagne",
    description: "Trang trọng hơn, ít chữ hơn, giống spread mở đầu của một magazine cưới cao cấp.",
    themeKey: "ivory-resort-classic",
    copyTone: "Formal, gọn, có nhịp editorial và nhiều khoảng thở.",
    animationIntensity: "soft",
    floralDensity: "minimal",
    mediaSuggestions: ["Ảnh chân dung B&W", "ivory paper grain", "thin gold line", "venue hero wide crop"],
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
          title: "Together with our families",
          message: "Trân trọng kính mời bạn đến chung vui trong buổi tiệc cưới thân mật của chúng mình tại Đà Lạt.",
          closing: "Your presence would mean the world to us.",
        },
        sections: {
          hero: {
            eyebrow: "Wedding Celebration",
            imageAlt: "Editorial wedding cover",
            locationLine: "{eventDate} · {venueName}",
            showScrollCue: true,
          },
          invitation: { eyebrow: "The invitation" },
        } as WeddingConfig["sections"],
      },
    },
  },
  {
    key: "modern-minimal",
    name: "Modern Minimal",
    tagline: "Spacious and typography-led",
    description: "Tối giản, nhiều khoảng thở, tập trung vào tên, ngày, địa điểm và RSVP rõ ràng.",
    themeKey: "ivory-resort-classic",
    copyTone: "Ngắn, rõ, không trang trí quá nhiều.",
    animationIntensity: "soft",
    floralDensity: "minimal",
    mediaSuggestions: ["Ảnh hero duy nhất", "plain paper background", "clean venue card", "ít layer chuyển động"],
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
            eyebrow: "Guest Notes",
            title: "Before you arrive",
            description: "Một vài thông tin ngắn để bạn chuẩn bị thoải mái cho buổi tối ở Đà Lạt.",
            weatherEyebrow: "Weather",
            accommodationEyebrow: "Stay",
            rsvpDeadlinePrefix: "RSVP by",
          },
        } as WeddingConfig["sections"],
      },
    },
  },
  {
    key: "destination-postcard",
    name: "Destination Postcard",
    tagline: "Travel, map and venue cues",
    description: "Cảm giác thiệp mời đi Đà Lạt: postcard, bản đồ, dấu tem và các cue về hành trình khách mời.",
    themeKey: "warm-terracotta-evening",
    copyTone: "Thân mật, có chất du lịch, nhắc rõ logistics và lưu trú.",
    animationIntensity: "balanced",
    floralDensity: "balanced",
    mediaSuggestions: ["Map illustration", "postcard texture", "venue stamp", "travel photo crops"],
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
            eyebrow: "RSVP & Stay",
            title: "Gửi tụi mình lịch trình của bạn nhé",
            description: "Xác nhận tham dự sớm để tụi mình chuẩn bị chỗ ngồi, lưu trú và những hỗ trợ cần thiết tại Đà Lạt.",
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
