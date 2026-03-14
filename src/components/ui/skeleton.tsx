import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn("rounded-md relative overflow-hidden", className)} 
        style={{
          background: 'linear-gradient(90deg, rgba(212,168,67,0.03) 0%, rgba(212,168,67,0.08) 50%, rgba(212,168,67,0.03) 100%)',
          backgroundSize: '200% 100%',
          animation: 'tbosShimmer 1.5s ease-in-out infinite',
          ...style,
        }}
        {...props} 
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
