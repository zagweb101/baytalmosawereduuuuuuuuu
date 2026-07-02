import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md";
};

export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  className,
  size = "md",
}: ProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>التقدم</span>
          <span>{percent}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-border overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="التقدم"
      >
        <div
          className="h-full brand-gradient rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
