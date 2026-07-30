"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { GlobalImageCache } from "@/lib/global-image-cache";

const TOTAL_FRAMES = 108;
const FRAME_RATE = 12;
const FRAME_DURATION = 1000 / FRAME_RATE;
const GHOST_WINDOW = 12;
const WARMUP_CONCURRENCY = 6;
const DECODE_CONCURRENCY = 8;

const FRAME_SRCS = Array.from({ length: TOTAL_FRAMES }, (_, index) => {
  const frameNumber = String(index + 1).padStart(3, "0");
  return `/assets/timeline-frames/frame_${frameNumber}.webp`;
});

let timelineWarmupPromise: Promise<void> | null = null;

function warmTimelineFrameBytes() {
  if (timelineWarmupPromise) return timelineWarmupPromise;

  timelineWarmupPromise = (async () => {
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < FRAME_SRCS.length) {
        const src = FRAME_SRCS[nextIndex++];
        try {
          const response = await fetch(src, { cache: "force-cache" });
          if (response.ok) {
            // Consume the body so embedded browsers commit the complete frame
            // to their HTTP cache. The bytes are not retained in JS memory.
            await response.arrayBuffer();
          }
        } catch {
          // The decoded loader retries any frame that did not warm successfully.
        }
      }
    };

    await Promise.all(
      Array.from({ length: WARMUP_CONCURRENCY }, () => worker()),
    );
  })();

  return timelineWarmupPromise;
}

export function RoadSequencePlayer({
  className = "",
  style,
  onReady,
}: {
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Array<HTMLImageElement | undefined>>(
    new Array(TOTAL_FRAMES),
  );
  const decodeStartedRef = useRef(false);
  const cancelledRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isReady && onReady) {
      onReady();
    }
  }, [isReady, onReady]);

  const drawFrame = useCallback((image: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas || image.naturalWidth <= 0) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    if (
      canvas.width !== image.naturalWidth ||
      canvas.height !== image.naturalHeight
    ) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1;
    context.filter = "none";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  }, []);

  const decodeTimelineFrames = useCallback(async () => {
    if (decodeStartedRef.current || isReady) return;
    decodeStartedRef.current = true;

    // Finish the network-only warmup before creating 108 decoded images. This
    // prevents WebKit from issuing a second competing request for the same
    // frame while the first one is still in flight.
    await warmTimelineFrameBytes();

    while (!cancelledRef.current) {
      const pendingIndexes = FRAME_SRCS.map((_, index) => index).filter(
        (index) => !imagesRef.current[index],
      );
      if (pendingIndexes.length === 0) {
        setIsReady(true);
        break;
      }

      let nextPending = 0;
      const worker = async () => {
        while (
          nextPending < pendingIndexes.length &&
          !cancelledRef.current
        ) {
          const frameIndex = pendingIndexes[nextPending++];
          try {
            const image = await GlobalImageCache.preloadRequired(
              FRAME_SRCS[frameIndex],
            );
            imagesRef.current[frameIndex] = image;
            if (frameIndex === 0) drawFrame(image);
          } catch {
            // Leave this slot empty. The next pass retries only missing frames.
          }
        }
      };

      await Promise.all(
        Array.from({ length: DECODE_CONCURRENCY }, () => worker()),
      );

      if (imagesRef.current.every(Boolean)) {
        setIsReady(true);
        break;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1_000));
    }

    decodeStartedRef.current = false;
  }, [drawFrame, isReady]);

  useEffect(() => {
    cancelledRef.current = false;

    const cachedFirstFrame = GlobalImageCache.get(FRAME_SRCS[0]);
    if (cachedFirstFrame) {
      imagesRef.current[0] = cachedFirstFrame;
      drawFrame(cachedFirstFrame);
    }

    const handleWarmup = () => {
      void warmTimelineFrameBytes();
    };
    const handleDecode = () => {
      void warmTimelineFrameBytes();
      void decodeTimelineFrames();
    };

    window.addEventListener("weddingTimelineWarmup", handleWarmup);
    window.addEventListener("weddingTimelineDecode", handleDecode);

    const initialCheck = window.setTimeout(() => {
      const splashSkipped =
        document.documentElement.classList.contains("splash-skipped");
      const splashMissing = !document.getElementById("wedding-splash-screen");
      if (splashSkipped || splashMissing) handleDecode();
    }, 0);

    return () => {
      cancelledRef.current = true;
      window.clearTimeout(initialCheck);
      window.removeEventListener("weddingTimelineWarmup", handleWarmup);
      window.removeEventListener("weddingTimelineDecode", handleDecode);
    };
  }, [decodeTimelineFrames, drawFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(Boolean(entry?.isIntersecting)),
      { rootMargin: "700px 0px" },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isReady || !isNearViewport || prefersReducedMotion) return;

    let animationId = 0;
    let startTime: number | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const render = (timestamp: number) => {
      if (document.hidden) {
        startTime = null;
        animationId = window.requestAnimationFrame(render);
        return;
      }
      if (startTime === null) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const frameIndex = Math.floor(elapsed / FRAME_DURATION) % TOTAL_FRAMES;
      const currentImage = imagesRef.current[frameIndex];

      if (currentImage) {
        if (
          canvas.width !== currentImage.naturalWidth ||
          canvas.height !== currentImage.naturalHeight
        ) {
          canvas.width = currentImage.naturalWidth;
          canvas.height = currentImage.naturalHeight;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        const isEndWindow = frameIndex >= TOTAL_FRAMES - GHOST_WINDOW;
        const isStartWindow = frameIndex <= GHOST_WINDOW;

        if (isEndWindow) {
          const progress =
            (frameIndex - (TOTAL_FRAMES - GHOST_WINDOW)) / GHOST_WINDOW;
          context.filter = `blur(${(progress * 1.2).toFixed(1)}px)`;
        } else if (isStartWindow) {
          const progress = 1 - frameIndex / GHOST_WINDOW;
          context.filter = `blur(${(progress * 1.2).toFixed(1)}px)`;
        } else {
          context.filter = "none";
        }

        context.globalAlpha = 1;
        context.drawImage(
          currentImage,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        if (isEndWindow) {
          const progress =
            (frameIndex - (TOTAL_FRAMES - GHOST_WINDOW)) / GHOST_WINDOW;
          const smoothAlpha = progress * progress * (3 - 2 * progress);
          const firstImage = imagesRef.current[0];
          if (firstImage) {
            context.globalAlpha = smoothAlpha;
            context.drawImage(
              firstImage,
              0,
              0,
              canvas.width,
              canvas.height,
            );
          }
        }

        context.filter = "none";
        context.globalAlpha = 1;
      }

      animationId = window.requestAnimationFrame(render);
    };

    animationId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationId);
  }, [isNearViewport, isReady, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} timeline-road-motion ${isReady ? "is-ready" : ""}`}
      aria-hidden="true"
      style={{
        objectFit: "cover",
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
}
