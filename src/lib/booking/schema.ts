import { z } from "zod";
import { emailField, personNameField, phoneField } from "@/lib/validation/common";

/** A visitor's booking request on /r/{slug}. Shared by the form and the server. */
export const bookingRequestSchema = z
  .object({
    vehicle_id: z.union([z.uuid(), z.literal("")]),
    start_date: z.iso.date("date"),
    end_date: z.iso.date("date"),
    full_name: personNameField,
    phone: phoneField,
    email: z.union([emailField, z.literal("")]),
    delivery_place: z.string().trim().max(200, "tooLong"),
    message: z.string().trim().max(1000, "tooLong"),
    turnstile: z.string().max(4096).default(""),
  })
  .refine((v) => v.end_date > v.start_date, { path: ["end_date"], error: "endBeforeStart" });

export type BookingRequestInput = z.input<typeof bookingRequestSchema>;
