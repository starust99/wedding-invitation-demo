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

export const editorialFade = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const paperLift = {
  hidden: { opacity: 0, y: 30, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const driftLeft = {
  hidden: { opacity: 0, x: 34, filter: "blur(5px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)" },
};

export const driftRight = {
  hidden: { opacity: 0, x: -34, filter: "blur(5px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)" },
};

export const veilReveal = {
  hidden: { opacity: 0, y: 18, clipPath: "inset(0 0 100% 0)" },
  visible: { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" },
};

export const petalReveal = {
  hidden: { opacity: 0, y: 26, rotate: -1.8, scale: 0.975 },
  visible: { opacity: 1, y: 0, rotate: 0, scale: 1 },
};

export const imageBloom = {
  hidden: { opacity: 0, scale: 1.035 },
  visible: { opacity: 1, scale: 1 },
};

export const lineDraw = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: { opacity: 1, scaleX: 1 },
};

export const premiumStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.12,
    },
  },
};

export const viewportOnce = { once: true, margin: "-90px" };

export const smoothTransition = { duration: 0.9, ease: "easeOut" } as const;
export const luxuryTransition = { duration: 1.15, ease: "easeOut" } as const;
export const premiumTransition = { duration: 1.25, ease: [0.22, 1, 0.36, 1] } as const;
export const slowRevealTransition = { duration: 1.6, ease: [0.16, 1, 0.3, 1] } as const;
export const quickTouchTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

export const motionScenes = {
  hero: {
    container: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.24,
          delayChildren: 0.18,
        },
      },
    },
    monogram: paperLift,
    title: editorialFade,
    detail: editorialFade,
    divider: lineDraw,
  },
  invitation: {
    card: veilReveal,
    container: premiumStagger,
    item: editorialFade,
  },
  itinerary: {
    container: premiumStagger,
    left: driftRight,
    right: driftLeft,
  },
  timeline: {
    container: premiumStagger,
    line: lineDraw,
    even: driftRight,
    odd: driftLeft,
  },
  venue: {
    container: premiumStagger,
    visual: driftRight,
    details: driftLeft,
  },
  gallery: {
    container: premiumStagger,
    item: imageBloom,
  },
  cta: {
    panel: veilReveal,
    content: premiumStagger,
    item: editorialFade,
    line: lineDraw,
  },
} as const;

export const interactiveMotion = {
  gentleLift: {
    y: -4,
    scale: 1.01,
    transition: quickTouchTransition,
  },
  galleryFocus: {
    y: -6,
    rotate: -0.35,
    transition: quickTouchTransition,
  },
  tap: {
    scale: 0.985,
    transition: quickTouchTransition,
  },
};
