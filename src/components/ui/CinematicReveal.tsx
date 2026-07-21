"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useSyncExternalStore, useState, useEffect } from "react";

export let isIntroDone = false;

function checkLocalStorageIntro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const shouldForce = new URLSearchParams(window.location.search).get("intro") === "1";
    const keys = Object.keys(window.localStorage);
    const hasSeen = keys.some(key => key.startsWith("wedding-splash:") && window.localStorage.getItem(key) === "1");
    return hasSeen && !shouldForce;
  } catch {
    return false;
  }
}

export function checkIsIntroDone(): boolean {
  if (isIntroDone) return true;
  if (checkLocalStorageIntro()) {
    isIntroDone = true;
    return true;
  }
  return false;
}

if (typeof window !== "undefined") {
  if (checkLocalStorageIntro()) {
    isIntroDone = true;
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
  return checkIsIntroDone();
}

export function useRevealReady(isInView: boolean) {
  const [mounted, setMounted] = useState(false);
  const introDone = useSyncExternalStore(subscribeIntroDone, getIntroDoneSnapshot, () => false);
  const isDoneNow = introDone || checkIsIntroDone();
  const [delayedReady, setDelayedReady] = useState(() => isDoneNow);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActuallyReady = (introDone || isDoneNow) && isInView;

  useEffect(() => {
    if (isActuallyReady && mounted) {
      if (isDoneNow) {
        setDelayedReady(true);
        return;
      }
      const delayTime = 850;
      const timer = setTimeout(() => {
        setDelayedReady(true);
      }, delayTime);
      return () => clearTimeout(timer);
    } else {
      setDelayedReady(false);
    }
  }, [isActuallyReady, isDoneNow, mounted]);

  if (!mounted && !isDoneNow) return false;
  return delayedReady || isDoneNow;
}

export function LineReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const ready = useRevealReady(true);
  const isDone = checkIsIntroDone();

  if (isDone) {
    return (
      <div ref={ref} className={className}>
        <div className="hero-text-fade is-visible" style={{ opacity: 1, transform: "none", transition: "none" }}>
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
  const isDone = checkIsIntroDone();

  if (isDone) {
    return <div ref={ref} className={className}>{children}</div>;
  }

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
  const isDone = checkIsIntroDone();

  if (isDone) {
    return <div ref={ref} className={className}>{children}</div>;
  }

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
  const isDone = checkIsIntroDone();

  if (isDone) {
    return <div ref={ref} className={className}>{children}</div>;
  }

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
