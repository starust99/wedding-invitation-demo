"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { CanvasVideo } from "../CanvasVideo";
import { FirefliesOverlay } from "./FirefliesOverlay";
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

  const dateMatch = dateLabel.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!dateMatch) return dateLabel.trim();

  return `Ngày ${dateMatch[1]} tháng ${dateMatch[2]} năm ${dateMatch[3]}`;
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

  if (dateText && timeText) {
    return (
      <>
        {timeText}, Thứ 7
        <br />
        {dateText}
        <br />
        <span style={{ fontSize: '0.9em', fontStyle: 'italic', opacity: 0.85 }}>
          (nhằm ngày 18 tháng 11 năm Bính Ngọ)
        </span>
      </>
    );
  }
  return dateText || timeText || fallback;
}

function formatChurchSchedule(dateLabel?: string, timeLabel?: string) {
  const dateText = formatDateLabel(dateLabel);
  const timeText = formatWelcomeTime(timeLabel);

  let dayOfWeek = "Thứ 7";
  if (dateLabel && dateLabel.includes(",")) {
    const parts = dateLabel.split(",");
    if (parts.length > 1) {
      dayOfWeek = parts[1].trim();
      dayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    }
  }

  if (dateText && timeText) {
    return (
      <>
        {timeText}, {dayOfWeek},
        <br />
        {dateText.toLowerCase()}
        <br />
        <span style={{ fontSize: '0.9em', fontStyle: 'italic', opacity: 0.85 }}>
          (nhằm ngày 12 tháng 11 năm Bính Ngọ)
        </span>
      </>
    );
  }
  return dateLabel && timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel || timeLabel || "";
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

const familyPanelVariant: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const familyItemVariant: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlay = () => {
    setIsPlaying((prev) => !prev);
    if (!hasPlayed) setHasPlayed(true);
  };

  return (
    <motion.div 
      className="details-map-canvas group" 
      aria-hidden="true" 
      onClick={handlePlay} 
      style={{ cursor: 'pointer' }}
      animate={!isPlaying && !hasPlayed ? { y: [0, -6, 0] } : { y: 0 }}
      transition={!isPlaying && !hasPlayed ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } : { duration: 0.3 }}
    >
      {/* 1. Base Video Layer */}
      <CanvasVideo
        src="/assets/venue-map-video.mp4"
        isPlaying={isPlaying}
        onEnded={() => {
          setIsPlaying(false);
          setHasPlayed(true);
        }}
        className="details-map-image absolute inset-0 z-0 w-full h-full transition-transform duration-700 group-hover:scale-105 pointer-events-none"
      />

      {/* 1.5 Fireflies Overlay (Active when paused/ended and has played) */}
      <FirefliesOverlay active={!isPlaying && hasPlayed} />

      {/* 2. Custom Poster Overlay (Fades out smoothly) */}
      <div
        className={`absolute inset-0 z-[5] pointer-events-none transition-opacity duration-1000 ease-out ${hasPlayed ? 'opacity-0' : 'opacity-100'}`}
      >
        <Image
          src="/assets/venue-map-poster.png"
          alt="Bản đồ Terracotta"
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 62vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* 3. Hint Button Overlay */}
      {!isPlaying && !hasPlayed && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center z-10 transition-opacity duration-500 pointer-events-none group-hover:opacity-100 opacity-90">
          <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md text-[#3f4642] font-medium text-[0.85rem] tracking-wide animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span className="italic font-serif">Chạm để xem không gian</span>
          </div>
        </div>
      )}
    </motion.div>
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
        className="mb-8 md:mb-12 w-full max-w-4xl mx-auto details-glass-panel px-2 py-6 sm:px-6 sm:py-8 md:px-12 md:py-10 text-center flex flex-col relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={familyPanelVariant}
      >

          <motion.p variants={familyItemVariant} className="font-serif italic text-[#3f4642]/80 text-[0.95rem] sm:text-[1.1rem] md:text-[1.25rem] mb-6 sm:mb-8 tracking-wide px-4">
            Cùng với niềm hân hoan của hai bên gia đình:
          </motion.p>

          <div className="relative w-full">
            {/* Vertical Divider */}
            <motion.div variants={familyItemVariant} className="hidden sm:block absolute left-1/2 top-8 bottom-8 md:top-10 md:bottom-10 w-px bg-gradient-to-b from-transparent via-[#3f4642]/20 to-transparent -translate-x-1/2"></motion.div>

            <div className="grid grid-cols-2 gap-x-2 sm:gap-x-8 md:gap-x-16 items-start w-full">
              {/* Header Row */}
              <motion.div variants={familyItemVariant} className="flex flex-col items-center pb-5 sm:pb-8 md:pb-12">
                <h3 className="font-serif text-[1.1rem] sm:text-[1.35rem] md:text-[1.5rem] font-medium text-[#3f4642] tracking-widest uppercase opacity-90" style={{ letterSpacing: '0.15em' }}>Nhà Trai</h3>
              </motion.div>
              <motion.div variants={familyItemVariant} className="flex flex-col items-center pb-5 sm:pb-8 md:pb-12">
                <h3 className="font-serif text-[1.1rem] sm:text-[1.35rem] md:text-[1.5rem] font-medium text-[#3f4642] tracking-widest uppercase opacity-90" style={{ letterSpacing: '0.15em' }}>Nhà Gái</h3>
              </motion.div>

              {/* Fathers Row */}
              <motion.div variants={familyItemVariant} className="text-center text-[0.8rem] sm:text-[0.95rem] md:text-[1.05rem] text-[#3f4642]/80 leading-relaxed px-1">
                <p>Ông <span className="font-medium text-[#3f4642]">Trần Trọng Sơn</span></p>
              </motion.div>
              <motion.div variants={familyItemVariant} className="text-center text-[0.8rem] sm:text-[0.95rem] md:text-[1.05rem] text-[#3f4642]/80 leading-relaxed px-1">
                <p>Ông <span className="font-medium text-[#3f4642]">Felicite Nguyễn Đức Tài</span></p>
              </motion.div>

              {/* Mothers Row */}
              <motion.div variants={familyItemVariant} className="text-center text-[0.8rem] sm:text-[0.95rem] md:text-[1.05rem] text-[#3f4642]/80 leading-relaxed px-1 mt-1.5 sm:mt-2">
                <p>Bà <span className="font-medium text-[#3f4642]">Nguyễn Thị Minh Duyên</span></p>
              </motion.div>
              <motion.div variants={familyItemVariant} className="text-center text-[0.8rem] sm:text-[0.95rem] md:text-[1.05rem] text-[#3f4642]/80 leading-relaxed px-1 mt-1.5 sm:mt-2">
                <p>Bà <span className="font-medium text-[#3f4642]">Teresa Phan Thị Thu Hiền</span></p>
              </motion.div>

              {/* Children Row */}
              <motion.div variants={familyItemVariant} className="flex flex-col items-center mt-6 sm:mt-8 w-full h-full">
                <div className="pt-3 sm:pt-4 border-t border-[#3f4642]/15 w-[90%] sm:w-[85%] flex flex-col items-center h-full">
                  <p className="text-[0.65rem] sm:text-[0.85rem] md:text-[0.9rem] italic text-[#3f4642]/70 mb-1 sm:mb-2 uppercase tracking-widest text-center">Trưởng nam</p>
                  <p className="font-serif text-[1.05rem] sm:text-[1.25rem] md:text-[1.4rem] font-medium text-[#3f4642] leading-snug text-center">
                    Augustino<br/>Trần Long Nhật
                  </p>
                </div>
              </motion.div>
              <motion.div variants={familyItemVariant} className="flex flex-col items-center mt-6 sm:mt-8 w-full h-full">
                <div className="pt-3 sm:pt-4 border-t border-[#3f4642]/15 w-[90%] sm:w-[85%] flex flex-col items-center h-full">
                  <p className="text-[0.65rem] sm:text-[0.85rem] md:text-[0.9rem] italic text-[#3f4642]/70 mb-1 sm:mb-2 uppercase tracking-widest text-center">Trưởng nữ</p>
                  <p className="font-serif text-[1.05rem] sm:text-[1.25rem] md:text-[1.4rem] font-medium text-[#3f4642] leading-snug text-center">
                    Teresa<br/>Nguyễn Anh Phương
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
      </motion.div>

      <motion.div
        className="details-venue-board"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <GlassPanel area="church-card" variants={cardVariant} className="flex flex-col justify-start">
          <div className="mb-5 mt-2 px-2 text-center lg:mt-3">
            <h3 className="font-serif text-[#3f4642] text-[1.35rem] sm:text-[1.5rem] font-semibold tracking-wide">
              Thánh lễ Hôn phối
            </h3>
            <p className="text-[0.7rem] uppercase tracking-widest text-[#3f4642]/80 font-medium mt-1">được cử hành tại</p>
          </div>
          {content.churchImageUrl ? (
            <div className="details-map-canvas group overflow-hidden rounded-[1.2rem]">
              <Image
                src={content.churchImageUrl}
                alt={content.churchLocation || "Nhà thờ"}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 32vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="details-map-canvas group overflow-hidden rounded-[1.2rem] bg-[#3f4642]/5 flex items-center justify-center">
              <span className="font-serif italic text-[#3f4642]/40">Ảnh Thánh lễ</span>
            </div>
          )}
          <div className="details-map-caption">
            <h3 suppressHydrationWarning className="details-map-title">
              {content.churchLocation}
            </h3>
            <p suppressHydrationWarning className="details-map-schedule">{formatChurchSchedule(content.churchDate, content.churchTime)}</p>
            <a href="https://www.google.com/maps/place/Nh%C3%A0+Th%E1%BB%9D+Gi%C3%A1o+X%E1%BB%A9+Tam+H%E1%BA%A3i/@10.8715759,106.7403534,760m/data=!3m2!1e3!4b1!4m6!3m5!1s0x317527f5b6727625:0x87d79427b7dfd720!8m2!3d10.8715706!4d106.7429283!16s%2Fg%2F1tdx1ml5?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer" className="inline-flex h-[3.5rem] mt-2 items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn">
              <span className="save-date-btn-label">
                <MapPin aria-hidden="true" size={18} />
                <span>Chỉ đường</span>
              </span>
            </a>
          </div>
        </GlassPanel>

        <GlassPanel area="banquet-group" variants={cardVariant} className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] divide-y lg:divide-y-0 lg:divide-x divide-white/40">
          <div className="details-map-card flex flex-col justify-start">
            <div className="mb-5 mt-2 px-2 text-center lg:mt-3">
              <h3 className="font-serif text-[#3f4642] text-[1.35rem] sm:text-[1.5rem] font-semibold tracking-wide">
                Tiệc cưới thân mật
              </h3>
              <p className="text-[0.7rem] uppercase tracking-widest text-[#3f4642]/80 font-medium mt-1">được tổ chức tại</p>
            </div>
          <VenueMapImage />
          <div className="details-map-caption">
            <h3 suppressHydrationWarning className="details-map-title">
              {[venueName, venueArea].filter(Boolean).join("\n")}
            </h3>
            {venueLocation ? <p suppressHydrationWarning className="details-map-schedule">{venueLocation}</p> : null}
            {content.mapText ? <p suppressHydrationWarning className="details-map-note">{content.mapText}</p> : null}
            {mapUrl ? (
              <a suppressHydrationWarning href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex h-[3.5rem] mt-2 items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn">
                <span className="save-date-btn-label">
                  <MapPin aria-hidden="true" size={18} />
                  <span>Chỉ đường</span>
                </span>
              </a>
            ) : null}
          </div>
          </div>

          <div className="details-dress-card justify-start">
            <div className="details-dress-head mb-5 mt-2 px-2 lg:mt-3">
              <h3 className="font-serif text-[#3f4642] text-[1.35rem] sm:text-[1.5rem] font-semibold tracking-wide m-0">{dressCodeTitle}</h3>
              <span className="text-[0.7rem] uppercase tracking-widest text-[#3f4642]/80 font-medium mt-1">Áp dụng cho Tiệc mừng</span>
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
          </div>
        </GlassPanel>


      </motion.div>
    </div>
  );
}
