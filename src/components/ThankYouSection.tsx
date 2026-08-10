"use client";

import type { MouseEvent } from "react";
import { Church, HeartHandshake, Image as ImageIcon, Wine } from "lucide-react";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";
import { buildInvitationCopy, type GuestIdentity } from "@/lib/guest-personalization";
import { buildThankYouMessage } from "@/lib/guest-rsvp-copy";
import { usePageTransition } from "@/components/PageTransitionEffect";
import type { RSVPResponse } from "@/lib/rsvp-storage";
import { motion } from "framer-motion";

function normalizeGuestGroup(value?: string) {
  return value?.trim().toLocaleLowerCase("vi") ?? "";
}

function resolveGalleryLink(groupLinks: Record<string, string>, guestGroup?: string) {
  const target = normalizeGuestGroup(guestGroup);
  if (!target) return "";

  return Object.entries(groupLinks).find(([group]) => normalizeGuestGroup(group) === target)?.[1] ?? "";
}

export function ThankYouSection({
  config,
  guestIdentity,
  rsvpAttending,
  rsvpAttendingCeremony,
  rsvpAttendingBanquet,
  rsvpHref = "/rsvp",
  transparentBg = false,
  embedded = false,
}: {
  config: WeddingConfig;
  guestIdentity: GuestIdentity;
  rsvpAttending?: RSVPResponse["attending"];
  rsvpAttendingCeremony?: RSVPResponse["attendingCeremony"];
  rsvpAttendingBanquet?: RSVPResponse["attendingBanquet"];
  rsvpHref?: string;
  transparentBg?: boolean;
  embedded?: boolean;
}) {
  const inviteCopy = buildInvitationCopy(guestIdentity);
  const { navigateWithTransition } = usePageTransition();

  const handleInformationJump = (event: MouseEvent<HTMLAnchorElement>, targetId: "thanh-le-hon-phoi" | "tiec-cuoi") => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("wedding:reveal-event-card", { detail: { targetId } }));
    window.history.replaceState(window.history.state, "", `#${targetId}`);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  if (!rsvpAttending) return null;

  const { postWeddingGallery } = config;
  const isPostWedding = postWeddingGallery?.enabled && new Date() >= new Date(postWeddingGallery.availableAfter);
  const ceremonyGalleryLink = rsvpAttendingCeremony === true
    ? resolveGalleryLink(postWeddingGallery?.ceremonyGroupLinks ?? {}, guestIdentity.group) || postWeddingGallery?.ceremonyDefaultUrl
    : "";
  const banquetGalleryLink = rsvpAttendingBanquet === true
    ? resolveGalleryLink(postWeddingGallery?.banquetGroupLinks ?? {}, guestIdentity.group) || postWeddingGallery?.banquetDefaultUrl
    : "";
  const availableGalleries = [
    ceremonyGalleryLink ? { label: "Album Thánh lễ", href: ceremonyGalleryLink } : null,
    banquetGalleryLink ? { label: "Album Tiệc cưới", href: banquetGalleryLink } : null,
  ].filter((gallery): gallery is { label: string; href: string } => Boolean(gallery));

  const isDeclined = rsvpAttending === "no";
  const isCeremonyOnly = rsvpAttending !== "no" && rsvpAttendingBanquet === false;
  const isBanquetOnly = rsvpAttendingCeremony === false && rsvpAttendingBanquet === true;
  const isBoth = rsvpAttendingCeremony === true && rsvpAttendingBanquet === true;
  const isDefault = !isDeclined && !isCeremonyOnly && !isBanquetOnly && !isBoth;

  const thankYouMessage = buildThankYouMessage({
    attending: rsvpAttending,
    attendingCeremony: rsvpAttendingCeremony,
    attendingBanquet: rsvpAttendingBanquet,
    salutationCluster: guestIdentity.salutationCluster,
    fullGuestName: guestIdentity.displayLabel || guestIdentity.name,
  });

  return (
    <section
      id="thank-you"
      className={embedded
        ? "relative w-full overflow-visible text-center text-ink"
        : transparentBg
          ? "relative overflow-hidden px-5 py-2 text-center text-ink sm:px-8"
          : "cinematic-stage editorial-band relative overflow-hidden px-5 py-12 text-center text-ink sm:px-8 sm:py-16 lg:py-20"}
    >
      {!transparentBg && !embedded && (
        <>
          <SectionMediaLayers config={config} section="cta" className="opacity-[0.1]" />
          <div aria-hidden="true" className="hero-couture-shade absolute inset-0 opacity-80" />
          <div aria-hidden="true" className="paper-grain-luxury absolute inset-0 opacity-22" />
        </>
      )}

      <div className={embedded ? "mx-auto flex w-full justify-center" : "mx-auto flex max-w-7xl justify-center"}>
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.97, filter: "blur(16px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          className={`glass-panel relative w-full overflow-hidden rounded-[2.5rem] px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 shadow-none ${embedded ? "max-w-none" : "max-w-3xl"}`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center py-2 text-center">
            <div className="flex w-full max-w-2xl flex-col items-center justify-between gap-5 text-center sm:gap-6">
              <div>
                <h3 className="font-serif text-[1.12rem] sm:text-[1.25rem] md:text-[1.38rem] font-bold gold-foil-text uppercase leading-tight mt-0.5 mb-1.5">
                  Phản hồi đã được ghi nhận
                </h3>
                <div className="mt-3.5 flex items-center justify-center gap-3">
                  <span className="h-px w-16 bg-[rgba(212,175,55,0.46)] sm:w-20" />
                  <span className="h-2 w-2 rounded-full border border-[rgba(212,175,55,0.48)] bg-white/76" />
                  <span className="h-px w-16 bg-[rgba(212,175,55,0.46)] sm:w-20" />
                </div>
                <p suppressHydrationWarning className="wedding-type-body font-sans mx-auto mt-4 max-w-xl text-ink/66">
                  {thankYouMessage}
                </p>
              </div>

              <div className="w-full">
                <p suppressHydrationWarning className="wedding-type-card-title text-ink/74">
                  {inviteCopy.signaturePrefix}
                </p>

                <div className="mx-auto mt-5 w-full max-w-2xl">
                  <div className="flex flex-col items-center justify-center gap-3 sm:gap-3.5">
                    {/* Primary Action */}
                    {isPostWedding && availableGalleries.length > 0 ? (
                      <div className="flex flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
                        {availableGalleries.map((gallery) => (
                          <a
                            key={gallery.label}
                            href={gallery.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-[2.75rem] sm:h-[3.0rem] w-[14rem] sm:w-[15rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn save-date-btn-equal-width"
                          >
                            <span className="save-date-btn-label">
                              <ImageIcon aria-hidden="true" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                              <span>{gallery.label}</span>
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigateWithTransition(rsvpHref)}
                        className="inline-flex h-[2.75rem] sm:h-[3.0rem] w-[14rem] sm:w-[15rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn save-date-btn-equal-width"
                      >
                        <span className="save-date-btn-label">
                          <HeartHandshake aria-hidden="true" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                          <span>Chỉnh sửa hồi đáp</span>
                        </span>
                      </button>
                    )}

                    {/* Navigation Buttons: jump to the matching information card. */}
                    {((isCeremonyOnly || isBoth) || (isBanquetOnly || isBoth || isDefault)) && (
                      <div className="flex flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 w-full">
                        {(isCeremonyOnly || isBoth) ? (
                          <a
                            suppressHydrationWarning
                            href="#thanh-le-hon-phoi"
                            onClick={(event) => handleInformationJump(event, "thanh-le-hon-phoi")}
                            className="inline-flex h-[2.75rem] sm:h-[3.0rem] w-[14rem] sm:w-[15rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn save-date-btn-equal-width"
                          >
                            <span className="save-date-btn-label">
                              <Church aria-hidden="true" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                              <span>Thông tin Thánh lễ</span>
                            </span>
                          </a>
                        ) : null}
                        
                        {(isBanquetOnly || isBoth || isDefault) ? (
                          <a
                            suppressHydrationWarning
                            href="#tiec-cuoi"
                            onClick={(event) => handleInformationJump(event, "tiec-cuoi")}
                            className="inline-flex h-[2.75rem] sm:h-[3.0rem] w-[14rem] sm:w-[15rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn save-date-btn-equal-width"
                          >
                            <span className="save-date-btn-label">
                              <Wine aria-hidden="true" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                              <span>Thông tin Tiệc cưới</span>
                            </span>
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
