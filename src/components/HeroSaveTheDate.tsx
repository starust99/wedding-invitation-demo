"use client";

import { useEffect, useState } from "react";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { normalizeWeddingHeroEditorConfig } from "@/lib/wedding/hero-config";
import { buildInvitationCopy, formatGuestName, type GuestIdentity } from "@/lib/guest-personalization";
import type { WeddingConfig } from "@/lib/site-settings";
import type { HeroViewportMode } from "@/lib/wedding/hero-types";

function compactVenueDisplayName(name: string) {
  return name.toLowerCase().includes("terracotta") ? "Terracotta Đà Lạt" : name;
}

export function HeroSaveTheDate({ config, guestIdentity }: { config: WeddingConfig; guestIdentity: GuestIdentity }) {
  const [viewport, setViewport] = useState<HeroViewportMode>("desktop");
  const hasGuestIdentity = Boolean(guestIdentity.name || guestIdentity.displayLabel || guestIdentity.invitationName || guestIdentity.honorific);
  const inviteCopy = buildInvitationCopy({
    ...guestIdentity,
    coupleDisplayName: config.couple.displayName,
    venueDisplayName: compactVenueDisplayName(config.venue.name),
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setViewport(mediaQuery.matches ? "mobile" : "desktop");

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  return (
    <WeddingHero
      config={normalizeWeddingHeroEditorConfig(config.heroEditorConfig)}
      mode="public"
      viewport={viewport}
      summary={{
        guestName: hasGuestIdentity ? formatGuestName(guestIdentity) : undefined,
        guestGreeting: hasGuestIdentity ? inviteCopy.heroGreeting : undefined,
        invitationLine: hasGuestIdentity ? inviteCopy.heroInvitationLine : undefined,
        venueName: config.venue.name,
        venueArea: config.venue.area,
        venueLocation: config.venue.location,
        dateLabel: config.event.dateLabel,
        welcomeTime: config.event.welcomeTime,
      }}
    />
  );
}
