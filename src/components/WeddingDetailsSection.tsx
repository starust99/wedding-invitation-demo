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
          "Vì Đà Lạt vào đông rất lạnh, quý khách lưu ý mặc thật ấm. Gia đình gợi ý tông màu: hồng phấn, xanh da trời, kem hoặc xanh lá dịu để khung hình thêm phần hài hòa.",
        dressCodeImageSrc: "/assets/dresscode-theme.jpg",
      }}
    />
  );
}
