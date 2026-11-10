import { CalendarCheckIcon, GlobeIcon, PlusIcon, SearchIcon, SearchXIcon, SirenIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app/empty-state";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { SearchBar } from "@/components/app/search-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { requireAgency } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { InfractionResults } from "./components/infraction-results";
import { ReservationTable } from "./components/reservation-table";
import { listReservations } from "./queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("reservations") };
}

export default async function ReservationsPage({ searchParams }: PageProps<"/[locale]/reservations">) {
  const { agency } = await requireAgency();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const plate = typeof sp.plate === "string" ? sp.plate.trim() : "";
  const date = typeof sp.date === "string" ? sp.date : "";
  const time = typeof sp.time === "string" ? sp.time : "";
  const t = await getTranslations("reservations");
  const supabase = await createClient();
  const [rows, { count: newRequests }] = await Promise.all([
    listReservations(supabase, agency.id, q),
    supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("agency_id", agency.id).eq("status", "new"),
  ]);
  const now = new Date();

  const returns = rows.filter((r) => r.status === "on_rental");
  const departures = rows.filter((r) => r.status === "reserved");
  const finished = rows
    .filter((r) => r.status === "returned" || r.status === "cancelled")
    .sort((a, b) => (b.actual_return_at ?? b.end_at).localeCompare(a.actual_return_at ?? a.end_at));


  return (
    <>
      <PageHeader
        title={t("title")}
        action={
          <>
            <Button size="lg" variant="outline" asChild>
              <Link href="/reservations/requests" data-testid="requests-link">
                <GlobeIcon aria-hidden />
                {t("onlineRequests")}
                {newRequests ? <span className="ms-1 rounded-full bg-warning-soft px-2 text-xs font-bold text-foreground"><Ltr>{newRequests}</Ltr></span> : null}
              </Link>
            </Button>
            <Button size="lg" asChild>
              <Link href="/reservations/new">
                <PlusIcon aria-hidden />
                {t("new")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <SearchBar placeholder={t("list.search")} />
        <details className="group rounded-xl border bg-card" open={Boolean(plate)}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold">
            <SirenIcon className="size-5 text-muted-foreground" aria-hidden />
            {t("infraction.title")}
          </summary>
          <form method="get" className="grid gap-3 border-t p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="inf-plate">{t("infraction.plate")}</Label>
              <Input id="inf-plate" name="plate" defaultValue={plate} dir="ltr" required placeholder="12345-A-6" className="uppercase" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inf-date">{t("infraction.date")}</Label>
              <Input id="inf-date" name="date" type="date" defaultValue={date} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inf-time">{t("infraction.time")}</Label>
              <Input id="inf-time" name="time" type="time" defaultValue={time} />
            </div>
            <Button type="submit" size="lg">
              <SearchIcon aria-hidden />
              {t("infraction.submit")}
            </Button>
          </form>
          {plate && date ? (
            <div className="border-t p-4">
              <InfractionResults agencyId={agency.id} plate={plate} date={date} time={time} />
            </div>
          ) : null}
        </details>
      </div>

      {rows.length === 0 ? (
        q ? (
          <EmptyState icon={SearchXIcon} title={t("list.noResult")} description={t("list.noResultBody")} />
        ) : (
          <EmptyState
            icon={CalendarCheckIcon}
            title={t("list.empty")}
            description={t("list.emptyBody")}
            action={
              <Button size="lg" asChild>
                <Link href="/reservations/new">
                  <PlusIcon aria-hidden />
                  {t("new")}
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <div className="flex flex-col gap-8">
          {returns.length ? (
            <section aria-labelledby="returns-title" data-testid="returns">
              <h2 id="returns-title" className="mb-3 text-xl font-bold">{t("list.returns")}</h2>
              <ReservationTable rows={returns} now={now} groupBy="end" />
            </section>
          ) : null}
          {departures.length ? (
            <section aria-labelledby="departures-title" data-testid="departures">
              <h2 id="departures-title" className="mb-3 text-xl font-bold">{t("list.departures")}</h2>
              <ReservationTable rows={departures} now={now} groupBy="start" />
            </section>
          ) : null}
          {finished.length ? (
            <section aria-labelledby="finished-title" data-testid="finished">
              <h2 id="finished-title" className="mb-3 text-xl font-bold">{t("list.finished")}</h2>
              <ReservationTable rows={finished} now={now} />
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
