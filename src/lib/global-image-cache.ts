"use client";

/**
 * Enterprise Global In-Memory Decoded Image Cache
 * Prevents redundant HTTP fetches & GPU texture decoding across components.
 */
class GlobalImageCacheManager {
  private cache = new Map<string, HTMLImageElement>();
  private promises = new Map<string, Promise<HTMLImageElement>>();

  public get(src: string): HTMLImageElement | undefined {
    return this.cache.get(src);
  }

  public preload(src: string): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src)!);
    }
    if (this.promises.has(src)) {
      return this.promises.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.src = src;

      const finish = () => {
        this.cache.set(src, img);
        resolve(img);
      };

      if (img.complete && img.naturalWidth > 0) {
        if (typeof img.decode === "function") {
          img.decode().then(finish).catch(finish);
        } else {
          finish();
        }
      } else {
        img.onload = () => {
          if (typeof img.decode === "function") {
            img.decode().then(finish).catch(finish);
          } else {
            finish();
          }
        };
        img.onerror = () => {
          // Resolve even on error so preloader is never stuck
          finish();
        };
      }
    });

    this.promises.set(src, promise);
    return promise;
  }

  public preloadBatch(
    urls: string[],
    onProgress?: (loaded: number, total: number, percent: number) => void
  ): Promise<HTMLImageElement[]> {
    const total = urls.length;
    if (total === 0) return Promise.resolve([]);

    let loaded = 0;
    return Promise.all(
      urls.map((url) =>
        this.preload(url).then((img) => {
          loaded++;
          if (onProgress) {
            const percent = Math.min(100, Math.round((loaded / total) * 100));
            onProgress(loaded, total, percent);
          }
          return img;
        })
      )
    );
  }
}

export const GlobalImageCache = new GlobalImageCacheManager();
