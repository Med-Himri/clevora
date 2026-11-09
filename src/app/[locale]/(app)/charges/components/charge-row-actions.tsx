"use client";

import { ReceiptIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useAgency } from "@/components/app/agency-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteChargeAction, receiptUrlAction } from "../actions";
import { ChargeSheet, type ChargeRow } from "./charge-sheet";

export function ChargeRowActions({ charge, cars, receiptPath }: { charge: ChargeRow; cars: Array<{ id: string; label: string }>; receiptPath: string | null }) {
  const t = useTranslations("charges");
  const te = useTranslations("errors");
  const tn = useTranslations("notices");
  const { writable } = useAgency();
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-1">
      {receiptPath ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            startTransition(async () => {
              const r = await receiptUrlAction(receiptPath);
              if (r.ok) window.open(r.data, "_blank", "noopener,noreferrer");
              else toast.error(te(r.error));
            })
          }
        >
          <ReceiptIcon aria-hidden />
          {t("viewReceipt")}
        </Button>
      ) : null}
      <ChargeSheet charge={charge} cars={cars} />
      <Button variant="ghost" size="sm" className="text-destructive" disabled={!writable} onClick={() => setConfirm(true)}>
        <Trash2Icon aria-hidden />
        {t("delete")}
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("deleteTitle")}
        description={t("deleteBody")}
        confirmLabel={t("delete")}
        confirmIcon={<Trash2Icon aria-hidden />}
        destructive
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const r = await deleteChargeAction(charge.id);
            setConfirm(false);
            if (r.ok) toast.success(tn("saved"));
            else toast.error(te(r.error));
          })
        }
      />
    </div>
  );
}
