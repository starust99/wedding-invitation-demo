"use client";

import { useEffect, useMemo, useState } from "react";
import { GallerySection } from "@/components/GallerySection";
import { HeroSaveTheDate } from "@/components/HeroSaveTheDate";
import { RsvpSection } from "@/components/RsvpSection";
import { SceneProgress } from "@/components/SceneProgress";
import { ThankYouSection } from "@/components/ThankYouSection";
import { BottomRsvpCta } from "@/components/BottomRsvpCta";

import { WeddingDetailsSection } from "@/components/WeddingDetailsSection";
import { WeddingSplashIntro } from "@/components/WeddingSplashIntro";
import { removeStoredGuestIdentityForToken, resolveGuestIdentity, type GuestIdentity } from "@/lib/guest-personalization";
import { InviteAccessGate } from "@/components/InviteAccessGate";
import { readLocalInvitees, writeLocalInvitees, type Invitee } from "@/lib/invites";
import { readRSVPResponses, removeRSVPResponses } from "@/lib/rsvp-storage";
import { applyTheme } from "@/lib/site-settings";
import { usePublishedSettings } from "@/lib/use-published-settings";
import { useScrollRecovery } from "@/hooks/use-scroll-recovery";

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
    salutationCluster: invitee.salutationCluster || undefined,
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

export function InviteTokenPage({ token, initialInvitee }: { token: string; initialInvitee?: Invitee }) {
  useScrollRecovery(`invite:${token}`);
  const publishedSettings = usePublishedSettings();
  const config = applyTheme(publishedSettings.content, publishedSettings.themeKey);
  const [payload, setPayload] = useState<InvitePayload>({
    backend: initialInvitee ? "supabase" : "local",
    invitee: initialInvitee,
  });
  const [loading, setLoading] = useState(!initialInvitee);
  const [fetchStatus, setFetchStatus] = useState<"idle" | "ok" | "not-found">(initialInvitee ? "ok" : "idle");

  useEffect(() => {
    let cancelled = false;
    let suppressCacheRefresh = false;

    const syncLocalCache = (sync: () => void) => {
      suppressCacheRefresh = true;
      try {
        sync();
      } finally {
        suppressCacheRefresh = false;
      }
    };

    async function loadInvite() {
      if (!initialInvitee) {
        setLoading(true);
      }
      // Keep "ok" if we have initialInvitee, otherwise "idle"
      setFetchStatus((prev) => (prev === "ok" ? "ok" : "idle"));

      const localInvitee = readLocalInvitees().find((item) => item.token === token);
      if (!localInvitee && initialInvitee && typeof window !== "undefined") {
        try {
          const currentLocal = readLocalInvitees();
          currentLocal.push(initialInvitee);
          syncLocalCache(() => writeLocalInvitees(currentLocal));
        } catch {
          // RSVP can still hydrate from the network if local storage is blocked.
        }
      }
      if (!cancelled) {
        setPayload(localInvitee ? { backend: "local", invitee: localInvitee } : { backend: initialInvitee ? "supabase" : "local", invitee: localInvitee || initialInvitee });
        if (localInvitee) {
          setFetchStatus("ok");
        }
      }

      try {
        const response = await fetch(`/api/invites/${encodeURIComponent(token)}`);
        if (response.status === 404) {
          if (!cancelled) {
            setFetchStatus("not-found");
            setPayload({ backend: "local" });
            if (typeof window !== "undefined") {
              try {
                syncLocalCache(() => {
                  writeLocalInvitees(readLocalInvitees().filter((item) => item.token !== token));
                  removeRSVPResponses((response) => response.inviteToken === token);
                  removeStoredGuestIdentityForToken(token);
                });
              } catch {
                // The server result still invalidates this page if browser storage is blocked.
              }
            }
          }
        } else if (response.ok) {
          const data = await response.json() as InvitePayload;
          const remoteInvitee = data.invitee;
          if (!cancelled) {
            setFetchStatus("ok");
            const finalInvitee = remoteInvitee || localInvitee;
            if (remoteInvitee && typeof window !== "undefined") {
              try {
                syncLocalCache(() => {
                  const currentLocal = readLocalInvitees();
                  const idx = currentLocal.findIndex((item) => item.token === token || item.id === remoteInvitee.id);
                  if (idx >= 0) {
                    currentLocal[idx] = remoteInvitee;
                  } else {
                    currentLocal.push(remoteInvitee);
                  }
                  writeLocalInvitees(currentLocal);
                  if (remoteInvitee.inviteStatus === "invited" && !remoteInvitee.rsvp) {
                    removeRSVPResponses((r) => Boolean((token && r.inviteToken === token) || (remoteInvitee.id && r.inviteeId === remoteInvitee.id)));
                  }
                });
              } catch {}
            }
            setPayload({
              ...data,
              invitee: finalInvitee,
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
      if (suppressCacheRefresh) return;
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
  }, [initialInvitee, token]);

  const invitee = payload.invitee;
  const inviteeIdentity = useMemo(() => toGuestIdentity(invitee), [invitee]);
  const guestIdentity = useMemo(
    () => resolveGuestIdentity(typeof window !== "undefined" ? window.location.search : "", { token, inviteeIdentity }),
    [token, inviteeIdentity],
  );
  const rsvpHref = `/rsvp?invite=${encodeURIComponent(token)}`;
  const localRsvp = typeof window !== "undefined" && invitee?.inviteStatus !== "invited"
    ? readRSVPResponses().find((r) => (token && r.inviteToken === token) || (invitee?.id && r.inviteeId === invitee.id))
    : undefined;
  const activeRsvpObj = invitee?.rsvp || localRsvp;
  const hasHashThankYou = typeof window !== "undefined" && window.location.hash.includes("thank-you");
  const shouldShowThankYou = Boolean(activeRsvpObj || (invitee?.inviteStatus && invitee.inviteStatus !== "invited") || hasHashThankYou);
  const isDeclinedResponse = activeRsvpObj?.attending === "no" || invitee?.inviteStatus === "rsvp_no";
  const hasExplicitEventSelections = typeof activeRsvpObj?.attendingCeremony === "boolean"
    || typeof activeRsvpObj?.attendingBanquet === "boolean";
  const showChurchCard = !shouldShowThankYou
    || (!isDeclinedResponse && (!hasExplicitEventSelections || activeRsvpObj?.attendingCeremony === true));
  const showBanquetCard = !shouldShowThankYou
    || (!isDeclinedResponse && (!hasExplicitEventSelections || activeRsvpObj?.attendingBanquet === true));

  useEffect(() => {
    if (loading || window.location.hash !== "#thank-you") return;

    let cancelled = false;
    let attempts = 0;
    let retryTimer = 0;

    const alignThankYouCard = () => {
      if (cancelled) return;
      const element = document.getElementById("thank-you");
      if (!element) {
        attempts += 1;
        if (attempts < 20) retryTimer = window.setTimeout(alignThankYouCard, 100);
        return;
      }

      element.scrollIntoView({ behavior: "auto", block: "start" });
      window.requestAnimationFrame(() => {
        if (!cancelled) element.scrollIntoView({ behavior: "auto", block: "start" });
      });
    };

    alignThankYouCard();
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, [loading, shouldShowThankYou]);

  if (!loading && !invitee && fetchStatus === "not-found") {
    return <InviteAccessGate variant="invalid-token" />;
  }

  return (
    <main data-od-id="token-wedding-invitation" className="public-invitation-page min-h-screen overflow-x-hidden bg-transparent text-[#252934]">
      <WeddingSplashIntro config={config} guestIdentity={guestIdentity} storageKey={token} ready={!loading} />
      <SceneProgress />
      <HeroSaveTheDate config={config} guestIdentity={guestIdentity} />
      <WeddingDetailsSection
        config={config}
        guestIdentity={guestIdentity}
        showChurchCard={showChurchCard}
        showBanquetCard={showBanquetCard}
        responseSlot={!shouldShowThankYou ? (
          <RsvpSection config={config} guestIdentity={guestIdentity} rsvpHref={rsvpHref} invitee={invitee} embedded />
        ) : (
          <ThankYouSection
            config={config}
            guestIdentity={guestIdentity}
            rsvpAttending={activeRsvpObj?.attending || (invitee?.inviteStatus === "rsvp_no" ? "no" : invitee?.inviteStatus && invitee.inviteStatus !== "invited" ? "yes" : "yes")}
            rsvpAttendingCeremony={activeRsvpObj?.attendingCeremony}
            rsvpAttendingBanquet={activeRsvpObj?.attendingBanquet}
            rsvpHref={rsvpHref}
            embedded
          />
        )}
      />
      <GallerySection config={config} />
      {!loading && fetchStatus === "ok" && !shouldShowThankYou ? (
        <BottomRsvpCta rsvpHref={rsvpHref} />
      ) : null}
    </main>
  );
}
