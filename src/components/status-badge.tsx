import { STATUS_LABELS, type OrderStatus, isOrderStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

const STYLES: Record<OrderStatus, string> = {
  pending: "bg-beige/40 text-espresso",
  payment_submitted: "bg-beige text-espresso",
  under_verification: "bg-espresso text-cream",
  confirmed: "bg-success/20 text-success",
  processing: "bg-[#cfc6b8] text-espresso",
  completed: "bg-success text-cream",
  cancelled: "bg-danger/15 text-danger",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key: OrderStatus = isOrderStatus(status) ? status : "pending";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
        STYLES[key],
        className,
      )}
    >
      {STATUS_LABELS[key]}
    </span>
  );
}
