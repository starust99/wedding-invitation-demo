export type ArtifactRecipeKey = "web-invitation" | "rsvp-form" | "save-the-date" | "print-card" | "story-share" | "guest-info-card" | "venue-map-card" | "thank-you-card";

export type ArtifactStatus = "draft" | "ready" | "exported";

export type ArtifactRecipe = {
  key: ArtifactRecipeKey;
  name: string;
  description: string;
  output: string;
  recommendedFor: string[];
  dependencies: string[];
};

export const artifactRecipes = [
  {
    key: "web-invitation",
    name: "Web Invitation",
    description: "Public full-page invitation with hero, schedule, venue, guest notes, gallery and RSVP CTA.",
    output: "Hosted responsive website",
    recommendedFor: ["all guests", "mobile sharing", "Vercel domain"],
    dependencies: ["couple", "event", "venue", "theme", "media"],
  },
  {
    key: "rsvp-form",
    name: "RSVP Form",
    description: "Guest confirmation flow with attendance, accommodation, dietary and transport fields.",
    output: "Interactive form",
    recommendedFor: ["guest operations", "accommodation planning"],
    dependencies: ["rsvp", "accommodation", "event"],
  },
  {
    key: "save-the-date",
    name: "Save The Date",
    description: "Short announcement artifact focused on couple, date, city and one hero visual.",
    output: "Shareable mini invitation",
    recommendedFor: ["early announcement", "chat sharing"],
    dependencies: ["couple", "date", "hero"],
  },
  {
    key: "print-card",
    name: "Print Card",
    description: "5x7 print-oriented approximation for physical card direction and copy density.",
    output: "Print layout metadata",
    recommendedFor: ["planner handoff", "physical stationery"],
    dependencies: ["invitation", "theme", "print preview"],
  },
  {
    key: "story-share",
    name: "Story Share",
    description: "9:16 vertical artifact for Instagram/Facebook story teaser.",
    output: "Story layout metadata",
    recommendedFor: ["social sharing", "visual teaser"],
    dependencies: ["hero", "date", "venue"],
  },
  {
    key: "guest-info-card",
    name: "Guest Info Card",
    description: "Compact logistics card for weather, accommodation, dress code and arrival notes.",
    output: "Guest note card metadata",
    recommendedFor: ["out-of-town guests", "family groups"],
    dependencies: ["weather", "accommodation", "dress code"],
  },
  {
    key: "venue-map-card",
    name: "Venue Map Card",
    description: "Venue-focused artifact with address, area, map link and arrival copy.",
    output: "Map card metadata",
    recommendedFor: ["arrival guidance", "driver sharing"],
    dependencies: ["venue", "map URL"],
  },
  {
    key: "thank-you-card",
    name: "Thank You Card",
    description: "Post-wedding artifact shell for a warm thank-you note and gallery highlight.",
    output: "Thank-you card metadata",
    recommendedFor: ["after wedding", "photo follow-up"],
    dependencies: ["gallery", "copy voice"],
  },
] as const satisfies readonly ArtifactRecipe[];
