"use client";

import { useEffect, useState } from "react";
import { InvitationPage } from "@/components/InvitationPage";
import { applyTheme, defaultSettings, getPublishedSettings, type SiteSettings } from "@/lib/site-settings";

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    async function refreshSettings() {
      const response = await fetch("/api/site-settings");
      if (response.ok) {
        const result = await response.json() as { settings: SiteSettings; backend: string };
        if (result.backend === "supabase") {
          setSettings(result.settings);
          return;
        }
      }
      setSettings(getPublishedSettings());
    }

    refreshSettings();
    window.addEventListener("storage", refreshSettings);
    window.addEventListener("wedding-settings-updated", refreshSettings);

    return () => {
      window.removeEventListener("storage", refreshSettings);
      window.removeEventListener("wedding-settings-updated", refreshSettings);
    };
  }, []);

  return <InvitationPage config={applyTheme(settings.content, settings.themeKey)} />;
}
