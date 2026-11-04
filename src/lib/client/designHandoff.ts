"use client";

import type { DesignSnapshot } from "@/lib/templates";

const KEY = "sps-design";

export interface DesignHandoff {
  snapshot: DesignSnapshot;
  /** Logo the customer added in the studio, as a data URL. */
  logo?: string;
}

/** Pass a studio design to the order form (same browser tab session). */
export function saveDesign(h: DesignHandoff) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(h));
    return true;
  } catch {
    // Logo too large for storage: keep the design without it.
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ snapshot: h.snapshot }));
      return true;
    } catch {
      return false;
    }
  }
}

export function loadDesign(): DesignHandoff | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DesignHandoff) : null;
  } catch {
    return null;
  }
}

export function clearDesign() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
