"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  ClipboardCheck,
  CircleHelp,
  Mail,
  Minus,
  Plus,
  CalendarDays,
  Church,
  Images,
  Wine,
  X,
} from "lucide-react";
import {
  countLodgingChildren,
  formatLodgingGuestLabel,
  saveRSVPResponse,
  readRSVPResponses,
  removeRSVPResponses,
  type LodgingGuest,
  type RSVPResponse,
} from "@/lib/rsvp-storage";
import { buildInvitationCopy, removeStoredGuestIdentityForToken, resolveGuestIdentity, type GuestIdentity, type InvitationCopy } from "@/lib/guest-personalization";
import { buildRsvpSubmissionCopy } from "@/lib/guest-rsvp-copy";
import { weddingConfig } from "@/config/wedding.config";
import {
  CALENDAR_HANDOFF_HELP_DELAY_MS,
  getCalendarHandoffGuidance,
  type CalendarHandoffGuidance,
} from "@/lib/calendar-handoff";
import { getInviteStatusFromRsvp, readLocalInvitees, upsertLocalInvitees, writeLocalInvitees, type Invitee } from "@/lib/invites";
import { usePageTransition } from "@/components/PageTransitionEffect";
import { CoupleNameText } from "@/components/ui/CoupleNameText";
import { findAnyStoredInviteToken } from "@/lib/guest-personalization";
import { usePublishedSettings } from "@/lib/use-published-settings";
import {
  isFamilyLodgingGuestGroup,
  isGroomFamilyLodgingGuestGroup,
} from "@/lib/rsvp-guest-group";

const rsvpSuccessUtilityVariants: Variants = {
  tucked: {
    opacity: 0,
    transform: "translate3d(0, -2rem, 0)",
  },
  drawn: {
    opacity: 1,
    transform: "translate3d(0, 0, 0)",
    transition: {
      transform: {
        type: "tween",
        duration: 0.58,
        delay: 0.14,
        ease: [0.16, 1, 0.3, 1],
      },
      opacity: {
        type: "tween",
        duration: 0.26,
        delay: 0.14,
        ease: [0.16, 1, 0.3, 1],
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

const lodgingGuestSchema = z.object({
  fullName: z.string().trim().optional(),
  isChild: z.boolean().default(false),
  age: z.number().int().min(0, "Tuổi không hợp lệ.").optional(),
});

const rsvpFormFieldsSchema = z.object({
  honorific: z.string().optional(),
  name: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  attendingCeremony: z.enum(["yes", "no"]).nullable().default(null),
  postCeremonyPartyInvited: z.boolean().default(false),
  attendingPostCeremonyParty: z.enum(["yes", "no"]).nullable().default(null),
  attendingBanquet: z.enum(["yes", "no"]).nullable().default(null),
  attending: z.enum(["yes", "no"]),
  guestCount: z.coerce.number().min(0),
  guestGroup: z.string().trim().optional().default(""),
  stayDecision: z.enum(["25", "26", "both", "none"]).nullable().default(null),
  accommodationNeeded: z.boolean().default(false),
  lodgingGuests: z.array(lodgingGuestSchema).default([]),
  dietaryNote: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const rsvpSchema = rsvpFormFieldsSchema
  .superRefine((data, ctx) => {
    if (!data.attendingCeremony) {
      ctx.addIssue({ code: "custom", path: ["attendingCeremony"], message: "Vui lòng chọn phản hồi cho Thánh lễ Hôn phối." });
    }
    if (!data.attendingBanquet) {
      ctx.addIssue({ code: "custom", path: ["attendingBanquet"], message: "Vui lòng chọn phản hồi cho Tiệc cưới." });
    }
    if (data.postCeremonyPartyInvited && data.attendingCeremony === "yes" && !data.attendingPostCeremonyParty) {
      ctx.addIssue({ code: "custom", path: ["attendingPostCeremonyParty"], message: "Vui lòng chọn phản hồi cho Tiệc thân mật." });
    }
    if (isFamilyLodgingGuestGroup(data.guestGroup) && data.attendingBanquet === "yes" && data.stayDecision === null) {
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
      isFamilyLodgingGuestGroup(data.guestGroup)
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
  });

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
      idNumber: "",
      isChild: Boolean(guest.isChild),
      age: guest.isChild ? age : undefined,
    }];
  });
}

function buildTerracottaNote(guests: LodgingGuest[]) {
  const childCount = countLodgingChildren(guests);

  if (childCount === 0) return "";
  return `${childCount} trẻ em đi cùng đã được ghi nhận.`;
}

function inlineRecipientLabel(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "khách mời";
  if (/^(Ông|Bà|Ông Bà|Bố Mẹ|Ba Mẹ)\b/.test(trimmed)) return trimmed;
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
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
  const publishedSettings = usePublishedSettings();
  const runtimeConfig = publishedSettings.content;
  const churchDateLine = formatRsvpEventDate(runtimeConfig.eventDetailsConfig.content.churchDate, runtimeConfig.eventDetailsConfig.content.churchTime);
  const churchReviewDateLine = formatRsvpEventDate(runtimeConfig.eventDetailsConfig.content.churchDate, runtimeConfig.eventDetailsConfig.content.churchTime, "—");
  const banquetDateLine = formatRsvpEventDate(runtimeConfig.event.dateLabel, runtimeConfig.event.welcomeTime);
  const banquetReviewDateLine = formatRsvpEventDate(runtimeConfig.event.dateLabel, runtimeConfig.event.welcomeTime, "—");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
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
      phone: "",
      attendingCeremony: null,
      postCeremonyPartyInvited: false,
      attendingPostCeremonyParty: null,
      attendingBanquet: null,
      attending: "yes",
      guestCount: 1,
      guestGroup: "",
      stayDecision: null,
      accommodationNeeded: false,
      lodgingGuests: [],
      dietaryNote: "",
      notes: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "lodgingGuests" });
  const attending = useWatch({ control, name: "attending" });
  const attendingCeremony = useWatch({ control, name: "attendingCeremony" });
  const postCeremonyPartyInvited = useWatch({ control, name: "postCeremonyPartyInvited" });
  const attendingPostCeremonyParty = useWatch({ control, name: "attendingPostCeremonyParty" });
  const attendingBanquet = useWatch({ control, name: "attendingBanquet" });
  const guestCount = useWatch({ control, name: "guestCount" });
  const selectedGuestCount = Math.max(0, Number(guestCount) || 0);
  const accommodationNeeded = useWatch({ control, name: "accommodationNeeded" });
  const stayDecision = useWatch({ control, name: "stayDecision" });
  const watchedLodgingGuests = useWatch({ control, name: "lodgingGuests" });
  const formValues = useWatch({ control }) as RSVPFormInput;
  const returnHref = inviteToken ? `/i/${encodeURIComponent(inviteToken)}?view=main` : "/?view=main";

  const inviteCopy = useMemo(() => buildInvitationCopy(inviteeContext ?? guestIdentity), [guestIdentity, inviteeContext]);
  const submissionCopy = useMemo(() => buildSubmissionCopy(attending, attendingCeremony, attendingBanquet, inviteCopy, inviteeContext ?? guestIdentity), [attending, attendingCeremony, attendingBanquet, inviteCopy, guestIdentity, inviteeContext]);
  const lodgingGuests = normalizeLodgingGuests((watchedLodgingGuests ?? []) as Array<Partial<LodgingGuestForm> | undefined>);
  const terracottaNote = buildTerracottaNote(lodgingGuests);
  const activeGuestGroup = formValues.guestGroup?.trim() || inviteeContext?.guestGroup || guestIdentity.group || "";
  const canRequestLodging = isFamilyLodgingGuestGroup(activeGuestGroup);
  const hasGroomFamilyLodgingOptions = isGroomFamilyLodgingGuestGroup(activeGuestGroup);
  const canRegisterStay = attending !== "no";
  const shouldAskPostCeremonyParty = postCeremonyPartyInvited && attendingCeremony === "yes";
  const isReadyForReview = rsvpSchema.safeParse({
    ...getValues(),
    attending,
    attendingCeremony,
    postCeremonyPartyInvited,
    attendingPostCeremonyParty,
    attendingBanquet,
    guestCount: selectedGuestCount,
    guestGroup: activeGuestGroup,
    stayDecision,
    accommodationNeeded,
    lodgingGuests: watchedLodgingGuests ?? [],
  }).success;
  useEffect(() => {
    const activeToken = inviteToken || inviteeContext?.token || "";
    if (isHydratingGuest || !hasUserEditedFormRef.current || !activeToken) return;
    writeRsvpDraft(activeToken, formValues);
  }, [formValues, inviteToken, inviteeContext?.token, isHydratingGuest]);

  useEffect(() => {
    if (isSubmitted) {
      hasUserEditedFormRef.current = false;
    }
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

  function handleCalendarHandoffAttempt() {
    calendarHandoffCleanupRef.current?.();
    setCalendarHandoffHelp(null);

    const guidance = getCalendarHandoffGuidance({
      userAgent: window.navigator.userAgent || "",
      platform: window.navigator.platform,
      maxTouchPoints: window.navigator.maxTouchPoints,
    });

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
      if (hasUserEditedFormRef.current) return;
      setValue("name", response?.name ?? invitee.displayLabel, { shouldDirty: false });
      setValue("phone", response?.phone ?? invitee.phone, { shouldDirty: false });
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
      setValue("dietaryNote", response?.dietaryNote ?? "", { shouldDirty: false });
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
      setValue("notes", response?.notes ?? "", { shouldDirty: false });
      replace(response?.lodgingGuests?.length
        ? response.lodgingGuests
        : initialStayDecision !== null && initialStayDecision !== "none"
          ? [createLodgingGuest("")]
          : []);
    }

    function applyResponseOnly(response: RSVPResponse) {
      if (cancelled) return;
      if (hasUserEditedFormRef.current) return;
      setValue("name", response.name || "", { shouldDirty: false });
      setValue("phone", response.phone || "", { shouldDirty: false });
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
      setValue("dietaryNote", response.dietaryNote ?? "", { shouldDirty: false });
      
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
      setValue("notes", response.notes ?? "", { shouldDirty: false });
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
      setValue("phone", values.phone ?? "", { shouldDirty: true });
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
      setValue("dietaryNote", values.dietaryNote ?? "", { shouldDirty: true });
      setValue("notes", values.notes ?? "", { shouldDirty: true });
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
    if ((!postCeremonyPartyInvited || attendingCeremony !== "yes") && attendingPostCeremonyParty !== null) {
      setValue("attendingPostCeremonyParty", null, {
        shouldDirty: hasUserEditedFormRef.current,
        shouldValidate: false,
      });
    }

    if (attendingCeremony === "no" && attendingBanquet === "no" && attending !== "no") {
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

    if (attendingCeremony === "yes" || attendingBanquet === "yes") {
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
        append(createLodgingGuest(""));
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
    const isStaying = isFamilyLodgingGuestGroup(resolvedGroup)
      && data.attending === "yes"
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
    const resolvedPhone = data.phone?.trim() || inviteeContext?.phone || "";
    const resolvedGuestCount = data.attending === "no"
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
      phone: resolvedPhone,
      attendingCeremony: data.attendingCeremony === "yes",
      attendingPostCeremonyParty: data.postCeremonyPartyInvited && data.attendingCeremony === "yes"
        ? data.attendingPostCeremonyParty === "yes"
        : undefined,
      attendingBanquet: data.attendingBanquet === "yes",
      attending: data.attending,
      guestCount: resolvedGuestCount,
      guestGroup: resolvedGroup,
      dietaryNote: undefined,
      transportNeeded: false,
      accommodationNeeded: isStaying,
      stayingGuestCount,
      lodgingGuests: cleanLodgingGuests,
      checkInDate,
      checkOutDate,
      roomType: undefined,
      childrenCount,
      elderlySupportNeeded: false,
      notes: undefined,
    };

    try {
      const targetToken = searchToken || inviteToken || inviteeContext?.token || payload.inviteToken;
      const endpoint = targetToken ? `/api/invites/${encodeURIComponent(targetToken)}/rsvp` : "/api/rsvp";
      const apiResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!apiResponse.ok) {
        const result = await apiResponse.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || "Máy chủ chưa ghi nhận được hồi đáp.");
      }

      clearRsvpDraft(targetToken);
      persistLocalRsvp(payload);
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? `Chưa gửi được hồi đáp: ${error.message} Vui lòng thử lại.`
          : "Chưa gửi được hồi đáp. Vui lòng kiểm tra kết nối và thử lại.",
      );
    }
  }

  const handleGoToReview = async () => {
    if (isHydratingGuest) return;
    setSubmitError("");
    const isValid = await trigger();
    if (isValid) {
      setIsReviewing(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // React Hook Form updates the inline error nodes after trigger resolves.
      // Wait for that render, then bring the first exact field requiring input into view.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const firstError = document.querySelector<HTMLElement>('[data-rsvp-error="true"]');
          if (!firstError) return;
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          firstError.focus({ preventScroll: true });
        });
      });
    }
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

  const hasCeremony = formValues.attendingCeremony === "yes";
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
                        onClick={handleCalendarHandoffAttempt}
                        className="wedding-type-button inline-flex h-11 items-center justify-center gap-2 rounded-full border border-serenity/24 bg-white/80 px-6 text-xs sm:text-sm font-bold text-[#252934] transition hover:bg-white hover:shadow-sm min-w-[130px]"
                      >
                        <CalendarDays className="w-4 h-4" /> Thánh lễ
                      </a>
                    )}
                    {hasBanquet && (
                      // Calendar files require a full document navigation so in-app WebViews can hand them to the operating system.
                      <a
                        href={`/calendar/tiec-cuoi${calendarInviteQuery}`}
                        onClick={handleCalendarHandoffAttempt}
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
                      onClick={handleCalendarHandoffAttempt}
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
                    window.scrollTo({ top: 0, behavior: "smooth" });
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
                    <strong className="block text-lg font-semibold text-[#252934] sm:text-xl">
                      {inviteeContext?.displayLabel || guestIdentity.displayLabel || formValues.name || inviteCopy.shortRecipientLabel}
                    </strong>
                    {formValues.phone && (
                      <span className="mt-1 block text-sm font-normal text-[#7a6a5d]">{formValues.phone}</span>
                    )}
                  </div>
                </header>

                <section className="w-full border-t border-serenity/16 py-5 text-center sm:py-6">
                  <h3 className="mb-2 text-base font-semibold text-[#252934] sm:text-lg">Sự kiện</h3>
                  <div className="divide-y divide-serenity/14">
                    <div className="flex flex-col items-center justify-center gap-2 py-4 text-center first:pt-2">
                      <div className="text-center">
                        <p className="text-base font-semibold text-[#252934] sm:text-lg">Thánh lễ Hôn phối</p>
                        <p className="mt-1 text-sm font-normal leading-relaxed text-[#7a6a5d]">{churchDateLine}</p>
                      </div>
                      <ReviewAttendanceStatus attending={formValues.attendingCeremony === "yes"} />
                    </div>

                    {formValues.postCeremonyPartyInvited && formValues.attendingCeremony === "yes" ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                        <div className="text-center">
                          <p className="text-base font-semibold text-[#252934] sm:text-lg">Tiệc thân mật</p>
                          <p className="mt-1 text-sm font-normal leading-relaxed text-[#7a6a5d]">Sau Thánh lễ Hôn phối</p>
                        </div>
                        <ReviewAttendanceStatus attending={formValues.attendingPostCeremonyParty === "yes"} />
                      </div>
                    ) : null}

                    <div className="flex flex-col items-center justify-center gap-2 py-4 text-center last:pb-1">
                      <div className="text-center">
                        <p className="text-base font-semibold text-[#252934] sm:text-lg">Tiệc cưới</p>
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
                <div className="relative w-full max-w-[24rem]">
                  <motion.button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rose-quartz px-6 text-sm font-semibold text-[#252934] shadow-[0_12px_32px_rgba(146,168,209,0.18)] ring-1 ring-rose-quartz/70 transition disabled:opacity-60"
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
                  if (!guestRsvpLocked) handleGoToReview();
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
                <div className="rsvp-paper-card mb-6 grid gap-1 rounded-[1.6rem] p-4 text-center sm:gap-2 sm:p-8">
                  
                  {/* Sự kiện 1: Thánh lễ */}
                  <div className="py-2 sm:py-6 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-6 text-center sm:text-left">
                    {/* Badge */}
                    <div className="flex h-13 w-13 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-[1.2rem] sm:rounded-[1.6rem] bg-white border border-[#f2e5e0] shadow-[0_8px_20px_rgba(242,229,224,0.5)] mb-1.5 sm:mb-0">
                      <Church
                        aria-hidden="true"
                        className="h-8 w-8 text-[#8f5d5d] sm:h-10 sm:w-10"
                        strokeWidth={1.35}
                      />
                    </div>
                    
                    {/* Chữ */}
                    <div className="mb-2 sm:mb-0 sm:ml-5 sm:flex-1 text-center sm:text-left">
                      <p className="text-lg sm:text-base font-bold tracking-[0.12em] text-[#7a6a5d] uppercase mb-1 leading-snug">
                        THÁNH LỄ HÔN PHỐI
                      </p>
                      <p className="text-sm sm:text-sm font-semibold text-[#252934] mb-0.5 leading-relaxed">
                        {churchReviewDateLine}
                      </p>
                      <p className="text-sm sm:text-sm text-[#252934]/72 leading-relaxed">
                        Nhà Thờ Giáo Xứ Tam Hải
                      </p>
                    </div>

                    {/* Segmented Pill */}
                    <div className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 self-center sm:self-auto">
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[#7a6a5d] uppercase">
                        Tham dự:
                      </span>
                      <div className="flex h-11 items-center rounded-full bg-white/80 p-1 ring-1 ring-serenity/30 shadow-[0_4px_14px_rgba(63,70,66,0.08)] shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors("attendingCeremony");
                            setValue("attendingCeremony", "yes", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full px-7 rounded-full text-sm font-semibold transition-all duration-200",
                            formValues.attendingCeremony === "yes"
                              ? "bg-[#7a8a5c] text-white shadow-sm"
                              : "text-[#252934] hover:bg-[#252934]/5"
                          ].join(" ")}
                        >
                          Có
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors(["attendingCeremony", "attendingPostCeremonyParty"]);
                            setValue("attendingCeremony", "no", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full px-7 rounded-full text-sm font-semibold transition-all duration-200",
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
                    {shouldAskPostCeremonyParty ? (
                      <motion.div
                        key="post-ceremony-party-question"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="mx-auto mt-3 w-full max-w-xl border-t border-[#d7c6a8]/48 bg-[#fffaf2]/32 px-2 pb-1 pt-5 sm:px-3 sm:pt-6"
                      >
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                          <div className="text-center sm:text-left">
                            <p className="text-sm font-bold tracking-[0.1em] text-[#7a6a5d] uppercase">
                              Tiệc thân mật
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-[#252934]/72">
                              Kính mời Quý khách dự buổi tiệc chung vui cùng gia đình sau Thánh lễ
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-center gap-1 sm:gap-1.5">
                            <span className="text-[11px] font-bold tracking-[0.14em] text-[#7a6a5d]/75 uppercase">
                              Tham dự:
                            </span>
                            <div className="flex h-11 items-center rounded-full bg-white/90 p-1 ring-1 ring-serenity/30 shadow-[0_4px_14px_rgba(63,70,66,0.08)]">
                              <button
                                type="button"
                                onClick={() => {
                                  markFormAsEdited();
                                  clearErrors("attendingPostCeremonyParty");
                                  setValue("attendingPostCeremonyParty", "yes", { shouldDirty: true, shouldValidate: true });
                                }}
                                className={[
                                  "h-full rounded-full px-6 text-sm font-semibold transition-all duration-200",
                                  formValues.attendingPostCeremonyParty === "yes"
                                    ? "bg-[#7a8a5c] text-white shadow-sm"
                                    : "text-[#252934] hover:bg-[#252934]/5",
                                ].join(" ")}
                              >
                                Có
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  markFormAsEdited();
                                  clearErrors("attendingPostCeremonyParty");
                                  setValue("attendingPostCeremonyParty", "no", { shouldDirty: true, shouldValidate: true });
                                }}
                                className={[
                                  "h-full rounded-full px-6 text-sm font-semibold transition-all duration-200",
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

                {/* Khối Tiệc cưới và lưu trú */}
                <motion.div
                  layout
                  transition={{ layout: { duration: 0.28, ease: "easeOut" } }}
                  className="rsvp-paper-card mb-6 grid gap-1 rounded-[1.6rem] p-4 text-center sm:gap-2 sm:p-8"
                >
                  {/* Sự kiện 2: Tiệc cưới */}
                  <div className="py-2 sm:py-6 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-6 text-center sm:text-left">
                    {/* Badge */}
                    <div className="flex h-13 w-13 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-[1.2rem] sm:rounded-[1.6rem] bg-white border border-[#f2e5e0] shadow-[0_8px_20px_rgba(242,229,224,0.5)] mb-1.5 sm:mb-0">
                      <Wine
                        aria-hidden="true"
                        className="h-8 w-8 text-[#8f5d5d] sm:h-10 sm:w-10"
                        strokeWidth={1.35}
                      />
                    </div>
                    
                    {/* Chữ */}
                    <div className="mb-2 sm:mb-0 sm:ml-5 sm:flex-1 text-center sm:text-left">
                      <p className="text-lg sm:text-base font-bold tracking-[0.12em] text-[#7a6a5d] uppercase mb-1 leading-snug">
                        TIỆC CƯỚI
                      </p>
                      <p className="text-sm sm:text-sm font-semibold text-[#252934] mb-0.5 leading-relaxed">
                        {banquetReviewDateLine}
                      </p>
                      <p className="text-sm sm:text-sm text-[#252934]/72 leading-relaxed">
                        Terracotta Hotel & Resort Đà Lạt
                      </p>
                    </div>

                    {/* Segmented Pill */}
                    <div className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 self-center sm:self-auto">
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[#7a6a5d] uppercase">
                        Tham dự:
                      </span>
                      <div className="flex h-11 items-center rounded-full bg-white/80 p-1 ring-1 ring-serenity/30 shadow-[0_4px_14px_rgba(63,70,66,0.08)] shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors("attendingBanquet");
                            setValue("attendingBanquet", "yes", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full px-7 rounded-full text-sm font-semibold transition-all duration-200",
                            formValues.attendingBanquet === "yes"
                              ? "bg-[#7a8a5c] text-white shadow-sm"
                              : "text-[#252934] hover:bg-[#252934]/5"
                          ].join(" ")}
                        >
                          Có
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            markFormAsEdited();
                            clearErrors(["attendingBanquet", "stayDecision", "lodgingGuests"]);
                            setValue("attendingBanquet", "no", { shouldDirty: true, shouldValidate: true });
                          }}
                          className={[
                            "h-full px-7 rounded-full text-sm font-semibold transition-all duration-200",
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
                                        <div className="grid grid-cols-1 gap-1">
                                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
                                            <div className="sm:col-span-7 w-full">
                                              <Field
                                                label={<span className="text-sm font-bold tracking-wider text-[#252934]/68">Họ tên</span>}
                                                error={guestErrors?.fullName?.message}
                                              >
                                                <input
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
                                              </Field>
                                            </div>
                                            <div className="sm:col-span-5 flex flex-col w-full h-full justify-end">
                                              <span className="text-xs font-bold tracking-wider text-transparent select-none mb-2 hidden sm:block" aria-hidden="true">Spacer</span>
                                              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-serenity/18 bg-white/70 px-3 py-2.5 text-xs font-semibold text-[#252934] transition hover:bg-white shadow-sm w-full justify-center h-13 shrink-0">
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
                                          </div>
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
                  <div className="relative w-full max-w-[24rem]">
                    <motion.button
                      type="button"
                      onClick={handleGoToReview}
                      disabled={guestRsvpLocked || isHydratingGuest}
                      className="wedding-type-button rsvp-final-cta inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-rose-quartz text-base font-semibold text-[#252934] shadow-[0_12px_32px_rgba(146,168,209,0.18)] ring-1 ring-rose-quartz/70 disabled:opacity-60"
                      whileTap={{ scale: 0.98 }}
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
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
