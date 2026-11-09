import { CreditCardIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing");
  return { title: t("title") };
}

/** Placeholder: plans and payments come with the SaaS step. Admins only. */
export default async function BillingPage() {
  await requireRole(["admin"]);
  const t = await getTranslations("billing");
  return (
    <>
      <PageHeader title={t("title")} />
      <Card>
        <CardContent className="flex items-start gap-3 pt-4 sm:pt-6">
          <CreditCardIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">{t("comingSoon")}</p>
        </CardContent>
      </Card>
    </>
  );
}
