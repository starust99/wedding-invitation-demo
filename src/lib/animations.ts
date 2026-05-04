export const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0 },
};

export const softFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleReveal = {
  hidden: { opacity: 0, scale: 0.96, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
};

export const heroImageMotion = {
  initial: { scale: 1.08, opacity: 0.88 },
  animate: { scale: 1, opacity: 1 },
};

export const floatingMotion = {
  y: [0, -10, 0],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut",
  },
} as const;

export const viewportOnce = { once: true, margin: "-90px" };

export const smoothTransition = { duration: 0.9, ease: "easeOut" } as const;
export const luxuryTransition = { duration: 1.15, ease: "easeOut" } as const;
