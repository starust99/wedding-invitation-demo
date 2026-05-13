"use client";

import Image from "next/image";
import { Navigation } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { EventDetailsViewportMode, WeddingEventDetailsEditorConfig } from "@/lib/wedding/event-details-types";

type EventDetailsPublicData = {
  dateLabel?: string;
  welcomeTime?: string;
  venueName?: string;
  venueArea?: string;
  venueLocation?: string;
  venueAddress?: string;
  dressCodeTitle?: string;
  dressCodeNote?: string;
  dressCodeColors?: string[];
  dressCodeImageSrc?: string;
};

type EventDetailsContentProps = {
  config: WeddingEventDetailsEditorConfig;
  mode?: "preview" | "public";
  viewport?: EventDetailsViewportMode;
  mapUrl?: string;
  publicData?: EventDetailsPublicData;
};

function formatDateLabel(dateLabel?: string) {
  if (!dateLabel) return "";

  const dateMatch = dateLabel.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
  if (!dateMatch) return dateLabel.trim();

  return `${dateMatch[1]}, thứ 7`;
}

function formatWelcomeTime(timeLabel?: string) {
  if (!timeLabel) return "";

  const normalized = timeLabel.trim().replace(/\s+/g, " ");
  if (/^vào lúc/i.test(normalized)) return normalized;

  const timeMatch = normalized.match(/(\d{1,2}:\d{2})/);
  return timeMatch ? `Vào lúc ${timeMatch[1]}` : normalized;
}

function formatSchedule(dateLabel?: string, welcomeTime?: string, fallback = "") {
  const dateText = formatDateLabel(dateLabel);
  const timeText = formatWelcomeTime(welcomeTime);

  if (dateText && timeText) return `${dateText}. ${timeText}`;
  return dateText || timeText || fallback;
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const headerVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

function GlassPanel({ area, children, className = "", variants }: { area: string; children: ReactNode; className?: string; variants?: Variants }) {
  return (
    <motion.article 
      className={`details-glass-panel details-${area} ${className}`}
      variants={variants}
    >
      {children}
    </motion.article>
  );
}

function VenueMapImage() {
  return (
    <div className="details-map-canvas" aria-hidden="true">
      <Image
        src="/assets/terracotta-glass-map.jpg"
        alt=""
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 62vw"
        className="details-map-image"
      />
    </div>
  );
}

export function EventDetailsContent({
  config,
  mode = "public",
  viewport = "desktop",
  mapUrl,
  publicData,
}: EventDetailsContentProps) {
  const compact = mode === "preview";
  const mobilePreview = compact && viewport === "mobile";
  const content = config.content;
  const venueName = publicData?.venueName || content.receptionLocation;
  const venueArea = publicData?.venueArea || content.receptionTime;
  const venueLocation = publicData?.venueLocation || formatSchedule(publicData?.dateLabel || content.ceremonyTime, publicData?.welcomeTime || content.ceremonyLocation, content.mapText);
  const dressCodeTitle = publicData?.dressCodeTitle || content.dressCodeLabel;
  const dressCodeNote = publicData?.dressCodeNote || content.dressCodeText;
  const dressCodeImageSrc = publicData?.dressCodeImageSrc || "/assets/dresscode-theme.jpg";

  return (
    <div
      className={[
        "details-venue-layout",
        compact ? "details-venue-layout-preview" : "",
        mobilePreview ? "details-venue-layout-mobile-preview" : "",
      ].join(" ")}
      >
      <motion.header 
        className="details-venue-header"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={headerVariant}
      >
        <p className="section-kicker-dark wedding-type-kicker">{content.eyebrow}</p>
        {content.title ? <h2>{content.title}</h2> : null}
        <p>{content.intro}</p>
      </motion.header>

      <motion.div 
        className="details-venue-board"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <GlassPanel area="map-card" variants={cardVariant}>
          <VenueMapImage />
          <div className="details-map-caption">
            <h3 suppressHydrationWarning className="details-map-title">
              {[venueName, venueArea].filter(Boolean).join("\n")}
            </h3>
            {venueLocation ? <p suppressHydrationWarning className="details-map-schedule">{venueLocation}</p> : null}
            {content.mapText ? <p suppressHydrationWarning className="details-map-note">{content.mapText}</p> : null}
            {mapUrl ? (
              <a suppressHydrationWarning href={mapUrl} target="_blank" rel="noreferrer" className="details-map-link save-date-watercolor-btn">
                <img src="/assets/wedding/ui/btn-directions.png" alt="" className="save-date-btn-bg" />
                <span className="save-date-btn-label">
                  <Navigation aria-hidden="true" size={16} />
                  <span>Chỉ đường</span>
                </span>
              </a>
            ) : null}
          </div>
        </GlassPanel>

        <GlassPanel area="dress-card" variants={cardVariant}>
          <div className="details-dress-head">
            <h3>{dressCodeTitle}</h3>
          </div>
          <p className="details-panel-copy">{dressCodeNote}</p>
          <div className="details-dress-image-frame">
            <Image
              src={dressCodeImageSrc}
              alt="Gợi ý trang phục chủ đề với bảng màu pastel cho khách mời"
              fill
              sizes="(max-width: 767px) 78vw, (max-width: 1023px) 24rem, 23rem"
              className="details-dress-image"
            />
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
