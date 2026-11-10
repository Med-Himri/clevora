import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ParcoliaLogo } from "@/components/app/parcolia-logo";
import { ThemeSync } from "@/components/app/theme-sync";
import { Link } from "@/i18n/navigation";
import { getProfile } from "@/lib/auth/session";
import { requirePlatformAdmin } from "@/lib/auth/platform";

/** Parcolia staff area: every agency, subscriptions and payments. Not for agencies. */
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const user = await requirePlatformAdmin();
  const profile = await getProfile();
  const t = await getTranslations("platform");
  return (
    <div className="flex min-h-dvh flex-col">
      <ThemeSync theme={profile?.preferredTheme ?? "system"} />
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <Link href="/platform" className="flex items-center gap-3 rounded-md">
            <ParcoliaLogo />
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{t("badge")}</span>
          </Link>
          <span className="flex flex-col text-end text-sm leading-tight">
            <span className="font-medium">{profile?.fullName || user.email}</span>
            <span className="text-xs text-muted-foreground">{t("role")}</span>
          </span>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
