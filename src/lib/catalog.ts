/**
 * The services the shop offers and the choices a customer can make for each.
 * Only ids live here; every label is translated in messages/*.json under
 * "catalog". To add an option, add its id here and its label in en.json
 * (plus te.json and hi.json).
 */

export type GroupId = "style" | "material" | "method" | "finish" | "size" | "binding" | "format" | "output";

export interface OptionGroup {
  id: GroupId;
  /** Option ids; labels are catalog.options.<id> in the messages files. */
  options: string[];
  /** Customer may pick more than one (e.g. finishes). */
  multiple?: boolean;
}

export interface Service {
  id: ServiceId;
  icon: string;
  groups: OptionGroup[];
}

export const serviceIds = [
  "banner",
  "tshirt",
  "visitingCard",
  "letterhead",
  "book",
  "dtp",
  "menuCard",
] as const;
export type ServiceId = (typeof serviceIds)[number];

export const services: Service[] = [
  {
    id: "banner",
    icon: "🪧",
    groups: [
      { id: "style", options: ["promo", "festival", "shopSign", "announcement", "minimal"] },
      { id: "material", options: ["starFlex", "frontlitFlex", "backlitFlex", "vinyl", "oneWayVision", "clothBanner", "sunboard"] },
      { id: "size", options: ["ft3x2", "ft4x3", "ft6x3", "ft8x4", "ft10x5", "custom"] },
      { id: "finish", options: ["eyelets", "pipeFrame", "standee", "noFinish"], multiple: true },
    ],
  },
  {
    id: "tshirt",
    icon: "👕",
    groups: [
      { id: "style", options: ["logoPrint", "textQuote", "photoPrint", "teamEvent", "allOver"] },
      { id: "material", options: ["cottonRound", "cottonPolo", "dryFit", "hoodie"] },
      { id: "method", options: ["screenPrint", "dtf", "sublimation", "vinylTransfer"] },
      { id: "size", options: ["kids", "xs", "s", "m", "l", "xl", "xxl"], multiple: true },
    ],
  },
  {
    id: "visitingCard",
    icon: "📇",
    groups: [
      { id: "style", options: ["classic", "modernMinimal", "boldColour", "premium"] },
      { id: "material", options: ["artCard300", "matt350", "textured", "pvcCard", "kraft"] },
      { id: "finish", options: ["mattLam", "glossLam", "velvetLam", "spotUv", "foil", "roundCorners"], multiple: true },
      { id: "format", options: ["singleSide", "doubleSide"] },
    ],
  },
  {
    id: "letterhead",
    icon: "📄",
    groups: [
      { id: "style", options: ["corporate", "minimal", "traditional"] },
      { id: "material", options: ["maplitho70", "bond90", "executive100"] },
      { id: "size", options: ["a4", "letter"] },
      { id: "format", options: ["printOnly", "withEnvelopes"] },
    ],
  },
  {
    id: "book",
    icon: "📚",
    groups: [
      { id: "style", options: ["projectReport", "bookNovel", "recordBook", "catalogue", "magazine"] },
      { id: "binding", options: ["spiral", "wiro", "perfect", "hardBound", "saddleStitch"] },
      { id: "material", options: ["paper70", "paper80", "artPaper"] },
      { id: "method", options: ["bw", "colour", "mixedPrint"] },
      { id: "size", options: ["a4", "a5", "custom"] },
    ],
  },
  {
    id: "dtp",
    icon: "🖋️",
    groups: [
      { id: "style", options: ["flyer", "brochure", "invitation", "poster", "certificate", "typingLayout"] },
      { id: "output", options: ["printReady", "digitalOnly", "both"] },
    ],
  },
  {
    id: "menuCard",
    icon: "🍽️",
    groups: [
      { id: "style", options: ["restaurantClassic", "cafeModern", "traditionalSweets", "takeaway"] },
      { id: "material", options: ["card300Lam", "sunboard", "waterproofPvc", "laminatedSheet"] },
      { id: "format", options: ["singleSheet", "biFold", "triFold", "booklet", "tableTent"] },
    ],
  },
];

export function getService(id: string | null | undefined): Service | undefined {
  return services.find((s) => s.id === id);
}

/** Every valid option id for a service's group, for server-side validation. */
export function isValidOption(serviceId: string, groupId: string, optionId: string) {
  const group = getService(serviceId)?.groups.find((g) => g.id === groupId);
  return !!group?.options.includes(optionId);
}
