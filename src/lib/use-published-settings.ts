"use client";

import { useEffect, useState } from "react";
import {
  defaultSettings,
  getPublishedSettings,
  normalizeSettings,
  type SiteSettings,
} from "@/lib/site-settings";

export function usePublishedSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    let cancelled = false;

    const readBrowserSettings = () => {
      if (!cancelled) setSettings(getPublishedSettings());
    };

    readBrowserSettings();

    fetch("/api/site-settings")
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { settings?: SiteSettings; backend?: string } | null) => {
        if (cancelled) return;
        if (result?.backend === "supabase" && result.settings) {
          setSettings(normalizeSettings(result.settings));
          return;
        }
        readBrowserSettings();
      })
      .catch(readBrowserSettings);

    window.addEventListener("storage", readBrowserSettings);
    window.addEventListener("wedding-settings-updated", readBrowserSettings);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", readBrowserSettings);
      window.removeEventListener("wedding-settings-updated", readBrowserSettings);
    };
  }, []);

  return settings;
}
