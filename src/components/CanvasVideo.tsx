"use client";

import { useEffect, useRef, useState } from "react";

type CanvasVideoProps = {
  src?: string;
  poster?: string;
  isPlaying?: boolean;
  onEnded?: () => void;
  className?: string;
  objectFit?: "cover" | "contain";
  preload?: "auto" | "metadata" | "none";
};

export function CanvasVideo({ src, poster, isPlaying, onEnded, className = "", objectFit = "cover", preload = "auto" }: CanvasVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (isPlaying) {
      if (video.paused) {
        video.play().catch((err) => {
          if (err.name !== "AbortError") console.error("CanvasVideo play error:", err);
        });
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isPlaying, src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        onEnded={onEnded}
        onPlay={() => setHasStartedPlaying(true)}
        className="w-full h-full"
        style={{ objectFit }}
        preload={preload}
      />
    </div>
  );
}
