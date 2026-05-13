"use client";

import { useEffect, useState } from "react";
import { EventDetailsSection } from "@/components/wedding/EventDetailsSection";
import { normalizeEventDetailsEditorConfig } from "@/lib/wedding/event-details-config";
import type { WeddingConfig } from "@/lib/site-settings";
import type { EventDetailsViewportMode } from "@/lib/wedding/event-details-types";

export function WeddingDetailsSection({ config }: { config: WeddingConfig }) {
  const [viewport, setViewport] = useState<EventDetailsViewportMode>("desktop");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setViewport(mediaQuery.matches ? "mobile" : "desktop");

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  return (
    <EventDetailsSection
      config={normalizeEventDetailsEditorConfig(config.eventDetailsConfig)}
      mode="public"
      viewport={viewport}
      mapUrl={config.venue.mapUrl}
      publicData={{
        dateLabel: config.event.dateLabel,
        welcomeTime: config.event.welcomeTime,
        venueName: config.venue.name,
        venueArea: "Sảnh Quảng Trường",
        dressCodeTitle: "Trang phục chủ đề",
        dressCodeNote:
          "Gia đình gợi ý những tông hồng phấn, xanh trời, kem hoặc xanh lá dịu. Quý khách chọn trang phục thanh lịch, thoải mái là đủ; bảng màu chỉ để tổng thể buổi tiệc thêm hài hòa khi lên hình.",
        dressCodeImageSrc: "/assets/dresscode-theme.jpg",
      }}
    />
  );
}
