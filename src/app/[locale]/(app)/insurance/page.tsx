import { ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app/empty-state";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { dateStatus, paperGroup, type DateStatus, type PaperGroup } from "@/lib/alerts/compute";
import { requireAgency } from "@/lib/auth/session";
import { dayKey, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { PapersSheet } from "./papers-sheet";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("insurance") };
}

const GROUPS: PaperGroup[] = ["expired", "week", "month", "later"];

export default async function InsurancePage() {
  const { agency } = await requireAgency();
  const t = await getTranslations("insurance");
  const supabase = await createClient();
  const [{ data: cars }, { data: cfg }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, plate, brand_model, insurance_expires_on, technical_visit_expires_on, insurer, policy_number")
      .eq("agency_id", agency.id)
      .eq("status", "active"),
    supabase.from("agencies").select("alert_days_before").eq("id", agency.id).single(),
  ]);
  const today = dayKey(new Date());
  const alertDays = cfg?.alert_days_before ?? 30;
  const rows = (cars ?? []).map((c) => {
    const ins = dateStatus(c.insurance_expires_on, today, alertDays);
    const vis = dateStatus(c.technical_visit_expires_on, today, alertDays);
    const nearest = [ins.daysLeft, vis.daysLeft].filter((x): x is number => x !== null);
    const min = nearest.length ? Math.min(...nearest) : null;
    return { ...c, ins, vis, min, group: paperGroup(min) };
  });
  rows.sort((a, b) => (a.min ?? 1e9) - (b.min ?? 1e9));

  const badge = (s: DateStatus) => {
    if (s.state === "unknown") return <Badge variant="neutral">{t("unknown")}</Badge>;
    const days = t("inDays", { days: s.daysLeft ?? 0 });
    if (s.state === "expired") return <Badge variant="danger">{t("expired")}</Badge>;
    if (s.state === "soon") return <Badge variant="warning">{t("soon")} · {days}</Badge>;
    return <Badge variant="success">{t("ok")} · {days}</Badge>;
  };

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle", { days: alertDays })} />
      {rows.length === 0 ? (
        <EmptyState icon={ShieldCheckIcon} title={t("empty")} />
      ) : (
        <div className="flex flex-col gap-6" data-testid="insurance-groups">
          {GROUPS.map((g) => {
            const items = rows.filter((r) => r.group === g);
            if (!items.length) return null;
            return (
              <section key={g} aria-labelledby={`ins-${g}`} data-group={g}>
                <h2 id={`ins-${g}`} className={`mb-2 flex items-center gap-2 font-semibold ${g === "expired" ? "text-destructive" : ""}`}>
                  {t(`groups.${g}`)}
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-bold">{items.length}</span>
                </h2>
                <ul className="grid gap-2 lg:grid-cols-2">
                  {items.map((c) => (
                    <li key={c.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4" data-testid="insurance-row">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <Link href={`/fleet/${c.id}`} className="min-w-0">
                          <span className="block font-semibold">{c.brand_model}</span>
                          <Ltr className="text-sm text-muted-foreground">{c.plate}</Ltr>
                        </Link>
                        <PapersSheet vehicleId={c.id} label={`${c.brand_model} · ${c.plate}`} insurance={c.insurance_expires_on} visit={c.technical_visit_expires_on} insurer={c.insurer} policy={c.policy_number} />
                      </div>
                      <dl className="grid gap-2 text-sm sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground">{t("insuranceEnd")}</dt>
                          <dd className="flex flex-wrap items-center gap-2">
                            {c.insurance_expires_on ? <Ltr className="font-medium">{formatDate(c.insurance_expires_on)}</Ltr> : null}
                            {badge(c.ins)}
                          </dd>
                          {c.insurer || c.policy_number ? (
                            <dd className="text-xs text-muted-foreground">
                              {c.insurer}
                              {c.policy_number ? <> · <Ltr>{c.policy_number}</Ltr></> : null}
                            </dd>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground">{t("visitEnd")}</dt>
                          <dd className="flex flex-wrap items-center gap-2">
                            {c.technical_visit_expires_on ? <Ltr className="font-medium">{formatDate(c.technical_visit_expires_on)}</Ltr> : null}
                            {badge(c.vis)}
                          </dd>
                        </div>
                      </dl>
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
