"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { galleryLayoutOptions, galleryMosaicSlotCount, galleryMosaicSlots, type GalleryLayoutKey } from "@/config/gallery-mosaic";
import { timelineIconOptions } from "@/config/timeline-icons";
import { cleanBundledPublicAssetSrc } from "@/lib/asset-cleanup";
import { prepareImageFileForUpload } from "@/lib/image-compression";
import {
  draftStorageKey,
  getDraftSettings,
  normalizeSettings,
  publishedStorageKey,
  writeSettings,
  type SiteSettings,
  type WeddingConfig,
  defaultSettings,
} from "@/lib/site-settings";

type ImagePosition = {
  x: number;
  y: number;
};

const imageAccept = "image/*,.jpg,.jpeg,.jfif,.png,.webp,.gif,.svg,.avif,.bmp,.ico,.tif,.tiff,.heic,.heif";
const defaultObjectPosition = "50% 50%";
const localUploadMessage = "Đã lưu file vào public/uploads trên máy local. Nhấn Publish để public page nhận ảnh mới.";
const cloudinaryUploadMessage = "Đã upload ảnh lên Cloudinary CDN. Nhấn Publish để public page nhận ảnh mới.";


const shellClass =
  "rounded-[2rem] border border-[#2F3A35]/12 bg-[#fffdf8]/68 shadow-[0_26px_90px_rgba(47,58,53,0.12)] backdrop-blur-2xl";
const fieldClass =
  "min-h-12 w-full rounded-full border border-[#2F3A35]/12 bg-[#fffdf8]/78 px-4 text-center text-sm font-semibold text-[#2F3A35] outline-none transition placeholder:text-[#2F3A35]/34 focus:border-[#8FAADC]/70 focus:bg-[#fffdf8] focus:ring-4 focus:ring-[#8FAADC]/18";
const textareaClass =
  "min-h-28 w-full resize-y rounded-[1.4rem] border border-[#2F3A35]/12 bg-[#fffdf8]/78 px-4 py-3 text-left text-sm font-semibold leading-6 text-[#2F3A35] outline-none transition placeholder:text-[#2F3A35]/34 focus:border-[#8FAADC]/70 focus:bg-[#fffdf8] focus:ring-4 focus:ring-[#8FAADC]/18";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F3A35] px-5 text-xs font-black uppercase tracking-[0.16em] text-[#FDFBF7] shadow-[0_18px_46px_rgba(47,58,53,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";
const softButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#2F3A35]/12 bg-[#fffdf8]/70 px-5 text-xs font-black uppercase tracking-[0.16em] text-[#2F3A35] shadow-[0_14px_40px_rgba(47,58,53,0.07)] backdrop-blur-xl transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";

const adminSlotClasses = [
  "col-span-2 aspect-[4/3] lg:aspect-auto lg:col-[1/span_4] lg:row-[1/span_2]",
  "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[5/span_3] lg:row-[1/span_6]",
  "col-span-1 aspect-[5/3] lg:aspect-auto lg:col-[8/span_5] lg:row-[1/span_2]",
  "col-span-2 aspect-[3/4] lg:aspect-auto lg:col-[1/span_4] lg:row-[3/span_4]",
  "col-span-2 aspect-[4/3] lg:aspect-auto lg:col-[8/span_5] lg:row-[3/span_4]",
];

const adminLayoutClasses: Record<GalleryLayoutKey, string[]> = {
  mosaic: adminSlotClasses,
  editorial: [
    "col-span-2 aspect-[16/7] lg:aspect-auto lg:col-[1/span_12] lg:row-[1/span_3]",
    "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[1/span_3] lg:row-[4/span_3]",
    "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[4/span_3] lg:row-[4/span_3]",
    "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[7/span_3] lg:row-[4/span_3]",
    "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[10/span_3] lg:row-[4/span_3]",
  ],
  columns: [
    "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[1/span_2] lg:row-[1/span_6]",
    "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[3/span_3] lg:row-[1/span_6]",
    "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[6/span_2] lg:row-[1/span_6]",
    "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[8/span_3] lg:row-[1/span_6]",
    "col-span-1 aspect-[3/4] lg:aspect-auto lg:col-[11/span_2] lg:row-[1/span_6]",
  ],
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function readPositionToken(token: string | undefined, axis: "x" | "y", fallback: number) {
  if (!token) return fallback;
  const normalized = token.trim().toLowerCase();
  const percentMatch = normalized.match(/^(-?\d+(?:\.\d+)?)%$/);

  if (percentMatch) return clampPercent(Number(percentMatch[1]));
  if (normalized === "center") return 50;

  if (axis === "x") {
    if (normalized === "left") return 0;
    if (normalized === "right") return 100;
  }

  if (axis === "y") {
    if (normalized === "top") return 0;
    if (normalized === "bottom") return 100;
  }

  return fallback;
}

function parseObjectPosition(value: string | undefined): ImagePosition {
  const parts = (value || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { x: 50, y: 50 };

  if (parts.length === 1) {
    const token = parts[0].toLowerCase();
    if (token === "top" || token === "bottom") {
      return { x: 50, y: readPositionToken(token, "y", 50) };
    }

    return { x: readPositionToken(token, "x", 50), y: 50 };
  }

  const first = parts[0].toLowerCase();
  const second = parts[1].toLowerCase();
  const firstIsVertical = first === "top" || first === "bottom";
  const secondIsHorizontal = second === "left" || second === "right" || second === "center";

  if (firstIsVertical && secondIsHorizontal) {
    return {
      x: readPositionToken(second, "x", 50),
      y: readPositionToken(first, "y", 50),
    };
  }

  return {
    x: readPositionToken(first, "x", 50),
    y: readPositionToken(second, "y", 50),
  };
}

function formatObjectPosition(position: ImagePosition) {
  return `${clampPercent(position.x)}% ${clampPercent(position.y)}%`;
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function normalizeGalleryArrays(content: WeddingConfig) {
  const next = structuredClone(content);
  const currentPositions = next.appearance.galleryObjectPositions ?? [];

  next.gallery = Array.from({ length: galleryMosaicSlotCount }, (_, index) => cleanBundledPublicAssetSrc(next.gallery[index]) || "");
  next.appearance.galleryObjectPositions = Array.from(
    { length: galleryMosaicSlotCount },
    (_, index) => currentPositions[index] || defaultObjectPosition,
  );

  return next;
}

function normalizeGallerySettings(settings: SiteSettings) {
  const normalized = normalizeSettings(settings);
  return normalizeSettings({
    ...normalized,
    content: normalizeGalleryArrays(normalized.content),
  });
}

function getGallerySources(settings: SiteSettings | null) {
  return Array.from(
    { length: galleryMosaicSlotCount },
    (_, index) => {
      const src = cleanBundledPublicAssetSrc(settings?.content.gallery[index]);
      if (src) return src;
      return defaultSettings.content.gallery[index] || "";
    },
  );
}

function getGalleryPositions(settings: SiteSettings | null) {
  return Array.from(
    { length: galleryMosaicSlotCount },
    (_, index) => settings?.content.appearance.galleryObjectPositions[index] || defaultObjectPosition,
  );
}

function validatePublishSettings(settings: SiteSettings) {
  if (!/\[\s*cụm tên khách\s*\]/i.test(settings.content.invitation.heroTemplate)) {
    return "Câu mời Hero cần giữ token [Cụm tên khách].";
  }

  const datePattern = /\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}/;
  if (!datePattern.test(settings.content.eventDetailsConfig.content.churchDate)) return "Ngày Thánh lễ chưa đúng định dạng ngày/tháng/năm.";
  if (!datePattern.test(settings.content.event.dateLabel)) return "Ngày Tiệc cưới chưa đúng định dạng ngày/tháng/năm.";

  const timePattern = /^\d{1,2}:\d{2}$/;
  if (!timePattern.test(settings.content.eventDetailsConfig.content.churchTime.trim())) return "Giờ Thánh lễ cần có dạng 10:00.";
  if (!timePattern.test(settings.content.event.welcomeTime.trim())) return "Giờ Tiệc cưới cần có dạng 17:30.";
  if (settings.content.timeline.some((item) => !timePattern.test(item.time.trim()) || !item.title.trim() || !(item.icon || "").trim())) {
    return "Mỗi mốc timeline cần đủ giờ, nội dung và icon.";
  }

  return "";
}



export default function AdminEditorPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [backend, setBackend] = useState("local");
  const [activeIndex, setActiveIndex] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/site-settings?draft=1").catch(() => null);

      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (response?.ok) {
        const result = await response.json() as { settings: SiteSettings; backend: string };
        setBackend(result.backend);

        if (result.backend === "supabase") {
          setSettings(normalizeGallerySettings(result.settings));
          return;
        }
      }

      setBackend("local");
      setSettings(normalizeGallerySettings(getDraftSettings()));
    }

    loadSettings();
  }, []);

  const gallerySources = useMemo(() => getGallerySources(settings), [settings]);
  const galleryPositions = useMemo(() => getGalleryPositions(settings), [settings]);
  const filledCount = gallerySources.filter(Boolean).length;
  const selectedSlot = galleryMosaicSlots[activeIndex] ?? galleryMosaicSlots[0];
  const selectedSrc = gallerySources[activeIndex] || "";
  const selectedPositionValue = galleryPositions[activeIndex] || defaultObjectPosition;
  const selectedPosition = parseObjectPosition(selectedPositionValue);
  const isUploadingSelected = uploadingIndex === activeIndex;
  const galleryLayout: GalleryLayoutKey = settings?.content.appearance.galleryLayout === "editorial" || settings?.content.appearance.galleryLayout === "columns"
    ? settings.content.appearance.galleryLayout
    : "mosaic";
  const activeAdminSlotClasses = adminLayoutClasses[galleryLayout];

  function markDirty() {
    setDirty(true);
    setNotice("");
    setError("");
  }

  function updateGallerySlot(index: number, value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      next.content.gallery[index] = cleanBundledPublicAssetSrc(value.trim());
      return next;
    });
  }

  function updateGalleryPosition(index: number, value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      next.content.appearance.galleryObjectPositions[index] = value;
      return next;
    });
  }

  function clearGallerySlot(index: number) {
    updateGallerySlot(index, "");
    setNotice(`Đã xoá ảnh khỏi ${galleryMosaicSlots[index]?.label ?? "ô gallery"}.`);
  }

  function updateSelectedPosition(patch: Partial<ImagePosition>) {
    updateGalleryPosition(activeIndex, formatObjectPosition({ ...selectedPosition, ...patch }));
  }



  function updateChurchInfo(field: "churchDate" | "churchTime" | "churchLocation", value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      if (next.content.eventDetailsConfig?.content) {
        next.content.eventDetailsConfig.content[field] = value;
      }
      return next;
    });
  }

  function updateHeroTemplate(value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      next.content.invitation.heroTemplate = value;
      return next;
    });
  }

  function updateBanquetInfo(field: "dateLabel" | "welcomeTime", value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      next.content.event[field] = value;

      if (field === "dateLabel") {
        const match = value.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
        if (match) {
          next.content.couple.date = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
        }
      }

      return next;
    });
  }

  function updateTimelineItem(index: number, field: "time" | "title" | "description" | "icon", value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      if (next.content.timeline[index]) next.content.timeline[index][field] = value;
      return next;
    });
  }

  function moveTimelineItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= (settings?.content.timeline.length ?? 0)) return;
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      [next.content.timeline[index], next.content.timeline[target]] = [next.content.timeline[target], next.content.timeline[index]];
      return next;
    });
  }

  function addTimelineItem() {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      next.content.timeline.push({
        time: "20:30",
        title: "Mốc thời gian mới",
        description: "",
        icon: timelineIconOptions[6].src,
      });
      return next;
    });
  }

  function removeTimelineItem(index: number) {
    if ((settings?.content.timeline.length ?? 0) <= 1) return;
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      next.content.timeline.splice(index, 1);
      return next;
    });
  }

  function updateGalleryLayout(value: GalleryLayoutKey) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      next.content.appearance.galleryLayout = value;
      return next;
    });
  }

  function moveGallerySlot(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= galleryMosaicSlotCount) return;
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const next = normalizeGallerySettings(current);
      [next.content.gallery[index], next.content.gallery[target]] = [next.content.gallery[target], next.content.gallery[index]];
      [next.content.appearance.galleryObjectPositions[index], next.content.appearance.galleryObjectPositions[target]] = [
        next.content.appearance.galleryObjectPositions[target],
        next.content.appearance.galleryObjectPositions[index],
      ];
      return next;
    });
    setActiveIndex(target);
  }

  async function uploadGalleryImage(index: number, file: File | undefined) {
    if (!file || !settings) return;

    setActiveIndex(index);
    setUploadingIndex(index);
    setError("");
    setNotice("");

    try {
      const prepared = await prepareImageFileForUpload(file, `gallery-slot-${index + 1}`);
      const compressionMessage = prepared.compressed
        ? `Đã nén từ ${formatFileSize(prepared.originalBytes)} xuống ${formatFileSize(prepared.outputBytes)}. `
        : "";

      const formData = new FormData();
      formData.append("file", prepared.file);
      formData.append("section", "gallery");
      if (settings.assetBucket) formData.append("bucket", settings.assetBucket);

      const response = await fetch("/api/admin/assets", { method: "POST", body: formData });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const result = await response.json().catch(() => null) as { asset?: { src: string; provider?: string }; error?: string } | null;

      if (!response.ok || !result?.asset?.src) {
        throw new Error(result?.error || "Upload thất bại.");
      }

      updateGallerySlot(index, result.asset.src);

      if (result.asset.provider === "cloudinary") {
        setNotice(`${compressionMessage}${cloudinaryUploadMessage}`);
      } else if (result.asset.src.startsWith("/uploads/")) {
        setNotice(`${compressionMessage}${localUploadMessage}`);
      } else {
        setNotice(`${compressionMessage}Đã upload ảnh cho ${galleryMosaicSlots[index]?.label}. Nhấn Publish để public page nhận ảnh mới.`);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Không upload được ảnh.");
    } finally {
      setUploadingIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }



  async function postSettings(nextSettings: SiteSettings, publish = false) {
    if (backend !== "supabase") return true;

    const response = await fetch("/api/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nextSettings, publish }),
    }).catch(() => null);

    if (response?.status === 401) {
      window.location.href = "/admin/login";
      return false;
    }

    return Boolean(response?.ok);
  }

  async function saveDraft() {
    if (!settings) return;
    setSaving(true);
    setError("");

    try {
      const next = normalizeGallerySettings(settings);
      const localSaved = writeSettings(draftStorageKey, next);
      const remoteSaved = await postSettings(next);

      if (backend === "supabase" && !remoteSaved) {
        throw new Error("Không lưu được draft lên Supabase.");
      }

      setSettings(next);
      setDirty(false);
      setNotice(localSaved ? "Đã lưu bản nháp. Website công khai chưa thay đổi." : "Đã lưu server, nhưng browser storage đang đầy nên local draft bị bỏ qua.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không lưu được draft.");
    } finally {
      setSaving(false);
    }
  }

  async function publishGallery() {
    if (!settings) return;
    const validationError = validatePublishSettings(settings);
    if (validationError) {
      setError(validationError);
      return;
    }
    setPublishing(true);
    setError("");

    try {
      const next = normalizeGallerySettings({ ...settings, publishedAt: new Date().toISOString() });
      const draftSaved = writeSettings(draftStorageKey, next);
      const publishedSaved = writeSettings(publishedStorageKey, next);
      const remoteSaved = await postSettings(next, true);

      if (backend === "supabase" && !remoteSaved) {
        throw new Error("Không publish được lên Supabase.");
      }

      if (backend === "supabase") {
        await fetch("/api/site-versions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: next,
            label: `Content Editor · ${new Date().toLocaleString("vi-VN")}`,
            source: "manual",
          }),
        }).catch(() => null);
      }

      setSettings(next);
      setDirty(false);
      setNotice(draftSaved && publishedSaved ? "Đã xuất bản nội dung mới. Giao diện giữ nguyên, chỉ dữ liệu đã chọn được cập nhật." : "Đã publish server, nhưng browser storage đang đầy nên local copy có thể thiếu.");
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Không publish được gallery.");
    } finally {
      setPublishing(false);
    }
  }

  if (!settings) {
    return (
      <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,rgba(242,198,207,0.32),#FDFBF7_48%,rgba(143,170,220,0.28))] px-6 text-center text-[#2F3A35]">
        <div className={shellClass}>
          <div className="grid gap-4 p-8">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <p className="text-sm font-bold">Đang mở trình chỉnh sửa nội dung...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,rgba(242,198,207,0.42),transparent_30%),radial-gradient(circle_at_86%_14%,rgba(143,170,220,0.34),transparent_32%),linear-gradient(135deg,#FDFBF7,#F6F0EC_52%,#EEF3FB)] px-4 py-5 text-center text-[#2F3A35] sm:px-6 lg:px-8">
      <input
        ref={fileInputRef}
        type="file"
        accept={imageAccept}
        className="hidden"
        onChange={(event) => uploadGalleryImage(activeIndex, event.target.files?.[0])}
      />


      <div className="mx-auto grid max-w-[92rem] gap-5">
        <header className={`${shellClass} sticky top-4 z-30`}>
          <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <Link href="/admin" className={softButton}>
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Link>
            </div>

            <div className="grid justify-items-center gap-1">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-[#2F3A35]/48">Content Editor</p>
              <h1 className="font-serif text-[clamp(2.2rem,4vw,4rem)] leading-none">Tinh chỉnh nội dung thiệp</h1>
              <p className="max-w-xl text-sm font-semibold leading-6 text-[#2F3A35]/56">
                Hero, ngày giờ, chương trình tiệc và {filledCount}/{galleryMosaicSlotCount} ảnh Khoảnh khắc. Backend: {backend === "supabase" ? "Supabase" : "Local"}.
                {dirty ? " Có thay đổi chưa lưu." : ""}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
              <Link href="/" target="_blank" className={softButton}>
                <Eye className="h-4 w-4" />
                Xem web
              </Link>
              <button type="button" onClick={saveDraft} disabled={saving || publishing} className={softButton}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu draft
              </button>
              <button type="button" onClick={publishGallery} disabled={saving || publishing} className={primaryButton}>
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Publish
              </button>
            </div>
          </div>

          {notice || error ? (
            <p className={`border-t border-[#2F3A35]/10 px-5 py-3 text-sm font-bold leading-6 ${error ? "text-[#9B4E5C]" : "text-[#586A4E]"}`}>
              {error || notice}
            </p>
          ) : null}
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">


          <div className={`${shellClass} grid gap-5 p-4 sm:p-5 lg:p-6 xl:col-span-2`}>
            <div className="grid gap-2 text-left">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-[#2F3A35]/48">Hero</p>
              <h2 className="font-serif text-[clamp(2rem,3vw,3rem)] leading-none">Câu mời khách</h2>
              <p className="max-w-3xl text-sm font-semibold leading-6 text-[#2F3A35]/55">
                Giữ nguyên token <strong>[Cụm tên khách]</strong>; hệ thống tự thay bằng đúng tên trên từng link thiệp. Tên Nhật &amp; Phương không chỉnh tại đây.
              </p>
            </div>
            <textarea
              className={textareaClass}
              value={settings.content.invitation.heroTemplate}
              onChange={(event) => updateHeroTemplate(event.target.value)}
              placeholder="[Cụm tên khách] đến chung vui và ghi dấu những khoảnh khắc đáng nhớ cùng Nhật & Phương."
            />
          </div>


          <div className={`${shellClass} grid gap-5 p-4 sm:p-5 lg:p-6 xl:col-span-2`}>
            <div className="grid gap-2 text-left">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-[#2F3A35]/48">Ngày giờ sự kiện</p>
              <h2 className="font-serif text-[clamp(2rem,3vw,3rem)] leading-none">Thánh lễ Hôn phối &amp; Tiệc cưới</h2>
              <p className="text-sm font-semibold leading-6 text-[#2F3A35]/55">Tên địa điểm, thẻ Lễ Thành Hôn và toàn bộ thiết kế hiện tại được khóa nguyên vẹn.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <fieldset className="grid gap-4 rounded-[1.55rem] border border-[#2F3A35]/12 bg-[#fffdf8]/54 p-4 text-left sm:grid-cols-2">
                <legend className="px-2 text-sm font-black uppercase tracking-[0.14em] text-[#2F3A35]/58">Thánh lễ Hôn phối</legend>
              <label className="grid gap-2 text-sm font-black text-[#2F3A35]/60 text-left">
                Ngày diễn ra
                <input
                  className={fieldClass}
                  value={settings?.content.eventDetailsConfig?.content?.churchDate || ""}
                  placeholder="20.12.2026, thứ 7"
                  onChange={(e) => updateChurchInfo("churchDate", e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-black text-[#2F3A35]/60 text-left">
                Giờ cử hành
                <input
                  className={fieldClass}
                  value={settings?.content.eventDetailsConfig?.content?.churchTime || ""}
                  placeholder="15:00"
                  onChange={(e) => updateChurchInfo("churchTime", e.target.value)}
                />
              </label>
              </fieldset>
              <fieldset className="grid gap-4 rounded-[1.55rem] border border-[#2F3A35]/12 bg-[#fffdf8]/54 p-4 text-left sm:grid-cols-2">
                <legend className="px-2 text-sm font-black uppercase tracking-[0.14em] text-[#2F3A35]/58">Tiệc cưới</legend>
                <label className="grid gap-2 text-sm font-black text-[#2F3A35]/60 text-left">
                  Ngày diễn ra
                  <input
                    className={fieldClass}
                    value={settings.content.event.dateLabel}
                    placeholder="Thứ Bảy, 26.12.2026"
                    onChange={(event) => updateBanquetInfo("dateLabel", event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-black text-[#2F3A35]/60 text-left">
                  Giờ đón khách
                  <input
                    className={fieldClass}
                    value={settings.content.event.welcomeTime}
                    placeholder="17:30"
                    onChange={(event) => updateBanquetInfo("welcomeTime", event.target.value)}
                  />
                </label>
              </fieldset>
            </div>
          </div>

          <div className={`${shellClass} grid gap-5 p-4 sm:p-5 lg:p-6 xl:col-span-2`}>
            <div className="flex flex-col gap-4 text-left sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-2">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-[#2F3A35]/48">Tiệc cưới</p>
                <h2 className="font-serif text-[clamp(2rem,3vw,3rem)] leading-none">Nội dung timeline</h2>
                <p className="text-sm font-semibold leading-6 text-[#2F3A35]/55">Sửa giờ, nội dung, icon hoặc thứ tự. Con đường 108 frame và hiệu ứng hiện tại không bị chỉnh sửa.</p>
              </div>
              <button type="button" className={softButton} onClick={addTimelineItem} disabled={settings.content.timeline.length >= 10}>
                <Plus className="h-4 w-4" /> Thêm mốc
              </button>
            </div>

            <div className="grid gap-3">
              {settings.content.timeline.map((item, index) => (
                <div key={`${index}-${item.icon}`} className="grid gap-3 rounded-[1.55rem] border border-[#2F3A35]/12 bg-[#fffdf8]/54 p-3 md:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1.2fr)_10rem_auto] md:items-center">
                  <input className={fieldClass} value={item.time} aria-label={`Giờ mốc ${index + 1}`} onChange={(event) => updateTimelineItem(index, "time", event.target.value)} />
                  <input className={fieldClass} value={item.title} aria-label={`Nội dung mốc ${index + 1}`} onChange={(event) => updateTimelineItem(index, "title", event.target.value)} />
                  <input className={fieldClass} value={item.description} aria-label={`Mô tả mốc ${index + 1}`} onChange={(event) => updateTimelineItem(index, "description", event.target.value)} />
                  <label className="relative grid grid-cols-[2.6rem_1fr] items-center gap-2 rounded-full border border-[#2F3A35]/12 bg-[#fffdf8]/78 px-2 py-1">
                    <img src={item.icon || timelineIconOptions[0].src} alt="" className="h-9 w-9 object-contain" />
                    <select className="min-h-10 min-w-0 bg-transparent text-xs font-bold text-[#2F3A35] outline-none" value={item.icon || timelineIconOptions[0].src} onChange={(event) => updateTimelineItem(index, "icon", event.target.value)} aria-label={`Icon mốc ${index + 1}`}>
                      {timelineIconOptions.map((icon) => <option key={icon.id} value={icon.src}>{icon.label}</option>)}
                    </select>
                  </label>
                  <div className="flex justify-center gap-1">
                    <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-[#2F3A35]/12 bg-white/70 disabled:opacity-30" onClick={() => moveTimelineItem(index, -1)} disabled={index === 0} aria-label="Đưa lên"><ChevronUp className="h-4 w-4" /></button>
                    <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-[#2F3A35]/12 bg-white/70 disabled:opacity-30" onClick={() => moveTimelineItem(index, 1)} disabled={index === settings.content.timeline.length - 1} aria-label="Đưa xuống"><ChevronDown className="h-4 w-4" /></button>
                    <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-[#9B4E5C]/15 bg-white/70 text-[#9B4E5C] disabled:opacity-30" onClick={() => removeTimelineItem(index)} disabled={settings.content.timeline.length <= 1} aria-label="Xóa mốc"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${shellClass} grid gap-5 p-4 sm:p-5 lg:p-6 xl:col-span-2`}>
            <div className="grid gap-2 text-left">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-[#2F3A35]/48">Khoảnh khắc</p>
              <h2 className="font-serif text-[clamp(2rem,3vw,3rem)] leading-none">Bố cục gallery</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {galleryLayoutOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => updateGalleryLayout(option.id)} className={`grid gap-1 rounded-[1.3rem] border p-4 text-left transition ${galleryLayout === option.id ? "border-[#586A4E]/45 bg-[#EEF4E9] ring-4 ring-[#586A4E]/10" : "border-[#2F3A35]/12 bg-[#fffdf8]/54"}`}>
                  <span className="font-black text-[#2F3A35]">{option.label}</span>
                  <span className="text-xs font-semibold leading-5 text-[#2F3A35]/52">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`${shellClass} overflow-hidden p-4 sm:p-5 lg:p-6`}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:auto-rows-[5.6rem] xl:auto-rows-[6.1rem]">
              {galleryMosaicSlots.map((slot, index) => {
                const src = gallerySources[index];
                const position = galleryPositions[index] || defaultObjectPosition;
                const active = activeIndex === index;
                const uploading = uploadingIndex === index;
                const dragging = draggingIndex === index;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDraggingIndex(index);
                    }}
                    onDragLeave={() => setDraggingIndex((current) => current === index ? null : current)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDraggingIndex(null);
                      uploadGalleryImage(index, event.dataTransfer.files[0]);
                    }}
                    className={[
                      "group relative overflow-hidden rounded-[1.45rem] border bg-[#fffdf8]/54 text-center shadow-[0_18px_48px_rgba(47,58,53,0.1)] outline-none transition",
                      activeAdminSlotClasses[index],
                      active ? "border-[#2F3A35]/42 ring-4 ring-[#8FAADC]/22" : "border-[#2F3A35]/12 hover:-translate-y-0.5 hover:border-[#8FAADC]/54",
                      dragging ? "scale-[0.985] border-[#8FAADC] ring-4 ring-[#8FAADC]/22" : "",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={`${slot.title} preview`}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                        style={{ objectPosition: position } as CSSProperties}
                        draggable={false}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{ backgroundImage: slot.fallback }}
                      />
                    )}

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,58,53,0.08),rgba(47,58,53,0.34))] opacity-80" />
                    <div className="absolute inset-x-3 bottom-3 grid gap-2 rounded-[1.1rem] border border-[#fffdf8]/58 bg-[#fffdf8]/58 px-3 py-3 text-[#2F3A35] shadow-[0_12px_30px_rgba(47,58,53,0.12)] backdrop-blur-xl">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#2F3A35]/52">{slot.label}</p>
                      <p className="text-sm font-black leading-tight">{slot.title}</p>
                      <p className="text-xs font-bold leading-5 text-[#2F3A35]/52">{src ? "Click để chỉnh ô này" : "Click rồi upload ảnh"}</p>
                    </div>

                    {uploading ? (
                      <div className="absolute inset-0 grid place-items-center bg-[#fffdf8]/74 backdrop-blur-sm">
                        <Loader2 className="h-7 w-7 animate-spin text-[#2F3A35]" />
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className={`${shellClass} grid content-start gap-5 p-5`}>
            <div className="grid justify-items-center gap-2">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-[#2F3A35]/48">{selectedSlot.label}</p>
              <h2 className="font-serif text-4xl leading-none">{selectedSlot.title}</h2>
              <p className="max-w-[18rem] text-sm font-semibold leading-6 text-[#2F3A35]/58">{selectedSlot.note}</p>
            </div>

            <div className={`relative overflow-hidden rounded-[1.6rem] border border-[#2F3A35]/12 bg-[#fffdf8]/64 ${selectedSlot.aspectClass}`}>
              {selectedSrc ? (
                <img
                  src={selectedSrc}
                  alt={`${selectedSlot.title} crop preview`}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: selectedPositionValue } as CSSProperties}
                  draggable={false}
                />
              ) : (
                <div className="grid h-full place-items-center gap-3 p-6" style={{ backgroundImage: selectedSlot.fallback }}>
                  <ImagePlus className="h-8 w-8 text-[#2F3A35]/52" />
                  <p className="text-sm font-black text-[#2F3A35]/64">Ô này chưa có ảnh</p>
                </div>
              )}
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                className={primaryButton}
                disabled={isUploadingSelected}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploadingSelected ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload vào ô này
              </button>
              <button
                type="button"
                className={softButton}
                disabled={!selectedSrc || isUploadingSelected}
                onClick={() => clearGallerySlot(activeIndex)}
              >
                <Trash2 className="h-4 w-4" />
                Xoá ảnh ô này
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={softButton} disabled={activeIndex === 0} onClick={() => moveGallerySlot(activeIndex, -1)}>
                  <ChevronUp className="h-4 w-4" /> Đổi lên
                </button>
                <button type="button" className={softButton} disabled={activeIndex === galleryMosaicSlotCount - 1} onClick={() => moveGallerySlot(activeIndex, 1)}>
                  <ChevronDown className="h-4 w-4" /> Đổi xuống
                </button>
              </div>
            </div>

            <label className="grid gap-2 text-center text-sm font-black text-[#2F3A35]/60">
              URL hoặc path ảnh
              <input
                className={fieldClass}
                value={settings?.content.gallery[activeIndex] || ""}
                placeholder={defaultSettings.content.gallery[activeIndex] || "/uploads/gallery/..."}
                onChange={(event) => updateGallerySlot(activeIndex, event.target.value)}
              />
            </label>

            <div className="grid gap-4 rounded-[1.55rem] border border-[#2F3A35]/12 bg-[#fffdf8]/54 p-4">
              <div className="grid justify-items-center gap-1">
                <p className="text-sm font-black">Căn crop ảnh</p>
                <p className="text-xs font-bold leading-5 text-[#2F3A35]/48">{selectedPositionValue}</p>
              </div>

              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#2F3A35]/52">
                Ngang: {selectedPosition.x}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedPosition.x}
                  onChange={(event) => updateSelectedPosition({ x: Number(event.target.value) })}
                  className="accent-[#8FAADC]"
                />
              </label>

              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#2F3A35]/52">
                Dọc: {selectedPosition.y}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedPosition.y}
                  onChange={(event) => updateSelectedPosition({ y: Number(event.target.value) })}
                  className="accent-[#F2C6CF]"
                />
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Trên", 12],
                  ["Giữa", 50],
                  ["Dưới", 88],
                ].map(([label, y]) => (
                  <button
                    key={label}
                    type="button"
                    className="min-h-10 rounded-full border border-[#2F3A35]/12 bg-[#fffdf8]/70 px-3 text-xs font-black text-[#2F3A35]/62 transition hover:border-[#2F3A35]/32 hover:text-[#2F3A35]"
                    onClick={() => updateSelectedPosition({ y: Number(y) })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs font-semibold leading-5 text-[#2F3A35]/46">
              Có thể kéo file thả trực tiếp lên từng ô. Editor luôn lưu đúng 5 slot, nên ảnh không bị dồn thứ tự ngoài website.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
