"use client";

import { useEffect, useState } from "react";
import { GallerySection } from "@/components/GallerySection";
import { HeroSaveTheDate } from "@/components/HeroSaveTheDate";
import { RsvpSection } from "@/components/RsvpSection";
import { SceneProgress } from "@/components/SceneProgress";
import { ThankYouSection } from "@/components/ThankYouSection";
import { TimelineSection } from "@/components/TimelineSection";
import { WeddingDetailsSection } from "@/components/WeddingDetailsSection";
import { WeddingSplashIntro } from "@/components/WeddingSplashIntro";
import { resolveGuestIdentity, type GuestIdentity } from "@/lib/guest-personalization";
import { applyTheme } from "@/lib/site-settings";
import { usePublishedSettings } from "@/lib/use-published-settings";

export default function Home() {
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity>({});
  const settings = usePublishedSettings();

  useEffect(() => {
    // Prevent browser from restoring scroll position on refresh
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const guestTimer = window.setTimeout(() => {
      setGuestIdentity(resolveGuestIdentity(window.location.search));
    }, 0);

    return () => {
      window.clearTimeout(guestTimer);
    };
  }, []);

  const config = applyTheme(settings.content, settings.themeKey);

  return (
    <main data-od-id="rose-serenity-invitation" className="public-invitation-page relative min-h-screen overflow-x-hidden bg-transparent text-[#252934]">
      <WeddingSplashIntro config={config} guestIdentity={guestIdentity} storageKey="home" />
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
