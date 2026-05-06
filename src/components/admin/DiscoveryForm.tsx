import { mustHaveSectionOptions, priorityOptions, toneOptions } from "@/config/discovery-options";
import type { WeddingConfig } from "@/lib/site-settings";

const inputClass = "min-h-11 rounded-2xl border border-[#E8DDCC] bg-white px-4 text-sm outline-none focus:border-[#6B7A5A] focus:ring-4 focus:ring-[#6B7A5A]/10";
const textareaClass = `${inputClass} min-h-24 py-3`;

type Discovery = WeddingConfig["project"]["discovery"];

type DiscoveryKey = keyof Discovery;

export function DiscoveryForm({ discovery, onChange }: { discovery: Discovery; onChange: (key: DiscoveryKey, value: string | string[]) => void }) {
  function toggleMustHave(value: string) {
    const next = discovery.mustHaveSections.includes(value)
      ? discovery.mustHaveSections.filter((item) => item !== value)
      : [...discovery.mustHaveSections, value];
    onChange("mustHaveSections", next);
  }

  return (
    <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7A5A]">Guided setup</p>
          <h2 className="font-serif text-3xl">Wedding Discovery</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#8A8178]">Brief này giúp direction, checklist và các phase AI/export sau hiểu đúng gu cưới của mày.</p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
          Couple story
          <textarea className={textareaClass} value={discovery.coupleStory} onChange={(event) => onChange("coupleStory", event.target.value)} />
        </label>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-[#2E2A25]">Desired tone</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {toneOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange("desiredTone", option.value)}
                className="rounded-2xl border p-3 text-left transition hover:-translate-y-0.5"
                style={{ borderColor: discovery.desiredTone === option.value ? "#6B7A5A" : "#E8DDCC", backgroundColor: discovery.desiredTone === option.value ? "#F1F5EA" : "#FFFFFF" }}
              >
                <p className="text-sm font-bold text-[#2E2A25]">{option.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#8A8178]">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
          Guest audience
          <textarea className={textareaClass} value={discovery.guestAudience} onChange={(event) => onChange("guestAudience", event.target.value)} />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
          Cultural notes / language balance
          <textarea className={textareaClass} value={discovery.culturalNotes} onChange={(event) => onChange("culturalNotes", event.target.value)} />
        </label>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-[#2E2A25]">Must-have sections</p>
          <div className="flex flex-wrap gap-2">
            {mustHaveSectionOptions.map((option) => {
              const selected = discovery.mustHaveSections.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleMustHave(option.value)}
                  className="rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em]"
                  style={{ borderColor: selected ? "#6B7A5A" : "#D6BFA3", backgroundColor: selected ? "#6B7A5A" : "#FFFFFF", color: selected ? "#FFFFFF" : "#2E2A25" }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
          Constraints
          <textarea className={textareaClass} value={discovery.constraints} onChange={(event) => onChange("constraints", event.target.value)} />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
          Photo / moodboard notes
          <textarea className={textareaClass} value={discovery.photoMoodboardNotes} onChange={(event) => onChange("photoMoodboardNotes", event.target.value)} />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
          Print vs digital priority
          <select className={inputClass} value={discovery.printDigitalPriority} onChange={(event) => onChange("printDigitalPriority", event.target.value)}>
            {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
