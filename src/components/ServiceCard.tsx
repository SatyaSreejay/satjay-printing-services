import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Service } from "@/lib/catalog";

export async function ServiceCard({ service, detailed = false }: { service: Service; detailed?: boolean }) {
  const t = await getTranslations("catalog");
  const s = await getTranslations("services");
  return (
    <article id={service.id} className="card flex flex-col p-5 scroll-mt-24">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-2xl">
          {service.icon}
        </span>
        <h3 className="text-lg font-bold">{t(`services.${service.id}.name`)}</h3>
      </div>
      <p className="mt-2 text-muted">{t(`services.${service.id}.description`)}</p>

      {detailed && (
        <dl className="mt-4 space-y-3">
          {service.groups.map((g) => (
            <div key={g.id}>
              <dt className="text-sm font-semibold">{t(`groups.${g.id}`)}</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {g.options.map((o) => (
                  <span key={o} className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-sm">
                    {t(`options.${o}`)}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link href={`/order?service=${service.id}`} className="btn btn-primary !py-2 text-sm">
          {s("orderThis")}
        </Link>
        <Link href={`/studio?service=${service.id}`} className="btn btn-ghost !py-2 text-sm">
          {s("tryDesigns")}
        </Link>
      </div>
    </article>
  );
}
