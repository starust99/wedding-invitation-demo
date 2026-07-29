"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SplashSequencePlayer } from "./SplashSequencePlayer";
import { GlobalImageCache } from "@/lib/global-image-cache";
import type { GuestIdentity } from "@/lib/guest-personalization";
import type { WeddingConfig } from "@/lib/site-settings";
import { CanvasVideo } from "./CanvasVideo";

type SplashStatus = "checking" | "closed" | "opening" | "hidden";

function readForceIntro() {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("intro") === "1" || window.location.href.includes("intro=1");
  } catch {
    return false;
  }
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
  const sessionKey = `wedding-splash:${storageKey}`;

  const [status, setStatus] = useState<SplashStatus>(() => {
    if (typeof window === "undefined") return "checking";
    const shouldForce = readForceIntro();
    if (shouldForce) return "closed";
    if (hasSeenSplash(sessionKey)) return "hidden";
    return "closed";
  });
  const [preloading, setPreloading] = useState(() => status !== "hidden");
  const [progress, setProgress] = useState(0);
  const [isImmediateClose, setIsImmediateClose] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile" | null>(null);
  const closeTimer = useRef<number | null>(null);
  const animDispatchTimer = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setViewport(mediaQuery.matches ? "mobile" : "desktop");
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  if (typeof window !== "undefined" && readForceIntro()) {
    document.documentElement.classList.remove("splash-skipped");
  }

  const isVisible = status !== "hidden";

  const readyRef = useRef(ready);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    const shouldForce = readForceIntro();
    if (shouldForce) {
      document.documentElement.classList.remove("splash-skipped");
    }
    const isHidden = hasSeenSplash(sessionKey) && !shouldForce;
    if (isHidden) {
      document.documentElement.classList.add("splash-skipped");
      setIsImmediateClose(true);
      setPreloading(false);
      setStatus("hidden");
      return;
    }

    const isMobile = window.innerWidth < 768;
    const splashFolder = isMobile ? "splash-frames-mobile" : "splash-frames-desktop";

    // 1. Critical static images
    const staticImages = [
      "/assets/preloader-logo.webp",
      "/assets/wedding/ui/splash-closed.png",
      "/assets/wedding/ui/splash-poster-mobile.jpg",
      "/assets/wedding/hero/hero-arch-composite.webp",
      "/assets/hero-names-logo-v9-centered.png",
      "/assets/music-icon.png",
      "/assets/hero-corner-left-v2.png",
      "/assets/hero-corner-right-v3.png",
      "/assets/icon-cross-new.png",
      "/assets/hero-invite-heading-v5.png",
    ];

    // 2. All 109 Splash sequence frames for current device
    const splashFrames: string[] = [];
    for (let i = 1; i <= 109; i++) {
      const numStr = String(i).padStart(3, "0");
      splashFrames.push(`/assets/${splashFolder}/frame_${numStr}.webp`);
    }

    // 3. All 108 Timeline Road sequence frames
    const roadFrames: string[] = [];
    for (let i = 1; i <= 108; i++) {
      const numStr = String(i).padStart(3, "0");
      roadFrames.push(`/assets/timeline-frames/frame_${numStr}.webp`);
    }

    const allImagesToLoad = [...staticImages, ...splashFrames, ...roadFrames];
    const mediaToLoad = ["/assets/audio/co-chut-ngot-ngao.mp3"];

    let isCancelled = false;
    let checkReadyInterval: NodeJS.Timeout | null = null;

    // Safe fallback limit for slow connections
    const maxPreloadTimer = setTimeout(() => {
      if (!isCancelled) {
        setPreloading(false);
        setStatus("closed");
      }
    }, 20000);

    const onAllComplete = () => {
      if (!isCancelled) {
        clearTimeout(maxPreloadTimer);
        checkReadyInterval = setInterval(() => {
          if (readyRef.current && !isCancelled) {
            if (checkReadyInterval) clearInterval(checkReadyInterval);
            setTimeout(() => {
              if (!isCancelled) {
                setPreloading(false);
                setStatus("closed");
              }
            }, 150);
          }
        }, 50);
      }
    };

    // Preload & decode ALL 227 image assets into GPU memory with true percentage tracking
    let totalLoadedCount = 0;
    const totalAssets = allImagesToLoad.length + mediaToLoad.length;

    GlobalImageCache.preloadBatch(allImagesToLoad, (loadedCount) => {
      if (!isCancelled) {
        totalLoadedCount = loadedCount;
        const percent = Math.min(100, Math.round((totalLoadedCount / totalAssets) * 100));
        setProgress(percent);
      }
    }).then(() => {
      // Audio preloading
      Promise.all(
        mediaToLoad.map((src) =>
          fetch(src)
            .then(() => {
              totalLoadedCount++;
              if (!isCancelled) {
                const percent = Math.min(100, Math.round((totalLoadedCount / totalAssets) * 100));
                setProgress(percent);
              }
            })
            .catch(() => {})
        )
      ).then(onAllComplete);
    });

    return () => {
      isCancelled = true;
      clearTimeout(maxPreloadTimer);
      if (checkReadyInterval) clearInterval(checkReadyInterval);
    };
  }, [sessionKey]);

  const closeIntro = useCallback(() => {
    setStatus("hidden");
    // Dispatch introFinished at 600ms so hero animations begin right as splash becomes translucent
    animDispatchTimer.current = window.setTimeout(() => {
      window.dispatchEvent(new Event("introFinished"));
    }, 600);
  }, []);

  const openIntro = useCallback(() => {
    if (!ready || status === "opening") return;
    setPreloading(false);
    setStatus("opening");
    window.dispatchEvent(new Event("playWeddingMusic"));
    window.dispatchEvent(new Event("unlockVideos"));
    
    // Play full splash animation for exact 6.0 seconds, then transition cleanly into hero
    closeTimer.current = window.setTimeout(closeIntro, 6000);
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
    if (animDispatchTimer.current) window.clearTimeout(animDispatchTimer.current);
  }, []);

  const opening = status === "opening";

  return (
    <AnimatePresence
      onExitComplete={() => {
        markSplashSeen(sessionKey);
        document.documentElement.classList.add("splash-skipped");
      }}
    >
      {isVisible ? (
        <motion.div
          key="wedding-splash"
          role="dialog"
          aria-modal="true"
          aria-label="Mở thiệp cưới"
          id="wedding-splash-screen"
          onClick={openIntro}
          className="fixed inset-0 z-[80] grid min-h-dvh place-items-center overflow-hidden bg-[#FBF8F1] text-ink cursor-pointer"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(6px)" }}
          transition={{ duration: isImmediateClose ? 0 : 1.2, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* THE SPLASH ANIMATION - 60FPS Canvas Frame Sequence Player (Zero RAM Lag / No Zalo Bypass) */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            {status === "opening" ? (
              <>
                {/* Desktop Splash Sequence Canvas Player */}
                <SplashSequencePlayer
                  variant="desktop"
                  isPlaying={status === "opening"}
                  onEnded={closeIntro}
                  className="hidden md:block h-full w-full object-cover scale-[1.08] md:scale-100"
                />
                {/* Mobile Splash Sequence Canvas Player */}
                <SplashSequencePlayer
                  variant="mobile"
                  isPlaying={status === "opening"}
                  onEnded={closeIntro}
                  className="block md:hidden h-full w-full object-cover scale-[1.08]"
                />
              </>
            ) : (
              <>
                {/* Desktop Poster */}
                <img 
                  src="/assets/wedding/ui/splash-closed.png"
                  alt=""
                  className="hidden md:block h-full w-full object-cover scale-[1.08] md:scale-100"
                />
                {/* Mobile Poster */}
                <img 
                  src="/assets/wedding/ui/splash-poster-mobile.jpg"
                  alt=""
                  className="block md:hidden h-full w-full object-cover scale-[1.08]"
                />
              </>
            )}
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
              transition={{ delay: 0, duration: 0.4 }}
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
                onClick={openIntro}
                className="absolute inset-0 w-full h-full z-[999999] cursor-pointer flex flex-col items-center justify-center bg-[#FDFBF7] text-[#3f4642] select-none"
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
