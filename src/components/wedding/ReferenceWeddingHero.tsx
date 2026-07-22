"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { LineReveal, useRevealReady, checkIsIntroDone } from "@/components/ui/CinematicReveal";
import type { WeddingHeroEditorConfig } from "@/lib/wedding/hero-types";

type ReferenceWeddingHeroProps = {
  config: WeddingHeroEditorConfig;
  summary?: ReferenceWeddingHeroSummary;
};

export type ReferenceWeddingHeroSummary = {
  guestName?: string;
  guestGreeting?: string;
  invitationLine?: string;
  venueName?: string;
  venueArea?: string;
  venueLocation?: string;
  dateLabel?: string;
  welcomeTime?: string;
};

const heroCompositeSrc = "/assets/wedding/hero/hero-arch-composite.webp";
const heroCompositeAlt = "Ảnh cưới Nhật và Phương trong khung thiệp";

function stripRepeatedHeroInvitePrefix(text: string) {
  return text.replace(/^trân trọng kính mời\s+/i, "");
}

export function ReferenceWeddingHero({ config, summary }: ReferenceWeddingHeroProps) {
  const readyFromReveal = useRevealReady(true);
  const [isHeroVisible, setIsHeroVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search || "";
      const href = window.location.href || "";
      if (search.includes("intro=1") || href.includes("intro=1")) {
        return false;
      }
      if (document.documentElement.classList.contains("splash-skipped")) {
        return true;
      }
    }
    return checkIsIntroDone();
  });
  const [isAnimatedSequence, setIsAnimatedSequence] = useState(false);

  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const isDone = checkIsIntroDone();
    if (isDone) {
      setIsHeroVisible(true);
    }

    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }

    const handleIntroFinished = () => {
      setIsHeroVisible(true);
      setIsAnimatedSequence(true);
    };

    window.addEventListener("introFinished", handleIntroFinished);
    return () => window.removeEventListener("introFinished", handleIntroFinished);
  }, []);

  const isDone = isHeroVisible;

  const invitationText = stripRepeatedHeroInvitePrefix(
    summary?.invitationLine || config.content.description,
  );

  const textHeaderDelay = isDone ? 0 : 1.25;
  const textBodyDelay = isDone ? 0 : 1.4;

  const heroMotionClass = isAnimatedSequence
    ? "hero-animating"
    : (isHeroVisible ? "hero-static" : "hero-preparing");

  return (
    <section id="home" className={`save-date-hero save-date-hero-arch ${heroMotionClass}`}>

      <div
        className="save-date-name-logo-reveal"
        role="img"
        aria-label="Long Nhật † Anh Phương"
      >
        <div
          className={`save-date-name-logo hero-logo-fade ${isHeroVisible ? "is-visible" : ""}`}
          aria-hidden="true"
        >
          <Image
            src="/assets/hero-names-logo-v9-centered.png"
            alt="Long Nhật † Anh Phương"
            fill
            priority
            className="save-date-name-logo-img"
          />
        </div>
      </div>

      <div className="save-date-arch-shell">
        <div className="save-date-arch-wrapper">
          <div
            className={`hero-photo-fade ${isDone || (readyFromReveal && imageLoaded) ? "is-visible" : ""}`}
          >
            {/* Invisible img for preloading and onload detection outside figure */}
            <img
              ref={imgRef}
              src={heroCompositeSrc}
              alt=""
              style={{ display: "none", width: 0, height: 0, position: "absolute", opacity: 0, pointerEvents: "none" }}
              onLoad={() => setImageLoaded(true)}
            />

            <figure
              className="save-date-arch-figure save-date-arch-figure--composite"
              aria-label="Khung ảnh cưới"
            >
              {/* SVG container which renders the masked image reliably across all browsers */}
              <svg
                viewBox="0 0 2000 1333"
                width="100%"
                height="auto"
                className="save-date-arch-composite-svg"
                style={{ display: "block", width: "100%", height: "auto" }}
              >
                <defs>
                  <filter id="watercolor-rough-edge-svg" filterUnits="objectBoundingBox">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.03" xChannelSelector="R" yChannelSelector="G" />
                  </filter>

                  <mask id="watercolor-mask-svg" maskContentUnits="objectBoundingBox">
                    <rect x="-0.1" y="-0.1" width="1.2" height="0.83" fill="white" />
                    <path
                      d="M -0.1 0.63 L 1.1 0.63 L 1.1 0.91 C 0.98 0.95, 0.92 0.86, 0.80 0.92 C 0.68 0.96, 0.56 0.88, 0.44 0.94 C 0.32 0.97, 0.20 0.90, 0.08 0.93 C -0.004 0.96, -0.04 0.88, -0.1 0.92 Z"
                      fill="white"
                      filter="url(#watercolor-rough-edge-svg)"
                    />
                  </mask>
                </defs>

                <image
                  href={heroCompositeSrc}
                  x="0"
                  y="0"
                  width="2000"
                  height="1333"
                  mask="url(#watercolor-mask-svg)"
                />
              </svg>
            </figure>
          </div>

          {/* Left Ornament */}
          <div
            className={`save-date-hero-ornament save-date-hero-ornament-left hero-ornament-fade-left ${isHeroVisible ? "is-visible" : ""}`}
          >
            <Image
              src="/assets/hero-corner-left-v2.png"
              alt=""
              width={250}
              height={250}
              priority
              className="object-contain pointer-events-none"
            />
          </div>

          {/* Right Ornament */}
          <div
            className={`save-date-hero-ornament save-date-hero-ornament-right hero-ornament-fade-right ${isHeroVisible ? "is-visible" : ""}`}
          >
            <Image
              src="/assets/hero-corner-right-v3.png"
              alt=""
              width={250}
              height={250}
              priority
              className="object-contain pointer-events-none"
            />
          </div>
        </div>

        <article className="save-date-hero-copy-block">
          <LineReveal delay={textHeaderDelay} type="header" className="w-full">
            <div className="save-date-invite-heading-image" aria-label={summary?.guestGreeting || "Trân trọng thân mời"}>
              <Image
                src="/assets/hero-invite-heading-v5.png"
                alt=""
                fill
                priority
                aria-hidden="true"
                sizes="(max-width: 767px) 78vw, 24rem"
                className="object-contain"
              />
            </div>
          </LineReveal>
          <LineReveal delay={textBodyDelay} type="body" className="w-full">
            <p className="save-date-copy save-date-copy-arch">{invitationText}</p>
          </LineReveal>
        </article>
      </div>

      <a href="#details" className="save-date-scroll" aria-label="Xem thông tin tiệc">
        <ChevronDown aria-hidden="true" size={28} className="animate-bounce" />
      </a>
    </section>
  );
}
