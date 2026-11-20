import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Ltr } from "@/components/app/ltr";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireAgency } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { InspectionCapture } from "../../../../inspections/components/inspection-capture";
import { getInspections } from "../../../../inspections/queries";
import { KINDS, type Kind } from "../../../../inspections/schema";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inspection");
  return { title: t("title") };
}

/** Inspection départ / retour of one contract: photos per view + damage marks. */
export default async function InspectionPage({ params }: PageProps<"/[locale]/contracts/[id]/inspection/[kind]">) {
  const { id, kind } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id) || !KINDS.includes(kind as Kind)) notFound();
  const { agency } = await requireAgency();
  const t = await getTranslations("inspection");
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("reservations")
    .select("id, contract_number, status, vehicle:vehicles!reservations_agency_id_vehicle_id_fkey(plate, brand_model), client:clients!reservations_agency_id_client_id_fkey(full_name)")
    .eq("agency_id", agency.id)
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();
  const all = await getInspections(supabase, agency.id, id);
  let inspection = all[kind as Kind];
  if (!inspection) {
    // First visit: open the inspection (staff can do it; RLS checks the agency).
    // Built from the insert itself: a second identical read in the same render
    // would be answered from Next's request memo (still empty).
    const { data: created } = await supabase.from("inspections").insert({ agency_id: agency.id, reservation_id: id, kind }).select("id").single();
    if (!created) notFound();
    inspection = { id: created.id, kind: kind as Kind, completedAt: null, notes: null, aiStatus: "none", aiCheckedAt: null, photos: [], damages: [] };
  }

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link href={`/contracts/${id}`}>
          <ArrowLeftIcon className="rtl:rotate-180" aria-hidden />
          {t("backToContract")}
        </Link>
      </Button>
      <PageHeader
        title={kind === "departure" ? t("titleDeparture") : t("titleReturn")}
        subtitle={
          <>
            <Ltr>{r.contract_number}</Ltr> · {r.client?.full_name}
            {r.vehicle ? (
              <>
                {" "}· {r.vehicle.brand_model} <Ltr>{r.vehicle.plate}</Ltr>
              </>
            ) : null}
          </>
        }
      />
      <InspectionCapture agencyId={agency.id} reservationId={id} kind={kind as Kind} inspection={inspection} reference={kind === "return" ? (all.departure?.damages ?? []) : []} />
    </>
  );
}
