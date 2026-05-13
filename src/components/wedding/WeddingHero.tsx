"use client";

import { ReferenceWeddingHero } from "@/components/wedding/ReferenceWeddingHero";
import type { ReferenceWeddingHeroSummary } from "@/components/wedding/ReferenceWeddingHero";
import { normalizeWeddingHeroEditorConfig } from "@/lib/wedding/hero-config";
import type { HeroAssetSlotId, HeroViewportMode, ResponsiveAssetPlacement, WeddingHeroEditorConfig } from "@/lib/wedding/hero-types";

export type WeddingHeroProps = {
  config: WeddingHeroEditorConfig;
  mode?: "preview" | "public";
  viewport?: HeroViewportMode;
  stageSize?: { width: number; height: number };
  selectedAssetId?: HeroAssetSlotId;
  summary?: ReferenceWeddingHeroSummary;
  dragGrid?: [number, number];
  showSafeGuides?: boolean;
  showPlaceholders?: boolean;
  onSelectAsset?: (id: HeroAssetSlotId) => void;
  onPlacementChange?: (id: HeroAssetSlotId, placement: ResponsiveAssetPlacement) => void;
};

export function WeddingHero({ config, summary }: WeddingHeroProps) {
  return <ReferenceWeddingHero config={normalizeWeddingHeroEditorConfig(config)} summary={summary} />;
}
