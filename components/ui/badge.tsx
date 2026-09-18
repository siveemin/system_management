import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#6b8a4e] text-white shadow-xs",
        secondary:
          "bg-[#EBECEF] dark:bg-slate-800 text-slate-800 dark:text-slate-200",
        dark:
          "bg-[#18181B] text-white dark:bg-white dark:text-[#18181B]",
        destructive:
          "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400",
        success:
          "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
        warning:
          "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400",
        info:
          "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
        orange:
          "bg-[#6b8a4e]/15 text-[#6b8a4e] font-bold",
        outline: "text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({ status }: { status: string }) {
  switch (status.toUpperCase()) {
    case "ACTIVE":    return <Badge variant="success">{t("status_active")}</Badge>;
    case "RECEIVED":  return <Badge variant="success">{t("status_received")}</Badge>;
    case "COMPLETED": return <Badge variant="success">{t("status_completed")}</Badge>;
    case "RESOLVED":  return <Badge variant="success">{t("status_resolved")}</Badge>;
    case "DRAFT":     return <Badge variant="secondary">{t("status_draft")}</Badge>;
    case "NEW":       return <Badge variant="secondary">{t("status_new")}</Badge>;
    case "SUBMITTED":        return <Badge variant="dark">{t("status_submitted")}</Badge>;
    case "PENDING_APPROVAL": return <Badge variant="dark">{t("status_pending_approval")}</Badge>;
    case "CONFIRMED":        return <Badge variant="dark">{t("status_confirmed")}</Badge>;
    case "PROCESSING":       return <Badge variant="dark">{t("status_processing")}</Badge>;
    case "IN_TRANSIT":          return <Badge variant="orange">{t("status_in_transit")}</Badge>;
    case "PARTIALLY_RECEIVED":  return <Badge variant="orange">{t("status_partially_received")}</Badge>;
    case "LOW_STOCK":  return <Badge variant="warning">{t("status_low_stock")}</Badge>;
    case "OUT_OF_STOCK": return <Badge variant="destructive">{t("status_out_of_stock")}</Badge>;
    case "INACTIVE":   return <Badge variant="destructive">{t("status_inactive")}</Badge>;
    case "CANCELLED":  return <Badge variant="destructive">{t("status_cancelled")}</Badge>;
    default:           return <Badge variant="outline">{status}</Badge>;
  }
}

export { Badge, badgeVariants };
