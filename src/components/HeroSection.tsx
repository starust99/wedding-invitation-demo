"use client";

import { ChevronDown } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.22,
      delayChildren: 0.2,
    },
  },
};

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: "easeOut",
    },
  },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.9,
      ease: "easeOut",
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,220,217,0.55),transparent_32%),radial-gradient(circle_at_80%_76%,rgba(212,228,247,0.48),transparent_34%),linear-gradient(135deg,#3f4642,#6c625a)]"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: "easeOut" }}
      />

      <div className="absolute inset-0 z-10 bg-black/40" />

      <div className="relative z-20 flex h-full min-h-[100dvh] flex-col items-center justify-center px-6 text-center text-[#FDFBF7]">
        <motion.div
          className="flex flex-col items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={fadeVariants}
            className="wedding-type-display text-[#D4AF37]/70"
          >
            NP
          </motion.p>

          <motion.h1
            variants={titleVariants}
            className="wedding-type-title mt-4 uppercase drop-shadow-lg"
          >
            NHẬT &amp; PHƯƠNG
          </motion.h1>

          <motion.p
            variants={fadeVariants}
            className="wedding-type-meta mt-4 text-[#FDFBF7]/90"
          >
            Lễ cưới
          </motion.p>

          <motion.p
            variants={fadeVariants}
            className="wedding-type-card-title mt-8 text-[#FDFBF7]/85"
          >
            26 . 12 . 26
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 text-[#FDFBF7]/85"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <ChevronDown className="h-7 w-7" />
      </motion.div>
    </section>
  );
}

export default HeroSection;
