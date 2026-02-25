import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[10px] px-3.5 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
          "placeholder:text-slate-400/40",
          "[border:1px_solid_rgba(255,255,255,0.08)] [background:rgba(255,255,255,0.03)]",
          "hover:[border-color:rgba(255,255,255,0.12)]",
          "focus-visible:outline-none focus-visible:[border-color:rgba(253,185,19,0.3)] focus-visible:[box-shadow:0_0_0_3px_rgba(253,185,19,0.06)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
