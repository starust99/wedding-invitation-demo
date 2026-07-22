"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import { galleryMosaicSlotCount, galleryMosaicSlots, getGalleryTileSizes } from "@/config/gallery-mosaic";
import { cleanBundledPublicAssetSrc } from "@/lib/asset-cleanup";
import { defaultSettings, type WeddingConfig } from "@/lib/site-settings";

const galleryBlurSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#F2C6CF" offset="0"/>
      <stop stop-color="#FDFBF7" offset="0.48"/>
      <stop stop-color="#8FAADC" offset="1"/>
    </linearGradient>
  </defs>
  <rect width="16" height="12" fill="url(#g)"/>
  <circle cx="4" cy="4" r="4" fill="#fffdf8" fill-opacity="0.46"/>
  <circle cx="12" cy="8" r="5" fill="#b5d5a4" fill-opacity="0.22"/>
</svg>`;

const galleryBlurDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(galleryBlurSvg)}`;

const galleryContainerVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const galleryTileVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const galleryIntroVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

export function GallerySection({ config }: { config: WeddingConfig }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const section = config.sections.gallery;
  const lightboxHost = typeof document === "undefined" ? null : document.body;

  const images = useMemo(
    () =>
      Array.from({ length: galleryMosaicSlotCount }, (_, index) => {
        const src = cleanBundledPublicAssetSrc(config.gallery[index]);
        if (src) return src;
        return defaultSettings.content.gallery[index] || "";
      }),
    [config.gallery],
  );
  const availableImageIndexes = useMemo(
    () => images.map((src, index) => (src ? index : -1)).filter((index) => index >= 0),
    [images],
  );
  const positions = useMemo(
    () => Array.from({ length: galleryMosaicSlotCount }, (_, index) => config.appearance.galleryObjectPositions[index] || "center center"),
    [config.appearance.galleryObjectPositions],
  );
  const tiles = useMemo(
    () => galleryMosaicSlots.map((layout, index) => ({ ...layout, src: images[index] ?? "", objectPosition: positions[index] ?? "center center" })),
    [images, positions],
  );
  const activeImage = selectedImageIndex === null || selectedImageIndex >= images.length ? "" : images[selectedImageIndex] || "";
  const activeAlt = activeImage && selectedImageIndex !== null ? `${section.imageAltPrefix} ${selectedImageIndex + 1}` : "";
  const activeSlot = selectedImageIndex === null ? null : galleryMosaicSlots[selectedImageIndex] ?? null;
  const activeFrameClass = activeSlot?.aspectClass.includes("3/4")
    ? "gallery-lightbox-frame-portrait"
    : activeSlot?.aspectClass.includes("5/3")
      ? "gallery-lightbox-frame-wide"
      : "gallery-lightbox-frame-landscape";

  const closeLightbox = useCallback(() => setSelectedImageIndex(null), []);

  const showPrevious = useCallback(() => {
    setSelectedImageIndex((current) => {
      if (current === null || availableImageIndexes.length === 0) return current;
      const position = availableImageIndexes.indexOf(current);
      const currentPosition = position === -1 ? 0 : position;
      return availableImageIndexes[(currentPosition - 1 + availableImageIndexes.length) % availableImageIndexes.length];
    });
  }, [availableImageIndexes]);

  const showNext = useCallback(() => {
    setSelectedImageIndex((current) => {
      if (current === null || availableImageIndexes.length === 0) return current;
      const position = availableImageIndexes.indexOf(current);
      const currentPosition = position === -1 ? 0 : position;
      return availableImageIndexes[(currentPosition + 1) % availableImageIndexes.length];
    });
  }, [availableImageIndexes]);

  useEffect(() => {
    if (!activeImage) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, closeLightbox, showNext, showPrevious]);

  const lightbox = (
    <AnimatePresence>
      {activeImage && (
        <motion.div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh cưới phóng lớn"
          onClick={closeLightbox}
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.3 } }}
        >
          <button type="button" className="gallery-lightbox-close" aria-label="Đóng ảnh" onClick={closeLightbox}>
            <X aria-hidden="true" size={22} />
          </button>

          {availableImageIndexes.length > 1 ? (
            <>
              <button
                type="button"
                className="gallery-lightbox-nav gallery-lightbox-nav-prev"
                aria-label="Ảnh trước"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
              >
                <ChevronLeft aria-hidden="true" size={24} />
              </button>
              <button
                type="button"
                className="gallery-lightbox-nav gallery-lightbox-nav-next"
                aria-label="Ảnh sau"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
              >
                <ChevronRight aria-hidden="true" size={24} />
              </button>
            </>
          ) : null}

          <motion.figure
            key={`lightbox-img-${selectedImageIndex}`}
            className={`gallery-lightbox-frame ${activeFrameClass}`}
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
          >
            <img
              src={activeImage}
              alt={activeAlt}
              className="gallery-lightbox-image absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: selectedImageIndex !== null ? positions[selectedImageIndex] : "center center" } as CSSProperties}
              draggable={false}
            />
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section id="gallery" className="gallery-mosaic-section cinematic-stage relative px-5 py-28 text-ink sm:px-8 sm:py-32 lg:py-36">
      <SectionMediaLayers config={config} section="gallery" className="gallery-mosaic-media opacity-[0.1]" />
      <div aria-hidden="true" className="paper-grain-luxury gallery-mosaic-grain opacity-15" />

      <div className="gallery-mosaic-shell mx-auto max-w-7xl">
        <div className="gallery-mosaic-stage mt-12 lg:mt-14">
          {/* Header inside the card */}
          <motion.div
            className="flex flex-col items-center text-center w-full px-4 pt-6 pb-6 md:pt-8 md:pb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
            variants={galleryIntroVariant}
          >
            <h3 className="font-serif text-[1.12rem] sm:text-[1.25rem] md:text-[1.38rem] font-bold gold-foil-text uppercase leading-tight mt-0.5 mb-1.5">
              {section.eyebrow}
            </h3>
            {section.description && (
              <p className="wedding-type-body font-serif mx-auto max-w-2xl text-center text-ink/62">
                {section.description}
              </p>
            )}
            
            {/* Custom Gold Star Divider */}
            <div className="flex items-center justify-center gap-3.5 w-full max-w-[11rem] sm:max-w-[13rem] mt-3 select-none pointer-events-none" aria-hidden="true">
              <div className="h-[1px] flex-grow bg-[#b4975a]/35" />
              <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] sm:w-3 sm:h-3 fill-[#b4975a] flex-shrink-0">
                <path d="M12 2Q12 12 22 12Q12 12 12 22Q12 12 2 12Q12 12 12 2" />
              </svg>
              <div className="h-[1px] flex-grow bg-[#b4975a]/35" />
            </div>
          </motion.div>

          <motion.div
            className="gallery-mosaic-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
            variants={galleryContainerVariant}
          >
            {tiles.map((tile, index) => {
              const hasImage = Boolean(tile.src);
              const style = {
                gridColumn: tile.gridColumn,
                gridRow: tile.gridRow,
              } as CSSProperties;

              return (
                <motion.figure
                  key={`${tile.src || "placeholder"}-${index}`}
                  className={`gallery-mosaic-tile ${tile.aspectClass} lg:aspect-auto`}
                  style={style}
                  suppressHydrationWarning
                  variants={galleryTileVariant}
                >
                  <button
                    type="button"
                    className={`gallery-mosaic-tile-shell ${hasImage ? "gallery-mosaic-trigger" : ""}`}
                    aria-label={hasImage ? `Mở ảnh cưới ${index + 1}` : undefined}
                    onClick={hasImage ? () => setSelectedImageIndex(index) : undefined}
                    disabled={!hasImage}
                  >
                    {hasImage ? (
                      <img
                        src={tile.src}
                        alt={`${section.imageAltPrefix} ${index + 1}`}
                        className="gallery-mosaic-image absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: tile.objectPosition } as CSSProperties}
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="gallery-mosaic-placeholder"
                        style={{ backgroundImage: tile.fallback }}
                      />
                    )}
                  </button>
                </motion.figure>
              );
            })}
          </motion.div>
        </div>
      </div>

      {lightboxHost && lightbox ? createPortal(lightbox, lightboxHost) : null}
    </section>
  );
}
