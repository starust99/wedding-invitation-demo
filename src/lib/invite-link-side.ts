export type InviteLinkSide = "groom" | "bride";

function normalizeGuestGroup(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveInviteLinkSide(guestGroup?: string | null): InviteLinkSide | null {
  const normalizedGroup = normalizeGuestGroup(guestGroup);

  if (/^(?:nha trai|nhat)(?: |$)/.test(normalizedGroup)) return "groom";
  if (/^(?:nha gai|phuong)(?: |$)/.test(normalizedGroup)) return "bride";
  return null;
}

export function filterInviteesByLinkSide<T extends { guestGroup?: string | null }>(
  invitees: T[],
  side: InviteLinkSide,
) {
  return invitees.filter((invitee) => resolveInviteLinkSide(invitee.guestGroup) === side);
}
