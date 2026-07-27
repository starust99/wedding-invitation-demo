"use client";

import { InviteAdminPanel } from "@/components/admin/InviteAdminPanel";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#F8F3EA] px-4 py-8 text-[#2E2A25] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <InviteAdminPanel />
      </div>
    </main>
  );
}
