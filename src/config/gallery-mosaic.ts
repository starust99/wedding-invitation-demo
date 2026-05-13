export type GalleryMosaicSlot = {
  id: string;
  label: string;
  title: string;
  note: string;
  gridColumn: string;
  gridRow: string;
  aspectClass: string;
  mobileWide: boolean;
  fallback: string;
};

export const galleryMosaicSlots: GalleryMosaicSlot[] = [
  {
    id: "opening-landscape",
    label: "Ô 1",
    title: "Ảnh ngang mở đầu",
    note: "Ảnh rộng, mood chính của album.",
    gridColumn: "1 / span 4",
    gridRow: "1 / span 2",
    aspectClass: "aspect-[4/3]",
    mobileWide: true,
    fallback:
      "radial-gradient(circle at 22% 24%, rgba(247, 202, 201, 0.64), transparent 34%), radial-gradient(circle at 78% 24%, rgba(212, 228, 247, 0.46), transparent 28%), linear-gradient(145deg, rgba(255, 253, 248, 0.96), rgba(247, 202, 201, 0.16))",
  },
  {
    id: "portrait-left",
    label: "Ô 2",
    title: "Ảnh dọc bên trái",
    note: "Chân dung hoặc chi tiết váy, hoa, tay nắm.",
    gridColumn: "5 / span 3",
    gridRow: "1 / span 6",
    aspectClass: "aspect-[3/4]",
    mobileWide: false,
    fallback:
      "radial-gradient(circle at 30% 20%, rgba(255, 253, 248, 0.94), transparent 30%), radial-gradient(circle at 68% 78%, rgba(181, 213, 164, 0.44), transparent 24%), linear-gradient(160deg, rgba(212, 228, 247, 0.26), rgba(247, 202, 201, 0.18))",
  },
  {
    id: "top-landscape",
    label: "Ô 3",
    title: "Ảnh ngang nhỏ",
    note: "Khoảnh khắc phụ, nên sáng và ít chi tiết.",
    gridColumn: "8 / span 5",
    gridRow: "1 / span 2",
    aspectClass: "aspect-[5/3]",
    mobileWide: false,
    fallback:
      "radial-gradient(circle at 22% 30%, rgba(212, 228, 247, 0.52), transparent 28%), radial-gradient(circle at 82% 72%, rgba(247, 202, 201, 0.48), transparent 28%), linear-gradient(145deg, rgba(255, 253, 248, 0.96), rgba(212, 228, 247, 0.16))",
  },
  {
    id: "bottom-portrait",
    label: "Ô 4",
    title: "Ảnh dọc lớn",
    note: "Ảnh cảm xúc, có chủ thể rõ.",
    gridColumn: "1 / span 4",
    gridRow: "3 / span 4",
    aspectClass: "aspect-[3/4]",
    mobileWide: true,
    fallback:
      "radial-gradient(circle at 24% 22%, rgba(181, 213, 164, 0.42), transparent 28%), radial-gradient(circle at 76% 78%, rgba(247, 202, 201, 0.5), transparent 30%), linear-gradient(155deg, rgba(255, 253, 248, 0.96), rgba(181, 213, 164, 0.18))",
  },
  {
    id: "closing-landscape",
    label: "Ô 5",
    title: "Ảnh ngang kết",
    note: "Ảnh rộng, khép lại nhịp gallery.",
    gridColumn: "8 / span 5",
    gridRow: "3 / span 4",
    aspectClass: "aspect-[4/3]",
    mobileWide: true,
    fallback:
      "radial-gradient(circle at 26% 24%, rgba(247, 202, 201, 0.56), transparent 28%), radial-gradient(circle at 74% 70%, rgba(212, 228, 247, 0.54), transparent 26%), linear-gradient(145deg, rgba(255, 253, 248, 0.96), rgba(146, 168, 209, 0.16))",
  },
];

export const galleryMosaicSlotCount = galleryMosaicSlots.length;

export function getGalleryTileSizes(index: number) {
  const mobileSize = galleryMosaicSlots[index]?.mobileWide ? "94vw" : "46vw";
  return `(max-width: 767px) ${mobileSize}, (max-width: 1023px) 50vw, 33vw`;
}
