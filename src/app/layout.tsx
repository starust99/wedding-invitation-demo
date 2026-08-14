import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Be_Vietnam_Pro, Dancing_Script } from "next/font/google";
import "./globals.css";
import { PageTransitionEffect } from "@/components/PageTransitionEffect";
import { InvitationWatercolorBackdrop } from "@/components/InvitationWatercolorBackdrop";
import { BackgroundMusic } from "@/components/wedding/BackgroundMusic";

const cormorantGaramond = Cormorant_Garamond({
  display: "swap",
  preload: false,
  subsets: ["latin", "vietnamese"],
  variable: "--font-cormorant-garamond",
  style: ["normal", "italic"],
});

const beVietnamPro = Be_Vietnam_Pro({
  display: "swap",
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "600"],
});

const dancingScript = Dancing_Script({
  display: "swap",
  preload: false,
  subsets: ["latin", "vietnamese"],
  variable: "--font-dancing-script",
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
        url: "https://nhatphuong.love/assets/og-invitation-v2.jpg",
        width: 1672,
        height: 941,
        type: "image/jpeg",
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
    images: ["https://nhatphuong.love/assets/og-invitation-v2.jpg"],
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
    <html lang="vi" data-scroll-behavior="smooth" className={fontVariables} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var href = window.location.href || "";
                var search = window.location.search || "";
                var hash = window.location.hash || "";
                var path = window.location.pathname || "";

                var isExplicitSkip = search.indexOf("view=main") !== -1 || search.indexOf("from=rsvp") !== -1 || search.indexOf("skip_intro=1") !== -1 || hash.indexOf("rsvp") !== -1 || hash.indexOf("thank-you") !== -1;
                var isExplicitForce = search.indexOf("intro=1") !== -1 || href.indexOf("intro=1") !== -1;

                var isGuestPath = path.indexOf("/i/") === 0;
                var token = isGuestPath ? path.replace("/i/", "").split("?")[0] : "public";
                var sessionSeen = false;
                try { sessionSeen = sessionStorage.getItem("wedding-splash-seen:" + token) === "1"; } catch (e) {}

                var isForce = !isExplicitSkip && (isExplicitForce || (isGuestPath && !sessionSeen));
                if (isForce) {
                  document.documentElement.classList.remove('splash-skipped');
                } else {
                  var hasSeen = false;
                  for (var i = 0; i < localStorage.length; i++) {
                    var k = localStorage.key(i);
                    if (k && k.indexOf('wedding-splash:') === 0 && localStorage.getItem(k) === '1') {
                      hasSeen = true;
                      break;
                    }
                  }
                  if (hasSeen) {
                    document.documentElement.classList.add('splash-skipped');
                  }
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
