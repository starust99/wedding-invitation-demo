import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const expectedAssets = [
  "/assets/dresscode-theme-v5.webp",
  "/assets/dresscode-pink-v6.webp",
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
    splashSource.includes(`"${publicPath}"`),
    `${publicPath} is missing from the blocking invitation preload phase.`,
  );
  assert(
    !splashSource.includes(`${publicPath}?`),
    `${publicPath} must use the same cache key in preload and render paths.`,
  );
}

assert(
  totalBytes <= maxTotalBytes,
  `Dress-code preload set exceeds 2.7 MiB (${totalBytes} bytes).`,
);
assert(
  splashSource.includes("...dressCodeImages") &&
    splashSource.includes("GlobalImageCache.preloadRequiredBatch"),
  "Dress-code images must stay inside the required splash preload batch.",
);
assert(
  sectionSource.includes("unoptimized"),
  "Dress-code rendering must reuse the exact preloaded URL instead of a transformed Next.js URL.",
);
assert(
  sectionSource.includes('"/assets/dresscode-theme-v5.webp"'),
  "Dress-code master image is missing from the rendered section.",
);

for (const publicPath of expectedAssets.slice(1)) {
  assert(
    sectionSource.includes(`"${publicPath}"`),
    `${publicPath} is missing from the interactive dress-code palette.`,
  );
}

assert(
  detailsSource.includes('dressCodeImageSrc: "/assets/dresscode-theme-v5.webp"'),
  "Wedding details must expose the approved v5 master illustration.",
);

console.log(
  `Dress-code assets passed: ${expectedAssets.length} WebP files, ` +
    `${(totalBytes / 1024 / 1024).toFixed(2)} MiB total, all 1086x1448 and in the blocking preload batch.`,
);
