"use client";

import type { WeddingHeroEditorConfig } from "@/lib/wedding/hero-types";

type HeroContentProps = {
  config: WeddingHeroEditorConfig;
  mode?: "preview" | "public";
};

function splitNames(names: string) {
  const parts = names.split(/\s*&\s*/);
  if (parts.length === 2) return `${parts[0]} &\n${parts[1]}`;
  return names;
}

export function HeroContent({ config, mode = "public" }: HeroContentProps) {
  const compact = mode === "preview";

  return (
    <div
      className={[
        "relative z-[6] mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 text-center text-text-primary lg:grid-cols-[1.04fr_0.96fr] lg:px-10",
        compact ? "pointer-events-none h-full min-h-0 w-full max-w-none px-[5%] py-[5%] max-sm:px-5 max-sm:py-16" : "min-h-screen max-sm:px-5 max-sm:py-20 lg:py-24",
      ].join(" ")}
    >
      <div className="mx-auto w-full max-w-2xl text-center max-sm:max-w-[22rem] lg:max-w-[38rem]">
        <p className="mx-auto max-w-[19rem] font-sans text-[11px] font-bold uppercase leading-6 tracking-[0.18em] text-text-primary/58 sm:max-w-none sm:tracking-[0.28em]">
          {config.content.eyebrow}
        </p>

        <h1 className="wedding-type-title mt-7 whitespace-pre-line text-text-primary">
          {splitNames(config.content.names)}
        </h1>

        <p className="wedding-type-meta mt-8 text-text-primary/72">
          {config.content.date}
        </p>

        <p className="wedding-type-body mx-auto mt-5 max-w-[calc(100vw-3rem)] text-text-primary/72 lg:max-w-[32rem]">
          {config.content.description}
        </p>

        <div className="mt-9 flex w-full flex-wrap items-center justify-center gap-4 max-sm:flex-col max-sm:items-stretch">
          <a
            href="#rsvp"
            className="wedding-type-button pointer-events-auto inline-flex items-center justify-center rounded-full bg-pastel-sage px-8 py-4 text-center text-text-primary shadow-[0_18px_45px_rgba(181,213,164,0.26)] max-sm:w-full max-sm:px-5"
          >
            {config.content.primaryCta}
          </a>

          <a
            href="#details"
            className="wedding-type-button pointer-events-auto inline-flex items-center justify-center rounded-full border border-white/70 bg-white/28 px-8 py-4 text-center text-text-primary/72 backdrop-blur-md max-sm:w-full max-sm:px-5"
          >
            {config.content.secondaryCta}
          </a>
        </div>
      </div>

      <div className="relative hidden min-h-[36rem] lg:block">
        <div className="absolute bottom-[6%] left-[8%] w-[19rem] rounded-[2rem] border border-white/65 bg-white/46 p-6 shadow-[0_26px_80px_rgba(92,82,71,0.11)] backdrop-blur-xl">
          <p className="wedding-type-meta text-text-primary/60">
            Xem trước hồi đáp
          </p>
          <p className="wedding-type-card-title mt-4 text-text-primary/92">
            Giữ ngày cưới
          </p>
          <p suppressHydrationWarning className="wedding-type-body mt-3 text-text-primary/70">
            Cùng chia vui trong ngày chung đôi của Nhật & Phương, tháng 12.2026.
          </p>
        </div>
      </div>
    </div>
  );
}
