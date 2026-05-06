import type { SiteSettings } from "@/lib/site-settings";

export type SiteVersionSource = "manual" | "duplicate" | "restore" | "publish";

export type SiteVersion = {
  id: string;
  settings: SiteSettings;
  label: string;
  source: SiteVersionSource;
  createdAt: string;
  publishedAt?: string;
};

export const versionsStorageKey = "wedding-demo-site-versions";

export function createSiteVersion(settings: SiteSettings, label: string, source: SiteVersionSource = "manual"): SiteVersion {
  return {
    id: crypto.randomUUID(),
    settings: structuredClone(settings),
    label: label.trim() || "Untitled snapshot",
    source,
    createdAt: new Date().toISOString(),
    publishedAt: source === "publish" ? new Date().toISOString() : undefined,
  };
}

export function readLocalVersions(): SiteVersion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(versionsStorageKey);
    if (!raw) return [];
    return JSON.parse(raw) as SiteVersion[];
  } catch {
    return [];
  }
}

export function writeLocalVersions(versions: SiteVersion[]) {
  window.localStorage.setItem(versionsStorageKey, JSON.stringify(versions));
}

export function prependLocalVersion(version: SiteVersion) {
  const versions = readLocalVersions();
  const next = [version, ...versions].slice(0, 30);
  writeLocalVersions(next);
  return next;
}

export function updateLocalVersion(version: SiteVersion) {
  const versions = readLocalVersions();
  const next = versions.map((item) => item.id === version.id ? version : item);
  writeLocalVersions(next);
  return next;
}
