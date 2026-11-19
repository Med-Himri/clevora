"use client";

import { CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { updateLocaleAction } from "@/app/[locale]/(app)/account/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "fr", short: "FR", name: "Français" },
  { code: "ar", short: "ع", name: "العربية" },
  { code: "en", short: "EN", name: "English" },
] as const;
type Code = (typeof LOCALES)[number]["code"];

/**
 * Language in the header: a pill FR · ع · EN (from 640 px), a compact menu on phones.
 * Stays on the same page; saved in the profile when logged in.
 */
export function LanguageSwitch({ save = true, className }: { save?: boolean; className?: string }) {
  const t = useTranslations("app");
  const current = useLocale() as Code;
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [pending, start] = useTransition();
  const choose = (code: Code) => {
    if (code === current) return;
    if (save) void updateLocaleAction(code);
    start(() => router.replace(search ? `${pathname}?${search}` : pathname, { locale: code }));
  };
  const currentShort = LOCALES.find((l) => l.code === current)?.short ?? "FR";

  return (
    <div className={cn("shrink-0", className)} data-testid="language-switch">
      {/* Tablet and laptop: the pill */}
      <div role="group" aria-label={t("language")} className={cn("hidden h-11 items-center gap-0.5 rounded-full bg-muted p-1 sm:inline-flex", pending && "opacity-70")}>
        {LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            onClick={() => choose(l.code)}
            aria-pressed={current === l.code}
            aria-label={l.name}
            title={l.name}
            className={cn(
              "inline-flex h-9 min-w-10 items-center justify-center rounded-full px-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current === l.code ? "bg-card text-foreground shadow-sm dark:bg-foreground dark:text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.short}
          </button>
        ))}
      </div>
      {/* Phone: one small button with the current language */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("language")}
            className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground sm:hidden"
          >
            {currentShort}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LOCALES.map((l) => (
            <DropdownMenuItem key={l.code} lang={l.code} onSelect={() => choose(l.code)}>
              <CheckIcon className={cn("size-4", current === l.code ? "opacity-100" : "opacity-0")} aria-hidden />
              {l.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
