import type { ArtifactRecipeKey } from "@/config/artifact-recipes";
import type { ArtifactSummary } from "@/lib/artifact-generator";

const statusMeta = {
  draft: { label: "Draft", bg: "#F2F4F7", color: "#475467" },
  ready: { label: "Ready", bg: "#F3FAEF", color: "#426038" },
  exported: { label: "Exported", bg: "#EEF4FF", color: "#3538CD" },
} as const;

export function ArtifactRecipesPanel({ artifacts, onToggle, onGenerate }: { artifacts: ArtifactSummary[]; onToggle: (key: ArtifactRecipeKey, enabled: boolean) => void; onGenerate: (key: ArtifactRecipeKey) => void }) {
  const enabledCount = artifacts.filter((artifact) => artifact.enabled).length;

  return (
    <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7A5A]">Artifact recipes</p>
          <h2 className="font-serif text-3xl">Invitation Artifact Suite</h2>
        </div>
        <p className="text-sm leading-6 text-[#8A8178]">{enabledCount}/{artifacts.length} recipe đang bật. Phase này lưu metadata trước, export thật để phase sau.</p>
      </div>

      <div className="mt-5 grid gap-3">
        {artifacts.map((artifact) => {
          const meta = statusMeta[artifact.status];
          return (
            <div key={artifact.key} className="rounded-[1.25rem] border border-[#E8DDCC] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-2xl text-[#2E2A25]">{artifact.name}</p>
                    <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#8A8178]">{artifact.description}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7A5A]">{artifact.output}</p>
                </div>
                <label className="flex shrink-0 items-center gap-2 rounded-full border border-[#D6BFA3] bg-[#FFFDF8] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2E2A25]">
                  <input type="checkbox" checked={artifact.enabled} onChange={(event) => onToggle(artifact.key, event.target.checked)} />
                  Enable
                </label>
              </div>

              <div className="mt-3 grid gap-2 text-xs leading-5 text-[#6F6860] sm:grid-cols-2">
                <p><span className="font-bold text-[#2E2A25]">Best for:</span> {artifact.recommendedFor.join(", ")}</p>
                <p><span className="font-bold text-[#2E2A25]">Needs:</span> {artifact.dependencies.join(", ")}</p>
              </div>

              {artifact.readiness.length > 0 ? (
                <div className="mt-3 rounded-2xl bg-[#FFF7E6] p-3 text-xs leading-5 text-[#B54708]">
                  {artifact.readiness.map((item) => <p key={item}>{item}</p>)}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#8A8178]">{artifact.lastGeneratedAt ? `Generated: ${new Date(artifact.lastGeneratedAt).toLocaleString("vi-VN")}` : "Chưa generate metadata trong draft này."}</p>
                <button type="button" onClick={() => onGenerate(artifact.key)} className="rounded-full bg-[#6B7A5A] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">Generate metadata</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
