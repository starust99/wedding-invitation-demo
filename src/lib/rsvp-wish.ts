import { z } from "zod";

export const RSVP_WISH_MAX_LENGTH = 500;
const LEGACY_RSVP_WISH_KIND = "post_rsvp_wish_v1";

type StoredRsvpWish = {
  message: string;
  sentAt: string;
};

export const rsvpWishSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Quý khách vui lòng viết đôi lời trước khi gửi.")
    .max(RSVP_WISH_MAX_LENGTH, `Lời chúc tối đa ${RSVP_WISH_MAX_LENGTH} ký tự.`),
});

export function encodeLegacyRsvpWish(wish: StoredRsvpWish) {
  return JSON.stringify({ kind: LEGACY_RSVP_WISH_KIND, ...wish });
}

export function parseLegacyRsvpWish(value: unknown): StoredRsvpWish | undefined {
  if (typeof value !== "string" || !value.startsWith("{")) return undefined;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (parsed.kind !== LEGACY_RSVP_WISH_KIND) return undefined;
    const result = rsvpWishSchema.safeParse({ message: parsed.message });
    if (!result.success || typeof parsed.sentAt !== "string" || !parsed.sentAt.trim()) return undefined;
    return { message: result.data.message, sentAt: parsed.sentAt };
  } catch {
    return undefined;
  }
}

export function preserveLegacyRsvpWishNotes(existingNotes: unknown, nextNotes: string | null) {
  return parseLegacyRsvpWish(existingNotes) ? existingNotes as string : nextNotes;
}

export function isMissingWishColumnError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("wish_message") || message.includes("wish_sent_at");
}
