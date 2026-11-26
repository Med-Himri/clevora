import { MinusIcon, TrendingDownIcon, TrendingUpIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-destructive",
  info: "bg-info-soft text-info",
} as const;

/** Change versus the previous period: an arrow, the % and a short label (never colour alone). */
export type Delta = {
  /** Percentage change (e.g. 12.5), or null when there is nothing to compare with. */
  pct: number | null;
  /** Up is good (revenue) or bad (charges). */
  goodWhenUp?: boolean;
  /** "vs période précédente" */
  label: string;
};

export function DeltaBadge({ delta, onBrand }: { delta: Delta; onBrand?: boolean }) {
  if (delta.pct === null || !Number.isFinite(delta.pct)) return null;
  const pct = Math.round(delta.pct);
  const up = pct > 0;
  const flat = pct === 0;
  const good = flat ? null : up === (delta.goodWhenUp ?? true);
  const Icon = flat ? MinusIcon : up ? TrendingUpIcon : TrendingDownIcon;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1 text-xs", onBrand ? "text-brand-foreground/85" : "text-muted-foreground")} data-testid="delta">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
          onBrand ? "bg-white/20 text-brand-foreground" : good === null ? "bg-muted text-muted-foreground" : good ? "bg-success-soft text-success" : "bg-danger-soft text-destructive",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        <bdi dir="ltr">
          {up ? "+" : ""}
          {pct} %
        </bdi>
      </span>
      {delta.label}
    </span>
  );
}

/** A number with a label (and an optional link to where it comes from). */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  href,
  testId,
  delta,
  highlight,
  children,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof TONES;
  hint?: ReactNode;
  href?: string;
  testId?: string;
  /** Change versus the previous period. */
  delta?: Delta;
  /** The tile that matters most: agency colour background. */
  highlight?: boolean;
  /** Extra content under the number (a small chart, a progress bar). */
  children?: ReactNode;
}) {
  const body = (
    <Card
      className={cn(
        "relative h-full overflow-hidden shadow-xs",
        highlight && "border-transparent bg-brand text-brand-foreground",
        href && "transition-all hover:shadow-md motion-safe:hover:-translate-y-0.5",
      )}
    >
      <CardContent className="flex h-full flex-col gap-1 pt-4 sm:pt-5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className={cn("text-sm font-medium", highlight ? "text-brand-foreground/85" : "text-muted-foreground")}>{label}</span>
          {Icon ? (
            <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-lg", highlight ? "bg-white/15 text-brand-foreground" : TONES[tone])} aria-hidden>
              <Icon className="size-5" />
            </span>
          ) : null}
        </div>
        <span className="min-w-0 break-words text-2xl font-bold tracking-tight tabular-nums sm:text-3xl [&_bdi]:whitespace-normal" data-testid={testId}>
          {value}
        </span>
        {delta ? <DeltaBadge delta={delta} onBrand={highlight} /> : null}
        {hint ? <span className={cn("text-xs", highlight ? "text-brand-foreground/80" : "text-muted-foreground")}>{hint}</span> : null}
        {children ? <div className="mt-auto pt-2">{children}</div> : null}
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-xl">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Percentage change, or null when there is nothing to compare with. */
export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
