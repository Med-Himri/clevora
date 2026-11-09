import { CalendarCheckIcon, CarIcon, ConstructionIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAgency } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

/** "Aujourd'hui" — placeholder until the dashboard step. */
export default async function DashboardPage() {
  const { agency } = await requireAgency();
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const supabase = await createClient();

  const count = async (table: "vehicles" | "clients" | "reservations" | "agency_members") => {
    const { count: n } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("agency_id", agency.id);
    return n ?? 0;
  };
  const [vehicles, clients, reservations, members] = await Promise.all([
    count("vehicles"),
    count("clients"),
    count("reservations"),
    count("agency_members"),
  ]);

  const tiles = [
    { key: "vehicles", value: vehicles, icon: CarIcon },
    { key: "clients", value: clients, icon: UsersIcon },
    { key: "reservations", value: reservations, icon: CalendarCheckIcon },
    { key: "members", value: members, icon: UsersIcon },
  ] as const;

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={format.dateTime(new Date(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      />
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ key, value, icon: Icon }) => (
          <li key={key}>
            <Card className="h-full">
              <CardContent className="flex flex-col gap-1 pt-4 sm:pt-6">
                <Icon className="size-5 text-muted-foreground" aria-hidden />
                <span className="text-3xl font-bold tabular-nums" data-testid={`count-${key}`}>
                  {format.number(value)}
                </span>
                <span className="text-sm text-muted-foreground">{t(`tiles.${key}`)}</span>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <Card className="mt-4">
        <CardContent className="flex items-start gap-3 pt-4 sm:pt-6">
          <ConstructionIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">{t("comingSoon")}</p>
        </CardContent>
      </Card>
    </>
  );
}
