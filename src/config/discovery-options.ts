export const toneOptions = [
  { value: "formal", label: "Trang trọng", description: "Nghi lễ, wording gọn và chỉn chu." },
  { value: "romantic", label: "Lãng mạn", description: "Ấm áp, mềm mại, giàu cảm xúc." },
  { value: "editorial", label: "Sang trọng", description: "Ít chữ, giống một trang tạp chí cưới." },
  { value: "playful", label: "Tự nhiên", description: "Gần gũi, có chút vui tươi." },
  { value: "minimal", label: "Tối giản", description: "Nhiều khoảng thở, tập trung vào thông tin chính." },
] as const;

export const mustHaveSectionOptions = [
  { value: "timeline", label: "Lịch trình" },
  { value: "venue", label: "Địa điểm / Bản đồ" },
  { value: "dressCode", label: "Trang phục" },
  { value: "accommodation", label: "Lưu trú" },
  { value: "gallery", label: "Album ảnh" },
  { value: "rsvp", label: "Hồi đáp" },
] as const;

export const priorityOptions = [
  { value: "digital", label: "Ưu tiên bản số" },
  { value: "print", label: "Ưu tiên bản in" },
  { value: "both", label: "Cân bằng hai bản" },
] as const;
