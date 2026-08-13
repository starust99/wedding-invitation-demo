"use client";

import { useEffect } from "react";
import Image from "next/image";
import { HeartHandshake } from "lucide-react";
import { usePageTransition } from "@/components/PageTransitionEffect";

export function BottomRsvpCta({ rsvpHref }: { rsvpHref: string }) {
  const { navigateWithTransition, prefetch } = usePageTransition();

  useEffect(() => {
    prefetch(rsvpHref);
  }, [prefetch, rsvpHref]);

  return (
    <section className="invite-bottom-rsvp-cta" aria-label="Xác nhận tham dự">
      <div className="relative inline-flex">
        <button
          type="button"
          onClick={() => navigateWithTransition(rsvpHref)}
          onMouseEnter={() => prefetch(rsvpHref)}
          onTouchStart={() => prefetch(rsvpHref)}
          className="save-date-watercolor-btn mx-auto inline-flex h-[2.75rem] min-w-[11rem] items-center justify-center transition hover:-translate-y-0.5 sm:h-[3rem] sm:min-w-[12.5rem]"
        >
          <span className="save-date-btn-label">
            <HeartHandshake aria-hidden="true" className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <span>Xác nhận tham dự</span>
          </span>
        </button>

        <span className="rsvp-tap-guide" aria-hidden="true">
          <span className="rsvp-tap-guide-ripple" />
          <Image
            src="/assets/wedding/ui/rsvp/tap-hand-neutral.webp"
            alt=""
            width={420}
            height={420}
            className="rsvp-tap-guide-image"
            draggable={false}
            unoptimized
          />
        </span>
      </div>
    </section>
  );
}
