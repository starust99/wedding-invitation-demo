"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useSyncExternalStore, useState, useEffect } from "react";

export let isIntroDone = false;

function checkLocalStorageIntro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const shouldForce = new URLSearchParams(window.location.search).get("intro") === "1" || window.location.href.includes("intro=1");
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

export function LineReveal({
  children,
  delay = 0,
  className = "",
  type = "header",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  type?: "header" | "body";
}) {
  const ref = useRef(null);
  const ready = useRevealReady(true);
  const isDone = checkIsIntroDone();
  const isVisible = ready || isDone;

  const fadeClass = type === "body" ? "hero-text-fade-body" : "hero-text-fade-header";

  return (
    <div ref={ref} className={className}>
      <div
        className={`${fadeClass} ${isVisible ? "is-visible" : ""}`}
        style={{ transitionDelay: isDone ? "0s" : `${delay}s` }}
      >
        {children}
      </div>
    </div>
  );
}

export function WriteReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const ready = useRevealReady(isInView);
  const isDone = checkIsIntroDone();
  const isVisible = ready || isDone;

  return (
    <div ref={ref} className={className}>
      <div
        className={`hero-text-fade ${isVisible ? "is-visible" : ""}`}
        style={{ transitionDelay: isDone ? "0s" : `${delay}s` }}
      >
        {children}
      </div>
    </div>
  );
}

export function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const ready = useRevealReady(isInView);
  const isDone = checkIsIntroDone();
  const isVisible = ready || isDone;

  return (
    <div ref={ref} className={className}>
      <div
        className={`hero-text-fade ${isVisible ? "is-visible" : ""}`}
        style={{ transitionDelay: isDone ? "0s" : `${delay}s` }}
      >
        {children}
      </div>
    </div>
  );
}

export function PopReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const ready = useRevealReady(isInView);
  const isDone = checkIsIntroDone();
  const isVisible = ready || isDone;

  return (
    <div ref={ref} className={className}>
      <div
        className={`hero-text-fade ${isVisible ? "is-visible" : ""}`}
        style={{ transitionDelay: isDone ? "0s" : `${delay}s` }}
      >
        {children}
      </div>
    </div>
  );
}
