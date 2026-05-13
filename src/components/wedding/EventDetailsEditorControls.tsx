"use client";

import type { ReactNode } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { resetEventDetailsAssetToDefault } from "@/lib/wedding/event-details-config";
import type {
  EventDetailsAssetConfig,
  EventDetailsBlendMode,
  EventDetailsPlacement,
  EventDetailsViewportMode,
  WeddingEventDetailsEditorConfig,
} from "@/lib/wedding/event-details-types";

const fitOptions: Array<EventDetailsPlacement["fit"]> = ["cover", "contain"];
const blendOptions: EventDetailsBlendMode[] = ["normal", "multiply", "screen", "overlay", "soft-light"];
const fitLabels: Record<EventDetailsPlacement["fit"], string> = {
  cover: "Phủ kín",
  contain: "Giữ trọn",
};
const blendLabels: Record<EventDetailsBlendMode, string> = {
  normal: "Bình thường",
  multiply: "Nhân",
  screen: "Sáng lên",
  overlay: "Chồng lớp",
  "soft-light": "Ánh sáng mềm",
};

type EventDetailsEditorControlsProps = {
  config: WeddingEventDetailsEditorConfig;
  selectedAsset: EventDetailsAssetConfig;
  viewport: EventDetailsViewportMode;
  onConfigChange: (config: WeddingEventDetailsEditorConfig) => void;
  onAssetChange: (asset: EventDetailsAssetConfig) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-primary/55">{children}</span>;
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}: {Number.isInteger(value) ? value : value.toFixed(2)}</FieldLabel>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-pastel-serenity"
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const className = "w-full rounded-2xl border border-white/60 bg-white/45 px-4 py-3 text-sm text-text-primary outline-none backdrop-blur-md focus:border-pastel-serenity";

  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      {multiline ? (
        <textarea className={`${className} min-h-24 leading-6`} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={className} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

export function EventDetailsEditorControls({
  config,
  selectedAsset,
  viewport,
  onConfigChange,
  onAssetChange,
}: EventDetailsEditorControlsProps) {
  const placement = viewport === "mobile" ? selectedAsset.mobile : selectedAsset.desktop;

  function updatePlacement(patch: Partial<EventDetailsPlacement>) {
    onAssetChange({
      ...selectedAsset,
      [viewport]: {
        ...placement,
        ...patch,
        x: patch.x === undefined ? placement.x : clamp(patch.x, -50, 150),
        y: patch.y === undefined ? placement.y : clamp(patch.y, -50, 150),
        width: patch.width === undefined ? placement.width : clamp(patch.width, 1, 200),
        opacity: patch.opacity === undefined ? placement.opacity : clamp(patch.opacity, 0, 1),
        rotation: patch.rotation === undefined ? placement.rotation : clamp(patch.rotation, -45, 45),
        zIndex: patch.zIndex === undefined ? placement.zIndex : clamp(Math.round(patch.zIndex), 0, 50),
      },
    });
  }

  function updateContent(path: keyof WeddingEventDetailsEditorConfig["content"], value: string) {
    onConfigChange({
      ...config,
      content: {
        ...config.content,
        [path]: value,
      },
    });
  }

  return (
    <aside className="grid max-h-[calc(100vh-9rem)] content-start gap-4 overflow-y-auto rounded-[2rem] border border-white/60 bg-white/40 p-4 shadow-[0_24px_80px_rgba(92,82,71,0.10)] backdrop-blur-xl">
      <div>
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.24em] text-text-primary/55">Ảnh đang chọn</p>
        <h2 className="mt-1 font-serif text-3xl italic text-text-primary">{selectedAsset.label}</h2>
        <p className="mt-2 text-xs leading-5 text-text-primary/50">{viewport === "mobile" ? "Bố cục di động" : "Bố cục màn lớn"}</p>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-white/60 bg-white/30 p-4">
        <NumberControl label="X" value={placement.x} min={-50} max={150} step={0.5} onChange={(x) => updatePlacement({ x })} />
        <NumberControl label="Y" value={placement.y} min={-50} max={150} step={0.5} onChange={(y) => updatePlacement({ y })} />
        <NumberControl label="Rộng" value={placement.width} min={1} max={200} step={0.5} onChange={(width) => updatePlacement({ width })} />
        <NumberControl label="Độ mờ" value={placement.opacity} min={0} max={1} step={0.01} onChange={(opacity) => updatePlacement({ opacity })} />
        <NumberControl label="Xoay" value={placement.rotation} min={-45} max={45} step={0.5} onChange={(rotation) => updatePlacement({ rotation })} />

        <label className="grid gap-2">
          <FieldLabel>Thứ tự lớp</FieldLabel>
          <input
            type="number"
            min={0}
            max={50}
            value={placement.zIndex}
            onChange={(event) => updatePlacement({ zIndex: Number(event.target.value) })}
            className="rounded-2xl border border-white/60 bg-white/45 px-4 py-3 text-sm text-text-primary outline-none"
          />
        </label>

        <label className="relative grid gap-2">
          <FieldLabel>Cách cắt ảnh</FieldLabel>
          <select
            value={placement.fit}
            onChange={(event) => updatePlacement({ fit: event.target.value as EventDetailsPlacement["fit"] })}
            className="appearance-none rounded-2xl border border-white/60 bg-white/45 px-4 py-3 text-sm text-text-primary outline-none"
          >
            {fitOptions.map((fit) => <option key={fit} value={fit}>{fitLabels[fit]}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 text-text-primary/45" />
        </label>

        <label className="relative grid gap-2">
          <FieldLabel>Chế độ hòa trộn</FieldLabel>
          <select
            value={placement.blendMode}
            onChange={(event) => updatePlacement({ blendMode: event.target.value as EventDetailsBlendMode })}
            className="appearance-none rounded-2xl border border-white/60 bg-white/45 px-4 py-3 text-sm text-text-primary outline-none"
          >
            {blendOptions.map((blendMode) => <option key={blendMode} value={blendMode}>{blendLabels[blendMode]}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 text-text-primary/45" />
        </label>

        <button
          type="button"
          onClick={() => onAssetChange(resetEventDetailsAssetToDefault(selectedAsset, viewport))}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 text-xs font-bold uppercase tracking-[0.18em] text-text-primary/70"
        >
          <RotateCcw className="h-4 w-4" />
          Đặt lại ảnh đang chọn
        </button>
      </div>

      <div className="grid gap-3 rounded-[1.5rem] border border-white/60 bg-white/30 p-4">
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.24em] text-text-primary/55">Nội dung phần này</p>
        <TextInput label="Dòng nhỏ" value={config.content.eyebrow} onChange={(value) => updateContent("eyebrow", value)} />
        <TextInput label="Tiêu đề" value={config.content.title} onChange={(value) => updateContent("title", value)} />
        <TextInput label="Lời dẫn" value={config.content.intro} multiline onChange={(value) => updateContent("intro", value)} />
        <TextInput label="Nhãn phần nghi thức" value={config.content.ceremonyLabel} onChange={(value) => updateContent("ceremonyLabel", value)} />
        <TextInput label="Giờ nghi thức" value={config.content.ceremonyTime} onChange={(value) => updateContent("ceremonyTime", value)} />
        <TextInput label="Địa điểm nghi thức" value={config.content.ceremonyLocation} onChange={(value) => updateContent("ceremonyLocation", value)} />
        <TextInput label="Nhãn phần đón tiệc" value={config.content.receptionLabel} onChange={(value) => updateContent("receptionLabel", value)} />
        <TextInput label="Giờ đón tiệc" value={config.content.receptionTime} onChange={(value) => updateContent("receptionTime", value)} />
        <TextInput label="Địa điểm đón tiệc" value={config.content.receptionLocation} onChange={(value) => updateContent("receptionLocation", value)} />
        <TextInput label="Nhãn trang phục" value={config.content.dressCodeLabel} onChange={(value) => updateContent("dressCodeLabel", value)} />
        <TextInput label="Lưu ý trang phục" value={config.content.dressCodeText} multiline onChange={(value) => updateContent("dressCodeText", value)} />
        <TextInput label="Nhãn bản đồ" value={config.content.mapLabel} onChange={(value) => updateContent("mapLabel", value)} />
        <TextInput label="Lời dẫn bản đồ" value={config.content.mapText} multiline onChange={(value) => updateContent("mapText", value)} />
      </div>
    </aside>
  );
}
