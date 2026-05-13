"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { getEventDetailsAssetDefinition, validateEventDetailsAssetRatio } from "@/lib/wedding/event-details-config";
import type {
  EventDetailsAssetConfig,
  EventDetailsAssetSlotId,
  EventDetailsViewportMode,
} from "@/lib/wedding/event-details-types";
import { prepareImageFileForUpload } from "@/lib/image-compression";

const acceptedTypes = ["image/png", "image/webp", "image/jpeg", "image/avif"];
const imageAccept = "image/png,image/webp,image/jpeg,image/avif";
const roleLabels: Record<EventDetailsAssetConfig["role"], string> = {
  background: "Nền",
  decorative: "Trang trí",
  texture: "Chất liệu",
  content: "Nội dung",
};

type EventDetailsEditorSidebarProps = {
  assets: EventDetailsAssetConfig[];
  selectedAssetId: EventDetailsAssetSlotId;
  viewport: EventDetailsViewportMode;
  assetBucket?: string;
  onSelect: (id: EventDetailsAssetSlotId) => void;
  onAssetChange: (asset: EventDetailsAssetConfig) => void;
};

function getUploadMessage(file: File) {
  if (!acceptedTypes.includes(file.type)) return "Chỉ nhận PNG, WebP, JPEG hoặc AVIF.";
  if (file.size > 5 * 1024 * 1024) return "Tệp lớn hơn 5MB; vẫn có thể tải lên nếu backend cho phép, nhưng nên nén lại để xem trước nhẹ hơn.";
  return "";
}

async function readImageSize(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Không đọc được kích thước ảnh."));
      image.src = objectUrl;
    });

    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function EventDetailsEditorSidebar({
  assets,
  selectedAssetId,
  viewport,
  assetBucket,
  onSelect,
  onAssetChange,
}: EventDetailsEditorSidebarProps) {
  const [uploadingId, setUploadingId] = useState<EventDetailsAssetSlotId | null>(null);
  const [messages, setMessages] = useState<Partial<Record<EventDetailsAssetSlotId, string>>>({});
  const inputRefs = useRef<Partial<Record<EventDetailsAssetSlotId, HTMLInputElement | null>>>({});

  async function uploadAsset(asset: EventDetailsAssetConfig, file: File | undefined) {
    if (!file) return;

    const uploadMessage = getUploadMessage(file);
    if (uploadMessage && !acceptedTypes.includes(file.type)) {
      setMessages((current) => ({ ...current, [asset.id]: uploadMessage }));
      return;
    }

    setUploadingId(asset.id);
    setMessages((current) => ({ ...current, [asset.id]: uploadMessage }));

    try {
      const prepared = await prepareImageFileForUpload(file, `event-${asset.id}`);

      const size = await readImageSize(prepared.file).catch(() => null);
      const ratioWarning = size ? validateEventDetailsAssetRatio(asset.id, size.width, size.height) : "";
      const formData = new FormData();
      formData.append("file", prepared.file);
      formData.append("section", `event-details-${asset.id}`);
      if (assetBucket) formData.append("bucket", assetBucket);

      const response = await fetch("/api/admin/assets", { method: "POST", body: formData });
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const result = await response.json() as { asset?: { src: string; alt?: string }; error?: string };
      if (!response.ok || !result.asset?.src) throw new Error(result.error || "Tải ảnh thất bại.");

      onAssetChange({
        ...asset,
        src: result.asset.src,
        alt: asset.role === "content" ? result.asset.alt || asset.alt : asset.alt,
      });

      setMessages((current) => ({
        ...current,
        [asset.id]: ratioWarning || uploadMessage || "Đã tải ảnh lên.",
      }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [asset.id]: error instanceof Error ? error.message : "Không tải được ảnh.",
      }));
    } finally {
      setUploadingId(null);
      const input = inputRefs.current[asset.id];
      if (input) input.value = "";
    }
  }

  return (
    <aside className="grid max-h-[calc(100vh-9rem)] content-start gap-3 overflow-y-auto rounded-[2rem] border border-white/60 bg-white/40 p-4 shadow-[0_24px_80px_rgba(92,82,71,0.10)] backdrop-blur-xl">
      <div>
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.24em] text-text-primary/55">7 vị trí ảnh</p>
        <h2 className="mt-1 font-serif text-3xl italic text-text-primary">Thông tin địa điểm</h2>
      </div>

      {assets.map((asset) => {
        const placement = viewport === "mobile" ? asset.mobile : asset.desktop;
        const selected = asset.id === selectedAssetId;
        const definition = getEventDetailsAssetDefinition(asset.id);

        return (
          <button
            key={asset.id}
            type="button"
            onClick={() => onSelect(asset.id)}
            className={[
              "grid gap-3 rounded-[1.35rem] border p-3 text-left transition",
              selected ? "border-pastel-serenity bg-pastel-serenity/28" : "border-white/60 bg-white/35 hover:bg-white/55",
            ].join(" ")}
          >
            <div className="grid grid-cols-[4.5rem_1fr] gap-3">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/60 bg-pastel-cream">
                {asset.src ? (
                  <img src={asset.src} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                ) : (
                  <div className="grid h-full place-items-center text-text-primary/35">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/60 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-primary/60">
                    {roleLabels[asset.role]}
                  </span>
                  <span className={asset.required ? "rounded-full bg-pastel-blush/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-primary/65" : "rounded-full bg-white/60 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-primary/45"}>
                    {asset.required ? "Bắt buộc" : "Tùy chọn"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold leading-5 text-text-primary">{asset.label}</p>
                <p className="mt-1 truncate text-xs text-text-primary/45">{asset.src || "Chưa có ảnh"}</p>
                {definition.recommendedRatio ? (
                  <p className="mt-1 text-[11px] text-text-primary/42">Tỷ lệ: {definition.recommendedRatio}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  inputRefs.current[asset.id]?.click();
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  event.stopPropagation();
                  inputRefs.current[asset.id]?.click();
                }}
                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-white/70 bg-white/55 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-text-primary/70"
              >
                {uploadingId === asset.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                Tải ảnh
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onAssetChange({
                    ...asset,
                    [viewport]: {
                      ...placement,
                      visible: !placement.visible,
                    },
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  event.stopPropagation();
                  onAssetChange({
                    ...asset,
                    [viewport]: {
                      ...placement,
                      visible: !placement.visible,
                    },
                  });
                }}
                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-white/70 bg-white/55 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-text-primary/70"
              >
                {placement.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {placement.visible ? "Bật" : "Tắt"}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  if (asset.required) {
                    setMessages((current) => ({ ...current, [asset.id]: "Vị trí bắt buộc chỉ được thay ảnh, không được xóa." }));
                    return;
                  }
                  onAssetChange({ ...asset, src: "" });
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (asset.required) {
                    setMessages((current) => ({ ...current, [asset.id]: "Vị trí bắt buộc chỉ được thay ảnh, không được xóa." }));
                    return;
                  }
                  onAssetChange({ ...asset, src: "" });
                }}
                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-white/70 bg-white/55 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-text-primary/70"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </span>
            </div>

            <input
              ref={(element) => {
                inputRefs.current[asset.id] = element;
              }}
              type="file"
              accept={imageAccept}
              className="hidden"
              onChange={(event) => uploadAsset(asset, event.target.files?.[0])}
            />

            {messages[asset.id] ? (
              <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-text-primary/58">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {messages[asset.id]}
              </p>
            ) : null}
          </button>
        );
      })}
    </aside>
  );
}
