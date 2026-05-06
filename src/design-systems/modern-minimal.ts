import type { WeddingDesignSystem } from "@/lib/design-system";

export const modernMinimalDesignSystem = {
  key: "modern-minimal",
  name: "Modern Minimal",
  colorTokens: {
    background: "#F8F6F0",
    card: "#FFFFFF",
    primary: "#2E2A25",
    accent: "#DDD3C6",
    text: "#2E2A25",
    muted: "#6D6A63",
    border: "#E7E0D6",
  },
  typographyIntent: ["Typography leads the design.", "Headlines can be large, but copy should stay minimal.", "Use clear hierarchy instead of ornaments."],
  spacingRhythmRules: ["More whitespace, fewer blocks.", "One primary action per section.", "Mobile should feel calm and fast to scan."],
  sectionCompositionRules: ["Every section needs a reason to exist.", "Venue/time and RSVP should be extremely clear.", "Gallery should not overwhelm the main invite."],
  motifFloralRules: ["Use little to no floral motif.", "If used, motifs should be line-art or barely visible.", "No dense borders."],
  motionRules: ["Use minimal fade/lift only.", "No looping ornamental motion.", "Disable unnecessary media animations."],
  imageTreatmentRules: ["Prefer one strong hero image.", "Use clean crops and neutral overlays.", "Avoid heavy texture stacks."],
  copyVoice: ["Short.", "Direct.", "Warm only where needed."],
  dos: ["Remove redundant copy.", "Check mobile first.", "Keep RSVP obvious."],
  donts: ["Do not add decorative clutter.", "Do not use many media layers.", "Do not create long prose sections."],
  recommendedPreviewContexts: ["mobile", "desktop", "print-card"],
} satisfies WeddingDesignSystem;
