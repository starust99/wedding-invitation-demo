import { buildInvitationCopy } from './src/lib/guest-personalization';

const scenarios = [
  {
    name: "Quý Khách (Chưa cá nhân hoá)",
    input: {}
  },
  {
    name: "Bạn bè (Peer)",
    input: { name: "Minh", honorific: "bạn", group: "bạn đại học", coupleDisplayName: "Nhật & Phương" }
  },
  {
    name: "Em (Junior)",
    input: { name: "Bảo", honorific: "em", group: "em họ", coupleDisplayName: "Nhật & Phương" }
  },
  {
    name: "Anh chị (Senior)",
    input: { name: "Hải", honorific: "anh", group: "đồng nghiệp", coupleDisplayName: "Nhật & Phương" }
  },
  {
    name: "Cô Chú (Elder)",
    input: { name: "Tư", honorific: "chú", group: "hàng xóm", coupleDisplayName: "Nhật & Phương" }
  },
  {
    name: "Bố mẹ mời khách (Parents host)",
    input: { name: "Thành", honorific: "chú", invitedBy: "ba me", coupleDisplayName: "Nhật & Phương", coupleReference: "hai cháu" }
  },
  {
    name: "Mời gia đình (Family)",
    input: { name: "Hoàng", honorific: "anh", householdMode: "family", coupleDisplayName: "Nhật & Phương" }
  },
  {
    name: "Mời vợ chồng (Couple)",
    input: { name: "Tuấn", honorific: "bạn", householdMode: "couple", coupleDisplayName: "Nhật & Phương" }
  }
];

scenarios.forEach(s => {
  const result = buildInvitationCopy(s.input);
  console.log(`\n=== SCENARIO: ${s.name} ===`);
  console.log(`- Lời mời (Hero):`, result.heroInvitationLine);
  console.log(`- Lời mời (Bên trong):`, result.insideInviteLine);
  console.log(`- Lời cảm ơn:`, result.closingLine);
});
