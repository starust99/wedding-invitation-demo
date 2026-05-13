export type GuestIdentity = {
  name?: string;
  honorific?: string;
  group?: string;
  displayLabel?: string;
  invitationName?: string;
  relationship?: string;
  invitedBy?: string;
  hostRelationship?: string;
  hostPronoun?: string;
  coupleReference?: string;
  householdMode?: string;
  plusOnePolicy?: string;
};

const guestStorageKey = "wedding-demo-guest-identity";

function clean(value: string | null) {
  return value?.trim() || undefined;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesAny(value: string, keywords: string[]) {
  const padded = ` ${normalizeText(value)} `;
  return keywords.some((keyword) => padded.includes(` ${normalizeText(keyword)} `));
}

function sentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function readGuestIdentityFromSearch(search: string): GuestIdentity {
  const params = new URLSearchParams(search);
  return {
    name: clean(params.get("guest") ?? params.get("name")),
    honorific: clean(params.get("honorific") ?? params.get("title")),
    group: clean(params.get("group")),
    displayLabel: clean(params.get("displayLabel") ?? params.get("display_label")),
    invitationName: clean(params.get("invitationName") ?? params.get("invitation_name")),
    relationship: clean(params.get("relationship") ?? params.get("relation")),
    invitedBy: clean(params.get("invitedBy") ?? params.get("invited_by")),
    hostRelationship: clean(params.get("hostRelationship") ?? params.get("host_relationship")),
    hostPronoun: clean(params.get("hostPronoun") ?? params.get("host_pronoun")),
    coupleReference: clean(params.get("coupleReference") ?? params.get("couple_reference")),
    householdMode: clean(params.get("householdMode") ?? params.get("household_mode")),
    plusOnePolicy: clean(params.get("plusOnePolicy") ?? params.get("plus_one_policy")),
  };
}

export function readStoredGuestIdentity(): GuestIdentity {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(guestStorageKey);
    return raw ? JSON.parse(raw) as GuestIdentity : {};
  } catch {
    return {};
  }
}

export function writeStoredGuestIdentity(identity: GuestIdentity) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(guestStorageKey, JSON.stringify(identity));
}

export function resolveGuestIdentity(search: string): GuestIdentity {
  const fromSearch = readGuestIdentityFromSearch(search);
  const stored = readStoredGuestIdentity();
  const identity = {
    ...stored,
    ...Object.fromEntries(Object.entries(fromSearch).filter(([, value]) => Boolean(value))),
  } as GuestIdentity;

  if (identity.name || identity.honorific || identity.group) {
    writeStoredGuestIdentity(identity);
  }

  return identity;
}

export function formatGuestName(identity: GuestIdentity) {
  if (identity.invitationName) return identity.invitationName;
  if (identity.displayLabel) return identity.displayLabel;
  if (!identity.name) return "quý khách";
  return [identity.honorific, identity.name].filter(Boolean).join(" ");
}

export function resolveShortRecipientLabel(identity: GuestIdentity, fallbackLabel?: string) {
  const explicitHonorific = cleanString(identity.honorific);
  if (explicitHonorific) return sentenceCase(explicitHonorific);

  const label = cleanString(identity.invitationName)
    || cleanString(identity.displayLabel)
    || cleanString(identity.name)
    || cleanString(fallbackLabel);
  if (!label || label === "quý khách") return "quý khách";

  const firstWord = label.split(/\s+/)[0];
  const kinshipTerms = new Set([
    "Ông",
    "Bà",
    "Bác",
    "Cô",
    "Chú",
    "Dì",
    "Cậu",
    "Mợ",
    "Thím",
    "Dượng",
    "Anh",
    "Chị",
    "Em",
  ]);

  return kinshipTerms.has(firstWord) ? firstWord : label;
}

export type InvitationTone = "parents_host" | "elder" | "senior" | "peer" | "junior" | "neutral";

export type InvitationCopyInput = GuestIdentity & {
  guestName?: string;
  guestGroup?: string;
  householdMode?: string;
  plusOnePolicy?: string;
  coupleDisplayName?: string;
  venueDisplayName?: string;
};

export type InvitationCopy = {
  tone: InvitationTone;
  guestLabel: string;
  hostPronoun: string;
  hostSubject: string;
  recipientPronoun: string;
  shortRecipientLabel: string;
  recipientLine: string;
  invitedGuestLine: string;
  inviteScope: string;
  greeting: string;
  heroGreeting: string;
  heroInvitationLine: string;
  envelopeLine: string;
  insideInviteLine: string;
  rsvpLead: string;
  rsvpReceivedLine: string;
  thankYouLine: string;
  closingLine: string;
  signaturePrefix: string;
};

const elderKeywords = [
  "ong",
  "ba",
  "bac",
  "co",
  "chu",
  "di",
  "cau",
  "mo",
  "thim",
  "duong",
  "noi",
  "ngoai",
  "ong noi",
  "ba noi",
  "ong ngoai",
  "ba ngoai",
  "ba me",
  "bo me",
  "cha me",
  "phu huynh",
];

const seniorKeywords = ["anh", "chi", "anh chi"];
const juniorKeywords = ["em", "chau", "be", "nho tuoi", "dan em"];
const peerKeywords = ["ban", "ban be", "dong nghiep", "dong mon", "cung lop", "dai hoc", "cap 3", "hoi ban", "team"];
const warmPeerKeywords = ["ban", "ban be", "ban than", "dong nghiep", "dong mon", "cung lop", "dai hoc", "cap 3", "hoi ban", "team"];
const directSeniorKeywords = ["anh", "chi", "anh chi"];

function removeWeddingPartyReferences(value: string) {
  return normalizeText(value)
    .replace(/\bco dau chu re\b/g, " ")
    .replace(/\bco dau\b/g, " ")
    .replace(/\bchu re\b/g, " ")
    .replace(/\bhai ben\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveRelationshipText(input?: InvitationCopyInput) {
  const hostRelationship = cleanString(input?.hostRelationship);
  if (hostRelationship) return hostRelationship;

  const relationship = cleanString(input?.relationship);
  const structuredRelationshipText = [
    relationship ? removeWeddingPartyReferences(relationship) : "",
    input?.honorific,
  ].filter(Boolean).join(" ");
  const fallbackRelationshipText = [
    input?.displayLabel,
    input?.guestName,
    input?.name,
  ].filter(Boolean).join(" ");

  return structuredRelationshipText || fallbackRelationshipText;
}

export function resolveInvitationTone(input?: InvitationCopyInput): InvitationTone {
  const invitedBy = normalizeText(input?.invitedBy ?? "");
  if (invitedBy === "parents" || invitedBy.includes("ba me") || invitedBy.includes("bo me") || invitedBy.includes("gia dinh")) {
    return "parents_host";
  }

  const relationshipText = resolveRelationshipText(input);
  const groupText = [input?.group, input?.guestGroup].filter(Boolean).join(" ");

  if (includesAny(relationshipText, warmPeerKeywords)) return "peer";
  if (includesAny(relationshipText, juniorKeywords)) return "junior";
  if (includesAny(relationshipText, directSeniorKeywords)) return "senior";
  if (includesAny(relationshipText, elderKeywords)) return "elder";
  if (includesAny(relationshipText, seniorKeywords)) return "senior";
  if (includesAny(`${relationshipText} ${groupText}`, peerKeywords)) return "peer";

  return "neutral";
}

function resolveParentsHostPronoun(input?: InvitationCopyInput) {
  const explicit = cleanString(input?.hostPronoun);
  if (explicit) return explicit;

  const relationshipText = [
    input?.hostRelationship,
    input?.invitationName,
    input?.honorific,
    input?.guestName,
    input?.displayLabel,
  ].filter(Boolean).join(" ");

  if (includesAny(relationshipText, peerKeywords)) return "gia đình chúng tôi";
  if (includesAny(relationshipText, juniorKeywords)) return "gia đình anh chị";
  return "gia đình chúng con";
}

function resolveInviteScope(input?: InvitationCopyInput) {
  const guestLabel = normalizeText(input?.invitationName || input?.displayLabel || input?.guestName || input?.name || "");
  const hasFamily = guestLabel.includes("gia dinh") || guestLabel.includes("ca nha");
  if (hasFamily) return "";

  if (input?.householdMode === "family" || input?.plusOnePolicy === "family") return " và gia đình";
  if (input?.householdMode === "couple" || input?.plusOnePolicy === "spouse") return resolveCoupleInviteScope(input);
  if (input?.plusOnePolicy === "lover") return " cùng người thương";
  if (input?.plusOnePolicy === "open_plus_one") return " cùng một người đi cùng";
  return "";
}

function resolveRecipientPronoun(input: InvitationCopyInput | undefined, tone: InvitationTone, guestLabel: string) {
  if (guestLabel === "quý khách") return "quý khách";

  const relationshipText = resolveRelationshipText(input);

  if (tone === "peer") return "bạn";
  if (tone === "junior") return "em";
  if (tone === "senior") {
    if (includesAny(relationshipText, ["anh"])) return "anh";
    if (includesAny(relationshipText, ["chi", "chị"])) return "chị";
    return "anh/chị";
  }
  if (tone === "neutral") {
    if (includesAny(relationshipText, ["anh"])) return "anh";
    if (includesAny(relationshipText, ["chi", "chị"])) return "chị";
    if (includesAny(relationshipText, ["em", "chau", "cháu"])) return "em";
    return guestLabel;
  }

  return guestLabel;
}

function shouldUseFormalGuestLine(tone: InvitationTone, guestLabel: string) {
  return guestLabel === "quý khách" || tone === "parents_host" || tone === "elder" || tone === "neutral";
}

function isCoupleInvite(input?: InvitationCopyInput) {
  return input?.householdMode === "couple" || input?.plusOnePolicy === "spouse";
}

function resolveCoupleRelationship(input?: InvitationCopyInput) {
  return normalizeText(resolveRelationshipText(input));
}

function resolveCoupleInviteScope(input?: InvitationCopyInput) {
  const relationshipText = resolveCoupleRelationship(input);

  if (includesAny(relationshipText, ["anh"])) return " cùng vợ";
  if (includesAny(relationshipText, ["chi", "chị"])) return " cùng chồng";
  if (includesAny(relationshipText, ["ban", "ban than", "dong nghiep"])) return "";
  if (includesAny(relationshipText, ["em", "chau", "cháu"])) return "";
  if (includesAny(relationshipText, ["chu", "chú"])) return " cùng cô";
  if (includesAny(relationshipText, ["co", "cô"])) return " cùng chú";
  if (includesAny(relationshipText, ["di", "dì"])) return " cùng dượng";
  if (includesAny(relationshipText, ["cau", "cậu"])) return " cùng mợ";
  if (includesAny(relationshipText, ["mo", "mợ"])) return " cùng cậu";
  if (includesAny(relationshipText, ["thim", "thím"])) return " cùng chú";
  if (includesAny(relationshipText, ["ong", "ông"])) return " cùng bà";
  if (includesAny(relationshipText, ["ba", "bà"])) return " cùng ông";

  return " cùng người bạn đời";
}

function resolveCoupleInviteRecipient(input: InvitationCopyInput | undefined, tone: InvitationTone, guestLabel: string, recipientPronoun: string) {
  const relationshipText = resolveCoupleRelationship(input);

  if (includesAny(relationshipText, ["anh chi", "anh chị"])) return "vợ chồng anh chị";
  if (includesAny(relationshipText, ["anh"])) return "anh cùng vợ";
  if (includesAny(relationshipText, ["chi", "chị"])) return "chị cùng chồng";
  if (tone === "peer" || includesAny(relationshipText, ["ban", "ban than", "dong nghiep"])) return "vợ chồng bạn";
  if (tone === "junior" || includesAny(relationshipText, ["em", "chau", "cháu"])) return "hai em";
  if (includesAny(relationshipText, ["chu", "chú"])) return `${guestLabel} cùng cô`;
  if (includesAny(relationshipText, ["co", "cô"])) return `${guestLabel} cùng chú`;
  if (includesAny(relationshipText, ["di", "dì"])) return `${guestLabel} cùng dượng`;
  if (includesAny(relationshipText, ["cau", "cậu"])) return `${guestLabel} cùng mợ`;
  if (includesAny(relationshipText, ["mo", "mợ"])) return `${guestLabel} cùng cậu`;
  if (includesAny(relationshipText, ["thim", "thím"])) return `${guestLabel} cùng chú`;
  if (includesAny(relationshipText, ["ong", "ông"])) return `${guestLabel} cùng bà`;
  if (includesAny(relationshipText, ["ba", "bà"])) return `${guestLabel} cùng ông`;

  if (recipientPronoun && recipientPronoun !== guestLabel && recipientPronoun !== "quý khách") {
    return `gia đình ${recipientPronoun}`;
  }

  return `gia đình ${guestLabel}`;
}

function resolveCoupleEnvelopeRecipient(input: InvitationCopyInput | undefined, tone: InvitationTone, guestLabel: string) {
  const relationshipText = resolveCoupleRelationship(input);

  if (includesAny(relationshipText, ["anh"])) return `${guestLabel} cùng vợ`;
  if (includesAny(relationshipText, ["chi", "chị"])) return `${guestLabel} cùng chồng`;
  if (tone === "peer" || tone === "junior" || includesAny(relationshipText, ["ban", "ban than", "dong nghiep", "em", "chau", "cháu"])) {
    return `Vợ chồng ${guestLabel}`;
  }
  if (includesAny(relationshipText, ["chu", "chú"])) return `${guestLabel} cùng cô`;
  if (includesAny(relationshipText, ["co", "cô"])) return `${guestLabel} cùng chú`;
  if (includesAny(relationshipText, ["di", "dì"])) return `${guestLabel} cùng dượng`;
  if (includesAny(relationshipText, ["cau", "cậu"])) return `${guestLabel} cùng mợ`;
  if (includesAny(relationshipText, ["mo", "mợ"])) return `${guestLabel} cùng cậu`;
  if (includesAny(relationshipText, ["thim", "thím"])) return `${guestLabel} cùng chú`;
  if (includesAny(relationshipText, ["ong", "ông"])) return `${guestLabel} cùng bà`;
  if (includesAny(relationshipText, ["ba", "bà"])) return `${guestLabel} cùng ông`;

  return `Gia đình ${guestLabel}`;
}

function resolveCouplePresenceSubject(input: InvitationCopyInput | undefined, tone: InvitationTone, guestLabel: string) {
  const relationshipText = resolveCoupleRelationship(input);

  if (includesAny(relationshipText, ["anh", "chi", "chị"])) return "anh chị";
  if (tone === "peer" || includesAny(relationshipText, ["ban", "ban than", "dong nghiep"])) return "hai bạn";
  if (tone === "junior" || includesAny(relationshipText, ["em", "chau", "cháu"])) return "hai em";
  if (guestLabel && guestLabel !== "quý khách") return `gia đình ${guestLabel}`;

  return "gia đình quý khách";
}

export function buildInvitationCopy(input?: InvitationCopyInput): InvitationCopy {
  const tone = resolveInvitationTone(input);
  const guestLabel = formatGuestName({
    name: input?.guestName ?? input?.name,
    honorific: input?.honorific,
    group: input?.guestGroup ?? input?.group,
    displayLabel: input?.displayLabel,
    invitationName: input?.invitationName,
  });

  const explicitHostPronoun = cleanString(input?.hostPronoun);
  const hostPronouns: Record<InvitationTone, string> = {
    parents_host: resolveParentsHostPronoun(input),
    elder: explicitHostPronoun || "tụi con",
    senior: explicitHostPronoun || "tụi em",
    peer: explicitHostPronoun || "tụi mình",
    junior: explicitHostPronoun || "anh chị",
    neutral: explicitHostPronoun || "gia đình",
  };

  const hostPronoun = hostPronouns[tone];
  const hostSubject = sentenceCase(hostPronoun);
  const inviteScope = resolveInviteScope(input);
  const invitedGuestLine = `${guestLabel}${inviteScope}`;
  const recipientPronoun = resolveRecipientPronoun(input, tone, guestLabel);
  const shortRecipientLabel = resolveShortRecipientLabel(input ?? {}, recipientPronoun);
  const recipientLine = shouldUseFormalGuestLine(tone, guestLabel)
    ? invitedGuestLine
    : `${recipientPronoun}${inviteScope}`;
  const isWarmPeer = tone === "peer" || tone === "junior";
  const isFormal = !isWarmPeer;
  const inviteVerb = isWarmPeer ? "mời" : "trân trọng kính mời";
  const envelopePrefix = isWarmPeer ? "Mời" : "Kính mời";
  const coupleDisplayName = cleanString(input?.coupleDisplayName) || "Nhật & Phương";
  const venueDisplayName = cleanString(input?.venueDisplayName) || "Terracotta Đà Lạt";
  const coupleReference = cleanString(input?.coupleReference) || (tone === "parents_host" ? "hai cháu" : hostPronoun);
  const inviteRecipientLine = shouldUseFormalGuestLine(tone, guestLabel) ? invitedGuestLine : recipientLine;
  const coupleInviteRecipient = resolveCoupleInviteRecipient(input, tone, guestLabel, recipientPronoun);
  const coupleEnvelopeRecipient = resolveCoupleEnvelopeRecipient(input, tone, guestLabel);
  const couplePresenceSubject = resolveCouplePresenceSubject(input, tone, guestLabel);
  const coupleInviteOwner = tone === "parents_host" ? `${coupleReference} ${coupleDisplayName}` : hostPronoun;
  const envelopeRecipientLine = isCoupleInvite(input) ? coupleEnvelopeRecipient : invitedGuestLine;
  const insideInviteLine = isCoupleInvite(input)
    ? `Kính mời: ${sentenceCase(coupleInviteRecipient)} đến chung vui trong lễ cưới của ${coupleInviteOwner}. Sự hiện diện của ${couplePresenceSubject} là niềm vui rất lớn với ${hostPronoun}.`
    : tone === "parents_host"
    ? `${hostSubject} trân trọng kính mời ${inviteRecipientLine} đến chung vui trong lễ cưới của ${coupleReference} ${coupleDisplayName}.`
    : isWarmPeer
      ? `${hostSubject} ${inviteVerb} ${inviteRecipientLine} đến chung vui trong lễ cưới của ${hostPronoun}.`
      : `${hostSubject} trân trọng kính mời ${inviteRecipientLine} đến chung vui trong lễ cưới của ${hostPronoun}.`;
  const heroRecipientLine = shouldUseFormalGuestLine(tone, guestLabel) ? invitedGuestLine : recipientPronoun;
  const heroInvitationLine = isCoupleInvite(input)
    ? `Kính mời ${sentenceCase(coupleInviteRecipient)} đến chung vui trong lễ cưới của ${coupleInviteOwner} tại ${venueDisplayName}.`
    : tone === "parents_host"
      ? `${hostSubject} trân trọng kính mời ${heroRecipientLine} đến chung vui trong lễ cưới của ${coupleReference} ${coupleDisplayName} tại ${venueDisplayName}.`
    : isWarmPeer
      ? `${hostSubject} mời ${heroRecipientLine} đến chung vui trong lễ cưới của ${hostPronoun} tại ${venueDisplayName}.`
      : `${hostSubject} trân trọng kính mời ${heroRecipientLine} đến chung vui trong lễ cưới của ${hostPronoun} tại ${venueDisplayName}.`;
  const rsvpLead = tone === "parents_host" || tone === "elder"
    ? `${hostSubject} mong nhận được lời hồi đáp của ${invitedGuestLine} để chuẩn bị đón tiếp chu đáo`
    : tone === "senior"
      ? `${hostSubject} mong nhận được lời hồi đáp của ${invitedGuestLine} để ${hostPronoun} chuẩn bị đón tiếp được chu đáo`
      : tone === "peer"
        ? `${hostSubject} mong nhận được phản hồi của ${invitedGuestLine} để ${hostPronoun} chuẩn bị ngày vui trọn vẹn hơn`
        : tone === "junior"
          ? `${hostSubject} mong nhận được phản hồi của ${invitedGuestLine} để ${hostPronoun} chuẩn bị ngày vui trọn vẹn hơn`
          : `${hostSubject} mong nhận được lời hồi đáp của ${invitedGuestLine} để ${hostPronoun} chuẩn bị đón tiếp được chu đáo`;
  const rsvpReceivedLine = tone === "peer" || tone === "junior"
    ? `${hostSubject} đã nhận được phản hồi của ${invitedGuestLine}`
    : `${hostSubject} đã nhận được lời hồi đáp của ${invitedGuestLine}`;
  const thankYouLine = tone === "peer"
    ? `${hostSubject} cảm ơn ${invitedGuestLine} đã dành thời gian chung vui trong ngày cưới.`
    : tone === "junior"
      ? `${hostSubject} cảm ơn ${invitedGuestLine} đã dành thời gian chung vui trong ngày cưới.`
      : `${hostSubject} chân thành cảm ơn ${invitedGuestLine} đã dành thời gian chung vui trong ngày cưới.`;

  return {
    tone,
    guestLabel,
    hostPronoun,
    hostSubject,
    recipientPronoun,
    shortRecipientLabel,
    recipientLine,
    invitedGuestLine,
    inviteScope,
    greeting: `${guestLabel === "quý khách" ? "Quý khách" : guestLabel} ${isFormal ? "kính mến" : "thân mến"}`,
    heroGreeting: guestLabel === "quý khách"
      ? "Trân trọng kính mời quý khách"
      : isFormal
        ? `Kính gửi ${guestLabel}`
        : `Gửi ${guestLabel}`,
    heroInvitationLine,
    envelopeLine: `${isCoupleInvite(input) ? "Kính mời" : envelopePrefix}: ${envelopeRecipientLine}`,
    insideInviteLine,
    rsvpLead,
    rsvpReceivedLine,
    thankYouLine,
    closingLine: `Sự hiện diện của ${isCoupleInvite(input) ? couplePresenceSubject : inviteRecipientLine} là niềm vui rất lớn với ${hostPronoun}.`,
    signaturePrefix: tone === "elder" ? "Thương kính" : tone === "peer" || tone === "junior" ? "Thân mến" : "Trân trọng",
  };
}
