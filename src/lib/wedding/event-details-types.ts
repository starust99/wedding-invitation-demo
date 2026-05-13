export type EventDetailsAssetSlotId =
  | "detailsBgWash"
  | "detailsBotanicalLeft"
  | "detailsBotanicalRight"
  | "detailsVenuePlate"
  | "detailsMapPlate"
  | "detailsTimelineDivider"
  | "detailsDresscodePlate";

export type EventDetailsAssetRole = "background" | "decorative" | "content" | "texture";

export type EventDetailsBlendMode = "normal" | "multiply" | "screen" | "overlay" | "soft-light";

export type EventDetailsPlacement = {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  opacity: number;
  rotation: number;
  zIndex: number;
  fit: "cover" | "contain";
  blendMode: EventDetailsBlendMode;
};

export type EventDetailsAssetConfig = {
  id: EventDetailsAssetSlotId;
  label: string;
  src: string;
  alt: string;
  role: EventDetailsAssetRole;
  required: boolean;
  lockAspectRatio: boolean;
  hasTransparency: boolean;
  desktop: EventDetailsPlacement;
  mobile: EventDetailsPlacement;
};

export type EventDetailsContentConfig = {
  eyebrow: string;
  title: string;
  intro: string;
  ceremonyLabel: string;
  ceremonyTime: string;
  ceremonyLocation: string;
  receptionLabel: string;
  receptionTime: string;
  receptionLocation: string;
  dressCodeLabel: string;
  dressCodeText: string;
  mapLabel: string;
  mapText: string;
};

export type WeddingEventDetailsEditorConfig = {
  version: 1;
  updatedAt: string;
  canvas: {
    desktopAspectRatio: "16:9";
    mobileWidth: 390;
    mobileHeight: 844;
    backgroundColor: "#FEF8E7";
  };
  content: EventDetailsContentConfig;
  assets: EventDetailsAssetConfig[];
};

export type EventDetailsViewportMode = "desktop" | "mobile";
