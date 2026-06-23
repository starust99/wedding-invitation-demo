"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useSyncExternalStore, useState, useEffect } from "react";

export let isIntroDone = false;
if (typeof window !== "undefined") {
  try {
    const shouldForce = new URLSearchParams(window.location.search).get("intro") === "1";
    const keys = Object.keys(window.localStorage);
    const hasSeen = keys.some(key => key.startsWith("wedding-splash:") && window.localStorage.getItem(key) === "1");
    if (hasSeen && !shouldForce) {
      isIntroDone = true;
    }
  } catch (e) {
    // Fail-safe for private browsing modes or locked sessionStorage
  }
}
const introDoneListeners = new Set<() => void>();

function notifyIntroDone() {
  isIntroDone = true;
  introDoneListeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("introFinished", notifyIntroDone);
}

function subscribeIntroDone(listener: () => void) {
  introDoneListeners.add(listener);

  return () => {
    introDoneListeners.delete(listener);
  };
}

function getIntroDoneSnapshot() {
  return isIntroDone;
}

export function useRevealReady(isInView: boolean) {
  const [mounted, setMounted] = useState(false);
  const [delayedReady, setDelayedReady] = useState(false);
  const introDone = useSyncExternalStore(subscribeIntroDone, getIntroDoneSnapshot, () => false);

  // Track if the intro was already completed on mount (e.g. splash skipped)
  const [wasIntroDoneOnMount] = useState(() => isIntroDone);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActuallyReady = (introDone || isIntroDone) && isInView;

  useEffect(() => {
    if (isActuallyReady && mounted) {
      // Add a safe 850ms delay to allow the Splash envelope to fade out (first load) or prevent layout lag (reload)
      const delayTime = 850;
      const timer = setTimeout(() => {
        setDelayedReady(true);
      }, delayTime);
      return () => clearTimeout(timer);
    } else {
      setDelayedReady(false);
    }
  }, [isActuallyReady, mounted]);

  if (!mounted) return false;
  return delayedReady;
}

export function LineReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const ready = useRevealReady(true);
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    setIsSkipped(isIntroDone);
  }, []);

  if (isSkipped) {
    return (
      <div ref={ref} className={className}>
        <div
          className={`hero-text-fade ${ready ? "is-visible" : ""}`}
          style={{ transitionDelay: `${delay}s` }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ y: "80%", opacity: 0, rotateZ: 2, clipPath: "polygon(-10% -10%, 110% -10%, 110% 10%, -10% 10%)" }}
        animate={ready ? { y: 0, opacity: 1, rotateZ: 0, clipPath: "polygon(-10% -10%, 110% -10%, 110% 150%, -10% 150%)" } : { y: "80%", opacity: 0, rotateZ: 2, clipPath: "polygon(-10% -10%, 110% -10%, 110% 10%, -10% 10%)" }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function WriteReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const ready = useRevealReady(isInView);

  return (
    <motion.div
      ref={ref}
      initial={{ clipPath: "polygon(0 -20%, 0 -20%, 0 120%, 0 120%)", opacity: 0, filter: "blur(4px)" }}
      animate={ready ? { clipPath: "polygon(0 -20%, 110% -20%, 110% 120%, 0 120%)", opacity: 1, filter: "blur(0px)" } : { clipPath: "polygon(0 -20%, 0 -20%, 0 120%, 0 120%)", opacity: 0, filter: "blur(4px)" }}
      transition={{ duration: 2.8, ease: [0.25, 1, 0.5, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const ready = useRevealReady(isInView);

  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0 }}
      animate={ready ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PopReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const ready = useRevealReady(isInView);

  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0, filter: "blur(5px)", scale: 0.96 }}
      animate={ready ? { y: 0, opacity: 1, filter: "blur(0px)", scale: 1 } : { y: 20, opacity: 0, filter: "blur(5px)", scale: 0.96 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
