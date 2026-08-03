import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { InviteTokenPage } from "@/components/InviteTokenPage";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { mapInviteeRow } from "@/lib/invite-mapper";
import { mapRSVPRow } from "@/lib/rsvp-mapper";
import type { InviteeDatabaseRow } from "@/lib/invite-mapper";
import type { RSVPDatabaseRow } from "@/lib/rsvp-mapper";

const ogImage = {
  url: "/assets/og-image.png",
  width: 1672,
  height: 941,
  alt: "Nhật & Phương Wedding Thumbnail",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
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
  const description = `Trân trọng kính mời ${guestName} đến chung vui trong ngày trọng đại của Nhật & Phương.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/i/${token}`,
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

export default async function TokenInviteRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const initialInvitee = await fetchInviteeDataFromServer(token);
  if (!initialInvitee) notFound();
  return <InviteTokenPage token={token} initialInvitee={initialInvitee} />;
}
