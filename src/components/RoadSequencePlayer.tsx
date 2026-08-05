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
const DECODE_CONCURRENCY = 4;
const BUFFER_LOOK_BEHIND = 3;
const BUFFER_LOOK_AHEAD = 20;
const VIEWPORT_ZOOM_THRESHOLD = 1.02;
const VIEWPORT_ZOOM_SETTLE_MS = 400;

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
  const imagesRef = useRef(new Map<number, HTMLImageElement>());
  const imagePromisesRef = useRef(new Map<number, Promise<HTMLImageElement>>());
  const pendingBufferCenterRef = useRef<number | null>(null);
  const bufferUpdateRunningRef = useRef(false);
  const decodeStartedRef = useRef(false);
  const readyRef = useRef(false);
  const cancelledRef = useRef(false);
  const playbackElapsedRef = useRef(0);
  const lastAnimationTickRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isViewportZoomed, setIsViewportZoomed] = useState(false);
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

  const loadFrame = useCallback((frameIndex: number) => {
    const cachedFrame = imagesRef.current.get(frameIndex);
    if (cachedFrame) return Promise.resolve(cachedFrame);

    const pendingFrame = imagePromisesRef.current.get(frameIndex);
    if (pendingFrame) return pendingFrame;

    const src = FRAME_SRCS[frameIndex];
    const globallyCachedFrame = GlobalImageCache.get(src);
    if (globallyCachedFrame?.complete && globallyCachedFrame.naturalWidth > 0) {
      imagesRef.current.set(frameIndex, globallyCachedFrame);
      return Promise.resolve(globallyCachedFrame);
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        const finish = () => {
          if (image.naturalWidth <= 0) {
            reject(new Error(`Timeline frame has no dimensions: ${src}`));
            return;
          }
          if (!cancelledRef.current) imagesRef.current.set(frameIndex, image);
          resolve(image);
        };
        if (typeof image.decode === "function") {
          image.decode().then(finish).catch(finish);
        } else {
          finish();
        }
      };
      image.onerror = () => reject(new Error(`Unable to load timeline frame: ${src}`));
      image.src = src;
    }).finally(() => {
      imagePromisesRef.current.delete(frameIndex);
    });

    imagePromisesRef.current.set(frameIndex, promise);
    return promise;
  }, []);

  const getBufferIndexes = useCallback((centerIndex: number) => {
    const ordered: number[] = [];
    const included = new Set<number>();
    const add = (index: number) => {
      const normalized = (index + TOTAL_FRAMES) % TOTAL_FRAMES;
      if (!included.has(normalized)) {
        included.add(normalized);
        ordered.push(normalized);
      }
    };

    add(centerIndex);
    for (let offset = 1; offset <= BUFFER_LOOK_AHEAD; offset += 1) {
      add(centerIndex + offset);
    }
    // The first frames are permanently available for the end-of-loop blend.
    for (let index = 0; index < LOOP_OVERLAP_FRAMES; index += 1) add(index);
    for (let offset = 1; offset <= BUFFER_LOOK_BEHIND; offset += 1) {
      add(centerIndex - offset);
    }

    return ordered;
  }, []);

  const ensureBuffer = useCallback(async (centerIndex: number) => {
    const desiredIndexes = getBufferIndexes(centerIndex);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < desiredIndexes.length && !cancelledRef.current) {
        const frameIndex = desiredIndexes[nextIndex++];
        try {
          await loadFrame(frameIndex);
        } catch {
          // A later buffer pass retries frames that failed in a flaky WebView.
        }
      }
    };

    await Promise.all(
      Array.from({ length: DECODE_CONCURRENCY }, () => worker()),
    );

    if (cancelledRef.current) return;
    const retainedIndexes = new Set(getBufferIndexes(centerIndex));
    for (const frameIndex of imagesRef.current.keys()) {
      if (!retainedIndexes.has(frameIndex)) imagesRef.current.delete(frameIndex);
    }
  }, [getBufferIndexes, loadFrame]);

  const scheduleBuffer = useCallback((centerIndex: number) => {
    pendingBufferCenterRef.current = centerIndex;
    if (bufferUpdateRunningRef.current) return;

    bufferUpdateRunningRef.current = true;
    void (async () => {
      while (
        pendingBufferCenterRef.current !== null &&
        !cancelledRef.current
      ) {
        const nextCenter = pendingBufferCenterRef.current;
        pendingBufferCenterRef.current = null;
        await ensureBuffer(nextCenter);
      }
      bufferUpdateRunningRef.current = false;
    })();
  }, [ensureBuffer]);

  const decodeTimelineFrames = useCallback(async () => {
    if (decodeStartedRef.current || readyRef.current) return;
    decodeStartedRef.current = true;

    // Warm all encoded bytes into the browser cache, then decode only a small
    // rolling window. This keeps all 108 frames and the exact loop while
    // avoiding hundreds of MB of simultaneously decoded RGBA data on phones.
    await warmTimelineFrameBytes();

    await ensureBuffer(0);
    const firstFrame = imagesRef.current.get(0);
    if (!cancelledRef.current && firstFrame) {
      drawFrame(firstFrame);
      readyRef.current = true;
      setIsReady(true);
    }

    decodeStartedRef.current = false;
  }, [drawFrame, ensureBuffer]);

  useEffect(() => {
    cancelledRef.current = false;
    const decodedImages = imagesRef.current;
    const pendingImages = imagePromisesRef.current;

    const cachedFirstFrame = GlobalImageCache.get(FRAME_SRCS[0]);
    if (cachedFirstFrame) {
      imagesRef.current.set(0, cachedFirstFrame);
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
      pendingBufferCenterRef.current = null;
      decodedImages.clear();
      pendingImages.clear();
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
    const viewport = window.visualViewport;
    if (!viewport) return;

    let settleTimer: number | null = null;
    const updateZoomState = () => {
      const zoomed = viewport.scale > VIEWPORT_ZOOM_THRESHOLD;
      if (zoomed) {
        if (settleTimer !== null) window.clearTimeout(settleTimer);
        settleTimer = null;
        setIsViewportZoomed(true);
        return;
      }

      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        setIsViewportZoomed(false);
        settleTimer = null;
      }, VIEWPORT_ZOOM_SETTLE_MS);
    };

    updateZoomState();
    viewport.addEventListener("resize", updateZoomState, { passive: true });
    viewport.addEventListener("scroll", updateZoomState, { passive: true });
    return () => {
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      viewport.removeEventListener("resize", updateZoomState);
      viewport.removeEventListener("scroll", updateZoomState);
    };
  }, []);

  useEffect(() => {
    if (
      !isReady ||
      !isNearViewport ||
      prefersReducedMotion ||
      isViewportZoomed
    ) {
      lastAnimationTickRef.current = null;
      return;
    }

    let animationId = 0;
    let lastRenderedKey: string | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const render = (timestamp: number) => {
      if (document.hidden) {
        lastAnimationTickRef.current = null;
        lastRenderedKey = null;
        animationId = window.requestAnimationFrame(render);
        return;
      }
      const previousTick = lastAnimationTickRef.current;
      lastAnimationTickRef.current = timestamp;
      if (previousTick !== null) {
        playbackElapsedRef.current += Math.min(250, timestamp - previousTick);
      }

      const renderFrame = getLoopRenderFrame(playbackElapsedRef.current);

      if (renderFrame.key === lastRenderedKey) {
        animationId = window.requestAnimationFrame(render);
        return;
      }

      scheduleBuffer(renderFrame.primaryIndex);

      const currentImage = imagesRef.current.get(renderFrame.primaryIndex);

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
            : imagesRef.current.get(renderFrame.secondaryIndex);

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
    return () => {
      lastAnimationTickRef.current = null;
      window.cancelAnimationFrame(animationId);
    };
  }, [isNearViewport, isReady, isViewportZoomed, prefersReducedMotion, scheduleBuffer]);

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
