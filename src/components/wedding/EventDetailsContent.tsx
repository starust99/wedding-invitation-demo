"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { EventDetailsViewportMode, WeddingEventDetailsEditorConfig } from "@/lib/wedding/event-details-types";
import { DressCodeSection, type DressColorId } from "./DressCodeSection";

type EventDetailsTimelineItem = {
  time: string;
  title: string;
  description?: string;
};

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
  timeline?: EventDetailsTimelineItem[];
};

type EventDetailsContentProps = {
  config: WeddingEventDetailsEditorConfig;
  mode?: "preview" | "public";
  viewport?: EventDetailsViewportMode;
  mapUrl?: string;
  publicData?: EventDetailsPublicData;
};

const defaultTimelineFallback: EventDetailsTimelineItem[] = [
  { time: "17:30", title: "Đón khách", description: "Gia đình đón khách, chụp ảnh lưu niệm và mời khách ổn định chỗ ngồi." },
  { time: "19:00", title: "Khai mạc", description: "Bắt đầu buổi tiệc tối ấm cúng." },
  { time: "19:10", title: "Nghi lễ", description: "Các nghi thức cưới chính thức của Nhật & Phương." },
  { time: "19:20", title: "Nâng ly khai tiệc", description: "Cùng nâng ly và dùng bữa tối ấm cúng." },
  { time: "20:00", title: "Giao lưu", description: "Âm nhạc, trò chuyện và những khoảnh khắc thân tình." },
  { time: "20:50", title: "Chụp ảnh kỷ niệm", description: "Chụp hình lưu niệm cùng cô dâu chú rể." },
];

const defaultColorsFallback = ["#F5C7C7", "#BCD4DE", "#FDF6D6", "#C2D3C2", "#FAF5EB", "#E5D3C0", "#8C7A6B"];

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

function parseChurchDate(churchDate?: string) {
  if (!churchDate) {
    return { day: "20", month: "12", year: "2026", weekday: "CHÚA NHẬT" };
  }

  const dateMatch = churchDate.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  const weekdayMatch = churchDate.match(/(Chúa Nhật|Thứ Hai|Thứ Ba|Thứ Tư|Thứ Năm|Thứ Sáu|Thứ Bảy)/i);

  const day = dateMatch ? dateMatch[1] : "20";
  const month = dateMatch ? dateMatch[2] : "12";
  const year = dateMatch ? dateMatch[3] : "2026";
  const weekday = weekdayMatch ? weekdayMatch[0].toUpperCase() : "CHÚA NHẬT";

  return { day, month, year, weekday };
}

function DateDisplayStack({ dateParsed, lunarText }: { dateParsed: { day: string; month: string; year: string; weekday: string }; lunarText: string }) {
  return (
    <div className="flex flex-col items-center w-full max-w-[25rem] sm:max-w-[30.75rem] md:max-w-[38.13rem] mx-auto mb-4 relative select-none">
      {/* Symmetrical Flex Layout with Symmetrical Frames */}
      <div className="w-full h-[5.2rem] sm:h-[6.4rem] md:h-[7.38rem] flex items-center justify-center text-[#3f4642]">
        {/* Left Column Frame: Weekday */}
        <div className="flex-1 max-w-[6.5rem] sm:max-w-[9.84rem] md:max-w-[13.04rem] h-[3.2rem] sm:h-[3.94rem] md:h-[4.67rem] border-t border-b border-[#b4975a]/30 flex items-center justify-center text-center relative select-none">
          {/* Top-Left Corner Star */}
          <svg viewBox="0 0 24 24" className="absolute -top-[3.5px] -left-[3.5px] w-1.5 h-1.5 fill-[#b4975a]">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>
          {/* Bottom-Left Corner Star */}
          <svg viewBox="0 0 24 24" className="absolute -bottom-[3.5px] -left-[3.5px] w-1.5 h-1.5 fill-[#b4975a]">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>
          
          <div className="font-sans text-[0.68rem] sm:text-[0.93rem] md:text-[1.11rem] tracking-[0.12em] font-bold text-[#7d7065] uppercase whitespace-nowrap px-1">
            {dateParsed.weekday}
          </div>
        </div>

        {/* Middle Column: Day & Vertical Dividers */}
        <div className="flex items-center mx-2 sm:mx-3 md:mx-4 select-none">
          {/* Vertical Divider 1 */}
          <div className="flex flex-col items-center justify-between h-[4.5rem] sm:h-[5.54rem] md:h-[7.38rem] py-1.5">
            <div className="w-[0.5px] flex-grow bg-[#b4975a]/35" />
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 my-1 fill-[#b4975a]">
              <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
            </svg>
            <div className="w-[0.5px] flex-grow bg-[#b4975a]/35" />
          </div>

          {/* Middle Column: Day */}
          {dateParsed.day.trim().length === 2 ? (
            <div className="flex items-center justify-center font-serif text-[4.2rem] sm:text-[6.77rem] md:text-[7.63rem] font-light leading-none text-[#b4975a] select-none translate-y-[-0.03em] mx-1 sm:mx-2 md:mx-3">
              <span className="w-[1.9rem] sm:w-[3.08rem] md:w-[3.57rem] text-right">{dateParsed.day.trim()[0]}</span>
              <span className="w-[1.9rem] sm:w-[3.08rem] md:w-[3.57rem] text-left">{dateParsed.day.trim()[1]}</span>
            </div>
          ) : (
            <div className="font-serif text-[4.2rem] sm:text-[6.77rem] md:text-[7.63rem] font-light leading-none text-[#b4975a] text-center translate-y-[-0.03em] min-w-[3.8rem] sm:min-w-[6.15rem] md:min-w-[7.13rem] mx-1 sm:mx-2 md:mx-3">
              {dateParsed.day}
            </div>
          )}

          {/* Vertical Divider 2 */}
          <div className="flex flex-col items-center justify-between h-[4.5rem] sm:h-[5.54rem] md:h-[7.38rem] py-1.5">
            <div className="w-[0.5px] flex-grow bg-[#b4975a]/35" />
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 my-1 fill-[#b4975a]">
              <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
            </svg>
            <div className="w-[0.5px] flex-grow bg-[#b4975a]/35" />
          </div>
        </div>

        {/* Right Column Frame: Month & Year */}
        <div className="flex-1 max-w-[6.5rem] sm:max-w-[9.84rem] md:max-w-[13.04rem] h-[3.2rem] sm:h-[3.94rem] md:h-[4.67rem] border-t border-b border-[#b4975a]/30 flex items-center justify-center text-center relative select-none">
          {/* Top-Right Corner Star */}
          <svg viewBox="0 0 24 24" className="absolute -top-[3.5px] -right-[3.5px] w-1.5 h-1.5 fill-[#b4975a]">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>
          {/* Bottom-Right Corner Star */}
          <svg viewBox="0 0 24 24" className="absolute -bottom-[3.5px] -right-[3.5px] w-1.5 h-1.5 fill-[#b4975a]">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>

          <div className="font-sans text-[0.62rem] sm:text-[0.93rem] md:text-[1.11rem] tracking-[0.06em] font-bold text-[#7d7065] uppercase whitespace-nowrap px-1">
            THÁNG {dateParsed.month} • {dateParsed.year}
          </div>
        </div>
      </div>

      {/* Lunar Calendar Date */}
      <div className="font-serif text-[#7d7065] text-[1.18rem] sm:text-[1.45rem] md:text-[1.66rem] italic tracking-wide mt-2 select-none">
        {lunarText}
      </div>
    </div>
  );
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
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const familyItemVariant: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
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

function VenueMapImage({ className = "" }: { className?: string }) {
  return (
    <div className={`watercolor-blend-container details-map-canvas group ${className}`} aria-hidden="true">
      <Image
        src="/assets/venue-map-poster.webp"
        alt="Bản đồ Terracotta"
        fill
        unoptimized
        className="object-cover"
        priority
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
  const [selectedColorId, setSelectedColorId] = useState<DressColorId | null>(null);
  const ringsVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ringsVideoRef.current;
    if (!video) return;

    // Synchronously enforce autoplay attributes for Mobile WebKit / Safari
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const safePlay = () => {
      if (video && video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Silently swallow browser autoplay/power-saver rejections
          });
        }
      }
    };

    // 1. Play immediately if video buffer is already ready
    if (video.readyState >= 2) {
      safePlay();
    }

    // 2. Listen to native media load events
    const handleCanPlay = () => safePlay();

    // 3. Tab visibility / Page show handler (app switcher / wake up)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        safePlay();
      }
    };

    // 4. Touch / scroll fallback (guarantees playback on first user gesture)
    const handleUserGesture = () => {
      safePlay();
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleCanPlay);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handleVisibilityChange);
    window.addEventListener("touchstart", handleUserGesture, { passive: true, once: true });
    window.addEventListener("scroll", handleUserGesture, { passive: true, once: true });

    // Initial rAF trigger for smooth mounting
    const rafId = requestAnimationFrame(() => {
      safePlay();
    });

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleCanPlay);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handleVisibilityChange);
      window.removeEventListener("touchstart", handleUserGesture);
      window.removeEventListener("scroll", handleUserGesture);
    };
  }, []);
  const content = config.content;
  const churchDateParsed = parseChurchDate(content.churchDate);
  const banquetDateParsed = {
    day: "26",
    month: "12",
    year: "2026",
    weekday: "THỨ BẢY",
  };
  const venueName = publicData?.venueName || content.receptionLocation;
  const venueArea = publicData?.venueArea || content.receptionTime;
  const venueLocation = publicData?.venueLocation || formatSchedule(publicData?.dateLabel || content.ceremonyTime, publicData?.welcomeTime || content.ceremonyLocation, content.mapText);
  const dressCodeTitle = publicData?.dressCodeTitle || content.dressCodeLabel;
  const dressCodeNote = publicData?.dressCodeNote || content.dressCodeText;
  const dressCodeImageSrc = publicData?.dressCodeImageSrc || "/assets/dresscode-theme-v4.jpg";

  return (
    <div
      className={[
        "details-venue-layout",
        compact ? "details-venue-layout-preview" : "",
        mobilePreview ? "details-venue-layout-mobile-preview" : "",
      ].join(" ")}
      >
      {((content.eyebrow && content.eyebrow !== "Lễ Thành Hôn" && content.eyebrow !== "Lễ Thánh Hôn" && content.eyebrow !== "Thông tin và địa điểm") || content.title || content.intro) ? (
        <motion.header 
          className="details-venue-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headerVariant}
        >
          {content.eyebrow && content.eyebrow !== "Lễ Thành Hôn" && content.eyebrow !== "Lễ Thánh Hôn" && content.eyebrow !== "Thông tin và địa điểm" && (
            <p className="section-kicker-dark wedding-type-kicker">{content.eyebrow}</p>
          )}
          {content.title ? <h2>{content.title}</h2> : null}
          {content.intro ? <p>{content.intro}</p> : null}
        </motion.header>
      ) : null}

      <motion.div 
        className="mb-8 md:mb-12 w-full max-w-4xl mx-auto luxury-wedding-stationery-card px-1.5 pt-10 pb-10 sm:px-10 sm:pt-14 sm:pb-14 md:px-12 md:pt-16 md:pb-16 text-center flex flex-col relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={familyPanelVariant}
      >
        {/* Subtle watercolor washes in corners */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-[#fadcd9]/25 to-transparent rounded-full blur-[40px] pointer-events-none z-0" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gradient-to-tl from-[#d4e4f7]/25 to-transparent rounded-full blur-[40px] pointer-events-none z-0" />

        {/* Corner Ornaments */}
        <img 
          src="/assets/corner_ornament.png" 
          alt="corner ornament" 
          className="absolute top-0 left-0 sm:top-6 sm:left-6 w-[92px] h-[92px] sm:w-28 sm:h-28 object-contain pointer-events-none select-none block z-20"
        />
        <img 
          src="/assets/corner_ornament.png" 
          alt="corner ornament" 
          className="absolute top-0 right-0 sm:top-6 sm:right-6 w-[92px] h-[92px] sm:w-28 sm:h-28 rotate-90 object-contain pointer-events-none select-none block z-20"
        />
        <img 
          src="/assets/corner_ornament.png" 
          alt="corner ornament" 
          className="absolute bottom-0 right-0 sm:bottom-6 sm:right-6 w-[92px] h-[92px] sm:w-28 sm:h-28 rotate-180 object-contain pointer-events-none select-none block z-20"
        />
        <img 
          src="/assets/corner_ornament.png" 
          alt="corner ornament" 
          className="absolute bottom-0 left-0 sm:bottom-6 sm:left-6 w-[92px] h-[92px] sm:w-28 sm:h-28 -rotate-90 object-contain pointer-events-none select-none block z-20"
        />

        {/* Tier 1: Title Header */}
        <motion.div variants={familyItemVariant} className="flex flex-col items-center mb-2 md:mb-3 w-full relative z-10">
          <h2 className="font-serif text-[1.2rem] sm:text-[1.35rem] font-bold text-[#3f4642] tracking-[0.25em] uppercase">
            Lễ Thành Hôn
          </h2>
          {/* Decorative Divider */}
          <div className="w-full flex justify-center mt-1.5 mb-0.5">
            <img 
              src="/assets/divider_title_marriage.png" 
              alt="decorative divider" 
              className="w-[43.7%] max-w-[11.3rem] h-auto opacity-95 select-none object-contain pointer-events-none"
            />
          </div>
        </motion.div>

        {/* Parents Info Block (Nhà Trai / Nhà Gái Side-by-Side) */}
        <div className="relative w-full flex flex-row justify-between items-stretch z-10 mt-4 sm:mt-5 mb-8 md:mb-10">
          {/* Left Column: Nhà Trai */}
          <motion.div variants={familyItemVariant} className="w-1/2 pr-1 sm:pr-4 flex flex-col items-center justify-start text-center">
            <h3 className="font-serif text-[1.02rem] sm:text-[1.08rem] md:text-[1.12rem] lg:text-[1.2rem] font-bold text-[#b4975a] tracking-[0.18em] uppercase">
              Nhà Trai
            </h3>
            
            <img 
              src="/assets/divider_family_title.png" 
              alt="decorative divider" 
              className="w-[7.65rem] sm:w-[9.35rem] md:w-[10.2rem] h-auto opacity-95 select-none object-contain pointer-events-none mt-0 mb-1"
            />

            <div className="flex flex-col gap-2.5 md:gap-3 text-[#3f4642]/90 font-serif text-[0.95rem] sm:text-[1rem] md:text-[1.05rem] lg:text-[1.12rem] w-full mt-1.5">
              <p className="leading-relaxed">
                <span className="text-[#7d7065] font-serif font-bold text-[0.82rem] max-[411px]:text-[0.79rem] max-[389px]:text-[0.73rem] max-[374px]:text-[0.69rem] sm:text-[0.89rem] md:text-[0.91rem] tracking-wider uppercase block mb-0.5 md:mb-1">Ông</span>
                <span className="font-semibold block text-[0.83rem] max-[411px]:text-[0.79rem] max-[389px]:text-[0.72rem] max-[374px]:text-[0.68rem] sm:text-[0.98rem] md:text-[1.04rem] lg:text-[1.12rem] tracking-[-0.015em] sm:tracking-normal whitespace-nowrap uppercase">TRẦN TRỌNG SƠN</span>
              </p>
              <p className="leading-relaxed">
                <span className="text-[#7d7065] font-serif font-bold text-[0.82rem] max-[411px]:text-[0.79rem] max-[389px]:text-[0.73rem] max-[374px]:text-[0.69rem] sm:text-[0.89rem] md:text-[0.91rem] tracking-wider uppercase block mb-0.5 md:mb-1">Bà</span>
                <span className="font-semibold block text-[0.83rem] max-[411px]:text-[0.79rem] max-[389px]:text-[0.72rem] max-[374px]:text-[0.68rem] sm:text-[0.98rem] md:text-[1.04rem] lg:text-[1.12rem] tracking-[-0.015em] sm:tracking-normal whitespace-nowrap uppercase">NGUYỄN THỊ MINH DUYÊN</span>
              </p>
            </div>
          </motion.div>

          {/* Central Vertical Divider (Absolute Centered Thin Line) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-2 w-[0.5px] bg-gradient-to-b from-transparent via-[#b4975a]/40 to-transparent select-none pointer-events-none z-20" />

          {/* Right Column: Nhà Gái */}
          <motion.div variants={familyItemVariant} className="w-1/2 pl-1 sm:pl-4 flex flex-col items-center justify-start text-center">
            <h3 className="font-serif text-[1.02rem] sm:text-[1.08rem] md:text-[1.12rem] lg:text-[1.2rem] font-bold text-[#b4975a] tracking-[0.18em] uppercase">
              Nhà Gái
            </h3>
            
            <img 
              src="/assets/divider_family_title.png" 
              alt="decorative divider" 
              className="w-[7.65rem] sm:w-[9.35rem] md:w-[10.2rem] h-auto opacity-95 select-none object-contain pointer-events-none mt-0 mb-1"
            />

            <div className="flex flex-col gap-2.5 md:gap-3 text-[#3f4642]/90 font-serif text-[0.95rem] sm:text-[1rem] md:text-[1.05rem] lg:text-[1.12rem] w-full mt-1.5">
              <p className="leading-relaxed">
                <span className="text-[#7d7065] font-serif font-bold text-[0.82rem] max-[411px]:text-[0.79rem] max-[389px]:text-[0.73rem] max-[374px]:text-[0.69rem] sm:text-[0.89rem] md:text-[0.91rem] tracking-wider uppercase block mb-0.5 md:mb-1">Ông Felicite</span>
                <span className="font-semibold block text-[0.83rem] max-[411px]:text-[0.79rem] max-[389px]:text-[0.72rem] max-[374px]:text-[0.68rem] sm:text-[0.98rem] md:text-[1.04rem] lg:text-[1.12rem] tracking-[-0.015em] sm:tracking-normal whitespace-nowrap uppercase">NGUYỄN ĐỨC TÀI</span>
              </p>
              <p className="leading-relaxed">
                <span className="text-[#7d7065] font-serif font-bold text-[0.82rem] max-[411px]:text-[0.79rem] max-[389px]:text-[0.73rem] max-[374px]:text-[0.69rem] sm:text-[0.89rem] md:text-[0.91rem] tracking-wider uppercase block mb-0.5 md:mb-1">Bà Teresa</span>
                <span className="font-semibold block text-[0.83rem] max-[411px]:text-[0.79rem] max-[389px]:text-[0.72rem] max-[374px]:text-[0.68rem] sm:text-[0.98rem] md:text-[1.04rem] lg:text-[1.12rem] tracking-[-0.015em] sm:tracking-normal whitespace-nowrap uppercase">PHAN THỊ THU HIỀN</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Greeting & Names Block */}
        <div className="relative w-full flex flex-col items-center z-10 mt-1 md:mt-2">
          <motion.div variants={familyItemVariant} className="w-full text-center">
            <p className="font-serif italic text-[#3f4642]/95 text-[1.06rem] [@media(min-width:375px)]:text-[1.13rem] [@media(min-width:390px)]:text-[1.18rem] [@media(min-width:412px)]:text-[1.25rem] sm:text-[1.57rem] md:text-[1.64rem] lg:text-[1.72rem] tracking-[-0.015em] sm:tracking-wide font-medium leading-relaxed whitespace-nowrap">
              Trân trọng báo tin hôn lễ của hai con chúng tôi:
            </p>
          </motion.div>

          <motion.div variants={familyItemVariant} className="w-full flex flex-col items-center justify-center mt-3 sm:mt-4 select-none">
            {/* Top Name (Augustino Trần Long Nhật) - Cropped from original image */}
            <div className="w-full max-w-[18.5rem] sm:max-w-[21rem] aspect-[929/250] overflow-hidden relative">
              <img 
                src="/assets/event-details-names-v4-blank.png" 
                alt="Augustino Trần Long Nhật" 
                className="absolute top-0 left-0 w-full h-auto names-image-color"
                draggable={false}
              />
            </div>
            
            {/* Video of wedding rings in the middle */}
            <div className="w-[7.2rem] h-[7.2rem] sm:w-[9.2rem] sm:h-[9.2rem] relative flex items-center justify-center overflow-visible select-none mt-[-2.2rem] mb-[-2.2rem] sm:mt-[-2.6rem] sm:mb-[-2.6rem] pointer-events-none z-10">
              <video
                ref={ringsVideoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-contain rings-video-optimize"
              >
                {/* Safari/iOS: HEVC with Alpha */}
                <source src="/assets/wedding-rings.mov?v=8" type="video/quicktime; codecs=hvc1" />
                {/* Chrome/Android/Firefox: VP9 with Alpha */}
                <source src="/assets/wedding-rings.webm?v=8" type="video/webm; codecs=vp9" />
              </video>
            </div>

            {/* Bottom Name (Teresa Nguyễn Anh Phương) - Cropped from original image */}
            <div className="w-full max-w-[18.5rem] sm:max-w-[21rem] aspect-[929/250] overflow-hidden relative">
              <img 
                src="/assets/event-details-names-v4-blank.png" 
                alt="Teresa Nguyễn Anh Phương" 
                className="absolute bottom-0 left-0 w-full h-auto names-image-color"
                draggable={false}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Unified Vertical Scrolling Layout for Mobile, Tablet, and Desktop */}
      <motion.div
        className="flex flex-col gap-6 md:gap-8 w-full max-w-4xl mx-auto relative z-10 px-1 md:px-0"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
        variants={staggerContainer}
      >
        {/* Card 1: Thánh lễ Hôn phối */}
        <motion.div 
          variants={cardVariant}
          className="w-full luxury-wedding-stationery-card px-6 pt-10 pb-10 sm:px-10 sm:pt-14 sm:pb-14 md:px-12 md:pt-16 md:pb-16 flex flex-col items-center text-center relative"
        >

          {/* Main Title */}
          <h4 className="font-serif text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[0.14em] md:tracking-[0.18em] uppercase text-[#3f4642] mt-1 mb-1.5 leading-tight">
            Thánh lễ hôn phối
          </h4>

          {/* Decorative Divider */}
          <div className="w-full flex justify-center mt-1 mb-5">
            <img 
              src="/assets/divider_cards.png" 
              alt="decorative divider" 
              className="w-[90%] sm:w-[95%] max-w-[33.7rem] h-auto opacity-95 select-none object-contain pointer-events-none"
              style={{ filter: "brightness(0.85) saturate(1.3) contrast(1.05)" }}
            />
          </div>

          {/* Church Image */}
          <div className="watercolor-blend-container relative w-full max-w-[38rem] mx-auto aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-[0_4px_14px_rgba(63,70,66,0.05)] border border-[#b4975a]/12 mb-6">
            {content.churchImageUrl ? (
              <Image
                src={content.churchImageUrl}
                alt={content.churchLocation || "Nhà thờ"}
                fill
                sizes="(max-width: 767px) 90vw"
                className="object-cover church-image-illustration"
                unoptimized
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/40">
                <span className="font-serif italic text-xs text-[#3f4642]/40">Ảnh</span>
              </div>
            )}
          </div>

          <DateDisplayStack dateParsed={churchDateParsed} lunarText="Nhằm ngày 12 tháng 11 năm Bính Ngọ" />

          {/* Time Display */}
          <span className="font-sans text-[0.82rem] sm:text-[1.01rem] md:text-[1.08rem] tracking-[0.18em] font-bold text-[#7d7065] uppercase mb-1">
            Cử Hành
          </span>
          <div className="font-serif text-[2.35rem] sm:text-[2.89rem] md:text-[3.32rem] font-light text-[#3f4642] tracking-wider leading-none mb-3">
            {content.churchTime || "15:00"}
          </div>

          {/* Location */}
          <p className="font-serif text-[#3f4642] text-[1.2rem] sm:text-[1.48rem] md:text-[1.70rem] font-semibold leading-snug mb-0.5">
            {content.churchLocation || "Nhà Thờ Giáo Xứ Tam Hải"}
          </p>
          <p className="font-serif text-[#6e5949] text-[1.02rem] sm:text-[1.25rem] md:text-[1.41rem] italic leading-snug mb-5">
            180 Đ. Tam Châu, Tam Bình, Thủ Đức
          </p>

          {/* Map Pin link */}
          <a 
            href="https://www.google.com/maps/search/?api=1&query=Nh%C3%A0%20th%E1%BB%9D%20Gi%C3%A1o%20x%E1%BB%A9%20Tam%20H%E1%BA%A3i%20180%20Tam%20Ch%C3%A2u%20Tam%20B%C3%ACnh%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c" 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex h-[2.65rem] sm:h-[3.0rem] save-date-watercolor-btn mt-2 mx-auto min-w-[10.5rem] sm:min-w-[12rem]"
          >
            <span className="save-date-btn-label">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3f4642]" />
              <span>Chỉ đường</span>
            </span>
          </a>
        </motion.div>

        {/* Card 2: Tiệc Cưới Thân Mật (Unified Card) */}
        <motion.div 
          variants={cardVariant}
          className="w-full luxury-wedding-stationery-card px-6 pt-10 pb-10 sm:px-10 sm:pt-14 sm:pb-14 md:px-12 md:pt-16 md:pb-16 flex flex-col items-center text-center relative"
        >

          {/* Main Title */}
          <h4 className="font-serif text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[0.14em] md:tracking-[0.18em] uppercase text-[#3f4642] mt-1 mb-1.5 leading-tight">
            Tiệc cưới
          </h4>

          {/* Decorative Divider */}
          <div className="w-full flex justify-center mt-1 mb-5">
            <img 
              src="/assets/divider_cards.png" 
              alt="decorative divider" 
              className="w-[90%] sm:w-[95%] max-w-[33.7rem] h-auto opacity-95 select-none object-contain pointer-events-none"
              style={{ filter: "brightness(0.85) saturate(1.3) contrast(1.05)" }}
            />
          </div>

          {/* Venue Image */}
          <div className="relative w-full max-w-[38rem] mx-auto aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-[0_4px_14px_rgba(63,70,66,0.05)] border border-[#b4975a]/12 mb-6">
            <VenueMapImage className="w-full h-full !aspect-auto !rounded-none" />
          </div>

          <DateDisplayStack dateParsed={banquetDateParsed} lunarText="Nhằm ngày 18 tháng 11 năm Bính Ngọ" />

          {/* Time Display */}
          <span className="font-sans text-[0.82rem] sm:text-[1.01rem] md:text-[1.08rem] tracking-[0.18em] font-bold text-[#7d7065] uppercase mb-1">
            Đón Khách
          </span>
          <div className="font-serif text-[2.35rem] sm:text-[2.89rem] md:text-[3.32rem] font-light text-[#3f4642] tracking-wider leading-none mb-3">
            17:30
          </div>

          {/* Location */}
          <p className="font-serif text-[#3f4642] text-[1.2rem] sm:text-[1.48rem] md:text-[1.70rem] font-semibold leading-snug mb-0.5">
            Terracotta Hotel & Resort Đà Lạt
          </p>
          <p className="font-serif text-[#6e5949] text-[1.02rem] sm:text-[1.25rem] md:text-[1.41rem] italic leading-snug mb-5">
            Quảng trường Terrace Montagne
          </p>

          {/* Map Link */}
          {mapUrl ? (
            <a 
              href={mapUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex h-[2.65rem] sm:h-[3.0rem] save-date-watercolor-btn mt-2 mb-6 mx-auto min-w-[10.5rem] sm:min-w-[12rem]"
            >
              <span className="save-date-btn-label">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3f4642]" />
                <span>Chỉ đường</span>
              </span>
            </a>
          ) : null}

          {/* Divider */}
          <div className="w-full border-t border-[#b4975a]/15 my-0" />

          {/* Section 3: Dress Code */}
          <div className="py-6 w-full">
            <DressCodeSection
              title={dressCodeTitle}
              note={dressCodeNote}
              selectedColorId={selectedColorId}
              setSelectedColorId={setSelectedColorId}
            />
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
}
