import { getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";
import { ParcoliaLogo } from "@/components/app/parcolia-logo";
import { LocaleLinks } from "@/components/app/locale-links";
import { Link } from "@/i18n/navigation";

/** Parcolia-branded pages: login, signup, password reset, invitation. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("brand");
  return (
    <div className="flex min-h-dvh flex-col bg-muted/60 dark:bg-background">
      <header className="flex flex-col items-center gap-2 px-4 pb-4 pt-8 text-center sm:pt-12">
        <Link href="/login" aria-label="Parcolia" className="rounded-lg">
          <ParcoliaLogo />
        </Link>
        <p className="text-sm text-muted-foreground">{t("tagline")}</p>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-6">{children}</main>
      <footer className="flex flex-col items-center gap-1 px-4 pb-6 text-xs text-muted-foreground">
        <Suspense>
          <LocaleLinks />
        </Suspense>
        <p>© {new Date().getFullYear()} Parcolia</p>
      </footer>
    </div>
  );
}
