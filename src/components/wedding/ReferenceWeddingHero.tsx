"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { LineReveal, checkIsIntroDone } from "@/components/ui/CinematicReveal";
import { CoupleNameText } from "@/components/ui/CoupleNameText";
import type { WeddingHeroEditorConfig } from "@/lib/wedding/hero-types";

type ReferenceWeddingHeroProps = {
  config: WeddingHeroEditorConfig;
  summary?: ReferenceWeddingHeroSummary;
};

export type ReferenceWeddingHeroSummary = {
  guestName?: string;
  invitationLine?: string;
  coupleDisplayName?: string;
  venueName?: string;
  venueArea?: string;
  venueLocation?: string;
  dateLabel?: string;
  welcomeTime?: string;
};

const heroCompositeSrc = "/assets/wedding/hero/hero-arch-composite.webp";

function stripRepeatedHeroInvitePrefix(text: string) {
  return text.replace(/^trân trọng kính mời\s+/i, "");
}

function HeroGuestNameText({ text }: { text: string }) {
  const names = text.split(/\s*&\s*/);

  if (names.length === 1) return text;

  return (
    <>
      <span className="sr-only">{text.replace(/\s*&\s*/g, " và ")}</span>
      <span aria-hidden="true">
        {names[0]}
        {names.slice(1).map((name, index) => (
          <span key={`${name}-${index}`} className="hero-guest-name-joined-part">
            <span className="hero-guest-custom-ampersand">
              <svg viewBox="0 0 1384 1462" aria-hidden="true" focusable="false" shapeRendering="geometricPrecision">
                <path
                  transform="matrix(1 0 0.1584 -1 5.1 1430)"
                  d="M1302 182Q1304 176 1305 166Q1306 156 1306 145Q1306 119 1300 98Q1283 40 1221 8Q1166 -20 1098 -20Q1019 -20 942 23Q912 40 862 74Q796 23 717 -4.5Q638 -32 556 -32Q353 -32 223 68Q78 179 78 380Q78 533 170 641Q245 728 358 766Q279 910 273 924Q224 1030 224 1114Q224 1264 316 1351Q399 1430 522 1430Q643 1430 708.5 1344Q774 1258 774 1110Q774 1008 680 910Q605 831 496 778Q530 715 596 613Q677 489 742 402Q826 290 898 216L930 262Q968 321 990 406Q1001 448 1001 497Q1001 562 980 621Q956 689 908 738Q889 735 860 725.5Q831 716 813.5 706.5Q796 697 785.5 680.5Q775 664 775 644Q775 637 777.5 627.5Q780 618 791 607Q802 596 817 596Q826 596 834 600Q847 607 851.5 613Q856 619 856 626Q859 636 864 636L874 630L888 606L890 592Q890 555 852 538Q844 534 833.5 532Q823 530 814 530Q786 530 764 548.5Q742 567 729.5 594.5Q717 622 717 654Q717 703 742 744Q767 785 812 810Q870 842 959 864Q1023 880 1088 896Q1161 921 1161 966Q1161 975 1158 984Q1147 1014 1116 1014Q1098 1014 1080 1002Q1072 998 1065.5 987.5Q1059 977 1054 977Q1049 977 1044 988Q1039 999 1039 1013Q1039 1034 1053 1051.5Q1067 1069 1079.5 1072.5Q1092 1076 1099.5 1077Q1107 1078 1112 1078Q1151 1078 1179 1048Q1201 1024 1210 992Q1216 968 1216 948Q1216 871 1135 819Q1071 778 962 754Q1002 729 1039 660Q1089 568 1089 464Q1089 439 1086 410Q1078 353 1038.5 282Q999 211 952 168Q981 143 1027 121Q1088 92 1139 92Q1145 92 1166 94Q1193 98 1220.5 116.5Q1248 135 1264 154L1284 188L1293 193Q1299 193 1302 182ZM682 1090Q685 1113 685 1137Q685 1229 645 1294Q598 1370 512 1370Q425 1370 374 1303Q328 1242 328 1159Q328 1148 328 1141Q328 1133 332 1116Q341 1065 381.5 978.5Q422 892 466 828Q555 875 613.5 944Q672 1013 682 1090ZM808 130Q744 190 649 317Q568 425 491 544Q418 657 388 716Q340 706 285 629Q210 525 210 380Q210 218 320 118Q417 30 544 30Q613 30 679 53Q756 80 808 130Z"
                />
              </svg>
            </span>
            <span>{name}</span>
          </span>
        ))}
      </span>
    </>
  );
}

export function ReferenceWeddingHero({ config, summary }: ReferenceWeddingHeroProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isHeroAnimated, setIsHeroAnimated] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const handleIntroFinished = () => {
      setIsHeroAnimated(true);
    };
    window.addEventListener("introFinished", handleIntroFinished);
    return () => window.removeEventListener("introFinished", handleIntroFinished);
  }, []);

  const isSplashActive =
    hasMounted &&
    document.documentElement.classList.contains("splash-active");
  const isSkipped = hasMounted && !isSplashActive && (
    document.documentElement.classList.contains("splash-skipped") || checkIsIntroDone()
  );

  // Precedence:
  // 1. If introFinished event fired -> "hero-animating" (starts keyframes smoothly under dissolving envelope)
  // 2. If splash skipped on reload / return -> "hero-static" (100% static instantly on frame 0)
  // 3. Base preparing state -> "hero-preparing" (hidden until React commits an explicit reveal branch)
  let heroMotionClass = "hero-preparing";
  if (isHeroAnimated) {
    heroMotionClass = "hero-animating";
  } else if (isSkipped) {
    heroMotionClass = "hero-static";
  }

  const isDone = heroMotionClass === "hero-static" || heroMotionClass === "hero-animating";

  const invitationText = stripRepeatedHeroInvitePrefix(
    summary?.invitationLine || config.content.description,
  );

  const textHeaderDelay = isDone ? 0 : 1.25;
  const textBodyDelay = isDone ? 0 : 1.4;

  return (
    <section id="home" className={`save-date-hero save-date-hero-arch ${heroMotionClass}`}>

      <div
        className="save-date-name-logo-reveal"
        role="img"
        aria-label="Long Nhật † Anh Phương"
      >
        <div
          className={`save-date-name-logo hero-logo-fade ${isDone ? "is-visible" : ""}`}
          aria-hidden="true"
        >
          {/* Left Part: Long Nhật (clipped to keep left 40%) */}
          <img
            src="/assets/hero-names-logo-v9-centered.png"
            alt="Long Nhật"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            style={{ clipPath: "inset(0 60% 0 0)" }}
            draggable={false}
          />
          
          {/* Middle Part: New Cross */}
          <div className="save-date-new-cross-container">
            <img
              src="/assets/icon-cross-new.png"
              alt="Thập giá"
              className="save-date-new-cross pointer-events-none"
              draggable={false}
            />
          </div>
          
          {/* Right Part: Anh Phương (clipped to keep right 40%) */}
          <img
            src="/assets/hero-names-logo-v9-centered.png"
            alt="Anh Phương"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            style={{ clipPath: "inset(0 0 0 60%)" }}
            draggable={false}
          />
        </div>
      </div>

      <div className="save-date-arch-shell">
        <div className="save-date-arch-wrapper">
          <div
            className={`hero-photo-fade ${isDone ? "is-visible" : ""}`}
          >
            <figure
              className="save-date-arch-figure save-date-arch-figure--composite"
              aria-label="Khung ảnh cưới"
            >
              {/* SVG container which renders the masked image reliably across all browsers */}
              <svg
                viewBox="0 0 2000 1333"
                width="100%"
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
            className={`save-date-hero-ornament save-date-hero-ornament-left hero-ornament-fade-left ${isDone ? "is-visible" : ""}`}
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
            className={`save-date-hero-ornament save-date-hero-ornament-right hero-ornament-fade-right ${isDone ? "is-visible" : ""}`}
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
            <div className="save-date-invite-heading-image" aria-label="Trân trọng kính mời">
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
            <p className={`save-date-copy save-date-copy-arch ${summary?.guestName ? "save-date-guest-name" : ""}`}>
              {summary?.guestName ? (
                <HeroGuestNameText text={summary.guestName} />
              ) : (
                <CoupleNameText
                  text={invitationText}
                  coupleName={summary?.coupleDisplayName || config.content.names}
                />
              )}
            </p>
          </LineReveal>
        </article>
      </div>

      <a href="#details" className="save-date-scroll" aria-label="Xem thông tin tiệc">
        <ChevronDown aria-hidden="true" size={28} className="animate-bounce" />
      </a>
    </section>
  );
}
