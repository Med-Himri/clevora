/**
 * Text groups used by client components ("use client"). Only these are sent
 * to the browser; the others (marketing, privacy policy, dashboard, activity…)
 * are rendered on the server. `npm run i18n:check` fails if a client component
 * uses a group missing from this list.
 */
export const CLIENT_NAMESPACES = [
  "account",
  "app",
  "assistant",
  "auth",
  "billing",
  "charges",
  "common",
  "contracts",
  "errors",
  "fleet",
  "insurance",
  "nav",
  "notices",
  "oil",
  "platform",
  "reservations",
  "roles",
  "settings",
  "statistics",
  "team",
  "validation",
] as const;

export function pickMessages(messages: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(keys.filter((k) => k in messages).map((k) => [k, messages[k]]));
}
