/**
 * Business details shown across the site.
 *
 * Everything marked PLACEHOLDER must be replaced with the real details
 * before going live. This is the only file that holds them.
 */
export const business = {
  /** PLACEHOLDER: shop name shown in the header, footer and emails. */
  name: "Your Print Shop",
  /** PLACEHOLDER: short tagline under the name. */
  tagline: "Printing & design, done right",
  /** PLACEHOLDER: phone number shown to customers (display format). */
  phoneDisplay: "+91 90000 00000",
  /** PLACEHOLDER: phone number in E.164 digits for tel: links. */
  phoneE164: "+919000000000",
  /**
   * PLACEHOLDER: WhatsApp number, digits only with country code, no "+".
   * Used for the "Chat on WhatsApp" (wa.me) button.
   */
  whatsappNumber: "919000000000",
  /** PLACEHOLDER: public email address shown to customers. */
  email: "orders@example.com",
  /** PLACEHOLDER: shop address, one line per entry. */
  addressLines: ["Shop No. 0, Main Road", "Your City, State 000000"],
  /** PLACEHOLDER: opening hours. */
  hours: "Mon–Sat, 9:30 AM – 8:30 PM",
  /** PLACEHOLDER: Google Maps link to the shop, or empty to hide. */
  mapUrl: "",
  /** PLACEHOLDER: short prefix for ticket numbers, e.g. "SPS" gives SPS-261104-7K3Q. */
  ticketPrefix: "SPS",
} as const;

/** Upload limits agreed for the order form. */
export const uploadLimits = {
  /** Maximum total size of all files in one order, in bytes (50 MB). */
  maxTotalBytes: 50 * 1024 * 1024,
  /** Maximum number of files in one order. */
  maxFiles: 20,
} as const;

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${business.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
