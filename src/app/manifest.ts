import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nhật & Phương — Thiệp cưới",
    short_name: "Nhật & Phương",
    description: "Thiệp cưới của Nhật & Phương, 26.12.2026.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8fb",
    theme_color: "#f2c6cf",
    icons: [
      {
        src: "/assets/brand/heart-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/brand/heart-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/brand/heart-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
