import Image from "next/image";
import type { WeddingConfig } from "@/lib/site-settings";

type MediaSectionKey = keyof WeddingConfig["appearance"]["mediaLayers"];
type MediaLayer = WeddingConfig["appearance"]["mediaLayers"]["hero"][number];

function MediaAsset({ layer, mobile = false }: { layer: MediaLayer; mobile?: boolean }) {
  const src = mobile ? layer.mobileSrc || layer.src : layer.src;
  const scale = mobile ? layer.scale.mobile : layer.scale.desktop;
  const objectPosition = mobile ? layer.objectPosition.mobile : layer.objectPosition.desktop;

  if (!src) return null;

  const className = [
    "absolute inset-0 h-full w-full object-cover",
    mobile ? "sm:hidden" : "hidden sm:block",
  ].join(" ");

  if (layer.type === "video") {
    return (
      <video
        src={src}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        className={className}
        style={{ opacity: layer.opacity, objectPosition, transform: `scale(${scale})` }}
        {...{
          "webkit-playsinline": "true",
          "x5-playsinline": "true",
          "x5-video-player-type": "h5",
          "x5-video-player-fullscreen": "false",
        } as any}
      />
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="100vw"
      className={className}
      style={{ opacity: layer.opacity, objectPosition, transform: `scale(${scale})` }}
      draggable={false}
      loading="lazy"
    />
  );
}

export function SectionMediaLayers({
  config,
  section,
  className = "",
}: {
  config: WeddingConfig;
  section: MediaSectionKey;
  className?: string;
}) {
  const layers = config.appearance.mediaLayers[section].filter((layer) => layer.src || layer.mobileSrc);

  if (layers.length === 0) return null;

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {layers.map((layer) => {
        const isSameSrc = !layer.mobileSrc || layer.mobileSrc === layer.src;
        return (
          <div key={layer.id} className="absolute inset-0">
            {isSameSrc ? (
              <MediaAsset layer={layer} />
            ) : (
              <>
                <MediaAsset layer={layer} />
                <MediaAsset layer={layer} mobile />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
