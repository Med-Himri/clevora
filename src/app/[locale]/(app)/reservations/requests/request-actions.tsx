"use client";

import { CheckIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { useAgency } from "@/components/app/agency-context";
import { Button } from "@/components/ui/button";
import { setRequestStatusAction } from "./actions";

export function RequestActions({ id, status }: { id: string; status: string }) {
  const t = useTranslations("requests");
  const te = useTranslations("errors");
  const tn = useTranslations("notices");
  const { writable } = useAgency();
  const [pending, startTransition] = useTransition();
  const set = (s: "new" | "handled" | "declined") =>
    startTransition(async () => {
      const r = await setRequestStatusAction(id, s);
      if (r.ok) toast.success(tn("saved"));
      else toast.error(te(r.error));
    });
  if (status !== "new") {
    return (
      <Button variant="ghost" size="sm" disabled={pending || !writable} onClick={() => set("new")}>
        <RotateCcwIcon aria-hidden />
        {t("reopen")}
      </Button>
    );
  }
  return (
    <>
      <Button variant="outline" size="sm" disabled={pending || !writable} onClick={() => set("handled")}>
        <CheckIcon aria-hidden />
        {t("handled")}
      </Button>
      <Button variant="ghost" size="sm" className="text-destructive" disabled={pending || !writable} onClick={() => set("declined")}>
        <XIcon aria-hidden />
        {t("decline")}
      </Button>
    </>
  );
}
