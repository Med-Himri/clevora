import {
  BarChart3Icon,
  CalendarCheckIcon,
  CalendarRangeIcon,
  CarIcon,
  DropletIcon,
  FileSignatureIcon,
  HomeIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/auth/session";

export type NavKey =
  | "dashboard"
  | "reservations"
  | "contracts"
  | "planning"
  | "fleet"
  | "insurance"
  | "oil"
  | "charges"
  | "statistics"
  | "assistant"
  | "team"
  | "settings";

export type NavItem = {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  /** Roles that may see the item (default: everyone). */
  roles?: Role[];
};

/** Order of the sidebar (CLAUDE.md / app-shell prompt). */
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: HomeIcon },
  { key: "reservations", href: "/reservations", icon: CalendarCheckIcon },
  { key: "contracts", href: "/contracts", icon: FileSignatureIcon },
  { key: "planning", href: "/planning", icon: CalendarRangeIcon },
  { key: "fleet", href: "/fleet", icon: CarIcon },
  { key: "insurance", href: "/insurance", icon: ShieldCheckIcon },
  { key: "oil", href: "/oil", icon: DropletIcon },
  { key: "charges", href: "/charges", icon: WalletIcon, roles: ["admin"] },
  { key: "statistics", href: "/statistics", icon: BarChart3Icon, roles: ["admin"] },
  { key: "assistant", href: "/assistant", icon: SparklesIcon },
  { key: "team", href: "/team", icon: UsersIcon, roles: ["admin"] },
  { key: "settings", href: "/settings", icon: SettingsIcon },
];

/** Phone bottom bar: 4 items + the big "+" in the middle; the rest is in "Plus". */
export const BOTTOM_KEYS: NavKey[] = ["dashboard", "reservations", "fleet"];
export const NEW_RESERVATION_HREF = "/reservations/new";

/** Sidebar sections, in order. */
export const NAV_SECTIONS: Array<{ key: "activity" | "fleet" | "management" | "agency"; items: NavKey[] }> = [
  { key: "activity", items: ["dashboard", "reservations", "contracts", "planning"] },
  { key: "fleet", items: ["fleet", "insurance", "oil"] },
  { key: "management", items: ["charges", "statistics", "assistant"] },
  { key: "agency", items: ["team", "settings"] },
];

export function navItemsFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Urgent counts shown as badges next to nav items. */
export type NavBadges = Partial<Record<NavKey, { count: number; tone: "danger" | "warning" }>>;
