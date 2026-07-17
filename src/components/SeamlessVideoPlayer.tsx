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
  
  // Track which video is currently playing as the active source
  const [activeVideo, setActiveVideo] = useState<"A" | "B">("A");
  // Opacity controls for smooth crossfade transitions
  const [opacityA, setOpacityA] = useState(1);
  const [opacityB, setOpacityB] = useState(0);

  useEffect(() => {
    const videoA = videoRefA.current;
    const videoB = videoRefB.current;
    if (!videoA || !videoB) return;

    // Initially make sure video A is playing
    if (activeVideo === "A" && videoA.paused) {
      videoA.play().catch(() => {});
    }

    let isTransitioning = false;

    const checkLoopTransition = () => {
      const activeVideoEl = activeVideo === "A" ? videoA : videoB;
      const nextVideoEl = activeVideo === "A" ? videoB : videoA;

      if (!activeVideoEl || !nextVideoEl || isTransitioning) return;

      // Start pre-playing the next video slightly before the current one ends
      // 0.35s is the perfect duration to ensure smooth decoding and alignment
      if (
        activeVideoEl.currentTime >= activeVideoEl.duration - 0.35 &&
        activeVideoEl.duration > 0
      ) {
        isTransitioning = true;
        
        // Start next video at the beginning
        nextVideoEl.currentTime = 0;
        
        nextVideoEl.play().then(() => {
          if (activeVideo === "A") {
            setActiveVideo("B");
            setOpacityB(1);
            
            // Wait briefly for video B to render its first frames, then fade out video A
            setTimeout(() => {
              setOpacityA(0);
              setTimeout(() => {
                videoA.pause();
                videoA.currentTime = 0;
                isTransitioning = false;
              }, 250); // Pause A after its opacity fades to 0
            }, 50);
          } else {
            setActiveVideo("A");
            setOpacityA(1);
            
            setTimeout(() => {
              setOpacityB(0);
              setTimeout(() => {
                videoB.pause();
                videoB.currentTime = 0;
                isTransitioning = false;
              }, 250);
            }, 50);
          }
        }).catch(() => {
          isTransitioning = false;
        });
      }
    };

    // Use a fast interval for checking the playback progress
    const intervalId = setInterval(checkLoopTransition, 80);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeVideo]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <video
        ref={videoRefA}
        className="timeline-path-video absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
        style={{ 
          opacity: opacityA, 
          zIndex: activeVideo === "A" ? 2 : 1,
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
        className="timeline-path-video absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
        style={{ 
          opacity: opacityB, 
          zIndex: activeVideo === "B" ? 2 : 1,
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
