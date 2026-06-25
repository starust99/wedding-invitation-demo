"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
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
  { time: "18:00", title: "Nghi thức", description: "Khoảnh khắc chính của buổi lễ, với sự chứng kiến của gia đình và khách quý." },
  { time: "18:30", title: "Nâng ly", description: "Cùng nâng ly chúc mừng ngày vui của cô dâu chú rể." },
  { time: "19:30", title: "Dùng tiệc", description: "Dùng bữa tối ấm cúng trong không gian ngoài trời của Terracotta." },
  { time: "20:00", title: "Giao lưu", description: "Âm nhạc, trò chuyện và những khoảnh khắc thân tình trong buổi tối." },
  { time: "21:00", title: "Lời cảm ơn & chụp hình", description: "Gia đình gửi lời cảm ơn và chụp ảnh cùng khách mời." },
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
    <div className="flex flex-col items-center w-full max-w-[25rem] md:max-w-[31rem] mx-auto mb-4 relative select-none">
      {/* Symmetrical Flex Layout with Symmetrical Frames */}
      <div className="w-full h-[5.2rem] md:h-[6rem] flex items-center justify-center text-[#3f4642]">
        {/* Left Column Frame: Weekday */}
        <div className="flex-1 max-w-[6.5rem] sm:max-w-[8rem] md:max-w-[10.6rem] h-[3.2rem] md:h-[3.8rem] border-t border-b border-[#b4975a]/30 flex items-center justify-center text-center relative select-none">
          {/* Top-Left Corner Star */}
          <svg viewBox="0 0 24 24" className="absolute -top-[3.5px] -left-[3.5px] w-1.5 h-1.5 fill-[#b4975a]">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>
          {/* Bottom-Left Corner Star */}
          <svg viewBox="0 0 24 24" className="absolute -bottom-[3.5px] -left-[3.5px] w-1.5 h-1.5 fill-[#b4975a]">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>
          
          <div className="font-sans text-[0.68rem] sm:text-[0.76rem] md:text-[0.9rem] tracking-[0.12em] font-bold text-[#7d7065] uppercase whitespace-nowrap px-1">
            {dateParsed.weekday}
          </div>
        </div>

        {/* Middle Column: Day & Vertical Dividers */}
        <div className="flex items-center mx-2 sm:mx-3 md:mx-4 select-none">
          {/* Vertical Divider 1 */}
          <div className="flex flex-col items-center justify-between h-[4.5rem] md:h-[6rem] py-1.5">
            <div className="w-[0.5px] flex-grow bg-[#b4975a]/35" />
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 my-1 fill-[#b4975a]">
              <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
            </svg>
            <div className="w-[0.5px] flex-grow bg-[#b4975a]/35" />
          </div>

          {/* Middle Column: Day */}
          {dateParsed.day.trim().length === 2 ? (
            <div className="flex items-center justify-center font-serif text-[4.2rem] sm:text-[5.5rem] md:text-[6.2rem] font-light leading-none text-[#b4975a] select-none translate-y-[-0.03em] mx-1 sm:mx-2 md:mx-3">
              <span className="w-[1.9rem] sm:w-[2.5rem] md:w-[2.9rem] text-right">{dateParsed.day.trim()[0]}</span>
              <span className="w-[1.9rem] sm:w-[2.5rem] md:w-[2.9rem] text-left">{dateParsed.day.trim()[1]}</span>
            </div>
          ) : (
            <div className="font-serif text-[4.2rem] sm:text-[5.5rem] md:text-[6.2rem] font-light leading-none text-[#b4975a] text-center translate-y-[-0.03em] min-w-[3.8rem] sm:min-w-[5rem] md:min-w-[5.8rem] mx-1 sm:mx-2 md:mx-3">
              {dateParsed.day}
            </div>
          )}

          {/* Vertical Divider 2 */}
          <div className="flex flex-col items-center justify-between h-[4.5rem] md:h-[6rem] py-1.5">
            <div className="w-[0.5px] flex-grow bg-[#b4975a]/35" />
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 my-1 fill-[#b4975a]">
              <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
            </svg>
            <div className="w-[0.5px] flex-grow bg-[#b4975a]/35" />
          </div>
        </div>

        {/* Right Column Frame: Month & Year */}
        <div className="flex-1 max-w-[6.5rem] sm:max-w-[8rem] md:max-w-[10.6rem] h-[3.2rem] md:h-[3.8rem] border-t border-b border-[#b4975a]/30 flex items-center justify-center text-center relative select-none">
          {/* Top-Right Corner Star */}
          <svg viewBox="0 0 24 24" className="absolute -top-[3.5px] -right-[3.5px] w-1.5 h-1.5 fill-[#b4975a]">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>
          {/* Bottom-Right Corner Star */}
          <svg viewBox="0 0 24 24" className="absolute -bottom-[3.5px] -right-[3.5px] w-1.5 h-1.5 fill-[#b4975a]">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>

          <div className="font-sans text-[0.62rem] sm:text-[0.76rem] md:text-[0.9rem] tracking-[0.06em] font-bold text-[#7d7065] uppercase whitespace-nowrap px-1">
            THÁNG {dateParsed.month} • {dateParsed.year}
          </div>
        </div>
      </div>

      {/* Lunar Calendar Date */}
      <div className="font-serif text-[#7d7065] text-[1.18rem] md:text-[1.35rem] italic tracking-wide mt-2 select-none">
        <span className="text-[#b4975a] mr-2">✦</span>
        {lunarText}
        <span className="text-[#b4975a] ml-2">✦</span>
      </div>
    </div>
  );
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
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
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
  hidden: { opacity: 0, y: 20, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
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
  const dressCodeImageSrc = publicData?.dressCodeImageSrc || "/assets/dresscode-theme-v2.jpg";

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
        className="mb-8 md:mb-12 w-full max-w-4xl mx-auto luxury-wedding-stationery-card px-3 pt-10 pb-10 sm:px-10 sm:pt-14 sm:pb-14 md:px-12 md:pt-16 md:pb-16 text-center flex flex-col relative"
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
                <span className="text-[#7d7065] font-serif font-bold text-[0.8rem] [@media(min-width:375px)]:text-[0.85rem] [@media(min-width:390px)]:text-[0.92rem] [@media(min-width:412px)]:text-[0.95rem] sm:text-[0.95rem] md:text-[0.98rem] tracking-wider uppercase block mb-0.5 md:mb-1">Ông</span>
                <span className="font-semibold block text-[0.88rem] [@media(min-width:375px)]:text-[0.94rem] [@media(min-width:390px)]:text-[1.02rem] [@media(min-width:412px)]:text-[1.08rem] sm:text-[1.15rem] md:text-[1.21rem] lg:text-[1.29rem] whitespace-nowrap">Trần Trọng Sơn</span>
              </p>
              <p className="leading-relaxed">
                <span className="text-[#7d7065] font-serif font-bold text-[0.8rem] [@media(min-width:375px)]:text-[0.85rem] [@media(min-width:390px)]:text-[0.92rem] [@media(min-width:412px)]:text-[0.95rem] sm:text-[0.95rem] md:text-[0.98rem] tracking-wider uppercase block mb-0.5 md:mb-1">Bà</span>
                <span className="font-semibold block text-[0.88rem] [@media(min-width:375px)]:text-[0.94rem] [@media(min-width:390px)]:text-[1.02rem] [@media(min-width:412px)]:text-[1.08rem] sm:text-[1.15rem] md:text-[1.21rem] lg:text-[1.29rem] whitespace-nowrap">Nguyễn Thị Minh Duyên</span>
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
                <span className="text-[#7d7065] font-serif font-bold text-[0.8rem] [@media(min-width:375px)]:text-[0.85rem] [@media(min-width:390px)]:text-[0.92rem] [@media(min-width:412px)]:text-[0.95rem] sm:text-[0.95rem] md:text-[0.98rem] tracking-wider uppercase block mb-0.5 md:mb-1">Ông Felicite</span>
                <span className="font-semibold block text-[0.88rem] [@media(min-width:375px)]:text-[0.94rem] [@media(min-width:390px)]:text-[1.02rem] [@media(min-width:412px)]:text-[1.08rem] sm:text-[1.15rem] md:text-[1.21rem] lg:text-[1.29rem] whitespace-nowrap">Nguyễn Đức Tài</span>
              </p>
              <p className="leading-relaxed">
                <span className="text-[#7d7065] font-serif font-bold text-[0.8rem] [@media(min-width:375px)]:text-[0.85rem] [@media(min-width:390px)]:text-[0.92rem] [@media(min-width:412px)]:text-[0.95rem] sm:text-[0.95rem] md:text-[0.98rem] tracking-wider uppercase block mb-0.5 md:mb-1">Bà Teresa</span>
                <span className="font-semibold block text-[0.88rem] [@media(min-width:375px)]:text-[0.94rem] [@media(min-width:390px)]:text-[1.02rem] [@media(min-width:412px)]:text-[1.08rem] sm:text-[1.15rem] md:text-[1.21rem] lg:text-[1.29rem] whitespace-nowrap">Phan Thị Thu Hiền</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Greeting & Names Block */}
        <div className="relative w-full flex flex-col items-center z-10 mt-1 md:mt-2">
          <motion.div variants={familyItemVariant} className="w-full text-center">
            <p className="font-serif italic text-[#3f4642]/95 text-[0.88rem] [@media(min-width:375px)]:text-[0.95rem] [@media(min-width:390px)]:text-[1.02rem] [@media(min-width:412px)]:text-[1.08rem] sm:text-[1.28rem] md:text-[1.33rem] lg:text-[1.4rem] tracking-tighter sm:tracking-wide font-medium leading-relaxed whitespace-nowrap">
              Trân trọng báo tin hôn lễ của hai con chúng tôi:
            </p>
          </motion.div>

          <motion.div variants={familyItemVariant} className="w-full flex flex-col items-center mt-4 sm:mt-5 select-none pointer-events-none">
            <img 
              src="/assets/event-details-names-v4.png" 
              alt="Augustino Trần Long Nhật & Teresa Nguyễn Anh Phương" 
              className="w-full max-w-[15.5rem] sm:max-w-[21rem] h-auto object-contain names-image-color"
              draggable={false}
            />
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
          <span className="font-sans text-[0.82rem] md:text-[0.88rem] tracking-[0.18em] font-bold text-[#7d7065] uppercase mb-1">
            Thánh Lễ
          </span>
          <div className="font-serif text-[2.35rem] md:text-[2.7rem] font-light text-[#3f4642] tracking-wider leading-none mb-3">
            {content.churchTime || "15:00"}
          </div>

          {/* Location */}
          <p className="font-serif text-[#3f4642] text-[1.2rem] md:text-[1.38rem] font-semibold leading-snug mb-0.5">
            {content.churchLocation || "Nhà Thờ Giáo Xứ Tam Hải"}
          </p>
          <p className="font-serif text-[#6e5949] text-[1.02rem] md:text-[1.15rem] italic leading-snug mb-5">
            180 Đ. Tam Châu, Tam Bình, Thủ Đức
          </p>

          {/* Map Pin link */}
          <a 
            href="https://www.google.com/maps/search/?api=1&query=Nh%C3%A0%20th%E1%BB%9D%20Gi%C3%A1o%20x%E1%BB%A9%20Tam%20H%E1%BA%A3i%20180%20Tam%20Ch%C3%A2u%20Tam%20B%C3%ACnh%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c" 
            target="_blank" 
            rel="noreferrer" 
            className="w-full max-w-[11.1rem] md:max-w-[12.7rem] h-[2.8rem] md:h-[3.1rem] save-date-watercolor-btn mt-1"
          >
            <span className="save-date-btn-label flex items-center justify-center gap-1.5 font-sans text-[0.55rem] md:text-[0.61rem] font-bold tracking-[0.2em] text-[#3f4642]">
              <MapPin className="w-3 h-3 md:w-[0.85rem] md:h-[0.85rem]" />
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
            Tiệc mừng hôn lễ
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
          <span className="font-sans text-[0.82rem] md:text-[0.88rem] tracking-[0.18em] font-bold text-[#7d7065] uppercase mb-1">
            Khai Tiệc
          </span>
          <div className="font-serif text-[2.35rem] md:text-[2.7rem] font-light text-[#3f4642] tracking-wider leading-none mb-3">
            18:00
          </div>

          {/* Location */}
          <p className="font-serif text-[#3f4642] text-[1.2rem] md:text-[1.38rem] font-semibold leading-snug mb-0.5">
            Terracotta Hotel & Resort Đà Lạt
          </p>
          <p className="font-serif text-[#6e5949] text-[1.02rem] md:text-[1.15rem] italic leading-snug mb-5">
            Quảng trường Terrace Montagne
          </p>

          {/* Map Link */}
          {mapUrl ? (
            <a 
              href={mapUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="w-full max-w-[11.1rem] md:max-w-[12.7rem] h-[2.8rem] md:h-[3.1rem] save-date-watercolor-btn mt-1 mb-6"
            >
              <span className="save-date-btn-label flex items-center justify-center gap-1.5 font-sans text-[0.55rem] md:text-[0.61rem] font-bold tracking-[0.2em] text-[#3f4642]">
                <MapPin className="w-3 h-3 md:w-[0.85rem] md:h-[0.85rem]" />
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

        {/* Standalone Mobile Timeline Section */}
        <motion.div
          variants={cardVariant}
          className="flex md:hidden flex-col gap-3 px-1 w-full pt-8 pb-4 relative z-10"
        >
          <h3 className="font-serif text-[1.12rem] font-bold gold-foil-text uppercase text-center mb-5 leading-tight">
            Lịch Trình Tiệc
          </h3>
          
          <div className="timeline-garden-path-scene w-full min-h-[28rem] overflow-visible relative">
            {/* Winding road */}
            <div
              className="timeline-garden-path-image opacity-[0.55]"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{ backgroundImage: "url('/assets/timeline-garden-path-desktop.webp')", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "100% 100%" }}
              />
            </div>
            <ol className="timeline-garden-list relative z-10 grid justify-items-center w-full">
              {(publicData?.timeline || defaultTimelineFallback).map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0.3, scale: 0.9, y: 15 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="timeline-garden-node !w-[47%] !max-w-[9.2rem] !ml-0 !mr-0"
                >
                  <div className="timeline-garden-card !py-2.5 !px-3 !gap-1 shadow-[0_6px_16px_rgba(63,70,66,0.07)] text-center flex flex-col items-center justify-center bg-[#fdfbf7]/95 border border-[#b4975a]/25 backdrop-blur-[8px] rounded-xl">
                    <p className="timeline-garden-time !text-[0.98rem] !font-bold text-[#8d713a] tracking-wider mb-0.5">{item.time}</p>
                    <h3 className="!text-[1.02rem] !font-semibold text-[#2f3532] font-serif leading-snug">{item.title}</h3>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
}
