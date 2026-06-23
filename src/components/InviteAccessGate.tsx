"use client";

import Link from "next/link";

type InviteAccessGateProps = {
  variant: "home" | "invalid-token" | "rsvp-missing-token";
};

const copy: Record<InviteAccessGateProps["variant"], { kicker: string; title: string; body: string }> = {
  home: {
    kicker: "nhatphuong.love",
    title: "Thiệp mời riêng",
    body: "Vui lòng mở đúng link thiệp mời đã được gửi cho bạn (dạng /i/…). Trang này không hiển thị nội dung thiệp chung.",
  },
  "invalid-token": {
    kicker: "Link không hợp lệ",
    title: "Không tìm thấy thiệp",
    body: "Link thiệp không hợp lệ hoặc đã hết hiệu lực. Nếu bạn đã nhận thiệp trước đó, vui lòng dùng lại link trong tin nhắn hoặc liên hệ gia đình.",
  },
  "rsvp-missing-token": {
    kicker: "Xác nhận lời mời",
    title: "Cần link thiệp",
    body: "Vui lòng mở thiệp mời của bạn và chọn xác nhận từ trang thiệp, hoặc mở link có dạng /rsvp?invite=…",
  },
};

export function InviteAccessGate({ variant }: InviteAccessGateProps) {
  const { kicker, title, body } = copy[variant];

  return (
    <main className="public-invitation-page relative flex min-h-screen items-center justify-center px-6 py-16 text-[#252934]">
      <div aria-hidden="true" className="aurora-wash pointer-events-none absolute inset-0 -z-10 opacity-50" />
      <section className="glass-panel max-w-lg rounded-[2rem] p-10 text-center shadow-[0_24px_64px_rgba(37,41,52,0.08)]">
        <p className="section-kicker-dark wedding-type-kicker text-serenity">{kicker}</p>
        <h1 className="wedding-type-title mt-4 text-[#252934]">{title}</h1>
        <p className="wedding-type-body mt-5 text-[#252934]/62">{body}</p>
        <p className="wedding-type-body mt-6 text-sm text-[#252934]/48">
          Nhật & Phương · Terracotta Đà Lạt
        </p>
        {variant === "rsvp-missing-token" ? (
          <Link
            href="/"
            className="wedding-type-button mt-8 inline-flex min-h-12 items-center justify-center rounded-full border border-serenity/26 bg-white/80 px-8 text-[#252934] transition hover:border-serenity/46"
          >
            Về trang chủ
          </Link>
        ) : null}
      </section>
    </main>
  );
}
