export type SplashViewport = "mobile" | "desktop-ipad" | "desktop";

export type WeightedWeddingAsset = {
  src: string;
  bytes: number;
};

// Every preload-critical URL carries an explicit version. The underlying
// artwork stays byte-for-byte identical; changing this value is the cache
// invalidation step whenever one of these assets is replaced.
export const WEDDING_ASSET_VERSION = "20260819-preload-v1";

export function weddingAsset(src: string) {
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${WEDDING_ASSET_VERSION}`;
}

export const WEDDING_AUDIO_BYTES = 2_788_729;
export const WEDDING_AUDIO_SRC = weddingAsset("/assets/audio/co-chut-ngot-ngao.mp3");
export const PRELOADER_LOGO_SRC = weddingAsset("/assets/preloader-logo.webp");
export const SPLASH_POSTER_MOBILE_SRC = weddingAsset("/assets/wedding/ui/splash-poster-mobile.jpg");
export const SPLASH_POSTER_DESKTOP_SRC = weddingAsset("/assets/wedding/ui/splash-closed.png");

export const DRESS_CODE_IMAGE_SRCS = [
  weddingAsset("/assets/dresscode-theme-v5.webp"),
  weddingAsset("/assets/dresscode-pink-v7.webp"),
  weddingAsset("/assets/dresscode-blue-v5.webp"),
  weddingAsset("/assets/dresscode-yellow-v5.webp"),
  weddingAsset("/assets/dresscode-green-v5.webp"),
  weddingAsset("/assets/dresscode-cream-v5.webp"),
  weddingAsset("/assets/dresscode-beige-v5.webp"),
  weddingAsset("/assets/dresscode-brown-v5.webp"),
] as const;

export const TIMELINE_FIRST_FRAME_SRC = weddingAsset("/assets/timeline-frames/frame_001.webp");
export const WEDDING_DEFERRED_ASSET_WARMUP_EVENT = "weddingDeferredAssetsWarmup";

const SPLASH_FRAME_TOTAL_BYTES: Record<SplashViewport, number> = {
  mobile: 5_703_184,
  "desktop-ipad": 4_296_628,
  desktop: 7_981_972,
};

export function getSplashFolder(viewport: SplashViewport) {
  if (viewport === "mobile") return "splash-frames-mobile";
  if (viewport === "desktop-ipad") return "splash-frames-desktop-ipad";
  return "splash-frames-desktop";
}

export function getSplashFrameSrc(viewport: SplashViewport, index: number) {
  const frameNumber = String(index).padStart(3, "0");
  return weddingAsset(`/assets/${getSplashFolder(viewport)}/frame_${frameNumber}.webp`);
}

export function getSplashFrameAssets(viewport: SplashViewport): WeightedWeddingAsset[] {
  const averageFrameBytes = SPLASH_FRAME_TOTAL_BYTES[viewport] / 109;
  return Array.from({ length: 109 }, (_, index) => ({
    src: getSplashFrameSrc(viewport, index + 1),
    bytes: averageFrameBytes,
  }));
}

export function getCriticalStaticAssets(viewport: SplashViewport): WeightedWeddingAsset[] {
  return [
    { src: PRELOADER_LOGO_SRC, bytes: 56_996 },
    viewport === "mobile"
      ? { src: SPLASH_POSTER_MOBILE_SRC, bytes: 745_165 }
      : { src: SPLASH_POSTER_DESKTOP_SRC, bytes: 945_932 },
    { src: weddingAsset("/assets/wedding/hero/hero-arch-composite.webp"), bytes: 119_330 },
    { src: weddingAsset("/assets/hero-names-logo-v9-centered.png"), bytes: 224_081 },
    { src: weddingAsset("/assets/music-icon.png"), bytes: 18_865 },
    { src: weddingAsset("/assets/hero-corner-left-v2.png"), bytes: 220_488 },
    { src: weddingAsset("/assets/hero-corner-right-v3.png"), bytes: 288_198 },
    { src: weddingAsset("/assets/icon-cross-new.png"), bytes: 157_748 },
    { src: weddingAsset("/assets/hero-invite-heading-v5.png"), bytes: 83_807 },
    { src: weddingAsset("/assets/hero-invite-reveal-map-v2.png"), bytes: 8_719 },
  ];
}
