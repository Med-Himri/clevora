import {
  ArrowUpRightIcon,
  BellIcon,
  CalendarCheckIcon,
  CalendarRangeIcon,
  CarIcon,
  CircleCheckIcon,
  CornerDownLeftIcon,
  DropletIcon,
  FileSignatureIcon,
  HandCoinsIcon,
  LogOutIcon,
  PlusIcon,
  ShieldAlertIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { MiniBars, StackedBar } from "@/components/app/charts";
import { Ltr } from "@/components/app/ltr";
import { DeltaBadge, pctChange } from "@/components/app/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getProfile, requireAgency } from "@/lib/auth/session";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { MovementList } from "./components/movement-list";
import { getDashboard, type DashboardAlert } from "./queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

/** Aujourd'hui: a welcome with today's summary, the fleet at a glance, then what needs doing, most urgent first. */
export default async function DashboardPage() {
  const { agency } = await requireAgency();
  const isAdmin = agency.role === "admin";
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const supabase = await createClient();
  const now = new Date();
  const [d, profile] = await Promise.all([getDashboard(supabase, agency.id, isAdmin, now), getProfile()]);
  const firstName = (profile?.fullName ?? "").trim().split(/\s+/)[0] ?? "";
  const s = d.stats;
  const occupancyPct = s.total ? Math.round((s.onRental / s.total) * 100) : 0;
  const trend = s.revenueTrend;

  const alertItem = (a: DashboardAlert, i: number) => {
    const map = {
      toSign: { icon: FileSignatureIcon, href: "/contracts?tab=toSign", tone: "warning", text: a.kind === "toSign" ? t("alerts.toSign", { count: a.count }) : "" },
      insurance: { icon: ShieldAlertIcon, href: "/insurance", tone: a.kind === "insurance" && a.daysLeft < 0 ? "danger" : "warning", text: a.kind === "insurance" ? (a.daysLeft < 0 ? t("alerts.insuranceExpired", { car: a.label }) : t("alerts.insurance", { car: a.label, date: formatDate(a.date), days: a.daysLeft })) : "" },
      visit: { icon: ShieldAlertIcon, href: "/insurance", tone: a.kind === "visit" && a.daysLeft < 0 ? "danger" : "warning", text: a.kind === "visit" ? (a.daysLeft < 0 ? t("alerts.visitExpired", { car: a.label }) : t("alerts.visit", { car: a.label, date: formatDate(a.date), days: a.daysLeft })) : "" },
      oil: { icon: DropletIcon, href: "/oil", tone: a.kind === "oil" && a.kmLeft <= 0 ? "danger" : "warning", text: a.kind === "oil" ? (a.kmLeft <= 0 ? t("alerts.oilDue", { car: a.label }) : t("alerts.oil", { car: a.label, km: format.number(a.kmLeft).replace(/ /g, " ") })) : "" },
      maintenanceLate: { icon: WrenchIcon, href: a.kind === "maintenanceLate" ? `/fleet/${a.vehicleId}` : "/fleet", tone: "danger", text: a.kind === "maintenanceLate" ? t("alerts.maintenanceLate", { car: a.label, date: formatDate(a.date) }) : "" },
    }[a.kind];
    const Icon = map.icon;
    const danger = map.tone === "danger";
    return (
      <li key={`${a.kind}-${i}`}>
        <Link
          href={map.href}
          className={cn("flex min-h-12 items-center gap-3 rounded-lg border-s-4 px-3 py-2 transition-colors hover:bg-accent", danger ? "border-s-destructive bg-danger-soft/40" : "border-s-warning bg-warning-soft/40")}
          data-testid="dash-alert"
        >
          <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full", danger ? "bg-danger-soft text-destructive" : "bg-warning-soft text-warning")} aria-hidden>
            <Icon className="size-4" />
          </span>
          <span className="flex-1 text-sm">{map.text}</span>
          <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden />
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Welcome: in the agency colour, today's summary and the main actions */}
      <section className="relative mb-6 overflow-hidden rounded-2xl bg-brand p-5 text-brand-foreground shadow-sm sm:p-6" aria-labelledby="hello">
        <span className="pointer-events-none absolute -end-16 -top-20 size-56 rounded-full bg-white/10" aria-hidden />
        <span className="pointer-events-none absolute -bottom-24 end-24 size-48 rounded-full bg-white/5" aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm font-medium text-brand-foreground/80 first-letter:uppercase">{format.dateTime(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <h1 id="hello" className="text-2xl font-bold tracking-tight sm:text-3xl">
              {firstName ? t("hello", { name: firstName }) : t("title")}
            </h1>
            <p className="text-brand-foreground/90">
              {t("summary", { departures: s.departuresToday, returns: s.returnsToday })} · <span data-testid="count-vehicles">{s.total}</span> {t("carsInFleet", { count: s.total })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" asChild className="hidden bg-white text-brand shadow-sm hover:bg-white/90 md:inline-flex dark:text-[#0b1120]">
              <Link href="/reservations/new">
                <PlusIcon aria-hidden />
                {t("newReservation")}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20 hover:text-brand-foreground">
              <Link href="/planning">
                <CalendarRangeIcon aria-hidden />
                {t("planning")}
              </Link>
            </Button>
            {isAdmin ? (
              <Button size="lg" variant="outline" asChild className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20 hover:text-brand-foreground">
                <Link href="/balances">
                  <HandCoinsIcon aria-hidden />
                  {t("balances")}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className={cn("grid gap-4", isAdmin && trend ? "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : "")}>
        {/* The fleet at a glance: one bar split in available / on rental / maintenance */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-info-soft text-info" aria-hidden>
                <CarIcon className="size-5" />
              </span>
              {t("fleetTitle")}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{t("occupancyNow", { pct: occupancyPct })}</span>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <StackedBar
              label={t("fleetTitle")}
              testId="dash-fleet"
              parts={[
                { key: "available", label: t("tiles.available"), value: s.available, className: "bg-success", dotClassName: "bg-success", testId: "stat-available", href: "/fleet?tab=available" },
                { key: "on_rental", label: t("tiles.onRental"), value: s.onRental, className: "bg-info", dotClassName: "bg-info", testId: "stat-on-rental", href: "/fleet?tab=on_rental" },
                { key: "maintenance", label: t("tiles.maintenance"), value: s.maintenance, className: "bg-warning", dotClassName: "bg-warning", testId: "stat-maintenance", href: "/fleet?tab=maintenance" },
              ]}
            />
            {/* Today's movements */}
            <ul className="grid grid-cols-2 gap-2">
              {(
                [
                  ["stat-departures", t("tiles.departuresToday"), s.departuresToday, "/reservations", LogOutIcon, "text-foreground"],
                  ["stat-returns", t("tiles.returnsToday"), s.returnsToday, "/reservations", CornerDownLeftIcon, s.returnsToday ? "text-warning" : "text-foreground"],
                ] as const
              ).map(([id, label, value, href, Icon, color]) => (
                <li key={id}>
                  <Link href={href} className="flex min-h-14 items-center gap-3 rounded-xl border bg-background/60 px-3 py-2 transition-colors hover:bg-accent">
                    <Icon className={cn("size-5 shrink-0", color)} aria-hidden />
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="text-lg font-bold tabular-nums" data-testid={id}>
                        {value}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{label}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Admins: this month's money, day by day, and the change versus the same days last month */}
        {isAdmin && s.revenueMonth !== null ? (
          <Link href="/statistics" className="group block rounded-xl">
            <Card className="h-full shadow-xs transition-all group-hover:shadow-md motion-safe:group-hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-success-soft text-success" aria-hidden>
                    <WalletIcon className="size-5" />
                  </span>
                  {t("tiles.revenueMonth")}
                </CardTitle>
                <ArrowUpRightIcon className="size-4 text-muted-foreground rtl:-scale-x-100" aria-hidden />
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <span className="text-3xl font-bold tracking-tight tabular-nums" data-testid="stat-revenue">
                  <Ltr>{formatMoney(s.revenueMonth)}</Ltr>
                </span>
                {trend ? <DeltaBadge delta={{ pct: pctChange(trend.soFar, trend.previous), label: t("vsLastMonth") }} /> : null}
                {trend?.days.length ? (
                  <MiniBars
                    className="mt-2 h-14"
                    values={trend.days.map((x) => x.value)}
                    upTo={trend.today}
                    titles={trend.days.map((x) => `${formatDate(x.day)} : ${formatMoney(x.value)}`)}
                  />
                ) : null}
              </CardContent>
            </Card>
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
        <MovementList kind="return" items={d.returns} now={now} title={t("returns")} icon={CornerDownLeftIcon} empty={t("noReturns")} />
        <MovementList kind="departure" items={d.departures} now={now} title={t("departures")} icon={CalendarCheckIcon} empty={t("noDepartures")} />

        <Card className="order-first h-fit border-t-4 border-t-destructive/60 shadow-xs lg:col-span-2 2xl:order-none 2xl:col-span-1 2xl:sticky 2xl:top-20">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-danger-soft text-destructive" aria-hidden>
                <BellIcon className="size-5" />
              </span>
              {t("alerts.title")}
            </CardTitle>
            {d.alerts.length ? <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-2 text-xs font-bold text-white">{d.alerts.length}</span> : null}
          </CardHeader>
          <CardContent>
            {d.alerts.length ? (
              <ul className="flex flex-col gap-2" data-testid="dash-alerts">{d.alerts.map(alertItem)}</ul>
            ) : (
              <p className="flex items-center gap-2 rounded-lg bg-success-soft/50 p-3 text-sm">
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
