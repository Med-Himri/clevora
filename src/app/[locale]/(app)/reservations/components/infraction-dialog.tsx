"use client";

import { SearchIcon, SirenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateField, PlateField, TimeField } from "@/components/ui/fields";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

/** Infraction finder: a compact button next to the search; the form opens in a window that fits the phone. */
export function InfractionDialog({ plate: plate0, date: date0, time: time0 }: { plate: string; date: string; time: string }) {
  const t = useTranslations("reservations.infraction");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plate, setPlate] = useState(plate0);
  const [date, setDate] = useState(date0);
  const [time, setTime] = useState(time0);

  return (
    <>
      <Button type="button" variant="outline" size="lg" className="shrink-0 px-4" onClick={() => setOpen(true)} data-testid="infraction-open">
        <SirenIcon aria-hidden />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={t("close")}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("hint")}</DialogDescription>
          </DialogHeader>
          <form
            className="flex min-w-0 flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const p = new URLSearchParams({ plate, date });
              if (time) p.set("time", time);
              setOpen(false);
              router.push(`/reservations?${p.toString()}`);
            }}
          >
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="inf-plate">{t("plate")}</Label>
              <PlateField id="inf-plate" value={plate} onChange={setPlate} required />
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="inf-date">{t("date")}</Label>
                <DateField id="inf-date" value={date} onChange={setDate} required />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="inf-time">{t("time")}</Label>
                <TimeField id="inf-time" value={time} onChange={setTime} />
              </div>
            </div>
            <Button type="submit" size="lg">
              <SearchIcon aria-hidden />
              {t("submit")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
