"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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

export function PageTransitionEffect({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const navRef = useRef(false);

  // Immediately reset leaving state when pathname changes so incoming page fades in smoothly without flicker
  useEffect(() => {
    setLeaving(false);
    navRef.current = false;
  }, [pathname]);

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

      prefetch(href);
      setLeaving(true);

      setTimeout(() => {
        router.push(href);
      }, 150);
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
