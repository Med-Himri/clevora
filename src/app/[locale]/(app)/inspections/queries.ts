import type { Damage, View } from "@/lib/inspections/model";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Kind } from "./schema";

export type InspectionPhoto = { view: View; url: string | null; thumb: string | null };
export type InspectionData = {
  id: string;
  kind: Kind;
  completedAt: string | null;
  notes: string | null;
  aiStatus: "none" | "running" | "done" | "failed";
  aiCheckedAt: string | null;
  photos: InspectionPhoto[];
  damages: Damage[];
};

/** Both inspections of a reservation, with 1-hour private links to the photos. */
export async function getInspections(supabase: ServerSupabase, agencyId: string, reservationId: string): Promise<Record<Kind, InspectionData | null>> {
  const { data } = await supabase
    .from("inspections")
    .select("id, kind, completed_at, notes, ai_status, ai_checked_at, photos:inspection_photos(view, storage_path), damages:inspection_damages(id, x, y, type, view, note, source, confirmed, created_at)")
    .eq("agency_id", agencyId)
    .eq("reservation_id", reservationId);
  const rows = data ?? [];
  const paths = rows.flatMap((r) => (r.photos ?? []).flatMap((p) => [p.storage_path, p.storage_path.replace(/\.jpg$/, "-s.jpg")]));
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await supabase.storage.from("agency-docs").createSignedUrls(paths, 3600);
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
  }
  const out: Record<Kind, InspectionData | null> = { departure: null, return: null };
  for (const r of rows) {
    out[r.kind as Kind] = {
      id: r.id,
      kind: r.kind as Kind,
      completedAt: r.completed_at,
      notes: r.notes,
      aiStatus: r.ai_status as InspectionData["aiStatus"],
      aiCheckedAt: r.ai_checked_at,
      photos: (r.photos ?? []).map((p) => ({ view: p.view as View, url: signed.get(p.storage_path) ?? null, thumb: signed.get(p.storage_path.replace(/\.jpg$/, "-s.jpg")) ?? signed.get(p.storage_path) ?? null })),
      damages: (r.damages ?? [])
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((d) => ({ id: d.id, x: Number(d.x), y: Number(d.y), type: d.type as Damage["type"], view: d.view as View | null, note: d.note, source: d.source as Damage["source"], confirmed: d.confirmed })),
    };
  }
  return out;
}
