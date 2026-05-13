"use client";

import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";
import { buildInvitationCopy, type GuestIdentity } from "@/lib/guest-personalization";
import { usePageTransition } from "@/components/PageTransitionEffect";
import type { RSVPResponse } from "@/lib/rsvp-storage";

export function ThankYouSection({
  config,
  guestIdentity,
  rsvpAttending,
  rsvpHref = "/rsvp",
}: {
  config: WeddingConfig;
  guestIdentity: GuestIdentity;
  rsvpAttending?: RSVPResponse["attending"];
  rsvpHref?: string;
}) {
  const inviteCopy = buildInvitationCopy(guestIdentity);
  const { navigateWithTransition } = usePageTransition();
  const thankYouMessage = rsvpAttending === "no"
    ? `${inviteCopy.rsvpReceivedLine}. Hẹn gặp ${inviteCopy.shortRecipientLabel} trong thời gian sớm nhất.`
    : `${inviteCopy.thankYouLine} Hẹn gặp ${inviteCopy.guestLabel} tại ${config.venue.name} trong một buổi tối thật ấm áp.`;

  return (
    <section id="thank-you" className="cinematic-stage editorial-band relative overflow-hidden px-5 py-20 text-center text-ink sm:px-8 sm:py-24 lg:py-28">
      <SectionMediaLayers config={config} section="cta" className="opacity-[0.1]" />
      <div aria-hidden="true" className="hero-couture-shade absolute inset-0 opacity-80" />
      <div aria-hidden="true" className="paper-grain-luxury absolute inset-0 opacity-22" />

      <div className="mx-auto flex max-w-7xl justify-center">
        <div
          className="glass-panel relative w-full max-w-6xl overflow-hidden rounded-[2.8rem] px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
        >
          <div aria-hidden="true" className="absolute inset-x-8 top-4 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.44),transparent)] sm:inset-x-16 sm:top-5 lg:top-6" />
          <div aria-hidden="true" className="absolute inset-x-8 bottom-4 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.32),transparent)] sm:inset-x-16 sm:bottom-5 lg:bottom-6" />
          <div aria-hidden="true" className="absolute left-7 top-7 h-10 w-10 rounded-tl-[1.4rem] border-l border-t border-[rgba(212,175,55,0.22)] sm:left-9 sm:top-9" />
          <div aria-hidden="true" className="absolute right-7 top-7 h-10 w-10 rounded-tr-[1.4rem] border-r border-t border-[rgba(212,175,55,0.22)] sm:right-9 sm:top-9" />
          <div aria-hidden="true" className="absolute bottom-7 left-7 h-10 w-10 rounded-bl-[1.4rem] border-b border-l border-[rgba(212,175,55,0.22)] sm:bottom-9 sm:left-9" />
          <div aria-hidden="true" className="absolute right-7 bottom-7 h-10 w-10 rounded-br-[1.4rem] border-b border-r border-[rgba(212,175,55,0.22)] sm:right-9 sm:bottom-9" />

          <div className="relative z-10 grid min-h-[24rem] place-items-start py-4 text-center sm:min-h-[30rem] sm:place-items-center sm:py-8 lg:min-h-[34rem]">
            <div className="flex w-full max-w-2xl flex-col items-center justify-between gap-8 text-center sm:gap-10">
              <div>
                <p className="section-kicker-dark wedding-type-kicker">Lời cảm ơn</p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <span className="h-px w-16 bg-[rgba(212,175,55,0.46)] sm:w-20" />
                  <span className="h-2 w-2 rounded-full border border-[rgba(212,175,55,0.48)] bg-white/76" />
                  <span className="h-px w-16 bg-[rgba(212,175,55,0.46)] sm:w-20" />
                </div>
                <p suppressHydrationWarning className="wedding-type-body mx-auto mt-6 max-w-xl text-ink/66">
                  {thankYouMessage}
                </p>
              </div>

              <div className="w-full">
                <p suppressHydrationWarning className="wedding-type-card-title text-ink/74">
                  {inviteCopy.signaturePrefix}
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateWithTransition(rsvpHref)}
                    className="inline-flex h-12 items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
                  >
                    <img src="/assets/wedding/ui/btn-view-rsvp.png" alt="" className="save-date-btn-bg" />
                    <span className="save-date-btn-label uppercase">Xem hồi đáp</span>
                  </button>
                  <a
                    suppressHydrationWarning
                    href={config.venue.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
                  >
                    <img src="/assets/wedding/ui/btn-thankyou-directions.png" alt="" className="save-date-btn-bg" />
                    <span className="save-date-btn-label uppercase">Chỉ đường</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
