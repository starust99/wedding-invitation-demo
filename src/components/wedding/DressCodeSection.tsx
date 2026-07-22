"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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
    name: "Xanh biển",
    hex: "#9bb4c5",
    imgSrc: "/assets/dresscode-blue-v3.jpg",
  },
  {
    id: "yellow",
    name: "Vàng",
    hex: "#e8c691",
    imgSrc: "/assets/dresscode-yellow-v3.jpg",
  },
  {
    id: "green",
    name: "Xanh lá",
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
    name: "Nâu",
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

  return (
    <div className="w-full flex flex-col gap-6 items-center relative">
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
          className="flex w-full bg-white/60 border border-white/50 shadow-[0_4px_24px_rgba(63,70,66,0.06)] rounded-full py-2.5 px-4.5 justify-between items-center z-10 mt-5"
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
              <button
                key={color.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Xem gợi ý phối đồ màu ${color.name}`}
                onClick={() => setSelectedColorId(isSelected ? null : color.id)}
                className="w-[2.1rem] h-[2.1rem] xs:w-[2.45rem] xs:h-[2.45rem] rounded-full flex-shrink-0 transition-all duration-300 relative flex items-center justify-center focus-visible:outline-none border-[2.2px] border-white cursor-pointer hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: color.hex,
                  boxShadow: isSelected 
                    ? `0 0 12px 1px ${color.hex}c0, inset 0 1.5px 3px rgba(0,0,0,0.15)` 
                    : "0 2px 5px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.2)",
                  transform: isSelected ? "scale(1.12)" : "scale(1.0)",
                }}
              >
                {isSelected && (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 xs:w-4.2 xs:h-4.2 text-white fill-none stroke-current" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Color Name below Swatches */}
        <div className="flex items-center justify-center gap-2 mt-4 text-[#7d7065] select-none min-h-[1.75rem]">
          <span className="text-[#b4975a] text-[0.8rem] font-bold">✦</span>
          {selectedColor ? (
            <span className="font-sans text-[1.02rem] font-medium tracking-wide text-[#3f4642]">
              {selectedColor.name}
            </span>
          ) : (
            <motion.span
              animate={{
                opacity: [0.75, 1, 0.75],
                scale: [0.99, 1.01, 0.99],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="font-sans text-[0.98rem] font-medium tracking-wide text-[#b4975a]"
            >
              Chạm vào màu để xem gợi ý
            </motion.span>
          )}
          <span className="text-[#b4975a] text-[0.8rem] font-bold">✦</span>
        </div>
      </div>

      {/* Weather Alert */}
      {weatherAlertText && (
        <div className="flex mt-4 p-4.5 rounded-[1.2rem] bg-[#b4975a]/5 border border-[#b4975a]/12 text-center w-full max-w-[24rem] sm:max-w-[26rem] md:max-w-[27rem] mx-auto">
          <p className="font-sans text-[#6e5949] text-[0.85rem] leading-relaxed font-normal">
            {weatherAlertText}
          </p>
        </div>
      )}
    </div>
  );
}
