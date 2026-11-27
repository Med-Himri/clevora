import { CalendarCheckIcon, PlusIcon, SearchXIcon, SirenIcon, XIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { SelectionProvider } from "@/components/app/selection";
import { SearchBar } from "@/components/app/search-bar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireAgency } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { InfractionDialog } from "./components/infraction-dialog";
import { InfractionResults } from "./components/infraction-results";
import { ReservationBulkBar } from "./components/reservation-bulk-bar";
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
  const rows = await listReservations(supabase, agency.id, q);
  const now = new Date();

  const returns = rows.filter((r) => r.status === "on_rental");
  const departures = rows.filter((r) => r.status === "reserved");
  const finished = rows
    .filter((r) => r.status === "returned" || r.status === "cancelled")
    .sort((a, b) => (b.actual_return_at ?? b.end_at).localeCompare(a.actual_return_at ?? a.end_at));


  return (
    <>
      <PageHeader icon={CalendarCheckIcon}
        title={t("title")}
        action={
          <>
            {/* The infraction finder: a compact button beside « Nouvelle réservation » */}
            <InfractionDialog plate={plate} date={date} time={time} />
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
        {plate && date ? (
          <section className="rounded-xl border bg-card shadow-xs" aria-labelledby="inf-title" data-testid="infraction-panel">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
              <h2 id="inf-title" className="flex min-w-0 items-center gap-2 font-semibold">
                <SirenIcon className="size-5 shrink-0 text-destructive" aria-hidden />
                <span className="min-w-0 truncate">{t("infraction.title")}</span>
              </h2>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/reservations" aria-label={t("infraction.close")}>
                  <XIcon aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="p-4">
              <InfractionResults agencyId={agency.id} plate={plate} date={date} time={time} />
            </div>
          </section>
        ) : null}
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
        <SelectionProvider>
          <div className="flex flex-col gap-8">
          {returns.length ? (
            <section aria-labelledby="returns-title" data-testid="returns">
              <h2 id="returns-title" className="mb-3 text-xl font-bold">{t("list.returns")}</h2>
              <ReservationTable rows={returns} now={now} groupBy="end" selectable />
            </section>
          ) : null}
          {departures.length ? (
            <section aria-labelledby="departures-title" data-testid="departures">
              <h2 id="departures-title" className="mb-3 text-xl font-bold">{t("list.departures")}</h2>
              <ReservationTable rows={departures} now={now} groupBy="start" selectable />
            </section>
          ) : null}
          {finished.length ? (
            <section aria-labelledby="finished-title" data-testid="finished">
              <h2 id="finished-title" className="mb-3 text-xl font-bold">{t("list.finished")}</h2>
              <ReservationTable rows={finished} now={now} selectable />
            </section>
          ) : null}
          </div>
          <ReservationBulkBar />
        </SelectionProvider>
      )}
    </>
  );
}
