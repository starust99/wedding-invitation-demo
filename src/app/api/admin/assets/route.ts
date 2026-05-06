import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

const defaultBucket = "wedding-assets";
const defaultCloudinaryFolder = "wedding-invitation-demo";
const defaultCloudinaryMaxAssetMb = 80;
const cloudinaryLargeUploadThreshold = 20 * 1024 * 1024;
const extensionMimeTypes: Record<string, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  ico: "image/x-icon",
  jfif: "image/jpeg",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
};
const allowedTypes = Array.from(new Set(Object.values(extensionMimeTypes)));
const allowedExtensions = Object.keys(extensionMimeTypes);
const bucketOptions = {
  public: true,
  fileSizeLimit: 20 * 1024 * 1024,
  allowedMimeTypes: allowedTypes,
};

function cleanFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96) || "asset";
}

function getExtension(name: string) {
  return name.toLowerCase().split(".").pop()?.trim() || "";
}

function resolveImageMimeType(file: File) {
  if (allowedTypes.includes(file.type)) return file.type;
  return extensionMimeTypes[getExtension(file.name)] ?? "";
}

function getAssetAltText(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

function getMaxCloudinaryUploadBytes() {
  const maxMb = Number(process.env.CLOUDINARY_MAX_ASSET_MB || defaultCloudinaryMaxAssetMb);
  return (Number.isFinite(maxMb) && maxMb > 0 ? maxMb : defaultCloudinaryMaxAssetMb) * 1024 * 1024;
}

function getCloudinaryCredentials() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    try {
      const parsed = new URL(cloudinaryUrl);
      return {
        cloudName: parsed.hostname,
        apiKey: decodeURIComponent(parsed.username),
        apiSecret: decodeURIComponent(parsed.password),
      };
    } catch {
      return null;
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function hasCloudinaryEnv() {
  return Boolean(getCloudinaryCredentials());
}

function configureCloudinary() {
  const credentials = getCloudinaryCredentials();
  if (!credentials) return false;

  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });

  return true;
}

function getCloudinaryDeliveryWidth(section: string) {
  if (section.includes("hero")) return 2400;
  if (section.includes("gallery")) return 1800;
  return 1600;
}

function getPublicIdBase(safeName: string) {
  return safeName.replace(/\.[^.]+$/, "").slice(0, 80) || "asset";
}

function getUploadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = record.message || record.error || record.error_description || record.description;
    const code = record.http_code || record.statusCode || record.status;
    const detail = typeof message === "string" ? message : JSON.stringify(record);
    return code ? `${detail} (Cloudinary status ${code})` : detail;
  }

  return "Cloudinary upload failed";
}

async function ensurePublicBucket(bucket: string) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.storage.getBucket(bucket);

  if (!error) {
    const { error: updateError } = await supabase.storage.updateBucket(bucket, bucketOptions);
    if (updateError) throw updateError;
    return supabase;
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, bucketOptions);

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw createError;
  }

  return supabase;
}

async function saveLocalAsset(file: File, section: string, mimeType: string, safeName: string) {
  const datePath = new Date().toISOString().slice(0, 10);
  const directory = path.join(process.cwd(), "public", "uploads", section, datePath);
  const fileName = `${crypto.randomUUID()}-${safeName}`;
  const diskPath = path.join(directory, fileName);

  await mkdir(directory, { recursive: true });
  await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));

  const publicPath = `/uploads/${section}/${datePath}/${fileName}`;

  return {
    src: publicPath,
    path: publicPath,
    bucket: "local-public",
    type: "image",
    mimeType,
    alt: getAssetAltText(file.name),
  };
}

function uploadCloudinaryStream(bytes: Buffer, options: UploadApiOptions) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
      if (error) {
        reject(error);
        return;
      }

      if (!uploadResult) {
        reject(new Error("Cloudinary upload did not return a result."));
        return;
      }

      resolve(uploadResult);
    });

    Readable.from(bytes).pipe(uploadStream);
  });
}

function uploadCloudinaryChunkedStream(bytes: Buffer, options: UploadApiOptions) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_chunked_stream(
      {
        ...options,
        chunk_size: 6 * 1024 * 1024,
      },
      (error, uploadResult) => {
        if (error) {
          reject(error);
          return;
        }

        if (!uploadResult) {
          reject(new Error("Cloudinary chunked upload did not return a result."));
          return;
        }

        if ("done" in uploadResult && uploadResult.done === false) return;
        resolve(uploadResult);
      },
    );

    Readable.from(bytes).pipe(uploadStream);
  });
}

async function uploadCloudinaryAsset(file: File, section: string, mimeType: string, safeName: string) {
  if (!configureCloudinary()) throw new Error("Cloudinary is not configured");

  const folderRoot = cleanFileName(process.env.CLOUDINARY_UPLOAD_FOLDER || defaultCloudinaryFolder);
  const folder = `${folderRoot}/${section}`;
  const datePrefix = new Date().toISOString().slice(0, 10);
  const publicId = `${datePrefix}-${getPublicIdBase(safeName)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadOptions: UploadApiOptions = {
    resource_type: "image",
    folder,
    public_id: publicId,
    unique_filename: true,
    overwrite: false,
    tags: [folderRoot, section],
    context: {
      alt: getAssetAltText(file.name),
      section,
    },
  };

  const result = file.size >= cloudinaryLargeUploadThreshold
    ? await uploadCloudinaryChunkedStream(bytes, uploadOptions)
    : await uploadCloudinaryStream(bytes, uploadOptions);

  const optimizedUrl = cloudinary.url(result.public_id, {
    secure: true,
    fetch_format: "auto",
    quality: "auto",
    width: getCloudinaryDeliveryWidth(section),
    crop: "limit",
  });

  return {
    src: optimizedUrl,
    originalSrc: result.secure_url,
    path: result.public_id,
    bucket: "cloudinary",
    provider: "cloudinary",
    type: "image",
    mimeType,
    alt: getAssetAltText(file.name),
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const cloudinaryReady = hasCloudinaryEnv();
  const fileSizeLimit = cloudinaryReady ? getMaxCloudinaryUploadBytes() : bucketOptions.fileSizeLimit;

  if (file.size > fileSizeLimit) {
    return NextResponse.json({ error: `File is larger than ${Math.round(fileSizeLimit / 1024 / 1024)}MB.` }, { status: 413 });
  }

  const mimeType = resolveImageMimeType(file);

  if (!mimeType) {
    return NextResponse.json({
      error: `Unsupported image type. Supported: ${allowedExtensions.join(", ")}`,
    }, { status: 415 });
  }

  const bucket = String(formData.get("bucket") || process.env.SUPABASE_ASSET_BUCKET || defaultBucket);
  const section = cleanFileName(String(formData.get("section") || "general"));
  const safeName = cleanFileName(file.name);

  if (cloudinaryReady) {
    try {
      const asset = await uploadCloudinaryAsset(file, section, mimeType, safeName);
      return NextResponse.json({ asset });
    } catch (error) {
      const message = getUploadErrorMessage(error);
      console.error("Cloudinary asset upload failed", { section, safeName, size: file.size, mimeType, message });
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!hasSupabaseEnv()) {
    const asset = await saveLocalAsset(file, section, mimeType, safeName);
    return NextResponse.json({ asset });
  }

  const path = `${section}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
  const supabase = await ensurePublicBucket(bucket);
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, bytes, {
    cacheControl: "31536000",
    contentType: mimeType,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({
    asset: {
      src: data.publicUrl,
      path,
      bucket,
      type: "image",
      mimeType,
      alt: getAssetAltText(file.name),
    },
  });
}
