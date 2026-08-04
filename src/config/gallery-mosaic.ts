export type GalleryViewportKey = "mobile" | "tablet" | "desktop";
export type GalleryLightboxFrame = "portrait" | "landscape" | "wide" | "square";

export type GalleryPlacement = {
  gridColumn: string;
  gridRow: string;
};

export type GallerySlotGuide = {
  title: string;
  note: string;
  ratioLabel: string;
  aspectClass: string;
  lightboxFrame: GalleryLightboxFrame;
};

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

export const galleryLayoutKeys = [
  "mosaic",
  "editorial",
  "columns",
  "spotlight",
  "story",
  "magazine",
  "panorama",
  "portraits",
  "rhythm",
] as const;

export type GalleryLayoutKey = (typeof galleryLayoutKeys)[number];
export type ResponsiveGalleryLayouts = Record<GalleryViewportKey, GalleryLayoutKey>;

export type GalleryLayoutOption = {
  id: GalleryLayoutKey;
  label: string;
  description: string;
  bestFor: string;
  mobileNote: string;
};

export const galleryLayoutOptions: GalleryLayoutOption[] = [
  {
    id: "mosaic",
    label: "Mosaic hiện tại",
    description: "Nhịp ảnh lớn nhỏ tự nhiên, giữ tinh thần gallery đang dùng.",
    bestFor: "Bộ ảnh có cả ảnh ngang, ảnh dọc và cận cảnh.",
    mobileNote: "Ảnh mở đầu toàn chiều ngang, hai ảnh dọc đặt cạnh nhau.",
  },
  {
    id: "editorial",
    label: "Ảnh bìa + 4 ảnh",
    description: "Một ảnh bìa điện ảnh, bốn ảnh phụ cân đối phía dưới.",
    bestFor: "Một ảnh chủ lực thật đẹp và bốn chân dung đồng bộ.",
    mobileNote: "Ảnh bìa lớn, bốn ảnh phụ chia thành hai hàng rõ ràng.",
  },
  {
    id: "columns",
    label: "Dải ảnh đều",
    description: "Năm ảnh cùng nhịp, sạch sẽ và có tính thời trang.",
    bestFor: "Bộ ảnh dọc, toàn thân hoặc chân dung có ánh sáng đồng nhất.",
    mobileNote: "Một ảnh dẫn nhịp và bốn ảnh dọc gọn thành hai cặp.",
  },
  {
    id: "spotlight",
    label: "Tiêu điểm trung tâm",
    description: "Ảnh chính nằm giữa, bốn khoảnh khắc phụ ôm hai bên.",
    bestFor: "Ảnh đôi nổi bật ở ô giữa; ảnh phụ là chi tiết và cảm xúc.",
    mobileNote: "Ảnh trung tâm lên đầu, bốn ảnh phụ tạo nhịp so le bên dưới.",
  },
  {
    id: "story",
    label: "Câu chuyện dọc",
    description: "Dẫn mắt theo từng chương, giống một trang nhật ký ảnh.",
    bestFor: "Chuỗi ảnh có trình tự: toàn cảnh, chân dung, chi tiết, kết cảnh.",
    mobileNote: "Các ảnh xen kẽ ngang–dọc, cuộn xuống có nhịp kể chuyện.",
  },
  {
    id: "magazine",
    label: "Trang tạp chí",
    description: "Bố cục bất đối xứng tinh tế, sang và giàu khoảng thở.",
    bestFor: "Ảnh thời trang, ảnh có bố cục mạnh và nhiều khoảng trống đẹp.",
    mobileNote: "Một ảnh dọc nổi bật đi cùng các ảnh ngang ngắn, không bị đều đều.",
  },
  {
    id: "panorama",
    label: "Toàn cảnh điện ảnh",
    description: "Ưu tiên ảnh ngang rộng, điểm xuyết một cặp chân dung.",
    bestFor: "Ảnh phong cảnh Đà Lạt, địa điểm cưới và ảnh đôi toàn cảnh.",
    mobileNote: "Ba dải ngang lớn xen một cặp ảnh dọc, xem rõ cả bối cảnh.",
  },
  {
    id: "portraits",
    label: "Chân dung đan xen",
    description: "Tôn gương mặt, trang phục và những khoảnh khắc gần gũi.",
    bestFor: "Ảnh bán thân, toàn thân, váy cưới và biểu cảm rõ nét.",
    mobileNote: "Ảnh chân dung cao thấp đan nhau, ảnh cuối dùng làm nhịp kết.",
  },
  {
    id: "rhythm",
    label: "Nhịp so le",
    description: "Các khối ảnh dịch nhịp nhẹ, vui mắt nhưng vẫn gọn gàng.",
    bestFor: "Bộ ảnh tự nhiên, chuyển động và khoảnh khắc candid.",
    mobileNote: "Hai ảnh mở đầu so le, ảnh giữa mở rộng rồi khép bằng một cặp ảnh.",
  },
];

const p = (gridColumn: string, gridRow: string): GalleryPlacement => ({ gridColumn, gridRow });

type GalleryLayoutDefinition = {
  placements: Record<GalleryViewportKey, GalleryPlacement[]>;
  guides: GallerySlotGuide[];
};

const guide = (
  title: string,
  note: string,
  ratioLabel: string,
  aspectClass: string,
  lightboxFrame: GalleryLightboxFrame,
): GallerySlotGuide => ({ title, note, ratioLabel, aspectClass, lightboxFrame });

const standardGuides = {
  landscape: guide("Ảnh ngang", "Ưu tiên ảnh đôi hoặc toàn cảnh, chủ thể không sát mép.", "4:3", "aspect-[4/3]", "landscape"),
  wide: guide("Ảnh ngang rộng", "Hợp ảnh có nhiều bối cảnh và khoảng thở hai bên.", "16:9", "aspect-video", "wide"),
  portrait: guide("Ảnh dọc", "Hợp chân dung, toàn thân, váy cưới hoặc khoảnh khắc ôm nhau.", "3:4", "aspect-[3/4]", "portrait"),
  square: guide("Ảnh vuông", "Chọn ảnh cận cảnh, chủ thể nằm gần trung tâm.", "1:1", "aspect-square", "square"),
};

const definitions: Record<GalleryLayoutKey, GalleryLayoutDefinition> = {
  mosaic: {
    placements: {
      mobile: [p("1 / span 4", "1 / span 3"), p("1 / span 2", "4 / span 4"), p("3 / span 2", "4 / span 4"), p("1 / span 4", "8 / span 3"), p("1 / span 4", "11 / span 3")],
      tablet: [p("1 / span 5", "1 / span 3"), p("6 / span 3", "1 / span 6"), p("1 / span 3", "4 / span 3"), p("4 / span 2", "4 / span 3"), p("1 / span 8", "7 / span 3")],
      desktop: [p("1 / span 4", "1 / span 2"), p("5 / span 3", "1 / span 6"), p("8 / span 5", "1 / span 2"), p("1 / span 4", "3 / span 4"), p("8 / span 5", "3 / span 4")],
    },
    guides: [standardGuides.landscape, standardGuides.portrait, standardGuides.wide, standardGuides.portrait, standardGuides.landscape],
  },
  editorial: {
    placements: {
      mobile: [p("1 / span 4", "1 / span 4"), p("1 / span 2", "5 / span 4"), p("3 / span 2", "5 / span 4"), p("1 / span 2", "9 / span 4"), p("3 / span 2", "9 / span 4")],
      tablet: [p("1 / span 8", "1 / span 4"), p("1 / span 2", "5 / span 4"), p("3 / span 2", "5 / span 4"), p("5 / span 2", "5 / span 4"), p("7 / span 2", "5 / span 4")],
      desktop: [p("1 / span 12", "1 / span 3"), p("1 / span 3", "4 / span 3"), p("4 / span 3", "4 / span 3"), p("7 / span 3", "4 / span 3"), p("10 / span 3", "4 / span 3")],
    },
    guides: [standardGuides.wide, standardGuides.portrait, standardGuides.portrait, standardGuides.portrait, standardGuides.portrait],
  },
  columns: {
    placements: {
      mobile: [p("1 / span 4", "1 / span 3"), p("1 / span 2", "4 / span 4"), p("3 / span 2", "4 / span 4"), p("1 / span 2", "8 / span 4"), p("3 / span 2", "8 / span 4")],
      tablet: [p("1 / span 2", "1 / span 6"), p("3 / span 3", "1 / span 6"), p("6 / span 3", "1 / span 6"), p("1 / span 4", "7 / span 3"), p("5 / span 4", "7 / span 3")],
      desktop: [p("1 / span 2", "1 / span 6"), p("3 / span 3", "1 / span 6"), p("6 / span 2", "1 / span 6"), p("8 / span 3", "1 / span 6"), p("11 / span 2", "1 / span 6")],
    },
    guides: [standardGuides.portrait, standardGuides.portrait, standardGuides.portrait, standardGuides.portrait, standardGuides.portrait],
  },
  spotlight: {
    placements: {
      mobile: [p("1 / span 4", "1 / span 4"), p("1 / span 2", "5 / span 3"), p("3 / span 2", "5 / span 3"), p("1 / span 2", "8 / span 3"), p("3 / span 2", "8 / span 3")],
      tablet: [p("3 / span 4", "1 / span 6"), p("1 / span 2", "1 / span 3"), p("7 / span 2", "1 / span 3"), p("1 / span 2", "4 / span 3"), p("7 / span 2", "4 / span 3")],
      desktop: [p("4 / span 6", "1 / span 6"), p("1 / span 3", "1 / span 3"), p("10 / span 3", "1 / span 3"), p("1 / span 3", "4 / span 3"), p("10 / span 3", "4 / span 3")],
    },
    guides: [standardGuides.portrait, standardGuides.landscape, standardGuides.landscape, standardGuides.landscape, standardGuides.landscape],
  },
  story: {
    placements: {
      mobile: [p("1 / span 4", "1 / span 3"), p("1 / span 2", "4 / span 4"), p("3 / span 2", "4 / span 3"), p("3 / span 2", "7 / span 4"), p("1 / span 2", "8 / span 3")],
      tablet: [p("1 / span 5", "1 / span 3"), p("6 / span 3", "1 / span 6"), p("1 / span 5", "4 / span 3"), p("1 / span 3", "7 / span 5"), p("4 / span 5", "7 / span 5")],
      desktop: [p("1 / span 7", "1 / span 3"), p("8 / span 5", "1 / span 6"), p("1 / span 7", "4 / span 3"), p("1 / span 5", "7 / span 6"), p("6 / span 7", "7 / span 6")],
    },
    guides: [standardGuides.wide, standardGuides.portrait, standardGuides.landscape, standardGuides.portrait, standardGuides.wide],
  },
  magazine: {
    placements: {
      mobile: [p("1 / span 3", "1 / span 5"), p("4 / span 1", "1 / span 2"), p("4 / span 1", "3 / span 3"), p("1 / span 2", "6 / span 3"), p("3 / span 2", "6 / span 3")],
      tablet: [p("1 / span 4", "1 / span 6"), p("5 / span 4", "1 / span 3"), p("5 / span 2", "4 / span 3"), p("7 / span 2", "4 / span 3"), p("1 / span 8", "7 / span 3")],
      desktop: [p("1 / span 5", "1 / span 6"), p("6 / span 7", "1 / span 3"), p("6 / span 3", "4 / span 3"), p("9 / span 4", "4 / span 3"), p("1 / span 12", "7 / span 3")],
    },
    guides: [standardGuides.portrait, standardGuides.wide, standardGuides.portrait, standardGuides.landscape, standardGuides.wide],
  },
  panorama: {
    placements: {
      mobile: [p("1 / span 4", "1 / span 3"), p("1 / span 4", "4 / span 3"), p("1 / span 2", "7 / span 4"), p("3 / span 2", "7 / span 4"), p("1 / span 4", "11 / span 3")],
      tablet: [p("1 / span 8", "1 / span 3"), p("1 / span 8", "4 / span 3"), p("1 / span 4", "7 / span 4"), p("5 / span 4", "7 / span 4"), p("1 / span 8", "11 / span 3")],
      desktop: [p("1 / span 12", "1 / span 3"), p("1 / span 7", "4 / span 6"), p("8 / span 5", "4 / span 6"), p("1 / span 5", "10 / span 6"), p("6 / span 7", "10 / span 6")],
    },
    guides: [standardGuides.wide, standardGuides.wide, standardGuides.portrait, standardGuides.portrait, standardGuides.wide],
  },
  portraits: {
    placements: {
      mobile: [p("1 / span 2", "1 / span 4"), p("3 / span 2", "1 / span 5"), p("1 / span 2", "5 / span 5"), p("3 / span 2", "6 / span 4"), p("1 / span 4", "10 / span 3")],
      tablet: [p("1 / span 2", "1 / span 6"), p("3 / span 2", "1 / span 6"), p("5 / span 2", "1 / span 6"), p("7 / span 2", "1 / span 6"), p("1 / span 8", "7 / span 3")],
      desktop: [p("1 / span 3", "1 / span 6"), p("4 / span 3", "1 / span 6"), p("7 / span 3", "1 / span 6"), p("10 / span 3", "1 / span 6"), p("1 / span 12", "7 / span 3")],
    },
    guides: [standardGuides.portrait, standardGuides.portrait, standardGuides.portrait, standardGuides.portrait, standardGuides.landscape],
  },
  rhythm: {
    placements: {
      mobile: [p("1 / span 2", "1 / span 4"), p("3 / span 2", "1 / span 3"), p("3 / span 2", "4 / span 2"), p("1 / span 2", "5 / span 4"), p("3 / span 2", "6 / span 3")],
      tablet: [p("1 / span 3", "1 / span 5"), p("4 / span 5", "1 / span 3"), p("4 / span 5", "4 / span 3"), p("1 / span 3", "6 / span 5"), p("4 / span 5", "7 / span 4")],
      desktop: [p("1 / span 5", "1 / span 5"), p("6 / span 7", "1 / span 3"), p("6 / span 7", "4 / span 3"), p("1 / span 5", "6 / span 5"), p("6 / span 7", "7 / span 4")],
    },
    guides: [standardGuides.portrait, standardGuides.landscape, standardGuides.wide, standardGuides.portrait, standardGuides.landscape],
  },
};

export function normalizeGalleryLayoutKey(layout: string | undefined): GalleryLayoutKey {
  return galleryLayoutKeys.includes(layout as GalleryLayoutKey) ? layout as GalleryLayoutKey : "mosaic";
}

export function resolveResponsiveGalleryLayouts(
  layouts: Partial<Record<GalleryViewportKey, string>> | undefined,
  legacyLayout: string | undefined = "mosaic",
): ResponsiveGalleryLayouts {
  const fallback = normalizeGalleryLayoutKey(legacyLayout);
  return {
    mobile: normalizeGalleryLayoutKey(layouts?.mobile ?? fallback),
    tablet: normalizeGalleryLayoutKey(layouts?.tablet ?? fallback),
    desktop: normalizeGalleryLayoutKey(layouts?.desktop ?? fallback),
  };
}

export function getGalleryLayoutOption(layout: string | undefined) {
  const safeLayout = normalizeGalleryLayoutKey(layout);
  return galleryLayoutOptions.find((option) => option.id === safeLayout) ?? galleryLayoutOptions[0];
}

export function getGalleryPlacement(layout: string | undefined, viewport: GalleryViewportKey, index: number) {
  const safeLayout = normalizeGalleryLayoutKey(layout);
  return definitions[safeLayout].placements[viewport][index] ?? definitions.mosaic.placements[viewport][index];
}

export function getGallerySlotGuide(layout: string | undefined, index: number) {
  const safeLayout = normalizeGalleryLayoutKey(layout);
  return definitions[safeLayout].guides[index] ?? definitions.mosaic.guides[index];
}

export function getGalleryMosaicSlots(layout: GalleryLayoutKey | string | undefined = "mosaic") {
  const safeLayout = normalizeGalleryLayoutKey(layout);
  return galleryMosaicSlots.map((slot, index) => {
    const placement = definitions[safeLayout].placements.desktop[index];
    const guideForSlot = definitions[safeLayout].guides[index];
    return {
      ...slot,
      ...placement,
      title: guideForSlot.title,
      note: guideForSlot.note,
      aspectClass: guideForSlot.aspectClass,
      ratioLabel: guideForSlot.ratioLabel,
      lightboxFrame: guideForSlot.lightboxFrame,
      placements: {
        mobile: definitions[safeLayout].placements.mobile[index],
        tablet: definitions[safeLayout].placements.tablet[index],
        desktop: placement,
      },
    };
  });
}

export function getGalleryTileSizes(index: number, layout: string | undefined = "mosaic") {
  const guideForSlot = getGallerySlotGuide(layout, index);
  const mobileSize = guideForSlot.lightboxFrame === "portrait" ? "48vw" : "94vw";
  return `(max-width: 767px) ${mobileSize}, (max-width: 1023px) 50vw, 33vw`;
}
