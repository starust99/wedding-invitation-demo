"use client";

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  FileUp,
  Maximize2,
  Monitor,
  PanelLeft,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Smartphone,
  UploadCloud,
  X,
} from "lucide-react";
import { EventDetailsEditorControls } from "@/components/wedding/EventDetailsEditorControls";
import { EventDetailsEditorSidebar } from "@/components/wedding/EventDetailsEditorSidebar";
import { EventDetailsSection } from "@/components/wedding/EventDetailsSection";
import {
  createDefaultEventDetailsConfig,
  eventDetailsEditorExportFileName,
  eventDetailsEditorStorageKey,
  normalizeEventDetailsEditorConfig,
  touchEventDetailsConfig,
} from "@/lib/wedding/event-details-config";
import type {
  EventDetailsAssetConfig,
  EventDetailsAssetSlotId,
  EventDetailsPlacement,
  EventDetailsViewportMode,
  WeddingEventDetailsEditorConfig,
} from "@/lib/wedding/event-details-types";

type EventDetailsAssetEditorProps = {
  config: WeddingEventDetailsEditorConfig;
  assetBucket?: string;
  onChange: (config: WeddingEventDetailsEditorConfig) => void;
  onSaveDraft?: () => Promise<void> | void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function downloadJson(config: WeddingEventDetailsEditorConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = eventDetailsEditorExportFileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getStageTarget(mode: EventDetailsViewportMode) {
  return mode === "mobile"
    ? { width: 390, height: 844 }
    : { width: 1440, height: 810 };
}

function getAssetById(config: WeddingEventDetailsEditorConfig, id: EventDetailsAssetSlotId) {
  return config.assets.find((asset) => asset.id === id) || config.assets[0];
}

type EventDetailsCanvasPanelProps = {
  config: WeddingEventDetailsEditorConfig;
  viewport: EventDetailsViewportMode;
  selectedAssetId: EventDetailsAssetSlotId;
  showSafeGuides: boolean;
  fullscreen?: boolean;
  onViewportChange: (viewport: EventDetailsViewportMode) => void;
  onSafeGuidesChange: (value: boolean) => void;
  onSelectAsset: (id: EventDetailsAssetSlotId) => void;
  onPlacementChange: (id: EventDetailsAssetSlotId, placement: EventDetailsPlacement) => void;
  onNudge: (event: KeyboardEvent<HTMLDivElement>) => void;
  onEnterFullscreen?: () => void;
};

function EventDetailsCanvasPanel({
  config,
  viewport,
  selectedAssetId,
  showSafeGuides,
  fullscreen = false,
  onViewportChange,
  onSafeGuidesChange,
  onSelectAsset,
  onPlacementChange,
  onNudge,
  onEnterFullscreen,
}: EventDetailsCanvasPanelProps) {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const target = getStageTarget(viewport);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const sync = () => {
      setStageSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    return () => observer.disconnect();
  }, [viewport, fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    window.setTimeout(() => stageRef.current?.focus(), 0);
  }, [fullscreen, viewport]);

  const canvasWidthStyle = fullscreen
    ? viewport === "mobile"
      ? "min(100%, 390px, calc((100vh - 12rem) * 0.462))"
      : "min(100%, 1440px, calc((100vh - 10rem) * 1.7778))"
    : viewport === "mobile"
      ? target.width
      : "min(100%, 1120px)";

  return (
    <section
      className={[
        "grid content-start gap-3 rounded-[2rem] border border-white/60 bg-white/30 shadow-[0_24px_80px_rgba(92,82,71,0.08)] backdrop-blur-xl",
        fullscreen ? "min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] p-3" : "p-4",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-full border border-white/60 bg-white/40 p-1">
          {[
            { value: "desktop" as const, label: "Màn lớn", icon: Monitor },
            { value: "mobile" as const, label: "Di động", icon: Smartphone },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onViewportChange(item.value)}
                className={[
                  "inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-[0.16em]",
                  viewport === item.value ? "bg-pastel-sage text-text-primary" : "text-text-primary/55",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSafeGuidesChange(!showSafeGuides)}
            className="rounded-full border border-white/70 bg-white/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-text-primary/65"
          >
            {showSafeGuides ? "Ẩn khung an toàn" : "Hiện khung an toàn"}
          </button>
          {onEnterFullscreen ? (
            <button
              type="button"
              onClick={onEnterFullscreen}
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-text-primary/65"
            >
              <Maximize2 className="h-4 w-4" />
              Toàn màn hình
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={[
          "overflow-auto rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(250,220,217,0.36),rgba(212,228,247,0.28))]",
          fullscreen ? "min-h-0 p-3" : "p-5",
        ].join(" ")}
      >
        <div
          className="mx-auto"
          style={{
            width: canvasWidthStyle,
            maxWidth: viewport === "mobile" && !fullscreen ? target.width : "100%",
          }}
        >
          <div
            ref={stageRef}
            tabIndex={0}
            onKeyDown={onNudge}
            className="relative overflow-hidden rounded-[2rem] bg-pastel-cream shadow-[0_28px_90px_rgba(92,82,71,0.16)] outline-none ring-1 ring-white/70 focus:ring-2 focus:ring-pastel-serenity"
            style={{
              aspectRatio: viewport === "mobile" ? "390 / 844" : "16 / 9",
              height: !fullscreen && viewport === "mobile" ? target.height : undefined,
            }}
          >
            <EventDetailsSection
              config={config}
              mode="preview"
              viewport={viewport}
              stageSize={stageSize}
              selectedAssetId={selectedAssetId}
              showSafeGuides={showSafeGuides}
              showPlaceholders
              dragGrid={[1, 1]}
              onSelectAsset={onSelectAsset}
              onPlacementChange={onPlacementChange}
            />
          </div>
        </div>
      </div>

      <p className="text-xs leading-5 text-text-primary/50">
        Bấm ảnh để chọn. Kéo ảnh để đổi x/y, kéo góc để đổi rộng. Phím mũi tên dịch 0.5%, Shift+phím mũi tên dịch 2%. Delete ẩn ảnh tùy chọn.
      </p>
    </section>
  );
}

export function EventDetailsAssetEditor({ config, assetBucket, onChange, onSaveDraft }: EventDetailsAssetEditorProps) {
  const normalizedConfig = useMemo(() => normalizeEventDetailsEditorConfig(config), [config]);
  const [selectedAssetId, setSelectedAssetId] = useState<EventDetailsAssetSlotId>("detailsBgWash");
  const [viewport, setViewport] = useState<EventDetailsViewportMode>("desktop");
  const [showSafeGuides, setShowSafeGuides] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const selectedAsset = getAssetById(normalizedConfig, selectedAssetId);

  useEffect(() => {
    if (!isFullscreen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (leftPanelOpen || rightPanelOpen) {
        setLeftPanelOpen(false);
        setRightPanelOpen(false);
        return;
      }

      setIsFullscreen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, leftPanelOpen, rightPanelOpen]);

  function commit(nextConfig: WeddingEventDetailsEditorConfig, message = "") {
    onChange(touchEventDetailsConfig(normalizeEventDetailsEditorConfig(nextConfig)));
    if (message) setNotice(message);
  }

  function updateAsset(nextAsset: EventDetailsAssetConfig) {
    commit({
      ...normalizedConfig,
      assets: normalizedConfig.assets.map((asset) => asset.id === nextAsset.id ? nextAsset : asset),
    });
  }

  function updatePlacement(id: EventDetailsAssetSlotId, placement: EventDetailsPlacement) {
    const asset = getAssetById(normalizedConfig, id);
    updateAsset({
      ...asset,
      [viewport]: {
        ...placement,
        x: clamp(placement.x, -50, 150),
        y: clamp(placement.y, -50, 150),
        width: clamp(placement.width, 1, 200),
        opacity: clamp(placement.opacity, 0, 1),
        rotation: clamp(placement.rotation, -45, 45),
        zIndex: clamp(Math.round(placement.zIndex), 0, 50),
      },
    });
  }

  function nudgeSelected(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Delete", "Backspace"];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const asset = getAssetById(normalizedConfig, selectedAssetId);
    const placement = viewport === "mobile" ? asset.mobile : asset.desktop;

    if (event.key === "Delete" || event.key === "Backspace") {
      if (asset.required) {
        setNotice("Vị trí bắt buộc không xóa bằng Delete; có thể ẩn hoặc thay ảnh.");
        return;
      }
      updateAsset({
        ...asset,
        [viewport]: {
          ...placement,
          visible: false,
        },
      });
      return;
    }

    const amount = event.shiftKey ? 2 : 0.5;
    const delta = {
      ArrowUp: { x: 0, y: -amount },
      ArrowDown: { x: 0, y: amount },
      ArrowLeft: { x: -amount, y: 0 },
      ArrowRight: { x: amount, y: 0 },
    }[event.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"];

    updatePlacement(asset.id, {
      ...placement,
      x: placement.x + delta.x,
      y: placement.y + delta.y,
    });
  }

  async function saveConfig() {
    window.localStorage.setItem(eventDetailsEditorStorageKey, JSON.stringify(normalizedConfig));
    await onSaveDraft?.();
    setNotice("Đã lưu cấu hình thông tin địa điểm vào bộ nhớ cục bộ và bản nháp.");
  }

  function loadConfig() {
    const raw = window.localStorage.getItem(eventDetailsEditorStorageKey);
    if (!raw) {
      setNotice("Chưa có cấu hình lưu cục bộ.");
      return;
    }
    commit(JSON.parse(raw) as WeddingEventDetailsEditorConfig, "Đã tải cấu hình thông tin địa điểm từ bộ nhớ cục bộ.");
  }

  function resetAll() {
    commit(createDefaultEventDetailsConfig(), "Đã đặt lại toàn bộ bố cục thông tin địa điểm.");
    setSelectedAssetId("detailsBgWash");
  }

  async function importJson(file: File | undefined) {
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text()) as WeddingEventDetailsEditorConfig;
      commit(imported, "Đã nhập tệp JSON cấu hình thông tin địa điểm.");
    } catch {
      setNotice("Tệp JSON không hợp lệ hoặc sai cấu trúc.");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  const fullscreenOverlay = isFullscreen && typeof document !== "undefined"
    ? createPortal(
      <div className="fixed inset-0 z-[90] flex flex-col bg-pastel-cream/95 text-text-primary backdrop-blur-xl">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-text-primary/10 bg-white/35 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/45 text-text-primary"
              aria-label="Thoát toàn màn hình"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-text-primary/50">Sửa toàn màn hình</p>
              <h2 className="font-serif text-2xl italic leading-none text-text-primary">{selectedAsset.label}</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 2xl:hidden">
            <button
              type="button"
              onClick={() => {
                setLeftPanelOpen(true);
                setRightPanelOpen(false);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 text-xs font-bold uppercase tracking-[0.16em] text-text-primary/70"
            >
              <PanelLeft className="h-4 w-4" />
              Ảnh
            </button>
            <button
              type="button"
              onClick={() => {
                setRightPanelOpen(true);
                setLeftPanelOpen(false);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 text-xs font-bold uppercase tracking-[0.16em] text-text-primary/70"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Điều chỉnh
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 p-4 2xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
          <div className="hidden min-h-0 2xl:block">
            <EventDetailsEditorSidebar
              assets={normalizedConfig.assets}
              selectedAssetId={selectedAssetId}
              viewport={viewport}
              assetBucket={assetBucket}
              onSelect={setSelectedAssetId}
              onAssetChange={updateAsset}
            />
          </div>

          <EventDetailsCanvasPanel
            config={normalizedConfig}
            viewport={viewport}
            selectedAssetId={selectedAssetId}
            showSafeGuides={showSafeGuides}
            fullscreen
            onViewportChange={setViewport}
            onSafeGuidesChange={setShowSafeGuides}
            onSelectAsset={setSelectedAssetId}
            onPlacementChange={updatePlacement}
            onNudge={nudgeSelected}
          />

          <div className="hidden min-h-0 2xl:block">
            <EventDetailsEditorControls
              config={normalizedConfig}
              selectedAsset={selectedAsset}
              viewport={viewport}
              onConfigChange={commit}
              onAssetChange={updateAsset}
            />
          </div>
        </div>

        {leftPanelOpen ? (
          <div className="fixed inset-0 z-[91] bg-text-primary/20 backdrop-blur-sm 2xl:hidden">
            <div className="h-full w-[min(22rem,calc(100vw-2rem))] border-r border-white/60 bg-pastel-cream p-3 shadow-[0_24px_80px_rgba(92,82,71,0.18)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-primary/55">Ảnh</p>
                <button type="button" onClick={() => setLeftPanelOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/55">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <EventDetailsEditorSidebar
                assets={normalizedConfig.assets}
                selectedAssetId={selectedAssetId}
                viewport={viewport}
                assetBucket={assetBucket}
                onSelect={(id) => {
                  setSelectedAssetId(id);
                  setLeftPanelOpen(false);
                }}
                onAssetChange={updateAsset}
              />
            </div>
          </div>
        ) : null}

        {rightPanelOpen ? (
          <div className="fixed inset-0 z-[91] bg-text-primary/20 backdrop-blur-sm 2xl:hidden">
            <div className="ml-auto h-full w-[min(22rem,calc(100vw-2rem))] border-l border-white/60 bg-pastel-cream p-3 shadow-[0_24px_80px_rgba(92,82,71,0.18)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-primary/55">Điều chỉnh</p>
                <button type="button" onClick={() => setRightPanelOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/55">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <EventDetailsEditorControls
                config={normalizedConfig}
                selectedAsset={selectedAsset}
                viewport={viewport}
                onConfigChange={commit}
                onAssetChange={updateAsset}
              />
            </div>
          </div>
        ) : null}
      </div>,
      document.body,
    )
    : null;

  return (
    <div className="grid gap-4 rounded-[2.25rem] border border-white/60 bg-pastel-cream/70 p-4 text-text-primary shadow-[0_30px_100px_rgba(92,82,71,0.10)] backdrop-blur-xl xl:col-span-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-[0.28em] text-text-primary/55">Trình sửa thông tin & địa điểm</p>
          <h2 className="mt-1 font-serif text-4xl italic text-text-primary">Bố cục địa điểm vườn pastel</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={saveConfig} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-pastel-sage px-4 text-xs font-bold uppercase tracking-[0.18em] text-text-primary">
            <Save className="h-4 w-4" />
            Lưu cấu hình
          </button>
          <button type="button" onClick={loadConfig} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/70 bg-white/40 px-4 text-xs font-bold uppercase tracking-[0.18em] text-text-primary/70">
            <UploadCloud className="h-4 w-4" />
            Tải cấu hình
          </button>
          <button type="button" onClick={() => downloadJson(normalizedConfig)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/70 bg-white/40 px-4 text-xs font-bold uppercase tracking-[0.18em] text-text-primary/70">
            <Download className="h-4 w-4" />
            Xuất JSON
          </button>
          <button type="button" onClick={() => importInputRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/70 bg-white/40 px-4 text-xs font-bold uppercase tracking-[0.18em] text-text-primary/70">
            <FileUp className="h-4 w-4" />
            Nhập JSON
          </button>
          <button type="button" onClick={resetAll} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/70 bg-white/40 px-4 text-xs font-bold uppercase tracking-[0.18em] text-text-primary/70">
            <RotateCcw className="h-4 w-4" />
            Đặt lại toàn bộ
          </button>
          <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => importJson(event.target.files?.[0])} />
        </div>
      </div>

      {notice ? (
        <p className="rounded-2xl border border-white/60 bg-white/40 px-4 py-3 text-sm font-semibold text-text-primary/65">{notice}</p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)_22rem]">
        <EventDetailsEditorSidebar
          assets={normalizedConfig.assets}
          selectedAssetId={selectedAssetId}
          viewport={viewport}
          assetBucket={assetBucket}
          onSelect={setSelectedAssetId}
          onAssetChange={updateAsset}
        />

        <EventDetailsCanvasPanel
          config={normalizedConfig}
          viewport={viewport}
          selectedAssetId={selectedAssetId}
          showSafeGuides={showSafeGuides}
          onViewportChange={setViewport}
          onSafeGuidesChange={setShowSafeGuides}
          onSelectAsset={setSelectedAssetId}
          onPlacementChange={updatePlacement}
          onNudge={nudgeSelected}
          onEnterFullscreen={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
            setIsFullscreen(true);
          }}
        />

        <EventDetailsEditorControls
          config={normalizedConfig}
          selectedAsset={selectedAsset}
          viewport={viewport}
          onConfigChange={commit}
          onAssetChange={updateAsset}
        />
      </div>
      {fullscreenOverlay}
    </div>
  );
}
