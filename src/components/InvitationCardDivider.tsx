"use client";

import Image from "next/image";

type InvitationCardDividerProps = {
  className?: string;
};

/**
 * Uses the exact approved ornament artwork from the supplied PNG. The render
 * asset is only tightly cropped and made transparent; its motif and colour are
 * not redrawn or recoloured.
 */
export function InvitationCardDivider({ className = "" }: InvitationCardDividerProps) {
  const imageClassName = "pointer-events-none absolute inset-0 h-full w-full select-none object-contain";

  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto h-7 w-[clamp(11.5rem,55vw,20.75rem)] max-w-full sm:h-8 ${className}`}
    >
      {/* Keep only the approved centre cross, exactly 30% smaller than source. */}
      <Image
        src="/assets/invitation-card-divider.png"
        alt=""
        width={1504}
        height={145}
        sizes="(max-width: 640px) 55vw, 332px"
        unoptimized
        className={`${imageClassName} scale-[0.7]`}
        style={{ clipPath: "inset(0 45.9% 0 47%)" }}
        draggable={false}
      />
    </div>
  );
}
