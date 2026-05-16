"use client";

import { useEffect, useRef } from "react";

type CanvasVideoProps = {
  src?: string;
  poster?: string;
  isPlaying?: boolean;
  onEnded?: () => void;
  className?: string;
  objectFit?: "cover" | "contain";
};

export function CanvasVideo({ src, poster, isPlaying, onEnded, className = "", objectFit = "cover" }: CanvasVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (isPlaying) {
      if (video.paused) {
        playPromiseRef.current = video.play();
        playPromiseRef.current?.catch((err) => {
          if (err.name !== "AbortError") console.error("CanvasVideo play error:", err);
        });
      }
    } else {
      if (!video.paused) {
        if (playPromiseRef.current !== undefined) {
          playPromiseRef.current?.then(() => {
            video.pause();
          }).catch(() => {});
        } else {
          video.pause();
        }
      }
    }
  }, [isPlaying, src]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationId: number;

    const drawFrame = () => {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      animationId = requestAnimationFrame(drawFrame);
    };

    const onPlay = () => {
      drawFrame();
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("seeked", drawFrame); // draw poster frame when seeking/loaded

    // Try to draw initial frame when loaded
    const onLoadedData = () => {
      if (video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    };
    video.addEventListener("loadeddata", onLoadedData);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("seeked", drawFrame);
      video.removeEventListener("loadeddata", onLoadedData);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Invisible video element */}
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        onEnded={onEnded}
        className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none -z-10"
        preload="auto"
      />
      {poster && !isPlaying && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit }} />
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-300 ${!isPlaying && poster ? 'opacity-0' : 'opacity-100'}`}
        style={{ objectFit }}
      />
    </div>
  );
}
