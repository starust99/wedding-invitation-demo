"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  CircleHelp,
  Mail,
  Plus,
  Trash2,
  CalendarDays,
  Lock,
  Info,
  X,
  Check,
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
import { findAnyStoredInviteToken } from "@/lib/guest-personalization";

const lodgingGuestSchema = z.object({
  fullName: z.string().trim().optional(),
  isChild: z.boolean().default(false),
  age: z.number().int().min(0, "Tuổi không hợp lệ.").optional(),
});

const rsvpSchema = z
  .object({
    honorific: z.string().optional(),
    name: z.string().trim().optional().default(""),
    phone: z.string().trim().optional().default(""),
    attendingCeremony: z.enum(["yes", "no"]).nullable().default(null),
    attendingBanquet: z.enum(["yes", "no"]).nullable().default(null),
    attending: z.enum(["yes", "no"]),
    guestCount: z.coerce.number().min(0),
    guestGroup: z.string().trim().optional().default(""),
    stayDecision: z.enum(["25", "26", "both", "none"]).default("none"),
    accommodationNeeded: z.boolean().default(false),
    lodgingGuests: z.array(lodgingGuestSchema).default([]),
    dietaryNote: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.attendingCeremony) {
      ctx.addIssue({ code: "custom", path: ["attendingCeremony"], message: "Vui lòng chọn phản hồi cho Thánh lễ Hôn phối." });
    }
    if (!data.attendingBanquet) {
      ctx.addIssue({ code: "custom", path: ["attendingBanquet"], message: "Vui lòng chọn phản hồi cho Tiệc cưới." });
    }
    
    if (data.attending !== "no" && data.guestCount < 1) {
      ctx.addIssue({ code: "custom", path: ["guestCount"], message: "Nếu tham dự, số người cần từ 1 trở lên." });
    }

    if (data.attending === "yes" && data.attendingBanquet === "yes" && data.stayDecision !== "none") {
      if (data.lodgingGuests.length < 1) {
        ctx.addIssue({ code: "custom", path: ["lodgingGuests"], message: "Vui lòng thêm ít nhất một người lưu trú." });
      }
      data.lodgingGuests.forEach((guest, index) => {
        if (!guest.fullName || guest.fullName.trim().length < 2) {
          ctx.addIssue({ code: "custom", path: ["lodgingGuests", index, "fullName"], message: "Nhập họ tên người lưu trú." });
        }
        if (guest.isChild && (typeof guest.age !== "number" || isNaN(guest.age))) {
          ctx.addIssue({ code: "custom", path: ["lodgingGuests", index, "age"], message: "Nhập tuổi của bé để resort sắp xếp." });
        }
      });
    }
  });

type RSVPFormInput = z.input<typeof rsvpSchema>;
type RSVPFormOutput = z.output<typeof rsvpSchema>;
type LodgingGuestForm = {
  fullName: string;
  isChild: boolean;
  age?: number;
};

const RSVP_GUEST_EDIT_DEADLINE = new Date("2026-09-26T00:00:00+07:00");

const inputClass =
  "min-h-13 w-full rounded-2xl border border-serenity/22 bg-white/75 px-4 text-base text-center text-[#252934] outline-none transition placeholder:text-[#252934]/36 focus:border-serenity focus:bg-white/86 focus:ring-4 focus:ring-serenity/18";

function createLodgingGuest(fullName = ""): LodgingGuestForm {
  return {
    fullName,
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
      {error ? <span className="text-xs font-bold text-[#9B4E5C]">{error}</span> : null}
    </label>
  );
}

function buildSubmissionCopy(
  attending: RSVPFormInput["attending"],
  attendingCeremony: RSVPFormInput["attendingCeremony"],
  attendingBanquet: RSVPFormInput["attendingBanquet"],
  inviteCopy: InvitationCopy
) {
  const host = inviteCopy.hostSubject;
  const recipient = inviteCopy.shortRecipientLabel;

  if (attending === "no") {
    return {
      title: "Đã xác nhận",
      body: `Cảm ơn ${recipient} đã phản hồi.\n\nDù rất tiếc không thể chung vui trực tiếp, ${host} vẫn luôn trân trọng tình cảm của ${recipient} và hẹn gặp lại vào một dịp sớm nhất.`,
      showCalendar: false,
    };
  }

  if (attendingCeremony === "yes" && attendingBanquet === "yes") {
    return {
      title: "Đã xác nhận",
      body: `Lời hồi đáp đã được gửi thành công!\n\nThật hạnh phúc khi biết ${recipient} sẽ có mặt ở cả Thánh lễ Hôn phối lẫn Tiệc cưới để chung vui cùng Nhật & Phương.\n\nSự hiện diện của ${recipient} chính là món quà ý nghĩa nhất. Chân thành cảm ơn!`,
      showCalendar: true,
    };
  }

  if (attendingCeremony === "yes" && attendingBanquet === "no") {
    return {
      title: "Đã xác nhận",
      body: `Lời hồi đáp đã được gửi thành công!\n\nCảm ơn ${recipient} đã sắp xếp thời gian đến chứng kiến và hiệp thông trong Thánh lễ Hôn phối của Nhật & Phương.\n\nDù rất tiếc không thể đồng hành cùng ${recipient} trong buổi Tiệc cưới, sự hiện diện của ${recipient} tại Nhà thờ đã là niềm hạnh phúc vô cùng lớn đối với ${inviteCopy.tone === "parents_host" ? "gia đình" : "chúng em"}.`,
      showCalendar: true,
    };
  }

  if (attendingCeremony === "no" && attendingBanquet === "yes") {
    return {
      title: "Đã xác nhận",
      body: `Lời hồi đáp đã được gửi thành công!\n\nCảm ơn ${recipient} đã sắp xếp thời gian đến chung vui tại Tiệc cưới của Nhật & Phương, sự hiện diện của ${recipient} tại buổi tiệc là niềm hạnh phúc vô cùng lớn đối với ${inviteCopy.tone === "parents_host" ? "gia đình" : "chúng em"}.\n\nHẹn sớm gặp ${recipient} tại Đà Lạt!`,
      showCalendar: true,
    };
  }

  return {
    title: "Đã xác nhận",
    body: `Lời hồi đáp đã được gửi thành công.\n\n${inviteCopy.closingLine}`,
    showCalendar: true,
  };
}

function normalizeAttendanceForForm(value: RSVPResponse["attending"] | undefined): RSVPFormInput["attending"] {
  return value === "no" ? "no" : "yes";
}

function normalizeBoolean(value: boolean | undefined): "yes" | "no" | null {
  if (value === true) return "yes";
  if (value === false) return "no";
  return null;
}

function getRecapText(
  attendingCeremony: "yes" | "no" | null,
  attendingBanquet: "yes" | "no" | null,
  stayDecision: "25" | "26" | "both" | "none",
  lodgingGuests: Array<{ fullName?: string; isChild?: boolean }>,
  inviteCopy: InvitationCopy
) {
  if (attendingCeremony === null && attendingBanquet === null) {
    return "Vui lòng chọn phản hồi tham dự của bạn.";
  }

  const recipient = inviteCopy.recipientPronoun
    ? inviteCopy.recipientPronoun.charAt(0).toUpperCase() + inviteCopy.recipientPronoun.slice(1)
    : "Khách mời";

  if (attendingCeremony === "no" && attendingBanquet === "no") {
    return `${recipient} rất tiếc không thể tham dự ngày vui.`;
  }

  const events: string[] = [];
  if (attendingCeremony === "yes") events.push("Thánh lễ Hôn phối");
  if (attendingBanquet === "yes") events.push("Tiệc cưới");

  const eventText = events.join(" và ");
  let stayText = "";

  if (attendingBanquet === "yes" && stayDecision !== "none") {
    const adults = lodgingGuests.filter((g) => !g.isChild && g.fullName?.trim()).length;
    const children = lodgingGuests.filter((g) => g.isChild && g.fullName?.trim()).length;

    let nightLabel = "";
    if (stayDecision === "25") nightLabel = "đêm 25/12";
    else if (stayDecision === "26") nightLabel = "đêm 26/12";
    else if (stayDecision === "both") nightLabel = "cả hai đêm 25 và 26/12";

    const peopleParts: string[] = [];
    if (adults > 0) peopleParts.push(`${adults} người lớn`);
    if (children > 0) peopleParts.push(`${children} trẻ em`);
    const peopleText = peopleParts.join(" và ");

    if (peopleText) {
      stayText = `, nghỉ lại ${nightLabel} cho ${peopleText} tại Resort Terracotta`;
    } else {
      stayText = `, nghỉ lại ${nightLabel} tại Resort Terracotta`;
    }
  }

  return `${recipient} sẽ tham dự ${eventText}${stayText}.`;
}

export default function RSVPPage() {
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
  const [adminLoginError, setAdminLoginError] = useState("");
  const { navigateWithTransition, prefetch } = usePageTransition();

  // Prefetch home page / on mount for instant return navigation
  useEffect(() => {
    prefetch("/");
  }, [prefetch]);

  const handleAdminLogin = async (password: string) => {
    setAdminLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        sessionStorage.setItem("admin_rsvp_bypass", "true");
        setIsAdminBypassed(true);
        setMissingInviteToken(false);
        setGuestRsvpLocked(false);
      } else {
        const result = await response.json().catch(() => ({}));
        setAdminLoginError(result.error || "Sai mật khẩu Admin");
      }
    } catch {
      setAdminLoginError("Lỗi kết nối máy chủ");
    }
  };

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
      attendingCeremony: null,
      attendingBanquet: null,
      attending: "yes",
      guestCount: 1,
      guestGroup: "",
      stayDecision: "none",
      accommodationNeeded: false,
      lodgingGuests: [],
      dietaryNote: "",
      notes: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "lodgingGuests" });
  const attending = useWatch({ control, name: "attending" });
  const attendingCeremony = useWatch({ control, name: "attendingCeremony" });
  const attendingBanquet = useWatch({ control, name: "attendingBanquet" });
  const guestCount = useWatch({ control, name: "guestCount" });
  const accommodationNeeded = useWatch({ control, name: "accommodationNeeded" });
  const stayDecision = useWatch({ control, name: "stayDecision" });
  const watchedLodgingGuests = useWatch({ control, name: "lodgingGuests" });
  const formValues = useWatch({ control }) as RSVPFormInput;
  const returnHref = inviteToken ? `/i/${encodeURIComponent(inviteToken)}` : "/";

  const inviteCopy = useMemo(() => buildInvitationCopy(inviteeContext ?? guestIdentity), [guestIdentity, inviteeContext]);
  const submissionCopy = useMemo(() => buildSubmissionCopy(attending, attendingCeremony, attendingBanquet, inviteCopy), [attending, attendingCeremony, attendingBanquet, inviteCopy]);
  const displayedInsideInviteLine = isHydratingGuest ? "Đang tải lời mời..." : inviteCopy.insideInviteLine;
  const displayedClosingLine = isHydratingGuest ? "Thông tin riêng của khách mời sẽ hiện trong giây lát." : inviteCopy.closingLine;
  const rsvpRecipientLabel = isHydratingGuest ? "khách mời" : inlineRecipientLabel(inviteCopy.shortRecipientLabel);
  const lodgingGuests = normalizeLodgingGuests((watchedLodgingGuests ?? []) as Array<Partial<LodgingGuestForm> | undefined>);
  const terracottaNote = buildTerracottaNote(lodgingGuests);
  const canRegisterStay = attending !== "no";
  const hasAnsweredBothEvents = attendingCeremony !== null && attendingBanquet !== null;

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
      setValue("name", response?.name ?? invitee.displayLabel, { shouldDirty: false });
      setValue("phone", response?.phone ?? invitee.phone, { shouldDirty: false });
      setValue("guestGroup", response?.guestGroup ?? invitee.guestGroup, { shouldDirty: false });
      setValue("guestCount", response?.guestCount ?? invitee.expectedGuestCount, { shouldDirty: false });
      setValue("attendingCeremony", normalizeBoolean(response?.attendingCeremony), { shouldDirty: false });
      setValue("attendingBanquet", normalizeBoolean(response?.attendingBanquet), { shouldDirty: false });
      setValue("attending", normalizeAttendanceForForm(response?.attending), { shouldDirty: false });
      setValue("dietaryNote", response?.dietaryNote ?? "", { shouldDirty: false });
      let initialStayDecision: "25" | "26" | "both" | "none" = "none";
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
      setValue("accommodationNeeded", response?.accommodationNeeded ?? false, { shouldDirty: false });
      setValue("stayDecision", initialStayDecision, { shouldDirty: false });
      setValue("notes", response?.notes ?? "", { shouldDirty: false });
      replace(response?.lodgingGuests?.length
        ? response.lodgingGuests
        : initialStayDecision !== "none"
          ? [createLodgingGuest("")]
          : []);
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
      setMissingInviteToken(false);
      setGuestRsvpLocked(Date.now() >= RSVP_GUEST_EDIT_DEADLINE.getTime() && !bypassed);

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

  useEffect(() => {
    if (attendingCeremony === "no" && attendingBanquet === "no" && attending !== "no") {
      setValue("attending", "no", { shouldDirty: true });
      setValue("guestCount", 0, { shouldDirty: true });
      setValue("accommodationNeeded", false, { shouldDirty: true });
      setValue("stayDecision", "none", { shouldDirty: true });
      replace([]);
      return;
    }

    if (attendingBanquet === "no") {
      setValue("accommodationNeeded", false, { shouldDirty: true });
      setValue("stayDecision", "none", { shouldDirty: true });
      replace([]);
    }

    if ((attendingCeremony === "yes" || attendingBanquet === "yes") && attending !== "yes") {
      setValue("attending", "yes", { shouldDirty: true });
      if (guestCount === 0) {
        setValue("guestCount", inviteeContext?.expectedGuestCount || 1, { shouldDirty: true });
      }
    }
  }, [attending, attendingBanquet, attendingCeremony, guestCount, inviteeContext?.expectedGuestCount, replace, setValue]);

  function handleStayDecisionChange(decision: "25" | "26" | "both" | "none") {
    if (!canRegisterStay) return;
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
    const target = token ? `/i/${encodeURIComponent(token)}${hash}` : "/";
    navigateWithTransition(target);
  }

  async function onSubmit(data: RSVPFormOutput) {
    setSubmitError("");

    const isStaying = data.attending === "yes" && data.attendingBanquet === "yes" && data.stayDecision !== "none";
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
    const resolvedGroup = data.guestGroup?.trim() || inviteeContext?.guestGroup || guestIdentity.group || "Khác";
    const resolvedGuestCount = data.attending === "no" ? 0 : Math.max(1, data.guestCount || inviteeContext?.expectedGuestCount || 1);

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
      attendingBanquet: data.attendingBanquet === "yes",
      attending: data.attending,
      guestCount: resolvedGuestCount,
      guestGroup: resolvedGroup,
      dietaryNote: data.dietaryNote?.trim() || undefined,
      transportNeeded: false,
      accommodationNeeded: isStaying,
      stayingGuestCount,
      lodgingGuests: cleanLodgingGuests,
      checkInDate,
      checkOutDate,
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

  const handleGoToReview = async () => {
    setSubmitError("");
    const isValid = await trigger();
    if (isValid) {
      setIsReviewing(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSubmitError("Có vài mục cần bổ sung. Vui lòng kiểm tra lại phần được đánh dấu.");
    }
  };

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

  const hasCeremony = formValues.attendingCeremony === "yes";
  const hasBanquet = formValues.attendingBanquet === "yes";
  
  const ceremonyCalTitle = `Thánh lễ Hôn phối ${weddingConfig.couple.displayName}`;
  const ceremonyCalLocation = weddingConfig.church?.address || "Nhà Thờ Giáo Xứ Tam Hải";
  const ceremonyCalDesc = `Thánh lễ Hôn phối của ${weddingConfig.couple.displayName}.`;
  const ceremonyGcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ceremonyCalTitle)}&dates=20261220T080000Z/20261220T093000Z&details=${encodeURIComponent(ceremonyCalDesc)}&location=${encodeURIComponent(ceremonyCalLocation)}`;
  const ceremonyIcsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Wedding//EN\nBEGIN:VEVENT\nDTSTART:20261220T080000Z\nDTEND:20261220T093000Z\nSUMMARY:${ceremonyCalTitle}\nLOCATION:${ceremonyCalLocation}\nDESCRIPTION:${ceremonyCalDesc}\nEND:VEVENT\nEND:VCALENDAR`;
  const ceremonyIcsUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(ceremonyIcsContent)}`;

  const banquetCalTitle = `Tiệc cưới ${weddingConfig.couple.displayName}`;
  const banquetCalLocation = weddingConfig.venue.address;
  const banquetCalDesc = `Tiệc cưới ngày chung đôi của ${weddingConfig.couple.displayName}.`;
  const banquetGcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(banquetCalTitle)}&dates=20261226T103000Z/20261226T140000Z&details=${encodeURIComponent(banquetCalDesc)}&location=${encodeURIComponent(banquetCalLocation)}`;
  const banquetIcsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Wedding//EN\nBEGIN:VEVENT\nDTSTART:20261226T103000Z\nDTEND:20261226T140000Z\nSUMMARY:${banquetCalTitle}\nLOCATION:${banquetCalLocation}\nDESCRIPTION:${banquetCalDesc}\nEND:VEVENT\nEND:VCALENDAR`;
  const banquetIcsUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(banquetIcsContent)}`;

  const openCalendar = (icsUrl: string, gcalUrl: string, fileName: string) => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isApple = /iPad|iPhone|iPod|Mac/i.test(userAgent) && !(window as any).MSStream;
    const isInAppBrowser = /Zalo|FBAN|FBAV|Instagram|Line|TikTok/i.test(userAgent);

    if (isApple) {
      if (isInAppBrowser) {
        alert("Trình duyệt tích hợp này chặn tải file lịch. Vui lòng nhấn biểu tượng dấu 3 chấm góc trên và chọn 'Mở bằng trình duyệt' (Safari) để lưu lịch.");
        return;
      }
      const link = document.createElement("a");
      link.href = icsUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(gcalUrl, "_blank");
    }
  };

  if (missingInviteToken && tokenGateChecked && !isAdminBypassed) {
    return (
      <main className="public-invitation-page relative flex min-h-screen items-center justify-center px-6 py-16 text-[#252934]">
        <div aria-hidden="true" className="aurora-wash pointer-events-none absolute inset-0 -z-10 opacity-50" />
        <div aria-hidden="true" className="film-grain-soft pointer-events-none absolute inset-0 -z-10" />
        <section className="glass-panel w-full max-w-lg rounded-[2rem] p-10 text-center shadow-[0_24px_64px_rgba(37,41,52,0.08)]">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-serenity/10 text-serenity">
            <Lock className="h-6 w-6" />
          </div>
          <p className="section-kicker-dark wedding-type-kicker text-serenity">Xác nhận lời mời</p>
          <h1 className="wedding-type-title mt-4 text-[#252934]">Cần link thiệp</h1>
          <p className="wedding-type-body mt-5 text-[#252934]/62">
            Vui lòng mở đúng link thiệp mời cá nhân được gửi cho bạn để xác nhận sự hiện diện.
          </p>
          <div className="my-6 border-t border-serenity/12" />
          <p className="wedding-type-body text-xs font-semibold text-[#252934]/48 uppercase tracking-wider">
            Quyền truy cập Admin
          </p>
          <p className="wedding-type-body mt-2 text-sm text-[#252934]/58">
            Nhập mật khẩu Admin để ghi nhận hoặc điền hộ RSVP:
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <input
              type="password"
              placeholder="Nhập mật khẩu..."
              className="min-h-12 w-full rounded-2xl border border-serenity/22 bg-white/75 px-4 text-center text-[#252934] outline-none transition placeholder:text-[#252934]/36 focus:border-serenity focus:bg-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdminLogin((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                handleAdminLogin(input.value);
              }}
              className="light-sweep wedding-type-button inline-flex min-h-12 items-center justify-center rounded-full bg-rose-quartz px-8 text-[#252934] shadow-[0_16px_48px_rgba(146,168,209,0.22)] ring-1 ring-rose-quartz/70"
            >
              Đăng nhập Admin
            </button>
            {adminLoginError && (
              <p className="text-xs font-bold text-[#9B4E5C] mt-2">{adminLoginError}</p>
            )}
          </div>

          <div className="mt-8 flex justify-center gap-4 border-t border-serenity/12 pt-6">
            <button
              type="button"
              onClick={() => navigateWithTransition("/")}
              className="wedding-type-button inline-flex min-h-11 items-center justify-center rounded-full border border-serenity/26 bg-white/80 px-6 text-sm text-[#252934] transition hover:border-serenity/46"
            >
              Về trang chủ
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
        <div className="flex justify-start mb-6">
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
        </div>

        {guestRsvpLocked ? (
          <p className="mb-6 rounded-2xl border border-serenity/22 bg-white/70 px-4 py-3 text-sm font-semibold text-[#252934]/72 text-center">
            Đã hết hạn chỉnh sửa lời hồi đáp (sau 26/09/2026, 00:00 giờ Việt Nam). Vui lòng liên hệ gia đình nếu cần thay đổi.
          </p>
        ) : null}

        <section className="w-full text-center py-4">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="px-4 sm:px-6 text-center flex flex-col items-center w-full max-w-2xl mx-auto"
            >
              <div className="w-full bg-white/40 border border-white/50 shadow-[0_8px_32px_rgba(63,70,66,0.04)] rounded-[2rem] p-6 sm:p-10 mb-8 flex flex-col items-center backdrop-blur-md">
                <h2 className="wedding-type-title text-[#252934] font-serif italic text-2xl sm:text-3xl font-bold mb-4">{submissionCopy.title}</h2>
                <p className="wedding-type-body max-w-lg text-[#252934]/75 leading-relaxed whitespace-pre-line text-center">
                  {submissionCopy.body}
                </p>
              </div>

              {submissionCopy.showCalendar ? (
                <div className="w-full max-w-md mx-auto bg-white/40 border border-white/50 shadow-[0_8px_32px_rgba(63,70,66,0.04)] rounded-[2rem] p-5 sm:p-6 mb-6 text-center backdrop-blur-md">
                  <p className="text-[0.82rem] sm:text-sm font-bold tracking-[0.15em] text-[#7a6a5d] uppercase mb-4">
                    Thêm vào lịch
                  </p>
                  <div className="flex flex-row justify-center gap-3.5 flex-wrap">
                    {hasCeremony && (
                      <button
                        type="button"
                        onClick={() => openCalendar(ceremonyIcsUrl, ceremonyGcalUrl, "thanh-le-nhat-phuong.ics")}
                        className="wedding-type-button inline-flex h-11 items-center justify-center gap-2 rounded-full border border-serenity/24 bg-white/80 px-6 text-xs sm:text-sm font-bold text-[#252934] transition hover:bg-white hover:shadow-sm min-w-[130px]"
                      >
                        <CalendarDays className="w-4 h-4" /> THÁNH LỄ
                      </button>
                    )}
                    {hasBanquet && (
                      <button
                        type="button"
                        onClick={() => openCalendar(banquetIcsUrl, banquetGcalUrl, "tiec-cuoi-nhat-phuong.ics")}
                        className="wedding-type-button inline-flex h-11 items-center justify-center gap-2 rounded-full border border-serenity/24 bg-white/80 px-6 text-xs sm:text-sm font-bold text-[#252934] transition hover:bg-white hover:shadow-sm min-w-[130px]"
                      >
                        <CalendarDays className="w-4 h-4" /> TIỆC CƯỚI
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => redirectToInvitePage(inviteToken, "#thank-you")}
                  className="light-sweep wedding-type-button inline-flex min-h-12 items-center justify-center rounded-full bg-rose-quartz px-8 text-[#252934] shadow-[0_16px_48px_rgba(146,168,209,0.22)] ring-1 ring-rose-quartz/70 transition hover:-translate-y-0.5"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang thiệp
                </button>
              </div>
            </motion.div>
          ) : isReviewing ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="px-4 sm:px-8 text-center flex flex-col items-center w-full max-w-2xl mx-auto py-2 sm:py-4"
            >
              <h2 className="wedding-type-title text-[#252934] font-serif italic font-bold mb-5 !text-[2.2rem] sm:!text-[2.6rem]">
                Xác nhận thông tin hồi đáp
              </h2>

              <div className="w-full rounded-[1.8rem] border border-serenity/22 bg-white/95 p-6 sm:p-9 shadow-[0_16px_40px_rgba(37,41,52,0.05)] text-center grid gap-6 mb-8 backdrop-blur-md">
                
                <div className="border-b border-serenity/16 pb-6">
                  <p className="text-xs sm:text-sm font-bold tracking-[0.14em] text-[#54473b] uppercase text-center mb-2.5">
                    1. NGƯỜI GỬI HỒI ĐÁP
                  </p>
                  <div className="text-center max-w-lg mx-auto w-full">
                    <strong className="font-bold text-lg sm:text-xl text-[#252934] block">
                      {formValues.honorific ? `${formValues.honorific} ` : ""}{formValues.name || inviteCopy.shortRecipientLabel}
                    </strong>
                    {formValues.phone && (
                      <span className="font-medium text-sm text-[#7a6a5d] block mt-1">{formValues.phone}</span>
                    )}
                  </div>
                </div>

                <div className="border-b border-serenity/16 pb-6">
                  <p className="text-xs sm:text-sm font-bold tracking-[0.14em] text-[#54473b] uppercase text-center mb-3.5">
                    2. THAM DỰ SỰ KIỆN
                  </p>
                  <div className="grid gap-3.5 text-sm text-[#252934] max-w-lg mx-auto w-full">
                    <div className="flex items-center justify-between py-3.5 px-4.5 sm:px-5.5 rounded-2xl bg-serenity/8 border border-serenity/14">
                      <div className="text-left">
                        <p className="font-bold text-[#252934] text-base sm:text-lg">Thánh lễ Hôn phối</p>
                        <p className="text-xs sm:text-sm text-[#7a6a5d] font-medium mt-0.5">10:00 • Chủ Nhật, 20/12/2026</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-xs shrink-0 ${
                        formValues.attendingCeremony === "yes" 
                          ? "bg-[#7a8a5c] text-white" 
                          : "bg-[#7a4a4a] text-white"
                      }`}>
                        {formValues.attendingCeremony === "yes" ? (
                          <><Check className="w-4 h-4 text-white" /> Sẽ tham dự</>
                        ) : (
                          <><X className="w-4 h-4 text-white" /> Không tham dự</>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 px-4.5 sm:px-5.5 rounded-2xl bg-serenity/8 border border-serenity/14">
                      <div className="text-left">
                        <p className="font-bold text-[#252934] text-base sm:text-lg">Tiệc cưới</p>
                        <p className="text-xs sm:text-sm text-[#7a6a5d] font-medium mt-0.5">17:30 • Thứ Bảy, 26/12/2026</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-xs shrink-0 ${
                        formValues.attendingBanquet === "yes" 
                          ? "bg-[#7a8a5c] text-white" 
                          : "bg-[#7a4a4a] text-white"
                      }`}>
                        {formValues.attendingBanquet === "yes" ? (
                          <><Check className="w-3.5 h-3.5 text-white" /> Sẽ tham dự</>
                        ) : (
                          <><X className="w-3.5 h-3.5 text-white" /> Không tham dự</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {formValues.attendingBanquet === "yes" && (
                  <div className="border-b border-serenity/16 pb-6">
                    <p className="text-xs sm:text-sm font-bold tracking-[0.14em] text-[#54473b] uppercase text-center mb-2.5">
                      3. LƯU TRÚ TẠI RESORT TERRACOTTA
                    </p>
                    <div className="text-sm text-[#252934] grid gap-3 text-center">
                      <strong className="font-semibold text-[#252934] text-base sm:text-lg block">
                        {stayDecision === "25" && "Nghỉ lại Đêm 25/12 (đêm trước tiệc)"}
                        {stayDecision === "26" && "Nghỉ lại Đêm 26/12 (đêm sau tiệc)"}
                        {stayDecision === "both" && "Nghỉ lại Cả hai đêm (25/12 & 26/12)"}
                        {stayDecision === "none" && "Không nghỉ lại"}
                      </strong>

                      {stayDecision !== "none" && lodgingGuests.length > 0 && (
                        <div className="bg-serenity/8 p-4.5 rounded-2xl border border-serenity/14 max-w-lg mx-auto w-full text-left mt-1">
                          <p className="text-xs font-bold text-[#7a6a5d] uppercase mb-2">
                            Danh sách người lưu trú ({lodgingGuests.length} người):
                          </p>
                          <ul className="grid gap-2 text-xs">
                            {lodgingGuests.map((g, idx) => (
                              <li key={idx} className="flex items-center justify-between border-b border-serenity/10 pb-1.5 last:border-b-0 last:pb-0">
                                <span>
                                  <span className="text-[#7a6a5d] font-semibold mr-1.5">{idx + 1}.</span>
                                  <strong className="font-semibold text-[#252934]">{g.fullName || "Khách mời"}</strong>
                                  {g.age ? <span className="text-[#252934]/60 text-[11px] ml-1">({g.age} tuổi)</span> : null}
                                </span>
                                {g.isChild && (
                                  <span className="text-[10px] font-semibold bg-[#e6d8f2] text-black px-2.5 py-0.5 rounded-md">
                                    Trẻ em (&lt;11 tuổi)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(formValues.dietaryNote?.trim() || formValues.notes?.trim()) && (
                  <div>
                    <p className="text-xs sm:text-sm font-bold tracking-[0.14em] text-[#54473b] uppercase text-center mb-3.5">
                      4. GHI CHÚ & LỜI NHẮN
                    </p>
                    <div className="grid gap-3 text-sm text-[#252934] max-w-lg mx-auto w-full text-left">
                      {formValues.dietaryNote?.trim() && (
                        <div className="bg-serenity/8 p-4 rounded-2xl border border-serenity/14">
                          <p className="text-xs font-semibold text-[#7a6a5d] mb-1">Lưu ý thực đơn:</p>
                          <p className="italic text-[#252934]/90">{formValues.dietaryNote.trim()}</p>
                        </div>
                      )}
                      {formValues.notes?.trim() && (
                        <div className="bg-serenity/8 p-4 rounded-2xl border border-serenity/14">
                          <p className="text-xs font-semibold text-[#7a6a5d] mb-1">Ghi chú / Lời nhắn:</p>
                          <p className="italic text-[#252934]/90">{formValues.notes.trim()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewing(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto min-w-[170px] inline-flex h-12 items-center justify-center rounded-full border border-serenity/30 bg-white px-7 text-sm font-semibold text-[#252934] hover:bg-white/80 transition shadow-xs whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 shrink-0" /> Chỉnh sửa lại
                </button>

                <motion.button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto sm:flex-1 light-sweep inline-flex h-12 items-center justify-center rounded-full bg-rose-quartz px-7 text-sm font-bold text-[#252934] shadow-[0_16px_48px_rgba(146,168,209,0.22)] ring-1 ring-rose-quartz/70 transition hover:-translate-y-0.5 disabled:opacity-60 whitespace-nowrap"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <svg className="mr-2 h-4 w-4 animate-spin text-[#252934]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <Mail className="mr-2 h-4 w-4 shrink-0" />
                  )}
                  <span className="whitespace-nowrap">{isSubmitting ? "Đang gửi..." : "Xác nhận gửi hồi đáp"}</span>
                </motion.button>
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
                className="w-full px-4 sm:px-8 text-center"
              >
                {submitError ? (
                  <p className="mb-6 rounded-2xl border border-serenity/18 bg-white/60 px-4 py-3 text-sm font-semibold text-[#9B4E5C]">
                    {submitError}
                  </p>
                ) : null}

                {/* Khối Xác nhận tham dự (Attendance) */}
                <div className="rounded-[1.6rem] border border-serenity/18 bg-white/80 p-4 sm:p-8 shadow-sm text-center mb-6 grid gap-1 sm:gap-2">
                  
                  {/* Sự kiện 1: Thánh lễ */}
                  <div className="py-2 sm:py-6 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-6 text-center sm:text-left">
                    {/* Badge */}
                    <div className="flex h-13 w-13 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-[1.2rem] sm:rounded-[1.6rem] bg-white border border-[#f2e5e0] shadow-[0_8px_20px_rgba(242,229,224,0.5)] mb-1.5 sm:mb-0">
                      <img src="/assets/icon-cross.png" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" alt="Nhà thờ" />
                    </div>
                    
                    {/* Chữ */}
                    <div className="mb-2 sm:mb-0 sm:ml-5 sm:flex-1 text-center sm:text-left">
                      <p className="text-lg sm:text-base font-bold tracking-[0.12em] text-[#7a6a5d] uppercase mb-1 whitespace-nowrap">
                        THÁNH LỄ HÔN PHỐI
                      </p>
                      <p className="text-sm sm:text-sm font-semibold text-[#252934] mb-0.5 whitespace-nowrap">
                        10:00 — Chủ Nhật, 20/12/2026
                      </p>
                      <p className="text-sm sm:text-sm text-[#252934]/72 whitespace-nowrap">
                        Nhà Thờ Giáo Xứ Tam Hải
                      </p>
                    </div>

                    {/* Segmented Pill */}
                    <div className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 self-center sm:self-auto">
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[#7a6a5d]/75 uppercase">
                        Tham dự:
                      </span>
                      <div className="flex h-11 items-center rounded-full bg-white/80 p-1 ring-1 ring-serenity/30 shadow-[0_4px_14px_rgba(63,70,66,0.08)] shrink-0">
                        <button
                          type="button"
                          onClick={() => {
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

                  <div className="h-px w-full bg-serenity/28 my-1.5 sm:my-4" />

                  {/* Sự kiện 2: Tiệc cưới */}
                  <div className="py-2 sm:py-6 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-6 text-center sm:text-left">
                    {/* Badge */}
                    <div className="flex h-13 w-13 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-[1.2rem] sm:rounded-[1.6rem] bg-white border border-[#f2e5e0] shadow-[0_8px_20px_rgba(242,229,224,0.5)] mb-1.5 sm:mb-0">
                      <img src="/assets/icon-glasses.png" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" alt="Tiệc cưới" />
                    </div>
                    
                    {/* Chữ */}
                    <div className="mb-2 sm:mb-0 sm:ml-5 sm:flex-1 text-center sm:text-left">
                      <p className="text-lg sm:text-base font-bold tracking-[0.12em] text-[#7a6a5d] uppercase mb-1 whitespace-nowrap">
                        TIỆC CƯỚI
                      </p>
                      <p className="text-sm sm:text-sm font-semibold text-[#252934] mb-0.5 whitespace-nowrap">
                        17:30 — Thứ Bảy, 26/12/2026
                      </p>
                      <p className="text-sm sm:text-sm text-[#252934]/72 whitespace-nowrap">
                        Terracotta Hotel & Resort Đà Lạt
                      </p>
                    </div>

                    {/* Segmented Pill */}
                    <div className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 self-center sm:self-auto">
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[#7a6a5d]/75 uppercase">
                        Tham dự:
                      </span>
                      <div className="flex h-11 items-center rounded-full bg-white/80 p-1 ring-1 ring-serenity/30 shadow-[0_4px_14px_rgba(63,70,66,0.08)] shrink-0">
                        <button
                          type="button"
                          onClick={() => {
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

                  {errors.attendingCeremony && <p className="mt-2 text-xs text-center text-[#9B4E5C] font-bold">{errors.attendingCeremony.message}</p>}
                  {errors.attendingBanquet && <p className="mt-2 text-xs text-center text-[#9B4E5C] font-bold">{errors.attendingBanquet.message}</p>}
                </div>

                {/* Lưu trú - Progressive disclosure inline */}
                <AnimatePresence initial={false}>
                  {attendingBanquet === "yes" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                      animate={{ height: "auto", opacity: 1, overflow: "visible" }}
                      exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="mb-6"
                    >
                      <div className="rounded-[1.6rem] border border-serenity/18 bg-white/80 p-4 sm:p-6 shadow-sm text-center">
                        <p className="text-[0.82rem] sm:text-sm font-bold tracking-[0.15em] text-[#7a6a5d] uppercase mb-2">
                          LƯU TRÚ
                        </p>
                        <p className="text-sm sm:text-base font-normal text-[#252934]/80 mb-5 leading-relaxed max-w-xl mx-auto">
                          Để việc dự tiệc thuận tiện nhất, gia đình sẽ đặt phòng lưu trú cho Quý khách tại Resort Terracotta.<br />
                          Xin cho biết thông tin người lưu trú và số đêm nghỉ lại.
                        </p>

                        {/* Chọn đêm lưu trú (4 lựa chọn dạng thẻ) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-6">
                          {/* Option 25 */}
                          <button
                            type="button"
                            onClick={() => handleStayDecisionChange("25")}
                            className={[
                              "flex flex-col items-center justify-center min-h-[3.6rem] sm:min-h-[4.2rem] rounded-xl border p-2 sm:p-3 text-center transition-all duration-200 cursor-pointer shadow-sm",
                              stayDecision === "25"
                                ? "bg-[#7a8a5c] border-[#7a8a5c] text-white"
                                : "bg-white/80 border-serenity/22 hover:bg-white text-[#252934]"
                            ].join(" ")}
                          >
                            <span className="text-sm sm:text-base font-bold">Đêm 25/12</span>
                            <span className={`text-[11px] sm:text-xs mt-0.5 ${stayDecision === "25" ? "text-white/80" : "text-[#252934]/55"}`}>đêm trước tiệc</span>
                          </button>

                          {/* Option 26 */}
                          <button
                            type="button"
                            onClick={() => handleStayDecisionChange("26")}
                            className={[
                              "flex flex-col items-center justify-center min-h-[3.6rem] sm:min-h-[4.2rem] rounded-xl border p-2 sm:p-3 text-center transition-all duration-200 cursor-pointer shadow-sm",
                              stayDecision === "26"
                                ? "bg-[#7a8a5c] border-[#7a8a5c] text-white"
                                : "bg-white/80 border-serenity/22 hover:bg-white text-[#252934]"
                            ].join(" ")}
                          >
                            <span className="text-sm sm:text-base font-bold">Đêm 26/12</span>
                            <span className={`text-[11px] sm:text-xs mt-0.5 ${stayDecision === "26" ? "text-white/80" : "text-[#252934]/55"}`}>đêm sau tiệc</span>
                          </button>

                          {/* Option both */}
                          <button
                            type="button"
                            onClick={() => handleStayDecisionChange("both")}
                            className={[
                              "flex flex-col items-center justify-center min-h-[3.6rem] sm:min-h-[4.2rem] rounded-xl border p-2 sm:p-3 text-center transition-all duration-200 cursor-pointer shadow-sm",
                              stayDecision === "both"
                                ? "bg-[#7a8a5c] border-[#7a8a5c] text-white"
                                : "bg-white/80 border-serenity/22 hover:bg-white text-[#252934]"
                            ].join(" ")}
                          >
                            <span className="text-sm sm:text-base font-bold">Cả hai đêm</span>
                            <span className={`text-[11px] sm:text-xs mt-0.5 ${stayDecision === "both" ? "text-white/80" : "text-[#252934]/55"}`}>25/12 & 26/12</span>
                          </button>

                          {/* Option none */}
                          <button
                            type="button"
                            onClick={() => handleStayDecisionChange("none")}
                            className={[
                              "flex flex-col items-center justify-center min-h-[3.6rem] sm:min-h-[4.2rem] rounded-xl border p-2 sm:p-3 text-center transition-all duration-200 cursor-pointer shadow-sm",
                              stayDecision === "none"
                                ? "bg-[#7a4a4a] border-[#7a4a4a] text-white"
                                : "bg-[#fcfaf9]/90 border-rose-quartz/30 hover:bg-[#faf6f3] text-[#252934]/80"
                            ].join(" ")}
                          >
                            <span className="text-sm sm:text-base font-bold">Không nghỉ lại</span>
                          </button>
                        </div>

                        {/* List người lưu trú */}
                        <AnimatePresence initial={false}>
                          {stayDecision !== "none" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                              animate={{ height: "auto", opacity: 1, overflow: "visible" }}
                              exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                              transition={{ duration: 0.28, ease: "easeInOut" }}
                              className="mt-6 text-left grid gap-5"
                            >
                              {typeof errors.lodgingGuests?.message === "string" ? (
                                <p className="text-sm font-bold text-[#9B4E5C] text-center">{errors.lodgingGuests.message}</p>
                              ) : null}

                              <div className="grid gap-4">
                                {fields.map((field, index) => {
                                  const isChild = Boolean(watchedLodgingGuests?.[index]?.isChild);
                                  const guestErrors = errors.lodgingGuests?.[index];

                                  return (
                                    <div key={field.id} className="relative rounded-2xl border border-serenity/12 bg-white/45 p-4 text-left shadow-[0_2px_8px_rgba(146,168,209,0.06)]">
                                      {/* Header with Title & Close/Delete Button */}
                                      <div className="mb-3.5 flex items-center justify-between">
                                        <p className="text-[11px] font-bold tracking-widest text-[#252934]/40 uppercase">Người lưu trú {index + 1}</p>
                                        <button
                                          type="button"
                                          onClick={() => fields.length === 1 ? replace([createLodgingGuest("")]) : remove(index)}
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
                                                label={<span className="text-xs font-bold tracking-wider text-[#252934]/68">Họ tên</span>}
                                              >
                                                <input className={inputClass} placeholder="VD: Nguyễn Văn A" {...register(`lodgingGuests.${index}.fullName`)} />
                                              </Field>
                                            </div>
                                            <div className="sm:col-span-5 flex flex-col w-full h-full justify-end">
                                              <span className="text-xs font-bold tracking-wider text-transparent select-none mb-2 hidden sm:block" aria-hidden="true">Spacer</span>
                                              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-serenity/18 bg-white/70 px-3 py-2.5 text-xs font-semibold text-[#252934] transition hover:bg-white shadow-sm w-full justify-center h-13 shrink-0">
                                                <input type="checkbox" className="h-4 w-4 rounded text-serenity accent-serenity focus:ring-serenity/30" {...register(`lodgingGuests.${index}.isChild`)} />
                                                <span>Là trẻ em (dưới 11 tuổi)</span>
                                              </label>
                                            </div>
                                          </div>
                                          {guestErrors?.fullName?.message && (
                                            <p className="text-xs font-bold text-[#9B4E5C] text-center sm:text-left mt-1 ml-1">
                                              {guestErrors.fullName.message}
                                            </p>
                                          )}
                                        </div>

                                        {isChild && (
                                          <div className="w-full">
                                            <Field
                                              label={<span className="text-xs font-bold tracking-wider text-[#252934]/68">Tuổi của bé</span>}
                                              error={guestErrors?.age?.message}
                                            >
                                              <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                onWheel={(e) => e.currentTarget.blur()}
                                                className={`${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                                                placeholder="VD: 5"
                                                {...register(`lodgingGuests.${index}.age`, {
                                                  setValueAs: (value) => value === "" ? undefined : Number(value),
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
                                  onClick={() => append(createLodgingGuest(""))}
                                  className="wedding-type-button inline-flex min-h-11 items-center gap-2 rounded-full border border-serenity/32 bg-serenity/30 px-6 font-bold text-[#252934] transition hover:bg-serenity/45"
                                >
                                  <Plus className="h-4 w-4" /> THÊM NGƯỜI LƯU TRÚ
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Ghi chú & Nút gửi - chỉ hiện khi đã trả lời xong 2 câu hỏi trên */}
                <AnimatePresence initial={false}>
                  {hasAnsweredBothEvents && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                      animate={{ height: "auto", opacity: 1, overflow: "visible" }}
                      exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {/* Ghi chú */}
                      <div className="rounded-[1.6rem] border border-serenity/18 bg-white/80 p-5 shadow-sm text-left mb-6">
                        <p className="text-[0.82rem] sm:text-sm font-bold tracking-[0.15em] text-[#7a6a5d] uppercase mb-4">
                          Ghi chú
                        </p>
                        <div className="grid gap-5">
                          <textarea
                            className={`${inputClass} min-h-28 py-4 text-left`}
                            placeholder={
                              attending === "no"
                                ? "Quý khách có thể để lại lời chúc mừng hoặc nhắn gửi cho Nhật & Phương"
                                : "Quý khách có thể nhắn giờ đến dự kiến, yêu cầu ghế trẻ em, hỗ trợ đi lại hoặc hỗ trợ người lớn tuổi,... nếu có"
                            }
                            {...register("notes")}
                          />
                          {hasBanquet && attending !== "no" && (
                            <Field label="Lưu ý thực đơn">
                              <textarea
                                className={`${inputClass} min-h-24 py-4 text-left`}
                                placeholder="Ăn chay, dị ứng, kiêng món, không dùng rượu/cồn, hoặc cần suất trẻ em nếu có."
                                {...register("dietaryNote")}
                              />
                            </Field>
                          )}
                        </div>
                      </div>

                      {/* Nút XEM LẠI VÀ HOÀN TẤT */}
                      <div className="mt-4 flex justify-center">
                        <motion.button
                          type="button"
                          onClick={handleGoToReview}
                          disabled={guestRsvpLocked}
                          className="light-sweep wedding-type-button inline-flex min-h-13 items-center justify-center rounded-full bg-rose-quartz px-10 text-base font-bold text-[#252934] shadow-[0_16px_48px_rgba(146,168,209,0.22)] ring-1 ring-rose-quartz/70 disabled:opacity-60 uppercase tracking-wide"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Mail className="mr-2.5 h-5 w-5" />
                          XEM LẠI VÀ HOÀN TẤT
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
