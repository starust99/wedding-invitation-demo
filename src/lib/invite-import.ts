import type { Invitee } from "@/lib/invites";

function normalizeInviteeMatchKey(value?: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inviteeMatchKeys(invitee: Invitee) {
  return [...new Set([
    invitee.displayLabel,
    invitee.guestName,
    invitee.invitationName,
  ].map(normalizeInviteeMatchKey).filter(Boolean))];
}

export function preserveExistingInviteLinks(
  nextInvitees: Invitee[],
  existingInvitees: Invitee[],
  hasPostCeremonyPartyColumn = true,
  hasTerracottaLodgingColumn = true,
) {
  const candidatesByKey = new Map<string, Invitee[]>();
  for (const invitee of existingInvitees) {
    for (const key of inviteeMatchKeys(invitee)) {
      const candidates = candidatesByKey.get(key) ?? [];
      candidates.push(invitee);
      candidatesByKey.set(key, candidates);
    }
  }

  const consumedIds = new Set<string>();
  return nextInvitees.map((invitee) => {
    const noteKey = normalizeInviteeMatchKey(invitee.notes);
    const candidates = inviteeMatchKeys(invitee)
      .flatMap((key) => candidatesByKey.get(key) ?? [])
      .filter((candidate, index, all) => all.findIndex((item) => item.id === candidate.id) === index)
      .filter((candidate) => !consumedIds.has(candidate.id));
    const match = candidates.find((candidate) => normalizeInviteeMatchKey(candidate.notes) === noteKey)
      ?? candidates[0];
    if (!match) return invitee;

    consumedIds.add(match.id);
    return {
      ...invitee,
      id: match.id,
      token: match.token,
      createdAt: match.createdAt,
      inviteStatus: match.inviteStatus,
      notes: invitee.notes || match.notes,
      postCeremonyPartyInvited: hasPostCeremonyPartyColumn
        ? invitee.postCeremonyPartyInvited
        : match.postCeremonyPartyInvited,
      terracottaLodgingEligible: hasTerracottaLodgingColumn
        ? invitee.terracottaLodgingEligible
        : match.terracottaLodgingEligible,
      rsvp: match.rsvp,
    };
  });
}
