"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { EventDetailsViewportMode, WeddingEventDetailsEditorConfig } from "@/lib/wedding/event-details-types";
import { DressCodeSection, type DressColorId } from "./DressCodeSection";
import { RoadSequencePlayer } from "@/components/RoadSequencePlayer";
import { resolveTimelineIcon } from "@/config/timeline-icons";

function TimelineIcon({ title, icon, className }: { title: string; icon?: string; className?: string }) {
  const iconPath = resolveTimelineIcon(title, icon);
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

type EventDetailsTimelineItem = {
  time: string;
  title: string;
  description?: string;
  icon?: string;
};

type EventDetailsPublicData = {
  dateLabel?: string;
  welcomeTime?: string;
  churchDate?: string;
  churchTime?: string;
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
  responseSlot?: ReactNode;
  showChurchCard?: boolean;
  showBanquetCard?: boolean;
};




function parseEventDate(dateLabel?: string, fallback = { day: "20", month: "12", year: "2026", weekday: "CHỦ NHẬT" }) {
  if (!dateLabel) {
    return fallback;
  }

  const dateMatch = dateLabel.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  const weekdayMatch = dateLabel.match(/(Chúa Nhật|Chủ Nhật|Thứ Hai|Thứ Ba|Thứ Tư|Thứ Năm|Thứ Sáu|Thứ Bảy)/i);

  const day = dateMatch ? dateMatch[1] : fallback.day;
  const month = dateMatch ? dateMatch[2] : fallback.month;
  const year = dateMatch ? dateMatch[3] : fallback.year;
  const weekday = weekdayMatch ? weekdayMatch[0].toUpperCase() : fallback.weekday;

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
          
          <div className="font-sans text-[0.75rem] sm:text-[1rem] md:text-[1.15rem] tracking-[0.1em] font-bold text-[#645b53] uppercase whitespace-nowrap px-1">
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
            <div className="flex items-center justify-center font-serif text-[4.2rem] sm:text-[6.77rem] md:text-[7.63rem] font-normal leading-none text-[#9b7134] select-none translate-y-[-0.09em] mx-1 sm:mx-2 md:mx-3">
              <span className="w-[1.9rem] sm:w-[3.08rem] md:w-[3.57rem] text-right">{dateParsed.day.trim()[0]}</span>
              <span className="w-[1.9rem] sm:w-[3.08rem] md:w-[3.57rem] text-left">{dateParsed.day.trim()[1]}</span>
            </div>
          ) : (
            <div className="font-serif text-[4.2rem] sm:text-[6.77rem] md:text-[7.63rem] font-normal leading-none text-[#9b7134] text-center translate-y-[-0.09em] min-w-[3.8rem] sm:min-w-[6.15rem] md:min-w-[7.13rem] mx-1 sm:mx-2 md:mx-3">
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

          <div className="font-sans text-[0.7rem] sm:text-[0.98rem] md:text-[1.12rem] tracking-[0.035em] font-bold text-[#645b53] uppercase whitespace-nowrap px-1">
            THÁNG {dateParsed.month} • {dateParsed.year}
          </div>
        </div>
      </div>

      {/* Lunar Calendar Date */}
      <div className="font-serif text-[#5c554e] text-[1.22rem] sm:text-[1.52rem] md:text-[1.74rem] italic font-medium tracking-[0.025em] leading-snug mt-2 px-2 text-balance select-none">
        {lunarText}
      </div>
    </div>
  );
}






const cardVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.98,
    filter: "blur(10px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.025,
      delayChildren: 0,
    },
  },
};

const cardItemVariant: Variants = {
  hidden: { opacity: 0, y: 13, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const instantCardVariant: Variants = {
  hidden: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0, delayChildren: 0, staggerChildren: 0 },
  },
};

const instantCardItemVariant: Variants = {
  hidden: { opacity: 1, y: 0, filter: "blur(0px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0 } },
};

const headerVariant: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const familyPanelVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.985,
    filter: "blur(9px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.035,
      delayChildren: 0,
    },
  },
};

const familyItemVariant: Variants = {
  hidden: { opacity: 0, y: 11, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const sectionRevealHidden = {
  opacity: 0,
  y: 18,
  filter: "blur(7px)",
};

const sectionRevealVisible = {
  opacity: 1,
  y: 0,
  filter: "blur(0px)",
};

const sectionRevealTransition = {
  duration: 0.86,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};


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
  responseSlot,
  showChurchCard = true,
  showBanquetCard = true,
}: EventDetailsContentProps) {
  const compact = mode === "preview";
  const mobilePreview = compact && viewport === "mobile";
  const [selectedColorId, setSelectedColorId] = useState<DressColorId | null>(null);
  const [isRoadReady, setIsRoadReady] = useState(false);
  const [immediatelyRevealedCards, setImmediatelyRevealedCards] = useState<Set<string>>(() => new Set());
  const content = config.content;
  const churchDateParsed = parseEventDate(publicData?.churchDate || content.churchDate);
  const banquetDateParsed = parseEventDate(publicData?.dateLabel, { day: "26", month: "12", year: "2026", weekday: "THỨ BẢY" });
  const dressCodeTitle = publicData?.dressCodeTitle && !publicData.dressCodeTitle.includes("pastel") && publicData.dressCodeTitle !== "Trang phục chủ đề" ? publicData.dressCodeTitle : "Khu vườn mùa xuân";
  const dressCodeNote = publicData?.dressCodeNote || content.dressCodeText;

  useEffect(() => {
    const revealCard = (targetId: string) => {
      if (targetId !== "thanh-le-hon-phoi" && targetId !== "tiec-cuoi") return;
      setImmediatelyRevealedCards((current) => {
        if (current.has(targetId)) return current;
        const next = new Set(current);
        next.add(targetId);
        return next;
      });
    };

    const handleReveal = (event: Event) => {
      revealCard((event as CustomEvent<{ targetId?: string }>).detail?.targetId ?? "");
    };

    revealCard(window.location.hash.slice(1));
    window.addEventListener("wedding:reveal-event-card", handleReveal);
    return () => window.removeEventListener("wedding:reveal-event-card", handleReveal);
  }, []);

  const revealChurchImmediately = immediatelyRevealedCards.has("thanh-le-hon-phoi");
  const revealBanquetImmediately = immediatelyRevealedCards.has("tiec-cuoi");

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
          viewport={{ once: true, amount: 0.12 }}
          variants={headerVariant}
        >
          {content.eyebrow && content.eyebrow !== "Lễ Thành Hôn" && content.eyebrow !== "Lễ Thánh Hôn" && content.eyebrow !== "Thông tin và địa điểm" && (
            <p className="section-kicker-dark wedding-type-kicker">{content.eyebrow}</p>
          )}
          {content.title ? <h2>{content.title}</h2> : null}
          {content.intro ? <p>{content.intro}</p> : null}
        </motion.header>
      ) : null}

      <div className="event-details-card-stack">
      <motion.div 
        className="stationery-invitation-main-card z-30 w-full luxury-wedding-stationery-card px-1.5 pt-10 pb-10 sm:px-10 sm:pt-14 sm:pb-14 md:px-12 md:pt-16 md:pb-16 text-center flex flex-col relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
        variants={familyPanelVariant}
      >
        {/* Subtle watercolor washes in corners */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-[#fadcd9]/25 to-transparent rounded-full blur-[40px] pointer-events-none z-0" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gradient-to-tl from-[#d4e4f7]/25 to-transparent rounded-full blur-[40px] pointer-events-none z-0" />

        {/* Corner Ornaments */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 sm:top-6 sm:left-6 w-[92px] h-[92px] sm:w-28 sm:h-28 object-contain pointer-events-none select-none block z-20"
          data-family-corner-ornament
          style={{ transform: "scaleY(-1)" }}
        />
        <span
          aria-hidden="true"
          className="absolute top-0 right-0 sm:top-6 sm:right-6 w-[92px] h-[92px] sm:w-28 sm:h-28 object-contain pointer-events-none select-none block z-20"
          data-family-corner-ornament
          style={{ transform: "scale(-1, -1)" }}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 sm:bottom-6 sm:right-6 w-[92px] h-[92px] sm:w-28 sm:h-28 object-contain pointer-events-none select-none block z-20"
          data-family-corner-ornament
          style={{ transform: "scaleX(-1)" }}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 sm:bottom-6 sm:left-6 w-[92px] h-[92px] sm:w-28 sm:h-28 object-contain pointer-events-none select-none block z-20"
          data-family-corner-ornament
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
          <motion.div variants={familyItemVariant} className="w-full min-w-0 px-2 text-center">
            <p className="mx-auto max-w-[34rem] font-serif italic text-[#3f4642]/95 text-[clamp(0.98rem,4.6vw,1.25rem)] sm:text-[1.57rem] md:text-[1.64rem] lg:text-[1.72rem] tracking-[-0.015em] sm:tracking-wide font-medium leading-[1.55] text-balance">
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
            
            {/* Animated WebP of wedding rings in the middle */}
            <div className="w-[7.2rem] h-[7.2rem] sm:w-[9.2rem] sm:h-[9.2rem] relative flex items-center justify-center overflow-visible select-none mt-[-2.2rem] mb-[-2.2rem] sm:mt-[-2.6rem] sm:mb-[-2.6rem] pointer-events-none z-10">
              <img
                src="/assets/wedding-rings.webp"
                alt="Cặp nhẫn cưới"
                className="w-full h-full object-contain"
                draggable={false}
              />
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

        {/*
          Mobile RSVP reveal marker. The response insert observes the actual
          bottom of the printed invitation instead of revealing as soon as
          its own stage peeks into the viewport.
        */}
        <span
          aria-hidden="true"
          data-invitation-read-sentinel
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        />
      </motion.div>

      {responseSlot}

      {/* Unified Vertical Scrolling Layout for Mobile, Tablet, and Desktop */}
        {/* Card 1: Thánh lễ Hôn phối */}
        {showChurchCard ? <motion.div
          id="thanh-le-hon-phoi"
          initial="hidden"
          animate={revealChurchImmediately ? "visible" : undefined}
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
          variants={revealChurchImmediately ? instantCardVariant : cardVariant}
          className="w-full scroll-mt-4 luxury-wedding-stationery-card px-6 pt-10 pb-10 sm:px-10 sm:pt-14 sm:pb-14 md:px-12 md:pt-16 md:pb-16 flex flex-col items-center text-center relative"
        >

          {/* Main Title */}
          <motion.h4 variants={revealChurchImmediately ? instantCardItemVariant : cardItemVariant} className="font-serif text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[0.14em] md:tracking-[0.18em] uppercase text-[#3f4642] mt-1 mb-1.5 leading-tight">
            Thánh lễ hôn phối
          </motion.h4>

          {/* Decorative Divider */}
          <motion.div variants={revealChurchImmediately ? instantCardItemVariant : cardItemVariant} className="w-full flex justify-center mt-1 mb-5">
            <img 
              src="/assets/divider_cards.png" 
              alt="decorative divider" 
              className="w-[90%] sm:w-[95%] max-w-[33.7rem] h-auto opacity-95 select-none object-contain pointer-events-none"
              style={{ filter: "brightness(0.85) saturate(1.3) contrast(1.05)" }}
            />
          </motion.div>

          {/* Church Image */}
          <motion.div variants={revealChurchImmediately ? instantCardItemVariant : cardItemVariant} className="watercolor-blend-container relative w-full max-w-[38rem] mx-auto aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-[0_4px_14px_rgba(63,70,66,0.05)] border border-[#b4975a]/12 mb-6">
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
          </motion.div>

          <motion.div variants={revealChurchImmediately ? instantCardItemVariant : cardItemVariant} className="w-full flex flex-col items-center">
            <DateDisplayStack dateParsed={churchDateParsed} lunarText="Nhằm ngày 12 tháng 11 năm Bính Ngọ" />
          </motion.div>

          {/* Time Display */}
          <motion.div variants={revealChurchImmediately ? instantCardItemVariant : cardItemVariant} className="w-full flex flex-col items-center">
            <span className="font-sans text-[0.9rem] sm:text-[1.05rem] md:text-[1.14rem] tracking-[0.17em] font-bold text-[#6a5f56] uppercase mb-1.5">
              Cử Hành
            </span>
            <div className="font-serif text-[2.55rem] sm:text-[3.05rem] md:text-[3.45rem] font-normal text-[#303936] tracking-[0.045em] leading-none mb-3.5">
              {publicData?.churchTime || content.churchTime || "10:00"}
            </div>
          </motion.div>

          {/* Location */}
          <motion.div variants={revealChurchImmediately ? instantCardItemVariant : cardItemVariant} className="w-full flex flex-col items-center">
            <p className="max-w-full font-serif text-[#303936] text-[1.28rem] sm:text-[1.55rem] md:text-[1.78rem] font-semibold leading-[1.25] text-balance break-words mb-1">
              {content.churchLocation || "Nhà Thờ Giáo Xứ Tam Hải"}
            </p>
            <p className="max-w-full font-serif text-[#544d47] text-[1.08rem] sm:text-[1.3rem] md:text-[1.47rem] italic font-medium leading-[1.35] text-balance break-words mb-5">
              180 Đ. Tam Châu, Tam Bình, Thủ Đức
            </p>
          </motion.div>

          {/* Map Pin link */}
          <motion.a 
            variants={revealChurchImmediately ? instantCardItemVariant : cardItemVariant}
            href="https://www.google.com/maps/search/?api=1&query=Nh%C3%A0%20th%E1%BB%9D%20Gi%C3%A1o%20x%E1%BB%A9%20Tam%20H%E1%BA%A3i%20180%20Tam%20Ch%C3%A2u%20Tam%20B%C3%ACnh%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c" 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex h-[2.65rem] sm:h-[3.0rem] save-date-watercolor-btn mt-2 mx-auto min-w-[10.5rem] sm:min-w-[12rem]"
          >
            <span className="save-date-btn-label">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3f4642]" />
              <span>Chỉ đường</span>
            </span>
          </motion.a>
        </motion.div> : null}

        {/* Card 2: Tiệc Cưới Thân Mật (Unified Card) */}
        {showBanquetCard ? <motion.div
          id="tiec-cuoi"
          initial="hidden"
          animate={revealBanquetImmediately ? "visible" : undefined}
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
          variants={revealBanquetImmediately ? instantCardVariant : cardVariant}
          className="w-full scroll-mt-4 luxury-wedding-stationery-card px-6 pt-10 pb-6 sm:px-10 sm:pt-14 sm:pb-8 md:px-12 md:pt-16 md:pb-10 flex flex-col items-center text-center relative"
        >

          {/* Main Title */}
          <motion.h4 variants={revealBanquetImmediately ? instantCardItemVariant : cardItemVariant} className="font-serif text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[0.14em] md:tracking-[0.18em] uppercase text-[#3f4642] mt-1 mb-1.5 leading-tight">
            Tiệc cưới
          </motion.h4>

          {/* Decorative Divider */}
          <motion.div variants={revealBanquetImmediately ? instantCardItemVariant : cardItemVariant} className="w-full flex justify-center mt-1 mb-5">
            <img 
              src="/assets/divider_cards.png" 
              alt="decorative divider" 
              className="w-[90%] sm:w-[95%] max-w-[33.7rem] h-auto opacity-95 select-none object-contain pointer-events-none"
              style={{ filter: "brightness(0.85) saturate(1.3) contrast(1.05)" }}
            />
          </motion.div>

          {/* Venue Image */}
          <motion.div variants={revealBanquetImmediately ? instantCardItemVariant : cardItemVariant} className="relative w-full max-w-[38rem] mx-auto aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-[0_4px_14px_rgba(63,70,66,0.05)] border border-[#b4975a]/12 mb-6">
            <VenueMapImage className="w-full h-full !aspect-auto !rounded-none" />
          </motion.div>

          <motion.div variants={revealBanquetImmediately ? instantCardItemVariant : cardItemVariant} className="w-full flex flex-col items-center">
            <DateDisplayStack dateParsed={banquetDateParsed} lunarText="Nhằm ngày 18 tháng 11 năm Bính Ngọ" />
          </motion.div>

          {/* Time Display */}
          <motion.div variants={revealBanquetImmediately ? instantCardItemVariant : cardItemVariant} className="w-full flex flex-col items-center">
            <span className="font-sans text-[0.9rem] sm:text-[1.05rem] md:text-[1.14rem] tracking-[0.17em] font-bold text-[#6a5f56] uppercase mb-1.5">
              Đón Khách
            </span>
            <div className="font-serif text-[2.55rem] sm:text-[3.05rem] md:text-[3.45rem] font-normal text-[#303936] tracking-[0.045em] leading-none mb-3.5">
              {publicData?.welcomeTime || "17:30"}
            </div>
          </motion.div>

          {/* Location */}
          <motion.div variants={revealBanquetImmediately ? instantCardItemVariant : cardItemVariant} className="w-full flex flex-col items-center">
            <p className="max-w-full font-serif text-[#303936] text-[1.28rem] sm:text-[1.55rem] md:text-[1.78rem] font-semibold leading-[1.25] text-balance break-words mb-1">
              Terracotta Hotel & Resort Đà Lạt
            </p>
            <p className="max-w-full font-serif text-[#544d47] text-[1.08rem] sm:text-[1.3rem] md:text-[1.47rem] italic font-medium leading-[1.35] text-balance break-words mb-5">
              Quảng trường Terrace Montagne
            </p>
          </motion.div>

          {/* Map Link */}
          {mapUrl ? (
            <motion.a 
              variants={revealBanquetImmediately ? instantCardItemVariant : cardItemVariant}
              href={mapUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex h-[2.65rem] sm:h-[3.0rem] save-date-watercolor-btn mt-2 mb-6 mx-auto min-w-[10.5rem] sm:min-w-[12rem]"
            >
              <span className="save-date-btn-label">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3f4642]" />
                <span>Chỉ đường</span>
              </span>
            </motion.a>
          ) : null}

          {/* Divider */}
          <motion.div variants={revealBanquetImmediately ? instantCardItemVariant : cardItemVariant} className="w-full border-t border-[#b4975a]/15 my-6" />

          {/* Timeline Section wrapped inside Card 2 */}
          {publicData?.timeline && publicData.timeline.length > 0 && (
            <motion.div
              inherit={false}
              initial={revealBanquetImmediately ? false : sectionRevealHidden}
              animate={revealBanquetImmediately ? sectionRevealVisible : undefined}
              whileInView={sectionRevealVisible}
              viewport={{ once: true, amount: 0.08 }}
              transition={revealBanquetImmediately ? { duration: 0 } : sectionRevealTransition}
              className="w-full text-center"
            >
              <h5 className="font-sans text-[0.88rem] sm:text-[0.94rem] md:text-[1rem] font-bold tracking-[0.22em] text-[#7d7065] uppercase leading-none mt-2 mb-3">
                Chương trình tiệc
              </h5>
              
              {/* Custom Gold Star Divider */}
              <div className="flex items-center justify-center gap-3.5 w-full max-w-[11rem] sm:max-w-[13rem] mx-auto mb-6 select-none pointer-events-none" aria-hidden="true">
                <div className="h-[1px] flex-grow bg-[#b4975a]/35" />
                <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] sm:w-3 sm:h-3 fill-[#b4975a] flex-shrink-0">
                  <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
                </svg>
                <div className="h-[1px] flex-grow bg-[#b4975a]/35" />
              </div>
              
              <div className="event-details-timeline-scene timeline-garden-path-scene w-full max-w-[28rem] sm:max-w-[34rem] md:max-w-[38rem] mx-auto min-h-[28rem] overflow-visible relative">
                {/* Con đường: poster luôn sẵn sàng; canvas giữ 108 frame nhưng chỉ giải mã một cửa sổ nhỏ quanh frame đang chạy. */}
                <div className={`timeline-garden-path-image timeline-path-video-wrap timeline-path-frames-wrap opacity-100 pointer-events-none ${isRoadReady ? "is-ready" : ""}`}>
                  <img
                    src="/assets/timeline-frames/frame_001.webp"
                    alt=""
                    aria-hidden="true"
                    className={`timeline-path-poster timeline-path-video ${isRoadReady ? "is-faded-out" : ""}`}
                  />
                  <RoadSequencePlayer
                    className="timeline-path-video w-full h-full object-cover"
                    onReady={() => setIsRoadReady(true)}
                  />
                </div>

                {/* Các thẻ mốc thời gian — so le trái/phải */}
                <ol className="event-details-timeline-list timeline-garden-list relative z-10 grid w-full gap-4 sm:gap-5 px-1">
                  {publicData.timeline.map((item, index) => {
                    const isRight = index % 2 === 0;
                    return (
                      <li
                        key={index}
                        className={`timeline-garden-node !m-0 flex w-full ${isRight ? "justify-end" : "justify-start"}`}
                      >
                        <div className="timeline-garden-card !py-3 !pl-3.5 !pr-11 sm:!pl-4 sm:!pr-14 !gap-1 shadow-[0_6px_16px_rgba(63,70,66,0.04)] text-left flex flex-col items-start justify-center bg-[#fdfbf7]/35 border border-[#b4975a]/20 backdrop-blur-md rounded-2xl relative overflow-hidden w-full min-w-[11rem]">
                          <TimelineIcon title={item.title} icon={item.icon} className="!absolute !right-2 sm:!right-2.5 !top-1/2 !-translate-y-1/2 !w-9 !h-9 sm:!w-11 sm:!h-11 !m-0 opacity-85 pointer-events-none" />
                          <p className="!text-[0.95rem] sm:!text-[1.1rem] !font-bold text-[#8d713a] tracking-wider mb-0.5 relative z-10">{item.time}</p>
                          <h3 className="!font-semibold text-[#2f3532] font-serif relative z-10">{item.title}</h3>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Divider */}
              <div className="w-full border-t border-[#b4975a]/15 mt-8 sm:mt-14 md:mt-16 mb-2" />
            </motion.div>
          )}

          {/* Section 3: Dress Code */}
          <motion.div
            inherit={false}
            initial={revealBanquetImmediately ? false : sectionRevealHidden}
            animate={revealBanquetImmediately ? sectionRevealVisible : undefined}
            whileInView={sectionRevealVisible}
            viewport={{ once: true, amount: 0.08 }}
            transition={revealBanquetImmediately ? { duration: 0 } : sectionRevealTransition}
            className="pt-6 sm:pt-10 md:pt-12 pb-0 w-full"
          >
            <DressCodeSection
              title={dressCodeTitle}
              note={dressCodeNote}
              selectedColorId={selectedColorId}
              setSelectedColorId={setSelectedColorId}
            />
          </motion.div>
        </motion.div> : null}
      </div>

    </div>
  );
}
