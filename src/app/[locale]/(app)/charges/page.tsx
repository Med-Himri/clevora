import { CalendarIcon, CalendarRangeIcon, CalendarSearchIcon, CarIcon, ChevronLeftIcon, ChevronRightIcon, MegaphoneIcon, RepeatIcon, SearchIcon, SearchXIcon, StoreIcon, WalletIcon } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app/empty-state";
import { ExcelExport } from "@/components/app/excel-export";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList, type Column } from "@/components/app/responsive-list";
import { SearchBar } from "@/components/app/search-bar";
import { SegmentTabs } from "@/components/app/segment-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/fields";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth/session";
import { dayKey, formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { periodOf, shiftMonth } from "@/lib/period";
import { ChargeRowActions } from "./components/charge-row-actions";
import { ChargeSheet, type ChargeRow } from "./components/charge-sheet";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("charges") };
}

/** Charges — admins only (staff never see money; RLS enforces it too). */
export default async function ChargesPage({ searchParams }: PageProps<"/[locale]/charges">) {
  const { agency } = await requireRole(["admin"]);
  const sp = await searchParams;
  const today = dayKey(new Date());
  const current = today.slice(0, 7);
  const period = periodOf(sp, today);
  const { from, to } = period;
  const t = await getTranslations("charges");
  const tf = await getTranslations("fleet");
  const format = await getFormatter();
  const supabase = await createClient();
  const [{ data }, { data: cars }] = await Promise.all([
    supabase
      .from("charges")
      .select("id, date, category, amount, vehicle_id, campaign_name, note, is_recurring, recurring_parent_id, receipt_path, vehicle:vehicles!charges_agency_id_vehicle_id_fkey(plate, brand_model)")
      .eq("agency_id", agency.id)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("vehicles").select("id, plate, brand_model").eq("agency_id", agency.id).order("brand_model"),
  ]);
  const all = data ?? [];
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const needle = q.toLowerCase();
  const rows = q
    ? all.filter((r) =>
        [tf(`chargeCategories.${r.category}`), r.campaign_name, r.note, r.vehicle?.brand_model, r.vehicle?.plate, String(r.amount)]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(needle)),
      )
    : all;
  const carOptions = (cars ?? []).map((c) => ({ id: c.id, label: `${c.brand_model} · ${c.plate}` }));
  const sum = (list: typeof all) => list.reduce((s, r) => s + Number(r.amount), 0);
  const ads = all.filter((r) => r.category === "publicite");
  const campaigns = [...new Set(ads.map((r) => r.campaign_name).filter(Boolean))] as string[];
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    {
      key: "date",
      header: t("date"),
      priority: "primary",
      nowrap: true,
      className: "w-36",
      // Phones: a narrow "21/11" column
      phone: "column",
      phoneOrder: 1,
      phoneCell: (r) => <Ltr className="font-semibold">{formatDate(r.date).slice(0, 5)}</Ltr>,
      cell: (r) => (
        <span className="flex flex-col leading-tight">
          <Ltr>{formatDate(r.date)}</Ltr>
          <span className="text-xs font-normal text-muted-foreground first-letter:uppercase">{format.dateTime(new Date(`${r.date}T12:00:00Z`), { weekday: "long" })}</span>
        </span>
      ),
    },
    {
      key: "category",
      header: t("category"),
      priority: "high",
      hideLabelInCard: true,
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge variant={r.category === "publicite" ? "info" : r.category === "reparation" ? "warning" : "neutral"}>{tf(`chargeCategories.${r.category}`)}</Badge>
          {r.is_recurring || r.recurring_parent_id ? (
            <Badge variant="neutral" title={t("monthly")}>
              <RepeatIcon aria-hidden />
              {t("monthly")}
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: "for",
      header: t("for"),
      priority: "high",
      // Phones: the car (or « Agence ») is the title of the row
      phone: "title",
      cell: (r) =>
        r.vehicle ? (
          <span className="flex flex-col leading-tight">
            <span>{r.vehicle.brand_model}</span>
            <Ltr className="text-xs text-muted-foreground">{r.vehicle.plate}</Ltr>
          </span>
        ) : (
          <span className="text-muted-foreground">{t("forAgency")}</span>
        ),
    },
    {
      key: "detail",
      header: t("detail"),
      priority: "low",
      phoneCell: (r) => (r.campaign_name || r.note ? <span className="font-normal text-muted-foreground" dir="auto">{[r.campaign_name, r.note].filter(Boolean).join(" · ")}</span> : null),
      cell: (r) => (r.campaign_name || r.note ? <span className="text-muted-foreground" dir="auto">{[r.campaign_name, r.note].filter(Boolean).join(" · ")}</span> : <span className="text-muted-foreground">—</span>),
    },
    { key: "amount", header: t("amount"), priority: "high", align: "end", phone: "column", phoneOrder: 2, cell: (r) => <Ltr className="font-bold tabular-nums">{formatMoney(r.amount)}</Ltr> },
  ];
  const day = (d: string) => new Date(`${d}T12:00:00Z`);
  const periodLabel =
    period.kind === "month"
      ? format.dateTime(day(from), { month: "long", year: "numeric" })
      : period.kind === "year"
        ? String(period.year)
        : t("rangeLabel", { from: formatDate(from), to: formatDate(to) });
  const q2 = q ? `&q=${encodeURIComponent(q)}` : "";
  const prev = period.kind === "month" ? `/charges?month=${shiftMonth(period.month, -1)}${q2}` : period.kind === "year" ? `/charges?year=${period.year - 1}${q2}` : null;
  const next = period.kind === "month" ? `/charges?month=${shiftMonth(period.month, 1)}${q2}` : period.kind === "year" ? `/charges?year=${period.year + 1}${q2}` : null;
  // Whole year: the total of each month (tap one to see it)
  const byMonth =
    period.kind === "year"
      ? Array.from({ length: 12 }, (_, i) => {
          const key = `${period.year}-${String(i + 1).padStart(2, "0")}`;
          return { key, label: format.dateTime(day(`${key}-01`), { month: "short" }), total: sum(rows.filter((r) => r.date.startsWith(key))) };
        })
      : [];
  const maxMonth = Math.max(1, ...byMonth.map((b) => b.total));
  const fileSuffix = period.kind === "month" ? period.month : period.kind === "year" ? String(period.year) : `${from}_${to}`;

  return (
    <>
      <PageHeader icon={WalletIcon}
        title={t("title")}
        action={
          <>
            <ExcelExport
              fileName={`charges-${fileSuffix}.xlsx`}
              label={t("export")}
              header={[t("date"), t("category"), t("for"), t("campaign"), t("note"), t("amount")]}
              rows={rows.map((r) => [formatDate(r.date), tf(`chargeCategories.${r.category}`), r.vehicle ? `${r.vehicle.brand_model} ${r.vehicle.plate}` : t("forAgency"), r.campaign_name, r.note, Number(r.amount)])}
            />
            <ChargeSheet cars={carOptions} defaultDate={period.kind === "month" && period.month !== current ? from : undefined} />
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        {/* Period: a month, a whole year, or any dates — one segmented bar */}
        <SegmentTabs
          label={t("periodLabel")}
          active={period.kind}
          items={(
            [
              ["month", `/charges?month=${period.kind === "range" ? from.slice(0, 7) : period.kind === "year" ? (String(period.year) === current.slice(0, 4) ? current : `${period.year}-01`) : period.month}`, CalendarIcon],
              ["year", `/charges?year=${from.slice(0, 4)}`, CalendarRangeIcon],
              ["range", `/charges?from=${from}&to=${to}`, CalendarSearchIcon],
            ] as const
          ).map(([k, href, icon]) => ({ key: k, href, icon, label: t(`period.${k}`), testId: `period-${k}` }))}
        />
        {period.kind === "range" ? (
          <form method="get" className="grid grid-cols-2 items-end gap-2 rounded-xl border bg-card p-3 shadow-xs sm:flex sm:flex-wrap" data-testid="period-form">
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="ch-from">{t("from")}</Label>
              <DateInput id="ch-from" name="from" defaultValue={from} required className="sm:w-44" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="ch-to">{t("to")}</Label>
              <DateInput id="ch-to" name="to" defaultValue={to} required className="sm:w-44" />
            </div>
            {q ? <input type="hidden" name="q" value={q} /> : null}
            <Button type="submit" size="lg" className="col-span-2">
              <SearchIcon aria-hidden />
              {t("show")}
            </Button>
          </form>
        ) : (
          // ‹  Novembre 2026  ›
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border bg-card p-1.5 shadow-xs lg:min-w-80">
            <Button variant="ghost" size="icon" asChild>
              <Link href={prev!} aria-label={period.kind === "month" ? t("previousMonth") : t("previousYear")}>
                <ChevronLeftIcon className="rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
            <span className="text-center text-base font-semibold first-letter:uppercase" data-testid="charges-month">
              {periodLabel}
            </span>
            <Button variant="ghost" size="icon" asChild>
              <Link href={next!} aria-label={period.kind === "month" ? t("nextMonth") : t("nextYear")}>
                <ChevronRightIcon className="rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
          </div>
        )}
        <div className="lg:ms-auto lg:w-80">
          <SearchBar placeholder={t("search")} />
        </div>
        {period.kind === "range" ? (
          <p className="text-sm text-muted-foreground" data-testid="charges-month">
            {periodLabel}
          </p>
        ) : null}
      </div>

      {/* One summary card: the total, then how it splits (cars / agency / ads) on one bar */}
      {(() => {
        const total = sum(all);
        const parts = [
          { key: "cars", label: t("tiles.cars"), value: sum(all.filter((r) => r.vehicle_id && r.category !== "publicite")), icon: CarIcon, bar: "bg-[var(--series-1)]" },
          { key: "agency", label: t("tiles.agency"), value: sum(all.filter((r) => !r.vehicle_id && r.category !== "publicite")), icon: StoreIcon, bar: "bg-[var(--series-2)]" },
          { key: "ads", label: t("tiles.ads"), value: sum(ads), icon: MegaphoneIcon, bar: "bg-muted-foreground/60", hint: campaigns.length ? campaigns.join(", ") : undefined },
        ];
        return (
          <section className="mb-6 rounded-xl border bg-card p-4 shadow-xs sm:p-5" aria-labelledby="charges-sum">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <h2 id="charges-sum" className="text-sm font-medium text-muted-foreground">
                  {t("tiles.total")}
                </h2>
                <span className="text-3xl font-bold tracking-tight tabular-nums" data-testid="charges-total">
                  <Ltr>{formatMoney(total)}</Ltr>
                </span>
              </div>
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning" aria-hidden>
                <WalletIcon className="size-5" />
              </span>
            </div>
            <div className="mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              {total > 0
                ? parts
                    .filter((x) => x.value > 0)
                    .map((x) => <span key={x.key} className={cn("h-full first:rounded-s-full last:rounded-e-full", x.bar)} style={{ width: `${(x.value / total) * 100}%` }} />)
                : null}
            </div>
            <ul className="mt-3 divide-y">
              {parts.map((x) => (
                <li key={x.key} className="flex items-center gap-3 py-2 text-sm">
                  <span className={cn("size-2.5 shrink-0 rounded-full", x.bar)} aria-hidden />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span>{x.label}</span>
                    {x.hint ? <span className="truncate text-xs text-muted-foreground">{x.hint}</span> : null}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{total > 0 ? `${Math.round((x.value / total) * 100)} %` : ""}</span>
                  <Ltr className="font-semibold tabular-nums">{formatMoney(x.value)}</Ltr>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {period.kind === "year" && all.length ? (
        <section aria-labelledby="by-month" className="mb-6 rounded-xl border bg-card p-4" data-testid="charges-by-month">
          <h2 id="by-month" className="mb-3 font-semibold">{t("byMonth")}</h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {byMonth.map((b) => (
              <li key={b.key}>
                <Link href={`/charges?month=${b.key}`} className="flex min-h-11 flex-col gap-1 rounded-lg border p-2 hover:bg-accent" aria-label={t("seeMonth", { month: b.label })}>
                  <span className="text-xs font-medium uppercase text-muted-foreground">{b.label}</span>
                  <Ltr className="text-sm font-bold tabular-nums">{formatMoney(b.total)}</Ltr>
                  <span className="h-1.5 rounded-full bg-muted" aria-hidden>
                    <span className="block h-full rounded-full bg-primary dark:bg-ring" style={{ width: `${Math.round((b.total / maxMonth) * 100)}%` }} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {all.length === 0 ? (
        <EmptyState icon={WalletIcon} title={t("empty")} description={t("emptyBody")} />
      ) : rows.length === 0 ? (
        <EmptyState icon={SearchXIcon} title={t("noResult")} />
      ) : (
        <ResponsiveList
          testId="charges-list"
          rowTestId="charge-row"
          caption={t("title")}
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          phoneActions="column"
          footer={
            <span className="flex items-center justify-between gap-2 font-semibold">
              <span>{t("countLine", { count: rows.length })}</span>
              <Ltr className="tabular-nums">{formatMoney(sum(rows))}</Ltr>
            </span>
          }
          actions={(r, mode) => (
            <ChargeRowActions
              compact={mode === "table"}
              cars={carOptions}
              receiptPath={r.receipt_path}
              charge={{ id: r.id, date: r.date, category: r.category as ChargeRow["category"], amount: Number(r.amount), vehicle_id: r.vehicle_id, campaign_name: r.campaign_name, note: r.note, is_recurring: r.is_recurring }}
            />
          )}
        />
      )}
    </>
  );
}
