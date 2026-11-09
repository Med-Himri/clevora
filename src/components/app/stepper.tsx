import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** "Étape 2 sur 4 · Client" + progress bars. Clickable steps go back. */
export function Stepper({
  steps,
  current,
  counterLabel,
  onStepClick,
}: {
  steps: string[];
  current: number;
  counterLabel: string;
  onStepClick?: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
        {counterLabel} · {steps[current]}
      </p>
      <ol className="flex gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex-1">
            <button
              type="button"
              disabled={!onStepClick || i >= current}
              onClick={() => onStepClick?.(i)}
              aria-label={s}
              aria-current={i === current ? "step" : undefined}
              className="block h-4 w-full py-1.5 disabled:cursor-default"
            >
              <span className={cn("block h-1.5 rounded-full", i <= current ? "bg-primary dark:bg-ring" : "bg-border")} />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Action buttons: fixed at the bottom on phones (above the safe area), inline from 640 px. */
export function StickyActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
        className,
      )}
    >
      <div className="mx-auto flex max-w-3xl gap-2 sm:justify-end">{children}</div>
    </div>
  );
}
