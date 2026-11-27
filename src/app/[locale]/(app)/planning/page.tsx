import type * as React from "react";
import { CarIcon, ChevronLeftIcon, ChevronRightIcon, TruckIcon } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireAgency } from "@/lib/auth/session";
import { casablancaToIso, dayKey, daysBetween, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("planning") };
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `day` (weeks start on Monday). */
function mondayOf(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(day, -offset);
}

type Booking = {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  actual_return_at: string | null;
  delivery: boolean;
  vehicle_id: string | null;
  client: { full_name: string } | null;
};

const STATUS_STYLE: Record<string, string> = {
  reserved: "bg-info-soft text-info border-info/40",
  on_rental: "bg-primary text-primary-foreground border-primary",
  returned: "bg-muted text-muted-foreground border-border",
};

export default async function PlanningPage({ searchParams }: PageProps<"/[locale]/planning">) {
  const { agency } = await requireAgency();
  const sp = await searchParams;
  const t = await getTranslations("planning");
  const tr = await getTranslations("fleet.reasons");
  const format = await getFormatter();
  const today = dayKey(new Date());
  const requested = typeof sp.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? sp.week : today;
  const weekStart = mondayOf(requested);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = days[6];
  const supabase = await createClient();
  const rangeStart = weekStart;
  const rangeEnd = weekEnd;
  const from = casablancaToIso(rangeStart, "00:00");
  const to = casablancaToIso(addDays(rangeEnd, 1), "00:00");
  const [{ data: vehicles }, { data: bookings }, { data: maintenance }] = await Promise.all([
    supabase.from("vehicles").select("id, plate, brand_model").eq("agency_id", agency.id).eq("status", "active").order("brand_model").order("plate"),
    supabase
      .from("reservations")
      .select("id, status, start_at, end_at, actual_return_at, delivery, vehicle_id, client:clients!reservations_agency_id_client_id_fkey(full_name)")
      .eq("agency_id", agency.id)
      .in("status", ["reserved", "on_rental", "returned"])
      .lt("start_at", to)
      .gt("end_at", from),
    supabase
      .from("maintenance_periods")
      .select("id, vehicle_id, reason, starts_on, expected_end_on, ended_on")
      .eq("agency_id", agency.id)
      .lte("starts_on", rangeEnd)
      .or(`ended_on.is.null,ended_on.gt.${rangeStart}`),
  ]);
  const list = (bookings ?? []) as unknown as Booking[];
  const cars = vehicles ?? [];

  /** Column span (1-based, end exclusive) of a period inside the week, or null. */
  const span = (startDay: string, endDay: string) => {
    if (endDay < weekStart || startDay > weekEnd) return null;
    const s = Math.max(0, daysBetween(weekStart, startDay));
    const e = Math.min(6, daysBetween(weekStart, endDay));
    return { start: s + 1, end: e + 2 };
  };
  const bookingDays = (b: Booking) => ({ start: dayKey(b.start_at), end: dayKey(b.status === "returned" && b.actual_return_at ? b.actual_return_at : b.end_at) });
  const maintenanceEnd = (m: { expected_end_on: string | null; ended_on: string | null }) =>
    m.ended_on ? addDays(m.ended_on, -1) : (m.expected_end_on && m.expected_end_on >= today ? m.expected_end_on : weekEnd);

  const weekLabel = `${format.dateTime(new Date(`${weekStart}T12:00:00Z`), { day: "numeric", month: "short" })} – ${format.dateTime(new Date(`${weekEnd}T12:00:00Z`), { day: "numeric", month: "short", year: "numeric" })}`;
  const nav = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" asChild>
        <Link href={`/planning?week=${addDays(weekStart, -7)}`} aria-label={t("previousWeek")}>
          <ChevronLeftIcon className="rtl:rotate-180" aria-hidden />
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/planning">{t("today")}</Link>
      </Button>
      <Button variant="outline" size="icon" asChild>
        <Link href={`/planning?week=${addDays(weekStart, 7)}`} aria-label={t("nextWeek")}>
          <ChevronRightIcon className="rtl:rotate-180" aria-hidden />
        </Link>
      </Button>
      <span className="ms-1 font-semibold" data-testid="week-label">{weekLabel}</span>
    </div>
  );

  // Reservations of the week still without a car (chosen on the contract)
  const carless = list.filter((b) => !b.vehicle_id && b.status === "reserved" && span(bookingDays(b).start, bookingDays(b).end));

  return (
    <>
      <PageHeader title={t("title")} action={nav} />
      {carless.length ? (
        <section aria-labelledby="carless-title" className="mb-4 rounded-xl border border-warning/40 bg-warning-soft p-3" data-testid="planning-carless">
          <h2 id="carless-title" className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CarIcon className="size-4 text-warning" aria-hidden />
            {t("carlessTitle", { count: carless.length })}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {carless.map((b) => (
              <li key={b.id}>
                <Link href={`/reservations/${b.id}?do=car`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border bg-card px-3 text-sm hover:bg-accent">
                  <Ltr className="font-semibold">{formatDate(b.start_at).slice(0, 5)}</Ltr>
                  {b.client?.full_name}
                  <span className="font-semibold text-primary">{t("chooseCar")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Week grid at every size: the car column stays put while the days scroll sideways inside the grid (phones, tablets) */}
      <div className="overflow-x-auto overscroll-x-contain rounded-xl border bg-card" data-testid="planning-grid">
        <div className="min-w-[560px] md:min-w-[760px]">
          <div className="sticky top-0 z-20 grid grid-cols-[112px_repeat(7,minmax(64px,1fr))] md:grid-cols-[150px_repeat(7,minmax(80px,1fr))] border-b bg-card text-sm">
            <div className="sticky start-0 z-10 bg-card p-2 font-semibold">{t("car")}</div>
            {days.map((d) => (
              <div key={d} className={cn("border-s p-2 text-center", d === today && "bg-primary/10 font-bold dark:bg-accent")}>
                <span className="block text-xs uppercase text-muted-foreground">{format.dateTime(new Date(`${d}T12:00:00Z`), { weekday: "short" })}</span>
                {format.dateTime(new Date(`${d}T12:00:00Z`), { day: "2-digit", month: "2-digit" })}
              </div>
            ))}
          </div>
          {cars.map((c) => (
            <div key={c.id} className="grid grid-cols-[112px_repeat(7,minmax(64px,1fr))] md:grid-cols-[150px_repeat(7,minmax(80px,1fr))] border-b last:border-b-0">
              <Link href={`/fleet/${c.id}`} className="sticky start-0 z-10 flex flex-col justify-center border-e bg-card p-2 text-sm hover:bg-accent">
                <span className="truncate font-semibold">{c.brand_model}</span>
                <Ltr className="text-xs text-muted-foreground">{c.plate}</Ltr>
              </Link>
              <div className="relative col-span-7 grid min-h-14 grid-cols-7">
                {/* empty cells: tap to book this car that day */}
                {days.map((d, i) => (
                  <Link
                    key={d}
                    href={`/reservations/new?vehicle=${c.id}&date=${d}`}
                    style={{ gridColumn: `${i + 1} / ${i + 2}`, gridRow: 1 }}
                    className={cn("border-s hover:bg-accent/60", d === today && "bg-primary/5", d < today && "pointer-events-none")}
                    aria-label={t("bookCell", { car: `${c.brand_model} ${c.plate}`, date: d })}
                    tabIndex={d < today ? -1 : undefined}
                  />
                ))}
                {(maintenance ?? [])
                  .filter((m) => m.vehicle_id === c.id)
                  .map((m) => {
                    const sp2 = span(m.starts_on, maintenanceEnd(m));
                    if (!sp2) return null;
                    return (
                      <div
                        key={m.id}
                        style={{ gridColumn: `${sp2.start} / ${sp2.end}`, gridRow: 1, backgroundImage: "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--warning) 35%, transparent) 6px 12px)" }}
                        className="pointer-events-none z-0 m-1 flex items-center rounded-md border border-warning/50 px-2 text-xs font-semibold text-warning"
                        data-testid="planning-maintenance"
                      >
                        <span className="truncate">{tr(m.reason)}</span>
                      </div>
                    );
                  })}
                {list
                  .filter((b) => b.vehicle_id === c.id)
                  .map((b) => {
                    const bd = bookingDays(b);
                    const sp2 = span(bd.start, bd.end);
                    if (!sp2) return null;
                    return (
                      <Link
                        key={b.id}
                        href={`/reservations/${b.id}`}
                        style={{ gridColumn: `${sp2.start} / ${sp2.end}`, gridRow: 1 }}
                        className={cn("z-10 m-1 flex min-w-0 items-center gap-1 rounded-md border px-2 text-xs font-semibold shadow-xs", STATUS_STYLE[b.status])}
                        data-testid="planning-booking"
                        title={b.client?.full_name ?? ""}
                      >
                        {b.delivery ? <TruckIcon className="size-3.5 shrink-0" aria-label={t("delivery")} /> : null}
                        <span className="truncate">{b.client?.full_name}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
          {cars.length === 0 ? <p className="p-4 text-muted-foreground">{t("noCars")}</p> : null}
        </div>
      </div>
      <div className="mt-3 hidden flex-wrap gap-3 text-xs text-muted-foreground md:flex">
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-info-soft ring-1 ring-info/40" />{t("legend.reserved")}</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-primary" />{t("legend.onRental")}</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-muted ring-1 ring-border" />{t("legend.returned")}</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm ring-1 ring-warning/50" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent 0 2px, var(--warning) 2px 4px)" }} />{t("legend.maintenance")}</span>
        <span className="flex items-center gap-1"><TruckIcon className="size-3.5" aria-hidden />{t("legend.delivery")}</span>
      </div>
    </>
  );
}
