import { isGroomSideGuestGroup } from "@/lib/rsvp-guest-group";

export type InviteEventAccessInput = {
  guestGroup?: string | null;
  postCeremonyPartyInvited?: boolean | null;
};

export type InviteEventAccess = {
  isGroomSideGuest: boolean;
  canViewCeremony: boolean;
  canUsePostCeremonyFallback: boolean;
};

/**
 * Resolve the private event information an invitee may see and answer.
 * Lodging deliberately does not live here: it remains a separate policy based
 * on family group plus Terracotta attendance.
 */
export function resolveInviteEventAccess({
  guestGroup,
  postCeremonyPartyInvited,
}: InviteEventAccessInput): InviteEventAccess {
  const isGroomSideGuest = isGroomSideGuestGroup(guestGroup);
  const isDirectPostCeremonyInvite = Boolean(postCeremonyPartyInvited);

  return {
    isGroomSideGuest,
    canViewCeremony: !isGroomSideGuest || isDirectPostCeremonyInvite,
    canUsePostCeremonyFallback: !isGroomSideGuest && !isDirectPostCeremonyInvite,
  };
}
