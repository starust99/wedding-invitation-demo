import type {
  HeroAssetConfig,
  HeroAssetRole,
  HeroAssetSlotId,
  HeroBlendMode,
  HeroViewportMode,
  ResponsiveAssetPlacement,
  WeddingHeroEditorConfig,
} from "@/lib/wedding/hero-types";
import { cleanBundledPublicAssetSrc } from "@/lib/asset-cleanup";

export const weddingHeroEditorStorageKey = "nhatphuong.hero.editor.config.v1";
export const weddingHeroEditorExportFileName = "nhatphuong-wedding-hero-config.json";

type HeroSlotDefinition = {
  id: HeroAssetSlotId;
  label: string;
  role: HeroAssetRole;
  src: string;
  alt: string;
  required: boolean;
  lockAspectRatio: boolean;
  hasTransparency: boolean;
  objectPosition?: {
    desktop: string;
    mobile: string;
  };
  defaultAspectRatio: number;
  recommendedRatio?: string;
  validationHint?: string;
  desktop: ResponsiveAssetPlacement;
  mobile: ResponsiveAssetPlacement;
};

const defaultPlacements = {
  heroBgWash: {
    desktop: {
      visible: true,
      x: 50,
      y: 50,
      width: 100,
      opacity: 0.82,
      rotation: 0,
      zIndex: 1,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 50,
      y: 50,
      width: 160,
      opacity: 0.78,
      rotation: 0,
      zIndex: 1,
      fit: "cover",
      blendMode: "normal",
    },
  },
  floralTopLeft: {
    desktop: {
      visible: true,
      x: 9,
      y: 10,
      width: 34,
      opacity: 1,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: -4,
      y: 6,
      width: 82,
      opacity: 0.78,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
  },
  floralBottomRight: {
    desktop: {
      visible: true,
      x: 88,
      y: 86,
      width: 38,
      opacity: 1,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 106,
      y: 88,
      width: 94,
      opacity: 0.72,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
  },
  floralMeadowDivider: {
    desktop: {
      visible: true,
      x: 28,
      y: 76,
      width: 36,
      opacity: 0.82,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 50,
      y: 76,
      width: 78,
      opacity: 0.78,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
  },
  acrylicCardTexture: {
    desktop: {
      visible: false,
      x: 75,
      y: 76,
      width: 22,
      opacity: 0.28,
      rotation: 0,
      zIndex: 7,
      fit: "cover",
      blendMode: "soft-light",
    },
    mobile: {
      visible: false,
      x: 50,
      y: 82,
      width: 78,
      opacity: 0.24,
      rotation: 0,
      zIndex: 7,
      fit: "cover",
      blendMode: "soft-light",
    },
  },
  nameOvalGlow: {
    desktop: {
      visible: true,
      x: 28,
      y: 48,
      width: 42,
      opacity: 0.74,
      rotation: -3,
      zIndex: 3,
      fit: "contain",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 50,
      y: 42,
      width: 98,
      opacity: 0.64,
      rotation: -3,
      zIndex: 3,
      fit: "contain",
      blendMode: "normal",
    },
  },
  petalOverlay: {
    desktop: {
      visible: true,
      x: 50,
      y: 50,
      width: 100,
      opacity: 0.35,
      rotation: 0,
      zIndex: 8,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 50,
      y: 50,
      width: 160,
      opacity: 0.26,
      rotation: 0,
      zIndex: 8,
      fit: "cover",
      blendMode: "normal",
    },
  },
  monogramWreath: {
    desktop: {
      visible: true,
      x: 19,
      y: 25,
      width: 6,
      opacity: 1,
      rotation: 0,
      zIndex: 6,
      fit: "contain",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 50,
      y: 17,
      width: 20,
      opacity: 1,
      rotation: 0,
      zIndex: 6,
      fit: "contain",
      blendMode: "normal",
    },
  },
  gardenPhotoPlate: {
    desktop: {
      visible: true,
      x: 74,
      y: 52,
      width: 29,
      opacity: 1,
      rotation: 0,
      zIndex: 4,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: false,
      x: 50,
      y: 80,
      width: 82,
      opacity: 1,
      rotation: 0,
      zIndex: 4,
      fit: "cover",
      blendMode: "normal",
    },
  },
  acrylicTablePlate: {
    desktop: {
      visible: true,
      x: 86,
      y: 31,
      width: 14,
      opacity: 0.88,
      rotation: 5,
      zIndex: 5,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: false,
      x: 76,
      y: 72,
      width: 34,
      opacity: 0.82,
      rotation: 4,
      zIndex: 5,
      fit: "cover",
      blendMode: "normal",
    },
  },
  ctaPillTexture: {
    desktop: {
      visible: false,
      x: 21,
      y: 68,
      width: 16,
      opacity: 0.85,
      rotation: 0,
      zIndex: 7,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: false,
      x: 50,
      y: 68,
      width: 46,
      opacity: 0.85,
      rotation: 0,
      zIndex: 7,
      fit: "cover",
      blendMode: "normal",
    },
  },
  laceDottedDivider: {
    desktop: {
      visible: true,
      x: 28,
      y: 60,
      width: 24,
      opacity: 0.58,
      rotation: 0,
      zIndex: 6,
      fit: "contain",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 50,
      y: 55,
      width: 58,
      opacity: 0.52,
      rotation: 0,
      zIndex: 6,
      fit: "contain",
      blendMode: "normal",
    },
  },
  heroBrowserMockup: {
    desktop: {
      visible: false,
      x: 50,
      y: 50,
      width: 88,
      opacity: 1,
      rotation: 0,
      zIndex: 10,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: false,
      x: 50,
      y: 50,
      width: 120,
      opacity: 1,
      rotation: 0,
      zIndex: 10,
      fit: "cover",
      blendMode: "normal",
    },
  },
} as const satisfies Record<HeroAssetSlotId, { desktop: ResponsiveAssetPlacement; mobile: ResponsiveAssetPlacement }>;

export const heroSlotDefinitions: HeroSlotDefinition[] = [
  {
    id: "heroBgWash",
    label: "Lớp nền màu nước cho hero",
    role: "background",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: false,
    defaultAspectRatio: 16 / 9,
    recommendedRatio: "16:9",
    validationHint: "Lớp nền nên gần 16:9 để phủ hero đẹp.",
    ...defaultPlacements.heroBgWash,
  },
  {
    id: "floralTopLeft",
    label: "Cụm hoa góc trên trái",
    role: "decorative",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 1,
    recommendedRatio: "1:1 hoặc 4:3",
    validationHint: "Cụm hoa góc trên trái nên gần vuông để ôm góc đẹp.",
    ...defaultPlacements.floralTopLeft,
  },
  {
    id: "floralBottomRight",
    label: "Cụm hoa góc dưới phải",
    role: "decorative",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 1,
    recommendedRatio: "1:1 hoặc 4:3",
    validationHint: "Cụm hoa góc dưới phải nên gần vuông để ôm góc đẹp.",
    ...defaultPlacements.floralBottomRight,
  },
  {
    id: "floralMeadowDivider",
    label: "Dải hoa ngang",
    role: "decorative",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 4,
    recommendedRatio: "Ảnh ngang rộng",
    ...defaultPlacements.floralMeadowDivider,
  },
  {
    id: "acrylicCardTexture",
    label: "Nền card acrylic cho lời hồi đáp",
    role: "texture",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 4 / 3,
    recommendedRatio: "4:3",
    ...defaultPlacements.acrylicCardTexture,
  },
  {
    id: "nameOvalGlow",
    label: "Quầng sáng mềm sau tên cô dâu chú rể",
    role: "decorative",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 16 / 9,
    recommendedRatio: "16:9",
    ...defaultPlacements.nameOvalGlow,
  },
  {
    id: "petalOverlay",
    label: "Lớp cánh hoa bay",
    role: "decorative",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 16 / 9,
    recommendedRatio: "16:9",
    ...defaultPlacements.petalOverlay,
  },
  {
    id: "monogramWreath",
    label: "Vòng monogram lá nhỏ",
    role: "content",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 1,
    recommendedRatio: "1:1",
    validationHint: "Vòng monogram nên 1:1 để chữ N&P nằm giữa chuẩn.",
    ...defaultPlacements.monogramWreath,
  },
  {
    id: "gardenPhotoPlate",
    label: "Ảnh chân dung kỷ niệm",
    role: "content",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: false,
    objectPosition: {
      desktop: "62% 36%",
      mobile: "50% 33%",
    },
    defaultAspectRatio: 2 / 3,
    recommendedRatio: "2:3 hoặc 3:4",
    validationHint: "Ảnh chân dung nên là khung dọc 2:3 hoặc 3:4.",
    ...defaultPlacements.gardenPhotoPlate,
  },
  {
    id: "acrylicTablePlate",
    label: "Miếng nền acrylic trang trí",
    role: "content",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: false,
    defaultAspectRatio: 3 / 4,
    recommendedRatio: "3:4",
    ...defaultPlacements.acrylicTablePlate,
  },
  {
    id: "ctaPillTexture",
    label: "Texture nền nút CTA",
    role: "texture",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 4,
    recommendedRatio: "Ảnh ngang rộng",
    ...defaultPlacements.ctaPillTexture,
  },
  {
    id: "laceDottedDivider",
    label: "Đường chấm trang trí",
    role: "decorative",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 8,
    recommendedRatio: "Ảnh ngang dài",
    ...defaultPlacements.laceDottedDivider,
  },
  {
    id: "heroBrowserMockup",
    label: "Ảnh mockup trình duyệt cho hero",
    role: "mockup",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: false,
    defaultAspectRatio: 16 / 9,
    recommendedRatio: "16:9",
    ...defaultPlacements.heroBrowserMockup,
  },
];

const heroSlotDefinitionMap = Object.fromEntries(heroSlotDefinitions.map((definition) => [definition.id, definition])) as Record<
  HeroAssetSlotId,
  HeroSlotDefinition
>;

export function createDefaultWeddingHeroConfig(): WeddingHeroEditorConfig {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    canvas: {
      aspectRatio: "16:9",
      backgroundColor: "#FEF8E7",
      previewWidth: 1440,
    },
    content: {
      eyebrow: "26.12.2026 · Đà Lạt",
      names: "Nhật & Phương",
      date: "26.12.2026",
      description:
        "Gia đình trân trọng kính mời quý khách đến chung vui trong lễ cưới của Nhật & Phương tại Terracotta Đà Lạt.",
      primaryCta: "Gửi lời hồi đáp",
      secondaryCta: "Xem địa điểm",
      monogramText: "N&P",
    },
    assets: heroSlotDefinitions.map((definition) => ({
      id: definition.id,
      label: definition.label,
      src: definition.src,
      alt: definition.alt,
      role: definition.role,
      required: definition.required,
      lockAspectRatio: definition.lockAspectRatio,
      hasTransparency: definition.hasTransparency,
      desktop: structuredClone(definition.desktop),
      mobile: structuredClone(definition.mobile),
    })),
  };
}

export const defaultWeddingHeroConfig = createDefaultWeddingHeroConfig();

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizePlacement(
  placement: Partial<ResponsiveAssetPlacement> | undefined,
  fallback: ResponsiveAssetPlacement,
): ResponsiveAssetPlacement {
  return {
    visible: placement?.visible ?? fallback.visible,
    x: clamp(placement?.x ?? fallback.x, -50, 150),
    y: clamp(placement?.y ?? fallback.y, -50, 150),
    width: clamp(placement?.width ?? fallback.width, 1, 200),
    opacity: clamp(placement?.opacity ?? fallback.opacity, 0, 1),
    rotation: clamp(placement?.rotation ?? fallback.rotation, -45, 45),
    zIndex: clamp(Math.round(placement?.zIndex ?? fallback.zIndex), 0, 50),
    fit: placement?.fit === "contain" ? "contain" : fallback.fit === "contain" ? "contain" : "cover",
    blendMode: normalizeBlendMode(placement?.blendMode, fallback.blendMode),
  };
}

function normalizeBlendMode(value: HeroBlendMode | undefined, fallback: HeroBlendMode): HeroBlendMode {
  if (value === "multiply" || value === "screen" || value === "overlay" || value === "soft-light" || value === "normal") {
    return value;
  }
  return fallback;
}

function normalizeAsset(asset: Partial<HeroAssetConfig> | undefined, fallback: HeroAssetConfig): HeroAssetConfig {
  return {
    id: fallback.id,
    label: asset?.label || fallback.label,
    src: cleanBundledPublicAssetSrc(asset?.src || fallback.src),
    alt: asset?.alt ?? fallback.alt,
    role: asset?.role || fallback.role,
    required: asset?.required ?? fallback.required,
    lockAspectRatio: asset?.lockAspectRatio ?? fallback.lockAspectRatio,
    hasTransparency: asset?.hasTransparency ?? fallback.hasTransparency,
    objectPosition: asset?.objectPosition ?? fallback.objectPosition,
    desktop: normalizePlacement(asset?.desktop, fallback.desktop),
    mobile: normalizePlacement(asset?.mobile, fallback.mobile),
  };
}

export function normalizeWeddingHeroEditorConfig(input?: unknown): WeddingHeroEditorConfig {
  const source = input && typeof input === "object" ? input as Partial<WeddingHeroEditorConfig> : null;
  const fallback = createDefaultWeddingHeroConfig();
  const sourceContent = source?.content;
  const hasStaleDefaultContent = sourceContent?.eyebrow === "Wedding Invitation · Late 2026" && sourceContent?.date === "December 2026";
  const hasSpringGardenDraftContent = sourceContent?.eyebrow === "Save the Date · Spring Garden" && sourceContent?.primaryCta === "RSVP";
  const inputAssets = Object.fromEntries((source?.assets || []).map((asset) => [asset.id, asset])) as Partial<
    Record<HeroAssetSlotId, Partial<HeroAssetConfig>>
  >;

  return {
    version: 1,
    updatedAt: source?.updatedAt || fallback.updatedAt,
    canvas: {
      aspectRatio: "16:9",
      backgroundColor: "#FEF8E7",
      previewWidth: Number.isFinite(source?.canvas?.previewWidth) ? Math.round(source?.canvas?.previewWidth || 1440) : 1440,
    },
    content: {
      eyebrow: hasStaleDefaultContent || hasSpringGardenDraftContent ? fallback.content.eyebrow : sourceContent?.eyebrow || fallback.content.eyebrow,
      names: sourceContent?.names || fallback.content.names,
      date: hasStaleDefaultContent || hasSpringGardenDraftContent ? fallback.content.date : sourceContent?.date || fallback.content.date,
      description: hasStaleDefaultContent || hasSpringGardenDraftContent ? fallback.content.description : sourceContent?.description || fallback.content.description,
      primaryCta: hasSpringGardenDraftContent ? fallback.content.primaryCta : sourceContent?.primaryCta || fallback.content.primaryCta,
      secondaryCta: hasStaleDefaultContent || hasSpringGardenDraftContent ? fallback.content.secondaryCta : sourceContent?.secondaryCta || fallback.content.secondaryCta,
      monogramText: sourceContent?.monogramText || fallback.content.monogramText,
    },
    assets: fallback.assets.map((asset) => normalizeAsset(inputAssets[asset.id], asset)),
  };
}

export function touchWeddingHeroConfig(config: WeddingHeroEditorConfig): WeddingHeroEditorConfig {
  return {
    ...config,
    updatedAt: new Date().toISOString(),
  };
}

export function getHeroAssetDefinition(id: HeroAssetSlotId) {
  return heroSlotDefinitionMap[id];
}

export function getHeroAssetFallbackAspectRatio(id: HeroAssetSlotId) {
  return heroSlotDefinitionMap[id].defaultAspectRatio;
}

export function getHeroAssetPlacement(asset: HeroAssetConfig, viewport: HeroViewportMode) {
  return viewport === "mobile" ? asset.mobile : asset.desktop;
}

export function sortHeroAssetsForViewport(assets: HeroAssetConfig[], viewport: HeroViewportMode) {
  return [...assets].sort((left, right) => {
    const leftPlacement = getHeroAssetPlacement(left, viewport);
    const rightPlacement = getHeroAssetPlacement(right, viewport);

    if (leftPlacement.zIndex === rightPlacement.zIndex) {
      return left.label.localeCompare(right.label);
    }

    return leftPlacement.zIndex - rightPlacement.zIndex;
  });
}

export function resetHeroAssetToDefault(
  currentAsset: HeroAssetConfig,
  viewport: HeroViewportMode,
  preserveSource = true,
): HeroAssetConfig {
  const fallback = defaultWeddingHeroConfig.assets.find((asset) => asset.id === currentAsset.id);

  if (!fallback) return currentAsset;

  return {
    ...currentAsset,
    src: preserveSource ? currentAsset.src : fallback.src,
    alt: preserveSource ? currentAsset.alt : fallback.alt,
    desktop: viewport === "desktop" ? structuredClone(fallback.desktop) : currentAsset.desktop,
    mobile: viewport === "mobile" ? structuredClone(fallback.mobile) : currentAsset.mobile,
  };
}

export function validateHeroAssetRatio(id: HeroAssetSlotId, width: number, height: number) {
  if (!width || !height) return "";

  const ratio = width / height;

  if (id === "heroBgWash" && (ratio < 1.5 || ratio > 1.95)) {
    return "Background wash nên gần 16:9.";
  }

  if ((id === "floralTopLeft" || id === "floralBottomRight") && (ratio < 0.7 || ratio > 1.35)) {
    return "Floral corner nên square-ish.";
  }

  if (id === "monogramWreath" && (ratio < 0.9 || ratio > 1.1)) {
    return "Monogram wreath nên gần 1:1.";
  }

  if (id === "gardenPhotoPlate" && (ratio < 0.58 || ratio > 0.86)) {
    return "Couple portrait nên là ảnh đứng 2:3 hoặc 3:4.";
  }

  return "";
}
