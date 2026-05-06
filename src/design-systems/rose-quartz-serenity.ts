import type { WeddingDesignSystem } from "@/lib/design-system";

export const roseQuartzSerenityDesignSystem = {
  key: "rose-quartz-serenity",
  name: "Rose Quartz Serenity Garden",
  colorTokens: {
    background: "#FDFBF7",
    card: "#FFFFFF",
    primary: "#8FAADC",
    accent: "#F2C6CF",
    text: "#2F3A35",
    muted: "#7B8291",
    border: "#E9DDE5",
  },
  typographyIntent: ["Serif headlines should feel like luxury printed stationery.", "Body copy stays calm, readable, and warm on mobile.", "Use small uppercase labels sparingly for editorial rhythm."],
  spacingRhythmRules: ["Keep generous vertical breathing room between emotional beats.", "Cards should feel layered like paper, not boxed SaaS modules.", "Mobile sections need clear headline-to-body proximity."],
  sectionCompositionRules: ["Hero must lead with couple, date, and place without clutter.", "Invitation copy should sit on a paper-like surface.", "CTA must feel romantic but unmistakably actionable."],
  motifFloralRules: ["Use florals as atmosphere and edges, never as noisy center content.", "Rose quartz and serenity blue should remain balanced.", "Gold/cream accents should be subtle."],
  motionRules: ["Prefer slow reveal, drift, veil, and paper-lift motion.", "Avoid repetitive bounce or landing-page-style animation.", "Respect reduced motion."],
  imageTreatmentRules: ["Use soft crop, garden texture, and gentle overlays.", "Hero imagery can be cinematic, gallery should feel album-like.", "Every meaningful image should have alt text."],
  copyVoice: ["Warm Vietnamese first.", "Romantic but not cheesy.", "A few English editorial labels are okay."],
  dos: ["Keep the invitation intimate and premium.", "Prioritize RSVP clarity.", "Use the checklist before publishing."],
  donts: ["Do not make it look like a SaaS landing page.", "Do not overload sections with too many video layers.", "Do not publish with placeholder names."],
  recommendedPreviewContexts: ["mobile", "desktop", "story", "print-card"],
} satisfies WeddingDesignSystem;
