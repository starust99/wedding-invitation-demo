"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";

const stationeryCardVariants: Variants = {
  tucked: {
    opacity: 0,
    y: -64,
  },
  drawn: {
    opacity: 1,
    y: 0,
    transition: {
      y: {
        type: "spring",
        stiffness: 48,
        damping: 10.5,
        mass: 1.05,
        restDelta: 0.08,
        restSpeed: 0.08,
        delay: 0.22,
      },
      opacity: {
        type: "tween",
        duration: 0.72,
        delay: 0.16,
        ease: [0.22, 1, 0.36, 1],
      },
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
  const [isMobileViewport, setIsMobileViewport] = useState<boolean | null>(null);
  const [hasReachedMobileReadPoint, setHasReachedMobileReadPoint] = useState(false);
  const [hasStartedDrawing, setHasStartedDrawing] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(stageRef, {
    once: true,
    amount: 0.04,
    margin: "0px 0px -3% 0px",
  });

  useLayoutEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const updateViewportMode = () => setIsMobileViewport(mobileQuery.matches);

    updateViewportMode();

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", updateViewportMode);
      return () => mobileQuery.removeEventListener("change", updateViewportMode);
    }

    // Older iOS webviews still expose the legacy MediaQueryList API.
    mobileQuery.addListener(updateViewportMode);
    return () => mobileQuery.removeListener(updateViewportMode);
  }, []);

  useEffect(() => {
    if (isMobileViewport !== true || hasReachedMobileReadPoint) return;

    const stack = stageRef.current?.closest(".event-details-card-stack");
    const readSentinel = stack?.querySelector<HTMLElement>("[data-invitation-read-sentinel]");

    if (!readSentinel || typeof IntersectionObserver === "undefined") {
      // Never strand the RSVP action in an older browser without observer support.
      setHasReachedMobileReadPoint(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setHasReachedMobileReadPoint(true);
        observer.disconnect();
      },
      {
        threshold: 0,
        // The invitation's bottom must cross roughly 78% of the viewport.
        // Guests therefore see the complete printed card before RSVP is drawn.
        rootMargin: "0px 0px -22% 0px",
      },
    );

    observer.observe(readSentinel);
    return () => observer.disconnect();
  }, [hasReachedMobileReadPoint, isMobileViewport]);

  useEffect(() => {
    const canStartDrawing =
      isMobileViewport === true
        ? hasReachedMobileReadPoint
        : isMobileViewport === false
          ? isInView
          : false;
    if (canStartDrawing) setHasStartedDrawing(true);
  }, [hasReachedMobileReadPoint, isInView, isMobileViewport]);

  return (
    <div
      ref={stageRef}
      className={`invitation-response-card-stage relative w-full ${fullWidth ? "max-w-none" : "max-w-3xl"}`}
    >
      <motion.div
        initial={shouldReduceMotion ? "drawn" : "tucked"}
        animate={shouldReduceMotion || hasStartedDrawing ? "drawn" : "tucked"}
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

        <div className="invitation-response-paper relative z-10 w-full overflow-hidden rounded-[2.5rem] border px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="invitation-response-corner-ornaments" aria-hidden="true">
            <span className="invitation-response-corner invitation-response-corner--top-left" />
            <span className="invitation-response-corner invitation-response-corner--top-right" />
            <span className="invitation-response-corner invitation-response-corner--bottom-left" />
            <span className="invitation-response-corner invitation-response-corner--bottom-right" />
          </div>

          <div className="relative z-[1]">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
