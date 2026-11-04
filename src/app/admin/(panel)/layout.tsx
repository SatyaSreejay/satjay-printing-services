import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/server/adminAuth";
import { logout } from "../actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-xl font-bold">Order tickets</Link>
        <form action={logout}><button className="btn btn-ghost !py-1.5 text-sm">Sign out</button></form>
      </div>
      {children}
    </div>
  );
}
