import type { Metadata } from "next";
import {
  buildSharedInvitationMetadata,
  SharedInvitationTokenRoutePage,
  type SharedInvitationTokenRouteProps,
} from "@/lib/invite-share-page";

// Messenger Web canary: preserve the canonical /g edge-cached route for every
// working client while reproducing the request-time response contract that
// Messenger Desktop accepted before the ISR migration.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: SharedInvitationTokenRouteProps): Promise<Metadata> {
  const { token } = await params;
  return buildSharedInvitationMetadata(token, "/mw");
}

export default SharedInvitationTokenRoutePage;
