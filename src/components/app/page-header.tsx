import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Page title (with the section icon in a soft agency-colour tile) + subtitle, and the
 * page actions. Phones: the actions share one row when they fit (compact buttons that
 * grow to fill the width), else each takes the full width — never ragged sizes.
 */
export function PageHeader({ title, subtitle, action, icon: Icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <span
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand sm:size-12 dark:bg-brand/25 dark:text-[color-mix(in_oklab,var(--brand)_45%,white)]"
            aria-hidden
          >
            <Icon className="size-6" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
        </div>
      </div>
      {action ? (
        <div className="flex flex-wrap gap-2 max-sm:[&>*]:h-11 max-sm:[&>*]:flex-auto max-sm:[&>*]:px-3 max-sm:[&>*]:text-sm" data-testid="page-actions">
          {action}
        </div>
      ) : null}
    </div>
  );
}
