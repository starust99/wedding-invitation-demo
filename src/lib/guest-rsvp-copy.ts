import { capitalizeFirst, lowercaseFirst, resolveSalutationCluster } from "./guest-naming";

type AttendanceValue = boolean | "yes" | "no" | "maybe" | null | undefined;

function isYes(value: AttendanceValue) {
  return value === true || value === "yes";
}

function isNo(value: AttendanceValue) {
  return value === false || value === "no";
}

function withClosingThanks(message: string) {
  return `${message}\n\nChân thành cảm ơn!`;
}

export function buildThankYouMessage(input: {
  attending: AttendanceValue;
  attendingCeremony: AttendanceValue;
  attendingBanquet: AttendanceValue;
  salutationCluster?: string;
  fullGuestName?: string;
}) {
  const recipient = lowercaseFirst(resolveSalutationCluster(input.salutationCluster, input.fullGuestName ?? ""));

  if (isNo(input.attending)) {
    return `Xin chân thành cảm ơn! Rất hy vọng sẽ có dịp được đón tiếp ${recipient} vào một dịp khác.`;
  }
  if (!isNo(input.attending) && isNo(input.attendingBanquet)) {
    return `Xin chân thành cảm ơn! Hẹn gặp ${recipient} tại Thánh lễ Hôn phối.`;
  }
  if (isYes(input.attendingCeremony) && isYes(input.attendingBanquet)) {
    return `Xin chân thành cảm ơn! Hẹn gặp ${recipient} tại Thánh lễ Hôn phối và Tiệc cưới.`;
  }
  if (isNo(input.attendingCeremony) && isYes(input.attendingBanquet)) {
    return `Xin chân thành cảm ơn! Hẹn gặp ${recipient} vào buổi Tiệc cưới thân mật tại Đà Lạt.`;
  }
  return `Xin chân thành cảm ơn! Hẹn gặp ${recipient} tại ngày vui sắp tới.`;
}

export function buildRsvpSubmissionCopy(input: {
  attending: AttendanceValue;
  attendingCeremony: AttendanceValue;
  attendingBanquet: AttendanceValue;
  salutationCluster?: string;
  fullGuestName?: string;
  coupleDisplayName?: string;
  fallbackClosingLine: string;
}) {
  const cluster = resolveSalutationCluster(input.salutationCluster, input.fullGuestName ?? "");
  const recipient = capitalizeFirst(cluster);
  const recipientLower = lowercaseFirst(cluster);
  const coupleDisplayName = input.coupleDisplayName?.trim() || "Nhật & Phương";

  if (isNo(input.attending)) {
    return {
      title: "Đã xác nhận",
      body: withClosingThanks(`Cảm ơn ${recipient} đã phản hồi.\n\nDù rất tiếc không thể chung vui trực tiếp, nhưng những tình cảm ấm áp và lời chúc gửi trao vẫn luôn được trân trọng vô cùng. Hẹn gặp lại ${recipient} vào một dịp sớm nhất!`),
      showCalendar: false,
    };
  }
  if (isYes(input.attendingCeremony) && isYes(input.attendingBanquet)) {
    return {
      title: "Đã xác nhận",
      body: withClosingThanks(`Thật hạnh phúc khi biết ${recipientLower} sẽ có mặt ở cả Thánh lễ Hôn phối lẫn Tiệc cưới để chung vui cùng ${coupleDisplayName}.\n\nSự hiện diện của ${recipientLower} chính là món quà ý nghĩa nhất.`),
      showCalendar: true,
    };
  }
  if (isYes(input.attendingCeremony) && isNo(input.attendingBanquet)) {
    return {
      title: "Đã xác nhận",
      body: withClosingThanks(`Cảm ơn ${recipient} đã sắp xếp thời gian đến chứng kiến và hiệp thông trong Thánh lễ Hôn phối của ${coupleDisplayName}.\n\nDù rất tiếc không thể đồng hành trong buổi Tiệc cưới, sự hiện diện và lời cầu nguyện của ${recipientLower} tại Thánh đường đã là món quà vô cùng trân quý.`),
      showCalendar: true,
    };
  }
  if (isNo(input.attendingCeremony) && isYes(input.attendingBanquet)) {
    return {
      title: "Đã xác nhận",
      body: withClosingThanks(`Cảm ơn ${recipient} đã sắp xếp thời gian đến chung vui tại Tiệc cưới của ${coupleDisplayName}.\n\nSự đồng hành của ${recipientLower} chắc chắn sẽ giúp ngày vui thêm trọn vẹn và đong đầy ý nghĩa. Hẹn sớm gặp tại Đà Lạt!`),
      showCalendar: true,
    };
  }
  return {
    title: "Đã xác nhận",
    body: withClosingThanks(input.fallbackClosingLine),
    showCalendar: true,
  };
}
