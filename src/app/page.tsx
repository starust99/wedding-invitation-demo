"use client";

import { useEffect, useState } from "react";
import { GallerySection } from "@/components/GallerySection";
import { HeroSaveTheDate } from "@/components/HeroSaveTheDate";
import { RsvpSection } from "@/components/RsvpSection";
import { SceneProgress } from "@/components/SceneProgress";
import { ThankYouSection } from "@/components/ThankYouSection";
import { TimelineSection } from "@/components/TimelineSection";
import { WeddingDetailsSection } from "@/components/WeddingDetailsSection";
import { resolveGuestIdentity, type GuestIdentity } from "@/lib/guest-personalization";
import { applyTheme } from "@/lib/site-settings";
import { usePublishedSettings } from "@/lib/use-published-settings";

export default function Home() {
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity>({});
  const settings = usePublishedSettings();

  useEffect(() => {
    const guestTimer = window.setTimeout(() => {
      setGuestIdentity(resolveGuestIdentity(window.location.search));
    }, 0);

    return () => {
      window.clearTimeout(guestTimer);
    };
  }, []);

  const config = applyTheme(settings.content, settings.themeKey);

  return (
    <main data-od-id="rose-serenity-invitation" className="min-h-screen overflow-x-hidden bg-cream text-[#252934]">
      <SceneProgress />
      <HeroSaveTheDate config={config} guestIdentity={guestIdentity} />
      <WeddingDetailsSection config={config} />
      <TimelineSection config={config} />
      <GallerySection config={config} />
      <RsvpSection config={config} guestIdentity={guestIdentity} />
      <ThankYouSection config={config} guestIdentity={guestIdentity} />
    </main>
  );
}
