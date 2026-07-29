"use client";

import React, { useEffect, useRef } from "react";

const TOTAL_FRAMES = 108;
const FRAME_RATE = 12; // 12 frames per second
const FRAME_DURATION = 1000 / FRAME_RATE; // 83.33ms per frame
const CYCLE_STEPS = (TOTAL_FRAMES - 1) * 2; // 214 steps for continuous forward-reverse boomerang cycle

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

    // 2. High-performance Boomerang Canvas Loop (0 -> 107 -> 0) with Ghost Blur Turnaround
    let animId: number;
    let startTime: number | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Calculate boomerang cycle step (0 -> 214)
      const step = Math.floor(elapsed / FRAME_DURATION) % CYCLE_STEPS;
      const frameIndex = step < TOTAL_FRAMES ? step : CYCLE_STEPS - step;
      const currentImg = imagesRef.current[frameIndex];

      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        if (canvas.width !== currentImg.naturalWidth) {
          canvas.width = currentImg.naturalWidth;
          canvas.height = currentImg.naturalHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Turnaround ghost blur effect near endpoints (frames 102..107 and 0..5)
        const distFromTurnaround = Math.min(frameIndex, TOTAL_FRAMES - 1 - frameIndex);
        const isTurnaround = distFromTurnaround <= 6;

        if (isTurnaround && "filter" in ctx) {
          const blurAmount = ((6 - distFromTurnaround) / 6) * 2.5; // 0px to 2.5px dreamlike soft ghost blur
          ctx.filter = `blur(${blurAmount.toFixed(1)}px)`;
        } else if ("filter" in ctx) {
          ctx.filter = "none";
        }

        // Draw current frame
        ctx.globalAlpha = 1.0;
        ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);

        // Add soft ghost shadow layer during turnaround for ultra-poetic morphing
        if (isTurnaround) {
          const ghostAlpha = ((6 - distFromTurnaround) / 6) * 0.3;
          const ghostFrameIndex = frameIndex > 50 ? TOTAL_FRAMES - 1 : 0;
          const ghostImg = imagesRef.current[ghostFrameIndex];
          if (ghostImg && ghostImg.complete) {
            ctx.globalAlpha = ghostAlpha;
            ctx.drawImage(ghostImg, 0, 0, canvas.width, canvas.height);
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
