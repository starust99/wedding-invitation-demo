"use client";

import { useEffect, useMemo, useState } from "react";
import { GallerySection } from "@/components/GallerySection";
import { HeroSaveTheDate } from "@/components/HeroSaveTheDate";
import { RsvpSection } from "@/components/RsvpSection";
import { SceneProgress } from "@/components/SceneProgress";
import { ThankYouSection } from "@/components/ThankYouSection";
import { TimelineSection } from "@/components/TimelineSection";
import { WeddingDetailsSection } from "@/components/WeddingDetailsSection";
import { WeddingSplashIntro } from "@/components/WeddingSplashIntro";
import type { GuestIdentity } from "@/lib/guest-personalization";
import { readLocalInvitees, type Invitee } from "@/lib/invites";
import { applyTheme } from "@/lib/site-settings";
import { usePublishedSettings } from "@/lib/use-published-settings";

type InvitePayload = {
  backend: "local" | "supabase";
  invitee?: Invitee;
};

function toGuestIdentity(invitee?: Invitee): GuestIdentity {
  if (!invitee) return {};

  return {
    name: invitee.guestName || invitee.displayLabel,
    honorific: invitee.honorific || undefined,
    group: invitee.guestGroup || undefined,
    displayLabel: invitee.displayLabel || undefined,
    displaySalutation: invitee.displaySalutation || undefined,
    invitationName: invitee.invitationName || undefined,
    relationship: invitee.relationship || undefined,
    invitedBy: invitee.invitedBy,
    hostRelationship: invitee.hostRelationship || undefined,
    hostPronoun: invitee.hostPronoun || undefined,
    coupleReference: invitee.coupleReference || undefined,
    householdMode: invitee.householdMode || undefined,
    plusOnePolicy: invitee.plusOnePolicy || undefined,
  };
}

export function InviteTokenPage({ token }: { token: string }) {
  const publishedSettings = usePublishedSettings();
  const config = applyTheme(publishedSettings.content, publishedSettings.themeKey);
  const [payload, setPayload] = useState<InvitePayload>({ backend: "local" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      setLoading(true);

      const localInvitee = readLocalInvitees().find((item) => item.token === token);
      if (!cancelled) {
        setPayload(localInvitee ? { backend: "local", invitee: localInvitee } : { backend: "local" });
      }

      try {
        const response = await fetch(`/api/invites/${encodeURIComponent(token)}`);
        if (response.ok) {
          const data = await response.json() as InvitePayload;
          if (!cancelled) {
            const mergedInvitee = data.invitee && localInvitee?.rsvp && !data.invitee.rsvp
              ? {
                  ...data.invitee,
                  rsvp: localInvitee.rsvp,
                  inviteStatus: localInvitee.inviteStatus,
                }
              : data.invitee;
            setPayload({
              ...data,
              invitee: mergedInvitee,
            });
          }
        }
      } catch {
        // Local fallback keeps token page usable offline.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const refresh = () => {
      void loadInvite();
    };

    const guestTimer = window.setTimeout(() => {
      void loadInvite();
    }, 0);

    window.addEventListener("wedding-invitees-updated", refresh);
    window.addEventListener("wedding-rsvp-updated", refresh);

    return () => {
      cancelled = true;
      window.clearTimeout(guestTimer);
      window.removeEventListener("wedding-invitees-updated", refresh);
      window.removeEventListener("wedding-rsvp-updated", refresh);
    };
  }, [token]);

  const invitee = payload.invitee;
  const guestIdentity = useMemo(() => toGuestIdentity(invitee), [invitee]);
  const rsvpHref = `/rsvp?invite=${encodeURIComponent(token)}`;
  const shouldShowThankYou = Boolean(invitee?.rsvp);

  useEffect(() => {
    if (!shouldShowThankYou || window.location.hash !== "#thank-you") return;

    const scrollTimer = window.setTimeout(() => {
      document.getElementById("thank-you")?.scrollIntoView({ block: "start" });
    }, 80);

    return () => {
      window.clearTimeout(scrollTimer);
    };
  }, [shouldShowThankYou]);

  return (
    <main data-od-id="token-wedding-invitation" className="public-invitation-page min-h-screen overflow-x-hidden bg-transparent text-[#252934]">
      <WeddingSplashIntro config={config} guestIdentity={guestIdentity} storageKey={token} ready={!loading} />
      <SceneProgress />
      <HeroSaveTheDate config={config} guestIdentity={guestIdentity} />
      <WeddingDetailsSection config={config} guestIdentity={guestIdentity} />
      <TimelineSection config={config} />
      <GallerySection config={config} />
      {!shouldShowThankYou ? (
        <RsvpSection config={config} guestIdentity={guestIdentity} rsvpHref={rsvpHref} />
      ) : null}
      {shouldShowThankYou ? (
        <ThankYouSection
          config={config}
          guestIdentity={guestIdentity}
          rsvpAttending={invitee?.rsvp?.attending}
          rsvpAttendingCeremony={invitee?.rsvp?.attendingCeremony}
          rsvpAttendingBanquet={invitee?.rsvp?.attendingBanquet}
          rsvpHref={rsvpHref}
        />
      ) : null}
    </main>
  );
}
