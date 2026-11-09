import { DropletIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app/empty-state";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { oilStatus } from "@/lib/alerts/compute";
import { requireAgency } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { OilActions } from "./oil-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("oil") };
}

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ");
const GROUPS = ["due", "soon", "ok", "unknown"] as const;

export default async function OilPage() {
  const { agency } = await requireAgency();
  const t = await getTranslations("oil");
  const supabase = await createClient();
  const [{ data: cars }, { data: cfg }] = await Promise.all([
    supabase.from("vehicles").select("id, plate, brand_model, current_km, oil_last_km, oil_last_date, oil_next_km").eq("agency_id", agency.id).eq("status", "active"),
    supabase.from("agencies").select("alert_km_before").eq("id", agency.id).single(),
  ]);
  const alertKm = cfg?.alert_km_before ?? 1500;
  const rows = (cars ?? []).map((c) => ({ ...c, status: oilStatus(c.current_km, c.oil_next_km, alertKm) }));
  rows.sort((a, b) => (a.status.kmLeft ?? 1e12) - (b.status.kmLeft ?? 1e12));

  const badge = (s: (typeof rows)[number]["status"]) => {
    if (s.state === "due") return <Badge variant="danger">{t("due")}</Badge>;
    if (s.state === "soon") return <Badge variant="warning">{t("soon")}</Badge>;
    if (s.state === "ok") return <Badge variant="success">{t("ok")}</Badge>;
    return <Badge variant="neutral">{t("unknown")}</Badge>;
  };

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle", { km: nf(alertKm) })} />
      {rows.length === 0 ? (
        <EmptyState icon={DropletIcon} title={t("empty")} />
      ) : (
        <div className="flex flex-col gap-6" data-testid="oil-groups">
          {GROUPS.map((g) => {
            const items = rows.filter((r) => r.status.state === g);
            if (!items.length) return null;
            return (
              <section key={g} aria-labelledby={`oil-${g}`} data-group={g}>
                <h2 id={`oil-${g}`} className={`mb-2 flex items-center gap-2 font-semibold ${g === "due" ? "text-destructive" : ""}`}>
                  {t(`groups.${g}`)}
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-bold">{items.length}</span>
                </h2>
                <ul className="grid gap-2 lg:grid-cols-2">
                  {items.map((c) => (
                    <li key={c.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4" data-testid="oil-row">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <Link href={`/fleet/${c.id}`} className="min-w-0">
                          <span className="block font-semibold">{c.brand_model}</span>
                          <Ltr className="text-sm text-muted-foreground">{c.plate}</Ltr>
                        </Link>
                        <span className="flex flex-col items-end gap-1">
                          {badge(c.status)}
                          {c.status.kmLeft !== null ? (
                            <span className={`text-sm font-semibold ${c.status.kmLeft <= 0 ? "text-destructive" : ""}`} data-testid="oil-km-left">
                              {c.status.kmLeft <= 0 ? t("overBy", { km: nf(-c.status.kmLeft) }) : t("kmLeft", { km: nf(c.status.kmLeft) })}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <dl className="grid grid-cols-3 gap-2 text-sm">
                        <div><dt className="text-xs text-muted-foreground">{t("currentKm")}</dt><dd className="font-medium"><Ltr>{nf(c.current_km)} km</Ltr></dd></div>
                        <div><dt className="text-xs text-muted-foreground">{t("lastChange")}</dt><dd className="font-medium">{c.oil_last_km !== null ? <Ltr>{nf(c.oil_last_km)} km</Ltr> : "—"}{c.oil_last_date ? <span className="block text-xs text-muted-foreground"><Ltr>{formatDate(c.oil_last_date)}</Ltr></span> : null}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">{t("nextKm")}</dt><dd className="font-medium">{c.oil_next_km !== null ? <Ltr>{nf(c.oil_next_km)} km</Ltr> : "—"}</dd></div>
                      </dl>
                      <OilActions vehicleId={c.id} label={`${c.brand_model} · ${c.plate}`} currentKm={c.current_km} lastInterval={c.oil_next_km !== null && c.oil_last_km !== null ? c.oil_next_km - c.oil_last_km : null} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
