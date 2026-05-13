import { aiTweakOptions, describeAiPatch, type AiTweakKey, type AiTweakSuggestion } from "@/lib/ai-tweak-schema";
import type { WeddingConfig } from "@/lib/site-settings";

export function AiTweaksPanel({ content, suggestion, loading, error, onRequest, onAccept, onReject }: { content: WeddingConfig; suggestion: AiTweakSuggestion | null; loading: boolean; error: string; onRequest: (key: AiTweakKey) => void; onAccept: () => void; onReject: () => void }) {
  const changes = suggestion ? describeAiPatch(content, suggestion.patch) : [];

  return (
    <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7A5A]">Tinh chỉnh AI có kiểm soát</p>
          <h2 className="font-serif text-3xl">Gợi ý vá JSON an toàn</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#8A8178]">Không cho AI sửa trực tiếp React hay code. Panel này chỉ nhận thay đổi trong các trường cho phép và chỉ áp dụng sau khi anh/chị duyệt.</p>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {aiTweakOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onRequest(option.key)}
            disabled={loading}
            className="rounded-2xl border border-[#E8DDCC] bg-white p-3 text-left transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            <p className="text-sm font-bold text-[#2E2A25]">{option.label}</p>
            <p className="mt-1 text-xs leading-5 text-[#8A8178]">{option.description}</p>
          </button>
        ))}
      </div>

      {error ? <div className="mt-4 rounded-2xl bg-[#FFF1F0] p-3 text-sm text-[#B42318]">{error}</div> : null}

      {suggestion ? (
        <div className="mt-5 rounded-[1.25rem] border border-[#D6BFA3] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B7A5A]">Gợi ý chỉnh</p>
              <h3 className="mt-1 font-serif text-2xl text-[#2E2A25]">{suggestion.label}</h3>
              <p className="mt-1 text-sm leading-6 text-[#8A8178]">{suggestion.summary}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onReject} className="rounded-full border border-[#D6BFA3] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2E2A25]">Từ chối</button>
              <button type="button" onClick={onAccept} className="rounded-full bg-[#6B7A5A] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">Chấp nhận</button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {changes.map((change) => (
              <div key={change.path} className="rounded-2xl bg-[#F8F3EA] p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B7A5A]">{change.path}</p>
                <div className="mt-2 grid gap-2 text-xs leading-5 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="font-bold text-[#8A8178]">Trước</p>
                    <p className="mt-1 break-words text-[#2E2A25]">{JSON.stringify(change.before)}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="font-bold text-[#6B7A5A]">Sau</p>
                    <p className="mt-1 break-words text-[#2E2A25]">{JSON.stringify(change.after)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
