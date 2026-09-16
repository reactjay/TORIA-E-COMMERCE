import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  to = "/",
}: {
  className?: string;
  to?: "/";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "font-display text-[1.65rem] italic leading-none tracking-tight text-espresso",
        className,
      )}
    >
      Élite
    </Link>
  );
}
