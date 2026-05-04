"use client";

/* eslint-disable @next/next/no-img-element */

import { motion, type TargetAndTransition } from "framer-motion";
import type { WeddingConfig } from "@/lib/site-settings";

type MediaLayer = WeddingConfig["appearance"]["mediaLayers"]["hero"][number];

type BackgroundMediaLayersProps = {
  layers: MediaLayer[];
  reduceMotion: boolean | null;
  className?: string;
};

function animationFor(layer: MediaLayer, reduceMotion: boolean | null): TargetAndTransition | undefined {
  if (reduceMotion || layer.animation === "none") return undefined;
  if (layer.animation === "float") return { y: [0, -10, 0], transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } };
  if (layer.animation === "fade") return { opacity: [layer.opacity, Math.max(layer.opacity - 0.18, 0.12), layer.opacity], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } };
  return { scale: [1, 1.035, 1.015], transition: { duration: 14, repeat: Infinity, ease: "easeInOut" } };
}

function mediaStyle(layer: MediaLayer, device: "desktop" | "mobile") {
  return {
    opacity: layer.opacity,
    objectFit: "cover",
    objectPosition: layer.objectPosition[device],
    transform: `scale(${layer.scale[device]})`,
  } as const;
}

function MediaElement({ layer, device }: { layer: MediaLayer; device: "desktop" | "mobile" }) {
  const src = device === "mobile" ? layer.mobileSrc || layer.src : layer.src;
  const className = "h-full w-full";

  if (!src) return null;

  if (layer.type === "video") {
    return (
      <video
        src={src}
        className={className}
        style={mediaStyle(layer, device)}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
  }

  return <img src={src} alt={layer.alt} className={className} style={mediaStyle(layer, device)} />;
}

export function BackgroundMediaLayers({ layers, reduceMotion, className = "" }: BackgroundMediaLayersProps) {
  if (!layers.length) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`} aria-hidden="true">
      {layers.map((layer) => (
        <motion.div key={layer.id} className="absolute inset-0" animate={animationFor(layer, reduceMotion)}>
          <div className="absolute inset-0 sm:hidden">
            <MediaElement layer={layer} device="mobile" />
          </div>
          <div className="absolute inset-0 hidden sm:block">
            <MediaElement layer={layer} device="desktop" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
