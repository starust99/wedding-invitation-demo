import "server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { InviteTokenPage } from "@/components/InviteTokenPage";
import { mapInviteeRow } from "@/lib/invite-mapper";
import type { InviteeDatabaseRow } from "@/lib/invite-mapper";
import { invitationOgImageUrl } from "@/lib/invite-preview";
import { mapRSVPRow } from "@/lib/rsvp-mapper";
import type { RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

export type InvitationTokenRouteProps = {
  params: Promise<{ token: string }>;
};

const ogImage = {
  url: invitationOgImageUrl,
  secureUrl: invitationOgImageUrl,
  width: 1672,
  height: 941,
  type: "image/jpeg",
  alt: "Nhật & Phương Wedding Thumbnail",
};

const fetchInviteeDataFromServer = cache(async (token: string) => {
  if (!hasSupabaseEnv()) {
    try {
      const fs = require("fs");
      const path = require("path");
      const cachePath = path.join(process.cwd(), "invitees-cache.json");
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, "utf8");
        const invitees = JSON.parse(raw) as any[];
        return invitees.find((item) => item.token === token) || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data: inviteeRow, error: inviteeError } = await supabase
    .from("invitees")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteeError) throw inviteeError;
  if (!inviteeRow) return null;

  const invitee = inviteeRow as InviteeDatabaseRow;
  const rsvpResult = await supabase
    .from("rsvp_responses")
    .select("*")
    .or(`invite_token.eq.${token},invitee_id.eq.${invitee.id}`)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rsvp = rsvpResult.data ? mapRSVPRow(rsvpResult.data as RSVPDatabaseRow) : undefined;
  return mapInviteeRow(invitee, undefined, rsvp);
});

function resolveMetadataGuestName(invitee: Awaited<ReturnType<typeof fetchInviteeDataFromServer>>) {
  if (!invitee) return "";
  return String(
    invitee.displayLabel
      || invitee.invitationName
      || invitee.guestName
      || "",
  ).trim();
}

export async function buildInvitationMetadata(
  token: string,
  publicRoute: "/i" | "/t" | "/w",
): Promise<Metadata> {
  const invitee = await fetchInviteeDataFromServer(token);
  const guestName = resolveMetadataGuestName(invitee);

  if (!guestName) {
    return {
      title: "Thiệp mời không còn hiệu lực | Nhật & Phương",
      description: "Link thiệp mời này không còn hiệu lực.",
      robots: { index: false, follow: false },
    };
  }

  const title = `Thiệp mời: ${guestName} | Nhật & Phương`;
  const description = `Trân trọng mời ${guestName} đến chung vui trong ngày trọng đại của Nhật & Phương.`;
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

export async function InvitationTokenRoutePage({ params }: InvitationTokenRouteProps) {
  const { token } = await params;
  const initialInvitee = await fetchInviteeDataFromServer(token);
  if (!initialInvitee) notFound();
  return <InviteTokenPage token={token} initialInvitee={initialInvitee} />;
}
