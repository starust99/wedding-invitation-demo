"use client";

import { motion } from "framer-motion";
import { BedDouble, ChefHat, MapPin, Shirt, Sparkles } from "lucide-react";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";

const detailMotion = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.35 },
  transition: { duration: 0.62 },
};

export function WeddingDetailsSection({ config }: { config: WeddingConfig }) {
  return (
    <section id="invitation" className="cinematic-stage relative bg-cream px-5 py-24 text-[#252934] sm:px-8 lg:py-32">
      <SectionMediaLayers config={config} section="invitation" className="opacity-25" />
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(255,250,247,1),rgba(247,202,201,0.24)_46%,rgba(146,168,209,0.2))]" />
      <div aria-hidden="true" className="aurora-wash -z-10 opacity-45" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <motion.div {...detailMotion} className="lg:sticky lg:top-12">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#252934]/48">{config.sections.invitation.eyebrow}</p>
            <h2 className="mt-4 max-w-2xl font-serif text-[clamp(2.9rem,5.8vw,5.7rem)] leading-[1.04]">
              {config.invitation.title}
            </h2>
            <div className="mt-8 max-w-xl border-l border-serenity pl-6">
              <p className="text-lg leading-8 text-[#252934]/68">{config.invitation.message}</p>
              <p className="mt-6 font-serif text-2xl italic leading-snug text-[#252934] sm:text-3xl">{config.invitation.closing}</p>
            </div>
          </motion.div>

          <div className="grid gap-4">
            <motion.div
              className="cinematic-frame light-sweep overflow-hidden rounded-[2rem] p-6 sm:p-8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.68 }}
            >
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#252934]/48">Wedding frame</p>
              <div className="mt-7 grid gap-7 sm:grid-cols-[10rem_1fr] sm:items-end">
                <div className="rounded-[1.5rem] bg-[linear-gradient(145deg,rgba(247,202,201,0.92),rgba(146,168,209,0.52))] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.56)]">
                  <p className="font-serif text-7xl leading-none">26</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.22em]">12.2026</p>
                </div>
                <div>
                  <p className="font-serif text-4xl leading-tight sm:text-5xl">{config.venue.name}</p>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-[#252934]/62">{config.venue.note}</p>
                </div>
              </div>
            </motion.div>

            {[
              {
                icon: MapPin,
                label: "Địa điểm",
                title: config.venue.name,
                text: `${config.venue.area} · ${config.venue.location}`,
              },
              {
                icon: Shirt,
                label: "Dress code",
                title: config.dressCode.title,
                text: config.dressCode.note,
              },
              {
                icon: ChefHat,
                label: "Thực đơn",
                title: "Ghi chú riêng được chuẩn bị trước",
                text: "Anh/chị có thể ghi chú ăn chay, dị ứng, kiêng món, không dùng rượu/cồn hoặc suất trẻ em trong RSVP.",
              },
              {
                icon: BedDouble,
                label: "Lưu trú",
                title: config.accommodation.title,
                text: config.accommodation.description,
              },
            ].map((item, index) => (
              <motion.article
                key={item.label}
                className="group grid gap-5 rounded-[1.5rem] border border-[#252934]/10 bg-white/48 p-5 shadow-[0_18px_55px_rgba(37,41,52,0.06)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/64 sm:grid-cols-[3.5rem_1fr] sm:p-6"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.32 }}
                transition={{ duration: 0.58, delay: index * 0.05 }}
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-serenity/28 text-[#252934] group-hover:bg-rose-quartz/42">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#252934]/44">{item.label}</p>
                  <h3 className="mt-2 font-serif text-2xl leading-snug sm:text-3xl">{item.title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#252934]/62">{item.text}</p>
                </div>
              </motion.article>
            ))}

            <motion.div
              className="mt-4 flex items-start gap-3 border-t border-[#252934]/10 pt-6 text-sm leading-6 text-[#252934]/60"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7 }}
            >
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-serenity" />
              Mọi thông tin riêng của khách mời chỉ dùng để gia đình và wedding concierge chuẩn bị phần đón tiếp chu đáo hơn.
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
