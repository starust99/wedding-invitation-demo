"use client";

import React, { useEffect, useRef } from "react";
import { GlobalImageCache } from "@/lib/global-image-cache";

const TOTAL_FRAMES = 108;
const FRAME_RATE = 12; // 12 frames per second
const FRAME_DURATION = 1000 / FRAME_RATE; // 83.33ms per frame for full 9.0s duration
const GHOST_WINDOW = 12; // 12 frames (1.0s) ghost shadow blur window at loop junction

export function RoadSequencePlayer({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    // 1. Get pre-decoded images from GlobalImageCache or fallback load
    const images: HTMLImageElement[] = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const numStr = String(i).padStart(3, "0");
      const src = `/assets/timeline-frames/frame_${numStr}.webp`;
      const cached = GlobalImageCache.get(src);
      if (cached) {
        images.push(cached);
      } else {
        const img = new Image();
        img.src = src;
        images.push(img);
        GlobalImageCache.preload(src);
      }
    }
    imagesRef.current = images;

    // 2. Pure Forward Canvas Loop (0 -> 107 -> 0) with Ghost Shadow Blur Loop Transition
    let animId: number;
    let startTime: number | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // 100% Forward direction always (0 -> 107 -> 0)
      const exactFrame = (elapsed / FRAME_DURATION) % TOTAL_FRAMES;
      const frameIndex = Math.floor(exactFrame);
      const currentImg = imagesRef.current[frameIndex];

      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        if (canvas.width !== currentImg.naturalWidth) {
          canvas.width = currentImg.naturalWidth;
          canvas.height = currentImg.naturalHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate ghost shadow blur factor near loop junction
        // End window: frames (TOTAL_FRAMES - GHOST_WINDOW)..107
        // Start window: frames 0..GHOST_WINDOW
        const isEndWindow = frameIndex >= TOTAL_FRAMES - GHOST_WINDOW;
        const isStartWindow = frameIndex <= GHOST_WINDOW;

        let blurPx = 0;
        if (isEndWindow && "filter" in ctx) {
          const progress = (frameIndex - (TOTAL_FRAMES - GHOST_WINDOW)) / GHOST_WINDOW;
          blurPx = progress * 1.2; // 0px to 1.2px ultra-subtle ghost blur
          ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
        } else if (isStartWindow && "filter" in ctx) {
          const progress = 1.0 - (frameIndex / GHOST_WINDOW);
          blurPx = progress * 1.2; // 1.2px to 0px ultra-subtle unblur
          ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
        } else if ("filter" in ctx) {
          ctx.filter = "none";
        }

        // Base layer: draw current frame
        ctx.globalAlpha = 1.0;
        ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);

        // Ghost shadow overlay blending at the end of cycle (blends frame 0 over frame 96..107)
        if (isEndWindow) {
          const progress = (frameIndex - (TOTAL_FRAMES - GHOST_WINDOW)) / GHOST_WINDOW;
          const smoothAlpha = progress * progress * (3 - 2 * progress); // Smoothstep S-curve
          const firstImg = imagesRef.current[0];
          if (firstImg && firstImg.complete) {
            ctx.globalAlpha = smoothAlpha;
            ctx.drawImage(firstImg, 0, 0, canvas.width, canvas.height);
          }
        }

        if ("filter" in ctx) {
          ctx.filter = "none";
        }
        ctx.globalAlpha = 1.0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        objectFit: "contain",
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
}
