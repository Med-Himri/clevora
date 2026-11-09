"use client";

import { PencilIcon, PlayCircleIcon, WrenchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Can, useAgency } from "@/components/app/agency-context";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { endMaintenanceAction } from "../actions";
import { MaintenanceSheet } from "./maintenance-sheet";

/** Row / page actions: Maintenance or Remettre en service (staff too), Modifier (admins). */
export function VehicleActions({
  vehicleId,
  vehicleLabel,
  openMaintenanceId,
  sold,
  showEdit = true,
}: {
  vehicleId: string;
  vehicleLabel: string;
  openMaintenanceId: string | null;
  sold?: boolean;
  showEdit?: boolean;
}) {
  const t = useTranslations("fleet.actions");
  const te = useTranslations("errors");
  const { writable } = useAgency();
  const [sheet, setSheet] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      {sold ? null : openMaintenanceId ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending || !writable}
          onClick={() =>
            startTransition(async () => {
              const result = await endMaintenanceAction(openMaintenanceId);
              if (result.ok) toast.success(t("backInService"));
              else toast.error(te(result.error));
            })
          }
        >
          <PlayCircleIcon aria-hidden />
          {t("endMaintenance")}
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={!writable} onClick={() => setSheet(true)}>
          <WrenchIcon aria-hidden />
          {t("maintenance")}
        </Button>
      )}
      {showEdit ? (
        <Can role="admin">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/fleet/${vehicleId}/edit`}>
              <PencilIcon aria-hidden />
              {t("edit")}
            </Link>
          </Button>
        </Can>
      ) : null}
      {sheet ? <MaintenanceSheet vehicleId={vehicleId} vehicleLabel={vehicleLabel} open={sheet} onOpenChange={setSheet} /> : null}
    </>
  );
}
