"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Eye,
  FileText,
  GalleryHorizontal,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  MonitorSmartphone,
  RotateCcw,
  Save,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { InvitationChecklist } from "@/components/admin/InvitationChecklist";
import { PreviewFrame } from "@/components/admin/PreviewFrame";
import { VersionSnapshotsPanel } from "@/components/admin/VersionSnapshotsPanel";
import type { PreviewContextKey } from "@/config/preview-contexts";
import {
  applyTheme,
  defaultSettings,
  draftStorageKey,
  getDraftSettings,
  normalizeSettings,
  publishedStorageKey,
  writeSettings,
  type SiteSettings,
  type WeddingConfig,
} from "@/lib/site-settings";
import { hasBlockingIssues, lintInvitation } from "@/lib/invitation-lint";
import {
  createSiteVersion,
  prependLocalVersion,
  readLocalVersions,
  updateLocalVersion,
  type SiteVersion,
  type SiteVersionSource,
} from "@/lib/site-versions";

type StudioTab = "overview" | "content" | "media" | "rsvp" | "motion" | "publish";
type MediaSectionKey = keyof WeddingConfig["appearance"]["mediaLayers"];
type BackgroundKey = keyof WeddingConfig["appearance"]["backgrounds"];
type MediaLayer = WeddingConfig["appearance"]["mediaLayers"]["hero"][number];
type MediaLayerPatch = Partial<Omit<MediaLayer, "scale" | "objectPosition">> & {
  scale?: Partial<MediaLayer["scale"]>;
  objectPosition?: Partial<MediaLayer["objectPosition"]>;
};

const tabs: Array<{ key: StudioTab; label: string; icon: typeof LayoutDashboard }> = [
  { key: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { key: "content", label: "Nội dung", icon: FileText },
  { key: "media", label: "Hình ảnh", icon: GalleryHorizontal },
  { key: "rsvp", label: "RSVP", icon: Check },
  { key: "motion", label: "Hiệu ứng", icon: Sparkles },
  { key: "publish", label: "Publish", icon: MonitorSmartphone },
];

const mediaSectionLabels: Record<MediaSectionKey, string> = {
  hero: "Hero",
  invitation: "Lời mời",
  itinerary: "Lịch trình ngắn",
  timeline: "Timeline",
  venue: "Địa điểm",
  dressCode: "Dress code",
  guestNotes: "Guest notes",
  gallery: "Gallery",
  cta: "RSVP / Thank you",
};

const mediaSectionKeys = Object.keys(mediaSectionLabels) as MediaSectionKey[];
const backgroundKeys: BackgroundKey[] = ["page", "hero", "invitation", "itinerary", "timeline", "venue", "dressCode", "guestNotes", "gallery", "cta"];
const backgroundOptions = [
  { value: "cream", label: "Cream sạch" },
  { value: "plain", label: "Plain glass" },
  { value: "softGradient", label: "Rose / Serenity mềm" },
  { value: "accentGradient", label: "Accent cinematic" },
  { value: "card", label: "Card nhẹ" },
  { value: "primaryGradient", label: "Primary gradient" },
];

const fieldClass =
  "min-h-12 w-full rounded-2xl border border-[#252934]/10 bg-white/66 px-4 text-sm text-[#252934] outline-none transition placeholder:text-[#252934]/35 focus:border-serenity focus:bg-white/86 focus:ring-4 focus:ring-serenity/20";
const textareaClass = `${fieldClass} min-h-28 py-3 leading-6`;
const imageAccept = "image/*,.jpg,.jpeg,.jfif,.png,.webp,.gif,.svg,.avif,.bmp,.ico,.tif,.tiff,.heic,.heif";
const localUploadMessage = "Chưa cấu hình Supabase nên file đã được lưu vào public/uploads trên máy local. Settings chỉ lưu path ngắn nên Save/Publish sẽ không bị đầy browser storage.";
const cloudinaryUploadMessage = "Đã upload lên Cloudinary CDN với auto-format và auto-quality. Settings chỉ lưu URL CDN nhẹ.";
const cloudinaryBrowserUploadLimitBytes = 10 * 1024 * 1024;
const cloudinaryBrowserUploadTargetBytes = 9.25 * 1024 * 1024;
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#252934] px-5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_50px_rgba(37,41,52,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";
const softButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#252934]/10 bg-white/58 px-5 text-xs font-black uppercase tracking-[0.18em] text-[#252934] backdrop-blur-xl transition hover:-translate-y-0.5";

type ImagePosition = {
  x: number;
  y: number;
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

function isEmbeddedImageDataUrl(value: string) {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

function getDataUrlExtension(value: string) {
  const mime = value.match(/^data:image\/([a-z0-9.+-]+);base64,/i)?.[1]?.toLowerCase();
  if (!mime) return "png";
  if (mime === "jpeg") return "jpg";
  if (mime === "svg+xml") return "svg";
  return mime.replace(/[^a-z0-9]+/g, "") || "png";
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function getUploadMaxSide(section: string) {
  if (section.includes("hero")) return 3200;
  if (section.includes("gallery")) return 2600;
  return 2400;
}

function canBrowserCompressImage(file: File) {
  if (!file.type.startsWith("image/")) return false;
  return !["image/svg+xml", "image/gif"].includes(file.type);
}

function optimizedFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "wedding-image";
  return `${base}-optimized.jpg`;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Không nén được ảnh bằng canvas."));
    }, "image/jpeg", quality);
  });
}

async function loadCanvasImageSource(file: File) {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap as CanvasImageSource,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Browser không đọc được ảnh để nén."));
    image.src = objectUrl;
  });

  return {
    source: image as CanvasImageSource,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => URL.revokeObjectURL(objectUrl),
  };
}

async function prepareImageFileForUpload(file: File, section: string) {
  if (file.size <= cloudinaryBrowserUploadLimitBytes) {
    return { file, compressed: false, originalBytes: file.size, outputBytes: file.size };
  }

  if (!canBrowserCompressImage(file)) {
    throw new Error("File lớn hơn 10MB và format này không thể tự nén trong browser. Đổi sang JPG/WebP hoặc nâng gói Cloudinary.");
  }

  let imageSource: Awaited<ReturnType<typeof loadCanvasImageSource>>;

  try {
    imageSource = await loadCanvasImageSource(file);
  } catch {
    throw new Error("Ảnh lớn hơn 10MB nhưng browser không đọc được để nén. Đổi sang JPG/WebP rồi upload lại.");
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    imageSource.close();
    throw new Error("Browser không hỗ trợ nén ảnh bằng canvas.");
  }

  let bestBlob: Blob | null = null;
  let maxSide = Math.min(getUploadMaxSide(section), Math.max(imageSource.width, imageSource.height));
  const minSide = 900;
  const qualities = [0.9, 0.86, 0.82, 0.78, 0.72, 0.66, 0.6];
  let attempted = false;

  try {
    while (maxSide >= minSide || !attempted) {
      attempted = true;
      const scale = Math.min(1, maxSide / Math.max(imageSource.width, imageSource.height));
      canvas.width = Math.max(1, Math.round(imageSource.width * scale));
      canvas.height = Math.max(1, Math.round(imageSource.height * scale));
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(imageSource.source, 0, 0, canvas.width, canvas.height);

      for (const quality of qualities) {
        const blob = await canvasToJpegBlob(canvas, quality);
        if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;

        if (blob.size <= cloudinaryBrowserUploadTargetBytes) {
          return {
            file: new File([blob], optimizedFileName(file.name), { type: "image/jpeg", lastModified: Date.now() }),
            compressed: true,
            originalBytes: file.size,
            outputBytes: blob.size,
          };
        }
      }

      maxSide = Math.floor(maxSide * 0.82);
    }
  } finally {
    imageSource.close();
    canvas.width = 1;
    canvas.height = 1;
  }

  if (bestBlob && bestBlob.size <= cloudinaryBrowserUploadLimitBytes) {
    return {
      file: new File([bestBlob], optimizedFileName(file.name), { type: "image/jpeg", lastModified: Date.now() }),
      compressed: true,
      originalBytes: file.size,
      outputBytes: bestBlob.size,
    };
  }

  throw new Error(`Tao đã thử nén ảnh nhưng vẫn còn ${formatFileSize(bestBlob?.size || file.size)}, vượt giới hạn Cloudinary 10MB. Đổi ảnh sang JPG/WebP nhẹ hơn hoặc nâng gói Cloudinary.`);
}

async function uploadEmbeddedImageDataUrl(value: string, index: number) {
  const response = await fetch(value);
  const blob = await response.blob();
  const extension = getDataUrlExtension(value);
  const sourceFile = new File([blob], `embedded-image-${index}.${extension}`, { type: blob.type || `image/${extension}` });
  const { file } = await prepareImageFileForUpload(sourceFile, "migrated");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("section", "migrated");

  const uploadResponse = await fetch("/api/admin/assets", { method: "POST", body: formData });
  if (uploadResponse.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }

  const result = await uploadResponse.json() as { asset?: { src: string }; error?: string };
  if (!uploadResponse.ok || !result.asset?.src) {
    throw new Error(result.error || "Không chuyển được ảnh base64 sang file local.");
  }

  return result.asset.src;
}

async function replaceEmbeddedImageDataUrls<T>(source: T) {
  const cache = new Map<string, string>();
  let migrated = 0;

  async function visit(value: unknown): Promise<unknown> {
    if (typeof value === "string") {
      if (!isEmbeddedImageDataUrl(value)) return value;
      const cached = cache.get(value);
      if (cached) return cached;
      migrated += 1;
      const uploaded = await uploadEmbeddedImageDataUrl(value, migrated);
      cache.set(value, uploaded);
      return uploaded;
    }

    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => visit(item)));
    }

    if (value && typeof value === "object") {
      const entries = await Promise.all(
        Object.entries(value as Record<string, unknown>).map(async ([key, child]) => [key, await visit(child)] as const),
      );
      return Object.fromEntries(entries);
    }

    return value;
  }

  return {
    settings: await visit(structuredClone(source)) as T,
    migrated,
  };
}

function setDeepValue<T>(source: T, path: string, value: unknown): T {
  const parts = path.split(".");
  const clone = structuredClone(source);
  let cursor: Record<string, unknown> = clone as Record<string, unknown>;

  for (const part of parts.slice(0, -1)) {
    cursor = cursor[part] as Record<string, unknown>;
  }

  cursor[parts[parts.length - 1]] = value;
  return clone;
}

function StudioCard({ eyebrow, title, children, action }: { eyebrow?: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-[1.8rem] border border-[#252934]/10 bg-white/54 p-5 shadow-[0_22px_70px_rgba(37,41,52,0.07)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.26em] text-[#252934]/44">{eyebrow}</p> : null}
          <h2 className="mt-1 font-serif text-3xl leading-tight text-[#252934] sm:text-4xl">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function EditorField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#252934]/64">
      {label}
      {multiline ? (
        <textarea className={textareaClass} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={fieldClass} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function EditorCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#252934]/10 bg-white/48 px-4 py-3 text-sm font-bold text-[#252934]/68">
      {label}
      <input className="h-5 w-5 accent-[#92A8D1]" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function BackgroundSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#252934]/64">
      {label}
      <span className="relative block">
        <select className={`${fieldClass} appearance-none pr-10`} value={value} onChange={(event) => onChange(event.target.value)}>
          {backgroundOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#252934]/45" />
      </span>
    </label>
  );
}

function ImagePositionControls({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const position = parseObjectPosition(value);

  function updatePosition(axis: keyof ImagePosition, nextValue: number) {
    onChange(formatObjectPosition({ ...position, [axis]: nextValue }));
  }

  const verticalPresets = [
    { label: "Trên", value: 0 },
    { label: "Giữa", value: 50 },
    { label: "Dưới", value: 100 },
  ];

  return (
    <div className="grid gap-4 rounded-[1.25rem] border border-[#252934]/10 bg-white/46 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#252934]">{label}</p>
          <p className="mt-1 text-xs leading-5 text-[#252934]/48">Kéo dọc để đặt ảnh lên/xuống trong khung. Preview ngoài web sẽ dùng đúng vị trí này.</p>
        </div>
        <span className="rounded-full border border-[#252934]/10 bg-white/58 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#252934]/58">
          {formatObjectPosition(position)}
        </span>
      </div>

      <div className="relative h-20 overflow-hidden rounded-[1.1rem] border border-white/70 bg-[linear-gradient(135deg,rgba(247,202,201,0.48),rgba(255,255,255,0.72),rgba(146,168,209,0.5))] shadow-inner">
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-[#252934]/10" />
        <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-[#252934]/10" />
        <span
          aria-hidden="true"
          className="absolute grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white bg-[#252934] shadow-[0_10px_30px_rgba(37,41,52,0.22)]"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-quartz" />
        </span>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#252934]/48">
          Ngang: {position.x}%
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={position.x}
            onChange={(event) => updatePosition("x", Number(event.target.value))}
            className="accent-[#92A8D1]"
          />
        </label>
        <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#252934]/48">
          Dọc lên/xuống: {position.y}%
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={position.y}
            onChange={(event) => updatePosition("y", Number(event.target.value))}
            className="accent-[#F7CAC9]"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {verticalPresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => updatePosition("y", preset.value)}
            className={[
              "rounded-full border px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.16em] transition",
              position.y === preset.value ? "border-[#252934] bg-[#252934] text-white" : "border-[#252934]/10 bg-white/58 text-[#252934]/58 hover:text-[#252934]",
            ].join(" ")}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AssetPicker({
  label,
  value,
  onChange,
  section,
  bucket,
  aspect = "aspect-[4/5]",
  objectPosition = "center center",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  section: string;
  bucket?: string;
  aspect?: string;
  objectPosition?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    setInfo("");

    try {
      const prepared = await prepareImageFileForUpload(file, section);
      const compressionMessage = prepared.compressed
        ? `Đã nén ảnh từ ${formatFileSize(prepared.originalBytes)} xuống ${formatFileSize(prepared.outputBytes)} để vừa giới hạn Cloudinary 10MB. `
        : "";

      if (compressionMessage) setInfo(`${compressionMessage}Đang upload lên Cloudinary...`);

      const formData = new FormData();
      formData.append("file", prepared.file);
      formData.append("section", section);
      if (bucket) formData.append("bucket", bucket);

      const response = await fetch("/api/admin/assets", { method: "POST", body: formData });
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const result = await response.json() as { asset?: { src: string; provider?: string }; error?: string };
      if (!response.ok || !result.asset?.src) throw new Error(result.error || "Upload thất bại.");
      onChange(result.asset.src);
      if (result.asset.provider === "cloudinary") setInfo(`${compressionMessage}${cloudinaryUploadMessage}`);
      if (result.asset.src.startsWith("/uploads/")) setInfo(`${compressionMessage}${localUploadMessage}`);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Không upload được asset.";
      setError(`${message} Mày vẫn có thể dán URL trực tiếp.`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-[1.35rem] border border-[#252934]/10 bg-white/42 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[#252934]">{label}</p>
        <label className={`${softButton} cursor-pointer px-4`}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          Upload
          <input type="file" accept={imageAccept} className="hidden" disabled={uploading} onChange={(event) => upload(event.target.files?.[0])} />
        </label>
      </div>
      <div className={`relative overflow-hidden rounded-[1.2rem] border border-white/70 bg-white/54 ${aspect}`}>
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" style={{ objectPosition } as CSSProperties} />
        ) : (
          <div className="grid h-full place-items-center text-center text-sm font-bold text-[#252934]/38">
            <ImagePlus className="mb-2 h-6 w-6" />
            Chưa có ảnh
          </div>
        )}
      </div>
      <input className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Hoặc dán URL ảnh / path trong public" />
      {error || info ? (
        <p className={`flex items-start gap-2 text-xs font-bold leading-5 ${info ? "text-[#6F7482]" : "text-[#9B4E5C]"}`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {info || error}
        </p>
      ) : (
        <p className="text-xs leading-5 text-[#252934]/46">
          Hỗ trợ JPG, PNG, WebP, GIF, SVG, AVIF, BMP, ICO, TIFF, HEIC/HEIF. HEIC/HEIF/TIFF có thể không preview tốt trên mọi browser; nếu không hiện, đổi sang JPG/WebP.
        </p>
      )}
    </div>
  );
}

export default function AdminEditorPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>("overview");
  const [previewContext, setPreviewContext] = useState<PreviewContextKey>("mobile");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [backend, setBackend] = useState("local");
  const [activeLayerSection, setActiveLayerSection] = useState<MediaSectionKey>("hero");
  const [versions, setVersions] = useState<SiteVersion[]>([]);
  const [versionsBackend, setVersionsBackend] = useState("local");
  const [versionLabel, setVersionLabel] = useState("");
  const [versionBusy, setVersionBusy] = useState(false);

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
          setSettings(normalizeSettings(result.settings));
          return;
        }
      }

      setBackend("local");
      setSettings(getDraftSettings());
    }

    async function loadVersions() {
      const response = await fetch("/api/site-versions").catch(() => null);
      if (response?.status === 401) return;
      if (response?.ok) {
        const result = await response.json() as { versions: SiteVersion[]; backend: string };
        setVersionsBackend(result.backend);
        if (result.backend === "supabase") {
          setVersions(result.versions);
          return;
        }
      }
      setVersionsBackend("local");
      setVersions(readLocalVersions());
    }

    loadSettings();
    loadVersions();
  }, []);

  const previewConfig = useMemo(() => {
    if (!settings) return null;
    return applyTheme(settings.content, settings.themeKey);
  }, [settings]);

  const checklistIssues = useMemo(() => {
    if (!previewConfig) return [];
    return lintInvitation(previewConfig);
  }, [previewConfig]);

  function markDirty() {
    setDirty(true);
    setNotice("");
  }

  function updateContent(path: string, value: unknown) {
    markDirty();
    setSettings((current) => current ? { ...current, content: setDeepValue(current.content, path, value) } : current);
  }

  function updateTimeline(index: number, key: "time" | "title" | "description", value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      content.timeline[index] = { ...content.timeline[index], [key]: value };
      return { ...current, content };
    });
  }

  function updateGallery(index: number, value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      content.gallery[index] = value;
      return { ...current, content };
    });
  }

  function updateGalleryPosition(index: number, value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const positions = content.appearance.galleryObjectPositions;
      while (positions.length <= index) positions.push("center center");
      positions[index] = value;
      return { ...current, content };
    });
  }

  function updateHeroAsset(target: "desktop" | "mobile", value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      if (target === "desktop") content.hero.coverImage = value;
      if (target === "mobile") content.hero.mobileCoverImage = value;

      const layers = content.appearance.mediaLayers.hero as MediaLayer[];
      if (layers.length === 0) {
        layers.push({
          id: "hero-cover",
          type: "image",
          src: target === "desktop" ? value : content.hero.coverImage,
          mobileSrc: target === "mobile" ? value : content.hero.mobileCoverImage,
          alt: content.sections.hero.imageAlt,
          opacity: 0.72,
          scale: { desktop: 1, mobile: 1 },
          objectPosition: { desktop: "center center", mobile: "center center" },
          animation: "slowZoom",
        });
      } else {
        layers[0] = {
          ...layers[0],
          src: target === "desktop" ? value : layers[0].src,
          mobileSrc: target === "mobile" ? value : layers[0].mobileSrc || value,
          alt: content.sections.hero.imageAlt,
        };
      }

      return { ...current, content };
    });
  }

  function updateHeroObjectPosition(target: "desktop" | "mobile", value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const layers = content.appearance.mediaLayers.hero as MediaLayer[];

      if (layers.length === 0) {
        layers.push({
          id: "hero-cover",
          type: "image",
          src: content.hero.coverImage,
          mobileSrc: content.hero.mobileCoverImage || content.hero.coverImage,
          alt: content.sections.hero.imageAlt,
          opacity: 1,
          scale: { desktop: 1, mobile: 1 },
          objectPosition: { desktop: "center center", mobile: "center center" },
          animation: "slowZoom",
        });
      }

      const layer = layers[0];
      layers[0] = {
        ...layer,
        src: layer.src || content.hero.coverImage,
        mobileSrc: layer.mobileSrc || content.hero.mobileCoverImage || content.hero.coverImage,
        alt: content.sections.hero.imageAlt,
        objectPosition: {
          desktop: layer.objectPosition.desktop || "center center",
          mobile: layer.objectPosition.mobile || "center center",
          [target]: value,
        },
      };

      return { ...current, content };
    });
  }

  function moveGallery(index: number, direction: -1 | 1) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= content.gallery.length) return current;
      [content.gallery[index], content.gallery[nextIndex]] = [content.gallery[nextIndex], content.gallery[index]];
      const positions = content.appearance.galleryObjectPositions;
      while (positions.length < content.gallery.length) positions.push("center center");
      [positions[index], positions[nextIndex]] = [positions[nextIndex], positions[index]];
      return { ...current, content };
    });
  }

  function addGalleryImage() {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      content.gallery.push("");
      content.appearance.galleryObjectPositions.push("center center");
      return { ...current, content };
    });
  }

  function removeGalleryImage(index: number) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      content.gallery.splice(index, 1);
      content.appearance.galleryObjectPositions.splice(index, 1);
      return { ...current, content };
    });
  }

  function updateDressColor(index: number, value: string) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      content.dressCode.colors[index] = value;
      return { ...current, content };
    });
  }

  function addMediaLayer(section: MediaSectionKey) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const layers = content.appearance.mediaLayers[section] as MediaLayer[];
      layers.push({
        id: crypto.randomUUID(),
        type: "image",
        src: "",
        mobileSrc: "",
        alt: mediaSectionLabels[section],
        opacity: 0.32,
        scale: { desktop: 1, mobile: 1 },
        objectPosition: { desktop: "center center", mobile: "center center" },
        animation: "slowZoom",
      });
      return { ...current, content };
    });
  }

  function updateMediaLayer(section: MediaSectionKey, index: number, patch: MediaLayerPatch) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const layers = content.appearance.mediaLayers[section] as MediaLayer[];
      const layer = layers[index];
      layers[index] = {
        ...layer,
        ...patch,
        scale: { ...layer.scale, ...patch.scale },
        objectPosition: { ...layer.objectPosition, ...patch.objectPosition },
      };
      return { ...current, content };
    });
  }

  function removeMediaLayer(section: MediaSectionKey, index: number) {
    markDirty();
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const layers = content.appearance.mediaLayers[section] as MediaLayer[];
      layers.splice(index, 1);
      return { ...current, content };
    });
  }

  function resetDefaults() {
    const fresh = normalizeSettings(structuredClone(defaultSettings));
    markDirty();
    setSettings(fresh);
    setNotice("Đã reset về bản Rose Quartz / Serenity mặc định. Nhấn Publish nếu muốn đưa ra public.");
  }

  async function postSettings(nextSettings: SiteSettings, publish = false) {
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

  async function prepareSettingsForPersist(source: SiteSettings) {
    const normalized = normalizeSettings(source);
    const result = await replaceEmbeddedImageDataUrls(normalized);
    return {
      settings: normalizeSettings(result.settings),
      migrated: result.migrated,
    };
  }

  async function saveDraft() {
    if (!settings) return;
    const { settings: next, migrated } = await prepareSettingsForPersist(settings);
    const localSaved = writeSettings(draftStorageKey, next);
    await postSettings(next);
    setSettings(next);
    setDirty(false);
    setNotice([
      migrated ? `Đã chuyển ${migrated} ảnh base64 sang public/uploads. ` : "",
      localSaved ? "" : "Browser storage vẫn đầy nên tao đã bỏ qua localStorage. ",
      backend === "supabase" ? "Đã lưu draft vào Supabase và browser." : "Đã lưu draft local. Chưa cấu hình Supabase nên public deploy sẽ dùng default.",
    ].join(""));
  }

  async function publish() {
    if (!settings) return;
    setPublishing(true);
    try {
      const prepared = await prepareSettingsForPersist({ ...settings, publishedAt: new Date().toISOString() });
      const next = prepared.settings;
      const draftSaved = writeSettings(draftStorageKey, next);
      const publishedSaved = writeSettings(publishedStorageKey, next);
      await postSettings(next, true);
      setSettings(next);
      setDirty(false);
      setNotice([
        prepared.migrated ? `Đã chuyển ${prepared.migrated} ảnh base64 sang public/uploads. ` : "",
        draftSaved && publishedSaved ? "" : "Browser storage vẫn đầy nên có phần localStorage bị bỏ qua. ",
        hasBlockingIssues(checklistIssues) ? "Đã publish local dù checklist còn blocker để mày preview trên localhost. " : "",
        "Đã publish. Public page sẽ tự đọc bản published mới.",
      ].join(""));
    } finally {
      setPublishing(false);
    }
  }

  async function persistVersion(version: SiteVersion, source: SiteVersionSource) {
    if (versionsBackend === "supabase") {
      const response = await fetch("/api/site-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: version.settings, label: version.label, source }),
      });
      if (!response.ok) throw new Error("Cannot save version");
      const result = await response.json() as { version: SiteVersion };
      setVersions((current) => [result.version, ...current]);
      return result.version;
    }

    const next = prependLocalVersion(version);
    setVersions(next);
    return version;
  }

  async function createVersionSnapshot(source: SiteVersionSource = "manual", settingsOverride?: SiteSettings, labelOverride?: string) {
    const sourceSettings = settingsOverride ?? settings;
    if (!sourceSettings) return;
    setVersionBusy(true);
    try {
      const version = createSiteVersion(sourceSettings, labelOverride || versionLabel || "Studio snapshot", source);
      await persistVersion(version, source);
      setVersionLabel("");
      setNotice("Đã tạo snapshot.");
    } finally {
      setVersionBusy(false);
    }
  }

  async function restoreVersion(version: SiteVersion) {
    const restored = normalizeSettings(version.settings);
    writeSettings(draftStorageKey, restored);
    setSettings(restored);
    setDirty(true);
    await createVersionSnapshot("restore", restored, `Restored: ${version.label}`);
  }

  async function publishVersion(version: SiteVersion) {
    setVersionBusy(true);
    try {
      const next = normalizeSettings({ ...version.settings, publishedAt: new Date().toISOString() });
      writeSettings(draftStorageKey, next);
      writeSettings(publishedStorageKey, next);
      await postSettings(next, true);
      const nextVersion = { ...version, publishedAt: next.publishedAt };
      setVersions(versionsBackend === "local" ? updateLocalVersion(nextVersion) : versions.map((item) => item.id === version.id ? nextVersion : item));
      setSettings(next);
      setDirty(false);
      setNotice("Đã publish snapshot.");
    } finally {
      setVersionBusy(false);
    }
  }

  if (!settings || !previewConfig) {
    return <main className="min-h-screen bg-cream p-8 text-[#252934]">Đang mở Wedding Design Studio...</main>;
  }

  const content = settings.content;
  const activeLayers = content.appearance.mediaLayers[activeLayerSection];
  const heroLayer = content.appearance.mediaLayers.hero[0];
  const heroDesktopPosition = heroLayer?.objectPosition.desktop || "center center";
  const heroMobilePosition = heroLayer?.objectPosition.mobile || "center center";

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,rgba(247,202,201,0.38),#fffaf7_44%,rgba(146,168,209,0.28))] text-[#252934]">
      <div className="sticky top-0 z-40 border-b border-[#252934]/10 bg-white/58 px-5 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#252934]/46">Wedding Design Studio</p>
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{content.couple.displayName}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" target="_blank" className={softButton}><Eye className="h-4 w-4" /> Public</Link>
            <button type="button" onClick={saveDraft} className={softButton}><Save className="h-4 w-4" /> Save</button>
            <button type="button" onClick={publish} disabled={publishing} className={primaryButton}>
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Publish
            </button>
          </div>
        </div>
        {notice || dirty ? (
          <p className="mx-auto mt-3 max-w-[92rem] text-sm font-bold text-[#252934]/58">
            {dirty ? "Có thay đổi chưa lưu. " : null}
            {notice}
          </p>
        ) : null}
      </div>

      <div className="mx-auto grid max-w-[92rem] gap-6 px-5 py-6 xl:grid-cols-[minmax(0,43rem)_minmax(42rem,1fr)]">
        <section className="grid content-start gap-5">
          <nav className="flex gap-2 overflow-x-auto rounded-[1.6rem] border border-[#252934]/10 bg-white/44 p-2 backdrop-blur-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition",
                    activeTab === tab.key ? "bg-[#252934] text-white" : "text-[#252934]/56 hover:bg-white/70 hover:text-[#252934]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {activeTab === "overview" ? (
            <>
              <StudioCard eyebrow="Studio status" title="Điều khiển bản thiệp">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Backend", value: backend === "supabase" ? "Supabase" : "Browser local" },
                    { label: "Asset CDN", value: "Cloudinary / fallback local" },
                    { label: "Validation", value: hasBlockingIssues(checklistIssues) ? "Cần xử lý" : "Sẵn sàng" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.25rem] border border-[#252934]/10 bg-white/50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#252934]/42">{item.label}</p>
                      <p className="mt-3 text-lg font-bold text-[#252934]">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-[1.25rem] border border-[#252934]/10 bg-white/42 p-4 text-sm leading-6 text-[#252934]/62">
                  Editor này lưu draft nhanh trong browser, upload ảnh lên Cloudinary CDN nếu đã cấu hình, rồi publish URL/settings ra public page. Theme được khóa quanh Rose Quartz và Serenity để tránh lệch concept.
                </div>
              </StudioCard>

              <StudioCard
                eyebrow="Rose / Serenity"
                title="Theme đang khóa"
                action={<button type="button" onClick={resetDefaults} className={softButton}><RotateCcw className="h-4 w-4" /> Reset</button>}
              >
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <p className="text-sm leading-6 text-[#252934]/62">
                    Chỉ dùng hai màu chủ đạo đã thống nhất, có thêm cream/ink trung tính để typography và glass UI sạch hơn.
                  </p>
                  <div className="flex gap-2">
                    {["#F7CAC9", "#92A8D1", "#FFFAF7", "#252934"].map((color) => (
                      <span key={color} className="h-10 w-10 rounded-full border border-[#252934]/10 shadow-inner" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </StudioCard>

              <InvitationChecklist issues={checklistIssues} />
            </>
          ) : null}

          {activeTab === "content" ? (
            <>
              <StudioCard eyebrow="Couple" title="Tên, ngày và địa điểm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditorField label="Tên cô dâu" value={content.couple.bride} onChange={(value) => updateContent("couple.bride", value)} />
                  <EditorField label="Tên chú rể" value={content.couple.groom} onChange={(value) => updateContent("couple.groom", value)} />
                </div>
                <EditorField label="Tên hiển thị trên hero" value={content.couple.displayName} onChange={(value) => updateContent("couple.displayName", value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditorField label="Ngày cưới ISO" value={content.couple.date} onChange={(value) => updateContent("couple.date", value)} placeholder="2026-12-26" />
                  <EditorField label="Ngày hiển thị" value={content.event.dateLabel} onChange={(value) => updateContent("event.dateLabel", value)} />
                </div>
                <EditorField label="Venue" value={content.venue.name} onChange={(value) => updateContent("venue.name", value)} />
                <EditorField label="Địa điểm" value={content.venue.location} onChange={(value) => updateContent("venue.location", value)} />
                <EditorField label="Google Maps URL" value={content.venue.mapUrl} onChange={(value) => updateContent("venue.mapUrl", value)} />
              </StudioCard>

              <StudioCard eyebrow="Copy" title="Lời mời chính">
                <EditorField label="Eyebrow" value={content.sections.invitation.eyebrow} onChange={(value) => updateContent("sections.invitation.eyebrow", value)} />
                <EditorField label="Tiêu đề" value={content.invitation.title} onChange={(value) => updateContent("invitation.title", value)} />
                <EditorField label="Lời mời" value={content.invitation.message} multiline onChange={(value) => updateContent("invitation.message", value)} />
                <EditorField label="Câu kết" value={content.invitation.closing} multiline onChange={(value) => updateContent("invitation.closing", value)} />
              </StudioCard>

              <StudioCard eyebrow="Schedule" title="Timeline buổi tiệc">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditorField label="Đón khách" value={content.event.welcomeTime} onChange={(value) => updateContent("event.welcomeTime", value)} />
                  <EditorField label="Ceremony" value={content.event.ceremonyTime} onChange={(value) => updateContent("event.ceremonyTime", value)} />
                  <EditorField label="Khai tiệc" value={content.event.dinnerTime} onChange={(value) => updateContent("event.dinnerTime", value)} />
                  <EditorField label="After party" value={content.event.afterPartyTime} onChange={(value) => updateContent("event.afterPartyTime", value)} />
                </div>
                {content.timeline.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-[1.25rem] border border-[#252934]/10 bg-white/42 p-4">
                    <div className="grid grid-cols-[6rem_1fr] gap-3">
                      <input className={fieldClass} value={item.time} onChange={(event) => updateTimeline(index, "time", event.target.value)} />
                      <input className={fieldClass} value={item.title} onChange={(event) => updateTimeline(index, "title", event.target.value)} />
                    </div>
                    <textarea className={textareaClass} value={item.description} onChange={(event) => updateTimeline(index, "description", event.target.value)} />
                  </div>
                ))}
              </StudioCard>
            </>
          ) : null}

          {activeTab === "media" ? (
            <>
              <StudioCard eyebrow="Hero asset" title="Ảnh mở đầu">
                <div className="grid gap-4">
                  <AssetPicker
                    label="Hero desktop"
                    value={content.hero.coverImage}
                    section="hero"
                    bucket={settings.assetBucket}
                    aspect="aspect-[16/9]"
                    objectPosition={heroDesktopPosition}
                    onChange={(value) => updateHeroAsset("desktop", value)}
                  />
                  <ImagePositionControls label="Căn ảnh desktop" value={heroDesktopPosition} onChange={(value) => updateHeroObjectPosition("desktop", value)} />
                </div>
                <div className="grid gap-4">
                  <AssetPicker
                    label="Hero mobile"
                    value={content.hero.mobileCoverImage}
                    section="hero-mobile"
                    bucket={settings.assetBucket}
                    aspect="aspect-[4/5]"
                    objectPosition={heroMobilePosition}
                    onChange={(value) => updateHeroAsset("mobile", value)}
                  />
                  <ImagePositionControls label="Căn ảnh mobile" value={heroMobilePosition} onChange={(value) => updateHeroObjectPosition("mobile", value)} />
                </div>
              </StudioCard>

              <StudioCard eyebrow="Gallery" title="Thư viện ảnh" action={<button type="button" onClick={addGalleryImage} className={softButton}><ImagePlus className="h-4 w-4" /> Thêm ảnh</button>}>
                <EditorField label="Gallery title" value={content.sections.gallery.title} onChange={(value) => updateContent("sections.gallery.title", value)} />
                <EditorField label="Gallery description" value={content.sections.gallery.description} multiline onChange={(value) => updateContent("sections.gallery.description", value)} />
                <div className="grid gap-4">
                  {content.gallery.map((src, index) => {
                    const galleryPosition = content.appearance.galleryObjectPositions[index] || "center center";

                    return (
                      <div key={`${index}-${src}`} className="rounded-[1.4rem] border border-[#252934]/10 bg-white/40 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#252934]/46">Ảnh {index + 1}</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => moveGallery(index, -1)} className="rounded-full border border-[#252934]/10 px-3 py-1 text-xs font-bold">Up</button>
                            <button type="button" onClick={() => moveGallery(index, 1)} className="rounded-full border border-[#252934]/10 px-3 py-1 text-xs font-bold">Down</button>
                            <button type="button" onClick={() => removeGalleryImage(index)} className="rounded-full border border-[#252934]/10 px-3 py-1 text-xs font-bold text-[#9B4E5C]">Xóa</button>
                          </div>
                        </div>
                        <AssetPicker
                          label={`Gallery image ${index + 1}`}
                          value={src}
                          section="gallery"
                          bucket={settings.assetBucket}
                          aspect={index === 0 ? "aspect-[4/5]" : "aspect-[16/11]"}
                          objectPosition={galleryPosition}
                          onChange={(value) => updateGallery(index, value)}
                        />
                        <div className="mt-4">
                          <ImagePositionControls label={`Căn ảnh gallery ${index + 1}`} value={galleryPosition} onChange={(value) => updateGalleryPosition(index, value)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </StudioCard>
            </>
          ) : null}

          {activeTab === "rsvp" ? (
            <>
              <StudioCard eyebrow="Guest care" title="Ngôn từ xác nhận">
                <EditorField label="CTA eyebrow" value={content.sections.cta.eyebrow} onChange={(value) => updateContent("sections.cta.eyebrow", value)} />
                <EditorField label="CTA title" value={content.sections.cta.title} onChange={(value) => updateContent("sections.cta.title", value)} />
                <EditorField label="CTA description" value={content.sections.cta.description} multiline onChange={(value) => updateContent("sections.cta.description", value)} />
                <EditorField label="Button label" value={content.sections.cta.buttonLabel} onChange={(value) => updateContent("sections.cta.buttonLabel", value)} />
                <EditorField label="RSVP deadline" value={content.rsvp.deadline} onChange={(value) => updateContent("rsvp.deadline", value)} />
              </StudioCard>

              <StudioCard eyebrow="Hospitality notes" title="Lưu ý cho khách">
                <EditorCheckbox label="Hỏi ghi chú thực đơn" checked={content.rsvp.askDietary} onChange={(value) => updateContent("rsvp.askDietary", value)} />
                <EditorCheckbox label="Hỏi nhu cầu lưu trú" checked={content.rsvp.askAccommodation} onChange={(value) => updateContent("rsvp.askAccommodation", value)} />
                <EditorField label="Dress code" value={content.dressCode.title} onChange={(value) => updateContent("dressCode.title", value)} />
                <EditorField label="Dress note" value={content.dressCode.note} multiline onChange={(value) => updateContent("dressCode.note", value)} />
                <div className="grid gap-3 sm:grid-cols-5">
                  {content.dressCode.colors.map((color, index) => (
                    <input key={index} className={fieldClass} value={color} onChange={(event) => updateDressColor(index, event.target.value)} />
                  ))}
                </div>
                <EditorField label="Weather title" value={content.weatherNote.title} onChange={(value) => updateContent("weatherNote.title", value)} />
                <EditorField label="Weather note" value={content.weatherNote.description} multiline onChange={(value) => updateContent("weatherNote.description", value)} />
                <EditorField label="Accommodation title" value={content.accommodation.title} onChange={(value) => updateContent("accommodation.title", value)} />
                <EditorField label="Accommodation note" value={content.accommodation.description} multiline onChange={(value) => updateContent("accommodation.description", value)} />
              </StudioCard>
            </>
          ) : null}

          {activeTab === "motion" ? (
            <>
              <StudioCard eyebrow="Atmosphere" title="Nền và nhịp chuyển động">
                <div className="grid gap-4 sm:grid-cols-2">
                  {backgroundKeys.map((key) => (
                    <BackgroundSelect key={key} label={key} value={content.appearance.backgrounds[key]} onChange={(value) => updateContent(`appearance.backgrounds.${key}`, value)} />
                  ))}
                </div>
              </StudioCard>

              <StudioCard
                eyebrow="Media layers"
                title="Layer ảnh theo section"
                action={<button type="button" onClick={() => addMediaLayer(activeLayerSection)} className={softButton}><ImagePlus className="h-4 w-4" /> Thêm layer</button>}
              >
                <label className="grid gap-2 text-sm font-bold text-[#252934]/64">
                  Section
                  <select className={fieldClass} value={activeLayerSection} onChange={(event) => setActiveLayerSection(event.target.value as MediaSectionKey)}>
                    {mediaSectionKeys.map((key) => (
                      <option key={key} value={key}>{mediaSectionLabels[key]}</option>
                    ))}
                  </select>
                </label>
                {activeLayers.length === 0 ? (
                  <p className="rounded-[1.25rem] border border-[#252934]/10 bg-white/42 p-4 text-sm leading-6 text-[#252934]/56">
                    Section này chưa có layer riêng. Nó vẫn dùng gradient glass mặc định.
                  </p>
                ) : null}
                {activeLayers.map((layer, index) => (
                  <div key={layer.id} className="grid gap-4 rounded-[1.4rem] border border-[#252934]/10 bg-white/42 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-serif text-2xl">Layer {index + 1}</p>
                      <button type="button" onClick={() => removeMediaLayer(activeLayerSection, index)} className="rounded-full border border-[#252934]/10 px-3 py-1 text-xs font-bold text-[#9B4E5C]">Xóa</button>
                    </div>
                    <AssetPicker
                      label="Desktop layer"
                      value={layer.src}
                      section={activeLayerSection}
                      bucket={settings.assetBucket}
                      aspect="aspect-[16/9]"
                      objectPosition={layer.objectPosition.desktop}
                      onChange={(value) => updateMediaLayer(activeLayerSection, index, { src: value })}
                    />
                    <ImagePositionControls
                      label="Căn layer desktop"
                      value={layer.objectPosition.desktop}
                      onChange={(value) => updateMediaLayer(activeLayerSection, index, { objectPosition: { desktop: value } })}
                    />
                    <AssetPicker
                      label="Mobile layer"
                      value={layer.mobileSrc}
                      section={`${activeLayerSection}-mobile`}
                      bucket={settings.assetBucket}
                      aspect="aspect-[4/5]"
                      objectPosition={layer.objectPosition.mobile}
                      onChange={(value) => updateMediaLayer(activeLayerSection, index, { mobileSrc: value })}
                    />
                    <ImagePositionControls
                      label="Căn layer mobile"
                      value={layer.objectPosition.mobile}
                      onChange={(value) => updateMediaLayer(activeLayerSection, index, { objectPosition: { mobile: value } })}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <EditorField label="Alt text" value={layer.alt} onChange={(value) => updateMediaLayer(activeLayerSection, index, { alt: value })} />
                      <label className="grid gap-2 text-sm font-bold text-[#252934]/64">
                        Animation
                        <select className={fieldClass} value={layer.animation} onChange={(event) => updateMediaLayer(activeLayerSection, index, { animation: event.target.value as MediaLayer["animation"] })}>
                          <option value="none">None</option>
                          <option value="slowZoom">Slow zoom</option>
                          <option value="float">Float</option>
                          <option value="fade">Fade</option>
                        </select>
                      </label>
                      <EditorField label="Desktop scale" value={String(layer.scale.desktop)} onChange={(value) => updateMediaLayer(activeLayerSection, index, { scale: { desktop: Number(value) || 1 } })} />
                      <EditorField label="Mobile scale" value={String(layer.scale.mobile)} onChange={(value) => updateMediaLayer(activeLayerSection, index, { scale: { mobile: Number(value) || 1 } })} />
                    </div>
                    <label className="grid gap-2 text-sm font-bold text-[#252934]/64">
                      Opacity: {layer.opacity}
                      <input type="range" min="0" max="1" step="0.05" value={layer.opacity} onChange={(event) => updateMediaLayer(activeLayerSection, index, { opacity: Number(event.target.value) })} />
                    </label>
                  </div>
                ))}
              </StudioCard>
            </>
          ) : null}

          {activeTab === "publish" ? (
            <>
              <StudioCard eyebrow="Review" title="Kiểm tra trước publish">
                <InvitationChecklist issues={checklistIssues} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={saveDraft} className={softButton}><Save className="h-4 w-4" /> Save draft</button>
                  <button type="button" onClick={publish} disabled={publishing} className={primaryButton}>
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Publish public
                  </button>
                </div>
              </StudioCard>

              <VersionSnapshotsPanel
                versions={versions}
                label={versionLabel}
                backend={versionsBackend}
                busy={versionBusy}
                onLabelChange={setVersionLabel}
                onCreate={() => createVersionSnapshot()}
                onDuplicate={(version) => createVersionSnapshot("duplicate", version.settings, `${version.label} copy`)}
                onRestore={restoreVersion}
                onPublish={publishVersion}
              />
            </>
          ) : null}
        </section>

        <PreviewFrame config={previewConfig} selectedKey={previewContext} onChange={setPreviewContext} />
      </div>
    </main>
  );
}
