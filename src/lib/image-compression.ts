"use client";

const cloudinaryBrowserUploadLimitBytes = 10 * 1024 * 1024;
const cloudinaryBrowserUploadTargetBytes = 600 * 1024; // 600KB
const compressionThresholdBytes = 400 * 1024; // 400KB

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function getUploadMaxSide(section: string) {
  if (section.includes("gallery")) return 2600;
  return 2400;
}

function canBrowserCompressImage(file: File) {
  if (!file.type.startsWith("image/")) return false;
  return !["image/svg+xml", "image/gif"].includes(file.type);
}

function optimizedFileName(name: string) {
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "wedding-asset";

  return `${base}-optimized.jpg`;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("Không nén được ảnh bằng canvas."));
    }, "image/jpeg", quality);
  });
}

async function loadCanvasImageSource(file: File) {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap as CanvasImageSource,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Browser không đọc được ảnh để nén."));
    image.src = objectUrl;
  });

  return {
    source: image as CanvasImageSource,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => URL.revokeObjectURL(objectUrl),
  };
}

export async function prepareImageFileForUpload(file: File, section: string) {
  if (!canBrowserCompressImage(file)) {
    if (file.size <= cloudinaryBrowserUploadLimitBytes) {
      return { file, compressed: false, originalBytes: file.size, outputBytes: file.size };
    }
    throw new Error("File lớn hơn 10MB và format này không thể tự nén. Đổi sang JPG/WebP nhẹ hơn.");
  }

  if (file.size <= compressionThresholdBytes) {
    return { file, compressed: false, originalBytes: file.size, outputBytes: file.size };
  }

  let imageSource: Awaited<ReturnType<typeof loadCanvasImageSource>>;

  try {
    imageSource = await loadCanvasImageSource(file);
  } catch {
    throw new Error("Ảnh lớn hơn 10MB nhưng browser không đọc được để nén. Đổi sang JPG/WebP rồi upload lại.");
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    imageSource.close();
    throw new Error("Browser không hỗ trợ nén ảnh bằng canvas.");
  }

  let bestBlob: Blob | null = null;
  let maxSide = Math.min(getUploadMaxSide(section), Math.max(imageSource.width, imageSource.height));
  const qualities = [0.9, 0.86, 0.82, 0.78, 0.72, 0.66, 0.6];
  let attempted = false;

  try {
    while (maxSide >= 900 || !attempted) {
      attempted = true;
      const scale = Math.min(1, maxSide / Math.max(imageSource.width, imageSource.height));
      canvas.width = Math.max(1, Math.round(imageSource.width * scale));
      canvas.height = Math.max(1, Math.round(imageSource.height * scale));
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(imageSource.source, 0, 0, canvas.width, canvas.height);

      for (const quality of qualities) {
        const blob = await canvasToJpegBlob(canvas, quality);
        if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;

        if (blob.size <= cloudinaryBrowserUploadTargetBytes) {
          return {
            file: new File([blob], optimizedFileName(file.name), { type: "image/jpeg", lastModified: Date.now() }),
            compressed: true,
            originalBytes: file.size,
            outputBytes: blob.size,
          };
        }
      }

      maxSide = Math.floor(maxSide * 0.82);
    }
  } finally {
    imageSource.close();
    canvas.width = 1;
    canvas.height = 1;
  }

  if (bestBlob && bestBlob.size <= cloudinaryBrowserUploadLimitBytes) {
    return {
      file: new File([bestBlob], optimizedFileName(file.name), { type: "image/jpeg", lastModified: Date.now() }),
      compressed: true,
      originalBytes: file.size,
      outputBytes: bestBlob.size,
    };
  }

  throw new Error(`Đã thử nén ảnh nhưng vẫn còn ${formatFileSize(bestBlob?.size || file.size)}, vượt giới hạn 10MB. Đổi ảnh sang JPG/WebP nhẹ hơn.`);
}
