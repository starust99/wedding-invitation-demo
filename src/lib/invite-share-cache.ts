import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

export const sharedInvitationRoutes = ["/g", "/w", "/t"] as const;

export function sharedInvitationCacheTag(token: string) {
  return `shared-invitation:${token}`;
}

export function revalidateSharedInvitation(token: string) {
  const normalizedToken = token.trim();
  if (!normalizedToken) return;

  revalidateTag(sharedInvitationCacheTag(normalizedToken), { expire: 0 });
  for (const route of sharedInvitationRoutes) {
    revalidatePath(`${route}/${encodeURIComponent(normalizedToken)}`);
  }
}
