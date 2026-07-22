"use client";

import { HeartHandshake, MapPin, Image as ImageIcon } from "lucide-react";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";
import { buildInvitationCopy, type GuestIdentity } from "@/lib/guest-personalization";
import { usePageTransition } from "@/components/PageTransitionEffect";
import type { RSVPResponse } from "@/lib/rsvp-storage";
import { motion } from "framer-motion";

export function ThankYouSection({
  config,
  guestIdentity,
  rsvpAttending,
  rsvpAttendingCeremony,
  rsvpAttendingBanquet,
  rsvpHref = "/rsvp",
  transparentBg = false,
}: {
  config: WeddingConfig;
  guestIdentity: GuestIdentity;
  rsvpAttending?: RSVPResponse["attending"];
  rsvpAttendingCeremony?: RSVPResponse["attendingCeremony"];
  rsvpAttendingBanquet?: RSVPResponse["attendingBanquet"];
  rsvpHref?: string;
  transparentBg?: boolean;
}) {
  const inviteCopy = buildInvitationCopy(guestIdentity);
  const { navigateWithTransition } = usePageTransition();

  const { postWeddingGallery } = config;
  const isPostWedding = postWeddingGallery?.enabled && new Date() >= new Date(postWeddingGallery.availableAfter);
  const galleryLink = postWeddingGallery?.groupLinks[guestIdentity.group || ""] || postWeddingGallery?.defaultUrl;

  const isDeclined = rsvpAttending === "no";
  const isCeremonyOnly = rsvpAttending !== "no" && rsvpAttendingBanquet === false;
  const isBanquetOnly = rsvpAttendingCeremony === false && rsvpAttendingBanquet === true;
  const isBoth = rsvpAttendingCeremony === true && rsvpAttendingBanquet === true;
  const isDefault = !isDeclined && !isCeremonyOnly && !isBanquetOnly && !isBoth;

  const recipient = inviteCopy.shortRecipientLabel === "quý khách"
    ? "Quý khách"
    : inviteCopy.shortRecipientLabel.charAt(0).toUpperCase() + inviteCopy.shortRecipientLabel.slice(1);

  let thankYouMessage = "";
  if (rsvpAttending === "no") {
    thankYouMessage = `Xin chân thành cảm ơn ${recipient}. Rất hy vọng sẽ có dịp được đón tiếp ${recipient} vào một dịp khác.`;
  } else if (rsvpAttendingBanquet === false) {
    thankYouMessage = `Xin chân thành cảm ơn! Hẹn gặp ${recipient} tại Thánh lễ Hôn phối.`;
  } else if (rsvpAttendingCeremony === true && rsvpAttendingBanquet === true) {
    thankYouMessage = `Xin chân thành cảm ơn! Hẹn gặp ${recipient} tại Thánh lễ Hôn phối và Tiệc cưới.`;
  } else if (rsvpAttendingCeremony === false && rsvpAttendingBanquet === true) {
    thankYouMessage = `Xin chân thành cảm ơn! Hẹn gặp ${recipient} vào buổi Tiệc cưới thân mật tại Đà Lạt.`;
  } else {
    thankYouMessage = `Xin chân thành cảm ơn! Hẹn gặp ${recipient} tại ngày vui sắp tới.`;
  }

  return (
    <section id="thank-you" className={transparentBg ? "relative overflow-hidden px-5 py-2 text-center text-ink sm:px-8" : "cinematic-stage editorial-band relative overflow-hidden px-5 py-12 text-center text-ink sm:px-8 sm:py-16 lg:py-20"}>
      {!transparentBg && (
        <>
          <SectionMediaLayers config={config} section="cta" className="opacity-[0.1]" />
          <div aria-hidden="true" className="hero-couture-shade absolute inset-0 opacity-80" />
          <div aria-hidden="true" className="paper-grain-luxury absolute inset-0 opacity-22" />
        </>
      )}

      <div className="mx-auto flex max-w-7xl justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="glass-panel relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 shadow-none"
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
                    {isPostWedding && galleryLink ? (
                       <a
                        href={galleryLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-[2.75rem] sm:h-[3.0rem] w-[14rem] sm:w-[15rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
                      >
                        <span className="save-date-btn-label">
                          <ImageIcon aria-hidden="true" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                          <span>Xem ảnh tiệc cưới</span>
                        </span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigateWithTransition(rsvpHref)}
                        className="inline-flex h-[2.75rem] sm:h-[3.0rem] w-[14rem] sm:w-[15rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
                      >
                        <span className="save-date-btn-label">
                          <HeartHandshake aria-hidden="true" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                          <span>Chỉnh sửa hồi đáp</span>
                        </span>
                      </button>
                    )}

                    {/* Navigation Buttons: Đến Nhà thờ & Đến Tiệc cưới - Side-by-side on same row */}
                    {((isCeremonyOnly || isBoth) || (isBanquetOnly || isBoth || isDefault)) && (
                      <div className="flex flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 w-full">
                        {(isCeremonyOnly || isBoth) ? (
                          <a
                            suppressHydrationWarning
                            href={config.church?.mapUrl || config.venue.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-[2.75rem] sm:h-[3.0rem] w-[14rem] sm:w-[15rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
                          >
                            <span className="save-date-btn-label">
                              <MapPin aria-hidden="true" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                              <span>Đến Nhà thờ</span>
                            </span>
                          </a>
                        ) : null}
                        
                        {(isBanquetOnly || isBoth || isDefault) ? (
                          <a
                            suppressHydrationWarning
                            href={config.venue.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-[2.75rem] sm:h-[3.0rem] w-[14rem] sm:w-[15rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
                          >
                            <span className="save-date-btn-label">
                              <MapPin aria-hidden="true" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                              <span>{isBanquetOnly || isBoth ? "Đến Tiệc cưới" : "Chỉ đường"}</span>
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
