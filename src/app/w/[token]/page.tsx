import type { Metadata } from "next";
import {
  buildInvitationMetadata,
  InvitationTokenRoutePage,
  type InvitationTokenRouteProps,
} from "@/lib/invite-page-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: InvitationTokenRouteProps): Promise<Metadata> {
  const { token } = await params;
  return buildInvitationMetadata(token, "/w");
}

export default InvitationTokenRoutePage;
