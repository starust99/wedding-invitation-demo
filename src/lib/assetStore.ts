type Listener = () => void;

export const AssetStore = {
  blobUrls: new Map<string, string>(),
  listeners: new Set<Listener>(),
  
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  
  get(src: string): string {
    return this.blobUrls.get(src) || src;
  },
  
  set(src: string, url: string) {
    this.blobUrls.set(src, url);
    this.listeners.forEach(l => l());
  }
};
