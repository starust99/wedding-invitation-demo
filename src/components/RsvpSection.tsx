"use client";

import { useMemo } from "react";
import { HeartHandshake } from "lucide-react";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";
import { buildInvitationCopy, type GuestIdentity } from "@/lib/guest-personalization";
import { usePageTransition } from "@/components/PageTransitionEffect";
import { motion } from "framer-motion";

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
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="glass-panel relative w-full max-w-4xl overflow-hidden rounded-[2.75rem] px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16"
        >
          <div aria-hidden="true" className="absolute inset-x-8 top-5 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.42),transparent)] sm:inset-x-16 sm:top-7 lg:top-8" />
          <div aria-hidden="true" className="absolute inset-x-8 bottom-5 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent)] sm:inset-x-16 sm:bottom-7 lg:bottom-8" />

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
            <h3 className="font-serif text-[1.12rem] sm:text-[1.25rem] md:text-[1.38rem] font-bold gold-foil-text uppercase leading-tight mt-0.5 mb-1.5">
              {config.sections.cta.eyebrow}
            </h3>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-px w-16 bg-[rgba(212,175,55,0.5)] sm:w-20" />
              <span className="h-2 w-2 rounded-full border border-[rgba(212,175,55,0.5)] bg-white/78" />
              <span className="h-px w-16 bg-[rgba(212,175,55,0.5)] sm:w-20" />
            </div>
            <p suppressHydrationWarning className="wedding-type-meta font-sans mt-6 max-w-xl text-ink/62 uppercase tracking-wider">
              {inviteCopy.greeting.toUpperCase()},
            </p>
            <p className="wedding-type-body font-sans mt-4 max-w-2xl text-ink/68">
              Sự hiện diện của {inviteCopy.presenceSubject === "quý khách" ? "Quý khách" : inviteCopy.presenceSubject.charAt(0).toUpperCase() + inviteCopy.presenceSubject.slice(1)} để cùng chia sẻ những khoảnh khắc ý nghĩa là niềm vinh hạnh lớn của hai gia đình trong ngày vui sắp tới.
            </p>
            <p className="wedding-type-body font-sans mt-4 max-w-2xl text-ink/68">
              Để khâu tổ chức và công tác tiếp đón được chuẩn bị chu đáo nhất, {inviteCopy.kinshipPronoun === "quý khách" ? "Quý khách" : inviteCopy.kinshipPronoun.charAt(0).toUpperCase() + inviteCopy.kinshipPronoun.slice(1)} vui lòng xác nhận thông tin tham dự qua biểu mẫu dưới đây trước ngày <strong className="font-bold text-ink/90">{config.rsvp.deadline}</strong>.
            </p>
            <p className="wedding-type-body font-sans mt-4 max-w-xl text-ink/68">
              Xin bấm nút "Gửi hồi đáp" để điền thông tin.
            </p>
            <p className="wedding-type-body font-sans mt-2 max-w-xl text-ink/68">
              Xin trân trọng cảm ơn.
            </p>

              <button
                type="button"
                onClick={() => navigateWithTransition(rsvpHref)}
                className="mt-8 inline-flex h-[4.2rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn"
              >
                <span className="save-date-btn-label font-sans">
                  <HeartHandshake aria-hidden="true" size={18} />
                  <span>Gửi hồi đáp</span>
                </span>
              </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
