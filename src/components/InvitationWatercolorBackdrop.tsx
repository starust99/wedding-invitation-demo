"use client";

import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function InvitationWatercolorBackdrop() {
  const pathname = usePathname();
  const isRsvp = pathname?.startsWith("/rsvp");

  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 48,
    damping: 24,
    mass: 0.7,
  });

  const yTransform = useTransform(smoothScroll, [0, 1], ["-4.5vh", "4.5vh"]);
  const xTransform = useTransform(smoothScroll, [0, 0.5, 1], ["1.8vw", "-1.2vw", "1.4vw"]);
  const scaleTransform = useTransform(smoothScroll, [0, 1], [1.04, 1.1]);

  const x = isRsvp ? 0 : xTransform;
  const y = isRsvp ? 0 : yTransform;
  const scale = isRsvp ? 1 : scaleTransform;

  return (
    <div aria-hidden="true" className="invitation-watercolor-backdrop">
      <motion.div
        aria-hidden="true"
        className="invitation-watercolor-backdrop__wash"
        style={{ x, y, scale }}
      >
        <div className="panning-track">
          <div className="panning-slice" />
          <div className="panning-seam-blend" style={{ left: "33.3333%" }} />
          <div className="panning-slice" />
          <div className="panning-seam-blend" style={{ left: "66.6666%" }} />
          <div className="panning-slice" />
        </div>
      </motion.div>
    </div>
  );
}
