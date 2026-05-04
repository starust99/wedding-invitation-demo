"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { downloadCsv, toRSVPCsv } from "@/lib/csv";
import { attendingLabel, clearRSVPResponses, readRSVPResponses, type RSVPResponse } from "@/lib/rsvp-storage";

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
  const stayingGuests = responses.reduce((sum, response) => sum + (response.stayingGuestCount ?? 0), 0);
  const accommodationRequests = responses.filter((response) => response.accommodationNeeded).length;
  const estimatedRooms = responses.reduce((sum, response) => sum + Math.ceil((response.stayingGuestCount ?? 0) / 2), 0);
  const childrenStaying = responses.reduce((sum, response) => sum + response.childrenCount, 0);
  const elderlySupport = responses.filter((response) => response.elderlySupportNeeded).length;

  function exportCsv() {
    downloadCsv(`rsvp-responses-${new Date().toISOString().slice(0, 10)}.csv`, toRSVPCsv(filteredResponses));
  }

  function clearDemoData() {
    if (!window.confirm("Xóa toàn bộ RSVP demo trong browser này?")) return;
    clearRSVPResponses();
  }

  return (
    <main className="min-h-screen bg-[#F8F3EA] px-5 py-8 text-[#2E2A25] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6B7A5A]">Admin Demo</p>
            <h1 className="mt-3 font-serif text-5xl">RSVP Dashboard</h1>
            <p className="mt-3 text-[#665d54]">Dashboard đang dùng backend: <b>{backend}</b>. Nếu Supabase chưa config, app tự fallback về localStorage demo.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/editor" className="inline-flex min-h-12 items-center rounded-full bg-[#6B7A5A] px-6 text-sm font-semibold text-white">Edit invitation</Link>
            <button onClick={exportCsv} className="min-h-12 rounded-full border border-[#D6BFA3] bg-[#FFFDF8] px-6 text-sm font-semibold">Export CSV</button>
            <button onClick={clearDemoData} className="min-h-12 rounded-full border border-[#E8DDCC] bg-transparent px-6 text-sm font-semibold text-[#8A8178]">Clear demo data</button>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Tổng response", responses.length],
            ["Khách tham dự", totalGuests],
            ["Không tham dự", notAttending],
            ["Chưa chắc", maybe],
            ["Cần phòng resort", accommodationRequests],
            ["Người ở lại resort", stayingGuests],
            ["Estimated rooms", estimatedRooms],
            ["Trẻ em / hỗ trợ", `${childrenStaying} / ${elderlySupport}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-6 shadow-sm">
              <p className="text-sm text-[#8A8178]">{label}</p>
              <p className="mt-3 font-serif text-5xl text-[#6B7A5A]">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.5rem] border border-[#E8DDCC] bg-[#FFFDF8] p-6 shadow-sm">
            <h2 className="font-serif text-3xl">Accommodation summary</h2>
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
                <option value="yes">Có</option>
                <option value="no">Không</option>
                <option value="maybe">Chưa chắc</option>
              </select>
              <select value={accommodationFilter} onChange={(event) => setAccommodationFilter(event.target.value)} className={selectClass}>
                <option value="all">Lưu trú: tất cả</option>
                <option value="yes">Cần phòng</option>
                <option value="no">Không cần phòng</option>
              </select>
              <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className={selectClass}>
                <option value="all">Nhóm khách: tất cả</option>
                {groups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
              <span className="text-sm text-[#8A8178]">Đang hiển thị {filteredResponses.length}/{responses.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[#F8F3EA] text-[#8A8178]">
                  <tr>
                    <th className="p-4">Tên</th><th className="p-4">Phone</th><th className="p-4">Tham dự</th><th className="p-4">Số người</th><th className="p-4">Nhóm</th><th className="p-4">Di chuyển</th><th className="p-4">Lưu trú</th><th className="p-4">Ngày</th><th className="p-4">Phòng</th><th className="p-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.length === 0 ? (
                    <tr><td colSpan={10} className="p-8 text-center text-[#8A8178]">Chưa có RSVP phù hợp. Vào /rsvp submit thử một phản hồi nha.</td></tr>
                  ) : filteredResponses.map((response) => (
                    <tr key={response.id} className="border-t border-[#E8DDCC] align-top">
                      <td className="p-4 font-semibold">{response.name}<p className="mt-1 text-xs font-normal text-[#8A8178]">{new Date(response.submittedAt).toLocaleString("vi-VN")}</p></td>
                      <td className="p-4">{response.phone}</td>
                      <td className="p-4">{attendingLabel(response.attending)}</td>
                      <td className="p-4">{response.guestCount}</td>
                      <td className="p-4">{response.guestGroup}</td>
                      <td className="p-4">{response.transportNeeded ? "Có" : "Không"}</td>
                      <td className="p-4">{response.accommodationNeeded ? `${response.stayingGuestCount ?? 0} người` : "Không"}</td>
                      <td className="p-4">{response.checkInDate && response.checkOutDate ? `${response.checkInDate} → ${response.checkOutDate}` : ""}</td>
                      <td className="p-4">{response.roomType}</td>
                      <td className="p-4 max-w-[220px] text-[#665d54]">{response.dietaryNote || response.notes}</td>
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
