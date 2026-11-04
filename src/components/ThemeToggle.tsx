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

  const icon = pref === "light" ? "☀" : pref === "dark" ? "☾" : "◐";
  return (
    <button
      type="button"
      onClick={cycle}
      className="btn btn-ghost !px-3 !py-1.5 text-sm"
      aria-label={`${t("label")}: ${t(pref)}`}
      title={`${t("label")}: ${t(pref)}`}
    >
      <span aria-hidden>{icon}</span>
      <span className="hidden sm:inline">{t(pref)}</span>
    </button>
  );
}
