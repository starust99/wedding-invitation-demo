import "server-only";

import type { Metadata } from "next";
import { InviteTokenPage } from "@/components/InviteTokenPage";
import { invitationOgImageUrl } from "@/lib/invite-preview";

export type SharedInvitationTokenRouteProps = {
  params: Promise<{ token: string }>;
};

const title = "Nhật & Phương — Thiệp cưới";
const description = "Trân trọng kính mời Quý khách đến chung vui trong ngày trọng đại của Nhật & Phương.";
const ogImage = {
  url: invitationOgImageUrl,
  secureUrl: invitationOgImageUrl,
  width: 1672,
  height: 941,
  type: "image/jpeg",
  alt: "Nhật & Phương Wedding Thumbnail",
};

export function buildSharedInvitationMetadata(
  token: string,
  publicRoute: "/t" | "/w",
): Metadata {
  const publicUrl = `https://nhatphuong.love${publicRoute}/${encodeURIComponent(token)}`;

  return {
    title,
    description,
    alternates: { canonical: publicUrl },
    openGraph: {
      title,
      description,
      url: publicUrl,
      siteName: "Nhật & Phương",
      locale: "vi_VN",
      type: "website",
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

// The shared page deliberately ships the real invitation client shell without
// waiting for Supabase. InviteTokenPage hydrates the token-scoped guest data
// through /api/invites/[token] while the opening sequence is still visible.
export async function SharedInvitationTokenRoutePage({ params }: SharedInvitationTokenRouteProps) {
  const { token } = await params;
  return <InviteTokenPage token={token} />;
}
