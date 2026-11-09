import { AgencyLogo } from "@/components/app/agency-logo";
import { UserMenu } from "@/components/app/user-menu";
import { Link } from "@/i18n/navigation";

/**
 * Temporary app header (the full shell with sidebar / bottom navigation comes
 * with the app-shell step): agency logo + name, user name + role, menu.
 */
export function AppHeader({
  agencyName,
  agencyLogoUrl,
  userName,
  userEmail,
  roleLabel,
  canSwitchAgency,
}: {
  agencyName: string;
  agencyLogoUrl: string | null;
  userName: string;
  userEmail: string;
  roleLabel: string;
  canSwitchAgency: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5 rounded-lg">
          <AgencyLogo name={agencyName} url={agencyLogoUrl} size={40} />
          <span className="line-clamp-2 text-[15px] font-bold leading-tight sm:truncate sm:text-lg" data-testid="header-agency-name">
            {agencyName}
          </span>
        </Link>
        <UserMenu name={userName} email={userEmail} roleLabel={roleLabel} canSwitchAgency={canSwitchAgency} />
      </div>
    </header>
  );
}
