import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizes = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({
  size = "md",
  className,
  label = "جاري التحميل...",
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn("gradient-spinner", sizes[size])}
        role="status"
        aria-label={label}
      />
      {size !== "sm" && (
        <p className="text-sm text-muted">{label}</p>
      )}
    </div>
  );
}
