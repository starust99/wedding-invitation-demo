"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useSyncExternalStore } from "react";

let isIntroDone = false;
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
  const introDone = useSyncExternalStore(subscribeIntroDone, getIntroDoneSnapshot, () => false);
  return introDone && isInView;
}

export function LineReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-5%" });
  const ready = useRevealReady(isInView);

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
  const isInView = useInView(ref, { once: true, margin: "-5%" });
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
  const isInView = useInView(ref, { once: true, margin: "-5%" });
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
  const isInView = useInView(ref, { once: true, margin: "-5%" });
  const ready = useRevealReady(isInView);

  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0, scale: 0.9 }}
      animate={ready ? { y: 0, opacity: 1, scale: 1 } : { y: 20, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 350, damping: 25, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
