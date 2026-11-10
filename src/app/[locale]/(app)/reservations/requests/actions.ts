"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { dbErrorKey, requireActionContext } from "@/lib/auth/action";

/** Mark an online request as handled (booked or called back) or declined. */
export async function setRequestStatusAction(id: string, status: "new" | "handled" | "declined"): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success || !["new", "handled", "declined"].includes(status)) return fail("invalidForm");
  const guard = await requireActionContext();
  if (!guard.ok) return guard;
  const { supabase, agency, user } = guard.ctx;
  const { error, count } = await supabase
    .from("booking_requests")
    .update({ status, handled_by: status === "new" ? null : user.id }, { count: "exact" })
    .eq("id", id)
    .eq("agency_id", agency.id);
  if (error) return fail(dbErrorKey(error));
  if (!count) return fail("forbidden");
  revalidatePath("/[locale]/reservations/requests", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return ok();
}
