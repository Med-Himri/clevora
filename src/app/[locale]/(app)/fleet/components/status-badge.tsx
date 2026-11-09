"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Ltr } from "@/components/app/ltr";
import type { VehicleStatus } from "@/lib/fleet/status";
import { formatDate, formatTime } from "@/lib/format";

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const t = useTranslations("fleet.status");
  const tr = useTranslations("fleet.reasons");
  switch (status.kind) {
    case "maintenance":
      return (
        <Badge variant="warning" data-testid="vehicle-status">
          {t("maintenance")} · {tr(status.reason)}
          {status.until ? (
            <>
              {" · "}
              {t("until")} <Ltr>{formatDate(status.until).slice(0, 5)}</Ltr>
            </>
          ) : null}
        </Badge>
      );
    case "on_rental":
      return (
        <Badge variant="info" data-testid="vehicle-status">
          {t("on_rental")} · {t("until")} <Ltr>{formatDate(status.until).slice(0, 5)}</Ltr>
        </Badge>
      );
    case "blocked":
      return (
        <Badge variant="danger" data-testid="vehicle-status">
          {t("blocked")}
        </Badge>
      );
    case "reserved_today":
      return (
        <Badge variant="neutral" data-testid="vehicle-status">
          {t("reserved_today")} · <Ltr>{formatTime(status.at)}</Ltr>
        </Badge>
      );
    case "sold":
      return (
        <Badge variant="neutral" data-testid="vehicle-status">
          {t("sold")}
        </Badge>
      );
    default:
      return (
        <Badge variant="success" data-testid="vehicle-status">
          {t("available")}
        </Badge>
      );
  }
}
