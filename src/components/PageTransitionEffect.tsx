"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type TransitionContextValue = {
  navigateWithTransition: (href: string) => void;
};

const TransitionContext = createContext<TransitionContextValue>({
  navigateWithTransition: () => {},
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

const EXIT_MS = 300;

export function PageTransitionEffect({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const navRef = useRef(false);

  const navigateWithTransition = useCallback(
    (href: string) => {
      if (navRef.current) return;
      navRef.current = true;

      // Phase 1: fade out current page
      setLeaving(true);

      // Phase 2: navigate after fade-out completes
      setTimeout(() => {
        router.push(href);
        // Reset after navigation
        setTimeout(() => {
          setLeaving(false);
          navRef.current = false;
        }, 50);
      }, EXIT_MS);
    },
    [router],
  );

  return (
    <TransitionContext.Provider value={{ navigateWithTransition }}>
      <div
        key={pathname}
        className={`page-transition-wrapper ${leaving ? "page-leaving" : ""}`}
      >
        {children}
      </div>
    </TransitionContext.Provider>
  );
}
