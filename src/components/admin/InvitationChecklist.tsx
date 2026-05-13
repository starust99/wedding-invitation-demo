import type { InvitationIssue } from "@/lib/invitation-lint";

const severityMeta = {
  P0_BLOCKER: { label: "Chặn", color: "#B42318", bg: "#FFF1F0" },
  P1_WARNING: { label: "Cảnh báo", color: "#B54708", bg: "#FFF7E6" },
  P2_POLISH: { label: "Tinh chỉnh", color: "#475467", bg: "#F2F4F7" },
} as const;

export function InvitationChecklist({ issues }: { issues: InvitationIssue[] }) {
  const blockerCount = issues.filter((issue) => issue.severity === "P0_BLOCKER").length;
  const warningCount = issues.filter((issue) => issue.severity === "P1_WARNING").length;
  const polishCount = issues.filter((issue) => issue.severity === "P2_POLISH").length;

  return (
    <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7A5A]">Kiểm tra trước khi xuất bản</p>
          <h2 className="font-serif text-3xl">Danh sách kiểm tra thiệp</h2>
          <p className="mt-2 text-sm leading-6 text-[#8A8178]">Kiểm tra trước khi gửi khách thật: thông tin, hồi đáp, ảnh, khả năng đọc và độ chỉn chu.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
          <span className="rounded-full bg-[#FFF1F0] px-3 py-1 text-[#B42318]">{blockerCount} chặn</span>
          <span className="rounded-full bg-[#FFF7E6] px-3 py-1 text-[#B54708]">{warningCount} cảnh báo</span>
          <span className="rounded-full bg-[#F2F4F7] px-3 py-1 text-[#475467]">{polishCount} tinh chỉnh</span>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-[#C9DFC1] bg-[#F3FAEF] p-4 text-sm font-semibold text-[#426038]">Checklist sạch. Có thể xuất bản bản này.</div>
      ) : (
        <div className="mt-4 grid gap-3">
          {issues.map((issue) => {
            const meta = severityMeta[issue.severity];
            return (
              <div key={issue.id} className="rounded-2xl border border-[#E8DDCC] bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                  <span className="rounded-full bg-[#F8F3EA] px-3 py-1 text-xs text-[#8A8178]">{issue.target}</span>
                </div>
                <p className="mt-3 text-sm font-bold text-[#2E2A25]">{issue.title}</p>
                <p className="mt-1 text-sm leading-6 text-[#8A8178]">{issue.detail}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
