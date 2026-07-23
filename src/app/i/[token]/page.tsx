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
  if (!hasSupabaseEnv()) return null;
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
  const guestPrefix = guestName.charAt(0).toUpperCase() + guestName.slice(1);
  const description = `${guestPrefix} đến chung vui và ghi dấu những khoảnh khắc đáng nhớ cùng Nhật & Phương, 26.12.2026.`;

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
