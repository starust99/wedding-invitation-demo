"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import { galleryMosaicSlotCount, galleryMosaicSlots, getGalleryTileSizes } from "@/config/gallery-mosaic";
import { cleanBundledPublicAssetSrc } from "@/lib/asset-cleanup";
import type { WeddingConfig } from "@/lib/site-settings";

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

export function GallerySection({ config }: { config: WeddingConfig }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const section = config.sections.gallery;
  const lightboxHost = typeof document === "undefined" ? null : document.body;

  const images = useMemo(
    () => Array.from({ length: galleryMosaicSlotCount }, (_, index) => cleanBundledPublicAssetSrc(config.gallery[index]) || ""),
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
            <Image
              src={activeImage}
              alt={activeAlt}
              fill
              sizes="(max-width: 767px) 96vw, 86vw"
              className="gallery-lightbox-image"
              placeholder="blur"
              blurDataURL={galleryBlurDataUrl}
              priority={true}
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
        <div
          className="gallery-mosaic-intro grid max-w-4xl justify-items-center gap-5 pb-8 text-center lg:pb-10"
        >
          <div className="grid justify-items-center gap-5 text-center">
            <p className="section-kicker-dark wedding-type-kicker">{section.eyebrow}</p>
          </div>
          {section.description && (
            <p className="wedding-type-body mx-auto max-w-2xl text-center text-ink/62">
              {section.description}
            </p>
          )}
        </div>

        <div
          className="gallery-mosaic-stage mt-12 lg:mt-14"
        >
          {tiles.map((tile, index) => {
            const hasImage = Boolean(tile.src);
            const style = {
              gridColumn: tile.gridColumn,
              gridRow: tile.gridRow,
            } as CSSProperties;

            return (
              <figure
                key={`${tile.src || "placeholder"}-${index}`}
                className={`gallery-mosaic-tile ${tile.aspectClass} lg:aspect-auto`}
                style={style}
                suppressHydrationWarning
              >
                <motion.button
                  type="button"
                  className={`gallery-mosaic-tile-shell ${hasImage ? "gallery-mosaic-trigger" : ""}`}
                  aria-label={hasImage ? `Mở ảnh cưới ${index + 1}` : undefined}
                  onClick={hasImage ? () => setSelectedImageIndex(index) : undefined}
                  disabled={!hasImage}
                >
                  {hasImage ? (
                    <Image
                      src={tile.src}
                      alt={`${section.imageAltPrefix} ${index + 1}`}
                      className="gallery-mosaic-image"
                      style={{ objectPosition: tile.objectPosition }}
                      fill
                      sizes={getGalleryTileSizes(index)}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL={galleryBlurDataUrl}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="gallery-mosaic-placeholder"
                      style={{ backgroundImage: tile.fallback }}
                    />
                  )}
                </motion.button>
              </figure>
            );
          })}
        </div>
      </div>

      {lightboxHost && lightbox ? createPortal(lightbox, lightboxHost) : null}
    </section>
  );
}
