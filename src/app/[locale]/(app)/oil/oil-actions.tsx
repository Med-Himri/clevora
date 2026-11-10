"use client";

import { CheckIcon, DropletIcon, GaugeIcon, SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Can, useAgency } from "@/components/app/agency-context";
import { RowMenu } from "@/components/app/row-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { DateField, MoneyField } from "@/components/ui/fields";
import { Input } from "@/components/ui/input";
import { dayKey } from "@/lib/format";
import { recordOilChangeAction, updateKmAction } from "./actions";

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ");
const digits = (s: string) => s.replace(/\D/g, "");

export function OilActions({
  vehicleId,
  label,
  currentKm,
  lastInterval,
  compact = false,
  urgent = true,
}: {
  vehicleId: string;
  label: string;
  currentKm: number;
  /** km between the last two oil changes of this car (a suggestion, never applied automatically) */
  lastInterval: number | null;
  /** Table row: "Vidange faite" + a "⋯" menu for the km. */
  compact?: boolean;
  /** Due or soon: the main button is filled, otherwise outlined. */
  urgent?: boolean;
}) {
  const t = useTranslations("oil");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const tv = useTranslations("validation");
  const { writable } = useAgency();
  const [open, setOpen] = useState<"oil" | "km" | null>(null);
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(dayKey(new Date()));
  const [km, setKm] = useState(String(currentKm));
  const [nextKm, setNextKm] = useState("");
  const [cost, setCost] = useState<number | null>(null);
  const [newKm, setNewKm] = useState(String(currentKm));
  const [error, setError] = useState<string | null>(null);

  const saveOil = () =>
    startTransition(async () => {
      const r = await recordOilChangeAction(vehicleId, { date, km: Number(km), next_km: Number(nextKm), cost });
      if (!r.ok) {
        setError(r.fieldErrors?.next_km ? tv(r.fieldErrors.next_km) : te(r.error));
        return;
      }
      toast.success(t("done"));
      setOpen(null);
    });
  const saveKm = () =>
    startTransition(async () => {
      const r = await updateKmAction(vehicleId, Number(newKm));
      if (!r.ok) return void toast.error(te(r.error));
      toast.success(t("kmSaved"));
      setOpen(null);
    });

  return (
    <div className={compact ? "flex items-center gap-1" : "flex flex-wrap items-center gap-2"}>
      <Button size="sm" variant={urgent ? "default" : "outline"} onClick={() => setOpen("oil")} disabled={!writable}>
        <DropletIcon aria-hidden />
        {t("done_button")}
      </Button>
      {compact ? (
        <RowMenu label={t("menu", { car: label })} items={[{ label: t("updateKm"), icon: GaugeIcon, onSelect: () => setOpen("km"), disabled: !writable }]} />
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen("km")} disabled={!writable}>
          <GaugeIcon aria-hidden />
          {t("updateKm")}
        </Button>
      )}

      <Dialog open={open === "oil"} onOpenChange={(o) => setOpen(o ? "oil" : null)}>
        <DialogContent closeLabel={tc("close")}>
          <DialogHeader>
            <DialogTitle>{t("doneTitle")}</DialogTitle>
            <DialogDescription>{label}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`oil-date-${vehicleId}`} label={t("date")}>
              <DateField id={`oil-date-${vehicleId}`} value={date} onChange={setDate} />
            </Field>
            <Field id={`oil-km-${vehicleId}`} label={t("kmAtChange")}>
              <Input id={`oil-km-${vehicleId}`} inputMode="numeric" dir="ltr" value={km} onChange={(e) => setKm(digits(e.target.value))} />
            </Field>
            <Field id={`oil-next-${vehicleId}`} label={t("nextKm")} className="sm:col-span-2" hint={t("nextKmHint")}>
              <Input id={`oil-next-${vehicleId}`} inputMode="numeric" dir="ltr" value={nextKm} onChange={(e) => setNextKm(digits(e.target.value))} />
            </Field>
            {lastInterval && km ? (
              <Button type="button" variant="outline" className="sm:col-span-2" onClick={() => setNextKm(String(Number(km) + lastInterval))}>
                <CheckIcon aria-hidden />
                {t("suggestion", { km: nf(Number(km) + lastInterval), interval: nf(lastInterval) })}
              </Button>
            ) : null}
            <Can role="admin">
              <Field id={`oil-cost-${vehicleId}`} label={t("cost")} hint={t("costHint")} className="sm:col-span-2">
                <MoneyField id={`oil-cost-${vehicleId}`} value={cost} onChange={setCost} />
              </Field>
            </Can>
            {error ? <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button size="lg" onClick={saveOil} disabled={pending || !km || !nextKm}>
              <SaveIcon aria-hidden />
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "km"} onOpenChange={(o) => setOpen(o ? "km" : null)}>
        <DialogContent closeLabel={tc("close")}>
          <DialogHeader>
            <DialogTitle>{t("updateKm")}</DialogTitle>
            <DialogDescription>{label}</DialogDescription>
          </DialogHeader>
          <Field id={`km-${vehicleId}`} label={t("currentKm")}>
            <Input id={`km-${vehicleId}`} inputMode="numeric" dir="ltr" value={newKm} onChange={(e) => setNewKm(digits(e.target.value))} />
          </Field>
          <DialogFooter>
            <Button size="lg" onClick={saveKm} disabled={pending || !newKm}>
              <SaveIcon aria-hidden />
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
