"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { ArrowDown, CalendarDays, MapPin } from "lucide-react";
import type { WeddingConfig } from "@/lib/site-settings";
import { formatGuestName, type GuestIdentity } from "@/lib/guest-personalization";

type HeroLayer = WeddingConfig["appearance"]["mediaLayers"]["hero"][number];

function getWeddingTime(date: string) {
  const parsed = new Date(`${date}T00:00:00+07:00`).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function getCountdownParts(targetTime: number) {
  const distance = Math.max(0, targetTime - Date.now());
  const seconds = Math.floor(distance / 1000);

  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
}

function getHeroLayer(config: WeddingConfig): HeroLayer | undefined {
  return config.appearance.mediaLayers.hero.find((layer) => layer.src || layer.mobileSrc);
}

function getHeroSources(config: WeddingConfig) {
  const layer = getHeroLayer(config);
  const desktop = config.hero.coverImage || layer?.src || "/hero-editorial-couple.svg";
  const mobile = config.hero.mobileCoverImage || layer?.mobileSrc || desktop;

  return {
    desktop,
    mobile,
    alt: layer?.alt || config.sections.hero.imageAlt || "Wedding editorial cover",
    desktopPosition: layer?.objectPosition.desktop || "center center",
    mobilePosition: layer?.objectPosition.mobile || "center center",
  };
}

function CoupleTitle({ name }: { name: string }) {
  const parts = name.split(/\s*&\s*/);

  if (parts.length === 2) {
    return (
      <h1 className="mt-4 max-w-[18rem] font-serif text-[3.35rem] leading-[0.88] text-[#252934] sm:max-w-[42rem] sm:text-[6.1rem] lg:max-w-[50rem] lg:text-[7.4rem] xl:text-[8.6rem]">
        <span className="block">{parts[0]}</span>
        <span className="block">&amp; {parts[1]}</span>
      </h1>
    );
  }

  return (
    <h1 className="mt-4 max-w-[18rem] break-words font-serif text-[3.35rem] leading-[0.88] text-[#252934] sm:max-w-[42rem] sm:text-[6.1rem] lg:max-w-[50rem] lg:text-[7.4rem] xl:text-[8.6rem]">
      {name}
    </h1>
  );
}

function HeroPhotoBackdrop({ config, progress }: { config: WeddingConfig; progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const source = getHeroSources(config);
  const imageY = useTransform(progress, [0, 1], [0, 70]);
  const imageScale = useTransform(progress, [0, 1], [1.03, 1.09]);

  return (
    <motion.div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ y: imageY, scale: imageScale }}>
      <picture>
        <source media="(max-width: 639px)" srcSet={source.mobile} />
        <img
          src={source.desktop}
          alt=""
          fetchPriority="high"
          className="hero-editorial-photo h-full w-full object-cover"
          style={{
            "--hero-desktop-position": source.desktopPosition,
            "--hero-mobile-position": source.mobilePosition,
          } as CSSProperties}
        />
      </picture>
    </motion.div>
  );
}

function CountdownLine({ countdown }: { countdown: ReturnType<typeof getCountdownParts> }) {
  const units = [
    { value: countdown.days, label: "ngày" },
    { value: countdown.hours, label: "giờ" },
    { value: countdown.minutes, label: "phút" },
    { value: countdown.seconds, label: "giây" },
  ];

  return (
    <motion.div
      className="hero-countdown-line"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.48, duration: 0.64, ease: "easeOut" }}
      aria-label="Đếm ngược đến ngày cưới"
    >
      <span className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-[#252934]/48">Còn</span>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:gap-x-5">
        {units.map((unit) => (
          <span key={unit.label} className="inline-flex items-baseline gap-1.5">
            <span className="font-serif text-2xl leading-none text-[#252934] sm:text-3xl">{String(unit.value).padStart(2, "0")}</span>
            <span className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-[#252934]/46">{unit.label}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function HeroMetaBar({ config }: { config: WeddingConfig }) {
  return (
    <motion.div
      className="hero-soft-caption"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.36, duration: 0.68, ease: "easeOut" }}
    >
      <div className="flex items-start gap-3">
        <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-serenity" />
        <p>
          <span className="block font-bold text-[#252934]">{config.event.dateLabel}</span>
          <span className="mt-1 block text-[#252934]/56">Đón khách {config.event.welcomeTime} · Ceremony {config.event.ceremonyTime}</span>
        </p>
      </div>
      <div className="flex items-start gap-3">
        <MapPin className="mt-1 h-4 w-4 shrink-0 text-serenity" />
        <p>
          <span className="block font-bold text-[#252934]">{config.venue.name}</span>
          <span className="mt-1 block text-[#252934]/56">{config.venue.location}</span>
        </p>
      </div>
    </motion.div>
  );
}

function HeroEditorialCopy({
  config,
  guestIdentity,
  countdown,
  y,
}: {
  config: WeddingConfig;
  guestIdentity: GuestIdentity;
  countdown: ReturnType<typeof getCountdownParts>;
  y: MotionValue<number>;
}) {
  return (
    <motion.div
      className="hero-editorial-copy"
      style={{ y }}
      initial={{ opacity: 0, y: 34 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.82, ease: "easeOut" }}
    >
      <motion.p
        className="text-[0.66rem] font-black uppercase tracking-[0.36em] text-[#252934]/52"
        initial={{ opacity: 0, letterSpacing: "0.52em" }}
        animate={{ opacity: 1, letterSpacing: "0.36em" }}
        transition={{ duration: 0.92, ease: "easeOut" }}
      >
        Private Wedding Invitation
      </motion.p>

      <CoupleTitle name={config.couple.displayName} />

      <div className="mt-6 max-w-[22rem] border-l border-[#252934]/14 pl-5 sm:max-w-[34rem] sm:pl-6">
        <p className="text-base leading-7 text-[#252934]/68 sm:text-xl sm:leading-8">
          Một lời mời riêng dành cho {formatGuestName(guestIdentity)} trong ngày tụi mình bắt đầu một chương mới.
        </p>
        <p className="mt-3 text-sm leading-7 text-[#252934]/54 sm:text-base">
          {config.event.dateLabel} · {config.venue.location}
        </p>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <a
          href="#rsvp"
          className="light-sweep inline-flex min-h-12 items-center justify-center rounded-full bg-[#252934] px-6 text-xs font-black uppercase tracking-[0.22em] text-white shadow-[0_18px_50px_rgba(37,41,52,0.18)] transition hover:-translate-y-0.5"
        >
          Xác nhận tham dự
        </a>
        <a
          href={config.venue.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#252934]/16 bg-white/42 px-6 text-xs font-black uppercase tracking-[0.22em] text-[#252934] backdrop-blur-xl transition hover:-translate-y-0.5"
        >
          Xem địa điểm
        </a>
      </div>

      <CountdownLine countdown={countdown} />
    </motion.div>
  );
}

export function HeroSaveTheDate({ config, guestIdentity }: { config: WeddingConfig; guestIdentity: GuestIdentity }) {
  const sectionRef = useRef<HTMLElement>(null);
  const weddingTime = useMemo(() => getWeddingTime(config.couple.date), [config.couple.date]);
  const [countdown, setCountdown] = useState(() => getCountdownParts(weddingTime));
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -74]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.62]);

  useEffect(() => {
    const tick = () => setCountdown(getCountdownParts(weddingTime));
    const initialTimer = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [weddingTime]);

  return (
    <section ref={sectionRef} className="cinematic-stage hero-editorial relative min-h-[100dvh] bg-cream text-[#252934]">
      <HeroPhotoBackdrop config={config} progress={scrollYProgress} />
      <motion.div aria-hidden="true" className="hero-photo-vignette absolute inset-0" style={{ opacity: overlayOpacity }} />
      <div aria-hidden="true" className="paper-grain-luxury absolute inset-0" />

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[92rem] flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <motion.header
          className="flex items-start justify-between gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="text-[0.62rem] font-black uppercase tracking-[0.32em] text-[#252934]/52">{config.sections.hero.eyebrow}</p>
          <p className="hidden text-right text-[0.62rem] font-black uppercase leading-5 tracking-[0.24em] text-[#252934]/46 sm:block">
            Rose Quartz · Serenity
          </p>
        </motion.header>

        <div className="grid flex-1 content-end pb-8 pt-16 sm:content-center sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,31rem)] lg:gap-10">
          <HeroEditorialCopy config={config} guestIdentity={guestIdentity} countdown={countdown} y={copyY} />
          <div className="hidden self-end lg:block">
            <HeroMetaBar config={config} />
          </div>
        </div>

        <div className="lg:hidden">
          <HeroMetaBar config={config} />
        </div>
      </div>

      <motion.a
        href="#invitation"
        aria-label="Cuộn xuống lời mời"
        className="absolute bottom-4 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border border-[#252934]/10 bg-white/28 text-[#252934] backdrop-blur-xl"
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="h-5 w-5" />
      </motion.a>
    </section>
  );
}
