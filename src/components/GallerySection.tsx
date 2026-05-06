"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";

const captions = [
  "Không khí buổi tối",
  "Rose Quartz",
  "Serenity",
  "Những lời chúc",
];

export function GallerySection({ config }: { config: WeddingConfig }) {
  return (
    <section className="cinematic-stage relative bg-[linear-gradient(180deg,rgba(247,202,201,0.24),#fffaf7_34%,rgba(146,168,209,0.22))] px-5 py-24 text-[#252934] sm:px-8 lg:py-32">
      <SectionMediaLayers config={config} section="gallery" className="opacity-20" />
      <div aria-hidden="true" className="aurora-wash -z-10 opacity-45" />
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="grid gap-6 border-y border-[#252934]/10 py-8 sm:grid-cols-[0.8fr_1.2fr] sm:items-end"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.62 }}
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#252934]/48">{config.sections.gallery.eyebrow}</p>
            <h2 className="mt-4 max-w-2xl font-serif text-[clamp(2.9rem,5.8vw,5.5rem)] leading-[1.04]">
              {config.sections.gallery.title}
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#252934]/62 sm:justify-self-end">
            {config.sections.gallery.description}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-4 sm:grid-rows-[18rem_18rem]">
          {config.gallery.map((src, index) => (
            <motion.figure
              key={src}
              className={[
                "group light-sweep relative overflow-hidden rounded-[1.6rem] border border-[#252934]/10 bg-white/44 shadow-[0_28px_86px_rgba(37,41,52,0.1)]",
                index === 0 ? "min-h-[34rem] sm:col-span-2 sm:row-span-2 sm:min-h-0" : "min-h-80 sm:min-h-0",
                index === 3 ? "sm:col-span-2" : "",
              ].join(" ")}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              viewport={{ once: true, amount: 0.24 }}
              transition={{ duration: 0.58, delay: index * 0.04 }}
            >
              <img
                src={src}
                alt={`${config.sections.gallery.imageAltPrefix} ${index + 1}`}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035] group-hover:saturate-[1.08]"
                style={{ objectPosition: config.appearance.galleryObjectPositions[index] || "center center" }}
                draggable={false}
              />
              <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full border border-white/58 bg-white/46 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#252934]/64 backdrop-blur-xl">
                <span>{captions[index] ?? config.sections.gallery.itemLabel}</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
