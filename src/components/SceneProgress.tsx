"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function SceneProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.3 });

  return (
    <div aria-hidden="true">
      <motion.div
        className="fixed left-0 right-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-rose-quartz to-serenity"
        style={{ scaleX }}
      />
    </div>
  );
}
