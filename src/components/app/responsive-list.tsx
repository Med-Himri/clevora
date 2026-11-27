import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Column priority decides where a column goes when there is no room:
 *  - "primary": the card title on small screens
 *  - "high":    stays visible on the card
 *  - "low":     shown in the card body (smaller, under a label) on small screens
 */
export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  priority: "primary" | "high" | "low";
  align?: "start" | "end";
  /** Hide the header label inside cards (e.g. a status badge). */
  hideLabelInCard?: boolean;
  /** Keep the cell on one line in the table (numbers, dates, amounts). Default for end-aligned columns. */
  nowrap?: boolean;
  /** Extra classes for the table cell and header (e.g. a width). */
  className?: string;
};

export type ListGroup<T> = {
  key: string;
  label: ReactNode;
  tone?: "danger" | "warning" | "default";
  rows: T[];
};

type Props<T> = {
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** The whole row opens this page (the first cell holds the real link). */
  rowHref?: (row: T) => string;
  /** Row actions. "table": compact (icon menu); "card": big buttons. */
  actions?: (row: T, mode: "table" | "card") => ReactNode;
  caption?: string;
  testId?: string;
  rowTestId?: string;
  /** Under the table: totals, a count… */
  footer?: ReactNode;
  /** Multi-select: a box per row (first column / card corner) and a "select all" box in the header. */
  select?: { cell: (row: T) => ReactNode; all: ReactNode };
} & ({ rows: T[]; groups?: never } | { groups: ListGroup<T>[]; rows?: never });

const TONE = { danger: "text-destructive", warning: "text-warning", default: "text-foreground" } as const;

function GroupTitle({ label, count, tone = "default" }: { label: ReactNode; count: number; tone?: ListGroup<unknown>["tone"] }) {
  return (
    <span className={cn("flex items-center gap-2 text-sm font-semibold", TONE[tone ?? "default"])}>
      {label}
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-bold text-foreground">{count}</span>
    </span>
  );
}

/**
 * A table from 1024 px that becomes a compact list on phones and tablets —
 * never a horizontal page scroll. Rows can be grouped by urgency.
 * Works in server and client components.
 */
export function ResponsiveList<T>(props: Props<T>) {
  const { columns, rowKey, rowHref, actions, caption, testId, rowTestId, footer, select } = props;
  const groups: ListGroup<T>[] = props.groups ?? [{ key: "all", label: null, rows: props.rows ?? [] }];
  const grouped = Boolean(props.groups);
  const primary = columns.filter((c) => c.priority === "primary");
  const high = columns.filter((c) => c.priority === "high");
  const low = columns.filter((c) => c.priority === "low");
  // Phone: the first end-aligned column (an amount) sits at the end of the title line;
  // the other "high" columns make the grey details line; "low" columns a small label : value line.
  const trailing = [...high, ...low].find((c) => c.align === "end");
  const details = high.filter((c) => c !== trailing);
  // The other columns: small « label : value » pairs, so no number is lost on phones
  const extra = low.filter((c) => c !== trailing);
  const span = columns.length + (actions ? 1 : 0) + (select ? 1 : 0);
  const nowrap = (c: Column<T>) => c.nowrap ?? c.align === "end";

  return (
    <div data-testid={testId}>
      {/* Laptop: table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-xs lg:block">
        <table className="w-full text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="border-b bg-muted/50">
            <tr>
              {select ? <th scope="col" className="w-0 ps-4 pe-0 py-1">{select.all}</th> : null}
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "px-4 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase",
                    c.align === "end" ? "text-end" : "text-start",
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
              {actions ? (
                <th scope="col" className="w-0 px-4 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          {groups.map((g) =>
            g.rows.length ? (
              <tbody key={g.key} className="divide-y border-b last:border-b-0" data-group={grouped ? g.key : undefined}>
                {grouped ? (
                  <tr className="bg-muted/30">
                    <th scope="colgroup" colSpan={span} className="px-4 py-2 text-start">
                      <GroupTitle label={g.label} count={g.rows.length} tone={g.tone} />
                    </th>
                  </tr>
                ) : null}
                {g.rows.map((row) => (
                  <tr key={rowKey(row)} className={cn("relative align-middle transition-colors", rowHref && "hover:bg-accent/60")} data-testid={rowTestId}>
                    {select ? <td className="relative z-10 w-0 ps-4 pe-0 py-1">{select.cell(row)}</td> : null}
                    {columns.map((c, i) => (
                      <td key={c.key} className={cn("px-4 py-3", c.align === "end" ? "text-end" : "text-start", nowrap(c) ? "whitespace-nowrap" : "break-words", c.className)}>
                        {i === 0 && rowHref ? (
                          <Link href={rowHref(row)} className="font-semibold outline-none before:absolute before:inset-0 before:content-[''] focus-visible:before:ring-2 focus-visible:before:ring-ring focus-visible:before:ring-inset">
                            {c.cell(row)}
                          </Link>
                        ) : (
                          c.cell(row)
                        )}
                      </td>
                    ))}
                    {actions ? (
                      <td className="relative z-10 px-3 py-2 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">{actions(row, "table")}</div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            ) : null,
          )}
        </table>
        {footer ? <div className="border-t bg-muted/30 px-4 py-2.5 text-sm">{footer}</div> : null}
      </div>

      {/* Phone & tablet: a compact list (one block, thin separators). Each row: the title
          in bold, one grey line with the details, the amount on the end, the main action
          and a « ⋯ » menu (the compact actions), and a chevron when the row opens a page. */}
      <div className="flex flex-col gap-5 lg:hidden">
        {groups.map((g) =>
          g.rows.length ? (
            <section key={g.key} className="flex flex-col gap-2" data-group={grouped ? g.key : undefined}>
              {grouped ? (
                <div className="px-1">
                  <GroupTitle label={g.label} count={g.rows.length} tone={g.tone} />
                </div>
              ) : null}
              <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
                {g.rows.map((row) => (
                  <li key={rowKey(row)} className={cn("relative flex items-center gap-3 px-3 py-3 transition-colors", rowHref && "active:bg-accent/70")} data-testid={rowTestId}>
                    {select ? <div className="relative z-10 shrink-0">{select.cell(row)}</div> : null}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 font-semibold leading-snug [&_*]:leading-snug">
                          {primary.map((c, i) =>
                            i === 0 && rowHref ? (
                              <Link key={c.key} href={rowHref(row)} className="block min-w-0 break-words outline-none before:absolute before:inset-0 before:content-[''] focus-visible:before:ring-2 focus-visible:before:ring-ring focus-visible:before:ring-inset">
                                {c.cell(row)}
                              </Link>
                            ) : (
                              <div key={c.key} className="min-w-0 break-words">
                                {c.cell(row)}
                              </div>
                            ),
                          )}
                        </div>
                        {trailing ? <div className="shrink-0 text-end text-sm font-semibold whitespace-nowrap">{trailing.cell(row)}</div> : null}
                      </div>
                      {details.length ? (
                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground [&_.font-bold]:font-semibold [&_.text-base]:text-sm">
                          {details.map((c) => (
                            <div key={c.key} className="min-w-0 break-words">
                              {c.hideLabelInCard ? null : <span className="sr-only">{c.header}: </span>}
                              {c.cell(row)}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {extra.length ? (
                        <dl className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs">
                          {extra.map((c) => (
                            <div key={c.key} className="flex min-w-0 items-baseline gap-1">
                              <dt className="text-muted-foreground">{c.header} :</dt>
                              <dd className="min-w-0 break-words font-medium [&_.text-base]:text-xs">{c.cell(row)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                      {/* Actions on their own line: the text keeps the full width */}
                      {actions ? <div className="relative z-10 mt-1 flex flex-wrap items-center gap-1.5">{actions(row, "table")}</div> : null}
                    </div>
                    {rowHref ? <ChevronRightIcon className="size-5 shrink-0 self-center text-muted-foreground rtl:rotate-180" aria-hidden /> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
        {footer ? <div className="rounded-xl border bg-card px-4 py-3 text-sm">{footer}</div> : null}
      </div>
    </div>
  );
}
