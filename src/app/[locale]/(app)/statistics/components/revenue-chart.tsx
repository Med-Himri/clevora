"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatMoney } from "@/lib/format";
import type { Bucket } from "@/lib/stats";

/**
 * Income (rent + damage fees) and charges per day or per month: two series in
 * validated colours (--series-1 / --series-2), a legend above, thin bars with
 * rounded tops and a 2px gap, recessive grid, partial periods lighter, and a
 * tooltip with income · charges · profit for the period. The table view sits
 * under the chart on the page.
 */
export function RevenueChart({ buckets, labels }: { buckets: Bucket[]; labels: Record<string, string> }) {
  const t = useTranslations("statistics");
  const rtl = useLocale() === "ar";
  const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
  const data = buckets.map((b) => ({ ...b, income: Math.round((b.revenue + b.damages) * 100) / 100, label: labels[b.key] ?? b.key }));
  const many = data.length > 20;

  const TooltipBox = ({ active, payload }: TooltipContentProps<ValueType, NameType>) => {
    const b = active && (payload?.[0]?.payload as (typeof data)[number] | undefined);
    if (!b) return null;
    return (
      <div className="min-w-44 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg">
        <p className="mb-1 font-semibold">
          {b.label}
          {b.partial ? <span className="ms-1 text-xs font-normal text-muted-foreground">({t("partial")})</span> : null}
        </p>
        <p className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-sm bg-[var(--series-1)]" aria-hidden />
            {t("income")}
          </span>
          <bdi dir="ltr" className="font-semibold">{formatMoney(b.income)}</bdi>
        </p>
        <p className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-sm bg-[var(--series-2)]" aria-hidden />
            {t("charges")}
          </span>
          <bdi dir="ltr">{formatMoney(b.charges)}</bdi>
        </p>
        <p className="mt-1 flex items-center justify-between gap-3 border-t pt-1">
          <span className="text-muted-foreground">{t("net")}</span>
          <bdi dir="ltr" className={b.net < 0 ? "font-semibold text-destructive" : "font-semibold"}>{formatMoney(b.net)}</bdi>
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Legend: two series, so it is always shown (colour is never the only cue) */}
      <ul className="flex flex-wrap items-center gap-4 text-sm" aria-hidden>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[var(--series-1)]" />
          {t("income")}
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[var(--series-2)]" />
          {t("charges")}
        </li>
      </ul>
      <div className="h-72 w-full" data-testid="revenue-chart" role="img" aria-label={t("chartLabel")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap={many ? 2 : "22%"} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis dataKey="label" reversed={rtl} tickLine={false} axisLine={{ stroke: "var(--border)" }} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} interval="preserveStartEnd" minTickGap={12} />
            <YAxis orientation={rtl ? "right" : "left"} tickLine={false} axisLine={false} width={48} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(v: number) => compact.format(v)} />
            <Tooltip content={TooltipBox} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
            <Bar dataKey="income" name={t("income")} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
              {data.map((b) => (
                <Cell key={b.key} fill="var(--series-1)" fillOpacity={b.partial ? 0.45 : 1} />
              ))}
            </Bar>
            <Bar dataKey="charges" name={t("charges")} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
              {data.map((b) => (
                <Cell key={b.key} fill="var(--series-2)" fillOpacity={b.partial ? 0.45 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
