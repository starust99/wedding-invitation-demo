import type { Metadata } from "next";
import { InviteTokenPage } from "@/components/InviteTokenPage";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { mapInviteeRow } from "@/lib/invite-mapper";
import { mapInviteSupplementRow } from "@/lib/invite-mapper";
import { mapRSVPRow } from "@/lib/rsvp-mapper";
import type { InviteeDatabaseRow, InviteSupplementDatabaseRow } from "@/lib/invite-mapper";
import type { RSVPDatabaseRow } from "@/lib/rsvp-mapper";

const ogImage = {
  url: "/assets/og-image.png",
  width: 1672,
  height: 941,
  alt: "Nhật & Phương Wedding Thumbnail",
};

async function fetchInviteeDataFromServer(token: string) {
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
  try {
    const supabase = getSupabaseServerClient();
    const { data: inviteeRow } = await supabase
      .from("invitees")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!inviteeRow) return null;

    const invitee = inviteeRow as InviteeDatabaseRow;
    const [supplementResult, rsvpResult] = await Promise.all([
      supabase.from("invite_supplements").select("*").eq("invitee_id", invitee.id).maybeSingle(),
      supabase.from("rsvp_responses").select("*").or(`invite_token.eq.${token},invitee_id.eq.${invitee.id}`).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const supplement = supplementResult.data
      ? mapInviteSupplementRow(supplementResult.data as InviteSupplementDatabaseRow)
      : undefined;
    const rsvp = rsvpResult.data ? mapRSVPRow(rsvpResult.data as RSVPDatabaseRow) : undefined;
    return mapInviteeRow(invitee, supplement, rsvp);
  } catch (err) {
    console.error("Error fetching invitee on server:", err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  let guestName = "bạn";

  if (hasSupabaseEnv()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data } = await supabase
        .from("invitees")
        .select("honorific, guest_name")
        .eq("token", token)
        .maybeSingle();

      if (data) {
        const honorific = data.honorific?.trim();
        const guestNameVal = data.guest_name?.trim();
        guestName = [honorific, guestNameVal].filter(Boolean).join(" ") || "bạn";
      }
    } catch {
      // Fallback to "bạn" if DB fails
    }
  } else {
    try {
      const fs = require("fs");
      const path = require("path");
      const cachePath = path.join(process.cwd(), "invitees-cache.json");
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, "utf8");
        const invitees = JSON.parse(raw) as any[];
        const match = invitees.find((item) => item.token === token);
        if (match) {
          const honorific = match.honorific?.trim();
          const guestNameVal = match.guestName?.trim() || match.displayLabel?.trim();
          guestName = [honorific, guestNameVal].filter(Boolean).join(" ") || "bạn";
        }
      }
    } catch {
      // Fallback to "bạn"
    }
  }

  const title = `Thiệp mời: ${guestName} | Nhật & Phương`;
  const description = `Mời ${guestName} cùng đến chung vui trong ngày trọng đại của Nhật & Phương.`;

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
  const initialInvitee = await fetchInviteeDataFromServer(token);
  return <InviteTokenPage token={token} initialInvitee={initialInvitee ?? undefined} />;
}
