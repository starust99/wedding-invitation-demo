"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { downloadCsv, toRSVPCsv } from "@/lib/csv";
import { attendingLabel, clearRSVPResponses, readRSVPResponses, removeRSVPResponses, type RSVPResponse } from "@/lib/rsvp-storage";
import { InviteAdminPanel } from "@/components/admin/InviteAdminPanel";
import { CheckSquare, Square, Trash2 } from "lucide-react";

const selectClass = "rounded-full border border-[#E8DDCC] bg-white px-4 py-2 text-sm outline-none focus:border-[#6B7A5A]";

function mostCommon(values: Array<string | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
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
  const maybe = responses.filter((response) => response.attending === "maybe").length;
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

  function clearDemoData() {
    if (!window.confirm("Xóa toàn bộ dữ liệu hồi đáp demo trong trình duyệt này?")) return;
    clearRSVPResponses();
  }

  const backendLabel = backend === "supabase" ? "Supabase" : "Lưu cục bộ";

  return (
    <main className="min-h-screen bg-[#F8F3EA] px-5 py-8 text-[#2E2A25] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6B7A5A]">Quản trị</p>
            <h1 className="mt-3 font-serif text-5xl">Khách mời & lời hồi đáp</h1>
            <p className="mt-3 text-[#665d54]">Nguồn dữ liệu đang dùng: <b>{backendLabel}</b>. Nhập danh sách khách, tạo link riêng, theo dõi lời hồi đáp và album theo cùng một nơi.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/editor" className="inline-flex min-h-12 items-center rounded-full bg-[#6B7A5A] px-6 text-sm font-semibold text-white">Mở trình sửa</Link>
            <button onClick={exportCsv} className="min-h-12 rounded-full border border-[#D6BFA3] bg-[#FFFDF8] px-6 text-sm font-semibold">Xuất CSV</button>
            <button onClick={clearDemoData} className="min-h-12 rounded-full border border-[#E8DDCC] bg-transparent px-6 text-sm font-semibold text-[#8A8178]">Xóa dữ liệu demo</button>
          </div>
        </div>

        <InviteAdminPanel />

        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6B7A5A]">Bảng hồi đáp</p>
          <h2 className="mt-2 font-serif text-4xl">Theo dõi lời hồi đáp</h2>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Tổng lời hồi đáp", responses.length],
            ["Khách xác nhận", totalGuests],
            ["Không tham dự", notAttending],
            ["Chưa chốt", maybe],
            ["Cần hỗ trợ lưu trú", accommodationRequests],
            ["Người ở lại", stayingGuests],
            ["Số phòng ước tính", estimatedRooms],
            ["Trẻ em / người lớn tuổi cần lưu ý", `${childrenStaying} / ${elderlySupport}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-6 shadow-sm">
              <p className="text-sm text-[#8A8178]">{label}</p>
              <p className="mt-3 font-serif text-5xl text-[#6B7A5A]">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-6 shadow-sm">
            <h2 className="font-serif text-3xl">Tóm tắt lưu trú</h2>
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
