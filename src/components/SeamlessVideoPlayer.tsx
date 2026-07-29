"use client";

import React, { useRef, useEffect, useState } from "react";

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

  useEffect(() => {
    const videoA = videoRefA.current;
    const videoB = videoRefB.current;
    if (!videoA || !videoB) return;

    // Make sure the active video is playing
    if (activeVideo === "A" && videoA.paused) {
      videoA.play().catch(() => {});
    }

    const handleUnlock = () => {
      if (videoA && videoA.paused) videoA.play().catch(() => {});
      if (videoB && videoB.paused) videoB.play().catch(() => {});
    };

    window.addEventListener("unlockVideos", handleUnlock);
    window.addEventListener("touchstart", handleUnlock, { once: true });
    window.addEventListener("click", handleUnlock, { once: true });

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

    const playActive = () => {
      const activeEl = activeVideo === "A" ? videoA : videoB;
      if (activeEl && activeEl.paused) {
        activeEl.play().catch(() => {});
      }
    };

    playActive();

    videoA.addEventListener("canplay", playActive);
    videoA.addEventListener("loadeddata", playActive);
    videoB.addEventListener("canplay", playActive);
    videoB.addEventListener("loadeddata", playActive);

    return () => {
      clearInterval(intervalId);
      videoA.removeEventListener("canplay", playActive);
      videoA.removeEventListener("loadeddata", playActive);
      videoB.removeEventListener("canplay", playActive);
      videoB.removeEventListener("loadeddata", playActive);
      window.removeEventListener("unlockVideos", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
      window.removeEventListener("click", handleUnlock);
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
        ref={videoRefA}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5-page"
        x5-video-player-inline="true"
        t7-video-player-type="inline"
        disablePictureInPicture
        disableRemotePlayback
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.05,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {webmSrc && <source src={webmSrc} type="video/webm" />}
        <source src={mp4Src} type="video/mp4" />
      </video>

      <video
        ref={videoRefB}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5-page"
        x5-video-player-inline="true"
        t7-video-player-type="inline"
        disablePictureInPicture
        disableRemotePlayback
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.05,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {webmSrc && <source src={webmSrc} type="video/webm" />}
        <source src={mp4Src} type="video/mp4" />
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
