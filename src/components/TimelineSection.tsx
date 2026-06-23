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
  { x: "29%", y: "7.5%", rotate: "-1.2deg", width: "17rem" },
  { x: "71%", y: "22.5%", rotate: "1deg", width: "17rem" },
  { x: "27%", y: "40%", rotate: "-1deg", width: "17rem" },
  { x: "69%", y: "57%", rotate: "1.1deg", width: "17rem" },
  { x: "31%", y: "74.5%", rotate: "-0.9deg", width: "17rem" },
  { x: "67%", y: "91%", rotate: "1deg", width: "17rem" },
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

export function TimelineSection({ config }: { config: WeddingConfig }) {
  const nodes = config.timeline.map(buildTimelineNode);

  return (
    <section id="timeline" className="hidden md:block timeline-garden-section cinematic-stage relative overflow-hidden px-5 py-24 text-ink sm:px-8 lg:py-32">
      <SectionMediaLayers config={config} section="timeline" className="timeline-garden-media opacity-[0.08]" />
      <div aria-hidden="true" className="paper-grain-luxury timeline-garden-grain opacity-15" />

      <div className="timeline-garden-shell mx-auto max-w-7xl">
        <div
          className="timeline-garden-intro grid justify-items-center gap-5 text-center"
        >
          <p className="section-kicker-dark wedding-type-kicker">{config.sections.timeline.eyebrow}</p>
          {config.sections.itinerary.description && (
            <p className="wedding-type-body mx-auto max-w-2xl text-center text-ink/62">
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
                initial={{ opacity: 0.3, scale: 0.9, y: 30, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: false, margin: "-15% 0px -15% 0px" }}
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
                <div className="timeline-garden-card">
                  <p className="timeline-garden-time">{node.time}</p>
                  <h3>{node.title}</h3>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
