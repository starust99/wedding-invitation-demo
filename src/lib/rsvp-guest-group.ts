function normalizeGuestGroup(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Resort lodging is reserved for the paternal and maternal family groups
 * imported from the guest workbook. Parent friends, colleagues and other
 * invitees answer the party-size question instead.
 */
export function isFamilyLodgingGuestGroup(value?: string | null) {
  const group = normalizeGuestGroup(value);
  return /(?:^| )ho (?:noi|ngoai)(?: |$)/.test(group);
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
