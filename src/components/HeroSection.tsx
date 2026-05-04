"use client";

import Image from "next/image";
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
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: "easeOut" }}
      >
        <Image
          src="/images/hero-bg.webp"
          alt="Enchanted Garden wedding cover"
          fill
          priority
          className="object-cover object-center"
        />
      </motion.div>

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
            className="font-serif text-6xl tracking-[0.18em] text-[#D4AF37]/70 md:text-8xl"
          >
            NP
          </motion.p>

          <motion.h1
            variants={titleVariants}
            className="mt-4 font-serif text-4xl uppercase drop-shadow-lg md:text-6xl"
          >
            NHẬT &amp; PHƯƠNG
          </motion.h1>

          <motion.p
            variants={fadeVariants}
            className="mt-4 font-sans text-xs uppercase tracking-[0.3em] text-[#FDFBF7]/90 md:text-sm"
          >
            Wedding Celebration
          </motion.p>

          <motion.p
            variants={fadeVariants}
            className="mt-8 font-serif text-lg font-light tracking-[0.28em] text-[#FDFBF7]/85 md:text-xl"
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
