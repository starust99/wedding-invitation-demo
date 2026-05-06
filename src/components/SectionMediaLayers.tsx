"use client";

import { motion } from "framer-motion";
import type { WeddingConfig } from "@/lib/site-settings";

type MediaSectionKey = keyof WeddingConfig["appearance"]["mediaLayers"];
type MediaLayer = WeddingConfig["appearance"]["mediaLayers"]["hero"][number];

function layerAnimation(layer: MediaLayer, scale: number) {
  if (layer.animation === "slowZoom") {
    return { scale: [scale, scale * 1.045, scale] };
  }

  if (layer.animation === "float") {
    return { y: [0, -14, 0], scale };
  }

  if (layer.animation === "fade") {
    return { opacity: [layer.opacity * 0.72, layer.opacity, layer.opacity * 0.72], scale };
  }

  return { scale, opacity: layer.opacity };
}

function MediaAsset({ layer, mobile = false }: { layer: MediaLayer; mobile?: boolean }) {
  const src = mobile ? layer.mobileSrc || layer.src : layer.src;
  const scale = mobile ? layer.scale.mobile : layer.scale.desktop;
  const objectPosition = mobile ? layer.objectPosition.mobile : layer.objectPosition.desktop;

  if (!src) return null;

  const className = [
    "absolute inset-0 h-full w-full object-cover",
    mobile ? "sm:hidden" : "hidden sm:block",
  ].join(" ");

  if (layer.type === "video") {
    return (
      <video
        src={src}
        muted
        playsInline
        loop
        preload="metadata"
        className={className}
        style={{ opacity: layer.opacity, objectPosition, transform: `scale(${scale})` }}
      />
    );
  }

  return (
    <motion.img
      src={src}
      alt=""
      className={className}
      style={{ opacity: layer.opacity, objectPosition }}
      initial={{ scale, opacity: layer.opacity }}
      animate={layerAnimation(layer, scale)}
      transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      draggable={false}
    />
  );
}

export function SectionMediaLayers({
  config,
  section,
  className = "",
}: {
  config: WeddingConfig;
  section: MediaSectionKey;
  className?: string;
}) {
  const layers = config.appearance.mediaLayers[section].filter((layer) => layer.src || layer.mobileSrc);

  if (layers.length === 0) return null;

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {layers.map((layer) => (
        <div key={layer.id} className="absolute inset-0">
          <MediaAsset layer={layer} />
          <MediaAsset layer={layer} mobile />
        </div>
      ))}
    </div>
  );
}
