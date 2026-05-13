import type { SiteVersion } from "@/lib/site-versions";

const sourceMeta = {
  manual: "Tự tạo",
  duplicate: "Nhân bản",
  restore: "Khôi phục",
  publish: "Xuất bản",
} as const;

export function VersionSnapshotsPanel({ versions, label, backend, busy, onLabelChange, onCreate, onDuplicate, onRestore, onPublish }: { versions: SiteVersion[]; label: string; backend: string; busy: boolean; onLabelChange: (value: string) => void; onCreate: () => void; onDuplicate: (version: SiteVersion) => void; onRestore: (version: SiteVersion) => void; onPublish: (version: SiteVersion) => void }) {
  return (
    <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7A5A]">Khu làm việc dự án</p>
          <h2 className="font-serif text-3xl">Bản lưu phiên bản</h2>
        </div>
        <p className="text-sm leading-6 text-[#8A8178]">Nguồn lưu: {backend}. Bản lưu giữ toàn bộ thiết lập hiện tại để khôi phục hoặc xuất bản lại khi cần.</p>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-[#E8DDCC] bg-white p-4">
        <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
          Tên bản lưu
          <input className="min-h-11 rounded-2xl border border-[#E8DDCC] bg-[#FFFDF8] px-4 text-sm outline-none focus:border-[#6B7A5A] focus:ring-4 focus:ring-[#6B7A5A]/10" value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="Ví dụ: Trước khi chốt hướng thiệp" />
        </label>
        <button type="button" disabled={busy} onClick={onCreate} className="rounded-full bg-[#6B7A5A] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:bg-[#AFA89F]">Tạo bản lưu</button>
      </div>

      <div className="mt-5 grid gap-3">
        {versions.length === 0 ? <p className="rounded-2xl bg-white p-4 text-sm text-[#8A8178]">Chưa có bản lưu nào.</p> : null}
        {versions.map((version) => (
          <div key={version.id} className="rounded-[1.25rem] border border-[#E8DDCC] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-serif text-2xl text-[#2E2A25]">{version.label}</p>
                  <span className="rounded-full bg-[#F8F3EA] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#6B7A5A]">{sourceMeta[version.source]}</span>
                  {version.publishedAt ? <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#3538CD]">Đã xuất bản</span> : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-[#8A8178]">Tạo lúc {new Date(version.createdAt).toLocaleString("vi-VN")}{version.publishedAt ? ` · Đã xuất bản ${new Date(version.publishedAt).toLocaleString("vi-VN")}` : ""}</p>
                <p className="mt-2 text-sm leading-6 text-[#8A8178]">{version.settings.content.couple.displayName} · {version.settings.content.event.dateLabel} · {version.settings.themeKey}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => onDuplicate(version)} className="rounded-full border border-[#D6BFA3] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2E2A25] disabled:opacity-60">Nhân bản</button>
                <button type="button" disabled={busy} onClick={() => onRestore(version)} className="rounded-full border border-[#D6BFA3] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2E2A25] disabled:opacity-60">Khôi phục</button>
                <button type="button" disabled={busy} onClick={() => onPublish(version)} className="rounded-full bg-[#6B7A5A] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60">Xuất bản</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
