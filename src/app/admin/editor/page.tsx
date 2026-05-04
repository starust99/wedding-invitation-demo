"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Save } from "lucide-react";
import { InvitationPage } from "@/components/InvitationPage";
import { themePresets, type ThemeKey } from "@/config/theme-presets";
import {
  applyTheme,
  draftStorageKey,
  getDraftSettings,
  publishedStorageKey,
  writeSettings,
  type SiteSettings,
  type WeddingConfig,
} from "@/lib/site-settings";

const fieldClass = "min-h-11 rounded-2xl border border-[#E8DDCC] bg-white px-4 text-sm outline-none focus:border-[#6B7A5A] focus:ring-4 focus:ring-[#6B7A5A]/10";
const textareaClass = `${fieldClass} min-h-24 py-3`;

type Path = string;

function setDeepValue<T>(source: T, path: Path, value: unknown): T {
  const parts = path.split(".");
  const clone = structuredClone(source);
  let cursor: Record<string, unknown> = clone as Record<string, unknown>;

  for (const part of parts.slice(0, -1)) {
    cursor = cursor[part] as Record<string, unknown>;
  }

  cursor[parts[parts.length - 1]] = value;
  return clone;
}

function EditorField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
      {label}
      {multiline ? <textarea className={textareaClass} value={value} onChange={(event) => onChange(event.target.value)} /> : <input className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function ImagePicker({ label, value, onChange, aspect = "aspect-[4/5]" }: { label: string; value: string; onChange: (value: string) => void; aspect?: string }) {
  async function pickImage(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-[#E8DDCC] bg-[#FDFBF7] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#2E2A25]">{label}</p>
        <label className="cursor-pointer rounded-full bg-[#8FAADC] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5">
          Chọn ảnh
          <input type="file" accept="image/*" className="hidden" onChange={(event) => pickImage(event.target.files?.[0])} />
        </label>
      </div>
      <div className={`relative overflow-hidden rounded-2xl border border-white bg-white shadow-sm ${aspect}`}>
        {value ? <Image src={value} alt={label} fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[#8A8178]">Chưa có ảnh</div>}
      </div>
      <input className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Hoặc dán URL/path ảnh" />
      <p className="text-xs leading-5 text-[#8A8178]">Demo dùng data URL trong browser nên publish là thấy ngay. Production sẽ đổi nút này sang upload Supabase Storage.</p>
    </div>
  );
}

export default function AdminEditorPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/site-settings?draft=1");
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (response.ok) {
        const result = await response.json() as { settings: SiteSettings; backend: string };
        if (result.backend === "supabase") {
          setSettings(result.settings);
          return;
        }
      }
      setSettings(getDraftSettings());
    }

    loadSettings();
  }, []);

  const previewConfig = useMemo(() => {
    if (!settings) return null;
    return applyTheme(settings.content, settings.themeKey);
  }, [settings]);

  function updateContent(path: string, value: string) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => {
      if (!current) return current;
      return { ...current, content: setDeepValue(current.content, path, value) };
    });
  }

  function updateTimeline(index: number, key: "time" | "title" | "description", value: string) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      content.timeline[index] = { ...content.timeline[index], [key]: value };
      return { ...current, content };
    });
  }

  function updateGallery(index: number, value: string) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      content.gallery[index] = value;
      return { ...current, content };
    });
  }

  function updateTheme(themeKey: ThemeKey) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => current ? { ...current, themeKey } : current);
  }

  async function saveDraft() {
    if (!settings) return;
    writeSettings(draftStorageKey, settings);
    await fetch("/api/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }).catch(() => null);
    setSaved(true);
    setPublished(false);
  }

  async function publish() {
    if (!settings) return;
    const next = { ...settings, publishedAt: new Date().toISOString() };
    writeSettings(draftStorageKey, next);
    writeSettings(publishedStorageKey, next);
    await fetch("/api/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...next, publish: true }),
    }).catch(() => null);
    setSettings(next);
    setSaved(true);
    setPublished(true);
  }

  if (!settings || !previewConfig) {
    return <main className="min-h-screen bg-[#F8F3EA] p-8 text-[#2E2A25]">Đang mở editor...</main>;
  }

  const content = settings.content;

  return (
    <main className="min-h-screen bg-[#F8F3EA] text-[#2E2A25]">
      <div className="sticky top-0 z-30 border-b border-[#E8DDCC] bg-[#FFFDF8]/90 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7A5A]">Admin Editor Demo</p>
            <h1 className="font-serif text-3xl">Edit wedding invitation</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D6BFA3] bg-white px-5 text-sm font-semibold"><Eye className="h-4 w-4" /> Public page</Link>
            <button onClick={saveDraft} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D6BFA3] bg-white px-5 text-sm font-semibold"><Save className="h-4 w-4" /> Save draft</button>
            <button onClick={publish} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6B7A5A] px-5 text-sm font-semibold text-white"><Check className="h-4 w-4" /> Publish</button>
          </div>
        </div>
        {(saved || published) ? <p className="mx-auto mt-2 max-w-7xl text-sm text-[#6B7A5A]">{published ? "Đã publish. Refresh public page để xem bản mới." : "Đã lưu draft trong browser này."}</p> : null}
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[480px_1fr]">
        <section className="grid content-start gap-5">
          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Theme</h2>
            <div className="mt-4 grid gap-3">
              {(Object.keys(themePresets) as ThemeKey[]).map((key) => {
                const theme = themePresets[key];
                return (
                  <button key={key} onClick={() => updateTheme(key)} className="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5" style={{ borderColor: settings.themeKey === key ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.card }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold" style={{ color: theme.colors.text }}>{theme.name}</p>
                        <p className="mt-1 text-xs" style={{ color: theme.colors.muted }}>{theme.description}</p>
                      </div>
                      <div className="flex gap-1">
                        {Object.values(theme.colors).slice(0, 5).map((color) => <span key={color} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Couple & Hero</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="Tên cô dâu" value={content.couple.bride} onChange={(value) => updateContent("couple.bride", value)} />
              <EditorField label="Tên chú rể" value={content.couple.groom} onChange={(value) => updateContent("couple.groom", value)} />
              <EditorField label="Tên hiển thị" value={content.couple.displayName} onChange={(value) => updateContent("couple.displayName", value)} />
              <EditorField label="Tagline" value={content.couple.tagline} onChange={(value) => updateContent("couple.tagline", value)} />
              <ImagePicker label="Hero cover image" value={content.hero.coverImage} aspect="aspect-[16/10]" onChange={(value) => updateContent("hero.coverImage", value)} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Invitation</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="Tiêu đề lời mời" value={content.invitation.title} onChange={(value) => updateContent("invitation.title", value)} />
              <EditorField label="Lời mời" value={content.invitation.message} multiline onChange={(value) => updateContent("invitation.message", value)} />
              <EditorField label="Câu kết" value={content.invitation.closing} onChange={(value) => updateContent("invitation.closing", value)} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Venue & Time</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="Ngày hiển thị" value={content.event.dateLabel} onChange={(value) => updateContent("event.dateLabel", value)} />
              <EditorField label="Venue" value={content.venue.name} onChange={(value) => updateContent("venue.name", value)} />
              <EditorField label="Khu vực" value={content.venue.area} onChange={(value) => updateContent("venue.area", value)} />
              <EditorField label="Địa chỉ" value={content.venue.address} multiline onChange={(value) => updateContent("venue.address", value)} />
              <EditorField label="Google Maps URL" value={content.venue.mapUrl} onChange={(value) => updateContent("venue.mapUrl", value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <EditorField label="Đón khách" value={content.event.welcomeTime} onChange={(value) => updateContent("event.welcomeTime", value)} />
                <EditorField label="Ceremony" value={content.event.ceremonyTime} onChange={(value) => updateContent("event.ceremonyTime", value)} />
                <EditorField label="Khai tiệc" value={content.event.dinnerTime} onChange={(value) => updateContent("event.dinnerTime", value)} />
                <EditorField label="After party" value={content.event.afterPartyTime} onChange={(value) => updateContent("event.afterPartyTime", value)} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Timeline</h2>
            <div className="mt-4 grid gap-4">
              {content.timeline.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-2xl bg-[#F8F3EA] p-4">
                  <div className="grid grid-cols-[90px_1fr] gap-3">
                    <input className={fieldClass} value={item.time} onChange={(event) => updateTimeline(index, "time", event.target.value)} />
                    <input className={fieldClass} value={item.title} onChange={(event) => updateTimeline(index, "title", event.target.value)} />
                  </div>
                  <textarea className={textareaClass} value={item.description} onChange={(event) => updateTimeline(index, "description", event.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Notes & Gallery</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="Dress code" value={content.dressCode.title} onChange={(value) => updateContent("dressCode.title", value)} />
              <EditorField label="Ghi chú dress code" value={content.dressCode.note} multiline onChange={(value) => updateContent("dressCode.note", value)} />
              <EditorField label="Ghi chú thời tiết" value={content.weatherNote.description} multiline onChange={(value) => updateContent("weatherNote.description", value)} />
              <EditorField label="Ghi chú lưu trú" value={content.accommodation.description} multiline onChange={(value) => updateContent("accommodation.description", value)} />
              <EditorField label="Deadline RSVP" value={content.rsvp.deadline} onChange={(value) => updateContent("rsvp.deadline", value)} />
              {content.gallery.map((src, index) => <ImagePicker key={index} label={`Gallery image ${index + 1}`} value={src} onChange={(value) => updateGallery(index, value)} />)}
            </div>
          </div>
        </section>

        <aside className="lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-3xl">Live preview</h2>
            <span className="rounded-full bg-[#FFFDF8] px-3 py-1 text-xs text-[#8A8178]">Draft preview</span>
          </div>
          <div className="h-[72vh] overflow-auto rounded-[2rem] border border-[#E8DDCC] bg-white shadow-2xl lg:h-full">
            <div className="origin-top scale-[0.72] sm:scale-[0.78] lg:scale-[0.68]" style={{ width: "145%" }}>
              <InvitationPage config={previewConfig} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
