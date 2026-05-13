import { artifactRecipes, type ArtifactRecipe, type ArtifactRecipeKey, type ArtifactStatus } from "@/config/artifact-recipes";
import type { WeddingDesignSystem } from "@/lib/design-system";
import type { WeddingConfig } from "@/lib/site-settings";

export type ArtifactState = {
  status: ArtifactStatus;
  lastGeneratedAt?: string;
  options?: Record<string, unknown>;
};

export type ArtifactSettings = WeddingConfig["project"]["artifacts"];

export type ArtifactSummary = ArtifactRecipe & {
  enabled: boolean;
  status: ArtifactStatus;
  lastGeneratedAt?: string;
  readiness: string[];
};

function recipeState(settings: ArtifactSettings, key: ArtifactRecipeKey): ArtifactState {
  const recipe = settings.recipes[key] as Partial<ArtifactState> | undefined;
  return {
    status: recipe?.status ?? "draft",
    lastGeneratedAt: recipe?.lastGeneratedAt,
    options: recipe?.options,
  };
}

export function summarizeArtifacts(content: WeddingConfig, designSystem: WeddingDesignSystem): ArtifactSummary[] {
  return artifactRecipes.map((recipe) => {
    const state = recipeState(content.project.artifacts, recipe.key);
    const readiness: string[] = [];

    if (recipe.key === "web-invitation" && content.couple.displayName.includes("Cô Dâu")) readiness.push("Đổi tên cặp đôi khỏi tên giữ chỗ.");
    if (recipe.key === "venue-map-card" && !content.venue.mapUrl) readiness.push("Thêm Google Maps URL.");
    if (recipe.key === "story-share" && !designSystem.recommendedPreviewContexts.includes("story")) readiness.push("Hướng hiện tại không ưu tiên xem trước khung dọc.");
    if (recipe.key === "print-card" && !designSystem.recommendedPreviewContexts.includes("print-card")) readiness.push("Kiểm tra khung thiệp in trước khi xuất.");
    if (recipe.key === "guest-info-card" && !content.accommodation.enabled) readiness.push("Lưu trú đang tắt, card sẽ chỉ còn thời tiết và trang phục.");

    return {
      ...recipe,
      enabled: content.project.artifacts.enabled.includes(recipe.key),
      status: state.status,
      lastGeneratedAt: state.lastGeneratedAt,
      readiness,
    };
  });
}

export function updateArtifactEnabled(artifacts: ArtifactSettings, key: ArtifactRecipeKey, enabled: boolean): ArtifactSettings {
  return {
    ...artifacts,
    enabled: enabled ? Array.from(new Set([...artifacts.enabled, key])) : artifacts.enabled.filter((item) => item !== key),
  } as ArtifactSettings;
}

export function markArtifactGenerated(artifacts: ArtifactSettings, key: ArtifactRecipeKey): ArtifactSettings {
  return {
    ...artifacts,
    enabled: Array.from(new Set([...artifacts.enabled, key])),
    recipes: {
      ...artifacts.recipes,
      [key]: {
        ...recipeState(artifacts, key),
        status: "ready",
        lastGeneratedAt: new Date().toISOString(),
      },
    },
  } as ArtifactSettings;
}
