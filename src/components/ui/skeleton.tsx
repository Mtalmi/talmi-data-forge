import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn(
          "rounded-md relative overflow-hidden bg-muted/60",
          "after:absolute after:inset-0 after:translate-x-[-100%]",
          "after:bg-gradient-to-r after:from-transparent after:via-primary/[0.04] after:to-transparent",
          "after:animate-[shimmer_2.5s_ease-in-out_infinite]",
          className
        )} 
        {...props} 
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
