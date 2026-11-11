import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, SENTRY_OPTIONS } from "@/lib/monitoring";

/** Server / edge error monitoring (only when a Sentry DSN is configured). */
export async function register() {
  if (!SENTRY_DSN) return;
  Sentry.init(SENTRY_OPTIONS);
}

export const onRequestError = SENTRY_DSN ? Sentry.captureRequestError : undefined;
