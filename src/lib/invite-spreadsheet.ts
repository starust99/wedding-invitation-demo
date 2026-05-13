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

const columns = [
  { key: "guestName", header: "Tên khách mời", width: 28 },
  { key: "hostRelationship", header: "Quan hệ với người mời", width: 24 },
  { key: "invitedBy", header: "Người đứng mời", width: 28 },
  { key: "hostPronoun", header: "Người mời xưng là", width: 24 },
  { key: "coupleReference", header: "Người mời gọi cô dâu chú rể là", width: 34 },
  { key: "relationship", header: "Quan hệ với cô dâu chú rể", width: 34 },
  { key: "householdMode", header: "Mời đi cùng", width: 24 },
  { key: "guestGroup", header: "Nhóm khách mời", width: 24 },
  { key: "audienceTags", header: "Nhóm xem album", width: 28 },
  { key: "envelopeLine", header: "Dòng ngoài phong bì", width: 44 },
  { key: "insideInviteLine", header: "Lời mời trong thiệp", width: 72 },
  { key: "validationLine", header: "Kiểm tra dòng nhập", width: 26 },
] as const;

type TemplateColumnKey = (typeof columns)[number]["key"];

type TemplateRowValues = {
  guestName: string;
  hostRelationship: string;
  invitedBy: string;
  hostPronoun: string;
  coupleReference: string;
  relationship: string;
  householdMode: string;
  guestGroup: string;
  audienceTags: string;
};

type OptionKey =
  | "hostRelationship"
  | "invitedBy"
  | "hostPronoun"
  | "coupleReference"
  | "relationship"
  | "householdMode"
  | "guestGroup"
  | "audienceTags";

type SpreadsheetOptions = {
  coupleDisplayName?: string;
};

function resolveSpreadsheetOptions(options: SpreadsheetOptions = {}) {
  return {
    coupleDisplayName: clean(options.coupleDisplayName) || defaultCoupleDisplayName,
  };
}

function getOptionColumns(coupleDisplayName: string): Record<OptionKey, string[]> {
  return {
    hostRelationship: [
      "ông",
      "bà",
      "bác",
      "cô",
      "chú",
      "dì",
      "cậu",
      "mợ",
      "thím",
      "dượng",
      "anh",
      "chị",
      "anh chị",
      "em",
      "cháu",
      "bạn",
      "bạn thân",
      "đồng nghiệp",
      "sếp",
      "thầy/cô",
      "khách quý",
    ],
    invitedBy: [invitedByLabels.parents, invitedByLabels.couple],
    hostPronoun: [
      "gia đình chúng con",
      "gia đình chúng tôi",
      "gia đình anh chị",
      "gia đình chúng em",
      "tụi con",
      "tụi em",
      "tụi mình",
      "anh chị",
      "gia đình",
    ],
    coupleReference: ["hai cháu", "hai con", "hai bạn", "tụi mình", "tụi em", "anh chị", coupleDisplayName],
    relationship: [
      "ông/bà của cô dâu/chú rể",
      "bác của cô dâu/chú rể",
      "cô/chú của cô dâu/chú rể",
      "dì/cậu/mợ/thím của cô dâu/chú rể",
      "anh/chị/em của cô dâu/chú rể",
      "cháu của cô dâu/chú rể",
      "bạn của cô dâu/chú rể",
      "bạn thân của cô dâu/chú rể",
      "bạn đại học",
      "đồng nghiệp",
      "khách của ba mẹ",
      "khách quý",
    ],
    householdMode: [
      householdModeLabels.single,
      householdModeLabels.couple,
      householdModeLabels.family,
      householdModeLabels.widowed,
    ],
    guestGroup: [
      "Họ nội",
      "Họ ngoại",
      "Gia đình",
      "Bạn cô dâu",
      "Bạn chú rể",
      "Bạn đại học",
      "Đồng nghiệp",
      "Khách của ba mẹ",
      "VIP",
      "Khác",
    ],
    audienceTags: [
      "gia đình",
      "gia đình;họ nội",
      "gia đình;họ ngoại",
      "bạn bè",
      "bạn bè;bạn đại học",
      "đồng nghiệp",
      "vip",
      "công khai",
    ],
  };
}

const defaultRowValues: Record<OptionKey, string> = {
  hostRelationship: "khách quý",
  invitedBy: invitedByLabels.couple,
  hostPronoun: "tụi mình",
  coupleReference: "tụi mình",
  relationship: "khách quý",
  householdMode: householdModeLabels.single,
  guestGroup: "Khác",
  audienceTags: "công khai",
};

const headerNotes: Partial<Record<TemplateColumnKey, string>> = {
  guestName: "Gõ đúng cách muốn hiện trên thiệp. Ví dụ: Chú Sáu, Gia Hân, Anh Hoàng.",
  hostRelationship: "Chọn vai của khách đối với người đứng mời. Cột này thay cho Danh xưng.",
  invitedBy: "Chọn Ba mẹ đứng mời hoặc Cô dâu chú rể đứng mời.",
  hostPronoun: "Cách người đứng mời tự xưng trong câu mời.",
  coupleReference: "Dùng khi Ba mẹ đứng mời. Ví dụ: hai cháu, hai con, hoặc tên cô dâu chú rể.",
  relationship: "Mối quan hệ để admin phân nhóm và xuất file link riêng.",
  householdMode: "Hệ thống tự suy ra người đi kèm RSVP và số khách dự kiến từ cột này.",
  audienceTags: "Chọn nhóm ảnh/album mà khách được xem trên link riêng.",
  envelopeLine: "Cột công thức, không cần sửa tay.",
  insideInviteLine: "Cột công thức, đây là lời mời sẽ lưu cho link riêng của khách.",
  validationLine: "Cột công thức báo dòng đã đủ thông tin để upload hay chưa.",
};

const exampleRows: TemplateRowValues[] = [
  {
    guestName: "Chú Sáu",
    hostRelationship: "chú",
    invitedBy: invitedByLabels.parents,
    hostPronoun: "gia đình chúng con",
    coupleReference: "hai cháu",
    relationship: "cô/chú của cô dâu/chú rể",
    householdMode: householdModeLabels.family,
    guestGroup: "Họ ngoại",
    audienceTags: "gia đình;họ ngoại",
  },
  {
    guestName: "Gia Hân",
    hostRelationship: "bạn",
    invitedBy: invitedByLabels.couple,
    hostPronoun: "tụi mình",
    coupleReference: "tụi mình",
    relationship: "bạn đại học",
    householdMode: householdModeLabels.single,
    guestGroup: "Bạn đại học",
    audienceTags: "bạn bè;bạn đại học",
  },
  {
    guestName: "Anh Hoàng",
    hostRelationship: "anh",
    invitedBy: invitedByLabels.couple,
    hostPronoun: "tụi em",
    coupleReference: "tụi em",
    relationship: "đồng nghiệp",
    householdMode: householdModeLabels.couple,
    guestGroup: "Đồng nghiệp",
    audienceTags: "đồng nghiệp",
  },
  {
    guestName: "Em Linh",
    hostRelationship: "em",
    invitedBy: invitedByLabels.couple,
    hostPronoun: "anh chị",
    coupleReference: "anh chị",
    relationship: "bạn của cô dâu/chú rể",
    householdMode: householdModeLabels.single,
    guestGroup: "Bạn cô dâu",
    audienceTags: "bạn bè",
  },
];

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

function excelText(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function equalsAny(cell: string, values: readonly string[]) {
  return values.map((value) => `${cell}=${excelText(value)}`).join(",");
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

function sentenceCaseFormula(cell: string) {
  return `UPPER(LEFT((${cell}),1))&MID((${cell}),2,200)`;
}

function rowPreview(values: TemplateRowValues, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const householdMode = parseHouseholdMode(values.householdMode);
  const preview = buildInvitationCopy({
    guestName: values.guestName,
    displayLabel: values.guestName,
    invitationName: values.guestName,
    honorific: deriveHonorific(values.hostRelationship),
    invitedBy: parseInvitedBy(values.invitedBy),
    relationship: values.relationship,
    hostRelationship: values.hostRelationship,
    hostPronoun: values.hostPronoun,
    coupleReference: values.coupleReference,
    householdMode,
    plusOnePolicy: derivePlusOnePolicy(householdMode),
    coupleDisplayName: options.coupleDisplayName,
  });

  return {
    inviteScope: preview.inviteScope,
    hostSubject: preview.hostSubject,
    recipientLine: preview.recipientLine,
    envelopeLine: preview.envelopeLine,
    insideInviteLine: preview.insideInviteLine,
    validationLine: "OK - sẵn sàng upload",
  };
}

function inviteScopeExpression(rowIndex: number) {
  const guestCell = `$A${rowIndex}`;
  const hostRelationshipCell = `$B${rowIndex}`;
  const householdCell = `$G${rowIndex}`;
  const nameAlreadyIncludesFamily = `OR(ISNUMBER(SEARCH(${excelText("gia đình")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("cả nhà")},LOWER(${guestCell}))))`;
  const coupleScope = `IF(${hostRelationshipCell}=${excelText("anh chị")},${excelText(" cùng gia đình")},IF(${hostRelationshipCell}=${excelText("anh")},${excelText(" cùng vợ")},IF(${hostRelationshipCell}=${excelText("chị")},${excelText(" cùng chồng")},IF(${hostRelationshipCell}=${excelText("bác")},${excelText(" cùng gia đình")},IF(${hostRelationshipCell}=${excelText("chú")},${excelText(" cùng cô")},IF(${hostRelationshipCell}=${excelText("cô")},${excelText(" cùng chú")},IF(${hostRelationshipCell}=${excelText("dì")},${excelText(" cùng dượng")},IF(${hostRelationshipCell}=${excelText("cậu")},${excelText(" cùng mợ")},IF(${hostRelationshipCell}=${excelText("mợ")},${excelText(" cùng cậu")},IF(${hostRelationshipCell}=${excelText("thím")},${excelText(" cùng chú")},IF(${hostRelationshipCell}=${excelText("dượng")},${excelText(" cùng dì")},IF(${hostRelationshipCell}=${excelText("ông")},${excelText(" cùng bà")},IF(${hostRelationshipCell}=${excelText("bà")},${excelText(" cùng ông")},${excelText(" cùng gia đình")})))))))))))))`;
  return `IF(${nameAlreadyIncludesFamily},"",IF(${householdCell}=${excelText(householdModeLabels.family)},${excelText(" và gia đình")},IF(${householdCell}=${excelText(householdModeLabels.couple)},${coupleScope},"")))`;
}

function hostSubjectExpression(rowIndex: number) {
  return sentenceCaseFormula(`$D${rowIndex}`);
}

function recipientLineExpression(rowIndex: number, scopeExpression = inviteScopeExpression(rowIndex)) {
  const guestCell = `$A${rowIndex}`;
  const hostRelationshipCell = `$B${rowIndex}`;
  const invitedByCell = `$C${rowIndex}`;

  return `IF(${invitedByCell}=${excelText(invitedByLabels.parents)},${guestCell}&${scopeExpression},IF(OR(${equalsAny(hostRelationshipCell, ["bạn", "bạn thân", "đồng nghiệp"])}),${excelText("bạn")}&${scopeExpression},IF(OR(${equalsAny(hostRelationshipCell, ["em", "cháu"])}),${excelText("em")}&${scopeExpression},IF(${hostRelationshipCell}=${excelText("anh")},${excelText("anh")}&${scopeExpression},IF(${hostRelationshipCell}=${excelText("chị")},${excelText("chị")}&${scopeExpression},${guestCell}&${scopeExpression})))))`;
}

function coupleInviteRecipientExpression(rowIndex: number) {
  const guestCell = `$A${rowIndex}`;
  const hostRelationshipCell = `$B${rowIndex}`;
  return `IF(OR(${equalsAny(hostRelationshipCell, ["anh chị"])}),${excelText("Vợ chồng anh chị")},IF(${hostRelationshipCell}=${excelText("anh")},${excelText("Anh cùng vợ")},IF(${hostRelationshipCell}=${excelText("chị")},${excelText("Chị cùng chồng")},IF(OR(${equalsAny(hostRelationshipCell, ["bạn", "bạn thân", "đồng nghiệp"])}),${excelText("Vợ chồng bạn")},IF(OR(${equalsAny(hostRelationshipCell, ["em", "cháu"])}),${excelText("Hai em")},IF(${hostRelationshipCell}=${excelText("bác")},${guestCell}&${excelText(" cùng gia đình")},IF(${hostRelationshipCell}=${excelText("chú")},${guestCell}&${excelText(" cùng cô")},IF(${hostRelationshipCell}=${excelText("cô")},${guestCell}&${excelText(" cùng chú")},IF(${hostRelationshipCell}=${excelText("dì")},${guestCell}&${excelText(" cùng dượng")},IF(${hostRelationshipCell}=${excelText("cậu")},${guestCell}&${excelText(" cùng mợ")},IF(${hostRelationshipCell}=${excelText("mợ")},${guestCell}&${excelText(" cùng cậu")},IF(${hostRelationshipCell}=${excelText("thím")},${guestCell}&${excelText(" cùng chú")},IF(${hostRelationshipCell}=${excelText("dượng")},${guestCell}&${excelText(" cùng dì")},IF(${hostRelationshipCell}=${excelText("ông")},${guestCell}&${excelText(" cùng bà")},IF(${hostRelationshipCell}=${excelText("bà")},${guestCell}&${excelText(" cùng ông")},${guestCell}&${excelText(" cùng gia đình")})))))))))))))))`;
}

function coupleEnvelopeRecipientExpression(rowIndex: number) {
  const guestCell = `$A${rowIndex}`;
  const hostRelationshipCell = `$B${rowIndex}`;
  return `IF(${hostRelationshipCell}=${excelText("anh chị")},${excelText("Vợ chồng ")}&${guestCell},IF(${hostRelationshipCell}=${excelText("anh")},${guestCell}&${excelText(" cùng vợ")},IF(${hostRelationshipCell}=${excelText("chị")},${guestCell}&${excelText(" cùng chồng")},IF(OR(${equalsAny(hostRelationshipCell, ["bạn", "bạn thân", "đồng nghiệp", "em", "cháu"])}),${excelText("Vợ chồng ")}&${guestCell},IF(${hostRelationshipCell}=${excelText("bác")},${guestCell}&${excelText(" cùng gia đình")},IF(${hostRelationshipCell}=${excelText("chú")},${guestCell}&${excelText(" cùng cô")},IF(${hostRelationshipCell}=${excelText("cô")},${guestCell}&${excelText(" cùng chú")},IF(${hostRelationshipCell}=${excelText("dì")},${guestCell}&${excelText(" cùng dượng")},IF(${hostRelationshipCell}=${excelText("cậu")},${guestCell}&${excelText(" cùng mợ")},IF(${hostRelationshipCell}=${excelText("mợ")},${guestCell}&${excelText(" cùng cậu")},IF(${hostRelationshipCell}=${excelText("thím")},${guestCell}&${excelText(" cùng chú")},IF(${hostRelationshipCell}=${excelText("dượng")},${guestCell}&${excelText(" cùng dì")},IF(${hostRelationshipCell}=${excelText("ông")},${guestCell}&${excelText(" cùng bà")},IF(${hostRelationshipCell}=${excelText("bà")},${guestCell}&${excelText(" cùng ông")},${guestCell}&${excelText(" cùng gia đình")}))))))))))))))`;
}

function envelopeFormula(rowIndex: number) {
  const guestCell = `$A${rowIndex}`;
  const hostRelationshipCell = `$B${rowIndex}`;
  const invitedByCell = `$C${rowIndex}`;
  const householdCell = `$G${rowIndex}`;
  const scopeExpression = inviteScopeExpression(rowIndex);
  const coupleEnvelopeRecipient = coupleEnvelopeRecipientExpression(rowIndex);
  const formalRelations = [
    "ông",
    "bà",
    "bác",
    "cô",
    "chú",
    "dì",
    "cậu",
    "mợ",
    "thím",
    "dượng",
    "anh",
    "chị",
    "anh chị",
    "sếp",
    "thầy/cô",
    "khách quý",
  ];
  const isFormal = `OR(${invitedByCell}=${excelText(invitedByLabels.parents)},${equalsAny(hostRelationshipCell, formalRelations)})`;
  return `IF(${guestCell}="","",IF(${householdCell}=${excelText(householdModeLabels.couple)},${excelText("Kính mời: ")}&${coupleEnvelopeRecipient},IF(${isFormal},${excelText("Kính mời: ")},${excelText("Mời: ")})&${guestCell}&${scopeExpression}))`;
}

function insideInviteFormula(rowIndex: number, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const guestCell = `$A${rowIndex}`;
  const hostRelationshipCell = `$B${rowIndex}`;
  const invitedByCell = `$C${rowIndex}`;
  const hostPronounCell = `$D${rowIndex}`;
  const coupleReferenceCell = `$E${rowIndex}`;
  const householdCell = `$G${rowIndex}`;
  const nameAlreadyIncludesFamily = `OR(ISNUMBER(SEARCH(${excelText("gia đình")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("cả nhà")},LOWER(${guestCell}))))`;
  const familyScopeExpression = `IF(${nameAlreadyIncludesFamily},"",IF(${householdCell}=${excelText(householdModeLabels.family)},${excelText(" và gia đình")},""))`;
  const hostSubjectExpressionValue = hostSubjectExpression(rowIndex);
  const recipientExpression = recipientLineExpression(rowIndex, familyScopeExpression);
  const coupleInviteRecipientExpressionValue = coupleInviteRecipientExpression(rowIndex);
  const coupleInviteOwner = `IF(${invitedByCell}=${excelText(invitedByLabels.parents)},${coupleReferenceCell}&${excelText(` ${options.coupleDisplayName}`)},${hostPronounCell})`;
  const isWarm = `OR(${equalsAny(hostRelationshipCell, ["bạn", "bạn thân", "đồng nghiệp", "em", "cháu"])})`;
  const coupleInviteLine = `${excelText("Kính mời: ")}&${coupleInviteRecipientExpressionValue}&${excelText(" đến chung vui trong lễ cưới của ")}&${coupleInviteOwner}&${excelText(".")}`;
  const normalInviteLine = `IF(${invitedByCell}=${excelText(invitedByLabels.parents)},${hostSubjectExpressionValue}&${excelText(" trân trọng kính mời ")}&${recipientExpression}&${excelText(" đến chung vui trong lễ cưới của ")}&${coupleReferenceCell}&${excelText(` ${options.coupleDisplayName}.`)},IF(${isWarm},${hostSubjectExpressionValue}&${excelText(" mời ")}&${recipientExpression}&${excelText(" đến chung vui trong lễ cưới của ")}&${hostPronounCell}&${excelText(".")},${hostSubjectExpressionValue}&${excelText(" trân trọng kính mời ")}&${recipientExpression}&${excelText(" đến chung vui trong lễ cưới của ")}&${hostPronounCell}&${excelText(".")}))`;

  return `IF(${guestCell}="","",IF(${householdCell}=${excelText(householdModeLabels.couple)},${coupleInviteLine},${normalInviteLine}))`;
}

function validationFormula(rowIndex: number) {
  return `IF($A${rowIndex}="","",IF(COUNTA($B${rowIndex}:$I${rowIndex})=8,${excelText("OK - sẵn sàng upload")},${excelText("Thiếu lựa chọn dropdown")}))`;
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

function formatHeaderRow(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F6F4E" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD7C6A8" } },
      left: { style: "thin", color: { argb: "FFD7C6A8" } },
      bottom: { style: "thin", color: { argb: "FFD7C6A8" } },
      right: { style: "thin", color: { argb: "FFD7C6A8" } },
    };
  });

  columns.forEach((column, index) => {
    const cell = worksheet.getCell(1, index + 1);
    const note = headerNotes[column.key];
    if (note) cell.note = note;
  });
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

  const envelopeCell = row.getCell(10);
  envelopeCell.value = { formula: envelopeFormula(rowIndex), result: preview?.envelopeLine ?? "" };
  styleFormulaCell(envelopeCell);

  const insideCell = row.getCell(11);
  insideCell.value = { formula: insideInviteFormula(rowIndex, options), result: preview?.insideInviteLine ?? "" };
  styleFormulaCell(insideCell);

  const validationCell = row.getCell(12);
  validationCell.value = { formula: validationFormula(rowIndex), result: preview?.validationLine ?? "" };
  styleFormulaCell(validationCell);
}

function fillEditableCells(row: ExcelJS.Row, values: TemplateRowValues) {
  row.getCell(1).value = values.guestName;
  row.getCell(2).value = values.hostRelationship;
  row.getCell(3).value = values.invitedBy;
  row.getCell(4).value = values.hostPronoun;
  row.getCell(5).value = values.coupleReference;
  row.getCell(6).value = values.relationship;
  row.getCell(7).value = values.householdMode;
  row.getCell(8).value = values.guestGroup;
  row.getCell(9).value = values.audienceTags;
}

function applyTemplateRows(worksheet: ExcelJS.Worksheet, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const optionColumns = getOptionColumns(options.coupleDisplayName);
  const optionKeys: OptionKey[] = [
    "hostRelationship",
    "invitedBy",
    "hostPronoun",
    "coupleReference",
    "relationship",
    "householdMode",
    "guestGroup",
    "audienceTags",
  ];

  for (let rowIndex = 2; rowIndex <= maxInviteRows + 1; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    row.height = 48;

    styleInputCell(row.getCell(1), false);

    optionKeys.forEach((optionKey, optionIndex) => {
      const cell = row.getCell(optionIndex + 2);
      styleInputCell(cell, true);
      cell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [optionRange(optionKey, optionIndex, optionColumns)],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Chọn từ danh sách",
        error: "Ô này dùng danh sách chọn để tránh nhập sai.",
      };
    });

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
  worksheet.getCell("B2").value = "Điền tên khách ở sheet Danh sách khách mời. Chỉ cột Tên khách mời cần gõ tay.";
  worksheet.getCell("A3").value = "Bước 2";
  worksheet.getCell("B3").value = "Các cột còn lại chọn bằng dropdown để tránh sai chính tả và sai vai xưng hô.";
  worksheet.getCell("A4").value = "Bước 3";
  worksheet.getCell("B4").value = "Nhìn 3 cột cuối để kiểm tra dòng phong bì, lời mời trong thiệp và trạng thái sẵn sàng upload.";
  worksheet.getCell("A5").value = "Bước 4";
  worksheet.getCell("B5").value = "Upload lại file này vào /admin, rồi bấm Xuất Excel link riêng.";
  worksheet.getCell("A7").value = "Lưu ý";
  worksheet.getCell("B7").value = "Không sửa công thức ở 3 cột cuối. Nếu lời mời chưa hiện, bấm Enter ở ô Tên khách mời hoặc mở bằng Microsoft Excel/Google Sheets để file tự tính lại.";

  const explanations = [
    ["Tên khách mời", "Gõ đúng cách muốn hiện trên thiệp, ví dụ: Chú Sáu, Gia Hân, Anh Hoàng."],
    ["Quan hệ với người mời", "Vai của khách đối với người đứng mời. Cột này thay cho Danh xưng."],
    ["Người đứng mời", "Ba mẹ đứng mời hoặc Cô dâu chú rể đứng mời."],
    ["Người mời xưng là", "Cách người đứng mời tự xưng trong câu mời, ví dụ: gia đình chúng con, tụi mình."],
    ["Người mời gọi cô dâu chú rể là", `Dùng nhất là khi ba mẹ đứng mời, ví dụ: hai cháu, hai con, hoặc ${options.coupleDisplayName}.`],
    ["Quan hệ với cô dâu chú rể", "Dùng để admin xuất danh sách link riêng và phân nhóm khách."],
    ["Mời đi cùng", "Hệ thống tự suy ra người đi kèm RSVP và số khách dự kiến từ cột này."],
    ["Nhóm khách mời", "Nhóm để nhà mình lọc danh sách trong admin."],
    ["Nhóm xem album", "Nhóm ảnh/album mà khách được xem trên link riêng."],
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

function buildExampleSheet(workbook: ExcelJS.Workbook, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const worksheet = workbook.addWorksheet(exampleSheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  applyWorksheetColumns(worksheet);
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  formatHeaderRow(worksheet);

  exampleRows.forEach((values, index) => {
    const rowIndex = index + 2;
    const row = worksheet.getRow(rowIndex);
    row.height = 52;
    fillEditableCells(row, values);
    for (let columnIndex = 1; columnIndex <= 9; columnIndex += 1) {
      styleInputCell(row.getCell(columnIndex), columnIndex > 1);
    }
    applyFormulaCells(row, rowIndex, options, values);
  });

  worksheet.getColumn(10).font = { color: { argb: "FF5F6F4E" } };
  worksheet.getColumn(11).font = { color: { argb: "FF2E2A25" } };
  worksheet.getColumn(12).font = { color: { argb: "FF6B7A5A" } };
}

export async function buildInviteTemplateWorkbook(spreadsheetOptions: SpreadsheetOptions = {}) {
  const options = resolveSpreadsheetOptions(spreadsheetOptions);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "wedding-invitation-demo";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  buildGuideSheet(workbook, options);

  const worksheet = workbook.addWorksheet(inviteSheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  applyWorksheetColumns(worksheet);
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  formatHeaderRow(worksheet);
  buildExampleSheet(workbook, options);
  applyTemplateRows(worksheet, options);

  worksheet.getColumn(10).font = { color: { argb: "FF5F6F4E" } };
  worksheet.getColumn(11).font = { color: { argb: "FF2E2A25" } };
  worksheet.getColumn(12).font = { color: { argb: "FF6B7A5A" } };

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

  const headers = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, columnIndex) => {
    headers.set(normalizeText(cellText(cell)), columnIndex);
  });

  const indexes = {
    guestName: findKeyByHeader(headers, ["Tên khách mời", "guest_name", "guestName"]),
    hostRelationship: findKeyByHeader(headers, ["Quan hệ với người mời", "host_relationship", "hostRelationship"]),
    invitedBy: findKeyByHeader(headers, ["Người đứng mời", "invited_by", "invitedBy"]),
    hostPronoun: findKeyByHeader(headers, ["Người mời xưng là", "Người đứng mời xưng là", "host_pronoun", "hostPronoun"]),
    coupleReference: findKeyByHeader(headers, ["Người mời gọi cô dâu chú rể là", "Người mời gọi cô dâu chú rể", "couple_reference", "coupleReference"]),
    relationship: findKeyByHeader(headers, ["Quan hệ với cô dâu chú rể", "relationship"]),
    householdMode: findKeyByHeader(headers, ["Mời đi cùng", "household_mode", "householdMode"]),
    guestGroup: findKeyByHeader(headers, ["Nhóm khách mời", "guest_group", "guestGroup"]),
    audienceTags: findKeyByHeader(headers, ["Nhóm xem album", "audience_tags", "audienceTags"]),
  };

  if (!indexes.guestName) {
    return { invitees: [], errors: ["File Excel thiếu cột Tên khách mời."] };
  }

  const existingTokens = new Set(existingInvitees.map((invitee) => invitee.token));
  const usedTokens = new Set<string>();
  const invitees: Invitee[] = [];
  const errors: string[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowIndex) => {
    if (rowIndex === 1) return;

    const read = (index: number, fallback = "") => (index ? cellText(row.getCell(index)) : fallback);
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
    const hostRelationship = dropdownValues.hostRelationship || defaultRowValues.hostRelationship;
    const invitedBy = parseInvitedBy(dropdownValues.invitedBy || defaultRowValues.invitedBy);
    const hostPronoun = dropdownValues.hostPronoun || defaultRowValues.hostPronoun;
    const coupleReference = dropdownValues.coupleReference || defaultRowValues.coupleReference;
    const relationship = dropdownValues.relationship || defaultRowValues.relationship;
    const householdMode = parseHouseholdMode(dropdownValues.householdMode || defaultRowValues.householdMode);
    const guestGroup = dropdownValues.guestGroup || defaultRowValues.guestGroup;
    const audienceTagsText = dropdownValues.audienceTags || defaultRowValues.audienceTags;
    const audienceTags = parseAudienceTags(audienceTagsText);

    if (missingDropdowns || audienceTags.length === 0) {
      errors.push(`Dòng ${rowIndex}: thiếu lựa chọn dropdown.`);
    }

    const rowValues: TemplateRowValues = {
      guestName,
      hostRelationship,
      invitedBy: invitedByLabels[invitedBy],
      hostPronoun,
      coupleReference,
      relationship,
      householdMode: householdModeLabels[householdMode],
      guestGroup,
      audienceTags: audienceTagsText,
    };
    const preview = rowPreview(rowValues, options);
    const tokenPool = new Set([...existingTokens, ...usedTokens]);
    const invitee = createInvitee({
      inviteUnit: deriveInviteUnit(householdMode),
      displayLabel: guestName,
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
    }, tokenPool);

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
