import { visualDirections, type VisualDirection } from "@/config/design-directions";

const intensityLabels: Record<VisualDirection["animationIntensity"], string> = {
  soft: "Nhẹ",
  balanced: "Vừa",
  cinematic: "Điện ảnh",
};

const floralLabels: Record<VisualDirection["floralDensity"], string> = {
  minimal: "Ít",
  balanced: "Vừa",
  lush: "Dày",
};

export function VisualDirectionPicker({ selectedKey, onSelect }: { selectedKey: string; onSelect: (direction: VisualDirection) => void }) {
  return (
    <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7A5A]">Hướng sáng tạo</p>
          <h2 className="font-serif text-3xl">Chọn hướng hình ảnh</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#8A8178]">Chọn hướng sẽ áp dụng patch có kiểm soát: theme, background, palette và một ít gợi ý câu chữ.</p>
      </div>

      <div className="mt-5 grid gap-3">
        {visualDirections.map((direction) => {
          const selected = selectedKey === direction.key;
          return (
            <button
              key={direction.key}
              type="button"
              onClick={() => onSelect(direction)}
              className="rounded-[1.25rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: selected ? "#6B7A5A" : "#E8DDCC", backgroundColor: selected ? "#F1F5EA" : "#FFFFFF" }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-serif text-2xl text-[#2E2A25]">{direction.name}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#6B7A5A]">{direction.tagline}</p>
                  <p className="mt-2 text-sm leading-6 text-[#8A8178]">{direction.description}</p>
                </div>
                <div className="flex min-w-28 gap-1">
                  {direction.dressCodePalette.map((color) => <span key={color} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-[#6F6860] sm:grid-cols-3">
                <p><span className="font-bold text-[#2E2A25]">Giọng:</span> {direction.copyTone}</p>
                <p><span className="font-bold text-[#2E2A25]">Chuyển động:</span> {intensityLabels[direction.animationIntensity]}</p>
                <p><span className="font-bold text-[#2E2A25]">Hoa lá:</span> {floralLabels[direction.floralDensity]}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {direction.mediaSuggestions.map((suggestion) => (
                  <span key={suggestion} className="rounded-full bg-[#F8F3EA] px-3 py-1 text-xs text-[#8A8178]">{suggestion}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
