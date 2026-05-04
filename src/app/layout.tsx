import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dalat Garden Elegant Wedding",
  description: "Thiệp cưới online Đà Lạt với RSVP và lưu trú resort.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
