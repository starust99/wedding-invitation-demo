"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, HeartHandshake, MapPin } from "lucide-react";
import { LineReveal, WriteReveal, FadeUp, useRevealReady } from "@/components/ui/CinematicReveal";
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

function compactDate(date: string) {
  return date.replace(/^Thứ\s+\S+,\s*/i, "");
}

function getVietnamWeddingTimestamp(date: string, time: string) {
  const dateMatch = date.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
  if (!dateMatch) return null;

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hour = timeMatch ? Number(timeMatch[1]) : 17;
  const minute = timeMatch ? Number(timeMatch[2]) : 30;

  return Date.UTC(year, month - 1, day, hour - 7, minute, 0);
}

function getCountdownParts(targetTimestamp: number | null, now: number | null) {
  if (!targetTimestamp || !now) {
    return { days: "--", hours: "--", minutes: "--", seconds: "--" };
  }

  const remaining = Math.max(0, targetTimestamp - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function CountdownRail({ targetTimestamp }: { targetTimestamp: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  const countdown = getCountdownParts(targetTimestamp, now);
  const countdownItems = [
    { label: "Ngày", value: countdown.days },
    { label: "Giờ", value: countdown.hours },
    { label: "Phút", value: countdown.minutes },
    { label: "Giây", value: countdown.seconds },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="save-date-countdown-grid">
      {countdownItems.map((item) => (
        <div className="save-date-countdown-item" key={item.label}>
          <strong suppressHydrationWarning>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ReferenceWeddingHero({ config, summary }: ReferenceWeddingHeroProps) {
  const dateText = compactDate(summary?.dateLabel || config.content.date);
  const countdownTime = summary?.welcomeTime || "17:30";
  const invitationText = summary?.invitationLine || config.content.description;
  const targetTimestamp = useMemo(() => getVietnamWeddingTimestamp(dateText, countdownTime), [dateText, countdownTime]);
  const isReady = useRevealReady(true); // Photo is always in view at top of page

  return (
    <section
      id="home"
      className="save-date-hero"
    >
      <div className="save-date-stack">
        <motion.article
          className="save-date-card save-date-photo-card"
          aria-label="Khung ảnh cưới"
          initial={{ opacity: 0, scale: 0.92, y: 30, filter: "blur(6px)" }}
          animate={isReady ? { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, scale: 0.92, y: 30, filter: "blur(6px)" }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <div className="save-date-photo-frame">
            <Image
              src="/assets/wedding/hero/np-1-183a.jpg"
              alt="Ảnh cưới Nhật và Phương"
              fill
              preload
              sizes="(max-width: 639px) 96vw, (max-width: 1023px) 38rem, 38rem"
              className="save-date-photo-image"
            />
          </div>
        </motion.article>

        <article className="save-date-card save-date-message-card">
          <FadeUp delay={0.2}>
            <div className="save-date-ornament" aria-hidden="true" />
          </FadeUp>
          <WriteReveal delay={0.4}>
            <h1 className="save-date-title">{config.content.names}</h1>
          </WriteReveal>
          <LineReveal delay={0.6}>
            <p className="save-date-copy">
              {summary?.guestGreeting ? `${summary.guestGreeting}. ` : summary?.guestName ? `Gửi ${summary.guestName}. ` : ""}
              {invitationText}
            </p>
          </LineReveal>

          <FadeUp delay={0.8} className="save-date-actions">
            <a href="#rsvp" className="save-date-watercolor-btn">
              <img src="/assets/wedding/ui/btn-rsvp.png" alt="" className="save-date-btn-bg" />
              <span className="save-date-btn-label">
                <HeartHandshake aria-hidden="true" size={18} />
                <span>Gửi hồi đáp</span>
              </span>
            </a>
            <a href="#details" className="save-date-watercolor-btn">
              <img src="/assets/wedding/ui/btn-map.png" alt="" className="save-date-btn-bg" />
              <span className="save-date-btn-label">
                <MapPin aria-hidden="true" size={18} />
                <span>{config.content.secondaryCta}</span>
              </span>
            </a>
          </FadeUp>
        </article>

        <article className="save-date-card save-date-countdown-card" aria-label="Đếm ngược đến lễ cưới">
          <div className="save-date-countdown-heading">
            <p>Save the date · 26.12.2026</p>
          </div>
          <CountdownRail targetTimestamp={targetTimestamp} />
        </article>
      </div>

      <a href="#details" className="save-date-scroll" aria-label="Xem thông tin tiệc">
        <ChevronDown aria-hidden="true" size={28} className="animate-bounce" />
      </a>
    </section>
  );
}
