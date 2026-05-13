import {
  createInvitee,
  createMediaAsset,
  type AlbumRule,
  type Invitee,
  type InviteStatus,
  type InviteSupplement,
  type MediaAsset,
  type SupplementStatus,
} from "@/lib/invites";
import type { RSVPResponse } from "@/lib/rsvp-storage";

export type InviteeDatabaseRow = {
  id: string;
  token: string;
  invite_unit: string;
  guest_name: string;
  display_label: string;
  invitation_name?: string;
  honorific: string;
  envelope_line: string;
  inside_invite_line: string;
  invited_by: string;
  relationship: string;
  host_relationship?: string;
  host_pronoun?: string;
  couple_reference?: string;
  household_mode: string;
  plus_one_policy: string;
  guest_group: string;
  audience_tags: string[] | null;
  expected_guest_count: number;
  phone: string;
  email: string;
  notes: string;
  invite_status: InviteStatus;
  created_at: string;
  updated_at: string;
};

export type InviteSupplementDatabaseRow = {
  id: string;
  invitee_id: string;
  table_zone: string;
  table_name: string;
  seat_note: string;
  arrival_note: string;
  status: SupplementStatus;
  published_at: string | null;
  updated_at: string;
};

export type MediaAssetDatabaseRow = {
  id: string;
  src: string;
  title: string;
  alt: string;
  photo_tags: string[] | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

export type AlbumRuleDatabaseRow = {
  audience_tag: string;
  allowed_photo_tags: string[] | null;
  updated_at: string;
};

export function mapInviteSupplementRow(row: InviteSupplementDatabaseRow): InviteSupplement {
  return {
    id: row.id,
    inviteeId: row.invitee_id,
    tableZone: row.table_zone,
    tableName: row.table_name,
    seatNote: row.seat_note,
    arrivalNote: row.arrival_note,
    status: row.status,
    publishedAt: row.published_at ?? undefined,
    updatedAt: row.updated_at,
  };
}

export function mapInviteeRow(row: InviteeDatabaseRow, supplement?: InviteSupplement, rsvp?: RSVPResponse): Invitee {
  return createInvitee({
    id: row.id,
    token: row.token,
    inviteUnit: row.invite_unit as Invitee["inviteUnit"],
    guestName: row.guest_name,
    displayLabel: row.display_label,
    invitationName: row.invitation_name ?? row.display_label,
    honorific: row.honorific,
    envelopeLine: row.envelope_line,
    insideInviteLine: row.inside_invite_line,
    invitedBy: row.invited_by as Invitee["invitedBy"],
    relationship: row.relationship,
    hostRelationship: row.host_relationship ?? "",
    hostPronoun: row.host_pronoun ?? "",
    coupleReference: row.couple_reference ?? "",
    householdMode: row.household_mode as Invitee["householdMode"],
    plusOnePolicy: row.plus_one_policy as Invitee["plusOnePolicy"],
    guestGroup: row.guest_group,
    audienceTags: row.audience_tags ?? [],
    expectedGuestCount: row.expected_guest_count,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    inviteStatus: row.invite_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supplement,
    rsvp,
  });
}

export function toInviteeUpsert(invitee: Invitee) {
  return {
    id: invitee.id,
    token: invitee.token,
    invite_unit: invitee.inviteUnit,
    guest_name: invitee.guestName,
    display_label: invitee.displayLabel,
    invitation_name: invitee.invitationName,
    honorific: invitee.honorific,
    envelope_line: invitee.envelopeLine,
    inside_invite_line: invitee.insideInviteLine,
    invited_by: invitee.invitedBy,
    relationship: invitee.relationship,
    host_relationship: invitee.hostRelationship,
    host_pronoun: invitee.hostPronoun,
    couple_reference: invitee.coupleReference,
    household_mode: invitee.householdMode,
    plus_one_policy: invitee.plusOnePolicy,
    guest_group: invitee.guestGroup,
    audience_tags: invitee.audienceTags,
    expected_guest_count: invitee.expectedGuestCount,
    phone: invitee.phone,
    email: invitee.email,
    notes: invitee.notes,
    invite_status: invitee.inviteStatus,
    updated_at: new Date().toISOString(),
  };
}

export function toSupplementUpsert(inviteeId: string, supplement: Partial<InviteSupplement>) {
  const status = supplement.status === "published" ? "published" : "draft";
  return {
    invitee_id: inviteeId,
    table_zone: supplement.tableZone ?? "",
    table_name: supplement.tableName ?? "",
    seat_note: supplement.seatNote ?? "",
    arrival_note: supplement.arrivalNote ?? "",
    status,
    published_at: status === "published" ? supplement.publishedAt ?? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

export function mapMediaAssetRow(row: MediaAssetDatabaseRow): MediaAsset {
  return createMediaAsset({
    id: row.id,
    src: row.src,
    title: row.title,
    alt: row.alt,
    photoTags: row.photo_tags ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function toMediaAssetUpsert(asset: MediaAsset) {
  return {
    id: asset.id,
    src: asset.src,
    title: asset.title,
    alt: asset.alt,
    photo_tags: asset.photoTags,
    status: asset.status,
    updated_at: new Date().toISOString(),
  };
}

export function mapAlbumRuleRow(row: AlbumRuleDatabaseRow): AlbumRule {
  return {
    audienceTag: row.audience_tag,
    allowedPhotoTags: row.allowed_photo_tags ?? [],
  };
}

export function toAlbumRuleUpsert(rule: AlbumRule) {
  return {
    audience_tag: rule.audienceTag,
    allowed_photo_tags: rule.allowedPhotoTags,
    updated_at: new Date().toISOString(),
  };
}
