import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "facebookexternalhit",
          "Facebot",
          "meta-externalagent",
          "meta-externalfetcher",
        ],
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    host: "https://nhatphuong.love",
  };
}
