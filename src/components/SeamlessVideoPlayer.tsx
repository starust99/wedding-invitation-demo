"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { AssetStore } from "@/lib/assetStore";

interface SeamlessVideoPlayerProps {
  mp4Src: string;
  webmSrc?: string;
  className?: string;
}

export default function SeamlessVideoPlayer({
  mp4Src,
  webmSrc,
  className = "",
}: SeamlessVideoPlayerProps) {
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // activeVideo determines which video element is on top
  const [activeVideo, setActiveVideo] = useState<"A" | "B">("A");
  
  // Opacity of the active top video
  const [topOpacity, setTopOpacity] = useState(1);
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    return AssetStore.subscribe(() => setForceRender(prev => prev + 1));
  }, []);

  // Resolve Blob URLs
  const finalMp4Src = useMemo(() => AssetStore.get(mp4Src), [mp4Src, forceRender]);
  const finalWebmSrc = useMemo(() => webmSrc ? AssetStore.get(webmSrc) : undefined, [webmSrc, forceRender]);

  useEffect(() => {
    const videoA = videoRefA.current;
    const videoB = videoRefB.current;
    if (!videoA || !videoB) return;

    // Make sure the active video is playing
    if (activeVideo === "A" && videoA.paused) {
      videoA.play().catch(() => {});
    }

    let isTransitioning = false;

    const checkLoopTransition = () => {
      const activeVideoEl = activeVideo === "A" ? videoA : videoB;
      const nextVideoEl = activeVideo === "A" ? videoB : videoA;

      if (!activeVideoEl || !nextVideoEl || isTransitioning) return;

      // Start the transition 0.5s before the current video ends
      if (
        activeVideoEl.currentTime >= activeVideoEl.duration - 0.5 &&
        activeVideoEl.duration > 0
      ) {
        isTransitioning = true;

        // Reset and play the background video
        nextVideoEl.currentTime = 0;
        nextVideoEl.play().then(() => {
          // Fade out the top video
          setTopOpacity(0);

          // Once the opacity transition is complete (450ms)
          setTimeout(() => {
            // Swap active video to make nextVideoEl the top video
            setActiveVideo(activeVideo === "A" ? "B" : "A");
            
            // Instantly restore opacity of the top video to 1
            setTopOpacity(1);

            // Pause and reset the old video
            activeVideoEl.pause();
            activeVideoEl.currentTime = 0;
            
            isTransitioning = false;
          }, 450);
        }).catch(() => {
          isTransitioning = false;
        });
      }
    };

    const intervalId = setInterval(checkLoopTransition, 50);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeVideo]);

  // Frame-by-frame canvas drawing to bypass native player hijack
  useEffect(() => {
    const videoA = videoRefA.current;
    const videoB = videoRefB.current;
    const canvas = canvasRef.current;
    if (!videoA || !videoB || !canvas) return;

    let animationFrameId: number;
    const ctx = canvas.getContext("2d");

    const render = () => {
      if (ctx) {
        const topVideo = activeVideo === "A" ? videoA : videoB;
        const bottomVideo = activeVideo === "A" ? videoB : videoA;

        const w = topVideo.videoWidth || bottomVideo.videoWidth;
        const h = topVideo.videoHeight || bottomVideo.videoHeight;

        if (w && h) {
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          ctx.clearRect(0, 0, w, h);

          try {
            // Draw the background video first (always opacity 1)
            if (bottomVideo.readyState >= 2) {
              ctx.globalAlpha = 1.0;
              ctx.drawImage(bottomVideo, 0, 0, w, h);
            }

            // Draw the top video with transition opacity
            if (topVideo.readyState >= 2) {
              ctx.globalAlpha = topOpacity;
              ctx.drawImage(topVideo, 0, 0, w, h);
            }
          } catch (e) {
            // Ignore InvalidStateError in strict WebViews (e.g., Zalo)
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeVideo, topOpacity]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Hidden Video Elements (set to 100% size, low opacity, covered by canvas to force mobile playback) */}
      <video
        key={`videoA-${forceRender}`}
        ref={videoRefA}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        x5-video-player-type="h5-page"
        x5-video-player-fullscreen="true"
        x5-video-orientation="portrait"
        disablePictureInPicture
        disableRemotePlayback
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.001,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {finalWebmSrc && <source src={finalWebmSrc} type="video/webm" />}
        <source src={finalMp4Src} type="video/mp4" />
      </video>

      <video
        key={`videoB-${forceRender}`}
        ref={videoRefB}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        x5-video-player-type="h5-page"
        x5-video-player-fullscreen="true"
        x5-video-orientation="portrait"
        disablePictureInPicture
        disableRemotePlayback
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.001,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {finalWebmSrc && <source src={finalWebmSrc} type="video/webm" />}
        <source src={finalMp4Src} type="video/mp4" />
      </video>

      {/* Single visible Canvas (placed on top with zIndex 2) */}
      <canvas
        ref={canvasRef}
        className="timeline-path-video w-full h-full"
        style={{
          objectFit: "contain",
          backgroundColor: "var(--wedding-cream, #f7f2ea)",
          position: "relative",
          zIndex: 2,
        }}
      />
    </div>
  );
}
