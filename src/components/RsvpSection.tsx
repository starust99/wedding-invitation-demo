"use client";

import { useMemo } from "react";
import { HeartHandshake } from "lucide-react";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";
import { buildInvitationCopy, type GuestIdentity } from "@/lib/guest-personalization";
import { usePageTransition } from "@/components/PageTransitionEffect";

export function RsvpSection({
  config,
  guestIdentity,
  rsvpHref = "/rsvp",
}: {
  config: WeddingConfig;
  guestIdentity: GuestIdentity;
  rsvpHref?: string;
}) {
  const inviteCopy = useMemo(() => buildInvitationCopy(guestIdentity), [guestIdentity]);
  const { navigateWithTransition } = usePageTransition();

  return (
    <section id="rsvp" className="cinematic-stage editorial-band relative overflow-hidden px-5 py-24 text-ink sm:px-8 sm:py-28 lg:py-32">
      <SectionMediaLayers config={config} section="cta" className="opacity-[0.1]" />
      <div aria-hidden="true" className="paper-grain-luxury -z-10 opacity-20" />
      <div aria-hidden="true" className="hero-couture-shade absolute inset-0 opacity-55" />

      <div className="mx-auto flex max-w-7xl justify-center">
        <div
          className="glass-panel relative w-full max-w-4xl overflow-hidden rounded-[2.75rem] px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16"
        >
          <div aria-hidden="true" className="absolute inset-x-8 top-5 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.42),transparent)] sm:inset-x-16 sm:top-7 lg:top-8" />
          <div aria-hidden="true" className="absolute inset-x-8 bottom-5 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent)] sm:inset-x-16 sm:bottom-7 lg:bottom-8" />

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
            <p className="section-kicker-dark wedding-type-kicker">{config.sections.cta.eyebrow}</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-px w-16 bg-[rgba(212,175,55,0.5)] sm:w-20" />
              <span className="h-2 w-2 rounded-full border border-[rgba(212,175,55,0.5)] bg-white/78" />
              <span className="h-px w-16 bg-[rgba(212,175,55,0.5)] sm:w-20" />
            </div>
            <p suppressHydrationWarning className="wedding-type-meta mt-6 max-w-xl text-ink/62">
              {inviteCopy.greeting},
            </p>
            <p className="wedding-type-body mt-4 max-w-xl text-ink/68">
              {inviteCopy.closingLine}
            </p>
            <p suppressHydrationWarning className="wedding-type-body mt-2 max-w-xl text-ink/68">
              {inviteCopy.rsvpLead} trước ngày {config.rsvp.deadline}.
            </p>

              <button
                type="button"
                onClick={() => navigateWithTransition(rsvpHref)}
                className="mt-8 inline-flex h-[4.2rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
              >
                <span className="save-date-btn-label">
                  <HeartHandshake aria-hidden="true" size={18} />
                  <span>Gửi hồi đáp</span>
                </span>
              </button>
          </div>
        </div>
      </div>
    </section>
  );
}
