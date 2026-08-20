import ExcelJS from "exceljs";
import {
  buildInviteUrl,
  createInvitee,
  householdModeLabels,
  invitedByLabels,
  parseAudienceTags,
  type HouseholdMode,
  type Invitee,
  type InviteImportResult,
  type InvitedBy,
  type PlusOnePolicy,
} from "@/lib/invites";
import { buildInvitationCopy } from "@/lib/guest-personalization";
import { resolveInviteLinkSide } from "@/lib/invite-link-side";
import { weddingConfig } from "@/config/wedding.config";

const inviteSheetName = "Danh sách khách mời";
const systemSheetName = "_Dữ liệu hệ thống";
const maxInviteRows = 1000;
const defaultCoupleDisplayName = weddingConfig.couple.displayName || "Nhật & Phương";
const titleRowIndex = 1;
const subtitleRowIndex = 2;
const headerRowIndex = 4;
const firstDataRow = headerRowIndex + 1;
const optionStartColumn = 1;
const termLookupStartColumn = 5;
const termLookupColumnCount = 7;
const groupLookupStartColumn = termLookupStartColumn + termLookupColumnCount;
const internalNoteRowColumn = groupLookupStartColumn + 2;
const internalNoteValueColumn = internalNoteRowColumn + 1;
const palette = {
  olive: "FF5F6F4E",
  oliveDark: "FF48563A",
  champagne: "FFD6BFA3",
  ivory: "FFFFFDF8",
  dropdown: "FFFFF8E8",
  formula: "FFF1EEE7",
  white: "FFFFFFFF",
  text: "FF2E2A25",
  muted: "FF776F66",
  border: "FFE7DDCE",
  warning: "FFFFE7B8",
  duplicate: "FFF7D9D9",
} as const;
type SalutationDefinition = {
  label: string;
  displayPrefix?: string;
  displaySuffix?: string;
  displaySalutation?: string;
  sentenceSalutation?: string;
  hostRelationship: string;
  relationship: string;
  householdMode: HouseholdMode;
  plusOnePolicy?: PlusOnePolicy;
  needsName: boolean;
  coupleHostPronoun: string;
  parentsHostPronoun: string;
  parentsCoupleReference?: string;
};

type GuestGroupDefinition = {
  label: string;
  audienceTags: string;
};

const salutationDefinitions: SalutationDefinition[] = [
  {
    label: "Cha",
    displaySalutation: "Cha",
    hostRelationship: "cha",
    relationship: "linh mục",
    householdMode: "single",
    needsName: true,
    coupleHostPronoun: "chúng con",
    parentsHostPronoun: "gia đình chúng con",
  },
  { label: "Ông bà", hostRelationship: "ông bà", relationship: "ông bà của cô dâu/chú rể", householdMode: "couple", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bố mẹ", hostRelationship: "bố mẹ", relationship: "bố mẹ của cô dâu/chú rể", householdMode: "couple", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Ba mẹ", hostRelationship: "ba mẹ", relationship: "bố mẹ của cô dâu/chú rể", householdMode: "couple", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bố", hostRelationship: "bố", relationship: "bố/mẹ của cô dâu/chú rể", householdMode: "single", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Mẹ", hostRelationship: "mẹ", relationship: "bố/mẹ của cô dâu/chú rể", householdMode: "single", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bác", hostRelationship: "bác", relationship: "bác của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Vợ chồng bác", hostRelationship: "vợ chồng bác", relationship: "vợ chồng bác của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình bác", hostRelationship: "bác", relationship: "bác của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Cô", hostRelationship: "cô", relationship: "cô/chú của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình cô", hostRelationship: "cô", relationship: "cô/chú của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Chú", hostRelationship: "chú", relationship: "cô/chú của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình chú", hostRelationship: "chú", relationship: "cô/chú của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Cô chú", hostRelationship: "vợ chồng cô chú", relationship: "vợ chồng cô chú của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình cô chú", hostRelationship: "cô", relationship: "cô/chú của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Dượng", hostRelationship: "dượng", relationship: "cô/chú/dì/dượng của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Cô dượng", hostRelationship: "vợ chồng cô dượng", relationship: "vợ chồng cô dượng của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình cô dượng", hostRelationship: "cô dượng", relationship: "cô dượng của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Thím", hostRelationship: "thím", relationship: "dì/cậu/mợ/thím của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình thím", hostRelationship: "thím", relationship: "dì/cậu/mợ/thím của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình chú thím", hostRelationship: "chú", relationship: "cô/chú của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Dì", hostRelationship: "dì", relationship: "dì/cậu/mợ/thím của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình dì", hostRelationship: "dì", relationship: "dì/cậu/mợ/thím của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Cậu", hostRelationship: "cậu", relationship: "dì/cậu/mợ/thím của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình cậu", hostRelationship: "cậu", relationship: "dì/cậu/mợ/thím của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Cậu mợ", hostRelationship: "vợ chồng cậu mợ", relationship: "vợ chồng cậu mợ của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình cậu mợ", hostRelationship: "cậu", relationship: "dì/cậu/mợ/thím của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Mợ", hostRelationship: "mợ", relationship: "dì/cậu/mợ/thím của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Gia đình mợ", hostRelationship: "mợ", relationship: "dì/cậu/mợ/thím của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Anh", hostRelationship: "anh", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Anh + Người thương", displayPrefix: "Anh", displaySuffix: " & Người thương", sentenceSalutation: "Anh chị", hostRelationship: "anh", relationship: "anh và người thương của cô dâu/chú rể", householdMode: "couple", plusOnePolicy: "lover", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Vợ chồng anh", hostRelationship: "vợ chồng anh", relationship: "vợ chồng anh/chị/em của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Gia đình anh", hostRelationship: "anh", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Chị", hostRelationship: "chị", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Chị + Người thương", displayPrefix: "Chị", displaySuffix: " & Người thương", sentenceSalutation: "Anh chị", hostRelationship: "chị", relationship: "chị và người thương của cô dâu/chú rể", householdMode: "couple", plusOnePolicy: "lover", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Vợ chồng chị", hostRelationship: "vợ chồng chị", relationship: "vợ chồng anh/chị/em của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Gia đình chị", hostRelationship: "chị", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Anh chị", hostRelationship: "anh chị", relationship: "anh chị của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Gia đình anh chị", hostRelationship: "anh chị", relationship: "anh chị của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Em", hostRelationship: "em", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "gia đình anh chị" },
  { label: "Em + Người thương", displayPrefix: "Em", displaySuffix: " & Người thương", sentenceSalutation: "Hai em", hostRelationship: "em", relationship: "em và người thương của cô dâu/chú rể", householdMode: "couple", plusOnePolicy: "lover", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "gia đình anh chị" },
  { label: "Vợ chồng em", hostRelationship: "vợ chồng em", relationship: "vợ chồng anh/chị/em của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "gia đình anh chị" },
  { label: "Gia đình em", hostRelationship: "em", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "gia đình anh chị" },
  { label: "Cháu", hostRelationship: "cháu", relationship: "cháu của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai anh chị" },
  { label: "Vợ chồng cháu", hostRelationship: "vợ chồng cháu", relationship: "vợ chồng cháu của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai anh chị" },
  { label: "Gia đình cháu", hostRelationship: "cháu", relationship: "cháu của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai anh chị" },
  { label: "Hai bạn", hostRelationship: "bạn", relationship: "bạn của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
  { label: "Gia đình", hostRelationship: "bạn", relationship: "khách mời của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
  { label: "Bà nội", hostRelationship: "bà nội", relationship: "bà nội của cô dâu/chú rể", householdMode: "single", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bà ngoại", hostRelationship: "bà ngoại", relationship: "bà ngoại của cô dâu/chú rể", householdMode: "single", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bà", hostRelationship: "bà", relationship: "ông bà của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bạn", hostRelationship: "bạn", relationship: "bạn của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
  { label: "Bạn + Người thương", displayPrefix: "Bạn", displaySuffix: " & Người thương", sentenceSalutation: "Hai bạn", hostRelationship: "bạn", relationship: "bạn và người thương của cô dâu/chú rể", householdMode: "couple", plusOnePolicy: "lover", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
  { label: "Vợ chồng bạn", hostRelationship: "vợ chồng bạn", relationship: "vợ chồng bạn của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
  { label: "Gia đình bạn", hostRelationship: "bạn", relationship: "bạn của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
] as const;

const guestGroupDefinitions: GuestGroupDefinition[] = [
  { label: "[Nhà Trai] Họ nội", audienceTags: "gia đình;họ nội" },
  { label: "[Nhà Trai] Họ ngoại", audienceTags: "gia đình;họ ngoại" },
  { label: "[Nhà Trai] Khách ba", audienceTags: "gia đình" },
  { label: "[Nhà Trai] Khách mẹ", audienceTags: "gia đình" },
  { label: "[Nhà Gái] Họ nội", audienceTags: "gia đình;họ nội" },
  { label: "[Nhà Gái] Họ ngoại", audienceTags: "gia đình;họ ngoại" },
  { label: "[Nhà Gái] Khách ba", audienceTags: "gia đình" },
  { label: "[Nhà Gái] Khách mẹ", audienceTags: "gia đình" },
  { label: "[Nhật] Bạn bè & Đồng nghiệp", audienceTags: "bạn bè;đồng nghiệp" },
  { label: "[Phương] Bạn bè & Đồng nghiệp", audienceTags: "bạn bè;đồng nghiệp" },
] as const;


const columns = [
  { key: "sequence", header: "STT", width: 10 },
  { key: "salutationCluster", header: "Cụm danh xưng", width: 30 },
  { key: "guestNameCore", header: "Tên khách", width: 24 },
  { key: "guestName", header: "Cụm tên khách", width: 34 },
  { key: "guestUnit", header: "Đơn vị khách", width: 22 },
  { key: "guestGroup", header: "Nhóm khách", width: 40 },
  { key: "postCeremonyPartyInvited", header: "Tham gia tiệc sau Hôn phối", width: 32 },
] as const;

const inviteColumn = {
  sequence: 1,
  salutationCluster: 2,
  guestNameCore: 3,
  guestName: 4,
  guestUnit: 5,
  guestGroup: 6,
  postCeremonyPartyInvited: 7,
} as const;

export type SimpleInviteEntry = {
  salutationCluster: string;
  guestNameCore: string;
  guestGroup: string;
  postCeremonyPartyInvited?: string;
};

type TemplateRowValues = SimpleInviteEntry;

type OptionKey =
  | "salutationCluster"
  | "guestGroup"
  | "postCeremonyPartyInvited";

type SpreadsheetOptions = {
  coupleDisplayName?: string;
};

function resolveSpreadsheetOptions(options: SpreadsheetOptions = {}) {
  return {
    coupleDisplayName: clean(options.coupleDisplayName) || defaultCoupleDisplayName,
  };
}

function getOptionColumns(coupleDisplayName: string): Record<OptionKey, string[]> {
  void coupleDisplayName;
  return {
    salutationCluster: salutationDefinitions.map((item) => item.label),
    guestGroup: guestGroupDefinitions.map((item) => item.label),
    postCeremonyPartyInvited: ["Có"],
  };
}

const legacyFallbackRowValues: LegacyRowValues = {
  guestName: "",
  hostRelationship: "bạn",
  invitedBy: "couple",
  hostPronoun: "chúng mình",
  coupleReference: "chúng mình",
  relationship: "bạn của cô dâu/chú rể",
  householdMode: "single",
  guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
  audienceTagsText: "bạn bè;đồng nghiệp",
};

type InferredTemplateValues = {
  salutationCluster: string;
  guestName: string;
  displaySalutation: string;
  hostRelationship: string;
  invitedBy: InvitedBy;
  hostPronoun: string;
  coupleReference: string;
  relationship: string;
  householdMode: HouseholdMode;
  plusOnePolicy: PlusOnePolicy;
  guestGroup: string;
  audienceTagsText: string;
  needsName: boolean;
};

type LegacyRowValues = {
  guestName: string;
  hostRelationship: string;
  invitedBy: InvitedBy;
  hostPronoun: string;
  coupleReference: string;
  relationship: string;
  householdMode: HouseholdMode;
  guestGroup: string;
  audienceTagsText: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanRedundantPrefix(salutationCluster: string, guestNameCore: string): string {
  const name = guestNameCore.trim();
  const words = name.split(/\s+/);
  if (words.length <= 1) return name;

  const firstWord = words[0].toLowerCase();
  const normalizedFirst = normalizeText(firstWord);

  const prefixesToRemove = new Set([
    "anh", "chi", "em", "co", "chu", "bac", "di", "duong", "cau", "mo", "thim", "ong", "ba", "cha", "thay", "co",
  ]);

  if (prefixesToRemove.has(normalizedFirst)) {
    return words.slice(1).join(" ");
  }

  const normalizedCluster = normalizeText(salutationCluster);
  if (normalizedCluster.includes(normalizedFirst)) {
    return words.slice(1).join(" ");
  }

  return name;
}

function displayPrefixForSalutation(salutation: Pick<SalutationDefinition, "label" | "displayPrefix">) {
  return clean(salutation.displayPrefix) || clean(salutation.label);
}

function buildDisplayGuestName(salutationCluster: string, guestNameCore: string) {
  const cluster = clean(salutationCluster);
  const rawName = clean(guestNameCore);
  if (!cluster) return rawName;
  if (!rawName) return cluster;
  const cleanedName = cleanRedundantPrefix(salutationCluster, rawName);
  const salutation = findSalutationDefinition(cluster);
  const normalizedCluster = salutation ? displayPrefixForSalutation(salutation) : cluster;
  const suffix = salutation?.displaySuffix ?? "";
  return `${normalizedCluster} ${cleanedName}${suffix}`.replace(/\s+/g, " ").trim();
}

function findSalutationDefinition(value: string) {
  const normalized = normalizeText(value);
  return salutationDefinitions.find((item) => normalizeText(item.label) === normalized);
}

function findGuestGroupDefinition(value: string) {
  const normalized = normalizeText(value);
  return guestGroupDefinitions.find((item) => normalizeText(item.label) === normalized);
}


function resolveParentsCoupleReference() {
  return "hai cháu";
}

function inferTemplateValues(values: TemplateRowValues): InferredTemplateValues {
  const salutation = findSalutationDefinition(values.salutationCluster) ?? salutationDefinitions[0];
  const guestGroup = findGuestGroupDefinition(values.guestGroup) ?? guestGroupDefinitions[0];
  
  // Infer invitedBy from guestGroup label:
  const isParentsGroup = guestGroup.label.startsWith("[Nhà Trai]") || guestGroup.label.startsWith("[Nhà Gái]");
  const invitedBy: InvitedBy = isParentsGroup ? "parents" : "couple";

  const hostPronoun = invitedBy === "parents" ? salutation.parentsHostPronoun : salutation.coupleHostPronoun;
  const coupleReference = invitedBy === "parents" ? salutation.parentsCoupleReference ?? resolveParentsCoupleReference() : salutation.coupleHostPronoun;

  return {
    salutationCluster: clean(salutation.sentenceSalutation) || displayPrefixForSalutation(salutation),
    guestName: buildDisplayGuestName(values.salutationCluster, values.guestNameCore),
    displaySalutation: clean(salutation.displaySalutation) || buildDisplayGuestName(values.salutationCluster, values.guestNameCore),
    hostRelationship: salutation.hostRelationship,
    invitedBy,
    hostPronoun,
    coupleReference,
    relationship: salutation.relationship,
    householdMode: salutation.householdMode,
    plusOnePolicy: salutation.plusOnePolicy ?? derivePlusOnePolicy(salutation.householdMode),
    guestGroup: guestGroup.label,
    audienceTagsText: guestGroup.audienceTags,
    needsName: salutation.needsName,
  };
}

function excelText(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replaceAll("'", "''")}'`;
}

function columnLetter(index: number) {
  let value = index;
  let letter = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    value = Math.floor((value - 1) / 26);
  }

  return letter;
}

function optionRange(optionKey: OptionKey, optionIndex: number, optionColumns: Record<OptionKey, string[]>) {
  const letter = columnLetter(optionStartColumn + optionIndex);
  return `${quoteSheetName(systemSheetName)}!$${letter}$2:$${letter}$${optionColumns[optionKey].length + 1}`;
}

function termLookupRange() {
  const start = columnLetter(termLookupStartColumn);
  const end = columnLetter(termLookupStartColumn + termLookupColumnCount - 1);
  return `${quoteSheetName(systemSheetName)}!$${start}$2:$${end}$${salutationDefinitions.length + 1}`;
}


function rowPreview(values: TemplateRowValues, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const inferred = inferTemplateValues(values);
  const preview = buildInvitationCopy({
    guestName: inferred.guestName,
    displayLabel: inferred.guestName,
    invitationName: inferred.guestName,
    honorific: deriveHonorific(inferred.hostRelationship),
    invitedBy: inferred.invitedBy,
    relationship: inferred.relationship,
    hostRelationship: inferred.hostRelationship,
    hostPronoun: inferred.hostPronoun,
    coupleReference: inferred.coupleReference,
    householdMode: inferred.householdMode,
    plusOnePolicy: inferred.plusOnePolicy,
    guestGroup: inferred.guestGroup,
    coupleDisplayName: options.coupleDisplayName,
  });

  const missingDropdown = !values.salutationCluster || !values.guestGroup;
  const missingName = inferred.needsName && !clean(values.guestNameCore);

  return {
    envelopeLine: preview.envelopeLine,
    insideInviteLine: preview.insideInviteLine,
    invitationHostSubject: preview.invitationHostSubject,
    validationLine: missingDropdown
      ? "Thiếu lựa chọn dropdown"
      : missingName
        ? "Thiếu tên khách"
        : "OK - sẵn sàng upload",
  };
}

export function getSimpleInviteEntryOptions() {
  return {
    salutationClusters: salutationDefinitions.map((item) => item.label),
    guestGroups: guestGroupDefinitions.map((item) => item.label),
  };
}

export function previewSimpleInviteEntry(values: SimpleInviteEntry, spreadsheetOptions: SpreadsheetOptions = {}) {
  const options = resolveSpreadsheetOptions(spreadsheetOptions);
  const salutation = findSalutationDefinition(values.salutationCluster);
  const guestGroup = findGuestGroupDefinition(values.guestGroup);
  const inferred = inferTemplateValues(values);
  const preview = rowPreview(values, options);
  const errors: string[] = [];

  if (!values.salutationCluster) errors.push("Chọn cụm danh xưng.");
  else if (!salutation) errors.push("Cụm danh xưng không hợp lệ.");

  if (inferred.needsName && !clean(values.guestNameCore)) errors.push("Nhập tên khách.");

  if (!values.guestGroup) errors.push("Chọn nhóm khách.");
  else if (!guestGroup) errors.push("Nhóm khách không hợp lệ.");

  const postCeremonyPartyValue = normalizeText(values.postCeremonyPartyInvited);
  if (postCeremonyPartyValue && postCeremonyPartyValue !== "co") {
    errors.push("Mời tiệc sau Hôn phối chỉ nhận Có hoặc để trống.");
  }

  return {
    guestName: salutation ? inferred.guestName : "",
    householdMode: inferred.householdMode,
    householdModeLabel: salutation ? householdModeLabels[inferred.householdMode] : "",
    insideInviteLine: salutation && guestGroup ? preview.insideInviteLine : "",
    needsName: inferred.needsName,
    errors,
  };
}

export function createInviteeFromSimpleEntry(
  values: SimpleInviteEntry,
  existingTokens: Set<string>,
  spreadsheetOptions: SpreadsheetOptions = {},
) {
  const options = resolveSpreadsheetOptions(spreadsheetOptions);
  const entryPreview = previewSimpleInviteEntry(values, options);
  if (entryPreview.errors.length > 0) throw new Error(entryPreview.errors[0]);

  const inferred = inferTemplateValues(values);
  const preview = rowPreview(values, options);

  return createInvitee({
    inviteUnit: deriveInviteUnit(inferred.householdMode),
    salutationCluster: inferred.salutationCluster,
    displayLabel: inferred.guestName,
    displaySalutation: inferred.displaySalutation,
    guestName: inferred.guestName,
    invitationName: inferred.guestName,
    honorific: deriveHonorific(inferred.hostRelationship),
    envelopeLine: preview.envelopeLine,
    insideInviteLine: preview.insideInviteLine,
    invitedBy: inferred.invitedBy,
    relationship: inferred.relationship,
    hostRelationship: inferred.hostRelationship,
    hostPronoun: inferred.hostPronoun,
    coupleReference: inferred.coupleReference,
    householdMode: inferred.householdMode,
    plusOnePolicy: inferred.plusOnePolicy,
    guestGroup: inferred.guestGroup,
    audienceTags: parseAudienceTags(inferred.audienceTagsText),
    expectedGuestCount: deriveExpectedGuestCount(inferred.householdMode),
    postCeremonyPartyInvited: normalizeText(values.postCeremonyPartyInvited) === "co",
    phone: "",
    email: "",
    notes: "",
  }, existingTokens);
}

function displayNameCombinedFormula(rowIndex: number) {
  const clusterCell = `$B${rowIndex}`;
  const nameCell = `$C${rowIndex}`;
  const suffixLookup = `VLOOKUP(${clusterCell},${termLookupRange()},7,FALSE)`;
  return `IF(${clusterCell}="","",TRIM(IFERROR(VLOOKUP(${clusterCell},${termLookupRange()},6,FALSE),${clusterCell})&IF(${nameCell}="",""," "&${nameCell})&IFERROR(IF(${suffixLookup}="|","",${suffixLookup}),"")))`;
}

function guestUnitFormula(rowIndex: number) {
  const clusterCell = `$B${rowIndex}`;
  return `IF(${clusterCell}="","",IFERROR(VLOOKUP(${clusterCell},${termLookupRange()},4,FALSE),${excelText("Chưa xác định")}))`;
}

function sequenceFormula(rowIndex: number) {
  const guestCell = `$D${rowIndex}`;
  return `IF(${guestCell}="","",COUNTIF($D$${firstDataRow}:${guestCell},"<>"))`;
}

function findKeyByHeader(headers: Map<string, number>, labels: string[]) {
  for (const label of labels) {
    const index = headers.get(normalizeText(label));
    if (index) return index;
  }
  return 0;
}

function cellText(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const richTextValue = value as { richText?: { text?: string }[]; text?: string; result?: unknown };
    if (Array.isArray(richTextValue.richText)) {
      return richTextValue.richText.map((item) => item.text ?? "").join("").trim();
    }
    if (typeof richTextValue.text === "string") return richTextValue.text.trim();
    if (richTextValue.result !== undefined && richTextValue.result !== null) return String(richTextValue.result).trim();
  }
  return String(value).trim();
}

function pickByLabel<T extends string>(value: unknown, labels: Record<T, string>, fallback: T): T {
  const normalized = normalizeText(value);
  const entries = Object.entries(labels) as [T, string][];
  return entries.find(([key, label]) => normalizeText(key) === normalized || normalizeText(label) === normalized)?.[0] ?? fallback;
}

function parseInvitedBy(value: unknown): InvitedBy {
  return pickByLabel(value, invitedByLabels, "couple");
}

function parseHouseholdMode(value: unknown): HouseholdMode {
  return pickByLabel(value, householdModeLabels, "single");
}

function deriveInviteUnit(householdMode: HouseholdMode) {
  return householdMode === "couple" || householdMode === "family" ? "household" : "individual";
}

function derivePlusOnePolicy(householdMode: HouseholdMode): PlusOnePolicy {
  if (householdMode === "family") return "family";
  if (householdMode === "couple") return "spouse";
  return "none";
}

function deriveExpectedGuestCount(householdMode: HouseholdMode) {
  if (householdMode === "family") return 4;
  if (householdMode === "couple") return 2;
  return 1;
}

function deriveHonorific(hostRelationship: string) {
  const titleRelationships = new Set(["cha", "ông", "bà", "bác", "cô", "chú", "dì", "cậu", "mợ", "thím", "anh", "chị", "em", "cháu"]);
  return titleRelationships.has(hostRelationship.toLowerCase()) ? hostRelationship : "";
}

function styleInputCell(cell: ExcelJS.Cell, isDropdown: boolean) {
  cell.protection = { locked: false };
  cell.font = { name: "Arial", size: 13, color: { argb: palette.text } };
  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isDropdown ? palette.dropdown : palette.white } };
  cell.border = {
    bottom: { style: "thin", color: { argb: palette.border } },
    right: { style: "thin", color: { argb: palette.border } },
  };
}

function styleFormulaCell(cell: ExcelJS.Cell) {
  cell.protection = { locked: true };
  cell.font = { name: "Arial", size: 12, color: { argb: palette.muted } };
  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.formula } };
  cell.border = {
    bottom: { style: "thin", color: { argb: palette.border } },
    right: { style: "thin", color: { argb: palette.border } },
  };
}

function buildTitleBanner(worksheet: ExcelJS.Worksheet, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const lastColumn = columnLetter(columns.length);
  worksheet.mergeCells(`A${titleRowIndex}:${lastColumn}${titleRowIndex}`);
  const titleCell = worksheet.getCell(titleRowIndex, 1);
  titleCell.value = "DANH SÁCH KHÁCH MỜI";
  titleCell.font = { name: "Georgia", size: 24, bold: true, color: { argb: palette.white } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.olive } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(titleRowIndex).height = 48;

  worksheet.mergeCells(`A${subtitleRowIndex}:${lastColumn}${subtitleRowIndex}`);
  const subtitleCell = worksheet.getCell(subtitleRowIndex, 1);
  subtitleCell.value = `Lễ thành hôn ${options.coupleDisplayName}`;
  subtitleCell.font = { name: "Arial", size: 13, italic: true, color: { argb: palette.text } };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.ivory } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  subtitleCell.border = { bottom: { style: "thin", color: { argb: palette.champagne } } };
  worksheet.getRow(subtitleRowIndex).height = 30;

  worksheet.getRow(headerRowIndex - 1).height = 8;
}

function applyFormulaCells(row: ExcelJS.Row, rowIndex: number, values?: TemplateRowValues) {
  const inferred = values ? inferTemplateValues(values) : undefined;

  const sequenceCell = row.getCell(inviteColumn.sequence);
  sequenceCell.value = { formula: sequenceFormula(rowIndex), result: inferred?.guestName ? rowIndex - firstDataRow + 1 : "" };
  styleFormulaCell(sequenceCell);
  sequenceCell.alignment = { vertical: "middle", horizontal: "center" };
  sequenceCell.font = { name: "Arial", size: 12, bold: true, color: { argb: palette.muted } };

  const displayNameCombinedCell = row.getCell(inviteColumn.guestName);
  displayNameCombinedCell.value = { formula: displayNameCombinedFormula(rowIndex), result: inferred?.guestName ?? "" };
  styleFormulaCell(displayNameCombinedCell);

  const guestUnitCell = row.getCell(inviteColumn.guestUnit);
  guestUnitCell.value = { formula: guestUnitFormula(rowIndex), result: inferred ? householdModeLabels[inferred.householdMode] : "" };
  styleFormulaCell(guestUnitCell);
}

function applyTemplateRows(worksheet: ExcelJS.Worksheet, options: ReturnType<typeof resolveSpreadsheetOptions>, startRowIndex = firstDataRow) {
  const optionColumns = getOptionColumns(options.coupleDisplayName);

  for (let rowIndex = startRowIndex; rowIndex < startRowIndex + maxInviteRows; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    row.height = 54;

    const salutationCell = row.getCell(inviteColumn.salutationCluster);
    styleInputCell(salutationCell, true);
    salutationCell.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [optionRange("salutationCluster", 0, optionColumns)],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Chọn từ danh sách",
      error: "Ô này dùng danh sách chọn để tránh nhập sai.",
    };

    const guestNameCoreCell = row.getCell(inviteColumn.guestNameCore);
    styleInputCell(guestNameCoreCell, false);

    const guestGroupCell = row.getCell(inviteColumn.guestGroup);
    styleInputCell(guestGroupCell, true);
    guestGroupCell.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [optionRange("guestGroup", 1, optionColumns)],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Chọn từ danh sách",
      error: "Ô này dùng danh sách chọn để tránh nhập sai.",
    };

    const postCeremonyPartyCell = row.getCell(inviteColumn.postCeremonyPartyInvited);
    styleInputCell(postCeremonyPartyCell, true);
    postCeremonyPartyCell.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [optionRange("postCeremonyPartyInvited", 2, optionColumns)],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Chỉ chọn Có hoặc để trống",
      error: "Để trống nếu không hỏi. Chỉ chọn Có với khách được mời dự tiệc sau Hôn phối.",
    };

    applyFormulaCells(row, rowIndex);
  }
}


function buildSystemSheet(workbook: ExcelJS.Workbook, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const worksheet = workbook.addWorksheet(systemSheetName);
  const optionColumns = getOptionColumns(options.coupleDisplayName);
  const optionEntries = Object.entries(optionColumns) as [OptionKey, string[]][];

  optionEntries.forEach(([optionKey, values], columnIndex) => {
    const targetColumnIndex = optionStartColumn + columnIndex;
    worksheet.getCell(1, targetColumnIndex).value = columns.find((item) => item.key === optionKey)?.header ?? optionKey;
    values.forEach((value, valueIndex) => {
      worksheet.getCell(valueIndex + 2, targetColumnIndex).value = value;
    });
  });

  const termHeaders = ["Cụm danh xưng", "Quan hệ với người mời", "Quan hệ với cô dâu chú rể", "Đơn vị khách", "Cần tên khách", "Cụm in trên thiệp", "Hậu tố hiển thị"];
  termHeaders.forEach((header, index) => {
    worksheet.getCell(1, termLookupStartColumn + index).value = header;
    worksheet.getColumn(termLookupStartColumn + index).width = index === 2 ? 34 : 24;
  });
  salutationDefinitions.forEach((item, rowIndex) => {
    const targetRow = rowIndex + 2;
    worksheet.getCell(targetRow, termLookupStartColumn).value = item.label;
    worksheet.getCell(targetRow, termLookupStartColumn + 1).value = item.hostRelationship;
    worksheet.getCell(targetRow, termLookupStartColumn + 2).value = item.relationship;
    worksheet.getCell(targetRow, termLookupStartColumn + 3).value = householdModeLabels[item.householdMode];
    worksheet.getCell(targetRow, termLookupStartColumn + 4).value = item.needsName;
    worksheet.getCell(targetRow, termLookupStartColumn + 5).value = displayPrefixForSalutation(item);
    worksheet.getCell(targetRow, termLookupStartColumn + 6).value = item.displaySuffix ?? "|";
  });

  const groupHeaders = ["Nhóm khách", "Nhóm xem album"];
  groupHeaders.forEach((header, index) => {
    worksheet.getCell(1, groupLookupStartColumn + index).value = header;
    worksheet.getColumn(groupLookupStartColumn + index).width = 34;
  });
  guestGroupDefinitions.forEach((item, rowIndex) => {
    const targetRow = rowIndex + 2;
    worksheet.getCell(targetRow, groupLookupStartColumn).value = item.label;
    worksheet.getCell(targetRow, groupLookupStartColumn + 1).value = item.audienceTags;
  });

  worksheet.getCell(1, internalNoteRowColumn).value = "Dòng dữ liệu";
  worksheet.getCell(1, internalNoteValueColumn).value = "Ghi chú nội bộ";
  worksheet.getColumn(internalNoteRowColumn).width = 18;
  worksheet.getColumn(internalNoteValueColumn).width = 28;

  worksheet.state = "veryHidden";
}

function readInternalNotesByDataRow(workbook: ExcelJS.Workbook) {
  const worksheet = workbook.getWorksheet(systemSheetName);
  const notesByDataRow = new Map<number, string>();
  if (!worksheet) return notesByDataRow;

  const rowHeader = normalizeText(cellText(worksheet.getCell(1, internalNoteRowColumn)));
  const noteHeader = normalizeText(cellText(worksheet.getCell(1, internalNoteValueColumn)));
  if (rowHeader !== "dong du lieu" || noteHeader !== "ghi chu noi bo") return notesByDataRow;

  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const dataRow = Number(cellText(worksheet.getCell(rowIndex, internalNoteRowColumn)));
    const note = clean(cellText(worksheet.getCell(rowIndex, internalNoteValueColumn)));
    if (Number.isInteger(dataRow) && dataRow > headerRowIndex && note) {
      notesByDataRow.set(dataRow, note);
    }
  }

  return notesByDataRow;
}

function applyWorksheetColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns = columns.map((column) => ({
    key: column.key,
    width: column.width,
  }));
}

function applyHeaderRow(worksheet: ExcelJS.Worksheet, rowIndex: number) {
  const headerRow = worksheet.getRow(rowIndex);
  headerRow.height = 48;
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { name: "Arial", size: 12, bold: true, color: { argb: palette.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.oliveDark } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: palette.oliveDark } },
      left: { style: "thin", color: { argb: palette.champagne } },
      bottom: { style: "medium", color: { argb: palette.champagne } },
      right: { style: "thin", color: { argb: palette.champagne } },
    };
  });
}

function applyInputConditionalFormatting(worksheet: ExcelJS.Worksheet) {
  const lastDataRow = firstDataRow + maxInviteRows - 1;
  const warningStyle = {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: palette.warning } } as ExcelJS.Fill,
    font: { color: { argb: palette.text }, bold: true },
  };

  worksheet.addConditionalFormatting({
    ref: `B${firstDataRow}:B${lastDataRow}`,
    rules: [{
      type: "expression",
      priority: 1,
      formulae: [`AND($B${firstDataRow}="",OR($C${firstDataRow}<>"",$F${firstDataRow}<>""))`],
      style: warningStyle,
    }],
  });
  worksheet.addConditionalFormatting({
    ref: `C${firstDataRow}:C${lastDataRow}`,
    rules: [{
      type: "expression",
      priority: 2,
      formulae: [`AND($B${firstDataRow}<>"",$C${firstDataRow}="",NOT(OR($B${firstDataRow}="Ông bà",$B${firstDataRow}="Bố mẹ",$B${firstDataRow}="Ba mẹ",$B${firstDataRow}="Bố",$B${firstDataRow}="Mẹ")))`],
      style: warningStyle,
    }],
  });
  worksheet.addConditionalFormatting({
    ref: `F${firstDataRow}:F${lastDataRow}`,
    rules: [{
      type: "expression",
      priority: 3,
      formulae: [`AND(OR($B${firstDataRow}<>"",$C${firstDataRow}<>""),$F${firstDataRow}="")`],
      style: warningStyle,
    }],
  });
  worksheet.addConditionalFormatting({
    ref: `D${firstDataRow}:D${lastDataRow}`,
    rules: [{
      type: "expression",
      priority: 4,
      formulae: [`AND($D${firstDataRow}<>"",COUNTIF($D$${firstDataRow}:$D$${lastDataRow},$D${firstDataRow})>1)`],
      style: {
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: palette.duplicate } },
        font: { color: { argb: palette.text }, bold: true },
      },
    }],
  });
}

function findInviteHeaderRow(worksheet: ExcelJS.Worksheet) {
  let headerRowIndex = 0;
  const headers = new Map<string, number>();

  worksheet.eachRow({ includeEmpty: false }, (row, rowIndex) => {
    if (headerRowIndex) return;
    const rowHeaders = new Map<string, number>();
    row.eachCell((cell, columnIndex) => {
      rowHeaders.set(normalizeText(cellText(cell)), columnIndex);
    });
    if (
      findKeyByHeader(rowHeaders, ["Cụm tên khách", "Tên khách mời", "guest_name", "guestName"])
      || findKeyByHeader(rowHeaders, ["Cụm danh xưng", "salutation_cluster", "salutationCluster"])
    ) {
      headerRowIndex = rowIndex;
      rowHeaders.forEach((columnIndex, header) => headers.set(header, columnIndex));
    }
  });

  return { headerRowIndex, headers };
}

export async function buildInviteTemplateWorkbook(spreadsheetOptions: SpreadsheetOptions = {}) {
  const options = resolveSpreadsheetOptions(spreadsheetOptions);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "wedding-invitation-demo";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.views = [{ x: 0, y: 0, width: 18000, height: 10000, firstSheet: 0, activeTab: 0, visibility: "visible" }];

  const worksheet = workbook.addWorksheet(inviteSheetName, {
    views: [{
      state: "frozen",
      xSplit: 4,
      ySplit: headerRowIndex,
      activeCell: `B${firstDataRow}`,
      topLeftCell: `E${firstDataRow}`,
      showGridLines: false,
      zoomScale: 85,
    }],
  });
  worksheet.properties.defaultRowHeight = 54;
  applyWorksheetColumns(worksheet);
  buildTitleBanner(worksheet, options);
  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: columns.length },
  };

  applyHeaderRow(worksheet, headerRowIndex);
  buildSystemSheet(workbook, options);
  applyTemplateRows(worksheet, options, firstDataRow);
  applyInputConditionalFormatting(worksheet);
  worksheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    printTitlesRow: `1:${headerRowIndex}`,
  };
  await worksheet.protect("nhatphuong", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    autoFilter: true,
    sort: true,
  });

  return workbook;
}

export async function parseInviteWorkbook(buffer: ArrayBuffer, existingInvitees: Invitee[] = [], spreadsheetOptions: SpreadsheetOptions = {}): Promise<InviteImportResult> {
  const options = resolveSpreadsheetOptions(spreadsheetOptions);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(inviteSheetName) ?? workbook.worksheets[0];
  if (!worksheet) {
    return { invitees: [], errors: ["File Excel không có sheet danh sách khách mời."] };
  }

  const { headerRowIndex, headers } = findInviteHeaderRow(worksheet);

  const indexes = {
    salutationCluster: findKeyByHeader(headers, ["Cụm danh xưng", "salutation_cluster", "salutationCluster"]),
    guestNameCore: findKeyByHeader(headers, ["Tên khách", "guest_name_core", "guestNameCore"]),
    inviteOwner: findKeyByHeader(headers, ["Người mời là", "invite_owner", "inviteOwner"]),
    guestName: findKeyByHeader(headers, ["Tên khách mời", "guest_name", "guestName"]),
    hostRelationship: findKeyByHeader(headers, ["Quan hệ với người mời", "host_relationship", "hostRelationship"]),
    invitedBy: findKeyByHeader(headers, ["Người đứng mời", "invited_by", "invitedBy"]),
    hostPronoun: findKeyByHeader(headers, ["Người mời xưng là", "Người đứng mời xưng là", "host_pronoun", "hostPronoun"]),
    coupleReference: findKeyByHeader(headers, ["Người mời gọi cô dâu chú rể là", "Người mời gọi cô dâu chú rể", "couple_reference", "coupleReference"]),
    relationship: findKeyByHeader(headers, ["Quan hệ với cô dâu chú rể", "relationship"]),
    householdMode: findKeyByHeader(headers, ["Đơn vị khách", "Mời đi cùng", "household_mode", "householdMode"]),
    guestGroup: findKeyByHeader(headers, ["Nhóm khách", "Nhóm khách mời", "guest_group", "guestGroup"]),
    postCeremonyPartyInvited: findKeyByHeader(headers, ["Tham gia tiệc sau Hôn phối", "post_ceremony_party_invited", "postCeremonyPartyInvited"]),
    audienceTags: findKeyByHeader(headers, ["Nhóm xem album", "audience_tags", "audienceTags"]),
    token: findKeyByHeader(headers, ["token", "Mã link riêng", "ma link rieng"]),
  };

  const isSimplifiedWorkbook = Boolean(indexes.salutationCluster && indexes.guestNameCore && indexes.guestGroup);
  const hasPostCeremonyPartyColumn = Boolean(indexes.postCeremonyPartyInvited);
  const internalNotesByDataRow = readInternalNotesByDataRow(workbook);
  if (!indexes.guestName && !isSimplifiedWorkbook) {
    return { invitees: [], errors: ["File Excel thiếu cột Cụm tên khách hoặc bộ 3 cột rút gọn."] };
  }

  const existingTokens = new Set(existingInvitees.map((invitee) => invitee.token));
  const usedTokens = new Set<string>();
  const invitees: Invitee[] = [];
  const errors: string[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowIndex) => {
    if (!headerRowIndex || rowIndex <= headerRowIndex) return;

    const read = (index: number, fallback = "") => (index ? cellText(row.getCell(index)) : fallback);
    if (isSimplifiedWorkbook) {
      const simplifiedValues: TemplateRowValues = {
        salutationCluster: read(indexes.salutationCluster),
        guestNameCore: read(indexes.guestNameCore),
        guestGroup: read(indexes.guestGroup),
        postCeremonyPartyInvited: read(indexes.postCeremonyPartyInvited),
      };
      if (!simplifiedValues.salutationCluster && !simplifiedValues.guestNameCore && !simplifiedValues.guestGroup) return;

      const inferred = inferTemplateValues(simplifiedValues);
      if (!findSalutationDefinition(simplifiedValues.salutationCluster)) {
        errors.push(`Dòng ${rowIndex}: cụm danh xưng không hợp lệ.`);
        return;
      }
      if (!findGuestGroupDefinition(simplifiedValues.guestGroup)) {
        errors.push(`Dòng ${rowIndex}: nhóm khách không hợp lệ.`);
        return;
      }
      if (!simplifiedValues.salutationCluster || !simplifiedValues.guestGroup) {
        errors.push(`Dòng ${rowIndex}: thiếu lựa chọn dropdown.`);
        return;
      }
      if (inferred.needsName && !clean(simplifiedValues.guestNameCore)) {
        errors.push(`Dòng ${rowIndex}: thiếu tên khách.`);
        return;
      }
      const postCeremonyPartyValue = normalizeText(simplifiedValues.postCeremonyPartyInvited);
      if (postCeremonyPartyValue && postCeremonyPartyValue !== "co") {
        errors.push(`Dòng ${rowIndex}: cột Tham gia tiệc sau Hôn phối chỉ nhận giá trị Có hoặc để trống.`);
        return;
      }

      const preview = rowPreview(simplifiedValues, options);
      const tokenPool = new Set([...existingTokens, ...usedTokens]);
      const existingToken = indexes.token ? clean(read(indexes.token)) : "";
      const invitee = createInvitee({
        inviteUnit: deriveInviteUnit(inferred.householdMode),
        salutationCluster: inferred.salutationCluster,
        displayLabel: inferred.guestName,
        displaySalutation: inferred.displaySalutation,
        guestName: inferred.guestName,
        invitationName: inferred.guestName,
        honorific: deriveHonorific(inferred.hostRelationship),
        envelopeLine: preview.envelopeLine,
        insideInviteLine: preview.insideInviteLine,
        invitedBy: inferred.invitedBy,
        relationship: inferred.relationship,
        hostRelationship: inferred.hostRelationship,
        hostPronoun: inferred.hostPronoun,
        coupleReference: inferred.coupleReference,
        householdMode: inferred.householdMode,
        plusOnePolicy: inferred.plusOnePolicy,
        guestGroup: inferred.guestGroup,
        audienceTags: parseAudienceTags(inferred.audienceTagsText),
        expectedGuestCount: deriveExpectedGuestCount(inferred.householdMode),
        postCeremonyPartyInvited: postCeremonyPartyValue === "co",
        phone: "",
        email: "",
        notes: internalNotesByDataRow.get(rowIndex) ?? "",
      }, tokenPool, existingToken || undefined);

      usedTokens.add(invitee.token);
      invitees.push(invitee);
      return;
    }

    const guestName = read(indexes.guestName);
    if (!guestName) return;

    const dropdownValues = {
      hostRelationship: read(indexes.hostRelationship),
      invitedBy: read(indexes.invitedBy),
      hostPronoun: read(indexes.hostPronoun),
      coupleReference: read(indexes.coupleReference),
      relationship: read(indexes.relationship),
      householdMode: read(indexes.householdMode),
      guestGroup: read(indexes.guestGroup),
      audienceTags: read(indexes.audienceTags),
    };
    const missingDropdowns = Object.values(dropdownValues).some((value) => !value);
    const hostRelationship = dropdownValues.hostRelationship || legacyFallbackRowValues.hostRelationship;
    const invitedBy = parseInvitedBy(dropdownValues.invitedBy || invitedByLabels[legacyFallbackRowValues.invitedBy]);
    const hostPronoun = dropdownValues.hostPronoun || legacyFallbackRowValues.hostPronoun;
    const coupleReference = dropdownValues.coupleReference || legacyFallbackRowValues.coupleReference;
    const relationship = dropdownValues.relationship || legacyFallbackRowValues.relationship;
    const householdMode = parseHouseholdMode(dropdownValues.householdMode || householdModeLabels[legacyFallbackRowValues.householdMode]);
    const guestGroup = dropdownValues.guestGroup || legacyFallbackRowValues.guestGroup;
    const audienceTagsText = dropdownValues.audienceTags || legacyFallbackRowValues.audienceTagsText;
    const audienceTags = parseAudienceTags(audienceTagsText);
    const postCeremonyPartyValue = normalizeText(read(indexes.postCeremonyPartyInvited));

    if (missingDropdowns || audienceTags.length === 0) {
      errors.push(`Dòng ${rowIndex}: thiếu lựa chọn dropdown.`);
    }
    if (postCeremonyPartyValue && postCeremonyPartyValue !== "co") {
      errors.push(`Dòng ${rowIndex}: cột Tham gia tiệc sau Hôn phối chỉ nhận giá trị Có hoặc để trống.`);
      return;
    }

        const preview = buildInvitationCopy({
      guestName,
      displayLabel: guestName,
      invitationName: guestName,
      honorific: deriveHonorific(hostRelationship),
      invitedBy,
      relationship,
      hostRelationship,
      hostPronoun,
      coupleReference,
      householdMode,
      plusOnePolicy: derivePlusOnePolicy(householdMode),
      guestGroup,
      coupleDisplayName: options.coupleDisplayName,
    });
    const tokenPool = new Set([...existingTokens, ...usedTokens]);
    const existingToken = indexes.token ? clean(read(indexes.token)) : "";
    const invitee = createInvitee({
      inviteUnit: deriveInviteUnit(householdMode),
      displayLabel: guestName,
      displaySalutation: guestName,
      guestName,
      invitationName: guestName,
      honorific: deriveHonorific(hostRelationship),
      envelopeLine: preview.envelopeLine,
      insideInviteLine: preview.insideInviteLine,
      invitedBy,
      relationship,
      hostRelationship,
      hostPronoun,
      coupleReference,
      householdMode,
      plusOnePolicy: derivePlusOnePolicy(householdMode),
      guestGroup,
      audienceTags,
      expectedGuestCount: deriveExpectedGuestCount(householdMode),
      postCeremonyPartyInvited: postCeremonyPartyValue === "co",
      phone: "",
      email: "",
      notes: "",
    }, tokenPool, existingToken || undefined);

    usedTokens.add(invitee.token);
    invitees.push(invitee);
  });

  return { invitees, errors, hasPostCeremonyPartyColumn };
}

export async function buildInviteLinksWorkbook(invitees: Invitee[], origin = "") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "wedding-invitation-demo";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Link thiệp mời", {
    views: [{ state: "frozen", xSplit: 3, ySplit: 4, topLeftCell: "D5", showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.35, right: 0.35, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  worksheet.columns = [
    { key: "sequence", width: 10 },
    { key: "guestName", width: 38 },
    { key: "guestGroup", width: 32 },
    { key: "postCeremonyPartyInvited", width: 38 },
    { key: "inviteUrl", width: 76 },
  ];

  worksheet.mergeCells("A1:E1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "DANH SÁCH LINK THIỆP MỜI";
  titleCell.font = { name: "Georgia", size: 22, bold: true, color: { argb: palette.white } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.olive } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 46;

  worksheet.mergeCells("A2:E2");
  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = `Lễ thành hôn ${defaultCoupleDisplayName}`;
  subtitleCell.font = { name: "Arial", size: 12, italic: true, color: { argb: palette.text } };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.ivory } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
  subtitleCell.border = { bottom: { style: "thin", color: { argb: palette.champagne } } };
  worksheet.getRow(2).height = 28;

  worksheet.getRow(3).height = 9;
  worksheet.getCell("A3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.ivory } };
  worksheet.getCell("B3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.ivory } };
  worksheet.getCell("C3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.ivory } };
  worksheet.getCell("D3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.ivory } };
  worksheet.getCell("E3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.ivory } };

  const headerRow = worksheet.getRow(4);
  headerRow.values = [
    "STT",
    "Cụm tên khách",
    "Nhóm khách",
    "Mời tham gia tiệc sau Hôn phối",
    "Link thiệp",
  ];
  headerRow.height = 44;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 12, bold: true, color: { argb: palette.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.oliveDark } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      right: { style: "thin", color: { argb: palette.champagne } },
      bottom: { style: "thin", color: { argb: palette.champagne } },
    };
  });
  worksheet.autoFilter = "A4:E4";

  invitees.forEach((invitee, inviteeIndex) => {
    const inviteSide = resolveInviteLinkSide(invitee.guestGroup);
    const exportedGuestGroup = inviteSide === "bride"
      ? clean(invitee.notes) || clean(invitee.guestGroup)
      : clean(invitee.guestGroup) || clean(invitee.notes);
    const row = worksheet.addRow({
      guestName: invitee.invitationName || invitee.guestName || invitee.displayLabel,
      guestGroup: exportedGuestGroup || "Khác",
      postCeremonyPartyInvited: invitee.postCeremonyPartyInvited ? "Có" : "Không",
      inviteUrl: buildInviteUrl(invitee.token, origin),
    });
    row.getCell(1).value = {
      formula: `IF(B${row.number}="","",COUNTIF($B$5:B${row.number},"<>"))`,
      result: inviteeIndex + 1,
    };
  });

  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex <= 4) return;
    row.height = 42;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Arial", size: 12, color: { argb: palette.text } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowIndex % 2 === 0 ? palette.ivory : palette.white },
      };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = {
        bottom: { style: "thin", color: { argb: palette.border } },
        right: { style: "thin", color: { argb: palette.border } },
      };
    });

    const sequenceCell = row.getCell(1);
    sequenceCell.alignment = { vertical: "middle", horizontal: "center" };
    sequenceCell.font = { name: "Arial", size: 12, bold: true, color: { argb: palette.muted } };

    const guestCell = row.getCell(2);
    guestCell.font = { name: "Arial", size: 13, bold: true, color: { argb: palette.text } };

    const guestGroupCell = row.getCell(3);
    guestGroupCell.font = { name: "Arial", size: 11, italic: true, color: { argb: palette.muted } };

    const postCeremonyCell = row.getCell(4);
    const isInvited = cellText(postCeremonyCell) === "Có";
    postCeremonyCell.alignment = { vertical: "middle", horizontal: "center" };
    postCeremonyCell.font = {
      name: "Arial",
      size: 12,
      bold: isInvited,
      color: { argb: isInvited ? palette.oliveDark : palette.muted },
    };
    postCeremonyCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isInvited ? "FFEAF0E3" : rowIndex % 2 === 0 ? palette.ivory : palette.white },
    };
  });

  worksheet.getColumn(5).eachCell((cell, rowIndex) => {
    if (rowIndex <= 4) return;
    const url = cellText(cell);
    cell.value = { text: url, hyperlink: url, tooltip: "Bấm để mở thiệp" };
    cell.font = { name: "Arial", size: 12, color: { argb: "FF3B6EA8" }, underline: true };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
  });

  worksheet.pageSetup.printTitlesRow = "1:4";
  worksheet.pageSetup.printArea = `A1:E${Math.max(4, worksheet.rowCount)}`;

  return workbook;
}
