import { CarIcon, ChevronLeftIcon, ChevronRightIcon, MegaphoneIcon, RepeatIcon, SearchXIcon, StoreIcon, WalletIcon } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app/empty-state";
import { ExcelExport } from "@/components/app/excel-export";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList, type Column } from "@/components/app/responsive-list";
import { SearchBar } from "@/components/app/search-bar";
import { StatTile } from "@/components/app/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth/session";
import { dayKey, formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ChargeRowActions } from "./components/charge-row-actions";
import { ChargeSheet, type ChargeRow } from "./components/charge-sheet";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("charges") };
}

function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** Charges — admins only (staff never see money; RLS enforces it too). */
export default async function ChargesPage({ searchParams }: PageProps<"/[locale]/charges">) {
  const { agency } = await requireRole(["admin"]);
  const sp = await searchParams;
  const current = dayKey(new Date()).slice(0, 7);
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : current;
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
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
      cell: (r) => (r.campaign_name || r.note ? <span className="text-muted-foreground" dir="auto">{[r.campaign_name, r.note].filter(Boolean).join(" · ")}</span> : <span className="text-muted-foreground">—</span>),
    },
    { key: "amount", header: t("amount"), priority: "high", align: "end", cell: (r) => <Ltr className="font-bold tabular-nums">{formatMoney(r.amount)}</Ltr> },
  ];
  const monthLabel = format.dateTime(new Date(`${from}T12:00:00Z`), { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader
        title={t("title")}
        action={
          <>
            <ExcelExport
              fileName={`charges-${month}.xlsx`}
              label={t("export")}
              header={[t("date"), t("category"), t("for"), t("campaign"), t("note"), t("amount")]}
              rows={rows.map((r) => [formatDate(r.date), tf(`chargeCategories.${r.category}`), r.vehicle ? `${r.vehicle.brand_model} ${r.vehicle.plate}` : t("forAgency"), r.campaign_name, r.note, Number(r.amount)])}
            />
            <ChargeSheet cars={carOptions} defaultDate={month === current ? undefined : from} />
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/charges?month=${shiftMonth(month, -1)}`} aria-label={t("previousMonth")}>
            <ChevronLeftIcon className="rtl:rotate-180" aria-hidden />
          </Link>
        </Button>
        <span className="min-w-40 text-center text-lg font-semibold first-letter:uppercase" data-testid="charges-month">{monthLabel}</span>
        <Button variant="outline" size="icon" asChild>
          <Link href={`/charges?month=${shiftMonth(month, 1)}`} aria-label={t("nextMonth")}>
            <ChevronRightIcon className="rtl:rotate-180" aria-hidden />
          </Link>
        </Button>
      </div>
      <div className="sm:w-80">
        <SearchBar placeholder={t("search")} />
      </div>
      </div>

      <ul className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <li><StatTile label={t("tiles.total")} value={<Ltr>{formatMoney(sum(all))}</Ltr>} icon={WalletIcon} testId="charges-total" /></li>
        <li><StatTile label={t("tiles.cars")} value={<Ltr>{formatMoney(sum(all.filter((r) => r.vehicle_id)))}</Ltr>} icon={CarIcon} /></li>
        <li><StatTile label={t("tiles.agency")} value={<Ltr>{formatMoney(sum(all.filter((r) => !r.vehicle_id)))}</Ltr>} icon={StoreIcon} /></li>
        <li><StatTile label={t("tiles.ads")} value={<Ltr>{formatMoney(sum(ads))}</Ltr>} icon={MegaphoneIcon} hint={campaigns.length ? campaigns.join(", ") : undefined} /></li>
      </ul>

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
