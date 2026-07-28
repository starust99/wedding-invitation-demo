"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export type DressColorId = "pink" | "blue" | "yellow" | "green" | "cream" | "beige" | "brown";

export type DressCodeColor = {
  id: DressColorId;
  name: string;
  hex: string;
  imgSrc: string;
  objectPosition?: string;
};

const DRESS_COLORS: DressCodeColor[] = [
  {
    id: "pink",
    name: "Hồng phấn",
    hex: "#d39a9c",
    imgSrc: "/assets/dresscode-pink-v3.jpg",
  },
  {
    id: "blue",
    name: "Xanh biển nhạt",
    hex: "#9bb4c5",
    imgSrc: "/assets/dresscode-blue-v3.jpg",
  },
  {
    id: "yellow",
    name: "Vàng nhạt",
    hex: "#e8c691",
    imgSrc: "/assets/dresscode-yellow-v3.jpg",
  },
  {
    id: "green",
    name: "Xanh lá nhạt",
    hex: "#a9bc99",
    imgSrc: "/assets/dresscode-green-v4.jpg",
  },
  {
    id: "cream",
    name: "Kem",
    hex: "#f5e9d2",
    imgSrc: "/assets/dresscode-cream-v3.jpg",
  },
  {
    id: "beige",
    name: "Be",
    hex: "#ddd1be",
    imgSrc: "/assets/dresscode-beige-v3.jpg",
  },
  {
    id: "brown",
    name: "Nâu nhạt",
    hex: "#b3967d",
    imgSrc: "/assets/dresscode-brown-v3.jpg",
  },
];

export function DressCodeSection({
  title,
  note,
  selectedColorId,
  setSelectedColorId,
}: {
  title: string;
  note: string;
  selectedColorId: DressColorId | null;
  setSelectedColorId: (id: DressColorId | null) => void;
}) {
  const selectedColor = DRESS_COLORS.find((c) => c.id === selectedColorId) || null;

  const badgeBg = selectedColor
    ? `linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, ${selectedColor.hex}${
        selectedColor.id === "cream" || selectedColor.id === "beige" ? "4c" : "28"
      } 100%)`
    : "rgba(244, 238, 230, 0.65)";

  const badgeBorder = selectedColor
    ? `${selectedColor.hex}${selectedColor.id === "cream" || selectedColor.id === "beige" ? "5c" : "3b"}`
    : "rgba(180, 151, 90, 0.25)";

  // Preload all dress code images to make color transitions instantaneous
  useEffect(() => {
    const imagesToPreload = [
      "/assets/dresscode-theme-v4.jpg?v=9",
      ...DRESS_COLORS.map((c) => `${c.imgSrc}?v=8`),
    ];
    imagesToPreload.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  // Split the note into invitation text and weather alert text
  let invitationText = note;
  let weatherAlertText = "";

  const weatherIndex = note.indexOf("Lưu ý:");
  if (weatherIndex !== -1) {
    invitationText = note.substring(0, weatherIndex).trim();
    weatherAlertText = note.substring(weatherIndex).trim();
  } else {
    const legacyIndex = note.indexOf("Lưu ý thời tiết");
    if (legacyIndex !== -1) {
      invitationText = note.substring(0, legacyIndex).trim();
      weatherAlertText = note.substring(legacyIndex).trim();
    }
  }

  // Split weatherAlertText for Option 2 styling without changing/removing words
  let parsedAlert = null;
  if (weatherAlertText) {
    let cleanAlert = weatherAlertText;
    let prefix = "";
    if (cleanAlert.startsWith("Lưu ý:")) {
      prefix = "Lưu ý";
      cleanAlert = cleanAlert.substring("Lưu ý:".length).trim();
    } else if (cleanAlert.startsWith("Lưu ý thời tiết:")) {
      prefix = "Lưu ý thời tiết";
      cleanAlert = cleanAlert.substring("Lưu ý thời tiết:".length).trim();
    } else if (cleanAlert.startsWith("Lưu ý thời tiết")) {
      prefix = "Lưu ý thời tiết";
      cleanAlert = cleanAlert.substring("Lưu ý thời tiết".length).trim();
    }

    const commaIndex = cleanAlert.indexOf(", Quý khách");
    if (commaIndex !== -1) {
      parsedAlert = {
        prefix: prefix || "Lưu ý",
        part1: cleanAlert.substring(0, commaIndex + 1).trim(),
        part2: cleanAlert.substring(commaIndex + 1).trim(),
      };
    } else {
      parsedAlert = {
        prefix: prefix || "Lưu ý",
        part1: cleanAlert,
        part2: "",
      };
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 items-center relative">
      {/* 2-Color Pink & Blue Pastel SVG Gradient definitions for icons */}
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="dresscode-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d39a9c" />
            <stop offset="100%" stopColor="#9bb4c5" />
          </linearGradient>
        </defs>
      </svg>
      {/* Screen reader live updates */}
      <p className="sr-only" aria-live="polite">
        {selectedColor
          ? `Đang hiển thị gợi ý trang phục màu ${selectedColor.name}`
          : "Đang hiển thị toàn bộ trang phục"}
      </p>

      {/* Top Header */}
      <div className="flex flex-col items-center text-center w-full px-4 mb-4">
        {/* "TRANG PHỤC CHỦ ĐỀ" - Sans-serif, uppercase, wide tracking, elegant taupe color */}
        <h3 className="font-sans text-[0.88rem] sm:text-[0.94rem] md:text-[1rem] font-bold tracking-[0.22em] text-[#7d7065] uppercase leading-none mt-2 mb-3">
          TRANG PHỤC CHỦ ĐỀ
        </h3>

        {/* Custom Gold Star Divider */}
        <div className="flex items-center justify-center gap-3.5 w-full max-w-[11rem] sm:max-w-[13rem] mb-4.5 select-none pointer-events-none" aria-hidden="true">
          <div className="h-[1px] flex-grow bg-[#b4975a]/35" />
          <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] sm:w-3 sm:h-3 fill-[#b4975a] flex-shrink-0">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>
          <div className="h-[1px] flex-grow bg-[#b4975a]/35" />
        </div>

        {/* "{title}" (Sắc màu vườn xuân) - Serif, italic, larger, elegant */}
        <span className="font-serif italic text-[1.65rem] sm:text-[1.9rem] md:text-[2.1rem] font-medium text-[#3f4642] leading-tight mb-4.5 block">
          {title}
        </span>

        <p className="font-sans text-[#4e443c]/90 font-normal text-[0.92rem] sm:text-[0.98rem] md:text-[1.02rem] leading-relaxed max-w-[28rem] mx-auto whitespace-pre-line">
          {invitationText}
        </p>
      </div>

      {/* Interactive Illustration Image */}
      <div className="w-full max-w-[24rem] sm:max-w-[26rem] md:max-w-[27rem] mx-auto flex flex-col items-center">
        {/* Card containing image */}
        <div className="relative w-full aspect-[3/4] rounded-[2.2rem] overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.05)] bg-white/50 border border-white/20">
          <div className="w-full h-full overflow-hidden relative">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={selectedColor ? selectedColor.id : "default"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <Image
                  src={selectedColor ? `${selectedColor.imgSrc}?v=8` : "/assets/dresscode-theme-v4.jpg?v=9"}
                  alt={selectedColor ? `Gợi ý phối đồ màu ${selectedColor.name}` : "Gợi ý phối đồ theo bảng màu vườn xuân"}
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Color Selection Bar (moved below) */}
        <div
          className="flex w-full bg-white/25 border border-white/40 shadow-[0_4px_24px_rgba(63,70,66,0.06)] rounded-full py-2.5 px-4.5 justify-between items-center z-10 mt-5"
          style={{
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
          role="group"
          aria-label="Chọn màu trang phục"
        >
          {DRESS_COLORS.map((color) => {
            const isSelected = selectedColorId === color.id;
            return (
              <motion.button
                key={color.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Xem gợi ý phối đồ màu ${color.name}`}
                onClick={() => setSelectedColorId(isSelected ? null : color.id)}
                className="w-[2.1rem] h-[2.1rem] xs:w-[2.45rem] xs:h-[2.45rem] rounded-full flex-shrink-0 relative flex items-center justify-center focus-visible:outline-none border-[2.2px] cursor-pointer"
                animate={{
                  scale: isSelected ? 1.12 : 1.0,
                  borderColor: isSelected ? color.hex : "rgba(255, 255, 255, 1)",
                  boxShadow: isSelected 
                    ? `0 0 14px 3px ${color.hex}60` 
                    : "0 2px 5px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255, 255, 255, 0.25), 0 0 0 0.5px rgba(63, 70, 66, 0.08)"
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                style={{
                  backgroundColor: color.hex,
                }}
              >
                {/* Floating glass ring */}
                {isSelected && (
                  <motion.div
                    layoutId="activeColorRing"
                    className="absolute -inset-1.5 rounded-full border-[1.8px] border-white/80 bg-white/15 shadow-[0_2.5px_6px_rgba(63,70,66,0.08),_inset_0_1px_1px_rgba(255,255,255,0.4)] pointer-events-none"
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Glassmorphic Badge below Swatches */}
        <div className="flex justify-center mt-5 select-none min-h-[2.2rem]">
          <motion.div
            layout
            className="flex w-[19.2rem] sm:w-[20.5rem] h-[2.4rem] sm:h-[2.6rem] items-center justify-center gap-2.5 px-4.5 rounded-full border shadow-[0_4px_16px_rgba(63,70,66,0.04)] backdrop-blur-[8px] origin-center"
            animate={{
              background: badgeBg,
              borderColor: badgeBorder
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            <AnimatePresence mode="wait">
              {selectedColor ? (
                <motion.div
                  key={selectedColor.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <span className="font-sans text-[0.88rem] sm:text-[0.92rem] font-medium tracking-wide text-[#3f4642] leading-normal whitespace-nowrap">
                    {selectedColor.name}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="instruction"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5"
                >
                  {/* Left Sparkles icon */}
                  <motion.div
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ stroke: "url(#dresscode-gradient)" }} />
                  </motion.div>

                  <span className="font-sans text-[0.82rem] sm:text-[0.85rem] font-bold tracking-[0.06em] leading-normal whitespace-nowrap uppercase text-[#3f4642]">
                    CHỌN MÀU ĐỂ XEM GỢI Ý
                  </span>

                  {/* Right Sparkles icon */}
                  <motion.div
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ stroke: "url(#dresscode-gradient)" }} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Weather Alert */}
      {parsedAlert && (
        <div className="w-full max-w-[26rem] sm:max-w-[29rem] md:max-w-[31rem] mx-auto mt-7">
          {/* Double-Bezel outer tray */}
          <div className="p-2 rounded-[2.2rem] bg-[#b4975a]/3 border border-[#b4975a]/10 shadow-[0_12px_34px_rgba(180,151,90,0.06)] relative overflow-hidden">
            {/* Fine paper-grain inside the tray */}
            <div aria-hidden="true" className="paper-grain-luxury absolute inset-0 opacity-[0.06] pointer-events-none" />
            
            {/* Inner core card */}
            <div className="relative p-6 sm:p-7.5 rounded-[calc(2.2rem-0.5rem)] bg-[#fdfbf7] border border-[#b4975a]/15 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.85)] flex flex-col items-center text-center">
              
              {/* Header Label: LƯU Ý THỜI TIẾT */}
              <span className="font-sans text-[0.8rem] sm:text-[0.86rem] font-bold tracking-[0.24em] text-[#b4975a] uppercase mb-3 flex items-center gap-1.5 leading-none">
                {parsedAlert.prefix.toUpperCase()} THỜI TIẾT
              </span>

              {/* Separator Line */}
              <div className="w-10 h-[0.5px] bg-[#b4975a]/25 mb-4.5" />

              {/* Content body split into 2 paragraphs */}
              <div className="flex flex-col gap-4 font-serif">
                {/* Part 1 (Vibe context): Italicized, slightly lighter, elegant color */}
                <p className="text-[#655a50] text-[0.95rem] sm:text-[1rem] md:text-[1.04rem] leading-[1.7] italic font-medium">
                  {parsedAlert.part1}
                </p>
                
                {/* Part 2 (Action): Normal text, slightly darker, clear instruction */}
                <p className="text-[#3f4642] text-[0.95rem] sm:text-[1rem] md:text-[1.04rem] leading-[1.7] font-semibold">
                  {parsedAlert.part2}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
