import {
  ArrowUpRightIcon,
  BellIcon,
  CalendarCheckIcon,
  CarIcon,
  CircleCheckIcon,
  CornerDownLeftIcon,
  DropletIcon,
  FileSignatureIcon,
  LogOutIcon,
  PhoneIcon,
  PlusIcon,
  ShieldAlertIcon,
  TruckIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { UrgencyGroups } from "@/components/app/urgency-groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { requireAgency } from "@/lib/auth/session";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getDashboard, type DashboardAlert, type DashboardReservation } from "./queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

/** Aujourd'hui: what needs doing now, most urgent first. */
export default async function DashboardPage() {
  const { agency } = await requireAgency();
  const isAdmin = agency.role === "admin";
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const supabase = await createClient();
  const now = new Date();
  const d = await getDashboard(supabase, agency.id, isAdmin, now);

  const row = (r: DashboardReservation, kind: "return" | "departure") => {
    const at = kind === "return" ? r.end_at : r.start_at;
    const late = kind === "return" && new Date(r.end_at) < now;
    return (
      <li key={r.id} className="flex flex-col gap-2 rounded-xl border bg-card p-3" data-testid={`dash-${kind}`}>
        <Link href={`/contracts/${r.id}`} className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md">
          <span className="flex flex-wrap items-center gap-2">
            <span className={cn("font-bold tabular-nums", late && "text-destructive")}>
              <Ltr>{formatTime(at)}</Ltr>
            </span>
            <span className="font-semibold">{r.client.full_name}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            {r.vehicle.brand_model} · <Ltr>{r.vehicle.plate}</Ltr> · <Ltr>{r.contract_number}</Ltr>
          </span>
          {kind === "departure" && r.delivery && r.delivery_place ? (
            <span className="flex items-center gap-1 text-sm">
              <TruckIcon className="size-4 text-muted-foreground" aria-hidden />
              {t("deliveryAt", { place: r.delivery_place })}
            </span>
          ) : null}
          {kind === "return" && r.return_place ? (
            <span className="flex items-center gap-1 text-sm">
              <TruckIcon className="size-4 text-muted-foreground" aria-hidden />
              {t("returnAt", { place: r.return_place })}
            </span>
          ) : null}
        </Link>
        <div className="flex flex-wrap gap-2">
          {r.client.phone ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${r.client.phone}`} aria-label={t("call", { name: r.client.full_name })}>
                <PhoneIcon aria-hidden />
                {t("callShort")}
              </a>
            </Button>
          ) : null}
          <Button size="sm" variant={kind === "return" ? "default" : "outline"} asChild>
            <Link href={`/contracts/${r.id}${kind === "return" ? "?do=return" : ""}`}>
              {kind === "return" ? <CornerDownLeftIcon aria-hidden /> : <FileSignatureIcon aria-hidden />}
              {kind === "return" ? t("return") : r.signed_at ? t("open") : t("sign")}
            </Link>
          </Button>
        </div>
      </li>
    );
  };

  const alertItem = (a: DashboardAlert, i: number) => {
    const map = {
      toSign: { icon: FileSignatureIcon, href: "/contracts?tab=toSign", tone: "warning", text: a.kind === "toSign" ? t("alerts.toSign", { count: a.count }) : "" },
      insurance: { icon: ShieldAlertIcon, href: "/insurance", tone: a.kind === "insurance" && a.daysLeft < 0 ? "danger" : "warning", text: a.kind === "insurance" ? (a.daysLeft < 0 ? t("alerts.insuranceExpired", { car: a.label }) : t("alerts.insurance", { car: a.label, date: formatDate(a.date), days: a.daysLeft })) : "" },
      visit: { icon: ShieldAlertIcon, href: "/insurance", tone: a.kind === "visit" && a.daysLeft < 0 ? "danger" : "warning", text: a.kind === "visit" ? (a.daysLeft < 0 ? t("alerts.visitExpired", { car: a.label }) : t("alerts.visit", { car: a.label, date: formatDate(a.date), days: a.daysLeft })) : "" },
      oil: { icon: DropletIcon, href: "/oil", tone: a.kind === "oil" && a.kmLeft <= 0 ? "danger" : "warning", text: a.kind === "oil" ? (a.kmLeft <= 0 ? t("alerts.oilDue", { car: a.label }) : t("alerts.oil", { car: a.label, km: format.number(a.kmLeft).replace(/ /g, " ") })) : "" },
      maintenanceLate: { icon: WrenchIcon, href: a.kind === "maintenanceLate" ? `/fleet/${a.vehicleId}` : "/fleet", tone: "danger", text: a.kind === "maintenanceLate" ? t("alerts.maintenanceLate", { car: a.label, date: formatDate(a.date) }) : "" },
    }[a.kind];
    const Icon = map.icon;
    return (
      <li key={`${a.kind}-${i}`}>
        <Link href={map.href} className="flex min-h-12 items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent" data-testid="dash-alert">
          <Icon className={cn("size-5 shrink-0", map.tone === "danger" ? "text-destructive" : "text-warning")} aria-hidden />
          <span className="flex-1 text-sm">{map.text}</span>
          <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden />
        </Link>
      </li>
    );
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={
          <>
            {format.dateTime(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} ·{" "}
            <span data-testid="count-vehicles">{d.stats.total}</span> {t("carsInFleet", { count: d.stats.total })}
          </>
        }
        action={
          <Button size="lg" asChild className="hidden md:inline-flex">
            <Link href="/reservations/new">
              <PlusIcon aria-hidden />
              {t("newReservation")}
            </Link>
          </Button>
        }
      />

      <ul className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", isAdmin ? "2xl:grid-cols-6" : "2xl:grid-cols-5")}>
        <li><StatTile label={t("tiles.available")} value={d.stats.available} icon={CircleCheckIcon} tone="success" href="/fleet?tab=available" testId="stat-available" /></li>
        <li><StatTile label={t("tiles.onRental")} value={d.stats.onRental} icon={CarIcon} tone="info" href="/fleet?tab=on_rental" testId="stat-on-rental" /></li>
        <li><StatTile label={t("tiles.departuresToday")} value={d.stats.departuresToday} icon={LogOutIcon} href="/reservations" testId="stat-departures" /></li>
        <li><StatTile label={t("tiles.returnsToday")} value={d.stats.returnsToday} icon={CornerDownLeftIcon} tone={d.stats.returnsToday ? "warning" : "neutral"} href="/reservations" testId="stat-returns" /></li>
        <li><StatTile label={t("tiles.maintenance")} value={d.stats.maintenance} icon={WrenchIcon} href="/fleet?tab=maintenance" testId="stat-maintenance" /></li>
        {isAdmin && d.stats.revenueMonth !== null ? (
          <li><StatTile label={t("tiles.revenueMonth")} value={<Ltr>{formatMoney(d.stats.revenueMonth)}</Ltr>} icon={WalletIcon} tone="success" href="/statistics" testId="stat-revenue" /></li>
        ) : null}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px]">
        <section aria-labelledby="returns-title" className="min-w-0">
          <h2 id="returns-title" className="mb-3 flex items-center gap-2 text-xl font-bold">
            <CornerDownLeftIcon className="size-5 text-muted-foreground" aria-hidden />
            {t("returns")}
          </h2>
          {d.returns.length ? (
            <UrgencyGroups items={d.returns} getDate={(r) => r.end_at} now={now} testId="dash-returns" render={(items) => <ul className="flex flex-col gap-2">{items.map((r) => row(r, "return"))}</ul>} />
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-muted-foreground">{t("noReturns")}</p>
          )}
        </section>

        <section aria-labelledby="departures-title" className="min-w-0">
          <h2 id="departures-title" className="mb-3 flex items-center gap-2 text-xl font-bold">
            <CalendarCheckIcon className="size-5 text-muted-foreground" aria-hidden />
            {t("departures")}
          </h2>
          {d.departures.length ? (
            <UrgencyGroups items={d.departures} getDate={(r) => r.start_at} now={now} testId="dash-departures" render={(items) => <ul className="flex flex-col gap-2">{items.map((r) => row(r, "departure"))}</ul>} />
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-muted-foreground">{t("noDepartures")}</p>
          )}
        </section>

        <Card className="order-first h-fit lg:col-span-2 2xl:order-none 2xl:col-span-1 2xl:sticky 2xl:top-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="size-5 text-muted-foreground" aria-hidden />
              {t("alerts.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.alerts.length ? (
              <ul className="-mx-2 flex flex-col" data-testid="dash-alerts">{d.alerts.map(alertItem)}</ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleCheckIcon className="size-5 text-success" aria-hidden />
                {t("alerts.none")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
