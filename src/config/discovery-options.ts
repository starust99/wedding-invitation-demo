export const toneOptions = [
  { value: "formal", label: "Formal", description: "Trang trọng, nghi lễ, wording gọn và chỉn chu." },
  { value: "romantic", label: "Romantic", description: "Ấm áp, mềm mại, giàu cảm xúc." },
  { value: "editorial", label: "Editorial", description: "Sang, ít chữ, giống một trang magazine cưới." },
  { value: "playful", label: "Playful", description: "Tự nhiên, gần gũi, có chút vui tươi." },
  { value: "minimal", label: "Minimal", description: "Tinh giản, nhiều khoảng thở, tập trung vào thông tin chính." },
] as const;

export const mustHaveSectionOptions = [
  { value: "timeline", label: "Timeline" },
  { value: "venue", label: "Venue / Map" },
  { value: "dressCode", label: "Dress code" },
  { value: "accommodation", label: "Accommodation" },
  { value: "gallery", label: "Gallery" },
  { value: "rsvp", label: "RSVP" },
] as const;

export const priorityOptions = [
  { value: "digital", label: "Digital-first" },
  { value: "print", label: "Print-first" },
  { value: "both", label: "Digital + Print" },
] as const;
