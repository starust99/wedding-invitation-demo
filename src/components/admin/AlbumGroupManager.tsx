"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Image as ImageIcon, Loader2, Save, UsersRound } from "lucide-react";
import type { Invitee } from "@/lib/invites";
import {
  draftStorageKey,
  getDraftSettings,
  normalizeSettings,
  publishedStorageKey,
  writeSettings,
  type SiteSettings,
} from "@/lib/site-settings";

const inputClass = "min-h-11 w-full rounded-xl border border-[#E8DDCC] bg-white px-4 text-sm font-normal text-[#2E2A25] outline-none transition placeholder:text-[#AAA198] focus:border-[#6B7A5A] focus:ring-4 focus:ring-[#6B7A5A]/12";

type GroupSummary = {
  name: string;
  invitationCount: number;
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function toIsoWithLocalOffset(value: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function isUsableLink(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function AlbumGroupManager({ invitees }: { invitees: Invitee[] }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [ceremonyGroupLinks, setCeremonyGroupLinks] = useState<Record<string, string>>({});
  const [banquetGroupLinks, setBanquetGroupLinks] = useState<Record<string, string>>({});
  const [ceremonyDefaultUrl, setCeremonyDefaultUrl] = useState("");
  const [banquetDefaultUrl, setBanquetDefaultUrl] = useState("");
  const [availableAfter, setAvailableAfter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const groups = useMemo<GroupSummary[]>(() => {
    const counts = new Map<string, number>();

    for (const invitee of invitees) {
      const group = invitee.guestGroup.trim();
      if (!group) continue;
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }

    return Array.from(counts, ([name, invitationCount]) => ({ name, invitationCount }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [invitees]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch("/api/site-settings?draft=1", { cache: "no-store" });
        const result = response.ok
          ? await response.json() as { settings?: SiteSettings; backend?: string }
          : null;
        const nextSettings = result?.settings ? normalizeSettings(result.settings) : getDraftSettings();

        if (cancelled) return;
        setSettings(nextSettings);
        setCeremonyGroupLinks(nextSettings.content.postWeddingGallery.ceremonyGroupLinks ?? {});
        setBanquetGroupLinks(nextSettings.content.postWeddingGallery.banquetGroupLinks ?? {});
        setCeremonyDefaultUrl(nextSettings.content.postWeddingGallery.ceremonyDefaultUrl ?? "");
        setBanquetDefaultUrl(nextSettings.content.postWeddingGallery.banquetDefaultUrl ?? "");
        setAvailableAfter(toDateTimeLocal(nextSettings.content.postWeddingGallery.availableAfter));
      } catch {
        if (cancelled) return;
        const nextSettings = getDraftSettings();
        setSettings(nextSettings);
        setCeremonyGroupLinks(nextSettings.content.postWeddingGallery.ceremonyGroupLinks ?? {});
        setBanquetGroupLinks(nextSettings.content.postWeddingGallery.banquetGroupLinks ?? {});
        setCeremonyDefaultUrl(nextSettings.content.postWeddingGallery.ceremonyDefaultUrl ?? "");
        setBanquetDefaultUrl(nextSettings.content.postWeddingGallery.banquetDefaultUrl ?? "");
        setAvailableAfter(toDateTimeLocal(nextSettings.content.postWeddingGallery.availableAfter));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const ceremonyConfiguredCount = groups.filter((group) => Boolean(ceremonyGroupLinks[group.name]?.trim() || ceremonyDefaultUrl.trim())).length;
  const banquetConfiguredCount = groups.filter((group) => Boolean(banquetGroupLinks[group.name]?.trim() || banquetDefaultUrl.trim())).length;

  function updateGroupLink(event: "ceremony" | "banquet", group: string, value: string) {
    const setter = event === "ceremony" ? setCeremonyGroupLinks : setBanquetGroupLinks;
    setter((current) => ({ ...current, [group]: value }));
    setMessage("");
    setError("");
  }

  async function save() {
    if (!settings) return;

    const invalidCeremonyGroup = groups.find((group) => !isUsableLink(ceremonyGroupLinks[group.name] ?? ""));
    const invalidBanquetGroup = groups.find((group) => !isUsableLink(banquetGroupLinks[group.name] ?? ""));
    if (invalidCeremonyGroup || invalidBanquetGroup || !isUsableLink(ceremonyDefaultUrl) || !isUsableLink(banquetDefaultUrl)) {
      setError(
        invalidCeremonyGroup
          ? `Link album Thánh lễ của nhóm “${invalidCeremonyGroup.name}” chưa đúng.`
          : invalidBanquetGroup
            ? `Link album Tiệc cưới của nhóm “${invalidBanquetGroup.name}” chưa đúng.`
            : "Link album dự phòng chưa đúng.",
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const cleanLinks = (links: Record<string, string>) => Object.fromEntries(
      Object.entries(links)
        .map(([group, url]) => [group.trim(), url.trim()])
        .filter(([group, url]) => Boolean(group && url)),
    );
    const cleanedCeremonyLinks = cleanLinks(ceremonyGroupLinks);
    const cleanedBanquetLinks = cleanLinks(banquetGroupLinks);
    const hasAnyLink = Boolean(ceremonyDefaultUrl.trim() || banquetDefaultUrl.trim())
      || Object.keys(cleanedCeremonyLinks).length > 0
      || Object.keys(cleanedBanquetLinks).length > 0;
    const nextSettings = normalizeSettings({
      ...settings,
      content: {
        ...settings.content,
        postWeddingGallery: {
          ...settings.content.postWeddingGallery,
          enabled: hasAnyLink,
          availableAfter: toIsoWithLocalOffset(availableAfter, settings.content.postWeddingGallery.availableAfter),
          ceremonyDefaultUrl: ceremonyDefaultUrl.trim(),
          banquetDefaultUrl: banquetDefaultUrl.trim(),
          ceremonyGroupLinks: cleanedCeremonyLinks,
          banquetGroupLinks: cleanedBanquetLinks,
          defaultUrl: "",
          groupLinks: {},
        },
      },
    });

    try {
      const response = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nextSettings, publish: true }),
      });

      if (response.status === 503) {
        writeSettings(draftStorageKey, nextSettings);
        writeSettings(publishedStorageKey, nextSettings);
      } else if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || "Không lưu được album.");
      }

      setSettings(nextSettings);
      setCeremonyGroupLinks(cleanedCeremonyLinks);
      setBanquetGroupLinks(cleanedBanquetLinks);
      setMessage(hasAnyLink ? "Đã lưu và cập nhật album trên thiệp." : "Đã tắt album vì chưa có link nào.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không lưu được album.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-2xl border border-[#DED4C5] bg-white text-sm text-[#7B7168] shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải album…
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#DED4C5] bg-white shadow-sm">
      <div className="border-b border-[#E8DDCC] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#5F6F4E]">
              <ImageIcon className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Album sau tiệc</p>
            </div>
            <h2 className="mt-2 text-xl font-bold text-[#2E2A25]">Album Thánh lễ và Tiệc cưới</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7B7168]">
              Nhóm được lấy thẳng từ file Excel. Quyền xem còn dựa trên RSVP: khách chỉ thấy album của sự kiện họ đã xác nhận tham dự.
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-2 rounded-xl bg-[#F4F0E7] px-3 py-2 text-xs font-semibold leading-5 text-[#665D54]">
            <CheckCircle2 className="h-4 w-4 text-[#5F6F4E]" />
            <span>
              Thánh lễ: {ceremonyConfiguredCount}/{groups.length}<br />
              Tiệc cưới: {banquetConfiguredCount}/{groups.length}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <div className="grid gap-4 rounded-2xl border border-[#E8DDCC] bg-[#FCFAF4] p-4 lg:grid-cols-3 sm:p-5">
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8A8178]">
            Hiện album từ
            <input
              type="datetime-local"
              className={inputClass}
              value={availableAfter}
              onChange={(event) => setAvailableAfter(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8A8178]">
            Link dự phòng, Thánh lễ
            <input
              type="url"
              className={inputClass}
              value={ceremonyDefaultUrl}
              onChange={(event) => setCeremonyDefaultUrl(event.target.value)}
              placeholder="Dùng khi nhóm chưa có link riêng"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8A8178]">
            Link dự phòng, Tiệc cưới
            <input
              type="url"
              className={inputClass}
              value={banquetDefaultUrl}
              onChange={(event) => setBanquetDefaultUrl(event.target.value)}
              placeholder="Dùng khi nhóm chưa có link riêng"
            />
          </label>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#2E2A25]">Album theo nhóm khách</h3>
              <p className="mt-0.5 text-xs text-[#8A8178]">Mỗi nhóm có hai link độc lập. Nhóm mới import từ Excel sẽ tự xuất hiện.</p>
            </div>
            <UsersRound className="h-5 w-5 text-[#8A8178]" />
          </div>

          {groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D6BFA3] bg-[#FCFAF4] px-5 py-10 text-center">
              <p className="font-semibold text-[#2E2A25]">Chưa có nhóm khách</p>
              <p className="mt-1 text-sm text-[#8A8178]">Nhập danh sách khách từ file Excel trước, các nhóm sẽ tự hiện ở đây.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8DDCC] overflow-hidden rounded-2xl border border-[#E8DDCC]">
              {groups.map((group) => {
                const ceremonyLink = ceremonyGroupLinks[group.name] ?? "";
                const banquetLink = banquetGroupLinks[group.name] ?? "";
                return (
                  <div key={group.name} className="grid gap-3 bg-white p-4 lg:grid-cols-[minmax(11rem,0.7fr)_minmax(14rem,1fr)_minmax(14rem,1fr)] lg:items-center sm:p-5">
                    <div>
                      <p className="font-semibold leading-5 text-[#2E2A25]">{group.name}</p>
                      <p className="mt-1 text-xs text-[#8A8178]">{group.invitationCount} thiệp</p>
                    </div>
                    {([
                      ["ceremony", "Thánh lễ Hôn phối", ceremonyLink],
                      ["banquet", "Tiệc cưới", banquetLink],
                    ] as const).map(([event, label, link]) => (
                      <label key={event} className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A8178]">
                        {label}
                        <span className="flex gap-2">
                          <input
                            type="url"
                            aria-label={`Link album ${label} cho ${group.name}`}
                            className={inputClass}
                            value={link}
                            onChange={(changeEvent) => updateGroupLink(event, group.name, changeEvent.target.value)}
                            placeholder="Dán link Google Drive"
                          />
                          {link.trim() ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Mở thử album ${label} của ${group.name}`}
                              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D6BFA3] bg-white text-[#5F6F4E] transition hover:bg-[#F8F3EA]"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E8DDCC] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-xs font-semibold">
            {message ? <p className="text-[#5F6F4E]">{message}</p> : null}
            {error ? <p className="text-[#9B4E5C]">{error}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5F6F4E] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#526244] active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu và cập nhật thiệp
          </button>
        </div>
      </div>
    </section>
  );
}
