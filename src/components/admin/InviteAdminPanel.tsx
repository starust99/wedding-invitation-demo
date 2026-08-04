"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare,
  Copy,
  Download,
  FileUp,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Save,
  Square,
  Trash2,
  ClipboardList,
  FileSpreadsheet,
  Hotel,
  PencilRuler,
  UsersRound,
  Images,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import {
  buildInviteUrl,
  createMediaAsset,
  defaultAlbumRules,
  filterMediaAssetsForInvitee,
  generateInviteToken,
  householdModeLabels,
  invitedByLabels,
  inviteUnitLabels,
  joinAudienceTags,
  parseAudienceTags,
  plusOnePolicyLabels,
  readLocalAlbumRules,
  readLocalInvitees,
  readLocalMediaAssets,
  upsertLocalInvitees,
  writeLocalAlbumRules,
  writeLocalInvitees,
  writeLocalMediaAssets,
  type AlbumRule,
  type Invitee,
  type InviteImportResult,
  type MediaAsset,
} from "@/lib/invites";
import { buildInvitationCopy } from "@/lib/guest-personalization";
import { toInviteeUpsert } from "@/lib/invite-mapper";
import { downloadCsv, toRSVPCsv } from "@/lib/csv";
import {
  attendingLabel,
  readRSVPResponses,
  removeRSVPResponses,
  summarizeLodgingGuests,
  clearRSVPResponses,
  type RSVPResponse,
} from "@/lib/rsvp-storage";
import { applyTheme } from "@/lib/site-settings";
import { usePublishedSettings } from "@/lib/use-published-settings";

type SimpleInviteEntry = {
  salutationCluster: string;
  guestNameCore: string;
  guestGroup: string;
  postCeremonyPartyInvited?: string;
};

type SimpleInviteEntryOptions = {
  salutationClusters: string[];
  guestGroups: string[];
};

type InviteAdminApiResponse = {
  backend: "local" | "supabase";
  invitees?: Invitee[];
  mediaAssets?: MediaAsset[];
  albumRules?: AlbumRule[];
  simpleInviteEntryOptions?: SimpleInviteEntryOptions;
};

const panelInput =
  "min-h-11 w-full rounded-2xl border border-[#E8DDCC] bg-white px-4 text-sm font-normal normal-case tracking-normal text-[#2E2A25] outline-none transition placeholder:text-[#8A8178] focus:border-[#6B7A5A] focus:ring-4 focus:ring-[#6B7A5A]/12";

const panelSelect = `${panelInput} pr-8`;

const emptySimpleInviteEntry: SimpleInviteEntry = {
  salutationCluster: "",
  guestNameCore: "",
  guestGroup: "",
  postCeremonyPartyInvited: "",
};

const inviteStatusLabels: Record<Invitee["inviteStatus"], string> = {
  invited: "Chưa gửi",
  rsvp_yes: "Đã xác nhận",
  rsvp_no: "Đã từ chối",
  rsvp_maybe: "Đang cân nhắc",
  supplement_ready: "Đã cập nhật",
  album_ready: "Đã sẵn sàng xem album",
};


function formatDate(value: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}

function buildInvitePayload(invitee: Invitee) {
  return toInviteeUpsert(invitee);
}

function buildInviteCopyPatch(invitee: Invitee, coupleDisplayName: string): Pick<Invitee, "envelopeLine" | "insideInviteLine"> {
  const inviteCopy = buildInvitationCopy({
    ...invitee,
    coupleDisplayName,
  });

  return {
    envelopeLine: inviteCopy.envelopeLine,
    insideInviteLine: inviteCopy.insideInviteLine,
  };
}

function normalizeInviteeMatchKey(value?: string) {
  return value
    ?.toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function InviteAdminPanel() {
  const router = useRouter();
  const publishedSettings = usePublishedSettings();
  const config = applyTheme(publishedSettings.content, publishedSettings.themeKey);
  const [backend, setBackend] = useState<"local" | "supabase">("local");
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [albumRules, setAlbumRules] = useState<AlbumRule[]>(defaultAlbumRules);
  const [responses, setResponses] = useState<RSVPResponse[]>([]);
  const [selectedInviteeId, setSelectedInviteeId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [importNotice, setImportNotice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mediaMessage, setMediaMessage] = useState("");
  const [tab, setTab] = useState<"rsvps" | "invitees" | "album">("rsvps");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastImportedInviteeIds, setLastImportedInviteeIds] = useState<string[]>([]);
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<Set<string>>(() => new Set());
  const [isAddingInvitee, setIsAddingInvitee] = useState(false);
  const [simpleInviteEntry, setSimpleInviteEntry] = useState<SimpleInviteEntry>(emptySimpleInviteEntry);
  const [simpleInviteEntryOptions, setSimpleInviteEntryOptions] = useState<SimpleInviteEntryOptions>({ salutationClusters: [], guestGroups: [] });
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const [attendingFilter, setAttendingFilter] = useState("all");
  const [postCeremonyFilter, setPostCeremonyFilter] = useState("all");
  const [accommodationFilter, setAccommodationFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selectedResponseIds, setSelectedResponseIds] = useState<Set<string>>(() => new Set());
  const [deletingRsvp, setDeletingRsvp] = useState(false);
  const [exportingWorkbook, setExportingWorkbook] = useState(false);

  const selectedInvitee = useMemo(() => {
    return invitees.find((item) => item.id === selectedInviteeId) ?? invitees[0] ?? null;
  }, [invitees, selectedInviteeId]);
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const [inviteResponse, rsvpResponse] = await Promise.all([
          fetch("/api/admin/invites", { cache: "no-store" }),
          fetch("/api/rsvp", { cache: "no-store" }),
        ]);

        if (inviteResponse.status === 401 || rsvpResponse.status === 401) {
          router.push("/admin/login");
          return;
        }

        const localInvitees = readLocalInvitees();
        const localMedia = readLocalMediaAssets();
        const localRules = readLocalAlbumRules();
        const localResponses = readRSVPResponses();

        let nextBackend: "local" | "supabase" = "local";
        let nextInvitees = localInvitees;
        let nextMediaAssets = localMedia;
        let nextAlbumRules = localRules;
        let nextResponses = localResponses;
        let nextSimpleInviteEntryOptions: SimpleInviteEntryOptions = { salutationClusters: [], guestGroups: [] };

        if (inviteResponse.ok) {
          const result = await inviteResponse.json() as InviteAdminApiResponse & { responses?: RSVPResponse[] };
          nextSimpleInviteEntryOptions = result.simpleInviteEntryOptions ?? nextSimpleInviteEntryOptions;
          if (result.backend === "supabase") {
            nextBackend = "supabase";
            nextInvitees = result.invitees ?? [];
            nextMediaAssets = result.mediaAssets ?? [];
            nextAlbumRules = result.albumRules?.length ? result.albumRules : defaultAlbumRules;
            nextResponses = result.responses ?? [];
          }
        }

        if (rsvpResponse.ok) {
          const result = await rsvpResponse.json() as { responses: RSVPResponse[]; backend: string };
          if (result.backend === "supabase") {
            nextResponses = result.responses ?? [];
          }
        }

        if (nextResponses.length === 0 && nextInvitees.length > 0) {
          const derivedResponses = nextInvitees.map((i) => i.rsvp).filter((r): r is RSVPResponse => Boolean(r));
          if (derivedResponses.length > 0) {
            nextResponses = derivedResponses;
          }
        }

        if (!cancelled) {
          setBackend(nextBackend);
          setInvitees(nextInvitees);
          setMediaAssets(nextMediaAssets);
          setAlbumRules(nextAlbumRules);
          setResponses(nextResponses);
          setSimpleInviteEntryOptions(nextSimpleInviteEntryOptions);
          setSelectedInviteeId((current) => current || nextInvitees[0]?.id || "");
        }
      } catch {
        if (cancelled) return;
        setBackend("local");
        setInvitees(readLocalInvitees());
        setMediaAssets(readLocalMediaAssets());
        setAlbumRules(readLocalAlbumRules());
        setResponses(readRSVPResponses());
      }
    }

    void refresh();

    const handleStorage = () => void refresh();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("wedding-invitees-updated", handleStorage);
    window.addEventListener("wedding-media-assets-updated", handleStorage);
    window.addEventListener("wedding-album-rules-updated", handleStorage);
    window.addEventListener("wedding-rsvp-updated", handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("wedding-invitees-updated", handleStorage);
      window.removeEventListener("wedding-media-assets-updated", handleStorage);
      window.removeEventListener("wedding-album-rules-updated", handleStorage);
      window.removeEventListener("wedding-rsvp-updated", handleStorage);
    };
  }, [router]);

  const rsvpByInviteeId = useMemo(() => {
    const map = new Map<string, RSVPResponse>();
    for (const response of responses) {
      if (response.inviteeId && !map.has(response.inviteeId)) {
        map.set(response.inviteeId, response);
      }
    }
    return map;
  }, [responses]);
  const inviteeById = useMemo(() => new Map(invitees.map((invitee) => [invitee.id, invitee])), [invitees]);
  const inviteeByToken = useMemo(() => new Map(invitees.map((invitee) => [invitee.token, invitee])), [invitees]);

  const inviteeForResponse = useCallback((response: RSVPResponse) => {
    return (response.inviteeId ? inviteeById.get(response.inviteeId) : undefined)
      ?? (response.inviteToken ? inviteeByToken.get(response.inviteToken) : undefined);
  }, [inviteeById, inviteeByToken]);

  const postCeremonyStatus = useCallback((response: RSVPResponse) => {
    const invitee = inviteeForResponse(response);
    if (!invitee?.postCeremonyPartyInvited || response.attendingCeremony !== true) return "not_applicable";
    if (response.attendingPostCeremonyParty === true) return "yes";
    if (response.attendingPostCeremonyParty === false) return "no";
    return "pending";
  }, [inviteeForResponse]);

  const enrichResponsesForExport = useCallback((source: RSVPResponse[]) => {
    return source.map((response) => ({
      ...response,
      postCeremonyPartyInvited: Boolean(inviteeForResponse(response)?.postCeremonyPartyInvited),
    }));
  }, [inviteeForResponse]);

  const selectedRsvp = selectedInvitee?.id ? rsvpByInviteeId.get(selectedInvitee.id) : undefined;
  const visibleAlbumAssets = selectedInvitee ? filterMediaAssetsForInvitee(mediaAssets, selectedInvitee, albumRules) : mediaAssets.filter((asset) => asset.status === "published");
  const visibleInvitees = useMemo(() => {
    const normalizedQuery = normalizeInviteeMatchKey(searchQuery);
    if (!normalizedQuery) return invitees;

    return invitees.filter((invitee) => [
      invitee.displayLabel,
      invitee.guestName,
      invitee.invitationName,
      invitee.guestGroup,
      householdModeLabels[invitee.householdMode],
      invitee.relationship,
      invitee.hostRelationship,
      invitee.token,
    ].some((value) => normalizeInviteeMatchKey(value).includes(normalizedQuery)));
  }, [invitees, searchQuery]);
  const lastImportedInvitees = useMemo(() => {
    if (lastImportedInviteeIds.length === 0) return [];
    const byId = new Map(invitees.map((invitee) => [invitee.id, invitee]));
    return lastImportedInviteeIds.map((id) => byId.get(id)).filter((invitee): invitee is Invitee => Boolean(invitee));
  }, [invitees, lastImportedInviteeIds]);
  const allVisibleInviteesSelected = visibleInvitees.length > 0 && visibleInvitees.every((invitee) => selectedInviteeIds.has(invitee.id));
  const selectedInvitees = useMemo(
    () => invitees.filter((invitee) => selectedInviteeIds.has(invitee.id)),
    [invitees, selectedInviteeIds],
  );

  function persistMedia(nextMediaAssets: MediaAsset[], nextAlbumRules: AlbumRule[]) {
    setMediaAssets(nextMediaAssets);
    setAlbumRules(nextAlbumRules);

    if (backend === "supabase") {
      return fetch("/api/admin/media-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets: nextMediaAssets, albumRules: nextAlbumRules }),
      }).then((response) => {
        if (!response.ok) throw new Error("Không lưu được album.");
        return response.json() as Promise<{ ok: boolean }>;
      }).then(() => undefined);
    }

    writeLocalMediaAssets(nextMediaAssets);
    writeLocalAlbumRules(nextAlbumRules);
    return Promise.resolve();
  }

  function patchSelectedInvitee(patch: Partial<Invitee>) {
    if (!selectedInvitee) return;
    const now = new Date().toISOString();
    const nextInvitees = invitees.map((item) => item.id === selectedInvitee.id
      ? { ...item, ...patch, updatedAt: now }
      : item);
    setInvitees(nextInvitees);
  }

  function patchSelectedGuestUnit(householdMode: Invitee["householdMode"]) {
    const isHousehold = householdMode === "couple" || householdMode === "family";
    patchSelectedInvitee({
      householdMode,
      inviteUnit: isHousehold ? "household" : "individual",
      plusOnePolicy: householdMode === "family" ? "family" : householdMode === "couple" ? "spouse" : "none",
      expectedGuestCount: householdMode === "family" ? 4 : householdMode === "couple" ? 2 : 1,
    });
  }

  function regenerateSelectedInviteCopy() {
    if (!selectedInvitee) return;
    patchSelectedInvitee(buildInviteCopyPatch(selectedInvitee, config.couple.displayName));
    setMessage("Đã tạo lại dòng phong bì và lời mời theo cách xưng hô hiện tại.");
  }

  function setInviteeSelection(inviteeId: string, checked: boolean) {
    setSelectedInviteeIds((current) => {
      const next = new Set(current);
      if (checked) next.add(inviteeId);
      else next.delete(inviteeId);
      return next;
    });
  }

  function toggleVisibleInviteesSelection() {
    setSelectedInviteeIds((current) => {
      const next = new Set(current);
      if (allVisibleInviteesSelected) {
        for (const invitee of visibleInvitees) next.delete(invitee.id);
      } else {
        for (const invitee of visibleInvitees) next.add(invitee.id);
      }
      return next;
    });
  }

  async function saveSelectedInvitee() {
    if (!selectedInvitee) return;
    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (backend === "supabase") {
        const response = await fetch(`/api/admin/invites/${selectedInvitee.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildInvitePayload(selectedInvitee)),
        });

        if (!response.ok) throw new Error("Không lưu được khách mời.");
        const result = await response.json() as { invitee: Invitee };
        setInvitees((current) => current.map((item) => item.id === result.invitee.id ? result.invitee : item));
        setMessage("Đã lưu khách mời.");
      } else {
        writeLocalInvitees(invitees);
        setMessage("Đã lưu khách mời vào bộ nhớ trình duyệt.");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không lưu được khách mời.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateToken() {
    if (!selectedInvitee) return;
    if (!window.confirm("Token cũ sẽ ngừng hoạt động ngay. Bạn có chắc muốn tạo token mới cho khách này?")) return;
    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (backend === "supabase") {
        const response = await fetch(`/api/admin/invites/${selectedInvitee.id}/token-regenerate`, { method: "POST" });
        if (!response.ok) throw new Error("Không tạo lại token được.");
        const result = await response.json() as { token: string };
        setInvitees((current) => current.map((item) => item.id === selectedInvitee.id ? { ...item, token: result.token, updatedAt: new Date().toISOString() } : item));
        setMessage("Đã tạo token mới.");
      } else {
        const existingTokens = new Set(invitees.filter((item) => item.id !== selectedInvitee.id).map((item) => item.token));
        const nextToken = generateInviteToken(selectedInvitee.displayLabel || selectedInvitee.guestName, existingTokens);
        const nextInvitees = invitees.map((item) => item.id === selectedInvitee.id
          ? { ...item, token: nextToken, updatedAt: new Date().toISOString() }
          : item);
        setInvitees(nextInvitees);
        writeLocalInvitees(nextInvitees);
        setMessage("Đã tạo token mới cho local.");
      }
    } catch (regenError) {
      setError(regenError instanceof Error ? regenError.message : "Không tạo lại token được.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelectedInvitee() {
    if (!selectedInvitee) return;
    if (!window.confirm(`Xóa ${selectedInvitee.displayLabel} và lời hồi đáp gắn với link này?`)) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (backend === "supabase") {
        const response = await fetch(`/api/admin/invites/${selectedInvitee.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Không xóa được khách mời.");
      } else {
        const nextResponses = removeRSVPResponses((response) => (
          response.inviteeId === selectedInvitee.id || response.inviteToken === selectedInvitee.token
        ));
        setResponses(nextResponses);
      }

      const nextInvitees = invitees.filter((item) => item.id !== selectedInvitee.id);
      setInvitees(nextInvitees);
      setLastImportedInviteeIds((current) => current.filter((id) => id !== selectedInvitee.id));
      setSelectedInviteeIds((current) => {
        const next = new Set(current);
        next.delete(selectedInvitee.id);
        return next;
      });
      if (backend !== "supabase") writeLocalInvitees(nextInvitees);
      setResponses((current) => current.filter((response) => (
        response.inviteeId !== selectedInvitee.id && response.inviteToken !== selectedInvitee.token
      )));
      setSelectedInviteeId(nextInvitees[0]?.id ?? "");
      setMessage("Đã xóa khách mời.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không xóa được khách mời.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelectedInvitees() {
    if (selectedInvitees.length === 0) return;
    if (!window.confirm(`Xóa ${selectedInvitees.length} khách mời đã chọn và toàn bộ hồi đáp gắn với các link này?`)) return;

    setBulkDeleting(true);
    setMessage("");
    setError("");

    try {
      if (backend === "supabase") {
        for (const invitee of selectedInvitees) {
          const response = await fetch(`/api/admin/invites/${invitee.id}`, { method: "DELETE" });
          if (!response.ok) {
            const result = await response.json().catch(() => null) as { error?: string } | null;
            throw new Error(result?.error || `Không xóa được khách mời ${invitee.displayLabel}.`);
          }
        }
      } else {
        removeRSVPResponses((response) => selectedInvitees.some((invitee) => (
          response.inviteeId === invitee.id || response.inviteToken === invitee.token
        )));
      }

      const deletedIds = new Set(selectedInvitees.map((invitee) => invitee.id));
      const deletedTokens = new Set(selectedInvitees.map((invitee) => invitee.token));
      const nextInvitees = invitees.filter((invitee) => !deletedIds.has(invitee.id));

      setInvitees(nextInvitees);
      setResponses((current) => current.filter((response) => (
        !(response.inviteeId && deletedIds.has(response.inviteeId))
        && !(response.inviteToken && deletedTokens.has(response.inviteToken))
      )));
      setLastImportedInviteeIds((current) => current.filter((id) => !deletedIds.has(id)));
      setSelectedInviteeIds(new Set());
      setSelectedInviteeId((current) => {
        if (current && !deletedIds.has(current)) return current;
        return nextInvitees[0]?.id ?? "";
      });

      if (backend !== "supabase") writeLocalInvitees(nextInvitees);

      setMessage(`Đã xóa ${selectedInvitees.length} khách mời đã chọn.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không xóa được các khách mời đã chọn.");
    } finally {
      setBulkDeleting(false);
    }
  }

  function startAddingInvitee() {
    setSimpleInviteEntry(emptySimpleInviteEntry);
    setIsAddingInvitee(true);
    setMessage("");
    setError("");
  }

  function cancelAddingInvitee() {
    setIsAddingInvitee(false);
    setSimpleInviteEntry(emptySimpleInviteEntry);
    setError("");
  }

  async function addInvitee() {
    if (!simpleInviteEntry.salutationCluster) {
      setError("Chọn cụm danh xưng.");
      return;
    }
    if (!simpleInviteEntry.guestGroup) {
      setError("Chọn nhóm khách.");
      return;
    }

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simpleInviteEntry,
          coupleDisplayName: config.couple.displayName,
          existingTokens: backend === "local" ? invitees.map((item) => item.token) : undefined,
        }),
      });
      const result = await response.json() as InviteAdminApiResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "Không tạo được khách mời.");
      const savedInvitee = result.invitees?.[0];
      if (!savedInvitee) throw new Error("Không nhận được thông tin khách vừa tạo.");

      const nextInvitees = [savedInvitee, ...invitees];
      const nextSelectedId = savedInvitee.id;
      if (backend === "local") writeLocalInvitees(nextInvitees);

      setInvitees(nextInvitees);
      setSelectedInviteeId(nextSelectedId);
      setLastImportedInviteeIds([nextSelectedId]);
      setIsAddingInvitee(false);
      setSimpleInviteEntry(emptySimpleInviteEntry);
      setMessage("Đã tạo khách mời mới.");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Không tạo được khách mời.");
    } finally {
      setBusy(false);
    }
  }

  function preserveExistingInviteLinks(nextInvitees: Invitee[], hasPostCeremonyPartyColumn = true) {
    const byKey = new Map<string, Invitee>();
    for (const invitee of invitees) {
      for (const key of [invitee.displayLabel, invitee.guestName, invitee.invitationName]) {
        const normalized = normalizeInviteeMatchKey(key);
        if (normalized && !byKey.has(normalized)) byKey.set(normalized, invitee);
      }
    }

    return nextInvitees.map((invitee) => {
      const match = byKey.get(normalizeInviteeMatchKey(invitee.displayLabel))
        ?? byKey.get(normalizeInviteeMatchKey(invitee.guestName))
        ?? byKey.get(normalizeInviteeMatchKey(invitee.invitationName));
      if (!match) return invitee;

      return {
        ...invitee,
        id: match.id,
        token: match.token,
        createdAt: match.createdAt,
        inviteStatus: match.inviteStatus,
        postCeremonyPartyInvited: hasPostCeremonyPartyColumn
          ? invitee.postCeremonyPartyInvited
          : match.postCeremonyPartyInvited,
        rsvp: match.rsvp,
      };
    });
  }

  async function importInvitees(parsed: InviteImportResult) {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (parsed.errors.length) {
        setImportNotice(parsed.errors.join(" "));
        throw new Error("File Excel còn dòng thiếu lựa chọn dropdown. Kiểm tra sheet Danh sách khách mời rồi upload lại.");
      } else {
        setImportNotice("");
      }

      const hasPostCeremonyPartyColumn = parsed.hasPostCeremonyPartyColumn !== false;
      const nextInvitees = preserveExistingInviteLinks(parsed.invitees, hasPostCeremonyPartyColumn);
      if (nextInvitees.length === 0) throw new Error("File Excel chưa có dòng khách mời hợp lệ.");
      if (!hasPostCeremonyPartyColumn) {
        setImportNotice("File Excel cũ chưa có cột Tham gia tiệc sau Hôn phối. Hệ thống đã giữ nguyên thiết lập hiện tại của khách cũ; khách mới mặc định không được hỏi.");
      }

      if (backend === "supabase") {
        const response = await fetch("/api/admin/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitees: nextInvitees }),
        });
        if (!response.ok) throw new Error("Không import được danh sách Excel.");
        const result = await response.json() as InviteAdminApiResponse;
        const savedInvitees = result.invitees?.length ? result.invitees : nextInvitees;
        const byToken = new Map(invitees.map((invitee) => [invitee.token, invitee]));
        for (const invitee of savedInvitees) byToken.set(invitee.token, invitee);
        setInvitees([...byToken.values()]);
        setLastImportedInviteeIds(savedInvitees.map((invitee) => invitee.id));
        setSelectedInviteeId(savedInvitees[0]?.id || selectedInviteeId);
        setMessage(`Đã nhập ${nextInvitees.length} khách mời từ Excel. Có thể xuất file link riêng cho đúng đợt vừa nạp ngay bây giờ.`);
      } else {
        const merged = upsertLocalInvitees(nextInvitees);
        setInvitees(merged);
        setLastImportedInviteeIds(nextInvitees.map((invitee) => invitee.id));
        setSelectedInviteeId(nextInvitees[0]?.id || selectedInviteeId);
        setMessage(`Đã nhập ${nextInvitees.length} khách mời vào bộ nhớ trình duyệt. Có thể xuất file link riêng cho đúng đợt vừa nạp ngay bây giờ.`);
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Không import được danh sách Excel.");
    } finally {
      setBusy(false);
    }
  }

  async function importWorkbookFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("coupleDisplayName", config.couple.displayName || "");
      const response = await fetch("/api/admin/invite-workbook", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || "Không đọc được file Excel.");
      }

      const parsed = await response.json() as InviteImportResult;
      await importInvitees(parsed);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Không đọc được file Excel.");
    } finally {
      setBusy(false);
      if (importFileRef.current) importFileRef.current.value = "";
    }
  }

  async function addMediaAsset() {
    const nextMedia = [createMediaAsset({ src: "", title: "Ảnh album", alt: "Ảnh album cưới", photoTags: ["public"] }), ...mediaAssets];
    await persistMedia(nextMedia, albumRules);
    setMediaMessage("Đã thêm ảnh mới.");
  }

  function updateMediaAsset(index: number, patch: Partial<MediaAsset>) {
    setMediaAssets((current) => current.map((asset, assetIndex) => assetIndex === index ? { ...asset, ...patch, updatedAt: new Date().toISOString() } : asset));
  }

  function removeMediaAsset(index: number) {
    const nextMedia = mediaAssets.filter((_, assetIndex) => assetIndex !== index);
    void persistMedia(nextMedia, albumRules);
  }

  function updateAlbumRule(index: number, patch: Partial<AlbumRule>) {
    setAlbumRules((current) => current.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule));
  }

  function addAlbumRule() {
    const nextRules = [...albumRules, { audienceTag: `tag-${albumRules.length + 1}`, allowedPhotoTags: ["public"] }];
    setAlbumRules(nextRules);
  }

  function removeAlbumRule(index: number) {
    const nextRules = albumRules.filter((_, ruleIndex) => ruleIndex !== index);
    setAlbumRules(nextRules);
  }

  async function saveAlbum() {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      await persistMedia(mediaAssets, albumRules);
      setMediaMessage("Đã lưu album.");
      setMessage("Đã lưu ảnh album và quy tắc album.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không lưu được album.");
    } finally {
      setBusy(false);
    }
  }

  function copyInviteLink() {
    if (!selectedInvitee) return;
    const url = buildInviteUrl(selectedInvitee.token, window.location.origin);
    void navigator.clipboard.writeText(url);
    setMessage("Đã sao chép link.");
  }

  async function exportInviteLinksWorkbook(targetInvitees: Invitee[] = invitees, label = "toàn bộ danh sách") {
    setMessage("");
    setError("");

    try {
      if (targetInvitees.length === 0) {
        throw new Error("Chưa có khách mời để xuất link.");
      }

      const response = await fetch("/api/admin/invite-links-workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitees: targetInvitees, origin: window.location.origin }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || "Không xuất được Excel link riêng.");
      }

      downloadBlob(`danh-sach-link-thiep-moi-${new Date().toISOString().slice(0, 10)}.xlsx`, await response.blob());
      setMessage(`Đã xuất Excel link thiệp mời độc bản cho ${label}.`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Không xuất được Excel link riêng.");
    }
  }

  async function downloadTemplate() {
    setMessage("");
    setError("");

    try {
      const params = new URLSearchParams({ coupleDisplayName: config.couple.displayName || "" });
      const response = await fetch(`/api/admin/invite-template?${params.toString()}`);
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!response.ok) throw new Error("Không tải được mẫu Excel.");
      downloadBlob("mau-danh-sach-khach-moi.xlsx", await response.blob());
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Không tải được mẫu Excel.");
    }
  }

  const summary = useMemo(() => {
    const yes = responses.filter((response) => response.attending === "yes").length;
    const no = responses.filter((response) => response.attending === "no").length;
    const maybe = responses.filter((response) => response.attending === "maybe").length;
    return { yes, no, maybe, total: responses.length };
  }, [responses]);

  const filteredResponses = useMemo(() => {
    return responses.filter((response) => {
      if (attendingFilter !== "all" && response.attending !== attendingFilter) return false;
      if (postCeremonyFilter !== "all" && postCeremonyStatus(response) !== postCeremonyFilter) return false;
      if (accommodationFilter === "yes" && !response.accommodationNeeded) return false;
      if (accommodationFilter === "no" && response.accommodationNeeded) return false;
      if (groupFilter !== "all" && response.guestGroup !== groupFilter) return false;
      return true;
    });
  }, [responses, attendingFilter, postCeremonyFilter, accommodationFilter, groupFilter, postCeremonyStatus]);

  const notAttending = useMemo(() => responses.filter((response) => response.attending === "no").length, [responses]);
  const ceremonyGuests = useMemo(() => responses.filter((response) => response.attending === "yes" && response.attendingCeremony).reduce((sum, response) => sum + response.guestCount, 0), [responses]);
  const postCeremonyPartyGuests = useMemo(() => responses.filter((response) => response.attending === "yes" && response.attendingPostCeremonyParty).reduce((sum, response) => sum + response.guestCount, 0), [responses]);
  const banquetGuests = useMemo(() => responses.filter((response) => response.attending === "yes" && response.attendingBanquet).reduce((sum, response) => sum + response.guestCount, 0), [responses]);
  const stayingGuests = useMemo(() => responses.reduce((sum, response) => sum + (response.stayingGuestCount ?? response.lodgingGuests?.length ?? 0), 0), [responses]);
  const accommodationRequests = useMemo(() => responses.filter((response) => response.accommodationNeeded).length, [responses]);
  const childrenStaying = useMemo(() => responses.reduce((sum, response) => sum + response.childrenCount, 0), [responses]);

  const stayingDec25 = useMemo(() => responses.reduce((sum, response) => {
    const isDec25 = response.checkInDate === "2026-12-25" || (response as any).stayDecision === "25" || (response as any).stayDecision === "both";
    return sum + (isDec25 ? (response.stayingGuestCount ?? response.lodgingGuests?.length ?? 0) : 0);
  }, 0), [responses]);

  const stayingDec26 = useMemo(() => responses.reduce((sum, response) => {
    const checkIn = response.checkInDate;
    const checkOut = response.checkOutDate;
    const isDec26 = (checkIn === "2026-12-26") || (checkIn === "2026-12-25" && checkOut === "2026-12-27") || (response as any).stayDecision === "26" || (response as any).stayDecision === "both";
    return sum + (isDec26 ? (response.stayingGuestCount ?? response.lodgingGuests?.length ?? 0) : 0);
  }, 0), [responses]);

  const allVisibleSelected = filteredResponses.length > 0 && filteredResponses.every((response) => selectedResponseIds.has(response.id));
  const selectedResponses = useMemo(() => responses.filter((response) => selectedResponseIds.has(response.id)), [responses, selectedResponseIds]);
  const selectedCount = selectedResponses.length;

  const groups = useMemo(() => [...new Set(responses.map((response) => response.guestGroup).filter(Boolean))], [responses]);

  function setResponseSelection(id: string, checked: boolean) {
    setSelectedResponseIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleVisibleResponses() {
    setSelectedResponseIds((current) => {
      const visibleIds = filteredResponses.map((response) => response.id);
      const visibleSelected = visibleIds.every((id) => current.has(id));
      const next = new Set(current);
      if (visibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  async function deleteSelectedResponses() {
    if (selectedResponses.length === 0) return;
    const ids = selectedResponses.map((response) => response.id);
    if (!window.confirm(`Xóa ${ids.length} lời hồi đáp đã chọn?`)) return;

    setDeletingRsvp(true);
    setMessage("");
    setError("");

    try {
      if (backend === "supabase") {
        const apiResponse = await fetch("/api/rsvp", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        if (!apiResponse.ok) {
          const result = await apiResponse.json().catch(() => null) as { error?: string } | null;
          throw new Error(result?.error || "Không xoá được lời hồi đáp.");
        }
      } else {
        const nextResponses = removeRSVPResponses((response) => selectedResponseIds.has(response.id));
        setResponses(nextResponses);
      }

      if (backend === "supabase") {
        const selected = new Set(ids);
        setResponses((current) => current.filter((response) => !selected.has(response.id)));
      }

      setSelectedResponseIds(new Set());
      setMessage(`Đã xoá ${ids.length} lời hồi đáp.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không xoá được lời hồi đáp.");
    } finally {
      setDeletingRsvp(false);
    }
  }

  function exportCsv() {
    downloadCsv(`rsvp-responses-${new Date().toISOString().slice(0, 10)}.csv`, toRSVPCsv(enrichResponsesForExport(filteredResponses)));
  }

  async function exportRsvpWorkbook(kind: "filtered" | "lodging") {
    const date = new Date().toISOString().slice(0, 10);
    const sourceResponses = kind === "lodging"
      ? responses.filter((response) => response.accommodationNeeded)
      : filteredResponses;
    const title = kind === "lodging"
      ? "Danh sách lưu trú gửi resort/hotel"
      : "Tổng hợp lời hồi đáp theo bộ lọc hiện tại";

    if (sourceResponses.length === 0) {
      setError(kind === "lodging" ? "Chưa có khách đăng ký lưu trú để xuất Excel." : "Chưa có lời hồi đáp để xuất Excel.");
      return;
    }

    setExportingWorkbook(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/rsvp-workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: enrichResponsesForExport(sourceResponses), title }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || "Không xuất được Excel hồi đáp.");
      }

      const filename = kind === "lodging"
        ? `danh-sach-luu-tru-resort-${date}.xlsx`
        : `tong-hop-hoi-dap-${date}.xlsx`;
      downloadBlob(filename, await response.blob());
      setMessage(kind === "lodging" ? "Đã xuất Excel lưu trú cho resort/hotel." : "Đã xuất Excel tổng hợp hồi đáp.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Không xuất được Excel hồi đáp.");
    } finally {
      setExportingWorkbook(false);
    }
  }

  function clearDemoData() {
    if (!window.confirm("Xóa toàn bộ dữ liệu hồi đáp demo trong trình duyệt này?")) return;
    clearRSVPResponses();
    setResponses([]);
  }



  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-4 border-b border-[#DED4C5] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7B7168]">Quản lý đám cưới</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2E2A25] sm:text-3xl">Nhật &amp; Phương</h1>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D6BFA3] bg-white px-4 text-sm font-semibold text-[#2E2A25] transition hover:bg-[#FFFDF8] active:scale-[0.98]">
            <ExternalLink className="h-4 w-4" /> Trang thiệp
          </Link>
          <Link href="/admin/editor" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5F6F4E] px-4 text-sm font-semibold text-white transition hover:bg-[#526244] active:scale-[0.98]">
            <PencilRuler className="h-4 w-4" /> Chỉnh sửa thiệp
          </Link>
        </div>
      </header>

      <nav aria-label="Khu vực quản trị" className="grid grid-cols-3 rounded-2xl border border-[#DED4C5] bg-white p-1 shadow-sm">
        {[
          { id: "rsvps", label: "Hồi đáp", icon: ClipboardList },
          { id: "invitees", label: "Khách mời", icon: UsersRound },
          { id: "album", label: "Album", icon: Images },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id as "rsvps" | "invitees" | "album")}
            aria-current={tab === id ? "page" : undefined}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold transition sm:text-sm ${
              tab === id
                ? "bg-[#5F6F4E] text-white shadow-sm"
                : "text-[#665D54] hover:bg-[#F8F3EA] hover:text-[#2E2A25]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Tab 1: RSVPs & Statistics */}
      {tab === "rsvps" && (
        <div className="space-y-6">
          <section aria-labelledby="overview-title" className="overflow-hidden rounded-2xl border border-[#DED4C5] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E8DDCC] px-4 py-3 sm:px-5">
              <h2 id="overview-title" className="font-semibold text-[#2E2A25]">Tổng quan</h2>
              <span className="text-xs text-[#7B7168]">Cập nhật theo RSVP</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Lời phản hồi", value: responses.length, note: `${summary.yes} xác nhận · ${summary.no} từ chối`, estimated: false },
                { label: "Dự Thánh lễ", value: ceremonyGuests, note: "người", estimated: true },
                { label: "Dự tiệc cưới", value: banquetGuests, note: "người", estimated: true },
                { label: "Lưu trú", value: stayingGuests, note: "người", estimated: true },
              ].map(({ label, value, note, estimated }, index) => (
                <div key={label} className={`min-h-28 p-4 sm:p-5 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b lg:border-b-0" : ""} ${index === 1 ? "lg:border-r" : ""} ${index === 2 ? "lg:border-r" : ""} border-[#E8DDCC]`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-[#6F665D]">{label}</p>
                    {estimated && <span className="rounded-full bg-[#F3EEE2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6E5949]">Ước lượng</span>}
                  </div>
                  <p className="mt-3 text-3xl font-bold tabular-nums text-[#2E2A25]">{value}</p>
                  <p className="mt-1 text-xs text-[#8A8178]">{note}</p>
                </div>
              ))}
            </div>
            {(postCeremonyPartyGuests > 0 || childrenStaying > 0 || notAttending > 0) && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#E8DDCC] bg-[#FCFAF4] px-4 py-3 text-xs text-[#665D54] sm:px-5">
                <span>Tiệc sau Thánh lễ: <b>{postCeremonyPartyGuests} người</b> <i>(ước lượng)</i></span>
                <span>Trẻ em lưu trú: <b>{childrenStaying}</b> <i>(ước lượng)</i></span>
                <span>Lời từ chối: <b>{notAttending}</b></span>
              </div>
            )}
          </section>

          <section aria-labelledby="responses-title" className="rounded-2xl border border-[#DED4C5] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="responses-title" className="text-lg font-bold text-[#2E2A25]">Danh sách hồi đáp</h2>
                  <p className="text-xs text-[#7B7168]">{filteredResponses.length} trong {responses.length} lời phản hồi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <select aria-label="Lọc theo phản hồi" value={attendingFilter} onChange={(event) => setAttendingFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#E8DDCC] bg-white px-3 text-sm outline-none transition focus:border-[#5F6F4E]">
                    <option value="all">Phản hồi: tất cả</option>
                    <option value="yes">Đã xác nhận</option>
                    <option value="no">Đã từ chối</option>
                    <option value="maybe">Cần thêm thời gian</option>
                  </select>
                  <select aria-label="Lọc theo lưu trú" value={accommodationFilter} onChange={(event) => setAccommodationFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#E8DDCC] bg-white px-3 text-sm outline-none transition focus:border-[#5F6F4E]">
                    <option value="all">Lưu trú: tất cả</option>
                    <option value="yes">Cần hỗ trợ</option>
                    <option value="no">Không cần</option>
                  </select>
                  <select aria-label="Lọc theo tiệc sau Thánh lễ" value={postCeremonyFilter} onChange={(event) => setPostCeremonyFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#E8DDCC] bg-white px-3 text-sm outline-none transition focus:border-[#5F6F4E]">
                    <option value="all">Tiệc sau Hôn phối: tất cả</option>
                    <option value="yes">Sẽ tham dự</option>
                    <option value="no">Không tham dự</option>
                    <option value="pending">Chưa trả lời</option>
                    <option value="not_applicable">Không áp dụng</option>
                  </select>
                  <select aria-label="Lọc theo nhóm khách" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#E8DDCC] bg-white px-3 text-sm outline-none transition focus:border-[#5F6F4E]">
                    <option value="all">Nhóm khách: tất cả</option>
                    {groups.map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
              </div>

              <details className="group my-4 rounded-xl border border-[#E8DDCC] bg-[#FCFAF4]">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold text-[#665D54] marker:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Xuất và thao tác
                  <span className="ml-auto text-xs font-normal text-[#8A8178]">{selectedCount > 0 ? `${selectedCount} đã chọn` : "Mở"}</span>
                </summary>
                <div className="grid gap-2 border-t border-[#E8DDCC] p-3 sm:grid-cols-2 xl:grid-cols-5">
                  <button
                    type="button"
                    onClick={toggleVisibleResponses}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#D6BFA3] bg-white px-3 text-xs font-semibold text-[#2E2A25] active:scale-[0.98] transition"
                    disabled={filteredResponses.length === 0}
                  >
                    {allVisibleSelected ? <CheckSquare className="h-4 w-4 text-[#5F6F4E]" /> : <Square className="h-4 w-4 text-[#8A8178]" />}
                    {allVisibleSelected ? "Bỏ chọn" : "Chọn trang"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteSelectedResponses()}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#D9B9BF] bg-white px-3 text-xs font-semibold text-[#9B4E5C] active:scale-[0.98] transition disabled:opacity-40"
                    disabled={selectedCount === 0 || deletingRsvp}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingRsvp ? "Đang xoá..." : `Xoá đã chọn (${selectedCount})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => void exportRsvpWorkbook("filtered")}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#5F6F4E] px-3 text-xs font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
                    disabled={exportingWorkbook || filteredResponses.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Xuất Excel RSVP
                  </button>
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#E8DDCC] bg-white px-3 text-xs font-semibold text-[#756b60] transition active:scale-[0.98] disabled:opacity-40"
                    disabled={filteredResponses.length === 0}
                  >
                    <Download className="h-4 w-4" /> CSV dự phòng
                  </button>
                  <button
                    type="button"
                    onClick={clearDemoData}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#E8DDCC] bg-white px-3 text-xs font-semibold text-[#9B4E5C] transition active:scale-[0.98]"
                  >
                    <Trash2 className="h-4 w-4" /> Xoá demo
                  </button>
                </div>
              </details>

              {message && <p className="mb-4 text-sm font-semibold text-[#5F6F4E] bg-[#5F6F4E]/5 px-4 py-2.5 rounded-xl border border-[#5F6F4E]/12">{message}</p>}
              {error && <p className="mb-4 text-sm font-semibold text-[#9B4E5C] bg-[#9B4E5C]/5 px-4 py-2.5 rounded-xl border border-[#9B4E5C]/12">{error}</p>}

              <div className="grid gap-2 lg:hidden">
                {filteredResponses.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#D6BFA3] px-4 py-8 text-center text-sm text-[#8A8178]">Chưa có lời hồi đáp phù hợp.</p>
                ) : filteredResponses.map((response) => (
                  <article key={response.id} className={`rounded-xl border p-3 ${selectedResponseIds.has(response.id) ? "border-[#5F6F4E] bg-[#F7F8F3]" : "border-[#E8DDCC] bg-white"}`}>
                    <div className="flex items-start gap-3">
                      <button type="button" aria-label={`Chọn ${response.name}`} onClick={() => setResponseSelection(response.id, !selectedResponseIds.has(response.id))} className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#5F6F4E]">
                        {selectedResponseIds.has(response.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-[#2E2A25]">{response.name}</h3>
                            <p className="text-[11px] text-[#8A8178]">{formatDate(response.submittedAt)}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#F3EEE2] px-2.5 py-1 text-[11px] font-semibold text-[#665D54]">{attendingLabel(response.attending)}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-[#665D54]">
                          <span className="rounded-md bg-[#F8F3EA] px-2 py-1">Thánh lễ: <b>{response.attendingCeremony ? "Có" : "Không"}</b></span>
                          <span className="rounded-md bg-[#F8F3EA] px-2 py-1">Tiệc cưới: <b>{response.attendingBanquet ? "Có" : "Không"}</b></span>
                          {postCeremonyStatus(response) !== "not_applicable" && <span className="rounded-md bg-[#F8F3EA] px-2 py-1">Tiệc sau lễ: <b>{postCeremonyStatus(response) === "yes" ? "Có" : postCeremonyStatus(response) === "no" ? "Không" : "Chưa trả lời"}</b></span>}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E8DDCC] pt-3 text-xs">
                          <p><span className="text-[#8A8178]">Số người</span><br /><b>{response.guestCount} <span className="font-normal">(ước lượng)</span></b></p>
                          <p><span className="text-[#8A8178]">Lưu trú</span><br /><b>{response.accommodationNeeded ? `${response.stayingGuestCount ?? response.lodgingGuests?.length ?? 0} người` : "Không"}</b>{response.accommodationNeeded && <span className="block text-[11px] text-[#8A8178]">Ước lượng</span>}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-xl border border-[#E8DDCC] lg:block">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[#F8F3EA] text-[#8A8178] border-b border-[#E8DDCC]">
                    <tr>
                      <th className="w-12 p-4 text-center">
                        <button type="button" onClick={toggleVisibleResponses} className="inline-flex h-5 w-5 items-center justify-center text-[#5F6F4E]">
                          {allVisibleSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                        </button>
                      </th>
                      <th className="p-4">Tên khách</th>
                      <th className="p-4">Số điện thoại</th>
                      <th className="p-4">Phản hồi</th>
                      <th className="p-4">Sự kiện</th>
                      <th className="p-4">Số người <span className="block text-[10px] font-normal">Ước lượng</span></th>
                      <th className="p-4">Nhóm</th>
                      <th className="p-4">Lưu trú</th>
                      <th className="p-4">Người lưu trú</th>
                      <th className="p-4">Lưu ý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDCC]">
                    {filteredResponses.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-[#8A8178] bg-[#FCFAF4]/30">
                          Chưa có lời hồi đáp phù hợp.
                        </td>
                      </tr>
                    ) : filteredResponses.map((response) => (
                      <tr key={response.id} className={`hover:bg-[#FCFAF4]/40 transition ${selectedResponseIds.has(response.id) ? "bg-[#F8F3EA]/70" : ""}`}>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => setResponseSelection(response.id, !selectedResponseIds.has(response.id))}
                            className="inline-flex h-5 w-5 items-center justify-center text-[#5F6F4E]"
                          >
                            {selectedResponseIds.has(response.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                          </button>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-[#2E2A25]">{response.name}</p>
                          <p className="mt-0.5 text-[10px] text-[#8A8178]">{formatDate(response.submittedAt)}</p>
                        </td>
                        <td className="p-4 text-xs">{response.phone}</td>
                        <td className="p-4 text-xs font-semibold">{attendingLabel(response.attending)}</td>
                        <td className="p-4 text-[11px] leading-relaxed text-[#665d54]">
                          <span className="block">Thánh lễ: <b>{response.attendingCeremony ? "Có" : "Không"}</b></span>
                          {postCeremonyStatus(response) !== "not_applicable" ? (
                            <span className="block">Tiệc sau lễ: <b>{
                              postCeremonyStatus(response) === "yes"
                                ? "Có"
                                : postCeremonyStatus(response) === "no"
                                  ? "Không"
                                  : "Chưa trả lời"
                            }</b></span>
                          ) : null}
                          <span className="block">Tiệc cưới: <b>{response.attendingBanquet ? "Có" : "Không"}</b></span>
                        </td>
                        <td className="p-4 text-xs">{response.guestCount}</td>
                        <td className="p-4 text-xs">{response.guestGroup}</td>
                        <td className="p-4 text-xs">{response.accommodationNeeded ? <>{response.stayingGuestCount ?? response.lodgingGuests?.length ?? 0} người <span className="block text-[10px] text-[#8A8178]">Ước lượng</span></> : "Không"}</td>
                        <td className="p-4 text-xs max-w-[200px] truncate text-[#665d54]">{response.accommodationNeeded ? (response.lodgingGuests?.length ? summarizeLodgingGuests(response.lodgingGuests) : "Chưa có danh sách") : "Không"}</td>
                        <td className="p-4 text-xs max-w-[220px] truncate text-[#665d54]">{response.dietaryNote || response.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-[#E8DDCC] bg-[#E8DDCC] sm:grid-cols-2 lg:grid-cols-4 text-xs text-[#665d54]">
                <div className="flex flex-col gap-1.5 bg-[#FCFAF4] p-3">
                  <span className="text-[#8A8178] font-semibold">KHÁCH Ở LẠI · ƯỚC LƯỢNG</span>
                  <b className="text-lg text-[#5F6F4E]">{stayingGuests} người</b>
                </div>
                <div className="flex flex-col gap-1.5 bg-[#FCFAF4] p-3">
                  <span className="text-[#8A8178] font-semibold">ĐÊM 25/12 · ƯỚC LƯỢNG</span>
                  <b className="text-lg text-[#2E2A25]">{stayingDec25} người</b>
                </div>
                <div className="flex flex-col gap-1.5 bg-[#FCFAF4] p-3">
                  <span className="text-[#8A8178] font-semibold">ĐÊM 26/12 · ƯỚC LƯỢNG</span>
                  <b className="text-lg text-[#2E2A25]">{stayingDec26} người</b>
                </div>
                <div className="flex min-h-[64px] flex-col justify-between bg-[#FCFAF4] p-3">
                  <span className="text-[#8A8178] font-semibold">DANH SÁCH LƯU TRÚ</span>
                  <button type="button" onClick={() => void exportRsvpWorkbook("lodging")} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5F6F4E] hover:underline" disabled={accommodationRequests === 0}>
                    <Hotel className="w-3.5 h-3.5" /> Xuất Excel resort
                  </button>
                </div>
              </div>

          </section>
        </div>
      )}

      {/* Tab 2: Guests & Links */}
      {tab === "invitees" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.85fr)]">
          {/* Left panel: Guest List */}
          <section className="rounded-2xl border border-[#DED4C5] bg-white p-4 shadow-sm sm:p-5">
            <div>
              
              <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-xl border border-[#E8DDCC] sm:grid-cols-4">
                {[
                  ["Thiệp riêng", invitees.length],
                  ["Đã hồi đáp", summary.total],
                  ["Vừa nhập", lastImportedInvitees.length],
                  ["Đang hiển thị", visibleInvitees.length],
                ].map(([label, value], index) => (
                  <div key={String(label)} className={`bg-[#FCFAF4] p-3 sm:p-4 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b sm:border-b-0" : ""} ${index === 1 || index === 2 ? "sm:border-r" : ""} border-[#E8DDCC]`}>
                    <span className="block text-[11px] font-semibold text-[#7B7168]">{label}</span>
                    <span className="mt-1 block text-2xl font-bold tabular-nums text-[#2E2A25]">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mb-5 rounded-xl border border-[#E8DDCC] bg-[#FCFAF4] p-3 sm:p-4">
                <div className="mb-3">
                  <h2 className="font-semibold text-[#2E2A25]">Nhập và xuất danh sách</h2>
                  <p className="mt-0.5 text-xs text-[#7B7168]">Tải mẫu, điền danh sách rồi tải lại lên.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                  <button type="button" onClick={() => void downloadTemplate()} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#D6BFA3] bg-white px-3 text-xs font-semibold text-[#2E2A25] active:scale-[0.98] transition">
                    <Download className="h-3.5 w-3.5 text-[#5F6F4E]" /> Tải mẫu
                  </button>
                  <button type="button" onClick={() => importFileRef.current?.click()} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#5F6F4E] px-3 text-xs font-semibold text-white active:scale-[0.98] transition" disabled={busy}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />} Tải Excel lên
                  </button>
                  <button type="button" onClick={() => void exportInviteLinksWorkbook(lastImportedInvitees, "đợt vừa nạp")} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#D6BFA3] bg-white px-3 text-xs font-semibold text-[#2E2A25] active:scale-[0.98] transition disabled:opacity-40" disabled={lastImportedInvitees.length === 0}>
                    <Download className="h-3.5 w-3.5 text-[#5F6F4E]" /> Link vừa nhập
                  </button>
                  <button type="button" onClick={() => void exportInviteLinksWorkbook()} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#D6BFA3] bg-white px-3 text-xs font-semibold text-[#2E2A25] active:scale-[0.98] transition disabled:opacity-40" disabled={busy || invitees.length === 0}>
                    <Link2 className="h-3.5 w-3.5" /> Xuất toàn bộ link
                  </button>
                  <button type="button" onClick={startAddingInvitee} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#E8DDCC] bg-white px-3 text-xs font-semibold text-[#2E2A25] active:scale-[0.98] transition lg:col-span-1" disabled={busy}>
                    <Plus className="h-3.5 w-3.5 text-[#5F6F4E]" /> Thêm khách
                  </button>
                </div>
                <input ref={importFileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => void importWorkbookFile(event.target.files?.[0])} />
              </div>

              {/* Search and select actions */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8178]" />
                  <input
                    className="min-h-11 w-full rounded-xl border border-[#E8DDCC] bg-white pl-11 pr-4 text-sm text-[#2E2A25] outline-none transition focus:border-[#5F6F4E] focus:ring-4 focus:ring-[#5F6F4E]/8"
                    placeholder="Tìm theo tên khách, nhóm khách hoặc mã link..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={toggleVisibleInviteesSelection}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#D6BFA3] bg-white px-3 text-xs font-semibold text-[#2E2A25] active:scale-[0.98] transition"
                    disabled={visibleInvitees.length === 0}
                  >
                    {allVisibleInviteesSelected ? <CheckSquare className="h-4 w-4 text-[#5F6F4E]" /> : <Square className="h-4 w-4 text-[#8A8178]" />}
                    Chọn cả trang
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteSelectedInvitees()}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#D9B9BF] bg-white px-3 text-xs font-semibold text-[#9B4E5C] active:scale-[0.98] transition disabled:opacity-40"
                    disabled={selectedInvitees.length === 0 || bulkDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    {bulkDeleting ? "Xoá..." : `Xoá chọn (${selectedInvitees.length})`}
                  </button>
                </div>
              </div>

              {importNotice && <p className="mb-4 text-xs text-[#9B4E5C] bg-[#9B4E5C]/5 px-3 py-2 rounded-xl">{importNotice}</p>}

              <div className="grid max-h-[42rem] gap-2 overflow-y-auto lg:hidden">
                {visibleInvitees.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#D6BFA3] px-4 py-8 text-center text-sm text-[#8A8178]">{invitees.length === 0 ? "Chưa có khách mời. Hãy nhập danh sách hoặc thêm khách." : "Không tìm thấy khách mời phù hợp."}</p>
                ) : visibleInvitees.map((invitee) => {
                  const rsvp = invitee.rsvp ?? rsvpByInviteeId.get(invitee.id);
                  const isSelected = selectedInvitee?.id === invitee.id;
                  const isChecked = selectedInviteeIds.has(invitee.id);
                  return (
                    <article key={invitee.id} onClick={() => setSelectedInviteeId(invitee.id)} className={`cursor-pointer rounded-xl border p-3 ${isSelected ? "border-[#5F6F4E] bg-[#F7F8F3]" : "border-[#E8DDCC] bg-white"}`}>
                      <div className="flex items-start gap-3">
                        <button type="button" aria-label={`Chọn ${invitee.displayLabel}`} onClick={(event) => { event.stopPropagation(); setInviteeSelection(invitee.id, !isChecked); }} className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#5F6F4E]">
                          {isChecked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold text-[#2E2A25]">{invitee.displayLabel}</h3>
                              <p className="text-[11px] text-[#8A8178]">{householdModeLabels[invitee.householdMode]} · {invitee.guestGroup || "Chưa phân nhóm"}</p>
                            </div>
                            <button type="button" aria-label="Sao chép link thiệp" onClick={(event) => { event.stopPropagation(); void navigator.clipboard.writeText(buildInviteUrl(invitee.token, window.location.origin)); setMessage("Đã sao chép link."); }} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E8DDCC] bg-white text-[#5F6F4E]"><Copy className="h-4 w-4" /></button>
                          </div>
                          <p className="mt-2 text-xs text-[#665D54]">{rsvp ? <><b>{attendingLabel(rsvp.attending)}</b> · {rsvp.guestCount} người <span className="text-[#8A8178]">(ước lượng)</span></> : inviteStatusLabels[invitee.inviteStatus]}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden max-h-[36rem] overflow-x-auto overflow-y-auto rounded-xl border border-[#E8DDCC] lg:block">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="sticky top-0 bg-[#F8F3EA] text-[#8A8178] border-b border-[#E8DDCC] z-10">
                    <tr>
                      <th className="w-12 p-3 text-center">
                        <button type="button" onClick={toggleVisibleInviteesSelection} className="inline-flex h-5 w-5 items-center justify-center text-[#5F6F4E]">
                          {allVisibleInviteesSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                        </button>
                      </th>
                      <th className="p-3">Khách mời</th>
                      <th className="p-3">Mã Token</th>
                      <th className="p-3">Nhóm</th>
                      <th className="p-3">Trạng thái RSVP</th>
                      <th className="p-3 text-center">Sao chép</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDCC]">
                    {visibleInvitees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#8A8178]">
                          {invitees.length === 0 ? "Chưa có khách mời. Hãy nhập danh sách hoặc thêm khách." : "Không tìm thấy khách mời phù hợp."}
                        </td>
                      </tr>
                    ) : (
                      visibleInvitees.map((invitee) => {
                        const rsvp = invitee.rsvp ?? rsvpByInviteeId.get(invitee.id);
                        const isSelected = selectedInvitee?.id === invitee.id;
                        const isChecked = selectedInviteeIds.has(invitee.id);
                        return (
                          <tr
                            key={invitee.id}
                            onClick={() => setSelectedInviteeId(invitee.id)}
                            className={`cursor-pointer hover:bg-[#FCFAF4]/40 transition ${isSelected ? "bg-[#F8F3EA]" : ""}`}
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setInviteeSelection(invitee.id, !isChecked)}
                                className="inline-flex h-5 w-5 items-center justify-center text-[#5F6F4E]"
                              >
                                {isChecked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                              </button>
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-[#2E2A25]">{invitee.displayLabel}</p>
                              <span className="text-[10px] text-[#8A8178]">{householdModeLabels[invitee.householdMode]}</span>
                            </td>
                            <td className="p-3 text-xs font-mono">{invitee.token}</td>
                            <td className="p-3 text-xs">{invitee.guestGroup}</td>
                            <td className="p-3 text-xs">
                              {rsvp ? (
                                <span className="font-semibold text-[#5F6F4E]">{attendingLabel(rsvp.attending)} · {rsvp.guestCount} người <span className="font-normal text-[#8A8178]">(ước lượng)</span></span>
                              ) : (
                                <span className="text-[#8A8178]">{inviteStatusLabels[invitee.inviteStatus]}</span>
                              )}
                            </td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard.writeText(buildInviteUrl(invitee.token, window.location.origin));
                                  setMessage("Đã sao chép link.");
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#5F6F4E]/10 text-[#5F6F4E]"
                                title="Sao chép link thiệp"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </section>

          {/* Right panel: Invitee Editor */}
          <div className="flex flex-col gap-6">
            {isAddingInvitee ? (
              <div className="rounded-2xl border border-[#DED4C5] bg-white p-4 shadow-sm sm:p-5">
                <div className="border-b border-[#E8DDCC] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#b4975a]">THÊM KHÁCH</span>
                  <h3 className="mt-1 text-xl font-bold text-[#2E2A25]">Nhập như file Excel</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#7B7168]">Chỉ điền các mục cần thiết. Cụm tên khách, đơn vị khách và lời mời sẽ được tạo tự động.</p>
                </div>

                <form
                  className="mt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void addInvitee();
                  }}
                >
                  <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
                    <label className="grid gap-1.5 font-semibold uppercase tracking-wider text-[#8A8178]">
                      Cụm danh xưng
                      <select
                        className={panelSelect}
                        value={simpleInviteEntry.salutationCluster}
                        onChange={(event) => setSimpleInviteEntry((current) => ({ ...current, salutationCluster: event.target.value }))}
                        required
                      >
                        <option value="">Chọn cụm danh xưng</option>
                        {simpleInviteEntryOptions.salutationClusters.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>

                    <label className="grid gap-1.5 font-semibold uppercase tracking-wider text-[#8A8178]">
                      Tên khách
                      <input
                        className={panelInput}
                        value={simpleInviteEntry.guestNameCore}
                        onChange={(event) => setSimpleInviteEntry((current) => ({ ...current, guestNameCore: event.target.value }))}
                        placeholder="VD: Tuấn (nếu cần)"
                      />
                    </label>

                    <label className="grid gap-1.5 font-semibold uppercase tracking-wider text-[#8A8178] sm:col-span-2">
                      Nhóm khách
                      <select
                        className={panelSelect}
                        value={simpleInviteEntry.guestGroup}
                        onChange={(event) => setSimpleInviteEntry((current) => ({ ...current, guestGroup: event.target.value }))}
                        required
                      >
                        <option value="">Chọn nhóm khách</option>
                        {simpleInviteEntryOptions.guestGroups.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>

                    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-[#E8DDCC] bg-[#FCFAF4] px-4 text-sm font-semibold text-[#2E2A25] sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={simpleInviteEntry.postCeremonyPartyInvited === "Có"}
                        onChange={(event) => setSimpleInviteEntry((current) => ({ ...current, postCeremonyPartyInvited: event.target.checked ? "Có" : "" }))}
                        className="h-4 w-4 rounded accent-[#5F6F4E]"
                      />
                      Mời tham gia tiệc sau Hôn phối
                    </label>
                  </div>

                  <p className="mt-4 rounded-xl border border-[#E8DDCC] bg-[#FCFAF4] px-4 py-3 text-xs leading-relaxed text-[#665D54]">
                    Hệ thống sẽ tự tạo cụm tên khách, đơn vị khách, lời mời và link thiệp sau khi lưu.
                  </p>

                  {error && <p className="mt-3 text-xs font-semibold text-[#9B4E5C]">{error}</p>}

                  <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={cancelAddingInvitee} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E8DDCC] bg-white px-5 text-sm font-semibold text-[#665D54]" disabled={busy}>
                      Huỷ
                    </button>
                    <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#5F6F4E] px-5 text-sm font-bold text-white shadow-sm disabled:opacity-50" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Thêm khách
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedInvitee ? (
              <>
                {/* Panel 1: Basic Info */}
                <div className="rounded-2xl border border-[#DED4C5] bg-white shadow-sm">
                  <div className="p-4 sm:p-5">
                    
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E8DDCC] pb-4 mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#b4975a]">THÔNG TIN KHÁCH MỜI</span>
                        <h3 className="mt-1 text-xl font-bold text-[#2E2A25]">{selectedInvitee.displayLabel}</h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => void regenerateToken()} className="inline-flex h-9 items-center gap-1 px-3 rounded-full border border-[#E8DDCC] bg-white text-xs font-semibold text-[#2E2A25]">
                          <RefreshCw className="h-3 w-3" /> Đổi mã
                        </button>
                        <button type="button" onClick={copyInviteLink} className="inline-flex h-9 items-center gap-1 px-3 rounded-full bg-[#5F6F4E] text-xs font-semibold text-white shadow-sm">
                          <Copy className="h-3 w-3" /> Sao chép link
                        </button>
                        <button type="button" onClick={regenerateSelectedInviteCopy} className="inline-flex h-9 items-center gap-1 px-3 rounded-full border border-[#D6BFA3] bg-[#FCFAF4] text-xs font-semibold text-[#2E2A25]">
                          Cập nhật xưng hô
                        </button>
                        <button type="button" onClick={() => void saveSelectedInvitee()} className="inline-flex h-9 items-center gap-1 px-3.5 rounded-full bg-[#5F6F4E] text-xs font-bold text-white shadow-sm" disabled={busy}>
                          Lưu
                        </button>
                        <button type="button" onClick={() => void deleteSelectedInvitee()} className="inline-flex h-9 items-center gap-1 px-3 rounded-full border border-[#E8DDCC] bg-white text-xs font-semibold text-[#9B4E5C]" disabled={busy}>
                          Xoá
                        </button>
                      </div>
                    </div>

                    {/* Inputs grid */}
                    <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Tên hiển thị (Admin)
                        <input className={panelInput} value={selectedInvitee.displayLabel} onChange={(event) => patchSelectedInvitee({ displayLabel: event.target.value })} />
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Cụm danh xưng
                        <input className={panelInput} value={selectedInvitee.salutationCluster} onChange={(event) => patchSelectedInvitee({ salutationCluster: event.target.value })} />
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Cụm tên khách
                        <input className={panelInput} value={selectedInvitee.guestName} onChange={(event) => patchSelectedInvitee({ guestName: event.target.value })} />
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Tên in trên thiệp cưới
                        <input className={panelInput} value={selectedInvitee.invitationName} onChange={(event) => patchSelectedInvitee({ invitationName: event.target.value })} />
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Nhóm khách
                        <input className={panelInput} value={selectedInvitee.guestGroup} onChange={(event) => patchSelectedInvitee({ guestGroup: event.target.value })} />
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Đơn vị khách
                        <select className={panelSelect} value={selectedInvitee.householdMode} onChange={(event) => patchSelectedGuestUnit(event.target.value as Invitee["householdMode"])}>
                          <option value="single">{householdModeLabels.single}</option>
                          <option value="couple">{householdModeLabels.couple}</option>
                          <option value="family">{householdModeLabels.family}</option>
                          <option value="widowed">{householdModeLabels.widowed}</option>
                        </select>
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Số người (ước lượng)
                        <input className={panelInput} type="number" min={1} value={selectedInvitee.expectedGuestCount} onChange={(event) => patchSelectedInvitee({ expectedGuestCount: Math.max(1, Number(event.target.value) || 1) })} />
                      </label>
                      <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end rounded-2xl border border-[#E8DDCC] bg-white px-4 text-xs font-semibold normal-case tracking-normal text-[#2E2A25]">
                        <input
                          type="checkbox"
                          checked={selectedInvitee.postCeremonyPartyInvited}
                          onChange={(event) => patchSelectedInvitee({ postCeremonyPartyInvited: event.target.checked })}
                          className="h-4 w-4 rounded accent-[#5F6F4E]"
                        />
                        Hỏi khách về tiệc sau Hôn phối
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Dòng ngoài phong bì
                        <input className={panelInput} value={selectedInvitee.envelopeLine} onChange={(event) => patchSelectedInvitee({ envelopeLine: event.target.value })} />
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Lời mời trong thiệp
                        <input className={panelInput} value={selectedInvitee.insideInviteLine} onChange={(event) => patchSelectedInvitee({ insideInviteLine: event.target.value })} />
                      </label>
                      <details className="group rounded-xl border border-[#E8DDCC] bg-[#FCFAF4] sm:col-span-2">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 text-xs font-semibold normal-case tracking-normal text-[#665D54] marker:hidden">
                          Thông tin nâng cao
                          <span className="ml-auto text-[11px] font-normal text-[#8A8178]">Chỉ mở khi cần</span>
                        </summary>
                        <div className="grid gap-3.5 border-t border-[#E8DDCC] p-4 sm:grid-cols-2">
                          <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                            Xưng hô đơn
                            <input className={panelInput} value={selectedInvitee.honorific} onChange={(event) => patchSelectedInvitee({ honorific: event.target.value })} />
                          </label>
                          <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                            Đơn vị mời
                            <select className={panelSelect} value={selectedInvitee.inviteUnit} onChange={(event) => patchSelectedInvitee({ inviteUnit: event.target.value === "household" ? "household" : "individual" })}>
                              <option value="individual">{inviteUnitLabels.individual}</option>
                              <option value="household">{inviteUnitLabels.household}</option>
                            </select>
                          </label>
                          <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                            Ai đứng mời
                            <select className={panelSelect} value={selectedInvitee.invitedBy} onChange={(event) => patchSelectedInvitee({ invitedBy: event.target.value === "parents" ? "parents" : "couple" })}>
                              <option value="couple">{invitedByLabels.couple}</option>
                              <option value="parents">{invitedByLabels.parents}</option>
                            </select>
                          </label>
                          <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                            Mối quan hệ
                            <input className={panelInput} value={selectedInvitee.relationship} onChange={(event) => patchSelectedInvitee({ relationship: event.target.value })} />
                          </label>
                          <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                            Chính sách +1
                            <select className={panelSelect} value={selectedInvitee.plusOnePolicy} onChange={(event) => patchSelectedInvitee({ plusOnePolicy: event.target.value as Invitee["plusOnePolicy"] })}>
                              <option value="none">{plusOnePolicyLabels.none}</option>
                              <option value="spouse">{plusOnePolicyLabels.spouse}</option>
                              <option value="family">{plusOnePolicyLabels.family}</option>
                              <option value="lover">{plusOnePolicyLabels.lover}</option>
                              <option value="open_plus_one">{plusOnePolicyLabels.open_plus_one}</option>
                            </select>
                          </label>
                          <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider sm:col-span-2">
                            Mã nhóm album
                            <input className={panelInput} value={joinAudienceTags(selectedInvitee.audienceTags)} onChange={(event) => patchSelectedInvitee({ audienceTags: parseAudienceTags(event.target.value) })} />
                          </label>
                        </div>
                      </details>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Số điện thoại
                        <input className={panelInput} value={selectedInvitee.phone} onChange={(event) => patchSelectedInvitee({ phone: event.target.value })} />
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider sm:col-span-2">
                        Ghi chú
                        <textarea className={`${panelInput} min-h-20 py-2.5`} value={selectedInvitee.notes} onChange={(event) => patchSelectedInvitee({ notes: event.target.value })} />
                      </label>
                    </div>

                    {/* Bottom Link Details */}
                    <div className="mt-4 p-3.5 rounded-xl bg-[#FCFAF4] border border-[#E8DDCC] text-xs text-[#665d54]">
                      <b className="text-[#2E2A25]">Link thiệp riêng của khách:</b>
                      <p className="mt-1 font-mono break-all text-[#5F6F4E] select-all">{buildInviteUrl(selectedInvitee.token, window.location.origin)}</p>
                      {selectedRsvp ? (
                        <div className="mt-3 pt-3 border-t border-[#E8DDCC] space-y-1">
                          <p className="font-semibold text-[#2E2A25]">Hồi đáp từ form:</p>
                          <p>Trạng thái: <b>{attendingLabel(selectedRsvp.attending)}</b> · Dự {selectedRsvp.guestCount} người <span className="text-[#8A8178]">(ước lượng)</span>.</p>
                          <p>
                            Tiệc sau Hôn phối: <b>{
                              postCeremonyStatus(selectedRsvp) === "yes"
                                ? "Sẽ tham dự"
                                : postCeremonyStatus(selectedRsvp) === "no"
                                  ? "Không tham dự"
                                  : postCeremonyStatus(selectedRsvp) === "pending"
                                    ? "Chưa trả lời"
                                    : "Không áp dụng"
                            }</b>.
                          </p>
                          {selectedRsvp.accommodationNeeded && <p>Cần lưu trú: <b>{selectedRsvp.stayingGuestCount ?? selectedRsvp.lodgingGuests?.length ?? 0} người</b> <span className="text-[#8A8178]">(ước lượng)</span> ({selectedRsvp.lodgingGuests?.length ? summarizeLodgingGuests(selectedRsvp.lodgingGuests) : "Chưa điền tên"}).</p>}
                          {(selectedRsvp.dietaryNote || selectedRsvp.notes) && <p>Ghi chú/Ẩm thực: <i>{selectedRsvp.dietaryNote || selectedRsvp.notes}</i></p>}
                        </div>
                      ) : (
                        <p className="mt-2 text-[#8A8178]">Khách chưa hồi đáp RSVP.</p>
                      )}
                    </div>

                    {message && <p className="mt-3 text-xs font-semibold text-[#5F6F4E]">{message}</p>}
                    {error && <p className="mt-3 text-xs font-semibold text-[#9B4E5C]">{error}</p>}
                  </div>
                </div>

                {/* Album Preview */}
                <div className="rounded-2xl border border-[#DED4C5] bg-white shadow-sm">
                  <div className="p-4 sm:p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#b4975a] block mb-3">ẢNH ALBUM KHÁCH NÀY ĐƯỢC XEM</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {visibleAlbumAssets.length === 0 ? (
                        <p className="text-xs text-[#8A8178] py-2">Nhóm khách này chưa được phân quyền xem ảnh riêng tư nào.</p>
                      ) : (
                        visibleAlbumAssets.map((asset) => (
                          <div key={asset.id} className="overflow-hidden rounded-2xl border border-[#E8DDCC] bg-white shadow-[0_2px_8px_rgba(63,70,66,0.02)]">
                            <img src={asset.src} alt={asset.alt} className="h-32 w-full object-cover" />
                            <div className="p-2.5 text-xs">
                              <p className="font-semibold text-[#2E2A25] truncate">{asset.title}</p>
                              <p className="mt-0.5 text-[10px] text-[#8A8178] truncate">Tags: {joinAudienceTags(asset.photoTags)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 rounded-[2.2rem] bg-white border border-[#E8DDCC] text-center text-sm text-[#8A8178] py-12">
                Hãy click chọn một khách mời ở danh sách bên trái để chỉnh sửa thông tin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Media Gallery & Album Rules */}
      {tab === "album" && (
        <div className="grid gap-5 xl:grid-cols-2">
          {/* Left panel: Media Assets list */}
          <section className="rounded-2xl border border-[#DED4C5] bg-white shadow-sm">
            <div className="p-4 sm:p-5">
              
              <div className="flex items-center justify-between gap-4 border-b border-[#E8DDCC] pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#2E2A25]">Ảnh album</h2>
                  <p className="mt-0.5 text-xs text-[#7B7168]">Ảnh riêng tư theo từng nhóm khách</p>
                </div>
                <button type="button" onClick={() => void addMediaAsset()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#5F6F4E] px-4 text-xs font-bold text-white active:scale-[0.98] transition">
                  <Plus className="h-3.5 w-3.5" /> Thêm ảnh
                </button>
              </div>

              <div className="grid gap-4 max-h-[46rem] overflow-y-auto pr-1">
                {mediaAssets.length === 0 ? (
                  <p className="text-sm text-[#8A8178] py-8 text-center bg-[#FCFAF4] rounded-2xl border border-[#E8DDCC]">Chưa có ảnh nào trong Album.</p>
                ) : (
                  mediaAssets.map((asset, index) => (
                    <div key={asset.id} className="rounded-2xl border border-[#E8DDCC] bg-[#FCFAF4] p-4 flex flex-col md:flex-row gap-4 relative">
                      <div className="w-full md:w-36 h-28 shrink-0 rounded-xl overflow-hidden border border-[#E8DDCC] bg-white">
                        {asset.src ? (
                          <img src={asset.src} alt={asset.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#8A8178] italic">Chưa có link</div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-2.5 text-xs">
                        <label className="grid gap-1 font-semibold text-[#8A8178] uppercase tracking-wider">
                          Đường dẫn ảnh (URL Cloudinary / Drive)
                          <input className={panelInput} value={asset.src} onChange={(event) => updateMediaAsset(index, { src: event.target.value })} />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-1 font-semibold text-[#8A8178] uppercase tracking-wider">
                            Tiêu đề
                            <input className={panelInput} value={asset.title} onChange={(event) => updateMediaAsset(index, { title: event.target.value })} />
                          </label>
                          <label className="grid gap-1 font-semibold text-[#8A8178] uppercase tracking-wider">
                            Từ khoá tìm kiếm / Alt
                            <input className={panelInput} value={asset.alt} onChange={(event) => updateMediaAsset(index, { alt: event.target.value })} />
                          </label>
                        </div>
                        <label className="grid gap-1 font-semibold text-[#8A8178] uppercase tracking-wider">
                          Quyền xem (Tags nhóm được xem, cách nhau bởi dấu phẩy)
                          <input className={panelInput} value={joinAudienceTags(asset.photoTags)} onChange={(event) => updateMediaAsset(index, { photoTags: parseAudienceTags(event.target.value) })} />
                        </label>
                        <div className="flex items-center justify-between pt-2 border-t border-[#E8DDCC]/60 text-[10px] text-[#8A8178]">
                          <span>Cập nhật: {formatDate(asset.updatedAt)}</span>
                          <span className="font-semibold uppercase text-[#5F6F4E]">{asset.status === "published" ? "Hoạt động" : "Nháp"}</span>
                        </div>
                      </div>

                      <button type="button" onClick={() => removeMediaAsset(index)} className="absolute top-4 right-4 h-8 w-8 rounded-full border border-[#E8DDCC] bg-white flex items-center justify-center text-[#9B4E5C] hover:bg-red-50 active:scale-[0.92] transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>
          </section>

          {/* Right panel: Album Rules manager */}
          <section className="rounded-2xl border border-[#DED4C5] bg-white shadow-sm">
            <div className="p-4 sm:p-5">
              
              <div className="flex items-center justify-between gap-4 border-b border-[#E8DDCC] pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#2E2A25]">Quy tắc xem ảnh</h2>
                  <p className="mt-0.5 text-xs text-[#7B7168]">Phân quyền album theo nhóm khách</p>
                </div>
                <button type="button" onClick={() => addAlbumRule()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#5F6F4E] px-4 text-xs font-bold text-white active:scale-[0.98] transition">
                  <Plus className="h-3.5 w-3.5" /> Thêm quy tắc
                </button>
              </div>

              <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-1">
                {albumRules.map((rule, index) => (
                  <div key={`${rule.audienceTag}-${index}`} className="rounded-2xl border border-[#E8DDCC] bg-white p-4 relative shadow-[0_2px_8px_rgba(63,70,66,0.02)]">
                    <div className="grid gap-3.5 sm:grid-cols-[1fr_1.2fr_auto] sm:items-end text-xs">
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Nhóm khách xem (audienceTag)
                        <input className={panelInput} value={joinAudienceTags([rule.audienceTag])} onChange={(event) => updateAlbumRule(index, { audienceTag: parseAudienceTags(event.target.value)[0] || event.target.value.trim() })} />
                      </label>
                      <label className="grid gap-1.5 font-semibold text-[#8A8178] uppercase tracking-wider">
                        Các tag ảnh được phép xem
                        <input className={panelInput} value={joinAudienceTags(rule.allowedPhotoTags)} onChange={(event) => updateAlbumRule(index, { allowedPhotoTags: parseAudienceTags(event.target.value) })} />
                      </label>
                      <button type="button" onClick={() => removeAlbumRule(index)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#E8DDCC] bg-white px-4 text-xs font-semibold text-[#9B4E5C] hover:bg-red-50 active:scale-[0.98] transition">
                        <Trash2 className="h-3.5 w-3.5" /> Xoá
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-[#E8DDCC] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => void saveAlbum()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2E2A25] px-5 text-sm font-bold text-white transition hover:bg-[#1a1714] active:scale-[0.98]" disabled={busy}>
                    <Save className="h-4 w-4" /> Lưu cấu hình album
                  </button>
                  {mediaMessage && <p className="text-xs font-semibold text-[#5F6F4E]">{mediaMessage}</p>}
                </div>
              </div>

            </div>
          </section>
        </div>
      )}
    </div>
  );
}
