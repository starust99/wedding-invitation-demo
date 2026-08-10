"use client";

import { useEffect, useState, type ReactNode } from "react";
import { EventDetailsSection } from "@/components/wedding/EventDetailsSection";
import { buildInvitationCopy, type GuestIdentity } from "@/lib/guest-personalization";
import { normalizeEventDetailsEditorConfig } from "@/lib/wedding/event-details-config";
import type { WeddingConfig } from "@/lib/site-settings";
import type { EventDetailsViewportMode } from "@/lib/wedding/event-details-types";

export function WeddingDetailsSection({
  config,
  guestIdentity,
  responseSlot,
  showChurchCard = true,
  showBanquetCard = true,
}: {
  config: WeddingConfig;
  guestIdentity?: GuestIdentity;
  responseSlot?: ReactNode;
  showChurchCard?: boolean;
  showBanquetCard?: boolean;
}) {
  const [viewport, setViewport] = useState<EventDetailsViewportMode>("desktop");
  const inviteCopy = buildInvitationCopy({
    ...guestIdentity,
    coupleDisplayName: config.couple.displayName,
    venueDisplayName: config.venue.name,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => setViewport(mediaQuery.matches ? "mobile" : "desktop");

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  return (
    <EventDetailsSection
      config={normalizeEventDetailsEditorConfig(config.eventDetailsConfig)}
      mode="public"
      viewport={viewport}
      mapUrl={config.venue.mapUrl}
      responseSlot={responseSlot}
      showChurchCard={showChurchCard}
      showBanquetCard={showBanquetCard}
      publicData={{
        dateLabel: config.event.dateLabel,
        welcomeTime: config.event.welcomeTime,
        churchDate: config.eventDetailsConfig.content.churchDate,
        churchTime: config.eventDetailsConfig.content.churchTime,
        venueName: config.venue.name,
        venueArea: "Quảng trường Terrace Montagne",
        dressCodeTitle: config.dressCode.title || "Khu vườn mùa xuân",
        dressCodeNote: inviteCopy.dressCodeLine,
        dressCodeImageSrc: "/assets/dresscode-theme-v5.webp",
        dressCodeColors: config.dressCode.colors,
        timeline: config.timeline,
      }}
    />
  );
}
