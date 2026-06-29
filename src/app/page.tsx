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
import { BackgroundMusic } from "@/components/wedding/BackgroundMusic";
import { resolveGuestIdentity, normalizeText, type GuestIdentity } from "@/lib/guest-personalization";
import { applyTheme } from "@/lib/site-settings";
import { usePublishedSettings } from "@/lib/use-published-settings";
import { readRSVPResponses, type RSVPResponse } from "@/lib/rsvp-storage";

export default function Home() {
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity>({});
  const [hasRsvp, setHasRsvp] = useState(false);
  const [activeRsvp, setActiveRsvp] = useState<RSVPResponse | undefined>(undefined);
  const settings = usePublishedSettings();

  useEffect(() => {
    // Prevent browser from restoring scroll position on refresh
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const identity = resolveGuestIdentity(window.location.search);
    setGuestIdentity(identity);

    const checkRsvp = () => {
      const responses = readRSVPResponses();
      if (responses.length === 0) {
        setHasRsvp(false);
        setActiveRsvp(undefined);
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const searchToken = searchParams.get("invite") ?? searchParams.get("token") ?? "";

      // If guest identity name is loaded, try to match by name or token
      if (identity.name) {
        const targetName = normalizeText(identity.name);
        const match = responses.find((item) => {
          if (item.inviteToken && searchToken && item.inviteToken === searchToken) return true;
          return normalizeText(item.name) === targetName || (item.displayLabel && normalizeText(item.displayLabel) === targetName);
        });
        if (match) {
          setHasRsvp(true);
          setActiveRsvp(match);
          return;
        }
      }

      // Fallback: pick the most recent session RSVP if any exists
      setHasRsvp(true);
      setActiveRsvp(responses[0]);
    };

    checkRsvp();

    window.addEventListener("wedding-rsvp-updated", checkRsvp);
    return () => {
      window.removeEventListener("wedding-rsvp-updated", checkRsvp);
    };
  }, []);

  const config = applyTheme(settings.content, settings.themeKey);

  return (
    <main data-od-id="rose-serenity-invitation" className="public-invitation-page relative min-h-screen overflow-x-hidden bg-transparent text-[#252934]">
      <WeddingSplashIntro config={config} guestIdentity={guestIdentity} storageKey="home" />
      <SceneProgress />
      <BackgroundMusic />
      <HeroSaveTheDate config={config} guestIdentity={guestIdentity} />
      <WeddingDetailsSection config={config} guestIdentity={guestIdentity} />
      <TimelineSection config={config} />
      <GallerySection config={config} />
      <RsvpSection config={config} guestIdentity={guestIdentity} />
      <ThankYouSection
        config={config}
        guestIdentity={guestIdentity}
        rsvpAttending={activeRsvp?.attending || "yes"}
        rsvpAttendingCeremony={activeRsvp?.attendingCeremony ?? true}
        rsvpAttendingBanquet={activeRsvp?.attendingBanquet ?? true}
      />
    </main>
  );
}
