"use client";

/* eslint-disable @next/next/no-img-element */

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
type MediaSectionKey = keyof WeddingConfig["appearance"]["mediaLayers"];
type MediaLayer = WeddingConfig["appearance"]["mediaLayers"]["hero"][number] & {
  type: "image" | "video";
  animation: "none" | "slowZoom" | "float" | "fade";
};
type MediaLayerPatch = Partial<Omit<MediaLayer, "scale" | "objectPosition">> & {
  scale?: Partial<MediaLayer["scale"]>;
  objectPosition?: Partial<MediaLayer["objectPosition"]>;
};

const mediaSectionLabels: Record<MediaSectionKey, string> = {
  hero: "Hero",
  invitation: "Invitation",
  itinerary: "Venue & Time",
  timeline: "Timeline",
  venue: "Venue",
  dressCode: "Dress Code",
  guestNotes: "Guest Notes",
  gallery: "Gallery",
  cta: "RSVP CTA",
};

const mediaSectionKeys = Object.keys(mediaSectionLabels) as MediaSectionKey[];

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

function EditorCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[#E8DDCC] bg-[#FDFBF7] px-4 py-3 text-sm font-medium text-[#2E2A25]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

const backgroundOptions = [
  { value: "cream", label: "Cream" },
  { value: "plain", label: "Plain" },
  { value: "softGradient", label: "Soft gradient" },
  { value: "accentGradient", label: "Accent gradient" },
  { value: "card", label: "Card" },
  { value: "primaryGradient", label: "Primary gradient" },
];

function BackgroundSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
      {label}
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {backgroundOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function MediaPicker({ label, type, value, onChange, aspect = "aspect-[4/5]" }: { label: string; type: "image" | "video"; value: string; onChange: (value: string) => void; aspect?: string }) {
  async function pickMedia(file: File | undefined) {
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
          Chọn media
          <input type="file" accept={type === "video" ? "video/*" : "image/*"} className="hidden" onChange={(event) => pickMedia(event.target.files?.[0])} />
        </label>
      </div>
      <div className={`relative overflow-hidden rounded-2xl border border-white bg-white shadow-sm ${aspect}`}>
        {value && type === "video" ? <video src={value} controls muted playsInline className="h-full w-full object-cover" /> : null}
        {value && type === "image" ? <img src={value} alt={label} className="h-full w-full object-cover" /> : null}
        {!value ? <div className="flex h-full items-center justify-center text-sm text-[#8A8178]">Chưa có media</div> : null}
      </div>
      <input className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Hoặc dán URL/path media" />
      <p className="text-xs leading-5 text-[#8A8178]">Video data URL có thể rất nặng và vượt giới hạn localStorage/demo API. Video lớn nên dùng hosted URL.</p>
    </div>
  );
}

function ImagePicker({ label, value, onChange, aspect = "aspect-[4/5]" }: { label: string; value: string; onChange: (value: string) => void; aspect?: string }) {
  return <MediaPicker label={label} type="image" value={value} onChange={onChange} aspect={aspect} />;
}

function MediaLayersEditor({ section, layers, onAdd, onUpdate, onRemove, onMove }: { section: MediaSectionKey; layers: WeddingConfig["appearance"]["mediaLayers"][MediaSectionKey]; onAdd: (section: MediaSectionKey) => void; onUpdate: (section: MediaSectionKey, index: number, patch: MediaLayerPatch) => void; onRemove: (section: MediaSectionKey, index: number) => void; onMove: (section: MediaSectionKey, index: number, direction: -1 | 1) => void }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[#E8DDCC] bg-[#FDFBF7] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#2E2A25]">{mediaSectionLabels[section]} media layers</p>
        <button type="button" onClick={() => onAdd(section)} className="rounded-full bg-[#6B7A5A] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">Thêm layer</button>
      </div>
      {layers.length === 0 ? <p className="text-xs leading-5 text-[#8A8178]">Chưa có layer. Section vẫn dùng background màu/gradient bên dưới.</p> : null}
      {layers.map((rawLayer, index) => {
        const layer = rawLayer as MediaLayer;

        return (
        <div key={layer.id} className="grid gap-4 rounded-2xl border border-[#E8DDCC] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-serif text-2xl">Layer {index + 1}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onMove(section, index, -1)} className="rounded-full border border-[#D6BFA3] px-3 py-1 text-xs font-semibold">Up</button>
              <button type="button" onClick={() => onMove(section, index, 1)} className="rounded-full border border-[#D6BFA3] px-3 py-1 text-xs font-semibold">Down</button>
              <button type="button" onClick={() => onRemove(section, index)} className="rounded-full border border-[#D6BFA3] px-3 py-1 text-xs font-semibold text-red-700">Xóa</button>
            </div>
          </div>
          <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
            Loại media
            <select className={fieldClass} value={layer.type} onChange={(event) => onUpdate(section, index, { type: event.target.value as MediaLayer["type"] })}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>
          <MediaPicker label="Desktop source" type={layer.type} value={layer.src} aspect="aspect-[16/9]" onChange={(value) => onUpdate(section, index, { src: value })} />
          <MediaPicker label="Mobile source" type={layer.type} value={layer.mobileSrc} aspect="aspect-[4/5]" onChange={(value) => onUpdate(section, index, { mobileSrc: value })} />
          <EditorField label="Alt text" value={layer.alt} onChange={(value) => onUpdate(section, index, { alt: value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <EditorField label="Opacity 0-1" value={String(layer.opacity)} onChange={(value) => onUpdate(section, index, { opacity: Number(value) })} />
            <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
              Animation
              <select className={fieldClass} value={layer.animation} onChange={(event) => onUpdate(section, index, { animation: event.target.value as MediaLayer["animation"] })}>
                <option value="none">None</option>
                <option value="slowZoom">Slow zoom</option>
                <option value="float">Float</option>
                <option value="fade">Fade</option>
              </select>
            </label>
            <EditorField label="Desktop scale" value={String(layer.scale.desktop)} onChange={(value) => onUpdate(section, index, { scale: { desktop: Number(value) } })} />
            <EditorField label="Mobile scale" value={String(layer.scale.mobile)} onChange={(value) => onUpdate(section, index, { scale: { mobile: Number(value) } })} />
            <EditorField label="Desktop object position" value={layer.objectPosition.desktop} onChange={(value) => onUpdate(section, index, { objectPosition: { desktop: value } })} />
            <EditorField label="Mobile object position" value={layer.objectPosition.mobile} onChange={(value) => onUpdate(section, index, { objectPosition: { mobile: value } })} />
          </div>
        </div>
        );
      })}
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

  function updateContent(path: string, value: string | boolean) {
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

  function updateItineraryItem(index: number, key: "label" | "description", value: string) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      content.sections.itinerary.items[index] = { ...content.sections.itinerary.items[index], [key]: value };
      return { ...current, content };
    });
  }

  function updateDressColor(index: number, value: string) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      content.dressCode.colors[index] = value;
      return { ...current, content };
    });
  }

  function addMediaLayer(section: MediaSectionKey) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const layers = content.appearance.mediaLayers[section] as MediaLayer[];
      layers.push({
        id: crypto.randomUUID(),
        type: "image",
        src: "",
        mobileSrc: "",
        alt: mediaSectionLabels[section],
        opacity: 0.55,
        scale: { desktop: 1, mobile: 1 },
        objectPosition: { desktop: "center center", mobile: "center center" },
        animation: "slowZoom",
      });
      return { ...current, content };
    });
  }

  function updateMediaLayer(section: MediaSectionKey, index: number, patch: MediaLayerPatch) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const layers = content.appearance.mediaLayers[section] as MediaLayer[];
      const layer = layers[index];
      layers[index] = {
        ...layer,
        ...patch,
        scale: { ...layer.scale, ...patch.scale },
        objectPosition: { ...layer.objectPosition, ...patch.objectPosition },
      };
      return { ...current, content };
    });
  }

  function removeMediaLayer(section: MediaSectionKey, index: number) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const layers = content.appearance.mediaLayers[section] as MediaLayer[];
      layers.splice(index, 1);
      return { ...current, content };
    });
  }

  function moveMediaLayer(section: MediaSectionKey, index: number, direction: -1 | 1) {
    setSaved(false);
    setPublished(false);
    setSettings((current) => {
      if (!current) return current;
      const content = structuredClone(current.content);
      const layers = content.appearance.mediaLayers[section] as MediaLayer[];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= layers.length) return current;
      [layers[index], layers[nextIndex]] = [layers[nextIndex], layers[index]];
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
              <EditorField label="Hero eyebrow" value={content.sections.hero.eyebrow} onChange={(value) => updateContent("sections.hero.eyebrow", value)} />
              <EditorField label="Hero location line" value={content.sections.hero.locationLine} onChange={(value) => updateContent("sections.hero.locationLine", value)} />
              <EditorField label="Hero image alt" value={content.sections.hero.imageAlt} onChange={(value) => updateContent("sections.hero.imageAlt", value)} />
              <EditorCheckbox label="Hiện mũi tên scroll" checked={content.sections.hero.showScrollCue} onChange={(value) => updateContent("sections.hero.showScrollCue", value)} />
              <ImagePicker label="Hero cover image" value={content.hero.coverImage} aspect="aspect-[16/10]" onChange={(value) => updateContent("hero.coverImage", value)} />
              <ImagePicker label="Hero mobile cover image" value={content.hero.mobileCoverImage} aspect="aspect-[4/5]" onChange={(value) => updateContent("hero.mobileCoverImage", value)} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Invitation</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="Eyebrow lời mời" value={content.sections.invitation.eyebrow} onChange={(value) => updateContent("sections.invitation.eyebrow", value)} />
              <EditorField label="Tiêu đề lời mời" value={content.invitation.title} onChange={(value) => updateContent("invitation.title", value)} />
              <EditorField label="Lời mời" value={content.invitation.message} multiline onChange={(value) => updateContent("invitation.message", value)} />
              <EditorField label="Câu kết" value={content.invitation.closing} onChange={(value) => updateContent("invitation.closing", value)} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Itinerary Section</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="Eyebrow" value={content.sections.itinerary.eyebrow} onChange={(value) => updateContent("sections.itinerary.eyebrow", value)} />
              <EditorField label="Tiêu đề" value={content.sections.itinerary.title} onChange={(value) => updateContent("sections.itinerary.title", value)} />
              <EditorField label="Mô tả" value={content.sections.itinerary.description} multiline onChange={(value) => updateContent("sections.itinerary.description", value)} />
              <EditorField label="Card eyebrow" value={content.sections.itinerary.cardEyebrow} onChange={(value) => updateContent("sections.itinerary.cardEyebrow", value)} />
              <EditorField label="Card description" value={content.sections.itinerary.cardDescription} onChange={(value) => updateContent("sections.itinerary.cardDescription", value)} />
              {content.sections.itinerary.items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-2xl bg-[#F8F3EA] p-4">
                  <input className={fieldClass} value={item.label} onChange={(event) => updateItineraryItem(index, "label", event.target.value)} />
                  <textarea className={textareaClass} value={item.description} onChange={(event) => updateItineraryItem(index, "description", event.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Venue & Time</h2>
            <div className="mt-4 grid gap-4">
              <BackgroundSelect label="Venue section background" value={content.appearance.backgrounds.venue} onChange={(value) => updateContent("appearance.backgrounds.venue", value)} />
              <MediaLayersEditor section="venue" layers={content.appearance.mediaLayers.venue} onAdd={addMediaLayer} onUpdate={updateMediaLayer} onRemove={removeMediaLayer} onMove={moveMediaLayer} />
              <EditorField label="Ngày hiển thị" value={content.event.dateLabel} onChange={(value) => updateContent("event.dateLabel", value)} />
              <EditorField label="Venue" value={content.venue.name} onChange={(value) => updateContent("venue.name", value)} />
              <EditorField label="Khu vực" value={content.venue.area} onChange={(value) => updateContent("venue.area", value)} />
              <EditorField label="Vị trí" value={content.venue.location} onChange={(value) => updateContent("venue.location", value)} />
              <EditorField label="Địa chỉ" value={content.venue.address} multiline onChange={(value) => updateContent("venue.address", value)} />
              <EditorField label="Ghi chú venue" value={content.venue.note} multiline onChange={(value) => updateContent("venue.note", value)} />
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
              <EditorField label="Timeline eyebrow" value={content.sections.timeline.eyebrow} onChange={(value) => updateContent("sections.timeline.eyebrow", value)} />
              <EditorField label="Timeline title" value={content.sections.timeline.title} onChange={(value) => updateContent("sections.timeline.title", value)} />
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
            <h2 className="font-serif text-3xl">Venue Section Copy</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="Venue eyebrow" value={content.sections.venue.eyebrow} onChange={(value) => updateContent("sections.venue.eyebrow", value)} />
              <EditorField label="Venue section description" value={content.sections.venue.description} multiline onChange={(value) => updateContent("sections.venue.description", value)} />
              <EditorField label="Visual eyebrow" value={content.sections.venue.visualEyebrow} onChange={(value) => updateContent("sections.venue.visualEyebrow", value)} />
              <EditorField label="Visual title" value={content.sections.venue.visualTitle} onChange={(value) => updateContent("sections.venue.visualTitle", value)} />
              <EditorField label="Details eyebrow" value={content.sections.venue.detailEyebrow} onChange={(value) => updateContent("sections.venue.detailEyebrow", value)} />
              <EditorField label="Area label" value={content.sections.venue.areaLabel} onChange={(value) => updateContent("sections.venue.areaLabel", value)} />
              <EditorField label="Location label" value={content.sections.venue.locationLabel} onChange={(value) => updateContent("sections.venue.locationLabel", value)} />
              <EditorField label="Map button label" value={content.sections.venue.mapButtonLabel} onChange={(value) => updateContent("sections.venue.mapButtonLabel", value)} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Notes & Gallery</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="Dress code eyebrow" value={content.sections.dressCode.eyebrow} onChange={(value) => updateContent("sections.dressCode.eyebrow", value)} />
              <EditorField label="Dress code" value={content.dressCode.title} onChange={(value) => updateContent("dressCode.title", value)} />
              <EditorField label="Ghi chú dress code" value={content.dressCode.note} multiline onChange={(value) => updateContent("dressCode.note", value)} />
              <div className="grid gap-3 sm:grid-cols-5">
                {content.dressCode.colors.map((color, index) => <input key={index} className={fieldClass} value={color} onChange={(event) => updateDressColor(index, event.target.value)} />)}
              </div>
              <EditorField label="Guest notes eyebrow" value={content.sections.guestNotes.eyebrow} onChange={(value) => updateContent("sections.guestNotes.eyebrow", value)} />
              <EditorField label="Guest notes title" value={content.sections.guestNotes.title} onChange={(value) => updateContent("sections.guestNotes.title", value)} />
              <EditorField label="Guest notes description" value={content.sections.guestNotes.description} multiline onChange={(value) => updateContent("sections.guestNotes.description", value)} />
              <EditorField label="Weather card eyebrow" value={content.sections.guestNotes.weatherEyebrow} onChange={(value) => updateContent("sections.guestNotes.weatherEyebrow", value)} />
              <EditorField label="Weather title" value={content.weatherNote.title} onChange={(value) => updateContent("weatherNote.title", value)} />
              <EditorField label="Ghi chú thời tiết" value={content.weatherNote.description} multiline onChange={(value) => updateContent("weatherNote.description", value)} />
              <EditorField label="Accommodation card eyebrow" value={content.sections.guestNotes.accommodationEyebrow} onChange={(value) => updateContent("sections.guestNotes.accommodationEyebrow", value)} />
              <EditorField label="Accommodation title" value={content.accommodation.title} onChange={(value) => updateContent("accommodation.title", value)} />
              <EditorField label="Ghi chú lưu trú" value={content.accommodation.description} multiline onChange={(value) => updateContent("accommodation.description", value)} />
              <EditorField label="RSVP deadline prefix" value={content.sections.guestNotes.rsvpDeadlinePrefix} onChange={(value) => updateContent("sections.guestNotes.rsvpDeadlinePrefix", value)} />
              <EditorField label="Deadline RSVP" value={content.rsvp.deadline} onChange={(value) => updateContent("rsvp.deadline", value)} />
              <EditorField label="Gallery eyebrow" value={content.sections.gallery.eyebrow} onChange={(value) => updateContent("sections.gallery.eyebrow", value)} />
              <EditorField label="Gallery title" value={content.sections.gallery.title} onChange={(value) => updateContent("sections.gallery.title", value)} />
              <EditorField label="Gallery description" value={content.sections.gallery.description} multiline onChange={(value) => updateContent("sections.gallery.description", value)} />
              <EditorField label="Gallery item label" value={content.sections.gallery.itemLabel} onChange={(value) => updateContent("sections.gallery.itemLabel", value)} />
              <EditorField label="Gallery alt prefix" value={content.sections.gallery.imageAltPrefix} onChange={(value) => updateContent("sections.gallery.imageAltPrefix", value)} />
              {content.gallery.map((src, index) => <ImagePicker key={index} label={`Gallery image ${index + 1}`} value={src} onChange={(value) => updateGallery(index, value)} />)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">Section Background Media</h2>
            <p className="mt-2 text-sm leading-6 text-[#8A8178]">Mỗi section có thể có nhiều layer ảnh/video chồng lên nhau. Layer đầu nằm phía sau, layer cuối nằm phía trước.</p>
            <div className="mt-4 grid gap-5">
              {mediaSectionKeys.map((section) => (
                <div key={section} className="grid gap-3 rounded-[1.25rem] border border-[#E8DDCC] bg-[#FFFDF8] p-4">
                  {section !== "venue" ? <BackgroundSelect label={`${mediaSectionLabels[section]} background`} value={content.appearance.backgrounds[section]} onChange={(value) => updateContent(`appearance.backgrounds.${section}`, value)} /> : null}
                  <MediaLayersEditor section={section} layers={content.appearance.mediaLayers[section]} onAdd={addMediaLayer} onUpdate={updateMediaLayer} onRemove={removeMediaLayer} onMove={moveMediaLayer} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
            <h2 className="font-serif text-3xl">CTA & Backgrounds</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="CTA eyebrow" value={content.sections.cta.eyebrow} onChange={(value) => updateContent("sections.cta.eyebrow", value)} />
              <EditorField label="CTA title" value={content.sections.cta.title} onChange={(value) => updateContent("sections.cta.title", value)} />
              <EditorField label="CTA description" value={content.sections.cta.description} multiline onChange={(value) => updateContent("sections.cta.description", value)} />
              <EditorField label="CTA button label" value={content.sections.cta.buttonLabel} onChange={(value) => updateContent("sections.cta.buttonLabel", value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <BackgroundSelect label="Page background" value={content.appearance.backgrounds.page} onChange={(value) => updateContent("appearance.backgrounds.page", value)} />
                <BackgroundSelect label="Hero background" value={content.appearance.backgrounds.hero} onChange={(value) => updateContent("appearance.backgrounds.hero", value)} />
                <BackgroundSelect label="Invitation background" value={content.appearance.backgrounds.invitation} onChange={(value) => updateContent("appearance.backgrounds.invitation", value)} />
                <BackgroundSelect label="Itinerary background" value={content.appearance.backgrounds.itinerary} onChange={(value) => updateContent("appearance.backgrounds.itinerary", value)} />
                <BackgroundSelect label="Timeline background" value={content.appearance.backgrounds.timeline} onChange={(value) => updateContent("appearance.backgrounds.timeline", value)} />
                <BackgroundSelect label="Venue background" value={content.appearance.backgrounds.venue} onChange={(value) => updateContent("appearance.backgrounds.venue", value)} />
                <BackgroundSelect label="Dress background" value={content.appearance.backgrounds.dressCode} onChange={(value) => updateContent("appearance.backgrounds.dressCode", value)} />
                <BackgroundSelect label="Guest notes background" value={content.appearance.backgrounds.guestNotes} onChange={(value) => updateContent("appearance.backgrounds.guestNotes", value)} />
                <BackgroundSelect label="Gallery background" value={content.appearance.backgrounds.gallery} onChange={(value) => updateContent("appearance.backgrounds.gallery", value)} />
                <BackgroundSelect label="CTA background" value={content.appearance.backgrounds.cta} onChange={(value) => updateContent("appearance.backgrounds.cta", value)} />
              </div>
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
