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
  /**
   * Phones and tablets, when one column of the list is a "column" (phone table):
   *  - "column": its own narrow column (a status, dates, an amount); 2 at most
   *  - "hide":   not shown (the detail page has it)
   *  - "title":  the bold title of the first column (when the "primary" column became a narrow column)
   *  - not set:  under the title in the first column (high: grey line, low: « label : value »)
   */
  phone?: "column" | "hide" | "title";
  /** A shorter cell for phones (e.g. "23/11 10:00" instead of the full date). Return null to show nothing. */
  phoneCell?: (row: T) => ReactNode;
  /** A shorter header for phones. */
  phoneHeader?: string;
  /** Order of the phone columns (lower first; default: the order of the columns). */
  phoneOrder?: number;
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
  /** Phone table: the row actions in their own narrow column at the end ("column", for one icon button) or on a line under the row (default). */
  phoneActions?: "row" | "column";
  /** Multi-select: a box per row (first column / card corner) and a "select all" box in the header. */
  select?: { cell: (row: T) => ReactNode; all: ReactNode };
} & ({ rows: T[]; groups?: never } | { groups: ListGroup<T>[]; rows?: never });

const TONE = {
  danger: "text-destructive",
  warning: "text-warning",
  default: "text-foreground",
} as const;

function GroupTitle({
  label,
  count,
  tone = "default",
}: {
  label: ReactNode;
  count: number;
  tone?: ListGroup<unknown>["tone"];
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm font-semibold",
        TONE[tone ?? "default"],
      )}
    >
      {label}
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-bold text-foreground">
        {count}
      </span>
    </span>
  );
}

/**
 * A table from 1024 px that becomes a compact list on phones and tablets —
 * never a horizontal page scroll. Rows can be grouped by urgency.
 * Works in server and client components.
 */
export function ResponsiveList<T>(props: Props<T>) {
  const {
    columns,
    rowKey,
    rowHref,
    actions,
    caption,
    testId,
    rowTestId,
    footer,
    select,
  } = props;
  const groups: ListGroup<T>[] = props.groups ?? [
    { key: "all", label: null, rows: props.rows ?? [] },
  ];
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
  const phoneTable = columns.some((c) => c.phone === "column");
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
              {select ? (
                <th scope="col" className="w-0 ps-4 pe-0 py-1">
                  {select.all}
                </th>
              ) : null}
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
              <tbody
                key={g.key}
                className="divide-y border-b last:border-b-0"
                data-group={grouped ? g.key : undefined}
              >
                {grouped ? (
                  <tr className="bg-muted/30">
                    <th
                      scope="colgroup"
                      colSpan={span}
                      className="px-4 py-2 text-start"
                    >
                      <GroupTitle
                        label={g.label}
                        count={g.rows.length}
                        tone={g.tone}
                      />
                    </th>
                  </tr>
                ) : null}
                {g.rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className={cn(
                      "relative align-middle transition-colors",
                      rowHref && "hover:bg-accent/60",
                    )}
                    data-testid={rowTestId}
                  >
                    {select ? (
                      <td className="relative z-10 w-0 ps-4 pe-0 py-1">
                        {select.cell(row)}
                      </td>
                    ) : null}
                    {columns.map((c, i) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-4 py-3",
                          c.align === "end" ? "text-end" : "text-start",
                          nowrap(c) ? "whitespace-nowrap" : "break-words",
                          c.className,
                        )}
                      >
                        {i === 0 && rowHref ? (
                          <Link
                            href={rowHref(row)}
                            className="font-semibold outline-none before:absolute before:inset-0 before:content-[''] focus-visible:before:ring-2 focus-visible:before:ring-ring focus-visible:before:ring-inset"
                          >
                            {c.cell(row)}
                          </Link>
                        ) : (
                          c.cell(row)
                        )}
                      </td>
                    ))}
                    {actions ? (
                      <td className="relative z-10 px-3 py-2 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {actions(row, "table")}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            ) : null,
          )}
        </table>
        {footer ? (
          <div className="border-t bg-muted/30 px-4 py-2.5 text-sm">
            {footer}
          </div>
        ) : null}
      </div>

      {phoneTable ? (
        <PhoneTable list={props} groups={groups} grouped={grouped} />
      ) : null}

      {/* Phone & tablet: a compact list (one block, thin separators). Each row: the title
          in bold, one grey line with the details, the amount on the end, the main action
          and a « ⋯ » menu (the compact actions), and a chevron when the row opens a page. */}
      <div
        className={cn("flex flex-col gap-5 lg:hidden", phoneTable && "hidden")}
      >
        {groups.map((g) =>
          g.rows.length ? (
            <section
              key={g.key}
              className="flex flex-col gap-2"
              data-group={grouped ? g.key : undefined}
            >
              {grouped ? (
                <div className="px-1">
                  <GroupTitle
                    label={g.label}
                    count={g.rows.length}
                    tone={g.tone}
                  />
                </div>
              ) : null}
              <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
                {g.rows.map((row) => (
                  <li
                    key={rowKey(row)}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-3 transition-colors",
                      rowHref && "active:bg-accent/70",
                    )}
                    data-testid={rowTestId}
                  >
                    {select ? (
                      <div className="relative z-10 shrink-0">
                        {select.cell(row)}
                      </div>
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 font-semibold leading-snug [&_*]:leading-snug">
                          {primary.map((c, i) =>
                            i === 0 && rowHref ? (
                              <Link
                                key={c.key}
                                href={rowHref(row)}
                                className="block min-w-0 break-words outline-none before:absolute before:inset-0 before:content-[''] focus-visible:before:ring-2 focus-visible:before:ring-ring focus-visible:before:ring-inset"
                              >
                                {c.cell(row)}
                              </Link>
                            ) : (
                              <div key={c.key} className="min-w-0 break-words">
                                {c.cell(row)}
                              </div>
                            ),
                          )}
                        </div>
                        {trailing ? (
                          <div className="shrink-0 text-end text-sm font-semibold whitespace-nowrap">
                            {trailing.cell(row)}
                          </div>
                        ) : null}
                      </div>
                      {details.length ? (
                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground [&_.font-bold]:font-semibold [&_.text-base]:text-sm">
                          {details.map((c) => (
                            <div key={c.key} className="min-w-0 break-words">
                              {c.hideLabelInCard ? null : (
                                <span className="sr-only">{c.header}: </span>
                              )}
                              {c.cell(row)}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {extra.length ? (
                        <dl className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs">
                          {extra.map((c) => (
                            <div
                              key={c.key}
                              className="flex min-w-0 items-baseline gap-1"
                            >
                              <dt className="text-muted-foreground">
                                {c.header} :
                              </dt>
                              <dd className="min-w-0 break-words font-medium [&_.text-base]:text-xs">
                                {c.cell(row)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                      {/* Actions on their own line: the text keeps the full width */}
                      {actions ? (
                        <div className="relative z-10 mt-1 flex flex-wrap items-center gap-1.5">
                          {actions(row, "table")}
                        </div>
                      ) : null}
                    </div>
                    {rowHref ? (
                      <ChevronRightIcon
                        className="size-5 shrink-0 self-center text-muted-foreground rtl:rotate-180"
                        aria-hidden
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
        {footer ? (
          <div className="rounded-xl border bg-card px-4 py-3 text-sm">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Phones and tablets: a table that fits the screen (never a sideways scroll).
 * The first column holds the title (it opens the row) with the details under it in
 * small text; 1–2 narrow columns hold what is compared at a glance (status, dates,
 * amount). Row actions sit on their own line under the row, across the full width.
 * Built as a CSS grid with subgrid rows, so a row keeps its cells and its actions
 * together while the columns stay aligned from row to row.
 */
function PhoneTable<T>({
  list,
  groups,
  grouped,
}: {
  list: Props<T>;
  groups: ListGroup<T>[];
  grouped: boolean;
}) {
  const {
    columns,
    rowKey,
    rowHref,
    actions,
    caption,
    rowTestId,
    footer,
    select,
  } = list;
  const cols = columns
    .filter((c) => c.phone === "column")
    .sort((a, b) => (a.phoneOrder ?? 0) - (b.phoneOrder ?? 0))
    .slice(0, 2);
  const main = columns.filter(
    (c) => c.phone !== "column" && c.phone !== "hide",
  );
  const primary = main.filter(
    (c) => c.phone === "title" || c.priority === "primary",
  );
  const details = main.filter(
    (c) => c.phone !== "title" && c.priority === "high",
  );
  const extra = main.filter((c) => c.phone !== "title" && c.priority === "low");
  const show = (c: Column<T>, row: T) => (c.phoneCell ?? c.cell)(row);
  const line = "col-span-full grid grid-cols-subgrid";
  // Columns: the title takes the room left (at least 7.5rem); the others fit their content up to 6.5rem, then wrap
  // One icon action can sit in its own narrow column at the end instead of a line under the row
  const sideActions = list.phoneActions === "column" && Boolean(actions);
  const colCell = (c: Column<T>, i: number) =>
    cn(
      "min-w-0 px-1.5",
      i === cols.length - 1 && !sideActions && "pe-2.5",
      c.align === "end" ? "text-end" : "text-start",
    );

  return (
    <div
      className="overflow-hidden rounded-xl border bg-card shadow-xs lg:hidden"
      data-testid="phone-table"
    >
      <div
        role="table"
        aria-label={caption}
        className="grid text-sm"
        style={{
          gridTemplateColumns: `minmax(7.5rem,1fr) repeat(${cols.length}, fit-content(6.5rem))${sideActions ? " auto" : ""}`,
        }}
      >
        <div role="rowgroup" className={cn(line, "bg-muted/50")}>
          <div role="row" className={line}>
            <div
              role="columnheader"
              className="flex items-center gap-2 ps-2.5 pe-1.5 py-2 text-start text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {/* "Select all" sits in the header, like on the laptop table */}
              {select ? (
                <span className="-my-2 shrink-0 normal-case">{select.all}</span>
              ) : null}
              {primary[0]
                ? (primary[0].phoneHeader ?? primary[0].header)
                : null}
            </div>
            {cols.map((c, i) => (
              <div
                key={c.key}
                role="columnheader"
                className={cn(
                  colCell(c, i),
                  "py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
                )}
              >
                {c.phoneHeader ?? c.header}
              </div>
            ))}
            {sideActions ? (
              <div role="columnheader">
                <span className="sr-only">Actions</span>
              </div>
            ) : null}
          </div>
        </div>
        {groups.map((g) =>
          g.rows.length ? (
            <div
              key={g.key}
              role="rowgroup"
              className={line}
              data-group={grouped ? g.key : undefined}
            >
              {grouped ? (
                <div role="row" className={cn(line, "border-t bg-muted/30")}>
                  <div role="rowheader" className="col-span-full px-2.5 py-2">
                    <GroupTitle
                      label={g.label}
                      count={g.rows.length}
                      tone={g.tone}
                    />
                  </div>
                </div>
              ) : null}
              {g.rows.map((row) => {
                const lows = extra
                  .map((c) => ({ c, v: show(c, row) }))
                  .filter(
                    (x) => x.v !== null && x.v !== undefined && x.v !== false,
                  );
                const below = Boolean((actions && !sideActions) || select);
                return (
                  <div
                    key={rowKey(row)}
                    role="row"
                    className={cn(
                      line,
                      "relative border-t pt-3 transition-colors",
                      below ? "pb-2" : "pb-3",
                      rowHref && "active:bg-accent/70",
                    )}
                    data-testid={rowTestId}
                  >
                    <div
                      role="cell"
                      className="flex min-w-0 flex-col gap-0.5 ps-2.5 pe-1.5 [overflow-wrap:anywhere]"
                    >
                      {primary.map((c, i) =>
                        i === 0 && rowHref ? (
                          <Link
                            key={c.key}
                            href={rowHref(row)}
                            className="font-semibold leading-snug outline-none before:absolute before:inset-0 before:content-[''] focus-visible:before:ring-2 focus-visible:before:ring-ring focus-visible:before:ring-inset [&_*]:leading-snug"
                          >
                            {show(c, row)}
                          </Link>
                        ) : (
                          <div
                            key={c.key}
                            className={cn(
                              "leading-snug",
                              i === 0 && "font-semibold",
                            )}
                          >
                            {show(c, row)}
                          </div>
                        ),
                      )}
                      {details.map((c) => (
                        <div
                          key={c.key}
                          className="text-xs text-muted-foreground [&_.font-bold]:font-semibold [&_.text-base]:text-xs [&_.text-sm]:text-xs"
                        >
                          <span className="sr-only">{c.header} : </span>
                          {show(c, row)}
                        </div>
                      ))}
                      {lows.map(({ c, v }) => (
                        // Inline text, so a long label wraps like a sentence instead of pushing the columns
                        <p
                          key={c.key}
                          className="text-xs [&_.text-base]:text-xs [&_.text-sm]:text-xs"
                        >
                          <span className="text-muted-foreground">
                            {c.phoneHeader ?? c.header} :{" "}
                          </span>
                          <span className="font-medium">{v}</span>
                        </p>
                      ))}
                    </div>
                    {cols.map((c, i) => (
                      <div
                        key={c.key}
                        role="cell"
                        className={cn(
                          colCell(c, i),
                          "text-xs [&_.text-base]:text-sm [&_.text-sm]:text-xs",
                          // Numbers stay on one line; words (a status) may wrap so the table always fits
                          (c.nowrap ?? c.align === "end")
                            ? "whitespace-nowrap"
                            : "[&_.whitespace-nowrap]:whitespace-normal",
                        )}
                      >
                        <span className="sr-only">{c.header} : </span>
                        {show(c, row)}
                      </div>
                    ))}
                    {sideActions && actions ? (
                      <div role="cell" className="relative z-10 -my-1.5 ps-1 pe-2">
                        {actions(row, "table")}
                      </div>
                    ) : null}
                    {below ? (
                      // The row's select box and its actions, on one line across the full width
                      <div
                        role="cell"
                        className="relative z-10 col-span-full flex flex-wrap items-center gap-1.5 px-2.5 pt-2"
                      >
                        {select ? (
                          <div className="shrink-0">
                            {select.cell(row)}
                          </div>
                        ) : null}
                        {actions && !sideActions ? actions(row, "table") : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null,
        )}
      </div>
      {footer ? (
        <div className="border-t bg-muted/30 px-3 py-2.5 text-sm">{footer}</div>
      ) : null}
    </div>
  );
}
