import type {
  EventDetailsAssetConfig,
  EventDetailsAssetRole,
  EventDetailsAssetSlotId,
  EventDetailsBlendMode,
  EventDetailsPlacement,
  EventDetailsViewportMode,
  WeddingEventDetailsEditorConfig,
} from "@/lib/wedding/event-details-types";
import { cleanBundledPublicAssetSrc } from "@/lib/asset-cleanup";

export const eventDetailsEditorStorageKey = "nhatphuong.event-details.editor.config.v1";
export const eventDetailsEditorExportFileName = "nhatphuong-event-details-config.json";

type EventDetailsSlotDefinition = {
  id: EventDetailsAssetSlotId;
  label: string;
  role: EventDetailsAssetRole;
  src: string;
  alt: string;
  required: boolean;
  lockAspectRatio: boolean;
  hasTransparency: boolean;
  defaultAspectRatio: number;
  recommendedRatio?: string;
  validationHint?: string;
  desktop: EventDetailsPlacement;
  mobile: EventDetailsPlacement;
};

const defaultPlacements = {
  detailsBgWash: {
    desktop: {
      visible: true,
      x: 50,
      y: 50,
      width: 100,
      opacity: 0.78,
      rotation: 0,
      zIndex: 1,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 50,
      y: 50,
      width: 170,
      opacity: 0.72,
      rotation: 0,
      zIndex: 1,
      fit: "cover",
      blendMode: "normal",
    },
  },
  detailsBotanicalLeft: {
    desktop: {
      visible: true,
      x: 5,
      y: 52,
      width: 22,
      opacity: 0.86,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: -4,
      y: 42,
      width: 62,
      opacity: 0.5,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
  },
  detailsBotanicalRight: {
    desktop: {
      visible: true,
      x: 96,
      y: 58,
      width: 24,
      opacity: 0.84,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 108,
      y: 64,
      width: 68,
      opacity: 0.48,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
  },
  detailsVenuePlate: {
    desktop: {
      visible: true,
      x: 72,
      y: 52,
      width: 26,
      opacity: 1,
      rotation: 0,
      zIndex: 4,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: false,
      x: 50,
      y: 78,
      width: 82,
      opacity: 1,
      rotation: 0,
      zIndex: 4,
      fit: "cover",
      blendMode: "normal",
    },
  },
  detailsMapPlate: {
    desktop: {
      visible: true,
      x: 78,
      y: 78,
      width: 18,
      opacity: 0.95,
      rotation: -2,
      zIndex: 5,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 50,
      y: 76,
      width: 76,
      opacity: 0.9,
      rotation: 0,
      zIndex: 3,
      fit: "cover",
      blendMode: "normal",
    },
  },
  detailsTimelineDivider: {
    desktop: {
      visible: true,
      x: 36,
      y: 70,
      width: 34,
      opacity: 0.7,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
    mobile: {
      visible: true,
      x: 50,
      y: 62,
      width: 74,
      opacity: 0.58,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
  },
  detailsDresscodePlate: {
    desktop: {
      visible: true,
      x: 89,
      y: 31,
      width: 13,
      opacity: 0.92,
      rotation: 4,
      zIndex: 5,
      fit: "cover",
      blendMode: "normal",
    },
    mobile: {
      visible: false,
      x: 74,
      y: 72,
      width: 38,
      opacity: 0.82,
      rotation: 3,
      zIndex: 5,
      fit: "cover",
      blendMode: "normal",
    },
  },
} as const satisfies Record<EventDetailsAssetSlotId, { desktop: EventDetailsPlacement; mobile: EventDetailsPlacement }>;

export const eventDetailsSlotDefinitions: EventDetailsSlotDefinition[] = [
  {
    id: "detailsBgWash",
    label: "Nền màu nước cho section thông tin",
    role: "background",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: false,
    defaultAspectRatio: 16 / 9,
    recommendedRatio: "16:9 hoặc 4:3",
    validationHint: "Lớp nền nên gần 16:9 hoặc 4:3 để phủ section đẹp.",
    ...defaultPlacements.detailsBgWash,
  },
  {
    id: "detailsBotanicalLeft",
    label: "Cụm hoa bên trái",
    role: "decorative",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 3 / 4,
    recommendedRatio: "Ảnh dọc cao",
    validationHint: "Cụm hoa bên trái nên là ảnh dọc cao.",
    ...defaultPlacements.detailsBotanicalLeft,
  },
  {
    id: "detailsBotanicalRight",
    label: "Cụm hoa bên phải",
    role: "decorative",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 3 / 4,
    recommendedRatio: "Ảnh dọc cao",
    validationHint: "Cụm hoa bên phải nên là ảnh dọc cao.",
    ...defaultPlacements.detailsBotanicalRight,
  },
  {
    id: "detailsVenuePlate",
    label: "Ảnh venue chính",
    role: "content",
    src: "",
    alt: "English garden wedding venue with soft florals",
    required: false,
    lockAspectRatio: true,
    hasTransparency: false,
    defaultAspectRatio: 4 / 5,
    recommendedRatio: "4:5 hoặc 3:4",
    validationHint: "Ảnh venue nên là khung dọc 4:5 hoặc 3:4.",
    ...defaultPlacements.detailsVenuePlate,
  },
  {
    id: "detailsMapPlate",
    label: "Ảnh bản đồ nhỏ",
    role: "content",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: false,
    defaultAspectRatio: 4 / 3,
    recommendedRatio: "4:3 hoặc 1:1",
    validationHint: "Ảnh bản đồ nên là khung 4:3 hoặc 1:1.",
    ...defaultPlacements.detailsMapPlate,
  },
  {
    id: "detailsTimelineDivider",
    label: "Dải phân cách timeline",
    role: "decorative",
    src: "",
    alt: "",
    required: false,
    lockAspectRatio: true,
    hasTransparency: true,
    defaultAspectRatio: 5,
    recommendedRatio: "Ảnh ngang dài",
    validationHint: "Dải phân cách timeline nên là ảnh ngang mảnh.",
    ...defaultPlacements.detailsTimelineDivider,
  },
  {
    id: "detailsDresscodePlate",
    label: "Ảnh dress code / flatlay",
    role: "content",
    src: "",
    alt: "Pastel wedding stationery and dress code flatlay",
    required: false,
    lockAspectRatio: true,
    hasTransparency: false,
    defaultAspectRatio: 3 / 4,
    recommendedRatio: "3:4 hoặc 4:5",
    validationHint: "Ảnh dress code nên là khung dọc 3:4 hoặc 4:5.",
    ...defaultPlacements.detailsDresscodePlate,
  },
];

const eventDetailsSlotDefinitionMap = Object.fromEntries(eventDetailsSlotDefinitions.map((definition) => [definition.id, definition])) as Record<
  EventDetailsAssetSlotId,
  EventDetailsSlotDefinition
>;

export function createDefaultEventDetailsConfig(): WeddingEventDetailsEditorConfig {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    canvas: {
      desktopAspectRatio: "16:9",
      mobileWidth: 390,
      mobileHeight: 844,
      backgroundColor: "#FEF8E7",
    },
    content: {
      eyebrow: "Thông tin và địa điểm",
      title: "",
      intro: "",
      churchDate: "20.12.2026, thứ 7",
      churchTime: "15:00",
      churchLocation: "Nhà Thờ Giáo Xứ Tam Hải",
      churchImageUrl: "/assets/wedding/church-tam-hai-v2.jpg",
      ceremonyLabel: "Ngày cưới",
      ceremonyTime: "26.12.2026, thứ 7",
      ceremonyLocation: "17:30",
      receptionLabel: "Địa điểm",
      receptionTime: "Sảnh Quảng Trường",
      receptionLocation: "Terracotta Hotel & Resort Đà Lạt",
      dressCodeLabel: "Trang phục chủ đề",
      dressCodeText: "Vì Đà Lạt vào đông rất lạnh, quý khách lưu ý mặc thật ấm. Gia đình gợi ý tông màu: hồng phấn, xanh da trời, kem hoặc xanh lá dịu để khung hình thêm phần hài hòa.",
      mapLabel: "",
      mapText: "",
    },
    assets: eventDetailsSlotDefinitions.map((definition) => ({
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

export const defaultEventDetailsConfig = createDefaultEventDetailsConfig();

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeBlendMode(value: EventDetailsBlendMode | undefined, fallback: EventDetailsBlendMode): EventDetailsBlendMode {
  if (value === "multiply" || value === "screen" || value === "overlay" || value === "soft-light" || value === "normal") {
    return value;
  }
  return fallback;
}

function normalizePlacement(
  placement: Partial<EventDetailsPlacement> | undefined,
  fallback: EventDetailsPlacement,
): EventDetailsPlacement {
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

function normalizeAsset(asset: Partial<EventDetailsAssetConfig> | undefined, fallback: EventDetailsAssetConfig): EventDetailsAssetConfig {
  const sourceSrc = cleanBundledPublicAssetSrc(asset?.src || "");
  const hasStaleMissingSource = sourceSrc.startsWith("/assets/wedding/event-details/event-details-");

  return {
    id: fallback.id,
    label: asset?.label || fallback.label,
    src: cleanBundledPublicAssetSrc(hasStaleMissingSource ? fallback.src : sourceSrc || fallback.src),
    alt: hasStaleMissingSource ? fallback.alt : asset?.alt ?? fallback.alt,
    role: asset?.role || fallback.role,
    required: asset?.required ?? fallback.required,
    lockAspectRatio: asset?.lockAspectRatio ?? fallback.lockAspectRatio,
    hasTransparency: asset?.hasTransparency ?? fallback.hasTransparency,
    desktop: normalizePlacement(asset?.desktop, fallback.desktop),
    mobile: normalizePlacement(asset?.mobile, fallback.mobile),
  };
}

export function normalizeEventDetailsEditorConfig(input?: unknown): WeddingEventDetailsEditorConfig {
  const source = input && typeof input === "object" ? input as Partial<WeddingEventDetailsEditorConfig> : null;
  const fallback = createDefaultEventDetailsConfig();
  const sourceContent = source?.content;
  const hasStaleDefaultContent = sourceContent?.title === "A Soft Garden Celebration";
  const hasLegacyVenueCopy =
    sourceContent?.title === "Sảnh Quảng Trường" ||
    sourceContent?.intro?.includes("Sảnh Quảng Trường") ||
    sourceContent?.mapLabel === "Bản đồ" ||
    sourceContent?.dressCodeLabel === "Không gian" ||
    sourceContent?.mapText?.includes("Hồ Tuyền Lâm, Đà Lạt, Việt Nam") ||
    sourceContent?.receptionLocation?.includes("Hồ Tuyền Lâm");
  const inputAssets = Object.fromEntries((source?.assets || []).map((asset) => [asset.id, asset])) as Partial<
    Record<EventDetailsAssetSlotId, Partial<EventDetailsAssetConfig>>
  >;
  const useFallbackContent = hasStaleDefaultContent || hasLegacyVenueCopy;

  return {
    version: 1,
    updatedAt: source?.updatedAt || fallback.updatedAt,
    canvas: {
      desktopAspectRatio: "16:9",
      mobileWidth: 390,
      mobileHeight: 844,
      backgroundColor: "#FEF8E7",
    },
    content: {
      eyebrow: useFallbackContent ? fallback.content.eyebrow : sourceContent?.eyebrow === "Địa điểm" ? "Thông tin và địa điểm" : sourceContent?.eyebrow || fallback.content.eyebrow,
      title: useFallbackContent ? fallback.content.title : sourceContent?.title || fallback.content.title,
      intro: sourceContent?.intro === "Một vài chi tiết nhỏ để khách mời dễ sắp xếp hành trình và chuẩn bị thoải mái cho buổi tối." ? "" : (useFallbackContent ? fallback.content.intro : sourceContent?.intro || fallback.content.intro),
      churchDate: useFallbackContent ? fallback.content.churchDate : sourceContent?.churchDate || fallback.content.churchDate,
      churchTime: useFallbackContent ? fallback.content.churchTime : sourceContent?.churchTime || fallback.content.churchTime,
      churchLocation: useFallbackContent ? fallback.content.churchLocation : sourceContent?.churchLocation || fallback.content.churchLocation,
      churchImageUrl: useFallbackContent ? fallback.content.churchImageUrl : sourceContent?.churchImageUrl || fallback.content.churchImageUrl,
      ceremonyLabel: useFallbackContent ? fallback.content.ceremonyLabel : sourceContent?.ceremonyLabel || fallback.content.ceremonyLabel,
      ceremonyTime: useFallbackContent ? fallback.content.ceremonyTime : sourceContent?.ceremonyTime || fallback.content.ceremonyTime,
      ceremonyLocation: useFallbackContent ? fallback.content.ceremonyLocation : sourceContent?.ceremonyLocation || fallback.content.ceremonyLocation,
      receptionLabel: useFallbackContent ? fallback.content.receptionLabel : sourceContent?.receptionLabel || fallback.content.receptionLabel,
      receptionTime: useFallbackContent ? fallback.content.receptionTime : sourceContent?.receptionTime || fallback.content.receptionTime,
      receptionLocation: useFallbackContent ? fallback.content.receptionLocation : sourceContent?.receptionLocation || fallback.content.receptionLocation,
      dressCodeLabel: useFallbackContent ? fallback.content.dressCodeLabel : sourceContent?.dressCodeLabel || fallback.content.dressCodeLabel,
      dressCodeText: useFallbackContent ? fallback.content.dressCodeText : sourceContent?.dressCodeText || fallback.content.dressCodeText,
      mapLabel: useFallbackContent ? fallback.content.mapLabel : sourceContent?.mapLabel || fallback.content.mapLabel,
      mapText: useFallbackContent ? fallback.content.mapText : sourceContent?.mapText || fallback.content.mapText,
    },
    assets: fallback.assets.map((asset) => normalizeAsset(inputAssets[asset.id], asset)),
  };
}

export function touchEventDetailsConfig(config: WeddingEventDetailsEditorConfig): WeddingEventDetailsEditorConfig {
  return {
    ...config,
    updatedAt: new Date().toISOString(),
  };
}

export function getEventDetailsAssetDefinition(id: EventDetailsAssetSlotId) {
  return eventDetailsSlotDefinitionMap[id];
}

export function getEventDetailsAssetFallbackAspectRatio(id: EventDetailsAssetSlotId) {
  return eventDetailsSlotDefinitionMap[id].defaultAspectRatio;
}

export function getEventDetailsAssetPlacement(asset: EventDetailsAssetConfig, viewport: EventDetailsViewportMode) {
  return viewport === "mobile" ? asset.mobile : asset.desktop;
}

export function sortEventDetailsAssetsForViewport(assets: EventDetailsAssetConfig[], viewport: EventDetailsViewportMode) {
  return [...assets].sort((left, right) => {
    const leftPlacement = getEventDetailsAssetPlacement(left, viewport);
    const rightPlacement = getEventDetailsAssetPlacement(right, viewport);

    if (leftPlacement.zIndex === rightPlacement.zIndex) {
      return left.label.localeCompare(right.label);
    }

    return leftPlacement.zIndex - rightPlacement.zIndex;
  });
}

export function resetEventDetailsAssetToDefault(
  currentAsset: EventDetailsAssetConfig,
  viewport: EventDetailsViewportMode,
  preserveSource = true,
): EventDetailsAssetConfig {
  const fallback = defaultEventDetailsConfig.assets.find((asset) => asset.id === currentAsset.id);

  if (!fallback) return currentAsset;

  return {
    ...currentAsset,
    src: preserveSource ? currentAsset.src : fallback.src,
    alt: preserveSource ? currentAsset.alt : fallback.alt,
    desktop: viewport === "desktop" ? structuredClone(fallback.desktop) : currentAsset.desktop,
    mobile: viewport === "mobile" ? structuredClone(fallback.mobile) : currentAsset.mobile,
  };
}

export function validateEventDetailsAssetRatio(id: EventDetailsAssetSlotId, width: number, height: number) {
  if (!width || !height) return "";

  const ratio = width / height;

  if (id === "detailsBgWash" && (ratio < 1.25 || ratio > 1.95)) {
    return "Lớp nền nên gần 16:9 hoặc 4:3.";
  }

  if ((id === "detailsBotanicalLeft" || id === "detailsBotanicalRight") && (ratio < 0.35 || ratio > 1.05)) {
    return "Cụm hoa bên trái/phải nên là ảnh dọc cao.";
  }

  if (id === "detailsVenuePlate" && (ratio < 0.68 || ratio > 0.86)) {
    return "Ảnh venue nên là khung dọc 4:5 hoặc 3:4.";
  }

  if (id === "detailsMapPlate" && (ratio < 0.9 || ratio > 1.45)) {
    return "Ảnh bản đồ nên gần 4:3 hoặc 1:1.";
  }

  if (id === "detailsTimelineDivider" && ratio < 2.8) {
    return "Dải phân cách timeline nên là ảnh ngang mảnh.";
  }

  if (id === "detailsDresscodePlate" && (ratio < 0.68 || ratio > 0.86)) {
    return "Ảnh dress code nên là khung dọc 3:4 hoặc 4:5.";
  }

  return "";
}
