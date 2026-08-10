"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, MotionConfig, motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DressColorId = "pink" | "blue" | "yellow" | "green" | "cream" | "beige" | "brown";

export type DressCodeColor = {
  id: DressColorId;
  name: string;
  hex: string;
  imgSrc: string;
  objectPosition?: string;
};

const MASTER_IMAGE = "/assets/dresscode-theme-v5.webp";

const DRESS_COLORS: DressCodeColor[] = [
  {
    id: "pink",
    name: "Hồng nhạt",
    hex: "#e8cfce",
    imgSrc: "/assets/dresscode-pink-v7.webp",
  },
  {
    id: "blue",
    name: "Xanh biển nhạt",
    hex: "#d0d9e0",
    imgSrc: "/assets/dresscode-blue-v5.webp",
  },
  {
    id: "yellow",
    name: "Vàng nhạt",
    hex: "#fae8c5",
    imgSrc: "/assets/dresscode-yellow-v5.webp",
  },
  {
    id: "green",
    name: "Xanh lá xô thơm",
    hex: "#bcc5b0",
    imgSrc: "/assets/dresscode-green-v5.webp",
  },
  {
    id: "cream",
    name: "Kem",
    hex: "#f5e9d2",
    imgSrc: "/assets/dresscode-cream-v5.webp",
  },
  {
    id: "beige",
    name: "Be",
    hex: "#ddd1be",
    imgSrc: "/assets/dresscode-beige-v5.webp",
  },
  {
    id: "brown",
    name: "Nâu nhạt",
    hex: "#b3967d",
    imgSrc: "/assets/dresscode-brown-v5.webp",
  },
];

const slideVariants = {
  enter: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction > 0 ? "9%" : "-9%",
    scale: 1.012,
  }),
  center: {
    opacity: 1,
    x: "0%",
    scale: 1,
  },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction > 0 ? "-6%" : "6%",
    scale: 0.995,
  }),
};

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
  const sectionRef = useRef<HTMLDivElement>(null);
  const hintRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInView = useInView(sectionRef, { amount: 0.28 });
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [hintPaused, setHintPaused] = useState(false);
  const selectedColor = DRESS_COLORS.find((color) => color.id === selectedColorId) || null;

  // Keep every illustration warm in the browser cache before the guest starts browsing.
  useEffect(() => {
    [MASTER_IMAGE, ...DRESS_COLORS.map((color) => color.imgSrc)].forEach((src) => {
      const image = new window.Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (hintRestartTimerRef.current) {
        clearTimeout(hintRestartTimerRef.current);
      }
    };
  }, []);

  let invitationText = note;
  let weatherAlertText = "";
  const weatherIndex = note.indexOf("Lưu ý:");

  if (weatherIndex !== -1) {
    invitationText = note.substring(0, weatherIndex).trim().replace(/:\s*$/, ":");
    weatherAlertText = note.substring(weatherIndex).trim();
  } else {
    const legacyIndex = note.indexOf("Lưu ý thời tiết");
    if (legacyIndex !== -1) {
      invitationText = note.substring(0, legacyIndex).trim().replace(/:\s*$/, ":");
      weatherAlertText = note.substring(legacyIndex).trim();
      weatherAlertText = weatherAlertText
        .replace(/^Lưu ý thời tiết:\s*/, "")
        .replace(/^Lưu ý thời tiết\s*/, "")
        .trim();
    }
  }

  const pauseAndRestartArrowHint = () => {
    if (hintRestartTimerRef.current) {
      clearTimeout(hintRestartTimerRef.current);
    }
    setHintPaused(true);
    hintRestartTimerRef.current = setTimeout(() => {
      setHintPaused(false);
      hintRestartTimerRef.current = null;
    }, 2000);
  };

  const moveToAdjacentColor = (direction: 1 | -1) => {
    setSlideDirection(direction);
    pauseAndRestartArrowHint();

    if (!selectedColor) {
      setSelectedColorId(direction > 0 ? DRESS_COLORS[0].id : DRESS_COLORS[DRESS_COLORS.length - 1].id);
      return;
    }

    const currentIndex = DRESS_COLORS.findIndex((color) => color.id === selectedColor.id);
    const nextIndex = (currentIndex + direction + DRESS_COLORS.length) % DRESS_COLORS.length;
    setSelectedColorId(DRESS_COLORS[nextIndex].id);
  };

  const selectColor = (color: DressCodeColor, targetIndex: number) => {
    if (selectedColorId === color.id) {
      setSlideDirection(-1);
      setSelectedColorId(null);
      return;
    }

    const currentIndex = selectedColor
      ? DRESS_COLORS.findIndex((item) => item.id === selectedColor.id)
      : -1;
    setSlideDirection(currentIndex === -1 || targetIndex >= currentIndex ? 1 : -1);
    setSelectedColorId(color.id);
  };

  const currentImage = selectedColor?.imgSrc || MASTER_IMAGE;
  const currentLabel = selectedColor?.name || "Gợi ý phối đồ";

  return (
    <div ref={sectionRef} className="relative flex w-full flex-col items-center gap-6">
      <p className="sr-only" aria-live="polite">
        {selectedColor
          ? `Đang hiển thị gợi ý trang phục màu ${selectedColor.name}`
          : "Đang hiển thị gợi ý tổng thể cho trang phục"}
      </p>

      <div className="flex w-full flex-col items-center px-1 text-center sm:px-4">
        <h3 className="mt-2 mb-3 font-sans text-[0.88rem] font-bold leading-none tracking-[0.22em] text-[#7d7065] uppercase sm:text-[0.94rem] md:text-[1rem]">
          Trang phục chủ đề
        </h3>

        <div
          className="mb-[1.125rem] flex w-full max-w-[11rem] items-center justify-center gap-3.5 sm:max-w-[13rem]"
          aria-hidden="true"
        >
          <div className="h-px flex-grow bg-[#b4975a]/35" />
          <svg viewBox="0 0 24 24" className="h-[11px] w-[11px] flex-shrink-0 fill-[#b4975a] sm:h-3 sm:w-3">
            <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
          </svg>
          <div className="h-px flex-grow bg-[#b4975a]/35" />
        </div>

        <span className="mb-[1.125rem] block font-serif text-[1.65rem] leading-tight font-medium text-[#3f4642] italic sm:text-[1.9rem] md:text-[2.1rem]">
          {title && !title.includes("pastel") && title !== "Trang phục chủ đề" ? title : "Khu vườn mùa xuân"}
        </span>

        <p className="mx-auto mb-4 max-w-[30rem] whitespace-pre-line font-sans text-[0.96rem] leading-relaxed font-normal text-[#4e443c]/90 sm:text-[1.04rem] md:text-[1.1rem]">
          {invitationText}
        </p>

      </div>

      <div className="relative mx-auto w-full max-w-[26rem] sm:max-w-[29rem] md:max-w-[32rem]">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] border border-[#fffdf8]/75 bg-[#f7f0e8] shadow-[0_9px_28px_rgba(76,61,48,0.09)] sm:rounded-[2.2rem]">
          <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
            <motion.div
              key={selectedColor?.id || "master"}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                opacity: { duration: 0.28 },
                x: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
              }}
              className="absolute inset-0"
            >
              <Image
                src={currentImage}
                alt={selectedColor ? `Gợi ý phối đồ màu ${selectedColor.name}` : "Gợi ý phối đồ theo bảng màu khu vườn mùa xuân"}
                fill
                sizes="(max-width: 639px) 88vw, (max-width: 1023px) 29rem, 32rem"
                unoptimized
                className="object-cover"
                style={{ objectPosition: selectedColor?.objectPosition }}
                priority
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <MotionConfig reducedMotion="never">
          <motion.button
            type="button"
            onClick={() => moveToAdjacentColor(-1)}
            aria-label={selectedColor ? `Xem màu trước ${selectedColor.name}` : "Xem gợi ý màu cuối cùng"}
            className="absolute top-1/2 left-[-1.375rem] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/90 bg-[#fffaf2]/92 text-[#745f4d] shadow-[0_5px_16px_rgba(79,62,45,0.14)] backdrop-blur-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f6f49] sm:left-[-3.35rem] sm:h-12 sm:w-12"
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={1.45} aria-hidden="true" />
          </motion.button>

          <motion.button
            type="button"
            onClick={() => moveToAdjacentColor(1)}
            aria-label={selectedColor ? `Xem màu tiếp theo sau ${selectedColor.name}` : "Xem gợi ý màu đầu tiên"}
            className="absolute top-1/2 right-[-1.375rem] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/90 bg-[#fffaf2]/92 text-[#745f4d] shadow-[0_5px_16px_rgba(79,62,45,0.14)] backdrop-blur-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f6f49] sm:right-[-3.35rem] sm:h-12 sm:w-12"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              className="flex items-center justify-center"
              animate={isInView && !hintPaused ? { x: [0, 6, 0, 6, 0] } : { x: 0 }}
              transition={
                isInView && !hintPaused
                  ? { duration: 2, repeat: Infinity, repeatDelay: 3, ease: [0.65, 0, 0.35, 1] }
                  : { duration: 0.12 }
              }
            >
              <ChevronRight className="h-7 w-7" strokeWidth={1.45} aria-hidden="true" />
            </motion.span>
          </motion.button>
        </MotionConfig>
      </div>

      <AnimatePresence initial={false} mode="wait">
        <motion.p
          key={currentLabel}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="-mt-2 min-h-6 font-sans text-[0.9rem] font-semibold tracking-[0.045em] text-[#6d5e51] sm:text-[0.95rem]"
        >
          {currentLabel}
        </motion.p>
      </AnimatePresence>

      <div className="flex w-full flex-col items-center px-1 text-center sm:px-4">
        <div
          className="-mx-3 grid min-h-11 w-[calc(100%+1.5rem)] max-w-none grid-cols-7 items-center sm:mx-0 sm:w-full sm:max-w-[32rem]"
          role="group"
          aria-label="Chọn màu trang phục"
        >
          {DRESS_COLORS.map((color, index) => {
            const isSelected = selectedColorId === color.id;
            return (
              <motion.button
                key={color.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={isSelected ? `Trở về gợi ý tổng thể từ màu ${color.name}` : `Xem gợi ý phối đồ màu ${color.name}`}
                onClick={() => selectColor(color, index)}
                className="group relative flex min-h-11 min-w-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#8f6f49]"
                whileTap={{ scale: 0.9 }}
              >
                <motion.span
                  className="relative block h-[clamp(1.8rem,8.4vw,2.25rem)] w-[clamp(1.8rem,8.4vw,2.25rem)] rounded-full shadow-[0_2px_7px_rgba(75,61,48,0.14),_inset_0_1px_2px_rgba(255,255,255,0.3)]"
                  animate={{
                    scale: 1,
                    boxShadow: isSelected
                      ? `0 0 0 2.5px rgba(255,253,248,0.98), 0 0 12px 4px ${color.hex}96, 0 4px 10px rgba(75,61,48,0.16)`
                      : "0 2px 7px rgba(75,61,48,0.14), inset 0 1px 2px rgba(255,255,255,0.35)",
                  }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  style={{ backgroundColor: color.hex }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>

      {weatherAlertText && (
        <p className="mx-auto max-w-[33rem] border-t border-[#b4975a]/18 px-3 pt-5 font-serif text-[1.02rem] leading-relaxed text-[#6e5021] italic sm:text-[1.12rem] md:text-[1.18rem]">
          {weatherAlertText}
        </p>
      )}
    </div>
  );
}
