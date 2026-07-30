"use client";

/**
 * Enterprise Global In-Memory Decoded Image Cache
 * Prevents redundant HTTP fetches & GPU texture decoding across components.
 */
class GlobalImageCacheManager {
  private cache = new Map<string, HTMLImageElement>();
  private promises = new Map<string, Promise<HTMLImageElement>>();
  private requiredPromises = new Map<string, Promise<HTMLImageElement>>();

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

    const trackedPromise = promise.finally(() => {
      this.promises.delete(src);
    });
    this.promises.set(src, trackedPromise);
    return trackedPromise;
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

  /**
   * Loads an image that must be present before an interaction is enabled.
   * Unlike preload(), this rejects after the final retry instead of treating a
   * failed request as loaded.
   */
  public preloadRequired(src: string, retries = 2): Promise<HTMLImageElement> {
    const cached = this.cache.get(src);
    if (cached?.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }

    const pending = this.requiredPromises.get(src);
    if (pending) return pending;

    const loadAttempt = (attempt: number): Promise<HTMLImageElement> =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";

        const finish = () => {
          if (img.naturalWidth <= 0) {
            reject(new Error(`Image decoded without dimensions: ${src}`));
            return;
          }
          this.cache.set(src, img);
          resolve(img);
        };

        img.onload = () => {
          if (typeof img.decode === "function") {
            img.decode().then(finish).catch(finish);
          } else {
            finish();
          }
        };
        img.onerror = () => reject(new Error(`Unable to load image: ${src}`));

        const separator = src.includes("?") ? "&" : "?";
        img.src = attempt === 0 ? src : `${src}${separator}wedding_retry=${attempt}`;
      }).catch((error) => {
        if (attempt >= retries) throw error;
        return new Promise<HTMLImageElement>((resolve, reject) => {
          window.setTimeout(() => {
            loadAttempt(attempt + 1).then(resolve, reject);
          }, 250 * (attempt + 1));
        });
      });

    const promise = loadAttempt(0).finally(() => {
      this.requiredPromises.delete(src);
    });
    this.requiredPromises.set(src, promise);
    return promise;
  }

  public async preloadRequiredBatch(
    urls: string[],
    onProgress?: (loaded: number, total: number, percent: number) => void,
    concurrency = 10,
  ): Promise<HTMLImageElement[]> {
    if (urls.length === 0) return [];

    const results = new Array<HTMLImageElement>(urls.length);
    let nextIndex = 0;
    let loaded = 0;

    const worker = async () => {
      while (nextIndex < urls.length) {
        const currentIndex = nextIndex++;
        results[currentIndex] = await this.preloadRequired(urls[currentIndex]);
        loaded++;
        onProgress?.(
          loaded,
          urls.length,
          Math.min(100, Math.round((loaded / urls.length) * 100)),
        );
      }
    };

    const workerCount = Math.min(Math.max(1, concurrency), urls.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
  }

  public evictPrefix(prefix: string) {
    for (const src of this.cache.keys()) {
      if (src.startsWith(prefix)) this.cache.delete(src);
    }
    for (const src of this.promises.keys()) {
      if (src.startsWith(prefix)) this.promises.delete(src);
    }
    for (const src of this.requiredPromises.keys()) {
      if (src.startsWith(prefix)) this.requiredPromises.delete(src);
    }
  }
}

export const GlobalImageCache = new GlobalImageCacheManager();
