"use client";

/* eslint-disable @next/next/no-img-element */

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";
import { Rnd, type RndResizeCallback } from "react-rnd";
import type {
  EventDetailsAssetConfig,
  EventDetailsAssetSlotId,
  EventDetailsPlacement,
  EventDetailsViewportMode,
} from "@/lib/wedding/event-details-types";

type EventDetailsAssetItemProps = {
  asset: EventDetailsAssetConfig;
  placement: EventDetailsPlacement;
  aspectRatio: number;
  mode: "preview" | "public";
  viewport: EventDetailsViewportMode;
  stageSize?: { width: number; height: number };
  selected?: boolean;
  dragGrid?: [number, number];
  showPlaceholder?: boolean;
  onSelect?: (id: EventDetailsAssetSlotId) => void;
  onPlacementChange?: (id: EventDetailsAssetSlotId, placement: EventDetailsPlacement) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAbsoluteStyle(placement: EventDetailsPlacement, aspectRatio: number): CSSProperties {
  return {
    position: "absolute",
    left: `${placement.x}%`,
    top: `${placement.y}%`,
    width: `${placement.width}%`,
    aspectRatio,
    opacity: placement.opacity,
    zIndex: placement.zIndex,
    mixBlendMode: placement.blendMode,
    transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
  };
}

function MissingAsset({ label }: { label: string }) {
  return (
    <div className="grid h-full w-full place-items-center rounded-[1.5rem] border border-dashed border-text-primary/25 bg-white/20 px-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-text-primary/45">
      {label}
    </div>
  );
}

function SafeImage({
  src,
  alt,
  className,
  decorative = false,
  fallback,
}: {
  src: string;
  alt: string;
  className: string;
  decorative?: boolean;
  fallback?: ReactNode;
}) {
  const [status, setStatus] = useState<"idle" | "loaded" | "failed">("idle");

  if (status === "failed") return fallback ?? null;

  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? "true" : undefined}
      draggable={false}
      className={`${className} ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("failed")}
    />
  );
}

function PlateFrame({
  asset,
  placement,
  mode,
}: {
  asset: EventDetailsAssetConfig;
  placement: EventDetailsPlacement;
  mode: "preview" | "public";
}) {
  const imageClassName = placement.fit === "cover" ? "h-full w-full object-cover" : "h-full w-full object-contain";
  const pointerClassName = mode === "public" ? "pointer-events-none select-none" : "select-none";

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/30 p-2 shadow-[0_24px_80px_rgba(92,82,71,0.12)] backdrop-blur-md ${pointerClassName}`}>
      <SafeImage
        src={asset.src}
        alt={asset.alt}
        className={`h-full w-full rounded-[1.5rem] ${imageClassName}`}
        fallback={
          <div className="h-full w-full rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(250,220,217,0.55),rgba(212,228,247,0.45),rgba(181,213,164,0.34))]" />
        }
      />
    </div>
  );
}

function renderAssetBody(asset: EventDetailsAssetConfig, placement: EventDetailsPlacement, mode: "preview" | "public") {
  const imageClassName = placement.fit === "cover" ? "h-full w-full object-cover" : "h-full w-full object-contain";
  const pointerClassName = mode === "public" ? "pointer-events-none select-none" : "select-none";

  if (!asset.src) return <MissingAsset label={asset.label} />;

  if (asset.id === "detailsVenuePlate" || asset.id === "detailsMapPlate" || asset.id === "detailsDresscodePlate") {
    return <PlateFrame asset={asset} placement={placement} mode={mode} />;
  }

  return (
    <SafeImage
      src={asset.src}
      alt={asset.role === "content" && asset.alt ? asset.alt : ""}
      decorative={asset.role !== "content" || !asset.alt}
      className={`h-full w-full ${imageClassName} ${pointerClassName}`}
      fallback={mode === "preview" ? <MissingAsset label={asset.label} /> : null}
    />
  );
}

export function EventDetailsAssetItem({
  asset,
  placement,
  aspectRatio,
  mode,
  viewport,
  stageSize,
  selected = false,
  dragGrid = [4, 4],
  showPlaceholder = false,
  onSelect,
  onPlacementChange,
}: EventDetailsAssetItemProps) {
  const [resolvedAspectRatio, setResolvedAspectRatio] = useState(aspectRatio);

  useEffect(() => {
    if (!asset.src) return;

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled || !image.naturalWidth || !image.naturalHeight) return;
      setResolvedAspectRatio(image.naturalWidth / image.naturalHeight);
    };
    image.onerror = () => {
      if (cancelled) return;
      setResolvedAspectRatio(aspectRatio);
    };
    image.src = asset.src;

    return () => {
      cancelled = true;
    };
  }, [asset.src, aspectRatio]);

  const normalizedAspectRatio = useMemo(() => {
    const fallback = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
    if (!asset.src) return fallback;
    if (!Number.isFinite(resolvedAspectRatio) || resolvedAspectRatio <= 0) return fallback;
    return resolvedAspectRatio;
  }, [asset.src, aspectRatio, resolvedAspectRatio]);

  if (!placement.visible) return null;
  if (!asset.src && !(mode === "preview" && showPlaceholder)) return null;

  const inner = renderAssetBody(asset, placement, mode);

  if (mode === "public" || !stageSize || !onPlacementChange) {
    return (
      <div
        style={getAbsoluteStyle(placement, normalizedAspectRatio)}
        className={selected ? "outline outline-2 outline-pastel-serenity/60" : undefined}
      >
        {inner}
      </div>
    );
  }

  const widthPx = (placement.width / 100) * stageSize.width;
  const heightPx = widthPx / normalizedAspectRatio;
  const leftPx = (placement.x / 100) * stageSize.width - widthPx / 2;
  const topPx = (placement.y / 100) * stageSize.height - heightPx / 2;

  const commitPosition = (left: number, top: number, nextWidthPx: number, nextHeightPx: number) => {
    onPlacementChange(asset.id, {
      ...placement,
      x: clamp(((left + nextWidthPx / 2) / stageSize.width) * 100, -50, 150),
      y: clamp(((top + nextHeightPx / 2) / stageSize.height) * 100, -50, 150),
      width: clamp((nextWidthPx / stageSize.width) * 100, 1, 200),
    });
  };

  const handleResizeStop: RndResizeCallback = (_event, _direction, ref, _delta, position) => {
    const nextWidthPx = ref.offsetWidth;
    const nextHeightPx = ref.offsetHeight;
    commitPosition(position.x, position.y, nextWidthPx, nextHeightPx);
  };

  return (
    <Rnd
      size={{ width: widthPx, height: heightPx }}
      position={{ x: leftPx, y: topPx }}
      dragGrid={dragGrid}
      resizeGrid={dragGrid}
      lockAspectRatio={asset.lockAspectRatio}
      enableResizing={{
        top: false,
        right: selected,
        bottom: false,
        left: selected,
        topRight: selected,
        bottomRight: selected,
        bottomLeft: selected,
        topLeft: selected,
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        onSelect?.(asset.id);
      }}
      onDragStart={(event) => {
        event.stopPropagation();
        onSelect?.(asset.id);
      }}
      onDragStop={(_event, data) => commitPosition(data.x, data.y, widthPx, heightPx)}
      onResizeStop={handleResizeStop}
      style={{
        zIndex: placement.zIndex,
        opacity: placement.opacity,
        mixBlendMode: placement.blendMode,
        transform: `rotate(${placement.rotation}deg)`,
      }}
      className={[
        "group",
        selected ? "ring-2 ring-pastel-serenity ring-offset-2 ring-offset-pastel-cream" : "ring-1 ring-white/25",
      ].join(" ")}
    >
      <div className="relative h-full w-full cursor-move overflow-hidden rounded-[2rem]">
        {inner}
        {selected ? (
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-dashed border-text-primary/40" />
        ) : null}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-primary/75 backdrop-blur-md">
          {viewport}
        </span>
      </div>
    </Rnd>
  );
}
