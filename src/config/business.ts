/**
 * Business details shown across the site. This is the only file that holds
 * them; anything marked PLACEHOLDER still needs the real value.
 */
export const business = {
  /** Business name shown in the header, footer and emails (confirm spelling). */
  name: "Satjay Printing Services",
  /** Short tagline under the name. */
  tagline: "Printing & design, done right",
  /** Phone number shown to customers (display format). */
  phoneDisplay: "+91 87906 03022",
  /** Phone number in E.164 format for tel: links. */
  phoneE164: "+918790603022",
  /**
   * WhatsApp number, digits only with country code, no "+".
   * Used for the "Chat on WhatsApp" (wa.me) button.
   */
  whatsappNumber: "918790603022",
  /** Public email address shown to customers. */
  email: "bestbards@gmail.com",
  /**
   * Address lines shown in the footer. Empty on purpose: the business runs
   * from home, so no address is published. Add lines here to show one.
   */
  addressLines: [] as string[],
  /** Working hours shown in the footer, or empty to hide. */
  hours: "",
  /** Google Maps link, or empty to hide. */
  mapUrl: "",
  /** Short prefix for ticket numbers, e.g. "SPS" gives SPS-261104-7K3Q. */
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
