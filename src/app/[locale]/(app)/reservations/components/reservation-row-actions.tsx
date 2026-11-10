"use client";

import { CornerDownLeftIcon, EyeIcon, MessageCircleIcon, PhoneIcon, PlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { RowMenu, type RowMenuItem } from "@/components/app/row-menu";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { whatsappNumber } from "@/lib/phone";

/**
 * Quick actions of a reservation. Table: the main action (Démarrer / Retour)
 * plus a "⋯" menu; card: big buttons.
 */
export function ReservationRowActions({
  id,
  status,
  clientName,
  phone,
  compact,
}: {
  id: string;
  status: string;
  clientName: string;
  phone: string | null;
  compact: boolean;
}) {
  const t = useTranslations("reservations.list");
  const main =
    status === "reserved" ? (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/contracts/${id}?do=start`}>
          <PlayIcon aria-hidden />
          {t("start")}
        </Link>
      </Button>
    ) : status === "on_rental" ? (
      <Button size="sm" asChild>
        <Link href={`/contracts/${id}?do=return`}>
          <CornerDownLeftIcon aria-hidden />
          {t("return")}
        </Link>
      </Button>
    ) : null;

  if (compact) {
    const items: RowMenuItem[] = [{ label: t("open"), icon: EyeIcon, href: `/contracts/${id}` }];
    if (phone) {
      items.push({ label: t("callShort"), icon: PhoneIcon, onSelect: () => (window.location.href = `tel:${phone}`) });
      items.push({ label: "WhatsApp", icon: MessageCircleIcon, onSelect: () => window.open(`https://wa.me/${whatsappNumber(phone)}`, "_blank", "noopener,noreferrer") });
    }
    return (
      <>
        {main}
        <RowMenu label={t("menu", { name: clientName })} items={items} />
      </>
    );
  }

  return (
    <>
      {phone ? (
        <Button variant="outline" size="sm" asChild>
          <a href={`tel:${phone}`} aria-label={t("call", { name: clientName })}>
            <PhoneIcon aria-hidden />
            {t("callShort")}
          </a>
        </Button>
      ) : null}
      {main}
    </>
  );
}
