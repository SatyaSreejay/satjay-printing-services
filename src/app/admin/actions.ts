"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ticketStatuses, type TicketStatus } from "@/lib/tickets";
import { endSession, passwordMatches, requireAdmin, startSession } from "@/lib/server/adminAuth";
import { checkLimits, MINUTE } from "@/lib/server/rateLimit";
import { getTicket, saveTicket } from "@/lib/server/ticketStore";
import { sendStatusEmail } from "@/lib/server/notify/statusEmail";

export async function login(_prev: { error?: string } | undefined, form: FormData) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "unknown";
  if (!(await checkLimits(ip, [{ name: "admin-login", max: 5, windowMs: 15 * MINUTE }]))) {
    return { error: "Too many attempts. Wait 15 minutes and try again." };
  }
  if (!passwordMatches(String(form.get("password") ?? ""))) return { error: "Wrong password." };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function updateStatus(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as TicketStatus;
  const note = String(form.get("note") ?? "").trim().slice(0, 500);
  const notify = form.get("notify") === "on";
  if (!ticketStatuses.includes(status)) return;
  const t = await getTicket(id);
  if (!t) return;
  const at = new Date().toISOString();
  t.status = status;
  t.history.push({ status, at, note: note || undefined });
  if (notify && t.customer.email) {
    const r = await sendStatusEmail(t, note);
    t.notifications.push({ ...r, at });
  }
  await saveTicket(t);
  revalidatePath(`/admin/tickets/${id}`);
  revalidatePath("/admin");
}

export async function addNote(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const text = String(form.get("text") ?? "").trim().slice(0, 2000);
  if (!text) return;
  const t = await getTicket(id);
  if (!t) return;
  t.notes.push({ at: new Date().toISOString(), text });
  await saveTicket(t);
  revalidatePath(`/admin/tickets/${id}`);
}
