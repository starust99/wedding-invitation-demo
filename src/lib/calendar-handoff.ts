export const CALENDAR_HANDOFF_HELP_DELAY_MS = 2_800;

export type CalendarHostApp =
  | "zalo"
  | "messenger"
  | "facebook"
  | "instagram"
  | "telegram"
  | "whatsapp"
  | "viber"
  | "kakaotalk"
  | "line"
  | "wechat"
  | "tiktok"
  | "unknown";

export type CalendarHandoffGuidance = {
  hostApp: CalendarHostApp;
  kind: "external-browser" | "downloaded-file";
  message: string;
};

type CalendarClientEnvironment = {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
};

function detectHostApp(userAgent: string): CalendarHostApp {
  if (/\bZalo(?:\/|\b)/i.test(userAgent)) return "zalo";
  if (/MessengerForiOS|FBAN\/Messenger|FB_IAB\/Messenger/i.test(userAgent)) return "messenger";
  if (/Instagram/i.test(userAgent)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(userAgent)) return "facebook";
  if (/Telegram/i.test(userAgent)) return "telegram";
  if (/WhatsApp/i.test(userAgent)) return "whatsapp";
  if (/Viber/i.test(userAgent)) return "viber";
  if (/KAKAOTALK/i.test(userAgent)) return "kakaotalk";
  if (/\bLine\//i.test(userAgent)) return "line";
  if (/MicroMessenger/i.test(userAgent)) return "wechat";
  if (/TikTok|musical_ly/i.test(userAgent)) return "tiktok";
  return "unknown";
}

function isIosDevice({ userAgent, platform = "", maxTouchPoints = 0 }: CalendarClientEnvironment) {
  return /iPhone|iPad|iPod/i.test(userAgent)
    || (/Macintosh|MacIntel/i.test(`${userAgent} ${platform}`) && maxTouchPoints > 1);
}

function isGenericInAppBrowser(userAgent: string, ios: boolean) {
  if (ios) {
    const isExternalIosBrowser = /Version\/\d+(?:\.\d+)*.*Safari|CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
    return /AppleWebKit/i.test(userAgent) && !isExternalIosBrowser;
  }

  return /;\s*wv\)|\bwv\b|Version\/4\.0.*Chrome/i.test(userAgent);
}

function appSpecificMessage(hostApp: CalendarHostApp, ios: boolean) {
  const browser = ios ? "Safari" : "Chrome";

  switch (hostApp) {
    case "zalo":
      return `Trên Zalo: bấm ••• ở góc trên phải → Mở bằng ${browser}.`;
    case "messenger":
      return `Trên Messenger: bấm ••• ở góc trên phải → Mở bằng ${browser}.`;
    case "facebook":
      return `Trên Facebook: bấm ••• ở góc trên phải → Mở bằng trình duyệt ngoài.`;
    case "instagram":
      return `Trên Instagram: bấm ••• → Mở bằng ${browser}.`;
    case "telegram":
      return `Trên Telegram: bấm ••• → Mở bằng ${browser}.`;
    case "whatsapp":
      return `Trên WhatsApp: quay lại đoạn chat, chạm giữ liên kết → Mở bằng ${browser}.`;
    case "viber":
      return `Trên Viber: bấm ••• hoặc biểu tượng chia sẻ → Mở bằng ${browser}.`;
    case "kakaotalk":
      return ios
        ? "Trên KakaoTalk: mở menu trình duyệt → Mở bằng Safari."
        : "Trên KakaoTalk: mở menu → 다른 브라우저로 열기 (Mở bằng trình duyệt khác).";
    case "line":
      return `Trên LINE: bấm ••• → Mở bằng ${browser}.`;
    case "wechat":
      return `Trên WeChat: bấm ••• → Mở bằng ${browser}.`;
    case "tiktok":
      return `Trên TikTok: bấm ••• → Mở bằng ${browser}.`;
    default:
      return `Bấm ••• hoặc biểu tượng chia sẻ → Mở bằng ${browser}.`;
  }
}

function downloadedFileMessage(environment: CalendarClientEnvironment, ios: boolean) {
  const client = `${environment.userAgent} ${environment.platform ?? ""}`;

  if (ios) {
    return "Mở mục Tải về, chạm tệp lịch vừa tải rồi chọn Thêm.";
  }

  if (/Windows/i.test(client)) {
    return "Mở tệp lịch vừa tải xuống, sau đó chọn Outlook hoặc ứng dụng Lịch để lưu.";
  }

  if (/Macintosh|MacIntel|Mac OS X/i.test(client)) {
    return "Mở tệp lịch vừa tải xuống để thêm vào ứng dụng Lịch.";
  }

  return "Mở tệp lịch vừa tải xuống rồi chọn Thêm vào Lịch.";
}

export function getCalendarHandoffGuidance(environment: CalendarClientEnvironment): CalendarHandoffGuidance | null {
  const hostApp = detectHostApp(environment.userAgent);
  const ios = isIosDevice(environment);
  const android = /Android/i.test(environment.userAgent);
  const isNamedInAppBrowser = hostApp !== "unknown";
  const isInAppBrowser = isNamedInAppBrowser || isGenericInAppBrowser(environment.userAgent, ios);

  if (isInAppBrowser) {
    if (!ios && !android && hostApp === "unknown") {
      return null;
    }

    return {
      hostApp,
      kind: "external-browser",
      message: appSpecificMessage(hostApp, ios),
    };
  }

  if (android) return null;

  return {
    hostApp,
    kind: "downloaded-file",
    message: downloadedFileMessage(environment, ios),
  };
}
