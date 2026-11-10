"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, SendIcon } from "lucide-react";
import Script from "next/script";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, fieldAria } from "@/components/ui/field";
import { DateField, PhoneField } from "@/components/ui/fields";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { bookingRequestSchema } from "@/lib/booking/schema";
import { dayKey } from "@/lib/format";

type Car = { id: string; label: string };

/** Visitor form: dates, car, name and phone. The agency calls back to confirm. */
export function BookingForm({ slug, cars, preselected }: { slug: string; cars: Car[]; preselected?: string }) {
  const t = useTranslations("publicBooking");
  const te = useTranslations("publicBooking.errors");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const today = dayKey(new Date());
  const form = useForm<z.input<typeof bookingRequestSchema>, unknown, z.output<typeof bookingRequestSchema>>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: { vehicle_id: preselected ?? "", start_date: "", end_date: "", full_name: "", phone: "", email: "", delivery_place: "", message: "", turnstile: "" },
  });
  const err = (k: keyof z.input<typeof bookingRequestSchema>) => form.formState.errors[k]?.message;

  const onSubmit = form.handleSubmit((_values, event) => {
    // Turnstile writes its token into a hidden input of the form.
    const formEl = event?.target as HTMLFormElement | undefined;
    const token = (formEl?.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value ?? "";
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/r/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form.getValues(), turnstile: token }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };
      if (res.ok && body.ok) {
        setDone(true);
        return;
      }
      for (const [k, m] of Object.entries(body.fieldErrors ?? {})) form.setError(k as "full_name", { message: m });
      setError(body.error ?? "unknown");
    });
  });

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center" role="status" data-testid="booking-done">
        <CheckCircle2Icon className="size-10 text-success" aria-hidden />
        <h2 className="text-xl font-bold">{t("doneTitle")}</h2>
        <p className="text-muted-foreground">{t("doneBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6" data-testid="booking-form">
      {siteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="b-start" label={t("start")} error={err("start_date")}>
          <Controller control={form.control} name="start_date" render={({ field }) => <DateField {...fieldAria("b-start", err("start_date"))} min={today} value={field.value} onChange={field.onChange} />} />
        </Field>
        <Field id="b-end" label={t("end")} error={err("end_date")}>
          <Controller control={form.control} name="end_date" render={({ field }) => <DateField {...fieldAria("b-end", err("end_date"))} min={today} value={field.value} onChange={field.onChange} />} />
        </Field>
      </div>
      <Field id="b-car" label={t("car")}>
        <select id="b-car" className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base" {...form.register("vehicle_id")}>
          <option value="">{t("anyCar")}</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="b-name" label={t("name")} error={err("full_name")}>
          <Input autoComplete="name" {...fieldAria("b-name", err("full_name"))} {...form.register("full_name")} />
        </Field>
        <Field id="b-phone" label={t("phone")} error={err("phone")}>
          <Controller control={form.control} name="phone" render={({ field }) => <PhoneField {...fieldAria("b-phone", err("phone"))} value={field.value} onChange={field.onChange} />} />
        </Field>
        <Field id="b-email" label={t("email")} error={err("email")}>
          <Input type="email" inputMode="email" autoComplete="email" dir="ltr" {...fieldAria("b-email", err("email"))} {...form.register("email")} />
        </Field>
        <Field id="b-place" label={t("place")}>
          <Input id="b-place" placeholder={t("placeHint")} {...form.register("delivery_place")} />
        </Field>
      </div>
      <Field id="b-message" label={t("message")}>
        <Textarea id="b-message" rows={3} dir="auto" maxLength={1000} {...form.register("message")} />
      </Field>
      {siteKey ? <div className="cf-turnstile" data-sitekey={siteKey} /> : null}
      {error ? <Alert variant="danger">{te.has(error) ? te(error) : te("unknown")}</Alert> : null}
      <Button type="submit" size="lg" disabled={pending}>
        <SendIcon className="rtl:-scale-x-100" aria-hidden />
        {t("send")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("privacy")}</p>
    </form>
  );
}
