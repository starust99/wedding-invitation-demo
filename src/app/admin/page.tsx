"use client";

import { InviteAdminPanel } from "@/components/admin/InviteAdminPanel";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#F8F3EA] px-3 py-4 text-[#2E2A25] sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[90rem]">
        <InviteAdminPanel />
      </div>
    </main>
  );
}
