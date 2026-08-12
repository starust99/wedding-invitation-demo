"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

type HeroInviteHandwritingProps = {
  mode: "preparing" | "animating" | "static";
  onComplete?: () => void;
};

const HEADING_ASSET = "/assets/hero-invite-heading-v5.png";
const REVEAL_MAP_ASSET = "/assets/hero-invite-reveal-map-v2.png";
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 267;
const HERO_INVITE_INK = "#9B7134";
const writeEase = [0.42, 0, 0.2, 1] as const;
const writeStart = 0.46;
const phraseDuration = 2.5;
const ornamentDurationMs = 760;
const FIRST_PHRASE_LAST_STEP = 124;
const SECOND_PHRASE_FIRST_STEP = 125;
const FINAL_REVEAL_STEP = 254;
const PHRASE_SPLIT_X = 384;

function normalizePhraseRevealStep(revealStep: number, x: number) {
  if (x < PHRASE_SPLIT_X) {
    const progress = (revealStep - 1) / (FIRST_PHRASE_LAST_STEP - 1);
    return Math.round(1 + progress * (FINAL_REVEAL_STEP - 1));
  }

  const progress = (revealStep - SECOND_PHRASE_FIRST_STEP)
    / (FINAL_REVEAL_STEP - SECOND_PHRASE_FIRST_STEP);
  return Math.round(1 + progress * (FINAL_REVEAL_STEP - 1));
}

function loadDecodedImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

export function HeroInviteHandwriting({ mode, onComplete }: HeroInviteHandwritingProps) {
  const reactId = useId();
  const ornamentMaskId = `heroInviteOrnamentMask${reactId.replace(/:/g, "")}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phraseFinished, setPhraseFinished] = useState(mode === "static");

  useEffect(() => {
    if (mode === "static") {
      onComplete?.();
      return;
    }

    if (mode !== "animating" || !phraseFinished) return;

    // Start this timer from the real canvas completion signal. The canvas waits
    // for decoded assets, so a mount-based timer can run the ornament (and swap
    // to the static artwork) before slow webviews finish writing the phrase.
    const timer = window.setTimeout(() => onComplete?.(), ornamentDurationMs);
    return () => window.clearTimeout(timer);
  }, [mode, onComplete, phraseFinished]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (mode !== "animating") return;

    let cancelled = false;
    let animationFrame = 0;

    Promise.all([loadDecodedImage(HEADING_ASSET), loadDecodedImage(REVEAL_MAP_ASSET)])
      .then(([heading, revealMap]) => {
        if (cancelled) return;

        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = CANVAS_WIDTH;
        sourceCanvas.height = CANVAS_HEIGHT;
        const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });

        const mapCanvas = document.createElement("canvas");
        mapCanvas.width = CANVAS_WIDTH;
        mapCanvas.height = CANVAS_HEIGHT;
        const mapContext = mapCanvas.getContext("2d", { willReadFrequently: true });

        if (!sourceContext || !mapContext) return;

        sourceContext.drawImage(heading, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        sourceContext.globalCompositeOperation = "source-in";
        sourceContext.fillStyle = HERO_INVITE_INK;
        sourceContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        sourceContext.globalCompositeOperation = "source-over";
        mapContext.drawImage(revealMap, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const sourcePixels = sourceContext.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const mapPixels = mapContext.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const outputPixels = context.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
        const revealBuckets: number[][] = Array.from({ length: 255 }, () => []);

        // The grayscale map stores the exact arrival time of the pen for every
        // visible pixel. Its first range belongs to “Trân trọng &” and its second
        // range belongs to “Thân mời:”. Normalize both ranges to the same 1–254
        // timeline so the two phrases begin together, while preserving every
        // phrase's original stroke order and single-pen reveal internally.
        for (let offset = 0; offset < mapPixels.data.length; offset += 4) {
          const revealStep = mapPixels.data[offset];
          if (revealStep > 0) {
            const x = (offset / 4) % CANVAS_WIDTH;
            revealBuckets[normalizePhraseRevealStep(revealStep, x)].push(offset);
          }
        }

        let lastSolidStep = 0;
        const startedAt = performance.now();

        const paint = (now: number) => {
          if (cancelled) return;

          const writingElapsed = now - startedAt - writeStart * 1000;
          if (writingElapsed < 0) {
            animationFrame = window.requestAnimationFrame(paint);
            return;
          }

          const progress = Math.min(1, writingElapsed / (phraseDuration * 1000));
          const revealPosition = progress * 254;
          const solidStep = progress >= 1
            ? 254
            : Math.min(254, Math.max(0, Math.floor(revealPosition) - 2));

          for (let step = lastSolidStep + 1; step <= solidStep; step += 1) {
            for (const offset of revealBuckets[step]) {
              outputPixels.data[offset] = sourcePixels.data[offset];
              outputPixels.data[offset + 1] = sourcePixels.data[offset + 1];
              outputPixels.data[offset + 2] = sourcePixels.data[offset + 2];
              outputPixels.data[offset + 3] = sourcePixels.data[offset + 3];
            }
          }

          // Feather only behind the live pen tip. Never paint a bucket whose
          // arrival time is still ahead of the pen: at mobile size even a faint
          // future pixel reads as a detached stroke appearing too early.
          const featherEnd = Math.min(254, Math.floor(revealPosition));
          for (let step = solidStep + 1; step <= featherEnd; step += 1) {
            const linearOpacity = Math.min(1, Math.max(0, (revealPosition - step) / 2));
            const opacity = linearOpacity * linearOpacity * (3 - 2 * linearOpacity);
            for (const offset of revealBuckets[step]) {
              outputPixels.data[offset] = sourcePixels.data[offset];
              outputPixels.data[offset + 1] = sourcePixels.data[offset + 1];
              outputPixels.data[offset + 2] = sourcePixels.data[offset + 2];
              outputPixels.data[offset + 3] = Math.round(sourcePixels.data[offset + 3] * opacity);
            }
          }

          context.putImageData(outputPixels, 0, 0);
          lastSolidStep = solidStep;

          if (progress < 1) {
            animationFrame = window.requestAnimationFrame(paint);
          } else {
            setPhraseFinished(true);
          }
        };

        animationFrame = window.requestAnimationFrame(paint);
      })
      .catch(() => {
        // An actual decode error should not strand the hero. Unlike a watchdog
        // based on mount time, this cannot race ahead of a merely slow decode.
        setPhraseFinished(true);
      });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
    };
  }, [mode]);

  const isAnimating = mode === "animating";
  const isStatic = mode === "static";

  return (
    <div className="save-date-invite-heading-image" aria-label="Trân trọng và thân mời">
      {isAnimating ? (
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="hero-invite-handwriting-canvas"
          aria-hidden="true"
        />
      ) : null}

      <svg
        className="hero-invite-handwriting-svg"
        viewBox="0 0 800 267"
        role="img"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <mask
            id={`${ornamentMaskId}Artwork`}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="800"
            height="267"
            style={{ maskType: "alpha" }}
          >
            <image
              href={HEADING_ASSET}
              x="0"
              y="0"
              width="800"
              height="267"
              preserveAspectRatio="xMidYMid meet"
            />
          </mask>
          <mask
            id={ornamentMaskId}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="800"
            height="267"
          >
            <rect width="800" height="267" fill="black" />

            {isAnimating ? (
              <>
                <motion.path
                  d="M146 196 L372 196"
                  fill="none"
                  stroke="white"
                  strokeWidth="9"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: phraseFinished ? 1 : 0,
                    opacity: phraseFinished ? 1 : 0,
                  }}
                  transition={{
                    pathLength: { duration: 0.24, ease: writeEase },
                    opacity: { duration: 0.01 },
                  }}
                />
                <motion.rect
                  x="382"
                  y="177"
                  width="40"
                  height="40"
                  fill="white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phraseFinished ? 1 : 0 }}
                  transition={{ delay: phraseFinished ? 0.28 : 0, duration: 0.12, ease: writeEase }}
                />
                <motion.path
                  d="M433 196 L660 196"
                  fill="none"
                  stroke="white"
                  strokeWidth="9"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: phraseFinished ? 1 : 0,
                    opacity: phraseFinished ? 1 : 0,
                  }}
                  transition={{
                    pathLength: {
                      delay: phraseFinished ? 0.46 : 0,
                      duration: 0.24,
                      ease: writeEase,
                    },
                    opacity: {
                      delay: phraseFinished ? 0.46 : 0,
                      duration: 0.01,
                    },
                  }}
                />
              </>
            ) : null}
          </mask>
        </defs>

        {isStatic ? (
          <rect
            x="0"
            y="0"
            width="800"
            height="267"
            fill={HERO_INVITE_INK}
            mask={`url(#${ornamentMaskId}Artwork)`}
          />
        ) : null}

        {isAnimating ? (
          <g mask={`url(#${ornamentMaskId})`}>
            <rect
              x="0"
              y="0"
              width="800"
              height="267"
              fill={HERO_INVITE_INK}
              mask={`url(#${ornamentMaskId}Artwork)`}
            />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
