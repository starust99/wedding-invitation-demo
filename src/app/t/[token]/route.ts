import { invitationOgImageUrl } from "@/lib/invite-preview";

export const dynamic = "force-dynamic";

const title = "Nhật & Phương — Thiệp cưới";
const description = "Trân trọng kính mời Quý khách đến chung vui trong ngày trọng đại của Nhật & Phương.";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const encodedToken = encodeURIComponent(token);
  const publicUrl = `https://nhatphuong.love/t/${encodedToken}`;
  const invitationPath = `/i/${encodedToken}`;

  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${publicUrl}">
  <meta property="og:site_name" content="Nhật &amp; Phương">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:image" content="${invitationOgImageUrl}">
  <meta property="og:image:url" content="${invitationOgImageUrl}">
  <meta property="og:image:secure_url" content="${invitationOgImageUrl}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1672">
  <meta property="og:image:height" content="941">
  <meta property="og:image:alt" content="Nhật &amp; Phương Wedding Thumbnail">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${invitationOgImageUrl}">
  <link rel="canonical" href="${publicUrl}">
</head>
<body>
  <p>Đang mở thiệp cưới Nhật &amp; Phương…</p>
  <noscript><a href="${invitationPath}">Mở thiệp cưới</a></noscript>
  <script>window.location.replace(${JSON.stringify(invitationPath)})</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Language": "vi",
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
