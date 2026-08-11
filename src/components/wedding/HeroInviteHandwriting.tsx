"use client";

import { motion } from "framer-motion";
import { useEffect, useId } from "react";

type HeroInviteHandwritingProps = {
  mode: "preparing" | "animating" | "static";
  onComplete?: () => void;
};

const writeEase = [0.42, 0, 0.2, 1] as const;
const writeStart = 0.58;
const phraseDuration = 2.72;
const underlineStart = writeStart + phraseDuration + 0.12;
const handwritingCompleteMs = Math.round((underlineStart + 0.66) * 1000);

export function HeroInviteHandwriting({ mode, onComplete }: HeroInviteHandwritingProps) {
  const reactId = useId();
  const maskId = `heroInviteWriteMask${reactId.replace(/:/g, "")}`;

  useEffect(() => {
    if (mode === "static") {
      onComplete?.();
      return;
    }

    if (mode !== "animating") return;

    // Do not rely on an SVG mask animation event here. A deterministic timer is
    // more reliable in iOS/Zalo webviews, where mask descendants can miss it.
    const timer = window.setTimeout(() => onComplete?.(), handwritingCompleteMs);
    return () => window.clearTimeout(timer);
  }, [mode, onComplete]);

  const isAnimating = mode === "animating";
  const isStatic = mode === "static";

  return (
    <div className="save-date-invite-heading-image" aria-label="Trân trọng và thân mời">
      <svg
        className="hero-invite-handwriting-svg"
        viewBox="0 0 800 267"
        role="img"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="800"
            height="267"
          >
            <rect width="800" height="267" fill="black" />

            {isStatic ? <rect width="800" height="267" fill="white" /> : null}

            {isAnimating ? (
              <>
                {/*
                  The original calligraphy is a raster asset. A softly feathered
                  left-to-right ink front keeps every letter connected and reads as
                  a pen moving across the sentence; thin hand-traced paths expose
                  isolated antialiasing pixels and look broken on small screens.
                */}
                <motion.rect
                  x="0"
                  y="34"
                  height="153"
                  fill="white"
                  initial={{ width: 0 }}
                  animate={{ width: 800 }}
                  transition={{
                    delay: writeStart,
                    duration: phraseDuration,
                    ease: [0.33, 0, 0.2, 1],
                  }}
                />

                {/* Underline and centre ornament appear only after the words finish. */}
                <motion.path
                  d="M146 196 L372 196"
                  fill="none"
                  stroke="white"
                  strokeWidth="9"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: underlineStart, duration: 0.24, ease: writeEase }}
                />
                <motion.circle
                  cx="402"
                  cy="197"
                  r="19"
                  fill="white"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: underlineStart + 0.2, duration: 0.16, ease: writeEase }}
                  style={{ transformOrigin: "402px 197px" }}
                />
                <motion.path
                  d="M433 196 L660 196"
                  fill="none"
                  stroke="white"
                  strokeWidth="9"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: underlineStart + 0.38, duration: 0.24, ease: writeEase }}
                />
              </>
            ) : null}
          </mask>
        </defs>

        <image
          href="/assets/hero-invite-heading-v5.png"
          x="0"
          y="0"
          width="800"
          height="267"
          preserveAspectRatio="xMidYMid meet"
          mask={`url(#${maskId})`}
          className="hero-champagne-ink"
        />
      </svg>
    </div>
  );
}
