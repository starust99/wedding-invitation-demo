export const weddingConfig = {
  themeName: "Rose Quartz Serenity Garden",
  couple: {
    bride: "Cô Dâu",
    groom: "Chú Rể",
    displayName: "Cô Dâu & Chú Rể",
    date: "2026-12-26",
    tagline: "A warm garden celebration in Da Lat",
  },
  invitation: {
    title: "Trân trọng kính mời",
    message:
      "Chúng mình rất vui được mời bạn đến chung vui trong buổi tiệc cưới thân mật giữa không khí Đà Lạt, tại Terracotta Hotel & Resort Dalat.",
    closing: "Sự hiện diện của bạn là niềm vui rất lớn với chúng mình.",
  },
  venue: {
    name: "Terracotta Hotel & Resort Dalat",
    area: "Sảnh Quảng trường",
    location: "Hồ Tuyền Lâm, Đà Lạt, Việt Nam",
    address: "Terracotta Hotel & Resort Dalat, khu vực Hồ Tuyền Lâm, Đà Lạt",
    mapUrl: "https://maps.google.com/?q=Terracotta+Hotel+%26+Resort+Dalat",
    note: "Một buổi tối ngoài trời trong khu resort, gần Hồ Tuyền Lâm, với không khí se lạnh và thân mật của Đà Lạt.",
  },
  event: {
    dateLabel: "Thứ Bảy, 26.12.2026",
    welcomeTime: "16:30",
    ceremonyTime: "17:45",
    dinnerTime: "18:40",
    afterPartyTime: "20:15",
  },
  timeline: [
    { time: "16:30", title: "Đón khách", description: "Check-in, chụp ảnh và welcome drink." },
    { time: "17:45", title: "Ceremony ngoài trời", description: "Khoảnh khắc chính của buổi lễ trong khu vườn Đà Lạt." },
    { time: "18:40", title: "Dinner reception", description: "Dùng tiệc tối trong không khí ấm áp và thân mật." },
    { time: "20:15", title: "After party", description: "Âm nhạc, đồ uống và những câu chuyện vui." },
  ],
  dressCode: {
    title: "Elegant Garden",
    note: "Bạn có thể chọn trang phục thanh lịch, thoải mái, phù hợp với không gian ngoài trời và tiết trời buổi tối Đà Lạt.",
    colors: ["#F2C6CF", "#8FAADC", "#F9F7F7", "#E9DDE5", "#7B8291"],
  },
  weatherNote: {
    title: "Một chút lưu ý về thời tiết Đà Lạt",
    description:
      "Buổi tiệc được tổ chức ngoài trời. Buổi tối ở Đà Lạt có thể se lạnh hoặc có sương, bạn nên mang theo áo khoác nhẹ để thoải mái hơn.",
  },
  accommodation: {
    enabled: true,
    title: "Hỗ trợ lưu trú tại resort",
    description:
      "Vì tiệc cưới diễn ra tại Đà Lạt, chúng mình cần biết bạn có cần hỗ trợ đặt phòng tại resort không để ước lượng số lượng phòng phù hợp.",
    rsvpDeadline: "26.11.2026",
  },
  gallery: ["/gallery-1.svg", "/gallery-2.svg", "/gallery-3.svg", "/gallery-4.svg"],
  hero: {
    coverImage: "/hero.svg",
    mobileCoverImage: "/hero.svg",
  },
  theme: {
    colors: {
      background: "#FDFBF7",
      card: "#FFFFFF",
      primary: "#8FAADC",
      accent: "#F2C6CF",
      text: "#2F3A35",
      muted: "#7B8291",
      border: "#E9DDE5",
    },
    fonts: {
      heading: "Cormorant Garamond",
      body: "Inter",
    },
    animationEnabled: true,
  },
  rsvp: {
    deadline: "26.11.2026",
    askAccommodation: true,
    askDietary: true,
    askTransport: true,
  },
} as const;
