"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Download,
  FileUp,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import {
  buildInviteUrl,
  createInvitee,
  createMediaAsset,
  defaultAlbumRules,
  filterMediaAssetsForInvitee,
  generateInviteToken,
  getInviteStatusFromRsvp,
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
import { attendingLabel, readRSVPResponses, removeRSVPResponses, summarizeLodgingGuests, type RSVPResponse } from "@/lib/rsvp-storage";
import { applyTheme } from "@/lib/site-settings";
import { usePublishedSettings } from "@/lib/use-published-settings";

type InviteAdminApiResponse = {
  backend: "local" | "supabase";
  invitees?: Invitee[];
  mediaAssets?: MediaAsset[];
  albumRules?: AlbumRule[];
};

const panelInput =
  "min-h-11 w-full rounded-2xl border border-[#E8DDCC] bg-white px-4 text-sm font-normal normal-case tracking-normal text-[#2E2A25] outline-none transition placeholder:text-[#8A8178] focus:border-[#6B7A5A] focus:ring-4 focus:ring-[#6B7A5A]/12";

const panelSelect = `${panelInput} pr-8`;

const inviteStatusLabels: Record<Invitee["inviteStatus"], string> = {
  invited: "Chưa gửi",
  rsvp_yes: "Đã xác nhận",
  rsvp_no: "Đã từ chối",
  rsvp_maybe: "Đang cân nhắc",
  supplement_ready: "Đã có bổ sung",
  album_ready: "Đã sẵn sàng xem album",
};

const supplementStatusLabels: Record<"draft" | "published", string> = {
  draft: "Nháp",
  published: "Đã gửi",
};

const backendLabels: Record<"local" | "supabase", string> = {
  local: "Lưu cục bộ",
  supabase: "Supabase",
};

function formatDate(value: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}

function ensureSupplement(invitee: Invitee): NonNullable<Invitee["supplement"]> {
  const now = new Date().toISOString();
  return invitee.supplement ?? {
    id: crypto.randomUUID(),
    inviteeId: invitee.id,
    tableZone: "",
    tableName: "",
    seatNote: "",
    arrivalNote: "",
    status: "draft",
    updatedAt: now,
  };
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

function normalizeInviteeMatchKey(value: string) {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  const [importNotice, setImportNotice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mediaMessage, setMediaMessage] = useState("");
  const [tab, setTab] = useState<"invitees" | "album">("invitees");
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const selectedInvitee = useMemo(() => {
    return invitees.find((item) => item.id === selectedInviteeId) ?? invitees[0] ?? null;
  }, [invitees, selectedInviteeId]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const [inviteResponse, rsvpResponse] = await Promise.all([
          fetch("/api/admin/invites"),
          fetch("/api/rsvp"),
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

        if (inviteResponse.ok) {
          const result = await inviteResponse.json() as InviteAdminApiResponse;
          if (result.backend === "supabase") {
            nextBackend = "supabase";
            nextInvitees = result.invitees ?? [];
            nextMediaAssets = result.mediaAssets ?? [];
            nextAlbumRules = result.albumRules?.length ? result.albumRules : defaultAlbumRules;
          }
        }

        if (rsvpResponse.ok) {
          const result = await rsvpResponse.json() as { responses: RSVPResponse[]; backend: string };
          if (result.backend === "supabase") {
            nextResponses = result.responses ?? [];
          }
        }

        if (!cancelled) {
          setBackend(nextBackend);
          setInvitees(nextInvitees);
          setMediaAssets(nextMediaAssets);
          setAlbumRules(nextAlbumRules);
          setResponses(nextResponses);
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

  const selectedRsvp = selectedInvitee?.id ? rsvpByInviteeId.get(selectedInvitee.id) : undefined;
  const visibleAlbumAssets = selectedInvitee ? filterMediaAssetsForInvitee(mediaAssets, selectedInvitee, albumRules) : mediaAssets.filter((asset) => asset.status === "published");

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

  function regenerateSelectedInviteCopy() {
    if (!selectedInvitee) return;
    patchSelectedInvitee(buildInviteCopyPatch(selectedInvitee, config.couple.displayName));
    setMessage("Đã tạo lại dòng phong bì và lời mời theo cách xưng hô hiện tại.");
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

  async function saveSupplement() {
    if (!selectedInvitee) return;
    const supplement = ensureSupplement(selectedInvitee);
    const now = new Date().toISOString();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (backend === "supabase") {
        const response = await fetch(`/api/admin/invites/${selectedInvitee.id}/supplement`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableZone: supplement.tableZone,
            tableName: supplement.tableName,
            seatNote: supplement.seatNote,
            arrivalNote: supplement.arrivalNote,
            status: supplement.status,
          }),
        });

        if (!response.ok) throw new Error("Không lưu được thông tin bổ sung.");
        const result = await response.json() as { invitee?: Invitee };
        if (result.invitee) {
          setInvitees((current) => current.map((item) => item.id === result.invitee?.id ? result.invitee as Invitee : item));
        }
        setMessage("Đã lưu thông tin bổ sung.");
      } else {
        const nextInvitees = invitees.map((item) => item.id === selectedInvitee.id
          ? {
              ...item,
              supplement: { ...supplement, updatedAt: now },
              inviteStatus: supplement.status === "published" ? "supplement_ready" : item.inviteStatus,
              updatedAt: now,
            }
          : item);
        setInvitees(nextInvitees);
        writeLocalInvitees(nextInvitees);
        setMessage("Đã lưu thông tin bổ sung vào bộ nhớ trình duyệt.");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không lưu được thông tin bổ sung.");
    } finally {
      setBusy(false);
    }
  }

  async function clearSupplement() {
    if (!selectedInvitee) return;
    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (backend === "supabase") {
        const response = await fetch(`/api/admin/invites/${selectedInvitee.id}/supplement`, { method: "DELETE" });
        if (!response.ok) throw new Error("Không xóa được thông tin bổ sung.");
        const result = await response.json() as { invitee?: Invitee | null };
        setInvitees((current) => current.map((item) => item.id === selectedInvitee.id
          ? result.invitee ?? { ...item, supplement: undefined, updatedAt: new Date().toISOString() }
          : item));
      } else {
        const now = new Date().toISOString();
        const nextStatus = selectedRsvp ? getInviteStatusFromRsvp(selectedRsvp.attending) : "invited";
        const nextInvitees = invitees.map((item) => item.id === selectedInvitee.id
          ? { ...item, supplement: undefined, inviteStatus: nextStatus, updatedAt: now }
          : item);
        setInvitees(nextInvitees);
        writeLocalInvitees(nextInvitees);
      }

      setMessage("Đã xóa thông tin bổ sung.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không xóa được thông tin bổ sung.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateToken() {
    if (!selectedInvitee) return;
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

  async function addInvitee() {
    setBusy(true);
    setMessage("");
    setError("");

    const existingTokens = new Set(invitees.map((item) => item.token));
    const nextInvitee = createInvitee({
      displayLabel: "Khách chưa đặt tên",
      guestName: "Khách chưa đặt tên",
      invitationName: "Khách chưa đặt tên",
      guestGroup: "Khác",
      audienceTags: ["friends"],
    }, existingTokens);

    try {
      let nextInvitees = [nextInvitee, ...invitees];
      let nextSelectedId = nextInvitee.id;

      if (backend === "supabase") {
        const response = await fetch("/api/admin/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitees: [nextInvitee] }),
        });
        if (!response.ok) throw new Error("Không tạo được khách mời.");
        const result = await response.json() as InviteAdminApiResponse;
        const savedInvitee = result.invitees?.[0];
        if (savedInvitee) {
          nextInvitees = [savedInvitee, ...invitees];
          nextSelectedId = savedInvitee.id;
        }
      } else {
        writeLocalInvitees(nextInvitees);
      }

      setInvitees(nextInvitees);
      setSelectedInviteeId(nextSelectedId);
      setMessage("Đã tạo khách mời mới.");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Không tạo được khách mời.");
    } finally {
      setBusy(false);
    }
  }

  function preserveExistingInviteLinks(nextInvitees: Invitee[]) {
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
        supplement: match.supplement,
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

      const nextInvitees = preserveExistingInviteLinks(parsed.invitees);
      if (nextInvitees.length === 0) throw new Error("File Excel chưa có dòng khách mời hợp lệ.");

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
        setSelectedInviteeId(savedInvitees[0]?.id || selectedInviteeId);
        setMessage(`Đã nhập ${nextInvitees.length} khách mời từ Excel. Có thể xuất danh sách link riêng ngay.`);
      } else {
        const merged = upsertLocalInvitees(nextInvitees);
        setInvitees(merged);
        setSelectedInviteeId(nextInvitees[0]?.id || selectedInviteeId);
        setMessage(`Đã nhập ${nextInvitees.length} khách mời vào bộ nhớ trình duyệt. Có thể xuất danh sách link riêng ngay.`);
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

  async function exportInviteLinksWorkbook() {
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/invite-links-workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitees, origin: window.location.origin }),
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
      setMessage("Đã xuất Excel link thiệp mời độc bản.");
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

  return (
    <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#E8DDCC] bg-[#FFFDF8] shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#E8DDCC] px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6B7A5A]">Quản lý khách mời</p>
          <h2 className="mt-2 font-serif text-4xl text-[#2E2A25]">Mẫu khách mời, link riêng, hồi đáp và album</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#665d54]">
            Nguồn dữ liệu đang dùng: <b>{backendLabels[backend]}</b>. {config.event.dateLabel} tại {config.venue.name}. Link mời là độc bản, mọi lời hồi đáp, thông tin bổ sung và album đều bám theo cùng một khách.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void downloadTemplate()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D6BFA3] bg-white px-4 text-sm font-semibold text-[#2E2A25]">
            <Download className="h-4 w-4" /> Tải mẫu Excel
          </button>
          <button type="button" onClick={() => void exportInviteLinksWorkbook()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D6BFA3] bg-white px-4 text-sm font-semibold text-[#2E2A25]">
            <Download className="h-4 w-4" /> Xuất Excel link riêng
          </button>
          <button type="button" onClick={() => void addInvitee()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6B7A5A] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={busy}>
            <Plus className="h-4 w-4" /> Thêm khách mời
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-[#E8DDCC] px-6 py-3">
        <button
          type="button"
          onClick={() => setTab("invitees")}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${tab === "invitees" ? "bg-[#6B7A5A] text-white" : "bg-white text-[#665d54] border border-[#E8DDCC]"}`}
        >
          <Settings2 className="h-4 w-4" /> Khách mời
        </button>
        <button
          type="button"
          onClick={() => setTab("album")}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${tab === "album" ? "bg-[#6B7A5A] text-white" : "bg-white text-[#665d54] border border-[#E8DDCC]"}`}
        >
          <ImagePlus className="h-4 w-4" /> Album
        </button>
        <span className="text-sm text-[#8A8178]">Lời hồi đáp: {summary.total} · có {summary.yes} · không {summary.no} · chờ {summary.maybe}</span>
      </div>

      {tab === "invitees" ? (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.55fr)]">
          <div className="min-w-0 border-b border-[#E8DDCC] lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center gap-3 border-b border-[#E8DDCC] px-6 py-4">
              <label className="inline-flex min-h-11 flex-1 items-center gap-2 rounded-full border border-[#E8DDCC] bg-white px-4 text-sm text-[#8A8178]">
                <FileUp className="h-4 w-4" />
                <span className="py-3 leading-5">Điền file Excel mẫu có dropdown và công thức lời mời, tải lên để /admin tạo link riêng cho từng khách.</span>
              </label>
            <button type="button" onClick={() => importFileRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D6BFA3] bg-white px-4 text-sm font-semibold text-[#2E2A25]" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Nhập file Excel
            </button>
              <input ref={importFileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => void importWorkbookFile(event.target.files?.[0])} />
            </div>
            {importNotice ? <p className="border-b border-[#E8DDCC] px-6 py-3 text-xs text-[#8A8178]">{importNotice}</p> : null}
            <div className="max-h-[40rem] overflow-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="sticky top-0 bg-[#F8F3EA] text-[#8A8178]">
                  <tr>
                    <th className="p-4">Tên hiển thị</th>
                    <th className="p-4">Mã link riêng</th>
                    <th className="p-4">Nhóm khách</th>
                    <th className="p-4">Phản hồi</th>
                    <th className="p-4">Sao chép link</th>
                  </tr>
                </thead>
                <tbody>
                  {invitees.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-[#8A8178]">Chưa có khách mời. Hãy nhập danh sách hoặc thêm dòng trước.</td></tr>
                  ) : invitees.map((invitee) => {
                    const rsvp = invitee.rsvp ?? rsvpByInviteeId.get(invitee.id);
                    const isSelected = selectedInvitee?.id === invitee.id;
                    return (
                      <tr
                        key={invitee.id}
                        className={`cursor-pointer border-t border-[#E8DDCC] align-top ${isSelected ? "bg-[#F8F3EA]" : "hover:bg-[#FCFAF4]"}`}
                        onClick={() => setSelectedInviteeId(invitee.id)}
                      >
                        <td className="p-4">
                          <p className="font-semibold text-[#2E2A25]">{invitee.displayLabel}</p>
                          <p className="mt-1 text-xs text-[#8A8178]">{inviteUnitLabels[invitee.inviteUnit]} · {inviteStatusLabels[invitee.inviteStatus]}</p>
                        </td>
                        <td className="p-4 text-xs text-[#665d54]">{invitee.token}</td>
                        <td className="p-4 text-sm">{invitee.guestGroup}</td>
                        <td className="p-4 text-sm">
                          {rsvp ? `${attendingLabel(rsvp.attending)} · ${rsvp.guestCount} khách` : "Chưa có"}
                        </td>
                        <td className="p-4">
                          <button type="button" onClick={(event) => { event.stopPropagation(); void navigator.clipboard.writeText(buildInviteUrl(invitee.token, window.location.origin)); setMessage("Đã sao chép link."); }} className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7A5A]">
                            <Link2 className="h-4 w-4" /> Sao chép
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="min-w-0 space-y-6 p-6">
            {selectedInvitee ? (
              <>
                <div className="rounded-[1.4rem] border border-[#E8DDCC] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7A5A]">Khách mời đang chọn</p>
                  <h3 className="mt-2 font-serif text-3xl text-[#2E2A25]">{selectedInvitee.displayLabel}</h3>
                  <p className="mt-2 text-sm text-[#665d54]">{selectedInvitee.envelopeLine}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void regenerateToken()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E8DDCC] bg-white px-4 text-xs font-semibold text-[#2E2A25]">
                        <RefreshCw className="h-4 w-4" /> Đổi mã link
                      </button>
                  <button type="button" onClick={copyInviteLink} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#6B7A5A] px-4 text-xs font-semibold text-white">
                    <Copy className="h-4 w-4" /> Sao chép link
                  </button>
                  <button type="button" onClick={regenerateSelectedInviteCopy} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D6BFA3] bg-[#FCFAF4] px-4 text-xs font-semibold text-[#2E2A25]">
                        <RefreshCw className="h-4 w-4" /> Cập nhật lời mời
                      </button>
                  <button type="button" onClick={() => void saveSelectedInvitee()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D6BFA3] bg-white px-4 text-xs font-semibold text-[#2E2A25]" disabled={busy}>
                        <Save className="h-4 w-4" /> Lưu
                      </button>
                      <button type="button" onClick={() => void deleteSelectedInvitee()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E8DDCC] bg-white px-4 text-xs font-semibold text-[#9B4E5C]" disabled={busy}>
                        <Trash2 className="h-4 w-4" /> Xóa
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Tên hiển thị
                      <input className={panelInput} placeholder="Ví dụ: Chú Sáu, Cô Năm, Gia Hân" value={selectedInvitee.displayLabel} onChange={(event) => patchSelectedInvitee({ displayLabel: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Tên khách mời
                      <input className={panelInput} placeholder="Ví dụ: Ông Sáu, Cô Năm, Gia Hân" value={selectedInvitee.guestName} onChange={(event) => patchSelectedInvitee({ guestName: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Tên in trên thiệp
                      <input className={panelInput} placeholder="Ví dụ: Chú Sáu, Cô Năm, Anh Hoàng" value={selectedInvitee.invitationName} onChange={(event) => patchSelectedInvitee({ invitationName: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Danh xưng
                      <input className={panelInput} placeholder="Ví dụ: Chú, Cô, Anh, Chị, Em" value={selectedInvitee.honorific} onChange={(event) => patchSelectedInvitee({ honorific: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Nhóm khách mời
                      <input className={panelInput} value={selectedInvitee.guestGroup} onChange={(event) => patchSelectedInvitee({ guestGroup: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Dòng ngoài phong bì
                      <input className={panelInput} value={selectedInvitee.envelopeLine} onChange={(event) => patchSelectedInvitee({ envelopeLine: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Lời mời trong thiệp
                      <input className={panelInput} value={selectedInvitee.insideInviteLine} onChange={(event) => patchSelectedInvitee({ insideInviteLine: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Mời riêng hay mời chung
                      <select className={panelSelect} value={selectedInvitee.inviteUnit} onChange={(event) => patchSelectedInvitee({ inviteUnit: event.target.value === "household" ? "household" : "individual" })}>
                        <option value="individual">{inviteUnitLabels.individual}</option>
                        <option value="household">{inviteUnitLabels.household}</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Ai đứng mời
                      <select className={panelSelect} value={selectedInvitee.invitedBy} onChange={(event) => patchSelectedInvitee({ invitedBy: event.target.value === "parents" ? "parents" : "couple" })}>
                        <option value="couple">{invitedByLabels.couple}</option>
                        <option value="parents">{invitedByLabels.parents}</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Quan hệ với cô dâu chú rể
                      <input className={panelInput} placeholder="Ví dụ: ông của cô dâu/chú rể, bạn, anh, em" value={selectedInvitee.relationship} onChange={(event) => patchSelectedInvitee({ relationship: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Quan hệ với người mời
                      <input className={panelInput} placeholder="Ví dụ: chú, bác, bạn, đồng nghiệp" value={selectedInvitee.hostRelationship} onChange={(event) => patchSelectedInvitee({ hostRelationship: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Người mời xưng là
                      <input className={panelInput} placeholder="Ví dụ: gia đình chúng con, tụi mình, tụi em" value={selectedInvitee.hostPronoun} onChange={(event) => patchSelectedInvitee({ hostPronoun: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Người mời gọi cô dâu chú rể
                      <input className={panelInput} placeholder="Ví dụ: hai cháu, hai con, tụi mình" value={selectedInvitee.coupleReference} onChange={(event) => patchSelectedInvitee({ coupleReference: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Mời đi cùng
                      <select className={panelSelect} value={selectedInvitee.householdMode} onChange={(event) => patchSelectedInvitee({ householdMode: event.target.value as Invitee["householdMode"] })}>
                        <option value="single">{householdModeLabels.single}</option>
                        <option value="couple">{householdModeLabels.couple}</option>
                        <option value="family">{householdModeLabels.family}</option>
                        <option value="widowed">{householdModeLabels.widowed}</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Người đi kèm
                      <select className={panelSelect} value={selectedInvitee.plusOnePolicy} onChange={(event) => patchSelectedInvitee({ plusOnePolicy: event.target.value as Invitee["plusOnePolicy"] })}>
                        <option value="none">{plusOnePolicyLabels.none}</option>
                        <option value="spouse">{plusOnePolicyLabels.spouse}</option>
                        <option value="family">{plusOnePolicyLabels.family}</option>
                        <option value="lover">{plusOnePolicyLabels.lover}</option>
                        <option value="open_plus_one">{plusOnePolicyLabels.open_plus_one}</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Nhóm xem album
                      <input className={panelInput} value={joinAudienceTags(selectedInvitee.audienceTags)} onChange={(event) => patchSelectedInvitee({ audienceTags: parseAudienceTags(event.target.value) })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Số khách
                      <input className={panelInput} type="number" min={1} value={selectedInvitee.expectedGuestCount} onChange={(event) => patchSelectedInvitee({ expectedGuestCount: Math.max(1, Number(event.target.value) || 1) })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Số điện thoại
                      <input className={panelInput} value={selectedInvitee.phone} onChange={(event) => patchSelectedInvitee({ phone: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Email
                      <input className={panelInput} value={selectedInvitee.email} onChange={(event) => patchSelectedInvitee({ email: event.target.value })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178] sm:col-span-2">
                      Ghi chú
                      <textarea className={`${panelInput} min-h-24 py-3`} value={selectedInvitee.notes} onChange={(event) => patchSelectedInvitee({ notes: event.target.value })} />
                    </label>
                  </div>

                  <div className="mt-5 rounded-[1.2rem] border border-[#E8DDCC] bg-[#FCFAF4] p-4 text-sm text-[#665d54]">
                    <p className="font-semibold text-[#2E2A25]">Link riêng</p>
                    <p className="mt-2 break-all">{buildInviteUrl(selectedInvitee.token, typeof window === "undefined" ? "" : window.location.origin)}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#8A8178]">Trạng thái lời hồi đáp: {selectedRsvp ? attendingLabel(selectedRsvp.attending) : "chưa có"}</p>
                  </div>

                  {selectedRsvp ? (
                    <div className="mt-4 rounded-[1.2rem] border border-[#E8DDCC] bg-[#FCFAF4] p-4 text-sm text-[#665d54]">
                      <p className="font-semibold text-[#2E2A25]">Lời hồi đáp mới nhất</p>
                      <p className="mt-2">Lưu trú: {selectedRsvp.accommodationNeeded ? `${selectedRsvp.stayingGuestCount ?? selectedRsvp.lodgingGuests?.length ?? 0} người` : "Không đăng ký"}</p>
                      <p className="mt-1">Người lưu trú: {selectedRsvp.lodgingGuests?.length ? summarizeLodgingGuests(selectedRsvp.lodgingGuests) : "Không có"}</p>
                      <p className="mt-1">Lưu ý: {selectedRsvp.dietaryNote || selectedRsvp.notes || "Không có"}</p>
                    </div>
                  ) : null}

                  {message ? <p className="mt-4 text-sm font-semibold text-[#6B7A5A]">{message}</p> : null}
                  {error ? <p className="mt-4 text-sm font-semibold text-[#9B4E5C]">{error}</p> : null}
                </div>

                <div className="rounded-[1.4rem] border border-[#E8DDCC] bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7A5A]">Thông tin bổ sung</p>
                      <h4 className="mt-2 font-serif text-2xl text-[#2E2A25]">Bàn tiệc, chỗ ngồi, hướng dẫn đến nơi</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void clearSupplement()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E8DDCC] bg-white px-4 text-xs font-semibold text-[#9B4E5C]" disabled={busy}>
                        <Trash2 className="h-4 w-4" /> Xóa
                      </button>
                      <button type="button" onClick={() => void saveSupplement()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#6B7A5A] px-4 text-xs font-semibold text-white" disabled={busy}>
                        <Save className="h-4 w-4" /> Lưu thông tin bổ sung
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Khu vực bàn
                      <input className={panelInput} value={selectedInvitee.supplement?.tableZone ?? ""} onChange={(event) => patchSelectedInvitee({ supplement: { ...ensureSupplement(selectedInvitee), tableZone: event.target.value, updatedAt: new Date().toISOString() } })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Tên bàn
                      <input className={panelInput} value={selectedInvitee.supplement?.tableName ?? ""} onChange={(event) => patchSelectedInvitee({ supplement: { ...ensureSupplement(selectedInvitee), tableName: event.target.value, updatedAt: new Date().toISOString() } })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178] sm:col-span-2">
                      Ghi chú chỗ ngồi
                      <input className={panelInput} value={selectedInvitee.supplement?.seatNote ?? ""} onChange={(event) => patchSelectedInvitee({ supplement: { ...ensureSupplement(selectedInvitee), seatNote: event.target.value, updatedAt: new Date().toISOString() } })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178] sm:col-span-2">
                      Hướng dẫn đến nơi
                      <input className={panelInput} value={selectedInvitee.supplement?.arrivalNote ?? ""} onChange={(event) => patchSelectedInvitee({ supplement: { ...ensureSupplement(selectedInvitee), arrivalNote: event.target.value, updatedAt: new Date().toISOString() } })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Trạng thái hiển thị
                      <select className={panelSelect} value={selectedInvitee.supplement?.status ?? "draft"} onChange={(event) => patchSelectedInvitee({ supplement: { ...ensureSupplement(selectedInvitee), status: event.target.value === "published" ? "published" : "draft", updatedAt: new Date().toISOString() } })}>
                        <option value="draft">{supplementStatusLabels.draft}</option>
                        <option value="published">{supplementStatusLabels.published}</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-[#E8DDCC] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7A5A]">Album khách này được xem</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {visibleAlbumAssets.length === 0 ? (
                      <p className="text-sm text-[#8A8178]">Chưa có ảnh phù hợp cho nhóm khách này.</p>
                    ) : visibleAlbumAssets.map((asset) => (
                      <div key={asset.id} className="overflow-hidden rounded-[1rem] border border-[#E8DDCC]">
                        <img src={asset.src} alt={asset.alt} className="h-44 w-full object-cover" />
                        <div className="p-3">
                          <p className="text-sm font-semibold text-[#2E2A25]">{asset.title}</p>
                          <p className="mt-1 text-xs text-[#8A8178]">{joinAudienceTags(asset.photoTags)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[1.4rem] border border-[#E8DDCC] bg-white p-6 text-sm text-[#8A8178]">Chưa chọn khách mời.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
          <div className="border-b border-[#E8DDCC] lg:border-b-0 lg:border-r p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7A5A]">Ảnh album</p>
                <h3 className="mt-2 font-serif text-3xl text-[#2E2A25]">Danh sách ảnh</h3>
              </div>
              <button type="button" onClick={() => void addMediaAsset()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#6B7A5A] px-4 text-xs font-semibold text-white">
                <Plus className="h-4 w-4" /> Thêm ảnh
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              {mediaAssets.length === 0 ? (
                <p className="text-sm text-[#8A8178]">Chưa có ảnh nào.</p>
              ) : mediaAssets.map((asset, index) => (
                <div key={asset.id} className="rounded-[1.2rem] border border-[#E8DDCC] bg-[#FCFAF4] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                        Link ảnh
                        <input className={panelInput} value={asset.src} onChange={(event) => updateMediaAsset(index, { src: event.target.value })} />
                      </label>
                      <label className="mt-3 grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                        Tên ảnh
                        <input className={panelInput} value={asset.title} onChange={(event) => updateMediaAsset(index, { title: event.target.value })} />
                      </label>
                      <label className="mt-3 grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                        Mô tả ảnh
                        <input className={panelInput} value={asset.alt} onChange={(event) => updateMediaAsset(index, { alt: event.target.value })} />
                      </label>
                      <label className="mt-3 grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                        Tag ảnh
                        <input className={panelInput} value={joinAudienceTags(asset.photoTags)} onChange={(event) => updateMediaAsset(index, { photoTags: parseAudienceTags(event.target.value) })} />
                      </label>
                    </div>
                    <button type="button" onClick={() => removeMediaAsset(index)} className="rounded-full border border-[#E8DDCC] bg-white p-2 text-[#9B4E5C]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-[#8A8178]">Trạng thái: {asset.status === "published" ? "Đã gửi" : "Nháp"} · {formatDate(asset.updatedAt)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7A5A]">Quy tắc album</p>
                <h3 className="mt-2 font-serif text-3xl text-[#2E2A25]">Tag nhóm khách</h3>
              </div>
              <button type="button" onClick={() => addAlbumRule()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#6B7A5A] px-4 text-xs font-semibold text-white">
                <Plus className="h-4 w-4" /> Thêm quy tắc
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              {albumRules.map((rule, index) => (
                <div key={`${rule.audienceTag}-${index}`} className="rounded-[1.2rem] border border-[#E8DDCC] bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr_auto] sm:items-end">
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Tag nhóm khách
                      <input className={panelInput} value={joinAudienceTags([rule.audienceTag])} onChange={(event) => updateAlbumRule(index, { audienceTag: parseAudienceTags(event.target.value)[0] || event.target.value.trim() })} />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8A8178]">
                      Tag ảnh được xem
                      <input className={panelInput} value={joinAudienceTags(rule.allowedPhotoTags)} onChange={(event) => updateAlbumRule(index, { allowedPhotoTags: parseAudienceTags(event.target.value) })} />
                    </label>
                    <button type="button" onClick={() => removeAlbumRule(index)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E8DDCC] bg-white px-4 text-xs font-semibold text-[#9B4E5C]">
                      <Trash2 className="h-4 w-4" /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button type="button" onClick={() => void saveAlbum()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2E2A25] px-4 text-sm font-semibold text-white" disabled={busy}>
                <Save className="h-4 w-4" /> Lưu album
              </button>
              {mediaMessage ? <p className="text-sm text-[#6B7A5A]">{mediaMessage}</p> : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
