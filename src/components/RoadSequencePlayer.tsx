"use client";

import React, { useEffect, useState } from "react";

export function RoadSequencePlayer({
  className = "",
  style,
  onReady,
}: {
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded && onReady) {
      onReady();
    }
  }, [isLoaded, onReady]);

  return (
    <img
      src="/assets/timeline-path.webp"
      alt=""
      aria-hidden="true"
      onLoad={() => setIsLoaded(true)}
      className={`${className} timeline-road-motion ${isLoaded ? "is-ready" : ""}`}
      style={{
        objectFit: "cover",
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
}
