import "server-only";
import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ACTIVE_AGENCY_COOKIE, ACTIVE_AGENCY_COOKIE_OPTIONS } from "@/lib/auth/session";
import type { ServerSupabase } from "@/lib/supabase/server";
import { safeNextPath } from "./next-path";

/**
 * After a successful login: open the user's language, pick the agency
 * (only one → straight in, several → picker unless the cookie is valid,
 * none → create one), then go to `next` or Aujourd'hui.
 */
export async function redirectAfterLogin(supabase: ServerSupabase, userId: string, next?: string | null): Promise<never> {
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("preferred_locale").eq("id", userId).maybeSingle(),
    supabase.from("agency_members").select("agency_id").eq("user_id", userId).eq("status", "active"),
  ]);
  const locale = (profile?.preferred_locale ?? "fr") as Locale;
  const target = safeNextPath(next) ?? "/dashboard";
  const ids = (memberships ?? []).map((m) => m.agency_id);
  const cookieStore = await cookies();

  if (target.startsWith("/invite/")) {
    // Logging in to accept an invitation: go straight back to it.
    redirect({ href: target, locale });
  } else if (ids.length === 0) {
    redirect({ href: "/signup", locale });
  } else if (ids.length === 1) {
    cookieStore.set(ACTIVE_AGENCY_COOKIE, ids[0], ACTIVE_AGENCY_COOKIE_OPTIONS);
    redirect({ href: target, locale });
  } else {
    const current = cookieStore.get(ACTIVE_AGENCY_COOKIE)?.value;
    redirect({ href: current && ids.includes(current) ? target : "/select-agency", locale });
  }
  throw new Error("unreachable");
}
