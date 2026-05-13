export type HeroAssetSlotId =
  | "heroBgWash"
  | "floralTopLeft"
  | "floralBottomRight"
  | "floralMeadowDivider"
  | "acrylicCardTexture"
  | "nameOvalGlow"
  | "petalOverlay"
  | "monogramWreath"
  | "gardenPhotoPlate"
  | "acrylicTablePlate"
  | "ctaPillTexture"
  | "laceDottedDivider"
  | "heroBrowserMockup";

export type HeroAssetRole = "background" | "decorative" | "content" | "texture" | "mockup";

export type HeroBlendMode = "normal" | "multiply" | "screen" | "overlay" | "soft-light";

export type ResponsiveAssetPlacement = {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  opacity: number;
  rotation: number;
  zIndex: number;
  fit: "cover" | "contain";
  blendMode: HeroBlendMode;
};

export type HeroAssetConfig = {
  id: HeroAssetSlotId;
  label: string;
  src: string;
  alt: string;
  role: HeroAssetRole;
  required: boolean;
  lockAspectRatio: boolean;
  hasTransparency: boolean;
  desktop: ResponsiveAssetPlacement;
  mobile: ResponsiveAssetPlacement;
};

export type WeddingHeroEditorConfig = {
  version: 1;
  updatedAt: string;
  canvas: {
    aspectRatio: "16:9";
    backgroundColor: "#FEF8E7";
    previewWidth: number;
  };
  content: {
    eyebrow: string;
    names: string;
    date: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    monogramText: string;
  };
  assets: HeroAssetConfig[];
};

export type HeroViewportMode = "desktop" | "mobile";
