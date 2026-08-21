import "server-only";

import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { cache } from "react";
import { InviteTokenPage } from "@/components/InviteTokenPage";
import { sharedInvitationCacheTag } from "@/lib/invite-share-cache";
import { mapInviteeRow, type InviteeDatabaseRow } from "@/lib/invite-mapper";
import {
  invitationOgImageAlt,
  invitationOgImageHeight,
  invitationOgImageType,
  invitationOgImageUrl,
  invitationOgImageWidth,
} from "@/lib/invite-preview";
import type { Invitee } from "@/lib/invites";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { isMissingSupabaseColumn } from "@/lib/supabase-errors";

export type SharedInvitationTokenRouteProps = {
  params: Promise<{ token: string }>;
};

const ogImage = {
  url: invitationOgImageUrl,
  secureUrl: invitationOgImageUrl,
  width: invitationOgImageWidth,
  height: invitationOgImageHeight,
  type: invitationOgImageType,
  alt: invitationOgImageAlt,
};

const sharedInviteeColumns = [
  "id",
  "token",
  "invite_unit",
  "guest_name",
  "display_label",
  "salutation_cluster",
  "invitation_name",
  "honorific",
  "envelope_line",
  "inside_invite_line",
  "invited_by",
  "relationship",
  "host_relationship",
  "host_pronoun",
  "couple_reference",
  "household_mode",
  "plus_one_policy",
  "guest_group",
  "expected_guest_count",
  "post_ceremony_party_invited",
  "terracotta_lodging_eligible",
].join(",");
const legacySharedInviteeColumns = sharedInviteeColumns
  .split(",")
  .filter((column) => column !== "terracotta_lodging_eligible")
  .join(",");

function toSharedInvitee(invitee: Invitee): Invitee {
  return {
    ...invitee,
    audienceTags: [],
    notes: "",
    inviteStatus: "invited",
    createdAt: "",
    updatedAt: "",
    supplement: undefined,
    rsvp: undefined,
  };
}

async function readSharedInvitee(token: string): Promise<Invitee | null> {
  if (!hasSupabaseEnv()) {
    try {
      const fs = require("fs");
      const path = require("path");
      const cachePath = path.join(process.cwd(), "invitees-cache.json");
      if (!fs.existsSync(cachePath)) return null;
      const invitees = JSON.parse(fs.readFileSync(cachePath, "utf8")) as Invitee[];
      const invitee = invitees.find((item) => item.token === token);
      return invitee ? toSharedInvitee(invitee) : null;
    } catch {
      return null;
    }
  }

  const supabase = getSupabaseServerClient();
  let result = await supabase
    .from("invitees")
    .select(sharedInviteeColumns)
    .eq("token", token)
    .maybeSingle();

  // Shared links must stay readable during the additive migration window.
  // The legacy family-group rule still resolves true when the column is absent.
  if (isMissingSupabaseColumn(result.error, "terracotta_lodging_eligible")) {
    result = await supabase
      .from("invitees")
      .select(legacySharedInviteeColumns)
      .eq("token", token)
      .maybeSingle();
  }

  const { data, error } = result;

  if (error) throw error;
  if (!data) return null;

  // Admin notes are intentionally excluded from the
  // edge-cached share document. The dynamic invitation API remains the source
  // of truth after hydration.
  return toSharedInvitee(mapInviteeRow({
    ...(data as unknown as Omit<InviteeDatabaseRow, "notes" | "invite_status" | "audience_tags" | "created_at" | "updated_at">),
    audience_tags: [],
    notes: "",
    created_at: "",
    updated_at: "",
    // RSVP state is intentionally hydrated from the uncached invitation API.
    invite_status: "invited",
  }));
}

const getSharedInvitee = cache((token: string) => unstable_cache(
  () => readSharedInvitee(token),
  ["shared-invitation-v2", token],
  {
    revalidate: 86400,
    tags: [sharedInvitationCacheTag(token)],
  },
)());

export async function listSharedInvitationTokens(): Promise<string[]> {
  if (!hasSupabaseEnv()) {
    try {
      const fs = require("fs");
      const path = require("path");
      const cachePath = path.join(process.cwd(), "invitees-cache.json");
      if (!fs.existsSync(cachePath)) return [];
      const invitees = JSON.parse(fs.readFileSync(cachePath, "utf8")) as Array<{ token?: string }>;
      return [...new Set(invitees.map((invitee) => String(invitee.token || "").trim()).filter(Boolean))];
    } catch {
      return [];
    }
  }

  const { data, error } = await getSupabaseServerClient()
    .from("invitees")
    .select("token");

  if (error) throw error;

  return [...new Set(
    (data || [])
      .map((invitee) => String(invitee.token || "").trim())
      .filter(Boolean),
  )];
}

function resolveMetadataGuestName(invitee: Invitee) {
  // `guestName` is the product's "Cụm tên khách" and must stay identical to
  // the personalized hero copy shown after opening the link.
  return String(
    invitee.guestName
      || invitee.displayLabel
      || invitee.invitationName
      || "",
  ).trim();
}

export async function buildSharedInvitationMetadata(
  token: string,
  publicRoute: "/g" | "/t" | "/w",
): Promise<Metadata> {
  const invitee = await getSharedInvitee(token);

  if (!invitee) {
    return {
      title: "Thiệp mời không còn hiệu lực | Nhật & Phương",
      description: "Link thiệp mời này không còn hiệu lực.",
      robots: { index: false, follow: false },
    };
  }

  const guestName = resolveMetadataGuestName(invitee);
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

export async function SharedInvitationTokenRoutePage({ params }: SharedInvitationTokenRouteProps) {
  const { token } = await params;
  const invitee = await getSharedInvitee(token);
  if (!invitee) notFound();

  return <InviteTokenPage token={token} initialInvitee={invitee} />;
}
