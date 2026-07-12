import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ScrollIndicatorProps = {
  label?: string;
  className?: string;
};

/**
 * Decorative dive cue, reused across chapters. Callers own visibility (the
 * hero's entrance reveals it via [data-hero="scroll-indicator"]; the film
 * overlay animates a wrapper) — pass `className="opacity-0"` when a timeline
 * will fade it in.
 */
export function ScrollIndicator({ label = "Scroll to Dive", className }: ScrollIndicatorProps) {
  return (
    <div
      data-hero="scroll-indicator"
      aria-hidden="true"
      className={cn("flex flex-col items-center gap-2.5", className)}
    >
      <span className="flex h-[34px] w-[22px] items-start justify-center rounded-full border border-white/30 pt-1.5">
        <span className="animate-mouse-wheel h-[7px] w-[3px] rounded-full bg-glow" />
      </span>
      <ChevronDown className="animate-dive-hint size-3.5 text-glow/80" strokeWidth={1.5} />
      <span className="-mr-[0.35em] text-[10px] font-medium uppercase tracking-[0.35em] text-mist/90">
        {label}
      </span>
    </div>
  );
}
