import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/server/adminAuth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <section className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Shop admin</h1>
      {adminConfigured() ? (
        <LoginForm />
      ) : (
        <p className="notice notice-warn mt-6">
          Admin is switched off. Set <code>ADMIN_PASSWORD</code> (at least 8 characters) in the server environment to enable it.
        </p>
      )}
    </section>
  );
}
