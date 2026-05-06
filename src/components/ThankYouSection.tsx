"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";
import { formatGuestName, type GuestIdentity } from "@/lib/guest-personalization";

export function ThankYouSection({ config, guestIdentity }: { config: WeddingConfig; guestIdentity: GuestIdentity }) {
  return (
    <section className="cinematic-stage relative grid min-h-[74dvh] place-items-center bg-[linear-gradient(180deg,rgba(255,250,247,1),rgba(247,202,201,0.32),rgba(146,168,209,0.3))] px-5 py-24 text-center text-[#252934]">
      <SectionMediaLayers config={config} section="cta" className="opacity-20" />
      <div aria-hidden="true" className="aurora-wash -z-10 opacity-45" />
      <div aria-hidden="true" className="film-grain-soft -z-10" />
      <motion.div
        className="mx-auto max-w-4xl"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.68 }}
      >
        <p className="text-xs font-black uppercase tracking-[0.34em] text-[#252934]/48">Thank you</p>
        <h2 className="mt-5 font-serif text-[clamp(3rem,7vw,6rem)] leading-[1.04]">Hẹn gặp {formatGuestName(guestIdentity)}</h2>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#252934]/62">
          {config.couple.displayName} và gia đình rất trân trọng sự hiện diện của anh/chị trong buổi tối đặc biệt tại {config.venue.name}.
        </p>
        <Link
          href="#rsvp"
          className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full border border-[#252934]/14 bg-white/42 px-7 text-xs font-black uppercase tracking-[0.22em] text-[#252934] backdrop-blur-xl transition hover:-translate-y-0.5"
        >
          Xem lại RSVP
        </Link>
      </motion.div>
    </section>
  );
}
