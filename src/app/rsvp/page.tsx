"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { saveRSVPResponse, type RSVPResponse } from "@/lib/rsvp-storage";

const rsvpSchema = z
  .object({
    name: z.string().min(2, "Nhập họ tên giúp tụi mình nha"),
    phone: z.string().min(8, "Số điện thoại chưa đúng"),
    attending: z.enum(["yes", "no", "maybe"]),
    guestCount: z.coerce.number().min(0),
    guestGroup: z.string().min(1, "Chọn nhóm khách"),
    dietaryNote: z.string().optional(),
    transportNeeded: z.boolean().default(false),
    accommodationNeeded: z.boolean().default(false),
    stayingGuestCount: z.coerce.number().optional(),
    checkInDate: z.string().optional(),
    checkOutDate: z.string().optional(),
    roomType: z.string().optional(),
    childrenCount: z.coerce.number().min(0).default(0),
    elderlySupportNeeded: z.boolean().default(false),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.attending !== "no" && data.guestCount < 1) {
      ctx.addIssue({ code: "custom", path: ["guestCount"], message: "Nếu tham dự, số người phải từ 1 trở lên" });
    }
    if (data.accommodationNeeded) {
      if (!data.stayingGuestCount || data.stayingGuestCount < 1) ctx.addIssue({ code: "custom", path: ["stayingGuestCount"], message: "Nhập số người ở lại" });
      if (!data.checkInDate) ctx.addIssue({ code: "custom", path: ["checkInDate"], message: "Chọn ngày check-in" });
      if (!data.checkOutDate) ctx.addIssue({ code: "custom", path: ["checkOutDate"], message: "Chọn ngày check-out" });
      if (data.checkInDate && data.checkOutDate && data.checkOutDate < data.checkInDate) {
        ctx.addIssue({ code: "custom", path: ["checkOutDate"], message: "Check-out phải sau check-in" });
      }
    }
  });

type RSVPFormInput = z.input<typeof rsvpSchema>;
type RSVPFormOutput = z.output<typeof rsvpSchema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#2E2A25]">
      {label}
      {children}
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </label>
  );
}

const inputClass = "min-h-12 rounded-2xl border border-[#E8DDCC] bg-white px-4 text-base outline-none transition focus:border-[#6B7A5A] focus:ring-4 focus:ring-[#6B7A5A]/10";

export default function RSVPPage() {
  const [submitted, setSubmitted] = useState<RSVPFormOutput | null>(null);
  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RSVPFormInput, unknown, RSVPFormOutput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      attending: "yes",
      guestCount: 1,
      guestGroup: "",
      transportNeeded: false,
      accommodationNeeded: false,
      childrenCount: 0,
      elderlySupportNeeded: false,
    },
  });

  const accommodationNeeded = useWatch({ control, name: "accommodationNeeded" });

  async function onSubmit(data: RSVPFormOutput) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const payload = {
      name: data.name,
      phone: data.phone,
      attending: data.attending,
      guestCount: data.guestCount,
      guestGroup: data.guestGroup,
      dietaryNote: data.dietaryNote,
      transportNeeded: data.transportNeeded,
      accommodationNeeded: data.accommodationNeeded,
      stayingGuestCount: data.accommodationNeeded ? data.stayingGuestCount : undefined,
      checkInDate: data.accommodationNeeded ? data.checkInDate : undefined,
      checkOutDate: data.accommodationNeeded ? data.checkOutDate : undefined,
      roomType: data.accommodationNeeded ? data.roomType : undefined,
      childrenCount: data.accommodationNeeded ? data.childrenCount : 0,
      elderlySupportNeeded: data.accommodationNeeded ? data.elderlySupportNeeded : false,
      notes: data.accommodationNeeded ? data.notes : undefined,
    };

    const apiResponse = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (apiResponse.ok) {
      const result = await apiResponse.json() as { response: RSVPResponse };
      setSubmitted(result.response);
      return;
    }

    const saved = saveRSVPResponse(payload);
    setSubmitted(saved);
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F8F3EA] px-5 py-10 text-[#2E2A25]">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[#E8DDCC] bg-[#FFFDF8] p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#6B7A5A]" />
          <h1 className="mt-5 font-serif text-5xl">Cảm ơn bạn</h1>
          <p className="mt-4 leading-7 text-[#665d54]">Phản hồi RSVP demo của bạn đã được ghi nhận. Bản production sẽ lưu dữ liệu này vào Supabase.</p>
          <div className="mt-7 rounded-3xl bg-[#F8F3EA] p-5 text-left text-sm leading-7">
            <p><b>Họ tên:</b> {submitted.name}</p>
            <p><b>Tham dự:</b> {submitted.attending}</p>
            <p><b>Số người:</b> {submitted.guestCount}</p>
            <p><b>Cần phòng:</b> {submitted.accommodationNeeded ? "Có" : "Không"}</p>
          </div>
          <Link href="/" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#6B7A5A] px-7 text-sm font-semibold text-white">Về trang thiệp</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F3EA] px-5 py-8 text-[#2E2A25] sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-[#6B7A5A]">← Quay lại thiệp cưới</Link>
        <div className="mt-6 rounded-[2rem] border border-[#E8DDCC] bg-[#FFFDF8] p-6 shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6B7A5A]">RSVP</p>
          <h1 className="mt-3 font-serif text-5xl">Xác nhận tham dự</h1>
          <p className="mt-4 leading-7 text-[#665d54]">Cho tụi mình biết bạn có thể tham dự và có cần hỗ trợ lưu trú tại resort không nha.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Họ tên" error={errors.name?.message}><input className={inputClass} {...register("name")} /></Field>
              <Field label="Số điện thoại" error={errors.phone?.message}><input className={inputClass} {...register("phone")} /></Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Trạng thái tham dự"><select className={inputClass} {...register("attending")}><option value="yes">Có</option><option value="no">Không</option><option value="maybe">Chưa chắc</option></select></Field>
              <Field label="Số người" error={errors.guestCount?.message}><input type="number" className={inputClass} {...register("guestCount")} /></Field>
              <Field label="Nhóm khách" error={errors.guestGroup?.message}><select className={inputClass} {...register("guestGroup")}><option value="">Chọn nhóm</option><option>Nhà trai</option><option>Nhà gái</option><option>Bạn chú rể</option><option>Bạn cô dâu</option><option>Đồng nghiệp</option><option>Họ hàng</option><option>Khác</option></select></Field>
            </div>

            <Field label="Ghi chú ăn chay / dị ứng"><textarea className={`${inputClass} min-h-24 py-3`} {...register("dietaryNote")} /></Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-[#E8DDCC] bg-[#F8F3EA] p-4 text-sm font-medium"><input type="checkbox" {...register("transportNeeded")} /> Cần hỗ trợ di chuyển</label>
              <label className="flex items-center gap-3 rounded-2xl border border-[#E8DDCC] bg-[#F8F3EA] p-4 text-sm font-medium"><input type="checkbox" {...register("accommodationNeeded")} /> Cần hỗ trợ đặt phòng resort</label>
            </div>

            {accommodationNeeded ? (
              <div className="grid gap-5 rounded-[1.5rem] border border-[#D6BFA3] bg-[#F8F3EA] p-5">
                <h2 className="font-serif text-3xl">Thông tin lưu trú</h2>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Số người ở lại" error={errors.stayingGuestCount?.message}><input type="number" className={inputClass} {...register("stayingGuestCount")} /></Field>
                  <Field label="Check-in" error={errors.checkInDate?.message}><input type="date" className={inputClass} {...register("checkInDate")} /></Field>
                  <Field label="Check-out" error={errors.checkOutDate?.message}><input type="date" className={inputClass} {...register("checkOutDate")} /></Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Loại phòng"><select className={inputClass} {...register("roomType")}><option>Không yêu cầu cụ thể</option><option>1 giường đôi</option><option>2 giường đơn</option><option>Phòng gia đình</option></select></Field>
                  <Field label="Số trẻ em"><input type="number" className={inputClass} {...register("childrenCount")} /></Field>
                  <label className="mt-7 flex items-center gap-3 rounded-2xl border border-[#E8DDCC] bg-white p-4 text-sm font-medium"><input type="checkbox" {...register("elderlySupportNeeded")} /> Có người lớn tuổi cần hỗ trợ</label>
                </div>
                <Field label="Ghi chú lưu trú"><textarea className={`${inputClass} min-h-24 py-3`} {...register("notes")} /></Field>
              </div>
            ) : null}

            <button disabled={isSubmitting} className="min-h-13 rounded-full bg-[#6B7A5A] px-7 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(107,122,90,0.22)] transition hover:-translate-y-0.5 disabled:opacity-60">
              {isSubmitting ? "Đang gửi..." : "Gửi RSVP"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
