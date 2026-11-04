import "server-only";
import { getService } from "@/lib/catalog";
import { getTemplate } from "@/lib/templates";
import type { Ticket } from "@/lib/tickets";
import { translatorFor } from "../messages";

/** Ticket details as labelled rows in English, for the shop's notifications. */
export function summaryRows(t: Ticket): [string, string][] {
  const tr = translatorFor("en");
  const service = getService(t.order.service);
  const serviceName = service ? tr(`catalog.services.${service.id}.name`) : `Other: ${t.order.otherService ?? ""}`;
  const rows: [string, string][] = [["Service", serviceName]];
  if (service) {
    for (const g of service.groups) {
      const picked = t.order.options[g.id];
      if (picked?.length) rows.push([tr(`catalog.groups.${g.id}`), picked.map((o) => tr(`catalog.options.${o}`)).join(", ")]);
    }
  }
  rows.push(["Quantity", t.order.quantity]);
  if (t.order.size) rows.push(["Size", t.order.size]);
  if (t.order.deadline) rows.push(["Needed by", t.order.deadline]);
  if (t.order.colours) rows.push(["Colours", t.order.colours]);
  if (t.design) {
    const tpl = getTemplate(t.design.templateId);
    rows.push(["Studio design", tpl ? `${tr(`templates.names.${tpl.id}`)} (${tr(`templates.palettes.${t.design.paletteId}`)})` : t.design.templateId]);
  }
  return rows;
}

export function customerRows(t: Ticket): [string, string][] {
  const rows: [string, string][] = [
    ["Name", t.customer.name],
    ["Phone", t.customer.phone],
  ];
  rows.push(["WhatsApp", t.customer.whatsappSame ? "Same as phone" : t.customer.whatsapp || "—"]);
  if (t.customer.email) rows.push(["Email", t.customer.email]);
  rows.push(["Prefers", { call: "Phone call", whatsapp: "WhatsApp", email: "Email" }[t.customer.preferred]]);
  rows.push(["Site language", t.locale]);
  return rows;
}
