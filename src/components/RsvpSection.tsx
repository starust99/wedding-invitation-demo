"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BedDouble, ChefHat, HeartHandshake, MessageCircleHeart } from "lucide-react";
import { SectionMediaLayers } from "@/components/SectionMediaLayers";
import type { WeddingConfig } from "@/lib/site-settings";
import { formatGuestName, type GuestIdentity } from "@/lib/guest-personalization";

export function RsvpSection({ config, guestIdentity }: { config: WeddingConfig; guestIdentity: GuestIdentity }) {
  return (
    <section id="rsvp" className="cinematic-stage relative bg-cream px-5 py-24 text-[#252934] sm:px-8 lg:py-32">
      <SectionMediaLayers config={config} section="cta" className="opacity-25" />
      <div aria-hidden="true" className="aurora-wash -z-10 opacity-55" />
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="glass-panel light-sweep overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-12"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", bounce: 0.18, duration: 0.8 }}
        >
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-[#252934]/50">{config.sections.cta.eyebrow}</p>
              <h2 className="mt-4 max-w-3xl font-serif text-[clamp(2.9rem,5.8vw,5.6rem)] leading-[1.04]">{config.sections.cta.title}</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#252934]/64">
                {formatGuestName(guestIdentity)} thân mến, gia đình mong nhận phản hồi trước ngày {config.rsvp.deadline} để chuẩn bị chỗ ngồi, thực đơn và các ghi chú lưu trú một cách chu đáo.
              </p>
              <Link
                href="/rsvp"
                className="mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-[#252934] px-8 text-xs font-black uppercase tracking-[0.22em] text-white transition hover:-translate-y-0.5"
              >
                Gửi xác nhận
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: HeartHandshake, title: "Chỗ ngồi", text: "Sắp xếp đúng số khách và nhóm khách mời." },
                { icon: ChefHat, title: "Thực đơn", text: "Ghi nhận ăn chay, dị ứng hoặc suất trẻ em." },
                { icon: BedDouble, title: "Lưu trú", text: "Concierge liên hệ riêng nếu anh/chị cần thông tin phòng." },
                { icon: MessageCircleHeart, title: "Concierge", text: "Ms. Linh · 0900 000 000 tiếp nhận ghi chú quan trọng." },
              ].map((item, index) => (
                <motion.article
                  key={item.title}
                  className="rounded-[1.35rem] border border-[#252934]/10 bg-white/48 p-5 shadow-[0_16px_50px_rgba(37,41,52,0.06)] backdrop-blur-xl"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.52, delay: index * 0.04 }}
                >
                  <item.icon className="h-5 w-5 text-serenity" />
                  <h3 className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#252934]/48">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#252934]/62">{item.text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
