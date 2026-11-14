import type { ServerSupabase } from "@/lib/supabase/server";
import type { Profitability } from "./finance";

/** Profitability of the agency's cars (admins: the RPC refuses staff). */
export async function getProfitability(supabase: ServerSupabase, agencyId: string): Promise<Profitability[]> {
  const { data } = await supabase.rpc("vehicle_profitability", { p_agency: agencyId });
  const n = (x: unknown) => Number(x ?? 0);
  return (data ?? []).map((r) => ({
    ...r,
    mode: r.mode as Profitability["mode"],
    purchase_price: n(r.purchase_price),
    down_payment: n(r.down_payment),
    monthly_payment: r.monthly_payment === null ? null : n(r.monthly_payment),
    paid_so_far: n(r.paid_so_far),
    credit_left: n(r.credit_left),
    total_cost: n(r.total_cost),
    revenue: n(r.revenue),
    charges: n(r.charges),
    gain: n(r.gain),
    gain_3_months: n(r.gain_3_months),
  }));
}
