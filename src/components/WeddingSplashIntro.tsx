"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SplashSequencePlayer } from "./SplashSequencePlayer";
import { GlobalImageCache } from "@/lib/global-image-cache";
import type { GuestIdentity } from "@/lib/guest-personalization";
import type { WeddingConfig } from "@/lib/site-settings";
import {
  PRELOADER_LOGO_SRC,
  SPLASH_POSTER_DESKTOP_SRC,
  SPLASH_POSTER_MOBILE_SRC,
  WEDDING_AUDIO_BYTES,
  WEDDING_AUDIO_SRC,
  WEDDING_DEFERRED_ASSET_WARMUP_EVENT,
  getCriticalStaticAssets,
  getSplashFolder,
  getSplashFrameAssets,
  type SplashViewport,
} from "@/lib/wedding-preload-assets";

type SplashStatus = "checking" | "closed" | "opening" | "hidden";

function isTabletDevice() {
  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const touchPoints = window.navigator.maxTouchPoints || 0;
  const screenShortEdge = Math.min(window.screen.width, window.screen.height);

  const isIPad =
    /iPad/i.test(userAgent) ||
    (platform === "MacIntel" && touchPoints > 1);
  const isAndroidTablet =
    /Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
  const isNamedTablet = /Tablet|PlayBook|Silk/i.test(userAgent);
  const isTabletSizedTouchDevice =
    touchPoints > 1 &&
    screenShortEdge >= 600 &&
    screenShortEdge <= 1024;

  return isIPad || isAndroidTablet || isNamedTablet || isTabletSizedTouchDevice;
}

function getSplashViewport(): SplashViewport {
  const viewportWidth = window.visualViewport?.width || window.innerWidth;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  if (isTabletDevice()) {
    return viewportHeight > viewportWidth ? "mobile" : "desktop-ipad";
  }
  if (viewportWidth < 768) return "mobile";
  if (viewportWidth <= 1024) return "desktop-ipad";
  return "desktop";
}

async function preloadWeddingAudio(
  onProgress?: (loadedBytes: number, totalBytes: number) => void,
) {
  const audio = document.querySelector<HTMLAudioElement>("#wedding-audio");
  if (!audio) throw new Error("Wedding audio element is unavailable");

  if (audio.dataset.preloadedBlob === "1" && audio.src.startsWith("blob:")) {
    return;
  }

  const controller = new AbortController();
  // On a genuinely slow shared connection the audio competes with more than
  // one hundred splash frames. Thirty seconds caused a false failure even
  // though the request was still progressing.
  const timeout = window.setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(WEDDING_AUDIO_SRC, {
      cache: "force-cache",
      signal: controller.signal,
      priority: "high",
    } as RequestInit & { priority: "high" });
    if (!response.ok) {
      throw new Error(`Wedding music request failed with ${response.status}`);
    }

    // Reading the complete response avoids relying on canplaythrough. Several
    // embedded WebViews intentionally postpone media buffering until a gesture.
    // Consume the stream ourselves so the visible percentage continues moving
    // while this relatively large file is crossing a slow connection.
    const announcedBytes = Number(response.headers.get("content-length")) || WEDDING_AUDIO_BYTES;
    const reader = response.body?.getReader();
    let audioBlob: Blob;

    if (reader) {
      const chunks: BlobPart[] = [];
      let loadedBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          const stableChunk = value.slice();
          chunks.push(stableChunk.buffer);
          loadedBytes += stableChunk.byteLength;
          onProgress?.(loadedBytes, announcedBytes);
        }
      }
      audioBlob = new Blob(chunks, {
        type: response.headers.get("content-type") || "audio/mpeg",
      });
    } else {
      audioBlob = await response.blob();
    }

    if (audioBlob.size === 0) {
      throw new Error("Wedding music response is empty");
    }
    onProgress?.(audioBlob.size, announcedBytes);

    const blobUrl = URL.createObjectURL(audioBlob);
    const previousBlobUrl = audio.dataset.preloadedBlobUrl;
    if (previousBlobUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previousBlobUrl);
    }

    audio.src = blobUrl;
    audio.dataset.preloadedBlob = "1";
    audio.dataset.preloadedBlobUrl = blobUrl;
    audio.load();
  } finally {
    window.clearTimeout(timeout);
  }
}

function readForceIntro(storageKey?: string) {
  if (typeof window === "undefined") return false;
  try {
    const search = window.location.search || "";
    const href = window.location.href || "";
    const hash = window.location.hash || "";

    if (search.includes("view=main") || search.includes("from=rsvp") || search.includes("skip_intro=1") || hash.includes("thank-you") || hash.includes("rsvp")) {
      return false;
    }

    if (search.includes("intro=1") || href.includes("intro=1")) return true;

    const key = storageKey || "public";
    if (window.sessionStorage.getItem(`wedding-splash-seen:${key}`) === "1") {
      return false;
    }

    const pathname = window.location.pathname || "";
    const guestPathMatch = pathname.match(/^\/(?:g|i|m|t|w)\/([^/?#]+)/);
    if (guestPathMatch) {
      const token = guestPathMatch[1];
      if (token && window.sessionStorage.getItem(`wedding-splash-seen:${token}`) === "1") {
        return false;
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function markSplashSeen(key: string) {
  try {
    window.localStorage.setItem(key, "1");
    const cleanKey = key.replace(/^wedding-splash:/, "");
    window.sessionStorage.setItem(`wedding-splash-seen:${cleanKey}`, "1");
  } catch {}
}

function getRuntimeClass() {
  const userAgent = window.navigator.userAgent || "";
  if (/FBAN|FBAV|Messenger|Zalo|Instagram|Line\//i.test(userAgent)) return "embedded-webview";
  if (/AppleWebKit/i.test(userAgent) && !/Chrome|Chromium|CriOS|Edg|OPR/i.test(userAgent)) return "webkit";
  if (/Chrome|Chromium|CriOS|Edg|OPR/i.test(userAgent)) return "chromium";
  return "other";
}

function shouldReportPreloadMetric() {
  try {
    if (new URLSearchParams(window.location.search).get("preload_metrics") === "1") return true;
    const storageKey = "wedding-preload-metric-sampled";
    const saved = window.sessionStorage.getItem(storageKey);
    if (saved) return saved === "1";
    const sampled = window.crypto.getRandomValues(new Uint32Array(1))[0] % 5 === 0;
    window.sessionStorage.setItem(storageKey, sampled ? "1" : "0");
    return sampled;
  } catch {
    return false;
  }
}

function reportPreloadMetric(payload: {
  viewport: SplashViewport;
  preloadDurationMs: number;
  firstProgressMs: number;
  criticalBytes: number;
}) {
  if (!shouldReportPreloadMetric()) return;
  const body = JSON.stringify({ ...payload, runtimeClass: getRuntimeClass() });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/preload-metrics", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/preload-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
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
    const shouldForce = readForceIntro(storageKey);
    if (shouldForce) return "closed";
    if (hasSeenSplash(sessionKey)) return "hidden";
    return "closed";
  });
  const [preloading, setPreloading] = useState(() => status !== "hidden");
  const [progress, setProgress] = useState(0);
  const [preloadError, setPreloadError] = useState(false);
  const [preloadAttempt, setPreloadAttempt] = useState(0);
  const [isImmediateClose, setIsImmediateClose] = useState(false);
  const [viewport, setViewport] = useState<SplashViewport | null>(null);
  const closeTimer = useRef<number | null>(null);
  const cacheReleaseTimer = useRef<number | null>(null);
  const openingStarted = useRef(false);
  const closingStarted = useRef(false);
  const preloadStartedAt = useRef<number | null>(null);
  const firstProgressAt = useRef<number | null>(null);
  const preloadMetricReported = useRef(false);

  useEffect(() => {
    setViewport(getSplashViewport());
  }, []);

  if (typeof window !== "undefined" && readForceIntro()) {
    document.documentElement.classList.remove("splash-skipped");
  }

  const isVisible = status !== "hidden";

  useEffect(() => {
    if (!isVisible) return;
    document.documentElement.classList.add("splash-active");
    return () => {
      document.documentElement.classList.remove("splash-active");
    };
  }, [isVisible]);

  const readyRef = useRef(ready);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    if (!viewport) return;

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
      window.dispatchEvent(new Event("weddingTimelineWarmup"));
      window.dispatchEvent(new Event("weddingTimelineDecode"));
      window.dispatchEvent(new Event(WEDDING_DEFERRED_ASSET_WARMUP_EVENT));
      return;
    }

    const activeViewport = viewport;
    // Only artwork visible before or immediately after the envelope animation
    // belongs to the blocking lane. Dress-code variants and timeline frames
    // keep their exact files, but warm in the 6.4-second opening window.
    const staticAssets = getCriticalStaticAssets(activeViewport);
    const splashFrameAssets = getSplashFrameAssets(activeViewport);
    const allAssetsToLoad = [
      ...staticAssets.slice(0, 2),
      ...splashFrameAssets.slice(0, 12),
      ...staticAssets.slice(2),
      ...splashFrameAssets.slice(12),
    ];
    const allImagesToLoad = allAssetsToLoad.map((asset) => asset.src);
    const imageWeights = new Map(allAssetsToLoad.map((asset) => [asset.src, asset.bytes]));

    let isCancelled = false;
    let checkReadyInterval: NodeJS.Timeout | null = null;

    const onAllComplete = () => {
      if (!isCancelled) {
        window.dispatchEvent(new Event("weddingTimelineWarmup"));
        window.dispatchEvent(new Event(WEDDING_DEFERRED_ASSET_WARMUP_EVENT));
        checkReadyInterval = setInterval(() => {
          if (readyRef.current && !isCancelled) {
            if (checkReadyInterval) clearInterval(checkReadyInterval);
            setTimeout(() => {
              if (!isCancelled) {
                const finishedAt = performance.now();
                const startedAt = preloadStartedAt.current || finishedAt;
                const firstProgress = firstProgressAt.current || finishedAt;
                const metric = {
                  viewport: activeViewport,
                  preloadDurationMs: Math.max(0, finishedAt - startedAt),
                  firstProgressMs: Math.max(0, firstProgress - startedAt),
                  criticalBytes: Math.round(totalBytes),
                };
                window.dispatchEvent(new CustomEvent("weddingPreloadReady", { detail: metric }));
                if (!preloadMetricReported.current) {
                  preloadMetricReported.current = true;
                  reportPreloadMetric(metric);
                }
                setPreloading(false);
                setStatus("closed");
              }
            }, 150);
          }
        }, 50);
      }
    };

    setPreloading(true);
    setPreloadError(false);
    setProgress(0);
    preloadStartedAt.current = performance.now();
    firstProgressAt.current = null;
    preloadMetricReported.current = false;

    const totalBytes = allAssetsToLoad.reduce((sum, asset) => sum + asset.bytes, 0) + WEDDING_AUDIO_BYTES;
    let loadedImageBytes = 0;
    let loadedAudioBytes = 0;
    const completedImages = new Set<string>();
    const updateProgress = () => {
      if (isCancelled) return;
      const loadedBytes = loadedImageBytes + Math.min(WEDDING_AUDIO_BYTES, loadedAudioBytes);
      const nextProgress = Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
      if (loadedBytes > 0 && firstProgressAt.current === null) {
        firstProgressAt.current = performance.now();
      }
      setProgress(loadedBytes > 0 ? Math.max(1, nextProgress) : 0);
    };

    const imagePromise = GlobalImageCache.preloadRequiredBatch(
      allImagesToLoad,
      (_loadedCount, _total, _percent, src) => {
        if (!completedImages.has(src)) {
          completedImages.add(src);
          loadedImageBytes += imageWeights.get(src) || 0;
        }
        updateProgress();
      },
      10,
      "high",
    );
    const audioPromise = preloadWeddingAudio((loadedBytes) => {
      loadedAudioBytes = loadedBytes;
      updateProgress();
    }).then(() => {
      loadedAudioBytes = WEDDING_AUDIO_BYTES;
      updateProgress();
    });

    Promise.all([imagePromise, audioPromise])
      .then(onAllComplete)
      .catch(() => {
        if (!isCancelled) setPreloadError(true);
      });

    return () => {
      isCancelled = true;
      if (checkReadyInterval) clearInterval(checkReadyInterval);
    };
  }, [preloadAttempt, sessionKey, viewport]);

  const closeIntro = useCallback(() => {
    if (closingStarted.current) return;
    closingStarted.current = true;
    markSplashSeen(sessionKey);
    setStatus("hidden");
  }, [sessionKey]);

  const openIntro = useCallback(() => {
    if (!ready || preloading || preloadError || status === "opening" || openingStarted.current) return;
    openingStarted.current = true;
    setPreloading(false);
    setStatus("opening");
    window.dispatchEvent(new Event("playWeddingMusic"));
    window.dispatchEvent(new Event("unlockVideos"));
    window.dispatchEvent(new Event("weddingTimelineWarmup"));
    window.dispatchEvent(new Event(WEDDING_DEFERRED_ASSET_WARMUP_EVENT));
    
    // Play full splash animation for exact 6.0 seconds, then transition cleanly into hero
    closeTimer.current = window.setTimeout(closeIntro, 6400);
  }, [closeIntro, preloadError, preloading, ready, status]);

  useEffect(() => {
    if (preloading || isVisible) {
      document.documentElement.classList.add("splash-active");
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const preventTouch = (e: TouchEvent) => {
        if (e.cancelable) {
          e.preventDefault();
        }
      };

      const preventWheel = (e: WheelEvent) => {
        if (e.cancelable) {
          e.preventDefault();
        }
      };

      const preventScrollKeys = (e: KeyboardEvent) => {
        if (["Space", "ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(e.code)) {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      };

      window.addEventListener("touchmove", preventTouch, { passive: false });
      window.addEventListener("wheel", preventWheel, { passive: false });
      window.addEventListener("keydown", preventScrollKeys, { passive: false });

      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("touchmove", preventTouch);
        window.removeEventListener("wheel", preventWheel);
        window.removeEventListener("keydown", preventScrollKeys);
      };
    }
  }, [preloading, isVisible]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (cacheReleaseTimer.current) window.clearTimeout(cacheReleaseTimer.current);
  }, []);

  const opening = status === "opening";

  return (
    <AnimatePresence
      onExitComplete={() => {
        markSplashSeen(sessionKey);
        document.documentElement.classList.remove("splash-active");
        // The hero starts only after the splash has completely left the
        // viewport, so the names-logo reveal is never hidden underneath it.
        window.dispatchEvent(new Event("introFinished"));
        document.documentElement.classList.add("splash-skipped");
        window.dispatchEvent(new Event("weddingTimelineDecode"));

        if (viewport) {
          const splashFolder = getSplashFolder(viewport);
          cacheReleaseTimer.current = window.setTimeout(() => {
            GlobalImageCache.evictPrefix(`/assets/${splashFolder}/`);
          }, 100);
        }
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
          exit={{ opacity: 0, scale: 1.012 }}
          transition={{ duration: isImmediateClose ? 0 : 1.2, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Portrait tablets use mobile artwork; landscape tablets use desktop-iPad artwork. */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            {status === "opening" ? (
              viewport ? (
                <SplashSequencePlayer
                  variant={viewport}
                  isPlaying={status === "opening"}
                  onEnded={closeIntro}
                  className={`h-full w-full object-cover ${
                    viewport === "mobile" ? "scale-[1.08]" : ""
                  }`}
                />
              ) : null
            ) : (
              viewport === null ? (
                <picture className="h-full w-full">
                  <source
                    media="(max-width: 767px), (min-width: 768px) and (max-width: 1024px) and (orientation: portrait)"
                    srcSet={SPLASH_POSTER_MOBILE_SRC}
                  />
                  <img
                    src={SPLASH_POSTER_DESKTOP_SRC}
                    alt=""
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                </picture>
              ) : viewport !== "mobile" ? (
                <img 
                  src={SPLASH_POSTER_DESKTOP_SRC}
                  alt=""
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img 
                  src={SPLASH_POSTER_MOBILE_SRC}
                  alt=""
                  fetchPriority="high"
                  className="h-full w-full object-cover scale-[1.08]"
                />
              )
            )}
          </div>

          {/* CLICKABLE OVERLAY */}
          {!preloading && (
            <motion.button
              type="button"
              aria-label="Chạm để mở thiệp cưới"
              disabled={opening}
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
            </motion.button>
          )}

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
                      src={PRELOADER_LOGO_SRC}
                      alt="Nhật & Phương Logo" 
                      fetchPriority="high"
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
                  {preloadError ? (
                    <button
                      type="button"
                      onClick={() => setPreloadAttempt((attempt) => attempt + 1)}
                      className="min-h-11 rounded-full border border-[#b4975a]/40 bg-[#FDFBF7] px-5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#715c43]"
                    >
                      Tải lại thiệp
                    </button>
                  ) : (
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-[#3f4642]/50 leading-relaxed">
                      Đang chuẩn bị... {progress}%
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
