"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function TrackForm() {
  const t = useTranslations("track");
  const router = useRouter();
  const [ticketId, setTicketId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, phone }),
      });
      if (res.status === 429) return setError(t("rateLimited"));
      if (!res.ok) return setError(t("notFound"));
      const { url } = (await res.json()) as { url: string };
      router.push(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-8 space-y-4 p-5 sm:p-6">
      <div>
        <label className="field-label" htmlFor="tr-id">{t("ticket")}</label>
        <input id="tr-id" className="input uppercase" required maxLength={30} value={ticketId} onChange={(e) => setTicketId(e.target.value)} />
        <p className="field-hint">{t("ticketHint")}</p>
      </div>
      <div>
        <label className="field-label" htmlFor="tr-phone">{t("phone")}</label>
        <input id="tr-phone" type="tel" inputMode="tel" className="input" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <p className="field-hint">{t("newLink")}</p>
      {error && <p className="notice notice-err" role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>{t("submit")}</button>
    </form>
  );
}
