"use client";

import { useEffect } from "react";
import { HeartHandshake } from "lucide-react";
import Image from "next/image";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";
import type { GuestIdentity } from "@/lib/guest-personalization";
import { usePageTransition } from "@/components/PageTransitionEffect";
import { InvitationCardDivider } from "@/components/InvitationCardDivider";
import { InvitationResponseCardShell } from "@/components/InvitationResponseCardShell";

import type { Invitee } from "@/lib/invites";

export function RsvpSection({
  config,
  rsvpHref = "/rsvp",
  transparentBg = false,
  embedded = false,
  invitee,
}: {
  config: WeddingConfig;
  guestIdentity: GuestIdentity;
  rsvpHref?: string;
  transparentBg?: boolean;
  embedded?: boolean;
  invitee?: Invitee;
}) {
  const { navigateWithTransition, prefetch } = usePageTransition();

  const hasResponded = Boolean(invitee?.rsvp || (invitee?.inviteStatus && invitee.inviteStatus !== "invited"));
  const isDeclined = invitee?.rsvp?.attending === "no" || invitee?.inviteStatus === "rsvp_no";

  // Prefetch /rsvp as soon as RsvpSection is rendered
  useEffect(() => {
    prefetch(rsvpHref);
  }, [prefetch, rsvpHref]);

  return (
    <section
      id="rsvp"
      className={embedded
        ? "stationery-response-slot relative z-10 w-full overflow-visible text-ink"
        : transparentBg
          ? "relative overflow-hidden px-5 py-2 text-ink sm:px-8"
          : "cinematic-stage editorial-band relative overflow-hidden px-5 py-12 text-ink sm:px-8 sm:py-16 lg:py-20"}
    >
      {!transparentBg && !embedded && (
        <>
          <SectionMediaLayers config={config} section="cta" className="opacity-[0.1]" />
          <div aria-hidden="true" className="paper-grain-luxury -z-10 opacity-20" />
          <div aria-hidden="true" className="hero-couture-shade absolute inset-0 opacity-55" />
        </>
      )}

      <div className={embedded ? "mx-auto flex w-full justify-center" : "mx-auto flex max-w-7xl justify-center"}>
        <InvitationResponseCardShell fullWidth={embedded}>
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
            {hasResponded ? (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-[#3f4642]/95 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isDeclined ? "ĐÃ BÁO BẬN" : "ĐÃ XÁC NHẬN THAM DỰ"}</span>
              </div>
            ) : null}

            <h3 className="font-serif text-[1.12rem] sm:text-[1.25rem] md:text-[1.38rem] font-bold gold-foil-text uppercase leading-tight mt-0.5 mb-1">
              {config.sections.cta.eyebrow}
            </h3>
            <InvitationCardDivider className="mt-1.5" />
            {hasResponded ? (
              <>
                <p className="invitation-response-copy wedding-type-body font-sans mt-4 max-w-2xl text-[#3f4642]/95 font-medium">
                  Cảm ơn Quý khách đã gửi lời hồi đáp cho hai gia đình.
                </p>
                <p className="invitation-response-copy wedding-type-body font-sans mt-2 max-w-2xl text-[#3f4642]/95">
                  Thông tin phản hồi của Quý khách đã được ghi nhận thành công trên hệ thống. Quý khách có thể xem lại hoặc chỉnh sửa thông tin tham dự bất kỳ lúc nào trước ngày <strong className="font-bold text-[#3f4642]/95">{config.rsvp.deadline}</strong>.
                </p>
                <p className="invitation-response-copy wedding-type-body font-sans mt-2 max-w-xl text-[#3f4642]/95">
                  Trân trọng cảm ơn.
                </p>
              </>
            ) : (
              <>
                <p className="invitation-response-copy wedding-type-body mt-4 max-w-2xl font-sans font-normal text-[#3f4642]/95">
                  Để gia đình chuẩn bị đón tiếp chu đáo, xin Quý khách vui lòng xác nhận tham dự trước ngày <strong className="font-semibold text-[#3f4642]/95">{config.rsvp.deadline}</strong>.
                </p>
                <p className="invitation-response-copy wedding-type-body mt-1.5 max-w-xl font-sans font-normal text-[#3f4642]/95">
                  Trân trọng cảm ơn.
                </p>
              </>
            )}

            <div className="relative mt-5 inline-flex">
              <button
                type="button"
                onClick={() => navigateWithTransition(rsvpHref)}
                onMouseEnter={() => prefetch(rsvpHref)}
                onTouchStart={() => prefetch(rsvpHref)}
                className="inline-flex h-[2.75rem] sm:h-[3.0rem] items-center justify-center transition hover:-translate-y-0.5 save-date-watercolor-btn mx-auto min-w-[11rem] sm:min-w-[12.5rem]"
              >
                <span className="save-date-btn-label">
                  <HeartHandshake aria-hidden="true" className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  <span>{hasResponded ? "Xem & Chỉnh sửa hồi đáp" : "Xác nhận tham dự"}</span>
                </span>
              </button>

              {!hasResponded ? (
                <span className="rsvp-tap-guide" aria-hidden="true">
                  <span className="rsvp-tap-guide-ripple" />
                  <Image
                    src="/assets/wedding/ui/rsvp/tap-hand-neutral.webp"
                    alt=""
                    width={420}
                    height={420}
                    className="rsvp-tap-guide-image"
                    draggable={false}
                    unoptimized
                  />
                </span>
              ) : null}
            </div>
          </div>
        </InvitationResponseCardShell>
      </div>
    </section>
  );
}
