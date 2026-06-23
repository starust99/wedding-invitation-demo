import { weddingConfig } from "@/config/wedding.config";
import { themePresets, type ThemeKey } from "@/config/theme-presets";
import { cleanBundledPublicAssetSrc } from "@/lib/asset-cleanup";
import type { AiTweakSuggestion } from "@/lib/ai-tweak-schema";
import { normalizeEventDetailsEditorConfig } from "@/lib/wedding/event-details-config";
import { normalizeWeddingHeroEditorConfig } from "@/lib/wedding/hero-config";

type Editable<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Editable<U>[]
        : T extends object
          ? { -readonly [K in keyof T]: Editable<T[K]> }
          : T;

type WeddingConfigBase = Editable<typeof weddingConfig>;

export type WeddingConfig = Omit<WeddingConfigBase, "project"> & {
  project: Omit<WeddingConfigBase["project"], "ai"> & {
    ai: {
      tweakHistory: AiTweakSuggestion[];
    };
  };
};

export type SiteSettings = {
  schemaVersion: number;
  content: WeddingConfig;
  themeKey: ThemeKey;
  assetBucket?: string;
  publishedAt?: string;
};

type SettingsInput = Partial<Omit<SiteSettings, "content">> & {
  content?: Partial<WeddingConfig>;
};

export const draftStorageKey = "wedding-demo-draft-settings";
export const publishedStorageKey = "wedding-demo-published-settings";
export const settingsSchemaVersion = 12;

export const defaultSettings: SiteSettings = {
  schemaVersion: settingsSchemaVersion,
  content: structuredClone(weddingConfig) as unknown as WeddingConfig,
  themeKey: "rose-quartz-serenity",
  assetBucket: "wedding-assets",
};

function mergeDefaults<T>(defaults: T, input: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(input) ? input : defaults) as T;
  }

  if (defaults && typeof defaults === "object") {
    const result = { ...(defaults as Record<string, unknown>) };
    const source = input && typeof input === "object" ? input as Record<string, unknown> : {};

    for (const key of Object.keys(result)) {
      result[key] = mergeDefaults(result[key], source[key]);
    }

    return result as T;
  }

  return (input ?? defaults) as T;
}

type MediaLayer = WeddingConfig["appearance"]["mediaLayers"]["hero"][number];
type MediaSectionKey = keyof WeddingConfig["appearance"]["mediaLayers"];
type MediaLayersRecord = Record<MediaSectionKey, MediaLayer[]>;

const mediaSectionKeys: MediaSectionKey[] = ["hero", "invitation", "itinerary", "timeline", "venue", "dressCode", "guestNotes", "gallery", "cta"];

function createEmptyMediaLayer(): MediaLayer {
  return {
    id: "empty-media-layer",
    type: "image",
    src: "",
    mobileSrc: "",
    alt: "",
    opacity: 1,
    scale: {
      desktop: 1,
      mobile: 1,
    },
    objectPosition: {
      desktop: "center center",
      mobile: "center center",
    },
    animation: "none",
  };
}

function normalizeMediaLayer(layer: Partial<MediaLayer>, fallback: MediaLayer): MediaLayer {
  const desktopScale = layer.scale?.desktop;
  const mobileScale = layer.scale?.mobile;
  const desktopPosition = layer.objectPosition?.desktop;
  const mobilePosition = layer.objectPosition?.mobile;
  const src = cleanBundledPublicAssetSrc(layer.src ?? fallback.src);
  const mobileSrc = cleanBundledPublicAssetSrc(layer.mobileSrc ?? layer.src ?? fallback.mobileSrc ?? fallback.src);

  return {
    ...fallback,
    ...layer,
    id: layer.id || crypto.randomUUID(),
    type: layer.type === "video" ? "video" : "image",
    src,
    mobileSrc,
    alt: layer.alt ?? "",
    opacity: Number.isFinite(layer.opacity) ? layer.opacity as number : fallback.opacity,
    scale: {
      desktop: Number.isFinite(desktopScale) ? desktopScale as number : fallback.scale.desktop,
      mobile: Number.isFinite(mobileScale) ? mobileScale as number : fallback.scale.mobile,
    },
    objectPosition: {
      desktop: desktopPosition || fallback.objectPosition.desktop,
      mobile: mobilePosition || fallback.objectPosition.mobile,
    },
    animation: layer.animation ?? fallback.animation,
  };
}

function normalizeMediaLayers(content: WeddingConfig): WeddingConfig {
  const fallbackLayer = defaultSettings.content.appearance.mediaLayers.hero[0] ?? createEmptyMediaLayer();
  const mediaLayers = structuredClone(content.appearance.mediaLayers) as unknown as MediaLayersRecord;

  for (const section of mediaSectionKeys) {
    mediaLayers[section] = (mediaLayers[section] ?? []).map((layer) => normalizeMediaLayer(layer, fallbackLayer));
  }

  const heroCoverImage = cleanBundledPublicAssetSrc(content.hero.coverImage);
  const mobileHeroCoverImage = cleanBundledPublicAssetSrc(content.hero.mobileCoverImage || content.hero.coverImage);

  if (mediaLayers.hero.length === 0 && heroCoverImage) {
    mediaLayers.hero = [normalizeMediaLayer({
      id: "hero-cover",
      src: heroCoverImage,
      mobileSrc: mobileHeroCoverImage || heroCoverImage,
      alt: content.sections.hero.imageAlt,
      animation: "slowZoom",
    }, fallbackLayer)];
  }

  return {
    ...content,
    gallery: content.gallery.map(cleanBundledPublicAssetSrc),
    hero: {
      ...content.hero,
      coverImage: heroCoverImage,
      mobileCoverImage: mobileHeroCoverImage,
    },
    heroEditorConfig: normalizeWeddingHeroEditorConfig(content.heroEditorConfig),
    eventDetailsConfig: normalizeEventDetailsEditorConfig(content.eventDetailsConfig),
    appearance: {
      ...content.appearance,
      mediaLayers: mediaLayers as unknown as WeddingConfig["appearance"]["mediaLayers"],
    },
  };
}

export function normalizeSettings(settings: SettingsInput | null): SiteSettings {
  if (!settings) return structuredClone(defaultSettings);

  let content = mergeDefaults(defaultSettings.content, settings.content);

  // Migration: Force Vietnamese text unification but preserve user's gallery and media assets
  if ((settings.schemaVersion ?? 0) < 3) {
    content = {
      ...content,
      timeline: defaultSettings.content.timeline,
      sections: defaultSettings.content.sections,
      hero: defaultSettings.content.hero,
      heroEditorConfig: defaultSettings.content.heroEditorConfig,
      eventDetailsConfig: defaultSettings.content.eventDetailsConfig,
    };
  }

  // Migration: Force update RSVP deadlines
  if ((settings.schemaVersion ?? 0) < 4) {
    content = {
      ...content,
      rsvp: {
        ...content.rsvp,
        deadline: defaultSettings.content.rsvp.deadline,
      },
      accommodation: {
        ...content.accommodation,
        rsvpDeadline: defaultSettings.content.accommodation.rsvpDeadline,
      },
    };
  }

  // Migration v7: Replace the entire old default text to fix location and repetition issues
  if ((settings.schemaVersion ?? 0) < 7) {
    const exactNewString = "Trân trọng kính mời quý khách cùng chia vui trong ngày chung đôi của Nhật & Phương.";
    const isOldDefault = (text: string) => /chung vui|lễ cưới|tiệc cưới/i.test(text);

    const invMsg = content.invitation?.message ?? "";
    if (isOldDefault(invMsg)) {
      content = {
        ...content,
        invitation: {
          ...content.invitation,
          message: exactNewString,
        },
      };
    }
    // Also fix heroEditorConfig description (the text shown in the Hero section)
    const heroDesc = (content as any).heroEditorConfig?.content?.description ?? "";
    if (isOldDefault(heroDesc)) {
      content = {
        ...content,
        heroEditorConfig: {
          ...(content as any).heroEditorConfig,
          content: {
            ...(content as any).heroEditorConfig?.content,
            description: exactNewString,
          },
        },
      };
    }
  }

  // Migration v8: Clarify that the timeline is for the wedding banquet
  if ((settings.schemaVersion ?? 0) < 8) {
    if (content.sections?.timeline?.eyebrow === "Lịch trình" || content.sections?.timeline?.eyebrow === "Lịch trình buổi tiệc") {
      content = {
        ...content,
        sections: {
          ...content.sections,
          timeline: {
            ...content.sections.timeline,
            eyebrow: "Lịch trình Tiệc cưới",
          },
        },
      };
    }
    if (content.sections?.itinerary?.eyebrow === "Lịch trình" || content.sections?.itinerary?.eyebrow === "Lịch trình buổi tiệc") {
      content = {
        ...content,
        sections: {
          ...content.sections,
          itinerary: {
            ...content.sections.itinerary,
            eyebrow: "Lịch trình Tiệc cưới",
          },
        },
      };
    }
  }

  // Migration v9: Set default church image
  if ((settings.schemaVersion ?? 0) < 9) {
    if (!content.eventDetailsConfig?.content?.churchImageUrl) {
      content = {
        ...content,
        eventDetailsConfig: {
          ...content.eventDetailsConfig,
          content: {
            ...content.eventDetailsConfig?.content,
            churchImageUrl: "/assets/wedding/church-tam-hai.png",
          },
        },
      };
    }
  }

  // Migration v10: Replace all occurrences of "chia vui" with "chung vui" in invitation and hero configurations
  if ((settings.schemaVersion ?? 0) < 10) {
    const replaceChiaVui = (text?: string) => {
      if (!text) return "";
      return text.replace(/chia\s+vui/gi, "chung vui");
    };

    if (content.invitation?.message) {
      content.invitation.message = replaceChiaVui(content.invitation.message);
    }
    const heroDesc = (content as any).heroEditorConfig?.content?.description ?? "";
    if (heroDesc) {
      (content as any).heroEditorConfig = {
        ...(content as any).heroEditorConfig,
        content: {
          ...(content as any).heroEditorConfig?.content,
          description: replaceChiaVui(heroDesc),
        },
      };
    }
  }

  // Migration v12: Update dressCodeText and dressCode.note to gọt chữ version
  if ((settings.schemaVersion ?? 0) < 12) {
    const isOldDressCodeText = (text: string) => 
      !text || 
      text.includes("Thương mời quý khách diện trang phục theo bảng màu") || 
      text.includes("Giữ ấm là ưu tiên hàng đầu");

    const newDressCodeText = "Thương mời quý khách diện trang phục tươi sáng theo bảng màu bên dưới (vui lòng hạn chế các tông màu tối).\n\nLưu ý thời tiết: Đà Lạt vào đông rất lạnh, quý khách hãy ưu tiên trang phục và phụ kiện đủ ấm cho bữa tiệc ngoài trời nhé!";

    if (isOldDressCodeText(content.eventDetailsConfig?.content?.dressCodeText)) {
      content = {
        ...content,
        eventDetailsConfig: {
          ...content.eventDetailsConfig,
          content: {
            ...content.eventDetailsConfig?.content,
            dressCodeText: newDressCodeText,
          },
        },
      };
    }

    if (isOldDressCodeText(content.dressCode?.note)) {
      content = {
        ...content,
        dressCode: {
          ...content.dressCode,
          note: newDressCodeText,
        },
      };
    }
  }

  return {
    ...settings,
    schemaVersion: settingsSchemaVersion,
    content: normalizeMediaLayers(content),
    themeKey: settings.themeKey ?? defaultSettings.themeKey,
    assetBucket: settings.assetBucket ?? defaultSettings.assetBucket,
  };
}

export function applyTheme(content: WeddingConfig, themeKey: ThemeKey): WeddingConfig {
  return {
    ...content,
    themeName: themePresets[themeKey].name,
    theme: {
      ...content.theme,
      colors: themePresets[themeKey].colors,
    },
  };
}

export function readSettings(key: string): SiteSettings | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SettingsInput;
    return normalizeSettings(parsed);
  } catch {
    return null;
  }
}

export function writeSettings(key: string, settings: SiteSettings) {
  const serialized = JSON.stringify(settings);

  try {
    window.localStorage.setItem(key, serialized);
    window.dispatchEvent(new Event("wedding-settings-updated"));
    return true;
  } catch (error) {
    const isQuotaError = error instanceof DOMException && (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014
    );

    if (isQuotaError) {
      for (const storageKey of [draftStorageKey, publishedStorageKey, "wedding-demo-site-versions"]) {
        if (storageKey === key) continue;
        const value = window.localStorage.getItem(storageKey);
        if (value?.includes("data:image/")) window.localStorage.removeItem(storageKey);
      }

      try {
        window.localStorage.removeItem(key);
        window.localStorage.setItem(key, serialized);
        window.dispatchEvent(new Event("wedding-settings-updated"));
        return true;
      } catch (retryError) {
        console.warn("Cannot write wedding settings to localStorage.", retryError);
        return false;
      }
    }

    console.warn("Cannot write wedding settings to localStorage.", error);
    return false;
  }
}

export function getPublishedSettings(): SiteSettings {
  return readSettings(publishedStorageKey) ?? defaultSettings;
}

export function getDraftSettings(): SiteSettings {
  return readSettings(draftStorageKey) ?? readSettings(publishedStorageKey) ?? defaultSettings;
}
