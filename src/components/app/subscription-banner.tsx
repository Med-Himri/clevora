import { CircleAlertIcon, LockIcon, SparklesIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Alert } from "@/components/ui/alert";
import { Link } from "@/i18n/navigation";
import type { Role } from "@/lib/auth/session";
import type { SubscriptionState } from "@/lib/subscription";

/** Trial days left, or the read-only explanation with a link to billing (admins). */
export async function SubscriptionBanner({ subscription, role }: { subscription: SubscriptionState; role: Role }) {
  const t = await getTranslations("app.subscription");
  if (subscription.reason === "active") return null;

  const billingLink =
    role === "admin" ? (
      <Link href="/billing" className="inline-flex min-h-11 items-center font-semibold whitespace-nowrap underline underline-offset-4">
        {t("choosePlan")}
      </Link>
    ) : (
      <span className="text-muted-foreground">{t("askAdmin")}</span>
    );

  if (subscription.reason === "trial") {
    // A slim line while there is time; a real warning in the last 3 days.
    const urgent = (subscription.trialDaysLeft ?? 14) <= 3;
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-3">
        <div
          data-testid="trial-banner"
          role="status"
          className={
            urgent
              ? "flex flex-wrap items-center gap-x-3 rounded-lg border border-warning/40 bg-warning-soft px-3 text-sm"
              : "flex flex-wrap items-center gap-x-3 rounded-lg border bg-card px-3 text-sm text-muted-foreground"
          }
        >
          <SparklesIcon className={urgent ? "size-4 text-warning" : "size-4 text-info"} aria-hidden />
          <span className="flex-1 py-2">{t("trial", { days: subscription.trialDaysLeft ?? 14 })}</span>
          <span className="text-foreground">{billingLink}</span>
        </div>
      </div>
    );
  }

  if (subscription.reason === "past_due") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <Alert variant="warning" className="flex-wrap items-center py-2">
          <CircleAlertIcon aria-hidden />
          <span className="flex-1">{t("pastDue")}</span>
          {billingLink}
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4">
      <Alert variant="danger" data-testid="readonly-banner" className="flex-wrap items-center">
        <LockIcon aria-hidden />
        <span className="flex flex-1 flex-col gap-0.5">
          <strong>{t(`readOnly.${subscription.reason}`)}</strong>
          <span>{t("readOnlyBody")}</span>
        </span>
        {billingLink}
      </Alert>
    </div>
  );
}
