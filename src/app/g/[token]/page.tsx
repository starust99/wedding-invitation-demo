import type { Metadata } from "next";
import {
  buildSharedInvitationMetadata,
  listSharedInvitationTokens,
  SharedInvitationTokenRoutePage,
  type SharedInvitationTokenRouteProps,
} from "@/lib/invite-share-page";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  const tokens = await listSharedInvitationTokens();
  return tokens.map((token) => ({ token }));
}

export async function generateMetadata({ params }: SharedInvitationTokenRouteProps): Promise<Metadata> {
  const { token } = await params;
  return buildSharedInvitationMetadata(token, "/g");
}

export default SharedInvitationTokenRoutePage;
