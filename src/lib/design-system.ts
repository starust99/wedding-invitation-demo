import { dalatGardenElegantDesignSystem } from "@/design-systems/dalat-garden-elegant";
import { editorialBlackTieDesignSystem } from "@/design-systems/editorial-black-tie";
import { modernMinimalDesignSystem } from "@/design-systems/modern-minimal";
import { roseQuartzSerenityDesignSystem } from "@/design-systems/rose-quartz-serenity";
import type { VisualDirectionKey } from "@/config/design-directions";

export type WeddingDesignSystem = {
  key: VisualDirectionKey;
  name: string;
  colorTokens: Record<string, string>;
  typographyIntent: string[];
  spacingRhythmRules: string[];
  sectionCompositionRules: string[];
  motifFloralRules: string[];
  motionRules: string[];
  imageTreatmentRules: string[];
  copyVoice: string[];
  dos: string[];
  donts: string[];
  recommendedPreviewContexts: string[];
};

export const designSystems = {
  "rose-quartz-serenity": roseQuartzSerenityDesignSystem,
  "dalat-garden-elegant": dalatGardenElegantDesignSystem,
  "editorial-black-tie": editorialBlackTieDesignSystem,
  "modern-minimal": modernMinimalDesignSystem,
  "destination-postcard": dalatGardenElegantDesignSystem,
} satisfies Record<VisualDirectionKey, WeddingDesignSystem>;

export function getDesignSystem(key: VisualDirectionKey): WeddingDesignSystem {
  return designSystems[key];
}
