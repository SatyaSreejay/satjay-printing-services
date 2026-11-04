"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { business, uploadLimits, whatsappLink } from "@/config/business";
import { getService, services } from "@/lib/catalog";
import { getTemplate, renderSnapshot, type DesignSnapshot } from "@/lib/templates";
import { formatBytes, type ContactMethod } from "@/lib/tickets";
import { checkUploadList } from "@/lib/uploads";
import { clearDesign, loadDesign } from "@/lib/client/designHandoff";
import { DesignPreview } from "@/components/DesignPreview";

type PickedFile = { id: string; file: File; studioLogo?: boolean };
type Phase = { kind: "idle" } | { kind: "uploading"; done: number; total: number } | { kind: "sending" };
type Success = { ticketId: string; trackingUrl: string; emailed: boolean };

const maxLabel = formatBytes(uploadLimits.maxTotalBytes);

function dataUrlToFile(dataUrl: string, name: string): File | null {
  const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = m[1].split("/")[1].replace("jpeg", "jpg");
  return new File([bytes], `${name}.${ext}`, { type: m[1] });
}

function putWithProgress(url: string, headers: Record<string, string>, file: File) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

export function OrderForm({ initialService, withDesign }: { initialService: string; withDesign: boolean }) {
  const t = useTranslations("order");
  const c = useTranslations("catalog");
  const tt = useTranslations("templates");
  const locale = useLocale();

  const [service, setService] = useState(initialService);
  const [otherService, setOtherService] = useState("");
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState("");
  const [size, setSize] = useState("");
  const [deadline, setDeadline] = useState("");
  const [colours, setColours] = useState("");
  const [text, setText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [design, setDesign] = useState<DesignSnapshot | null>(null);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [preferred, setPreferred] = useState<ContactMethod>("whatsapp");
  const [honeypot, setHoneypot] = useState("");
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Success | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const svc = getService(service);

  // Bring in a design from the studio.
  useEffect(() => {
    if (!withDesign) return;
    const h = loadDesign();
    if (!h) return;
    setDesign(h.snapshot);
    const tpl = getTemplate(h.snapshot.templateId);
    if (tpl) setService(tpl.service);
    setText((cur) => cur || tpl?.fields.map((f) => h.snapshot.values[f.id]).filter((v) => v?.trim()).join("\n") || "");
    if (h.logo) {
      const f = dataUrlToFile(h.logo, "studio-logo");
      if (f) setFiles((cur) => [{ id: "studio-logo", file: f, studioLogo: true }, ...cur]);
    }
  }, [withDesign]);

  const check = useMemo(() => checkUploadList(files.map((f) => ({ name: f.file.name, size: f.file.size }))), [files]);
  const designSvg = useMemo(() => (design ? renderSnapshot(design) : null), [design]);

  function toggleOption(groupId: string, optionId: string, multiple?: boolean) {
    setOptions((cur) => {
      const list = cur[groupId] ?? [];
      const next = multiple
        ? list.includes(optionId) ? list.filter((o) => o !== optionId) : [...list, optionId]
        : list[0] === optionId ? [] : [optionId];
      return { ...cur, [groupId]: next };
    });
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const added = Array.from(list).map((file) => ({ id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`, file }));
    setFiles((cur) => [...cur, ...added]);
  }

  function validate() {
    const bad = new Set<string>();
    if (!service) bad.add("service");
    if (service === "other" && !otherService.trim()) bad.add("otherService");
    if (!quantity.trim()) bad.add("quantity");
    if (!text.trim()) bad.add("text");
    if (name.trim().length < 2) bad.add("name");
    if (!/^[+\d][\d\s-]{6,19}$/.test(phone.trim())) bad.add("phone");
    if (!whatsappSame && whatsapp.trim() && !/^[+\d][\d\s-]{6,19}$/.test(whatsapp.trim())) bad.add("whatsapp");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) bad.add("email");
    if (preferred === "email" && !email.trim()) bad.add("email");
    setInvalid(bad);
    return bad.size === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) {
      setError(t("required"));
      return;
    }
    if (!check.ok) return;
    try {
      let upload: { batch: string; files: { key: string; name: string; type: string }[] } | undefined;
      let designLogoKey: string | undefined;
      if (files.length) {
        setPhase({ kind: "uploading", done: 0, total: files.length });
        const res = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: files.map((f) => ({ name: f.file.name, size: f.file.size, type: f.file.type })) }),
        });
        if (!res.ok) throw new Error(res.status === 429 ? "rate" : "upload");
        const signed = (await res.json()) as { batch: string; uploads: { key: string; url: string; headers: Record<string, string> }[] };
        let done = 0;
        await Promise.all(
          signed.uploads.map(async (u, i) => {
            await putWithProgress(u.url, u.headers, files[i].file);
            done++;
            setPhase({ kind: "uploading", done, total: files.length });
          }),
        );
        upload = { batch: signed.batch, files: signed.uploads.map((u, i) => ({ key: u.key, name: files[i].file.name, type: files[i].file.type })) };
        const logoIdx = files.findIndex((f) => f.studioLogo);
        if (logoIdx >= 0) designLogoKey = signed.uploads[logoIdx].key;
      }
      setPhase({ kind: "sending" });
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: honeypot,
          locale,
          customer: { name, phone, whatsappSame, whatsapp: whatsappSame ? "" : whatsapp, email, preferred },
          order: { service, otherService, options, quantity, size, deadline, colours, text, instructions },
          design: design ?? undefined,
          designLogoKey,
          upload,
        }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "rate" : "order");
      const data = (await res.json()) as Success;
      clearDesign();
      setSuccess(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setError(m === "rate" ? t("errorRate") : m === "upload" || /^\d+$|network/.test(m) ? t("errorUpload") : t("error"));
    } finally {
      setPhase({ kind: "idle" });
    }
  }

  if (success) {
    return (
      <div className="card mt-8 p-6" role="status">
        <h2 className="text-2xl font-bold">{t("successTitle")}</h2>
        <p className="mt-2">{t("successBody", { id: success.ticketId })}</p>
        <p className="mt-4 font-semibold">{t("successTrack")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="input !w-auto max-w-full overflow-x-auto whitespace-nowrap text-sm">{success.trackingUrl}</code>
          <button
            type="button"
            className="btn btn-ghost !py-2 text-sm"
            onClick={() => navigator.clipboard?.writeText(success.trackingUrl).then(() => setCopied(true))}
          >
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
        {success.emailed && <p className="mt-3 text-muted">{t("successEmailed")}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={success.trackingUrl} className="btn btn-primary">{t("openTracking")}</a>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.assign("/order")}>{t("newOrder")}</button>
        </div>
      </div>
    );
  }

  const busy = phase.kind !== "idle";
  const cls = (id: string) => `input ${invalid.has(id) ? "!border-[var(--err-text)] !outline-[var(--err-text)]" : ""}`;

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-8">
      {/* Honeypot for bots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="text-xl font-bold">1. {t("step1")}</h2>
        <div className="mt-4">
          <label className="field-label" htmlFor="o-service">{t("service")}</label>
          <select id="o-service" className={cls("service")} value={service} onChange={(e) => { setService(e.target.value); setOptions({}); }}>
            <option value="">{t("chooseService")}</option>
            {services.map((s) => <option key={s.id} value={s.id}>{c(`services.${s.id}.name`)}</option>)}
            <option value="other">{t("otherService")}</option>
          </select>
        </div>
        {service === "other" && (
          <div className="mt-4">
            <label className="field-label" htmlFor="o-other">{t("otherServiceLabel")}</label>
            <input id="o-other" className={cls("otherService")} maxLength={200} value={otherService} onChange={(e) => setOtherService(e.target.value)} />
          </div>
        )}
        {svc?.groups.map((g) => (
          <fieldset key={g.id} className="mt-5">
            <legend className="field-label">{c(`groups.${g.id}`)}</legend>
            {g.multiple && <p className="field-hint !mt-0 mb-2">{t("multiHint")}</p>}
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const on = (options[g.id] ?? []).includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleOption(g.id, o, g.multiple)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-primary bg-primary text-primary-contrast" : "border-border bg-surface hover:border-muted"}`}
                  >
                    {c(`options.${o}`)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-xl font-bold">2. {t("step2")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="o-qty">{t("quantity")} *</label>
            <input id="o-qty" className={cls("quantity")} maxLength={60} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <p className="field-hint">{t("quantityHint")}</p>
          </div>
          <div>
            <label className="field-label" htmlFor="o-deadline">{t("deadline")}</label>
            <input id="o-deadline" type="date" className="input" value={deadline} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="o-size">{t("size")}</label>
            <input id="o-size" className="input" maxLength={120} value={size} onChange={(e) => setSize(e.target.value)} />
            <p className="field-hint">{t("sizeHint")}</p>
          </div>
          <div>
            <label className="field-label" htmlFor="o-colours">{t("colours")}</label>
            <input id="o-colours" className="input" maxLength={200} value={colours} onChange={(e) => setColours(e.target.value)} />
            <p className="field-hint">{t("coloursHint")}</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="field-label" htmlFor="o-text">{t("text")} *</label>
          <textarea id="o-text" rows={7} className={cls("text")} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} />
          <p className="field-hint">{t("textHint")}</p>
        </div>
        <div className="mt-4">
          <label className="field-label" htmlFor="o-instr">{t("instructions")}</label>
          <textarea id="o-instr" rows={3} className="input" maxLength={3000} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          <p className="field-hint">{t("instructionsHint")}</p>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-xl font-bold">3. {t("step3")}</h2>
        <div className="mt-4">
          <p className="field-label">{t("design")}</p>
          {design && designSvg ? (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-start">
              <DesignPreview svg={designSvg} label={tt(`names.${design.templateId}`)} />
              <div>
                <p className="font-semibold">{tt(`names.${design.templateId}`)}</p>
                <p className="text-sm text-muted">{t("designAttached")}</p>
                <button type="button" className="mt-2 text-sm underline" onClick={() => { setDesign(null); clearDesign(); setFiles((f) => f.filter((x) => !x.studioLogo)); }}>
                  {t("removeDesign")}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              {t("noDesign")} <Link className="text-primary underline" href={`/studio${svc ? `?service=${svc.id}` : ""}`}>{t("openStudio")}</Link>
            </p>
          )}
        </div>

        <div className="mt-6">
          <p className="field-label">{t("files")}</p>
          <p className="field-hint !mt-0">{t("filesHint", { max: uploadLimits.maxFiles, total: maxLabel })}</p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            className={`mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center ${dragging ? "border-primary bg-surface-2" : "border-border"}`}
          >
            <button type="button" className="btn btn-ghost" onClick={() => fileInput.current?.click()}>{t("addFiles")}</button>
            <span className="text-sm text-muted">{t("dropHere")}</span>
            <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </div>
          {files.length > 0 && (
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    {f.studioLogo ? `${t("studioLogo")} · ` : ""}{f.file.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-muted">{formatBytes(f.file.size)}</span>
                    <button type="button" className="underline" onClick={() => setFiles((cur) => cur.filter((x) => x.id !== f.id))}>{t("remove")}</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {files.length > 0 && (
            <p className={`mt-2 text-sm ${check.ok ? "text-muted" : ""}`}>{t("totalSize", { size: formatBytes(check.total), max: maxLabel })}</p>
          )}
          {!check.ok && check.reason === "tooLarge" && (
            <div className="notice notice-warn mt-2">
              {t("tooLarge", { max: maxLabel, phone: business.phoneDisplay, email: business.email })}{" "}
              <a className="font-semibold underline" href={whatsappLink()} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              {" · "}
              <a className="font-semibold underline" href={`mailto:${business.email}`}>{business.email}</a>
            </div>
          )}
          {!check.ok && check.reason === "tooMany" && <p className="notice notice-warn mt-2">{t("tooMany", { max: uploadLimits.maxFiles })}</p>}
          {!check.ok && check.reason === "blocked" && (
            <p className="notice notice-err mt-2">{t("blocked", { name: files.find((f) => /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|js|mjs|jar|sh|apk|app|dmg|html?|php|svgz?)$/i.test(f.file.name))?.file.name ?? "" })}</p>
          )}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-xl font-bold">4. {t("step4")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="o-name">{t("name")} *</label>
            <input id="o-name" autoComplete="name" className={cls("name")} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="o-phone">{t("phone")} *</label>
            <input id="o-phone" type="tel" autoComplete="tel" inputMode="tel" className={cls("phone")} maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <label className="mt-2 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={whatsappSame} onChange={(e) => setWhatsappSame(e.target.checked)} />
              {t("whatsappSame")}
            </label>
          </div>
          {!whatsappSame && (
            <div>
              <label className="field-label" htmlFor="o-wa">{t("whatsapp")}</label>
              <input id="o-wa" type="tel" inputMode="tel" className={cls("whatsapp")} maxLength={20} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
          )}
          <div>
            <label className="field-label" htmlFor="o-email">{t("email")}</label>
            <input id="o-email" type="email" autoComplete="email" className={cls("email")} maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="field-hint">{t("emailHint")}</p>
          </div>
        </div>
        <fieldset className="mt-4">
          <legend className="field-label">{t("preferred")}</legend>
          <div className="flex flex-wrap gap-4">
            {(["whatsapp", "call", "email"] as const).map((m) => (
              <label key={m} className="inline-flex items-center gap-2">
                <input type="radio" name="preferred" checked={preferred === m} onChange={() => setPreferred(m)} />
                {t(`pref_${m}`)}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <p className="notice notice-warn">{t("noPrices")}</p>
      {error && <p className="notice notice-err" role="alert">{error}</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary text-lg" disabled={busy || !check.ok}>{t("submit")}</button>
        {phase.kind === "uploading" && <span className="text-muted" aria-live="polite">{t("uploading", { done: phase.done, total: phase.total })}</span>}
        {phase.kind === "sending" && <span className="text-muted" aria-live="polite">{t("sending")}</span>}
      </div>
    </form>
  );
}
