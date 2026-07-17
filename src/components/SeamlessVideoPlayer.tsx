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

  // activeVideo determines which video element is on top (zIndex: 2)
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

        // Reset and play the background video (which is underneath with opacity 1)
        nextVideoEl.currentTime = 0;
        nextVideoEl.play().then(() => {
          // Fade out the top video (A if activeVideo === "A", B if activeVideo === "B")
          setTopOpacity(0);

          // Once the opacity transition is complete (400ms)
          setTimeout(() => {
            // Swap active video to make nextVideoEl the top video
            setActiveVideo(activeVideo === "A" ? "B" : "A");
            
            // Instantly restore opacity of the top video to 1
            setTopOpacity(1);

            // Pause and reset the old video (now underneath)
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

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <video
        ref={videoRefA}
        className="timeline-path-video absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{
          zIndex: activeVideo === "A" ? 2 : 1,
          opacity: activeVideo === "A" ? topOpacity : 1,
          transition: "opacity 400ms ease-in-out",
          backgroundColor: "var(--wedding-cream, #f7f2ea)"
        }}
        muted
        playsInline
      >
        {webmSrc && <source src={webmSrc} type="video/webm" />}
        <source src={mp4Src} type="video/mp4" />
      </video>
      <video
        ref={videoRefB}
        className="timeline-path-video absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{
          zIndex: activeVideo === "B" ? 2 : 1,
          opacity: activeVideo === "B" ? topOpacity : 1,
          transition: "opacity 400ms ease-in-out",
          backgroundColor: "var(--wedding-cream, #f7f2ea)"
        }}
        muted
        playsInline
      >
        {webmSrc && <source src={webmSrc} type="video/webm" />}
        <source src={mp4Src} type="video/mp4" />
      </video>
    </div>
  );
}
