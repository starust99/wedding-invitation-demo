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
const termLookupColumnCount = 9;
const groupLookupStartColumn = termLookupStartColumn + termLookupColumnCount;
const groupLookupColumnCount = 2;
const ownerLookupStartColumn = groupLookupStartColumn + groupLookupColumnCount;

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

type InviteOwnerDefinition = {
  label: string;
  invitedBy: InvitedBy;
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
  { label: "Cháu - gọi Nhật & Phương là em", displayPrefix: "Cháu", hostRelationship: "cháu", relationship: "cháu của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai em" },
  { label: "Cháu - gọi Nhật & Phương là anh chị", displayPrefix: "Cháu", hostRelationship: "cháu", relationship: "cháu của cô dâu/chú rể", householdMode: "single", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai anh chị" },
  { label: "Vợ chồng cháu - gọi Nhật & Phương là em", displayPrefix: "Vợ chồng cháu", hostRelationship: "vợ chồng cháu", relationship: "vợ chồng cháu của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai em" },
  { label: "Vợ chồng cháu - gọi Nhật & Phương là anh chị", displayPrefix: "Vợ chồng cháu", hostRelationship: "vợ chồng cháu", relationship: "vợ chồng cháu của cô dâu/chú rể", householdMode: "couple", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai anh chị" },
  { label: "Gia đình cháu - gọi Nhật & Phương là em", displayPrefix: "Gia đình cháu", hostRelationship: "cháu", relationship: "cháu của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "chúng em", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai em" },
  { label: "Gia đình cháu - gọi Nhật & Phương là anh chị", displayPrefix: "Gia đình cháu", hostRelationship: "cháu", relationship: "cháu của cô dâu/chú rể", householdMode: "family", needsName: true, coupleHostPronoun: "anh chị", parentsHostPronoun: "cô chú", parentsCoupleReference: "hai anh chị" },
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

const inviteOwnerDefinitions: InviteOwnerDefinition[] = [
  { label: "Ba mẹ", invitedBy: "parents" },
  { label: "Nhật", invitedBy: "couple" },
  { label: "Phương", invitedBy: "couple" },
  { label: "Nhật & Phương", invitedBy: "couple" },
] as const;

const inlineGuideRows = [
  ["Cách nhập nhanh", "Chỉ điền 4 cột đầu. Tên khách là cột duy nhất gõ tay, 3 cột còn lại chọn dropdown."],
  ["Một người", "Ví dụ: cụm danh xưng = Anh, tên khách = Hoàng. Hệ thống tự ra Anh Hoàng."],
  ["Hai vợ chồng", "Ví dụ: cụm danh xưng = Vợ chồng bác, tên khách = Tiến. Hệ thống tự ra Vợ chồng bác Tiến."],
  ["Cả gia đình", "Ví dụ: cụm danh xưng = Gia đình dì, tên khách = Sáu (Hệ thống tự ra Gia đình dì Sáu), hoặc Gia đình anh chị, Gia đình anh, Gia đình chị..."],
  ["Ba mẹ mời ông bà", "Chọn cụm danh xưng = Bố mẹ hoặc Ông bà, có thể để trống tên khách nếu không cần gọi thêm tên riêng."],
] as const;
const inlineGuideRowCount = inlineGuideRows.length + 1;

const columns = [
  { key: "salutationCluster", header: "Cụm danh xưng", width: 24 },
  { key: "guestNameCore", header: "Tên khách", width: 22 },
  { key: "guestGroup", header: "Nhóm khách", width: 34 },
  { key: "inviteOwner", header: "Người mời là", width: 18 },
  { key: "envelopeLine", header: "Dòng ngoài phong bì", width: 44 },
  { key: "insideInviteLine", header: "Lời mời trong thiệp", width: 72 },
  { key: "validationLine", header: "Kiểm tra dòng nhập", width: 26 },
  { key: "guestName", header: "Tên khách mời", width: 28 },
  { key: "hostRelationship", header: "Quan hệ với người mời", width: 24 },
  { key: "invitedBy", header: "Người đứng mời", width: 28 },
  { key: "hostPronoun", header: "Người mời xưng là", width: 24 },
  { key: "coupleReference", header: "Người mời gọi cô dâu chú rể là", width: 34 },
  { key: "relationship", header: "Quan hệ với cô dâu chú rể", width: 34 },
  { key: "householdMode", header: "Mời đi cùng", width: 24 },
  { key: "audienceTags", header: "Nhóm xem album", width: 28 },
] as const;

type TemplateColumnKey = (typeof columns)[number]["key"];

type TemplateRowValues = {
  salutationCluster: string;
  guestNameCore: string;
  guestGroup: string;
  inviteOwner: string;
};

type OptionKey =
  | "salutationCluster"
  | "guestGroup"
  | "inviteOwner";

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
    inviteOwner: inviteOwnerDefinitions.map((item) => item.label),
  };
}

const defaultRowValues: Record<OptionKey, string> = {
  salutationCluster: "Bạn",
  guestGroup: "[Nhà Trai] Họ nội",
  inviteOwner: "Nhật & Phương",
};

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

const headerNotes: Partial<Record<TemplateColumnKey, string>> = {
  salutationCluster: "Chọn cụm danh xưng chuẩn. Ví dụ: Anh, Vợ chồng bác, Gia đình dì, Gia đình anh chị, Gia đình anh, Gia đình chị, Cô chú.",
  guestNameCore: "Chỉ gõ phần tên riêng. Ví dụ: Hoàng, Tiến, Sáu, Linh.",
  guestGroup: "Chọn theo nhóm lớn để dễ lọc danh sách và chia bàn sau này.",
  inviteOwner: "Ba mẹ hoặc một trong hai bạn là người phụ trách khách này.",
  envelopeLine: "Cột công thức, không cần sửa tay.",
  insideInviteLine: "Cột công thức, đây là lời mời sẽ lưu cho link riêng của khách.",
  validationLine: "Cột công thức báo dòng đã đủ thông tin để upload hay chưa.",
  guestName: "Cột helper ẩn để hệ thống import lại từ file rút gọn.",
  hostRelationship: "Cột helper ẩn để hệ thống suy ra vai xưng hô.",
  invitedBy: "Cột helper ẩn để hệ thống xác định ai đứng mời.",
  hostPronoun: "Cột helper ẩn để hệ thống tự chọn giọng văn.",
  coupleReference: "Cột helper ẩn cho trường hợp ba mẹ đứng mời.",
  relationship: "Cột helper ẩn phục vụ admin và xuất file.",
  householdMode: "Cột helper ẩn để suy ra số người được mời.",
  audienceTags: "Cột helper ẩn để gắn album phù hợp.",
};

const exampleRows: TemplateRowValues[] = [
  {
    salutationCluster: "Bố mẹ",
    guestNameCore: "",
    guestGroup: "[Nhà Gái] Họ ngoại",
    inviteOwner: "Ba mẹ",
  },
  {
    salutationCluster: "Gia đình dì",
    guestNameCore: "Sáu",
    guestGroup: "[Nhà Gái] Họ ngoại",
    inviteOwner: "Ba mẹ",
  },
  {
    salutationCluster: "Bạn",
    guestNameCore: "Thư",
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
    inviteOwner: "Nhật",
  },
  {
    salutationCluster: "Anh",
    guestNameCore: "Hoàng",
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
    inviteOwner: "Nhật",
  },
  {
    salutationCluster: "Anh chị",
    guestNameCore: "Thành",
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
    inviteOwner: "Nhật",
  },
  {
    salutationCluster: "Gia đình anh chị",
    guestNameCore: "Tuấn",
    guestGroup: "[Nhật] Bạn bè & Đồng nghiệp",
    inviteOwner: "Nhật",
  },
  {
    salutationCluster: "Vợ chồng em",
    guestNameCore: "Linh",
    guestGroup: "[Phương] Bạn bè & Đồng nghiệp",
    inviteOwner: "Phương",
  },
];

type InferredTemplateValues = {
  guestName: string;
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

function buildDisplayGuestName(salutationCluster: string, guestNameCore: string) {
  const cluster = clean(salutationCluster);
  const rawName = clean(guestNameCore);
  if (!cluster) return rawName;
  if (!rawName) return cluster;
  const cleanedName = cleanRedundantPrefix(salutationCluster, rawName);
  return `${cluster} ${cleanedName}`.replace(/\s+/g, " ").trim();
}

function findSalutationDefinition(value: string) {
  const normalized = normalizeText(value);
  return salutationDefinitions.find((item) => normalizeText(item.label) === normalized);
}

function findGuestGroupDefinition(value: string) {
  const normalized = normalizeText(value);
  return guestGroupDefinitions.find((item) => normalizeText(item.label) === normalized);
}

function findInviteOwnerDefinition(value: string) {
  const normalized = normalizeText(value);
  return inviteOwnerDefinitions.find((item) => normalizeText(item.label) === normalized);
}

function resolveParentsCoupleReference(hostRelationship: string) {
  return "hai cháu";
}

function inferTemplateValues(values: TemplateRowValues): InferredTemplateValues {
  const salutation = findSalutationDefinition(values.salutationCluster) ?? salutationDefinitions[0];
  const guestGroup = findGuestGroupDefinition(values.guestGroup) ?? guestGroupDefinitions[0];
  const inviteOwner = findInviteOwnerDefinition(values.inviteOwner) ?? inviteOwnerDefinitions[inviteOwnerDefinitions.length - 1];

  return {
    guestName: buildDisplayGuestName(salutation.displayPrefix ?? values.salutationCluster, values.guestNameCore),
    hostRelationship: salutation.hostRelationship,
    invitedBy: inviteOwner.invitedBy,
    hostPronoun: inviteOwner.invitedBy === "parents" ? salutation.parentsHostPronoun : salutation.coupleHostPronoun,
    coupleReference: inviteOwner.invitedBy === "parents" ? salutation.parentsCoupleReference ?? resolveParentsCoupleReference(salutation.hostRelationship) : salutation.coupleHostPronoun,
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

function equalsAny(cell: string, values: readonly string[]) {
  return values.map((value) => `${cell}=${excelText(value)}`).join(",");
}

function nestedExactIf(cell: string, entries: readonly (readonly [string, string])[], fallback: string) {
  return entries.reduceRight((current, [value, result]) => `IF(${cell}=${excelText(value)},${result},${current})`, fallback);
}

function startsWithAnyExpression(cell: string, prefixes: readonly string[]) {
  return `OR(${prefixes.map((prefix) => `LEFT(LOWER(${cell}),${prefix.length})=${excelText(prefix)}`).join(",")})`;
}

function pairNameAlreadyLooksLikePairExpression(guestCell: string) {
  return `OR(ISNUMBER(SEARCH(${excelText("vợ chồng")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("ông bà")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("bố mẹ")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("ba mẹ")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("cha mẹ")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("anh chị")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("cô chú")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("chú thím")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("dì dượng")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("cậu mợ")},LOWER(${guestCell}))))`;
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

function groupLookupRange() {
  const start = columnLetter(groupLookupStartColumn);
  const end = columnLetter(groupLookupStartColumn + 1);
  return `${quoteSheetName(guideSheetName)}!$${start}$2:$${end}$${guestGroupDefinitions.length + 1}`;
}

function ownerLookupRange() {
  const start = columnLetter(ownerLookupStartColumn);
  const end = columnLetter(ownerLookupStartColumn + 1);
  return `${quoteSheetName(guideSheetName)}!$${start}$2:$${end}$${inviteOwnerDefinitions.length + 1}`;
}

function sentenceCaseFormula(cell: string) {
  return `UPPER(LEFT((${cell}),1))&MID((${cell}),2,200)`;
}

function rowPreview(values: TemplateRowValues, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const inferred = inferTemplateValues(values);
  return previewFromLegacyValues(
    {
      guestName: inferred.guestName,
      hostRelationship: inferred.hostRelationship,
      invitedBy: inferred.invitedBy,
      hostPronoun: inferred.hostPronoun,
      coupleReference: inferred.coupleReference,
      relationship: inferred.relationship,
      householdMode: inferred.householdMode,
      guestGroup: inferred.guestGroup,
      audienceTagsText: inferred.audienceTagsText,
    },
    options,
    {
      missingDropdown: !values.salutationCluster || !values.guestGroup || !values.inviteOwner,
      missingName: inferred.needsName && !clean(values.guestNameCore),
    },
  );
}

function previewFromLegacyValues(
  values: LegacyRowValues,
  options: ReturnType<typeof resolveSpreadsheetOptions>,
  flags?: { missingDropdown?: boolean; missingName?: boolean },
) {
  const preview = buildInvitationCopy({
    guestName: values.guestName,
    displayLabel: values.guestName,
    invitationName: values.guestName,
    honorific: deriveHonorific(values.hostRelationship),
    invitedBy: values.invitedBy,
    relationship: values.relationship,
    hostRelationship: values.hostRelationship,
    hostPronoun: values.hostPronoun,
    coupleReference: values.coupleReference,
    householdMode: values.householdMode,
    plusOnePolicy: derivePlusOnePolicy(values.householdMode),
    guestGroup: values.guestGroup,
    coupleDisplayName: options.coupleDisplayName,
  });

  return {
    envelopeLine: preview.envelopeLine,
    insideInviteLine: preview.insideInviteLine,
    validationLine: flags?.missingDropdown
      ? "Thiếu lựa chọn dropdown"
      : flags?.missingName
        ? "Thiếu tên khách"
        : "OK - sẵn sàng upload",
  };
}

function helperGuestNameFormula(rowIndex: number) {
  const clusterCell = `$A${rowIndex}`;
  const nameCell = `$B${rowIndex}`;
  const displayPrefix = `IFERROR(VLOOKUP(${clusterCell},${termLookupRange()},9,FALSE),${clusterCell})`;
  return `IF(${clusterCell}="","",IF(${nameCell}="",${displayPrefix},TRIM(${displayPrefix}&" "&${nameCell})))`;
}

function helperHostRelationshipFormula(rowIndex: number) {
  return `IF($A${rowIndex}="","",IFERROR(VLOOKUP($A${rowIndex},${termLookupRange()},2,FALSE),""))`;
}

function helperInvitedByFormula(rowIndex: number) {
  return `IF($D${rowIndex}="","",IFERROR(VLOOKUP($D${rowIndex},${ownerLookupRange()},2,FALSE),""))`;
}

function helperHostPronounFormula(rowIndex: number) {
  return `IF($A${rowIndex}="","",IF($J${rowIndex}=${excelText(invitedByLabels.parents)},IFERROR(VLOOKUP($A${rowIndex},${termLookupRange()},7,FALSE),""),IFERROR(VLOOKUP($A${rowIndex},${termLookupRange()},6,FALSE),"")))`;
}

function helperCoupleReferenceFormula(rowIndex: number) {
  return `IF($J${rowIndex}=${excelText(invitedByLabels.parents)},IFERROR(VLOOKUP($A${rowIndex},${termLookupRange()},8,FALSE),IF(ISNUMBER(SEARCH(${excelText("cháu")},LOWER($I${rowIndex}))),${excelText("hai cháu")},${excelText("hai cháu")})),$K${rowIndex})`;
}

function helperRelationshipFormula(rowIndex: number) {
  return `IF($A${rowIndex}="","",IFERROR(VLOOKUP($A${rowIndex},${termLookupRange()},3,FALSE),""))`;
}

function helperHouseholdModeFormula(rowIndex: number) {
  return `IF($A${rowIndex}="","",IFERROR(VLOOKUP($A${rowIndex},${termLookupRange()},4,FALSE),""))`;
}

function helperAudienceTagsFormula(rowIndex: number) {
  return `IF($C${rowIndex}="","",IFERROR(VLOOKUP($C${rowIndex},${groupLookupRange()},2,FALSE),""))`;
}

function inviteScopeExpression(rowIndex: number) {
  const guestCell = `$H${rowIndex}`;
  const hostRelationshipCell = `$I${rowIndex}`;
  const householdCell = `$N${rowIndex}`;
  const nameAlreadyIncludesFamily = `OR(ISNUMBER(SEARCH(${excelText("gia đình")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("cả nhà")},LOWER(${guestCell}))))`;
  const coupleScope = nestedExactIf(
    hostRelationshipCell,
    [
      ...salutationDefinitions
        .filter((item) => item.householdMode === "couple" && item.hostRelationship.startsWith("vợ chồng"))
        .map((item) => [item.hostRelationship, excelText("")] as const),
      ["cô dượng", excelText("")],
      ["ông bà", excelText("")],
      ["bố mẹ", excelText("")],
      ["ba mẹ", excelText("")],
      ["cha mẹ", excelText("")],
      ["bố", excelText(" cùng mẹ")],
      ["mẹ", excelText(" cùng bố")],
      ["anh chị", excelText(" cùng gia đình")],
      ["anh", excelText(" cùng vợ")],
      ["chị", excelText(" cùng chồng")],
      ["bác", excelText(" cùng gia đình")],
      ["chú", excelText(" cùng cô")],
      ["cô", excelText(" cùng chú")],
      ["dì", excelText(" cùng dượng")],
      ["cậu", excelText(" cùng mợ")],
      ["mợ", excelText(" cùng cậu")],
      ["thím", excelText(" cùng chú")],
      ["dượng", excelText(" cùng dì")],
      ["ông", excelText(" cùng bà")],
      ["bà", excelText(" cùng ông")],
    ],
    excelText(" cùng gia đình"),
  );
  return `IF(${nameAlreadyIncludesFamily},"",IF(${householdCell}=${excelText(householdModeLabels.family)},${excelText(" và gia đình")},IF(${householdCell}=${excelText(householdModeLabels.couple)},${coupleScope},"")))`;
}

function hostSubjectExpression(rowIndex: number) {
  return sentenceCaseFormula(`$K${rowIndex}`);
}

function recipientLineExpression(rowIndex: number, scopeExpression = inviteScopeExpression(rowIndex)) {
  const guestCell = `$H${rowIndex}`;
  const hostRelationshipCell = `$I${rowIndex}`;
  const invitedByCell = `$J${rowIndex}`;

  return `IF(${invitedByCell}=${excelText(invitedByLabels.parents)},${guestCell}&${scopeExpression},IF(OR(${equalsAny(hostRelationshipCell, ["bạn", "bạn thân", "đồng nghiệp"])}),${excelText("bạn")}&${scopeExpression},IF(OR(${equalsAny(hostRelationshipCell, ["em", "cháu"])}),${excelText("em")}&${scopeExpression},IF(${hostRelationshipCell}=${excelText("anh")},${excelText("anh")}&${scopeExpression},IF(${hostRelationshipCell}=${excelText("chị")},${excelText("chị")}&${scopeExpression},${guestCell}&${scopeExpression})))))`;
}

function coupleInviteRecipientExpression(rowIndex: number) {
  const guestCell = `$H${rowIndex}`;
  const hostRelationshipCell = `$I${rowIndex}`;
  return nestedExactIf(
    hostRelationshipCell,
    [
      ["ông bà", guestCell],
      ["bố mẹ", guestCell],
      ["ba mẹ", guestCell],
      ["cha mẹ", guestCell],
      ["bố", `${guestCell}&${excelText(" cùng Mẹ")}`],
      ["mẹ", `${guestCell}&${excelText(" cùng Bố")}`],
      ["vợ chồng anh chị", guestCell],
      ["vợ chồng anh", guestCell],
      ["vợ chồng chị", guestCell],
      ["vợ chồng em", guestCell],
      ["vợ chồng cháu", guestCell],
      ["vợ chồng bạn", guestCell],
      ["vợ chồng đồng nghiệp", guestCell],
      ["vợ chồng bác", guestCell],
      ["vợ chồng cô chú", guestCell],
      ["vợ chồng chú thím", guestCell],
      ["vợ chồng dì dượng", guestCell],
      ["vợ chồng cậu mợ", guestCell],
      ["vợ chồng cô dượng", guestCell],
      ["anh chị", excelText("anh chị")],
      ["anh", excelText("Anh cùng vợ")],
      ["chị", excelText("Chị cùng chồng")],
      ["bạn", excelText("Vợ chồng bạn")],
      ["bạn thân", excelText("Vợ chồng bạn")],
      ["đồng nghiệp", excelText("Vợ chồng bạn")],
      ["em", excelText("Hai em")],
      ["cháu", excelText("Hai em")],
      ["bác", `${guestCell}&${excelText(" cùng gia đình")}`],
      ["chú", `${guestCell}&${excelText(" cùng cô")}`],
      ["cô", `${guestCell}&${excelText(" cùng chú")}`],
      ["dì", `${guestCell}&${excelText(" cùng dượng")}`],
      ["cậu", `${guestCell}&${excelText(" cùng mợ")}`],
      ["mợ", `${guestCell}&${excelText(" cùng cậu")}`],
      ["thím", `${guestCell}&${excelText(" cùng chú")}`],
      ["dượng", `${guestCell}&${excelText(" cùng dì")}`],
      ["ông", `${guestCell}&${excelText(" cùng bà")}`],
      ["bà", `${guestCell}&${excelText(" cùng ông")}`],
      ],
    `${guestCell}&${excelText(" cùng gia đình")}`,
  );
}

function coupleEnvelopeRecipientExpression(rowIndex: number) {
  const guestCell = `$H${rowIndex}`;
  const hostRelationshipCell = `$I${rowIndex}`;
  return nestedExactIf(
    hostRelationshipCell,
    [
      ["ông bà", guestCell],
      ["bố mẹ", guestCell],
      ["ba mẹ", guestCell],
      ["cha mẹ", guestCell],
      ["bố", `${guestCell}&${excelText(" cùng Mẹ")}`],
      ["mẹ", `${guestCell}&${excelText(" cùng Bố")}`],
      ["vợ chồng anh chị", guestCell],
      ["vợ chồng anh", guestCell],
      ["vợ chồng chị", guestCell],
      ["vợ chồng em", guestCell],
      ["vợ chồng cháu", guestCell],
      ["vợ chồng bạn", guestCell],
      ["vợ chồng đồng nghiệp", guestCell],
      ["vợ chồng bác", guestCell],
      ["vợ chồng cô chú", guestCell],
      ["vợ chồng chú thím", guestCell],
      ["vợ chồng dì dượng", guestCell],
      ["vợ chồng cậu mợ", guestCell],
      ["vợ chồng cô dượng", guestCell],
      ["anh chị", guestCell],
      ["anh", `${guestCell}&${excelText(" cùng vợ")}`],
      ["chị", `${guestCell}&${excelText(" cùng chồng")}`],
      ["bạn", `${excelText("Vợ chồng ")}&${guestCell}`],
      ["bạn thân", `${excelText("Vợ chồng ")}&${guestCell}`],
      ["đồng nghiệp", `${excelText("Vợ chồng ")}&${guestCell}`],
      ["em", `${excelText("Vợ chồng ")}&${guestCell}`],
      ["cháu", `${excelText("Vợ chồng ")}&${guestCell}`],
      ["bác", `${guestCell}&${excelText(" cùng gia đình")}`],
      ["chú", `${guestCell}&${excelText(" cùng cô")}`],
      ["cô", `${guestCell}&${excelText(" cùng chú")}`],
      ["dì", `${guestCell}&${excelText(" cùng dượng")}`],
      ["cậu", `${guestCell}&${excelText(" cùng mợ")}`],
      ["mợ", `${guestCell}&${excelText(" cùng cậu")}`],
      ["thím", `${guestCell}&${excelText(" cùng chú")}`],
      ["dượng", `${guestCell}&${excelText(" cùng dì")}`],
      ["ông", `${guestCell}&${excelText(" cùng bà")}`],
      ["bà", `${guestCell}&${excelText(" cùng ông")}`],
    ],
    `${guestCell}&${excelText(" cùng gia đình")}`,
  );
}

function envelopeFormula(rowIndex: number) {
  const guestCell = `$H${rowIndex}`;
  const hostRelationshipCell = `$I${rowIndex}`;
  const invitedByCell = `$J${rowIndex}`;
  const householdCell = `$N${rowIndex}`;
  const scopeExpression = inviteScopeExpression(rowIndex);
  const coupleEnvelopeRecipient = coupleEnvelopeRecipientExpression(rowIndex);
  const formalRelations = [
    "ông",
    "bà",
    "bố",
    "mẹ",
    "bố mẹ",
    "ba mẹ",
    "cha mẹ",
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

function familyHostSubjectExpression(rowIndex: number) {
  const hostPronounCell = `$K${rowIndex}`;
  return `IF(OR(LEFT(LOWER(${hostPronounCell}),8)="gia đình",LEFT(LOWER(${hostPronounCell}),8)="gia dinh"),UPPER(LEFT(${hostPronounCell},1))&MID(${hostPronounCell},2,200),${excelText("Gia đình ")}&LOWER(${hostPronounCell}))`;
}

function cleanHostSubjectExpression(rowIndex: number) {
  const hostPronounCell = `$K${rowIndex}`;
  const cleanFormula = `IF(OR(LEFT(LOWER(${hostPronounCell}),9)="gia đình ",LEFT(LOWER(${hostPronounCell}),9)="gia dinh "),MID(${hostPronounCell},10,200),${hostPronounCell})`;
  return `UPPER(LEFT(${cleanFormula},1))&MID(${cleanFormula},2,200)`;
}

function pluralHostSubjectExpression(rowIndex: number) {
  const hostPronounCell = `$K${rowIndex}`;
  const cleanFormula = `IF(OR(LEFT(LOWER(${hostPronounCell}),9)="gia đình ",LEFT(LOWER(${hostPronounCell}),9)="gia dinh "),MID(${hostPronounCell},10,200),${hostPronounCell})`;
  const pluralFormula = `IF(LOWER(TRIM(${cleanFormula}))="em",${excelText("chúng em")},IF(LOWER(TRIM(${cleanFormula}))="con",${excelText("chúng con")},IF(LOWER(TRIM(${cleanFormula}))="tôi",${excelText("chúng tôi")},IF(OR(LOWER(TRIM(${cleanFormula}))="anh",LOWER(TRIM(${cleanFormula}))="chị"),${excelText("anh chị")},IF(LOWER(TRIM(${cleanFormula}))="bác",${excelText("chúng tôi")},${cleanFormula})))))`;
  return `UPPER(LEFT(${pluralFormula},1))&MID(${pluralFormula},2,200)`;
}

function insideInviteFormula(rowIndex: number, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const guestCell = `$H${rowIndex}`;
  const hostRelationshipCell = `$I${rowIndex}`;
  const invitedByCell = `$J${rowIndex}`;
  const hostPronounCell = `$K${rowIndex}`;
  const coupleReferenceCell = `$L${rowIndex}`;
  const householdCell = `$N${rowIndex}`;

  const isFamilyCell = `OR(${householdCell}=${excelText(householdModeLabels.family)},ISNUMBER(SEARCH(${excelText("gia đình")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("cả nhà")},LOWER(${guestCell}))))`;

  const isChauCell = `OR(ISNUMBER(SEARCH(${excelText("cháu")},LOWER(${hostRelationshipCell}))),ISNUMBER(SEARCH(${excelText("chau")},LOWER(${hostRelationshipCell}))))`;

  const familyHostSubjectExpressionValue = familyHostSubjectExpression(rowIndex);
  const cleanHostSubjectExpressionValue = cleanHostSubjectExpression(rowIndex);
  const pluralHostSubjectExpressionValue = pluralHostSubjectExpression(rowIndex);
  const isParentsHost = `${invitedByCell}=${excelText(invitedByLabels.parents)}`;
  const invitationHostSubject = `IF(${isChauCell},${excelText("Gia đình")},IF(${isFamilyCell},${pluralHostSubjectExpressionValue},IF(${isParentsHost},${familyHostSubjectExpressionValue},${cleanHostSubjectExpressionValue})))`;

  const nameAlreadyIncludesFamily = `OR(ISNUMBER(SEARCH(${excelText("gia đình")},LOWER(${guestCell}))),ISNUMBER(SEARCH(${excelText("cả nhà")},LOWER(${guestCell}))))`;
  const familyScopeExpression = `IF(${nameAlreadyIncludesFamily},"",IF(${householdCell}=${excelText(householdModeLabels.family)},${excelText(" và gia đình")},""))`;

  const recipientExpression = recipientLineExpression(rowIndex, familyScopeExpression);
  const finalRecipient = `IF(${isChauCell},${excelText("các cháu")},IF(${isFamilyCell},${excelText("gia đình")},${recipientExpression}))`;

  const coupleInviteRecipientExpressionValue = coupleInviteRecipientExpression(rowIndex);
  const coupleInviteRecipient = `IF(${isChauCell},${excelText("các cháu")},${coupleInviteRecipientExpressionValue})`;
  const coupleInviteOwner = `IF(${invitedByCell}=${excelText(invitedByLabels.parents)},${coupleReferenceCell}&${excelText(` ${options.coupleDisplayName}`)},${hostPronounCell})`;
  const isWarm = `OR(${equalsAny(hostRelationshipCell, ["bạn", "bạn thân", "đồng nghiệp", "em", "cháu"])})`;

  const coupleInviteLine = `${invitationHostSubject}&${excelText(" trân trọng kính mời ")}&${coupleInviteRecipient}&${excelText(" đến chung vui trong ngày cưới của ")}&${coupleInviteOwner}&${excelText(".")}`;
  const normalInviteLine = `IF(${invitedByCell}=${excelText(invitedByLabels.parents)},${invitationHostSubject}&${excelText(" trân trọng kính mời ")}&${finalRecipient}&${excelText(" đến chung vui trong ngày cưới của ")}&${coupleReferenceCell}&${excelText(` ${options.coupleDisplayName}.`)},IF(${isWarm},${invitationHostSubject}&${excelText(" mời ")}&${finalRecipient}&${excelText(" đến chung vui cùng ")}&${hostPronounCell}&${excelText(".")},${invitationHostSubject}&${excelText(" trân trọng kính mời ")}&${finalRecipient}&${excelText(" đến chung vui cùng ")}&${hostPronounCell}&${excelText(".")}))`;

  return `IF(${guestCell}="","",IF(${householdCell}=${excelText(householdModeLabels.couple)},${coupleInviteLine},${normalInviteLine}))`;
}

function validationFormula(rowIndex: number) {
  const termCell = `$A${rowIndex}`;
  const nameCell = `$B${rowIndex}`;
  const groupCell = `$C${rowIndex}`;
  const ownerCell = `$D${rowIndex}`;
  const requiresName = `IFERROR(VLOOKUP(${termCell},${termLookupRange()},5,FALSE),0)`;
  return `IF(AND(${termCell}="",${nameCell}="",${groupCell}="",${ownerCell}=""),"",IF(OR(${termCell}="",${groupCell}="",${ownerCell}=""),${excelText("Thiếu lựa chọn dropdown")},IF(AND(${requiresName}=TRUE,${nameCell}=""),${excelText("Thiếu tên khách")},${excelText("OK - sẵn sàng upload")})))`;
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

  const envelopeCell = row.getCell(5);
  envelopeCell.value = { formula: envelopeFormula(rowIndex), result: preview?.envelopeLine ?? "" };
  styleFormulaCell(envelopeCell);

  const insideCell = row.getCell(6);
  insideCell.value = { formula: insideInviteFormula(rowIndex, options), result: preview?.insideInviteLine ?? "" };
  styleFormulaCell(insideCell);

  const validationCell = row.getCell(7);
  validationCell.value = { formula: validationFormula(rowIndex), result: preview?.validationLine ?? "" };
  styleFormulaCell(validationCell);

  const helperCells = [
    [8, helperGuestNameFormula(rowIndex), values ? inferTemplateValues(values).guestName : ""],
    [9, helperHostRelationshipFormula(rowIndex), values ? inferTemplateValues(values).hostRelationship : ""],
    [10, helperInvitedByFormula(rowIndex), values ? invitedByLabels[inferTemplateValues(values).invitedBy] : ""],
    [11, helperHostPronounFormula(rowIndex), values ? inferTemplateValues(values).hostPronoun : ""],
    [12, helperCoupleReferenceFormula(rowIndex), values ? inferTemplateValues(values).coupleReference : ""],
    [13, helperRelationshipFormula(rowIndex), values ? inferTemplateValues(values).relationship : ""],
    [14, helperHouseholdModeFormula(rowIndex), values ? householdModeLabels[inferTemplateValues(values).householdMode] : ""],
    [15, helperAudienceTagsFormula(rowIndex), values ? inferTemplateValues(values).audienceTagsText : ""],
  ] as const;

  helperCells.forEach(([columnIndex, formula, result]) => {
    const cell = row.getCell(columnIndex);
    cell.value = { formula, result };
    styleFormulaCell(cell);
  });
}

function fillEditableCells(row: ExcelJS.Row, values: TemplateRowValues) {
  row.getCell(1).value = values.salutationCluster;
  row.getCell(2).value = values.guestNameCore;
  row.getCell(3).value = values.guestGroup;
  row.getCell(4).value = values.inviteOwner;
}

function applyTemplateRows(worksheet: ExcelJS.Worksheet, options: ReturnType<typeof resolveSpreadsheetOptions>, startRowIndex = 2) {
  const optionColumns = getOptionColumns(options.coupleDisplayName);
  const optionKeys: OptionKey[] = [
    "salutationCluster",
    "guestGroup",
    "inviteOwner",
  ];

  for (let rowIndex = startRowIndex; rowIndex < startRowIndex + maxInviteRows; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    row.height = 48;

    styleInputCell(row.getCell(1), true);
    row.getCell(1).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [optionRange("salutationCluster", 0, optionColumns)],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Chọn từ danh sách",
      error: "Ô này dùng danh sách chọn để tránh nhập sai.",
    };
    styleInputCell(row.getCell(2), false);

    optionKeys.slice(1).forEach((optionKey, optionIndex) => {
      const cell = row.getCell(optionIndex + 3);
      styleInputCell(cell, true);
      cell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [optionRange(optionKey, optionIndex + 1, optionColumns)],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Chọn từ danh sách",
        error: "Ô này dùng danh sách chọn để tránh nhập sai.",
      };
    });

    applyFormulaCells(row, rowIndex, options);
  }
}

function applyInlineGuide(worksheet: ExcelJS.Worksheet) {
  worksheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = "Quy ước nhập tên khách mời";
  titleCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 13 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F6F4E" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 26;

  inlineGuideRows.forEach(([label, detail], index) => {
    const rowIndex = index + 2;
    const row = worksheet.getRow(rowIndex);
    row.height = 34;
    worksheet.mergeCells(rowIndex, 2, rowIndex, columns.length);
    const labelCell = row.getCell(1);
    const detailCell = row.getCell(2);
    labelCell.value = label;
    detailCell.value = detail;
    labelCell.font = { bold: true, color: { argb: "FF3F4B35" } };
    detailCell.font = { color: { argb: "FF2E2A25" } };
    for (let columnIndex = 1; columnIndex <= columns.length; columnIndex += 1) {
      const cell = row.getCell(columnIndex);
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBF2" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE8DDCC" } },
        left: { style: "thin", color: { argb: "FFE8DDCC" } },
        bottom: { style: "thin", color: { argb: "FFE8DDCC" } },
        right: { style: "thin", color: { argb: "FFE8DDCC" } },
      };
    }
  });
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
  worksheet.getCell("B2").value = "Chỉ điền 4 cột đầu ở sheet Danh sách khách mời.";
  worksheet.getCell("A3").value = "Bước 2";
  worksheet.getCell("B3").value = "Cụm danh xưng, Nhóm khách và Người mời là chọn bằng dropdown. Tên khách là cột duy nhất gõ tay.";
  worksheet.getCell("A4").value = "Bước 3";
  worksheet.getCell("B4").value = "Nhìn 3 cột preview để kiểm tra dòng phong bì, lời mời trong thiệp và trạng thái sẵn sàng upload.";
  worksheet.getCell("A5").value = "Bước 4";
  worksheet.getCell("B5").value = "Upload lại file này vào /admin, rồi bấm Xuất Excel link riêng.";
  worksheet.getCell("A7").value = "Lưu ý";
  worksheet.getCell("B7").value = "Không sửa 3 cột preview và các cột ẩn phía sau. Nếu lời mời chưa hiện, bấm Enter ở ô Tên khách hoặc mở bằng Microsoft Excel/Google Sheets để file tự tính lại.";
  worksheet.getCell("A8").value = "Mẹo điền";
  worksheet.getCell("B8").value = "Ví dụ chọn Cụm danh xưng = Vợ chồng bác, Tên khách = Tiến thì hệ thống tự tạo Vợ chồng bác Tiến.";
  worksheet.getCell("A10").value = "4 cột phải điền";
  worksheet.getCell("B10").value = "Cách ghi chuẩn";
  worksheet.getCell("A11").value = "Một người";
  worksheet.getCell("B11").value = "Cụm danh xưng = Anh/Chị/Em/Bác/Chú..., Tên khách = phần tên riêng.";
  worksheet.getCell("A12").value = "Hai vợ chồng";
  worksheet.getCell("B12").value = "Cụm danh xưng = Vợ chồng bác/Anh chị/Vợ chồng em..., Tên khách = phần tên riêng.";
  worksheet.getCell("A13").value = "Gia đình";
  worksheet.getCell("B13").value = "Cụm danh xưng = Gia đình dì/Gia đình anh chị/Gia đình bạn..., Tên khách = phần tên riêng.";
  worksheet.getCell("A14").value = "Ba mẹ mời ông bà";
  worksheet.getCell("B14").value = "Chọn Cụm danh xưng = Bố mẹ hoặc Ông bà, Người mời là = Ba mẹ, có thể để trống Tên khách.";

  const explanations = [
    ["Cụm danh xưng", "Chọn cách gọi khách: Anh, Vợ chồng bác, Gia đình dì, Gia đình anh chị, Cô chú..."],
    ["Tên khách", "Chỉ gõ phần tên riêng. Có thể để trống với các cụm như Bố mẹ, Ba mẹ, Ông bà."],
    ["Nhóm khách", "Nhóm đã được gom theo tiền tố [Nhà Trai], [Nhà Gái], [Nhật], [Phương] để dễ dò và dễ lọc chia bàn."],
    ["Người mời là", "Chọn Ba mẹ, Nhật, Phương hoặc Nhật & Phương để hệ thống tự chọn giọng văn."],
    ["Dòng ngoài phong bì", "Cột preview, không cần sửa tay."],
    ["Lời mời trong thiệp", "Cột preview, đây là lời mời sẽ lưu cho link riêng của khách."],
    ["Kiểm tra dòng nhập", "Cột preview báo dòng đã đủ thông tin để upload hay chưa."],
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

  const termHeaders = ["Cụm danh xưng", "Quan hệ với người mời", "Quan hệ với cô dâu chú rể", "Mời đi cùng", "Cần tên khách", "Xưng hô khi Nhật/Phương mời", "Xưng hô khi Ba mẹ mời", "Ba mẹ gọi cô dâu chú rể là", "Cụm in trên thiệp"];
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
    worksheet.getCell(targetRow, termLookupStartColumn + 5).value = item.coupleHostPronoun;
    worksheet.getCell(targetRow, termLookupStartColumn + 6).value = item.parentsHostPronoun;
    worksheet.getCell(targetRow, termLookupStartColumn + 7).value = item.parentsCoupleReference ?? resolveParentsCoupleReference(item.hostRelationship);
    worksheet.getCell(targetRow, termLookupStartColumn + 8).value = item.displayPrefix ?? item.label;
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

  const ownerHeaders = ["Người mời là", "Người đứng mời"];
  ownerHeaders.forEach((header, index) => {
    worksheet.getCell(1, ownerLookupStartColumn + index).value = header;
    worksheet.getColumn(ownerLookupStartColumn + index).width = 26;
  });
  inviteOwnerDefinitions.forEach((item, rowIndex) => {
    const targetRow = rowIndex + 2;
    worksheet.getCell(targetRow, ownerLookupStartColumn).value = item.label;
    worksheet.getCell(targetRow, ownerLookupStartColumn + 1).value = invitedByLabels[item.invitedBy];
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
      findKeyByHeader(rowHeaders, ["Tên khách mời", "guest_name", "guestName"])
      || findKeyByHeader(rowHeaders, ["Cụm danh xưng", "salutation_cluster", "salutationCluster"])
    ) {
      headerRowIndex = rowIndex;
      rowHeaders.forEach((columnIndex, header) => headers.set(header, columnIndex));
    }
  });

  return { headerRowIndex, headers };
}

function hideHelperColumns(worksheet: ExcelJS.Worksheet) {
  for (let columnIndex = 8; columnIndex <= 15; columnIndex += 1) {
    worksheet.getColumn(columnIndex).hidden = true;
  }
}

function buildExampleSheet(workbook: ExcelJS.Workbook, options: ReturnType<typeof resolveSpreadsheetOptions>) {
  const worksheet = workbook.addWorksheet(exampleSheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  applyWorksheetColumns(worksheet);
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 7 },
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
    styleInputCell(row.getCell(3), true);
    styleInputCell(row.getCell(4), true);
    applyFormulaCells(row, rowIndex, options, values);
  });

  worksheet.getColumn(5).font = { color: { argb: "FF5F6F4E" } };
  worksheet.getColumn(6).font = { color: { argb: "FF2E2A25" } };
  worksheet.getColumn(7).font = { color: { argb: "FF6B7A5A" } };
}

export async function buildInviteTemplateWorkbook(spreadsheetOptions: SpreadsheetOptions = {}) {
  const options = resolveSpreadsheetOptions(spreadsheetOptions);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "wedding-invitation-demo";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const worksheet = workbook.addWorksheet(inviteSheetName, {
    views: [{ state: "frozen", ySplit: inlineGuideRowCount + 1 }],
  });
  applyWorksheetColumns(worksheet);
  worksheet.autoFilter = {
    from: { row: inlineGuideRowCount + 1, column: 1 },
    to: { row: inlineGuideRowCount + 1, column: 7 },
  };

  applyInlineGuide(worksheet);
  const headerRowIndex = inlineGuideRowCount + 1;
  applyHeaderRow(worksheet, headerRowIndex);
  hideHelperColumns(worksheet);
  const firstDataRow = headerRowIndex + 1;
  buildGuideSheet(workbook, options);
  buildExampleSheet(workbook, options);
  applyTemplateRows(worksheet, options, firstDataRow);

  worksheet.getColumn(5).font = { color: { argb: "FF5F6F4E" } };
  worksheet.getColumn(6).font = { color: { argb: "FF2E2A25" } };
  worksheet.getColumn(7).font = { color: { argb: "FF6B7A5A" } };

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
  };

  const isSimplifiedWorkbook = Boolean(indexes.salutationCluster && indexes.guestNameCore && indexes.guestGroup && indexes.inviteOwner);
  if (!indexes.guestName && !isSimplifiedWorkbook) {
    return { invitees: [], errors: ["File Excel thiếu cột Tên khách mời hoặc bộ 4 cột rút gọn."] };
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
        inviteOwner: read(indexes.inviteOwner),
      };
      if (!simplifiedValues.salutationCluster && !simplifiedValues.guestNameCore && !simplifiedValues.guestGroup && !simplifiedValues.inviteOwner) return;

      const inferred = inferTemplateValues(simplifiedValues);
      if (!simplifiedValues.salutationCluster || !simplifiedValues.guestGroup || !simplifiedValues.inviteOwner) {
        errors.push(`Dòng ${rowIndex}: thiếu lựa chọn dropdown.`);
      }
      if (inferred.needsName && !clean(simplifiedValues.guestNameCore)) {
        errors.push(`Dòng ${rowIndex}: thiếu tên khách.`);
      }

      const preview = rowPreview(simplifiedValues, options);
      const tokenPool = new Set([...existingTokens, ...usedTokens]);
      const invitee = createInvitee({
        inviteUnit: deriveInviteUnit(inferred.householdMode),
        displayLabel: inferred.guestName,
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
      }, tokenPool);

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

    const rowValues: LegacyRowValues = {
      guestName,
      hostRelationship,
      invitedBy,
      hostPronoun,
      coupleReference,
      relationship,
      householdMode,
      guestGroup,
      audienceTagsText,
    };
    const preview = previewFromLegacyValues(rowValues, options, { missingDropdown: missingDropdowns || audienceTags.length === 0 });
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
