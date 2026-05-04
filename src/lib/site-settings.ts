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

export const draftStorageKey = "wedding-demo-draft-settings";
export const publishedStorageKey = "wedding-demo-published-settings";

export const defaultSettings: SiteSettings = {
  content: structuredClone(weddingConfig) as unknown as WeddingConfig,
  themeKey: "rose-quartz-serenity",
};

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
    return JSON.parse(raw) as SiteSettings;
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
