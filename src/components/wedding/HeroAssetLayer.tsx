"use client";

import { HeroAssetItem } from "@/components/wedding/HeroAssetItem";
import {
  getHeroAssetFallbackAspectRatio,
  getHeroAssetPlacement,
  sortHeroAssetsForViewport,
} from "@/lib/wedding/hero-config";
import type {
  HeroAssetConfig,
  HeroAssetSlotId,
  HeroViewportMode,
  ResponsiveAssetPlacement,
  WeddingHeroEditorConfig,
} from "@/lib/wedding/hero-types";

type HeroAssetLayerProps = {
  config: WeddingHeroEditorConfig;
  mode: "preview" | "public";
  viewport: HeroViewportMode;
  stageSize?: { width: number; height: number };
  selectedAssetId?: HeroAssetSlotId;
  dragGrid?: [number, number];
  include?: (asset: HeroAssetConfig) => boolean;
  showPlaceholders?: boolean;
  onSelectAsset?: (id: HeroAssetSlotId) => void;
  onPlacementChange?: (id: HeroAssetSlotId, placement: ResponsiveAssetPlacement) => void;
};

export function HeroAssetLayer({
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
}: HeroAssetLayerProps) {
  const assets = sortHeroAssetsForViewport(config.assets, viewport).filter((asset) => include?.(asset) ?? true);

  return (
    <div className="absolute inset-0">
      {assets.map((asset) => (
        <HeroAssetItem
          key={asset.id}
          asset={asset}
          placement={getHeroAssetPlacement(asset, viewport)}
          aspectRatio={getHeroAssetFallbackAspectRatio(asset.id)}
          mode={mode}
          viewport={viewport}
          monogramText={config.content.monogramText}
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
