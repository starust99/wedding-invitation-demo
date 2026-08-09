"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import {
  galleryMosaicSlotCount,
  getGalleryMosaicSlots,
  resolveResponsiveGalleryLayouts,
  type GalleryPlacement,
} from "@/config/gallery-mosaic";
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

function getPlacementSpan(placement: GalleryPlacement, columnCount: number) {
  const spanMatch = placement.gridColumn.match(/span\s+(\d+)/i);
  if (spanMatch) return Math.min(columnCount, Math.max(1, Number(spanMatch[1])));

  const edgeMatch = placement.gridColumn.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
  if (edgeMatch) return Math.min(columnCount, Math.max(1, Number(edgeMatch[2]) - Number(edgeMatch[1])));

  return columnCount;
}

function getResponsiveTileSizes(placements: Record<"mobile" | "tablet" | "desktop", GalleryPlacement>) {
  const mobileWidth = Math.ceil((getPlacementSpan(placements.mobile, 4) / 4) * 100);
  const tabletWidth = Math.ceil((getPlacementSpan(placements.tablet, 8) / 8) * 100);
  const desktopWidth = Math.ceil((getPlacementSpan(placements.desktop, 12) / 12) * 100);

  return `(max-width: 767px) ${mobileWidth}vw, (max-width: 1023px) ${tabletWidth}vw, ${desktopWidth}vw`;
}

const galleryContainerVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

const galleryTileVariant: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.18,
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const galleryIntroVariant: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function GallerySection({ config }: { config: WeddingConfig }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [lightboxImageLoaded, setLightboxImageLoaded] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLElement>(null);
  const lightboxHistoryActiveRef = useRef(false);
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
  const galleryLayouts = useMemo(
    () => resolveResponsiveGalleryLayouts(config.appearance.galleryLayouts, config.appearance.galleryLayout),
    [config.appearance.galleryLayout, config.appearance.galleryLayouts],
  );
  const slotsByViewport = useMemo(
    () => ({
      mobile: getGalleryMosaicSlots(galleryLayouts.mobile),
      tablet: getGalleryMosaicSlots(galleryLayouts.tablet),
      desktop: getGalleryMosaicSlots(galleryLayouts.desktop),
    }),
    [galleryLayouts],
  );
  const tiles = useMemo(
    () => slotsByViewport.desktop.map((layout, index) => ({
      ...layout,
      placements: {
        mobile: slotsByViewport.mobile[index].placements.mobile,
        tablet: slotsByViewport.tablet[index].placements.tablet,
        desktop: slotsByViewport.desktop[index].placements.desktop,
      },
      src: images[index] ?? "",
      objectPosition: positions[index] ?? "center center",
    })),
    [images, positions, slotsByViewport],
  );
  const activeImage = selectedImageIndex === null || selectedImageIndex >= images.length ? "" : images[selectedImageIndex] || "";
  const activeAlt = activeImage && selectedImageIndex !== null ? `${section.imageAltPrefix} ${selectedImageIndex + 1}` : "";

  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateLightboxDimensions = useCallback(() => {
    if (!constraintsRef.current) return;
    const rect = constraintsRef.current.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    setScale(1);
    setDimensions({ width: 0, height: 0 });
    setLightboxImageLoaded(false);
  }, [selectedImageIndex]);

  useEffect(() => {
    if (!activeImage) return;

    updateLightboxDimensions();
    const timer = setTimeout(updateLightboxDimensions, 100);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateLightboxDimensions);
    if (constraintsRef.current) observer?.observe(constraintsRef.current);

    window.addEventListener("resize", updateLightboxDimensions);
    return () => {
      window.removeEventListener("resize", updateLightboxDimensions);
      observer?.disconnect();
      clearTimeout(timer);
    };
  }, [activeImage, selectedImageIndex, updateLightboxDimensions]);

  const dragConstraints = useMemo(() => {
    if (scale <= 1 || dimensions.width === 0) {
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }
    const overflowX = (dimensions.width * (scale - 1)) / 2;
    const overflowY = (dimensions.height * (scale - 1)) / 2;
    return {
      left: -overflowX,
      right: overflowX,
      top: -overflowY,
      bottom: overflowY,
    };
  }, [scale, dimensions]);

  const stepZoomIn = useCallback((currentScale: number): number => {
    const next = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5].find((lvl) => lvl > currentScale + 0.05);
    return next ?? 3.5;
  }, []);

  const stepZoomOut = useCallback((currentScale: number): number => {
    const prev = [3.5, 3.0, 2.5, 2.0, 1.5, 1.0].find((lvl) => lvl < currentScale - 0.05);
    return prev ?? 1.0;
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => stepZoomIn(prev));
  }, [stepZoomIn]);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => stepZoomOut(prev));
  }, [stepZoomOut]);

  const initialPinchDistRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastWheelTimeRef = useRef<number>(0);
  const lastPinchStepTimeRef = useRef<number>(0);

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handlePinchTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      initialPinchDistRef.current = dist;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        setScale((prev) => (prev > 1.2 ? 1 : 2.5));
      }
      lastTapTimeRef.current = now;
    }
  }, []);

  const handlePinchTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const currentDist = getTouchDistance(e.touches);
      if (initialPinchDistRef.current > 0) {
        const ratio = currentDist / initialPinchDistRef.current;
        const now = Date.now();

        if (ratio > 1.22 && now - lastPinchStepTimeRef.current > 180) {
          setScale((prev) => stepZoomIn(prev));
          initialPinchDistRef.current = currentDist;
          lastPinchStepTimeRef.current = now;
        } else if (ratio < 0.82 && now - lastPinchStepTimeRef.current > 180) {
          setScale((prev) => stepZoomOut(prev));
          initialPinchDistRef.current = currentDist;
          lastPinchStepTimeRef.current = now;
        }
      }
    }
  }, [stepZoomIn, stepZoomOut]);

  const handlePinchTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistRef.current = null;
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.cancelable) e.preventDefault();
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 160) return;
    lastWheelTimeRef.current = now;

    if (e.deltaY < 0) {
      setScale((prev) => stepZoomIn(prev));
    } else if (e.deltaY > 0) {
      setScale((prev) => stepZoomOut(prev));
    }
  }, [stepZoomIn, stepZoomOut]);

  const closeLightbox = useCallback(() => {
    if (
      lightboxHistoryActiveRef.current &&
      window.history.state?.weddingGalleryLightbox === true
    ) {
      window.history.back();
      return;
    }

    lightboxHistoryActiveRef.current = false;
    setSelectedImageIndex(null);
  }, []);

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

  const isLightboxOpen = Boolean(activeImage);

  useEffect(() => {
    if (!isLightboxOpen) return;

    if (!lightboxHistoryActiveRef.current) {
      window.history.pushState(
        {
          ...(window.history.state ?? {}),
          weddingGalleryLightbox: true,
        },
        "",
        window.location.href,
      );
      lightboxHistoryActiveRef.current = true;
    }

    const handlePopState = () => {
      lightboxHistoryActiveRef.current = false;
      setSelectedImageIndex(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isLightboxOpen]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousRootOverscroll = root.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    root.style.overscrollBehavior = "none";
    root.classList.add("gallery-lightbox-open");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    const blockGlobalScrollAndZoom = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", blockGlobalScrollAndZoom, { passive: false });
    window.addEventListener("touchmove", blockGlobalScrollAndZoom, { passive: false });
    window.addEventListener("gesturestart", blockGlobalScrollAndZoom, { passive: false });
    window.addEventListener("gesturechange", blockGlobalScrollAndZoom, { passive: false });
    window.addEventListener("gestureend", blockGlobalScrollAndZoom, { passive: false });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      root.style.overscrollBehavior = previousRootOverscroll;
      root.classList.remove("gallery-lightbox-open");

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", blockGlobalScrollAndZoom);
      window.removeEventListener("touchmove", blockGlobalScrollAndZoom);
      window.removeEventListener("gesturestart", blockGlobalScrollAndZoom);
      window.removeEventListener("gesturechange", blockGlobalScrollAndZoom);
      window.removeEventListener("gestureend", blockGlobalScrollAndZoom);
    };
  }, [isLightboxOpen, closeLightbox, showNext, showPrevious]);

  const lightbox = (
    <AnimatePresence>
      {activeImage && (
        <motion.div
          ref={lightboxRef}
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh cưới phóng lớn"
          onClick={closeLightbox}
          style={{
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          <button
            type="button"
            className="gallery-lightbox-close"
            aria-label="Đóng ảnh"
            onClick={(event) => {
              event.stopPropagation();
              closeLightbox();
            }}
          >
            <X aria-hidden="true" size={22} />
          </button>

          <motion.figure
            ref={constraintsRef}
            key={`lightbox-img-${selectedImageIndex}`}
            className="gallery-lightbox-frame"
            aria-busy={!lightboxImageLoaded}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handlePinchTouchStart}
            onTouchMove={handlePinchTouchMove}
            onTouchEnd={handlePinchTouchEnd}
            onTouchCancel={handlePinchTouchEnd}
            onWheel={handleWheel}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
          >
            <motion.img
              src={activeImage}
              alt={activeAlt}
              className="gallery-lightbox-image origin-center"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={() => {
                setLightboxImageLoaded(true);
                updateLightboxDimensions();
              }}
              animate={{ 
                opacity: lightboxImageLoaded ? 1 : 0,
                scale: scale,
                x: scale === 1 ? 0 : undefined,
                y: scale === 1 ? 0 : undefined
              }}
              drag={scale > 1}
              dragConstraints={dragConstraints}
              dragElastic={0.08}
              dragMomentum={false}
              dragPropagation={false}
              draggable={false}
            />
          </motion.figure>

          {/* Unified controls panel at the bottom */}
          <div 
            className="gallery-lightbox-controls"
            onClick={(event) => event.stopPropagation()}
          >
            {availableImageIndexes.length > 1 ? (
              <button
                type="button"
                className="gallery-lightbox-btn"
                aria-label="Ảnh trước"
                onClick={showPrevious}
              >
                <ChevronLeft aria-hidden="true" size={20} />
              </button>
            ) : null}

            <button
              type="button"
              className="gallery-lightbox-btn"
              aria-label="Thu nhỏ"
              disabled={scale <= 1}
              onClick={handleZoomOut}
            >
              <ZoomOut aria-hidden="true" size={20} />
            </button>

            <button
              type="button"
              className="gallery-lightbox-btn"
              aria-label="Phóng to"
              disabled={scale >= 3.5}
              onClick={handleZoomIn}
            >
              <ZoomIn aria-hidden="true" size={20} />
            </button>

            {availableImageIndexes.length > 1 ? (
              <button
                type="button"
                className="gallery-lightbox-btn"
                aria-label="Ảnh sau"
                onClick={showNext}
              >
                <ChevronRight aria-hidden="true" size={20} />
              </button>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section id="gallery" className="gallery-mosaic-section cinematic-stage relative px-3 py-28 text-ink sm:px-8 sm:py-32 lg:py-36">
      <SectionMediaLayers config={config} section="gallery" className="gallery-mosaic-media opacity-[0.1]" />
      <div aria-hidden="true" className="paper-grain-luxury gallery-mosaic-grain opacity-15" />

      <div className="gallery-mosaic-shell mx-auto max-w-7xl">
        <div className="gallery-mosaic-stage mt-12 lg:mt-14">
          {/* Header inside the card */}
          <motion.div
            className="flex flex-col items-center text-center w-full px-4 pt-6 pb-6 md:pt-8 md:pb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
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

          </motion.div>

          <motion.div
            className="gallery-mosaic-grid"
            data-gallery-layout-mobile={galleryLayouts.mobile}
            data-gallery-layout-tablet={galleryLayouts.tablet}
            data-gallery-layout-desktop={galleryLayouts.desktop}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={galleryContainerVariant}
          >
            {tiles.map((tile, index) => {
              const hasImage = Boolean(tile.src);
              const style = {
                "--gallery-column-mobile": tile.placements.mobile.gridColumn,
                "--gallery-row-mobile": tile.placements.mobile.gridRow,
                "--gallery-column-tablet": tile.placements.tablet.gridColumn,
                "--gallery-row-tablet": tile.placements.tablet.gridRow,
                "--gallery-column-desktop": tile.placements.desktop.gridColumn,
                "--gallery-row-desktop": tile.placements.desktop.gridRow,
              } as CSSProperties;

              return (
                <motion.figure
                  key={`${tile.src || "placeholder"}-${index}`}
                  className="gallery-mosaic-tile"
                  style={style}
                  custom={index}
                  variants={galleryTileVariant}
                  suppressHydrationWarning
                >
                  <button
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
                        fill
                        sizes={getResponsiveTileSizes(tile.placements)}
                        placeholder="blur"
                        blurDataURL={galleryBlurDataUrl}
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
