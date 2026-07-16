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
  const [preloading, setPreloading] = useState(true);
  const [progress, setProgress] = useState(0);
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
    const isHidden = hasSeenSplash(sessionKey) && !shouldForce;
    if (isHidden) {
      setIsImmediateClose(true);
      setPreloading(false);
      setStatus("hidden");
      window.dispatchEvent(new Event("introFinished"));
      return;
    }

    // List of critical assets to load before showing "Chạm để mở"
    const imagesToLoad = [
      "/assets/preloader-logo.webp",
      "/assets/wedding/ui/splash-closed.png",
      "/assets/wedding/ui/splash-poster-mobile.jpg",
      "/assets/bg-mobile.webp",
      "/assets/bg-desktop.webp",
      "/assets/divider_cards.png",
      "/assets/hero-names-logo-v9-centered.png",
      "/assets/hero-invite-heading-v5.png",
      "/assets/hero-corner-left-v2.png",
      "/assets/hero-corner-right-v3.png",
    ];

    const isMobile = window.innerWidth < 768;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                     /iPad|iPhone|iPod/.test(navigator.userAgent);

    const mediaToLoad = [
      // Active opening splash video
      isMobile ? "/assets/wedding/ui/splash-video-mobile.mp4" : "/assets/wedding/ui/splash-video.mp4",
      // Active rings video
      isSafari ? "/assets/wedding-rings.mov?v=7" : "/assets/wedding-rings.webm?v=7",
      // Background music
      "/assets/audio/co-chut-ngot-ngao.mp3"
    ];

    let loadedCount = 0;
    const totalAssets = imagesToLoad.length + mediaToLoad.length;

    if (totalAssets === 0) {
      setPreloading(false);
      setStatus("closed");
      return;
    }

    let isCancelled = false;

    const checkComplete = () => {
      loadedCount++;
      if (!isCancelled) {
        const percent = Math.min(100, Math.round((loadedCount / totalAssets) * 100));
        setProgress(percent);
        if (loadedCount >= totalAssets) {
          setTimeout(() => {
            if (!isCancelled) {
              setPreloading(false);
              setStatus("closed");
            }
          }, 600);
        }
      }
    };

    // Load images
    imagesToLoad.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = checkComplete;
      img.onerror = checkComplete;
    });

    // Load media (videos & audio) via fetch to populate browser HTTP cache
    mediaToLoad.forEach((src) => {
      fetch(src)
        .then(() => checkComplete())
        .catch(() => checkComplete()); // fallback so it doesn't block the site if request fails
    });

    return () => {
      isCancelled = true;
    };
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
    window.dispatchEvent(new Event("playWeddingMusic"));
    
    // Fallback timer just in case video onEnded fails or user is on low-power mode (increased for slow networks)
    closeTimer.current = window.setTimeout(closeIntro, 15000);
  }, [closeIntro, status, ready]);

  useEffect(() => {
    if (preloading || isVisible) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [preloading, isVisible]);

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
          id="wedding-splash-screen"
          className="fixed inset-0 z-[80] grid min-h-dvh place-items-center overflow-hidden bg-[#FBF8F1] text-ink"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: isImmediateClose ? 0 : 1.2, ease: "easeInOut" }}
        >
          {/* Synchronous script to immediately hide splash screen on mount if already seen to prevent flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var key = "wedding-splash:" + "${storageKey}";
                  var shouldForce = new URLSearchParams(window.location.search).get("intro") === "1";
                  if (window.localStorage.getItem(key) === "1" && !shouldForce) {
                    var style = document.createElement('style');
                    style.innerHTML = '#wedding-splash-screen { display: none !important; }';
                    document.head.appendChild(style);
                  }
                } catch (e) {}
              `,
            }}
          />
          
          {/* THE VIDEO - responsive sources for mobile (9:16) and desktop (16:9) */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {/* Desktop Splash Video */}
            <CanvasVideo 
              className="hidden md:block h-full w-full pointer-events-none scale-[1.08] md:scale-100"
              isPlaying={status === "opening" && viewport === "desktop"}
              onEnded={closeIntro}
              poster="/assets/wedding/ui/splash-closed.png"
              src="/assets/wedding/ui/splash-video.mp4"
              preload="auto"
            />
            {/* Mobile Splash Video */}
            <CanvasVideo 
              className="block md:hidden h-full w-full pointer-events-none scale-[1.08]"
              isPlaying={status === "opening" && viewport === "mobile"}
              onEnded={closeIntro}
              poster="/assets/wedding/ui/splash-poster-mobile.jpg"
              src="/assets/wedding/ui/splash-video-mobile.mp4"
              preload="auto"
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

          {/* PRELOADER OVERLAY - rendered on top, fades out when loaded */}
          <AnimatePresence>
            {preloading && (
              <motion.div
                key="wedding-preloader"
                className="absolute inset-0 w-full h-full z-[999999] flex flex-col items-center justify-center bg-[#FDFBF7] text-[#3f4642] select-none"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className="flex flex-col items-center max-w-[280px] w-full text-center px-4">
                  {/* Preloader Logo */}
                  <div className="mb-6 select-none animate-pulse">
                    <img 
                      src="/assets/preloader-logo.webp" 
                      alt="Nhật & Phương Logo" 
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain mx-auto" 
                    />
                  </div>
                  
                  {/* Sợi chỉ vàng / Gold progress line */}
                  <div className="relative w-full h-[1.5px] bg-[#3f4642]/10 overflow-hidden mb-4 rounded-full">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#b4975a] via-[#dfcfad] to-[#b4975a] transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  {/* Subtext */}
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-[#3f4642]/50 leading-relaxed">
                    Loading... {progress}%
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
