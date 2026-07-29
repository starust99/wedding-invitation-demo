"use client";

import React, { useEffect, useRef } from "react";

const TOTAL_FRAMES = 109;
const FRAME_RATE = 18; // 18 frames per second (exact 6.05s video duration)
const FRAME_DURATION = 1000 / FRAME_RATE; // ~55.5ms per frame

interface SplashSequencePlayerProps {
  variant: "mobile" | "desktop";
  isPlaying: boolean;
  onEnded?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SplashSequencePlayer({
  variant,
  isPlaying,
  onEnded,
  className = "",
  style,
}: SplashSequencePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const hasEndedRef = useRef(false);

  useEffect(() => {
    // 1. Preload image sequence into memory
    const images: HTMLImageElement[] = [];
    const folder = variant === "mobile" ? "splash-frames-mobile" : "splash-frames-desktop";

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(3, "0");
      img.src = `/assets/${folder}/frame_${numStr}.webp`;
      images.push(img);
    }
    imagesRef.current = images;

    // Draw frame 1 as static preview on load
    const firstImg = images[0];
    const drawFirst = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (firstImg.naturalWidth > 0) {
        canvas.width = firstImg.naturalWidth;
        canvas.height = firstImg.naturalHeight;
        ctx.drawImage(firstImg, 0, 0);
      }
    };

    if (firstImg.complete) {
      drawFirst();
    } else {
      firstImg.onload = drawFirst;
    }
  }, [variant]);

  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let startTime: number | null = null;
    hasEndedRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      const frameIndex = Math.min(
        Math.floor(elapsed / FRAME_DURATION),
        TOTAL_FRAMES - 1
      );
      const currentImg = imagesRef.current[frameIndex];

      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        if (canvas.width !== currentImg.naturalWidth) {
          canvas.width = currentImg.naturalWidth;
          canvas.height = currentImg.naturalHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);
      }

      if (frameIndex >= TOTAL_FRAMES - 1) {
        if (!hasEndedRef.current) {
          hasEndedRef.current = true;
          if (onEnded) onEnded();
        }
      } else {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, onEnded]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
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
