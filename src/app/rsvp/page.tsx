"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  CircleCheck,
  CircleHelp,
  ChevronDown,
  Gift,
  Mail,
  MapPin,
  Minus,
  Plus,
  CalendarDays,
  Church,
  Images,
  Wine,
  Send,
  X,
} from "lucide-react";
import {
  countLodgingChildren,
  saveRSVPResponse,
  readRSVPResponses,
  removeRSVPResponses,
  saveRSVPWishLocally,
  type LodgingGuest,
  type RSVPResponse,
} from "@/lib/rsvp-storage";
import { buildInvitationCopy, removeStoredGuestIdentityForToken, resolveGuestIdentity, type GuestIdentity, type InvitationCopy } from "@/lib/guest-personalization";
import { buildRsvpSubmissionCopy } from "@/lib/guest-rsvp-copy";
import { weddingConfig } from "@/config/wedding.config";
import {
  CALENDAR_HANDOFF_HELP_DELAY_MS,
  getCalendarHandoffGuidance,
  shouldUseAndroidCalendarIntent,
  type CalendarHandoffGuidance,
} from "@/lib/calendar-handoff";
import {
  buildAndroidCalendarIntent,
  createWeddingCalendarEvents,
  type WeddingCalendarEventId,
} from "@/lib/wedding-calendar";
import { getInviteStatusFromRsvp, readLocalInvitees, upsertLocalInvitees, writeLocalInvitees, type Invitee } from "@/lib/invites";
import { usePageTransition } from "@/components/PageTransitionEffect";
import { CoupleNameText } from "@/components/ui/CoupleNameText";
import { GuestNameText } from "@/components/ui/GuestNameText";
import { keepExactPhraseTogether } from "@/lib/couple-name-display";
import { findAnyStoredInviteToken } from "@/lib/guest-personalization";
import { usePublishedSettings } from "@/lib/use-published-settings";
import {
  isFamilyLodgingGuestGroup,
  isGroomFamilyLodgingGuestGroup,
  isTerracottaLodgingEligible,
} from "@/lib/rsvp-guest-group";
import { doesPostCeremonyPartyApply } from "@/lib/post-ceremony-rsvp";
import { resolveInviteEventAccess } from "@/lib/invite-event-access";
import { RSVP_WISH_MAX_LENGTH } from "@/lib/rsvp-wish";

const rsvpSuccessUtilityVariants: Variants = {
  tucked: {
    opacity: 0,
    y: -56,
  },
  drawn: {
    opacity: 1,
    y: 0,
    transition: {
      y: {
        type: "spring",
        stiffness: 48,
        damping: 10.5,
        mass: 1.05,
        restDelta: 0.08,
        restSpeed: 0.08,
        delay: 0.28,
      },
      opacity: {
        type: "tween",
        duration: 0.64,
        delay: 0.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },
};

function RsvpSuccessUtilityCard({ children, reveal }: { children: ReactNode; reveal: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const revealState = shouldReduceMotion || reveal ? "drawn" : "tucked";

  return (
    <div className="rsvp-success-utility-stage w-full max-w-lg">
      <motion.div
        className="rsvp-success-utility-shell w-full"
        initial={shouldReduceMotion ? "drawn" : "tucked"}
        animate={revealState}
        variants={rsvpSuccessUtilityVariants}
      >
        <div className="rsvp-paper-card rsvp-success-utility-card w-full rounded-[2rem] p-5 text-center sm:p-7">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

const POST_CEREMONY_VENUE_NAME = "Francis Hội Restaurant";
const POST_CEREMONY_VENUE_ADDRESS = "187 Gia Long, Lái Thiêu, Hồ Chí Minh";
const POST_CEREMONY_VENUE_URL = "https://www.google.com/search?sca_esv=182ba94e7364ae48&sxsrf=APpeQnuqQ9XR3wfP5EbW_Ldw7WOEp7vffw:1787323966328&q=francis+h%E1%BB%99i+restaurant+%C4%91%E1%BB%8Ba+ch%E1%BB%89&ludocid=740771515627976404&sa=X&ved=2ahUKEwjHyfHQ_LGWAxWUjOEIHRvSGmAQ6BN6BAg1EAI&biw=1280&bih=615&dpr=2";

function PostCeremonyVenue({ compact = false }: { compact?: boolean }) {
  return (
    <div
      data-rsvp-post-ceremony-venue="true"
      className={compact ? "mt-2 text-center sm:text-left" : "mx-auto mt-5 max-w-lg text-center"}
    >
      <p
        className={[
          "whitespace-nowrap text-sm leading-relaxed",
          compact ? "font-normal text-[#252934]/72" : "font-semibold text-[#252934] sm:text-base",
        ].join(" ")}
      >
        {POST_CEREMONY_VENUE_NAME}
      </p>
      <a
        href={POST_CEREMONY_VENUE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={`Mở địa chỉ ${POST_CEREMONY_VENUE_NAME} trên Google`}
        className={`mt-1 inline-flex items-start justify-center gap-1.5 text-xs font-normal leading-relaxed text-[#5f655f] underline decoration-[#8faadc]/55 underline-offset-4 transition-colors hover:text-[#252934] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serenity ${compact ? "sm:justify-start" : ""}`}
      >
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="text-balance">{POST_CEREMONY_VENUE_ADDRESS}</span>
      </a>
    </div>
  );
}

const lodgingGuestSchema = z.object({
  fullName: z.string().trim().optional(),
  isChild: z.boolean().default(false),
  age: z.number().int().min(0, "Tuổi không hợp lệ.").optional(),
});

const rsvpFormFieldsSchema = z.object({
  honorific: z.string().optional(),
  name: z.string().trim().optional().default(""),
  attendingCeremony: z.enum(["yes", "no"]).nullable().default(null),
  postCeremonyPartyInvited: z.boolean().default(false),
  terracottaLodgingEligible: z.boolean().default(false),
  attendingPostCeremonyParty: z.enum(["yes", "no"]).nullable().default(null),
  attendingBanquet: z.enum(["yes", "no"]).nullable().default(null),
  attending: z.enum(["yes", "no"]),
  guestCount: z.coerce.number().min(0),
  guestGroup: z.string().trim().optional().default(""),
  stayDecision: z.enum(["25", "26", "both", "none"]).nullable().default(null),
  accommodationNeeded: z.boolean().default(false),
  lodgingGuests: z.array(lodgingGuestSchema).default([]),
});

function validateRsvpForm(
  data: z.output<typeof rsvpFormFieldsSchema>,
  ctx: z.RefinementCtx,
  { requirePostCeremonyParty }: { requirePostCeremonyParty: boolean },
) {
  const eventAccess = resolveInviteEventAccess({
    guestGroup: data.guestGroup,
    postCeremonyPartyInvited: data.postCeremonyPartyInvited,
  });
  if (eventAccess.canViewCeremony && !data.attendingCeremony) {
    ctx.addIssue({ code: "custom", path: ["attendingCeremony"], message: "Vui lòng chọn phản hồi cho Thánh lễ Hôn phối." });
  }
  if (!data.attendingBanquet) {
    ctx.addIssue({ code: "custom", path: ["attendingBanquet"], message: "Vui lòng chọn phản hồi cho Tiệc cưới." });
  }
  const postCeremonyPartyApplies = doesPostCeremonyPartyApply({
    invited: data.postCeremonyPartyInvited,
    attendingCeremony: data.attendingCeremony === "yes",
    attendingBanquet: data.attendingBanquet === "yes",
    allowFallback: eventAccess.canUsePostCeremonyFallback,
  });
  if (requirePostCeremonyParty && postCeremonyPartyApplies && !data.attendingPostCeremonyParty) {
    ctx.addIssue({ code: "custom", path: ["attendingPostCeremonyParty"], message: "Vui lòng chọn phản hồi cho Tiệc thân mật." });
  }
  if (isTerracottaLodgingEligible(data.guestGroup, data.terracottaLodgingEligible) && data.attendingBanquet === "yes" && data.stayDecision === null) {
    ctx.addIssue({ code: "custom", path: ["stayDecision"], message: "Vui lòng chọn phương án lưu trú." });
  }
  if (
    isGroomFamilyLodgingGuestGroup(data.guestGroup)
    && data.attendingBanquet === "yes"
    && data.stayDecision !== null
    && data.stayDecision !== "26"
    && data.stayDecision !== "none"
  ) {
    ctx.addIssue({ code: "custom", path: ["stayDecision"], message: "Vui lòng chọn lại phương án lưu trú." });
  }

  if (data.attending !== "no" && data.guestCount < 1) {
    ctx.addIssue({ code: "custom", path: ["guestCount"], message: "Nếu tham dự, số người cần từ 1 trở lên." });
  }

  if (
    isTerracottaLodgingEligible(data.guestGroup, data.terracottaLodgingEligible)
    && data.attending === "yes"
    && data.attendingBanquet === "yes"
    && data.stayDecision !== null
    && data.stayDecision !== "none"
  ) {
    if (data.lodgingGuests.length < 1) {
      ctx.addIssue({ code: "custom", path: ["lodgingGuests"], message: "Vui lòng thêm ít nhất một người lưu trú." });
    }
    data.lodgingGuests.forEach((guest, index) => {
      if (!guest.fullName || guest.fullName.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["lodgingGuests", index, "fullName"], message: "Nhập họ tên người lưu trú." });
      }
      if (guest.isChild && (typeof guest.age !== "number" || isNaN(guest.age))) {
        ctx.addIssue({ code: "custom", path: ["lodgingGuests", index, "age"], message: "Nhập tuổi của bé" });
      }
    });
  }
}

const initialRsvpStepSchema = rsvpFormFieldsSchema
  .superRefine((data, ctx) => validateRsvpForm(data, ctx, { requirePostCeremonyParty: false }));

const rsvpSchema = rsvpFormFieldsSchema
  .superRefine((data, ctx) => validateRsvpForm(data, ctx, { requirePostCeremonyParty: true }));

type RSVPFormInput = z.input<typeof rsvpSchema>;
type RSVPFormOutput = z.output<typeof rsvpSchema>;
type RSVPDraftValues = z.output<typeof rsvpFormFieldsSchema>;
type LodgingGuestForm = {
  fullName: string;
  isChild: boolean;
  age?: number;
};
type StayDecision = "25" | "26" | "both" | "none" | null;

function parseRsvpDeadline(value: string) {
  const match = value.trim().match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    return null;
  }

  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+07:00`);
}
const RSVP_INVITE_FETCH_TIMEOUT_MS = 10_000;
const RSVP_DRAFT_STORAGE_PREFIX = "wedding-rsvp-draft:";

const rsvpDraftSchema = z.object({
  savedAt: z.number(),
  values: rsvpFormFieldsSchema,
});

const inputClass =
  "min-h-13 w-full rounded-2xl border border-serenity/22 bg-white/75 px-4 text-base font-normal text-center leading-relaxed text-[#252934] outline-none transition placeholder:font-normal placeholder:leading-relaxed placeholder:text-[#252934]/36 focus:border-serenity focus:bg-white/86 focus:ring-4 focus:ring-serenity/18";
const rsvpAlertTextClass =
  "text-sm font-normal leading-relaxed text-[#B4232F] focus:outline-none";

function createLodgingGuest(fullName = ""): LodgingGuestForm {
  return {
    fullName,
    isChild: false,
    age: undefined,
  };
}

function rsvpDraftStorageKey(token: string) {
  return `${RSVP_DRAFT_STORAGE_PREFIX}${token}`;
}

function readRsvpDraft(token: string): RSVPDraftValues | null {
  if (!token || typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(rsvpDraftStorageKey(token));
    if (!raw) return null;
    const parsed = rsvpDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      sessionStorage.removeItem(rsvpDraftStorageKey(token));
      return null;
    }
    return parsed.data.values;
  } catch {
    return null;
  }
}

function writeRsvpDraft(token: string, values: RSVPFormInput) {
  if (!token || typeof window === "undefined") return;

  try {
    const parsed = rsvpFormFieldsSchema.safeParse(values);
    if (!parsed.success) return;
    sessionStorage.setItem(
      rsvpDraftStorageKey(token),
      JSON.stringify({ savedAt: Date.now(), values: parsed.data }),
    );
  } catch {
    // A blocked or full sessionStorage must never interrupt RSVP.
  }
}

function clearRsvpDraft(token?: string) {
  if (!token || typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(rsvpDraftStorageKey(token));
  } catch {
    // Ignore browsers that block sessionStorage.
  }
}

async function fetchWithTimeout(input: string, timeoutMs: number) {
  const controller = typeof AbortController === "undefined" ? undefined : new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller?.abort();
      reject(new Error("invite-fetch-timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      fetch(input, controller ? { signal: controller.signal } : undefined),
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function normalizeLodgingGuests(guests: Array<Partial<LodgingGuestForm> | undefined> | undefined): LodgingGuest[] {
  return (guests ?? []).flatMap((guest) => {
    if (!guest) return [];
    const fullName = guest.fullName?.trim() ?? "";
    if (!fullName) return [];
    const age = typeof guest.age === "number" && Number.isFinite(guest.age) ? guest.age : undefined;

    return [{
      fullName,
      isChild: Boolean(guest.isChild),
      age: guest.isChild ? age : undefined,
    }];
  });
}

function Field({ label, error, children }: { label: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="grid justify-items-center gap-2 text-center text-sm font-bold text-[#252934]/68 w-full">
      {label}
      {children}
      {error ? (
        <span
          role="alert"
          tabIndex={-1}
          data-rsvp-error="true"
          className={rsvpAlertTextClass}
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}

function ReviewAttendanceStatus({ attending }: { attending: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center gap-1.5 text-center text-sm font-medium",
        attending ? "text-[#66744e]" : "text-[#6e655e]",
      ].join(" ")}
    >
      {!attending ? (
        <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      ) : null}
      {attending ? "Sẽ tham dự" : "Không tham dự"}
    </span>
  );
}

function RsvpHydrationState() {
  return (
    <main
      aria-busy="true"
      className="public-invitation-page rsvp-page cinematic-stage relative flex min-h-screen items-center bg-transparent px-4 py-8 text-center text-[#252934] sm:px-6 sm:py-12"
    >
      <div aria-hidden="true" className="aurora-wash -z-10 opacity-60" />
      <div aria-hidden="true" className="film-grain-soft -z-10" />

      <section
        role="status"
        aria-live="polite"
        className="mx-auto w-full max-w-2xl px-4 sm:px-8"
      >
        <p className="wedding-type-title text-[2rem] text-[#252934] sm:text-[2.5rem]">
          Lời hồi đáp
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#7a6a5d] sm:text-base">
          Đang chuẩn bị thông tin dành riêng cho Quý khách…
        </p>

        <div
          aria-hidden="true"
          className="rsvp-paper-card mt-8 overflow-hidden rounded-[1.6rem] p-5 sm:p-8"
        >
          <div className="grid gap-6 motion-safe:animate-pulse motion-reduce:animate-none">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="flex flex-col items-center gap-4 py-2 sm:flex-row sm:gap-6 sm:py-4"
              >
                <div className="h-14 w-14 shrink-0 rounded-[1.2rem] bg-rose-quartz/24 sm:h-16 sm:w-16" />
                <div className="grid w-full flex-1 justify-items-center gap-2 sm:justify-items-start">
                  <div className="h-4 w-36 rounded-full bg-[#7a6a5d]/10" />
                  <div className="h-3 w-52 max-w-full rounded-full bg-serenity/14" />
                </div>
                <div className="h-11 w-44 max-w-full shrink-0 rounded-full bg-serenity/14" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function buildSubmissionCopy(
  attending: RSVPFormInput["attending"],
  attendingCeremony: RSVPFormInput["attendingCeremony"],
  attendingBanquet: RSVPFormInput["attendingBanquet"],
  inviteCopy: InvitationCopy,
  guestIdentity?: GuestIdentity
) {
  return buildRsvpSubmissionCopy({
    attending,
    attendingCeremony,
    attendingBanquet,
    salutationCluster: guestIdentity?.salutationCluster,
    fullGuestName: guestIdentity?.displayLabel || guestIdentity?.name,
    coupleDisplayName: weddingConfig.couple.displayName,
    fallbackClosingLine: inviteCopy.closingLine,
  });
}

function normalizeAttendanceForForm(value: RSVPResponse["attending"] | undefined): RSVPFormInput["attending"] {
  return value === "no" ? "no" : "yes";
}

function normalizeBoolean(value: boolean | undefined): "yes" | "no" | null {
  if (value === true) return "yes";
  if (value === false) return "no";
  return null;
}

function normalizeGuestCount(value: unknown, minimum: 0 | 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return minimum;
  return Math.min(50, Math.max(minimum, Math.trunc(parsed)));
}

function normalizeStayDecisionForGuestGroup(guestGroup: string, decision: StayDecision): StayDecision {
  if (!isGroomFamilyLodgingGuestGroup(guestGroup)) return decision;
  return decision === "26" || decision === "none" ? decision : null;
}

function resolveHydratedGuestCount({
  guestGroup,
  storedGuestCount,
  expectedGuestCount = 1,
  hasStoredResponse,
  attending,
}: {
  guestGroup: string;
  storedGuestCount: unknown;
  expectedGuestCount?: unknown;
  hasStoredResponse: boolean;
  attending?: RSVPResponse["attending"];
}) {
  if (isFamilyLodgingGuestGroup(guestGroup)) {
    return hasStoredResponse
      ? normalizeGuestCount(storedGuestCount, attending === "no" ? 0 : 1)
      : normalizeGuestCount(expectedGuestCount, 1);
  }

  // Số ước lượng trong danh sách khách không phải là lựa chọn của khách.
  // Với mọi khách ngoài gia đình, một hồi đáp mới luôn bắt đầu từ 1 người.
  if (!hasStoredResponse) return 1;
  return normalizeGuestCount(storedGuestCount, attending === "no" ? 0 : 1);
}

function formatRsvpEventDate(dateLabel: string, time: string, separator = "•") {
  const dateMatch = dateLabel.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  const date = dateMatch ? `${dateMatch[1].padStart(2, "0")}/${dateMatch[2].padStart(2, "0")}/${dateMatch[3]}` : dateLabel;
  const weekday = dateLabel.match(/(Chúa Nhật|Chủ Nhật|Thứ Hai|Thứ Ba|Thứ Tư|Thứ Năm|Thứ Sáu|Thứ Bảy)/i)?.[0];
  return `${time} ${separator} ${weekday ? `${weekday}, ` : ""}${date}`;
}

function formatAlbumAvailableDate(value: string) {
  const isoDate = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoDate) return `${isoDate[3].padStart(2, "0")}/${isoDate[2].padStart(2, "0")}/${isoDate[1]}`;

  const vietnameseDate = value.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  if (vietnameseDate) {
    return `${vietnameseDate[1].padStart(2, "0")}/${vietnameseDate[2].padStart(2, "0")}/${vietnameseDate[3]}`;
  }

  return value;
}

export default function RSVPPage() {
  const shouldReduceMotion = useReducedMotion();
  const publishedSettings = usePublishedSettings();
  const runtimeConfig = publishedSettings.content;
  const churchDateLine = formatRsvpEventDate(runtimeConfig.eventDetailsConfig.content.churchDate, runtimeConfig.eventDetailsConfig.content.churchTime);
  const churchReviewDateLine = formatRsvpEventDate(runtimeConfig.eventDetailsConfig.content.churchDate, runtimeConfig.eventDetailsConfig.content.churchTime, "—");
  const banquetDateLine = formatRsvpEventDate(runtimeConfig.event.dateLabel, runtimeConfig.event.welcomeTime);
  const banquetReviewDateLine = formatRsvpEventDate(runtimeConfig.event.dateLabel, runtimeConfig.event.welcomeTime, "—");
  const postCeremonyDateLine = formatRsvpEventDate(runtimeConfig.eventDetailsConfig.content.churchDate, "11:30", "–");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isPostCeremonyStep, setIsPostCeremonyStep] = useState(false);
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity>({});
  const [inviteeContext, setInviteeContext] = useState<Invitee | null>(null);
  const [inviteToken, setInviteToken] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isHydratingGuest, setIsHydratingGuest] = useState(true);
  const [tokenGateChecked, setTokenGateChecked] = useState(false);
  const [missingInviteToken, setMissingInviteToken] = useState(false);
  const [guestRsvpLocked, setGuestRsvpLocked] = useState(false);
  const [isAdminBypassed, setIsAdminBypassed] = useState(false);
  const [calendarHandoffHelp, setCalendarHandoffHelp] = useState<CalendarHandoffGuidance | null>(null);
  const [shouldRevealSuccessUtility, setShouldRevealSuccessUtility] = useState(false);
  const [successDisclosure, setSuccessDisclosure] = useState<"wish" | "gift" | null>(null);
  const [wishDraft, setWishDraft] = useState("");
  const [submittedWishMessage, setSubmittedWishMessage] = useState("");
  const [submittedWishAt, setSubmittedWishAt] = useState("");
  const [wishError, setWishError] = useState("");
  const [isSendingWish, setIsSendingWish] = useState(false);
  const hasUserEditedFormRef = useRef(false);
  const calendarHandoffCleanupRef = useRef<(() => void) | null>(null);
  const successConfirmationRef = useRef<HTMLDivElement>(null);
  const { navigateWithTransition, prefetch } = usePageTransition();

  // Prefetch home page / on mount for instant return navigation
  useEffect(() => {
    prefetch("/");
  }, [prefetch]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RSVPFormInput, unknown, RSVPFormOutput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      honorific: "",
      name: "",
      attendingCeremony: null,
      postCeremonyPartyInvited: false,
      terracottaLodgingEligible: false,
      attendingPostCeremonyParty: null,
      attendingBanquet: null,
      attending: "yes",
      guestCount: 1,
      guestGroup: "",
      stayDecision: null,
      accommodationNeeded: false,
      lodgingGuests: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "lodgingGuests" });
  const attending = useWatch({ control, name: "attending" });
  const attendingCeremony = useWatch({ control, name: "attendingCeremony" });
  const postCeremonyPartyInvited = useWatch({ control, name: "postCeremonyPartyInvited" });
  const terracottaLodgingEligible = useWatch({ control, name: "terracottaLodgingEligible" });
  const attendingPostCeremonyParty = useWatch({ control, name: "attendingPostCeremonyParty" });
  const attendingBanquet = useWatch({ control, name: "attendingBanquet" });
  const guestCount = useWatch({ control, name: "guestCount" });
  const selectedGuestCount = Math.max(0, Number(guestCount) || 0);
  const accommodationNeeded = useWatch({ control, name: "accommodationNeeded" });
  const stayDecision = useWatch({ control, name: "stayDecision" });
  const watchedLodgingGuests = useWatch({ control, name: "lodgingGuests" });
  const formValues = useWatch({ control }) as RSVPFormInput;
  const returnHref = inviteToken ? `/i/${encodeURIComponent(inviteToken)}?view=main` : "/?view=main";

  const activeGuestGroup = formValues.guestGroup?.trim() || inviteeContext?.guestGroup || guestIdentity.group || "";
  const eventAccess = resolveInviteEventAccess({
    guestGroup: activeGuestGroup,
    postCeremonyPartyInvited,
  });
  const effectiveAttendingCeremony = eventAccess.canViewCeremony ? attendingCeremony : "no";
  const inviteCopy = useMemo(() => buildInvitationCopy(inviteeContext ?? guestIdentity), [guestIdentity, inviteeContext]);
  const submissionCopy = useMemo(
    () => buildSubmissionCopy(attending, effectiveAttendingCeremony, attendingBanquet, inviteCopy, inviteeContext ?? guestIdentity),
    [attending, effectiveAttendingCeremony, attendingBanquet, inviteCopy, guestIdentity, inviteeContext],
  );
  const lodgingGuests = normalizeLodgingGuests((watchedLodgingGuests ?? []) as Array<Partial<LodgingGuestForm> | undefined>);
  const canRequestLodging = isTerracottaLodgingEligible(
    activeGuestGroup,
    terracottaLodgingEligible || inviteeContext?.terracottaLodgingEligible,
  );
  const hasGroomFamilyLodgingOptions = isGroomFamilyLodgingGuestGroup(activeGuestGroup);
  const canRegisterStay = attending !== "no";
  const shouldAskPostCeremonyParty = doesPostCeremonyPartyApply({
    invited: Boolean(postCeremonyPartyInvited),
    attendingCeremony: attendingCeremony === "yes",
    attendingBanquet: attendingBanquet === "yes",
    allowFallback: eventAccess.canUsePostCeremonyFallback,
  });
  const isRegularGuestFlow = eventAccess.canUsePostCeremonyFallback;
  const currentRsvpValues = {
    ...getValues(),
    attending,
    attendingCeremony,
    postCeremonyPartyInvited,
    terracottaLodgingEligible,
    attendingPostCeremonyParty,
    attendingBanquet,
    guestCount: selectedGuestCount,
    guestGroup: activeGuestGroup,
    stayDecision,
    accommodationNeeded,
    lodgingGuests: watchedLodgingGuests ?? [],
  };
  const isReadyForInitialContinue = initialRsvpStepSchema.safeParse(currentRsvpValues).success;
  const isReadyForReview = rsvpSchema.safeParse({
    ...currentRsvpValues,
  }).success;
  useEffect(() => {
    const activeToken = inviteToken || inviteeContext?.token || "";
    if (isHydratingGuest || !hasUserEditedFormRef.current || !activeToken) return;
    writeRsvpDraft(activeToken, formValues);
  }, [formValues, inviteToken, inviteeContext?.token, isHydratingGuest]);

  useEffect(() => {
    if (isSubmitted) {
      hasUserEditedFormRef.current = false;
      return;
    }
    setSuccessDisclosure(null);
    setWishError("");
  }, [isSubmitted]);

  useEffect(() => {
    if (!isSubmitted) {
      setShouldRevealSuccessUtility(false);
      return;
    }

    let revealFrameId = 0;
    const scrollFrameId = window.requestAnimationFrame(() => {
      successConfirmationRef.current?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });

      // Give WebKit one paint with the final scroll position before moving the
      // utility card. This avoids scroll and card compositing competing for the
      // same frame inside memory-constrained in-app webviews.
      revealFrameId = window.requestAnimationFrame(() => {
        setShouldRevealSuccessUtility(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(scrollFrameId);
      if (revealFrameId) window.cancelAnimationFrame(revealFrameId);
    };
  }, [isSubmitted]);

  useEffect(() => () => {
    calendarHandoffCleanupRef.current?.();
  }, []);

  function handleCalendarHandoffAttempt(
    clickEvent: ReactMouseEvent<HTMLAnchorElement>,
    eventId: WeddingCalendarEventId,
  ) {
    calendarHandoffCleanupRef.current?.();
    setCalendarHandoffHelp(null);

    const environment = {
      userAgent: window.navigator.userAgent || "",
      platform: window.navigator.platform,
      maxTouchPoints: window.navigator.maxTouchPoints,
      referrer: document.referrer,
    };
    const guidance = getCalendarHandoffGuidance(environment);

    if (shouldUseAndroidCalendarIntent(environment)) {
      clickEvent.preventDefault();

      const fallbackUrl = new URL(clickEvent.currentTarget.href);
      fallbackUrl.searchParams.set("download", "1");

      const calendarEvent = createWeddingCalendarEvents(runtimeConfig)[eventId];
      const inviteToken = fallbackUrl.searchParams.get("invite")?.trim();
      calendarEvent.invitationUrl = inviteToken
        ? `${window.location.origin}/i/${encodeURIComponent(inviteToken)}`
        : window.location.origin;

      window.location.href = buildAndroidCalendarIntent(calendarEvent, fallbackUrl.toString());
    }

    if (!guidance) return;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("pagehide", markHandoffSucceeded);
      window.removeEventListener("blur", markHandoffSucceeded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (calendarHandoffCleanupRef.current === cleanup) {
        calendarHandoffCleanupRef.current = null;
      }
    };

    const markHandoffSucceeded = () => cleanup();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") cleanup();
    };

    window.addEventListener("pagehide", markHandoffSucceeded, { once: true });
    window.addEventListener("blur", markHandoffSucceeded, { once: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const timeoutId = window.setTimeout(() => {
      const handoffStillBlocked = document.visibilityState === "visible";
      cleanup();
      if (handoffStillBlocked) setCalendarHandoffHelp(guidance);
    }, CALENDAR_HANDOFF_HELP_DELAY_MS);

    calendarHandoffCleanupRef.current = cleanup;
  }

  useEffect(() => {
    let cancelled = false;

    const bypassed = typeof window !== "undefined" && sessionStorage.getItem("admin_rsvp_bypass") === "true";
    if (bypassed) {
      setIsAdminBypassed(true);
    }

    function finishHydration() {
      if (!cancelled) setIsHydratingGuest(false);
    }

    function applyIdentity(identity: GuestIdentity) {
      if (cancelled) return;
      setGuestIdentity(identity);
      if (hasUserEditedFormRef.current) return;
      if (identity.name || identity.displayLabel) setValue("name", identity.name ?? identity.displayLabel ?? "", { shouldDirty: false });
      if (identity.honorific) setValue("honorific", identity.honorific, { shouldDirty: false });
      if (identity.group) setValue("guestGroup", identity.group, { shouldDirty: false });
    }

    function applyInvite(invitee: Invitee) {
      if (cancelled) return;
      const response = invitee.rsvp;
      setSubmittedWishMessage(response?.wishMessage ?? "");
      setSubmittedWishAt(response?.wishSentAt ?? "");
      const identity: GuestIdentity = {
        name: invitee.guestName || invitee.displayLabel,
        honorific: invitee.honorific,
        group: invitee.guestGroup,
        displayLabel: invitee.displayLabel,
        salutationCluster: invitee.salutationCluster,
        displaySalutation: invitee.displaySalutation,
        invitationName: invitee.invitationName,
        relationship: invitee.relationship,
        invitedBy: invitee.invitedBy,
        hostRelationship: invitee.hostRelationship,
        hostPronoun: invitee.hostPronoun,
        coupleReference: invitee.coupleReference,
      };

      applyIdentity(identity);
      setInviteeContext(invitee);
      setValue("postCeremonyPartyInvited", Boolean(invitee.postCeremonyPartyInvited), { shouldDirty: false });
      setValue("terracottaLodgingEligible", Boolean(invitee.terracottaLodgingEligible), { shouldDirty: false });
      if (hasUserEditedFormRef.current) return;
      setValue("name", response?.name ?? invitee.displayLabel, { shouldDirty: false });
      const hydratedGuestGroup = response?.guestGroup ?? invitee.guestGroup;
      setValue("guestGroup", hydratedGuestGroup, { shouldDirty: false });
      setValue("guestCount", resolveHydratedGuestCount({
        guestGroup: hydratedGuestGroup,
        storedGuestCount: response?.guestCount,
        expectedGuestCount: invitee.expectedGuestCount,
        hasStoredResponse: Boolean(response),
        attending: response?.attending,
      }), { shouldDirty: false });
      setValue("attendingCeremony", normalizeBoolean(response?.attendingCeremony), { shouldDirty: false });
      setValue("attendingPostCeremonyParty", normalizeBoolean(response?.attendingPostCeremonyParty), { shouldDirty: false });
      setValue("attendingBanquet", normalizeBoolean(response?.attendingBanquet), { shouldDirty: false });
      setValue("attending", normalizeAttendanceForForm(response?.attending), { shouldDirty: false });
      let initialStayDecision: StayDecision = response ? "none" : null;
      if (response?.accommodationNeeded) {
        const inDate = response.checkInDate;
        const outDate = response.checkOutDate;
        if (inDate === "2026-12-25" && outDate === "2026-12-27") {
          initialStayDecision = "both";
        } else if (inDate === "2026-12-25") {
          initialStayDecision = "25";
        } else if (inDate === "2026-12-26") {
          initialStayDecision = "26";
        } else {
          initialStayDecision = "both";
        }
      }
      initialStayDecision = normalizeStayDecisionForGuestGroup(hydratedGuestGroup, initialStayDecision);
      setValue("accommodationNeeded", initialStayDecision !== null && initialStayDecision !== "none", { shouldDirty: false });
      setValue("stayDecision", initialStayDecision, { shouldDirty: false });
      replace(response?.lodgingGuests?.length
        ? response.lodgingGuests
        : initialStayDecision !== null && initialStayDecision !== "none"
          ? [createLodgingGuest("")]
          : []);
    }

    function applyResponseOnly(response: RSVPResponse) {
      if (cancelled) return;
      if (hasUserEditedFormRef.current) return;
      setSubmittedWishMessage(response.wishMessage ?? "");
      setSubmittedWishAt(response.wishSentAt ?? "");
      setValue("name", response.name || "", { shouldDirty: false });
      const hydratedGuestGroup = response.guestGroup || "";
      setValue("guestGroup", hydratedGuestGroup, { shouldDirty: false });
      setValue("guestCount", resolveHydratedGuestCount({
        guestGroup: hydratedGuestGroup,
        storedGuestCount: response.guestCount,
        hasStoredResponse: true,
        attending: response.attending,
      }), { shouldDirty: false });
      setValue("attendingCeremony", normalizeBoolean(response.attendingCeremony), { shouldDirty: false });
      setValue("attendingPostCeremonyParty", normalizeBoolean(response.attendingPostCeremonyParty), { shouldDirty: false });
      setValue("attendingBanquet", normalizeBoolean(response.attendingBanquet), { shouldDirty: false });
      setValue("attending", normalizeAttendanceForForm(response.attending), { shouldDirty: false });
      
      let initialStayDecision: StayDecision = "none";
      if (response.accommodationNeeded) {
        const inDate = response.checkInDate;
        const outDate = response.checkOutDate;
        if (inDate === "2026-12-25" && outDate === "2026-12-27") {
          initialStayDecision = "both";
        } else if (inDate === "2026-12-25") {
          initialStayDecision = "25";
        } else if (inDate === "2026-12-26") {
          initialStayDecision = "26";
        } else {
          initialStayDecision = "both";
        }
      }
      initialStayDecision = normalizeStayDecisionForGuestGroup(hydratedGuestGroup, initialStayDecision);
      setValue("accommodationNeeded", initialStayDecision !== null && initialStayDecision !== "none", { shouldDirty: false });
      setValue("stayDecision", initialStayDecision, { shouldDirty: false });
      replace(response.lodgingGuests?.length
        ? response.lodgingGuests
        : initialStayDecision !== null && initialStayDecision !== "none"
          ? [createLodgingGuest("")]
          : []);
    }

    function applyDraft(values: RSVPDraftValues) {
      if (cancelled) return;
      hasUserEditedFormRef.current = true;
      setValue("honorific", values.honorific ?? "", { shouldDirty: true });
      setValue("name", values.name ?? "", { shouldDirty: true });
      setValue("attendingCeremony", values.attendingCeremony, { shouldDirty: true });
      setValue("attendingPostCeremonyParty", values.attendingPostCeremonyParty, { shouldDirty: true });
      setValue("attendingBanquet", values.attendingBanquet, { shouldDirty: true });
      setValue("attending", values.attending, { shouldDirty: true });
      const hydratedGuestGroup = values.guestGroup ?? "";
      setValue("guestCount", resolveHydratedGuestCount({
        guestGroup: hydratedGuestGroup,
        storedGuestCount: values.guestCount,
        hasStoredResponse: true,
        attending: values.attending,
      }), { shouldDirty: true });
      setValue("guestGroup", hydratedGuestGroup, { shouldDirty: true });
      const normalizedStayDecision = normalizeStayDecisionForGuestGroup(hydratedGuestGroup, values.stayDecision);
      setValue("stayDecision", normalizedStayDecision, { shouldDirty: true });
      setValue("accommodationNeeded", normalizedStayDecision !== null && normalizedStayDecision !== "none", { shouldDirty: true });
      replace(values.lodgingGuests ?? []);
    }

    async function hydrateGuest() {
      const params = new URLSearchParams(window.location.search);
      let token = params.get("invite") ?? params.get("token") ?? "";

      if (!token) {
        const restored = findAnyStoredInviteToken();
        if (restored) {
          token = restored;
          const next = new URL(window.location.href);
          next.searchParams.set("invite", restored);
          window.history.replaceState({}, "", next.toString());
        }
      }

      const bypassed = typeof window !== "undefined" && sessionStorage.getItem("admin_rsvp_bypass") === "true";
      setTokenGateChecked(true);
      setMissingInviteToken(!token && !bypassed);

      if (!token && !bypassed) {
        finishHydration();
        return;
      }

      if (token) {
        setInviteToken(token);
        try { sessionStorage.setItem("last_invite_token", token); } catch {}

        const localInvitee = readLocalInvitees().find((invitee) => invitee.token === token);
        const draft = readRsvpDraft(token);
        const hasImmediateState = Boolean(localInvitee || draft);

        if (localInvitee) {
          applyInvite(localInvitee);
        }
        if (draft) {
          applyDraft(draft);
        }
        if (hasImmediateState) {
          finishHydration();
        }

        try {
          const response = await fetchWithTimeout(
            `/api/invites/${encodeURIComponent(token)}`,
            RSVP_INVITE_FETCH_TIMEOUT_MS,
          );
          if (response.status === 404) {
            try {
              writeLocalInvitees(readLocalInvitees().filter((invitee) => invitee.token !== token));
              removeRSVPResponses((savedResponse) => savedResponse.inviteToken === token);
              removeStoredGuestIdentityForToken(token);
              clearRsvpDraft(token);
              if (sessionStorage.getItem("last_invite_token") === token) {
                sessionStorage.removeItem("last_invite_token");
              }
            } catch {
              // The invalid-token gate must still work when browser storage is blocked.
            }
            if (!cancelled) {
              setInviteeContext(null);
              setGuestIdentity({});
              setMissingInviteToken(true);
              finishHydration();
            }
            return;
          }
          if (response.ok) {
            const result = await response.json() as { invitee?: Invitee };
            if (result.invitee && !cancelled) {
              applyInvite(result.invitee);
              finishHydration();
              return;
            }
          }
        } catch {
          // Immediate local state or the generic identity below keeps RSVP usable.
        }

        if (hasImmediateState) {
          return;
        }
      } else {
        const localResponses = readRSVPResponses();
        if (localResponses.length > 0) {
          applyResponseOnly(localResponses[0]);
          finishHydration();
          return;
        }
      }

      const identity = resolveGuestIdentity(window.location.search);
      applyIdentity(identity);
      finishHydration();
    }

    const guestTimer = window.setTimeout(() => {
      void hydrateGuest();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(guestTimer);
    };
  }, [replace, setValue]);

  useEffect(() => {
    if (isHydratingGuest) return;
    const deadline = parseRsvpDeadline(runtimeConfig.rsvp.deadline);
    setGuestRsvpLocked(Boolean(!isAdminBypassed && deadline && Date.now() >= deadline.getTime()));
  }, [isAdminBypassed, isHydratingGuest, runtimeConfig.rsvp.deadline]);

  useEffect(() => {
    if (isHydratingGuest || canRequestLodging) return;
    if (stayDecision !== null || accommodationNeeded || lodgingGuests.length > 0) {
      setValue("accommodationNeeded", false, { shouldDirty: hasUserEditedFormRef.current });
      setValue("stayDecision", null, { shouldDirty: hasUserEditedFormRef.current });
      replace([]);
    }
  }, [
    accommodationNeeded,
    canRequestLodging,
    isHydratingGuest,
    lodgingGuests.length,
    replace,
    setValue,
    stayDecision,
  ]);

  useEffect(() => {
    if (eventAccess.canViewCeremony) return;

    if (attendingCeremony !== "no") {
      setValue("attendingCeremony", "no", {
        shouldDirty: hasUserEditedFormRef.current,
        shouldValidate: false,
      });
    }
    if (attendingPostCeremonyParty !== null) {
      setValue("attendingPostCeremonyParty", null, {
        shouldDirty: hasUserEditedFormRef.current,
        shouldValidate: false,
      });
    }
    clearErrors(["attendingCeremony", "attendingPostCeremonyParty"]);
    setIsPostCeremonyStep(false);
  }, [
    attendingCeremony,
    attendingPostCeremonyParty,
    clearErrors,
    eventAccess.canViewCeremony,
    setValue,
  ]);

  useEffect(() => {
    if (
      isHydratingGuest
      || !hasGroomFamilyLodgingOptions
      || stayDecision === null
      || stayDecision === "26"
      || stayDecision === "none"
    ) return;

    // An older response/draft may still contain 25/12 or both nights. Keep
    // guest names in memory, but require an explicit valid choice before review.
    setValue("stayDecision", null, { shouldDirty: hasUserEditedFormRef.current });
    setValue("accommodationNeeded", false, { shouldDirty: hasUserEditedFormRef.current });
  }, [
    hasGroomFamilyLodgingOptions,
    isHydratingGuest,
    setValue,
    stayDecision,
  ]);

  useEffect(() => {
    if (!shouldAskPostCeremonyParty && attendingPostCeremonyParty !== null) {
      setValue("attendingPostCeremonyParty", null, {
        shouldDirty: hasUserEditedFormRef.current,
        shouldValidate: false,
      });
    }

    const isAttendingAnyEvent = attendingCeremony === "yes"
      || attendingBanquet === "yes"
      || (shouldAskPostCeremonyParty && attendingPostCeremonyParty === "yes");

    if (attendingCeremony === "no" && attendingBanquet === "no" && !isAttendingAnyEvent && attending !== "no") {
      setValue("attending", "no", { shouldDirty: true });
      setValue("guestCount", 0, { shouldDirty: true });
      setValue("accommodationNeeded", false, { shouldDirty: true });
      setValue("stayDecision", null, { shouldDirty: true });
      replace([]);
      return;
    }

    if (attendingBanquet === "no") {
      setValue("accommodationNeeded", false, { shouldDirty: true });
      setValue("stayDecision", null, { shouldDirty: true });
      replace([]);
    }

    if (isAttendingAnyEvent) {
      if (attending !== "yes") {
        setValue("attending", "yes", { shouldDirty: true });
      }
      if (selectedGuestCount < 1) {
        setValue(
          "guestCount",
          canRequestLodging ? normalizeGuestCount(inviteeContext?.expectedGuestCount, 1) : 1,
          { shouldDirty: hasUserEditedFormRef.current },
        );
      }
    }
  }, [
    attending,
    attendingBanquet,
    attendingCeremony,
    attendingPostCeremonyParty,
    canRequestLodging,
    inviteeContext?.expectedGuestCount,
    postCeremonyPartyInvited,
    replace,
    selectedGuestCount,
    setValue,
    shouldAskPostCeremonyParty,
  ]);

  function markFormAsEdited() {
    hasUserEditedFormRef.current = true;
  }

  function handleStayDecisionChange(decision: "25" | "26" | "both" | "none") {
    if (!canRegisterStay || !canRequestLodging) return;
    if (hasGroomFamilyLodgingOptions && decision !== "26" && decision !== "none") return;
    markFormAsEdited();
    clearErrors("stayDecision");
    setValue("stayDecision", decision, { shouldDirty: true, shouldValidate: true });
    setValue("accommodationNeeded", decision !== "none", { shouldDirty: true });
    if (decision === "none") {
      replace([]);
    } else {
      if ((getValues("lodgingGuests") ?? []).length === 0) {
        // Merely choosing a night should reveal the guest fields without
        // summoning the mobile keyboard. Guests can focus the name field when ready.
        append(createLodgingGuest(""), { shouldFocus: false });
      }
    }
  }

  function redirectToInvitePage(token?: string, hash: string = "") {
    const activeToken = token || inviteToken || inviteeContext?.token || (typeof window !== "undefined" ? sessionStorage.getItem("last_invite_token") : null) || findAnyStoredInviteToken();
    const target = activeToken ? `/i/${encodeURIComponent(activeToken)}?view=main${hash}` : `/?view=main${hash}`;
    navigateWithTransition(target);
  }

  async function onSubmit(data: RSVPFormOutput) {
    setSubmitError("");

    const resolvedGroup = data.guestGroup?.trim() || inviteeContext?.guestGroup || guestIdentity.group || "Khác";
    const resolvedEventAccess = resolveInviteEventAccess({
      guestGroup: resolvedGroup,
      postCeremonyPartyInvited: data.postCeremonyPartyInvited,
    });
    const resolvedAttendingCeremony = resolvedEventAccess.canViewCeremony && data.attendingCeremony === "yes";
    const postCeremonyPartyApplies = doesPostCeremonyPartyApply({
      invited: data.postCeremonyPartyInvited,
      attendingCeremony: resolvedAttendingCeremony,
      attendingBanquet: data.attendingBanquet === "yes",
      allowFallback: resolvedEventAccess.canUsePostCeremonyFallback,
    });
    const resolvedAttendance = resolvedAttendingCeremony
      || data.attendingBanquet === "yes"
      || (postCeremonyPartyApplies && data.attendingPostCeremonyParty === "yes")
      ? "yes"
      : "no";
    const isStaying = isTerracottaLodgingEligible(
      resolvedGroup,
      data.terracottaLodgingEligible || inviteeContext?.terracottaLodgingEligible,
    )
      && resolvedAttendance === "yes"
      && data.attendingBanquet === "yes"
      && data.stayDecision !== null
      && data.stayDecision !== "none";
    const cleanLodgingGuests = !isStaying
      ? []
      : normalizeLodgingGuests(data.lodgingGuests);
    const stayingGuestCount = cleanLodgingGuests.length;
    const childrenCount = countLodgingChildren(cleanLodgingGuests);
    const searchParams = new URLSearchParams(window.location.search);
    const searchToken = searchParams.get("invite") ?? searchParams.get("token") ?? "";

    const resolvedName = data.name?.trim()
      || inviteeContext?.guestName
      || inviteeContext?.displayLabel
      || guestIdentity.name
      || guestIdentity.displayLabel
      || "Người được mời";
    const resolvedGuestCount = resolvedAttendance === "no"
      ? 0
      : canRequestLodging
        ? normalizeGuestCount(data.guestCount || inviteeContext?.expectedGuestCount, 1)
        : normalizeGuestCount(data.guestCount, 1);

    let checkInDate: string | undefined = undefined;
    let checkOutDate: string | undefined = undefined;
    if (isStaying) {
      if (data.stayDecision === "25") {
        checkInDate = "2026-12-25";
        checkOutDate = "2026-12-26";
      } else if (data.stayDecision === "26") {
        checkInDate = "2026-12-26";
        checkOutDate = "2026-12-27";
      } else if (data.stayDecision === "both") {
        checkInDate = "2026-12-25";
        checkOutDate = "2026-12-27";
      }
    }

    const payload: Omit<RSVPResponse, "id" | "submittedAt"> = {
      inviteeId: inviteeContext?.id,
      inviteToken: inviteeContext?.token ?? (inviteToken || searchToken || undefined),
      displayLabel: inviteeContext?.displayLabel ?? guestIdentity.displayLabel,
      name: resolvedName,
      attendingCeremony: resolvedAttendingCeremony,
      attendingPostCeremonyParty: postCeremonyPartyApplies
        ? data.attendingPostCeremonyParty === "yes"
        : undefined,
      attendingBanquet: data.attendingBanquet === "yes",
      attending: resolvedAttendance,
      guestCount: resolvedGuestCount,
      guestGroup: resolvedGroup,
      accommodationNeeded: isStaying,
      stayingGuestCount,
      lodgingGuests: cleanLodgingGuests,
      checkInDate,
      checkOutDate,
      childrenCount,
    };

    try {
      const targetToken = searchToken || inviteToken || inviteeContext?.token || payload.inviteToken;
      if (!targetToken) throw new Error("Không tìm thấy link thiệp mời để gửi hồi đáp.");
      const endpoint = `/api/invites/${encodeURIComponent(targetToken)}/rsvp`;
      const apiResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await apiResponse.json().catch(() => null) as {
        error?: string;
        response?: RSVPResponse;
      } | null;

      if (!apiResponse.ok) {
        throw new Error(result?.error || "Máy chủ chưa ghi nhận được hồi đáp.");
      }

      clearRsvpDraft(targetToken);
      const localResponse = persistLocalRsvp(payload);
      const savedResponse = result?.response ?? localResponse;
      setSubmittedWishMessage(savedResponse.wishMessage ?? "");
      setSubmittedWishAt(savedResponse.wishSentAt ?? "");
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? `Chưa gửi được hồi đáp: ${error.message} Vui lòng thử lại.`
          : "Chưa gửi được hồi đáp. Vui lòng kiểm tra kết nối và thử lại.",
      );
    }
  }

  function applySubmittedWish(response: RSVPResponse) {
    const message = response.wishMessage?.trim();
    if (!message) return false;

    const wishSentAt = response.wishSentAt || new Date().toISOString();
    setSubmittedWishMessage(message);
    setSubmittedWishAt(wishSentAt);
    setWishDraft("");
    setWishError("");
    setSuccessDisclosure(null);
    saveRSVPWishLocally({
      inviteeId: response.inviteeId,
      inviteToken: response.inviteToken,
      wishMessage: message,
      wishSentAt,
    });

    if (inviteeContext) {
      const updatedInvitee = {
        ...inviteeContext,
        rsvp: { ...response, wishMessage: message, wishSentAt },
        updatedAt: new Date().toISOString(),
      };
      setInviteeContext(updatedInvitee);
      upsertLocalInvitees([updatedInvitee]);
    }

    return true;
  }

  async function submitWish() {
    if (isSendingWish || submittedWishMessage) return;

    const message = wishDraft.trim();
    if (!message) {
      setWishError("Quý khách vui lòng viết đôi lời trước khi gửi.");
      return;
    }
    if (message.length > RSVP_WISH_MAX_LENGTH) {
      setWishError(`Lời chúc tối đa ${RSVP_WISH_MAX_LENGTH} ký tự.`);
      return;
    }

    const targetToken = inviteToken || inviteeContext?.token || "";
    if (!targetToken) {
      setWishError("Chưa tìm thấy lời mời riêng để ghi nhận lời chúc.");
      return;
    }

    setIsSendingWish(true);
    setWishError("");
    try {
      const apiResponse = await fetch(`/api/invites/${encodeURIComponent(targetToken)}/wish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = await apiResponse.json().catch(() => null) as {
        error?: string;
        response?: RSVPResponse;
      } | null;

      if (result?.response?.wishMessage && applySubmittedWish(result.response)) {
        return;
      }
      if (!apiResponse.ok) {
        throw new Error(result?.error || "Chưa ghi nhận được lời chúc.");
      }
      throw new Error("Máy chủ chưa trả về lời chúc vừa gửi.");
    } catch (error) {
      setWishError(
        error instanceof Error && error.message
          ? `${error.message} Vui lòng thử lại.`
          : "Chưa gửi được lời chúc. Vui lòng kiểm tra kết nối và thử lại.",
      );
    } finally {
      setIsSendingWish(false);
    }
  }

  function scrollToFirstRsvpError() {
    // React Hook Form updates the inline error nodes after validation resolves.
    // Wait for that render, then bring the first exact field requiring input into view.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const firstError = document.querySelector<HTMLElement>('[data-rsvp-error="true"]');
        if (!firstError) return;
        firstError.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "center" });
        firstError.focus({ preventScroll: true });
      });
    });
  }

  function showReview() {
    setIsReviewing(true);
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
  }

  const handleGoToReview = async () => {
    if (isHydratingGuest) return;
    setSubmitError("");
    const isValid = await trigger();
    if (isValid) {
      showReview();
    } else {
      scrollToFirstRsvpError();
    }
  };

  const handleRegularGuestContinue = async () => {
    if (isHydratingGuest || guestRsvpLocked) return;
    setSubmitError("");

    if (!isReadyForInitialContinue) {
      await trigger(["attendingCeremony", "attendingBanquet", "guestCount", "stayDecision", "lodgingGuests"]);
      scrollToFirstRsvpError();
      return;
    }

    if (attendingBanquet === "no") {
      clearErrors("attendingPostCeremonyParty");
      setIsPostCeremonyStep(true);
      window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
      return;
    }

    showReview();
  };

  function persistLocalRsvp(payload: Omit<RSVPResponse, "id" | "submittedAt">) {
    const localResponse = saveRSVPResponse(payload);
    const targetToken = payload.inviteToken || inviteToken || inviteeContext?.token;
    const currentLocal = readLocalInvitees();
    const existing = currentLocal.find(
      (i) => (targetToken && i.token === targetToken) || (payload.inviteeId && i.id === payload.inviteeId)
    ) || inviteeContext;

    if (existing) {
      const updatedInvitee: Invitee = {
        ...existing,
        rsvp: localResponse,
        inviteStatus: getInviteStatusFromRsvp(payload.attending),
        updatedAt: new Date().toISOString(),
      };
      upsertLocalInvitees([updatedInvitee]);
      setInviteeContext(updatedInvitee);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("wedding-rsvp-updated"));
      window.dispatchEvent(new Event("wedding-invitees-updated"));
    }
    return localResponse;
  }

  const hasCeremony = eventAccess.canViewCeremony && formValues.attendingCeremony === "yes";
  const hasBanquet = formValues.attendingBanquet === "yes";
  const activeInviteToken = inviteToken || inviteeContext?.token || "";
  const calendarInviteQuery = activeInviteToken ? `?invite=${encodeURIComponent(activeInviteToken)}` : "";
  const albumAvailableDate = formatAlbumAvailableDate(runtimeConfig.postWeddingGallery.availableAfter);
  const shouldShowAttendanceCalendar = submissionCopy.showCalendar && (hasCeremony || hasBanquet);
  const albumEventLabel = hasCeremony && hasBanquet
    ? "Thánh lễ Hôn phối và Tiệc cưới"
    : hasCeremony
      ? "Thánh lễ Hôn phối"
      : "Tiệc cưới";
  const albumReminder = `Album hình ảnh kỷ niệm ${albumEventLabel} sẽ được đăng tải tại thiệp mời này vào ngày ${albumAvailableDate}.`;
  
  if (isHydratingGuest) {
    return <RsvpHydrationState />;
  }

  if (missingInviteToken && tokenGateChecked && !isAdminBypassed) {
    return (
      <main className="public-invitation-page relative flex min-h-screen items-center justify-center px-4 py-12 text-[#252934] sm:px-6 sm:py-16">
        <div aria-hidden="true" className="aurora-wash pointer-events-none absolute inset-0 -z-10 opacity-50" />
        <div aria-hidden="true" className="film-grain-soft pointer-events-none absolute inset-0 -z-10" />
        <section className="rsvp-paper-card w-full max-w-lg rounded-[2rem] px-6 py-9 text-center sm:p-10">
          <p className="section-kicker-dark wedding-type-kicker text-serenity">Lời hồi đáp</p>
          <h1 className="wedding-type-title mt-4 text-[#252934]">Không tìm thấy lời mời</h1>
          <p className="wedding-type-body mx-auto mt-5 max-w-md leading-relaxed text-[#252934]/68">
            Đường dẫn này không còn hiệu lực hoặc chưa có thông tin khách mời. Quý khách vui lòng mở lại link thiệp trong tin nhắn đã nhận.
          </p>
          <div className="mt-8 flex justify-center border-t border-serenity/12 pt-6">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="wedding-type-button inline-flex min-h-11 items-center justify-center rounded-full border border-serenity/26 bg-white/80 px-7 text-sm font-semibold text-[#252934] transition hover:border-serenity/46 hover:bg-white"
            >
              Mở lại trang thiệp
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="public-invitation-page rsvp-page cinematic-stage relative min-h-screen bg-transparent px-4 py-8 text-center text-[#252934] sm:px-6 sm:py-12">
      <div aria-hidden="true" className="aurora-wash -z-10 opacity-60" />
      <div aria-hidden="true" className="film-grain-soft -z-10" />
      
      <div className="mx-auto max-w-2xl">
        {!isReviewing ? <div className="mb-6 flex justify-start">
          <button
            type="button"
            onClick={() => {
              if (isSubmitted || isReviewing) {
                setIsSubmitted(false);
                setIsReviewing(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                navigateWithTransition(returnHref);
              }
            }}
            className="wedding-type-button inline-flex items-center gap-2 text-[#252934]/62 transition hover:text-[#252934] font-semibold text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> {(isSubmitted || isReviewing) ? "Quay lại trang hồi đáp" : "Về trang thiệp"}
          </button>
        </div> : null}

        {guestRsvpLocked ? (
          <p className="mb-6 rounded-2xl border border-serenity/22 bg-white/70 px-4 py-3 text-sm font-semibold text-[#252934]/72 text-center">
            Đã hết hạn chỉnh sửa lời hồi đáp (sau {runtimeConfig.rsvp.deadline}, 00:00 giờ Việt Nam). Vui lòng liên hệ gia đình nếu cần thay đổi.
          </p>
        ) : null}

        <section className="w-full text-center py-4">
          {isSubmitted ? (
            <div className="rsvp-success-card-stack mx-auto flex w-full max-w-2xl flex-col items-center px-4 text-center sm:px-6">
              <motion.div
                ref={successConfirmationRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="rsvp-paper-card rsvp-success-main-card flex w-full scroll-mt-4 flex-col items-center rounded-[2rem] p-6 sm:scroll-mt-8 sm:p-8"
              >
                <h2 className="wedding-type-title text-[#252934] font-serif italic text-2xl sm:text-3xl font-bold mb-4">{submissionCopy.title}</h2>
                <div className="wedding-type-body max-w-lg space-y-5 text-center leading-relaxed text-[#252934]/75 sm:space-y-6">
                  {submissionCopy.body.split("\n\n").map((paragraph, index) => (
                    <p
                      key={`${index}-${paragraph}`}
                      className={paragraph === "Chân thành cảm ơn!" ? "font-semibold text-[#54473b]" : undefined}
                    >
                      <CoupleNameText
                        text={paragraph}
                        coupleName={weddingConfig.couple.displayName}
                      />
                    </p>
                  ))}
                </div>

                <div className="mt-6 flex w-full max-w-lg flex-col items-center gap-1.5 sm:mt-7">
                  {submittedWishMessage ? (
                    <p
                      role="status"
                      aria-live="polite"
                      title={submittedWishAt ? `Đã gửi lúc ${new Date(submittedWishAt).toLocaleString("vi-VN")}` : undefined}
                      className="inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold text-[#6e655e]/78"
                    >
                      <CircleCheck aria-hidden="true" className="h-[18px] w-[18px] text-[#d7aaa8]" strokeWidth={1.8} />
                      <span className="whitespace-nowrap">Đã gửi lời chúc</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      aria-expanded={successDisclosure === "wish"}
                      aria-controls="rsvp-wish-composer"
                      onClick={() => {
                        setWishError("");
                        setSuccessDisclosure((current) => current === "wish" ? null : "wish");
                      }}
                      className="wedding-type-button inline-flex h-11 items-center justify-center gap-2 rounded-full border border-serenity/24 bg-white/80 px-5 text-sm font-bold text-[#252934] transition hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a8a5c] focus-visible:ring-offset-2"
                    >
                      <Mail aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      <span className="whitespace-nowrap">Gửi lời chúc</span>
                    </button>
                  )}

                  <button
                    type="button"
                    aria-expanded={successDisclosure === "gift"}
                    aria-controls="rsvp-gift-qr"
                    onClick={() => setSuccessDisclosure((current) => current === "gift" ? null : "gift")}
                    className={[
                      "wedding-type-button inline-grid min-h-11 items-center font-bold text-[#4f4a45] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a8a5c] focus-visible:ring-offset-2",
                      submittedWishMessage
                        ? "mt-0.5 h-11 grid-cols-[18px_auto_18px] gap-2 rounded-full border border-serenity/24 bg-white/80 px-5 text-sm hover:bg-white hover:shadow-sm"
                        : "grid-cols-[16px_auto_16px] gap-1.5 rounded-full px-2 text-xs text-[#5f5a54]/84 hover:bg-white/46 hover:text-[#252934]",
                    ].join(" ")}
                  >
                    <Gift
                      aria-hidden="true"
                      className={submittedWishMessage ? "h-[18px] w-[18px]" : "h-4 w-4"}
                      strokeWidth={1.75}
                    />
                    <span className="whitespace-nowrap text-center">Gửi quà mừng</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={[
                        submittedWishMessage ? "h-[18px] w-[18px]" : "h-4 w-4",
                        "transition-transform duration-200",
                        successDisclosure === "gift" ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>
                </div>

                <AnimatePresence initial={false} mode="wait">
                  {successDisclosure === "wish" && !submittedWishMessage ? (
                    <motion.form
                      key="wish-composer"
                      id="rsvp-wish-composer"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitWish();
                      }}
                      initial={shouldReduceMotion ? false : { opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-4 w-full max-w-lg overflow-hidden"
                    >
                      <label htmlFor="rsvp-wish-message" className="sr-only">Lời chúc dành cho Nhật và Phương</label>
                      <div className="relative rounded-[1.35rem] border border-[#dccdc4] bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_10px_28px_rgba(92,82,71,0.04)] transition focus-within:border-[#b9a69a] focus-within:bg-white/92 focus-within:ring-4 focus-within:ring-serenity/12">
                        <textarea
                          id="rsvp-wish-message"
                          value={wishDraft}
                          maxLength={RSVP_WISH_MAX_LENGTH}
                          rows={4}
                          autoFocus
                          onChange={(event) => {
                            setWishDraft(event.target.value);
                            if (wishError) setWishError("");
                          }}
                          placeholder={keepExactPhraseTogether("Viết lời chúc dành cho Nhật & Phương…", weddingConfig.couple.displayName)}
                          aria-describedby="rsvp-wish-counter rsvp-wish-error"
                          className="block min-h-36 w-full resize-none rounded-[1.35rem] bg-transparent px-4 pb-14 pt-4 text-left text-base font-normal leading-relaxed text-[#3f3b37] outline-none placeholder:text-[#7a6a5d]/46"
                        />
                        <span
                          id="rsvp-wish-counter"
                          className="pointer-events-none absolute bottom-4 left-4 text-[11px] font-medium tabular-nums text-[#7a6a5d]/58"
                        >
                          {wishDraft.length}/{RSVP_WISH_MAX_LENGTH}
                        </span>
                        <button
                          type="submit"
                          disabled={isSendingWish}
                          className="wedding-type-button absolute bottom-2.5 right-2.5 inline-flex min-h-11 min-w-20 items-center justify-center gap-1.5 rounded-full bg-[#f6d8d6] px-4 text-xs font-bold text-[#3f3b37] shadow-sm ring-1 ring-[#e8c4c2]/74 transition hover:-translate-y-0.5 hover:bg-[#f3cecc] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a8a5c] focus-visible:ring-offset-2"
                        >
                          <Send aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.9} />
                          {isSendingWish ? "Đang gửi" : "Gửi"}
                        </button>
                      </div>
                      <p
                        id="rsvp-wish-error"
                        role={wishError ? "alert" : undefined}
                        className="mt-2 min-h-5 text-center text-sm font-medium leading-relaxed text-[#B4232F]"
                      >
                        {wishError}
                      </p>
                    </motion.form>
                  ) : successDisclosure === "gift" ? (
                    <motion.div
                      key="gift-qr"
                      id="rsvp-gift-qr"
                      role="region"
                      aria-label="Mã QR gửi quà mừng"
                      initial={shouldReduceMotion ? false : { opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-4 w-full max-w-lg overflow-hidden"
                    >
                      <div className="mx-auto w-[min(13.75rem,78vw)] rounded-[1.55rem] border border-white/90 bg-white/92 p-3 shadow-[0_14px_38px_rgba(92,82,71,0.09),inset_0_1px_0_rgba(255,255,255,0.95)]">
                        <Image
                          src="/assets/wedding/ui/rsvp/cash-gift-qr.png"
                          alt="Mã QR gửi quà mừng đến Nhật và Phương"
                          width={468}
                          height={464}
                          className="h-auto w-full rounded-[1rem]"
                          draggable={false}
                          unoptimized
                        />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>

              {shouldShowAttendanceCalendar ? (
                <RsvpSuccessUtilityCard reveal={shouldRevealSuccessUtility}>
                  <p className="mb-5 text-base font-semibold tracking-[0.07em] text-[#7a6a5d] sm:text-lg">
                    Lưu vào lịch
                  </p>
                  <div className="flex flex-row justify-center gap-3.5 flex-wrap">
                    {hasCeremony && (
                      // Calendar files require a full document navigation so in-app WebViews can hand them to the operating system.
                      <a
                        href={`/calendar/thanh-le${calendarInviteQuery}`}
                        onClick={(event) => handleCalendarHandoffAttempt(event, "thanh-le")}
                        className="wedding-type-button inline-flex h-11 items-center justify-center gap-2 rounded-full border border-serenity/24 bg-white/80 px-6 text-xs sm:text-sm font-bold text-[#252934] transition hover:bg-white hover:shadow-sm min-w-[130px]"
                      >
                        <CalendarDays className="w-4 h-4" /> Thánh lễ
                      </a>
                    )}
                    {hasBanquet && (
                      // Calendar files require a full document navigation so in-app WebViews can hand them to the operating system.
                      <a
                        href={`/calendar/tiec-cuoi${calendarInviteQuery}`}
                        onClick={(event) => handleCalendarHandoffAttempt(event, "tiec-cuoi")}
                        className="wedding-type-button inline-flex h-11 items-center justify-center gap-2 rounded-full border border-serenity/24 bg-white/80 px-6 text-xs sm:text-sm font-bold text-[#252934] transition hover:bg-white hover:shadow-sm min-w-[130px]"
                      >
                        <CalendarDays className="w-4 h-4" /> Tiệc cưới
                      </a>
                    )}
                  </div>

                  <div className="mt-5 border-t border-[#D4AF37]/24 pt-5 sm:mt-6 sm:pt-6">
                    <p className="wedding-type-body mx-auto max-w-md text-sm leading-relaxed text-[#252934]/70 sm:text-base">
                      {albumReminder}
                    </p>
                    <a
                      href={`/calendar/album${calendarInviteQuery}`}
                      onClick={(event) => handleCalendarHandoffAttempt(event, "album")}
                      className="wedding-type-button mt-4 inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-full border border-serenity/24 bg-white/80 px-6 text-xs font-bold text-[#252934] transition hover:bg-white hover:shadow-sm sm:text-sm"
                    >
                      <Images className="h-4 w-4" /> Xem album
                    </a>
                  </div>

                  <AnimatePresence initial={false}>
                    {calendarHandoffHelp ? (
                      <motion.div
                        key={calendarHandoffHelp.message}
                        role="status"
                        aria-live="polite"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-4 flex items-start gap-2.5 rounded-2xl border border-serenity/18 bg-white/62 px-4 py-3 text-left text-sm leading-relaxed text-[#54473b]"
                      >
                        <CircleHelp aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#7a6a5d]" />
                        <p>
                          <strong className="font-bold text-[#252934]">Chưa mở được lịch?</strong>{" "}
                          {calendarHandoffHelp.message}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </RsvpSuccessUtilityCard>
              ) : null}
              <div className="relative mt-6 inline-flex">
                <button
                  type="button"
                  onClick={() => redirectToInvitePage(inviteToken, "#thank-you")}
                  className="light-sweep wedding-type-button rsvp-return-invite-button inline-flex min-h-12 items-center justify-center rounded-full bg-rose-quartz px-8 text-[#252934] shadow-[0_16px_48px_rgba(146,168,209,0.22)] ring-1 ring-rose-quartz/70 transition hover:-translate-y-0.5"
                >
                  Trở lại trang thiệp
                </button>

                <span className="rsvp-tap-guide" aria-hidden="true">
                  <span className="rsvp-tap-guide-ripple" />
                  <Image
                    src="/assets/wedding/ui/rsvp/tap-hand-neutral.webp"
                    alt=""
                    width={420}
                    height={420}
                    className="rsvp-tap-guide-image"
                    draggable={false}
                    unoptimized
                  />
                </span>
              </div>
            </div>
          ) : isReviewing ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto flex w-full max-w-2xl flex-col items-center px-1 py-1 text-center sm:px-8 sm:py-4"
            >
              <h2 className="wedding-type-title mb-3 !text-[2rem] font-serif font-bold italic text-[#252934] sm:mb-4 sm:!text-[2.6rem]">
                Xem lại hồi đáp
              </h2>

              <p className="mb-6 max-w-md text-sm leading-relaxed text-[#6e655e] sm:text-base">
                Quý khách vui lòng kiểm tra thông tin trước khi gửi.
              </p>

              <div className="mb-3 flex w-full justify-start sm:mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewing(false);
                    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-serenity/30 bg-white/92 px-4 text-sm font-semibold text-[#252934] shadow-xs transition hover:bg-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" /> Chỉnh sửa
                </button>
              </div>

              <div className="rsvp-paper-card mb-7 grid w-full justify-items-center gap-0 rounded-[1.8rem] px-5 py-6 text-center sm:px-9 sm:py-8">
                <header className="pb-5 text-center sm:pb-6">
                  <p className="mb-1.5 text-sm font-medium text-[#7a6a5d]">Hồi đáp của</p>
                  <div className="mx-auto w-full max-w-lg text-center">
                    <strong className="block text-balance text-lg font-semibold text-[#252934] sm:text-xl">
                      <GuestNameText text={inviteeContext?.displayLabel || guestIdentity.displayLabel || formValues.name || inviteCopy.shortRecipientLabel} />
                    </strong>
                  </div>
                </header>

                <section className="w-full border-t border-serenity/16 py-5 text-center sm:py-6">
                  <h3 className="mb-2 text-base font-semibold text-[#252934] sm:text-lg">Sự kiện</h3>
                  <div className="divide-y divide-serenity/14">
                    {eventAccess.canViewCeremony ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-4 text-center first:pt-2">
                      <div className="text-center">
                        <p className="whitespace-nowrap text-base font-semibold text-[#252934] sm:text-lg">Thánh lễ Hôn phối</p>
                        <p className="mt-1 text-sm font-normal leading-relaxed text-[#7a6a5d]">{churchDateLine}</p>
                      </div>
                      <ReviewAttendanceStatus attending={formValues.attendingCeremony === "yes"} />
                    </div>
                    ) : null}

                    {shouldAskPostCeremonyParty ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                        <div className="text-center">
                          <p className="whitespace-nowrap text-base font-semibold text-[#252934] sm:text-lg">Tiệc thân mật</p>
                          <p className="mt-1 text-sm font-normal leading-relaxed text-[#7a6a5d]">{postCeremonyDateLine}</p>
                        </div>
                        <ReviewAttendanceStatus attending={formValues.attendingPostCeremonyParty === "yes"} />
                      </div>
                    ) : null}

                    <div className="flex flex-col items-center justify-center gap-2 py-4 text-center last:pb-1">
                      <div className="text-center">
                        <p className="whitespace-nowrap text-base font-semibold text-[#252934] sm:text-lg">Tiệc cưới</p>
                        <p className="mt-1 text-sm font-normal leading-relaxed text-[#7a6a5d]">{banquetDateLine}</p>
                      </div>
                      <ReviewAttendanceStatus attending={formValues.attendingBanquet === "yes"} />
                      {formValues.attendingBanquet === "yes" && !canRequestLodging ? (
                        <p className="text-sm font-normal leading-relaxed text-[#7a6a5d]">
                          Số người tham dự:{" "}
                          <strong className="font-semibold text-[#252934]">
                            {Math.max(1, Number(formValues.guestCount) || 1)} người
                          </strong>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </section>

                {formValues.attendingBanquet === "yes" && canRequestLodging && (
                  <section className="w-full border-t border-serenity/16 pt-5 text-center sm:pt-6">
                    <h3 className="text-base font-semibold text-[#252934] sm:text-lg">Lưu trú tại Resort Terracotta</h3>
                    <div className="mt-2 grid gap-4 text-sm text-[#252934]">
                      <strong className="block text-base font-medium leading-relaxed text-[#252934] sm:text-lg">
                        {stayDecision === "25" && "Nghỉ lại đêm 25/12 (đêm trước tiệc)"}
                        {stayDecision === "26" && "Nghỉ lại đêm 26/12 (đêm sau tiệc)"}
                        {stayDecision === "both" && "Nghỉ lại cả hai đêm (25/12 và 26/12)"}
                        {stayDecision === "none" && "Không nghỉ lại"}
                      </strong>

                      {stayDecision !== null && stayDecision !== "none" && lodgingGuests.length > 0 && (
                        <div className="w-full text-center">
                          <p className="mb-1 text-sm font-medium text-[#7a6a5d]">
                            Người lưu trú ({lodgingGuests.length})
                          </p>
                          <ul className="divide-y divide-serenity/12">
                            {lodgingGuests.map((g, idx) => (
                              <li key={idx} className="flex flex-col items-center justify-center gap-1 py-3 text-center first:pt-2 sm:gap-1.5">
                                <span className="font-medium text-[#252934]">{g.fullName || "Khách mời"}</span>
                                {g.isChild ? (
                                  <span className="text-sm font-normal text-[#7a6a5d]">
                                    Trẻ em{typeof g.age === "number" ? `, ${g.age} tuổi` : ""}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}

              </div>

              {submitError ? (
                <p className={`${rsvpAlertTextClass} mb-5 w-full max-w-xl rounded-2xl border border-[#B4232F]/25 bg-white/75 px-4 py-3`}>
                  {submitError}
                </p>
              ) : null}

              <div className="mx-auto flex w-full justify-center">
                <div className="relative inline-flex max-w-full">
                  <motion.button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="inline-flex min-h-12 max-w-full items-center justify-center rounded-full bg-rose-quartz px-8 text-sm font-semibold text-[#252934] shadow-[0_12px_32px_rgba(146,168,209,0.18)] ring-1 ring-rose-quartz/70 transition disabled:opacity-60"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <svg className="mr-2 h-4 w-4 animate-spin text-[#252934]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <Mail className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    <span>{isSubmitting ? "Đang gửi..." : "Xác nhận gửi hồi đáp"}</span>
                  </motion.button>

                  {!isSubmitting ? (
                    <span className="rsvp-submit-tap-guide" aria-hidden="true">
                      <span className="rsvp-tap-guide-ripple" />
                      <Image
                        className="rsvp-tap-guide-image"
                        src="/assets/wedding/ui/rsvp/tap-hand-neutral.webp"
                        alt=""
                        width={160}
                        height={160}
                        sizes="72px"
                        unoptimized
                        draggable={false}
                      />
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : isPostCeremonyStep && isRegularGuestFlow ? (
            <motion.div
              key="post-ceremony-step"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-full flex-col"
            >
              <aside className="mx-auto mb-8 max-w-2xl px-4 text-center">
                <h1 className="wedding-type-title text-[#252934]">Lời hồi đáp</h1>
              </aside>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!guestRsvpLocked) void handleGoToReview();
                }}
                onInputCapture={markFormAsEdited}
                onChangeCapture={markFormAsEdited}
                className="w-full px-4 text-center sm:px-8"
              >
                <div className="mx-auto mb-4 flex w-full max-w-2xl justify-start">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPostCeremonyStep(false);
                      window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
                    }}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-serenity/30 bg-white/92 px-4 text-sm font-semibold text-[#252934] shadow-xs transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serenity focus-visible:ring-offset-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4 shrink-0" /> Chỉnh sửa
                  </button>
                </div>

                <div className="rsvp-paper-card mx-auto mb-7 grid w-full max-w-2xl justify-items-center rounded-[1.8rem] px-5 py-7 text-center sm:px-9 sm:py-10">
                  <div className="w-full max-w-xl">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-[#f2e5e0] bg-white shadow-[0_8px_20px_rgba(242,229,224,0.5)] sm:h-16 sm:w-16 sm:rounded-[1.5rem]">
                      <Image
                        data-rsvp-intimate-party-icon="true"
                        src="/assets/wedding/ui/rsvp/intimate-party-cloche-v2.png"
                        alt=""
                        aria-hidden="true"
                        width={48}
                        height={48}
                        className="h-9 w-9 object-contain sm:h-10 sm:w-10"
                      />
                    </div>
                    <p className="whitespace-nowrap text-base font-bold uppercase tracking-[0.12em] text-[#7a6a5d] sm:text-lg">
                      Tiệc thân mật
                    </p>
                    <p className="mt-3 text-base font-semibold leading-relaxed text-[#252934]">
                      Sau <span data-rsvp-unbreakable-ceremony="true" className="whitespace-nowrap">Thánh lễ</span> hôn phối
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-[#252934] sm:text-base">
                      {postCeremonyDateLine}
                    </p>
                    <PostCeremonyVenue />

                    <div className="mt-6 flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a6a5d]">
                        Tham dự:
                      </span>
                      <div className="flex h-12 items-center rounded-full bg-white/90 p-1 ring-1 ring-serenity/30 shadow-[0_4px_14px_rgba(63,70,66,0.08)]">
                        <button
                          type="button"
                          aria-pressed={attendingPostCeremonyParty === "yes"}
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors("attendingPostCeremonyParty");
                            setValue("attendingPostCeremonyParty", "yes", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full min-w-20 rounded-full px-6 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serenity focus-visible:ring-offset-2",
                            attendingPostCeremonyParty === "yes"
                              ? "bg-[#7a8a5c] text-white shadow-sm"
                              : "text-[#252934] hover:bg-[#252934]/5",
                          ].join(" ")}
                        >
                          Có
                        </button>
                        <button
                          type="button"
                          aria-pressed={attendingPostCeremonyParty === "no"}
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors("attendingPostCeremonyParty");
                            setValue("attendingPostCeremonyParty", "no", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full min-w-20 rounded-full px-6 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serenity focus-visible:ring-offset-2",
                            attendingPostCeremonyParty === "no"
                              ? "bg-[#7a4a4a] text-white shadow-sm"
                              : "text-[#252934] hover:bg-[#252934]/5",
                          ].join(" ")}
                        >
                          Không
                        </button>
                      </div>
                    </div>

                    {errors.attendingPostCeremonyParty ? (
                      <p
                        role="alert"
                        tabIndex={-1}
                        data-rsvp-error="true"
                        className={`${rsvpAlertTextClass} mt-3 text-center`}
                      >
                        {errors.attendingPostCeremonyParty.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <div className="relative inline-flex max-w-full">
                    <motion.button
                      type="button"
                      onClick={handleGoToReview}
                      disabled={guestRsvpLocked || isHydratingGuest}
                      className="wedding-type-button rsvp-final-cta inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-rose-quartz text-base font-semibold text-[#252934] shadow-[0_12px_32px_rgba(146,168,209,0.18)] ring-1 ring-rose-quartz/70 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a8a5c] focus-visible:ring-offset-2"
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    >
                      <ClipboardCheck className="h-5 w-5 shrink-0" />
                      <span>Xem lại và hoàn tất</span>
                    </motion.button>

                    {isReadyForReview && !isHydratingGuest && !guestRsvpLocked ? (
                      <span className="rsvp-review-tap-guide" aria-hidden="true">
                        <span className="rsvp-tap-guide-ripple" />
                        <Image
                          className="rsvp-tap-guide-image"
                          src="/assets/wedding/ui/rsvp/tap-hand-neutral.webp"
                          alt=""
                          width={160}
                          height={160}
                          sizes="72px"
                          unoptimized
                          draggable={false}
                        />
                      </span>
                    ) : null}
                  </div>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="flex flex-col w-full">
              {/* Hero */}
              <aside className="mx-auto max-w-2xl text-center mb-8 px-4">
                <h1 className="wedding-type-title text-[#252934]">
                  Lời hồi đáp
                </h1>
              </aside>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!guestRsvpLocked) {
                    void (isRegularGuestFlow ? handleRegularGuestContinue() : handleGoToReview());
                  }
                }}
                onInputCapture={markFormAsEdited}
                onChangeCapture={markFormAsEdited}
                className="w-full px-4 sm:px-8 text-center"
              >
                {submitError ? (
                  <p className={`${rsvpAlertTextClass} mb-6 rounded-2xl border border-[#B4232F]/20 bg-white/60 px-4 py-3`}>
                    {submitError}
                  </p>
                ) : null}

                {/* Khối Thánh lễ và tiệc sau Thánh lễ */}
                {eventAccess.canViewCeremony ? (
                <div className="rsvp-paper-card mb-6 grid gap-1 rounded-[1.6rem] p-4 text-center sm:gap-2 sm:p-8">
                  
                  {/* Sự kiện 1: Thánh lễ */}
                  <div
                    data-rsvp-event-row="ceremony"
                    className="flex flex-col items-center gap-2 py-2 text-center sm:grid sm:grid-cols-[4rem_minmax(0,1fr)_11.5rem] sm:items-center sm:gap-x-6 sm:gap-y-0 sm:py-6 sm:text-left"
                  >
                    {/* Badge */}
                    <div
                      data-rsvp-event-icon="true"
                      className="mb-1.5 flex h-13 w-13 shrink-0 items-center justify-center rounded-[1.2rem] border border-[#f2e5e0] bg-white shadow-[0_8px_20px_rgba(242,229,224,0.5)] sm:mb-0 sm:h-16 sm:w-16 sm:rounded-[1.6rem]"
                    >
                      <Church
                        aria-hidden="true"
                        className="h-8 w-8 text-[#8f5d5d] sm:h-10 sm:w-10"
                        strokeWidth={1.35}
                      />
                    </div>
                    
                    {/* Chữ */}
                    <div data-rsvp-event-copy="true" className="mb-2 min-w-0 text-center sm:mb-0 sm:text-left">
                      <p className="whitespace-nowrap text-lg sm:text-base font-bold tracking-[0.12em] text-[#7a6a5d] uppercase mb-1 leading-snug">
                        THÁNH LỄ HÔN PHỐI
                      </p>
                      <p className="mb-0.5 text-sm font-semibold leading-relaxed text-[#252934] sm:whitespace-nowrap">
                        {churchReviewDateLine}
                      </p>
                      <p className="text-sm sm:text-sm text-[#252934]/72 leading-relaxed">
                        <span className="whitespace-nowrap">Nhà Thờ Giáo Xứ Tam Hải</span>
                      </p>
                    </div>

                    {/* Segmented Pill */}
                    <div
                      data-rsvp-event-response="true"
                      className="flex w-[11.5rem] shrink-0 flex-col items-center gap-1 self-center sm:gap-1.5"
                    >
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[#7a6a5d] uppercase">
                        Tham dự:
                      </span>
                      <div className="flex h-11 w-full shrink-0 items-center rounded-full bg-white/80 p-1 ring-1 ring-serenity/30 shadow-[0_4px_14px_rgba(63,70,66,0.08)]">
                        <button
                          type="button"
                          aria-pressed={formValues.attendingCeremony === "yes"}
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors("attendingCeremony");
                            setValue("attendingCeremony", "yes", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full basis-1/2 whitespace-nowrap rounded-full px-0 text-sm font-semibold transition-all duration-200",
                            formValues.attendingCeremony === "yes"
                              ? "bg-[#7a8a5c] text-white shadow-sm"
                              : "text-[#252934] hover:bg-[#252934]/5"
                          ].join(" ")}
                        >
                          Có
                        </button>
                        <button
                          type="button"
                          aria-pressed={formValues.attendingCeremony === "no"}
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors(["attendingCeremony", "attendingPostCeremonyParty"]);
                            setValue("attendingCeremony", "no", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full basis-1/2 whitespace-nowrap rounded-full px-0 text-sm font-semibold transition-all duration-200",
                            formValues.attendingCeremony === "no"
                              ? "bg-[#7a4a4a] text-white shadow-sm"
                              : "text-[#252934] hover:bg-[#252934]/5"
                          ].join(" ")}
                        >
                          Không
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {postCeremonyPartyInvited && shouldAskPostCeremonyParty ? (
                      <motion.div
                        key="post-ceremony-party-question"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="mt-3 w-full border-t border-[#d7c6a8]/48 bg-[#fffaf2]/32 px-2 pb-1 pt-5 sm:px-0 sm:pb-2 sm:pt-6"
                      >
                        <div
                          data-rsvp-event-row="intimate-party"
                          className="flex flex-col items-center gap-3 sm:grid sm:grid-cols-[4rem_minmax(0,1fr)_11.5rem] sm:items-center sm:gap-x-6 sm:gap-y-0"
                        >
                          <div
                            data-rsvp-event-icon="true"
                            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[1.2rem] border border-[#f2e5e0] bg-white shadow-[0_6px_16px_rgba(242,229,224,0.45)] sm:h-16 sm:w-16 sm:rounded-[1.6rem]"
                          >
                            <Image
                              data-rsvp-intimate-party-icon="true"
                              src="/assets/wedding/ui/rsvp/intimate-party-cloche-v2.png"
                              alt=""
                              aria-hidden="true"
                              width={40}
                              height={40}
                              className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                            />
                          </div>
                          <div data-rsvp-event-copy="true" className="min-w-0 text-center sm:text-left">
                            <p className="whitespace-nowrap text-sm font-bold uppercase leading-snug tracking-[0.12em] text-[#7a6a5d] sm:text-base">
                              Tiệc thân mật
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-relaxed text-[#252934] sm:whitespace-nowrap">
                              {postCeremonyDateLine}
                            </p>
                            <PostCeremonyVenue compact />
                          </div>
                          <div
                            data-rsvp-event-response="true"
                            className="flex w-[11.5rem] shrink-0 flex-col items-center gap-1 sm:gap-1.5"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a6a5d]">
                              Tham dự:
                            </span>
                            <div className="flex h-11 w-full items-center rounded-full bg-white/80 p-1 ring-1 ring-serenity/30 shadow-[0_4px_14px_rgba(63,70,66,0.08)]">
                              <button
                                type="button"
                                aria-pressed={formValues.attendingPostCeremonyParty === "yes"}
                                onClick={() => {
                                  markFormAsEdited();
                                  clearErrors("attendingPostCeremonyParty");
                                  setValue("attendingPostCeremonyParty", "yes", { shouldDirty: true, shouldValidate: true });
                                }}
                                className={[
                                  "h-full basis-1/2 whitespace-nowrap rounded-full px-0 text-sm font-semibold transition-all duration-200",
                                  formValues.attendingPostCeremonyParty === "yes"
                                    ? "bg-[#7a8a5c] text-white shadow-sm"
                                    : "text-[#252934] hover:bg-[#252934]/5",
                                ].join(" ")}
                              >
                                Có
                              </button>
                              <button
                                type="button"
                                aria-pressed={formValues.attendingPostCeremonyParty === "no"}
                                onClick={() => {
                                  markFormAsEdited();
                                  clearErrors("attendingPostCeremonyParty");
                                  setValue("attendingPostCeremonyParty", "no", { shouldDirty: true, shouldValidate: true });
                                }}
                                className={[
                                  "h-full basis-1/2 whitespace-nowrap rounded-full px-0 text-sm font-semibold transition-all duration-200",
                                  formValues.attendingPostCeremonyParty === "no"
                                    ? "bg-[#7a4a4a] text-white shadow-sm"
                                    : "text-[#252934] hover:bg-[#252934]/5",
                                ].join(" ")}
                              >
                                Không
                              </button>
                            </div>
                          </div>
                        </div>
                        {errors.attendingPostCeremonyParty ? (
                          <p
                            role="alert"
                            tabIndex={-1}
                            data-rsvp-error="true"
                            className={`${rsvpAlertTextClass} mt-2 text-center`}
                          >
                            {errors.attendingPostCeremonyParty.message}
                          </p>
                        ) : null}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {errors.attendingCeremony && (
                    <p
                      role="alert"
                      tabIndex={-1}
                      data-rsvp-error="true"
                      className={`${rsvpAlertTextClass} mt-2 text-center`}
                    >
                      {errors.attendingCeremony.message}
                    </p>
                  )}
                </div>
                ) : null}

                {/* Khối Tiệc cưới và lưu trú */}
                <motion.div
                  layout
                  transition={{ layout: { duration: 0.28, ease: "easeOut" } }}
                  className="rsvp-paper-card mb-6 grid gap-1 rounded-[1.6rem] p-4 text-center sm:gap-2 sm:p-8"
                >
                  {/* Sự kiện 2: Tiệc cưới */}
                  <div
                    data-rsvp-event-row="banquet"
                    className="flex flex-col items-center gap-2 py-2 text-center sm:grid sm:grid-cols-[4rem_minmax(0,1fr)_11.5rem] sm:items-center sm:gap-x-6 sm:gap-y-0 sm:py-6 sm:text-left"
                  >
                    {/* Badge */}
                    <div
                      data-rsvp-event-icon="true"
                      className="mb-1.5 flex h-13 w-13 shrink-0 items-center justify-center rounded-[1.2rem] border border-[#f2e5e0] bg-white shadow-[0_8px_20px_rgba(242,229,224,0.5)] sm:mb-0 sm:h-16 sm:w-16 sm:rounded-[1.6rem]"
                    >
                      <Wine
                        aria-hidden="true"
                        className="h-8 w-8 text-[#8f5d5d] sm:h-10 sm:w-10"
                        strokeWidth={1.35}
                      />
                    </div>
                    
                    {/* Chữ */}
                    <div data-rsvp-event-copy="true" className="mb-2 min-w-0 text-center sm:mb-0 sm:text-left">
                      <p className="whitespace-nowrap text-lg sm:text-base font-bold tracking-[0.12em] text-[#7a6a5d] uppercase mb-1 leading-snug">
                        TIỆC CƯỚI
                      </p>
                      <p className="mb-0.5 text-sm font-semibold leading-relaxed text-[#252934] sm:whitespace-nowrap">
                        {banquetReviewDateLine}
                      </p>
                      <p className="text-sm sm:text-sm text-[#252934]/72 leading-relaxed">
                        <span className="whitespace-nowrap">Terracotta Hotel &amp; Resort Đà Lạt</span>
                      </p>
                    </div>

                    {/* Segmented Pill */}
                    <div
                      data-rsvp-event-response="true"
                      className="flex w-[11.5rem] shrink-0 flex-col items-center gap-1 self-center sm:gap-1.5"
                    >
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[#7a6a5d] uppercase">
                        Tham dự:
                      </span>
                      <div className="flex h-11 w-full shrink-0 items-center rounded-full bg-white/80 p-1 ring-1 ring-serenity/30 shadow-[0_4px_14px_rgba(63,70,66,0.08)]">
                        <button
                          type="button"
                          aria-pressed={formValues.attendingBanquet === "yes"}
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors("attendingBanquet");
                            setValue("attendingBanquet", "yes", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full basis-1/2 whitespace-nowrap rounded-full px-0 text-sm font-semibold transition-all duration-200",
                            formValues.attendingBanquet === "yes"
                              ? "bg-[#7a8a5c] text-white shadow-sm"
                              : "text-[#252934] hover:bg-[#252934]/5"
                          ].join(" ")}
                        >
                          Có
                        </button>
                        <button
                          type="button"
                          aria-pressed={formValues.attendingBanquet === "no"}
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors(["attendingBanquet", "stayDecision", "lodgingGuests"]);
                            setValue("attendingBanquet", "no", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full basis-1/2 whitespace-nowrap rounded-full px-0 text-sm font-semibold transition-all duration-200",
                            formValues.attendingBanquet === "no"
                              ? "bg-[#7a4a4a] text-white shadow-sm"
                              : "text-[#252934] hover:bg-[#252934]/5"
                          ].join(" ")}
                        >
                          Không
                        </button>
                      </div>
                    </div>
                  </div>

                  {errors.attendingBanquet && (
                    <p
                      role="alert"
                      tabIndex={-1}
                      data-rsvp-error="true"
                      className={`${rsvpAlertTextClass} mt-2 text-center`}
                    >
                      {errors.attendingBanquet.message}
                    </p>
                  )}

                  {/* Lưu trú - mở ngay trong khối Tiệc cưới */}
                  <AnimatePresence initial={false}>
                    {attendingBanquet === "yes" && canRequestLodging && (
                      <motion.div
                        key="banquet-lodging"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className="mt-2 border-t border-serenity/22 pt-5 text-center sm:mt-4 sm:pt-7"
                      >
                        <div>
                        <p className="text-[0.82rem] sm:text-sm font-bold tracking-[0.15em] text-[#7a6a5d] uppercase mb-2">
                          LƯU TRÚ
                        </p>
                        <p className="text-sm sm:text-base font-normal text-[#252934]/80 mb-5 leading-relaxed max-w-xl mx-auto">
                          {hasGroomFamilyLodgingOptions
                            ? "Gia đình sẽ chuẩn bị phòng tại Resort Terracotta cho Quý khách. Xin Quý khách vui lòng xác nhận nhu cầu nghỉ lại."
                            : "Gia đình sẽ chuẩn bị phòng tại Resort Terracotta cho Quý khách. Vui lòng chọn đêm nghỉ lại."}
                        </p>

                        {/* Chọn đêm lưu trú theo nhóm khách */}
                        <div className={`grid grid-cols-2 gap-3 w-full mb-6 ${hasGroomFamilyLodgingOptions ? "max-w-2xl mx-auto" : "md:grid-cols-4"}`}>
                          {/* Option 25 */}
                          {!hasGroomFamilyLodgingOptions && <button
                            type="button"
                            aria-pressed={stayDecision === "25"}
                            onClick={() => handleStayDecisionChange("25")}
                            className={[
                              "flex flex-col items-center justify-center min-h-[3.6rem] sm:min-h-[4.2rem] rounded-xl border p-2 sm:p-3 text-center transition-all duration-200 cursor-pointer shadow-sm",
                              stayDecision === "25"
                                ? "bg-[#7a8a5c] border-[#7a8a5c] text-white"
                                : "bg-white/80 border-serenity/22 hover:bg-white text-[#252934]"
                            ].join(" ")}
                          >
                            <span className="text-sm sm:text-base font-bold leading-snug">Đêm 25/12</span>
                            <span className={`text-[11px] sm:text-xs mt-0.5 ${stayDecision === "25" ? "text-white/80" : "text-[#252934]/55"}`}>đêm trước tiệc</span>
                          </button>}

                          {/* Option 26 */}
                          <button
                            type="button"
                            aria-pressed={stayDecision === "26"}
                            onClick={() => handleStayDecisionChange("26")}
                            className={[
                              "flex flex-col items-center justify-center min-h-[3.6rem] sm:min-h-[4.2rem] rounded-xl border p-2 sm:p-3 text-center transition-all duration-200 cursor-pointer shadow-sm",
                              stayDecision === "26"
                                ? "bg-[#7a8a5c] border-[#7a8a5c] text-white"
                                : "bg-white/80 border-serenity/22 hover:bg-white text-[#252934]"
                            ].join(" ")}
                          >
                            <span className="text-sm sm:text-base font-bold leading-snug">Đêm 26/12</span>
                            <span className={`text-[11px] sm:text-xs mt-0.5 ${stayDecision === "26" ? "text-white/80" : "text-[#252934]/55"}`}>đêm sau tiệc</span>
                          </button>

                          {/* Option both */}
                          {!hasGroomFamilyLodgingOptions && <button
                            type="button"
                            aria-pressed={stayDecision === "both"}
                            onClick={() => handleStayDecisionChange("both")}
                            className={[
                              "flex flex-col items-center justify-center min-h-[3.6rem] sm:min-h-[4.2rem] rounded-xl border p-2 sm:p-3 text-center transition-all duration-200 cursor-pointer shadow-sm",
                              stayDecision === "both"
                                ? "bg-[#7a8a5c] border-[#7a8a5c] text-white"
                                : "bg-white/80 border-serenity/22 hover:bg-white text-[#252934]"
                            ].join(" ")}
                          >
                            <span className="text-sm sm:text-base font-bold leading-snug">Cả hai đêm</span>
                            <span className={`text-[11px] sm:text-xs mt-0.5 ${stayDecision === "both" ? "text-white/80" : "text-[#252934]/55"}`}>25/12 & 26/12</span>
                          </button>}

                          {/* Option none */}
                          <button
                            type="button"
                            aria-pressed={stayDecision === "none"}
                            onClick={() => handleStayDecisionChange("none")}
                            className={[
                              "flex flex-col items-center justify-center min-h-[3.6rem] sm:min-h-[4.2rem] rounded-xl border p-2 sm:p-3 text-center transition-all duration-200 cursor-pointer shadow-sm",
                              stayDecision === "none"
                                ? "bg-[#887476] border-[#887476] text-white"
                                : "bg-[#fcfaf9]/90 border-rose-quartz/30 hover:bg-[#faf6f3] text-[#252934]/80"
                            ].join(" ")}
                          >
                            <span className="whitespace-nowrap text-[clamp(0.75rem,2.6vw,1rem)] font-bold leading-none">Không nghỉ lại</span>
                          </button>
                        </div>
                        {errors.stayDecision ? (
                          <p
                            role="alert"
                            tabIndex={-1}
                            data-rsvp-error="true"
                            className={`${rsvpAlertTextClass} -mt-3 mb-5 text-center`}
                          >
                            {errors.stayDecision.message}
                          </p>
                        ) : null}

                        {/* List người lưu trú */}
                        <AnimatePresence initial={false}>
                          {stayDecision !== null && stayDecision !== "none" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                              animate={{ height: "auto", opacity: 1, overflow: "visible" }}
                              exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                              transition={{ duration: 0.28, ease: "easeInOut" }}
                              className="mt-6 text-left grid gap-5"
                            >
                              {typeof errors.lodgingGuests?.message === "string" ? (
                                <p
                                  role="alert"
                                  tabIndex={-1}
                                  data-rsvp-error="true"
                                  className={`${rsvpAlertTextClass} text-center`}
                                >
                                  {errors.lodgingGuests.message}
                                </p>
                              ) : null}

                              <div className="grid gap-4">
                                {fields.map((field, index) => {
                                  const isChild = Boolean(watchedLodgingGuests?.[index]?.isChild);
                                  const guestErrors = errors.lodgingGuests?.[index];

                                  return (
                                    <div key={field.id} className="relative rounded-2xl border border-serenity/12 bg-white/45 p-4 text-left shadow-[0_2px_8px_rgba(146,168,209,0.06)]">
                                      {/* Header with Title & Close/Delete Button */}
                                      <div className="mb-3.5 flex items-center justify-between">
                                        <p className="text-sm font-bold tracking-[0.08em] text-[#252934] uppercase">Người lưu trú {index + 1}</p>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            markFormAsEdited();
                                            if (fields.length === 1) {
                                              replace([createLodgingGuest("")]);
                                            } else {
                                              remove(index);
                                            }
                                          }}
                                          className="text-[#7a4a4a]/70 hover:text-[#7a4a4a] transition-colors p-1"
                                          aria-label="Xóa người lưu trú"
                                        >
                                          <X className="h-4.5 w-4.5 stroke-[2.25px]" />
                                        </button>
                                      </div>

                                      {/* Input fields */}
                                      <div className="grid grid-cols-1 gap-3.5">
                                        <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-12 sm:gap-x-3.5">
                                          <label className="grid w-full justify-items-center gap-2 text-center text-sm font-bold text-[#252934]/68 sm:col-span-7 sm:col-start-1 sm:row-start-1">
                                            <span className="text-sm font-bold tracking-wider text-[#252934]/68">Họ tên</span>
                                            <input
                                              data-rsvp-lodging-name-input="true"
                                              className={inputClass}
                                              placeholder="VD: Nguyễn Văn A"
                                              {...register(`lodgingGuests.${index}.fullName`, {
                                                onChange: (event) => {
                                                  if (event.target.value.trim().length >= 2) {
                                                    clearErrors(`lodgingGuests.${index}.fullName`);
                                                  }
                                                },
                                              })}
                                            />
                                          </label>
                                          {guestErrors?.fullName?.message ? (
                                            <span
                                              role="alert"
                                              tabIndex={-1}
                                              data-rsvp-error="true"
                                              className={`${rsvpAlertTextClass} text-center sm:col-span-7 sm:col-start-1 sm:row-start-2`}
                                            >
                                              {guestErrors.fullName.message}
                                            </span>
                                          ) : null}
                                          <label
                                            data-rsvp-lodging-child-toggle="true"
                                            className="flex h-13 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-serenity/18 bg-white/70 px-3 py-2.5 text-xs font-semibold text-[#252934] shadow-sm transition hover:bg-white sm:col-span-5 sm:col-start-8 sm:row-start-1 sm:self-end"
                                          >
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4 rounded text-serenity accent-serenity focus:ring-serenity/30"
                                              {...register(`lodgingGuests.${index}.isChild`, {
                                                onChange: (event) => {
                                                  if (!event.target.checked) {
                                                    clearErrors(`lodgingGuests.${index}.age`);
                                                  }
                                                },
                                              })}
                                            />
                                            <span>Là trẻ em (dưới 11 tuổi)</span>
                                          </label>
                                        </div>

                                        {isChild && (
                                          <div className="w-full">
                                            <Field
                                              label={<span className="text-sm font-bold tracking-wider text-[#252934]/68">Tuổi của bé</span>}
                                              error={guestErrors?.age?.message}
                                            >
                                              <p
                                                id={`lodging-guest-${index}-age-help`}
                                                className="mx-auto max-w-xl text-center text-xs font-normal leading-relaxed text-[#252934]/58 sm:text-sm"
                                              >
                                                Vui lòng điền số tuổi của bé để gia đình sắp xếp phòng và giường phù hợp cho Quý khách
                                              </p>
                                              <input
                                                type="number"
                                                inputMode="numeric"
                                                min={0}
                                                max={10}
                                                step={1}
                                                aria-describedby={`lodging-guest-${index}-age-help`}
                                                onWheel={(e) => e.currentTarget.blur()}
                                                className={`${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                                                placeholder="VD: 5"
                                                {...register(`lodgingGuests.${index}.age`, {
                                                  setValueAs: (value) => value === "" ? undefined : Number(value),
                                                  onChange: (event) => {
                                                    const nextAge = Number(event.target.value);
                                                    if (event.target.value !== "" && Number.isInteger(nextAge) && nextAge >= 0 && nextAge <= 10) {
                                                      clearErrors(`lodgingGuests.${index}.age`);
                                                    }
                                                  },
                                                })}
                                              />
                                            </Field>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="grid justify-items-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    markFormAsEdited();
                                    clearErrors("lodgingGuests");
                                    append(createLodgingGuest(""));
                                  }}
                                  className="wedding-type-button inline-flex min-h-11 items-center gap-2 rounded-full border border-serenity/32 bg-serenity/30 px-6 font-semibold text-[#252934] transition hover:bg-serenity/45"
                                >
                                  <Plus className="h-4 w-4" /> Thêm người lưu trú
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence initial={false}>
                    {attendingBanquet === "yes" && !canRequestLodging && (
                      <motion.div
                        key="guest-count"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className="mt-2 border-t border-serenity/22 pt-5 text-center sm:mt-4 sm:pt-7"
                      >
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a6a5d]">
                          SỐ NGƯỜI THAM DỰ:
                        </p>

                        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-serenity/24 bg-white/82 p-1.5 shadow-[0_6px_18px_rgba(63,70,66,0.08)]">
                          <button
                            type="button"
                            aria-label="Giảm số người tham dự"
                            disabled={selectedGuestCount <= 1}
                            onClick={() => {
                              markFormAsEdited();
                              clearErrors("guestCount");
                              setValue("guestCount", Math.max(1, selectedGuestCount - 1), { shouldDirty: true, shouldValidate: true });
                            }}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#54473b] transition hover:bg-serenity/12 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Minus aria-hidden="true" className="h-5 w-5" />
                          </button>
                          <output
                            aria-live="polite"
                            className="min-w-20 px-2 text-center text-lg font-semibold tabular-nums text-[#252934]"
                          >
                            {Math.max(1, selectedGuestCount)} người
                          </output>
                          <button
                            type="button"
                            aria-label="Tăng số người tham dự"
                            disabled={selectedGuestCount >= 50}
                            onClick={() => {
                              markFormAsEdited();
                              clearErrors("guestCount");
                              setValue("guestCount", Math.min(50, Math.max(1, selectedGuestCount) + 1), { shouldDirty: true, shouldValidate: true });
                            }}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#54473b] transition hover:bg-serenity/12 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Plus aria-hidden="true" className="h-5 w-5" />
                          </button>
                        </div>

                        {errors.guestCount ? (
                          <p
                            role="alert"
                            tabIndex={-1}
                            data-rsvp-error="true"
                            className={`${rsvpAlertTextClass} mt-3 text-center`}
                          >
                            {errors.guestCount.message}
                          </p>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>

                {/* Nút luôn hiện để khách chủ động kiểm tra phần còn thiếu. */}
                <div className="mt-4 flex justify-center">
                  <div className="relative inline-flex max-w-full">
                    <motion.button
                      type="button"
                      onClick={isRegularGuestFlow ? handleRegularGuestContinue : handleGoToReview}
                      disabled={guestRsvpLocked || isHydratingGuest}
                      className="wedding-type-button rsvp-final-cta inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-rose-quartz text-base font-semibold text-[#252934] shadow-[0_12px_32px_rgba(146,168,209,0.18)] ring-1 ring-rose-quartz/70 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a8a5c] focus-visible:ring-offset-2"
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    >
                      {isRegularGuestFlow ? (
                        <>
                          <span>Tiếp tục</span>
                          <ArrowRight className="h-5 w-5 shrink-0" />
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="h-5 w-5 shrink-0" />
                          <span>Xem lại và hoàn tất</span>
                        </>
                      )}
                    </motion.button>

                    {(isRegularGuestFlow ? isReadyForInitialContinue : isReadyForReview)
                      && !isHydratingGuest
                      && !guestRsvpLocked ? (
                      <span className="rsvp-review-tap-guide" aria-hidden="true">
                        <span className="rsvp-tap-guide-ripple" />
                        <Image
                          className="rsvp-tap-guide-image"
                          src="/assets/wedding/ui/rsvp/tap-hand-neutral.webp"
                          alt=""
                          width={160}
                          height={160}
                          sizes="72px"
                          unoptimized
                          draggable={false}
                        />
                      </span>
                    ) : null}
                  </div>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
