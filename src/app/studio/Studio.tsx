"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { services, type ServiceId } from "@/lib/catalog";
import { sizeLabel, templatesFor, type DesignTemplate } from "@/lib/templates";
import { sampleGroup } from "@/lib/templates/samples";
import { saveDesign } from "@/lib/client/designHandoff";
import { DesignPreview } from "@/components/DesignPreview";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function Studio({ initialService }: { initialService: ServiceId }) {
  const t = useTranslations("studio");
  const tt = useTranslations("templates");
  const c = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();

  const [service, setService] = useState<ServiceId>(initialService);
  const options = useMemo(() => templatesFor(service), [service]);
  const [templateId, setTemplateId] = useState<string | undefined>(options[0]?.id);
  const tpl: DesignTemplate | undefined = options.find((o) => o.id === templateId) ?? options[0];
  const [paletteId, setPaletteId] = useState<string | undefined>(tpl?.palettes[0].id);
  const palette = tpl?.palettes.find((p) => p.id === paletteId) ?? tpl?.palettes[0];
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const [logo, setLogo] = useState<string | undefined>();
  const [logoError, setLogoError] = useState("");
  const [guides, setGuides] = useState(true);

  const samples = useMemo(() => {
    if (!tpl) return {};
    return tt.raw(`samples.${sampleGroup[tpl.id]}`) as Record<string, string>;
    // Re-read sample text when the language changes.
  }, [tpl, tt, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const values = useMemo(() => ({ ...samples, ...(tpl ? edits[tpl.id] : {}) }), [samples, edits, tpl]);

  useEffect(() => {
    setTemplateId(options[0]?.id);
  }, [options]);
  useEffect(() => {
    if (tpl && !tpl.palettes.some((p) => p.id === paletteId)) setPaletteId(tpl.palettes[0].id);
  }, [tpl, paletteId]);

  const svg = useMemo(
    () => (tpl && palette ? tpl.render({ values, palette, logo: tpl.logo ? logo : undefined, guides }) : ""),
    [tpl, palette, values, logo, guides],
  );

  function setField(id: string, v: string) {
    if (!tpl) return;
    setEdits((e) => ({ ...e, [tpl.id]: { ...(e[tpl.id] ?? {}), [id]: v } }));
  }

  function onLogo(file: File | undefined) {
    setLogoError("");
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setLogoError("PNG / JPG / WEBP");
    if (file.size > MAX_LOGO_BYTES) return setLogoError("≤ 2 MB");
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  }

  function download() {
    if (!tpl || !palette) return;
    const clean = tpl.render({ values, palette, logo: tpl.logo ? logo : undefined, guides: false });
    const url = URL.createObjectURL(new Blob([clean], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tpl.id}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function useInOrder() {
    if (!tpl || !palette) return;
    saveDesign({ snapshot: { templateId: tpl.id, paletteId: palette.id, values }, logo: tpl.logo ? logo : undefined });
    router.push(`/order?service=${service}&design=1`);
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div>
          <label className="field-label" htmlFor="studio-service">{t("service")}</label>
          <select
            id="studio-service"
            className="input"
            value={service}
            onChange={(e) => setService(e.target.value as ServiceId)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>{c(`services.${s.id}.name`)}</option>
            ))}
          </select>
        </div>

        {!tpl ? (
          <p className="notice notice-warn">{t("noTemplates")}</p>
        ) : (
          <>
            <fieldset>
              <legend className="field-label">{t("layout")}</legend>
              <div className="flex flex-wrap gap-2">
                {options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setTemplateId(o.id)}
                    aria-pressed={o.id === tpl.id}
                    className={`btn !py-1.5 text-sm ${o.id === tpl.id ? "btn-primary" : "btn-ghost"}`}
                  >
                    {tt(`names.${o.id}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="field-label">{t("colours")}</legend>
              <div className="flex flex-wrap gap-2">
                {tpl.palettes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaletteId(p.id)}
                    aria-pressed={p.id === palette?.id}
                    title={tt(`palettes.${p.id}`)}
                    aria-label={tt(`palettes.${p.id}`)}
                    className={`h-9 w-9 overflow-hidden rounded-full border-2 ${p.id === palette?.id ? "border-text" : "border-border"}`}
                  >
                    <span className="flex h-full w-full">
                      <span className="h-full w-1/2" style={{ background: p.bg }} />
                      <span className="h-full w-1/2" style={{ background: p.accent }} />
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="field-label">{t("yourText")}</legend>
              {tpl.fields.map((f) => {
                const id = `f-${f.id}`;
                const common = {
                  id,
                  className: "input",
                  maxLength: f.maxLength,
                  value: values[f.id] ?? "",
                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(f.id, e.target.value),
                };
                return (
                  <div key={f.id}>
                    <label className="text-sm font-medium" htmlFor={id}>{tt(`fields.${f.id}`)}</label>
                    {f.multiline ? <textarea rows={f.id === "items" ? 10 : 3} {...common} /> : <input {...common} />}
                    {tt.has(`hints.${f.id}`) && <p className="field-hint">{tt(`hints.${f.id}`)}</p>}
                  </div>
                );
              })}
              <button
                type="button"
                className="text-sm text-primary underline"
                onClick={() => setEdits((e) => ({ ...e, [tpl.id]: {} }))}
              >
                {t("reset")}
              </button>
            </fieldset>

            {tpl.logo && (
              <div>
                <label className="field-label" htmlFor="studio-logo">{t("logo")}</label>
                <input
                  id="studio-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-sm"
                  onChange={(e) => onLogo(e.target.files?.[0])}
                />
                {logoError && <p className="notice notice-err mt-2">{logoError}</p>}
                <p className="field-hint">{t("logoHint")}</p>
                {logo && (
                  <button type="button" className="mt-1 text-sm underline" onClick={() => setLogo(undefined)}>
                    {t("removeLogo")}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {tpl && palette && (
        <div className="lg:sticky lg:top-20 lg:self-start">
          <DesignPreview svg={svg} label={tt(`names.${tpl.id}`)} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted">{t("size")}: {sizeLabel(tpl)}</span>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
              {t("guides")}
            </label>
          </div>
          {guides && <p className="field-hint">{t("guidesHint")}</p>}
          <p className="notice notice-warn mt-4">{t("previewNote")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={useInOrder}>{t("useInOrder")}</button>
            <button type="button" className="btn btn-ghost" onClick={download}>{t("download")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
