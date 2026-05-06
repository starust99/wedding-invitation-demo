"use client";

import { motion } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";

export function TimelineSection({ config }: { config: WeddingConfig }) {
  return (
    <section className="cinematic-stage relative bg-[linear-gradient(180deg,rgba(146,168,209,0.22),rgba(255,250,247,1)_38%,rgba(247,202,201,0.24))] px-5 py-24 text-[#252934] sm:px-8 lg:py-32">
      <SectionMediaLayers config={config} section="timeline" className="opacity-[0.18]" />
      <div aria-hidden="true" className="aurora-wash -z-10 opacity-35" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.62 }}
          >
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#252934]/48">{config.sections.timeline.eyebrow}</p>
            <h2 className="mt-4 max-w-xl font-serif text-[clamp(2.9rem,5.8vw,5.6rem)] leading-[1.04]">{config.sections.timeline.title}</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#252934]/62">{config.sections.itinerary.description}</p>
          </motion.div>

          <div className="relative grid gap-4">
            <div aria-hidden="true" className="absolute left-4 top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-rose-quartz via-serenity to-rose-quartz sm:block" />
            {config.timeline.map((item, index) => (
              <motion.article
                key={`${item.time}-${item.title}`}
                className="cinematic-frame grid gap-4 rounded-[1.5rem] p-5 sm:ml-12 sm:grid-cols-[7rem_1fr] sm:p-6"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.56, delay: index * 0.04 }}
              >
                <div>
                  <p className="font-serif text-3xl leading-tight sm:text-4xl">{item.time}</p>
                  <p className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.22em] text-serenity">Chapter {index + 1}</p>
                </div>
                <div>
                  <h3 className="font-serif text-3xl leading-snug sm:text-4xl">{item.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#252934]/62">{item.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
