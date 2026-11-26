import { Ltr } from "@/components/app/ltr";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Small charts drawn in plain HTML/SVG (no library): thin marks with rounded
 * ends, 2px gaps between parts, the exact value on hover (title), and the
 * numbers always written next to them (never colour alone).
 */

/** A strip of small bars (e.g. revenue per day of the month). Bars after `upTo` are drawn as empty days to come. */
export function MiniBars({ values, titles, upTo, className, onBrand }: { values: number[]; titles: string[]; upTo?: number; className?: string; onBrand?: boolean }) {
  const max = Math.max(1, ...values);
  const n = values.length;
  const w = 100 / Math.max(1, n);
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn("h-10 w-full", className)} role="img" aria-label={titles.filter((_, i) => values[i] > 0).join(" · ")}>
      {values.map((v, i) => {
        const h = v > 0 ? Math.max(3, (v / max) * 30) : 1.5;
        const future = upTo !== undefined && i > upTo;
        return (
          <rect
            key={i}
            x={i * w + w * 0.15}
            y={32 - h}
            width={w * 0.7}
            height={h}
            rx={Math.min(1.2, w * 0.3)}
            className={cn(onBrand ? "fill-white" : "fill-brand dark:fill-[color-mix(in_oklab,var(--brand)_55%,white)]", future ? "opacity-15" : v > 0 ? "opacity-90" : "opacity-30")}
          >
            <title>{titles[i]}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export type Part = { key: string; label: string; value: number; className: string; dotClassName: string; testId?: string; href?: string };

/** Part of a whole: one bar split in parts (2px gaps), and a legend with the counts. */
export function StackedBar({ parts, label, testId }: { parts: Part[]; label: string; testId?: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div className="flex flex-col gap-3" data-testid={testId}>
      <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${label} : ${parts.map((p) => `${p.label} ${p.value}`).join(", ")}`}>
        {total
          ? parts
              .filter((p) => p.value > 0)
              .map((p) => <span key={p.key} className={cn("h-full first:rounded-s-full last:rounded-e-full", p.className)} style={{ width: `${(p.value / total) * 100}%` }} title={`${p.label} : ${p.value}`} />)
          : null}
      </div>
      <ul className="grid grid-cols-3 gap-2 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="min-w-0">
            <PartLink href={p.href}>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className={cn("size-2.5 shrink-0 rounded-full", p.dotClassName)} aria-hidden />
                <span className="truncate">{p.label}</span>
              </span>
              <span className="text-xl font-bold tabular-nums" data-testid={p.testId}>
                {p.value}
              </span>
            </PartLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PartLink({ href, children }: { href?: string; children: React.ReactNode }) {
  return href ? (
    <Link href={href} className="-m-1 flex min-h-11 flex-col rounded-lg p-1 hover:bg-accent">
      {children}
    </Link>
  ) : (
    <span className="flex flex-col">{children}</span>
  );
}

/** A ranking: one horizontal bar per row, longest first; negative values drawn in red from the same start, with their minus sign. */
export function RankBars({ rows, testId }: { rows: Array<{ key: string; label: React.ReactNode; sub?: React.ReactNode; value: number; display: string; href?: string }>; testId?: string }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  return (
    <ol className="flex flex-col gap-3" data-testid={testId}>
      {rows.map((r, i) => (
        <li key={r.key} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{r.label}</span>
            {r.sub ? <span className="truncate text-xs text-muted-foreground">{r.sub}</span> : null}
          </span>
          <Ltr className={cn("text-sm font-bold tabular-nums", r.value < 0 && "text-destructive")}>{r.display}</Ltr>
          <span className="col-start-2 col-end-4 h-2 overflow-hidden rounded-full bg-muted" aria-hidden title={r.display}>
            <span
              className={cn("block h-full rounded-full", r.value < 0 ? "bg-destructive/80" : "bg-brand dark:bg-[color-mix(in_oklab,var(--brand)_55%,white)]")}
              style={{ width: `${Math.max(2, (Math.abs(r.value) / max) * 100)}%` }}
            />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** A thin progress bar with its % written next to it. */
export function Meter({ pct, label, className }: { pct: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <span className="flex items-center gap-2" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-valuetext={`${v} %`}>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full bg-brand dark:bg-[color-mix(in_oklab,var(--brand)_55%,white)]", className)} style={{ width: `${v}%` }} />
      </span>
    </span>
  );
}
