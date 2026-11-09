import { cn } from "@/lib/utils";

/** Placeholder Clévora logo (mark + wordmark) until the final logo is designed. */
export function ClevoraLogo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[#1E2A4A] dark:text-white", className)} dir="ltr">
      <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden>
        <rect width="40" height="40" rx="10" fill="#1E2A4A" />
        <path
          d="M27.5 13.2A9.5 9.5 0 1 0 27.5 26.8"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="29" cy="20" r="2.6" fill="#F59E0B" />
      </svg>
      {showWordmark ? <span className="text-2xl font-extrabold tracking-tight">Clévora</span> : null}
    </span>
  );
}
