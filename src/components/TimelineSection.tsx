"use client";

import { motion } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";
const timelinePathVideo = "/assets/timeline-path.mp4";
const timelinePathWebm = "/assets/timeline-path-web.webm";

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

function TimelineIcon({ title, className }: { title: string; className?: string }) {
  const iconPath = getTimelineIconPath(title);
  if (!iconPath) return null;
  return (
    <img
      src={iconPath}
      alt={title}
      className={className}
      draggable={false}
    />
  );
}

export function TimelineSection({ config }: { config: WeddingConfig }) {
  return (
    <section id="timeline" className="timeline-garden-section cinematic-stage relative overflow-hidden px-5 pt-8 pb-20 text-ink sm:px-8 lg:pt-10 lg:pb-24">
      <SectionMediaLayers config={config} section="timeline" className="timeline-garden-media opacity-[0.08]" />
      <div aria-hidden="true" className="paper-grain-luxury timeline-garden-grain opacity-15" />

      <div className="timeline-garden-shell mx-auto max-w-7xl">
        <div className="timeline-garden-intro grid justify-items-center gap-5 text-center mb-5">
          <h3 className="font-serif text-[1.12rem] sm:text-[1.25rem] md:text-[1.38rem] font-bold gold-foil-text uppercase leading-tight mt-0.5 mb-1.5">
            {config.sections.timeline.eyebrow}
          </h3>
          {config.sections.itinerary.description && (
            <p className="wedding-type-body font-serif mx-auto max-w-2xl text-center text-ink/62">
              {config.sections.itinerary.description}
            </p>
          )}
        </div>

        <div className="event-details-timeline-scene timeline-garden-path-scene w-full max-w-[28rem] sm:max-w-[34rem] md:max-w-[38rem] mx-auto min-h-[28rem] overflow-visible relative">
          {/* Con đường: video nền */}
          <div className="timeline-garden-path-image timeline-path-video-wrap opacity-[0.85] absolute inset-0 pointer-events-none">
            <video
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain timeline-path-video"
              autoPlay loop muted playsInline
            >
              <source src={timelinePathWebm} type="video/webm" />
              <source src={timelinePathVideo} type="video/mp4" />
            </video>
          </div>

          {/* Các thẻ mốc thời gian — so le trái/phải */}
          <ol className="event-details-timeline-list timeline-garden-list relative z-10 grid w-full gap-4 sm:gap-5 px-1">
            {config.timeline.map((item, index) => {
              const isRight = index % 2 === 0;
              return (
                <li
                  key={index}
                  className={`timeline-garden-node !m-0 flex w-full ${isRight ? "justify-end" : "justify-start"}`}
                >
                  <div className="timeline-garden-card !py-3 !pl-4 !pr-12 !gap-1 shadow-[0_6px_16px_rgba(63,70,66,0.07)] text-left flex flex-col items-start justify-center bg-[#fdfbf7]/95 border border-[#b4975a]/25 backdrop-blur-[8px] rounded-2xl relative overflow-hidden w-[62%] sm:w-[58%] md:w-[54%] min-w-[11rem]">
                    <TimelineIcon title={item.title} className="!absolute !right-2 !top-1/2 !-translate-y-1/2 !w-9 !h-9 !m-0 opacity-50 pointer-events-none" />
                    <p className="!text-[1rem] !font-bold text-[#8d713a] tracking-wider mb-0.5 relative z-10">{item.time}</p>
                    <h3 className="!text-[1.05rem] !font-semibold text-[#2f3532] font-serif leading-snug relative z-10">{item.title}</h3>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
