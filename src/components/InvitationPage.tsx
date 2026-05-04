"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronRight, Clock, Flower2, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  fadeUp,
  heroImageMotion,
  luxuryTransition,
  scaleReveal,
  smoothTransition,
  staggerContainer,
  viewportOnce,
} from "@/lib/animations";
import type { WeddingConfig } from "@/lib/site-settings";

type Colors = WeddingConfig["theme"]["colors"];
const gold = "#D4AF37";
const cream = "#FDFBF7";
const deepGreen = "#2F3A35";

function tint(hex: string, alpha: string) {
  return `${hex}${alpha}`;
}

function FloralFrame() {
  return (
    <>
      <Image src="/floral-corner-rose.svg" alt="" width={260} height={260} className="pointer-events-none absolute -left-16 -top-16 z-0 h-48 w-48 opacity-85 sm:h-64 sm:w-64" />
      <Image src="/floral-corner-blue.svg" alt="" width={260} height={260} className="pointer-events-none absolute -bottom-16 -right-16 z-0 h-48 w-48 opacity-85 sm:h-64 sm:w-64" />
    </>
  );
}

function Flourish({ colors, className = "" }: { colors: Colors; className?: string }) {
  return (
    <svg viewBox="0 0 360 48" className={className} fill="none" aria-hidden="true">
      <path d="M24 25c48-32 86-32 132 0 44 30 86 30 180-5" stroke={gold} strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      <circle cx="180" cy="25" r="4" fill={colors.accent} />
      <path d="M132 25c16-18 32-18 48 0M196 25c18-20 38-20 58 0" stroke={colors.primary} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function Section({ eyebrow, title, colors, children, wide = false }: { eyebrow?: string; title: string; colors: Colors; children: React.ReactNode; wide?: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={`relative mx-auto w-full px-5 py-16 sm:px-8 lg:py-24 ${wide ? "max-w-7xl" : "max-w-6xl"}`}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUp}
      transition={luxuryTransition}
    >
      <div className="mx-auto max-w-3xl text-center">
        <Flourish colors={colors} className="mx-auto mb-5 h-8 w-48" />
        {eyebrow ? <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.42em]" style={{ color: gold }}>{eyebrow}</p> : null}
        <h2 className="font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl" style={{ color: deepGreen }}>{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function ButtonLink({ href, colors, children, variant = "primary" }: { href: string; colors: Colors; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className="group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full px-7 text-sm font-bold uppercase tracking-[0.12em] shadow-[0_18px_40px_rgba(47,58,53,0.14)] transition duration-500 hover:-translate-y-1"
      style={{
        backgroundColor: variant === "primary" ? gold : "rgba(255,255,255,0.72)",
        border: variant === "primary" ? `1px solid ${gold}` : `1px solid ${colors.border}`,
        color: variant === "primary" ? deepGreen : deepGreen,
      }}
    >
      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
      <span className="relative inline-flex items-center gap-1">{children}</span>
    </Link>
  );
}

function PaperCard({ colors, children, className = "" }: { colors: Colors; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden border shadow-[0_24px_70px_rgba(47,58,53,0.10)] ${className}`}
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.28]" style={{ backgroundImage: `radial-gradient(circle at 16% 20%, ${colors.accent} 0 1px, transparent 1px), radial-gradient(circle at 78% 64%, ${colors.primary} 0 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function formatDateForCover(dateLabel: string) {
  const match = dateLabel.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) return dateLabel;
  return `${match[1]} . ${match[2]} . ${match[3].slice(2)}`;
}

export function InvitationPage({ config }: { config: WeddingConfig }) {
  const reduceMotion = useReducedMotion();
  const colors = config.theme.colors;
  const monogram = `${config.couple.groom[0] ?? "N"}${config.couple.bride[0] ?? "P"}`.toUpperCase();

  return (
    <main className="min-h-screen overflow-hidden" style={{ backgroundColor: cream, color: deepGreen }}>
      <section className="relative isolate flex min-h-[100svh] items-center justify-center px-5 py-8 text-center text-white">
        <motion.div className="absolute inset-0" initial={reduceMotion ? false : heroImageMotion.initial} animate={heroImageMotion.animate} transition={{ duration: 2.4, ease: "easeOut" }}>
          <Image src={config.hero.coverImage} alt="Enchanted garden wedding cover" fill priority unoptimized className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#2F3A35]/35 via-[#2F3A35]/18 to-[#2F3A35]/58" />
        <div className="absolute inset-0 border-[12px] border-white/18 sm:border-[20px]" />
        <div className="absolute inset-5 border border-white/35 sm:inset-8" />
        <Image src="/floral-corner-rose.svg" alt="" width={320} height={320} className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 opacity-90 sm:h-80 sm:w-80" />
        <Image src="/floral-corner-blue.svg" alt="" width={320} height={320} className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 opacity-90 sm:h-80 sm:w-80" />

        <motion.div className="relative z-10 mx-auto max-w-xl" initial={reduceMotion ? false : "hidden"} animate="visible" variants={staggerContainer}>
          <motion.div variants={scaleReveal} transition={luxuryTransition} className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-white/55 bg-white/18 font-serif text-5xl font-semibold tracking-tighter text-white shadow-2xl backdrop-blur-md sm:h-36 sm:w-36 sm:text-6xl">
            <span className="text-[#D4AF37] drop-shadow">{monogram}</span>
          </motion.div>
          <motion.p variants={fadeUp} transition={smoothTransition} className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.48em] text-white/78">Wedding Celebration</motion.p>
          <motion.h1 variants={fadeUp} transition={luxuryTransition} className="mt-4 font-serif text-6xl font-semibold leading-[0.9] tracking-tight text-white drop-shadow-sm sm:text-8xl">
            {config.couple.displayName}
          </motion.h1>
          <motion.div variants={fadeUp} transition={smoothTransition} className="mx-auto mt-7 h-px w-36 bg-[#D4AF37]" />
          <motion.p variants={fadeUp} transition={smoothTransition} className="mt-7 text-sm font-bold uppercase tracking-[0.46em] text-white/88 sm:text-base">{formatDateForCover(config.event.dateLabel)}</motion.p>
          <motion.p variants={fadeUp} transition={smoothTransition} className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/78">{config.venue.name} · {config.venue.location}</motion.p>
        </motion.div>

        {!reduceMotion ? (
          <motion.div className="absolute bottom-8 z-10 text-white/80" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="h-7 w-7" />
          </motion.div>
        ) : null}
      </section>

      <section className="relative bg-[#FDFBF7] px-5 py-18 sm:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-60" style={{ background: `linear-gradient(180deg, ${tint(colors.accent, "26")}, transparent 42%, ${tint(colors.primary, "1f")})` }} />
        <div className="relative mx-auto max-w-5xl">
          <PaperCard colors={colors} className="rounded-[2.5rem] px-7 py-12 text-center sm:px-14 sm:py-16">
            <FloralFrame />
            <div className="relative z-10 mx-auto max-w-3xl">
              <Flower2 className="mx-auto h-8 w-8" style={{ color: gold }} />
              <p className="mt-5 text-[0.7rem] font-bold uppercase tracking-[0.42em]" style={{ color: colors.primary }}>The invitation</p>
              <h2 className="mt-4 font-serif text-5xl font-semibold leading-none sm:text-7xl" style={{ color: deepGreen }}>{config.invitation.title}</h2>
              <p className="mx-auto mt-8 max-w-2xl text-xl leading-9" style={{ color: colors.muted }}>{config.invitation.message}</p>
              <p className="mt-9 font-serif text-4xl" style={{ color: gold }}>{config.invitation.closing}</p>
            </div>
          </PaperCard>
        </div>
      </section>

      <Section eyebrow="Wedding Reception" title="Event Details" colors={colors} wide>
        <motion.div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" variants={staggerContainer} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewportOnce}>
          {[["Đón khách", config.event.welcomeTime], ["Ceremony", config.event.ceremonyTime], ["Khai tiệc", config.event.dinnerTime], ["After party", config.event.afterPartyTime]].map(([label, value]) => (
            <motion.div key={label} variants={scaleReveal} transition={smoothTransition}>
              <PaperCard colors={colors} className="rounded-[2rem] p-6 text-center transition duration-500 hover:-translate-y-2">
                <Clock className="mx-auto mb-5 h-5 w-5" style={{ color: gold }} />
                <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: colors.muted }}>{label}</p>
                <p className="mt-3 font-serif text-5xl" style={{ color: deepGreen }}>{value}</p>
              </PaperCard>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section eyebrow="Our Evening" title="A Garden Timeline" colors={colors}>
        <motion.div className="relative mx-auto mt-12 grid max-w-4xl gap-5" variants={staggerContainer} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewportOnce}>
          <div className="absolute bottom-8 left-[2.45rem] top-8 w-px sm:left-[3.45rem]" style={{ backgroundColor: tint(gold, "88") }} />
          {config.timeline.map((item) => (
            <motion.div key={item.time} variants={fadeUp} transition={smoothTransition} className="relative grid grid-cols-[5rem_1fr] gap-4 sm:grid-cols-[7rem_1fr]">
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border bg-[#FDFBF7] font-serif text-2xl shadow-sm sm:h-20 sm:w-20" style={{ borderColor: gold, color: colors.primary }}>{item.time}</div>
              <PaperCard colors={colors} className="rounded-[1.8rem] p-5">
                <h3 className="font-serif text-3xl" style={{ color: deepGreen }}>{item.title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: colors.muted }}>{item.description}</p>
              </PaperCard>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section eyebrow="Venue" title={config.venue.name} colors={colors} wide>
        <PaperCard colors={colors} className="mt-12 grid overflow-hidden rounded-[2.6rem] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[360px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})` }}>
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 24% 24%, white 0 8%, transparent 28%), radial-gradient(circle at 82% 76%, white 0 7%, transparent 24%)" }} />
            <Image src="/floral-corner-rose.svg" alt="" width={300} height={300} className="absolute -left-20 -top-20 h-72 w-72 opacity-70" />
            <Image src="/floral-corner-blue.svg" alt="" width={300} height={300} className="absolute -bottom-20 -right-20 h-72 w-72 opacity-70" />
            <div className="relative z-10 flex h-full min-h-[360px] flex-col justify-between p-8 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.32em] text-white/82">{config.venue.area}</p>
              <div>
                <p className="font-serif text-6xl leading-none">Hồ Tuyền Lâm</p>
                <p className="mt-5 max-w-sm leading-7 text-white/82">{config.venue.note}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>Where to arrive</p>
            <p className="mt-5 text-xl leading-9" style={{ color: colors.muted }}>{config.venue.address}</p>
            <div className="mt-8"><ButtonLink href={config.venue.mapUrl} colors={colors} variant="secondary">Mở Google Maps</ButtonLink></div>
          </div>
        </PaperCard>
      </Section>

      <Section eyebrow="Dress Code" title={config.dressCode.title} colors={colors}>
        <PaperCard colors={colors} className="mx-auto mt-10 max-w-3xl rounded-[2.2rem] p-8 text-center">
          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {config.dressCode.colors.map((color, index) => (
              <motion.span key={color} className="h-14 w-14 rounded-full border shadow-sm" style={{ backgroundColor: color, borderColor: index === 2 ? gold : colors.border }} initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ ...smoothTransition, delay: index * 0.07 }} />
            ))}
          </div>
          <p className="text-lg leading-8" style={{ color: colors.muted }}>{config.dressCode.note}</p>
        </PaperCard>
      </Section>

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-12 sm:px-8 lg:grid-cols-2">
        {[{ eyebrow: "Da Lat Weather", title: config.weatherNote.title, text: config.weatherNote.description }, { eyebrow: "Accommodation", title: config.accommodation.title, text: config.accommodation.description }].map((card) => (
          <motion.div key={card.eyebrow} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewportOnce} variants={scaleReveal} transition={luxuryTransition}>
            <PaperCard colors={colors} className="h-full rounded-[2.2rem] p-8 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>{card.eyebrow}</p>
              <h2 className="mt-4 font-serif text-4xl" style={{ color: deepGreen }}>{card.title}</h2>
              <p className="mt-5 leading-7" style={{ color: colors.muted }}>{card.text}</p>
              {card.eyebrow === "Accommodation" ? <p className="mt-6 rounded-full px-4 py-3 text-sm" style={{ backgroundColor: tint(colors.primary, "1f"), color: deepGreen }}>Deadline RSVP: {config.rsvp.deadline}</p> : null}
            </PaperCard>
          </motion.div>
        ))}
      </section>

      <Section eyebrow="Gallery" title="Moments in Bloom" colors={colors} wide>
        <motion.div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={staggerContainer} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewportOnce}>
          {config.gallery.map((src, index) => (
            <motion.div key={`${src}-${index}`} variants={scaleReveal} transition={smoothTransition} className={`relative overflow-hidden rounded-[2rem] border bg-white p-2 shadow-[0_24px_70px_rgba(47,58,53,0.10)] ${index % 2 === 0 ? "aspect-[4/5]" : "aspect-[4/5] lg:mt-10"}`} style={{ borderColor: colors.border }}>
              <div className="relative h-full overflow-hidden rounded-[1.5rem]">
                <Image src={src} alt={`Wedding gallery ${index + 1}`} fill unoptimized className="object-cover transition duration-700 hover:scale-110" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <section className="px-5 pb-16 pt-4 sm:px-8 lg:pb-28">
        <motion.div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.8rem] p-9 text-center text-white shadow-[0_34px_100px_rgba(47,58,53,0.18)] sm:p-14" initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewportOnce} variants={scaleReveal} transition={luxuryTransition} style={{ background: `linear-gradient(135deg, ${deepGreen}, ${colors.primary})` }}>
          <Image src="/floral-corner-rose.svg" alt="" width={280} height={280} className="absolute -left-20 -top-20 h-64 w-64 opacity-40" />
          <Image src="/floral-corner-blue.svg" alt="" width={280} height={280} className="absolute -bottom-20 -right-20 h-64 w-64 opacity-40" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.42em]" style={{ color: gold }}>RSVP</p>
            <h2 className="mt-5 font-serif text-6xl leading-none">Hẹn gặp bạn ở Đà Lạt</h2>
            <p className="mx-auto mt-6 max-w-2xl leading-8 text-white/76">Hãy xác nhận tham dự và cho chúng mình biết nhu cầu lưu trú để chuẩn bị chu đáo hơn.</p>
            <Link href="/rsvp" className="group mt-9 inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-bold uppercase tracking-[0.12em] shadow-xl transition duration-500 hover:-translate-y-1" style={{ backgroundColor: gold, color: deepGreen }}>
              Điền RSVP <ChevronRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
