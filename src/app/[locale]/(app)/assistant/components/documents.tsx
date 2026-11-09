"use client";

import { BookOpenIcon, FileUpIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useAgency } from "@/components/app/agency-context";
import { Ltr } from "@/components/app/ltr";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { addDocumentAction, deleteDocumentAction } from "../actions";
import { DOC_MAX_CHARS } from "../schema";

export type DocRow = { id: string; title: string; date: string };

/** Admins: the agency documents the assistant can quote (règlement, conditions, tarifs). */
export function Documents({ docs }: { docs: DocRow[] }) {
  const t = useTranslations("assistant.docs");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const tn = useTranslations("notices");
  const { writable } = useAgency();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<DocRow | null>(null);
  const [pending, startTransition] = useTransition();

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name) && !file.type.startsWith("text/")) {
      toast.error(t("onlyText"));
      return;
    }
    const text = await file.text();
    setContent(text.slice(0, DOC_MAX_CHARS));
    if (!title) setTitle(file.name.replace(/\.(txt|md)$/i, ""));
  };

  const save = () =>
    startTransition(async () => {
      const r = await addDocumentAction({ title, content });
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(te(r.error));
        return;
      }
      toast.success(tn("saved"));
      setOpen(false);
      setTitle("");
      setContent("");
      setErrors({});
    });

  return (
    <section aria-labelledby="docs-title" className="flex flex-col gap-3 rounded-xl border bg-card p-4" data-testid="assistant-docs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="docs-title" className="flex items-center gap-2 font-semibold">
          <BookOpenIcon className="size-5 text-muted-foreground" aria-hidden />
          {t("title")}
        </h2>
        <Button variant="outline" onClick={() => setOpen(true)} disabled={!writable}>
          <PlusIcon aria-hidden />
          {t("add")}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
      {docs.length ? (
        <ul className="flex flex-col divide-y">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 py-1">
              <Link href={`/assistant?doc=${d.id}`} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-md hover:underline">
                <span dir="auto" className="truncate font-medium">{d.title}</span>
                <span className="text-xs text-muted-foreground"><Ltr>{d.date}</Ltr></span>
              </Link>
              <Button variant="ghost" size="icon" className="text-destructive" aria-label={t("delete", { title: d.title })} disabled={!writable} onClick={() => setToDelete(d)}>
                <Trash2Icon aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{t("empty")}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={tc("close")} className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("addTitle")}</DialogTitle>
            <DialogDescription>{t("addHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field id="doc-title" label={t("docTitle")} error={errors.title}>
              <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("docTitlePlaceholder")} maxLength={120} />
            </Field>
            <Field id="doc-content" label={t("content")} error={errors.content}>
              <Textarea id="doc-content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} dir="auto" placeholder={t("contentPlaceholder")} maxLength={DOC_MAX_CHARS} />
            </Field>
            <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-accent focus-within:outline-2 focus-within:outline-ring">
              <FileUpIcon className="size-4" aria-hidden />
              {t("fromFile")}
              <input type="file" accept=".txt,.md,text/plain,text/markdown" className="sr-only" onChange={(e) => void readFile(e.target.files?.[0])} />
            </label>
          </div>
          <DialogFooter>
            <Button size="lg" onClick={save} disabled={pending}>
              <SaveIcon aria-hidden />
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("deleteTitle")}
        description={t("deleteBody")}
        confirmLabel={t("deleteConfirm")}
        confirmIcon={<Trash2Icon aria-hidden />}
        destructive
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            if (!toDelete) return;
            const r = await deleteDocumentAction(toDelete.id);
            setToDelete(null);
            if (r.ok) toast.success(tn("saved"));
            else toast.error(te(r.error));
          })
        }
      />
    </section>
  );
}
