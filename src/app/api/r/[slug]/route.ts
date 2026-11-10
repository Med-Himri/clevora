import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { zodFieldErrors } from "@/lib/action-result";
import { bookingRequestSchema } from "@/lib/booking/schema";
import { verifyTurnstile } from "@/lib/booking/turnstile";
import { escapeHtml } from "@/lib/email/html";
import { siteUrl } from "@/lib/env";
import { getEmailSender } from "@/lib/email/sender";
import { formatDate } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_PER_HOUR = 5;

/**
 * A visitor asks for a car on /r/{slug}. Checks: the page is open, anti-robot,
 * at most 5 requests per hour per address, the car belongs to the agency.
 * Written with the service role (visitors have no database access at all).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = bookingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalidForm", fieldErrors: zodFieldErrors(parsed.error.issues) }, { status: 400 });
  const v = parsed.data;

  const supabase = await createClient();
  const { data: agency } = await supabase.rpc("public_agency", { p_slug: slug });
  const info = agency as { id: string; name: string; cars: Array<{ id: string; brand_model: string }> } | null;
  if (!info) return NextResponse.json({ error: "notFound" }, { status: 404 });
  if (v.vehicle_id && !info.cars.some((c) => c.id === v.vehicle_id)) return NextResponse.json({ error: "invalidForm" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
  if (!(await verifyTurnstile(v.turnstile, ip))) return NextResponse.json({ error: "robot" }, { status: 400 });

  const admin = createAdminClient();
  const ipHash = ip ? createHash("sha256").update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex").slice(0, 32) : null;
  if (ipHash) {
    const { count } = await admin
      .from("booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", new Date(Date.now() - 3600_000).toISOString());
    if ((count ?? 0) >= MAX_PER_HOUR) return NextResponse.json({ error: "tooMany" }, { status: 429 });
  }

  const { error } = await admin.from("booking_requests").insert({
    agency_id: info.id,
    vehicle_id: v.vehicle_id || null,
    full_name: v.full_name,
    phone: v.phone,
    email: v.email || null,
    start_date: v.start_date,
    end_date: v.end_date,
    delivery_place: v.delivery_place || null,
    message: v.message || null,
    ip_hash: ipHash,
  });
  if (error) return NextResponse.json({ error: "unknown" }, { status: 500 });

  // Tell the agency's admins (best effort: the request is saved either way).
  try {
    const { data: admins } = await admin
      .from("agency_members")
      .select("profile:profiles!agency_members_user_id_fkey(email)")
      .eq("agency_id", info.id)
      .eq("role", "admin")
      .eq("status", "active");
    const car = info.cars.find((c) => c.id === v.vehicle_id)?.brand_model ?? "—";
    const text = `Nouvelle demande de réservation en ligne : ${v.full_name} (${v.phone}), du ${formatDate(v.start_date)} au ${formatDate(v.end_date)}, voiture : ${car}. Ouvrez Parcolia > Réservations > Demandes en ligne.`;
    const html = `<p>${escapeHtml(text)}</p><p><a href="${escapeHtml(siteUrl("/reservations/requests"))}">Voir la demande</a></p>`;
    const sender = getEmailSender();
    for (const a of admins ?? []) {
      if (a.profile?.email) await sender.send({ to: a.profile.email, subject: `${info.name} · nouvelle demande en ligne`, text, html });
    }
  } catch {
    // ignore e-mail failures
  }
  return NextResponse.json({ ok: true });
}
