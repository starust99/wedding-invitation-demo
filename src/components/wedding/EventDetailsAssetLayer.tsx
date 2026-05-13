"use client";

import { EventDetailsAssetItem } from "@/components/wedding/EventDetailsAssetItem";
import {
  getEventDetailsAssetFallbackAspectRatio,
  getEventDetailsAssetPlacement,
  sortEventDetailsAssetsForViewport,
} from "@/lib/wedding/event-details-config";
import type {
  EventDetailsAssetConfig,
  EventDetailsAssetSlotId,
  EventDetailsPlacement,
  EventDetailsViewportMode,
  WeddingEventDetailsEditorConfig,
} from "@/lib/wedding/event-details-types";

type EventDetailsAssetLayerProps = {
  config: WeddingEventDetailsEditorConfig;
  mode: "preview" | "public";
  viewport: EventDetailsViewportMode;
  stageSize?: { width: number; height: number };
  selectedAssetId?: EventDetailsAssetSlotId;
  dragGrid?: [number, number];
  include?: (asset: EventDetailsAssetConfig) => boolean;
  showPlaceholders?: boolean;
  onSelectAsset?: (id: EventDetailsAssetSlotId) => void;
  onPlacementChange?: (id: EventDetailsAssetSlotId, placement: EventDetailsPlacement) => void;
};

export function EventDetailsAssetLayer({
  config,
  mode,
  viewport,
  stageSize,
  selectedAssetId,
  dragGrid,
  include,
  showPlaceholders = false,
  onSelectAsset,
  onPlacementChange,
}: EventDetailsAssetLayerProps) {
  const assets = sortEventDetailsAssetsForViewport(config.assets, viewport).filter((asset) => include?.(asset) ?? true);

  return (
    <div className="absolute inset-0">
      {assets.map((asset) => (
        <EventDetailsAssetItem
          key={asset.id}
          asset={asset}
          placement={getEventDetailsAssetPlacement(asset, viewport)}
          aspectRatio={getEventDetailsAssetFallbackAspectRatio(asset.id)}
          mode={mode}
          viewport={viewport}
          stageSize={stageSize}
          selected={selectedAssetId === asset.id}
          dragGrid={dragGrid}
          showPlaceholder={showPlaceholders}
          onSelect={onSelectAsset}
          onPlacementChange={onPlacementChange}
        />
      ))}
    </div>
  );
}
