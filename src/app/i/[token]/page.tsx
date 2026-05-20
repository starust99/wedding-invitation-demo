import type { Metadata } from "next";
import { InviteTokenPage } from "@/components/InviteTokenPage";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

const ogImage = {
  url: "/assets/og-image.png",
  width: 1672,
  height: 941,
  alt: "Nhật & Phương Wedding Thumbnail",
};

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  let guestName = "bạn";

  if (hasSupabaseEnv()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data } = await supabase
        .from("invitees")
        .select("display_label, guest_name")
        .eq("token", token)
        .maybeSingle();

      if (data) {
        guestName = data.display_label || data.guest_name || "bạn";
      }
    } catch {
      // Fallback to "bạn" if DB fails
    }
  }

  const title = `Thiệp mời: ${guestName} | Nhật & Phương`;
  const description = `Mời ${guestName} cùng chung vui trong ngày chung đôi của Nhật & Phương, 26.12.2026.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/i/${token}`,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export default async function TokenInviteRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteTokenPage token={token} />;
}
