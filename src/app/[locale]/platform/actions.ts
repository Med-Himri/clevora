"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { dbErrorKey } from "@/lib/auth/action";
import { isPlatformAdmin } from "@/lib/auth/platform";
import { casablancaToIso } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

function refresh() {
  revalidatePath("/[locale]/platform", "layout");
}

/** Parcolia received the money: invoice, plan switched, period extended (SQL function checks the role). */
export async function confirmPaymentAction(id: string): Promise<ActionResult<{ invoice: string }>> {
  if (!z.uuid().safeParse(id).success || !(await isPlatformAdmin())) return fail("forbidden");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_subscription_payment", { p_payment: id });
  if (error || !data) return fail(dbErrorKey(error));
  refresh();
  return ok({ invoice: data });
}

export async function cancelPaymentAction(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success || !(await isPlatformAdmin())) return fail("forbidden");
  const supabase = await createClient();
  const { error } = await supabase.from("subscription_payments").update({ status: "cancelled" }).eq("id", id).eq("status", "pending");
  if (error) return fail(dbErrorKey(error));
  refresh();
  return ok();
}

const agencySchema = z.object({
  id: z.uuid(),
  plan: z.enum(["essentiel", "pro", "illimite"]),
  status: z.enum(["trial", "active", "past_due", "suspended", "cancelled"]),
  trial_ends_on: z.union([z.iso.date(), z.literal("")]),
  period_ends_on: z.union([z.iso.date(), z.literal("")]),
});

/** Change an agency's plan, status and dates by hand (support, gestures, suspensions). */
export async function updateAgencyAction(input: z.input<typeof agencySchema>): Promise<ActionResult> {
  const parsed = agencySchema.safeParse(input);
  if (!parsed.success) return fail("invalidForm");
  if (!(await isPlatformAdmin())) return fail("forbidden");
  const supabase = await createClient();
  const { data: plan } = await supabase.from("plans").select("id").eq("code", parsed.data.plan).single();
  if (!plan) return fail("invalidForm");
  const { error, count } = await supabase
    .from("agencies")
    .update(
      {
        plan_id: plan.id,
        subscription_status: parsed.data.status,
        trial_ends_at: parsed.data.trial_ends_on ? casablancaToIso(parsed.data.trial_ends_on, "23:59") : null,
        current_period_end: parsed.data.period_ends_on ? casablancaToIso(parsed.data.period_ends_on, "23:59") : null,
      },
      { count: "exact" },
    )
    .eq("id", parsed.data.id);
  if (error) return fail(dbErrorKey(error));
  if (!count) return fail("forbidden");
  refresh();
  return ok();
}
