import type { WeddingDesignSystem } from "@/lib/design-system";

export const dalatGardenElegantDesignSystem = {
  key: "dalat-garden-elegant",
  name: "Đà Lạt Garden Elegant",
  colorTokens: {
    background: "#FBF7EF",
    card: "#FFFDF8",
    primary: "#6F7E68",
    accent: "#EAD9C2",
    text: "#2F332B",
    muted: "#7C746A",
    border: "#E5D8C7",
  },
  typographyIntent: ["Headlines should feel resort-elegant, not rustic.", "Body copy should explain logistics clearly.", "Labels can reference venue, garden, lake, and arrival details."],
  spacingRhythmRules: ["Venue and guest-note sections can carry denser information.", "Keep cards breathable so logistics do not feel administrative.", "Use warm blocks for information hierarchy."],
  sectionCompositionRules: ["Venue section should highlight Hồ Tuyền Lâm and arrival guidance.", "Itinerary should make the evening flow obvious.", "Guest notes should reduce uncertainty about weather and accommodation."],
  motifFloralRules: ["Botanical cues should feel like resort garden details.", "Use foliage, linen, and warm beige more than heavy florals.", "Avoid tropical destination clichés."],
  motionRules: ["Balanced motion: gentle reveals and subtle media movement.", "Venue and itinerary should animate clearly but calmly.", "Keep video layers functional, not distracting."],
  imageTreatmentRules: ["Prefer venue, lake, pine, and evening-light imagery.", "Use warm overlay for consistency.", "Map/arrival visuals should stay legible."],
  copyVoice: ["Warm, practical, and premium.", "Mention Đà Lạt context where helpful.", "Avoid over-formal ceremony language."],
  dos: ["Make guest logistics easy.", "Show the resort atmosphere.", "Use accommodation notes prominently."],
  donts: ["Do not let destination details bury the invitation emotion.", "Do not use too many postcard effects.", "Do not make venue cards cramped."],
  recommendedPreviewContexts: ["mobile", "desktop", "tablet"],
} satisfies WeddingDesignSystem;
