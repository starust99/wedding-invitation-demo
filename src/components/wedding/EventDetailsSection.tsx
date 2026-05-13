"use client";

import { EventDetailsAssetLayer } from "@/components/wedding/EventDetailsAssetLayer";
import { EventDetailsContent } from "@/components/wedding/EventDetailsContent";
import { normalizeEventDetailsEditorConfig } from "@/lib/wedding/event-details-config";
import type {
  EventDetailsAssetSlotId,
  EventDetailsPlacement,
  EventDetailsViewportMode,
  WeddingEventDetailsEditorConfig,
} from "@/lib/wedding/event-details-types";

export type EventDetailsSectionProps = {
  config: WeddingEventDetailsEditorConfig;
  mode?: "preview" | "public";
  viewport?: EventDetailsViewportMode;
  stageSize?: { width: number; height: number };
  selectedAssetId?: EventDetailsAssetSlotId;
  dragGrid?: [number, number];
  showSafeGuides?: boolean;
  showPlaceholders?: boolean;
  mapUrl?: string;
  publicData?: EventDetailsPublicData;
  onSelectAsset?: (id: EventDetailsAssetSlotId) => void;
  onPlacementChange?: (id: EventDetailsAssetSlotId, placement: EventDetailsPlacement) => void;
};

export type EventDetailsPublicData = {
  dateLabel?: string;
  welcomeTime?: string;
  venueName?: string;
  venueArea?: string;
  venueLocation?: string;
  venueAddress?: string;
  dressCodeTitle?: string;
  dressCodeNote?: string;
  dressCodeColors?: string[];
  dressCodeImageSrc?: string;
};

function SafeGuides({ viewport }: { viewport: EventDetailsViewportMode }) {
  if (viewport === "mobile") {
    return (
      <div
        className="pointer-events-none absolute z-[49] border border-dashed border-text-primary/20"
        style={{ left: 24, right: 24, top: 48, bottom: 48 }}
      >
        <span className="absolute left-3 top-3 rounded-full bg-pastel-cream/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-primary/45">
          Khung an toàn
        </span>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute z-[49] border border-dashed border-text-primary/20"
      style={{ left: "8%", right: "8%", top: "10%", bottom: "10%" }}
    >
      <span className="absolute left-3 top-3 rounded-full bg-pastel-cream/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-primary/45">
        Khung an toàn
      </span>
    </div>
  );
}

export function EventDetailsSection({
  config,
  mode = "public",
  viewport = "desktop",
  stageSize,
  selectedAssetId,
  dragGrid,
  showSafeGuides = false,
  showPlaceholders = false,
  mapUrl,
  publicData,
  onSelectAsset,
  onPlacementChange,
}: EventDetailsSectionProps) {
  const eventDetailsConfig = normalizeEventDetailsEditorConfig(config);

  return (
    <section
      id="details"
      className={[
        "relative isolate overflow-hidden text-text-primary",
        mode === "preview" ? "bg-pastel-cream" : "bg-transparent",
        mode === "preview" ? "h-full min-h-0 w-full" : "min-h-[760px]",
      ].join(" ")}
      style={mode === "preview" ? { backgroundColor: eventDetailsConfig.canvas.backgroundColor } : undefined}
      onMouseDown={() => onSelectAsset?.(selectedAssetId || "detailsBgWash")}
    >
      {mode === "preview" ? (
        <EventDetailsAssetLayer
          config={eventDetailsConfig}
          mode={mode}
          viewport={viewport}
          stageSize={stageSize}
          selectedAssetId={selectedAssetId}
          dragGrid={dragGrid}
          showPlaceholders={showPlaceholders}
          include={(asset) => asset.role === "background" || asset.role === "decorative" || asset.role === "texture"}
          onSelectAsset={onSelectAsset}
          onPlacementChange={onPlacementChange}
        />
      ) : null}

      <EventDetailsContent config={eventDetailsConfig} mode={mode} viewport={viewport} mapUrl={mapUrl} publicData={publicData} />

      <EventDetailsAssetLayer
        config={eventDetailsConfig}
        mode={mode}
        viewport={viewport}
        stageSize={stageSize}
        selectedAssetId={selectedAssetId}
        dragGrid={dragGrid}
        showPlaceholders={showPlaceholders}
        include={(asset) => asset.role === "content"}
        onSelectAsset={onSelectAsset}
        onPlacementChange={onPlacementChange}
      />

      {showSafeGuides ? <SafeGuides viewport={viewport} /> : null}
    </section>
  );
}
