const bundledPublicAssetPrefixes = [
  "/assets/wedding/hero/reference/",
  "/floral-corner-",
  "/gallery-",
];

const bundledPublicAssetPaths = new Set([
  "/file.svg",
  "/globe.svg",
  "/hero-editorial-couple.svg",
  "/hero.svg",
  "/images/hero-bg.webp",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
]);

export function isBundledPublicAssetSrc(src?: string) {
  const value = src?.trim();
  if (!value) return false;

  return bundledPublicAssetPaths.has(value) || bundledPublicAssetPrefixes.some((prefix) => value.startsWith(prefix));
}

export function cleanBundledPublicAssetSrc(src?: string) {
  const value = src?.trim() ?? "";
  return isBundledPublicAssetSrc(value) ? "" : value;
}
