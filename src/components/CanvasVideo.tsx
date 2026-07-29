"use client";

import React, { useEffect, useRef, useState } from "react";

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
  autoPlay = true,
  loop = true,
  onEnded,
  className = "",
  style,
  videoStyle,
  canvasStyle,
  objectFit = "cover",
  preload = "auto",
  children,
}: CanvasVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  // Play/pause based on manual isPlaying prop or autoPlay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const targetPlay = isPlaying !== undefined ? isPlaying : autoPlay;

    const handlePlayState = () => {
      if (targetPlay) {
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
    };

    handlePlayState();

    video.addEventListener("canplay", handlePlayState);
    video.addEventListener("loadeddata", handlePlayState);

    return () => {
      video.removeEventListener("canplay", handlePlayState);
      video.removeEventListener("loadeddata", handlePlayState);
    };
  }, [isPlaying, autoPlay, src]);

  // Unlock playback on user gesture or unlockVideos event (specifically for Zalo/Safari)
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

  // Monitor timeupdate to safely hide poster only when actual video frames are being rendered
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.currentTime > 0.1 && video.readyState >= 2) {
        setHasStartedPlaying(true);
      }
    };
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  // Frame-by-frame drawing on Canvas to bypass native player hijack (Zalo, etc.)
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animationFrameId: number;
    const ctx = canvas.getContext("2d");

    const renderFrame = () => {
      // Force draw if readyState is at least HAVE_CURRENT_DATA or playing
      if (video && ctx) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        if (videoWidth && videoHeight) {
          if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
          }
          
          try {
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
          } catch (e) {
            // Ignore InvalidStateError in some strict webviews
          }
        }
      }
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ ...style, width: "100%", height: "100%" }}>
      {/* Hidden Video element (made 100% size, low opacity, covered by canvas to force mobile playback) */}
      <video
        ref={videoRef}
        {...(src ? { src } : {})}
        autoPlay={autoPlay}
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
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.05, // Keep low non-zero opacity so iOS/Zalo never suspends video decoding!
          pointerEvents: "none",
          zIndex: 1, // Behind the poster and canvas
          ...videoStyle,
        }}
        preload={preload}
      >
        {children}
      </video>
      
      {/* Poster Image shown underneath the canvas */}
      {poster && (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit,
            zIndex: 2,
            opacity: hasStartedPlaying ? 0 : 1,
            transition: "opacity 300ms ease-in-out",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Visible Canvas rendering the video frames (always visible to prevent rendering lag) */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          objectFit,
          position: "relative",
          zIndex: 3,
          background: "transparent",
          ...canvasStyle,
        }}
      />
    </div>
  );
}
