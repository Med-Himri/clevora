import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, SENTRY_OPTIONS } from "@/lib/monitoring";

/** Browser error monitoring (only when a Sentry DSN is configured). */
if (SENTRY_DSN) Sentry.init(SENTRY_OPTIONS);

export const onRouterTransitionStart = SENTRY_DSN ? Sentry.captureRouterTransitionStart : undefined;
