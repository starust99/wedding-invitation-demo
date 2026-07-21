"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type TransitionContextValue = {
  navigateWithTransition: (href: string) => void;
  prefetch: (href: string) => void;
};

const TransitionContext = createContext<TransitionContextValue>({
  navigateWithTransition: () => {},
  prefetch: () => {},
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

const EXIT_MS = 160;

export function PageTransitionEffect({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const navRef = useRef(false);

  const prefetch = useCallback(
    (href: string) => {
      try {
        router.prefetch(href);
      } catch {
        // Silently swallow prefetch errors
      }
    },
    [router],
  );

  const navigateWithTransition = useCallback(
    (href: string) => {
      if (navRef.current) return;
      navRef.current = true;

      // Trigger prefetch and exit transition concurrently
      prefetch(href);
      setLeaving(true);

      // Push route in parallel (40ms) while exit transition completes
      setTimeout(() => {
        router.push(href);
        setTimeout(() => {
          setLeaving(false);
          navRef.current = false;
        }, EXIT_MS);
      }, 40);
    },
    [prefetch, router],
  );

  return (
    <TransitionContext.Provider value={{ navigateWithTransition, prefetch }}>
      <div
        key={pathname}
        className={`page-transition-wrapper ${leaving ? "page-leaving" : ""}`}
      >
        {children}
      </div>
    </TransitionContext.Provider>
  );
}
