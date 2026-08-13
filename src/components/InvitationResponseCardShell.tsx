"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, type Variants } from "framer-motion";

const FALLBACK_TUCK_DISTANCE = 560;

const stationeryCardVariants: Variants = {
  tucked: (tuckDistance: number = FALLBACK_TUCK_DISTANCE) => ({
    y: -tuckDistance,
  }),
  drawn: {
    y: 0,
    transition: {
      y: {
        type: "spring",
        stiffness: 18,
        damping: 7.5,
        mass: 1.18,
        restDelta: 0.2,
        restSpeed: 0.2,
        delay: 0.12,
      },
      delayChildren: 0.42,
    },
  },
};

const stationeryContentVariants: Variants = {
  tucked: {
    opacity: 0,
    y: -8,
  },
  drawn: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function InvitationResponseCardShell({
  children,
  fullWidth = false,
}: {
  children: ReactNode;
  fullWidth?: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tuckDistance, setTuckDistance] = useState(FALLBACK_TUCK_DISTANCE);
  const isInView = useInView(stageRef, {
    once: true,
    amount: 0.04,
    margin: "0px 0px -3% 0px",
  });

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const updateTuckDistance = () => {
      // Translate by the card's complete rendered height. The static stage
      // stays in normal flow as the viewport trigger, while the actual RSVP
      // insert starts fully tucked behind the main invitation card.
      setTuckDistance(Math.max(1, Math.ceil(card.offsetHeight)));
    };

    updateTuckDistance();

    const observer = new ResizeObserver(updateTuckDistance);
    observer.observe(card);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      className={`invitation-response-card-stage relative w-full ${fullWidth ? "max-w-none" : "max-w-3xl"}`}
    >
      <motion.div
        ref={cardRef}
        initial="tucked"
        animate={isInView ? "drawn" : "tucked"}
        custom={tuckDistance}
        variants={stationeryCardVariants}
        className="invitation-response-card-shell relative w-full"
      >
        <div className="invitation-response-vellum-tab" aria-hidden="true">
          <svg
            className="invitation-response-vellum-mark"
            viewBox="0 0 28 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14 2V11" />
            <path d="M14 31V40" />
            <path d="M2 21H8" />
            <path d="M20 21H26" />
            <path d="M14 10.5C14.7 16.7 18.1 20.3 23.5 21C18.1 21.7 14.7 25.3 14 31.5C13.3 25.3 9.9 21.7 4.5 21C9.9 20.3 13.3 16.7 14 10.5Z" />
            <circle cx="14" cy="2" r="1.15" fill="currentColor" stroke="none" />
            <circle cx="14" cy="40" r="1.15" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <div className="glass-panel invitation-response-paper relative z-10 w-full overflow-hidden rounded-[2.5rem] px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="invitation-response-corner-ornaments" aria-hidden="true">
            <span className="invitation-response-corner invitation-response-corner--top-left" />
            <span className="invitation-response-corner invitation-response-corner--top-right" />
            <span className="invitation-response-corner invitation-response-corner--bottom-left" />
            <span className="invitation-response-corner invitation-response-corner--bottom-right" />
          </div>

          <motion.div className="relative z-[1]" variants={stationeryContentVariants}>
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
