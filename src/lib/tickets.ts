/** Ticket shapes shared by the server, admin pages and tracking page. */
import type { DesignSnapshot } from "./templates/types";

export const ticketStatuses = [
  "received",
  "reviewing",
  "quoted",
  "designing",
  "awaitingApproval",
  "printing",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

export const contactMethods = ["call", "whatsapp", "email"] as const;
export type ContactMethod = (typeof contactMethods)[number];

export interface TicketFile {
  key: string;
  name: string;
  size: number;
  type: string;
}

export interface Ticket {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: TicketStatus;
  history: { status: TicketStatus; at: string; note?: string }[];
  locale: string;
  customer: {
    name: string;
    phone: string;
    whatsappSame: boolean;
    whatsapp?: string;
    email?: string;
    preferred: ContactMethod;
  };
  order: {
    service: string;
    /** Other service described in words when "other" is chosen. */
    otherService?: string;
    options: Record<string, string[]>;
    quantity: string;
    size?: string;
    deadline?: string;
    colours?: string;
    text: string;
    instructions?: string;
  };
  design?: DesignSnapshot & { logoKey?: string };
  files: TicketFile[];
  /** sha256 of the current tracking token (used to look the ticket up). */
  trackingHash: string;
  /** Random value the tracking token is derived from (see ticketStore). */
  trackingNonce: string;
  /** Internal notes from the shop (never shown to customers). */
  notes: { at: string; text: string }[];
  notifications: { channel: string; ok: boolean; at: string; detail?: string }[];
}

/** What the customer sees on the tracking page. */
export interface PublicTicket {
  id: string;
  createdAt: string;
  status: TicketStatus;
  history: { status: TicketStatus; at: string; note?: string }[];
  service: string;
  otherService?: string;
  quantity: string;
  files: { name: string; size: number }[];
  hasDesign: boolean;
}

export function toPublic(t: Ticket): PublicTicket {
  return {
    id: t.id,
    createdAt: t.createdAt,
    status: t.status,
    history: t.history,
    service: t.order.service,
    otherService: t.order.otherService,
    quantity: t.order.quantity,
    files: t.files.map((f) => ({ name: f.name, size: f.size })),
    hasDesign: !!t.design,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
