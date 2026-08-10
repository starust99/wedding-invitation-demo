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
