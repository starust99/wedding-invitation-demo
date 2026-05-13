import type { RSVPResponse } from "@/lib/rsvp-storage";
import { buildInvitationCopy } from "@/lib/guest-personalization";

export type InviteUnit = "individual" | "household";
export type InvitedBy = "parents" | "couple";
export type HouseholdMode = "single" | "couple" | "family" | "widowed";
export type PlusOnePolicy = "none" | "spouse" | "family" | "lover" | "open_plus_one";
export type InviteStatus = "invited" | "rsvp_yes" | "rsvp_no" | "rsvp_maybe" | "supplement_ready" | "album_ready";
export type SupplementStatus = "draft" | "published";
export type MediaAssetStatus = "draft" | "published";

export type InviteSupplement = {
  id: string;
  inviteeId: string;
  tableZone: string;
  tableName: string;
  seatNote: string;
  arrivalNote: string;
  status: SupplementStatus;
  publishedAt?: string;
  updatedAt: string;
};

export type Invitee = {
  id: string;
  token: string;
  inviteUnit: InviteUnit;
  guestName: string;
  displayLabel: string;
  invitationName: string;
  honorific: string;
  envelopeLine: string;
  insideInviteLine: string;
  invitedBy: InvitedBy;
  relationship: string;
  hostRelationship: string;
  hostPronoun: string;
  coupleReference: string;
  householdMode: HouseholdMode;
  plusOnePolicy: PlusOnePolicy;
  guestGroup: string;
  audienceTags: string[];
  expectedGuestCount: number;
  phone: string;
  email: string;
  notes: string;
  inviteStatus: InviteStatus;
  createdAt: string;
  updatedAt: string;
  supplement?: InviteSupplement;
  rsvp?: RSVPResponse;
};

export type MediaAsset = {
  id: string;
  src: string;
  title: string;
  alt: string;
  photoTags: string[];
  status: MediaAssetStatus;
  createdAt: string;
  updatedAt: string;
};

export type AlbumRule = {
  audienceTag: string;
  allowedPhotoTags: string[];
};

export type InviteImportResult = {
  invitees: Invitee[];
  errors: string[];
};

export type InviteeInput = Partial<Invitee>;

export const inviteesStorageKey = "wedding-demo-invitees";
export const mediaAssetsStorageKey = "wedding-demo-media-assets";
export const albumRulesStorageKey = "wedding-demo-album-rules";

export const inviteCsvColumns = [
  "token",
  "invite_unit",
  "display_label",
  "guest_name",
  "invitation_name",
  "honorific",
  "envelope_line",
  "inside_invite_line",
  "invited_by",
  "relationship",
  "host_relationship",
  "host_pronoun",
  "couple_reference",
  "household_mode",
  "plus_one_policy",
  "guest_group",
  "audience_tags",
  "expected_guest_count",
  "phone",
  "email",
  "notes",
] as const;

export type InviteCsvColumn = (typeof inviteCsvColumns)[number];

export const inviteCsvColumnLabels: Record<InviteCsvColumn, string> = {
  token: "Mã link riêng",
  invite_unit: "Kiểu mời",
  display_label: "Tên hiển thị",
  guest_name: "Tên khách mời",
  invitation_name: "Tên in trên thiệp",
  honorific: "Danh xưng",
  envelope_line: "Dòng ngoài phong bì",
  inside_invite_line: "Lời mời trong thiệp",
  invited_by: "Người đứng mời",
  relationship: "Quan hệ với cô dâu chú rể",
  host_relationship: "Quan hệ với người mời",
  host_pronoun: "Người mời xưng là",
  couple_reference: "Người mời gọi cô dâu chú rể",
  household_mode: "Mời đi cùng",
  plus_one_policy: "Người đi kèm",
  guest_group: "Nhóm khách mời",
  audience_tags: "Nhóm xem album",
  expected_guest_count: "Số khách",
  phone: "Số điện thoại",
  email: "Email",
  notes: "Ghi chú",
};

const inviteCsvColumnAliases: Record<InviteCsvColumn, string[]> = {
  token: ["token", "ma link rieng", "mã link", "link riêng"],
  invite_unit: ["invite_unit", "inviteUnit", "kieu moi", "kiểu mời", "loai khach moi", "loại khách mời", "kieu link moi", "kiểu link mời"],
  display_label: ["display_label", "displayLabel", "ten hien thi", "tên hiển thị", "ten goi", "tên gọi", "ten goi trong admin link", "ten hien thi trong admin link", "tên hiển thị trong admin/link", "ten de nhan biet trong admin", "tên dễ nhận biết trong admin"],
  guest_name: ["guest_name", "guestName", "ten khach", "tên khách", "ten khach moi", "tên khách mời", "ten khach tren thiep", "ten khach ghi tren thiep", "tên khách ghi trên thiệp", "ten goc hoac cach nha minh goi", "tên gốc hoặc cách nhà mình gọi"],
  invitation_name: ["invitation_name", "invitationName", "ten in tren thiep", "tên in trên thiệp", "cach goi tren thiep", "cách gọi trên thiệp", "cach xung ho in tren thiep", "cách xưng hô in trên thiệp", "ten moi", "tên mời", "ten ghi tren thiep", "tên ghi trên thiệp"],
  honorific: ["honorific", "danh xung", "danh xưng", "cach xung ho", "cách xưng hô", "danh xung ngan", "danh xưng ngắn"],
  envelope_line: ["envelope_line", "envelopeLine", "dong ngoai thiep", "dòng ngoài thiệp", "dong ngoai phong bi", "dòng ngoài phong bì"],
  inside_invite_line: ["inside_invite_line", "insideInviteLine", "loi moi trong thiep", "lời mời trong thiệp"],
  invited_by: ["invited_by", "invitedBy", "nguoi dung moi", "người đứng mời"],
  relationship: ["relationship", "quan he", "quan hệ", "quan he voi co dau chu re", "quan hệ với cô dâu chú rể"],
  host_relationship: ["host_relationship", "hostRelationship", "quan he voi nguoi moi", "quan hệ với người mời", "quan he voi nguoi dung moi", "quan hệ với người đứng mời"],
  host_pronoun: ["host_pronoun", "hostPronoun", "cach nguoi moi xung ho", "cách người mời xưng hô", "vai xung nguoi moi", "vai xưng người mời", "nguoi moi xung", "người mời xưng", "nguoi dung moi xung la", "người đứng mời xưng là"],
  couple_reference: ["couple_reference", "coupleReference", "cach nguoi moi goi co dau chu re", "cách người mời gọi cô dâu chú rể", "cach goi co dau chu re", "cách gọi cô dâu chú rể", "nguoi moi goi co dau chu re la", "người mời gọi cô dâu chú rể là", "hai chau", "hai cháu"],
  household_mode: ["household_mode", "householdMode", "thanh phan duoc moi", "thành phần được mời", "moi di cung", "mời đi cùng", "moi ai di cung", "mời ai đi cùng"],
  plus_one_policy: ["plus_one_policy", "plusOnePolicy", "nguoi di cung", "người đi cùng", "nguoi di kem", "người đi kèm", "quyen di kem", "quyền đi kèm"],
  guest_group: ["guest_group", "guestGroup", "nhom khach", "nhóm khách", "nhom khach moi", "nhóm khách mời"],
  audience_tags: ["audience_tags", "audienceTags", "nhom xem album", "nhóm xem album", "nhom duoc xem album", "nhóm được xem album", "tag album"],
  expected_guest_count: ["expected_guest_count", "expectedGuestCount", "so khach du kien", "số khách dự kiến"],
  phone: ["phone", "so dien thoai", "số điện thoại", "dien thoai", "điện thoại"],
  email: ["email"],
  notes: ["notes", "ghi chu", "ghi chú"],
};

export const inviteUnitLabels: Record<InviteUnit, string> = {
  individual: "Một người",
  household: "Cả nhà / hộ gia đình",
};

export const invitedByLabels: Record<InvitedBy, string> = {
  couple: "Cô dâu chú rể đứng mời",
  parents: "Ba mẹ đứng mời",
};

export const householdModeLabels: Record<HouseholdMode, string> = {
  single: "Một khách",
  couple: "Hai vợ chồng",
  family: "Cả gia đình",
  widowed: "Một người, vợ/chồng đã mất",
};

export const plusOnePolicyLabels: Record<PlusOnePolicy, string> = {
  none: "Không mời kèm",
  spouse: "Vợ/chồng",
  family: "Cả gia đình",
  lover: "Người thương",
  open_plus_one: "Có thể đi cùng 1 người",
};

const inviteUnitAliases: Record<InviteUnit, string[]> = {
  individual: ["individual", "mot nguoi", "một người", "ca nhan", "cá nhân"],
  household: ["household", "ca nha", "cả nhà", "ho gia dinh", "hộ gia đình", "ca nha ho gia dinh"],
};

const invitedByAliases: Record<InvitedBy, string[]> = {
  couple: ["couple", "co dau chu re", "cô dâu chú rể", "tu minh moi", "tụi mình mời"],
  parents: ["parents", "ba me", "ba mẹ", "bo me", "bố mẹ", "gia dinh moi", "gia đình mời"],
};

const householdModeAliases: Record<HouseholdMode, string[]> = {
  single: ["single", "mot khach", "một khách", "mot nguoi", "một người"],
  couple: ["couple", "hai vo chong", "hai vợ chồng", "vo chong", "vợ chồng"],
  family: ["family", "ca gia dinh", "cả gia đình", "gia dinh", "gia đình"],
  widowed: ["widowed", "vo chong da mat", "vợ chồng đã mất", "mot nguoi vo chong da mat"],
};

const plusOnePolicyAliases: Record<PlusOnePolicy, string[]> = {
  none: ["none", "khong moi kem", "không mời kèm", "khong", "không"],
  spouse: ["spouse", "vo chong", "vợ/chồng", "vo", "chong"],
  family: ["family", "ca gia dinh", "cả gia đình", "gia dinh"],
  lover: ["lover", "nguoi thuong", "người thương", "nguoi yeu", "người yêu"],
  open_plus_one: ["open_plus_one", "co the di cung 1 nguoi", "có thể đi cùng 1 người", "plus one", "+1"],
};

const audienceTagLabels: Record<string, string> = {
  family: "gia đình",
  maternal: "họ ngoại",
  paternal: "họ nội",
  friends: "bạn bè",
  uni: "bạn đại học",
  colleagues: "đồng nghiệp",
  vip: "vip",
  public: "công khai",
  ceremony: "lễ cưới",
  party: "tiệc",
  couple: "cô dâu chú rể",
};

const audienceTagAliases: Record<string, string[]> = {
  family: ["gia dinh", "gia đình", "family"],
  maternal: ["ho ngoai", "họ ngoại", "ngoai", "maternal"],
  paternal: ["ho noi", "họ nội", "noi", "paternal"],
  friends: ["ban be", "bạn bè", "ban", "friends"],
  uni: ["ban dai hoc", "bạn đại học", "dai hoc", "uni"],
  colleagues: ["dong nghiep", "đồng nghiệp", "cong ty", "colleagues"],
  vip: ["vip"],
  public: ["cong khai", "công khai", "public"],
  ceremony: ["le cuoi", "lễ cưới", "ceremony"],
  party: ["tiec", "tiệc", "party"],
  couple: ["co dau chu re", "cô dâu chú rể", "couple"],
};

export const defaultAlbumRules: AlbumRule[] = [
  { audienceTag: "family", allowedPhotoTags: ["public", "ceremony", "family", "couple"] },
  { audienceTag: "maternal", allowedPhotoTags: ["public", "family", "maternal"] },
  { audienceTag: "paternal", allowedPhotoTags: ["public", "family", "paternal"] },
  { audienceTag: "friends", allowedPhotoTags: ["public", "friends", "party", "couple"] },
  { audienceTag: "colleagues", allowedPhotoTags: ["public", "colleagues", "ceremony"] },
  { audienceTag: "vip", allowedPhotoTags: ["public", "ceremony", "family", "friends", "couple"] },
];

export const inviteTemplateRows = [
  {
    token: "",
    invite_unit: "Cả nhà / hộ gia đình",
    display_label: "Ông Sáu",
    guest_name: "Ông Sáu",
    invitation_name: "Chú Sáu",
    honorific: "Ông",
    envelope_line: "",
    inside_invite_line: "",
    invited_by: "Ba mẹ đứng mời",
    relationship: "ông ngoại của cô dâu/chú rể",
    host_relationship: "ông ngoại",
    host_pronoun: "gia đình chúng con",
    couple_reference: "hai cháu",
    household_mode: "Cả gia đình",
    plus_one_policy: "Cả gia đình",
    guest_group: "Họ ngoại",
    audience_tags: "gia đình;họ ngoại",
    expected_guest_count: "2",
    phone: "",
    email: "",
    notes: "",
  },
  {
    token: "",
    invite_unit: "Cả nhà / hộ gia đình",
    display_label: "Bác Minh",
    guest_name: "Bác Minh",
    invitation_name: "Bác Minh",
    honorific: "Bác",
    envelope_line: "",
    inside_invite_line: "",
    invited_by: "Ba mẹ đứng mời",
    relationship: "bác của cô dâu/chú rể",
    host_relationship: "bác",
    host_pronoun: "gia đình chúng con",
    couple_reference: "hai cháu",
    household_mode: "Cả gia đình",
    plus_one_policy: "Cả gia đình",
    guest_group: "Họ nội",
    audience_tags: "gia đình;họ nội",
    expected_guest_count: "2",
    phone: "",
    email: "",
    notes: "",
  },
  {
    token: "",
    invite_unit: "Một người",
    display_label: "Gia Hân",
    guest_name: "Gia Hân",
    invitation_name: "Gia Hân",
    honorific: "",
    envelope_line: "Mời Gia Hân",
    inside_invite_line: "Tụi mình mời Gia Hân đến chung vui trong lễ cưới của tụi mình.",
    invited_by: "Cô dâu chú rể đứng mời",
    relationship: "bạn",
    host_relationship: "bạn",
    host_pronoun: "tụi mình",
    couple_reference: "tụi mình",
    household_mode: "Một khách",
    plus_one_policy: "Người thương",
    guest_group: "Bạn đại học",
    audience_tags: "bạn bè;bạn đại học",
    expected_guest_count: "1",
    phone: "",
    email: "",
    notes: "",
  },
  {
    token: "",
    invite_unit: "Một người",
    display_label: "Anh Hoàng",
    guest_name: "Anh Hoàng",
    invitation_name: "Anh Hoàng",
    honorific: "Anh",
    envelope_line: "Kính mời: Anh Hoàng",
    inside_invite_line: "Tụi em trân trọng kính mời Anh Hoàng đến chung vui trong lễ cưới của tụi em.",
    invited_by: "Cô dâu chú rể đứng mời",
    relationship: "anh",
    host_relationship: "anh",
    host_pronoun: "tụi em",
    couple_reference: "tụi em",
    household_mode: "Một khách",
    plus_one_policy: "Không mời kèm",
    guest_group: "Đồng nghiệp",
    audience_tags: "đồng nghiệp",
    expected_guest_count: "1",
    phone: "",
    email: "",
    notes: "",
  },
  {
    token: "",
    invite_unit: "Một người",
    display_label: "Em Linh",
    guest_name: "Em Linh",
    invitation_name: "Em Linh",
    honorific: "Em",
    envelope_line: "Mời: Em Linh",
    inside_invite_line: "Anh chị mời Em Linh đến chung vui trong lễ cưới của anh chị.",
    invited_by: "Cô dâu chú rể đứng mời",
    relationship: "em",
    host_relationship: "em",
    host_pronoun: "anh chị",
    couple_reference: "anh chị",
    household_mode: "Một khách",
    plus_one_policy: "Không mời kèm",
    guest_group: "Bạn nhỏ tuổi hơn",
    audience_tags: "bạn bè",
    expected_guest_count: "1",
    phone: "",
    email: "",
    notes: "",
  },
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCsvKey(value: unknown) {
  return clean(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const inviteCsvHeaderMap = new Map<string, InviteCsvColumn>();
for (const column of inviteCsvColumns) {
  for (const header of [column, inviteCsvColumnLabels[column], ...inviteCsvColumnAliases[column]]) {
    inviteCsvHeaderMap.set(normalizeCsvKey(header), column);
  }
}

function resolveInviteCsvColumn(header: string) {
  return inviteCsvHeaderMap.get(normalizeCsvKey(header)) ?? header.trim();
}

function pickCsvEnum<T extends string>(
  value: unknown,
  labels: Record<T, string>,
  aliases: Record<T, string[]>,
  fallback: T,
): T {
  const normalized = normalizeCsvKey(value);
  if (!normalized) return fallback;
  const options = Object.keys(labels) as T[];

  for (const option of options) {
    if (normalizeCsvKey(option) === normalized) return option;
    if (normalizeCsvKey(labels[option]) === normalized) return option;
    if (aliases[option].some((alias) => normalizeCsvKey(alias) === normalized)) return option;
  }

  return fallback;
}

function parseInviteUnit(value: unknown) {
  return pickCsvEnum(value, inviteUnitLabels, inviteUnitAliases, "individual");
}

function parseInvitedBy(value: unknown) {
  return pickCsvEnum(value, invitedByLabels, invitedByAliases, "couple");
}

function parseHouseholdMode(value: unknown) {
  return pickCsvEnum(value, householdModeLabels, householdModeAliases, "single");
}

function parsePlusOnePolicy(value: unknown) {
  return pickCsvEnum(value, plusOnePolicyLabels, plusOnePolicyAliases, "none");
}

function audienceTagFromCsv(value: string) {
  const normalized = normalizeCsvKey(value);
  for (const [tag, aliases] of Object.entries(audienceTagAliases)) {
    if (normalizeCsvKey(tag) === normalized) return tag;
    if (normalizeCsvKey(audienceTagLabels[tag]) === normalized) return tag;
    if (aliases.some((alias) => normalizeCsvKey(alias) === normalized)) return tag;
  }

  return normalizeInviteToken(value) || value.trim();
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const candidate = clean(value);
  return allowed.includes(candidate as T) ? candidate as T : fallback;
}

function randomSuffix() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

export function splitTags(value: unknown) {
  return clean(value)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinTags(tags: string[]) {
  return tags.join(";");
}

export function joinAudienceTags(tags: string[]) {
  return tags.map((tag) => audienceTagLabels[tag] ?? tag).join(";");
}

export function parseAudienceTags(value: unknown) {
  return splitTags(value).map(audienceTagFromCsv);
}

export function normalizeInviteToken(value: string) {
  return slugify(value).slice(0, 56);
}

export function buildInvitePath(token: string) {
  return `/i/${encodeURIComponent(token)}`;
}

export function buildInviteUrl(token: string, origin = "") {
  const base = origin.replace(/\/$/, "");
  return `${base}${buildInvitePath(token)}`;
}

export function generateInviteToken(seed: string, existingTokens: Set<string>) {
  const base = normalizeInviteToken(seed) || "khach-moi";
  let candidate = `${base}-${randomSuffix()}`;

  while (existingTokens.has(candidate)) {
    candidate = `${base}-${randomSuffix()}`;
  }

  existingTokens.add(candidate);
  return candidate;
}

function csvEscape(value: unknown) {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function getInviteTemplateCsv() {
  const header = inviteCsvColumns.map((column) => inviteCsvColumnLabels[column]).join(",");
  const rows = inviteTemplateRows.map((row) => inviteCsvColumns.map((column) => csvEscape(row[column])).join(","));
  return [header, ...rows].join("\n");
}

export function serializeInviteesCsv(invitees: Invitee[]) {
  const header = inviteCsvColumns.map((column) => inviteCsvColumnLabels[column]).join(",");
  const rows = invitees.map((invitee) => inviteCsvColumns.map((column) => {
    const directValues: Record<InviteCsvColumn, string | number> = {
      token: invitee.token,
      invite_unit: inviteUnitLabels[invitee.inviteUnit],
      display_label: invitee.displayLabel,
      guest_name: invitee.guestName,
      invitation_name: invitee.invitationName,
      honorific: invitee.honorific,
      envelope_line: invitee.envelopeLine,
      inside_invite_line: invitee.insideInviteLine,
      invited_by: invitedByLabels[invitee.invitedBy],
      relationship: invitee.relationship,
      host_relationship: invitee.hostRelationship,
      host_pronoun: invitee.hostPronoun,
      couple_reference: invitee.coupleReference,
      household_mode: householdModeLabels[invitee.householdMode],
      plus_one_policy: plusOnePolicyLabels[invitee.plusOnePolicy],
      guest_group: invitee.guestGroup,
      audience_tags: joinAudienceTags(invitee.audienceTags),
      expected_guest_count: invitee.expectedGuestCount,
      phone: invitee.phone,
      email: invitee.email,
      notes: invitee.notes,
    };

    return csvEscape(directValues[column]);
  }).join(","));
  return [header, ...rows].join("\n");
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map(resolveInviteCsvColumn);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export function createInvitee(input: InviteeInput, existingTokens = new Set<string>()): Invitee {
  const now = new Date().toISOString();
  const displayLabel = clean(input.displayLabel) || clean(input.guestName) || "Khách mời";
  const guestName = clean(input.guestName) || displayLabel;
  const invitationName = clean(input.invitationName) || displayLabel;
  const inviteUnit = pickEnum(input.inviteUnit, ["individual", "household"], "individual");
  const invitedBy = pickEnum(input.invitedBy, ["parents", "couple"], "couple");
  const relationship = clean(input.relationship);
  const hostRelationship = clean(input.hostRelationship);
  const hostPronoun = clean(input.hostPronoun);
  const coupleReference = clean(input.coupleReference);
  const householdMode = pickEnum(input.householdMode, ["single", "couple", "family", "widowed"], "single");
  const plusOnePolicy = pickEnum(input.plusOnePolicy, ["none", "spouse", "family", "lover", "open_plus_one"], "none");
  const inviteCopy = buildInvitationCopy({
    displayLabel,
    guestName,
    invitationName,
    honorific: clean(input.honorific),
    relationship,
    invitedBy,
    hostRelationship,
    hostPronoun,
    coupleReference,
    guestGroup: clean(input.guestGroup),
    householdMode,
    plusOnePolicy,
  });
  const cleanedToken = normalizeInviteToken(clean(input.token));
  const token = cleanedToken && !existingTokens.has(cleanedToken)
    ? cleanedToken
    : generateInviteToken(displayLabel, existingTokens);
  existingTokens.add(token);
  const insideInviteLine = clean(input.insideInviteLine);
  const legacyInsideLine = `Trân trọng kính mời: ${displayLabel}`;

  return {
    id: clean(input.id) || (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : randomSuffix()),
    token,
    inviteUnit,
    guestName,
    displayLabel,
    invitationName,
    honorific: clean(input.honorific),
    envelopeLine: clean(input.envelopeLine) || inviteCopy.envelopeLine,
    insideInviteLine: insideInviteLine && insideInviteLine !== legacyInsideLine ? insideInviteLine : inviteCopy.insideInviteLine,
    invitedBy,
    relationship,
    hostRelationship,
    hostPronoun,
    coupleReference,
    householdMode,
    plusOnePolicy,
    guestGroup: clean(input.guestGroup) || "Khác",
    audienceTags: Array.isArray(input.audienceTags) ? input.audienceTags.filter(Boolean) : splitTags(input.audienceTags),
    expectedGuestCount: Math.max(1, Number(input.expectedGuestCount) || 1),
    phone: clean(input.phone),
    email: clean(input.email),
    notes: clean(input.notes),
    inviteStatus: pickEnum(input.inviteStatus, ["invited", "rsvp_yes", "rsvp_no", "rsvp_maybe", "supplement_ready", "album_ready"], "invited"),
    createdAt: clean(input.createdAt) || now,
    updatedAt: clean(input.updatedAt) || now,
    supplement: input.supplement,
    rsvp: input.rsvp,
  };
}

export function parseInviteCsv(text: string, existingInvitees: Invitee[] = []): InviteImportResult {
  const existingTokens = new Set(existingInvitees.map((invitee) => invitee.token));
  const usedTokens = new Set<string>();
  const rows = parseCsv(text);
  const errors: string[] = [];
  const invitees = rows.map((row, index) => {
    const displayLabel = row.display_label || row.displayLabel || row.guest_name || row.guestName;
    if (!displayLabel) errors.push(`Dòng ${index + 2}: thiếu Tên dễ nhận biết trong admin hoặc Tên gốc.`);
    const hasExplicitToken = Boolean(clean(row.token));
    const tokenPool = hasExplicitToken ? usedTokens : new Set([...existingTokens, ...usedTokens]);

    const invitee = createInvitee({
      token: row.token,
      inviteUnit: parseInviteUnit(row.invite_unit),
      displayLabel,
      guestName: row.guest_name || row.guestName || displayLabel,
      invitationName: row.invitation_name || row.invitationName || displayLabel,
      honorific: row.honorific,
      envelopeLine: row.envelope_line || row.envelopeLine,
      insideInviteLine: row.inside_invite_line || row.insideInviteLine,
      invitedBy: parseInvitedBy(row.invited_by),
      relationship: row.relationship,
      hostRelationship: row.host_relationship || row.hostRelationship,
      hostPronoun: row.host_pronoun || row.hostPronoun,
      coupleReference: row.couple_reference || row.coupleReference,
      householdMode: parseHouseholdMode(row.household_mode),
      plusOnePolicy: parsePlusOnePolicy(row.plus_one_policy),
      guestGroup: row.guest_group || row.guestGroup,
      audienceTags: parseAudienceTags(row.audience_tags || row.audienceTags),
      expectedGuestCount: Number(row.expected_guest_count || row.expectedGuestCount),
      phone: row.phone,
      email: row.email,
      notes: row.notes,
    }, tokenPool);

    usedTokens.add(invitee.token);
    return invitee;
  });

  return { invitees, errors };
}

export function readLocalInvitees(): Invitee[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(inviteesStorageKey);
    if (!raw) return [];
    const existingTokens = new Set<string>();
    return (JSON.parse(raw) as Invitee[]).map((invitee) => createInvitee(invitee, existingTokens));
  } catch {
    return [];
  }
}

export function writeLocalInvitees(invitees: Invitee[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(inviteesStorageKey, JSON.stringify(invitees));
  window.dispatchEvent(new Event("wedding-invitees-updated"));
}

export function upsertLocalInvitees(nextInvitees: Invitee[]) {
  const current = readLocalInvitees();
  const byToken = new Map(current.map((invitee) => [invitee.token, invitee]));
  for (const invitee of nextInvitees) {
    byToken.set(invitee.token, { ...byToken.get(invitee.token), ...invitee, updatedAt: new Date().toISOString() });
  }
  const merged = [...byToken.values()];
  writeLocalInvitees(merged);
  return merged;
}

export function updateLocalInvitee(invitee: Invitee) {
  const next = readLocalInvitees().map((item) => item.id === invitee.id ? { ...invitee, updatedAt: new Date().toISOString() } : item);
  writeLocalInvitees(next);
  return next;
}

export function readLocalMediaAssets(): MediaAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(mediaAssetsStorageKey);
    return raw ? JSON.parse(raw) as MediaAsset[] : [];
  } catch {
    return [];
  }
}

export function writeLocalMediaAssets(assets: MediaAsset[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(mediaAssetsStorageKey, JSON.stringify(assets));
  window.dispatchEvent(new Event("wedding-media-assets-updated"));
}

export function readLocalAlbumRules(): AlbumRule[] {
  if (typeof window === "undefined") return defaultAlbumRules;
  try {
    const raw = window.localStorage.getItem(albumRulesStorageKey);
    return raw ? JSON.parse(raw) as AlbumRule[] : defaultAlbumRules;
  } catch {
    return defaultAlbumRules;
  }
}

export function writeLocalAlbumRules(rules: AlbumRule[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(albumRulesStorageKey, JSON.stringify(rules));
  window.dispatchEvent(new Event("wedding-album-rules-updated"));
}

export function getAllowedPhotoTags(invitee: Pick<Invitee, "audienceTags">, rules: AlbumRule[] = defaultAlbumRules) {
  const tags = new Set<string>(["public"]);
  for (const audienceTag of invitee.audienceTags) {
    const rule = rules.find((item) => item.audienceTag === audienceTag);
    for (const photoTag of rule?.allowedPhotoTags ?? [audienceTag]) tags.add(photoTag);
  }
  return tags;
}

export function filterMediaAssetsForInvitee(assets: MediaAsset[], invitee: Pick<Invitee, "audienceTags">, rules: AlbumRule[] = defaultAlbumRules) {
  const allowed = getAllowedPhotoTags(invitee, rules);
  return assets.filter((asset) => asset.status === "published" && asset.photoTags.some((tag) => allowed.has(tag)));
}

export function createMediaAsset(input: Partial<MediaAsset>): MediaAsset {
  const now = new Date().toISOString();
  return {
    id: clean(input.id) || (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : randomSuffix()),
    src: clean(input.src),
    title: clean(input.title) || "Ảnh album",
    alt: clean(input.alt) || clean(input.title) || "Ảnh album cưới",
    photoTags: Array.isArray(input.photoTags) ? input.photoTags.filter(Boolean) : splitTags(input.photoTags),
    status: pickEnum(input.status, ["draft", "published"], "draft"),
    createdAt: clean(input.createdAt) || now,
    updatedAt: clean(input.updatedAt) || now,
  };
}

export function getInviteStatusFromRsvp(attending: RSVPResponse["attending"]): InviteStatus {
  if (attending === "yes") return "rsvp_yes";
  if (attending === "no") return "rsvp_no";
  return "rsvp_maybe";
}
