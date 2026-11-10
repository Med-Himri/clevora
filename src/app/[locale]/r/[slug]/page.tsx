import { CarIcon, FuelIcon, MapPinIcon, PhoneIcon, SendIcon, SettingsIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AgencyLogo } from "@/components/app/agency-logo";
import { BrandStyle } from "@/components/app/brand-style";
import { LocaleLinks } from "@/components/app/locale-links";
import { Ltr } from "@/components/app/ltr";
import { ParcoliaLogo } from "@/components/app/parcolia-logo";
import { Button } from "@/components/ui/button";
import { resolveBrandColor } from "@/lib/brand";
import { formatMoney } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { logoUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "./booking-form";

type PublicCar = { id: string; brand_model: string; category: string; fuel: string; gearbox: string; daily_rate: number };
type PublicAgency = {
  id: string; name: string; slug: string; logo_path: string | null; brand_color: string | null; city: string | null; phone: string | null;
  email: string | null; address: string | null; message: string | null; min_driver_age: number; default_deposit: number; cars: PublicCar[];
};

async function load(slug: string): Promise<PublicAgency | null> {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_agency", { p_slug: slug });
  return (data as PublicAgency | null) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/r/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await load(slug);
  const t = await getTranslations("publicBooking");
  return a ? { title: { absolute: `${a.name} · ${t("title")}` }, description: t("metaDescription", { name: a.name, city: a.city ?? "" }) } : { title: "Parcolia" };
}

/** Public booking page of an agency (agency branding, opened in Paramètres). */
export default async function PublicBookingPage({ params, searchParams }: PageProps<"/[locale]/r/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const a = await load(slug);
  if (!a) notFound();
  const t = await getTranslations("publicBooking");
  const tf = await getTranslations("fleet");
  const brand = resolveBrandColor(a.brand_color ?? "");
  const preselected = typeof sp.car === "string" && a.cars.some((c) => c.id === sp.car) ? sp.car : undefined;

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40 dark:bg-background">
      <BrandStyle brand={brand.brand} foreground={brand.foreground} />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <AgencyLogo name={a.name} url={logoUrl(a.logo_path)} size={48} />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold">{a.name}</h1>
              {a.city ? (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPinIcon className="size-4" aria-hidden />
                  {a.city}
                </p>
              ) : null}
            </div>
          </div>
          {a.phone ? (
            <Button variant="outline" asChild>
              <a href={`tel:${a.phone}`}>
                <PhoneIcon aria-hidden />
                <Ltr>{formatPhone(a.phone)}</Ltr>
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="cars-title" className="flex min-w-0 flex-col gap-3">
          <Button size="lg" asChild className="lg:hidden">
            <a href="#reserver">
              <SendIcon className="rtl:-scale-x-100" aria-hidden />
              {t("formTitle")}
            </a>
          </Button>
          <h2 id="cars-title" className="text-2xl font-bold">{t("carsTitle")}</h2>
          {a.message ? <p className="text-muted-foreground" dir="auto">{a.message}</p> : null}
          <p className="text-sm text-muted-foreground">{t("conditions", { age: a.min_driver_age })}</p>
          {a.cars.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-muted-foreground">{t("noCars")}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2" data-testid="public-cars">
              {a.cars.map((c) => (
                <li key={c.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                  <span className="flex items-center gap-2 font-semibold">
                    <CarIcon className="size-5 text-brand" aria-hidden />
                    {c.brand_model}
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>{tf(`categories.${c.category}`)}</span>
                    <span className="flex items-center gap-1"><FuelIcon className="size-3.5" aria-hidden />{tf(`fuels.${c.fuel}`)}</span>
                    <span className="flex items-center gap-1"><SettingsIcon className="size-3.5" aria-hidden />{tf(`gearboxes.${c.gearbox}`)}</span>
                  </span>
                  <span className="text-lg font-bold">
                    {t("from")} <Ltr>{formatMoney(c.daily_rate)}</Ltr> <span className="text-sm font-normal text-muted-foreground">{t("perDay")}</span>
                  </span>
                  <a href={`?car=${c.id}#reserver`} className="inline-flex min-h-11 items-center font-semibold text-brand underline-offset-4 hover:underline">
                    {t("bookThis")}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section id="reserver" aria-labelledby="form-title" className="flex scroll-mt-4 flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          <h2 id="form-title" className="text-2xl font-bold">{t("formTitle")}</h2>
          <BookingForm slug={a.slug} preselected={preselected} cars={a.cars.map((c) => ({ id: c.id, label: `${c.brand_model} · ${formatMoney(c.daily_rate)}` }))} />
        </section>
      </main>

      <footer className="flex flex-col items-center gap-2 px-4 py-6 text-xs text-muted-foreground">
        <Suspense>
          <LocaleLinks />
        </Suspense>
        <span className="flex items-center gap-2">
          {t("poweredBy")} <ParcoliaLogo className="[&_svg]:size-5 [&_span]:text-sm" />
        </span>
      </footer>
    </div>
  );
}
