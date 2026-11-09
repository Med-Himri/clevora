import { getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";
import { AgencyProvider } from "@/components/app/agency-context";
import { AppHeader } from "@/components/app/app-header";
import { BrandStyle } from "@/components/app/brand-style";
import { NoticeToast } from "@/components/app/notice-toast";
import { SubscriptionBanner } from "@/components/app/subscription-banner";
import { ThemeSync } from "@/components/app/theme-sync";
import { getMemberships, getProfile, requireAgency } from "@/lib/auth/session";

/** Everything inside the agency: requires login + an active agency. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, agency } = await requireAgency();
  const [profile, memberships, tr, t] = await Promise.all([
    getProfile(),
    getMemberships(),
    getTranslations("roles"),
    getTranslations("app"),
  ]);
  const activeAgencies = memberships.filter((m) => m.status === "active").length;

  return (
    <AgencyProvider
      value={{ id: agency.id, name: agency.name, role: agency.role, writable: agency.subscription.writable }}
    >
      <BrandStyle brand={agency.brandColor} foreground={agency.brandForeground} />
      <ThemeSync theme={profile?.preferredTheme ?? "system"} />
      <div className="flex min-h-dvh flex-col">
        <AppHeader
          agencyName={agency.name}
          agencyLogoUrl={agency.logoUrl}
          userName={profile?.fullName || user.email || ""}
          userEmail={user.email ?? ""}
          roleLabel={tr(agency.role)}
          canSwitchAgency={activeAgencies > 1}
        />
        <SubscriptionBanner subscription={agency.subscription} role={agency.role} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:py-6">{children}</main>
        <footer className="px-4 pb-4 text-center text-xs text-muted-foreground">{t("poweredBy")}</footer>
      </div>
      <Suspense>
        <NoticeToast />
      </Suspense>
    </AgencyProvider>
  );
}
