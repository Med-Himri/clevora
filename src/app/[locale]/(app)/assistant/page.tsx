import { BookOpenIcon, LockIcon, SparklesIcon, XIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { requireAgency } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { Chat } from "./components/chat";
import { Documents } from "./components/documents";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("assistant") };
}

const STAFF_SUGGESTIONS = ["whoHadCar", "returns", "free", "oil", "insurance", "deposit"] as const;
const ADMIN_SUGGESTIONS = ["revenue", "charges", "whoHadCar", "returns", "free", "oil"] as const;

/** Assistant IA: questions in plain words, answered from the agency's own data. */
export default async function AssistantPage({ searchParams }: PageProps<"/[locale]/assistant">) {
  const { agency } = await requireAgency();
  const isAdmin = agency.role === "admin";
  const sp = await searchParams;
  const t = await getTranslations("assistant");
  const supabase = await createClient();
  const docId = typeof sp.doc === "string" && /^[0-9a-f-]{36}$/i.test(sp.doc) ? sp.doc : null;
  const [{ data: quotaRows }, { data: docs }, { data: openDoc }] = await Promise.all([
    supabase.rpc("ai_quota", { p_agency: agency.id }),
    supabase.from("ai_documents").select("id, title, created_at").eq("agency_id", agency.id).order("created_at", { ascending: false }),
    docId
      ? supabase.from("ai_documents").select("id, title, chunks:ai_chunks(content, metadata)").eq("agency_id", agency.id).eq("id", docId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const quota = quotaRows?.[0];
  const configured = process.env.AI_PROVIDER === "mock" || Boolean(process.env.ANTHROPIC_API_KEY);
  const remaining = quota?.quota === null || quota?.quota === undefined ? null : Math.max(0, quota.quota - quota.used);

  if (!quota?.plan_allows) {
    return (
      <>
        <PageHeader title={t("title")} />
        <EmptyState
          icon={LockIcon}
          title={t("notInPlan")}
          description={isAdmin ? t("notInPlanAdmin") : t("notInPlanStaff")}
          action={isAdmin ? <Button size="lg" asChild><Link href="/billing">{t("seePlans")}</Link></Button> : undefined}
        />
      </>
    );
  }
  if (!quota.enabled) {
    return (
      <>
        <PageHeader title={t("title")} />
        <EmptyState icon={SparklesIcon} title={t("disabled")} description={isAdmin ? t("disabledAdmin") : t("disabledStaff")} />
      </>
    );
  }

  const suggestions = (isAdmin ? ADMIN_SUGGESTIONS : STAFF_SUGGESTIONS).map((k) => t(`suggestions.${k}`));
  const chunks = openDoc
    ? [...(openDoc.chunks ?? [])].sort((a, b) => Number((a.metadata as { index?: number })?.index ?? 0) - Number((b.metadata as { index?: number })?.index ?? 0))
    : [];

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {/* Phone: room under the content for the fixed question bar above the bottom nav */}
      <div className="grid gap-6 pb-40 md:pb-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          {openDoc ? (
            <Card data-testid="assistant-doc">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <BookOpenIcon className="size-5 text-muted-foreground" aria-hidden />
                  <span dir="auto">{openDoc.title}</span>
                </CardTitle>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/assistant" aria-label={t("closeDoc")}>
                    <XIcon aria-hidden />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div dir="auto" className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
                  {chunks.map((c) => c.content).join("\n\n")}
                </div>
              </CardContent>
            </Card>
          ) : null}
          {!configured ? <Alert variant="warning">{t("notConfigured")}</Alert> : null}
          {remaining === 0 ? <Alert variant="warning">{t("quotaReached")}</Alert> : null}
          <Chat suggestions={suggestions} remaining={remaining} />
          <details className="text-sm text-muted-foreground">
            <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-medium">
              <LockIcon className="size-4" aria-hidden />
              {t("privacyTitle")}
            </summary>
            <p className="mt-1 max-w-2xl">{isAdmin ? t("privacyAdmin") : t("privacyStaff")}</p>
          </details>
        </div>
        <aside className="flex min-w-0 flex-col gap-4">
          {isAdmin ? (
            <Documents docs={(docs ?? []).map((d) => ({ id: d.id, title: d.title, date: formatDate(d.created_at) }))} />
          ) : docs?.length ? (
            <section aria-labelledby="docs-title" className="flex flex-col gap-2 rounded-xl border bg-card p-4">
              <h2 id="docs-title" className="flex items-center gap-2 font-semibold">
                <BookOpenIcon className="size-5 text-muted-foreground" aria-hidden />
                {t("docs.title")}
              </h2>
              <ul className="flex flex-col">
                {docs.map((d) => (
                  <li key={d.id}>
                    <Link href={`/assistant?doc=${d.id}`} dir="auto" className="flex min-h-11 items-center rounded-md hover:underline">{d.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
