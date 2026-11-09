import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
} as const;

/** A number with a label (and an optional link to where it comes from). */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  href,
  testId,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof TONES;
  hint?: ReactNode;
  href?: string;
  testId?: string;
}) {
  const body = (
    <Card className={cn("h-full", href && "transition-colors hover:bg-accent")}>
      <CardContent className="flex flex-col gap-1 pt-4 sm:pt-5">
        {Icon ? <Icon className={cn("size-5", TONES[tone])} aria-hidden /> : null}
        <span className="text-2xl font-bold tabular-nums sm:text-3xl" data-testid={testId}>
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-xl">
      {body}
    </Link>
  ) : (
    body
  );
}
