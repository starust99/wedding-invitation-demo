"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GuestIdentity } from "@/lib/guest-personalization";
import type { WeddingConfig } from "@/lib/site-settings";
import { CanvasVideo } from "./CanvasVideo";

type SplashStatus = "checking" | "closed" | "opening" | "hidden";

function readForceIntro() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("intro") === "1";
}

function markSplashSeen(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {}
}

function hasSeenSplash(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}


export function WeddingSplashIntro({
  config: _config,
  guestIdentity: _guestIdentity,
  storageKey = "public",
  ready = true,
}: {
  config: WeddingConfig;
  guestIdentity: GuestIdentity;
  storageKey?: string;
  ready?: boolean;
}) {
const [status, setStatus] = useState<SplashStatus>("checking");
  const [isImmediateClose, setIsImmediateClose] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile" | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setViewport(mediaQuery.matches ? "mobile" : "desktop");
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);
  const closeTimer = useRef<number | null>(null);
  const sessionKey = `wedding-splash:${storageKey}`;
  const isVisible = status !== "hidden";

  useEffect(() => {
    if (!ready) return;
    const shouldForce = readForceIntro();
    window.requestAnimationFrame(() => {
      const isHidden = hasSeenSplash(sessionKey) && !shouldForce;
      if (isHidden) {
        setIsImmediateClose(true);
      }
      setStatus(isHidden ? "hidden" : "closed");
      if (isHidden) {
        window.dispatchEvent(new Event("introFinished"));
      }
    });
  }, [ready, sessionKey]);

  const closeIntro = useCallback(() => {
    markSplashSeen(sessionKey);
    setStatus("hidden");
    // Dispatch immediately so Hero animations run concurrently with the exit transition
    window.dispatchEvent(new Event("introFinished"));
  }, [sessionKey]);

  const openIntro = useCallback(() => {
    if (!ready || status === "opening") return;
    setStatus("opening");
    
    // Fallback timer just in case video onEnded fails or user is on low-power mode (increased for slow networks)
    closeTimer.current = window.setTimeout(closeIntro, 15000);
  }, [closeIntro, status, ready]);

  useEffect(() => {
    if (!isVisible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const opening = status === "opening";

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="wedding-splash"
          role="dialog"
          aria-modal="true"
          aria-label="Mở thiệp cưới"
          className="fixed inset-0 z-[80] grid min-h-dvh place-items-center overflow-hidden bg-[#FBF8F1] text-ink"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: isImmediateClose ? 0 : 1.2, ease: "easeInOut" }}
        >
          
          {/* THE VIDEO - responsive sources for mobile (9:16) and desktop (16:9) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CanvasVideo 
              className="h-full w-full pointer-events-none"
              isPlaying={status === "opening"}
              onEnded={closeIntro}
              poster={viewport === "mobile" ? "/assets/wedding/ui/splash-poster-mobile.jpg" : "/assets/wedding/ui/splash-closed.png"}
              src={viewport === "mobile" ? "/assets/wedding/ui/splash-video-mobile.mp4" : viewport === "desktop" ? "/assets/wedding/ui/splash-video.mp4" : undefined}
            />
          </div>

          {/* CLICKABLE OVERLAY */}
          <motion.div 
            className="absolute inset-0 cursor-pointer flex items-center justify-center"
            onClick={openIntro}
          >
            {/* Pulsing Hint for Wax Seal */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={opening ? { opacity: 0 } : { opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              <motion.div 
                className="relative flex flex-col items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Invisible click target covering the wax seal */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full" />
                <p className="mt-5 whitespace-nowrap text-[0.65rem] font-medium uppercase tracking-[0.25em] text-[#8C7355] bg-white/60 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                  Chạm để mở
                </p>
              </motion.div>
            </motion.div>
          </motion.div>



        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
