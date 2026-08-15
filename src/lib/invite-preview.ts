// Meta caches failed link previews by the exact shared URL for a long time.
// Bump this value whenever the Open Graph card changes so newly copied links
// are crawled as a fresh object by Messenger and Facebook.
export const invitePreviewVersion = "20260816";

export const invitationOgImageUrl =
  `https://nhatphuong.love/assets/og-invitation-v2.jpg?v=${invitePreviewVersion}`;
