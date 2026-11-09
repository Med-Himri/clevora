/** Formatting rules from CLAUDE.md: "1 250 MAD", dd/mm/yyyy, Africa/Casablanca. */

export const TIME_ZONE = "Africa/Casablanca";

const moneyFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

/** 1250 → "1 250 MAD" (normal spaces so it never breaks layouts or copy/paste). */
export function formatMoney(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `${moneyFormatter.format(safe).replace(/[  ]/g, " ")} MAD`;
}

/** "1 250,50" / "1250.5" / "1 250" → 1250.5 (null when not a number). */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s  ]/g, "").replace(/MAD$/i, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

const dateParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Date or ISO string → "dd/mm/yyyy" in Casablanca time. */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value.length === 10 ? `${value}T12:00:00Z` : value) : value;
  return dateParts.format(d);
}

/** → "dd/mm/yyyy HH:mm" in Casablanca time. */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return `${dateParts.format(d)} ${timeParts.format(d)}`;
}

export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "";
  return timeParts.format(typeof value === "string" ? new Date(value) : value);
}

/** Calendar day "yyyy-mm-dd" of a moment, in Casablanca time. */
export function dayKey(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const [dd, mm, yyyy] = dateParts.format(d).split("/");
  return `${yyyy}-${mm}-${dd}`;
}

/** Whole days between two "yyyy-mm-dd" keys (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Matricule as typed → stored display form: uppercase, single spaces. */
export function normalizePlateInput(input: string): string {
  return input.toUpperCase().replace(/\s+/g, " ").trimStart();
}

/** Same rule as vehicles.plate_norm in the database (for search). */
export function plateNorm(input: string): string {
  return input.toUpperCase().replace(/[\s\-./|]/g, "");
}
