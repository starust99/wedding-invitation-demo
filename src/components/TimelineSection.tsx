"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";

type TimelineNode = {
  time: string;
  title: string;
  y: string;
  rotate: string;
  width: string;
};

const desktopTimelineNodes: Array<Pick<TimelineNode, "y" | "rotate" | "width">> = [
  { y: "7.5%", rotate: "-1.2deg", width: "17rem" },
  { y: "22.5%", rotate: "1deg", width: "17rem" },
  { y: "40%", rotate: "-1deg", width: "17rem" },
  { y: "57%", rotate: "1.1deg", width: "17rem" },
  { y: "74.5%", rotate: "-0.9deg", width: "17rem" },
  { y: "91%", rotate: "1deg", width: "17rem" },
];

function buildTimelineNode(item: WeddingConfig["timeline"][number], index: number): TimelineNode {
  const fallback = desktopTimelineNodes[index % desktopTimelineNodes.length];
  return {
    time: item.time,
    title: item.title,
    y: fallback.y,
    rotate: fallback.rotate,
    width: fallback.width,
  };
}

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
  const nodes = config.timeline.map(buildTimelineNode);

  return (
    <section id="timeline" className="timeline-garden-section cinematic-stage relative overflow-hidden px-5 pt-14 pb-24 text-ink sm:px-8 lg:pt-16 lg:pb-32">
      <SectionMediaLayers config={config} section="timeline" className="timeline-garden-media opacity-[0.08]" />
      <div aria-hidden="true" className="paper-grain-luxury timeline-garden-grain opacity-15" />

      <div className="timeline-garden-shell mx-auto max-w-7xl">
        <div className="timeline-garden-intro grid justify-items-center gap-5 text-center mb-10">
          <h3 className="font-serif text-[1.12rem] sm:text-[1.25rem] md:text-[1.38rem] font-bold gold-foil-text uppercase leading-tight mt-0.5 mb-1.5">
            {config.sections.timeline.eyebrow}
          </h3>
          {config.sections.itinerary.description && (
            <p className="wedding-type-body font-serif mx-auto max-w-2xl text-center text-ink/62">
              {config.sections.itinerary.description}
            </p>
          )}
        </div>

        <div className="timeline-garden-path-scene">
          <video
            className="timeline-garden-path-video"
            playsInline
            muted
            loop
            autoPlay
            src="/assets/timeline-garden-path.mp4"
            poster="/assets/timeline-garden-path-desktop.webp"
            style={{ objectFit: "contain" }}
          />
          <img
            className="timeline-garden-path-image"
            src="/assets/timeline-garden-path-desktop.webp"
            alt="Winding road"
            style={{ objectFit: "contain" }}
          />

          <ol className="timeline-garden-list">
            {nodes.map((node, index) => {
              const isRight = index % 2 === 0;
              return (
                <motion.li
                  key={`${node.time}-${node.title}`}
                  initial={{ opacity: 0, x: isRight ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                  className="timeline-garden-node"
                  style={
                    {
                      "--node-y": node.y,
                      "--node-rot": node.rotate,
                      "--node-width": node.width,
                    } as CSSProperties
                  }
                >
                  <div className="timeline-garden-card">
                    <div className="timeline-garden-text">
                      <p className="timeline-garden-time">{node.time}</p>
                      <h3 className="font-serif font-semibold text-[#2f3532] leading-snug">{node.title}</h3>
                    </div>
                    {getTimelineIconPath(node.title) && (
                      <img
                        src={getTimelineIconPath(node.title) || ""}
                        alt={node.title}
                        className="timeline-garden-icon"
                      />
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
