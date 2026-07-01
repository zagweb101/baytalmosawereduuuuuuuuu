import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "outline";

const variants: Record<BadgeVariant, string> = {
  default: "bg-brand-purple/10 text-brand-purple",
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  outline: "border border-border text-muted",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
