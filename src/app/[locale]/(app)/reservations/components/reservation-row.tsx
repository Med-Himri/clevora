import { CornerDownLeftIcon, PhoneIcon, PlayIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Arrow, Ltr } from "@/components/app/ltr";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { ListedReservation } from "../queries";
import { ReservationStatusBadge } from "./status-badge";

/** One reservation in a list: contract, client + phone, car, dates, balance, status, quick actions. */
export async function ReservationRow({ r, now }: { r: ListedReservation; now: Date }) {
  const t = await getTranslations("reservations.list");
  const late = r.status === "on_rental" && new Date(r.end_at) < now;
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs md:flex-row md:items-center" data-testid="reservation-row">
      <Link href={`/contracts/${r.id}`} className="flex min-w-0 flex-1 flex-col gap-1 rounded-md">
        <span className="flex flex-wrap items-center gap-2">
          <Ltr className="font-bold">{r.contract_number}</Ltr>
          <ReservationStatusBadge status={r.status} late={late} signed={Boolean(r.signed_at)} />
          {r.balance > 0 && r.status !== "cancelled" ? (
            <span className="text-sm font-semibold text-warning">
              {t("balance")} <Ltr>{formatMoney(r.balance)}</Ltr>
            </span>
          ) : null}
        </span>
        <span className="font-semibold">{r.client.full_name}</span>
        <span className="text-sm text-muted-foreground">
          {r.vehicle.brand_model} · <Ltr>{r.vehicle.plate}</Ltr>
        </span>
        <span className="text-sm">
          <Ltr>{formatDateTime(r.start_at)}</Ltr><Arrow /><Ltr>{formatDateTime(r.actual_return_at ?? r.end_at)}</Ltr>
          {r.delivery && r.delivery_place ? <span className="text-muted-foreground"> · {t("delivery", { place: r.delivery_place })}</span> : null}
        </span>
      </Link>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {r.client.phone ? (
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${r.client.phone}`} aria-label={t("call", { name: r.client.full_name })}>
              <PhoneIcon aria-hidden />
              {t("callShort")}
            </a>
          </Button>
        ) : null}
        {r.status === "reserved" ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/contracts/${r.id}?do=start`}>
              <PlayIcon aria-hidden />
              {t("start")}
            </Link>
          </Button>
        ) : null}
        {r.status === "on_rental" ? (
          <Button size="sm" asChild>
            <Link href={`/contracts/${r.id}?do=return`}>
              <CornerDownLeftIcon aria-hidden />
              {t("return")}
            </Link>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
