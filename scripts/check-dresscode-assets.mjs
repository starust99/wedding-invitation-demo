import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const expectedAssets = [
  "/assets/dresscode-theme-v5.webp",
  "/assets/dresscode-pink-v7.webp",
  "/assets/dresscode-blue-v5.webp",
  "/assets/dresscode-yellow-v5.webp",
  "/assets/dresscode-green-v5.webp",
  "/assets/dresscode-cream-v5.webp",
  "/assets/dresscode-beige-v5.webp",
  "/assets/dresscode-brown-v5.webp",
];

const maxAssetBytes = 400 * 1024;
const maxTotalBytes = Math.round(2.7 * 1024 * 1024);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const splashSource = await readFile(
  path.join(root, "src/components/WeddingSplashIntro.tsx"),
  "utf8",
);
const preloadSource = await readFile(
  path.join(root, "src/lib/wedding-preload-assets.ts"),
  "utf8",
);
const sectionSource = await readFile(
  path.join(root, "src/components/wedding/DressCodeSection.tsx"),
  "utf8",
);
const detailsSource = await readFile(
  path.join(root, "src/components/WeddingDetailsSection.tsx"),
  "utf8",
);

let totalBytes = 0;

for (const publicPath of expectedAssets) {
  const diskPath = path.join(root, "public", publicPath.replace(/^\//, ""));
  const [fileStat, metadata] = await Promise.all([
    stat(diskPath),
    sharp(diskPath).metadata(),
  ]);

  totalBytes += fileStat.size;
  assert(metadata.format === "webp", `${publicPath} must remain WebP.`);
  assert(
    metadata.width === 1086 && metadata.height === 1448,
    `${publicPath} must remain 1086x1448; got ${metadata.width}x${metadata.height}.`,
  );
  assert(
    fileStat.size <= maxAssetBytes,
    `${publicPath} exceeds the 400 KiB preload budget (${fileStat.size} bytes).`,
  );
  assert(
    preloadSource.includes(`"${publicPath}"`),
    `${publicPath} is missing from the deferred wedding asset manifest.`,
  );
}

assert(
  totalBytes <= maxTotalBytes,
  `Dress-code preload set exceeds 2.7 MiB (${totalBytes} bytes).`,
);
assert(
  !splashSource.includes("DRESS_CODE_IMAGE_SRCS"),
  "Dress-code images must not block the critical envelope preload lane.",
);
assert(
  sectionSource.includes("unoptimized"),
  "Dress-code rendering must reuse the exact preloaded URL instead of a transformed Next.js URL.",
);
assert(
  sectionSource.includes("DRESS_CODE_IMAGE_SRCS") &&
    sectionSource.includes("WEDDING_DEFERRED_ASSET_WARMUP_EVENT") &&
    sectionSource.includes('"low"'),
  "Dress-code images must warm in the low-priority post-gate lane.",
);

assert(
  detailsSource.includes('dressCodeImageSrc: "/assets/dresscode-theme-v5.webp"'),
  "Wedding details must expose the approved v5 master illustration.",
);

console.log(
  `Dress-code assets passed: ${expectedAssets.length} WebP files, ` +
    `${(totalBytes / 1024 / 1024).toFixed(2)} MiB total, all 1086x1448 and in the deferred preload lane.`,
);
