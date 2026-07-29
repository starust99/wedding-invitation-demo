"use client";

import React, { useEffect, useRef } from "react";

const TOTAL_FRAMES = 108;
const FRAME_RATE = 12; // 12 frames per second
const FRAME_DURATION = 1000 / FRAME_RATE; // 83.33ms per frame
const CROSSFADE_FRAMES = 20; // 20 frames = 1.66s ultra-smooth realtime alpha blend at loop junction

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
    // 1. Preload image sequence into memory
    const images: HTMLImageElement[] = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(3, "0");
      img.src = `/assets/timeline-frames/frame_${numStr}.webp`;
      images.push(img);
    }
    imagesRef.current = images;

    // 2. High-performance requestAnimationFrame Canvas Loop
    let animId: number;
    let startTime: number | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      const exactFrame = (elapsed / FRAME_DURATION) % TOTAL_FRAMES;
      const frameIndex = Math.floor(exactFrame);
      const currentImg = imagesRef.current[frameIndex];

      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        if (canvas.width !== currentImg.naturalWidth) {
          canvas.width = currentImg.naturalWidth;
          canvas.height = currentImg.naturalHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Base layer: draw current frame
        ctx.globalAlpha = 1.0;
        ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);

        // Realtime Alpha Crossfade near loop junction (frames 88..107 -> frames 0..19)
        const fadeStartFrame = TOTAL_FRAMES - CROSSFADE_FRAMES;
        if (frameIndex >= fadeStartFrame) {
          const fadeProgress = (frameIndex - fadeStartFrame) / CROSSFADE_FRAMES;
          const nextFrameIndex = frameIndex - fadeStartFrame;
          const nextImg = imagesRef.current[nextFrameIndex];

          if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) {
            ctx.globalAlpha = Math.min(1.0, Math.max(0.0, fadeProgress));
            ctx.drawImage(nextImg, 0, 0, canvas.width, canvas.height);
          }
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
