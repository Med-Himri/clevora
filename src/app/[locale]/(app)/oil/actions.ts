"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, zodFieldErrors, type ActionResult } from "@/lib/action-result";
import { dbErrorKey, requireActionContext } from "@/lib/auth/action";

const km = z.number({ error: "required" }).int({ error: "number" }).min(0, { error: "number" }).max(5_000_000, { error: "number" });

const oilSchema = z
  .object({
    date: z.iso.date({ error: "date" }),
    km,
    next_km: km,
    cost: z.number().min(0).nullable(),
  })
  .refine((v) => v.next_km > v.km, { error: "oilNextAfterLast", path: ["next_km"] });
export type OilChangeInput = z.input<typeof oilSchema>;

function refresh() {
  revalidatePath("/[locale]", "layout");
}

/** "Vidange faite": staff too. The cost (a charge) is recorded only for admins. */
export async function recordOilChangeAction(vehicleId: string, input: OilChangeInput): Promise<ActionResult> {
  if (!z.uuid().safeParse(vehicleId).success) return fail("forbidden");
  const parsed = oilSchema.safeParse(input);
  if (!parsed.success) return fail("invalidForm", zodFieldErrors(parsed.error.issues));
  const guard = await requireActionContext();
  if (!guard.ok) return guard;
  const { supabase, agency } = guard.ctx;
  const v = parsed.data;
  const { data: car } = await supabase.from("vehicles").select("current_km").eq("id", vehicleId).eq("agency_id", agency.id).maybeSingle();
  if (!car) return fail("notFound");
  const { error } = await supabase
    .from("vehicles")
    .update({ oil_last_km: v.km, oil_last_date: v.date, oil_next_km: v.next_km, current_km: Math.max(car.current_km, v.km) })
    .eq("id", vehicleId)
    .eq("agency_id", agency.id);
  if (error) return fail(dbErrorKey(error));
  if (v.cost && v.cost > 0 && agency.role === "admin") {
    await supabase.from("charges").insert({ agency_id: agency.id, vehicle_id: vehicleId, category: "vidange", amount: v.cost, date: v.date, note: `Vidange à ${v.km} km` });
  }
  refresh();
  return ok();
}

/** Update the current km of a car (alerts everywhere follow). */
export async function updateKmAction(vehicleId: string, value: number): Promise<ActionResult> {
  if (!z.uuid().safeParse(vehicleId).success) return fail("forbidden");
  const parsed = km.safeParse(value);
  if (!parsed.success) return fail("invalidForm", { km: "number" });
  const guard = await requireActionContext();
  if (!guard.ok) return guard;
  const { data, error } = await guard.ctx.supabase
    .from("vehicles")
    .update({ current_km: parsed.data })
    .eq("id", vehicleId)
    .eq("agency_id", guard.ctx.agency.id)
    .select("id");
  if (error) return fail(dbErrorKey(error));
  if (!data?.length) return fail("notFound");
  refresh();
  return ok();
}
