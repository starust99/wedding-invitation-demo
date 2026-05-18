"use client";

import { HeartHandshake, MapPin } from "lucide-react";
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
  rsvpAttendingBanquet,
  rsvpHref = "/rsvp",
}: {
  config: WeddingConfig;
  guestIdentity: GuestIdentity;
  rsvpAttending?: RSVPResponse["attending"];
  rsvpAttendingBanquet?: RSVPResponse["attendingBanquet"];
  rsvpHref?: string;
}) {
  const inviteCopy = buildInvitationCopy(guestIdentity);
  const { navigateWithTransition } = usePageTransition();

  let thankYouMessage = "";
  if (rsvpAttending === "no") {
    thankYouMessage = `${inviteCopy.hostSubject} đã ghi nhận phản hồi không thể tham dự của ${inviteCopy.shortRecipientLabel}. Rất hy vọng sẽ có dịp được đón tiếp ${inviteCopy.shortRecipientLabel} trong những sự kiện sắp tới của ${inviteCopy.hostPronoun}.`;
  } else if (rsvpAttendingBanquet === false) {
    thankYouMessage = `${inviteCopy.thankYouLine} Hẹn gặp ${inviteCopy.shortRecipientLabel} tại Thánh lễ Hôn phối sắp tới.`;
  } else {
    thankYouMessage = `${inviteCopy.thankYouLine} Hẹn gặp ${inviteCopy.shortRecipientLabel} tại ${config.venue.name} trong một buổi tối thật ấm áp.`;
  }

  const instructionMessage = `(Nếu có thay đổi về kế hoạch, ${inviteCopy.shortRecipientLabel} vui lòng điều chỉnh lại thông tin bằng cách bấm nút bên dưới trước ngày 26/9/2026).`;

  return (
    <section id="thank-you" className="cinematic-stage editorial-band relative overflow-hidden px-5 py-24 text-center text-ink sm:px-8 sm:py-28 lg:py-32">
      <SectionMediaLayers config={config} section="cta" className="opacity-[0.1]" />
      <div aria-hidden="true" className="hero-couture-shade absolute inset-0 opacity-80" />
      <div aria-hidden="true" className="paper-grain-luxury absolute inset-0 opacity-22" />

      <div className="mx-auto flex max-w-7xl justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="glass-panel relative w-full max-w-6xl overflow-hidden rounded-[2.8rem] px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
        >


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

                <div className="mx-auto mt-10 max-w-lg">
                  <p suppressHydrationWarning className="mb-6 text-[0.95rem] text-ink/50 italic leading-relaxed">
                    {instructionMessage}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigateWithTransition(rsvpHref)}
                      className="inline-flex h-[3.8rem] sm:h-[4.5rem] lg:h-[5rem] text-[0.92rem] sm:text-lg items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
                    >
                      <span className="save-date-btn-label">
                        <HeartHandshake aria-hidden="true" size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Chỉnh sửa hồi đáp</span>
                      </span>
                    </button>
                    {rsvpAttending !== "no" ? (
                      <a
                        suppressHydrationWarning
                        href={config.venue.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-[3.8rem] sm:h-[4.5rem] lg:h-[5rem] text-[0.92rem] sm:text-lg items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
                      >
                        <span className="save-date-btn-label">
                        <MapPin aria-hidden="true" size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Chỉ đường</span>
                      </span>
                      </a>
                    ) : null}
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
