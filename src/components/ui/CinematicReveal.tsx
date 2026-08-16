"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useSyncExternalStore, useState, useEffect } from "react";

export let isIntroDone = false;

function getCurrentStorageKey(): string {
  if (typeof window === "undefined") return "home";
  const pathname = window.location.pathname;
  if (pathname === "/") return "home";
  const guestPathMatch = pathname.match(/^\/(?:g|i|m|t|w)\/([^/?#]+)/);
  if (guestPathMatch) return guestPathMatch[1] || "home";
  return "home";
}

function checkLocalStorageIntro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (document.documentElement.classList.contains("splash-active")) {
      return false;
    }

    const search = window.location.search || "";
    const href = window.location.href || "";
    const hash = window.location.hash || "";

    if (search.includes("view=main") || search.includes("from=rsvp") || search.includes("skip_intro=1") || hash.includes("thank-you") || hash.includes("rsvp")) {
      return true;
    }

    if (search.includes("intro=1") || href.includes("intro=1")) {
      return false;
    }
    const key = getCurrentStorageKey();
    const sessionSeen = window.sessionStorage.getItem(`wedding-splash-seen:${key}`) === "1";
    const localSeen = window.localStorage.getItem(`wedding-splash:${key}`) === "1" || window.localStorage.getItem(`wedding-splash:wedding-splash:${key}`) === "1";
    return sessionSeen || localSeen;
  } catch {
    return false;
  }
}

export function checkIsIntroDone(): boolean {
  if (typeof window !== "undefined") {
    if (document.documentElement.classList.contains("splash-active")) {
      return false;
    }

    const search = window.location.search || "";
    const href = window.location.href || "";
    if (search.includes("intro=1") || href.includes("intro=1")) {
      isIntroDone = false;
      return false;
    }
  }
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

  const fadeClass = type === "body" ? "hero-text-fade-body" : "hero-text-fade-header";

  return (
    <div ref={ref} className={className}>
      <div className={fadeClass}>
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
