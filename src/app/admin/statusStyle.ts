import type { TicketStatus } from "@/lib/tickets";

export const statusLabel: Record<TicketStatus, string> = {
  received: "Received",
  reviewing: "Reviewing",
  quoted: "Quote sent",
  designing: "Designing",
  awaitingApproval: "Awaiting approval",
  printing: "Printing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function statusClass(s: TicketStatus) {
  if (s === "received") return "notice-err";
  if (s === "delivered" || s === "ready") return "notice-ok";
  if (s === "cancelled") return "bg-surface-2 text-muted";
  return "notice-warn";
}
