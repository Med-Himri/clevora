import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Keeps numbers, amounts, dates, phones, plates and emails in left-to-right
 * order inside Arabic (RTL) text: "1 250 MAD" never becomes "MAD 250 1".
 */
export function Ltr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={cn("whitespace-nowrap tabular-nums", className)}>
      {children}
    </bdi>
  );
}
