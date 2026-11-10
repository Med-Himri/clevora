import { GlobeIcon, MessageCircleIcon, PhoneIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app/empty-state";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireAgency } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatPhone, whatsappNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { RequestActions } from "./request-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("requests");
  return { title: t("title") };
}

/** Demandes en ligne: requests sent from the public page, newest first, new ones on top. */
export default async function RequestsPage() {
  const { agency } = await requireAgency();
  const t = await getTranslations("requests");
  const supabase = await createClient();
  const [{ data }, { data: a }] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("id, created_at, full_name, phone, email, start_date, end_date, delivery_place, message, status, vehicle:vehicles!booking_requests_agency_id_vehicle_id_fkey(brand_model, plate)")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("agencies").select("public_booking_enabled").eq("id", agency.id).single(),
  ]);
  const rows = [...(data ?? [])].sort((x, y) => Number(y.status === "new") - Number(x.status === "new"));

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {rows.length === 0 ? (
        <EmptyState
          icon={GlobeIcon}
          title={t("empty")}
          description={a?.public_booking_enabled ? t("emptyOpen") : agency.role === "admin" ? t("emptyClosedAdmin") : t("emptyClosed")}
          action={
            !a?.public_booking_enabled && agency.role === "admin" ? (
              <Button size="lg" asChild>
                <Link href="/settings?section=booking">{t("open")}</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3" data-testid="requests-list">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4" data-testid="request-row">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">{r.full_name}</span>
                <Badge variant={r.status === "new" ? "warning" : r.status === "handled" ? "success" : "neutral"}>{t(`status.${r.status}`)}</Badge>
                <span className="text-sm text-muted-foreground"><Ltr>{formatDateTime(r.created_at)}</Ltr></span>
              </div>
              <p>
                <Ltr>{formatDate(r.start_date)}</Ltr> → <Ltr>{formatDate(r.end_date)}</Ltr> · {r.vehicle ? <>{r.vehicle.brand_model} <Ltr>{r.vehicle.plate}</Ltr></> : t("anyCar")}
              </p>
              {r.delivery_place ? <p className="text-sm">{t("place", { place: r.delivery_place })}</p> : null}
              {r.message ? <p className="text-sm text-muted-foreground" dir="auto">{r.message}</p> : null}
              {r.email ? <p className="text-sm"><Ltr>{r.email}</Ltr></p> : null}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${r.phone}`}>
                    <PhoneIcon aria-hidden />
                    <Ltr>{formatPhone(r.phone)}</Ltr>
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://wa.me/${whatsappNumber(r.phone)}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircleIcon aria-hidden />
                    WhatsApp
                  </a>
                </Button>
                {r.status === "new" ? (
                  <Button size="sm" asChild>
                    <Link href="/reservations/new">
                      <PlusIcon aria-hidden />
                      {t("create")}
                    </Link>
                  </Button>
                ) : null}
                <RequestActions id={r.id} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
