"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { downloadCsv, toRSVPCsv } from "@/lib/csv";
import { attendingLabel, clearRSVPResponses, readRSVPResponses, removeRSVPResponses, type RSVPResponse } from "@/lib/rsvp-storage";
import { InviteAdminPanel } from "@/components/admin/InviteAdminPanel";
import { CheckSquare, ClipboardList, Database, Download, FileSpreadsheet, Hotel, Link2, PencilRuler, Square, Trash2, UploadCloud, UsersRound } from "lucide-react";

const selectClass = "min-h-10 rounded-full border border-[#E8DDCC] bg-white px-4 py-2 text-sm outline-none transition focus:border-[#6B7A5A] focus:ring-4 focus:ring-[#6B7A5A]/12";
const primaryButtonClass = "inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5F6F4E] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#526244] disabled:cursor-not-allowed disabled:opacity-55";
const secondaryButtonClass = "inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D6BFA3] bg-[#FFFDF8] px-5 text-sm font-semibold text-[#2E2A25] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55";
const quietButtonClass = "inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E8DDCC] bg-transparent px-5 text-sm font-semibold text-[#756b60] transition hover:bg-[#FFFDF8] disabled:cursor-not-allowed disabled:opacity-55";

function mostCommon(values: Array<string | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<RSVPResponse[]>([]);
  const [backend, setBackend] = useState("local");
  const [attendingFilter, setAttendingFilter] = useState("all");
  const [accommodationFilter, setAccommodationFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selectedResponseIds, setSelectedResponseIds] = useState<Set<string>>(() => new Set());
  const [deleting, setDeleting] = useState(false);
  const [exportingWorkbook, setExportingWorkbook] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function refreshResponses() {
      const apiResponse = await fetch("/api/rsvp");

      if (apiResponse.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (apiResponse.ok) {
        const result = await apiResponse.json() as { responses: RSVPResponse[]; backend: string };
        if (result.backend === "supabase") {
          setResponses(result.responses);
          setBackend("supabase");
          return;
        }
      }

      setResponses(readRSVPResponses());
      setBackend("local");
    }

    refreshResponses();
    window.addEventListener("storage", refreshResponses);
    window.addEventListener("wedding-rsvp-updated", refreshResponses);

    return () => {
    window.removeEventListener("storage", refreshResponses);
    window.removeEventListener("wedding-rsvp-updated", refreshResponses);
  };
  }, [router]);

  const groups = useMemo(() => [...new Set(responses.map((response) => response.guestGroup).filter(Boolean))], [responses]);

  const filteredResponses = useMemo(() => {
    return responses.filter((response) => {
      if (attendingFilter !== "all" && response.attending !== attendingFilter) return false;
      if (accommodationFilter === "yes" && !response.accommodationNeeded) return false;
      if (accommodationFilter === "no" && response.accommodationNeeded) return false;
      if (groupFilter !== "all" && response.guestGroup !== groupFilter) return false;
      return true;
    });
  }, [responses, attendingFilter, accommodationFilter, groupFilter]);

  const totalGuests = responses.filter((response) => response.attending === "yes").reduce((sum, response) => sum + response.guestCount, 0);
  const notAttending = responses.filter((response) => response.attending === "no").length;
  const stayingGuests = responses.reduce((sum, response) => sum + (response.stayingGuestCount ?? response.lodgingGuests?.length ?? 0), 0);
  const accommodationRequests = responses.filter((response) => response.accommodationNeeded).length;
  const estimatedRooms = responses.reduce((sum, response) => sum + Math.ceil((response.stayingGuestCount ?? response.lodgingGuests?.length ?? 0) / 2), 0);
  const childrenStaying = responses.reduce((sum, response) => sum + response.childrenCount, 0);
  const elderlySupport = responses.filter((response) => response.elderlySupportNeeded).length;
  const allVisibleSelected = filteredResponses.length > 0 && filteredResponses.every((response) => selectedResponseIds.has(response.id));
  const selectedResponses = useMemo(() => responses.filter((response) => selectedResponseIds.has(response.id)), [responses, selectedResponseIds]);
  const selectedCount = selectedResponses.length;

  function setResponseSelection(id: string, checked: boolean) {
    setSelectedResponseIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleVisibleResponses() {
    setSelectedResponseIds((current) => {
      const visibleIds = filteredResponses.map((response) => response.id);
      const visibleSelected = visibleIds.every((id) => current.has(id));
      const next = new Set(current);
      if (visibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  async function deleteSelectedResponses() {
    if (selectedResponses.length === 0) return;
    const ids = selectedResponses.map((response) => response.id);
    if (!window.confirm(`Xóa ${ids.length} lời hồi đáp đã chọn?`)) return;

    setDeleting(true);
    setMessage("");
    setError("");

    try {
      if (backend === "supabase") {
        const apiResponse = await fetch("/api/rsvp", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        if (!apiResponse.ok) {
          const result = await apiResponse.json().catch(() => null) as { error?: string } | null;
          throw new Error(result?.error || "Không xoá được lời hồi đáp.");
        }
      } else {
        const nextResponses = removeRSVPResponses((response) => selectedResponseIds.has(response.id));
        setResponses(nextResponses);
      }

      if (backend === "supabase") {
        const selected = new Set(ids);
        setResponses((current) => current.filter((response) => !selected.has(response.id)));
      }

      setSelectedResponseIds(new Set());
      setMessage(`Đã xoá ${ids.length} lời hồi đáp.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không xoá được lời hồi đáp.");
    } finally {
      setDeleting(false);
    }
  }

  function exportCsv() {
    downloadCsv(`rsvp-responses-${new Date().toISOString().slice(0, 10)}.csv`, toRSVPCsv(filteredResponses));
  }

  async function exportRsvpWorkbook(kind: "filtered" | "lodging") {
    const date = new Date().toISOString().slice(0, 10);
    const sourceResponses = kind === "lodging"
      ? responses.filter((response) => response.accommodationNeeded)
      : filteredResponses;
    const title = kind === "lodging"
      ? "Danh sách lưu trú gửi resort/hotel"
      : "Tổng hợp lời hồi đáp theo bộ lọc hiện tại";

    if (sourceResponses.length === 0) {
      setError(kind === "lodging" ? "Chưa có khách đăng ký lưu trú để xuất Excel." : "Chưa có lời hồi đáp để xuất Excel.");
      return;
    }

    setExportingWorkbook(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/rsvp-workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: sourceResponses, title }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || "Không xuất được Excel hồi đáp.");
      }

      const filename = kind === "lodging"
        ? `danh-sach-luu-tru-resort-${date}.xlsx`
        : `tong-hop-hoi-dap-${date}.xlsx`;
      downloadBlob(filename, await response.blob());
      setMessage(kind === "lodging" ? "Đã xuất Excel lưu trú cho resort/hotel." : "Đã xuất Excel tổng hợp hồi đáp.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Không xuất được Excel hồi đáp.");
    } finally {
      setExportingWorkbook(false);
    }
  }

  function clearDemoData() {
    if (!window.confirm("Xóa toàn bộ dữ liệu hồi đáp demo trong trình duyệt này?")) return;
    clearRSVPResponses();
  }

  const backendLabel = backend === "supabase" ? "Supabase" : "Lưu cục bộ";

  return (
    <main className="min-h-screen bg-[#F8F3EA] px-5 py-8 text-[#2E2A25] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.75rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6B7A5A]">Admin điều phối</p>
              <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Khách mời, link riêng và hồi đáp</h1>
              <p className="mt-3 text-sm leading-6 text-[#665d54]">
                Nguồn dữ liệu đang dùng: <b>{backendLabel}</b>. Trang này gom đúng các việc cần làm: nạp Excel nhiều đợt, xuất link thiệp riêng, theo dõi RSVP và xuất danh sách lưu trú gửi resort/hotel.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/editor" className={primaryButtonClass}>
                <PencilRuler className="h-4 w-4" /> Mở trình sửa web
              </Link>
              <button type="button" onClick={() => void exportRsvpWorkbook("filtered")} className={secondaryButtonClass} disabled={exportingWorkbook || filteredResponses.length === 0}>
                <FileSpreadsheet className="h-4 w-4" /> Xuất Excel RSVP
              </button>
              <button type="button" onClick={() => void exportRsvpWorkbook("lodging")} className={secondaryButtonClass} disabled={exportingWorkbook || accommodationRequests === 0}>
                <Hotel className="h-4 w-4" /> Excel lưu trú
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              { icon: UploadCloud, title: "1. Tải mẫu", copy: "Lấy file Excel mẫu có dropdown, gửi cho ba mẹ hoặc người nhập danh sách." },
              { icon: FileSpreadsheet, title: "2. Nạp nhiều lần", copy: "Upload lại từng đợt khách. Khách trùng tên sẽ giữ link cũ để tránh gửi nhầm." },
              { icon: Link2, title: "3. Xuất link", copy: "Lấy file Excel chỉ gồm tên khách, quan hệ và link thiệp độc bản." },
              { icon: ClipboardList, title: "4. Theo dõi RSVP", copy: "Lọc hồi đáp, xuất Excel tổng hợp hoặc danh sách lưu trú cho resort." },
            ].map(({ icon: Icon, title, copy }) => (
              <div key={String(title)} className="rounded-[1.1rem] border border-[#E8DDCC] bg-[#FCFAF4] p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5F6F4E] text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#2E2A25]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[#756b60]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <InviteAdminPanel />

        <section className="mt-8 flex flex-col gap-4 rounded-[1.75rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6B7A5A]">Bảng hồi đáp</p>
            <h2 className="mt-2 font-serif text-4xl">Theo dõi lời hồi đáp</h2>
            <p className="mt-2 text-sm leading-6 text-[#665d54]">Bộ lọc bên dưới áp dụng cho bảng và nút xuất Excel RSVP. Nút Excel lưu trú luôn lấy các khách có đăng ký ở lại.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void exportRsvpWorkbook("filtered")} className={secondaryButtonClass} disabled={exportingWorkbook || filteredResponses.length === 0}>
              <Download className="h-4 w-4" /> Xuất Excel đang lọc
            </button>
            <button type="button" onClick={exportCsv} className={quietButtonClass} disabled={filteredResponses.length === 0}>
              <Download className="h-4 w-4" /> CSV dự phòng
            </button>
            <button type="button" onClick={clearDemoData} className={quietButtonClass}>
              <Trash2 className="h-4 w-4" /> Xóa demo local
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: UsersRound, label: "Tổng lời hồi đáp", value: responses.length, hint: "Số form khách đã gửi về" },
            { icon: CheckSquare, label: "Khách xác nhận", value: totalGuests, hint: "Tính theo tổng số người sẽ tham dự" },
            { icon: Square, label: "Không tham dự", value: notAttending, hint: "Số lời từ chối lịch sự" },
            { icon: Hotel, label: "Cần hỗ trợ lưu trú", value: accommodationRequests, hint: "Số lời hồi đáp có đăng ký ở lại" },
            { icon: Database, label: "Người ở lại", value: stayingGuests, hint: "Tổng số người cần bố trí phòng" },
            { icon: ClipboardList, label: "Số phòng ước tính", value: estimatedRooms, hint: "Tạm tính 2 người/phòng" },
            { icon: UsersRound, label: "Trẻ em cần lưu ý", value: childrenStaying, hint: "Dùng khi gửi resort/hotel" },
            { icon: UsersRound, label: "Người lớn tuổi cần hỗ trợ", value: elderlySupport, hint: "Ưu tiên sắp xếp phù hợp" },
          ].map(({ icon: Icon, label, value, hint }) => (
            <div key={String(label)} className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#756b60]">{label}</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3EEE2] text-[#5F6F4E]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 font-serif text-5xl text-[#5F6F4E]">{value}</p>
              <p className="mt-2 text-xs leading-5 text-[#8A8178]">{hint}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7A5A]">Lưu trú</p>
                <h2 className="mt-2 font-serif text-3xl">Tóm tắt để gửi resort</h2>
              </div>
              <button type="button" onClick={() => void exportRsvpWorkbook("lodging")} className={secondaryButtonClass} disabled={exportingWorkbook || accommodationRequests === 0}>
                <Hotel className="h-4 w-4" /> Xuất Excel lưu trú
              </button>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between border-b border-[#E8DDCC] pb-3"><span>Tổng người ở lại resort</span><b>{stayingGuests}</b></div>
              <div className="flex justify-between border-b border-[#E8DDCC] pb-3"><span>Check-in phổ biến</span><b>{mostCommon(responses.map((response) => response.checkInDate))}</b></div>
              <div className="flex justify-between border-b border-[#E8DDCC] pb-3"><span>Check-out phổ biến</span><b>{mostCommon(responses.map((response) => response.checkOutDate))}</b></div>
              <div className="flex justify-between border-b border-[#E8DDCC] pb-3"><span>Phòng phổ biến</span><b>{mostCommon(responses.map((response) => response.roomType))}</b></div>
              <div className="flex justify-between"><span>Người lớn tuổi cần hỗ trợ</span><b>{elderlySupport}</b></div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] shadow-sm">
              <div className="flex flex-wrap items-center gap-3 border-b border-[#E8DDCC] p-4">
                <select value={attendingFilter} onChange={(event) => setAttendingFilter(event.target.value)} className={selectClass}>
                <option value="all">Trạng thái: tất cả</option>
                <option value="yes">Đã xác nhận</option>
                <option value="no">Đã từ chối</option>
                <option value="maybe">Cần thêm thời gian</option>
              </select>
              <select value={accommodationFilter} onChange={(event) => setAccommodationFilter(event.target.value)} className={selectClass}>
                <option value="all">Lưu trú: tất cả</option>
                <option value="yes">Có hỗ trợ lưu trú</option>
                <option value="no">Không cần hỗ trợ</option>
              </select>
              <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className={selectClass}>
                <option value="all">Nhóm khách: tất cả</option>
                {groups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
              <button
                type="button"
                onClick={toggleVisibleResponses}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D6BFA3] bg-white px-4 text-sm font-semibold text-[#2E2A25]"
                disabled={filteredResponses.length === 0}
              >
                {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {allVisibleSelected ? "Bỏ chọn trang này" : "Chọn trang này"}
              </button>
              <button
                type="button"
                onClick={() => void deleteSelectedResponses()}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#9B4E5C] px-4 text-sm font-semibold text-white disabled:opacity-50"
                disabled={selectedCount === 0 || deleting}
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Đang xoá" : `Xoá đã chọn (${selectedCount})`}
              </button>
              <button
                type="button"
                onClick={() => void exportRsvpWorkbook("filtered")}
                className={secondaryButtonClass}
                disabled={exportingWorkbook || filteredResponses.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {exportingWorkbook ? "Đang xuất Excel" : "Xuất Excel đang lọc"}
              </button>
              <span className="text-sm text-[#8A8178]">Đang hiển thị {filteredResponses.length}/{responses.length} · Đã chọn {selectedCount}</span>
            </div>
            {message ? <p className="border-b border-[#E8DDCC] px-4 py-3 text-sm font-semibold text-[#6B7A5A]">{message}</p> : null}
            {error ? <p className="border-b border-[#E8DDCC] px-4 py-3 text-sm font-semibold text-[#9B4E5C]">{error}</p> : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[#F8F3EA] text-[#8A8178]">
                  <tr>
                    <th className="w-12 p-4">
                      <button type="button" onClick={toggleVisibleResponses} aria-label="Chọn tất cả lời hồi đáp trên trang hiện tại" className="inline-flex h-5 w-5 items-center justify-center text-[#6B7A5A]">
                        {allVisibleSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                      </button>
                    </th>
                    <th className="p-4">Tên khách</th><th className="p-4">Số điện thoại</th><th className="p-4">Phản hồi</th><th className="p-4">Số người</th><th className="p-4">Nhóm</th><th className="p-4">Di chuyển</th><th className="p-4">Lưu trú</th><th className="p-4">Người lưu trú</th><th className="p-4">Lưu ý</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.length === 0 ? (
                    <tr><td colSpan={10} className="p-8 text-center text-[#8A8178]">Chưa có lời hồi đáp phù hợp. Mời thử gửi một phản hồi ở /rsvp.</td></tr>
                  ) : filteredResponses.map((response) => (
                    <tr key={response.id} className={`border-t border-[#E8DDCC] align-top ${selectedResponseIds.has(response.id) ? "bg-[#F8F3EA]" : ""}`}>
                      <td className="p-4 align-top">
                        <button
                          type="button"
                          onClick={() => setResponseSelection(response.id, !selectedResponseIds.has(response.id))}
                          aria-label={`Chọn lời hồi đáp của ${response.name}`}
                          className="inline-flex h-5 w-5 items-center justify-center text-[#6B7A5A]"
                        >
                          {selectedResponseIds.has(response.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                        </button>
                      </td>
                      <td className="p-4 font-semibold">{response.name}<p className="mt-1 text-xs font-normal text-[#8A8178]">{new Date(response.submittedAt).toLocaleString("vi-VN")}</p></td>
                      <td className="p-4">{response.phone}</td>
                      <td className="p-4">{attendingLabel(response.attending)}</td>
                      <td className="p-4">{response.guestCount}</td>
                      <td className="p-4">{response.guestGroup}</td>
                      <td className="p-4">{response.transportNeeded ? "Có" : "Không"}</td>
                      <td className="p-4">{response.accommodationNeeded ? `${response.stayingGuestCount ?? response.lodgingGuests?.length ?? 0} người` : "Không"}</td>
                      <td className="p-4 max-w-[260px] text-[#665d54]">{response.accommodationNeeded ? (response.lodgingGuests?.length ? `${response.lodgingGuests.length} người lưu trú` : "Chưa có danh sách") : "Không"}</td>
                      <td className="p-4 max-w-[260px] text-[#665d54]">{response.dietaryNote || response.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
