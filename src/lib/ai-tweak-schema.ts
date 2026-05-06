import type { WeddingConfig } from "@/lib/site-settings";

export type AiTweakKey =
  | "more-formal"
  | "less-formal"
  | "more-floral"
  | "less-floral"
  | "more-editorial"
  | "stronger-rsvp"
  | "softer-animation"
  | "richer-venue"
  | "improve-mobile-crop"
  | "vietnamese-english-balance"
  | "shorter-warmer-copy";

export type AiPatchOperation = {
  op: "replace";
  path: string;
  value: string | number | boolean | string[];
};

export type AiTweakSuggestion = {
  id: string;
  key: AiTweakKey;
  label: string;
  summary: string;
  patch: AiPatchOperation[];
  createdAt: string;
};

export const aiTweakOptions = [
  { key: "more-formal", label: "More formal", description: "Trang trọng hơn, wording gọn và nghi lễ hơn." },
  { key: "less-formal", label: "Less formal", description: "Ấm áp, tự nhiên, ít nghi thức hơn." },
  { key: "more-floral", label: "More floral", description: "Tăng density hoa/vườn bằng background và copy cues." },
  { key: "less-floral", label: "Less floral", description: "Giảm cảm giác hoa, nghiêng về giấy cưới/typography." },
  { key: "more-editorial", label: "More editorial", description: "Ít chữ hơn, giống magazine cưới cao cấp." },
  { key: "stronger-rsvp", label: "Stronger RSVP", description: "CTA rõ hơn, nhấn deadline và lưu trú." },
  { key: "softer-animation", label: "Softer animation", description: "Giảm chuyển động để cảm giác premium hơn." },
  { key: "richer-venue", label: "Richer venue", description: "Làm section venue giàu bối cảnh Đà Lạt hơn." },
  { key: "improve-mobile-crop", label: "Improve mobile crop", description: "Đề xuất crop/scale hero mobile an toàn." },
  { key: "vietnamese-english-balance", label: "VN/EN balance", description: "Cân lại tiếng Việt và nhãn tiếng Anh." },
  { key: "shorter-warmer-copy", label: "Shorter warm copy", description: "Rút ngắn lời mời nhưng vẫn ấm." },
] as const satisfies readonly { key: AiTweakKey; label: string; description: string }[];

const allowedPatchPaths = new Set([
  "invitation.title",
  "invitation.message",
  "invitation.closing",
  "sections.hero.eyebrow",
  "sections.hero.locationLine",
  "sections.invitation.eyebrow",
  "sections.itinerary.eyebrow",
  "sections.itinerary.title",
  "sections.itinerary.description",
  "sections.venue.description",
  "sections.guestNotes.title",
  "sections.guestNotes.description",
  "sections.cta.eyebrow",
  "sections.cta.title",
  "sections.cta.description",
  "sections.cta.buttonLabel",
  "appearance.backgrounds.invitation",
  "appearance.backgrounds.itinerary",
  "appearance.backgrounds.venue",
  "appearance.backgrounds.dressCode",
  "appearance.backgrounds.guestNotes",
  "appearance.backgrounds.gallery",
  "appearance.backgrounds.cta",
  "appearance.mediaLayers.hero.0.animation",
  "appearance.mediaLayers.hero.0.scale.mobile",
  "appearance.mediaLayers.hero.0.objectPosition.mobile",
  "dressCode.title",
  "dressCode.note",
  "dressCode.colors",
  "theme.animationEnabled",
]);

function getPathValue(source: unknown, path: string): unknown {
  return path.split(".").reduce((cursor, part) => {
    if (cursor && typeof cursor === "object") return (cursor as Record<string, unknown>)[part];
    return undefined;
  }, source);
}

export function isAllowedAiPatch(operation: AiPatchOperation) {
  return operation.op === "replace" && allowedPatchPaths.has(operation.path);
}

export function applyAiPatch(content: WeddingConfig, patch: AiPatchOperation[]): WeddingConfig {
  const next = structuredClone(content) as WeddingConfig;

  for (const operation of patch) {
    if (!isAllowedAiPatch(operation)) continue;
    const parts = operation.path.split(".");
    let cursor: Record<string, unknown> = next as Record<string, unknown>;

    for (const part of parts.slice(0, -1)) {
      const current = cursor[part];
      if (!current || typeof current !== "object") break;
      cursor = current as Record<string, unknown>;
    }

    cursor[parts[parts.length - 1]] = operation.value;
  }

  return next;
}

export function describeAiPatch(content: WeddingConfig, patch: AiPatchOperation[]) {
  return patch.filter(isAllowedAiPatch).map((operation) => ({
    path: operation.path,
    before: getPathValue(content, operation.path),
    after: operation.value,
  }));
}
