import { z } from "zod";

export const CHARGE_CATEGORIES = ["carburant", "lavage", "vidange", "reparation", "assurance", "visite", "publicite", "salaires", "loyer", "autre"] as const;

export const chargeSchema = z
  .object({
    category: z.enum(CHARGE_CATEGORIES, { error: "required" }),
    date: z.iso.date({ error: "date" }),
    amount: z.number({ error: "required" }).positive({ error: "number" }).max(100_000_000, { error: "number" }),
    vehicle_id: z.union([z.literal(""), z.uuid()]).transform((v) => v || null),
    campaign_name: z.string().trim().max(120, { error: "nameMax" }).default(""),
    note: z.string().trim().max(500, { error: "nameMax" }).default(""),
    is_recurring: z.boolean().default(false),
  })
  .transform((v) => ({ ...v, campaign_name: v.category === "publicite" && v.campaign_name ? v.campaign_name : null, note: v.note || null }));
export type ChargeInput = z.input<typeof chargeSchema>;
