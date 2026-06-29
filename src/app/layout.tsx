import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Be_Vietnam_Pro, Dancing_Script } from "next/font/google";
import "./globals.css";
import { PageTransitionEffect } from "@/components/PageTransitionEffect";
import { InvitationWatercolorBackdrop } from "@/components/InvitationWatercolorBackdrop";
import { BackgroundMusic } from "@/components/wedding/BackgroundMusic";

const cormorantGaramond = Cormorant_Garamond({
  display: "swap",
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-cormorant-garamond",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const beVietnamPro = Be_Vietnam_Pro({
  display: "swap",
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  weight: ["300", "400", "500", "600"],
});

const dancingScript = Dancing_Script({
  display: "swap",
  subsets: ["latin", "vietnamese"],
  variable: "--font-dancing-script",
  weight: ["400", "500", "600", "700"],
});

const fontVariables = [
  cormorantGaramond.variable,
  beVietnamPro.variable,
  dancingScript.variable,
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL("https://nhatphuong.love"),
  title: "Nhật & Phương — Thiệp cưới",
  description: "Quý khách đến chung vui và ghi dấu những khoảnh khắc đáng nhớ cùng Nhật & Phương, 26.12.2026.",
  openGraph: {
    title: "Nhật & Phương — Thiệp cưới",
    description: "Quý khách đến chung vui và ghi dấu những khoảnh khắc đáng nhớ cùng Nhật & Phương, 26.12.2026.",
    url: "https://nhatphuong.love",
    siteName: "Nhật & Phương Wedding",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1672,
        height: 941,
        alt: "Nhật & Phương Wedding Thumbnail",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nhật & Phương — Thiệp cưới",
    description: "Quý khách đến chung vui và ghi dấu những khoảnh khắc đáng nhớ cùng Nhật & Phương, 26.12.2026.",
    images: ["/assets/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" className={fontVariables}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('wedding-splash:home') === '1' && !window.location.search.includes('intro=1')) {
                  document.documentElement.classList.add('splash-skipped');
                }
              } catch (e) {}
            `
          }}
        />
      </head>
      <body>
        <InvitationWatercolorBackdrop />
        <PageTransitionEffect>{children}</PageTransitionEffect>
        <BackgroundMusic />
      </body>
    </html>
  );
}
