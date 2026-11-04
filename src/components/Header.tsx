import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { business } from "@/config/business";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/services", key: "services" },
  { href: "/studio", key: "studio" },
  { href: "/assistant", key: "assistant" },
  { href: "/order", key: "order" },
  { href: "/track", key: "track" },
] as const;

export async function Header() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-bold">
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm text-white"
            style={{ background: "linear-gradient(135deg,#00a0b0,#c2185b 55%,#f2b705)" }}
          >
            ✦
          </span>
          <span className="truncate">{business.name}</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-5 text-sm font-medium lg:flex" aria-label={t("label")}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-text">
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <details className="relative lg:hidden">
            <summary className="btn btn-ghost !px-3 !py-1.5 list-none text-sm" aria-label={t("menu")}>
              ☰
            </summary>
            <nav
              className="card absolute right-0 mt-2 flex w-56 flex-col p-2 text-sm"
              aria-label={t("label")}
            >
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 hover:bg-surface-2">
                  {t(l.key)}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
