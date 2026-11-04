"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { getTemplate, type DesignSnapshot } from "@/lib/templates";
import { saveDesign } from "@/lib/client/designHandoff";
import { DesignPreview } from "@/components/DesignPreview";

type Suggestion = { design: DesignSnapshot; why: string; artworkPrompt?: string };
type Turn = { role: "user" | "assistant"; content: string; suggestions?: Suggestion[] };

function SuggestionCard({ s, imagesEnabled }: { s: Suggestion; imagesEnabled: boolean }) {
  const t = useTranslations("assistant");
  const tt = useTranslations("templates");
  const router = useRouter();
  const tpl = getTemplate(s.design.templateId);
  const [artwork, setArtwork] = useState<string | undefined>();
  const [concept, setConcept] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!tpl) return null;
  const palette = tpl.palettes.find((p) => p.id === s.design.paletteId) ?? tpl.palettes[0];
  const svg = tpl.render({ values: s.design.values, palette, artwork: artwork ? { href: artwork, scrim: 0.25 } : undefined });

  async function generate(purpose: "background" | "concept") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: s.artworkPrompt || s.why, templateId: tpl!.id, purpose }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "rate" : "fail");
      const { dataUrl } = (await res.json()) as { dataUrl: string };
      if (purpose === "background") setArtwork(dataUrl);
      else setConcept(dataUrl);
    } catch (e) {
      setError(e instanceof Error && e.message === "rate" ? t("rateLimited") : t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4">
      <p className="font-semibold">{tt(`names.${tpl.id}`)}</p>
      <div className="mt-2"><DesignPreview svg={svg} label={tt(`names.${tpl.id}`)} /></div>
      <p className="mt-2 text-sm"><span className="text-muted">{t("why")}: </span>{s.why}</p>
      {imagesEnabled && tpl.artwork && (
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {artwork ? (
            <button type="button" className="underline" onClick={() => setArtwork(undefined)}>{t("removeArtwork")}</button>
          ) : (
            <button type="button" className="underline" disabled={busy} onClick={() => generate("background")}>{t("addArtwork")}</button>
          )}
          <button type="button" className="underline" disabled={busy} onClick={() => generate("concept")}>{t("concept")}</button>
        </div>
      )}
      {busy && <p className="mt-1 text-sm text-muted">{t("artworkWorking")}</p>}
      {artwork && <p className="field-hint">{t("artworkNote")}</p>}
      {error && <p className="notice notice-err mt-2">{error}</p>}
      {concept && (
        <figure className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={concept} alt={t("conceptLabel")} className="w-full rounded-lg" />
          <figcaption className="mt-1 text-sm font-semibold text-[var(--warn-text)]">{t("conceptLabel")}</figcaption>
        </figure>
      )}
      <button
        type="button"
        className="btn btn-primary mt-3 !py-2 text-sm"
        onClick={() => {
          saveDesign({ snapshot: s.design });
          router.push(`/order?service=${tpl.service}&design=1`);
        }}
      >
        {t("useDesign")}
      </button>
    </div>
  );
}

export function Assistant({ imagesEnabled }: { imagesEnabled: boolean }) {
  const t = useTranslations("assistant");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    const next: Turn[] = [...turns, { role: "user", content }];
    setTurns(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "rate" : "fail");
      const data = (await res.json()) as { reply: string; suggestions: Suggestion[] };
      setTurns([...next, { role: "assistant", content: data.reply, suggestions: data.suggestions }]);
    } catch (err) {
      setError(err instanceof Error && err.message === "rate" ? t("rateLimited") : t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {turns.map((turn, i) => (
        <div key={i} className={turn.role === "user" ? "ml-auto max-w-[85%]" : ""}>
          <div className={`rounded-2xl px-4 py-3 ${turn.role === "user" ? "bg-primary text-primary-contrast" : "card"}`}>
            <p className="whitespace-pre-wrap">{turn.content}</p>
          </div>
          {turn.suggestions && turn.suggestions.length > 0 && (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {turn.suggestions.map((s, j) => <SuggestionCard key={j} s={s} imagesEnabled={imagesEnabled} />)}
            </div>
          )}
        </div>
      ))}
      {busy && <p className="text-muted" aria-live="polite">{t("thinking")}</p>}
      {error && <p className="notice notice-err" role="alert">{error}</p>}
      <form onSubmit={send} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <textarea
          rows={3}
          className="input"
          maxLength={4000}
          placeholder={t("placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn-primary" disabled={busy || !input.trim()}>{t("send")}</button>
      </form>
      <p className="text-sm text-muted">{t("disclaimer")}</p>
    </div>
  );
}
