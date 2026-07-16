"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";

type TimelineNode = {
  time: string;
  title: string;
  x: string;
  y: string;
  rotate: string;
  width: string;
};

const desktopTimelineNodes: Array<Pick<TimelineNode, "x" | "y" | "rotate" | "width">> = [
  { x: "35%", y: "7.5%", rotate: "-1.2deg", width: "14.5rem" },
  { x: "65%", y: "22.5%", rotate: "1deg", width: "14.5rem" },
  { x: "32%", y: "40%", rotate: "-1deg", width: "14.5rem" },
  { x: "68%", y: "57%", rotate: "1.1deg", width: "14.5rem" },
  { x: "34%", y: "74.5%", rotate: "-0.9deg", width: "14.5rem" },
  { x: "54%", y: "91%", rotate: "1deg", width: "14.5rem" },
];

function buildTimelineNode(item: WeddingConfig["timeline"][number], index: number): TimelineNode {
  const fallback = desktopTimelineNodes[index % desktopTimelineNodes.length];
  return {
    time: item.time,
    title: item.title,
    x: fallback.x,
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
    <section id="timeline" className="hidden md:block timeline-garden-section cinematic-stage relative overflow-hidden px-5 pt-14 pb-24 text-ink sm:px-8 lg:pt-16 lg:pb-32">
      <SectionMediaLayers config={config} section="timeline" className="timeline-garden-media opacity-[0.08]" />
      <div aria-hidden="true" className="paper-grain-luxury timeline-garden-grain opacity-15" />

      <div className="timeline-garden-shell mx-auto max-w-7xl">
        <div
          className="timeline-garden-intro grid justify-items-center gap-5 text-center"
        >
          <h3 className="font-serif text-[1.12rem] sm:text-[1.25rem] md:text-[1.38rem] font-bold gold-foil-text uppercase leading-tight mt-0.5 mb-1.5">
            {config.sections.timeline.eyebrow}
          </h3>
          {config.sections.itinerary.description && (
            <p className="wedding-type-body font-serif mx-auto max-w-2xl text-center text-ink/62">
              {config.sections.itinerary.description}
            </p>
          )}
        </div>

        <div className="timeline-garden-path-scene relative">
          {/* Winding road */}
          <div
            className="timeline-garden-path-image opacity-[0.58]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ backgroundImage: "url('/assets/timeline-garden-path-desktop.webp')", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "100% 100%" }}
            />
          </div>
          <ol className="timeline-garden-list relative z-10">

            {nodes.map((node) => (
              <motion.li
                key={`${node.time}-${node.title}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className="timeline-garden-node"
                style={
                  {
                    "--node-x": node.x,
                    "--node-y": node.y,
                    "--node-rot": node.rotate,
                    "--node-width": node.width,
                  } as CSSProperties
                }
              >
                <div className="timeline-garden-card !flex !flex-row !items-center !justify-center !px-3 !py-2.5 !w-full">
                  <div className="flex flex-row items-center justify-center gap-3">
                    <div className="flex flex-col items-center justify-center text-center">
                      <p className="timeline-garden-time !text-[1.4rem] sm:!text-[1.65rem] !m-0 !text-center leading-none w-full">{node.time}</p>
                      <h3 className="font-serif !text-[0.95rem] sm:!text-[1.02rem] !m-0 !text-center leading-tight mt-0.5 w-full">{node.title}</h3>
                    </div>
                    {getTimelineIconPath(node.title) && (
                      <img
                        src={getTimelineIconPath(node.title) || ""}
                        alt={node.title}
                        className="w-9 h-9 md:w-10 md:h-10 object-contain flex-shrink-0"
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
