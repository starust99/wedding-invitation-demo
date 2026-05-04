"use client";

import Image from "next/image";
import Link from "next/link";
import { BackgroundMediaLayers } from "@/components/BackgroundMediaLayer";
import { CalendarDays, ChevronDown, ChevronRight, Flower2, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  editorialFade,
  heroImageMotion,
  interactiveMotion,
  motionScenes,
  petalReveal,
  premiumTransition,
  slowRevealTransition,
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

function hydrateTemplate(template: string, config: WeddingConfig) {
  return template
    .replaceAll("{venueName}", config.venue.name)
    .replaceAll("{venueLocation}", config.venue.location)
    .replaceAll("{venueArea}", config.venue.area)
    .replaceAll("{eventDate}", formatDateForCover(config.event.dateLabel));
}

function backgroundStyle(key: string, colors: Colors) {
  if (key === "softGradient") return { background: `linear-gradient(180deg, ${tint(colors.accent, "26")}, transparent 42%, ${tint(colors.primary, "1f")})` };
  if (key === "accentGradient") return { background: `linear-gradient(135deg, ${tint(colors.accent, "24")}, ${tint(colors.primary, "16")})` };
  if (key === "card") return { backgroundColor: colors.card };
  if (key === "primaryGradient") return { background: `linear-gradient(135deg, ${deepGreen}, ${colors.primary})` };
  return { backgroundColor: cream };
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

function Section({ eyebrow, title, colors, children, wide = false, introAlign = "center", showFlourish = true, description }: { eyebrow?: string; title: string; colors: Colors; children: React.ReactNode; wide?: boolean; introAlign?: "center" | "left"; showFlourish?: boolean; description?: string }) {
  const reduceMotion = useReducedMotion();
  const centered = introAlign === "center";

  return (
    <motion.section
      className={`relative mx-auto w-full px-5 py-16 sm:px-8 lg:py-24 ${wide ? "max-w-7xl" : "max-w-6xl"}`}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={viewportOnce}
      variants={editorialFade}
      transition={premiumTransition}
    >
      <div className={`${centered ? "mx-auto text-center" : "text-left"} max-w-3xl`}>
        {showFlourish ? <Flourish colors={colors} className={`${centered ? "mx-auto" : ""} mb-5 h-8 w-48`} /> : <div className="mb-5 h-px w-24" style={{ backgroundColor: gold }} />}
        {eyebrow ? <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.42em]" style={{ color: gold }}>{eyebrow}</p> : null}
        <h2 className="font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl" style={{ color: deepGreen }}>{title}</h2>
        {description ? <p className={`${centered ? "mx-auto" : ""} mt-5 max-w-2xl text-lg leading-8`} style={{ color: colors.muted }}>{description}</p> : null}
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
  const sections = config.sections;
  const backgrounds = config.appearance.backgrounds;
  const monogram = `${config.couple.groom[0] ?? "N"}${config.couple.bride[0] ?? "P"}`.toUpperCase();
  const motionInitial = reduceMotion ? false : "hidden";
  const itineraryTimes = [config.event.welcomeTime, config.event.ceremonyTime, config.event.dinnerTime, config.event.afterPartyTime];

  return (
    <main className="min-h-screen overflow-hidden" style={{ ...backgroundStyle(backgrounds.page, colors), color: deepGreen }}>
      <section className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-8 text-center text-white" style={backgroundStyle(backgrounds.hero, colors)}>
        <motion.div className="absolute inset-0" initial={reduceMotion ? false : heroImageMotion.initial} animate={heroImageMotion.animate} transition={slowRevealTransition}>
          <BackgroundMediaLayers layers={config.appearance.mediaLayers.hero} reduceMotion={reduceMotion} />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#2F3A35]/35 via-[#2F3A35]/18 to-[#2F3A35]/58" />
        <div className="absolute inset-0 border-[12px] border-white/18 sm:border-[20px]" />
        <div className="absolute inset-5 border border-white/35 sm:inset-8" />
        <Image src="/floral-corner-rose.svg" alt="" width={320} height={320} className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 opacity-90 sm:h-80 sm:w-80" />
        <Image src="/floral-corner-blue.svg" alt="" width={320} height={320} className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 opacity-90 sm:h-80 sm:w-80" />

        <motion.div className="relative z-10 mx-auto max-w-xl" initial={motionInitial} animate="visible" variants={motionScenes.hero.container}>
          <motion.div variants={motionScenes.hero.monogram} transition={premiumTransition} className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-white/55 bg-white/18 font-serif text-5xl font-semibold tracking-tighter text-white shadow-2xl backdrop-blur-md sm:h-36 sm:w-36 sm:text-6xl">
            <span className="text-[#D4AF37] drop-shadow">{monogram}</span>
          </motion.div>
          <motion.p variants={motionScenes.hero.detail} transition={premiumTransition} className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.48em] text-white/78">{sections.hero.eyebrow}</motion.p>
          <motion.h1 variants={motionScenes.hero.title} transition={slowRevealTransition} className="mt-4 font-serif text-6xl font-semibold leading-[0.9] tracking-tight text-white drop-shadow-sm sm:text-8xl">
            {config.couple.displayName}
          </motion.h1>
          <motion.div variants={motionScenes.hero.divider} transition={premiumTransition} className="mx-auto mt-7 h-px w-36 origin-center bg-[#D4AF37]" />
          <motion.p variants={motionScenes.hero.detail} transition={premiumTransition} className="mt-7 text-sm font-bold uppercase tracking-[0.46em] text-white/88 sm:text-base">{formatDateForCover(config.event.dateLabel)}</motion.p>
          <motion.p variants={motionScenes.hero.detail} transition={premiumTransition} className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/78">{hydrateTemplate(sections.hero.locationLine, config)}</motion.p>
        </motion.div>

        {sections.hero.showScrollCue && !reduceMotion ? (
          <motion.div className="absolute bottom-8 z-10 text-white/80" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="h-7 w-7" />
          </motion.div>
        ) : null}
      </section>

      <section className="relative overflow-hidden px-5 py-18 sm:px-8 lg:py-24" style={backgroundStyle(backgrounds.invitation, colors)}>
        <BackgroundMediaLayers layers={config.appearance.mediaLayers.invitation} reduceMotion={reduceMotion} />
        <div className="absolute inset-0 z-0 opacity-60" style={backgroundStyle(backgrounds.invitation, colors)} />
        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div initial={motionInitial} whileInView="visible" viewport={viewportOnce} variants={motionScenes.invitation.card} transition={slowRevealTransition}>
            <PaperCard colors={colors} className="rounded-[2.5rem] px-7 py-12 text-center sm:px-14 sm:py-16">
              <FloralFrame />
              <motion.div className="relative z-10 mx-auto max-w-3xl" variants={motionScenes.invitation.container}>
                <motion.div variants={motionScenes.invitation.item} transition={premiumTransition}><Flower2 className="mx-auto h-8 w-8" style={{ color: gold }} /></motion.div>
                <motion.p variants={motionScenes.invitation.item} transition={premiumTransition} className="mt-5 text-[0.7rem] font-bold uppercase tracking-[0.42em]" style={{ color: colors.primary }}>{sections.invitation.eyebrow}</motion.p>
                <motion.h2 variants={editorialFade} transition={slowRevealTransition} className="mt-4 font-serif text-5xl font-semibold leading-none sm:text-7xl" style={{ color: deepGreen }}>{config.invitation.title}</motion.h2>
                <motion.p variants={motionScenes.invitation.item} transition={premiumTransition} className="mx-auto mt-8 max-w-2xl text-xl leading-9" style={{ color: colors.muted }}>{config.invitation.message}</motion.p>
                <motion.p variants={motionScenes.invitation.item} transition={premiumTransition} className="mt-9 font-serif text-4xl" style={{ color: gold }}>{config.invitation.closing}</motion.p>
              </motion.div>
            </PaperCard>
          </motion.div>
        </div>
      </section>

      <div className="relative overflow-hidden" style={backgroundStyle(backgrounds.itinerary, colors)}>
        <BackgroundMediaLayers layers={config.appearance.mediaLayers.itinerary} reduceMotion={reduceMotion} />
        <div className="relative z-10">
        <Section eyebrow={sections.itinerary.eyebrow} title={sections.itinerary.title} colors={colors} wide introAlign="left" showFlourish={false} description={sections.itinerary.description}>
        <PaperCard colors={colors} className="mt-10 rounded-[2.6rem] p-6 sm:p-8 lg:p-10">
          <motion.div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center" variants={motionScenes.itinerary.container} initial={motionInitial} whileInView="visible" viewport={viewportOnce}>
            <motion.div variants={motionScenes.itinerary.left} transition={premiumTransition} whileHover={reduceMotion ? undefined : interactiveMotion.gentleLift} className="rounded-[2rem] p-6" style={{ background: `linear-gradient(135deg, ${tint(colors.accent, "26")}, ${tint(colors.primary, "1f")})` }}>
              <CalendarDays className="mb-6 h-6 w-6" style={{ color: gold }} />
              <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: colors.primary }}>{sections.itinerary.cardEyebrow}</p>
              <p className="mt-4 font-serif text-5xl leading-none sm:text-6xl" style={{ color: deepGreen }}>{formatDateForCover(config.event.dateLabel)}</p>
              <div className="mt-6 h-px w-24" style={{ backgroundColor: gold }} />
              <p className="mt-6 max-w-sm leading-7" style={{ color: colors.muted }}>{hydrateTemplate(sections.itinerary.cardDescription, config)}</p>
            </motion.div>
            <motion.div variants={motionScenes.itinerary.right} transition={premiumTransition} className="divide-y" style={{ borderColor: colors.border }}>
              {sections.itinerary.items.map((item, index) => (
                <div key={item.label} className="grid grid-cols-[6rem_1fr] gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[8rem_1fr]">
                  <p className="font-serif text-4xl leading-none sm:text-5xl" style={{ color: colors.primary }}>{itineraryTimes[index]}</p>
                  <div>
                    <p className="font-serif text-3xl leading-none" style={{ color: deepGreen }}>{item.label}</p>
                    <p className="mt-2 text-sm leading-6" style={{ color: colors.muted }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </PaperCard>
        </Section>
        </div>
      </div>

      <div className="relative overflow-hidden" style={backgroundStyle(backgrounds.timeline, colors)}>
        <BackgroundMediaLayers layers={config.appearance.mediaLayers.timeline} reduceMotion={reduceMotion} />
        <div className="relative z-10">
        <Section eyebrow={sections.timeline.eyebrow} title={sections.timeline.title} colors={colors}>
        <motion.div className="relative mx-auto mt-12 grid max-w-4xl gap-5" variants={motionScenes.timeline.container} initial={motionInitial} whileInView="visible" viewport={viewportOnce}>
          <motion.div className="absolute bottom-8 left-[2.45rem] top-8 w-px origin-top sm:left-[3.45rem]" variants={motionScenes.timeline.line} transition={slowRevealTransition} style={{ backgroundColor: tint(gold, "88") }} />
          {config.timeline.map((item, index) => (
            <motion.div key={item.time} variants={index % 2 === 0 ? motionScenes.timeline.even : motionScenes.timeline.odd} transition={premiumTransition} whileHover={reduceMotion ? undefined : interactiveMotion.gentleLift} whileTap={reduceMotion ? undefined : interactiveMotion.tap} className="relative grid grid-cols-[5rem_1fr] gap-4 sm:grid-cols-[7rem_1fr]">
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border bg-[#FDFBF7] font-serif text-2xl shadow-sm sm:h-20 sm:w-20" style={{ borderColor: gold, color: colors.primary }}>{item.time}</div>
              <PaperCard colors={colors} className="rounded-[1.8rem] p-5">
                <h3 className="font-serif text-3xl" style={{ color: deepGreen }}>{item.title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: colors.muted }}>{item.description}</p>
              </PaperCard>
            </motion.div>
          ))}
        </motion.div>
        </Section>
        </div>
      </div>

      <div className="relative overflow-hidden" style={backgroundStyle(backgrounds.venue, colors)}>
        <BackgroundMediaLayers layers={config.appearance.mediaLayers.venue} reduceMotion={reduceMotion} />
        <div className="relative z-10">
        <Section eyebrow={sections.venue.eyebrow} title={config.venue.name} colors={colors} wide showFlourish={false} description={sections.venue.description}>
        <PaperCard colors={colors} className="mt-10 rounded-[2.6rem]">
          <motion.div className="grid overflow-hidden rounded-[2.6rem] lg:grid-cols-[1fr_1fr] lg:items-stretch" initial={motionInitial} whileInView="visible" viewport={viewportOnce} variants={motionScenes.venue.container}>
            <motion.div variants={motionScenes.venue.visual} transition={premiumTransition} whileHover={reduceMotion ? undefined : interactiveMotion.gentleLift} className="relative overflow-hidden p-7 sm:p-10 lg:flex lg:items-end" style={{ background: `linear-gradient(135deg, ${tint(colors.accent, "e6")}, ${tint(colors.primary, "e6")})` }}>
              <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "radial-gradient(circle at 24% 24%, white 0 8%, transparent 28%), radial-gradient(circle at 82% 76%, white 0 7%, transparent 24%)" }} />
              <Image src="/floral-corner-rose.svg" alt="" width={300} height={300} className="absolute -left-20 -top-20 h-72 w-72 opacity-70" />
              <Image src="/floral-corner-blue.svg" alt="" width={300} height={300} className="absolute -bottom-20 -right-20 h-72 w-72 opacity-70" />
              <div className="relative z-10 w-full rounded-[2rem] border border-white/45 bg-white/20 p-6 text-white shadow-[0_24px_70px_rgba(47,58,53,0.14)] backdrop-blur-md sm:p-8">
                <MapPin className="mb-8 h-7 w-7" style={{ color: gold }} />
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/82">{hydrateTemplate(sections.venue.visualEyebrow, config)}</p>
                <p className="mt-4 font-serif text-5xl leading-none sm:text-6xl">{sections.venue.visualTitle}</p>
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.26em] text-white/78">{config.venue.location}</p>
                <p className="mt-6 max-w-md leading-7 text-white/82">{config.venue.note}</p>
              </div>
            </motion.div>
            <motion.div variants={motionScenes.venue.details} transition={premiumTransition} className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>{sections.venue.detailEyebrow}</p>
              <p className="mt-5 font-serif text-4xl leading-tight sm:text-5xl" style={{ color: deepGreen }}>{config.venue.address}</p>
              <div className="mt-8 grid gap-3 text-sm" style={{ color: colors.muted }}>
                <p><span className="font-bold uppercase tracking-[0.18em]" style={{ color: colors.primary }}>{sections.venue.areaLabel}</span> · {config.venue.area}</p>
                <p><span className="font-bold uppercase tracking-[0.18em]" style={{ color: colors.primary }}>{sections.venue.locationLabel}</span> · {config.venue.location}</p>
              </div>
              <div className="mt-8"><ButtonLink href={config.venue.mapUrl} colors={colors} variant="secondary">{sections.venue.mapButtonLabel}</ButtonLink></div>
            </motion.div>
          </motion.div>
        </PaperCard>
        </Section>
        </div>
      </div>

      <div className="relative overflow-hidden" style={backgroundStyle(backgrounds.dressCode, colors)}>
        <BackgroundMediaLayers layers={config.appearance.mediaLayers.dressCode} reduceMotion={reduceMotion} />
        <div className="relative z-10">
        <Section eyebrow={sections.dressCode.eyebrow} title={config.dressCode.title} colors={colors}>
        <PaperCard colors={colors} className="mx-auto mt-10 max-w-3xl rounded-[2.2rem] p-8 text-center">
          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {config.dressCode.colors.map((color, index) => (
              <motion.span key={color} className="h-14 w-14 rounded-full border shadow-sm" style={{ backgroundColor: color, borderColor: index === 2 ? gold : colors.border }} initial={motionInitial} whileInView="visible" viewport={viewportOnce} variants={petalReveal} transition={{ ...premiumTransition, delay: index * 0.08 }} />
            ))}
          </div>
          <p className="text-lg leading-8" style={{ color: colors.muted }}>{config.dressCode.note}</p>
        </PaperCard>
        </Section>
        </div>
      </div>

      <section className="relative mx-auto w-full max-w-6xl overflow-hidden px-5 py-10 sm:px-8 lg:py-16" style={backgroundStyle(backgrounds.guestNotes, colors)}>
        <BackgroundMediaLayers layers={config.appearance.mediaLayers.guestNotes} reduceMotion={reduceMotion} />
        <motion.div className="relative z-10" initial={motionInitial} whileInView="visible" viewport={viewportOnce} variants={petalReveal} transition={premiumTransition}>
          <PaperCard colors={colors} className="rounded-[2.6rem] p-7 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <div className="mb-6 h-px w-24" style={{ backgroundColor: gold }} />
                <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>{sections.guestNotes.eyebrow}</p>
                <h2 className="mt-4 font-serif text-5xl leading-none" style={{ color: deepGreen }}>{sections.guestNotes.title}</h2>
                <p className="mt-5 leading-7" style={{ color: colors.muted }}>{sections.guestNotes.description}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {[{ eyebrow: sections.guestNotes.weatherEyebrow, title: config.weatherNote.title, text: config.weatherNote.description }, { eyebrow: sections.guestNotes.accommodationEyebrow, title: config.accommodation.title, text: config.accommodation.description }].map((card) => (
                  <div key={card.eyebrow} className="rounded-[1.8rem] border p-6" style={{ borderColor: colors.border, background: `linear-gradient(180deg, white, ${tint(card.eyebrow === sections.guestNotes.accommodationEyebrow ? colors.primary : colors.accent, "14")})` }}>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>{card.eyebrow}</p>
                    <h3 className="mt-4 font-serif text-3xl leading-none" style={{ color: deepGreen }}>{card.title}</h3>
                    <p className="mt-4 text-sm leading-7" style={{ color: colors.muted }}>{card.text}</p>
                    {card.eyebrow === sections.guestNotes.accommodationEyebrow ? <p className="mt-5 border-t pt-4 text-xs font-bold uppercase tracking-[0.18em]" style={{ borderColor: colors.border, color: deepGreen }}>{sections.guestNotes.rsvpDeadlinePrefix} {config.rsvp.deadline}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </PaperCard>
        </motion.div>
      </section>

      <div className="relative overflow-hidden" style={backgroundStyle(backgrounds.gallery, colors)}>
        <BackgroundMediaLayers layers={config.appearance.mediaLayers.gallery} reduceMotion={reduceMotion} />
        <div className="relative z-10">
        <Section eyebrow={sections.gallery.eyebrow} title={sections.gallery.title} colors={colors} wide introAlign="left" showFlourish={false} description={sections.gallery.description}>
        <motion.div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-12 lg:items-start" variants={motionScenes.gallery.container} initial={motionInitial} whileInView="visible" viewport={viewportOnce}>
          {config.gallery.map((src, index) => {
            const galleryLayouts = ["lg:col-span-5 aspect-[4/5]", "lg:col-span-3 aspect-[3/4] lg:mt-16", "lg:col-span-4 aspect-[4/5] lg:mt-6", "lg:col-span-6 aspect-[16/11]"];
            return (
              <motion.div key={`${src}-${index}`} variants={motionScenes.gallery.item} transition={premiumTransition} whileHover={reduceMotion ? undefined : interactiveMotion.galleryFocus} whileTap={reduceMotion ? undefined : interactiveMotion.tap} className={`group relative overflow-hidden rounded-[2.2rem] border bg-[#FFFDF8] p-2.5 shadow-[0_24px_70px_rgba(47,58,53,0.10)] ${galleryLayouts[index % galleryLayouts.length]}`} style={{ borderColor: colors.border }}>
                <div className="relative h-full overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[#FDFBF7] via-white to-[#E9DDE5]/40">
                  <Image src={src} alt={`${sections.gallery.imageAltPrefix} ${index + 1}`} fill unoptimized className="object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="pointer-events-none absolute inset-2.5 rounded-[1.6rem] ring-1 ring-white/50" />
                <div className="absolute bottom-5 left-5 rounded-full bg-white/80 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.22em] backdrop-blur" style={{ color: deepGreen }}>{sections.gallery.itemLabel} {index + 1}</div>
              </motion.div>
            );
          })}
        </motion.div>
        </Section>
        </div>
      </div>

      <section className="relative overflow-hidden px-5 pb-16 pt-4 sm:px-8 lg:pb-28">
        <BackgroundMediaLayers layers={config.appearance.mediaLayers.cta} reduceMotion={reduceMotion} />
        <motion.div className="relative z-10 mx-auto max-w-5xl overflow-hidden rounded-[2.8rem] p-9 text-center text-white shadow-[0_34px_100px_rgba(47,58,53,0.18)] sm:p-14" initial={motionInitial} whileInView="visible" viewport={viewportOnce} variants={motionScenes.cta.panel} transition={slowRevealTransition} style={backgroundStyle(backgrounds.cta, colors)}>
          <Image src="/floral-corner-rose.svg" alt="" width={280} height={280} className="absolute -left-20 -top-20 h-64 w-64 opacity-40" />
          <Image src="/floral-corner-blue.svg" alt="" width={280} height={280} className="absolute -bottom-20 -right-20 h-64 w-64 opacity-40" />
          <motion.div className="relative z-10" variants={motionScenes.cta.content}>
            <motion.p variants={motionScenes.cta.item} transition={premiumTransition} className="text-xs font-bold uppercase tracking-[0.42em]" style={{ color: gold }}>{sections.cta.eyebrow}</motion.p>
            <motion.h2 variants={motionScenes.cta.item} transition={slowRevealTransition} className="mt-5 font-serif text-6xl leading-none">{sections.cta.title}</motion.h2>
            <motion.div variants={motionScenes.cta.line} transition={premiumTransition} className="mx-auto mt-6 h-px w-28 origin-center" style={{ backgroundColor: gold }} />
            <motion.p variants={motionScenes.cta.item} transition={premiumTransition} className="mx-auto mt-6 max-w-2xl leading-8 text-white/76">{sections.cta.description}</motion.p>
            <motion.div variants={motionScenes.cta.item} animate={reduceMotion ? undefined : { scale: [1, 1.025, 1], transition: { duration: 1.8, ease: "easeInOut", repeat: 1 } }}>
              <Link href="/rsvp" className="group mt-9 inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-bold uppercase tracking-[0.12em] shadow-xl transition duration-500 hover:-translate-y-1" style={{ backgroundColor: gold, color: deepGreen }}>
                {sections.cta.buttonLabel} <ChevronRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
