import { NextResponse } from "next/server";
import { aiTweakOptions, type AiPatchOperation, type AiTweakKey, type AiTweakSuggestion } from "@/lib/ai-tweak-schema";
import type { WeddingConfig } from "@/lib/site-settings";

type RequestBody = {
  tweak: AiTweakKey;
  content: WeddingConfig;
};

function optionLabel(key: AiTweakKey) {
  return aiTweakOptions.find((option) => option.key === key)?.label ?? key;
}

function patchFor(key: AiTweakKey, content: WeddingConfig): { summary: string; patch: AiPatchOperation[] } {
  if (key === "more-formal") {
    return {
      summary: "Làm lời mời trang trọng hơn và giảm cảm giác quá casual.",
      patch: [
        { op: "replace", path: "invitation.title", value: "Trân trọng kính mời" },
        { op: "replace", path: "invitation.message", value: `Gia đình trân trọng kính mời quý khách đến chung vui trong lễ cưới thân mật tại ${content.venue.name}.` },
        { op: "replace", path: "invitation.closing", value: "Sự hiện diện của quý khách là niềm vinh hạnh và niềm vui rất lớn với gia đình." },
      ],
    };
  }

  if (key === "less-formal") {
    return {
      summary: "Làm wording gần gũi hơn nhưng vẫn giữ sự chỉn chu.",
      patch: [
        { op: "replace", path: "invitation.title", value: "Mời đến chung vui" },
        { op: "replace", path: "invitation.message", value: "Rất mong được đón khách mời trong buổi tối đặc biệt này ở Đà Lạt, cùng dùng tiệc, trò chuyện và lưu lại vài khoảnh khắc thật đẹp." },
        { op: "replace", path: "invitation.closing", value: "Sự hiện diện của khách mời sẽ làm buổi tối thêm trọn vẹn." },
      ],
    };
  }

  if (key === "more-floral") {
    return {
      summary: "Tăng cảm giác vườn hoa bằng background mềm và palette dress code lãng mạn hơn.",
      patch: [
        { op: "replace", path: "appearance.backgrounds.invitation", value: "softGradient" },
        { op: "replace", path: "appearance.backgrounds.guestNotes", value: "softGradient" },
        { op: "replace", path: "appearance.backgrounds.gallery", value: "accentGradient" },
        { op: "replace", path: "dressCode.colors", value: ["#F2C6CF", "#F7DDE6", "#8FAADC", "#FDFBF7", "#D8C3A5"] },
      ],
    };
  }

  if (key === "less-floral") {
    return {
      summary: "Giảm mật độ hoa, chuyển về giấy cưới và typography sạch hơn.",
      patch: [
        { op: "replace", path: "appearance.backgrounds.invitation", value: "card" },
        { op: "replace", path: "appearance.backgrounds.gallery", value: "plain" },
        { op: "replace", path: "appearance.backgrounds.dressCode", value: "card" },
        { op: "replace", path: "dressCode.colors", value: ["#F8F6F0", "#DDD3C6", "#B6B0A6", "#6D6A63", "#2E2A25"] },
      ],
    };
  }

  if (key === "more-editorial") {
    return {
      summary: "Rút copy và tăng cảm giác như một trang magazine cưới.",
      patch: [
        { op: "replace", path: "sections.hero.eyebrow", value: "Lễ cưới" },
        { op: "replace", path: "sections.invitation.eyebrow", value: "Lời mời" },
        { op: "replace", path: "invitation.message", value: `Một buổi tối thân mật tại ${content.venue.name}, nơi gia đình rất mong được đón tiếp khách mời và cùng lưu lại khoảnh khắc đặc biệt.` },
        { op: "replace", path: "appearance.backgrounds.timeline", value: "card" },
      ],
    };
  }

  if (key === "stronger-rsvp") {
    return {
      summary: "Làm CTA hồi đáp rõ hơn, nhấn hạn chốt và nhu cầu lưu trú.",
      patch: [
        { op: "replace", path: "sections.cta.eyebrow", value: "Xác nhận lời mời" },
        { op: "replace", path: "sections.cta.title", value: "Vui lòng xác nhận tham dự" },
        { op: "replace", path: "sections.cta.description", value: `Xin xác nhận tham dự trước ${content.rsvp.deadline} để gia đình chuẩn bị chỗ ngồi, lưu trú và các hỗ trợ cần thiết ở Đà Lạt thật chu đáo.` },
        { op: "replace", path: "sections.cta.buttonLabel", value: "Xác nhận ngay" },
      ],
    };
  }

  if (key === "softer-animation") {
    return {
      summary: "Giảm motion để trang dịu hơn và ít lặp lại hơn.",
      patch: [
        { op: "replace", path: "appearance.mediaLayers.hero.0.animation", value: "fade" },
        { op: "replace", path: "theme.animationEnabled", value: true },
      ],
    };
  }

  if (key === "richer-venue") {
    return {
      summary: "Làm venue section giàu bối cảnh Đà Lạt và hữu ích hơn cho khách.",
      patch: [
        { op: "replace", path: "sections.venue.description", value: `Không gian ${content.venue.name} gần ${content.venue.location}, đủ riêng tư để buổi tối có cảm giác ấm áp giữa khí trời Đà Lạt.` },
        { op: "replace", path: "sections.itinerary.description", value: "Buổi tối được sắp nhịp nhẹ nhàng để khách mời có thời gian chụp ảnh, dùng tiệc và tận hưởng Đà Lạt." },
        { op: "replace", path: "appearance.backgrounds.venue", value: "accentGradient" },
      ],
    };
  }

  if (key === "improve-mobile-crop") {
    return {
      summary: "Đề xuất crop hero mobile an toàn hơn cho mặt người và text overlay.",
      patch: [
        { op: "replace", path: "appearance.mediaLayers.hero.0.scale.mobile", value: 1.08 },
        { op: "replace", path: "appearance.mediaLayers.hero.0.objectPosition.mobile", value: "center top" },
      ],
    };
  }

  if (key === "vietnamese-english-balance") {
    return {
      summary: "Cân lại tiếng Việt làm chính, nhãn English chỉ giữ vai trò phụ.",
      patch: [
        { op: "replace", path: "sections.hero.eyebrow", value: "Lễ cưới" },
        { op: "replace", path: "sections.itinerary.eyebrow", value: "Lịch trình tiệc cưới" },
        { op: "replace", path: "sections.guestNotes.title", value: "Một vài lưu ý cho buổi tối" },
        { op: "replace", path: "sections.cta.buttonLabel", value: "Xác nhận tham dự" },
      ],
    };
  }

  return {
    summary: "Rút ngắn lời mời, giữ sự ấm áp và dễ đọc trên mobile.",
    patch: [
      { op: "replace", path: "invitation.message", value: `Gia đình rất mong được đón khách mời đến chung vui trong buổi tiệc cưới thân mật tại ${content.venue.name}, giữa không khí Đà Lạt ấm áp và gần gũi.` },
      { op: "replace", path: "sections.guestNotes.description", value: "Một vài ghi chú nhỏ để khách mời chuẩn bị thoải mái cho buổi tối ngoài trời ở Đà Lạt." },
      { op: "replace", path: "sections.cta.description", value: "Xin xác nhận tham dự để gia đình chuẩn bị chỗ ngồi và hỗ trợ lưu trú chu đáo hơn." },
    ],
  };
}

export async function POST(request: Request) {
  const body = await request.json() as RequestBody;
  const option = aiTweakOptions.find((item) => item.key === body.tweak);

  if (!option) {
    return NextResponse.json({ error: "Unsupported tweak" }, { status: 400 });
  }

  const { summary, patch } = patchFor(body.tweak, body.content);
  const suggestion: AiTweakSuggestion = {
    id: crypto.randomUUID(),
    key: body.tweak,
    label: optionLabel(body.tweak),
    summary,
    patch,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ suggestion });
}
