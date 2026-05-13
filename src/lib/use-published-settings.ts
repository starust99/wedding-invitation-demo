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

    const readServerSettings = () => {
      fetch("/api/site-settings")
        .then((response) => (response.ok ? response.json() : null))
        .then((result: { settings?: SiteSettings; backend?: string } | null) => {
          if (cancelled) return;
          if (result?.backend === "local") {
            setSettings(getPublishedSettings());
            return;
          }

          setSettings(result?.settings ? normalizeSettings(result.settings) : getPublishedSettings());
        })
        .catch(() => {
          if (!cancelled) setSettings(getPublishedSettings());
        });
    };

    readServerSettings();

    window.addEventListener("storage", readServerSettings);
    window.addEventListener("wedding-settings-updated", readServerSettings);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", readServerSettings);
      window.removeEventListener("wedding-settings-updated", readServerSettings);
    };
  }, []);

  return settings;
}
