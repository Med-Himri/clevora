import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type Segment = { key: string; href: string; label: ReactNode; count?: number; icon?: LucideIcon; testId?: string };

/**
 * Tabs / filters as one segmented bar: always a single row (phones too), equal
 * widths, the active one raised in white. On phones the count sits under the label.
 */
export function SegmentTabs({ items, active, label, className }: { items: Segment[]; active: string; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1 lg:inline-grid lg:auto-cols-auto", className)}>
      {items.map((s) => {
        const on = s.key === active;
        const Icon = s.icon;
        return (
          <Link
            key={s.key}
            href={s.href}
            aria-current={on ? "page" : undefined}
            data-testid={s.testId}
            className={cn(
              "flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-center leading-tight hyphens-auto font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:gap-2 sm:px-4 sm:text-sm",
              // 4 tabs or more: a smaller text on phones so every word fits
              items.length >= 4 ? "text-[11px]" : "text-xs",
              on ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
            <span className="min-w-0 break-words">{s.label}</span>
            {s.count !== undefined ? (
              <span className={cn("min-w-5 rounded-full px-1.5 text-[11px] tabular-nums", on ? "bg-brand text-brand-foreground" : "bg-background/70")}>{s.count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
