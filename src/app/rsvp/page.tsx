"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Mail,
  Plus,
  Trash2,
  CalendarDays,
  Calendar,
} from "lucide-react";
import { weddingConfig } from "@/config/wedding.config";
import {
  countLodgingChildren,
  formatLodgingGuestLabel,
  saveRSVPResponse,
  type LodgingGuest,
  type RSVPResponse,
} from "@/lib/rsvp-storage";
import { buildInvitationCopy, resolveGuestIdentity, type GuestIdentity, type InvitationCopy } from "@/lib/guest-personalization";
import { getInviteStatusFromRsvp, readLocalInvitees, upsertLocalInvitees, type Invitee } from "@/lib/invites";
import { usePageTransition } from "@/components/PageTransitionEffect";

const lodgingGuestSchema = z
  .object({
    fullName: z.string().trim().min(2, "Nhập họ tên người lưu trú."),
    idNumber: z.string().trim().optional().default(""),
    isChild: z.boolean().default(false),
    age: z.number().int().min(0, "Tuổi không hợp lệ.").optional(),
  })
  .superRefine((guest, ctx) => {
    if (guest.isChild && typeof guest.age !== "number") {
      ctx.addIssue({ code: "custom", path: ["age"], message: "Nhập tuổi của bé để resort sắp xếp phù hợp." });
    }
  });

const rsvpSchema = z
  .object({
    honorific: z.string().optional(),
    name: z.string().trim().optional().default(""),
    phone: z.string().trim().optional().default(""),
    attending: z.enum(["yes", "no"]),
    guestCount: z.coerce.number().min(0),
    guestGroup: z.string().trim().optional().default(""),
    accommodationNeeded: z.boolean().default(false),
    lodgingGuests: z.array(lodgingGuestSchema).default([]),
    dietaryNote: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.attending !== "no" && data.guestCount < 1) {
      ctx.addIssue({ code: "custom", path: ["guestCount"], message: "Nếu tham dự, số người cần từ 1 trở lên." });
    }

    if (data.accommodationNeeded && data.lodgingGuests.length < 1) {
      ctx.addIssue({ code: "custom", path: ["lodgingGuests"], message: "Thêm ít nhất một người lưu trú." });
    }
  });

type RSVPFormInput = z.input<typeof rsvpSchema>;
type RSVPFormOutput = z.output<typeof rsvpSchema>;
type LodgingGuestForm = {
  fullName: string;
  idNumber: string;
  isChild: boolean;
  age?: number;
};

type StepKey = "attendance" | "stay" | "message" | "review";

const allSteps: { key: StepKey; title: string; eyebrow: string }[] = [
  { key: "attendance", title: "Lời hồi đáp", eyebrow: "01" },
  { key: "stay", title: "Đăng ký hỗ trợ lưu trú", eyebrow: "02" },
  { key: "message", title: "Lưu ý thêm", eyebrow: "03" },
  { key: "review", title: "Xem lại và gửi", eyebrow: "04" },
] as const;

const regretSteps: { key: StepKey; title: string; eyebrow: string }[] = [
  { key: "attendance", title: "Lời hồi đáp", eyebrow: "01" },
  { key: "message", title: "Lời nhắn gửi", eyebrow: "02" },
] as const;

const inputClass =
  "min-h-13 w-full rounded-2xl border border-serenity/22 bg-white/68 px-4 text-base text-center text-[#252934] outline-none transition placeholder:text-[#252934]/36 focus:border-serenity focus:bg-white/86 focus:ring-4 focus:ring-serenity/18";

const terracottaPolicy = [
  "Bé dưới 5 tuổi: chỉ cần ghi họ tên.",
  "Bé từ 5 đến dưới 11 tuổi: ghi họ tên và tuổi.",
  "Bé từ 11 tuổi trở lên: khai như người lớn.",
  "Nếu cần nôi em bé, ghi ở phần lưu ý.",
];

function createLodgingGuest(fullName = ""): LodgingGuestForm {
  return {
    fullName,
    idNumber: "",
    isChild: false,
    age: undefined,
  };
}

function normalizeLodgingGuests(guests: Array<Partial<LodgingGuestForm> | undefined> | undefined): LodgingGuest[] {
  return (guests ?? []).flatMap((guest) => {
    if (!guest) return [];
    const fullName = guest.fullName?.trim() ?? "";
    if (!fullName) return [];
    const age = typeof guest.age === "number" && Number.isFinite(guest.age) ? guest.age : undefined;

    return [{
      fullName,
      idNumber: guest.idNumber?.trim() ?? "",
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
    <label className="grid justify-items-center gap-2 text-center text-sm font-bold text-[#252934]/68">
      {label}
      {children}
      {error ? <span className="text-xs font-bold text-[#9B4E5C]">{error}</span> : null}
    </label>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={[
        "grid h-8 w-8 place-items-center rounded-full border text-xs font-black transition",
        active ? "border-rose-quartz bg-rose-quartz text-[#252934]" : done ? "border-serenity bg-serenity text-[#252934]" : "border-serenity/24 text-[#252934]/42",
      ].join(" ")}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : label}
    </span>
  );
}

function ReviewLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-1 border-b border-serenity/14 py-3 text-center last:border-b-0">
      <p className="wedding-type-meta text-[#252934]/40">{label}</p>
      <p className="wedding-type-body max-w-[26rem] font-semibold text-[#252934]/76">{value}</p>
    </div>
  );
}

function resolveStepFromErrors(errors: FieldErrors<RSVPFormInput>, attending: RSVPFormInput["attending"]): StepKey {
  if (errors.attending || errors.honorific) return "attendance";
  if (attending === "no") return "message";
  if (errors.accommodationNeeded || errors.lodgingGuests) return "stay";
  if (errors.dietaryNote || errors.notes) return "message";
  return "review";
}

function getVisibleSteps(attending: RSVPFormInput["attending"]) {
  return attending === "no" ? regretSteps : allSteps;
}

function buildSubmissionCopy(attending: RSVPFormInput["attending"], inviteCopy: InvitationCopy) {
  if (attending === "no") {
    return {
      title: "Đã ghi nhận vắng mặt",
      body: `${inviteCopy.rsvpReceivedLine}. Hẹn gặp ${inviteCopy.shortRecipientLabel} trong thời gian sớm nhất. Nếu lịch thay đổi, link này vẫn có thể cập nhật hồi đáp.`,
      showCalendar: false,
    };
  }

  return {
    title: "Đã ghi nhận tham dự",
    body: `Lời hồi đáp đã được gửi thành công. ${inviteCopy.closingLine}`,
    showCalendar: true,
  };
}

function normalizeAttendanceForForm(value: RSVPResponse["attending"] | undefined): RSVPFormInput["attending"] {
  return value === "no" ? "no" : "yes";
}

export default function RSVPPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity>({});
  const [inviteeContext, setInviteeContext] = useState<Invitee | null>(null);
  const [inviteToken, setInviteToken] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isHydratingGuest, setIsHydratingGuest] = useState(true);
  const { navigateWithTransition } = usePageTransition();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RSVPFormInput, unknown, RSVPFormOutput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      honorific: "",
      name: "",
      phone: "",
      attending: "yes",
      guestCount: 1,
      guestGroup: "",
      accommodationNeeded: false,
      lodgingGuests: [],
      dietaryNote: "",
      notes: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "lodgingGuests" });
  const attending = useWatch({ control, name: "attending" });
  const guestCount = useWatch({ control, name: "guestCount" });
  const accommodationNeeded = useWatch({ control, name: "accommodationNeeded" });
  const watchedLodgingGuests = useWatch({ control, name: "lodgingGuests" });
  const formValues = useWatch({ control }) as RSVPFormInput;
  const visibleSteps = useMemo(() => getVisibleSteps(attending), [attending]);
  const stepIndex = Math.min(step, visibleSteps.length - 1);
  const currentStep = visibleSteps[stepIndex] ?? visibleSteps[0];
  const progress = useMemo(() => `${Math.round(((stepIndex + 1) / visibleSteps.length) * 100)}%`, [stepIndex, visibleSteps.length]);
  const returnHref = inviteToken ? `/i/${encodeURIComponent(inviteToken)}` : "/";
  const inviteCopy = useMemo(() => buildInvitationCopy(inviteeContext ?? guestIdentity), [guestIdentity, inviteeContext]);
  const submissionCopy = useMemo(() => buildSubmissionCopy(attending, inviteCopy), [attending, inviteCopy]);
  const storedInsideInviteLine = inviteeContext?.insideInviteLine ?? "";
  const staleHostSubjects = ["Gia đình chúng tôi", "Gia đình anh chị", "Gia đình chúng con", "Anh chị", "Cô chú", "Em"]
    .filter((subject) => subject !== inviteCopy.hostSubject);
  const shouldUseComputedInsideInviteLine = storedInsideInviteLine.includes("vợ/chồng")
    || (inviteCopy.insideInviteLine.includes("hai em") && storedInsideInviteLine.includes("hai cháu"))
    || staleHostSubjects.some((subject) => storedInsideInviteLine.includes(`${subject} trân trọng kính mời`));
  const displayedInsideInviteLine = isHydratingGuest
    ? "Đang tải lời mời..."
    : shouldUseComputedInsideInviteLine
      ? inviteCopy.insideInviteLine
      : storedInsideInviteLine || inviteCopy.insideInviteLine;
  const displayedClosingLine = isHydratingGuest ? "Thông tin riêng của khách mời sẽ hiện trong giây lát." : inviteCopy.closingLine;
  const rsvpRecipientLabel = isHydratingGuest ? "khách mời" : inlineRecipientLabel(inviteCopy.shortRecipientLabel);
  const lodgingGuests = normalizeLodgingGuests((watchedLodgingGuests ?? []) as Array<Partial<LodgingGuestForm> | undefined>);
  const terracottaNote = buildTerracottaNote(lodgingGuests);
  const canRegisterStay = attending !== "no";

  useEffect(() => {
    let cancelled = false;

    function finishHydration() {
      if (!cancelled) setIsHydratingGuest(false);
    }

    function applyIdentity(identity: GuestIdentity) {
      if (cancelled) return;
      setGuestIdentity(identity);
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
        invitationName: invitee.invitationName,
        relationship: invitee.relationship,
        invitedBy: invitee.invitedBy,
        hostRelationship: invitee.hostRelationship,
        hostPronoun: invitee.hostPronoun,
        coupleReference: invitee.coupleReference,
      };

      applyIdentity(identity);
      setInviteeContext(invitee);
      setValue("name", response?.name ?? invitee.displayLabel, { shouldDirty: false });
      setValue("phone", response?.phone ?? invitee.phone, { shouldDirty: false });
      setValue("guestGroup", response?.guestGroup ?? invitee.guestGroup, { shouldDirty: false });
      setValue("guestCount", response?.guestCount ?? invitee.expectedGuestCount, { shouldDirty: false });
      setValue("attending", normalizeAttendanceForForm(response?.attending), { shouldDirty: false });
      setValue("dietaryNote", response?.dietaryNote ?? "", { shouldDirty: false });
      setValue("accommodationNeeded", response?.accommodationNeeded ?? false, { shouldDirty: false });
      setValue("notes", response?.notes ?? "", { shouldDirty: false });
      replace(response?.lodgingGuests?.length
        ? response.lodgingGuests
        : response?.accommodationNeeded
          ? [createLodgingGuest("")]
          : []);
    }

    async function hydrateGuest() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("invite") ?? params.get("token") ?? "";

      if (token) {
        setInviteToken(token);

        const localInvitee = readLocalInvitees().find((invitee) => invitee.token === token);
        if (localInvitee) {
          applyInvite(localInvitee);
          finishHydration();
          return;
        }

        try {
          const response = await fetch(`/api/invites/${encodeURIComponent(token)}`);
          if (response.ok) {
            const result = await response.json() as { invitee?: Invitee };
            if (result.invitee && !cancelled) {
              applyInvite(result.invitee);
              finishHydration();
              return;
            }
          }
        } catch {
          // Local fallback below.
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

  function toggleAccommodation(nextValue: boolean) {
    if (!canRegisterStay) return;
    setValue("accommodationNeeded", nextValue, { shouldDirty: true });
    if (!nextValue) {
      replace([]);
      return;
    }

    if ((getValues("lodgingGuests") ?? []).length === 0) {
      append(createLodgingGuest(""));
    }
  }

  function goToStep(nextStep: number) {
    window.setTimeout(() => setStep(Math.max(0, Math.min(nextStep, visibleSteps.length - 1))), 0);
  }

  function goToStepByKey(stepKey: StepKey) {
    const index = visibleSteps.findIndex((item) => item.key === stepKey);
    goToStep(index < 0 ? 0 : index);
  }

  async function goNextStep() {
    setSubmitError("");

    if (currentStep.key === "attendance") {
      const isValid = await trigger(["attending", "guestCount"], { shouldFocus: true });
      if (!isValid) {
        setSubmitError("Vui lòng chọn phản hồi trước khi tiếp tục.");
        return;
      }
    }

    if (currentStep.key === "stay") {
      const isValid = await trigger(["accommodationNeeded", "lodgingGuests"], { shouldFocus: true });
      if (!isValid) {
        setSubmitError("Vui lòng điền đủ thông tin lưu trú bắt buộc trước khi tiếp tục.");
        return;
      }
    }

    if (currentStep.key === "message") {
      const isValid = await trigger(["dietaryNote", "notes"], { shouldFocus: true });
      if (!isValid) {
        setSubmitError("Vui lòng kiểm tra lại phần lời nhắn trước khi tiếp tục.");
        return;
      }
    }

    goToStep(Math.min(visibleSteps.length - 1, stepIndex + 1));
  }

  function persistLocalRsvp(payload: Omit<RSVPResponse, "id" | "submittedAt">) {
    const localResponse = saveRSVPResponse(payload);
    if (inviteeContext) {
      const updatedInvitee: Invitee = {
        ...inviteeContext,
        rsvp: localResponse,
        inviteStatus: getInviteStatusFromRsvp(payload.attending),
        updatedAt: new Date().toISOString(),
      };
      upsertLocalInvitees([updatedInvitee]);
      setInviteeContext(updatedInvitee);
    }
    return localResponse;
  }

  function redirectToInvitePage(token?: string, hash: string = "") {
    const target = token ? `/i/${encodeURIComponent(token)}${hash}` : `/${hash}`;
    navigateWithTransition(target);
  }

  async function onSubmit(data: RSVPFormOutput) {
    setSubmitError("");
    const cleanLodgingGuests = data.attending === "no" || !data.accommodationNeeded
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
    const resolvedGroup = data.guestGroup?.trim() || inviteeContext?.guestGroup || guestIdentity.group || "Khác";
    const resolvedGuestCount = data.attending === "no" ? 0 : Math.max(1, data.guestCount || inviteeContext?.expectedGuestCount || 1);

    const payload: Omit<RSVPResponse, "id" | "submittedAt"> = {
      inviteeId: inviteeContext?.id,
      inviteToken: inviteeContext?.token ?? (inviteToken || searchToken || undefined),
      displayLabel: inviteeContext?.displayLabel ?? guestIdentity.displayLabel,
      name: resolvedName,
      phone: resolvedPhone,
      attending: data.attending,
      guestCount: resolvedGuestCount,
      guestGroup: resolvedGroup,
      dietaryNote: data.dietaryNote?.trim() || undefined,
      transportNeeded: false,
      accommodationNeeded: data.attending !== "no" && data.accommodationNeeded,
      stayingGuestCount,
      lodgingGuests: cleanLodgingGuests,
      checkInDate: undefined,
      checkOutDate: undefined,
      roomType: undefined,
      childrenCount,
      elderlySupportNeeded: false,
      notes: data.notes?.trim() || undefined,
    };

    try {
      const endpoint = searchToken ? `/api/invites/${encodeURIComponent(searchToken)}/rsvp` : "/api/rsvp";
      const apiResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (apiResponse.ok) {
        persistLocalRsvp(payload);
        setIsSubmitted(true);
        return;
      }
    } catch {
      // Local fallback keeps RSVP usable without a backend.
    }

    persistLocalRsvp(payload);
    setIsSubmitted(true);
  }

  const calTitle = `Lễ cưới ${weddingConfig.couple.displayName}`;
  const calLocation = weddingConfig.venue.address;
  const calDesc = `Lễ cưới của ${weddingConfig.couple.displayName}.`;
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calTitle)}&dates=20261226T103000Z/20261226T140000Z&details=${encodeURIComponent(calDesc)}&location=${encodeURIComponent(calLocation)}`;

  const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Wedding//EN\nBEGIN:VEVENT\nDTSTART:20261226T103000Z\nDTEND:20261226T140000Z\nSUMMARY:${calTitle}\nLOCATION:${calLocation}\nDESCRIPTION:${calDesc}\nEND:VEVENT\nEND:VCALENDAR`;
  const icsUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;

  return (
    <main className="public-invitation-page rsvp-page cinematic-stage relative min-h-screen bg-transparent px-5 py-6 text-center text-[#252934] sm:py-10">
      <div aria-hidden="true" className="aurora-wash -z-10 opacity-60" />
      <div aria-hidden="true" className="film-grain-soft -z-10" />
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigateWithTransition(returnHref)}
          className="wedding-type-button inline-flex items-center gap-2 text-[#252934]/62 transition hover:text-[#252934]"
        >
          <ArrowLeft className="h-4 w-4" /> Về trang thiệp
        </button>

        <section className="glass-panel mt-6 w-full overflow-hidden rounded-[2rem] text-center">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="py-16 px-6 text-center flex flex-col items-center"
            >
              <div className="flex justify-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-serenity/20 rounded-full flex items-center justify-center"
                >
                  <svg className="w-12 h-12 text-serenity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              </div>
              <p className="section-kicker-dark wedding-type-kicker text-serenity">Hoàn tất</p>
              <h2 className="wedding-type-title mt-4 text-[#252934]">{submissionCopy.title}</h2>
              <p className="wedding-type-body mt-4 max-w-lg mx-auto text-[#252934]/62">
                {submissionCopy.body}
              </p>

              {submissionCopy.showCalendar ? (
                <div className="mt-10 grid gap-4 w-full max-w-md">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const isApple = /iPad|iPhone|iPod|Mac/i.test(navigator.userAgent);
                        if (isApple) {
                          const link = document.createElement("a");
                          link.href = icsUrl;
                          link.download = "wedding-nhat-phuong.ics";
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } else {
                          window.open(gcalUrl, "_blank");
                        }
                      }}
                      className="wedding-type-button inline-flex h-12 items-center justify-center gap-2 rounded-full border border-serenity/30 bg-white/80 px-8 font-semibold text-[#252934] transition hover:bg-white hover:shadow-sm"
                    >
                      <CalendarDays className="w-4 h-4" /> THÊM VÀO LỊCH
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-12">
                <button
                  type="button"
                  onClick={() => redirectToInvitePage(inviteToken, attending === "yes" || attending === "no" ? "#thank-you" : "")}
                  className="light-sweep wedding-type-button inline-flex min-h-12 items-center justify-center rounded-full bg-rose-quartz px-8 text-[#252934] shadow-[0_16px_48px_rgba(146,168,209,0.22)] ring-1 ring-rose-quartz/70 transition hover:-translate-y-0.5"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Về trang thiệp
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid min-w-0 lg:grid-cols-[0.86fr_1.14fr]">
              <aside className="min-w-0 border-b border-serenity/20 p-6 text-center sm:p-8 lg:border-b-0 lg:border-r">
              <p className="section-kicker-dark wedding-type-kicker text-serenity">Xác nhận lời mời</p>
              <h1 className="wedding-type-title mt-5 break-words text-[#252934]">Lời hồi đáp</h1>

              <div className="mt-8 h-2 overflow-hidden rounded-full bg-serenity/16 shadow-inner">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-rose-quartz to-serenity" animate={{ width: progress }} />
              </div>
              <div className="mt-5 flex justify-center gap-3">
                {visibleSteps.map((item, index) => (
                  <StepDot key={item.key} active={stepIndex === index} done={stepIndex > index} label={item.eyebrow} />
                ))}
              </div>

              <div className="wedding-type-body mt-10 rounded-[1.4rem] border border-serenity/22 bg-white/58 p-5 text-[#252934]/62">
                {currentStep.key === "review"
                  ? `Đọc lại toàn bộ thông tin trước khi gửi. Sau khi gửi, gia đình sẽ dựa vào phản hồi này để làm việc với nhà hàng và Terracotta.`
                  : currentStep.key === "stay"
                    ? `Để tiện chung vui, gia đình có chuẩn bị phòng nghỉ tại Terracotta. Vui lòng chọn bên dưới nếu ${rsvpRecipientLabel} cần hỗ trợ giữ phòng nhé.`
                    : currentStep.key === "message"
                      ? "Nếu muốn để lại đôi dòng nhắn gửi, đây là chỗ phù hợp."
                      : isHydratingGuest
                        ? "Đang tải thông tin lời mời riêng của khách."
                        : `Vui lòng phản hồi bên dưới để gia đình chuẩn bị đón tiếp ${rsvpRecipientLabel} được chu đáo nhất.`}
              </div>
            </aside>

            <form
              onSubmit={handleSubmit(onSubmit, (errors) => {
                setSubmitError("Có vài mục cần bổ sung. Vui lòng kiểm tra lại phần được đánh dấu.");
                goToStepByKey(resolveStepFromErrors(errors, attending));
              })}
              className="min-w-0 p-6 text-center sm:p-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.key}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.24 }}
                >
                  {submitError ? <p className="mt-3 rounded-2xl border border-serenity/18 bg-white/60 px-4 py-3 text-sm font-semibold text-[#9B4E5C]">{submitError}</p> : null}

                  {currentStep.key === "attendance" ? (
                    <div className="mt-8 grid gap-5">
                      <div className="rounded-[1.4rem] border border-serenity/18 bg-white/56 p-5 text-center">
                        <p className="wedding-type-card-title text-[#252934]">
                          {displayedInsideInviteLine}
                        </p>
                        <p className="wedding-type-body mt-3 text-[#252934]/58">{displayedClosingLine}</p>
                      </div>

                      <div className="grid gap-4">
                        {[
                          {
                            value: "yes" as const,
                            title: "Xác nhận tham dự",
                            text: `Gia đình rất vui được đón tiếp ${rsvpRecipientLabel} dự buổi tiệc.`,
                          },
                          {
                            value: "no" as const,
                            title: "Rất tiếc không tham dự",
                            text: `Nếu muốn, ${rsvpRecipientLabel} có thể để lại một lời nhắn ở bước sau.`,
                          },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={[
                              "rounded-[1.4rem] border p-5 text-center shadow-[0_14px_42px_rgba(37,41,52,0.05)] transition hover:-translate-y-0.5",
                              attending === option.value ? "border-rose-quartz bg-white/82 ring-4 ring-rose-quartz/18" : "border-serenity/18 bg-white/44 hover:border-serenity/34",
                            ].join(" ")}
                            onClick={() => {
                              setValue("attending", option.value, { shouldDirty: true });
                              if (option.value === "no") {
                                setValue("guestCount", 0, { shouldDirty: true });
                                setValue("accommodationNeeded", false, { shouldDirty: true });
                                setValue("dietaryNote", "", { shouldDirty: true });
                                replace([]);
                              }
                              if (option.value !== "no" && guestCount === 0) {
                                setValue("guestCount", inviteeContext?.expectedGuestCount || 1, { shouldDirty: true });
                              }
                            }}
                          >
                            <p className="wedding-type-card-title text-[#252934]">{option.title}</p>
                            <p className="wedding-type-body mt-2 text-[#252934]/58">{option.text}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {currentStep.key === "stay" ? (
                    <div className="mt-8 grid gap-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          className={[
                            "flex h-full flex-col items-center justify-start rounded-[1.4rem] border p-5 text-center shadow-[0_14px_42px_rgba(37,41,52,0.05)] transition hover:-translate-y-0.5",
                            accommodationNeeded ? "border-rose-quartz bg-white/82 ring-4 ring-rose-quartz/18" : "border-serenity/18 bg-white/44 hover:border-serenity/34",
                          ].join(" ")}
                          onClick={() => toggleAccommodation(true)}
                        >
                          <BedDouble className="mb-4 h-6 w-6 text-serenity" />
                          <p className="wedding-type-card-title text-[#252934]">Nhờ chuẩn bị phòng</p>
                          <p className="wedding-type-body mt-2 text-[#252934]/58">Nhập thông tin người lưu trú để gia đình tiện sắp xếp.</p>
                        </button>
                        <button
                          type="button"
                          className={[
                            "flex h-full flex-col items-center justify-start rounded-[1.4rem] border p-5 text-center shadow-[0_14px_42px_rgba(37,41,52,0.05)] transition hover:-translate-y-0.5",
                            !accommodationNeeded ? "border-rose-quartz bg-white/82 ring-4 ring-rose-quartz/18" : "border-serenity/18 bg-white/44 hover:border-serenity/34",
                          ].join(" ")}
                          onClick={() => toggleAccommodation(false)}
                        >
                          <CheckCircle2 className="mb-4 h-6 w-6 text-serenity" />
                          <p className="wedding-type-card-title text-[#252934]">Tự túc chỗ ở</p>
                          <p className="wedding-type-body mt-2 text-[#252934]/58">Đã có kế hoạch lưu trú riêng.</p>
                        </button>
                      </div>

                      {accommodationNeeded ? (
                        <div className="grid gap-4 rounded-[1.4rem] border border-serenity/18 bg-white/44 p-5 text-center">
                          <div className="rounded-[1.2rem] bg-serenity/10 px-5 py-4 text-left text-sm text-[#252934]/75">
                            <p className="font-bold text-[#252934]">Lưu ý khi có trẻ em đi cùng (Tối đa 02 bé/phòng):</p>
                            <p className="mt-2 leading-relaxed">Vui lòng tích chọn ô <strong>"Là trẻ em"</strong> và ghi rõ số tuổi để gia đình phân bổ phòng & giường phụ chính xác:</p>
                            <ul className="mt-1.5 list-inside list-disc space-y-1 leading-relaxed">
                              <li><span className="font-semibold text-[#252934]">Dưới 11 tuổi:</span> Trẻ sẽ ngủ chung giường.</li>
                              <li><span className="font-semibold text-[#252934]">Từ 11 tuổi trở lên:</span> Resort sẽ kê thêm giường phụ.</li>
                            </ul>
                            <p className="mt-2 text-xs italic opacity-80">(Nếu cần nôi cho em bé, vui lòng ghi chú ở bước tiếp theo).</p>
                          </div>

                          <div className="mb-2 text-center">
                            <p className="section-kicker-dark wedding-type-kicker text-serenity">Danh sách người lưu trú</p>
                            <h3 className="wedding-type-card-title mt-2 text-[#252934]">Thông tin để sắp xếp</h3>
                          </div>

                          {typeof errors.lodgingGuests?.message === "string" ? (
                            <p className="text-sm font-bold text-[#9B4E5C]">{errors.lodgingGuests.message}</p>
                          ) : null}

                          <div className="grid gap-4">
                            {fields.map((field, index) => {
                              const isChild = Boolean(watchedLodgingGuests?.[index]?.isChild);
                              const guestErrors = errors.lodgingGuests?.[index];

                              return (
                                <div key={field.id} className="relative rounded-[1.4rem] border border-serenity/16 bg-white/60 p-4 pt-5 text-left shadow-sm">
                                  <div className="mb-4 flex items-center justify-between">
                                    <p className="section-kicker-dark wedding-type-kicker text-[#252934]/50">Người lưu trú {index + 1}</p>
                                    <button
                                      type="button"
                                      onClick={() => fields.length === 1 ? replace([createLodgingGuest("")]) : remove(index)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#9B4E5C] transition hover:bg-[#9B4E5C]/10"
                                      aria-label="Xóa người lưu trú"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className={`grid items-end gap-4 ${isChild ? "" : "sm:grid-cols-[1fr_0.86fr]"}`}>
                                    <Field label={<>Họ tên <br /> <span className="font-normal opacity-85">(đúng trên giấy tờ)</span></>} error={guestErrors?.fullName?.message}>
                                      <input className={inputClass} placeholder="VD: Nguyễn Văn A" {...register(`lodgingGuests.${index}.fullName`)} />
                                    </Field>
                                    {!isChild && (
                                      <Field label={<>Số giấy tờ tùy thân <br /> <span className="font-normal opacity-85">(Không bắt buộc)</span></>} error={guestErrors?.idNumber?.message}>
                                        <input className={inputClass} placeholder="CMND/CCCD/Passport" {...register(`lodgingGuests.${index}.idNumber`)} />
                                      </Field>
                                    )}
                                  </div>
                                  <div className="mt-4 flex flex-wrap items-end gap-4">
                                    <label className="flex h-[3.25rem] cursor-pointer items-center gap-3 rounded-2xl border border-serenity/18 bg-white/70 px-4 text-sm font-semibold text-[#252934] transition hover:bg-white">
                                      <input type="checkbox" className="h-5 w-5 rounded text-serenity accent-serenity focus:ring-serenity/30" {...register(`lodgingGuests.${index}.isChild`)} />
                                      Là trẻ em (đi cùng phụ huynh)
                                    </label>
                                    {isChild ? (
                                      <div className="w-32">
                                        <Field label="Tuổi của bé" error={guestErrors?.age?.message}>
                                          <input
                                            type="number"
                                            min={0}
                                            max={10}
                                            className={`${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                                            placeholder="VD: 5"
                                            {...register(`lodgingGuests.${index}.age`, {
                                              setValueAs: (value) => value === "" ? undefined : Number(value),
                                            })}
                                          />
                                        </Field>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="grid justify-items-center">
                            <button
                              type="button"
                              onClick={() => append(createLodgingGuest(""))}
                              className="wedding-type-button inline-flex min-h-11 items-center gap-2 rounded-[1.2rem] border border-serenity/24 bg-serenity/15 px-6 font-semibold text-[#252934] transition hover:bg-serenity/25"
                            >
                              <Plus className="h-4 w-4" /> THÊM NGƯỜI LƯU TRÚ
                            </button>
                          </div>


                          {terracottaNote ? (
                            <div className="wedding-type-body grid justify-items-center gap-3 rounded-[1.2rem] border border-serenity/14 bg-white/62 p-4 text-[#252934]/62">
                              <CircleHelp className="mt-1 h-5 w-5 shrink-0 text-serenity" />
                              {terracottaNote}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {currentStep.key === "message" ? (
                    <div className="mt-8 grid gap-5">
                      {attending === "no" ? (
                        <Field label="Lời nhắn gửi (không bắt buộc)">
                          <textarea
                            className={`${inputClass} min-h-32 py-4`}
                            placeholder={`Nếu muốn, ${rsvpRecipientLabel} có thể để lại vài dòng nhắn gửi cho gia đình.`}
                            {...register("notes")}
                          />
                        </Field>
                      ) : (
                        <>
                          <Field label="Lưu ý thực đơn">
                            <textarea
                              className={`${inputClass} min-h-28 py-4`}
                              placeholder="Ăn chay, dị ứng, kiêng món, không dùng rượu/cồn, hoặc cần suất trẻ em nếu có."
                              {...register("dietaryNote")}
                            />
                          </Field>
                          <Field label="Lưu ý khác">
                            <textarea
                              className={`${inputClass} min-h-32 py-4`}
                              placeholder="Giờ đến dự kiến, hỗ trợ người lớn tuổi hoặc trẻ nhỏ, ghế ăn trẻ em, hoặc điều cần báo trước."
                              {...register("notes")}
                            />
                          </Field>
                        </>
                      )}
                      {attending === "no" ? (
                        <div className="wedding-type-body grid justify-items-center gap-3 rounded-[1.4rem] border border-serenity/18 bg-white/44 p-5 text-[#252934]/62">
                          <CircleHelp className="mt-1 h-5 w-5 shrink-0 text-serenity" />
                          {`Phần này không bắt buộc. Nếu ${rsvpRecipientLabel} không tiện ghi thêm, có thể bỏ trống và gửi hồi đáp.`}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {currentStep.key === "review" ? (
                    <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.92fr]">
                      <div className="grid gap-4 rounded-[1.5rem] border border-serenity/18 bg-white/52 p-5 text-center">
                        <ReviewLine label="Phản hồi" value={formValues.attending === "no" ? "Rất tiếc không tham dự" : "Xác nhận tham dự"} />
                        <ReviewLine label="Tên mời" value={inviteCopy.guestLabel} />
                        {formValues.attending === "no" ? (
                          <ReviewLine label="Lời nhắn gửi" value={formValues.notes || "Không có"} />
                        ) : (
                          <>
                            <ReviewLine label="Lưu ý thực đơn" value={formValues.dietaryNote || "Không có ghi chú"} />
                            <ReviewLine label="Lưu ý khác" value={formValues.notes || "Không có"} />
                          </>
                        )}
                      </div>

                      <div className="grid gap-4 rounded-[1.5rem] border border-serenity/18 bg-white/44 p-5 text-center">
                        <p className="section-kicker-dark wedding-type-kicker text-serenity">Thông tin lưu trú</p>
                        <h3 className="wedding-type-card-title text-[#252934]">Xem lại đăng ký</h3>
                        <div className="rounded-[1.2rem] border border-serenity/18 bg-white/72 p-4">
                          <ReviewLine label="Lưu trú" value={formValues.accommodationNeeded && formValues.attending !== "no" ? "Có đăng ký hỗ trợ" : "Không đăng ký"} />
                          <ReviewLine label="Số người ở lại" value={formValues.accommodationNeeded ? String(lodgingGuests.length) : "0"} />
                          <ReviewLine label="Trẻ em dưới 11" value={formValues.accommodationNeeded ? String(countLodgingChildren(lodgingGuests)) : "0"} />
                        </div>
                        {formValues.accommodationNeeded && lodgingGuests.length ? (
                          <div className="grid gap-2 rounded-[1.2rem] border border-serenity/14 bg-white/68 p-4 text-center">
                            {lodgingGuests.map((guest, index) => (
                              <p key={`${guest.fullName}-${index}`} className="wedding-type-body font-semibold text-[#252934]/70">
                                {formatLodgingGuestLabel(guest)}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <div className="wedding-type-body rounded-[1.2rem] border border-serenity/14 bg-white/68 p-4 text-[#252934]/62">
                          {formValues.accommodationNeeded ? terracottaNote || "Không có ghi chú lưu trú cần gửi kèm." : "Không có thông tin lưu trú cần gửi kèm."}
                        </div>
                        <div className="wedding-type-body rounded-[1.2rem] border border-serenity/14 bg-white/68 p-4 text-[#252934]/62">
                          Bấm gửi là lời hồi đáp này được ghi nhận. Nếu cần sửa, hãy quay lại bước trước.
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                <button
                  type="button"
                  className="wedding-type-button inline-flex min-h-12 items-center justify-center rounded-full border border-serenity/26 bg-white/54 px-6 text-[#252934]/62 transition hover:border-serenity/46 hover:text-[#252934] disabled:opacity-30"
                  disabled={stepIndex === 0}
                  onClick={() => goToStep(Math.max(0, stepIndex - 1))}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                </button>

                {stepIndex < visibleSteps.length - 1 ? (
                  <motion.button
                    type="button"
                    className="light-sweep wedding-type-button inline-flex min-h-12 items-center justify-center rounded-full bg-rose-quartz px-7 text-[#252934] shadow-[0_16px_48px_rgba(146,168,209,0.22)] ring-1 ring-rose-quartz/70 disabled:opacity-60"
                    disabled={isHydratingGuest}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void goNextStep()}
                  >
                    {isHydratingGuest ? "Đang tải..." : "Tiếp tục"} <ChevronRight className="ml-2 h-4 w-4" />
                  </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="light-sweep wedding-type-button inline-flex min-h-12 items-center justify-center rounded-full bg-rose-quartz px-7 text-[#252934] shadow-[0_16px_48px_rgba(146,168,209,0.22)] ring-1 ring-rose-quartz/70 disabled:opacity-60"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Mail className="mr-2 h-4 w-4" /> {isSubmitting ? "Đang gửi..." : attending === "no" ? "Gửi lời nhắn" : "Gửi lời hồi đáp"}
                    </motion.button>
                )}
              </div>
            </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
