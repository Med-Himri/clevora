import type { ReactNode } from "react";

/** Page title + subtitle + main action (fuller version comes with the app shell). */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
