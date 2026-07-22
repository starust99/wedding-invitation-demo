"use client";

import { useEffect, useMemo, useState } from "react";
import { GallerySection } from "@/components/GallerySection";
import { HeroSaveTheDate } from "@/components/HeroSaveTheDate";
import { RsvpSection } from "@/components/RsvpSection";
import { SceneProgress } from "@/components/SceneProgress";
import { ThankYouSection } from "@/components/ThankYouSection";

import { WeddingDetailsSection } from "@/components/WeddingDetailsSection";
import { WeddingSplashIntro } from "@/components/WeddingSplashIntro";
import { resolveGuestIdentity, type GuestIdentity } from "@/lib/guest-personalization";
import { InviteAccessGate } from "@/components/InviteAccessGate";
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
  const [fetchStatus, setFetchStatus] = useState<"idle" | "ok" | "not-found">("idle");

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      setLoading(true);
      setFetchStatus("idle");

      const localInvitee = readLocalInvitees().find((item) => item.token === token);
      if (!cancelled) {
        setPayload(localInvitee ? { backend: "local", invitee: localInvitee } : { backend: "local" });
        if (localInvitee) {
          setFetchStatus("ok");
        }
      }

      try {
        const response = await fetch(`/api/invites/${encodeURIComponent(token)}`);
        if (response.status === 404) {
          if (!cancelled) {
            setFetchStatus("not-found");
            if (!localInvitee) {
              setPayload({ backend: "local" });
            }
          }
        } else if (response.ok) {
          const data = await response.json() as InvitePayload;
          if (!cancelled) {
            setFetchStatus("ok");
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
        } else if (!cancelled) {
          if (localInvitee) {
            setFetchStatus("ok");
          } else {
            setFetchStatus("not-found");
            setPayload({ backend: "local" });
          }
        }
      } catch {
        if (!cancelled) {
          if (localInvitee) {
            setFetchStatus("ok");
          } else {
            setFetchStatus("not-found");
            setPayload({ backend: "local" });
          }
        }
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
  const inviteeIdentity = useMemo(() => toGuestIdentity(invitee), [invitee]);
  const guestIdentity = useMemo(
    () => resolveGuestIdentity(typeof window !== "undefined" ? window.location.search : "", { token, inviteeIdentity }),
    [token, inviteeIdentity],
  );
  const rsvpHref = `/rsvp?invite=${encodeURIComponent(token)}`;
  const shouldShowThankYou = Boolean(invitee?.rsvp);

  useEffect(() => {
    if (loading) return;
    if (window.location.hash !== "#thank-you") return;

    let attempts = 0;
    const interval = window.setInterval(() => {
      const el = document.getElementById("thank-you");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        attempts++;
        if (attempts >= 4) {
          window.clearInterval(interval);
        }
      }
    }, 150);

    return () => {
      window.clearInterval(interval);
    };
  }, [loading]);

  if (!loading && !invitee && fetchStatus === "not-found") {
    return <InviteAccessGate variant="invalid-token" />;
  }

  return (
    <main data-od-id="token-wedding-invitation" className="public-invitation-page min-h-screen overflow-x-hidden bg-transparent text-[#252934]">
      <WeddingSplashIntro config={config} guestIdentity={guestIdentity} storageKey={token} ready={!loading} />
      <SceneProgress />
      <HeroSaveTheDate config={config} guestIdentity={guestIdentity} />
      <WeddingDetailsSection config={config} guestIdentity={guestIdentity} />
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
