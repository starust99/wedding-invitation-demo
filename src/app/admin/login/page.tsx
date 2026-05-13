"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null;
      setError(result?.error || "Sai password admin");
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F3EA] px-5 text-[#2E2A25]">
      <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] border border-[#E8DDCC] bg-[#FFFDF8] p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6B7A5A]">Admin</p>
        <h1 className="mt-3 font-serif text-5xl">Đăng nhập</h1>
        <p className="mt-3 text-sm leading-6 text-[#8A8178]">Production cần ADMIN_PASSWORD. Local dev mặc định dùng demo-admin nếu chưa đặt biến môi trường.</p>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-6 min-h-12 w-full rounded-2xl border border-[#E8DDCC] bg-white px-4 outline-none focus:border-[#6B7A5A]" placeholder="Admin password" />
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <button disabled={loading} className="mt-5 min-h-12 w-full rounded-full bg-[#6B7A5A] px-6 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Đang vào..." : "Vào admin"}</button>
      </form>
    </main>
  );
}
