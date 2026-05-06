"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Heart,
  Mail,
  MessageCircleHeart,
  UsersRound,
  X,
} from "lucide-react";
import { attendingLabel, saveRSVPResponse, type RSVPResponse } from "@/lib/rsvp-storage";
import { formatGuestName, resolveGuestIdentity, type GuestIdentity } from "@/lib/guest-personalization";

const rsvpSchema = z
  .object({
    honorific: z.string().optional(),
    name: z.string().min(2, "Anh/chị vui lòng cho gia đình biết họ tên để đón tiếp chính xác."),
    phone: z.string().min(8, "Anh/chị vui lòng để lại số điện thoại để concierge liên hệ khi cần."),
    attending: z.enum(["yes", "no", "maybe"]),
    guestCount: z.coerce.number().min(0),
    guestGroup: z.string().min(1, "Anh/chị vui lòng chọn nhóm khách mời."),
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
      ctx.addIssue({ code: "custom", path: ["guestCount"], message: "Nếu tham dự, số khách nên từ 1 người trở lên." });
    }

    if (data.accommodationNeeded) {
      if (!data.stayingGuestCount || data.stayingGuestCount < 1) {
        ctx.addIssue({ code: "custom", path: ["stayingGuestCount"], message: "Anh/chị vui lòng cho biết số khách lưu trú." });
      }
      if (!data.checkInDate) {
        ctx.addIssue({ code: "custom", path: ["checkInDate"], message: "Anh/chị vui lòng chọn ngày check-in dự kiến." });
      }
      if (!data.checkOutDate) {
        ctx.addIssue({ code: "custom", path: ["checkOutDate"], message: "Anh/chị vui lòng chọn ngày check-out dự kiến." });
      }
      if (data.checkInDate && data.checkOutDate && data.checkOutDate < data.checkInDate) {
        ctx.addIssue({ code: "custom", path: ["checkOutDate"], message: "Ngày check-out nên sau ngày check-in." });
      }
    }
  });

type RSVPFormInput = z.input<typeof rsvpSchema>;
type RSVPFormOutput = z.output<typeof rsvpSchema>;

const steps = [
  { key: "attendance", title: "Lời hồi đáp", eyebrow: "01" },
  { key: "guest", title: "Thông tin đón tiếp", eyebrow: "02" },
  { key: "stay", title: "Lưu trú", eyebrow: "03" },
  { key: "message", title: "Ghi chú riêng", eyebrow: "04" },
] as const;

const inputClass =
  "min-h-13 w-full rounded-2xl border border-[#252934]/12 bg-white/58 px-4 text-base text-[#252934] outline-none transition placeholder:text-[#252934]/36 focus:border-serenity focus:bg-white/78 focus:ring-4 focus:ring-serenity/18";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#252934]/68">
      {label}
      {children}
      {error ? <span className="text-xs font-bold text-[#252934]">{error}</span> : null}
    </label>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={[
        "grid h-8 w-8 place-items-center rounded-full border text-xs font-black transition",
        active ? "border-[#252934] bg-[#252934] text-white" : done ? "border-serenity bg-serenity text-[#252934]" : "border-[#252934]/14 text-[#252934]/38",
      ].join(" ")}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : label}
    </span>
  );
}

function SummaryTile({ icon: Icon, label, value }: { icon: typeof Heart; label: string; value: string | number }) {
  return (
    <div className="rounded-[1.4rem] border border-[#252934]/10 bg-white/46 p-5 text-left backdrop-blur-xl">
      <Icon className="h-5 w-5 text-serenity" />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#252934]/42">{label}</p>
      <p className="mt-3 text-lg font-semibold leading-7 text-[#252934]/76">{value}</p>
    </div>
  );
}

export default function RSVPPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<RSVPResponse | null>(null);
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity>({});
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RSVPFormInput, unknown, RSVPFormOutput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      honorific: "",
      name: "",
      phone: "",
      attending: "yes",
      guestCount: 1,
      guestGroup: "",
      dietaryNote: "",
      transportNeeded: false,
      accommodationNeeded: false,
      childrenCount: 0,
      elderlySupportNeeded: false,
      notes: "",
    },
  });

  const attending = useWatch({ control, name: "attending" });
  const guestCount = useWatch({ control, name: "guestCount" });
  const accommodationNeeded = useWatch({ control, name: "accommodationNeeded" });
  const progress = useMemo(() => `${Math.round(((step + 1) / steps.length) * 100)}%`, [step]);

  useEffect(() => {
    const guestTimer = window.setTimeout(() => {
      const identity = resolveGuestIdentity(window.location.search);
      setGuestIdentity(identity);
      if (identity.name) setValue("name", identity.name, { shouldDirty: false });
      if (identity.honorific) setValue("honorific", identity.honorific, { shouldDirty: false });
      if (identity.group) setValue("guestGroup", identity.group, { shouldDirty: false });
    }, 0);

    return () => window.clearTimeout(guestTimer);
  }, [setValue]);

  async function onSubmit(data: RSVPFormOutput) {
    const payload: Omit<RSVPResponse, "id" | "submittedAt"> = {
      name: data.name,
      phone: data.phone,
      attending: data.attending,
      guestCount: data.attending === "no" ? 0 : data.guestCount,
      guestGroup: data.guestGroup,
      dietaryNote: data.dietaryNote,
      transportNeeded: false,
      accommodationNeeded: data.accommodationNeeded,
      stayingGuestCount: data.accommodationNeeded ? data.stayingGuestCount : undefined,
      checkInDate: data.accommodationNeeded ? data.checkInDate : undefined,
      checkOutDate: data.accommodationNeeded ? data.checkOutDate : undefined,
      roomType: data.accommodationNeeded ? data.roomType : undefined,
      childrenCount: data.accommodationNeeded ? data.childrenCount : 0,
      elderlySupportNeeded: data.accommodationNeeded ? data.elderlySupportNeeded : false,
      notes: data.notes,
    };

    try {
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
    } catch {
      // Local fallback keeps RSVP usable without a backend.
    }

    setSubmitted(saveRSVPResponse(payload));
  }

  if (submitted) {
    return (
      <main className="cinematic-stage relative min-h-screen bg-[linear-gradient(135deg,rgba(247,202,201,0.42),#fffaf7_44%,rgba(146,168,209,0.36))] px-5 py-10 text-[#252934] sm:py-14">
        <div aria-hidden="true" className="aurora-wash -z-10 opacity-55" />
        <div aria-hidden="true" className="film-grain-soft -z-10" />
        <section className="mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
            <CheckCircle2 className="mx-auto h-12 w-12 text-serenity" />
            <h1 className="mt-5 font-serif text-[clamp(3rem,8vw,6.2rem)] leading-[1.04]">Cảm ơn {submitted.name}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#252934]/64">
              Phản hồi đã được ghi nhận. Wedding concierge sẽ xác nhận lại riêng nếu cần thêm thông tin về lưu trú, thực đơn hoặc hỗ trợ tại resort.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <SummaryTile icon={Heart} label="Tham dự" value={attendingLabel(submitted.attending)} />
            <SummaryTile icon={UsersRound} label="Số người" value={submitted.guestCount} />
            <SummaryTile icon={BedDouble} label="Lưu trú" value={submitted.accommodationNeeded ? "Cần thông tin lưu trú" : "Không cần hỗ trợ"} />
            <SummaryTile icon={MessageCircleHeart} label="Concierge" value="Ms. Linh · 0900 000 000" />
          </div>

          <Link
            href="/"
            className="light-sweep mt-10 inline-flex min-h-14 items-center justify-center rounded-full bg-[#252934] px-8 text-xs font-black uppercase tracking-[0.22em] text-white transition hover:-translate-y-0.5"
          >
            Về trang thiệp
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="cinematic-stage relative min-h-screen bg-[linear-gradient(135deg,rgba(247,202,201,0.4),#fffaf7_42%,rgba(146,168,209,0.36))] px-5 py-6 text-[#252934] sm:py-10">
      <div aria-hidden="true" className="aurora-wash -z-10 opacity-60" />
      <div aria-hidden="true" className="film-grain-soft -z-10" />
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#252934]/62 transition hover:text-[#252934]">
          <ArrowLeft className="h-4 w-4" /> Về trang thiệp
        </Link>

        <section className="glass-panel mt-6 overflow-hidden rounded-[2rem]">
          <div className="grid lg:grid-cols-[0.86fr_1.14fr]">
            <aside className="border-b border-[#252934]/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="text-xs font-black uppercase tracking-[0.34em] text-[#252934]/48">Private RSVP</p>
              <h1 className="mt-5 font-serif text-[clamp(3rem,7.5vw,5.8rem)] leading-[1.04]">Xác nhận lời mời</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#252934]/62">
                {formatGuestName(guestIdentity)} thân mến, phản hồi của anh/chị giúp gia đình chuẩn bị chỗ ngồi, thực đơn và thông tin lưu trú chu đáo hơn.
              </p>

              <div className="mt-8 h-2 overflow-hidden rounded-full bg-[#252934]/10 shadow-inner">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-rose-quartz to-serenity" animate={{ width: progress }} />
              </div>
              <div className="mt-5 flex gap-3">
                {steps.map((item, index) => (
                  <StepDot key={item.key} active={step === index} done={step > index} label={item.eyebrow} />
                ))}
              </div>

              <div className="mt-10 rounded-[1.4rem] border border-[#252934]/10 bg-white/46 p-5 text-sm leading-6 text-[#252934]/58">
                Mọi ghi chú riêng tư về thực đơn, người lớn tuổi, trẻ nhỏ hoặc lưu trú sẽ được wedding concierge tiếp nhận cẩn trọng.
              </div>
            </aside>

            <form onSubmit={(event) => event.preventDefault()} className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={steps[step].key}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.24 }}
                >
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-[#252934]/42">{steps[step].eyebrow}</p>
                  <h2 className="mt-3 font-serif text-4xl leading-snug sm:text-5xl">{steps[step].title}</h2>

                  {step === 0 ? (
                    <div className="mt-8 grid gap-4">
                      {[
                        { value: "yes" as const, title: "Trân trọng tham dự", text: "Gia đình rất vui được đón tiếp anh/chị trong buổi tiệc." },
                        { value: "maybe" as const, title: "Cần thêm thời gian xác nhận", text: "Concierge có thể liên hệ lại gần ngày RSVP nếu cần." },
                        { value: "no" as const, title: "Rất tiếc vắng mặt", text: "Gia đình vẫn rất trân trọng phản hồi của anh/chị." },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={[
                            "rounded-[1.4rem] border p-5 text-left shadow-[0_14px_42px_rgba(37,41,52,0.05)] transition hover:-translate-y-0.5",
                            attending === option.value ? "border-[#252934] bg-white/72" : "border-[#252934]/10 bg-white/34 hover:border-[#252934]/22",
                          ].join(" ")}
                          onClick={() => {
                            setValue("attending", option.value, { shouldDirty: true });
                            if (option.value === "no") setValue("guestCount", 0, { shouldDirty: true });
                            if (option.value !== "no" && guestCount === 0) setValue("guestCount", 1, { shouldDirty: true });
                          }}
                        >
                          <p className="text-lg font-bold text-[#252934]">{option.title}</p>
                          <p className="mt-2 text-sm leading-6 text-[#252934]/58">{option.text}</p>
                        </button>
                      ))}

                      <Field label="Số khách tham dự" error={errors.guestCount?.message}>
                        <input type="number" min={attending === "no" ? 0 : 1} className={inputClass} {...register("guestCount")} />
                      </Field>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="mt-8 grid gap-5">
                      <div className="grid gap-5 sm:grid-cols-[0.42fr_1fr]">
                        <Field label="Danh xưng">
                          <select className={inputClass} {...register("honorific")}>
                            <option value="">Chọn nếu muốn</option>
                            <option>Anh</option>
                            <option>Chị</option>
                            <option>Cô</option>
                            <option>Chú</option>
                            <option>Bác</option>
                            <option>Gia đình</option>
                          </select>
                        </Field>
                        <Field label="Tên khách mời" error={errors.name?.message}>
                          <input className={inputClass} placeholder="Ví dụ: Nguyễn Minh Anh" {...register("name")} />
                        </Field>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Số điện thoại" error={errors.phone?.message}>
                          <input className={inputClass} placeholder="Để concierge liên hệ khi cần" {...register("phone")} />
                        </Field>
                        <Field label="Nhóm khách mời" error={errors.guestGroup?.message}>
                          <select className={inputClass} {...register("guestGroup")}>
                            <option value="">Chọn nhóm</option>
                            <option>Nhà trai</option>
                            <option>Nhà gái</option>
                            <option>Bạn chú rể</option>
                            <option>Bạn cô dâu</option>
                            <option>Đồng nghiệp</option>
                            <option>Họ hàng</option>
                            <option>Khác</option>
                          </select>
                        </Field>
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="mt-8 grid gap-5">
                      <button
                        type="button"
                        className={[
                          "flex items-center justify-between gap-4 rounded-[1.4rem] border p-5 text-left shadow-[0_14px_42px_rgba(37,41,52,0.05)] transition hover:-translate-y-0.5",
                          accommodationNeeded ? "border-[#252934] bg-white/72" : "border-[#252934]/10 bg-white/34",
                        ].join(" ")}
                        onClick={() => setValue("accommodationNeeded", !accommodationNeeded, { shouldDirty: true })}
                      >
                        <span>
                          <span className="block text-lg font-bold">Mong nhận thông tin lưu trú</span>
                          <span className="mt-2 block text-sm leading-6 text-[#252934]/58">Concierge sẽ liên hệ riêng để xác nhận phòng, số khách và thời gian phù hợp.</span>
                        </span>
                        <BedDouble className="h-6 w-6 shrink-0 text-serenity" />
                      </button>

                      {accommodationNeeded ? (
                        <div className="grid gap-5 rounded-[1.4rem] border border-[#252934]/10 bg-white/34 p-5">
                          <div className="grid gap-5 sm:grid-cols-3">
                            <Field label="Số khách lưu trú" error={errors.stayingGuestCount?.message}>
                              <input type="number" min={1} className={inputClass} {...register("stayingGuestCount")} />
                            </Field>
                            <Field label="Check-in" error={errors.checkInDate?.message}>
                              <input type="date" className={inputClass} {...register("checkInDate")} />
                            </Field>
                            <Field label="Check-out" error={errors.checkOutDate?.message}>
                              <input type="date" className={inputClass} {...register("checkOutDate")} />
                            </Field>
                          </div>
                          <div className="grid gap-5 sm:grid-cols-3">
                            <Field label="Loại phòng">
                              <select className={inputClass} {...register("roomType")}>
                                <option>Không yêu cầu cụ thể</option>
                                <option>1 giường đôi</option>
                                <option>2 giường đơn</option>
                                <option>Phòng gia đình</option>
                              </select>
                            </Field>
                            <Field label="Số trẻ em">
                              <input type="number" min={0} className={inputClass} {...register("childrenCount")} />
                            </Field>
                            <label className="mt-7 flex min-h-13 items-center gap-3 rounded-2xl border border-[#252934]/10 bg-white/44 px-4 text-sm font-bold text-[#252934]/68">
                              <input type="checkbox" {...register("elderlySupportNeeded")} />
                              Có người lớn tuổi cần hỗ trợ
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[1.4rem] border border-[#252934]/10 bg-white/34 p-5 text-sm leading-6 text-[#252934]/58">
                          Anh/chị có thể bỏ qua bước này nếu đã tự sắp xếp lưu trú.
                        </div>
                      )}
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="mt-8 grid gap-5">
                      <Field label="Ghi chú thực đơn" error={errors.dietaryNote?.message}>
                        <textarea
                          className={`${inputClass} min-h-28 py-4`}
                          placeholder="Ăn chay, dị ứng, kiêng món, không dùng rượu/cồn, hoặc cần suất trẻ em nếu có."
                          {...register("dietaryNote")}
                        />
                      </Field>
                      <Field label="Lời chúc hoặc ghi chú riêng">
                        <textarea
                          className={`${inputClass} min-h-32 py-4`}
                          placeholder="Yêu cầu chỗ ngồi, hỗ trợ người lớn tuổi/trẻ nhỏ, hoặc lời chúc gửi đến cô dâu chú rể."
                          {...register("notes")}
                        />
                      </Field>
                      <div className="flex items-start gap-3 rounded-[1.4rem] border border-[#252934]/10 bg-white/34 p-5 text-sm leading-6 text-[#252934]/58">
                        <CircleHelp className="mt-1 h-5 w-5 shrink-0 text-serenity" />
                        Những ghi chú này chỉ dùng để gia đình và wedding concierge chuẩn bị đón tiếp anh/chị chu đáo hơn.
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#252934]/12 px-6 text-xs font-black uppercase tracking-[0.2em] text-[#252934]/58 transition hover:border-[#252934]/28 hover:text-[#252934] disabled:opacity-30"
                  disabled={step === 0}
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                >
                  <X className="mr-2 h-4 w-4" /> Quay lại
                </button>

                {step < steps.length - 1 ? (
                  <motion.button
                    type="button"
                    className="light-sweep inline-flex min-h-12 items-center justify-center rounded-full bg-[#252934] px-7 text-xs font-black uppercase tracking-[0.2em] text-white"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                  >
                    Tiếp tục <ChevronRight className="ml-2 h-4 w-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    disabled={isSubmitting}
                    className="light-sweep inline-flex min-h-12 items-center justify-center rounded-full bg-[#252934] px-7 text-xs font-black uppercase tracking-[0.2em] text-white disabled:opacity-60"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => void handleSubmit(onSubmit)()}
                  >
                    <Mail className="mr-2 h-4 w-4" /> {isSubmitting ? "Đang gửi..." : "Gửi xác nhận"}
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
