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

export function normalizeText(value: string) {
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
  const label = cleanString(identity.invitationName)
    || cleanString(identity.displayLabel)
    || cleanString(identity.name)
    || cleanString(fallbackLabel);
  if (!label || label === "quý khách") return "quý khách";

  const compactPhrases = [
    ["gia dinh chu thim", "gia đình chú thím"],
    ["gia dinh cau mo", "gia đình cậu mợ"],
    ["gia dinh co chu", "gia đình cô chú"],
    ["gia dinh vo chong", "gia đình vợ chồng"],
    ["gia dinh thim", "gia đình thím"],
    ["gia dinh duong", "gia đình dượng"],
    ["gia dinh chau", "gia đình cháu"],
    ["gia dinh anh", "gia đình anh"],
    ["gia dinh chi", "gia đình chị"],
    ["gia dinh bac", "gia đình bác"],
    ["gia dinh chu", "gia đình chú"],
    ["gia dinh cau", "gia đình cậu"],
    ["gia dinh ban", "gia đình bạn"],
    ["gia dinh em", "gia đình em"],
    ["gia dinh co", "gia đình cô"],
    ["gia dinh di", "gia đình dì"],
    ["gia dinh mo", "gia đình mợ"],
    ["vo chong dong nghiep", "vợ chồng đồng nghiệp"],
    ["vo chong anh chi", "vợ chồng anh chị"],
    ["vo chong co chu", "vợ chồng cô chú"],
    ["vo chong chu thim", "vợ chồng chú thím"],
    ["vo chong di duong", "vợ chồng dì dượng"],
    ["vo chong cau mo", "vợ chồng cậu mợ"],
    ["vo chong chau", "vợ chồng cháu"],
    ["vo chong anh", "vợ chồng anh"],
    ["vo chong chi", "vợ chồng chị"],
    ["vo chong bac", "vợ chồng bác"],
    ["vo chong ban", "vợ chồng bạn"],
    ["vo chong em", "vợ chồng em"],
    ["ong ba", "ông bà"],
    ["bo me", "bố mẹ"],
    ["ba me", "ba mẹ"],
    ["cha me", "cha mẹ"],
    ["co chu", "cô chú"],
    ["cau mo", "cậu mợ"],
  ] as const;
  const normalizedLabel = normalizeText(label);
  const phrase = compactPhrases.find(([normalizedPhrase]) => normalizedLabel === normalizedPhrase || normalizedLabel.startsWith(`${normalizedPhrase} `));
  if (phrase) return phrase[1];

  const explicitHonorific = cleanString(identity.honorific);
  if (explicitHonorific) return sentenceCase(explicitHonorific);

  const firstWord = label.split(/\s+/)[0];
  const kinshipTerms: Record<string, string> = {
    ong: "Ông",
    ba: "Bà",
    bac: "Bác",
    co: "Cô",
    chu: "Chú",
    di: "Dì",
    cau: "Cậu",
    mo: "Mợ",
    thim: "Thím",
    duong: "Dượng",
    anh: "Anh",
    chi: "Chị",
    em: "Em",
    chau: "Cháu",
    bo: "Bố",
    me: "Mẹ",
  };

  return kinshipTerms[normalizeText(firstWord)] ?? label;
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
  invitationHostSubject: string;
  rsvpLead: string;
  rsvpReceivedLine: string;
  thankYouLine: string;
  closingLine: string;
  signaturePrefix: string;
};

type GuestAudience = "grand_elder" | "elder" | "senior" | "peer" | "junior" | "formal" | "neutral";

type AddressProfile = {
  audience: GuestAudience;
  guestLabel: string;
  shortRecipientLabel: string;
  recipientPronoun: string;
  singleRecipient: string;
  coupleRecipient: string;
  familyRecipient: string;
  envelopeSingle: string;
  envelopeCouple: string;
  envelopeFamily: string;
  presenceSingle: string;
  presenceCouple: string;
  presenceFamily: string;
};

const grandElderKeywords = ["ong", "ba", "ong ba", "noi", "ngoai", "ong noi", "ba noi", "ong ngoai", "ba ngoai"];
const elderKeywords = ["bac", "co", "chu", "di", "cau", "mo", "thim", "duong", "phu huynh", "ba me", "bo me", "cha me", "bo", "me"];
const seniorKeywords = ["anh", "chi", "anh chi"];
const juniorKeywords = ["em", "chau", "be", "nho tuoi", "dan em"];
const peerKeywords = ["ban", "ban be", "ban than", "dong nghiep", "dong mon", "cung lop", "dai hoc", "cap 3", "hoi ban", "team"];
const formalKeywords = ["sep", "khach quy", "thay co", "doi tac"];

type PairLabel = {
  invite: string;
  envelope: string;
  presence: string;
};

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

  const audience = resolveGuestAudience(input);
  if (audience === "peer") return "peer";
  if (audience === "junior") return "junior";
  if (audience === "senior") return "senior";
  if (audience === "elder" || audience === "grand_elder") return "elder";

  return "neutral";
}

function resolveGuestAudience(input?: InvitationCopyInput): GuestAudience {
  const relationshipText = resolveRelationshipText(input);
  const groupText = [input?.group, input?.guestGroup].filter(Boolean).join(" ");
  const combinedText = `${relationshipText} ${groupText}`;

  if (includesAny(combinedText, formalKeywords)) return "formal";
  if (includesAny(relationshipText, grandElderKeywords)) return "grand_elder";
  if (includesAny(relationshipText, elderKeywords)) return "elder";
  if (includesAny(relationshipText, ["anh chi", "anh chị"]) || includesAny(relationshipText, seniorKeywords)) return "senior";
  if (includesAny(relationshipText, juniorKeywords)) return "junior";
  if (includesAny(combinedText, peerKeywords)) return "peer";

  return "neutral";
}

function resolveParentsHostPronoun(input?: InvitationCopyInput) {
  const relationshipText = [
    input?.hostRelationship,
    input?.invitationName,
    input?.honorific,
    input?.guestName,
    input?.displayLabel,
  ].filter(Boolean).join(" ");

  if (includesAny(relationshipText, ["chau", "cháu", "be", "bé"])) return "gia đình";
  if (includesAny(relationshipText, seniorKeywords)) return "em";
  if (includesAny(relationshipText, ["em"])) return "anh chị";

  const explicit = cleanString(input?.hostPronoun);
  if (explicit) return explicit;

  if (includesAny(relationshipText, peerKeywords) || includesAny(relationshipText, formalKeywords)) return "gia đình chúng tôi";
  if (includesAny(relationshipText, juniorKeywords)) return "anh chị";
  return "gia đình chúng con";
}

function resolveCoupleReference(input: InvitationCopyInput | undefined, tone: InvitationTone, hostPronoun: string) {
  const explicit = cleanString(input?.coupleReference);
  const relationshipText = [
    input?.hostRelationship,
    input?.relationship,
    input?.invitationName,
    input?.guestName,
    input?.displayLabel,
  ].filter(Boolean).join(" ");

  if (tone === "parents_host" && includesAny(relationshipText, ["chau", "cháu"])) {
    return explicit && explicit !== "hai cháu" ? explicit : "hai em";
  }

  return explicit || (tone === "parents_host" ? "hai cháu" : hostPronoun);
}

function resolveRecipientPronoun(input: InvitationCopyInput | undefined, tone: InvitationTone, guestLabel: string, audience = resolveGuestAudience(input)) {
  if (guestLabel === "quý khách") return "quý khách";

  const relationshipText = resolveRelationshipText(input);

  if (tone === "peer") return "bạn";
  if (tone === "junior") return "em";
  if (tone === "senior") {
    if (includesAny(relationshipText, ["anh chi", "anh chị"])) return "anh chị";
    if (includesAny(relationshipText, ["anh"])) return "anh";
    if (includesAny(relationshipText, ["chi", "chị"])) return "chị";
    return "anh/chị";
  }
  if (audience === "formal") return "quý khách";
  if (tone === "neutral") {
    if (includesAny(relationshipText, ["anh chi", "anh chị"])) return "anh chị";
    if (includesAny(relationshipText, ["anh"])) return "anh";
    if (includesAny(relationshipText, ["chi", "chị"])) return "chị";
    if (includesAny(relationshipText, ["em", "chau", "cháu"])) return "em";
    return guestLabel;
  }

  return guestLabel;
}

function resolveKinshipPronoun(input: InvitationCopyInput | undefined, tone: InvitationTone, guestLabel: string) {
  const relationshipText = resolveRelationshipText(input);
  const isFamilyOrCouple = isFamilyInvite(input) || isCoupleInvite(input) || includesFamilyLabel(guestLabel) || labelAlreadyLooksLikePair(guestLabel);

  if (includesAny(relationshipText, ["ong", "ba", "ông", "bà"])) return "ông bà";
  if (includesAny(relationshipText, ["bo me", "bố mẹ", "ba me", "ba mẹ", "cha me", "cha mẹ"])) return "bố mẹ";
  if (includesAny(relationshipText, ["bo", "bố", "ba", "mẹ", "me", "cha"])) return isFamilyOrCouple ? "bố mẹ" : (includesAny(relationshipText, ["mẹ", "me"]) ? "mẹ" : "bố");
  if (includesAny(relationshipText, ["bac", "bác"])) return isFamilyOrCouple ? "hai bác" : "bác";
  if (includesAny(relationshipText, ["chu", "chú"])) return isFamilyOrCouple ? "cô chú" : "chú";
  if (includesAny(relationshipText, ["co", "cô"])) return isFamilyOrCouple ? "cô chú" : "cô";
  if (includesAny(relationshipText, ["cau", "cậu"])) return isFamilyOrCouple ? "cậu mợ" : "cậu";
  if (includesAny(relationshipText, ["di", "dì"])) return isFamilyOrCouple ? "dì dượng" : "dì";
  if (includesAny(relationshipText, ["mo", "mợ"])) return isFamilyOrCouple ? "cậu mợ" : "mợ";
  
  if (includesAny(relationshipText, ["anh chi", "anh chị"])) return "anh chị";
  if (includesAny(relationshipText, ["anh"])) return isFamilyOrCouple ? "anh chị" : "anh";
  if (includesAny(relationshipText, ["chi", "chị"])) return isFamilyOrCouple ? "anh chị" : "chị";
  
  if (includesAny(relationshipText, ["em"])) return "em";
  if (includesAny(relationshipText, ["chau", "cháu"])) return "cháu";
  
  if (tone === "peer") return "bạn";
  if (tone === "junior") return "em";
  
  return "bạn";
}

function shouldUseFormalGuestLine(tone: InvitationTone, guestLabel: string) {
  return guestLabel === "quý khách" || tone === "parents_host" || tone === "elder" || tone === "neutral";
}

function isCoupleInvite(input?: InvitationCopyInput) {
  return input?.householdMode === "couple" || input?.plusOnePolicy === "spouse";
}

function isFamilyInvite(input?: InvitationCopyInput) {
  return input?.householdMode === "family" || input?.plusOnePolicy === "family";
}

function isOpenCompanionInvite(input?: InvitationCopyInput) {
  return input?.plusOnePolicy === "lover" || input?.plusOnePolicy === "open_plus_one";
}

function includesFamilyLabel(label: string) {
  const normalized = normalizeText(label);
  return normalized.includes("gia dinh") || normalized.includes("ca nha");
}

function labelAlreadyLooksLikePair(label: string) {
  const normalized = normalizeText(label);
  return [
    "vo chong",
    "ong ba",
    "bo me",
    "ba me",
    "cha me",
    "anh chi",
    "co chu",
    "chu thim",
    "di duong",
    "cau mo",
  ].some((prefix) => normalized.startsWith(prefix));
}

function pairEnvelope(guestLabel: string) {
  return labelAlreadyLooksLikePair(guestLabel) ? guestLabel : `Vợ chồng ${guestLabel}`;
}

function resolveExplicitPairLabel(input: InvitationCopyInput | undefined, guestLabel: string): PairLabel | undefined {
  const relationshipText = resolveRelationshipText(input);
  const exactPair = (phrases: string[]) => includesAny(relationshipText, phrases);

  if (exactPair(["ong ba", "ông bà"])) {
    return {
      invite: guestLabel,
      envelope: guestLabel,
      presence: "Ông Bà",
    };
  }

  if (exactPair(["bo me", "bố mẹ", "ba me", "ba mẹ", "cha me", "cha mẹ"])) {
    return {
      invite: guestLabel,
      envelope: guestLabel,
      presence: "Bố Mẹ",
    };
  }

  const pairProfiles: { phrases: string[]; invite: string; presence: string }[] = [
    { phrases: ["vo chong anh chi", "vợ chồng anh chị"], invite: "vợ chồng anh chị", presence: "anh chị" },
    { phrases: ["vo chong anh", "vợ chồng anh"], invite: "vợ chồng anh", presence: "anh chị" },
    { phrases: ["vo chong chi", "vợ chồng chị"], invite: "vợ chồng chị", presence: "anh chị" },
    { phrases: ["vo chong em", "vợ chồng em"], invite: "vợ chồng em", presence: "hai em" },
    { phrases: ["vo chong chau", "vợ chồng cháu"], invite: "vợ chồng cháu", presence: "hai cháu" },
    { phrases: ["vo chong ban", "vợ chồng bạn"], invite: "vợ chồng bạn", presence: "hai bạn" },
    { phrases: ["vo chong dong nghiep", "vợ chồng đồng nghiệp"], invite: "vợ chồng anh chị", presence: "anh chị" },
    { phrases: ["vo chong bac", "vợ chồng bác"], invite: "vợ chồng bác", presence: "hai bác" },
    { phrases: ["vo chong co chu", "vợ chồng cô chú"], invite: "vợ chồng cô chú", presence: "cô chú" },
    { phrases: ["vo chong chu thim", "vợ chồng chú thím"], invite: "vợ chồng chú thím", presence: "chú thím" },
    { phrases: ["vo chong di duong", "vợ chồng dì dượng"], invite: "vợ chồng dì dượng", presence: "dì dượng" },
    { phrases: ["vo chong cau mo", "vợ chồng cậu mợ"], invite: "vợ chồng cậu mợ", presence: "cậu mợ" },
  ];

  const profile = pairProfiles.find((item) => exactPair(item.phrases));
  if (!profile) return undefined;
  const explicitGuestLabel = pairEnvelope(guestLabel);

  return {
    invite: explicitGuestLabel,
    envelope: explicitGuestLabel,
    presence: profile.presence,
  };
}

function resolvePairLabel(input: InvitationCopyInput | undefined, guestLabel: string, recipientPronoun: string, audience: GuestAudience) {
  const relationshipText = resolveRelationshipText(input);
  const explicitPair = resolveExplicitPairLabel(input, guestLabel);
  if (explicitPair) return explicitPair;

  if (audience === "formal") {
    return {
      invite: `${guestLabel} cùng gia đình`,
      envelope: `${guestLabel} cùng gia đình`,
      presence: "quý khách và gia đình",
    };
  }
  if (includesAny(relationshipText, ["anh chi", "anh chị"])) {
    return {
      invite: "vợ chồng anh chị",
      envelope: `Vợ chồng ${guestLabel}`,
      presence: "anh chị",
    };
  }
  if (includesAny(relationshipText, ["anh"])) {
    return {
      invite: "anh cùng vợ",
      envelope: `${guestLabel} cùng vợ`,
      presence: "anh chị",
    };
  }
  if (includesAny(relationshipText, ["chi", "chị"])) {
    return {
      invite: "chị cùng chồng",
      envelope: `${guestLabel} cùng chồng`,
      presence: "anh chị",
    };
  }
  if (audience === "peer") {
    return {
      invite: "vợ chồng bạn",
      envelope: `Vợ chồng ${guestLabel}`,
      presence: "hai bạn",
    };
  }
  if (audience === "junior") {
    return {
      invite: "hai em",
      envelope: `Vợ chồng ${guestLabel}`,
      presence: "hai em",
    };
  }
  if (includesAny(relationshipText, ["ong", "ông"])) {
    return {
      invite: `${guestLabel} cùng Bà`,
      envelope: `${guestLabel} cùng Bà`,
      presence: "Ông Bà",
    };
  }
  if (includesAny(relationshipText, ["ba", "bà"])) {
    return {
      invite: `${guestLabel} cùng Ông`,
      envelope: `${guestLabel} cùng Ông`,
      presence: "Ông Bà",
    };
  }
  if (includesAny(relationshipText, ["bo", "bố"])) {
    return {
      invite: `${guestLabel} cùng Mẹ`,
      envelope: `${guestLabel} cùng Mẹ`,
      presence: "Bố Mẹ",
    };
  }
  if (includesAny(relationshipText, ["me", "mẹ"])) {
    return {
      invite: `${guestLabel} cùng Bố`,
      envelope: `${guestLabel} cùng Bố`,
      presence: "Bố Mẹ",
    };
  }
  if (includesAny(relationshipText, ["chu", "chú"])) {
    return {
      invite: `${guestLabel} cùng Cô`,
      envelope: `${guestLabel} cùng Cô`,
      presence: "Chú Cô",
    };
  }
  if (includesAny(relationshipText, ["co", "cô"])) {
    return {
      invite: `${guestLabel} cùng Chú`,
      envelope: `${guestLabel} cùng Chú`,
      presence: "Cô Chú",
    };
  }
  if (includesAny(relationshipText, ["di", "dì"])) {
    return {
      invite: `${guestLabel} cùng Dượng`,
      envelope: `${guestLabel} cùng Dượng`,
      presence: "Dì Dượng",
    };
  }
  if (includesAny(relationshipText, ["cau", "cậu"])) {
    return {
      invite: `${guestLabel} cùng Mợ`,
      envelope: `${guestLabel} cùng Mợ`,
      presence: "Cậu Mợ",
    };
  }
  if (includesAny(relationshipText, ["mo", "mợ"])) {
    return {
      invite: `${guestLabel} cùng Cậu`,
      envelope: `${guestLabel} cùng Cậu`,
      presence: "Mợ Cậu",
    };
  }
  if (includesAny(relationshipText, ["thim", "thím"])) {
    return {
      invite: `${guestLabel} cùng Chú`,
      envelope: `${guestLabel} cùng Chú`,
      presence: "Thím Chú",
    };
  }
  if (includesAny(relationshipText, ["duong", "dượng"])) {
    return {
      invite: `${guestLabel} cùng Dì`,
      envelope: `${guestLabel} cùng Dì`,
      presence: "Dượng Dì",
    };
  }
  if (includesAny(relationshipText, ["bac", "bác"])) {
    return {
      invite: `${guestLabel} cùng gia đình`,
      envelope: `${guestLabel} cùng gia đình`,
      presence: "Bác và gia đình",
    };
  }
  if (recipientPronoun && recipientPronoun !== guestLabel && recipientPronoun !== "quý khách") {
    return {
      invite: `gia đình ${recipientPronoun}`,
      envelope: `Gia đình ${guestLabel}`,
      presence: `gia đình ${recipientPronoun}`,
    };
  }

  return {
    invite: `${guestLabel} cùng gia đình`,
    envelope: `${guestLabel} cùng gia đình`,
    presence: guestLabel === "quý khách" ? "quý khách và gia đình" : `${guestLabel} và gia đình`,
  };
}

function resolveFamilyPresence(input: InvitationCopyInput | undefined, guestLabel: string, shortRecipientLabel: string, audience: GuestAudience) {
  if (guestLabel === "quý khách") return "quý khách và gia đình";
  if (includesFamilyLabel(guestLabel)) return shortRecipientLabel;
  if (audience === "senior") return "anh chị và gia đình";
  if (audience === "peer") return "bạn và gia đình";
  if (audience === "junior") return "em và gia đình";
  if (audience === "formal") return "quý khách và gia đình";
  if (includesAny(resolveRelationshipText(input), ["ong", "ba", "ông", "bà"])) return "Ông Bà và gia đình";
  return `${shortRecipientLabel} và gia đình`;
}

function resolveSinglePresence(guestLabel: string, recipientPronoun: string, audience: GuestAudience) {
  if (guestLabel === "quý khách" || audience === "formal") return "quý khách";
  if (audience === "senior" || audience === "peer" || audience === "junior") return recipientPronoun;
  return guestLabel;
}

function resolveAddressProfile(input: InvitationCopyInput | undefined, tone: InvitationTone, guestLabel: string): AddressProfile {
  const audience = resolveGuestAudience(input);
  const recipientPronoun = resolveRecipientPronoun(input, tone, guestLabel, audience);
  const shortRecipientLabel = resolveShortRecipientLabel(input ?? {}, recipientPronoun);
  const familyName = includesFamilyLabel(guestLabel) ? guestLabel : `${guestLabel} và gia đình`;
  const familyRecipient = guestLabel === "quý khách" ? "quý khách và gia đình" : familyName;
  const singleRecipient = shouldUseFormalGuestLine(tone, guestLabel) ? guestLabel : recipientPronoun;
  const pair = resolvePairLabel(input, guestLabel, recipientPronoun, audience);
  const openCompanion = input?.plusOnePolicy === "lover" ? `${guestLabel} cùng người thương` : `${guestLabel} cùng một người đi cùng`;

  return {
    audience,
    guestLabel,
    shortRecipientLabel,
    recipientPronoun,
    singleRecipient,
    coupleRecipient: isOpenCompanionInvite(input) ? openCompanion : pair.invite,
    familyRecipient,
    envelopeSingle: guestLabel,
    envelopeCouple: isOpenCompanionInvite(input) ? openCompanion : pair.envelope,
    envelopeFamily: familyRecipient,
    presenceSingle: resolveSinglePresence(guestLabel, recipientPronoun, audience),
    presenceCouple: isOpenCompanionInvite(input)
      ? (audience === "peer" ? "hai bạn" : `${shortRecipientLabel} và người đi cùng`)
      : pair.presence,
    presenceFamily: resolveFamilyPresence(input, guestLabel, shortRecipientLabel, audience),
  };
}

function resolveInviteScope(input: InvitationCopyInput | undefined, address: AddressProfile) {
  if (isFamilyInvite(input)) return address.familyRecipient.replace(address.guestLabel, "").trimStart();
  if (isCoupleInvite(input)) return address.envelopeCouple.replace(address.guestLabel, "").trimStart();
  if (isOpenCompanionInvite(input)) return address.envelopeCouple.replace(address.guestLabel, "").trimStart();
  return "";
}

function resolveInviteRecipient(address: AddressProfile, input?: InvitationCopyInput) {
  if (isFamilyInvite(input)) return address.familyRecipient;
  if (isCoupleInvite(input) || isOpenCompanionInvite(input)) return address.coupleRecipient;
  return address.singleRecipient;
}

function resolveEnvelopeRecipient(address: AddressProfile, input?: InvitationCopyInput) {
  if (isFamilyInvite(input)) return address.envelopeFamily;
  if (isCoupleInvite(input) || isOpenCompanionInvite(input)) return address.envelopeCouple;
  return address.envelopeSingle;
}

function resolvePresenceSubject(address: AddressProfile, input?: InvitationCopyInput) {
  if (isFamilyInvite(input)) return address.presenceFamily;
  if (isCoupleInvite(input) || isOpenCompanionInvite(input)) return address.presenceCouple;
  return address.presenceSingle;
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
    neutral: explicitHostPronoun || "gia đình chúng tôi",
  };

  const hostPronoun = hostPronouns[tone];
  const hostSubject = sentenceCase(hostPronoun);
  const address = resolveAddressProfile(input, tone, guestLabel);
  const inviteScope = resolveInviteScope(input, address);
  const invitedGuestLine = resolveEnvelopeRecipient(address, input);
  const recipientPronoun = address.recipientPronoun;
  const shortRecipientLabel = address.shortRecipientLabel;
  const recipientLine = resolveInviteRecipient(address, input);
  const isWarmPeer = tone === "peer" || tone === "junior";
  const isFormal = !isWarmPeer;
  const inviteVerb = isWarmPeer ? "mời" : "trân trọng kính mời";
  const envelopePrefix = isWarmPeer ? "Mời" : "Kính mời";
  const coupleDisplayName = cleanString(input?.coupleDisplayName) || "Nhật & Phương";
  const venueDisplayName = cleanString(input?.venueDisplayName) || "Terracotta Đà Lạt";
  const coupleReference = resolveCoupleReference(input, tone, hostPronoun);

  const formatRepetitiveFamily = (host: string, recipient: string) => {
    if (host.toLowerCase() === "gia đình" && /^gia (đình|dinh)\s+/i.test(recipient)) {
      const namePart = recipient.replace(/^gia (đình|dinh)\s+/i, "");
      if (!namePart) return recipient;
      return `${namePart} cùng gia đình`;
    }
    return recipient;
  };

  const ensureGiaDinhHost = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.startsWith("gia đình") || s.startsWith("gia dinh")) {
      return sentenceCase(subject);
    }
    return `Gia đình ${subject.toLowerCase()}`;
  };

  const familyHostSubject = ensureGiaDinhHost(hostPronoun);
  const inviteRecipientLine = formatRepetitiveFamily(hostSubject, recipientLine);
  const presenceSubject = resolvePresenceSubject(address, input);
  const coupleInviteOwner = tone === "parents_host" ? `${coupleReference} ${coupleDisplayName}` : hostPronoun;
  const envelopeRecipientLine = resolveEnvelopeRecipient(address, input);
  const isFamily = isFamilyInvite(input) || includesFamilyLabel(guestLabel);
  const relationshipText = resolveRelationshipText(input);
  const isChauRelation = includesAny(relationshipText, ["cháu", "chau"]);

  const kinshipPronoun = isChauRelation
    ? "các cháu"
    : isFamily
    ? "gia đình"
    : resolveKinshipPronoun(input, tone, guestLabel).toLowerCase();

  const cleanHostPronoun = hostPronoun.replace(/^gia (đình|dinh)\s+/i, "");
  const isParentsHost = input?.invitedBy === "parents" || tone === "parents_host";

  const pluralizePronoun = (pronoun: string): string => {
    const p = pronoun.toLowerCase().trim();
    if (p === "em") return "chúng em";
    if (p === "con") return "chúng con";
    if (p === "tôi") return "chúng tôi";
    if (p === "anh" || p === "chị") return "anh chị";
    if (p === "bác") return "chúng tôi";
    return pronoun;
  };
  
  const invitationHostSubject = isChauRelation
    ? "Gia đình"
    : isFamily
    ? sentenceCase(pluralizePronoun(cleanHostPronoun))
    : isParentsHost
    ? familyHostSubject
    : sentenceCase(cleanHostPronoun);

  const insideInviteLine = isCoupleInvite(input) || isOpenCompanionInvite(input) || tone === "parents_host"
    ? `${invitationHostSubject} trân trọng kính mời ${kinshipPronoun} đến chung vui trong ngày cưới của ${coupleInviteOwner}.`
    : tone === "neutral"
    ? `${invitationHostSubject} trân trọng kính mời ${kinshipPronoun} đến chung vui trong ngày cưới của ${coupleDisplayName}.`
    : isWarmPeer
      ? `${invitationHostSubject} mời ${kinshipPronoun} đến chung vui trong ngày cưới.`
      : `${invitationHostSubject} trân trọng kính mời ${kinshipPronoun} đến chung vui trong ngày cưới.`;

  const heroInvitationLine = isCoupleInvite(input) || isOpenCompanionInvite(input)
    ? `Kính mời ${kinshipPronoun} đến chung vui trong ngày cưới của ${coupleInviteOwner}.`
    : tone === "parents_host"
      ? `${invitationHostSubject} trân trọng kính mời ${kinshipPronoun} đến chung vui trong ngày cưới của hai cháu ${coupleDisplayName}.`
      : tone === "neutral"
        ? `${invitationHostSubject} trân trọng kính mời ${kinshipPronoun} đến chung vui trong ngày cưới của ${coupleDisplayName}.`
        : tone === "elder"
          ? `${invitationHostSubject} trân trọng kính mời ${kinshipPronoun} đến chung vui trong ngày cưới và chứng kiến ngày vui trọng đại của hai chúng con.`
          : tone === "senior"
            ? `${invitationHostSubject} trân trọng kính mời ${kinshipPronoun} đến chung vui trong ngày cưới và cùng chúng em lưu giữ những khoảnh khắc hạnh phúc nhất.`
            : `${hostSubject} rất mong được đón ${kinshipPronoun} đến chung vui trong ngày cưới, đánh dấu cột mốc hai đứa chính thức về chung một nhà.`;
  const rsvpLead = tone === "parents_host"
    ? `${hostSubject} mong nhận được lời hồi đáp để chuẩn bị đón tiếp chu đáo`
    : tone === "elder"
      ? `${hostSubject} mong nhận được lời hồi đáp để chuẩn bị đón tiếp chu đáo`
    : tone === "senior"
      ? `${hostSubject} mong nhận được lời hồi đáp để ${hostPronoun} chuẩn bị đón tiếp được chu đáo`
      : tone === "peer"
        ? `${hostSubject} mong nhận được phản hồi để ${hostPronoun} chuẩn bị ngày vui trọn vẹn hơn`
        : tone === "junior"
          ? `${hostSubject} mong nhận được phản hồi để ${hostPronoun} chuẩn bị ngày vui trọn vẹn hơn`
          : `${hostSubject} mong nhận được lời hồi đáp để ${hostPronoun} chuẩn bị đón tiếp được chu đáo`;
  const rsvpReceivedLine = tone === "peer" || tone === "junior"
    ? `${hostSubject} đã nhận được phản hồi`
    : `${hostSubject} đã nhận được lời hồi đáp`;
  const thankYouLine = tone === "peer"
    ? `${hostSubject} cảm ơn ${presenceSubject} đã dành thời gian chung vui trong ngày cưới.`
    : tone === "junior"
      ? `${hostSubject} cảm ơn ${presenceSubject} đã dành thời gian chung vui trong ngày cưới.`
      : `${hostSubject} chân thành cảm ơn ${presenceSubject} đã dành thời gian chung vui trong ngày cưới.`;

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
    greeting: `${guestLabel === "quý khách" ? "Quý khách" : guestLabel} thân mến`,
    heroGreeting: guestLabel === "quý khách"
      ? "Trân trọng kính mời quý khách"
      : isFormal
        ? `Kính gửi ${guestLabel}`
        : `Gửi ${guestLabel}`,
    heroInvitationLine,
    envelopeLine: `${isCoupleInvite(input) || isOpenCompanionInvite(input) ? "Kính mời" : envelopePrefix}: ${envelopeRecipientLine}`,
    insideInviteLine,
    invitationHostSubject,
    rsvpLead,
    rsvpReceivedLine,
    thankYouLine,
    closingLine: `Sự hiện diện của ${presenceSubject} là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất.`,
    signaturePrefix: tone === "elder" ? "Thương kính" : tone === "peer" || tone === "junior" ? "Thân mến" : "Trân trọng",
  };
}
