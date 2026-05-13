import { GallerySection } from "@/components/GallerySection";
import { HeroSaveTheDate } from "@/components/HeroSaveTheDate";
import { RsvpSection } from "@/components/RsvpSection";
import { ThankYouSection } from "@/components/ThankYouSection";
import { TimelineSection } from "@/components/TimelineSection";
import { WeddingDetailsSection } from "@/components/WeddingDetailsSection";
import { previewContexts, type PreviewContext, type PreviewContextKey } from "@/config/preview-contexts";
import type { WeddingConfig } from "@/lib/site-settings";

const previewGuest = { honorific: "anh/chị", name: "khách mời" };

export function PreviewFrame({ config, selectedKey, onChange }: { config: WeddingConfig; selectedKey: PreviewContextKey; onChange: (key: PreviewContextKey) => void }) {
  const context: PreviewContext = previewContexts.find((item) => item.key === selectedKey) ?? previewContexts[0];

  return (
    <aside className="lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
      <div className="mb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-3xl">Xem thử trực tiếp</h2>
          <span className="rounded-full bg-[#FFFDF8] px-3 py-1 text-xs text-[#8A8178]">{context.label}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {previewContexts.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className="shrink-0 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em]"
              style={{ borderColor: selectedKey === item.key ? "#6B7A5A" : "#D6BFA3", backgroundColor: selectedKey === item.key ? "#6B7A5A" : "#FFFDF8", color: selectedKey === item.key ? "#FFFFFF" : "#2E2A25" }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="text-xs leading-5 text-[#8A8178]">{context.description}</p>
      </div>

      <div className="h-[72vh] overflow-auto rounded-[2rem] border border-[#252934]/10 bg-[linear-gradient(135deg,rgba(247,202,201,0.28),rgba(146,168,209,0.2))] p-4 shadow-2xl lg:h-full">
        <div className="mx-auto overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-xl" style={{ width: context.width * context.scale, height: context.height * context.scale }}>
          <div className={context.mode === "scroll" ? "overflow-y-auto" : "overflow-hidden"} style={{ width: context.width * context.scale, height: context.height * context.scale }}>
            <div style={{ width: context.width, transform: `scale(${context.scale})`, transformOrigin: "top left" }}>
              {context.targetId === "rsvp" ? (
                <>
                  <RsvpSection config={config} guestIdentity={previewGuest} />
                  <ThankYouSection config={config} guestIdentity={previewGuest} />
                </>
              ) : (
                <>
                  <HeroSaveTheDate config={config} guestIdentity={previewGuest} />
                  <WeddingDetailsSection config={config} />
                  <TimelineSection config={config} />
                  <GallerySection config={config} />
                  <RsvpSection config={config} guestIdentity={previewGuest} />
                  <ThankYouSection config={config} guestIdentity={previewGuest} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
