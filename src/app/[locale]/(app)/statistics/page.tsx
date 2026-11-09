import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/components/app/coming-soon";
import { requireRole } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("statistics") };
}

/** Admins only (staff never see money; RLS enforces it too). */
export default async function Page() {
  await requireRole(["admin"]);
  return <ComingSoon section="statistics" />;
}
