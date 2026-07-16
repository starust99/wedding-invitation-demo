"use client";

import { motion } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";

function getTimelineIconPath(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes("đón khách")) return "/assets/wedding/timeline/icon-1730.png";
  if (t.includes("khai mạc")) return "/assets/wedding/timeline/icon-1900.png";
  if (t.includes("nghi lễ") || t.includes("nghi thức")) return "/assets/wedding/timeline/icon-1910.png";
  if (t.includes("nâng ly") || t.includes("khai tiệc") || t.includes("dùng tiệc")) return "/assets/wedding/timeline/icon-1920.png";
  if (t.includes("giao lưu")) return "/assets/wedding/timeline/icon-2000.png";
  if (t.includes("chụp ảnh") || t.includes("chụp hình") || t.includes("cảm ơn") || t.includes("kỷ niệm")) return "/assets/wedding/timeline/icon-2050.png";
  return null;
}

export function TimelineSection({ config }: { config: WeddingConfig }) {
  return (
    <section id="timeline" className="timeline-garden-section cinematic-stage relative overflow-hidden px-5 pt-14 pb-24 text-ink sm:px-8 lg:pt-16 lg:pb-32">
      <SectionMediaLayers config={config} section="timeline" className="timeline-garden-media opacity-[0.08]" />
      <div aria-hidden="true" className="paper-grain-luxury timeline-garden-grain opacity-15" />

      <div className="timeline-garden-shell mx-auto max-w-7xl">
        <div className="timeline-garden-intro grid justify-items-center gap-5 text-center mb-3">
          <h3 className="font-serif text-[1.12rem] sm:text-[1.25rem] md:text-[1.38rem] font-bold gold-foil-text uppercase leading-tight mt-0.5 mb-1.5">
            {config.sections.timeline.eyebrow}
          </h3>
          {config.sections.itinerary.description && (
            <p className="wedding-type-body font-serif mx-auto max-w-2xl text-center text-ink/62">
              {config.sections.itinerary.description}
            </p>
          )}
        </div>

        <div className="timeline-garden-path-scene w-full max-w-[26rem] sm:max-w-[28rem] md:max-w-[30rem] mx-auto -mt-6 sm:-mt-8 md:-mt-10 min-h-[28rem] sm:min-h-[32rem] overflow-visible relative">
          {/* Winding road */}
          <div className="timeline-garden-path-image opacity-[0.55] absolute inset-0">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage: "url('/assets/timeline-garden-path-desktop.webp')",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
              }}
            />
          </div>

          <ol className="timeline-garden-list relative z-10 grid justify-items-center w-full">
            {config.timeline.map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="timeline-garden-node !w-[47%] !max-w-[11.2rem] sm:!max-w-[13rem] md:!max-w-[15rem] !ml-0 !mr-0"
              >
                <div className="timeline-garden-card !flex !flex-row !items-center !justify-center !py-1.5 !px-2 shadow-[0_6px_16px_rgba(63,70,66,0.07)] bg-[#fdfbf7]/95 border border-[#b4975a]/25 backdrop-blur-[8px] rounded-xl w-full">
                  <div className="flex flex-row items-center justify-center gap-1.5 w-full">
                    <div className="flex flex-col items-center justify-center text-center min-w-0 flex-1">
                      <p className="timeline-garden-time !text-[0.82rem] sm:!text-[0.95rem] !font-bold text-[#8d713a] tracking-wider mb-0.5 leading-none text-center w-full">
                        {item.time}
                      </p>
                      <h3 className="!text-[0.82rem] sm:!text-[0.95rem] !font-semibold text-[#2f3532] font-serif leading-tight text-center w-full">
                        {item.title}
                      </h3>
                    </div>
                    {getTimelineIconPath(item.title) && (
                      <img
                        src={getTimelineIconPath(item.title) || ""}
                        alt={item.title}
                        className="w-6.5 h-6.5 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                      />
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
