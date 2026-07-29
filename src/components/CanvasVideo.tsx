"use client";

import React, { useEffect, useRef } from "react";

type CanvasVideoProps = {
  src?: string;
  poster?: string;
  isPlaying?: boolean; // If provided, controls play/pause manually
  autoPlay?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  className?: string;
  style?: React.CSSProperties;
  videoStyle?: React.CSSProperties;
  canvasStyle?: React.CSSProperties;
  objectFit?: "cover" | "contain";
  preload?: "auto" | "metadata" | "none";
  children?: React.ReactNode; // To support multiple <source> tags
};

export function CanvasVideo({
  src,
  poster,
  isPlaying,
  autoPlay = false,
  loop = true,
  onEnded,
  className = "",
  style,
  videoStyle,
  objectFit = "cover",
  preload = "auto",
  children,
}: CanvasVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play/pause control based on isPlaying prop or autoPlay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const targetPlay = isPlaying !== undefined ? isPlaying : autoPlay;

    const handlePlayState = () => {
      if (targetPlay) {
        if (video.paused) {
          video.play().catch((err) => {
            if (err.name !== "AbortError") console.error("Video play error:", err);
          });
        }
      } else {
        if (!video.paused) {
          video.pause();
        }
        video.currentTime = 0;
      }
    };

    handlePlayState();

    video.addEventListener("canplay", handlePlayState);
    video.addEventListener("loadeddata", handlePlayState);

    return () => {
      video.removeEventListener("canplay", handlePlayState);
      video.removeEventListener("loadeddata", handlePlayState);
    };
  }, [isPlaying, autoPlay, src]);

  // Global touch/click unpause handler for strict WebViews (Zalo/Safari)
  useEffect(() => {
    const handleUnlock = () => {
      const video = videoRef.current;
      if (video && video.paused) {
        const targetPlay = isPlaying !== undefined ? isPlaying : autoPlay;
        if (targetPlay) {
          video.play().catch(() => {});
        }
      }
    };

    window.addEventListener("unlockVideos", handleUnlock);
    window.addEventListener("touchstart", handleUnlock, { once: true });
    window.addEventListener("click", handleUnlock, { once: true });

    return () => {
      window.removeEventListener("unlockVideos", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
      window.removeEventListener("click", handleUnlock);
    };
  }, [isPlaying, autoPlay]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ ...style, width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        {...(src ? { src } : {})}
        poster={poster}
        autoPlay={isPlaying !== undefined ? isPlaying : autoPlay}
        muted
        playsInline
        loop={loop}
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5-page"
        x5-video-player-inline="true"
        t7-video-player-type="inline"
        disablePictureInPicture
        disableRemotePlayback
        onEnded={onEnded}
        className="w-full h-full"
        style={{
          objectFit,
          pointerEvents: "none",
          ...videoStyle,
        }}
        preload={preload}
      >
        {children}
      </video>
    </div>
  );
}
