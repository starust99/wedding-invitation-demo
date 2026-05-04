import { weddingConfig } from "@/config/wedding.config";
import { themePresets, type ThemeKey } from "@/config/theme-presets";

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

export type WeddingConfig = Editable<typeof weddingConfig>;

export type SiteSettings = {
  content: WeddingConfig;
  themeKey: ThemeKey;
  publishedAt?: string;
};

type SettingsInput = Omit<SiteSettings, "content"> & {
  content?: Partial<WeddingConfig>;
};

export const draftStorageKey = "wedding-demo-draft-settings";
export const publishedStorageKey = "wedding-demo-published-settings";

export const defaultSettings: SiteSettings = {
  content: structuredClone(weddingConfig) as unknown as WeddingConfig,
  themeKey: "rose-quartz-serenity",
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

function normalizeMediaLayer(layer: Partial<MediaLayer>, fallback: MediaLayer): MediaLayer {
  const desktopScale = layer.scale?.desktop;
  const mobileScale = layer.scale?.mobile;
  const desktopPosition = layer.objectPosition?.desktop;
  const mobilePosition = layer.objectPosition?.mobile;

  return {
    ...fallback,
    ...layer,
    id: layer.id || crypto.randomUUID(),
    type: layer.type === "video" ? "video" : "image",
    src: layer.src ?? "",
    mobileSrc: layer.mobileSrc ?? layer.src ?? "",
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
  const fallbackLayer = defaultSettings.content.appearance.mediaLayers.hero[0];
  const mediaLayers = structuredClone(content.appearance.mediaLayers) as unknown as MediaLayersRecord;

  for (const section of mediaSectionKeys) {
    mediaLayers[section] = (mediaLayers[section] ?? []).map((layer) => normalizeMediaLayer(layer, fallbackLayer));
  }

  if (mediaLayers.hero.length === 0 && content.hero.coverImage) {
    mediaLayers.hero = [normalizeMediaLayer({
      id: "hero-cover",
      src: content.hero.coverImage,
      mobileSrc: content.hero.mobileCoverImage || content.hero.coverImage,
      alt: content.sections.hero.imageAlt,
      animation: "slowZoom",
    }, fallbackLayer)];
  }

  return {
    ...content,
    appearance: {
      ...content.appearance,
      mediaLayers: mediaLayers as unknown as WeddingConfig["appearance"]["mediaLayers"],
    },
  };
}

export function normalizeSettings(settings: SettingsInput | null): SiteSettings {
  if (!settings) return structuredClone(defaultSettings);

  const content = mergeDefaults(defaultSettings.content, settings.content);

  return {
    ...settings,
    content: normalizeMediaLayers(content),
    themeKey: settings.themeKey ?? defaultSettings.themeKey,
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
    return normalizeSettings(JSON.parse(raw) as SettingsInput);
  } catch {
    return null;
  }
}

export function writeSettings(key: string, settings: SiteSettings) {
  window.localStorage.setItem(key, JSON.stringify(settings));
  window.dispatchEvent(new Event("wedding-settings-updated"));
}

export function getPublishedSettings(): SiteSettings {
  return readSettings(publishedStorageKey) ?? defaultSettings;
}

export function getDraftSettings(): SiteSettings {
  return readSettings(draftStorageKey) ?? readSettings(publishedStorageKey) ?? defaultSettings;
}
