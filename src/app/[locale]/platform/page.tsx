import { BuildingIcon, ClockIcon, LandmarkIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList, type Column } from "@/components/app/responsive-list";
import { SearchBar } from "@/components/app/search-bar";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatTile } from "@/components/app/stat-tile";
import { formatUsage, usageLines } from "@/lib/usage";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { PaymentActions } from "./components/payment-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("platform");
  return { title: t("title") };
}

const STATUS_TONE = { trial: "info", active: "success", past_due: "warning", suspended: "danger", cancelled: "neutral" } as const;

/** Parcolia: every agency, and the payments waiting for a confirmation. */
export default async function PlatformPage({ searchParams }: PageProps<"/[locale]/platform">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const t = await getTranslations("platform");
  const supabase = await createClient();
  const [{ data: agencies }, { data: pending }, { data: usageRows }] = await Promise.all([
    supabase.rpc("platform_overview"),
    supabase
      .from("subscription_payments")
      .select("id, created_at, period, amount, method, reference, plan:plans(name), agency:agencies(id, name)")
      .eq("status", "pending")
      .order("created_at"),
    supabase.rpc("platform_usage"),
  ]);
  const u = usageRows?.[0];
  const usage = u ? usageLines({ database_bytes: Number(u.database_bytes), storage_bytes: Number(u.storage_bytes), active_users_30d: u.active_users_30d }) : [];
  const all = agencies ?? [];
  const rows = q ? all.filter((a) => a.name.toLowerCase().includes(q) || a.slug.includes(q) || (a.city ?? "").toLowerCase().includes(q)) : all;
  type Row = (typeof all)[number];
  const columns: Column<Row>[] = [
    { key: "name", header: t("agency"), priority: "primary", cell: (a) => <span>{a.name} <span className="text-sm font-normal text-muted-foreground">{a.city}</span></span> },
    { key: "status", header: t("status"), priority: "high", hideLabelInCard: true, cell: (a) => <Badge variant={a.writable ? STATUS_TONE[a.subscription_status as keyof typeof STATUS_TONE] : "danger"}>{t(`statuses.${a.subscription_status}`)}{a.writable ? "" : ` · ${t("readOnly")}`}</Badge> },
    { key: "plan", header: t("plan"), priority: "high", cell: (a) => a.plan_name ?? "—" },
    { key: "until", header: t("until"), priority: "low", cell: (a) => <Ltr>{formatDate(a.subscription_status === "trial" ? a.trial_ends_at : a.current_period_end) || "—"}</Ltr> },
    { key: "cars", header: t("cars"), priority: "low", align: "end", cell: (a) => <Ltr>{a.vehicles}</Ltr> },
    { key: "members", header: t("members"), priority: "low", align: "end", cell: (a) => <Ltr>{a.members}</Ltr> },
    { key: "res", header: t("reservations30"), priority: "low", align: "end", cell: (a) => <Ltr>{a.reservations_30d}</Ltr> },
  ];

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li><StatTile label={t("tiles.agencies")} value={all.length} icon={BuildingIcon} testId="platform-agencies" /></li>
        <li><StatTile label={t("tiles.trial")} value={all.filter((a) => a.subscription_status === "trial" && a.writable).length} icon={ClockIcon} tone="info" /></li>
        <li><StatTile label={t("tiles.paying")} value={all.filter((a) => a.subscription_status === "active" && a.writable).length} icon={LandmarkIcon} tone="success" /></li>
        <li><StatTile label={t("tiles.readOnly")} value={all.filter((a) => !a.writable).length} icon={LockIcon} tone="warning" /></li>
      </ul>

      {usage.length ? (
        <section aria-labelledby="usage-title" className="mb-6 rounded-xl border bg-card p-4" data-testid="platform-usage">
          <h2 id="usage-title" className="mb-1 text-lg font-bold">{t("supabaseUsage.title")}</h2>
          <p className="mb-3 text-sm text-muted-foreground">{t("supabaseUsage.hint")}</p>
          <ul className="grid gap-4 md:grid-cols-3">
            {usage.map((l) => (
              <li key={l.metric} className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{t(`supabaseUsage.${l.metric}`)}</span>
                  <Ltr className={l.level === 95 ? "font-bold text-destructive" : l.level === 80 ? "font-bold text-warning" : "text-muted-foreground"}>{`${l.pct} %`}</Ltr>
                </span>
                <ProgressBar value={l.pct} label={t(`supabaseUsage.${l.metric}`)} tone={l.level ? "warning" : "primary"} />
                <Ltr className="text-xs text-muted-foreground">{`${formatUsage(l.metric, l.used)} / ${formatUsage(l.metric, l.limit)}`}</Ltr>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="pending-title" className="mb-8">
        <h2 id="pending-title" className="mb-3 text-xl font-bold">{t("pendingTitle")}</h2>
        {(pending ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-muted-foreground">{t("pendingNone")}</p>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="platform-pending">
            {(pending ?? []).map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-xl border bg-card p-3 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-semibold">{p.agency?.name} · {p.plan?.name} ({p.period === "year" ? t("year") : t("month")})</span>
                  <span className="text-sm text-muted-foreground">
                    <Ltr>{p.reference}</Ltr> · {t(`methods.${p.method}`)} · <Ltr>{formatDate(p.created_at)}</Ltr>
                  </span>
                </div>
                <Ltr className="text-lg font-bold">{formatMoney(p.amount)}</Ltr>
                <PaymentActions id={p.id} label={`${p.agency?.name ?? ""} · ${p.reference} · ${formatMoney(p.amount)}`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="agencies-title">
        <h2 id="agencies-title" className="mb-3 text-xl font-bold">{t("agenciesTitle")}</h2>
        <div className="mb-3">
          <SearchBar placeholder={t("search")} />
        </div>
        <ResponsiveList rows={rows} columns={columns} rowKey={(a) => a.id} rowHref={(a) => `/platform/agencies/${a.id}`} caption={t("agenciesTitle")} testId="platform-list" />
      </section>
    </>
  );
}
