export const themePresets = {
  "rose-quartz-serenity": {
    name: "Rose Quartz Serenity Garden",
    description: "Tone đã chốt: Rose Quartz + Serenity, thêm cream/gold để ra Enchanted Garden vintage.",
    colors: {
      background: "#FDFBF7",
      card: "#FFFFFF",
      primary: "#8FAADC",
      accent: "#F2C6CF",
      text: "#2F3A35",
      muted: "#7B8291",
      border: "#E9DDE5",
    },
  },
  "dalat-garden-elegant": {
    name: "Dalat Garden Elegant",
    description: "Ivory, champagne, olive green — sang nhẹ và rất Đà Lạt.",
    colors: {
      background: "#F8F3EA",
      card: "#FFFDF8",
      primary: "#6B7A5A",
      accent: "#D6BFA3",
      text: "#2E2A25",
      muted: "#8A8178",
      border: "#E8DDCC",
    },
  },
  "ivory-resort-classic": {
    name: "Ivory Resort Classic",
    description: "Sáng, sạch, premium resort, ít garden hơn.",
    colors: {
      background: "#FAF6EF",
      card: "#FFFFFF",
      primary: "#9A7B55",
      accent: "#E4CDA7",
      text: "#2D2926",
      muted: "#8C8278",
      border: "#E9DDCF",
    },
  },
  "warm-terracotta-evening": {
    name: "Warm Terracotta Evening",
    description: "Ấm hơn, hợp tiệc tối ngoài trời và ánh đèn vàng.",
    colors: {
      background: "#F6EEE4",
      card: "#FFF9F1",
      primary: "#9B5F43",
      accent: "#C99668",
      text: "#332820",
      muted: "#8D7565",
      border: "#E8D6C4",
    },
  },
} as const;

export type ThemeKey = keyof typeof themePresets;
