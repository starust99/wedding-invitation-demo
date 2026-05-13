import { getHeroAssetFallbackAspectRatio, normalizeWeddingHeroEditorConfig } from "@/lib/wedding/hero-config";
import type {
  HeroAssetConfig,
  HeroAssetSlotId,
  HeroViewportMode,
  ResponsiveAssetPlacement,
  WeddingHeroEditorConfig,
} from "@/lib/wedding/hero-types";

export type HeroAutoArrangeMode = HeroViewportMode | "both";

export type HeroAutoLayoutReportItem = {
  id: HeroAssetSlotId;
  label: string;
  viewport: HeroViewportMode;
  reason: string;
  changed: string[];
};

type PercentRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type SlotRule = {
  positionTolerance: number;
  widthTolerance: number;
  opacityTolerance: number;
  rotationTolerance?: number;
  zTolerance?: number;
  avoidText?: boolean;
  allowTextOverlap?: number;
  requireMostlyIn?: PercentRect;
  mustHideWhenTargetHidden?: boolean;
  optionalHiddenIsOk?: boolean;
};

const stageAspectRatio: Record<HeroViewportMode, number> = {
  desktop: 16 / 9,
  mobile: 390 / 844,
};

const textZones: Record<HeroViewportMode, PercentRect[]> = {
  desktop: [
    { left: 4, top: 8, right: 43, bottom: 82 },
    { left: 4, top: 62, right: 36, bottom: 86 },
  ],
  mobile: [
    { left: 6, top: 16, right: 94, bottom: 72 },
    { left: 10, top: 62, right: 90, bottom: 82 },
  ],
};

const rightVisualZone: PercentRect = { left: 56, top: 12, right: 96, bottom: 88 };
const desktopStageZone: PercentRect = { left: -20, top: -20, right: 120, bottom: 120 };
const mobileStageZone: PercentRect = { left: -40, top: -18, right: 140, bottom: 120 };

const smartTargets: Record<HeroViewportMode, Record<HeroAssetSlotId, ResponsiveAssetPlacement>> = {
  desktop: {
    heroBgWash: {
      visible: true,
      x: 50,
      y: 50,
      width: 104,
      opacity: 0.42,
      rotation: 0,
      zIndex: 1,
      fit: "cover",
      blendMode: "normal",
    },
    floralTopLeft: {
      visible: true,
      x: -6,
      y: 10,
      width: 26,
      opacity: 0.22,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
    floralBottomRight: {
      visible: true,
      x: 104,
      y: 92,
      width: 32,
      opacity: 0.28,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
    floralMeadowDivider: {
      visible: true,
      x: 25,
      y: 84,
      width: 28,
      opacity: 0.5,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
    acrylicCardTexture: {
      visible: false,
      x: 72,
      y: 72,
      width: 22,
      opacity: 0.18,
      rotation: 0,
      zIndex: 4,
      fit: "cover",
      blendMode: "soft-light",
    },
    nameOvalGlow: {
      visible: true,
      x: 26,
      y: 44,
      width: 34,
      opacity: 0.16,
      rotation: -3,
      zIndex: 3,
      fit: "contain",
      blendMode: "normal",
    },
    petalOverlay: {
      visible: true,
      x: 50,
      y: 50,
      width: 108,
      opacity: 0.1,
      rotation: 0,
      zIndex: 8,
      fit: "cover",
      blendMode: "normal",
    },
    monogramWreath: {
      visible: true,
      x: 19,
      y: 11,
      width: 4.2,
      opacity: 0.82,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
    gardenPhotoPlate: {
      visible: true,
      x: 75,
      y: 53,
      width: 28,
      opacity: 0.96,
      rotation: 0,
      zIndex: 4,
      fit: "cover",
      blendMode: "normal",
    },
    acrylicTablePlate: {
      visible: false,
      x: 86,
      y: 26,
      width: 12,
      opacity: 0.36,
      rotation: 3,
      zIndex: 5,
      fit: "cover",
      blendMode: "normal",
    },
    ctaPillTexture: {
      visible: false,
      x: 21,
      y: 68,
      width: 16,
      opacity: 0.72,
      rotation: 0,
      zIndex: 5,
      fit: "cover",
      blendMode: "normal",
    },
    laceDottedDivider: {
      visible: false,
      x: 27,
      y: 59,
      width: 22,
      opacity: 0.22,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
    heroBrowserMockup: {
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
  },
  mobile: {
    heroBgWash: {
      visible: true,
      x: 50,
      y: 50,
      width: 160,
      opacity: 0.45,
      rotation: 0,
      zIndex: 1,
      fit: "cover",
      blendMode: "normal",
    },
    floralTopLeft: {
      visible: true,
      x: -16,
      y: 4,
      width: 70,
      opacity: 0.24,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
    floralBottomRight: {
      visible: true,
      x: 114,
      y: 92,
      width: 78,
      opacity: 0.26,
      rotation: 0,
      zIndex: 2,
      fit: "contain",
      blendMode: "normal",
    },
    floralMeadowDivider: {
      visible: true,
      x: 50,
      y: 76,
      width: 62,
      opacity: 0.4,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
    acrylicCardTexture: {
      visible: false,
      x: 50,
      y: 82,
      width: 78,
      opacity: 0.2,
      rotation: 0,
      zIndex: 4,
      fit: "cover",
      blendMode: "soft-light",
    },
    nameOvalGlow: {
      visible: true,
      x: 50,
      y: 38,
      width: 84,
      opacity: 0.14,
      rotation: -3,
      zIndex: 3,
      fit: "contain",
      blendMode: "normal",
    },
    petalOverlay: {
      visible: true,
      x: 50,
      y: 50,
      width: 155,
      opacity: 0.08,
      rotation: 0,
      zIndex: 8,
      fit: "cover",
      blendMode: "normal",
    },
    monogramWreath: {
      visible: true,
      x: 50,
      y: 14,
      width: 12,
      opacity: 0.85,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
    gardenPhotoPlate: {
      visible: false,
      x: 50,
      y: 80,
      width: 82,
      opacity: 0.92,
      rotation: 0,
      zIndex: 4,
      fit: "cover",
      blendMode: "normal",
    },
    acrylicTablePlate: {
      visible: false,
      x: 76,
      y: 72,
      width: 34,
      opacity: 0.72,
      rotation: 4,
      zIndex: 5,
      fit: "cover",
      blendMode: "normal",
    },
    ctaPillTexture: {
      visible: false,
      x: 50,
      y: 68,
      width: 46,
      opacity: 0.72,
      rotation: 0,
      zIndex: 5,
      fit: "cover",
      blendMode: "normal",
    },
    laceDottedDivider: {
      visible: false,
      x: 50,
      y: 54,
      width: 52,
      opacity: 0.22,
      rotation: 0,
      zIndex: 5,
      fit: "contain",
      blendMode: "normal",
    },
    heroBrowserMockup: {
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
};

const slotRules: Record<HeroAssetSlotId, SlotRule> = {
  heroBgWash: {
    positionTolerance: 8,
    widthTolerance: 18,
    opacityTolerance: 0.18,
    zTolerance: 0,
  },
  floralTopLeft: {
    positionTolerance: 14,
    widthTolerance: 12,
    opacityTolerance: 0.2,
    allowTextOverlap: 20,
  },
  floralBottomRight: {
    positionTolerance: 14,
    widthTolerance: 12,
    opacityTolerance: 0.22,
    allowTextOverlap: 12,
  },
  floralMeadowDivider: {
    positionTolerance: 12,
    widthTolerance: 12,
    opacityTolerance: 0.22,
    optionalHiddenIsOk: true,
  },
  acrylicCardTexture: {
    positionTolerance: 10,
    widthTolerance: 10,
    opacityTolerance: 0.16,
    mustHideWhenTargetHidden: true,
    optionalHiddenIsOk: true,
  },
  nameOvalGlow: {
    positionTolerance: 12,
    widthTolerance: 16,
    opacityTolerance: 0.18,
    optionalHiddenIsOk: true,
  },
  petalOverlay: {
    positionTolerance: 8,
    widthTolerance: 22,
    opacityTolerance: 0.12,
    allowTextOverlap: 100,
    optionalHiddenIsOk: true,
  },
  monogramWreath: {
    positionTolerance: 10,
    widthTolerance: 5,
    opacityTolerance: 0.08,
    allowTextOverlap: 8,
  },
  gardenPhotoPlate: {
    positionTolerance: 10,
    widthTolerance: 8,
    opacityTolerance: 0.12,
    avoidText: true,
    requireMostlyIn: rightVisualZone,
  },
  acrylicTablePlate: {
    positionTolerance: 12,
    widthTolerance: 8,
    opacityTolerance: 0.2,
    avoidText: true,
    requireMostlyIn: rightVisualZone,
    optionalHiddenIsOk: true,
  },
  ctaPillTexture: {
    positionTolerance: 8,
    widthTolerance: 10,
    opacityTolerance: 0.2,
    mustHideWhenTargetHidden: true,
    optionalHiddenIsOk: true,
  },
  laceDottedDivider: {
    positionTolerance: 10,
    widthTolerance: 10,
    opacityTolerance: 0.18,
    optionalHiddenIsOk: true,
  },
  heroBrowserMockup: {
    positionTolerance: 0,
    widthTolerance: 0,
    opacityTolerance: 0,
    mustHideWhenTargetHidden: true,
    optionalHiddenIsOk: true,
  },
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function clampPlacement(placement: ResponsiveAssetPlacement): ResponsiveAssetPlacement {
  return {
    ...placement,
    x: clamp(placement.x, -50, 150),
    y: clamp(placement.y, -50, 150),
    width: clamp(placement.width, 1, 200),
    opacity: clamp(placement.opacity, 0, 1),
    rotation: clamp(placement.rotation, -45, 45),
    zIndex: clamp(Math.round(placement.zIndex), 0, 50),
  };
}

function rectArea(rect: PercentRect) {
  return Math.max(0, rect.right - rect.left) * Math.max(0, rect.bottom - rect.top);
}

function intersectionArea(a: PercentRect, b: PercentRect) {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  return rectArea({ left, top, right, bottom });
}

function overlapPercent(a: PercentRect, b: PercentRect) {
  const area = rectArea(a);
  if (!area) return 0;
  return (intersectionArea(a, b) / area) * 100;
}

function isMostlyInside(rect: PercentRect, zone: PercentRect, minInsidePercent = 55) {
  const area = rectArea(rect);
  if (!area) return false;
  return (intersectionArea(rect, zone) / area) * 100 >= minInsidePercent;
}

function getAssetRect(placement: ResponsiveAssetPlacement, imageAspectRatio: number, viewport: HeroViewportMode): PercentRect {
  const width = placement.width;
  const safeAspectRatio = Number.isFinite(imageAspectRatio) && imageAspectRatio > 0 ? imageAspectRatio : 1;
  const height = width * stageAspectRatio[viewport] / safeAspectRatio;

  return {
    left: placement.x - width / 2,
    right: placement.x + width / 2,
    top: placement.y - height / 2,
    bottom: placement.y + height / 2,
  };
}

function getViewportList(mode: HeroAutoArrangeMode): HeroViewportMode[] {
  if (mode === "both") return ["desktop", "mobile"];
  return [mode];
}

function changedFields(current: ResponsiveAssetPlacement, target: ResponsiveAssetPlacement) {
  const fields: Array<keyof ResponsiveAssetPlacement> = [
    "visible",
    "x",
    "y",
    "width",
    "opacity",
    "rotation",
    "zIndex",
    "fit",
    "blendMode",
  ];

  return fields.filter((field) => current[field] !== target[field]).map(String);
}

function loadImageAspect(src: string, fallback: number) {
  if (!src || typeof window === "undefined") return Promise.resolve(fallback);

  return new Promise<number>((resolve) => {
    const image = new Image();

    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        resolve(fallback);
        return;
      }
      resolve(image.naturalWidth / image.naturalHeight);
    };

    image.onerror = () => resolve(fallback);
    image.src = src;
  });
}

function buildTargetPlacement(
  asset: HeroAssetConfig,
  viewport: HeroViewportMode,
  current: ResponsiveAssetPlacement,
  imageAspectRatio: number,
) {
  const base = smartTargets[viewport][asset.id];
  const target = { ...base };

  if (!asset.src && !asset.required) {
    target.visible = false;
  }

  if (!asset.required && slotRules[asset.id].optionalHiddenIsOk && !current.visible && base.visible) {
    target.visible = false;
  }

  if (asset.id === "gardenPhotoPlate" && viewport === "desktop") {
    if (imageAspectRatio > 1.05) target.width = 31;
    if (imageAspectRatio < 0.72) target.width = 27;
  }

  if ((asset.id === "floralTopLeft" || asset.id === "floralBottomRight") && imageAspectRatio > 1.35) {
    target.width = viewport === "desktop" ? 34 : 84;
  }

  if (asset.id === "floralMeadowDivider" && imageAspectRatio > 5) {
    target.width = viewport === "desktop" ? 34 : 76;
  }

  return clampPlacement(target);
}

export function polishWeddingHeroConfigForPublic(inputConfig: WeddingHeroEditorConfig): WeddingHeroEditorConfig {
  const normalized = normalizeWeddingHeroEditorConfig(inputConfig);

  return {
    ...normalized,
    canvas: {
      aspectRatio: "16:9",
      backgroundColor: "#FEF8E7",
      previewWidth: 1440,
    },
    assets: normalized.assets.map((asset) => {
      const desktop = buildTargetPlacement(asset, "desktop", asset.desktop, getHeroAssetFallbackAspectRatio(asset.id));
      const mobile = buildTargetPlacement(asset, "mobile", asset.mobile, getHeroAssetFallbackAspectRatio(asset.id));

      return {
        ...asset,
        desktop,
        mobile,
      };
    }),
  };
}

function evaluatePlacement(
  asset: HeroAssetConfig,
  viewport: HeroViewportMode,
  current: ResponsiveAssetPlacement,
  target: ResponsiveAssetPlacement,
  imageAspectRatio: number,
) {
  const reasons: string[] = [];
  const rule = slotRules[asset.id];
  const currentRect = getAssetRect(current, imageAspectRatio, viewport);
  const stageZone = viewport === "desktop" ? desktopStageZone : mobileStageZone;
  const curatedChanges = changedFields(current, target);

  if (!asset.src && asset.required) {
    reasons.push("required slot đang thiếu ảnh, tao giữ nguyên vị trí và chỉ báo lỗi");
    return { shouldPatch: false, reasons };
  }

  if (!current.visible && !target.visible) return { shouldPatch: false, reasons };

  if (current.visible !== target.visible) {
    if (target.visible) {
      reasons.push("required/primary slot đang bị tắt");
    } else if (rule.mustHideWhenTargetHidden) {
      reasons.push("slot này là texture/reference nên Smart Arrange ẩn để khỏi phá hero");
    } else {
      reasons.push("slot nên ẩn trong viewport này");
    }
  }

  if (current.visible && !isMostlyInside(currentRect, stageZone, 45)) {
    reasons.push("asset đang trôi quá xa khỏi stage");
  }

  const positionDistance = Math.hypot(current.x - target.x, current.y - target.y);
  if (positionDistance > rule.positionTolerance) {
    reasons.push("vị trí lệch khỏi vùng bố cục chuẩn");
  }

  if (Math.abs(current.width - target.width) > rule.widthTolerance) {
    reasons.push("scale chưa fit với slot");
  }

  if (Math.abs(current.opacity - target.opacity) > rule.opacityTolerance) {
    reasons.push("opacity đang làm layout nặng hoặc chìm");
  }

  if (Math.abs(current.rotation - target.rotation) > (rule.rotationTolerance ?? 8)) {
    reasons.push("rotation lệch khỏi hướng trang trí");
  }

  if (Math.abs(current.zIndex - target.zIndex) > (rule.zTolerance ?? 1)) {
    reasons.push("z-index chưa đúng layer");
  }

  if (current.fit !== target.fit) {
    reasons.push("object-fit chưa đúng loại asset");
  }

  if (current.blendMode !== target.blendMode) {
    reasons.push("blend mode chưa đúng vai trò asset");
  }

  if (current.visible && rule.requireMostlyIn && !isMostlyInside(currentRect, rule.requireMostlyIn, 48)) {
    reasons.push("asset chưa nằm trong vùng visual chính");
  }

  if (current.visible && rule.avoidText) {
    const maxOverlap = Math.max(...textZones[viewport].map((zone) => overlapPercent(currentRect, zone)));
    if (maxOverlap > 8) reasons.push("asset đang đè vào vùng chữ/CTA");
  }

  if (current.visible && rule.allowTextOverlap !== undefined) {
    const maxOverlap = Math.max(...textZones[viewport].map((zone) => overlapPercent(currentRect, zone)));
    if (maxOverlap > rule.allowTextOverlap) reasons.push("decor đang phủ quá nhiều lên vùng chữ");
  }

  if (reasons.length === 0 && curatedChanges.length > 0) {
    reasons.push("áp preset curated để hero sạch và có hierarchy hơn");
  }

  return { shouldPatch: reasons.length > 0, reasons };
}

export async function smartArrangeWeddingHeroConfig(
  inputConfig: WeddingHeroEditorConfig,
  mode: HeroAutoArrangeMode = "both",
): Promise<{ config: WeddingHeroEditorConfig; report: HeroAutoLayoutReportItem[] }> {
  const normalized = normalizeWeddingHeroEditorConfig(inputConfig);
  const viewports = getViewportList(mode);
  const report: HeroAutoLayoutReportItem[] = [];
  const nextAssets = await Promise.all(normalized.assets.map(async (asset) => {
    const imageAspectRatio = await loadImageAspect(asset.src, getHeroAssetFallbackAspectRatio(asset.id));
    let nextAsset = asset;

    for (const viewport of viewports) {
      const current = viewport === "mobile" ? nextAsset.mobile : nextAsset.desktop;
      const target = buildTargetPlacement(nextAsset, viewport, current, imageAspectRatio);
      const evaluation = evaluatePlacement(nextAsset, viewport, current, target, imageAspectRatio);

      if (!evaluation.shouldPatch) {
        if (evaluation.reasons.length > 0) {
          report.push({
            id: nextAsset.id,
            label: nextAsset.label,
            viewport,
            reason: evaluation.reasons.join(", "),
            changed: [],
          });
        }
        continue;
      }

      const changed = changedFields(current, target);
      nextAsset = {
        ...nextAsset,
        [viewport]: target,
      };

      report.push({
        id: nextAsset.id,
        label: nextAsset.label,
        viewport,
        reason: evaluation.reasons.join(", "),
        changed,
      });
    }

    return nextAsset;
  }));

  return {
    config: {
      ...normalized,
      canvas: {
        aspectRatio: "16:9",
        backgroundColor: "#FEF8E7",
        previewWidth: 1440,
      },
      assets: nextAssets,
    },
    report,
  };
}
