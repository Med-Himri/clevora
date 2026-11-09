import { cn } from "@/lib/utils";

/** Placeholder Parcolia logo (mark + wordmark) until the final logo is designed. */
export function ParcoliaLogo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[#1E2A4A] dark:text-white", className)} dir="ltr">
      <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden>
        <rect width="40" height="40" rx="10" fill="#1E2A4A" />
        <path
          d="M14 30V10h7.5a6.5 6.5 0 0 1 0 13H14"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="28.5" cy="29" r="2.6" fill="#F59E0B" />
      </svg>
      {showWordmark ? <span className="text-2xl font-extrabold tracking-tight">Parcolia</span> : null}
    </span>
  );
}
