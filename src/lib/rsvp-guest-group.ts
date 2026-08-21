function normalizeGuestGroup(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Every workbook group owned by the groom's family uses the `[Nhà Trai]`
 * prefix. Match the normalized prefix instead of enumerating today's groups so
 * future parent/family groups inherit the same event-access policy.
 */
export function isGroomSideGuestGroup(value?: string | null) {
  const group = normalizeGuestGroup(value);
  return /^nha trai(?: |$)/.test(group);
}

/**
 * The paternal and maternal family groups keep their legacy automatic lodging
 * eligibility. Other invitees require the separate invite-scoped flag.
 */
export function isFamilyLodgingGuestGroup(value?: string | null) {
  const group = normalizeGuestGroup(value);
  return /(?:^| )ho (?:noi|ngoai)(?: |$)/.test(group);
}

/**
 * Lodging is an invite-scoped permission. The legacy family groups stay
 * eligible as a compatibility/default rule, while selected non-family guests
 * can be opted in explicitly by Admin.
 */
export function isTerracottaLodgingEligible(
  guestGroup?: string | null,
  terracottaLodgingEligible?: boolean | null,
) {
  return Boolean(terracottaLodgingEligible) || isFamilyLodgingGuestGroup(guestGroup);
}

/**
 * Paternal-side relatives travel after the banquet, so their invitation only
 * offers the night of 26/12 (or no resort stay). Keep this stricter than the
 * general family check so parent friends are never pulled into lodging.
 */
export function isGroomFamilyLodgingGuestGroup(value?: string | null) {
  const group = normalizeGuestGroup(value);
  return /^nha trai ho (?:noi|ngoai)$/.test(group);
}
