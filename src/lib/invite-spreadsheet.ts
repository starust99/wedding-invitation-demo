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
import { weddingConfig } from "@/config/wedding.config";

const inviteSheetName = "Danh sách khách mời";
const guideSheetName = "Hướng dẫn";
const exampleSheetName = "Ví dụ";
const maxInviteRows = 1000;
const defaultCoupleDisplayName = weddingConfig.couple.displayName || "Nhật & Phương";
const optionStartColumn = 11;
const termLookupStartColumn = 16;
const termLookupColumnCount = 6;
const groupLookupStartColumn = termLookupStartColumn + termLookupColumnCount;
type SalutationDefinition = {
  label: string;
  displayPrefix?: string;
  hostRelationship: string;
  relationship: string;
  householdMode: HouseholdMode;
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
  { label: "Ông bà", hostRelationship: "ông bà", relationship: "ông bà của cô dâu/chú rể", householdMode: "couple", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bố mẹ", hostRelationship: "bố mẹ", relationship: "bố mẹ của cô dâu/chú rể", householdMode: "couple", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Ba mẹ", hostRelationship: "ba mẹ", relationship: "bố mẹ của cô dâu/chú rể", householdMode: "couple", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bố", hostRelationship: "bố", relationship: "bố/mẹ của cô dâu/chú rể", householdMode: "couple", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Mẹ", hostRelationship: "mẹ", relationship: "bố/mẹ của cô dâu/chú rể", householdMode: "couple", needsName: false, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bác", hostRelationship: "bác", relationship: "bác của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Vợ chồng bác", hostRelationship: "vợ chồng bác", relationship: "vợ chồng bác của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
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
  { label: "Vợ chồng anh", hostRelationship: "vợ chồng anh", relationship: "vợ chồng anh/chị/em của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Gia đình anh", hostRelationship: "anh", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Chị", hostRelationship: "chị", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Vợ chồng chị", hostRelationship: "vợ chồng chị", relationship: "vợ chồng anh/chị/em của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Gia đình chị", hostRelationship: "chị", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Anh chị", hostRelationship: "anh chị", relationship: "anh chị của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Gia đình anh chị", hostRelationship: "anh chị", relationship: "anh chị của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "em" },
  { label: "Em", hostRelationship: "em", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "gia đình anh chị" },
  { label: "Vợ chồng em", hostRelationship: "vợ chồng em", relationship: "vợ chồng anh/chị/em của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "gia đình anh chị" },
  { label: "Gia đình em", hostRelationship: "em", relationship: "anh/chị/em của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "gia đình anh chị" },
  { label: "Cháu", hostRelationship: "cháu", relationship: "cháu của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai anh chị" },
  { label: "Vợ chồng cháu", hostRelationship: "vợ chồng cháu", relationship: "vợ chồng cháu của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai anh chị" },
  { label: "Gia đình cháu", hostRelationship: "cháu", relationship: "cháu của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai anh chị" },
  { label: "Hai bạn", hostRelationship: "bạn", relationship: "bạn của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
  { label: "Gia đình", hostRelationship: "bạn", relationship: "khách mời của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
  { label: "Bà", hostRelationship: "bà", relationship: "ông bà của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng con", parentsHostPronoun: "gia đình chúng con" },
  { label: "Bạn", hostRelationship: "bạn", relationship: "bạn của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
  { label: "Vợ chồng bạn", hostRelationship: "vợ chồng bạn", relationship: "vợ chồng bạn của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng mình", parentsHostPronoun: "gia đình chúng tôi" },
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
  { key: "salutationCluster", header: "Cụm danh xưng", width: 24 },
  { key: "guestNameCore", header: "Tên khách", width: 22 },
  { key: "guestName", header: "Cụm tên khách", width: 28 },
  { key: "guestGroup", header: "Nhóm khách", width: 34 },
  { key: "insideInviteLine", header: "Lời mời trong thiệp", width: 72 },
] as const;

type TemplateColumnKey = (typeof columns)[number]["key"];

type TemplateRowValues = {
  salutationCluster: string;
  guestNameCore: string;
  guestGroup: string;
};

type OptionKey =
  | "salutationCluster"
  | "guestGroup";

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

const spreadsheetInsideInviteHeading = "TRÂN TRỌNG & THÂN MỜI";

const headerNotes: Partial<Record<TemplateColumnKey, string>> = {
  salutationCluster: "Chọn cụm danh xưng chuẩn. Ví dụ: Anh, Hai bạn, Vợ chồng bác, Gia đình dì, Gia đình, Gia đình anh chị, Gia đình anh, Gia đình chị, Cô chú.",
  guestNameCore: "Chỉ gõ phần tên riêng hoặc tên đôi. Ví dụ: Hoàng, Tiến, Sáu, Linh, Tùng & Hương.",
  guestName: "Cột công thức tự động kết hợp cụm danh xưng và tên khách để tạo thành tên đầy đủ.",
  guestGroup: "Chọn theo nhóm lớn để dễ lọc danh sách và chia bàn sau này.",
  insideInviteLine: "Cột công thức, tự động tạo lời mời trong thiệp.",
};

const exampleRows: TemplateRowValues[] = [
  {
    salutationCluster: "Bố mẹ",
    guestNameCore: "",
    guestGroup: "[Nhà Gái] Họ ngoại",
  },
  {
    salutationCluster: "Gia đình dì",
    guestNameCore: "Sáu",
    guestGroup: "[Nhà Gái] Họ ngoại",
  },
  {
    salutationCluster: "Bạn",
    guestNameCore: "Thư",
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
  },
  {
    salutationCluster: "Anh",
    guestNameCore: "Hoàng",
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
  },
  {
    salutationCluster: "Anh chị",
    guestNameCore: "Thành",
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
  },
  {
    salutationCluster: "Gia đình anh chị",
    guestNameCore: "Tuấn",
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
  },
  {
    salutationCluster: "Vợ chồng em",
    guestNameCore: "Linh",
    guestGroup: "[Phương] Bạn bè & Đồng nghiệp",
  },
];

type InferredTemplateValues = {
  guestName: string;
  displaySalutation: string;
  hostRelationship: string;
  invitedBy: InvitedBy;
  hostPronoun: string;
  coupleReference: string;
  relationship: string;
  householdMode: HouseholdMode;
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
    "anh", "chi", "em", "co", "chu", "bac", "di", "duong", "cau", "mo", "thim", "ong", "ba", "thay", "co"
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

function titleRelationshipWords(value: string) {
  return value
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function displayPrefixForSalutation(salutation: Pick<SalutationDefinition, "label" | "displayPrefix">) {
  const prefix = clean(salutation.displayPrefix) || clean(salutation.label);
  const normalized = normalizeText(prefix);
  if (normalized === "hai ban") return "Hai bạn";
  if (normalized.startsWith("gia dinh ")) {
    return `Gia đình ${titleRelationshipWords(prefix.replace(/^gia đình\s+/i, ""))}`;
  }
  if (normalized === "gia dinh") return "Gia đình";
  if (normalized.startsWith("vo chong ")) {
    return `Vợ chồng ${titleRelationshipWords(prefix.replace(/^vợ chồng\s+/i, ""))}`;
  }
  return titleRelationshipWords(prefix);
}

function buildDisplayGuestName(salutationCluster: string, guestNameCore: string) {
  const cluster = clean(salutationCluster);
  const rawName = clean(guestNameCore);
  if (!cluster) return rawName;
  if (!rawName) return cluster;
  const cleanedName = cleanRedundantPrefix(salutationCluster, rawName);
  const salutation = findSalutationDefinition(cluster);
  const normalizedCluster = salutation ? displayPrefixForSalutation(salutation) : titleRelationshipWords(cluster);
  return `${normalizedCluster} ${cleanedName}`.replace(/\s+/g, " ").trim();
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
    guestName: buildDisplayGuestName(salutation.displayPrefix ?? values.salutationCluster, values.guestNameCore),
    displaySalutation: buildDisplayGuestName(salutation.displayPrefix ?? values.salutationCluster, values.guestNameCore),
    hostRelationship: salutation.hostRelationship,
    invitedBy,
    hostPronoun,
    coupleReference,
    relationship: salutation.relationship,
    householdMode: salutation.householdMode,
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
  return `${quoteSheetName(guideSheetName)}!$${letter}$2:$${letter}$${optionColumns[optionKey].length + 1}`;
}

function termLookupRange() {
  const start = columnLetter(termLookupStartColumn);
  const end = columnLetter(termLookupStartColumn + termLookupColumnCount - 1);
  return `${quoteSheetName(guideSheetName)}!$${start}$2:$${end}$${salutationDefinitions.length + 1}`;
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
    plusOnePolicy: derivePlusOnePolicy(inferred.householdMode),
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

function displayNameCombinedFormula(rowIndex: number) {
  const clusterCell = `$A${rowIndex}`;
  const nameCell = `$B${rowIndex}`;
  return `IF(${clusterCell}="","",IF(${nameCell}="",IFERROR(VLOOKUP(${clusterCell},${termLookupRange()},9,FALSE),${clusterCell}),TRIM(IFERROR(VLOOKUP(${clusterCell},${termLookupRange()},9,FALSE),${clusterCell})&" "&${nameCell})))`;
}

function insideInviteFormula(rowIndex: number, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const guestCell = `$C${rowIndex}`;
  const coupleName = options.coupleDisplayName;
  return `IF(${guestCell}="","",${excelText(spreadsheetInsideInviteHeading)}&CHAR(10)&${guestCell}&${excelText(" đến chung vui và ghi dấu những khoảnh khắc đáng nhớ cùng ")}&${excelText(coupleName)}&${excelText(".")})`;
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
  const titleRelationships = new Set(["ông", "bà", "bác", "cô", "chú", "dì", "cậu", "mợ", "thím", "anh", "chị", "em", "cháu"]);
  return titleRelationships.has(hostRelationship.toLowerCase()) ? hostRelationship : "";
}

function styleInputCell(cell: ExcelJS.Cell, isDropdown: boolean) {
  cell.protection = { locked: false };
  cell.alignment = { vertical: "middle", wrapText: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isDropdown ? "FFFFFBF2" : "FFFFFFFF" } };
  cell.border = {
    top: { style: "thin", color: { argb: "FFE8DDCC" } },
    left: { style: "thin", color: { argb: "FFE8DDCC" } },
    bottom: { style: "thin", color: { argb: "FFE8DDCC" } },
    right: { style: "thin", color: { argb: "FFE8DDCC" } },
  };
}

function styleFormulaCell(cell: ExcelJS.Cell) {
  cell.protection = { locked: true };
  cell.alignment = { vertical: "middle", wrapText: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F0E7" } };
  cell.border = {
    top: { style: "thin", color: { argb: "FFE8DDCC" } },
    left: { style: "thin", color: { argb: "FFE8DDCC" } },
    bottom: { style: "thin", color: { argb: "FFE8DDCC" } },
    right: { style: "thin", color: { argb: "FFE8DDCC" } },
  };
}

function applyFormulaCells(row: ExcelJS.Row, rowIndex: number, options: ReturnType<typeof resolveSpreadsheetOptions>, values?: TemplateRowValues) {
  const preview = values ? rowPreview(values, options) : undefined;
  const inferred = values ? inferTemplateValues(values) : undefined;

  const displayNameCombinedCell = row.getCell(3);
  displayNameCombinedCell.value = { formula: displayNameCombinedFormula(rowIndex), result: inferred?.guestName ?? "" };
  styleFormulaCell(displayNameCombinedCell);

  const insideCell = row.getCell(5);
  insideCell.value = { formula: insideInviteFormula(rowIndex, options), result: preview?.insideInviteLine ?? "" };
  styleFormulaCell(insideCell);
}

function fillEditableCells(row: ExcelJS.Row, values: TemplateRowValues) {
  row.getCell(1).value = values.salutationCluster;
  row.getCell(2).value = values.guestNameCore;
  row.getCell(4).value = values.guestGroup;
}

function applyTemplateRows(worksheet: ExcelJS.Worksheet, options: ReturnType<typeof resolveSpreadsheetOptions>, startRowIndex = 2) {
  const optionColumns = getOptionColumns(options.coupleDisplayName);

  for (let rowIndex = startRowIndex; rowIndex < startRowIndex + maxInviteRows; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    row.height = 48;

    // 1. salutationCluster
    const cell1 = row.getCell(1);
    styleInputCell(cell1, true);
    cell1.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [optionRange("salutationCluster", 0, optionColumns)],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Chọn từ danh sách",
      error: "Ô này dùng danh sách chọn để tránh nhập sai.",
    };

    // 2. guestNameCore
    const cell2 = row.getCell(2);
    styleInputCell(cell2, false);

    // 4. guestGroup
    const cell4 = row.getCell(4);
    styleInputCell(cell4, true);
    cell4.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [optionRange("guestGroup", 1, optionColumns)],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Chọn từ danh sách",
      error: "Ô này dùng danh sách chọn để tránh nhập sai.",
    };

    applyFormulaCells(row, rowIndex, options);
  }
}


function buildGuideSheet(workbook: ExcelJS.Workbook, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const worksheet = workbook.addWorksheet(guideSheetName);
  const optionColumns = getOptionColumns(options.coupleDisplayName);
  const optionEntries = Object.entries(optionColumns) as [OptionKey, string[]][];

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.columns = [
    { key: "section", width: 24 },
    { key: "detail", width: 78 },
    { key: "note", width: 42 },
    { key: "spacer1", width: 4 },
    { key: "column", width: 32 },
    { key: "meaning", width: 64 },
    { key: "spacer2", width: 4 },
    { key: "spacer3", width: 4 },
    { key: "spacer4", width: 4 },
    { key: "spacer5", width: 4 },
  ];

  worksheet.getCell("A1").value = "Hướng dẫn nhanh";
  worksheet.getCell("B1").value = "Cách dùng file Excel";
  worksheet.getCell("A2").value = "Bước 1";
  worksheet.getCell("B2").value = "Chỉ điền các cột cần thiết ở sheet Danh sách khách mời.";
  worksheet.getCell("A3").value = "Bước 2";
  worksheet.getCell("B3").value = "Cụm danh xưng và Nhóm khách là chọn bằng dropdown. Tên khách là cột gõ tay.";
  worksheet.getCell("A4").value = "Bước 3";
  worksheet.getCell("B4").value = "Nhìn các cột preview để kiểm tra dòng phong bì, lời mời trong thiệp và trạng thái sẵn sàng upload.";
  worksheet.getCell("A5").value = "Bước 4";
  worksheet.getCell("B5").value = "Upload lại file này vào /admin, rồi bấm Xuất Excel link riêng.";
  worksheet.getCell("A7").value = "Lưu ý";
  worksheet.getCell("B7").value = "Không sửa các cột preview công thức. Nếu lời mời chưa hiện, bấm Enter ở ô Tên khách hoặc mở bằng Microsoft Excel/Google Sheets để file tự tính lại.";
  worksheet.getCell("A8").value = "Mẹo điền";
  worksheet.getCell("B8").value = "Ví dụ chọn Cụm danh xưng = Vợ chồng bác, Tên khách = Tiến thì hệ thống tự tạo Cụm tên khách = Vợ chồng bác Tiến.";
  worksheet.getCell("A10").value = "Cột điền chính";
  worksheet.getCell("B10").value = "Cách ghi chuẩn";
  worksheet.getCell("A11").value = "Một người";
  worksheet.getCell("B11").value = "Cụm danh xưng = Anh/Chị/Em/Bác/Chú..., Tên khách = phần tên riêng.";
  worksheet.getCell("A12").value = "Hai vợ chồng";
  worksheet.getCell("B12").value = "Cụm danh xưng = Vợ chồng bác/Anh chị/Vợ chồng em..., Tên khách = phần tên riêng.";
  worksheet.getCell("A13").value = "Gia đình";
  worksheet.getCell("B13").value = "Cụm danh xưng = Gia đình dì/Gia đình anh chị/Gia đình bạn..., Tên khách = phần tên riêng.";
  worksheet.getCell("A14").value = "Ba mẹ mời ông bà";
  worksheet.getCell("B14").value = "Chọn Cụm danh xưng = Bố mẹ hoặc Ông bà, có thể để trống Tên khách.";

  const explanations = [
    ["Cụm danh xưng", "Chọn cách gọi khách: Anh, Vợ chồng bác, Gia đình dì, Gia đình anh chị, Cô chú..."],
    ["Tên khách", "Chỉ gõ phần tên riêng. Có thể để trống với các cụm như Bố mẹ, Ba mẹ, Ông bà."],
    ["Cụm tên khách", "Cột công thức tự động kết hợp cụm danh xưng và tên khách để tạo thành tên đầy đủ."],
    ["Nhóm khách", "Nhóm đã được gom theo tiền tố [Nhà Trai], [Nhà Gái], [Nhật], [Phương] để dễ dò và dễ lọc chia bàn."],
    ["Lời mời trong thiệp", "Cột preview, đây là lời mời sẽ lưu cho link riêng của khách."],
  ];

  worksheet.getCell("E1").value = "Giải thích từng cột";
  worksheet.getCell("F1").value = "Ý nghĩa";
  explanations.forEach(([column, meaning], index) => {
    worksheet.getCell(index + 2, 5).value = column;
    worksheet.getCell(index + 2, 6).value = meaning;
  });

  optionEntries.forEach(([optionKey, values], columnIndex) => {
    const targetColumnIndex = optionStartColumn + columnIndex;
    const column = worksheet.getColumn(targetColumnIndex);
    column.width = 34;
    worksheet.getCell(1, targetColumnIndex).value = columns.find((item) => item.key === optionKey)?.header ?? optionKey;
    values.forEach((value, valueIndex) => {
      worksheet.getCell(valueIndex + 2, targetColumnIndex).value = value;
    });
  });

  const termHeaders = ["Cụm danh xưng", "Quan hệ với người mời", "Quan hệ với cô dâu chú rể", "Mời đi cùng", "Cần tên khách", "Cụm in trên thiệp"];
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

  worksheet.getRow(1).height = 28;
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F6F4E" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return;
    row.height = 34;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE8DDCC" } },
        left: { style: "thin", color: { argb: "FFE8DDCC" } },
        bottom: { style: "thin", color: { argb: "FFE8DDCC" } },
        right: { style: "thin", color: { argb: "FFE8DDCC" } },
      };
    });
  });
}

function applyWorksheetColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns = columns.map((column) => ({
    key: column.key,
    header: column.header,
    width: column.width,
  }));
}

function applyHeaderRow(worksheet: ExcelJS.Worksheet, rowIndex: number) {
  const headerRow = worksheet.getRow(rowIndex);
  headerRow.height = 28;
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F6F4E" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD7C6A8" } },
      left: { style: "thin", color: { argb: "FFD7C6A8" } },
      bottom: { style: "thin", color: { argb: "FFD7C6A8" } },
      right: { style: "thin", color: { argb: "FFD7C6A8" } },
    };
    const note = headerNotes[column.key];
    if (note) cell.note = note;
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

function hideHelperColumns(worksheet: ExcelJS.Worksheet) {
  void worksheet;
}

function buildExampleSheet(workbook: ExcelJS.Workbook, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const worksheet = workbook.addWorksheet(exampleSheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  applyWorksheetColumns(worksheet);
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 5 },
  };
  applyHeaderRow(worksheet, 1);
  hideHelperColumns(worksheet);

  exampleRows.forEach((values, index) => {
    const rowIndex = index + 2;
    const row = worksheet.getRow(rowIndex);
    row.height = 52;
    fillEditableCells(row, values);
    styleInputCell(row.getCell(1), true);
    styleInputCell(row.getCell(2), false);
    styleInputCell(row.getCell(4), true);
    applyFormulaCells(row, rowIndex, options, values);
  });

  worksheet.getColumn(5).font = { color: { argb: "FF2E2A25" } };
}

export async function buildInviteTemplateWorkbook(spreadsheetOptions: SpreadsheetOptions = {}) {
  const options = resolveSpreadsheetOptions(spreadsheetOptions);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "wedding-invitation-demo";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const worksheet = workbook.addWorksheet(inviteSheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  applyWorksheetColumns(worksheet);
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 5 },
  };

  const headerRowIndex = 1;
  applyHeaderRow(worksheet, headerRowIndex);
  hideHelperColumns(worksheet);
  const firstDataRow = 2;
  buildGuideSheet(workbook, options);
  buildExampleSheet(workbook, options);
  applyTemplateRows(worksheet, options, firstDataRow);

  worksheet.getColumn(5).font = { color: { argb: "FF2E2A25" } };

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
    householdMode: findKeyByHeader(headers, ["Mời đi cùng", "household_mode", "householdMode"]),
    guestGroup: findKeyByHeader(headers, ["Nhóm khách", "Nhóm khách mời", "guest_group", "guestGroup"]),
    audienceTags: findKeyByHeader(headers, ["Nhóm xem album", "audience_tags", "audienceTags"]),
    token: findKeyByHeader(headers, ["token", "Mã link riêng", "ma link rieng"]),
  };

  const isSimplifiedWorkbook = Boolean(indexes.salutationCluster && indexes.guestNameCore && indexes.guestGroup);
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

      const preview = rowPreview(simplifiedValues, options);
      const tokenPool = new Set([...existingTokens, ...usedTokens]);
      const existingToken = indexes.token ? clean(read(indexes.token)) : "";
      const invitee = createInvitee({
        inviteUnit: deriveInviteUnit(inferred.householdMode),
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
        plusOnePolicy: derivePlusOnePolicy(inferred.householdMode),
        guestGroup: inferred.guestGroup,
        audienceTags: parseAudienceTags(inferred.audienceTagsText),
        expectedGuestCount: deriveExpectedGuestCount(inferred.householdMode),
        phone: "",
        email: "",
        notes: "",
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

    if (missingDropdowns || audienceTags.length === 0) {
      errors.push(`Dòng ${rowIndex}: thiếu lựa chọn dropdown.`);
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
      phone: "",
      email: "",
      notes: "",
    }, tokenPool, existingToken || undefined);

    usedTokens.add(invitee.token);
    invitees.push(invitee);
  });

  return { invitees, errors };
}

export async function buildInviteLinksWorkbook(invitees: Invitee[], origin = "") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "wedding-invitation-demo";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Link thiệp mời", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = [
    { key: "guestName", header: "Tên khách", width: 28 },
    { key: "relationship", header: "Mối quan hệ với cô dâu chú rể", width: 34 },
    { key: "inviteUrl", header: "Link thiệp mời độc bản", width: 68 },
  ];
  worksheet.autoFilter = "A1:C1";

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F6F4E" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  invitees.forEach((invitee) => {
    worksheet.addRow({
      guestName: invitee.invitationName || invitee.guestName || invitee.displayLabel,
      relationship: invitee.relationship || invitee.hostRelationship || invitee.guestGroup,
      inviteUrl: buildInviteUrl(invitee.token, origin),
    });
  });

  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return;
    row.height = 36;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE8DDCC" } },
        left: { style: "thin", color: { argb: "FFE8DDCC" } },
        bottom: { style: "thin", color: { argb: "FFE8DDCC" } },
        right: { style: "thin", color: { argb: "FFE8DDCC" } },
      };
    });
  });

  worksheet.getColumn(3).eachCell((cell, rowIndex) => {
    if (rowIndex === 1) return;
    const url = cellText(cell);
    cell.value = { text: url, hyperlink: url };
    cell.font = { color: { argb: "FF3B6EA8" }, underline: true };
  });

  return workbook;
}
