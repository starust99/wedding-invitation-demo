"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function InvitationWatercolorBackdrop() {
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 48,
    damping: 24,
    mass: 0.7,
  });
  const y = useTransform(smoothScroll, [0, 1], ["-4.5vh", "4.5vh"]);
  const x = useTransform(smoothScroll, [0, 0.5, 1], ["1.8vw", "-1.2vw", "1.4vw"]);
  const scale = useTransform(smoothScroll, [0, 1], [1.04, 1.1]);

  return (
    <div aria-hidden="true" className="invitation-watercolor-backdrop">
      <motion.div
        aria-hidden="true"
        className="invitation-watercolor-backdrop__wash bg-panning"
        style={{ x, y, scale }}
      />
    </div>
  );
}
