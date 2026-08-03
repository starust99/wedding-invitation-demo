"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { GlobalImageCache } from "@/lib/global-image-cache";

const TOTAL_FRAMES = 108;
const FRAME_RATE = 10;
const FRAME_DURATION = 1000 / FRAME_RATE;
const LOOP_OVERLAP_FRAMES = 7;
const FIRST_CYCLE_DURATION = TOTAL_FRAMES * FRAME_DURATION;
const REPEATING_CYCLE_FRAMES = TOTAL_FRAMES - LOOP_OVERLAP_FRAMES;
const REPEATING_CYCLE_DURATION = REPEATING_CYCLE_FRAMES * FRAME_DURATION;
const WARMUP_CONCURRENCY = 6;
const DECODE_CONCURRENCY = 8;

const FRAME_SRCS = Array.from({ length: TOTAL_FRAMES }, (_, index) => {
  const frameNumber = String(index + 1).padStart(3, "0");
  return `/assets/timeline-frames/frame_${frameNumber}.webp`;
});

let timelineWarmupPromise: Promise<void> | null = null;

function smootherStep(progress: number) {
  const value = Math.min(1, Math.max(0, progress));
  return value * value * value * (value * (value * 6 - 15) + 10);
}

type RenderFrame = {
  primaryIndex: number;
  secondaryIndex?: number;
  secondaryAlpha: number;
  key: string;
};

function getLoopRenderFrame(elapsed: number): RenderFrame {
  if (elapsed < FIRST_CYCLE_DURATION) {
    const firstCycleIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.floor(elapsed / FRAME_DURATION),
    );
    const overlapStart = TOTAL_FRAMES - LOOP_OVERLAP_FRAMES;

    if (firstCycleIndex < overlapStart) {
      return {
        primaryIndex: firstCycleIndex,
        secondaryAlpha: 0,
        key: `first:${firstCycleIndex}`,
      };
    }

    const overlapIndex = firstCycleIndex - overlapStart;
    const progress = overlapIndex / (LOOP_OVERLAP_FRAMES - 1);
    return {
      primaryIndex: firstCycleIndex,
      secondaryIndex: overlapIndex,
      secondaryAlpha: smootherStep(progress),
      key: `first-overlap:${overlapIndex}`,
    };
  }

  const repeatingElapsed =
    (elapsed - FIRST_CYCLE_DURATION) % REPEATING_CYCLE_DURATION;
  const repeatingIndex = Math.floor(repeatingElapsed / FRAME_DURATION);
  const normalFrameCount = TOTAL_FRAMES - LOOP_OVERLAP_FRAMES * 2;

  if (repeatingIndex < normalFrameCount) {
    const primaryIndex = repeatingIndex + LOOP_OVERLAP_FRAMES;
    return {
      primaryIndex,
      secondaryAlpha: 0,
      key: `repeat:${primaryIndex}`,
    };
  }

  const overlapIndex = repeatingIndex - normalFrameCount;
  const progress = overlapIndex / (LOOP_OVERLAP_FRAMES - 1);
  return {
    primaryIndex: TOTAL_FRAMES - LOOP_OVERLAP_FRAMES + overlapIndex,
    secondaryIndex: overlapIndex,
    secondaryAlpha: smootherStep(progress),
    key: `repeat-overlap:${overlapIndex}`,
  };
}

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
    let lastRenderedKey: string | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const render = (timestamp: number) => {
      if (document.hidden) {
        startTime = null;
        lastRenderedKey = null;
        animationId = window.requestAnimationFrame(render);
        return;
      }
      if (startTime === null) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const renderFrame = getLoopRenderFrame(elapsed);

      if (renderFrame.key === lastRenderedKey) {
        animationId = window.requestAnimationFrame(render);
        return;
      }

      const currentImage = imagesRef.current[renderFrame.primaryIndex];

      if (currentImage) {
        if (
          canvas.width !== currentImage.naturalWidth ||
          canvas.height !== currentImage.naturalHeight
        ) {
          canvas.width = currentImage.naturalWidth;
          canvas.height = currentImage.naturalHeight;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.filter = "none";
        const secondaryImage =
          renderFrame.secondaryIndex === undefined
            ? undefined
            : imagesRef.current[renderFrame.secondaryIndex];

        if (secondaryImage && renderFrame.secondaryAlpha >= 1) {
          context.globalAlpha = 1;
          context.drawImage(
            secondaryImage,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        } else {
          context.globalAlpha = 1;
          context.drawImage(
            currentImage,
            0,
            0,
            canvas.width,
            canvas.height,
          );

          if (secondaryImage && renderFrame.secondaryAlpha > 0) {
            context.globalAlpha = renderFrame.secondaryAlpha;
            context.drawImage(
              secondaryImage,
              0,
              0,
              canvas.width,
              canvas.height,
            );
          }
        }

        context.globalAlpha = 1;
        lastRenderedKey = renderFrame.key;
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
