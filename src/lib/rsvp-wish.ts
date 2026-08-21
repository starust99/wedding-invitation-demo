import { z } from "zod";

export const RSVP_WISH_MAX_LENGTH = 500;

export const rsvpWishSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Quý khách vui lòng viết đôi lời trước khi gửi.")
    .max(RSVP_WISH_MAX_LENGTH, `Lời chúc tối đa ${RSVP_WISH_MAX_LENGTH} ký tự.`),
});
