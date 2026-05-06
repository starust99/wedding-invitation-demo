import type { WeddingDesignSystem } from "@/lib/design-system";

export const editorialBlackTieDesignSystem = {
  key: "editorial-black-tie",
  name: "Editorial Black Tie",
  colorTokens: {
    background: "#F7F1E8",
    card: "#FFFDF8",
    primary: "#45413C",
    accent: "#D8C3A5",
    text: "#1F1D1B",
    muted: "#7D756B",
    border: "#E4D8CA",
  },
  typographyIntent: ["Large serif headlines with magazine restraint.", "Short copy blocks, strong alignment, and quiet labels.", "Avoid decorative typography beyond the serif/display pairing."],
  spacingRhythmRules: ["Use negative space as luxury.", "Prefer fewer, larger cards.", "Keep line lengths narrow for invitation copy."],
  sectionCompositionRules: ["Hero can be formal and minimal.", "Invitation section should read like a printed announcement.", "Gallery should feel curated, not scrapbook."],
  motifFloralRules: ["Florals should be nearly absent or monochrome.", "Use thin lines, champagne details, and paper texture.", "No lush garden overload."],
  motionRules: ["Motion should be almost invisible: fade, lift, slow reveal.", "Avoid looping decorative motion.", "Prioritize perceived sophistication over spectacle."],
  imageTreatmentRules: ["Black-and-white or warm editorial crops work best.", "Use high contrast with careful readability.", "Keep image count restrained."],
  copyVoice: ["Formal.", "Concise.", "Ceremonial without being stiff."],
  dos: ["Cut excess copy.", "Use print-card preview often.", "Keep CTA elegant but clear."],
  donts: ["Do not use playful tone.", "Do not stack many ornaments.", "Do not over-animate."],
  recommendedPreviewContexts: ["desktop", "print-card", "mobile"],
} satisfies WeddingDesignSystem;
