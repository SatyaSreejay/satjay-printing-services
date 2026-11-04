"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Pref = "system" | "light" | "dark";
const order: Pref[] = ["system", "light", "dark"];

function apply(pref: Pref) {
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.themePref = pref;
}

export function ThemeToggle() {
  const t = useTranslations("theme");
  const [pref, setPref] = useState<Pref>("system");

  useEffect(() => {
    let stored: Pref = "system";
    try {
      const v = localStorage.getItem("theme");
      if (v === "light" || v === "dark" || v === "system") stored = v;
    } catch {}
    setPref(stored);
  }, []);

  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  function cycle() {
    const next = order[(order.indexOf(pref) + 1) % order.length];
    setPref(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    apply(next);
  }

  const icon =
    pref === "light" ? (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    ) : pref === "dark" ? (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
    ) : (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" /></svg>
    );
  return (
    <button
      type="button"
      onClick={cycle}
      className="btn btn-ghost !px-3 !py-1.5 text-sm"
      aria-label={`${t("label")}: ${t(pref)}`}
      title={`${t("label")}: ${t(pref)}`}
    >
      <span aria-hidden className="inline-flex">{icon}</span>
      <span className="hidden sm:inline">{t(pref)}</span>
    </button>
  );
}
