"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { LineReveal, useRevealReady, isIntroDone } from "@/components/ui/CinematicReveal";
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
  const ready = useRevealReady(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, []);

  const invitationText = stripRepeatedHeroInvitePrefix(
    summary?.invitationLine || config.content.description,
  );

  const textHeaderDelay = 1.05;
  const textBodyDelay = 1.2;

  return (
    <section id="home" className="save-date-hero save-date-hero-arch">
      {/* Inline SVG definitions for the watercolor wavy mask */}
      <svg width="1" height="1" className="absolute pointer-events-none" aria-hidden="true" style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, overflow: "hidden" }}>
        <defs>
          <filter id="watercolor-rough-edge" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.03" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <mask id="watercolor-mask" maskContentUnits="objectBoundingBox">
            <rect x="-0.1" y="-0.1" width="1.2" height="0.83" fill="white" />
            <path
              d="M -0.1 0.63 L 1.1 0.63 L 1.1 0.91 C 0.98 0.95, 0.92 0.86, 0.80 0.92 C 0.68 0.96, 0.56 0.88, 0.44 0.94 C 0.32 0.97, 0.20 0.90, 0.08 0.93 C -0.004 0.96, -0.04 0.88, -0.1 0.92 Z"
              fill="white"
              filter="url(#watercolor-rough-edge)"
            />
          </mask>
        </defs>
      </svg>

      <div
        className="save-date-name-logo-reveal"
        role="img"
        aria-label="Long Nhật † Anh Phương"
      >
        <div
          className={`save-date-name-logo hero-logo-fade ${ready ? "is-visible" : ""}`}
          style={{ transitionDelay: "0.15s" }}
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
            className={`hero-photo-fade ${ready && imageLoaded ? "is-visible" : ""}`}
            style={{ transitionDelay: "0.45s" }}
          >
            <figure
              className="save-date-arch-figure save-date-arch-figure--composite"
              aria-label="Khung ảnh cưới"
            >
              <img
                ref={imgRef}
                src={heroCompositeSrc}
                alt={heroCompositeAlt}
                className="save-date-arch-composite"
                width={2000}
                height={1333}
                decoding="async"
                fetchPriority="high"
                onLoad={() => setImageLoaded(true)}
              />
            </figure>
          </div>

          {/* Left Ornament */}
          <div
            className={`save-date-hero-ornament save-date-hero-ornament-left hero-ornament-fade-left ${ready ? "is-visible" : ""}`}
            style={{ transitionDelay: "0.7s" }}
          >
            <Image
              src="/assets/hero-corner-left-v2.png"
              alt=""
              width={250}
              height={250}
              className="object-contain pointer-events-none"
            />
          </div>

          {/* Right Ornament */}
          <div
            className={`save-date-hero-ornament save-date-hero-ornament-right hero-ornament-fade-right ${ready ? "is-visible" : ""}`}
            style={{ transitionDelay: "0.85s" }}
          >
            <Image
              src="/assets/hero-corner-right-v3.png"
              alt=""
              width={250}
              height={250}
              className="object-contain pointer-events-none"
            />
          </div>
        </div>

        <article className="save-date-hero-copy-block">
          <LineReveal delay={textHeaderDelay} className="w-full">
            <div className="save-date-invite-heading-image" aria-label={summary?.guestGreeting || "Trân trọng thân mời"}>
              <Image
                src="/assets/hero-invite-heading-v5.png"
                alt=""
                fill
                aria-hidden="true"
                sizes="(max-width: 767px) 78vw, 24rem"
                className="object-contain"
              />
            </div>
          </LineReveal>
          <LineReveal delay={textBodyDelay} className="w-full">
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
