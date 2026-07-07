import { cn } from "@/lib/utils";

// Isotipo Lamelas: edificio isométrico verde (aproximación SVG del logo).
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-8 text-primary", className)}
      fill="currentColor"
      aria-label="Lamelas & Chaumont"
    >
      <path d="M50 92 8 71l14-7 28 14 28-14 14 7L50 92zm0-6.5L86 71 50 53 14 71l36 14.5z" />
      <rect x="30" y="36" width="6" height="34" />
      <rect x="40" y="28" width="6" height="40" />
      <rect x="48" y="20" width="7" height="52" />
      <rect x="59" y="28" width="6" height="40" />
      <rect x="69" y="36" width="6" height="34" />
    </svg>
  );
}
