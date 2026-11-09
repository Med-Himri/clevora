import { ArrowLeftIcon, CarIcon, ClipboardListIcon, UserIcon, WalletIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Arrow, Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { requireAgency } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ReservationActions } from "../components/reservation-actions";
import { ReservationStatusBadge } from "../components/status-badge";
import { getReservation } from "../queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("reservations") };
}

type Driver = {
  full_name: string;
  phone: string | null;
  id_type: string;
  id_number: string;
  address: string | null;
  nationality: string | null;
  birth_date: string | null;
  license_number: string | null;
  license_issued_on: string | null;
} | null;

export default async function ReservationPage({ params, searchParams }: PageProps<"/[locale]/reservations/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { agency } = await requireAgency();
  const t = await getTranslations("reservations");
  const tp = await getTranslations("reservations.payment");
  const supabase = await createClient();
  const data = await getReservation(supabase, agency.id, id);
  if (!data) notFound();
  const { reservation: r, totals, payments } = data;
  const late = r.status === "on_rental" && new Date(r.end_at) < new Date();
  const fuel = (q: number | null) => (q === null ? "—" : `${q}/4`);

  const driverCard = (d: Driver, title: string) =>
    d ? (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5 text-muted-foreground" aria-hidden />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">{t("driver.fullName")}</dt><dd className="font-semibold">{d.full_name}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{t("driver.phone")}</dt><dd>{d.phone ? <a href={`tel:${d.phone}`} className="font-medium underline-offset-4 hover:underline"><Ltr>{d.phone}</Ltr></a> : "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{d.id_type === "passport" ? t("driver.passport") : t("driver.cin")}</dt><dd><Ltr>{d.id_number}</Ltr></dd></div>
            <div><dt className="text-xs text-muted-foreground">{t("driver.licenseNumber")}</dt><dd>{d.license_number ? <Ltr>{d.license_number}</Ltr> : "—"}{d.license_issued_on ? <> · <Ltr>{formatDate(d.license_issued_on)}</Ltr></> : null}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{t("driver.birthDate")}</dt><dd>{d.birth_date ? <Ltr>{formatDate(d.birth_date)}</Ltr> : "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{t("driver.address")}</dt><dd>{d.address ?? "—"}</dd></div>
          </dl>
        </CardContent>
      </Card>
    ) : null;

  return (
    <>
      <Link href="/reservations" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
        {t("title")}
      </Link>
      <PageHeader
        title={`${t("detail.contract")} ${r.contract_number}`}
        subtitle={<span className="flex flex-wrap items-center gap-2"><ReservationStatusBadge status={r.status} late={late} signed={Boolean(r.signed_at)} />{r.signed_at ? <span className="text-sm">{t("detail.signedOn", { date: formatDateTime(r.signed_at) })}</span> : null}</span>}
      />

      <ReservationActions
        reservation={{
          id: r.id,
          status: r.status as "reserved" | "on_rental" | "returned" | "cancelled",
          signed: Boolean(r.signed_at),
          start_at: r.start_at,
          end_at: r.end_at,
          daily_price: Number(r.daily_price),
          km_out: r.km_out,
          deposit_taken: r.deposit_taken,
          deposit_amount: Number(r.deposit_amount),
          balance: Number(totals?.balance ?? 0),
          planned_days: totals?.planned_days ?? 1,
        }}
        initialAction={typeof sp.do === "string" ? sp.do : null}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CarIcon className="size-5 text-muted-foreground" aria-hidden />
              {t("detail.rental")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">{t("detail.car")}</dt><dd className="font-semibold">{r.vehicle?.brand_model} · <Ltr>{r.vehicle?.plate}</Ltr></dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("detail.departure")}</dt><dd><Ltr>{formatDateTime(r.start_at)}</Ltr></dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("detail.return")}</dt><dd><Ltr>{formatDateTime(r.end_at)}</Ltr>{r.extended_days ? <Badge variant="info" className="ms-2">{t("detail.extended", { days: r.extended_days })}</Badge> : null}</dd></div>
              {r.actual_return_at ? <div><dt className="text-xs text-muted-foreground">{t("detail.actualReturn")}</dt><dd><Ltr>{formatDateTime(r.actual_return_at)}</Ltr></dd></div> : null}
              {r.delivery ? <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">{t("detail.delivery")}</dt><dd>{r.delivery_place}{r.return_place ? <><Arrow />{r.return_place}</> : null}</dd></div> : null}
              <div><dt className="text-xs text-muted-foreground">{t("detail.kmOut")}</dt><dd><Ltr>{r.km_out ?? "—"}</Ltr>{r.km_in ? <><Arrow /><Ltr>{r.km_in}</Ltr></> : null}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("detail.fuel")}</dt><dd><Ltr>{fuel(r.fuel_out)}</Ltr>{r.fuel_in !== null ? <><Arrow /><Ltr>{fuel(r.fuel_in)}</Ltr></> : null}</dd></div>
              {r.cancel_reason ? <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">{t("detail.cancelReason")}</dt><dd>{r.cancel_reason}</dd></div> : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="size-5 text-muted-foreground" aria-hidden />
              {t("detail.price")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-2"><dt>{t("detail.days", { count: totals?.days ?? 0 })} × <Ltr>{formatMoney(r.daily_price)}</Ltr></dt><dd><Ltr>{formatMoney((totals?.days ?? 0) * Number(r.daily_price))}</Ltr></dd></div>
              {r.delivery ? <div className="flex justify-between gap-2"><dt>{t("detail.deliveryFee")}</dt><dd><Ltr>{formatMoney(r.delivery_fee)}</Ltr></dd></div> : null}
              <div className="flex justify-between gap-2 border-t pt-2 text-base font-bold"><dt>{t("detail.total")}</dt><dd data-testid="detail-total"><Ltr>{formatMoney(totals?.total ?? 0)}</Ltr></dd></div>
              <div className="flex justify-between gap-2"><dt>{t("detail.paid")}</dt><dd><Ltr>{formatMoney(totals?.paid ?? 0)}</Ltr></dd></div>
              <div className="flex justify-between gap-2 font-semibold"><dt>{t("detail.balance")}</dt><dd data-testid="detail-balance"><Ltr>{formatMoney(totals?.balance ?? 0)}</Ltr></dd></div>
              <div className="flex justify-between gap-2 text-muted-foreground"><dt>{t("detail.franchise")}</dt><dd><Ltr>{formatMoney(r.franchise)}</Ltr></dd></div>
              <div className="flex justify-between gap-2 text-muted-foreground"><dt>{t("detail.deposit")}</dt><dd>{r.deposit_taken ? <Ltr>{formatMoney(r.deposit_amount)}</Ltr> : t("detail.noDeposit")}</dd></div>
            </dl>
            {payments.length ? (
              <ul className="flex flex-col divide-y border-t pt-2 text-sm" data-testid="payments">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 py-1.5">
                    <span>{tp(`kinds.${p.kind}`)} · {tp(p.method)} · <Ltr>{formatDate(p.paid_at)}</Ltr></span>
                    <Ltr className={p.kind === "deposit_refund" ? "text-muted-foreground" : "font-semibold"}>{p.kind === "deposit_refund" ? "−" : ""}{formatMoney(p.amount)}</Ltr>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>

        {driverCard(r.client as Driver, t("wizard.driver1"))}
        {driverCard(r.driver2 as Driver, t("wizard.driver2"))}

        {r.equipment.length || r.documents_given.length || r.notes ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardListIcon className="size-5 text-muted-foreground" aria-hidden />
                {t("detail.checklist")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {r.equipment.length ? <p><span className="text-muted-foreground">{t("wizard.equipment")} : </span>{r.equipment.join(", ")}</p> : null}
              {r.documents_given.length ? <p><span className="text-muted-foreground">{t("wizard.documents")} : </span>{r.documents_given.join(", ")}</p> : null}
              {r.notes ? <p><span className="text-muted-foreground">{t("wizard.notes")} : </span>{r.notes}</p> : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
