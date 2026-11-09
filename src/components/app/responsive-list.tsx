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
};

/**
 * A table on laptops (≥ 1280 px) that becomes stacked cards on phones and
 * tablets — never a horizontal scroll. Works in server and client components.
 */
export function ResponsiveList<T>({
  rows,
  columns,
  rowKey,
  rowHref,
  actions,
  caption,
  testId,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  actions?: (row: T) => ReactNode;
  caption?: string;
  testId?: string;
}) {
  const primary = columns.filter((c) => c.priority === "primary");
  const high = columns.filter((c) => c.priority === "high");
  const low = columns.filter((c) => c.priority === "low");

  return (
    <div data-testid={testId}>
      {/* Laptop: table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card xl:block">
        <table className="w-full text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn("px-4 py-3 font-semibold whitespace-nowrap", c.align === "end" ? "text-end" : "text-start")}>
                  {c.header}
                </th>
              ))}
              {actions ? <th scope="col" className="w-0 px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="align-middle hover:bg-accent/50">
                {columns.map((c, i) => (
                  <td key={c.key} className={cn("px-4 py-3 break-words", c.align === "end" ? "text-end" : "text-start")}>
                    {i === 0 && rowHref ? (
                      <Link href={rowHref(row)} className="font-semibold hover:underline">
                        {c.cell(row)}
                      </Link>
                    ) : (
                      c.cell(row)
                    )}
                  </td>
                ))}
                {actions ? <td className="px-4 py-2 text-end whitespace-nowrap">{actions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone & tablet: cards */}
      <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
        {rows.map((row) => {
          const title = (
            <div className="flex min-w-0 flex-col gap-0.5">
              {primary.map((c) => (
                <div key={c.key} className="min-w-0 break-words font-semibold">
                  {c.cell(row)}
                </div>
              ))}
            </div>
          );
          return (
            <li key={rowKey(row)} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
              {rowHref ? (
                <Link href={rowHref(row)} className="rounded-md">
                  {title}
                </Link>
              ) : (
                title
              )}
              {high.length ? (
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {high.map((c) => (
                    <div key={c.key} className="min-w-0 break-words">
                      {c.hideLabelInCard ? null : <span className="sr-only">{c.header}: </span>}
                      {c.cell(row)}
                    </div>
                  ))}
                </div>
              ) : null}
              {low.length ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {low.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{c.header}</dt>
                      <dd className="break-words">{c.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {actions ? <div className="flex flex-wrap gap-2 border-t pt-3">{actions(row)}</div> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
