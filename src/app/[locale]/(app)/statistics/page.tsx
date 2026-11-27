import { BarChart3Icon, BanknoteIcon, CalendarDaysIcon, CalendarIcon, CalendarRangeIcon, CalendarSearchIcon, CarFrontIcon, CarIcon, HandCoinsIcon, FileTextIcon, PercentIcon, ReceiptIcon, TrendingDownIcon, TrendingUpIcon, TrophyIcon, WalletIcon } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { ExcelExport } from "@/components/app/excel-export";
import { Ltr } from "@/components/app/ltr";
import { SegmentTabs } from "@/components/app/segment-tabs";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList, type Column } from "@/components/app/responsive-list";
import { pctChange, StatTile } from "@/components/app/stat-tile";
import { Meter, RankBars } from "@/components/app/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/ui/fields";
import { Label } from "@/components/ui/label";
import { requireRole } from "@/lib/auth/session";
import { dayKey, formatDate, formatMoney } from "@/lib/format";
import { occupancy, occupancyTone, PERIODS, resolvePeriod, toBuckets, type DailyRow } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/app/status-pill";
import { summarize } from "@/lib/fleet/finance";
import { getProfitability } from "@/lib/fleet/finance-query";
import { getBalances } from "../balances/queries";
import { RevenueChartLazy } from "./components/revenue-chart-lazy";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("statistics") };
}

/** Statistiques — admins only (the SQL functions refuse anyone else too). */
export default async function StatisticsPage({ searchParams }: PageProps<"/[locale]/statistics">) {
  const { agency } = await requireRole(["admin"]);
  const sp = await searchParams;
  const today = dayKey(new Date());
  const { period, from, to } = resolvePeriod(sp, today);
  const t = await getTranslations("statistics");
  const format = await getFormatter();
  const supabase = await createClient();
  // The previous period of the same length, for the ▲ / ▼ %
  const spanDays = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
  const prevTo = new Date(Date.parse(`${from}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  const prevFrom = new Date(Date.parse(`${from}T12:00:00Z`) - spanDays * 86_400_000).toISOString().slice(0, 10);
  const [{ data: daily }, { data: perCar }, { count: carCount }, credit, profit, { data: prevDaily }] = await Promise.all([
    supabase.rpc("stats_daily", { p_agency: agency.id, p_from: from, p_to: to }),
    supabase.rpc("stats_by_vehicle", { p_agency: agency.id, p_from: from, p_to: to }),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("agency_id", agency.id).eq("status", "active"),
    // Crédit clients: money still owed today (not limited to the period)
    getBalances(supabase, agency.id),
    // Rentabilité depuis l'achat (all time, not the period)
    getProfitability(supabase, agency.id),
    supabase.rpc("stats_daily", { p_agency: agency.id, p_from: prevFrom, p_to: prevTo }),
  ]);
  const prevRows = prevDaily ?? [];
  const prev = {
    revenue: prevRows.reduce((x, r) => x + Number(r.revenue), 0),
    damages: prevRows.reduce((x, r) => x + Number(r.damages), 0),
    charges: prevRows.reduce((x, r) => x + Number(r.charges), 0),
  };
  const profitRows = profit
    .filter((p) => p.status !== "sold")
    .map((p) => ({ ...p, s: summarize(p) }))
    .sort((a, b) => a.s.monthResult - b.s.monthResult);
  const withoutPurchase = (perCar ?? []).filter((c) => !profit.some((p) => p.vehicle_id === c.vehicle_id)).length;
  type ProfitRow = (typeof profitRows)[number];
  /** Phones: one quiet line « Revenus 12 000 MAD · Charges 3 000 MAD · Dégâts 500 MAD » under the car. */
  const moneyLine = (items: Array<[string, number, boolean?]>) => (
    <span className="flex flex-wrap gap-x-2.5 gap-y-0.5">
      {items
        .filter(([, v, hideZero]) => !(hideZero && v === 0))
        .map(([label, v]) => (
          <span key={label} className="whitespace-nowrap">
            {label} <Ltr className="font-semibold text-foreground">{formatMoney(v)}</Ltr>
          </span>
        ))}
    </span>
  );
  const profitColumns: Column<ProfitRow>[] = [
    {
      key: "car",
      header: t("car"),
      priority: "primary",
      cell: (c) => (
        <span className="flex flex-col">
          <span>{c.brand_model}</span>
          <Ltr className="text-xs font-normal text-muted-foreground">{c.plate}</Ltr>
        </span>
      ),
    },
    {
      key: "credit",
      header: t("profit.credit"),
      priority: "high",
      phone: "column",
      phoneOrder: 1,
      cell: (c) =>
        c.mode === "cash" ? (
          <StatusPill tone="neutral" label={t("profit.cash")} />
        ) : c.s.creditRunning ? (
          <StatusPill tone="info" label={t("profit.monthsLeft", { count: c.s.monthsLeft })} detail={<Ltr>{formatMoney(c.credit_left)}</Ltr>} />
        ) : (
          <StatusPill tone="success" label={t("profit.creditDone")} />
        ),
    },
    {
      key: "rent",
      header: t("profit.rentMonth"),
      priority: "high",
      align: "end",
      cell: (c) => <Ltr>{formatMoney(c.revenue_month)}</Ltr>,
      // Phones: this month's money on one quiet line under the car
      phoneCell: (c) =>
        moneyLine([
          [t("profit.rentMonth"), c.revenue_month],
          [t("profit.damagesMonth"), c.damages_month, true],
          [t("profit.chargesMonth"), c.charges_month],
          [t("profit.creditMonth"), c.credit_month, true],
        ]),
    },
    { key: "damagesMonth", header: t("profit.damagesMonth"), priority: "low", align: "end", phone: "hide", cell: (c) => (c.damages_month > 0 ? <Ltr>{formatMoney(c.damages_month)}</Ltr> : <span className="text-muted-foreground">—</span>) },
    { key: "charges", header: t("profit.chargesMonth"), priority: "low", align: "end", phone: "hide", cell: (c) => <Ltr>{formatMoney(c.charges_month)}</Ltr> },
    { key: "creditMonth", header: t("profit.creditMonth"), priority: "low", align: "end", phone: "hide", cell: (c) => <Ltr>{formatMoney(c.credit_month)}</Ltr> },
    {
      key: "month",
      header: t("profit.resultMonth"),
      priority: "high",
      align: "end",
      phone: "column",
      phoneOrder: 2,
      cell: (c) => <Ltr className={cn("font-bold", c.s.monthResult < 0 ? "text-destructive" : "text-success")}>{formatMoney(c.s.monthResult)}</Ltr>,
    },
    {
      key: "result",
      header: t("profit.result"),
      priority: "low",
      align: "end",
      cell: (c) => <Ltr className={cn("font-semibold", c.s.result < 0 ? "text-destructive" : "text-success")}>{formatMoney(c.s.result)}</Ltr>,
    },
  ];
  const rows = (daily ?? []) as DailyRow[];
  const buckets = toBuckets(rows, from, to, today);
  const days = rows.length;
  const revenue = buckets.reduce((s, b) => s + b.revenue, 0);
  const charges = buckets.reduce((s, b) => s + b.charges, 0);
  // Damage fees kept at return: income on their own, added to the profit
  const damages = buckets.reduce((s, b) => s + b.damages, 0);
  const rentedDays = buckets.reduce((s, b) => s + b.rentedDays, 0);
  const net = revenue + damages - charges;
  const occupancyPct = occupancy(rentedDays, carCount ?? 0, days);
  const cars = (perCar ?? [])
    .map((c) => {
      const rev = Number(c.revenue);
      const ch = Number(c.charges);
      const dmg = Number(c.damages);
      return { ...c, revenue: rev, charges: ch, damages: dmg, net: rev + dmg - ch, occupancy: occupancy(c.rented_days, 1, days) };
    })
    .sort((a, b) => b.net - a.net);
  const best = cars.find((c) => c.revenue > 0);
  const labels = Object.fromEntries(
    buckets.map((b) => [
      b.key,
      b.key.length === 7
        ? format.dateTime(new Date(`${b.from}T12:00:00Z`), { month: "short", year: "2-digit" })
        : format.dateTime(new Date(`${b.from}T12:00:00Z`), { day: "2-digit", month: "2-digit" }),
    ]),
  );

  const rank = new Map(cars.map((c, i) => [c.vehicle_id, i + 1]));
  const columns: Column<(typeof cars)[number]>[] = [
    {
      key: "car",
      header: t("car"),
      priority: "primary",
      cell: (c) => <span>{c.brand_model} <Ltr className="text-sm font-normal text-muted-foreground">{c.plate}</Ltr></span>,
      // Phones: its rank, the name and the plate
      phoneCell: (c) => (
        <span className="flex items-start gap-2">
          <span className={cn("mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums", rank.get(c.vehicle_id) === 1 && c.net > 0 ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground")}>
            {rank.get(c.vehicle_id)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span>{c.brand_model}</span>
            <Ltr className="text-xs font-normal text-muted-foreground">{c.plate}</Ltr>
          </span>
        </span>
      ),
    },
    {
      key: "net",
      header: t("net"),
      phoneHeader: t("short.net"),
      priority: "high",
      align: "end",
      phone: "column",
      phoneOrder: 2,
      cell: (c) => <Ltr className={cn("font-bold", c.net < 0 && "text-destructive")}>{formatMoney(c.net)}</Ltr>,
      phoneCell: (c) => <Ltr className={cn("text-sm font-bold", c.net < 0 ? "text-destructive" : c.net > 0 && "text-success")}>{formatMoney(c.net)}</Ltr>,
    },
    {
      key: "occupancy",
      header: t("occupancy"),
      phoneHeader: t("short.occupancy"),
      priority: "high",
      hideLabelInCard: true,
      phone: "column",
      phoneOrder: 1,
      cell: (c) => <Badge variant={occupancyTone(c.occupancy)}>{t("occupancyValue", { pct: c.occupancy })}</Badge>,
      // Phones: the %, a thin bar, and the days rented
      phoneCell: (c) => (
        <span className="flex w-16 flex-col gap-1">
          <span className="text-sm font-bold tabular-nums">{c.occupancy} %</span>
          <Meter pct={c.occupancy} label={`${t("occupancy")} ${c.occupancy} %`} />
          <span className="text-[11px] text-muted-foreground">{t("short.days", { count: c.rented_days })}</span>
        </span>
      ),
    },
    {
      key: "revenue",
      header: t("revenue"),
      priority: "high",
      align: "end",
      cell: (c) => <Ltr>{formatMoney(c.revenue)}</Ltr>,
      phoneCell: (c) => moneyLine([[t("short.revenue"), c.revenue], [t("short.charges"), c.charges], [t("short.damages"), c.damages, true]]),
    },
    { key: "damages", header: t("damages"), priority: "low", align: "end", phone: "hide", cell: (c) => (c.damages > 0 ? <Ltr>{formatMoney(c.damages)}</Ltr> : <span className="text-muted-foreground">—</span>) },
    { key: "charges", header: t("carCharges"), priority: "low", align: "end", phone: "hide", cell: (c) => <Ltr>{formatMoney(c.charges)}</Ltr> },
    { key: "days", header: t("daysRented"), priority: "low", align: "end", phone: "hide", cell: (c) => <Ltr>{c.rented_days}</Ltr> },
  ];
  const qs = `from=${from}&to=${to}`;

  return (
    <>
      <PageHeader icon={BarChart3Icon}
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <>
            <ExcelExport
              fileName={`statistiques-${from}-${to}.xlsx`}
              label={t("exportExcel")}
              header={[t("periodColumn"), t("revenue"), t("damages"), t("charges"), t("net"), t("daysRented")]}
              rows={[
                ...buckets.map((b) => [labels[b.key], b.revenue, b.damages, b.charges, b.net, b.rentedDays]),
                [],
                [t("car"), t("revenue"), t("damages"), t("carCharges"), t("net"), t("daysRented"), t("occupancy")],
                ...cars.map((c) => [`${c.brand_model} ${c.plate}`, c.revenue, c.damages, c.charges, c.net, c.rented_days, `${c.occupancy} %`]),
              ]}
            />
            <Button variant="outline" size="lg" asChild>
              <a href={`/api/statistics/pdf?${qs}`} target="_blank" rel="noopener">
                <FileTextIcon className="text-destructive" aria-hidden />
                {t("exportPdf")}
              </a>
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <SegmentTabs
          label={t("periodLabel")}
          active={period}
          items={PERIODS.map((p) => ({
            key: p,
            href: p === "custom" ? `/statistics?period=custom&${qs}` : `/statistics?period=${p}`,
            label: t(`periodsShort.${p}`),
            icon: p === "months" ? CalendarRangeIcon : p === "days" ? CalendarIcon : CalendarSearchIcon,
          }))}
        />
        {period === "custom" ? (
          <form method="get" className="grid grid-cols-2 items-end gap-2 rounded-xl border bg-card p-3 shadow-xs sm:flex sm:flex-wrap">
            <input type="hidden" name="period" value="custom" />
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="stats-from">{t("from")}</Label>
              <DateInput id="stats-from" name="from" defaultValue={from} required className="sm:w-44" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="stats-to">{t("to")}</Label>
              <DateInput id="stats-to" name="to" defaultValue={to} required className="sm:w-44" />
            </div>
            <Button type="submit" size="lg" className="col-span-2">
              <CalendarDaysIcon aria-hidden />
              {t("apply")}
            </Button>
          </form>
        ) : null}
        {/* The dates of the period, written once, clearly */}
        <p className="flex items-center gap-2 self-start rounded-lg bg-muted/60 px-3 py-2 text-sm lg:self-center" data-testid="stats-period">
          <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">{t("period")}</span>
          <Ltr className="font-semibold">{formatDate(from)}</Ltr>
          <span aria-hidden>→</span>
          <span className="sr-only">–</span>
          <Ltr className="font-semibold">{formatDate(to)}</Ltr>
        </p>
      </div>

      {/* The money of the period, each with its change versus the previous period of the same length */}
      <ul className="mb-3 grid grid-cols-2 gap-3 xl:grid-cols-4" data-testid="stats-kpis">
        <li>
          <StatTile label={t("revenue")} value={<Ltr>{formatMoney(revenue)}</Ltr>} icon={WalletIcon} tone="success" testId="stats-revenue" delta={{ pct: pctChange(revenue, prev.revenue), label: t("vsPrevious") }} />
        </li>
        <li>
          <StatTile label={t("damages")} value={<Ltr>{formatMoney(damages)}</Ltr>} hint={t("damagesHint")} icon={CarFrontIcon} tone="info" testId="stats-damages" delta={{ pct: pctChange(damages, prev.damages), label: t("vsPrevious") }} />
        </li>
        <li>
          <StatTile label={t("charges")} value={<Ltr>{formatMoney(charges)}</Ltr>} icon={ReceiptIcon} tone="warning" testId="stats-charges" delta={{ pct: pctChange(charges, prev.charges), goodWhenUp: false, label: t("vsPrevious") }} />
        </li>
        <li>
          <StatTile
            highlight={net >= 0}
            label={t("net")}
            value={<Ltr className={net < 0 ? "text-destructive" : undefined}>{formatMoney(net)}</Ltr>}
            icon={net < 0 ? TrendingDownIcon : TrendingUpIcon}
            tone={net < 0 ? "danger" : "success"}
            testId="stats-net"
            delta={{ pct: pctChange(net, prev.revenue + prev.damages - prev.charges), label: t("vsPrevious") }}
          />
        </li>
      </ul>
      <ul className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <li>
          <StatTile
            label={t("credit")}
            value={<Ltr>{formatMoney(credit.reduce((x, r) => x + r.balance, 0))}</Ltr>}
            hint={t("creditHint", { count: credit.length })}
            icon={HandCoinsIcon}
            tone={credit.length ? "danger" : "success"}
            href="/balances"
            testId="stats-credit"
          />
        </li>
        <li>
          <StatTile label={t("occupancy")} value={<Ltr>{occupancyPct} %</Ltr>} hint={t("daysRentedHint", { count: rentedDays })} icon={PercentIcon} tone="info" testId="stats-occupancy">
            <Meter pct={occupancyPct} label={t("occupancy")} />
          </StatTile>
        </li>
        <li>
          <StatTile label={t("daysRented")} value={rentedDays} icon={CalendarDaysIcon} />
        </li>
        <li>
          <StatTile label={t("bestCar")} value={<span className="text-lg sm:text-xl">{best ? best.brand_model : "—"}</span>} hint={best ? <Ltr>{best.plate}</Ltr> : undefined} icon={TrophyIcon} tone="success" />
        </li>
      </ul>

      <div className="mb-8 grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card className="min-w-0 shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-info-soft text-info" aria-hidden>
              <BarChart3Icon className="size-5" />
            </span>
            {buckets[0]?.key.length === 7 ? t("revenueByMonth") : t("revenueByDay")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChartLazy buckets={buckets} labels={labels} />
          <details className="mt-3 text-sm">
            <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-muted-foreground">{t("showTable")}</summary>
            <table className="mt-2 w-full text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th scope="col" className="py-1 text-start font-medium">{t("periodColumn")}</th>
                  <th scope="col" className="py-1 text-end font-medium">{t("revenue")}</th>
                  <th scope="col" className="py-1 text-end font-medium">{t("damages")}</th>
                  <th scope="col" className="py-1 text-end font-medium">{t("charges")}</th>
                  <th scope="col" className="py-1 text-end font-medium">{t("net")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {buckets.map((b) => (
                  <tr key={b.key}>
                    <td className="py-1">{labels[b.key]}{b.partial ? ` (${t("partial")})` : ""}</td>
                    <td className="py-1 text-end"><Ltr>{formatMoney(b.revenue)}</Ltr></td>
                    <td className="py-1 text-end"><Ltr>{formatMoney(b.damages)}</Ltr></td>
                    <td className="py-1 text-end"><Ltr>{formatMoney(b.charges)}</Ltr></td>
                    <td className="py-1 text-end"><Ltr>{formatMoney(b.net)}</Ltr></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </CardContent>
      </Card>

      {/* Which cars make the most money in the period (profit = income − their own charges) */}
      <Card className="min-w-0 shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-success-soft text-success" aria-hidden>
              <TrophyIcon className="size-5" />
            </span>
            {t("ranking")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("rankingHint")}</p>
        </CardHeader>
        <CardContent>
          {cars.some((c) => c.revenue || c.charges || c.damages) ? (
            <RankBars
              testId="stats-ranking"
              rows={cars.slice(0, 8).map((c) => ({ key: c.vehicle_id, label: c.brand_model, sub: <Ltr>{c.plate}</Ltr>, value: c.net, display: formatMoney(c.net) }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("rankingEmpty")}</p>
          )}
        </CardContent>
      </Card>
      </div>

      <section aria-labelledby="perf-title">
        <h2 id="perf-title" className="mb-1 flex items-center gap-2 text-xl font-bold">
          <CarIcon className="size-5 text-muted-foreground" aria-hidden />
          {t("perCar")}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("perCarHint")}</p>
        <ResponsiveList rows={cars} columns={columns} rowKey={(c) => c.vehicle_id} rowHref={(c) => `/fleet/${c.vehicle_id}`} caption={t("perCar")} testId="per-car" />
      </section>

      <section aria-labelledby="profit-title" className="mt-8">
        <h2 id="profit-title" className="mb-1 flex items-center gap-2 text-xl font-bold">
          <BanknoteIcon className="size-5 text-muted-foreground" aria-hidden />
          {t("profit.title")}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("profit.hint")}</p>
        {profitRows.length ? (
          <ResponsiveList rows={profitRows} columns={profitColumns} rowKey={(c) => c.vehicle_id} rowHref={(c) => `/fleet/${c.vehicle_id}`} caption={t("profit.title")} testId="profit-list" rowTestId="profit-row" />
        ) : null}
        {withoutPurchase ? (
          <p className="mt-3 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground" data-testid="profit-missing">
            {t("profit.missing", { count: withoutPurchase })}
          </p>
        ) : null}
      </section>
    </>
  );
}
