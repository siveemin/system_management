import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-[#6b8a4e] text-white shadow-sm hover:bg-[#5a7840] focus-visible:ring-[#6b8a4e]",
        dark:
          "bg-[#1e2e14] text-white shadow-sm hover:bg-[#2d4020] focus-visible:ring-[#1e2e14]",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500",
        outline:
          "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100",
        secondary:
          "bg-[#EBECEF] dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs hover:bg-slate-200 dark:hover:bg-slate-700",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200",
        link: "text-[#6b8a4e] underline-offset-4 hover:underline p-0 h-auto",
        success:
          "bg-emerald-600 text-white shadow hover:bg-emerald-700 focus-visible:ring-emerald-500",
        pillActive:
          "bg-[#6b8a4e] text-white rounded-full px-4 shadow-sm",
        pillInactive:
          "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-full px-4",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-2xl px-6 text-sm font-semibold",
        icon: "h-9 w-9 p-0 rounded-xl",
        pill: "h-8 px-4 text-xs font-semibold rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
