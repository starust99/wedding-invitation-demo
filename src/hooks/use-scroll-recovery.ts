"use client";

import { useEffect } from "react";

const RESTORE_DELAYS_MS = [0, 250, 900];

/**
 * Keeps an invitation close to the last reading position if an embedded
 * browser reloads the page under memory pressure. Normal first visits and
 * normal rendering are unaffected.
 */
export function useScrollRecovery(storageId: string) {
  useEffect(() => {
    const storageKey = `wedding-scroll-position:${storageId}`;
    let frameId = 0;
    let hasInteracted = false;
    const restoreTimers: number[] = [];

    const persistPosition = () => {
      frameId = 0;
      try {
        window.sessionStorage.setItem(storageKey, String(window.scrollY));
      } catch {
        // Some embedded browsers block sessionStorage; scrolling still works.
      }
    };

    const schedulePersist = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(persistPosition);
    };

    const markInteraction = () => {
      hasInteracted = true;
      restoreTimers.forEach((timer) => window.clearTimeout(timer));
      restoreTimers.length = 0;
    };

    const restorePosition = () => {
      let storedPosition = 0;
      try {
        storedPosition = Number(window.sessionStorage.getItem(storageKey) ?? 0);
      } catch {
        return;
      }
      if (!Number.isFinite(storedPosition) || storedPosition <= 0) return;

      RESTORE_DELAYS_MS.forEach((delay) => {
        restoreTimers.push(window.setTimeout(() => {
          if (hasInteracted) return;
          const maxScroll = Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight,
          );
          window.scrollTo(0, Math.min(storedPosition, maxScroll));
        }, delay));
      });
    };

    const navigation = window.performance
      .getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "reload") restorePosition();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) restorePosition();
    };

    window.addEventListener("scroll", schedulePersist, { passive: true });
    window.addEventListener("pagehide", persistPosition);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pointerdown", markInteraction, { passive: true });
    window.addEventListener("touchstart", markInteraction, { passive: true });
    window.addEventListener("wheel", markInteraction, { passive: true });
    window.addEventListener("keydown", markInteraction);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      restoreTimers.forEach((timer) => window.clearTimeout(timer));
      persistPosition();
      window.removeEventListener("scroll", schedulePersist);
      window.removeEventListener("pagehide", persistPosition);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("touchstart", markInteraction);
      window.removeEventListener("wheel", markInteraction);
      window.removeEventListener("keydown", markInteraction);
    };
  }, [storageId]);
}
